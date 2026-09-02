# Technical Decisions

I made the following decisions while building the Subscription Billing System.

## 1. React + Vite

### Options
- React + Vite
- Next.js
- Create React App

### Chosen
React + Vite.

### Why
I am comfortable with React and Vite provides a simple and fast setup. I did not choose Next.js because I am keeping the frontend and backend separate.

---

## 2. MongoDB

### Options
- MongoDB
- MySQL
- PostgreSQL

### Chosen
MongoDB with MongoDB Atlas.

### Why
MongoDB works well with Node.js and Mongoose. It also gives flexibility while developing the different parts of the billing system.

---

## 3. ES Modules

### Options
- ES Modules (`import/export`)
- CommonJS (`require`)

### Chosen
ES Modules.

### Why
I wanted to use modern JavaScript syntax in the backend. I configured the server to use `"type": "module"`.

---

## 4. JWT Authentication

### Options
- JWT
- Session-based authentication

### Chosen
JWT.

### Why
The frontend and backend are separate. JWT makes it simple to authenticate API requests and also allows me to keep the user's ID and role in the token.

---

## 5. Password Hashing

### Options
- Store passwords directly
- bcrypt

### Chosen
bcrypt.

### Why
Passwords should not be stored as plain text. I use bcrypt to hash passwords during registration and compare them during login.

---

## 6. Decimal128 for Money

### Options
- JavaScript `Number`
- MongoDB `Decimal128`

### Chosen
MongoDB Decimal128.

### Why
This is a billing application, so money needs accurate decimal representation. I don't want to depend on JavaScript floating-point numbers for stored monetary values.

---

## 7. Backend Authorization

### Options
- Check roles only in frontend
- Check roles in backend
- Check roles in both

### Chosen
Backend authorization with frontend role-based UI.

### Why
Frontend checks alone are not secure because users can directly call APIs. The backend must verify whether the user's role is allowed to perform an operation.

---

## 8. Paid Invoice Handling

### Options
- Allow paid invoices to be edited
- Delete and recreate them
- Keep them unchanged and use credit notes

### Chosen
Paid invoices will remain immutable and corrections will be handled using credit notes.

### Why
Paid invoices are financial records. Keeping them unchanged preserves the billing history and makes the system easier to audit.

---

## Later Reversed Decisions

No decision has been reversed yet.

If I change an important decision during development, I will record it here and explain why I changed it.