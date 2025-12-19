#  Celestia Hotel - Food & Beverage Management System

A comprehensive web application designed to manage the Food & Beverage operations of a hotel. This system handles Ordering (Dine-in, Room Service, Walk-in), Point of Sale (POS), Inventory Management (with "Low Stock" alerts), Kitchen Management, and Analytics.

---



https://github.com/user-attachments/assets/a0c55cf4-8e1f-4db7-a188-6e71ed571909


##  Tech Stack

* **Frontend:** React.js, Tailwind CSS, Recharts (for Analytics)
* **Backend:** Node.js, Express.js
* **Database:** Clever Cloud MySQL
* **Tools:** VS Code, Git
* **Deployment:** Render

---

##  Prerequisites

Before running the system, please ensure you have the following installed:

1. **Node.js** (v14 or higher) - [Download Here](https://nodejs.org/)
2. **Clever Cloud Server** (Since the system is using centralized database)
---

##  Installation & Setup Guide

### 1. Database Setup

1. Open and login to Clever Cloud MySQL.
2. Create a new database (e.g., `food_beverage_db`).
3. Import the provided SQL dump file (located in `/database/db_schema.sql` or similar path) into the new database.



### 2. Backend Configuration

1. Open a terminal and navigate to the backend folder:
```bash
cd backend

```


2. Install dependencies:
```bash
npm install

```


3. Create a `.env` file in the `backend` folder and add your database configuration (replace this with our .env file that we upload):
```env
PORT=21917
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=food_beverage_db
JWT_SECRET=your_secret_key_here

```


4. Start the Backend Server:
```bash
npm start

```


*You should see: ` Server running on http://localhost:21917*`

### 3. Frontend Configuration

1. Open a **new** terminal window (keep the backend running).
2. Navigate to the frontend folder:
```bash
cd frontend

```


3. Install dependencies:
```bash
npm install

```


4. Start the Frontend:
```bash
npm run dev
# OR (depending on your setup)
npm start

```


5. Open the link provided in the terminal (usually `http://localhost:5173` or `http://localhost:3000`) in your browser.

---

##  Key Features to Test

1. **Analytics Dashboard:**
* View Sales Trends graphs (uses real-time data).
* Filter by "Room Service" or "Dine-in" to see dynamic data changes.
* Check "Top Selling Items" (ranked by quantity sold).


2. **Inventory Management:**
* Go to "Inventory Logs".
* Add a new ingredient.
* **Test Feature:** Select "grams" (g) as the unit, and note how the system automatically suggests a high reorder point (1000g).
* Try adjusting stock to see the status change from "Good" to "Low Stock".


3. **Order Management:**
* Create orders for different types (Room Dining vs. Walk-in).
* Verify they appear correctly in the Kitchen View.


# 🚀 Production Deployment Guide
Follow these steps to deploy the application to production using Render.
 
### Step 1: Push Code to GitHub
Open your `terminal` in the project folder and run the following commands to push your code:

1. Initialize a new git repository
```bash
git init

```

2. Stage all files
```bash
git add .

```

3. Commit the files
```bash
git commit -m "Ready for production"

```

4. Link to your GitHub repository
```bash
git remote add origin https://github.com/your-github-name/Food-and-Beverages-System.git

```

5. Push to the master branch
```bash
git push -u origin master

```

### Step 2: Create a Render Account
1. Go to Render.com.
 ![Image Alt](https://github.com/AdamCutie/Food-and-Beverages-System/blob/2e2b99120938e640b0a69121a78222cf544fbce9/image/render.png)
2. Sign up using your GitHub account (recommended for easy integration).
 ![Image Alt](https://github.com/AdamCutie/Food-and-Beverages-System/blob/abe507eff7421484b5de48c84d218c43412bf335/image/create.png)
### Step 3: Create a New Web Service
1. On the Render Dashboard, click New + and select Web Service.
 ![Image Alt](https://github.com/AdamCutie/Food-and-Beverages-System/blob/abe507eff7421484b5de48c84d218c43412bf335/image/add.png)
2. Select the Food-and-Beverages-System repository from the list.
 ![Image Alt](https://github.com/AdamCutie/Food-and-Beverages-System/blob/a4fce56a4673ecb2b23e9863915e424078486075/image/select.png)
### Step 4: Configure the Service
Fill in the `deployment` details exactly as below to match the `package.json` configuration:

 ![Image Alt](https://github.com/AdamCutie/Food-and-Beverages-System/blob/abe507eff7421484b5de48c84d218c43412bf335/image/command.png)
 
1. Name: food-and-beverages-system

2. Region: Select your closest region (e.g., Singapore).

3. Branch: master

4. Root Directory: (Leave blank)

5. Runtime: Node

6. Build Command: npm run build

7. tart Command: npm run start

8. Instance Type: Free



### Step 5: Environment Variables
You must manually add your environment variables in the Environment tab on Render. The app will not connect to the `database` without these.

Scroll down to Environment Variables.

![Image Alt](https://github.com/AdamCutie/Food-and-Beverages-System/blob/abe507eff7421484b5de48c84d218c43412bf335/image/.env.png)

Add the following keys (copy values from your local `.env`):
```env
DB_HOST=• • • • • • • • • • • •
DB_NAME=• • • • • • • • • • • •
DB_PASSWORD=• • • • • • • • • • • •
DB_USER=• • • • • • • • • • • •
DEV_MODE=• • • • • • • • • • • •
FRONTEND_URL=• • • • • • • • • • • •
JWT_SECRET=• • • • • • • • • • • •
PAYMONGO_PUBLIC_KEY=• • • • • • • • • • • •
PAYMONGO_SECRET_KEY=• • • • • • • • • • • •
PAYMONGO_WEBHOOK_SECRET=• • • • • • • • • • • •
PORT=• • • • • • • • • • • •
VITE_API_URL=• • • • • • • • • • • •

```

### Step 6: Deploy
1. Click Create Web Service.

2. Render will start building your app. You can view the progress in the "Logs" tab.

3. Once the logs say `"Your service is live"`, your application is accessible via the provided Render URL.
![Image Alt](https://github.com/AdamCutie/Food-and-Beverages-System/blob/abe507eff7421484b5de48c84d218c43412bf335/image/deploy.png)

---

##  Troubleshooting

* **"Connection Refused" Error:**
* Check if the `.env` file in the backend folder has the correct database password.


* **Charts not loading:**
* Ensure the backend is running on port `21917`.
* If using Chrome, check the Developer Console (F12) > Network tab to ensure requests to `localhost:21917` are succeeding.

