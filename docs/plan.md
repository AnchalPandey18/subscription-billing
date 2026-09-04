# Development Plan

## Project

Subscription Billing System

## How I built the project

I built the project step by step instead of trying to complete everything at once.

For each major feature, I implemented it, tested it, fixed issues where needed, and then committed the changes to GitHub. This made it easier to track the development and keep the project stable while adding new features.

My basic workflow was:

1. Decide what feature I needed to build
2. Implement it
3. Test it
4. Fix errors if there were any
5. Update the documentation when needed
6. Commit the changes
7. Push the changes to GitHub
8. Move to the next feature

---

## 1. Project Setup

I started by setting up the basic project structure.

I worked on:

- Creating the React frontend using Vite
- Creating the Node.js/Express backend
- Setting up ES Modules
- Installing the required packages
- Creating folders for controllers, models, routes, middleware and configuration
- Creating the documentation files
- Setting up Git and GitHub

**Status:** Completed

**Estimated time:** 30 min

**Actual time:** 50 min

---

## 2. MongoDB Setup

I connected the backend with MongoDB Atlas and kept the database configuration in environment variables.

I worked on:

- Creating the MongoDB connection
- Connecting the Express server with MongoDB
- Keeping sensitive configuration outside GitHub
- Testing the database connection

**Status:** Completed

**Estimated time:** 20 min

**Actual time:** 30 min

---

## 3. Authentication

I implemented user authentication before building the main billing features.

I implemented:

- User model
- User registration
- Password hashing using bcrypt
- User login
- JWT token generation
- JWT authentication middleware
- Protected `/me` route
- Authentication testing

Authentication was implemented early because the application needs to know which user is making each request.

**Status:** Completed

**Estimated time:** 1 hour

**Actual time:** 1 hour 15 min

---

## 4. Role-Based Authorization

The application supports two roles:

- Billing Admin
- Account Manager

I added role-based middleware to control access to different backend operations.

I also tested unauthorized operations to make sure users cannot bypass permissions by directly calling the API.

**Status:** Completed

**Estimated time:** 45 min

**Actual time:** 1 hour

---

## 5. Subscription Management

I implemented the main subscription functionality.

This includes:

- Creating subscriptions
- Updating subscriptions
- Viewing subscriptions
- Active and Archived status
- Archiving subscriptions
- Restricting changes to archived subscriptions
- Preventing archived subscriptions from generating new invoices
- Keeping previous invoices available after archiving

**Status:** Completed

**Estimated time:** 1 hour 15 min

**Actual time:** 1 hour 30 min

---

## 6. Collaborators

I added collaborator management for subscriptions.

I implemented:

- Adding collaborators
- Viewing collaborators
- Removing collaborators
- Preventing duplicate collaborators
- Validating subscriptions and users
- Applying authentication and role checks

**Status:** Completed

**Estimated time:** 45 min

**Actual time:** 1 hour

---

## 7. Invoice Management

Invoice management was one of the main parts of the project.

I implemented:

- Invoice creation
- Invoice generation from subscriptions
- Invoice numbers
- Draft, Issued, Paid and Void states
- Draft → Issued → Paid flow
- Draft/Issued → Void flow
- Invoice and subscription relationship
- MongoDB Decimal128 for monetary values
- Validation for invoice operations

**Status:** Completed

**Estimated time:** 2 hours

**Actual time:** 2 hours 15 min

---

## 8. Paid Invoice Protection and Credit Notes

I made paid invoices immutable.

Instead of modifying a paid invoice, corrections are handled through credit notes.

I implemented:

- Credit note creation
- Credit note validation
- Cumulative credit amount validation
- Preventing credits greater than the invoice amount
- Restricting credit notes to paid invoices
- Role-based access for credit notes

This keeps the original paid invoice available as part of the billing history.

**Status:** Completed

**Estimated time:** 1 hour

**Actual time:** 1 hour 15 min

---

## 9. Search, Filters and Pagination

I added invoice listing features to make the invoice registry easier to use.

I implemented:

- Search by invoice number
- Search by customer name
- Search by customer email
- Status filtering
- Date range filtering
- Pagination
- Sorting by issue date
- Backend query handling

**Status:** Completed

**Estimated time:** 1 hour

**Actual time:** 1 hour

---

## 10. Bulk Operations and CSV

I implemented the bulk billing operations required by the project.

This includes:

- Bulk invoice generation
- Checking subscriptions that are due for billing
- Preventing duplicate invoices for the same billing period
- Moving the next billing date forward
- Reporting created, skipped and failed operations
- CSV invoice export
- Applying invoice filters to CSV export

**Status:** Completed

**Estimated time:** 1 hour 15 min

**Actual time:** 1 hour 30 min

---

## 11. Dashboard and Overdue Invoices

I built the dashboard to provide a quick overview of billing activity.

The dashboard includes information such as:

- Total subscriptions
- Invoice information
- Collected revenue
- Receivables
- Overdue invoices
- Invoice status breakdown
- Active plan information
- Revenue information

I also implemented overdue invoice handling.

Overdue invoices are derived from an issued invoice whose due date has passed. I also added dismissible overdue alerts while keeping the alert capable of appearing again if the invoice becomes overdue after its due date changes.

**Status:** Completed

**Estimated time:** 2 hours

**Actual time:** 2 hours 30 min

---

## 12. Frontend

After the backend APIs were working, I connected them with the React frontend.

I implemented:

- Login page
- Registration page
- Dashboard
- Subscription page
- Invoice page
- Navigation/sidebar
- Protected application flow
- Role-based UI
- Invoice actions
- Bulk generation interface
- Overdue alert interface

I focused on keeping the interface clean and practical while making the main billing workflows easy to use.

**Status:** In Progress

**Estimated time:** 3 hours

**Actual time:** 2 hours 30 min

---

## 13. Testing

I tested the important backend and frontend workflows while building the features instead of waiting until the end.

I tested:

- Registration
- Login
- JWT authentication
- Role permissions
- Subscription operations
- Archiving subscriptions
- Invoice creation
- Invoice lifecycle
- Paid invoice protection
- Credit notes
- Search and filters
- Pagination
- Bulk invoice generation
- CSV export
- Overdue invoices
- Overdue alert dismissal
- Error cases

I also tested the application through the frontend after connecting the APIs.

**Status:** In Progress

**Estimated time:** 2 hours

**Actual time:** 1 hour 45 min

---

## 14. Documentation and Deployment

I am completing the project documentation alongside the final development work.

The documentation includes:

- `architecture.md`
- `schema.md`
- `plan.md`
- `decisions.md`
- `ai-prompts.md`
- `Submission.md`

The remaining deployment work includes:

- Deploying the backend
- Deploying the frontend
- Configuring production environment variables
- Connecting the deployed application to MongoDB Atlas
- Testing the live application
- Final GitHub repository check

**Status:** In Progress

**Estimated time:** 2 hours

**Actual time:** 1 hour

---

## What I prioritized when managing time

My main priority was to make the core billing workflow work correctly before spending too much time on visual details.

The priority was:

1. Authentication
2. Role-based authorization
3. Subscription management
4. Invoice generation
5. Invoice lifecycle
6. Paid invoice protection
7. Credit notes
8. Search and filtering
9. Bulk operations
10. Dashboard and frontend
11. Testing
12. Documentation and deployment

I kept animations and unnecessary UI complexity low so that more time could be spent on the actual billing logic and permissions.

---

## Changes During Development

The original development order changed slightly as the project grew.

I initially planned to complete most backend features before starting the frontend. In practice, I started connecting the frontend once the important backend APIs were stable. This helped me find integration issues earlier and allowed me to verify the complete user workflow.

I also added seed data for the Billing Admin and Account Manager accounts to make role-based testing easier.

The main feature priorities remained the same throughout development, with additional time spent on invoice lifecycle rules, credit notes, bulk generation and overdue handling because these were important parts of the billing workflow.