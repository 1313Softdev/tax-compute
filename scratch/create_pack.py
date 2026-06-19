import os
import shutil
import zipfile

root_dir = "/Users/kuku/Documents/SOFTWARE/tax-compu"
pack_dir = os.path.join(root_dir, "hostinger-pack")

# 1. Clean up existing pack dir if any
if os.path.exists(pack_dir):
    shutil.rmtree(pack_dir)
os.makedirs(pack_dir)

# Helper to copy directory ignoring node_modules, dist, .next, dev.db etc.
def copy_project_dir(src, dest):
    def ignore_patterns(path, names):
        ignored = []
        for name in names:
            if name in ['node_modules', 'dist', '.next', 'dev.db', '.git', '.DS_Store', 'hostinger-pack']:
                ignored.append(name)
            elif name.endswith('.zip') or name.endswith('.log'):
                ignored.append(name)
        return ignored
    
    shutil.copytree(src, dest, ignore=ignore_patterns)

# 2. Copy the folders
copy_project_dir(os.path.join(root_dir, "shared-engine"), os.path.join(pack_dir, "shared-engine"))
copy_project_dir(os.path.join(root_dir, "backend"), os.path.join(pack_dir, "backend"))
copy_project_dir(os.path.join(root_dir, "web"), os.path.join(pack_dir, "web"))

# 3. Copy root package files
shutil.copy2(os.path.join(root_dir, "package.json"), os.path.join(pack_dir, "package.json"))
shutil.copy2(os.path.join(root_dir, "package-lock.json"), os.path.join(pack_dir, "package-lock.json"))

# 4. Modify schema.prisma to support MySQL
schema_path = os.path.join(pack_dir, "backend", "prisma", "schema.prisma")
with open(schema_path, 'r') as f:
    schema = f.read()

# Replace datasource
schema = schema.replace(
    'provider = "sqlite"',
    'provider = "mysql"'
)

# Replace field types to use Text in MySQL
replacements = {
    'inputsJson        String': 'inputsJson        String   @db.Text',
    'outputsJson       String': 'outputsJson       String   @db.Text',
    'configJson     String': 'configJson     String   @db.Text',
    'content   String': 'content   String   @db.Text',
    'answer    String': 'answer    String   @db.Text'
}

for old, new in replacements.items():
    schema = schema.replace(old, new)

with open(schema_path, 'w') as f:
    f.write(schema)

# Remove SQLite migrations as they are incompatible with MySQL
migrations_dir = os.path.join(pack_dir, "backend", "prisma", "migrations")
if os.path.exists(migrations_dir):
    shutil.rmtree(migrations_dir)

# 5. Create backend .env.example
env_backend = """DATABASE_URL="mysql://db_user:db_password@localhost:3306/db_name"
JWT_SECRET="generate_a_secure_random_secret_here"
PORT=5000
NODE_ENV=production
"""
with open(os.path.join(pack_dir, "backend", ".env.example"), 'w') as f:
    f.write(env_backend)

# 6. Create web .env.example
env_web = """NEXT_PUBLIC_API_URL="http://localhost:5000"
NODE_ENV=production
"""
with open(os.path.join(pack_dir, "web", ".env.example"), 'w') as f:
    f.write(env_web)

# 7. Create DEPLOY.md instructions
deploy_instructions = """# Hostinger Deployment Guide (Next.js + Express.js + MySQL)

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
"""

with open(os.path.join(pack_dir, "DEPLOY.md"), 'w') as f:
    f.write(deploy_instructions)

# 8. Zip the pack folder
zip_path = os.path.join(root_dir, "tax-compu-hostinger.zip")
if os.path.exists(zip_path):
    os.remove(zip_path)

def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, path)
            ziph.write(file_path, arcname)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    zipdir(pack_dir, zipf)

# 9. Clean up the folder
shutil.rmtree(pack_dir)

print(f"Pack successfully created at: {zip_path}")
