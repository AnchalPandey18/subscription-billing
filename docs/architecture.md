# Architecture

## What are the moving pieces, and how do they talk to each other?

The project has three main parts:

- **Frontend:** React, Vite and Tailwind CSS. It provides the UI for login, dashboard, subscriptions, invoices and other billing features.
- **Backend:** Node.js and Express. It handles APIs, authentication, roles and the main billing logic.
- **Database:** MongoDB Atlas. It stores users, subscriptions, invoices, credit notes, collaborators and overdue alerts.

The frontend talks to the backend through REST APIs. The backend uses Mongoose to read and update data in MongoDB.

## Where does each piece run?

While developing, the React frontend runs through Vite, the Express backend runs locally on port `5000`, and the database is hosted on MongoDB Atlas.

The frontend and backend are kept separate so that database access and business rules stay on the server.

## What is the request path for one representative user action, end to end?

For example, when a Billing Admin creates an invoice:

1. The user submits the invoice form in the React application.
2. React sends the request to the Express API with the JWT token.
3. The backend verifies the token and checks the user's role.
4. The invoice controller validates the data and checks the related subscription.
5. Mongoose saves the invoice in MongoDB.
6. The backend returns the result to React, and the invoice list is updated.

## What did you decide not to build, and why?

I did not build a payment gateway, email notifications or a customer self-service portal because they were outside the main assessment requirements.

I also did not add a separate background job system for automatic billing. Instead, I implemented bulk invoice generation for subscriptions that are due.