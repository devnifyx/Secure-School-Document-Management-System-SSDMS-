# CHAPTER 5: FINDINGS

## 5.1 Introduction

This chapter presents the comprehensive findings, empirical data, and evaluation results obtained from the rigorous testing phase of the **Secure School Document Management System (SSDMS)**. In software engineering and the Software Development Life Cycle (SDLC), testing represents a critical phase that validates whether the developed system operates correctly, satisfies all functional and non-functional requirements, and addresses the real-world operational challenges identified in the initial problem statement.

For SSDMS, which is specifically designed and tailored for the academic and administrative environment of **Sekolah Menengah Kebangsaan (SMK) Kubor Panjang**, testing is of paramount importance. The system is entrusted with handling highly sensitive educational records, including examination papers, student evaluation dossiers, departmental minutes, and weekly teacher curriculum reports. Consequently, the evaluation framework was established to verify not only functional compliance but also cryptographic robustness, access control enforcement, and day-to-day usability for school staff.

The testing process was organized systematically into three principal categories:
1. **Non-Functional Testing:** Evaluates essential quality attributes of the system prior to operational deployment, encompassing Performance Testing, Security Testing, Usability Testing, and Reliability Testing.
2. **Functional Testing:** Evaluates the functional correctness and business logic across three hierarchical tiers:
   - *Unit Testing:* Verification of individual backend methods, cryptographic algorithms, and model relationships in isolation.
   - *Integration Testing:* Verification of cross-module data exchange, authentication pipelines, notification dispatch, and automated workflows.
   - *System Testing:* Comprehensive end-to-end evaluation of full user journeys across both Teacher and Administrator roles.
3. **Acceptance Testing:** Evaluates stakeholder satisfaction and operational readiness through two distinct evaluations:
   - *Client Acceptance Testing (CAT):* A structured, in-depth evaluation interview conducted with the school client representative and project supervisor, assessing institutional alignment and administrative governance.
   - *User Acceptance Testing (UAT):* A quantitative, multi-criteria survey administered to 42 teaching staff members across diverse academic departments (*Panitia*) at SMK Kubor Panjang following hands-on interaction with the system.

The detailed procedures, test cases, execution metrics, observations, and analytical interpretations are systematically documented in the subsequent sections of this chapter.

---

## 5.2 Testing

The testing methodology for SSDMS was designed to ensure comprehensive coverage across both frontend client interactions and backend API services. SSDMS is developed on a modern decoupled architecture comprising a **Laravel 12 (PHP 8.2+) RESTful API** backend, a **React 18 with TypeScript and Vite** Single Page Application (SPA) frontend, and a **MySQL** relational database. Security mechanisms incorporate **OpenSSL-powered AES-256-CBC envelope encryption** at rest, **SHA-256 cryptographic integrity hashing**, **Role-Based Access Control (RBAC)**, and **Department-Based Access Control (DBAC / Panitia scoping)**.

The system serves two distinct user roles with differentiated privileges and workflows:
* **Administrator (School Leadership / System Admin):** Responsible for global system oversight, user registration review and account approval, subject department (*Panitia*) management, document review and approval/rejection, cryptographic file integrity verification, weekly report timeliness tracking, and auditing system logs.
* **Teacher (Educators / Departmental Staff):** Responsible for self-registration, departmental session selection, uploading encrypted academic documents scoped to their active *Panitia*, resubmitting rejected materials based on administrative feedback, and submitting structured weekly activity reports with encrypted attachments.

Testing was conducted across two designated environments to guarantee both development accuracy and production readiness:
1. **Local Testbed Environment:** Configured with PHP 8.2.12, Laravel 12 API server running on port 8000, MySQL 8.0 database engine (XAMPP environment), Node.js v18.20, and Vite development server on port 5174 running under Windows 11 Enterprise (64-bit).
2. **Staging / Production Environment:** Cloud-deployed architecture with the frontend SPA deployed on Vercel with HTTPS edge SSL, communicating securely with a persistent cloud-hosted Laravel API and managed MySQL database instance.

Table 5.1 provides an overview of the testing categories, types, scopes, and execution methods utilized throughout the evaluation phase.

### Table 5.1: Testing Overview

| Testing Category | Testing Type | Scope | Method |
| :--- | :--- | :--- | :--- |
| **Non-Functional Testing** | Performance Testing | Page rendering latency, cryptographic encryption/decryption overhead, file streaming throughput, and query responsiveness | Automated browser profiling + Network timing tools |
| **Non-Functional Testing** | Security Testing | Sanctum token authentication, RBAC authorization, DBAC Panitia boundary isolation, AES-256 ciphertext security, SHA-256 tamper detection, and brute-force lockout | Manual boundary probing + Security code inspection + Direct URL tampering |
| **Non-Functional Testing** | Usability Testing | Responsive design adaptability across Desktop, Tablet, and Mobile viewport breakpoints; theme accessibility (Light/Dark mode) | Multi-device manual testing + Chrome DevTools responsive emulation |
| **Non-Functional Testing** | Reliability Testing | Session state persistence, token renewal, cryptographic idempotency, failure rollback, and immutable audit persistence | State manipulation + Browser lifecycle simulation + Session interruption |
| **Functional Testing** | Unit Testing | Individual controller methods, cryptographic helper services, middleware handlers, and Eloquent model relationships | PHPUnit automated test suite + Manual isolation execution |
| **Functional Testing** | Integration Testing | Inter-module pipelines (Registration $\rightarrow$ Approval $\rightarrow$ Auth; Upload $\rightarrow$ Encryption $\rightarrow$ Review $\rightarrow$ Notification) | Postman API test collection + Frontend integration flows |
| **Functional Testing** | System Testing | End-to-end execution of complete user stories for both Administrator and Teacher roles | Full manual scenario execution from user perspective |
| **Acceptance Testing** | Client Acceptance Testing (CAT) | High-level administrative alignment, security policy compliance, and departmental governance evaluation | Structured interview with School Administrator / Supervisor |
| **Acceptance Testing** | User Acceptance Testing (UAT) | Practical usability, perceived security, workflow clarity, and user satisfaction among educators | 4-point Likert scale questionnaire administered to 42 teachers |

---

## 5.3 Non-Functional Testing

Non-Functional Testing evaluates the behavioral, operational, and structural quality attributes of SSDMS. Prior to validating specific functional workflows, it is essential to confirm that the application operates within acceptable latency thresholds, adheres to stringent security protocols, adapts gracefully to diverse client hardware, and maintains continuous data reliability.

### 5.3.1 Performance Testing

Performance testing evaluates whether SSDMS demonstrates acceptable responsiveness and stability under normal operational conditions at SMK Kubor Panjang. Because SSDMS executes cryptographic operations (AES-256 key generation, initialization vector composition, block cipher encryption, and SHA-256 integrity digest calculation) during file transactions, benchmark measurements were recorded to confirm that encryption overhead does not impede user workflow.

Testing was conducted using standard broadband connectivity (100 Mbps) measuring Document Object Model (DOM) completion and API round-trip times. The accepted benchmark threshold for standard web interactions is set at **$\le$ 3.0 seconds**, and **$\le$ 5.0 seconds** for heavy multipart encrypted file transmissions up to 10 MB.

### Table 5.2: Performance Testing

| Test ID | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-P01** | Load Teacher Dashboard displaying Panitia-scoped KPI cards, submission status, and recent document submissions | Dashboard loads completely within 3.0 seconds | Page and data loaded in approximately 1.2 to 1.6 seconds | **Pass** |
| **NFT-P02** | Load Admin Overview Dashboard featuring global aggregated counts, pending registrations, weekly report metrics, and recent audit trail entries | Page loads and renders aggregated metrics within 3.0 seconds | Aggregated metrics and charts loaded in approximately 1.8 to 2.3 seconds | **Pass** |
| **NFT-P03** | Upload an academic document (PDF, 8.5 MB) including metadata tagging, random key generation, AES-256-CBC encryption, SHA-256 hashing, and local disk storage | Full upload and encryption transaction completes within 5.0 seconds | Transaction completed and server confirmed storage in 2.9 seconds | **Pass** |
| **NFT-P04** | Request on-the-fly decryption and streaming download of an approved 8.5 MB document from the repository | Decryption and file streaming begins within 3.0 seconds | Stream download initiated in 1.4 seconds with intact binary payload | **Pass** |
| **NFT-P05** | Execute Admin cryptographic integrity verification (`verify`) on an existing encrypted document record | SHA-256 hash recalculated and compared against stored hash within 2.0 seconds | Verification returned cryptographic match status in 0.8 seconds | **Pass** |
| **NFT-P06** | Query Document Repository with compound filters (Category, Status, Tag, and Date Range) across 500+ records | Filtered paginated results (20 items/page) returned within 2.0 seconds | Query executed and results rendered in approximately 0.9 seconds | **Pass** |

---

### 5.3.2 Security Testing

Security testing represents the core pillar of SSDMS evaluation. Given the sensitivity of school assessments, teacher appraisals, and student records, security controls were tested rigorously against unauthorized access, boundary violations, data tampering, and brute-force attacks.

### Table 5.3: Security Testing

| Test ID | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-S01** | Verify that all API endpoints and web client routes are strictly served over HTTPS in production | Unencrypted HTTP requests are automatically redirected to HTTPS; SSL certificate valid | HTTP requests redirected with 301 to HTTPS; Transport Layer Security enforced | **Pass** |
| **NFT-S02** | Attempt to access protected API endpoints (`/api/documents`, `/api/profile`) without providing a Sanctum Bearer token | HTTP 401 Unauthorized returned; client redirected to login | HTTP 401 Unauthorized returned with `{"message": "Unauthenticated."}` | **Pass** |
| **NFT-S03** | Attempt to access Admin-restricted endpoints (`/api/users`, `/api/panitia`, `/api/audit-logs`) while authenticated as a Teacher | HTTP 403 Forbidden returned; access denied by `RoleMiddleware` | HTTP 403 Forbidden returned with `{"message": "Unauthorized. Admin role required."}` | **Pass** |
| **NFT-S04** | Attempt cross-departmental access: Teacher belonging to *Science* attempts to view or download a document belonging to *Mathematics* by manipulating URL parameters | Access denied; HTTP 403 Forbidden returned; unauthorized event logged in audit trail | HTTP 403 Forbidden returned; `UNAUTHORIZED_DOCUMENT_ACCESS` logged with user ID | **Pass** |
| **NFT-S05** | Test brute-force mitigation: Input invalid credentials 3 consecutive times on the login form | User account locked for 15 minutes; subsequent attempts rejected immediately | Account locked until timestamp +15m; error message alerts user; logged to audit | **Pass** |
| **NFT-S06** | Test tamper detection: Manually alter 1 byte within the encrypted ciphertext file stored on the local storage disk, then run Admin verification | Cryptographic verification fails; system alerts tampering or corruption; audit logged | Status returned: `corrupted` / `tampered`; `DOCUMENT_VERIFY_FAILED` logged | **Pass** |
| **NFT-S07** | Attempt to log in with a newly self-registered Teacher account whose status is still `Pending` admin approval | Login rejected; error informs user account is pending approval | Authentication denied; message: "Your account is pending administrator approval." | **Pass** |
| **NFT-S08** | Verify that sensitive user passwords and encryption keys are protected against plaintext exposure in database storage | Passwords hashed using bcrypt; encryption keys stored per-record without hardcoded global keys | All passwords stored as `$2y$...` bcrypt hashes; per-document keys base64-encoded | **Pass** |
| **NFT-S09** | Test SQL Injection and Cross-Site Scripting (XSS) resilience on document search and upload form inputs | Malicious SQL payloads and script tags sanitized; Eloquent uses parameterized queries | SQL injection characters escaped safely; React DOM escapes rendered strings | **Pass** |

---

### 5.3.3 Usability Testing

Usability testing evaluates the user interface (UI) and user experience (UX) across multiple form factors and screen resolutions. Because teachers and school administrators access documents from diverse hardware—including school desktop labs, laptops, iPads, and mobile smartphones—it is vital that the interface maintains visual harmony, clean typography, intuitive controls, and accessible contrast.

### Table 5.4: Usability Testing

| Test ID | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-U01** | View Admin and Teacher Dashboards on standard Desktop display (1920 $\times$ 1080) | Fluid grid layout; full sidebar navigation; summary metric cards aligned symmetrically | Layout renders cleanly; sidebar fixed; metrics cards and data tables formatted properly | **Pass** |
| **NFT-U02** | View and navigate system on a Mobile viewport (375 $\times$ 812, iPhone form factor) | Navigation collapses into a responsive hamburger slide drawer; tables scroll horizontally | Hamburger drawer toggles smoothly; table overflows scroll; action buttons easily tappable | **Pass** |
| **NFT-U03** | View and interact with Document Repository on Tablet viewport (768 $\times$ 1024, iPad portrait) | Two-column grid collapses to single column where necessary; filter bars remain accessible | Interface adapts gracefully without element collision or text clipping | **Pass** |
| **NFT-U04** | Open Document Details Modal containing file metadata, tags, preview pane, and action buttons | Modal centers on viewport with dark backdrop; scrollable on smaller screens; closes on ESC | Modal displays cleanly; action buttons visible; backdrop click or close icon dismisses modal | **Pass** |
| **NFT-U05** | Switch active *Panitia* using the topbar dropdown selector as a multi-department teacher | Dropdown lists assigned Panitia with checkmark on active; switching prompts instant refresh | Dropdown operates smoothly; selecting new department refreshes data scope immediately | **Pass** |
| **NFT-U06** | Toggle between Light Mode and Dark Mode across all system pages using the theme toggle | Theme switches instantly without page reload; color tokens update; high text contrast preserved | CSS variables adapt immediately; dark mode provides high contrast text and dark slate panels | **Pass** |

---

### 5.3.4 Reliability Testing

Reliability testing ensures that SSDMS maintains data integrity, session consistency, and continuous operational stability under interrupted workflows, page reloads, and token expirations.

### Table 5.5: Reliability Testing

| Test ID | Test Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-R01** | Perform hard browser reload (F5 / Ctrl+F5) while logged in on the Document Repository | Session and active *Panitia* state retained via `localStorage` and Sanctum token | Session retained seamlessly; user remains authenticated in active Panitia scope | **Pass** |
| **NFT-R02** | Test cryptographic idempotency: Decrypt, view, download, and verify the same document multiple times | File decrypted identically each time without data corruption or memory leaks | Decrypted payload identical across all repetitions; SHA-256 hash verified intact | **Pass** |
| **NFT-R03** | Simulate database transaction failure during document upload (abort database write after file encryption) | File storage and database record remain synchronized; no orphaned files created | Transaction rollbacks cleanly; incomplete uploads do not produce orphaned records | **Pass** |
| **NFT-R04** | Test session expiry handling: Expire authentication token manually or let 8-hour window elapse | API rejects subsequent requests with 401; frontend clears local cache and navigates to login | Interceptor catches 401; user redirected safely to `/login` with clear session cleared | **Pass** |
| **NFT-R05** | Confirm audit log immutability: Ensure no API endpoint or UI action allows editing or deleting audit log records | Audit records are append-only; no `UPDATE` or `DELETE` routes defined for audit tables | Audit log table has no delete/update endpoints; historical records remain immutable | **Pass** |

---

## 5.4 Functional Testing

Functional Testing verifies that all business logic, data validations, role authorization guards, and automated workflows in SSDMS execute in strict accordance with the functional specifications. Functional testing was conducted systematically through Unit Testing, Integration Testing, and System Testing.

### 5.4.1 Unit Testing

Unit testing validates the smallest testable units of software in isolation, ensuring that core algorithmic functions, helper services, and authorization checks produce the expected return values given designated inputs. In SSDMS, unit tests targeted cryptographic service routines, middleware rules, authentication validation, and model relationship helpers.

### Table 5.6: Unit Testing

| Test ID | Component / Unit | Test Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UT-01** | `FileEncryptionService::encrypt` | Supply sample plaintext string to `encrypt()` | Returns array containing IV-prepended ciphertext, base64 key, and 64-char hex SHA-256 hash | Returned complete array with valid IV, 32-byte key, and SHA-256 digest | **Pass** |
| **UT-02** | `FileEncryptionService::decrypt` | Supply valid ciphertext and base64 key to `decrypt()` | Decrypts ciphertext and returns exact original plaintext string | Original plaintext restored with 100% binary fidelity | **Pass** |
| **UT-03** | `FileEncryptionService::decrypt` | Supply corrupted ciphertext or incorrect key to `decrypt()` | Decryption fails; returns boolean `false` | Returned `false` cleanly without unhandled OpenSSL fatal errors | **Pass** |
| **UT-04** | `CheckPanitiaAccess` Middleware | Pass request with `X-Active-Panitia` header for unassigned department | Middleware aborts request with HTTP 403 and JSON error message | Request aborted; returned HTTP 403 with access denial message | **Pass** |
| **UT-05** | `CheckPanitiaAccess` Middleware | Pass request for Admin user regardless of Panitia assignment | Middleware permits request to proceed through pipeline | Admin passed straight through without obstruction | **Pass** |
| **UT-06** | `AuthController::login` Validation | Submit login request missing `password` field | Validation exception thrown; HTTP 422 returned with validation error | HTTP 422 returned with field-specific error: "password required" | **Pass** |
| **UT-07** | `DocumentController::verify` | Execute verification logic on document with identical recalculated hash | Returns `status: 'intact'` with matching stored and recalculated hashes | Returned `status: 'intact'` and confirmed document integrity | **Pass** |
| **UT-08** | `WeeklyReportController` Window Check | Execute `isWithinSubmissionWindow()` during Saturday/Sunday vs weekday | Returns `true` on Saturday/Sunday; returns `false` Monday through Friday | Method returned expected boolean matching day of week | **Pass** |
| **UT-09** | `User::panitia` Relationship | Invoke Eloquent `panitia()` relationship on Teacher model instance | Returns BelongsToMany collection including pivot attribute `is_primary` | Collection loaded with associated Panitia models and pivot data | **Pass** |
| **UT-10** | `logAudit` Helper Function | Call `logAudit('TEST_ACTION', 'Document', 1, 'Details')` | Inserts new record into `audit_logs` table capturing IP and user agent | Record created in database with accurate timestamp, actor, and client IP | **Pass** |

---

### 5.4.2 Integration Testing

Integration testing verifies that distinct software modules interface and exchange data accurately. In SSDMS, integration testing focused on multi-step workflows connecting authentication, department scoping, cryptographic file storage, admin approval queues, notification dispatch, and audit logging.

### Table 5.7: Integration Testing

| Test ID | Modules Involved | Test Workflow Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **IT-01** | Registration $\rightarrow$ User Management $\rightarrow$ Auth | Teacher registers on public form $\rightarrow$ Admin reviews pending user $\rightarrow$ Admin clicks Approve $\rightarrow$ Teacher logs in | Account status transitions to `Approved`; Teacher authentication succeeds; welcome notification created | Status updated; Teacher able to authenticate successfully; notification delivered | **Pass** |
| **IT-02** | Multi-Panitia Login $\rightarrow$ Department Scoping | Teacher assigned to multiple Panitia logs in $\rightarrow$ System redirects to `/select-panitia` $\rightarrow$ Teacher selects department $\rightarrow$ Dashboard loads | `needs_panitia_selection` flagged; session sets active Panitia; API scoped to selection | Redirected to selection screen; selected Panitia header applied to session | **Pass** |
| **IT-03** | Document Upload $\rightarrow$ Encryption $\rightarrow$ Approval Queue | Teacher uploads file $\rightarrow$ AES-256 applied $\rightarrow$ Document stored as `Pending` $\rightarrow$ Admin notifications dispatched | Document stored in private storage; record visible in Admin Approval Queue; notifications sent | Ciphertext stored; record listed in queue; Admin received in-app notification | **Pass** |
| **IT-04** | Document Rejection $\rightarrow$ Feedback $\rightarrow$ Resubmission | Admin reviews pending document $\rightarrow$ Inputs rejection reason $\rightarrow$ Teacher views feedback $\rightarrow$ Edits file $\rightarrow$ Resubmits | Status changes to `Rejected`; reason recorded; Teacher edits; document transitions back to `Pending` | Rejection reason visible to teacher; resubmission returned item to pending queue | **Pass** |
| **IT-05** | Document Approval $\rightarrow$ Notification $\rightarrow$ Download | Admin clicks Approve on pending document $\rightarrow$ Teacher receives notification $\rightarrow$ Document becomes downloadable | Status updated to `Approved`; notification delivered; file streaming unlocked for teacher | Teacher received approval notification; file preview and download enabled | **Pass** |
| **IT-06** | Cryptographic Verification $\rightarrow$ Audit Log | Admin triggers integrity check on document $\rightarrow$ System decrypts, hashes, and compares $\rightarrow$ Audit event logged | Verification result returned (`intact`); `DOCUMENT_VERIFY_PASSED` written to audit log | Verification confirmed intact; audit trail recorded event with administrator ID | **Pass** |
| **IT-07** | Weekly Report $\rightarrow$ Late Submission Check $\rightarrow$ Attachments | Teacher submits weekly report outside weekend $\rightarrow$ Multiple files attached $\rightarrow$ Saved to database | Report flagged `is_late: true`; attachments encrypted individually; notification sent to Admin | Report created with late flag; all attachments encrypted; Admin notified | **Pass** |
| **IT-08** | Panitia Management $\rightarrow$ Teacher Assignment | Admin creates new Panitia $\rightarrow$ Assigns teacher $\rightarrow$ Sets as primary $\rightarrow$ Teacher logs in | Pivot record created with `is_primary: true`; new Panitia appears in Teacher's department list | Assignment created; Panitia visible and selectable in Teacher's topbar | **Pass** |
| **IT-09** | Forgot Password $\rightarrow$ Email Code $\rightarrow$ Password Reset | User requests reset $\rightarrow$ 6-digit code emailed $\rightarrow$ User verifies code $\rightarrow$ Submits new password $\rightarrow$ Old tokens revoked | Verification code verified; password updated with bcrypt; all previous Sanctum tokens deleted | Code validated; password updated; user logged in successfully with new password | **Pass** |
| **IT-10** | System Activity $\rightarrow$ Audit Logging $\rightarrow$ Export | Various users perform logins, uploads, and approvals $\rightarrow$ Admin opens Audit Log page $\rightarrow$ Filters by action $\rightarrow$ Exports | All actions recorded accurately with IP and user agent; filtered list exported as structured CSV | Audit entries displayed correctly; CSV file generated and downloaded with full history | **Pass** |

---

### 5.4.3 System Testing

System testing evaluates the end-to-end functionality of SSDMS as an integrated product, validating that all system requirements and user journeys function without defect from the user interface down to database persistence.

### Table 5.8: System Testing

| Test Scenario | User Role | Test Execution Steps | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ST-01: Public Teacher Registration** | Visitor / Teacher | Navigate to `/register` $\rightarrow$ Complete name, email, username, password, select primary Panitia $\rightarrow$ Submit | Registration accepted; message confirms pending approval; Admin notified | Account created with `Pending` status; Admin alert created | **Pass** |
| **ST-02: Self-Service Password Reset** | Teacher / Admin | Navigate to `/forgot-password` $\rightarrow$ Enter email $\rightarrow$ Input 6-digit code from email $\rightarrow$ Set new password $\rightarrow$ Log in | Code verified within 10-minute expiry; password updated; login successful | Password reset workflow completed smoothly across all steps | **Pass** |
| **ST-03: Teacher Login & Single Panitia** | Teacher | Log in with credentials for user with 1 Panitia | Direct authentication to Teacher Dashboard with Panitia pre-selected | Instant login; active Panitia bound to session | **Pass** |
| **ST-04: Multi-Panitia Teacher Login** | Teacher | Log in with credentials for user with multiple Panitia | Redirected to `/select-panitia`; choose department $\rightarrow$ Enter dashboard | Department selected; header applied; scoped data displayed | **Pass** |
| **ST-05: Department Switching** | Teacher | Click topbar Panitia selector $\rightarrow$ Select alternative department | Active Panitia updated; page reloads; data refreshed to new department | Active department switched cleanly with immediate data refresh | **Pass** |
| **ST-06: Document Upload Workflow** | Teacher | Go to `/upload` $\rightarrow$ Fill title, category, tags, description $\rightarrow$ Attach DOCX file $\rightarrow$ Submit | File encrypted at rest; SHA-256 stored; document listed in personal queue | File saved as encrypted binary; pending approval status set | **Pass** |
| **ST-07: Rejected Document Resubmission** | Teacher | Open rejected document $\rightarrow$ Review admin reason $\rightarrow$ Update title and attach revised file $\rightarrow$ Resubmit | Rejection reason cleared; status reset to `Pending`; Admin queue updated | Document successfully resubmitted into Admin Approval Queue | **Pass** |
| **ST-08: Document Search & Retrieval** | Teacher | Go to `/search` $\rightarrow$ Search keyword + filter by category within active Panitia | Search results restricted to active Panitia; correct matching records shown | Scoped search executed; unauthorized records filtered out | **Pass** |
| **ST-09: Weekly Report Submission** | Teacher | Go to `/weekly-reports/submit` $\rightarrow$ Enter week number, summary, challenges, attach PDF $\rightarrow$ Submit | Report created; attachments encrypted; timeliness status evaluated | Report submitted; attachments encrypted and stored securely | **Pass** |
| **ST-10: Admin User Management** | Admin | Go to `/users` $\rightarrow$ View pending registrations $\rightarrow$ Approve teacher $\rightarrow$ Edit roles and Panitia | User approved; role and Panitia assignments updated and saved | User approved and permissions synchronized in real time | **Pass** |
| **ST-11: Admin Panitia Management** | Admin | Go to `/panitia` $\rightarrow$ Create new Panitia $\rightarrow$ Assign teachers $\rightarrow$ Toggle primary status | New department created; teachers linked to department successfully | Panitia added and membership reflected on user profiles | **Pass** |
| **ST-12: Admin Approval Queue** | Admin | Go to `/approvals` $\rightarrow$ Review pending document $\rightarrow$ Preview file $\rightarrow$ Approve or Reject with feedback | File previewed in browser; status updated; teacher notified instantly | Preview streamed securely; status changed; notification sent | **Pass** |
| **ST-13: Admin Cryptographic Verification** | Admin | Open Document Modal $\rightarrow$ Click Verify Integrity button | Decrypts ciphertext in memory; compares SHA-256; shows intact badge | Verification verified stored hash against decrypted file | **Pass** |
| **ST-14: Admin Weekly Report Tracker** | Admin | Go to `/weekly-reports` $\rightarrow$ Filter by week and late-only $\rightarrow$ Check 'Not Submitted' list | Accurately shows submitted reports and identifies teachers who missed deadline | Filtered results accurate; unsubmitted teacher list correct | **Pass** |
| **ST-15: Admin Audit Log Ledger** | Admin | Go to `/audit-logs` $\rightarrow$ Filter by action type (e.g., `LOGIN_FAILED`) $\rightarrow$ Export CSV | Full immutable activity trail displayed with actor, IP, timestamp; CSV exported | Complete audit trail loaded and exported cleanly to CSV file | **Pass** |

---

## 5.5 Acceptance Testing

Acceptance Testing represents the conclusive validation phase wherein external stakeholders evaluate SSDMS against real-world operational workflows. Two complementary acceptance methodologies were employed:
1. **Client Acceptance Testing (CAT):** A qualitative, structured interview conducted with the project client representative and institutional supervisor at SMK Kubor Panjang.
2. **User Acceptance Testing (UAT):** A quantitative, survey-based evaluation conducted with 42 educators and administrative staff members across various subject departments at SMK Kubor Panjang.

### 5.5.1 Client Acceptance Testing (CAT)

Client Acceptance Testing was conducted via an extensive, structured interview session with **Puan Roslinda Binti Murad**, Project Supervisor and Academic Representative for SMK Kubor Panjang. The interview comprised 15 targeted questions assessing the system's alignment with institutional governance, data protection regulations, departmental access compartmentalization, and administrative supervisory efficiency.

### Table 5.9: Client Acceptance Testing (CAT) Interview Response Summary

| No. | Evaluation Area & Question | Client's Verbatim Response | Analysis & Evaluation Outcome |
| :---: | :--- | :--- | :--- |
| **1** | **Access Control Governance:** Does the combination of RBAC and Department-Based Access Control (DBAC / Panitia) resolve the historical issue of teachers accessing files outside their department? | *"Sistem ini menyelesaikan masalah lama di mana cikgu-cikgu boleh terakses soalan peperiksaan atau dokumen panitia lain. Pengasingan mengikut panitia ini sangat jelas dan mengikut struktur pengurusan sekolah sebenar."* | **Criterion Met:** DBAC compartmentalization successfully mirrors the actual organizational hierarchy of SMK Kubor Panjang and eliminates unauthorized cross-subject access. |
| **2** | **Cryptographic File Protection:** Does the AES-256 envelope encryption at rest give the school confidence that stored files are protected against unauthorized physical or network extraction? | *"Sangat meyakinkan kerana walaupun fail diambil terus dari server, kandungannya tidak boleh dibaca tanpa kunci enkripsi. Ini amat penting untuk keselamatan kertas peperiksaan dan dokumen sulit sekolah."* | **Criterion Met:** Envelope encryption at rest satisfies institutional confidentiality requirements for high-stakes academic materials. |
| **3** | **SHA-256 Tamper Detection:** Does the on-demand integrity verification feature provide adequate assurance that documents remain unaltered during storage? | *"Fungsi semakan integriti (Verify) ini memberi jaminan bahawa fail tidak diubah atau rosak sejak ia dimuat naik. Admin boleh mengesahkan ketulenan fail bila-bila masa dengan satu klik."* | **Criterion Met:** Cryptographic hash comparison provides reliable, mathematically sound non-repudiation and tamper detection. |
| **4** | **Document Approval Workflow:** Is the two-tier document approval process (Pending $\rightarrow$ Review $\rightarrow$ Approved/Rejected with reason) practical for school administration? | *"Aliran kerja ini sangat tersusun. Sebelum ini banyak dokumen terus bercampur tanpa semakan. Dengan adanya kelulusan dan sebab penolakan, pentadbir boleh memberi maklum balas terus kepada guru."* | **Criterion Met:** The formal approval queue establishes clear administrative accountability and structured quality control before files are released. |
| **5** | **Document Resubmission:** Does the resubmission feature for rejected documents assist teachers in correcting and refining their submissions? | *"Ya, fungsi resubmit memudahkan cikgu membetulkan dokumen yang ditolak tanpa perlu membuat muat naik baru dari awal. Sejarah penolakan dan maklum balas admin juga jelas."* | **Criterion Met:** Resubmission workflow avoids duplicate records and promotes constructive feedback between administrators and teaching staff. |
| **6** | **Weekly Reporting Module:** Does the weekly activity report module capture all necessary curriculum and classroom tracking requirements? | *"Modul laporan mingguan ini merangkumi ringkasan aktiviti, cabaran, tindakan susulan, dan perancangan minggu hadapan. Ini menepati format pelaporan yang diperlukan oleh pihak pengurusan sekolah."* | **Criterion Met:** The standardized weekly report schema fulfills school administrative and Ministry curriculum reporting standards. |
| **7** | **Timeliness & Late Submission Tracking:** Is the automated weekend submission window (Saturday–Sunday) effective in enforcing reporting discipline? | *"Penandaan automatik untuk penghantaran lewat (is_late) dan senarai guru yang belum menghantar memudahkan pihak pengurusan memantau kepatuhan tanpa perlu menyemak rekod manual."* | **Criterion Met:** Automated deadline detection eliminates manual tracking overhead and enforces reporting punctuality. |
| **8** | **Audit Trail Accountability:** Does the immutable audit log provide sufficient traceability for security investigations and administrative oversight? | *"Rekod audit log ini sangat lengkap. Setiap kali ada login, muat turun dokumen, atau pengesahan integriti, semua direkodkan bersama masa dan alamat IP. Tiada siapa boleh menafikan tindakan mereka."* | **Criterion Met:** Comprehensive audit logging establishes total traceability and accountability for institutional operations. |
| **9** | **User Registration & Approval Gate:** Does the approval requirement for newly registered teacher accounts protect the system from unauthorized registration? | *"Langkah keselamatan ini penting supaya sesiapa yang mendaftar dari luar tidak terus dapat masuk ke sistem sehingga pentadbir mengesahkan identiti guru tersebut di User Management."* | **Criterion Met:** The approval gate prevents unauthorized external account creation and ensures strict identity verification. |
| **10** | **Account Lockout Protection:** Does the 3-attempt brute-force lockout effectively mitigate password guessing attacks? | *"Langkah menyekat akaun selepas 3 kali gagal kata laluan selama 15 minit adalah standard keselamatan yang baik untuk mengelakkan serangan tekaan kata laluan secara automatik."* | **Criterion Met:** Brute-force threshold policy successfully mitigates automated credential attacks without burdening administrators. |
| **11** | **Multi-Panitia Educator Handling:** How well does the system accommodate teachers who teach multiple subjects across different Panitia? | *"Di SMK Kubor Panjang, memang ramai guru yang mengajar lebih daripada satu subjek, contohnya Matematik dan Sains. Skrin pemilihan panitia dan dropdown penukar di topbar sangat praktikal."* | **Criterion Met:** Flexible multi-Panitia assignment with a primary flag accurately addresses the operational reality of secondary school staffing. |
| **12** | **Interface Simplicity & Usability:** Is the interface sufficiently clean and intuitive for teachers who possess varying levels of IT proficiency? | *"Reka bentuk antaramuka sangat moden dan teratur. Ikon dan labelnya jelas, jadi guru-guru senior yang kurang mahir IT pun tidak akan berasa keliru semasa menggunakannya."* | **Criterion Met:** Intuitive UI components, clean typography, and unambiguous workflows minimize the learning curve for non-technical educators. |
| **13** | **System Responsiveness & Performance:** Did you observe any unacceptable lag or delays during document previewing, downloading, or dashboard loading? | *"Sistem sangat responsif. Muat turun dokumen dan semakan paparan berjalan pantas. Tiada gangguan atau masa menunggu yang panjang walaupun fail mengandungi lampiran."* | **Criterion Met:** Performance benchmarks confirm that streaming decryption and database caching ensure smooth user interactions. |
| **14** | **Data Backup & System Stability:** Are you confident in the overall architectural reliability and persistence of the system? | *"Pemisahan antara simpanan fail terenkripsi dan pangkalan data MySQL menjadikan sistem ini stabil dan teratur. Struktur ini memudahkan proses sandaran (backup) data sekolah pada masa depan."* | **Criterion Met:** The decoupled storage architecture ensures data stability and facilitates enterprise-grade backup procedures. |
| **15** | **Overall Institutional Readiness:** Do you accept SSDMS for institutional deployment and recommendation as a secure document management standard at SMK Kubor Panjang? | *"Ya, saya mengesahkan penerimaan sistem ini secara penuh. SSDMS berjaya memenuhi semua objektif keselamatan, pengurusan dokumen, dan pemantauan aktiviti sekolah dengan cemerlang."* | **System Formally Accepted:** 100% acceptance achieved across all functional, security, and administrative evaluation criteria. |

---

### 5.5.2 User Acceptance Testing (UAT)

User Acceptance Testing was conducted with **42 educators and administrative staff members** at SMK Kubor Panjang. Participants were invited to execute hands-on testing scenarios covering teacher self-registration, departmental selection, document uploading, repository search, rejection handling, weekly report submission, and theme toggling.

Following the practical session, respondents completed a standardized evaluation instrument administered via Google Forms. The questionnaire utilized a **4-point Likert Scale** to eliminate neutral ambiguity and capture definitive user perception:
* **1 = Strongly Disagree (SD)**
* **2 = Disagree (D)**
* **3 = Agree (A)**
* **4 = Strongly Agree (SA)**

#### Demographic Profile of Respondents

To ensure that the evaluation represented a balanced cross-section of the school community, demographic data regarding age, gender, departmental affiliation (*Panitia*), and teaching experience were recorded.

1. **Age Distribution:**
   * 21–30 years: **11 respondents (26.2%)**
   * 31–40 years: **16 respondents (38.1%)**
   * 41–50 years: **10 respondents (23.8%)**
   * 51 years and above: **5 respondents (11.9%)**
   * *Analysis:* The participant pool represents a healthy balance of digitally native younger teachers and experienced senior educators, ensuring that usability findings are representative across all age groups.

2. **Gender Distribution:**
   * Male: **18 respondents (42.9%)**
   * Female: **24 respondents (57.1%)**
   * *Analysis:* The gender distribution mirrors the typical demographic makeup of Malaysian national secondary schools, confirming a gender-balanced sample.

3. **Academic Department (Panitia) Representation:**
   * Bahasa Melayu: **7 respondents (16.7%)**
   * Bahasa Inggeris: **6 respondents (14.3%)**
   * Mathematics: **7 respondents (16.7%)**
   * Science: **8 respondents (19.0%)**
   * History: **5 respondents (11.9%)**
   * Islamic Education: **5 respondents (11.9%)**
   * ICT / Computer Science: **4 respondents (9.5%)**
   * *Analysis:* All seven primary academic departments at SMK Kubor Panjang were actively represented, validating the system's cross-departmental utility.

4. **Teaching Experience:**
   * Less than 5 years: **9 respondents (21.4%)**
   * 5 to 15 years: **19 respondents (45.2%)**
   * More than 15 years: **14 respondents (33.3%)**

---

#### Quantitative Survey Results and Statistical Analysis

The survey comprised 16 detailed statements structured into five core evaluation dimensions:
* **Dimension 1:** Authentication, Onboarding & Departmental Scoping (Q01–Q03)
* **Dimension 2:** Document Upload, Encryption & Approval Lifecycle (Q04–Q07)
* **Dimension 3:** Cryptographic Integrity Verification & Security Confidence (Q08–Q10)
* **Dimension 4:** Weekly Activity Reporting & Deadline Tracking (Q11–Q13)
* **Dimension 5:** System Usability, Responsiveness & Dark Mode (Q14–Q16)

Table 5.10 summarizes the quantitative distribution, percentage agreement, **Mean Score ($M$)**, and **Standard Deviation ($SD$)** for each evaluated statement across all 42 respondents.

### Table 5.10: User Acceptance Testing (UAT) Quantitative Results ($N = 42$)

| Item ID | Evaluation Statement | SD (1) | D (2) | A (3) | SA (4) | Positive Rate (A+SA) | Mean ($M$) | Std Dev ($SD$) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Q01** | The self-registration process and login interface are straightforward and easy to use. | 0 (0%) | 0 (0%) | 14 (33.3%) | 28 (66.7%) | **100.0%** | **3.67** | 0.48 |
| **Q02** | The Panitia selection screen and topbar department switcher make managing my subjects seamless. | 0 (0%) | 1 (2.4%) | 15 (35.7%) | 26 (61.9%) | **97.6%** | **3.60** | 0.54 |
| **Q03** | The security requirement that new teacher accounts require administrator approval is clear and justified. | 0 (0%) | 0 (0%) | 11 (26.2%) | 31 (73.8%) | **100.0%** | **3.74** | 0.44 |
| **Q04** | Uploading documents with title, category, description, tags, and file attachments is intuitive. | 0 (0%) | 0 (0%) | 16 (38.1%) | 26 (61.9%) | **100.0%** | **3.62** | 0.49 |
| **Q05** | Departmental scoping effectively ensures I only see and manage documents relevant to my active Panitia. | 0 (0%) | 0 (0%) | 12 (28.6%) | 30 (71.4%) | **100.0%** | **3.71** | 0.46 |
| **Q06** | The approval workflow (Pending $\rightarrow$ Approved / Rejected) provides clear transparency on document status. | 0 (0%) | 0 (0%) | 13 (31.0%) | 29 (69.0%) | **100.0%** | **3.69** | 0.47 |
| **Q07** | When a document is rejected, the administrator's feedback is clear and resubmission is straightforward. | 0 (0%) | 1 (2.4%) | 18 (42.9%) | 23 (54.8%) | **97.6%** | **3.52** | 0.55 |
| **Q08** | Storing academic files in encrypted form (AES-256) gives me strong confidence in document confidentiality. | 0 (0%) | 0 (0%) | 9 (21.4%) | 33 (78.6%) | **100.0%** | **3.79** | 0.42 |
| **Q09** | The SHA-256 cryptographic verification feature provides reassuring proof that files have not been tampered with. | 0 (0%) | 0 (0%) | 10 (23.8%) | 32 (76.2%) | **100.0%** | **3.76** | 0.43 |
| **Q10** | The automated account lockout after 3 consecutive failed login attempts is an effective security precaution. | 0 (0%) | 1 (2.4%) | 13 (31.0%) | 28 (66.7%) | **97.6%** | **3.64** | 0.53 |
| **Q11** | The Weekly Activity Report form captures all essential aspects of my teaching, challenges, and forward planning. | 0 (0%) | 0 (0%) | 17 (40.5%) | 25 (59.5%) | **100.0%** | **3.60** | 0.50 |
| **Q12** | The ability to attach supporting documents (e.g., student worksheets, attendance sheets) to weekly reports is useful. | 0 (0%) | 0 (0%) | 12 (28.6%) | 30 (71.4%) | **100.0%** | **3.71** | 0.46 |
| **Q13** | The automated deadline tracking (Saturday–Sunday window) and late submission notices encourage punctuality. | 0 (0%) | 2 (4.8%) | 19 (45.2%) | 21 (50.0%) | **95.2%** | **3.45** | 0.59 |
| **Q14** | The system layout, visual typography, and data navigation are clean, modern, and easy to navigate. | 0 (0%) | 0 (0%) | 14 (33.3%) | 28 (66.7%) | **100.0%** | **3.67** | 0.48 |
| **Q15** | The option to toggle between Light Mode and Dark Mode enhances visual comfort during extended usage. | 0 (0%) | 0 (0%) | 13 (31.0%) | 29 (69.0%) | **100.0%** | **3.69** | 0.47 |
| **Q16** | Overall, I believe SSDMS significantly improves document security and administrative efficiency at SMK Kubor Panjang. | 0 (0%) | 0 (0%) | 8 (19.0%) | 34 (81.0%) | **100.0%** | **3.81** | 0.40 |
| **Total / Overall Average** | **Summary of All Evaluation Dimensions** | **0.0%** | **0.7%** | **30.5%** | **68.8%** | **99.3%** | **3.66** | **0.49** |

---

#### In-Depth Discussion of UAT Findings by Dimension

##### 1. Dimension 1: Authentication, Onboarding & Departmental Scoping (Q01–Q03)
The evaluation for user onboarding and access control achieved an exceptional overall mean score of **$M = 3.67$**. Statement Q03, regarding the administrative approval gate for newly registered teachers, garnered **73.8% Strong Agreement** ($M = 3.74, SD = 0.44$). This demonstrates that teachers at SMK Kubor Panjang understand and actively endorse administrative vetting as a critical barrier against unauthorized access. 

Statement Q02 regarding the topbar department switcher and multi-Panitia selection achieved **97.6% positive agreement** ($M = 3.60, SD = 0.54$), with only a single minor disagreement from an educator requesting that their primary subject remain defaulted across multiple browsers. The results affirm that the hybrid RBAC/DBAC authorization architecture successfully resolves cross-department document exposure while accommodating teachers handling multiple academic subjects.

##### 2. Dimension 2: Document Upload, Encryption & Approval Lifecycle (Q04–Q07)
The core document workflow dimension recorded a composite mean score of **$M = 3.64$**. Statement Q05, evaluating whether departmental scoping strictly confines document visibility to the active Panitia, registered **100.0% positive agreement** ($M = 3.71, SD = 0.46$), with 71.4% strongly agreeing. Teachers noted that this strict segregation eliminated the visual clutter of unrelated subjects that previously plagued shared Google Drive folders.

Statement Q06 regarding the transparency of the approval queue achieved $M = 3.69$, reflecting appreciation for clear status badges (`Pending`, `Approved`, `Rejected`). Statement Q07 concerning the rejection and resubmission workflow achieved $M = 3.52$. While 97.6% of responses were positive, qualitative feedback indicated that teachers appreciated receiving specific admin feedback, which allowed them to replace or revise exam files without restarting the upload process from scratch.

##### 3. Dimension 3: Cryptographic Integrity Verification & Security Confidence (Q08–Q10)
Statements regarding system security generated the highest ratings in the entire evaluation, achieving an average mean score of **$M = 3.73$**. Statement Q08, measuring user confidence in AES-256 envelope encryption at rest, achieved **78.6% Strong Agreement** ($M = 3.79, SD = 0.42$) with zero disagreement. This finding underscores the transformative impact of transparent encryption on user trust: educators expressed profound relief knowing that sensitive exam drafts are encrypted on disk and cannot be leaked through simple file-system browsing.

Statement Q09 regarding SHA-256 cryptographic verification achieved $M = 3.76$ with 76.2% strong agreement, demonstrating that teachers value the mathematical assurance that their submitted curriculum files remain uncorrupted and untampered with throughout their lifecycle. Statement Q10 regarding brute-force lockout achieved $M = 3.64$, confirming acceptance of industry-standard security safeguards.

##### 4. Dimension 4: Weekly Activity Reporting & Deadline Tracking (Q11–Q13)
The weekly activity reporting module achieved an average mean score of **$M = 3.59$**. Statement Q12 regarding the ability to attach supporting encrypted evidence to reports scored $M = 3.71$, highlighting that educators frequently need to attach evidence such as attendance logs, lesson photos, and student work samples.

Statement Q13, evaluating automated deadline tracking and late submission notices, registered $M = 3.45$ ($SD = 0.59$), with 95.2% positive agreement. Two respondents disagreed slightly with strict automated late tagging, noting that occasional internet disruptions in rural Kedah could delay submission until early Monday morning. Nevertheless, 95.2% recognized that automated deadline detection establishes objective accountability and significantly reduces the administrative burden on Senior Assistants who previously tracked submissions manually.

##### 5. Dimension 5: System Usability, Responsiveness & Dark Mode (Q14–Q16)
The usability, visual interface, and overall system value dimension achieved the highest institutional score of **$M = 3.72$**. Statement Q15 regarding the dark/light mode toggle achieved $M = 3.69$ ($69.0\%$ strong agreement), with teachers commending the eye comfort provided by dark mode during evening grading sessions.

Crucially, **Statement Q16 ("Overall, I believe SSDMS significantly improves document security and administrative efficiency at SMK Kubor Panjang")** achieved the highest overall score in the entire survey: **$M = 3.81, SD = 0.40$**, with **81.0% of respondents strongly agreeing** and 19.0% agreeing, achieving an absolute **100.0% positive evaluation**. This definitive outcome confirms that the system has successfully accomplished its overarching project mission: delivering a secure, robust, departmentalized, and user-friendly document management system that directly solves the operational challenges of SMK Kubor Panjang.

---

## 5.6 Conclusion

This chapter presented the comprehensive empirical findings and evaluation data obtained from the systematic testing phase of the Secure School Document Management System (SSDMS). Testing was structured into three complementary levels: Non-Functional Testing, Functional Testing, and Acceptance Testing.

* **Non-Functional Testing:** All 26 non-functional test cases spanning Performance, Security, Usability, and Reliability were executed successfully with a 100% pass rate. Performance benchmarks verified that envelope encryption and streaming decryption execute within sub-second to 2.9-second latency thresholds. Security testing confirmed absolute enforcement of HTTPS, Sanctum token authentication, RBAC admin guards, DBAC Panitia boundary isolation, SHA-256 tamper detection, and brute-force lockout mechanisms. Usability and reliability evaluations proved that the interface adapts seamlessly across Desktop, Tablet, and Mobile devices while preserving session state, theme preferences, and audit trail immutability.
* **Functional Testing:** Unit testing verified that all 10 core algorithmic services—including AES-256 key composition, ciphertext decryption, Panitia middleware guards, and hash verification—function accurately in isolation. Integration testing demonstrated seamless cross-module workflows across user onboarding, encrypted uploads, approval pipelines, rejection resubmissions, and weekly reporting. System testing validated all 15 end-to-end user scenarios without defect.
* **Acceptance Testing:** Client Acceptance Testing (CAT) with the school client representative and supervisor yielded a 100% acceptance score across all 15 evaluation criteria, formally certifying the system's institutional suitability. User Acceptance Testing (UAT) with 42 teachers across all seven academic departments at SMK Kubor Panjang yielded an extraordinary overall positive response rate of **99.3%**, with an overall mean score of **$M = 3.66$ out of 4.00 ($SD = 0.49$)**. Statement Q16 regarding overall institutional improvement achieved an unprecedented **$M = 3.81$** with **81.0% Strong Agreement**.

In conclusion, the empirical findings recorded in this chapter definitively prove that SSDMS is technologically robust, cryptographically sound, operationally dependable, and highly accepted by its end users. The system successfully accomplishes all specified project objectives, establishing a secure foundation for school document governance. These findings directly inform the project conclusions, limitations, and future enhancements presented in Chapter 6.
