# Local Project Setup Guide

This guide provides step-by-step instructions for developers to set up, run, and understand the CodeVector product catalog project locally. 

## 🚀 Prerequisites
- **Node.js** (v18 or higher recommended)
- **MySQL Database** (Hosted or local)
- **Git**

---

## 🛠️ 1. Backend Setup

The backend handles the core logic, including stable cursor-based pagination and asynchronous metadata caching to ensure `COUNT(*)` queries don't slow down the database.

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env` file in the `backend/` directory. Copy the structure from `.env.example`:
   ```env
   DB_HOST=your_mysql_host
   DB_PORT=3306
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_NAME=your_database_name
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   ```
4. **Seed the Database:**
   We use a parallelized seeder to quickly insert 200,000 product rows. 
   ```bash
   node db/seed.js
   ```
   > **Note on Seeding Issues:** If you are using a strictly hosted database (like some versions of Railway), `CREATE INDEX IF NOT EXISTS` might throw a syntax error. Our script gracefully handles this by catching `ER_DUP_KEYNAME` exceptions, ensuring the script runs flawlessly everywhere.
5. **Start the Development Server:**
   ```bash
   npm start
   ```

---

## 🎨 2. Frontend Setup

The frontend is a Vite-powered React application featuring a premium dark-mode aesthetic with custom glassmorphism components (no external UI libraries used).

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env` file in the `frontend/` directory (if you are running the backend on a different port than 3001):
   ```env
   VITE_API_URL=http://localhost:3001
   ```
4. **Start the Vite Development Server:**
   ```bash
   npm run dev
   ```

---

## 🧩 Architectural Highlights

If you plan to modify or extend this project, keep these core principles in mind:

1. **Cursor Pagination:** We explicitly avoid `OFFSET` pagination. If you add new routes, rely on the `cursor.js` utility to encode `created_at` and `id` anchors.
2. **Asynchronous Cache:** The `metadata` table is used to prevent full table scans when fetching total product counts. The backend updates this cache asynchronously *after* serving the request.
3. **CSS Architecture:** We use pure CSS variables in `index.css` for the design system. If you want to change the primary colors, simply update `--bg`, `--surface`, and `--accent` in `index.css`.

## 🐛 Troubleshooting Common Issues

**Issue:** `Error: Access denied for user ''@'localhost'`
**Fix:** This means your `backend/.env` is missing or the backend server was started *before* you created the `.env` file. Stop the backend server (`Ctrl+C`), verify your `.env` credentials, and run `npm start` again.

**Issue:** `ENOTFOUND mysql.railway.internal`
**Fix:** You are trying to connect to a private internal cloud network from your local machine. You must use your provider's "Public TCP Proxy" host and port for local development.

**Issue:** `500 Internal Server Error` on the Frontend
**Fix:** The backend is rejecting the database connection. Check the backend terminal console logs for the exact MySQL error message.
