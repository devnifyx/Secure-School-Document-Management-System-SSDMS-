<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Document::with(['uploadedBy', 'panitia']);

        if ($user->role === 'Teacher') {
            $panitiaId = $request->input('active_panitia_id');
            $query->where('panitia_id', $panitiaId);
        } elseif ($request->has('panitia_id')) {
            $query->where('panitia_id', $request->panitia_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('search') && $request->search !== '') {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('tag') && $request->tag !== '') {
            $query->where('tags', 'like', '%"' . $request->tag . '"%');
        }

        if ($request->has('date_from') && $request->date_from !== '') {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to !== '') {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $documents = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($documents);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'file' => 'required|file|max:10240',
            'category' => 'required|string|max:100',
            'tags' => 'nullable|array',
            'panitia_id' => 'required|exists:panitia,id',
        ]);

        $user = $request->user();

        if ($user->role === 'Teacher') {
            $panitiaId = $request->input('active_panitia_id');
            if ((int) $request->panitia_id !== $panitiaId) {
                abort(403, 'You can only upload documents to your active Panitia.');
            }
        }

        $key = random_bytes(32);
        $encryptedKey = base64_encode($key);

        $file = $request->file('file');
        $fileContent = $file->get();
        $fileHash = hash('sha256', $fileContent);

        $iv = random_bytes(openssl_cipher_iv_length('aes-256-cbc'));
        $encryptedContent = openssl_encrypt($fileContent, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
        $fileToStore = $iv . $encryptedContent;

        $fileName = $file->hashName();
        Storage::disk('local')->put('documents/' . $fileName, $fileToStore);

        $document = Document::create([
            'title'         => $request->title,
            'description'   => $request->description,
            'file_path'     => 'documents/' . $fileName,
            'file_name'     => $file->getClientOriginalName(),
            'file_type'     => $file->getMimeType(),
            'file_size'     => $file->getSize(),
            'category'      => $request->category,
            'tags'          => $request->tags,
            'uploaded_by'   => $user->id,
            'panitia_id'    => $request->panitia_id,
            'status'        => 'Pending',
            'encrypted_key' => $encryptedKey,
            'file_hash'     => $fileHash,
        ]);

        logAudit('DOCUMENT_UPLOADED', 'Document', $document->id, "Document uploaded: " . $document->title);

        $admins = \App\Models\User::where('role', 'Admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'message' => "New document pending approval: {$document->title}",
            ]);
        }

        return response()->json($document->load(['uploadedBy', 'panitia']), 201);
    }

    private function checkPanitiaAccess(Request $request, Document $document): void
    {
        $user = $request->user();
        if ($user->role === 'Teacher') {
            $panitiaId = $request->input('active_panitia_id');
            if ($document->panitia_id !== $panitiaId) {
                logAudit('UNAUTHORIZED_DOCUMENT_ACCESS', 'Document', $document->id,
                    'Cross-panitia access attempt');
                abort(403, 'You do not have access to this document.');
            }
        }
    }

    public function show(Request $request, $id)
    {
        $document = Document::with(['uploadedBy', 'panitia'])->findOrFail($id);
        $this->checkPanitiaAccess($request, $document);

        logAudit('DOCUMENT_VIEWED', 'Document', $document->id);

        return response()->json($document);
    }

    public function download(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::findOrFail($id);
        $this->checkPanitiaAccess($request, $document);

        if ($document->status !== 'Approved' && $user->role === 'Teacher') {
            abort(403, 'Document not approved yet');
        }

        $encryptedContent = Storage::disk('local')->get($document->file_path);
        $key = base64_decode($document->encrypted_key);
        $ivLength = openssl_cipher_iv_length('aes-256-cbc');
        $iv = substr($encryptedContent, 0, $ivLength);
        $encryptedData = substr($encryptedContent, $ivLength);
        $decryptedContent = openssl_decrypt($encryptedData, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        logAudit('DOCUMENT_DOWNLOADED', 'Document', $document->id);

        return response()->streamDownload(
            function () use ($decryptedContent) { echo $decryptedContent; },
            $document->file_name,
            ['Content-Type' => $document->file_type]
        );
    }

    public function preview(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::findOrFail($id);
        $this->checkPanitiaAccess($request, $document);

        if ($document->status !== 'Approved' && $user->role === 'Teacher') {
            abort(403, 'Document not approved yet');
        }

        $encryptedContent = Storage::disk('local')->get($document->file_path);
        $key = base64_decode($document->encrypted_key);
        $ivLength = openssl_cipher_iv_length('aes-256-cbc');
        $iv = substr($encryptedContent, 0, $ivLength);
        $encryptedData = substr($encryptedContent, $ivLength);
        $decryptedContent = openssl_decrypt($encryptedData, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        logAudit('DOCUMENT_PREVIEWED', 'Document', $document->id);

        return response()->streamDownload(
            function () use ($decryptedContent) { echo $decryptedContent; },
            $document->file_name,
            ['Content-Type' => $document->file_type],
            'inline'
        );
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::findOrFail($id);
        $this->checkPanitiaAccess($request, $document);

        if ($user->role === 'Teacher') {
            if ($document->uploaded_by !== $user->id) {
                abort(403, 'Unauthorized');
            }
            if ($document->status !== 'Rejected') {
                abort(403, 'Can only update rejected documents');
            }
        }

        $request->validate([
            'title'       => 'string|max:255',
            'description' => 'nullable|string|max:2000',
            'category'    => 'string|max:100',
            'tags'        => 'nullable|array',
            'file'        => 'nullable|file|max:10240',
        ]);

        $document->update($request->only(['title', 'description', 'category', 'tags']));

        if ($request->hasFile('file')) {
            Storage::disk('local')->delete($document->file_path);

            $key       = random_bytes(32);
            $file      = $request->file('file');
            $plaintext = $file->get();
            $iv        = random_bytes(openssl_cipher_iv_length('aes-256-cbc'));
            $encrypted = openssl_encrypt($plaintext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
            $fileName  = $file->hashName();
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

        if ($user->role === 'Teacher') {
            $document->update(['status' => 'Pending', 'rejection_reason' => null]);

            $admins = \App\Models\User::where('role', 'Admin')->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'message' => "Document resubmitted for approval: {$document->title}",
                ]);
            }
        }

        logAudit('DOCUMENT_UPDATED', 'Document', $document->id);

        return response()->json($document->load(['uploadedBy', 'panitia']));
    }

    public function approve(Request $request, $id)
    {
        $admin = $request->user();
        $document = Document::findOrFail($id);

        $document->update([
            'status' => 'Approved',
            'rejection_reason' => null,
        ]);

        logAudit('DOCUMENT_APPROVED', 'Document', $document->id, "Approved by: {$admin->name}");

        Notification::create([
            'user_id' => $document->uploaded_by,
            'message' => "Your document '{$document->title}' has been approved!",
        ]);

        return response()->json($document->load(['uploadedBy', 'panitia']));
    }

    public function reject(Request $request, $id)
    {
        $admin = $request->user();
        $request->validate(['reason' => 'required|string']);
        $document = Document::findOrFail($id);

        $document->update([
            'status' => 'Rejected',
            'rejection_reason' => $request->reason,
        ]);

        logAudit('DOCUMENT_REJECTED', 'Document', $document->id, "Rejected by: {$admin->name}, Reason: {$request->reason}");

        Notification::create([
            'user_id' => $document->uploaded_by,
            'message' => "Your document '{$document->title}' has been rejected. Reason: {$request->reason}",
        ]);

        return response()->json($document->load(['uploadedBy', 'panitia']));
    }

    public function verify($id)
    {
        $document = Document::findOrFail($id);

        if (empty($document->file_hash)) {
            return response()->json([
                'status'  => 'no_hash',
                'message' => 'No integrity record found. This document was uploaded before the integrity check feature was enabled.',
            ]);
        }

        if (!Storage::disk('local')->exists($document->file_path)) {
            logAudit('DOCUMENT_VERIFY_FAILED', 'Document', $document->id, 'File missing from storage');
            return response()->json([
                'status'  => 'missing',
                'message' => 'Encrypted file is missing from storage.',
            ]);
        }

        $encryptedContent = Storage::disk('local')->get($document->file_path);
        $key              = base64_decode($document->encrypted_key);
        $ivLength         = openssl_cipher_iv_length('aes-256-cbc');
        $iv               = substr($encryptedContent, 0, $ivLength);
        $encryptedData    = substr($encryptedContent, $ivLength);
        $decrypted        = openssl_decrypt($encryptedData, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);

        if ($decrypted === false) {
            logAudit('DOCUMENT_VERIFY_FAILED', 'Document', $document->id, 'Decryption failed');
            return response()->json([
                'status'  => 'corrupted',
                'message' => 'Decryption failed. The encrypted file appears to be corrupted.',
            ]);
        }

        $currentHash = hash('sha256', $decrypted);
        $intact      = hash_equals($document->file_hash, $currentHash);

        logAudit(
            $intact ? 'DOCUMENT_VERIFY_PASSED' : 'DOCUMENT_VERIFY_FAILED',
            'Document', $document->id,
            $intact ? 'Integrity check passed' : "Hash mismatch — stored: {$document->file_hash}, current: {$currentHash}"
        );

        return response()->json([
            'status'       => $intact ? 'intact' : 'tampered',
            'message'      => $intact
                ? 'File integrity verified. The document has not been modified since upload.'
                : 'WARNING: File hash mismatch! The document may have been tampered with.',
            'stored_hash'  => $document->file_hash,
            'current_hash' => $currentHash,
            'checked_at'   => now()->toISOString(),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $document = Document::findOrFail($id);
        $this->checkPanitiaAccess($request, $document);

        if ($user->role === 'Teacher' && $document->uploaded_by !== $user->id) {
            abort(403, 'Unauthorized');
        }

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        logAudit('DOCUMENT_DELETED', 'Document', $document->id);

        return response()->json(null, 204);
    }
}
