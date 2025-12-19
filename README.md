Secure Node.js Web Application: Vulnerability Assessment & Remediation
🛡️ Project Overview
This project focuses on the Security Remediation of a vulnerable Node.js/Express.js application. The primary goal was to implement a full Secure Software Development Life Cycle (SSDLC) approach by identifying critical vulnerabilities through Static (SAST) and Dynamic (DAST) analysis, fixing them using industry best practices, and establishing a monitoring system (SIEM) for future threat detection.

👥 Project Team

Mohamed Ayman Yakout (ID: 2305104) 


Ahmed Sameh Ragab (ID: 2305122) 


Ahmed Mohamed Saeed (ID: 2305126) 

🛠️ Tools & Technologies Used

Environment: Node.js / Express.js 


DAST Tool: OWASP ZAP (Dynamic Vulnerability Discovery) 


Exploitation & PoC: Postman (Manual attacks and Proof-of-Concepts) 


SAST Tool: Semgrep with Custom Rules (Source code analysis) 


Version Control: Git 

Monitoring (Phase D): Splunk (SIEM Integration)

🔍 Vulnerabilities Addressed
We identified and successfully mitigated 8 major security vulnerabilities based on the OWASP Top 10:


SQL Injection (SQLi): Fixed by replacing string concatenation with Parameterized Queries and column whitelisting.




Cross-Site Scripting (XSS): Fixed by switching from renderString() to res.render() to enable Contextual Output Encoding.



Broken Authorization (IDOR): Implemented Access Control Logic to verify that the requested resource ID matches the authenticated session user ID.



Broken JWT Implementation: Upgraded to strong environment secrets and enforced the HS256 signing algorithm.



Path Traversal: Implemented Path Normalization using path.basename() to restrict file access to specific directories.



Remote Code Execution (RCE): Replaced dangerous exec() calls with execFile() and added strict regex-based Input Validation.



Insecure Direct Object Reference (IDOR): Added object-level checks to prevent unauthorized data access.



Mass Assignment: Implemented Data Transfer Objects (DTOs) to pick only allowed fields from req.body during updates.


🚀 Security Phases
Phase A: Identification (Attack)
Using OWASP ZAP and Semgrep, we mapped the application's attack surface and identified vulnerabilities in the source code.

Phase B: Exploitation (PoC)
We used Postman to craft malicious payloads (e.g., ' OR '1'='1 for SQLi and <script> for XSS) to confirm the impact of each vulnerability.

Phase C: Remediation (The Fix)
Each vulnerability was patched at the code level. We transitioned from "Insecure Coding Patterns" to "Security-by-Design."

Phase D: Continuous Monitoring
We integrated a Splunk Dashboard to monitor real-time security events. We created custom SPL (Splunk Processing Language) queries to detect:

SQLi patterns in incoming requests.

Unauthorized IDOR attempts.

Anomalous administrative access.

📁 Installation & Setup
Clone the repository:

git clone https://github.com/your-username/secure-node-app.git
cd secure-node-app
Install dependencies:

npm install
Configure Environment Variables: Create a .env file and set your JWT_SECRET and NODE_ENV.

Run the application:
npm run dev

Bash

npm run dev# Secure-Software-Project
