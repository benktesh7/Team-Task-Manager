# TaskFlow — Team Task Manager

A full-stack web app I built for managing team projects and tasks. You can create projects, invite teammates, assign tasks, track progress, and get notified when something's assigned to you. There's also a role system — admins can manage the whole workspace, members just work within their projects.

---

## What it does

- **Projects** — create a project, set a color and deadline, invite people by email
- **Kanban board** — tasks are split into To Do / In Progress / In Review / Done columns
- **Tasks** — assign them to teammates, set priority and due dates, leave comments
- **Dashboard** — see your tasks, what's overdue, what's coming up this week
- **Notifications** — get notified when someone assigns a task to you
- **Role-based access** — admins can manage members and delete anything; members work within their own projects

---

## Tech used

| Part | Stack |
|---|---|
| Backend | Node.js + Express |
| Database | MySQL with Prisma ORM |
| Auth | JWT tokens |
| Frontend | Vanilla HTML, CSS, JavaScript |
| Deploy | Railway |

---

## Running it locally

You'll need Node.js (v18+) and a MySQL server running.

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Then open `.env` and fill in your MySQL connection string:

```
DATABASE_URL="mysql://root:yourpassword@localhost:3306/taskmanager"
JWT_SECRET="make-this-something-long-and-random"
```

Push the database schema:

```bash
npx prisma db push
```

Seed some demo data (optional but recommended):

```bash
node src/seed.js
```

Start the server:

```bash
npm run dev
```

The backend runs at `http://localhost:5000` and also serves the frontend at that same address.

### 2. Frontend

Open `http://localhost:5000` in your browser. That's it — the backend serves the frontend files directly.

If you want to run the frontend separately during development:

```bash
npx serve frontend -p 3000
```

Then the frontend is at `http://localhost:3000` and it'll talk to the API at port 5000.

**Demo accounts (after seeding):**
- Admin: `admin@taskmanager.com` / `admin123`
- Member: `member@taskmanager.com` / `member123`

---

## Deploying to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Add a **MySQL** plugin from the Railway dashboard
4. Copy the `DATABASE_URL` from the MySQL plugin's Connect tab
5. Set these environment variables in your Railway service:

```
DATABASE_URL=      ← from the MySQL plugin
JWT_SECRET=        ← any long random string
NODE_ENV=production
PORT=5000
```

6. Set the **root directory** of the service to `backend`
7. Deploy — Railway will auto-run `npx prisma db push && node src/app.js` on start

The app will be live at your Railway-provided URL. The backend serves the frontend, so there's no separate static hosting needed.

---

## API routes (quick reference)

```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/members
DELETE /api/projects/:id/members/:userId

GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/comments

GET    /api/dashboard
GET    /api/notifications
PATCH  /api/notifications/read-all
```

---

## Project structure

```
Task Manager/
├── backend/
│   ├── prisma/schema.prisma   # MySQL schema
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── app.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── css/style.css
│   ├── js/
│   └── index.html
└── README.md
```
