# Technical Decisions

I made the following technical decisions while building the Subscription Billing System.

## 1. React + Vite

### Options
- React + Vite
- Next.js
- Create React App

### Chosen
React + Vite.

### Why
I am comfortable with React, and Vite provides a simple and fast setup for the frontend. I also wanted to keep the frontend and backend as separate applications.

---

## 2. MongoDB

### Options
- MongoDB
- MySQL
- PostgreSQL

### Chosen
MongoDB with MongoDB Atlas.

### Why
MongoDB works well with Node.js and Mongoose. It also gives me a flexible structure while developing the different parts of the billing system.

---

## 3. ES Modules

### Options
- ES Modules (`import/export`)
- CommonJS (`require`)

### Chosen
ES Modules.

### Why
I wanted to use modern JavaScript syntax in the backend. I configured the server to use `"type": "module"` so I could use `import` and `export` throughout the backend.

---

## 4. JWT Authentication

### Options
- JWT
- Session-based authentication

### Chosen
JWT.

### Why
The frontend and backend are separate applications. JWT provides a simple way to authenticate API requests and carry the user's ID and role for authorization.

---

## 5. Password Hashing

### Options
- Store passwords directly
- bcrypt

### Chosen
bcrypt.

### Why
Passwords should not be stored as plain text. I use bcrypt to hash passwords during registration and compare the hashed password during login.

---

## 6. Decimal128 for Money

### Options
- JavaScript `Number`
- MongoDB `Decimal128`

### Chosen
MongoDB Decimal128.

### Why
This is a billing application, so monetary values need accurate decimal representation. Decimal128 avoids relying on JavaScript floating-point numbers for stored billing amounts.

---

## 7. Backend Authorization

### Options
- Check roles only in the frontend
- Check roles only in the backend
- Check roles in both

### Chosen
Backend authorization with role-based UI handling in the frontend.

### Why
Frontend checks alone are not secure because users can directly call APIs. The backend verifies whether the user's role is allowed to perform an operation. The frontend also hides or disables actions that the current role cannot use, which gives a better user experience.

---

## 8. Paid Invoice Handling

### Options
- Allow paid invoices to be edited
- Delete and recreate paid invoices
- Keep paid invoices unchanged and use credit notes

### Chosen
Paid invoices remain immutable and corrections are handled using credit notes.

### Why
Paid invoices are financial records. Keeping them unchanged preserves billing history and makes the system easier to audit.

---

## 9. Invoice Status and Overdue Handling

### Options
- Add `Overdue` as a separate invoice status
- Derive overdue status from the due date

### Chosen
Overdue is derived from the invoice status and due date.

### Why
An invoice can remain `Issued` while becoming overdue after its due date. Keeping `Overdue` separate from the main invoice lifecycle avoids unnecessary status changes and keeps the invoice states simple.

---

## 10. Frontend Routing

### Options
- Manage screens using component state
- Use React Router

### Chosen
React Router with protected routes and a shared layout.

### Why
As more pages were added, such as Dashboard, Subscriptions, Invoices, Credit Notes, Collaborators, and Overdue Alerts, proper routing became easier to manage. Protected routes also make authentication handling clearer.

### Later Reversed
Initially, I used simple React state to switch between Login, Register, and Dashboard.

Later reversed:
As the application grew, I moved to React Router with separate routes, a shared layout, and protected routes. This made navigation and authentication handling cleaner.

---

## 11. Database Seeding

### Options
- Create demo users manually in MongoDB
- Add a database seed script

### Chosen
A separate database seed script using `server/seed.js`.

### Why
The application needs both Billing Admin and Account Manager accounts for testing role-based features. A seed script makes it easier to create or update these demo accounts consistently instead of creating them manually each time.

The seed script also hashes the demo passwords using bcrypt before storing them.

---

## 12. Separate Frontend and Backend

### Options
- Build frontend and backend in one application
- Keep frontend and backend as separate applications

### Chosen
Separate frontend and backend.

### Why
Keeping them separate makes the project structure easier to understand and allows the React frontend to communicate with the Express backend through REST APIs. It also makes independent deployment possible.

---

## Later Reversed Decisions

No other major technical decisions have been reversed so far.