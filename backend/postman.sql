Postman Guide: Testing All Admin Actions

This guide provides a complete workflow for testing all API endpoints from the perspective of an administrator.

Step 1: Setup in Postman
Create Environment: Name it "F&B System".

Add Variable:

baseUrl = http://localhost:5000/api

Select Environment.

Step 2: Admin Registration and Login

To test admin actions, you must first register and log in as an admin to get an authentication token.

A. Register the Admin Account

Method: POST

URL: {{baseUrl}}/auth/register

Body (raw, JSON):

{
    "full_name": "Super Admin",
    "email": "admin@example.com",
    "password": "adminpass456",
    "role": "admin"
}


Send. Expect a 201 Created response.

B. Log In as Admin

Method: POST

URL: {{baseUrl}}/auth/login

Body (raw, JSON):

{
    "email": "admin@example.com",
    "password": "adminpass456"
}


Send. Copy the token from the response body.

Store the Token: Go to your environment variables, create a new variable named admin_token, and paste the token as the value. Save the environment.

Step 3: Authenticated Admin Actions

For all requests in this section, go to the Authorization tab, select Bearer Token, and enter {{admin_token}}.

A. Manage Menu Items (Full CRUD)

This section covers Create, Read, Update, and Delete operations for menu items.

1. Create (POST)

Method: POST

URL: {{baseUrl}}/admin/items

Body (raw, JSON):

{
    "item_name": "Deluxe Pizza",
    "category": "Main Course",
    "price": 550.00,
    "stock": 30
}


Send. Expect a 201 Created response. Copy the item_id from the response and save it as an environment variable for the next steps.

2. Read (GET)

Get All Items:

Method: GET

URL: {{baseUrl}}/items

Send. Expect a 200 OK response with a list of all menu items.

Get Single Item by ID:

Method: GET

URL: {{baseUrl}}/items/{{item_id}}

Send. Expect a 200 OK response with the details of the "Deluxe Pizza".

3. Update (PUT)

Method: PUT

URL: {{baseUrl}}/admin/items/{{item_id}}

Body (raw, JSON):

{
    "item_name": "Supreme Deluxe Pizza",
    "category": "Specials",
    "price": 600.00,
    "stock": 25
}


Send. Expect a 200 OK response.

4. Delete (DELETE)

Method: DELETE

URL: {{baseUrl}}/admin/items/{{item_id}}

Send. Expect a 200 OK response.

B. Manage Staff Accounts

1. Create a Staff Member

Method: POST

URL: {{baseUrl}}/admin/staff

Body (raw, JSON):

{
    "full_name": "John Cashier",
    "email": "john.c@example.com",
    "password": "cashierpass",
    "role": "cashier",
    "shift_schedule": "Mon-Fri 9AM-5PM"
}


Send. Expect a 201 Created response. Copy the staff_id and save it as an environment variable.

2. Get All Staff

Method: GET

URL: {{baseUrl}}/admin/staff

Send. Expect a 200 OK response with a list of all staff members.

3. Update a Staff Member

Method: PUT

URL: {{baseUrl}}/admin/staff/{{staff_id}}

Body (raw, JSON):

{
    "full_name": "Johnathan Cashier",
    "email": "john.cashier@example.com",
    "role": "waiter",
    "shift_schedule": "Mon-Fri 12PM-8PM"
}

Postman Guide: Testing All Customer Actions

This guide provides a complete workflow for testing the API endpoints from the perspective of a customer.

Step 1: Setup in Postman

Create Environment: Name it "F&B System".

Add Variable:

baseUrl = http://localhost:5000/api

Select Environment.

Step 2: Public Actions (No Login Required)

Any potential customer can browse the menu.

View All Menu Items

Method: GET

URL: {{baseUrl}}/items

Send. You should receive a 200 OK status and a list of all menu items with their stock levels.

Step 3: Customer Registration and Login

To place an order, a user must first register and log in.

A. Register a New Customer Account

Method: POST

URL: {{baseUrl}}/auth/register

Body (raw, JSON):

{
    "full_name": "Alice Wonder",
    "email": "alice@example.com",
    "password": "password123",
    "phone": "555-0101",
    "role": "customer"
}


Send. Expect a 201 Created response.

B. Log In as a Customer

Method: POST

URL: {{baseUrl}}/auth/login

Body (raw, JSON):

{
    "email": "alice@example.com",
    "password": "password123"
}


Send. Copy the token from the response body.

Store the Token: Go to your environment variables, create a new variable named customer_token, and paste the token as the value. Save the environment.

Step 4: Authenticated Customer Actions

For all requests in this section, go to the Authorization tab, select Bearer Token, and enter {{customer_token}}.

A. Create an Order

Method: POST

URL: {{baseUrl}}/orders

Body (raw, JSON):

{
    "items": [
        { "item_id": 1, "quantity": 2 },
        { "item_id": 2, "quantity": 1 }
    ]
}

Postman Guide: Testing All Staff Actions

This guide provides a complete workflow for testing the API endpoints from the perspective of a staff member (e.g., waiter, cashier).

Step 1: Setup in Postman

Create Environment: Name it "F&B System".

Add Variable:

baseUrl = http://localhost:5000/api

Select Environment.

Step 2: Prerequisites (Actions by Other Roles)

To test a staff member's duties, we first need an order to work with.

A. Create an Admin and Customer

Follow the previous guides to register and log in as both an Admin and a Customer. Store their tokens in your environment as admin_token and customer_token.

B. Create an Order (as Customer)

Method: POST, URL: {{baseUrl}}/orders

Authorization: Bearer Token {{customer_token}}

Body (raw, JSON):

{
    "items": [
        { "item_id": 1, "quantity": 1 },
        { "item_id": 2, "quantity": 1 }
    ]
}


Send. Expect 201 Created. Copy the order_id from the response and save it as an environment variable.

Step 3: Staff Registration and Login

A staff member cannot create their own account; an admin must do it.

A. Create a Staff Account (as Admin)

Method: POST

URL: {{baseUrl}}/admin/staff

Authorization: Bearer Token {{admin_token}}

Body (raw, JSON):

{
    "full_name": "Wendy Waitress",
    "email": "wendy.w@example.com",
    "password": "waiterpass123",
    "role": "waiter",
    "shift_schedule": "Tue-Sat 5PM-11PM"
}


Send. Expect a 201 Created response.

B. Log In as Staff

Method: POST

URL: {{baseUrl}}/auth/login

Body (raw, JSON):

{
    "email": "wendy.w@example.com",
    "password": "waiterpass123"
}


Send. Copy the token from the response body.

Store the Token: Go to your environment variables, create a new variable named staff_token, and paste the token as the value. Save the environment.

Step 4: Authenticated Staff Actions

For all requests in this section, go to the Authorization tab, select Bearer Token, and enter {{staff_token}}.

A. View All Orders

A staff member's primary task is to see what needs to be done.

Method: GET

URL: {{baseUrl}}/orders

Send. Expect a 200 OK response with a list of all orders from all customers.

B. Update an Order's Status

As the order progresses, the staff updates its status.

Method: PUT

URL: {{baseUrl}}/orders/{{order_id}}/status

Body (raw, JSON):

{
    "status": "preparing"
}


Send. Expect a 200 OK response. You can repeat this step to change the status to "completed", "served", etc.

C. Process a Payment

A cashier or waiter can record a payment for an order.

Method: POST

URL: {{baseUrl}}/payments

Body (raw, JSON):

{
    "order_id": "{{order_id}}",
    "amount": 330.00,
    "payment_method": "Credit Card"
}

D. Verify Security (Forbidden Actions)
Ensure a staff member cannot access admin-only endpoints.

Attempt to create a new menu item:

Method: POST

URL: {{baseUrl}}/admin/items

Body (raw, JSON): { "item_name": "Test Item", "price": 100 }

Send. Expect a 403 Forbidden error with the message "Access forbidden: insufficient privileges".

Attempt to view all staff:

Method: GET

URL: {{baseUrl}}/admin/staff

Send. Expect a 403 Forbidden error. This confirms your role-based security is working correctly.