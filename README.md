# Subscription Billing System

A full-stack subscription billing and invoicing application designed to manage subscriptions, invoices, payments, credit notes, collaborators, and overdue receivables.

The application provides separate access levels for **Billing Admins** and **Account Managers**, with authorization enforced on the backend.

---

## Overview

The system replaces a manual spreadsheet-based billing workflow with a centralized application for managing the complete subscription billing process.

It supports:

- Subscription management
- Role-based access control
- Invoice lifecycle management
- Credit notes
- Subscription collaborators
- Bulk invoice generation
- Invoice search and filtering
- Receivables CSV export
- Dashboard summaries
- Overdue invoice alerts

---

## Key Features

### Authentication & Authorization

- Email and password authentication
- JWT-based authentication
- Password hashing with bcrypt
- Billing Admin and Account Manager roles
- Server-side role-based authorization
- Protected application routes

### Subscription Management

- Create, view and update subscriptions
- Monthly and yearly billing cycles
- Exact decimal pricing using MongoDB Decimal128
- Start and next billing dates
- Archive subscriptions
- Archived subscriptions are excluded from future invoice generation
- Existing invoice history is preserved

### Invoice Management

Invoices follow the main lifecycle:

```text
Draft → Issued → Paid
```

Supported operations include:

- Create invoices
- Edit Draft invoices
- Issue invoices
- Mark invoices as paid
- Void eligible invoices
- Search and filter invoices
- Pagination
- Overdue invoice detection
- CSV export

Paid invoices remain immutable. Corrections are handled using separate credit notes.

### Credit Notes

- Create credit notes against paid invoices
- Record credit amount and reason
- Prevent total credits from exceeding the invoice amount
- Keep credit notes as separate records
- Preserve the original paid invoice

### Collaborators

- Add collaborators to subscriptions
- View subscription collaborators
- Remove collaborators
- Prevent duplicate collaborators

### Bulk Invoice Generation

Billing Admins can generate invoices for due active subscriptions.

The process:

1. Finds active subscriptions that are due.
2. Checks whether an invoice already exists.
3. Prevents duplicate invoice generation.
4. Creates the required invoices.
5. Advances the next billing date.
6. Returns the generation result.

### Overdue Alerts

An invoice is considered overdue when:

```text
Status = Issued
AND
Due date has passed
```

Overdue invoices are shown in a dedicated alerts section with a navigation count.

Dismissed alerts can appear again when the invoice receives a new due date and becomes overdue again.

---

## User Roles

| Capability | Billing Admin | Account Manager |
|---|:---:|:---:|
| View subscriptions | ✓ | ✓ |
| Create subscriptions | ✓ | ✓ |
| Edit subscriptions | ✓ | ✓ |
| Archive subscriptions | ✓ | — |
| Create invoices | ✓ | ✓ |
| Issue invoices | ✓ | — |
| Mark invoices as paid | ✓ | — |
| Void invoices | ✓ | — |
| Create credit notes | ✓ | — |
| Manage collaborators | ✓ | — |
| Bulk invoice generation | ✓ | — |
| Search/filter invoices | ✓ | ✓ |
| Export receivables | ✓ | ✓ |
| View overdue alerts | ✓ | ✓ |

> The backend enforces authorization for protected operations. Frontend visibility is not used as the security boundary.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT |
| Password Hashing | bcryptjs |

---

## Architecture

```text
┌──────────────────────┐
│      React + Vite    │
│    Tailwind CSS UI   │
└──────────┬───────────┘
           │ REST API
           │ JWT
           ▼
┌──────────────────────┐
│   Node.js + Express  │
│                      │
│ Authentication       │
│ Authorization        │
│ Controllers          │
│ Business Logic       │
└──────────┬───────────┘
           │ Mongoose
           ▼
┌──────────────────────┐
│     MongoDB Atlas    │
│                      │
│ Users                │
│ Subscriptions        │
│ Invoices             │
│ Credit Notes         │
│ Collaborators        │
│ Overdue Alerts       │
└──────────────────────┘
```

The frontend communicates with the Express API through REST endpoints. The backend handles authentication, authorization and billing rules before accessing MongoDB.

---

## Database

The main collections are:

- **Users**
- **Subscriptions**
- **Invoices**
- **Credit Notes**
- **Collaborators**
- **Overdue Alerts**

Financial amounts are stored using **MongoDB Decimal128** to avoid JavaScript floating-point precision issues.

---

## Project Structure

```text
subscription-billing/
│
├── client/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       └── utils/
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── seed.js
│
├── docs/
│   ├── architecture.md
│   ├── schema.md
│   ├── plan.md
│   ├── decisions.md
│   └── ai-prompts.md
│
├── Submission.md
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js
- npm
- MongoDB Atlas account

### Clone the repository

```bash
git clone https://github.com/AnchalPandey18/subscription-billing.git
cd subscription-billing
```

### Backend Setup

```bash
cd server
npm install
```

Create a `server/.env` file:

```env
PORT=5000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Seed the demo users:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### Frontend Setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend will normally run on:

```text
http://localhost:5173
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Billing Admin | `billingadmin@test.com` | `Admin@123` |
| Account Manager | `manager@test.com` | `Test@12345` |

These accounts are provided for reviewing the application's role-based functionality.

---

## API Overview

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Subscriptions

```text
POST   /api/subscriptions
GET    /api/subscriptions
GET    /api/subscriptions/:id
PUT    /api/subscriptions/:id
PATCH  /api/subscriptions/:id/archive
```

### Invoices

```text
POST /api/invoices
GET  /api/invoices
POST /api/invoices/bulk-generate
POST /api/invoices/:id/issue
POST /api/invoices/:id/pay
POST /api/invoices/:id/void
GET  /api/invoices/export
GET  /api/invoices/overdue
```

### Credit Notes

```text
POST /api/credit-notes
```

### Collaborators

```text
POST   /api/collaborators
GET    /api/collaborators/:subscriptionId
DELETE /api/collaborators/:subscriptionId/:userId
```

### Overdue Alerts

```text
GET   /api/overdue-alerts
PATCH /api/overdue-alerts/:invoiceId/dismiss
```

---

## Documentation

Detailed project documentation is available in the `docs/` directory.

| Document | Description |
|---|---|
| `architecture.md` | Application architecture and request flow |
| `schema.md` | Database schema, relationships and constraints |
| `plan.md` | Development plan, priorities and time tracking |
| `decisions.md` | Technical decisions and trade-offs |
| `ai-prompts.md` | AI prompts used during development |

The assessment submission details are available in:

```text
Submission.md
```

---

## Security

- Passwords are hashed using bcrypt.
- JWT is used for authentication.
- Protected operations use server-side authorization.
- MongoDB credentials are stored in environment variables.
- JWT secrets are stored in environment variables.
- `.env` files are excluded from Git.
- No database credentials or secrets are committed to the repository.

---

## Current Scope

The application focuses on the core subscription billing workflow required by the assessment.

Future improvements could include:

- Complete immutable invoice event history
- Explicit invoice billing-period fields
- More detailed ownership-based collaborator permissions
- Advanced dashboard analytics
- Background billing jobs
- Email notifications
- Customer self-service billing portal
- Payment gateway integration

---

## License

This project was developed as part of a technical assessment.
