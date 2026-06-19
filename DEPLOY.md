# Hostinger Deployment Guide (Next.js + Express.js + MySQL)

This bundle contains the complete source code for the Tax Computation Portal configured to run with a **MySQL** database.

## Prerequisites
- Node.js (v18 or v20 recommended) installed on your Hostinger account/server.
- A MySQL database created via your Hostinger control panel.

---

## Step 1: Set Up the Database
1. Go to your Hostinger MySQL Databases section and create a new database. Note the following credentials:
   - **Database Name** (e.g., `u123456789_taxdb`)
   - **Database User** (e.g., `u123456789_taxuser`)
   - **Password**
   - **Host** (usually `localhost` or a specific IP/domain provided by Hostinger)

---

## Step 2: Configure Environment Variables
1. Rename `backend/.env.example` to `backend/.env` and configure your database URL:
   ```
   DATABASE_URL="mysql://u123456789_taxuser:yourpassword@localhost:3306/u123456789_taxdb"
   JWT_SECRET="choose_a_secure_jwt_secret_phrase"
   PORT=5000
   NODE_ENV=production
   ```
2. Rename `web/.env.example` to `web/.env` and update the backend URL if your domain name is different:
   ```
   NEXT_PUBLIC_API_URL="http://yourdomain.com:5000"
   ```

---

## Step 3: Install Dependencies
1. Open a terminal (SSH connection to your Hostinger hosting/VPS) and navigate to the project root directory.
2. Install the workspaces dependencies by running:
   ```bash
   npm install --production=false
   ```

---

## Step 4: Initialize the Database (Prisma)
1. Run the following command inside the root folder to push the Prisma schema and create the tables inside your MySQL database:
   ```bash
   npx prisma db push --schema=backend/prisma/schema.prisma
   ```
2. (Optional) Run the database seed script to populate default data (like FAQs, admin users, or blog posts if applicable):
   ```bash
   npx ts-node backend/prisma/seed.ts
   ```

---

## Step 5: Build the Applications
Build the shared library and the Next.js frontend for production:
```bash
# Build Next.js frontend
npm run build --workspace=web
```

---

## Step 6: Running the Server
On Hostinger VPS or Node.js hosting:
1. **Run Backend**: Start the Express server. In production, it is recommended to run it using a process manager like `pm2`:
   ```bash
   # Start backend
   npx pm2 start backend/src/server.ts --name tax-backend
   ```
2. **Run Frontend**: Start the Next.js production server:
   ```bash
   npx pm2 start "npm run start --workspace=web" --name tax-frontend
   ```
