<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Document::with('uploadedBy');

        if ($user->role === 'Teacher') {
            $query->where('uploaded_by', $user->id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $documents = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($documents);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'file' => 'required|file|max:10240', // 10MB
            'category' => 'required|string|max:100',
            'tags' => 'nullable|array',
        ]);

        $user = $request->user();

        // Generate encryption key
        $key = random_bytes(32); // AES-256 key
        $encryptedKey = base64_encode($key);

        // Upload and encrypt file
        $file = $request->file('file');
        $fileContent = $file->get();

        // Hash the original plaintext for future integrity checks
        $fileHash = hash('sha256', $fileContent);

        // Encrypt the file content
        $iv = random_bytes(openssl_cipher_iv_length('aes-256-cbc'));
        $encryptedContent = openssl_encrypt($fileContent, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
        $fileToStore = $iv . $encryptedContent;

        // Store encrypted file
        $fileName = $file->hashName();
        Storage::disk('local')->put('documents/' . $fileName, $fileToStore);

        // Create document record
        $document = Document::create([
            'title'         => $request->title,
            'file_path'     => 'documents/' . $fileName,
            'file_name'     => $file->getClientOriginalName(),
            'file_type'     => $file->getMimeType(),
            'file_size'     => $file->getSize(),
            'category'      => $request->category,
            'tags'          => $request->tags,
            'uploaded_by'   => $user->id,
            'status'        => 'Pending',
            'encrypted_key' => $encryptedKey,
            'file_hash'     => $fileHash,
        ]);

        logAudit('DOCUMENT_UPLOADED', 'Document', $document->id, "Document uploaded: " . $document->title);

        // Notify admins
        $admins = \App\Models\User::where('role', 'Admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'message' => "New document pending approval: {$document->title}",
            ]);
        }

        return response()->json($document->load('uploadedBy'), 201);
    }

    public function show($id)
    {
        $user = request()->user();
        $document = Document::with('uploadedBy')->findOrFail($id);

        if ($user->role === 'Teacher' && $document->uploaded_by !== $user->id) {
            abort(403, 'Unauthorized');
        }

        logAudit('DOCUMENT_VIEWED', 'Document', $document->id);

        return response()->json($document);
    }

    public function download($id)
    {
        $user = request()->user();
        $document = Document::findOrFail($id);

        if ($user->role === 'Teacher' && $document->uploaded_by !== $user->id) {
            abort(403, 'Unauthorized');
        }

        if ($document->status !== 'Approved' && $user->role === 'Teacher') {
            abort(403, 'Document not approved yet');
        }

        // Decrypt the file
        $encryptedContent = Storage::disk('local')->get($document->file_path);
        $key = base64_decode($document->encrypted_key);
        $ivLength = openssl_cipher_iv_length('aes-256-cbc');
        $iv = substr($encryptedContent, 0, $ivLength);
        $encryptedData = substr($encryptedContent, $ivLength);
        $decryptedContent = openssl_decrypt($encryptedData, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        logAudit('DOCUMENT_DOWNLOADED', 'Document', $document->id);

        return response()->streamDownload(
            function () use ($decryptedContent) {
                echo $decryptedContent;
            },
            $document->file_name,
            [
                'Content-Type' => $document->file_type,
            ]
        );
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::findOrFail($id);

        if ($user->role === 'Teacher') {
            if ($document->uploaded_by !== $user->id) {
                abort(403, 'Unauthorized');
            }
            if ($document->status !== 'Rejected') {
                abort(403, 'Can only update rejected documents');
            }
        }

        $request->validate([
            'title'    => 'string|max:255',
            'category' => 'string|max:100',
            'tags'     => 'nullable|array',
            'file'     => 'nullable|file|max:10240',
        ]);

        $document->update($request->only(['title', 'category', 'tags']));

        // Handle new file upload (replace encrypted file)
        if ($request->hasFile('file')) {
            Storage::disk('local')->delete($document->file_path);

            $key        = random_bytes(32);
            $file       = $request->file('file');
            $plaintext  = $file->get();
            $iv         = random_bytes(openssl_cipher_iv_length('aes-256-cbc'));
            $encrypted  = openssl_encrypt($plaintext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
            $fileName   = $file->hashName();
            Storage::disk('local')->put('documents/' . $fileName, $iv . $encrypted);

            $document->update([
                'file_path'     => 'documents/' . $fileName,
                'file_name'     => $file->getClientOriginalName(),
                'file_type'     => $file->getMimeType(),
                'file_size'     => $file->getSize(),
                'encrypted_key' => base64_encode($key),
                'file_hash'     => hash('sha256', $plaintext),
            ]);
        }

        // If teacher is updating, reset status to pending
        if ($user->role === 'Teacher') {
            $document->update(['status' => 'Pending', 'rejection_reason' => null]);

            // Notify admins
            $admins = \App\Models\User::where('role', 'Admin')->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'message' => "Document resubmitted for approval: {$document->title}",
                ]);
            }
        }

        logAudit('DOCUMENT_UPDATED', 'Document', $document->id);

        return response()->json($document->load('uploadedBy'));
    }

    public function approve($id)
    {
        $admin = request()->user();
        $document = Document::findOrFail($id);

        $document->update([
            'status' => 'Approved',
            'rejection_reason' => null,
        ]);

        logAudit('DOCUMENT_APPROVED', 'Document', $document->id, "Approved by: {$admin->name}");

        // Notify teacher
        Notification::create([
            'user_id' => $document->uploaded_by,
            'message' => "Your document '{$document->title}' has been approved!",
        ]);

        return response()->json($document->load('uploadedBy'));
    }

    public function reject(Request $request, $id)
    {
        $admin = $request->user();
        $request->validate([
            'reason' => 'required|string',
        ]);
        $document = Document::findOrFail($id);

        $document->update([
            'status' => 'Rejected',
            'rejection_reason' => $request->reason,
        ]);

        logAudit('DOCUMENT_REJECTED', 'Document', $document->id, "Rejected by: {$admin->name}, Reason: {$request->reason}");

        // Notify teacher
        Notification::create([
            'user_id' => $document->uploaded_by,
            'message' => "Your document '{$document->title}' has been rejected. Reason: {$request->reason}",
        ]);

        return response()->json($document->load('uploadedBy'));
    }

    public function verify($id)
    {
        $document = Document::findOrFail($id);

        // Document uploaded before integrity feature existed
        if (empty($document->file_hash)) {
            return response()->json([
                'status'  => 'no_hash',
                'message' => 'No integrity record found. This document was uploaded before the integrity check feature was enabled.',
            ]);
        }

        // Check the encrypted file actually exists on disk
        if (!Storage::disk('local')->exists($document->file_path)) {
            logAudit('DOCUMENT_VERIFY_FAILED', 'Document', $document->id, 'File missing from storage');
            return response()->json([
                'status'  => 'missing',
                'message' => 'Encrypted file is missing from storage. The document may have been deleted externally.',
            ]);
        }

        // Decrypt the stored file
        $encryptedContent = Storage::disk('local')->get($document->file_path);
        $key              = base64_decode($document->encrypted_key);
        $ivLength         = openssl_cipher_iv_length('aes-256-cbc');
        $iv               = substr($encryptedContent, 0, $ivLength);
        $encryptedData    = substr($encryptedContent, $ivLength);
        $decrypted        = openssl_decrypt($encryptedData, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        if ($decrypted === false) {
            logAudit('DOCUMENT_VERIFY_FAILED', 'Document', $document->id, 'Decryption failed — file may be corrupted');
            return response()->json([
                'status'  => 'corrupted',
                'message' => 'Decryption failed. The encrypted file appears to be corrupted.',
            ]);
        }

        // Compare SHA-256 hashes
        $currentHash = hash('sha256', $decrypted);
        $intact      = hash_equals($document->file_hash, $currentHash);

        $status = $intact ? 'intact' : 'tampered';
        logAudit(
            $intact ? 'DOCUMENT_VERIFY_PASSED' : 'DOCUMENT_VERIFY_FAILED',
            'Document',
            $document->id,
            $intact
                ? 'Integrity check passed — file hash matches'
                : "Integrity check FAILED — stored hash: {$document->file_hash}, current hash: {$currentHash}"
        );

        return response()->json([
            'status'       => $status,
            'message'      => $intact
                ? 'File integrity verified. The document has not been modified since upload.'
                : 'WARNING: File hash mismatch! The document may have been tampered with or corrupted.',
            'stored_hash'  => $document->file_hash,
            'current_hash' => $currentHash,
            'checked_at'   => now()->toISOString(),
        ]);
    }

    public function destroy($id)
    {
        $user = request()->user();
        $document = Document::findOrFail($id);

        if ($user->role === 'Teacher' && $document->uploaded_by !== $user->id) {
            abort(403, 'Unauthorized');
        }

        // Delete file
        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        logAudit('DOCUMENT_DELETED', 'Document', $document->id);

        return response()->json(null, 204);
    }
}
