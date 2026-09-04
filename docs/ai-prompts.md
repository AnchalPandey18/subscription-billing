# AI Prompts

AI was used as a development assistant during the project for planning, implementation guidance, debugging, and documentation.

## 1. Project Planning

### Prompt
"Help me break down this subscription billing assessment into practical development steps and suggest a suitable implementation order."

### What I got
A structured development plan covering authentication, subscriptions, invoices, credit notes, collaborators, overdue handling, frontend, and documentation.

### What I corrected
I adapted the plan according to the actual project requirements and implementation progress.

---

## 2. Authentication and Role-Based Access

### Prompt
"Help me implement JWT authentication with Billing Admin and Account Manager roles using Node.js, Express and MongoDB."

### What I got
A JWT-based authentication flow with middleware for authentication and role-based authorization.

### What I corrected
I adjusted the permissions to match the application's requirements and verified access for both user roles.

---

## 3. Invoice Lifecycle

### Prompt
"Help me design the invoice lifecycle for Draft, Issued, Paid and Void states, including credit notes."

### What I got
A clear status transition approach with backend validation and separate credit note records.

### What I corrected
I aligned the transitions and permissions with the required billing workflow and tested the important edge cases.

---

## 4. Overdue Invoice Handling

### Prompt
"How should overdue invoices and dismissed overdue alerts be handled?"

### What I got
A design where overdue status is derived from the invoice due date and dismissed alerts are tracked separately.

### What I corrected
I added due-date tracking to make sure an alert can appear again when an invoice becomes overdue under a new due date.

---

## 5. Debugging and Improvements

### Prompt
"Review this implementation and help me identify issues or improvements while keeping the existing project structure."

### What I got
Suggestions for improving validation, permissions, error handling, and frontend/backend integration.

### What I corrected
I tested the suggestions against the application and kept only the changes that matched the assessment requirements.

---

## 6. Documentation

### Prompt
"Help me write concise and professional architecture, schema, and project documentation based on the implemented application."

### What I got
A structured format for explaining the architecture, database design, technical decisions, and development process.

### What I corrected
I simplified the language and kept the documentation focused on the actual implementation.