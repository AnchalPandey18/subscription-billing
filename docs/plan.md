# Development Plan

## Project

Subscription Billing System

## How I am building the project

I am building the project step by step instead of trying to complete everything at once.

For each major feature, I will first implement it, test it, fix any issues, and then commit the changes to GitHub. This will also help me keep track of my progress.

My basic workflow is:

1. Decide what feature I need to build
2. Implement it
3. Test it
4. Fix errors if there are any
5. Update the documentation when needed
6. Commit the changes
7. Push the changes to GitHub
8. Move to the next feature

---

## 1. Project Setup

First, I set up the basic project structure.

I worked on:

- Creating the React frontend using Vite
- Creating the Node.js/Express backend
- Setting up ES Modules
- Installing the required backend packages
- Creating folders for controllers, models, routes, middleware and configuration
- Creating the documentation files
- Setting up Git and GitHub

**Status:** Completed

**Estimated time:** 30 min

**Actual time:** 50 min

---

## 2. MongoDB Setup

After setting up the backend, I connected the application with MongoDB Atlas.

I worked on:

- Creating the MongoDB connection
- Adding the MongoDB connection string to `.env`
- Keeping sensitive information out of GitHub
- Testing whether the backend can connect to MongoDB

**Status:** Completed

**Estimated time:** 20min

**Actual time:** 30 min

---

## 3. Authentication

Next, I worked on user authentication.

I implemented:

- User model
- User registration
- Password hashing using bcrypt
- User login
- JWT token generation
- JWT authentication middleware
- Protected `/me` route
- Testing registration and login APIs

The reason I implemented authentication before the main billing features is that the application needs to know which user is making a request.

**Status:** Completed

**Estimated time:** 

**Actual time:** ___

---

## 4. Role-Based Authorization

The application has two main roles:

- Billing Admin
- Account Manager

I will implement role-based middleware so that the backend can decide whether a user is allowed to perform a particular operation.

I will also test that users cannot access operations that are not allowed for their role.

**Status:** In Progress

**Estimated time:** ___

**Actual time:** ___

---

## 5. Subscription Management

After authentication and authorization, I will work on subscriptions.

I plan to implement:

- Subscription model
- Creating subscriptions
- Updating subscriptions
- Subscription status
- Archiving subscriptions
- Making sure archived subscriptions do not create new invoices
- Keeping old invoices available even after a subscription is archived

**Status:** Not Started

**Estimated time:** ___

**Actual time:** ___

---

## 6. Collaborators

Next, I will add collaborator functionality.

I will work on:

- Adding collaborators
- Connecting collaborators with the required accounts/subscriptions
- Applying the required permissions
- Testing collaborator access

**Status:** Not Started

**Estimated time:** ___

**Actual time:** ___

---

## 7. Invoice Management

This will be one of the main parts of the project.

I will implement:

- Invoice model
- Invoice creation
- Invoice generation from subscriptions
- Invoice status
- Draft → Issued → Paid flow
- Draft/Issued → Void flow
- Relationship between invoices and subscriptions
- Using MongoDB Decimal128 for money values

**Status:** Not Started

**Estimated time:** ___

**Actual time:** ___

---

## 8. Paid Invoice Protection and Credit Notes

I will make sure that a paid invoice cannot simply be edited or deleted.

For corrections to paid invoices, I will use credit notes instead of changing the original financial record.

I will also make sure that the invoice history remains available for auditing.

**Status:** Not Started

**Estimated time:** ___

**Actual time:** ___

---

## 9. Search, Filters and Pagination

Once the main billing features are working, I will add:

- Search
- Filters
- Pagination
- Appropriate database queries

I will also consider how these queries will behave when the amount of data becomes much larger.

**Status:** Not Started

**Estimated time:** ___

**Actual time:** ___

---

## 10. Bulk Operations and CSV

I will then work on the bulk operations required by the assessment.

This includes:

- Bulk invoice generation where required
- CSV export
- Validation
- Error handling

**Status:** Not Started

**Estimated time:** ___

**Actual time:** ___

---

## 11. Dashboard and Overdue Invoices

After the core billing functionality is complete, I will build the dashboard.

The dashboard will show useful information such as:

- Subscriptions
- Invoices
- Paid invoices
- Overdue invoices
- Other important billing information

I will also add overdue invoice alerts where required.

**Status:** Not Started

**Estimated time:** ___

**Actual time:** ___

---

## 12. Frontend

After the backend APIs are working properly, I will connect them with the React frontend.

I will build:

- Login page
- Registration page
- Dashboard
- Subscription pages
- Invoice pages
- Required forms
- Protected routes
- Role-based UI

I will keep the UI simple and focus first on making the main workflows work correctly.

**Status:** Not Started

**Estimated time:** ___

**Actual time:** ___

---

## 13. Testing

Before deployment, I will test the complete application.

I will test:

- Registration
- Login
- JWT authentication
- Role permissions
- Subscription operations
- Invoice creation
- Invoice status changes
- Paid invoice immutability
- Credit notes
- Search and filters
- Pagination
- Bulk operations
- Error cases

I will fix important issues found during testing.

**Status:** Not Started

**Estimated time:** ___

**Actual time:** ___

---

## 14. Documentation and Deployment

At the end, I will complete the remaining documentation and deploy the application.

I will complete:

- `architecture.md`
- `schema.md`
- `plan.md`
- `decisions.md`
- `ai-prompts.md`
- `Submission.md`

I will then:

- Deploy the backend
- Deploy the frontend
- Configure production environment variables
- Connect the deployed application to MongoDB Atlas
- Test the live application
- Check the GitHub repository before submission

**Status:** Not Started

**Estimated time:** ___

**Actual time:** ___

---

## What I will prioritize if I run short on time

My first priority will be getting the main billing workflow working correctly.

The most important features are:

1. Authentication
2. Role-based authorization
3. Subscription management
4. Invoice generation
5. Invoice lifecycle
6. Paid invoice protection
7. Core frontend
8. Database integration
9. Testing
10. Deployment

I will give less priority to things like animations and extra UI styling if there is not enough time.

---

## Changes During Development

I will update this section if my actual development process or build order changes while working on the project.