# Schema

The application uses MongoDB with Mongoose. The main collections are Users, Subscriptions, Invoices, Credit Notes, Collaborators and Overdue Alerts.

## Collections and fields

### Users

- `_id` - ObjectId
- `name` - String
- `email` - String, unique
- `password` - String (hashed)
- `role` - String: Billing Admin or Account Manager
- `isActive` - Boolean
- `createdAt`, `updatedAt` - Dates

### Subscriptions

- `_id` - ObjectId
- `customerName` - String
- `customerEmail` - String
- `planName` - String
- `amount` - Decimal128
- `currency` - String
- `billingCycle` - Monthly or Yearly
- `startDate` - Date
- `nextBillingDate` - Date
- `status` - Active or Archived
- `archivedAt` - Date
- `createdBy` - ObjectId referencing User
- `createdAt`, `updatedAt` - Dates

### Invoices

- `_id` - ObjectId
- `invoiceNumber` - String, unique
- `subscriptionId` - ObjectId referencing Subscription
- `customerName` - String
- `customerEmail` - String
- `amount` - Decimal128
- `currency` - String
- `issueDate` - Date
- `dueDate` - Date
- `status` - Draft, Issued, Paid or Void
- `paidAt` - Date
- `voidedAt` - Date
- `createdBy` - ObjectId referencing User
- `createdAt`, `updatedAt` - Dates

### Credit Notes

- `_id` - ObjectId
- `creditNoteNumber` - String, unique
- `invoiceId` - ObjectId referencing Invoice
- `amount` - Decimal128
- `reason` - String
- `createdBy` - ObjectId referencing User
- `createdAt`, `updatedAt` - Dates

### Collaborators

- `_id` - ObjectId
- `subscriptionId` - ObjectId referencing Subscription
- `userId` - ObjectId referencing User
- `addedBy` - ObjectId referencing User
- `createdAt`, `updatedAt` - Dates

A unique index on `subscriptionId + userId` prevents adding the same user twice to one subscription.

### Overdue Alerts

- `_id` - ObjectId
- `invoiceId` - ObjectId referencing Invoice
- `dismissedBy` - ObjectId referencing User
- `dismissedAt` - Date
- `dueDateAtDismissal` - Date
- `createdAt`, `updatedAt` - Dates

A unique index on `invoiceId + dueDateAtDismissal` allows an alert to appear again if the invoice gets a new overdue due date.

## Relationships

The main relationships are:

- One **User** can create many Subscriptions and Invoices.
- One **Subscription** can have many Invoices.
- One **Invoice** can have many Credit Notes.
- One **Subscription** can have many Collaborators.
- Users and Subscriptions have a **many-to-many relationship** through the Collaborators collection.
- One **Invoice** can have overdue-alert records for different due dates.

## Database constraints vs application code

I used database-level constraints for things that should always be unique or have a fixed structure, such as:

- Unique user email
- Unique invoice number
- Unique credit note number
- Unique subscription-user collaborator pair
- Required fields
- Allowed values for roles and statuses

Business rules are mainly handled in application code. For example, the backend checks invoice status transitions, prevents invoices for archived subscriptions and makes sure total credit notes do not exceed the invoice amount.

I kept these rules in the application because they depend on the current business operation rather than being simple field-level constraints.

## What did you deliberately denormalise?

Invoice data stores the customer's name, email, amount and currency even though the invoice is linked to a subscription.

I did this intentionally because an invoice represents what was billed at that time. If the subscription details change later, old invoices should still show their original billing information.

## What would break first with 100x the data?

The first areas I would expect to need improvement are large invoice searches, dashboard calculations and overdue-alert checking.

At a much larger scale, I would add more indexes, optimise dashboard aggregation queries and avoid checking overdue alerts one invoice at a time. I would also consider background jobs for bulk billing and overdue processing.