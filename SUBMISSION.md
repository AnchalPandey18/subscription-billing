# Submission

Fill this in and commit it. This is the first file we open.

## Links

- **GitHub repository:** `https://github.com/AnchalPandey18/subscription-billing`

- **Live application:** `https://subscription-billing-jv6a.vercel.app`

## Notes for the reviewer

This is a subscription billing and invoicing system with authentication, role-based access control, subscription management, invoice lifecycle management, credit notes, collaborators, bulk invoice generation, receivables export and overdue alerts.

The project includes a seed script for creating demo accounts for both supported roles.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Billing Admin | `billingadmin@test.com` | `Admin@123` |
| Account Manager | `manager@test.com` | `Test@12345` |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React, Vite, Tailwind CSS | Used to build the application interface and billing workflows. |
| Backend | Node.js, Express | Handles REST APIs, authentication, authorization and billing business logic. |
| Database | MongoDB Atlas, Mongoose | Used for persistent data storage and database operations. |
| Hosting | Vercel, Render, MongoDB Atlas | Used for hosting the frontend, backend and database. |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | **Done** | Implemented email/password authentication with Billing Admin and Account Manager roles. JWT authentication and role-based permissions are enforced on the server. |
| 2 | Subscriptions | **Done** | Supports creating, viewing, editing and archiving subscriptions with monthly/yearly billing cycles, Decimal128 pricing and billing dates. Archived subscriptions do not generate future invoices and existing invoice history is preserved. |
| 3 | Invoices | **Partial** | Invoices are linked to subscriptions and support Decimal128 amounts, due dates, Draft editing and invoice listing. Billing period start and end dates are not currently stored as separate invoice fields. |
| 4 | Invoice lifecycle with rules | **Done** | Implemented Draft → Issued → Paid and Draft/Issued → Void. Overdue status is derived from the due date, paid invoices remain immutable, and credit notes are used for corrections. Invalid lifecycle operations are rejected by the server. |
| 5 | Collaborators | **Partial** | Collaborators can be added, viewed and removed, and duplicate collaborators are prevented. The main collaboration flow is implemented, but the detailed ownership-based access rules can be improved further. |
| 6 | Finding invoices | **Done** | Implemented server-side invoice search, status and date filtering, overdue handling and pagination. Invoice data is filtered on the server rather than loading the complete dataset into the browser. |
| 7 | Generating invoices in bulk | **Done** | Billing Admins can bulk-generate invoices for due active subscriptions. Duplicate invoice generation is prevented, generation results are returned, and receivables can be exported as CSV. |
| 8 | A dashboard | **Partial** | Implemented dashboard summaries for billing and receivables. The complete status/plan breakdowns and eight-week revenue chart are not fully implemented. |
| 9 | History you cannot rewrite | **Not done** | Paid invoice immutability and credit notes are implemented, but the complete immutable invoice timeline with status changes, actors and notes has not been implemented. |
| 10 | Overdue invoice alerts | **Done** | Implemented overdue invoice detection, alerts, navigation count, dismissal and reappearance when an invoice's due date changes and later becomes overdue again. |

## How much time did you actually spend?

Approximately **15 hours** in total, including backend development, frontend development, authentication and authorization, database work, testing, debugging, documentation and final preparation.

## What would you do next, with another 12 hours?

With another 12 hours, I would focus on completing the remaining gaps and improving production readiness.

- Complete the immutable invoice history/timeline.
- Add billing period start and end dates to invoices.
- Complete the remaining ownership and collaborator permission rules.
- Improve dashboard analytics with status/plan breakdowns and the eight-week revenue chart.
- Add more automated API and frontend tests.
- Improve loading, error and empty states.
- Review production security and configuration.
- Improve deployment and setup documentation.

## What are you least happy with in this codebase, and why?

The main area I would improve is the invoice history and audit trail.

The current implementation protects paid invoices from modification and keeps credit notes as separate records, but it does not yet have a complete immutable timeline of every invoice event.

For a production billing system, I would add a dedicated immutable history collection so important invoice actions record what happened, who performed the action and when it happened.