Team Task Manager (TaskFlow)

Hey there! This is a full-stack web application I built to help teams manage their projects and track tasks easily. I designed it to be a clean, functional Kanban-style board where you can invite teammates, assign tasks, and keep track of who is doing what.

I built this project to demonstrate my full-stack skills, from designing the relational database to building out the API and connecting it to a responsive vanilla JavaScript frontend. 

Features
- Project Workspaces: Create projects, set deadlines, and invite team members using their email.
- Kanban Task Board: Move tasks across To Do, In Progress, In Review, and Done columns.
- Task Assignments: Assign tasks to specific teammates, set priorities, and add comments.
- Role-Based Access (RBAC): 
  - Admins have full control over the workspace (can delete projects, manage users).
  - Members can only interact with projects they've been invited to.
- Real-Time Dashboard: Get a quick overview of pending tasks, overdue items, and upcoming deadlines.
- Notifications: An in-app bell notification system alerts you when you get assigned a new task.

Tech Stack
Here's the technology I used to put this together:
- Backend: Node.js with Express.js
- Database: MySQL, managed using Prisma ORM
- Authentication: JWT (JSON Web Tokens) for secure, stateless sessions
- Frontend: Pure HTML, CSS, and Vanilla JavaScript (No heavy frameworks, keeps it fast and simple)
- Deployment: Hosted live on Railway

Live Demo
You can check out the live version of the project here: 
https://taskflow-production-f5cd.up.railway.app

(Feel free to create your own account or use the demo accounts if seeded.)

How to Run It Locally
If you want to run this code on your own machine, follow these steps. You will need Node.js (v18+) and a local MySQL server installed.

1. Database & Backend Setup
First, install the dependencies from the root of the project:
npm install

Next, duplicate the .env.example file inside the backend folder and name it .env. Update it with your local MySQL database credentials:
DATABASE_URL="mysql://root:yourpassword@localhost:3306/taskmanager"
JWT_SECRET="your-secret-key-here"
PORT=5000

Now, push the database schema to your local MySQL instance:
npm run db:push

(Optional) I highly recommend seeding the database to get some dummy data and default accounts (Admin and Member):
npm run db:seed

Finally, start the local development server:
npm start

2. Frontend Access
The backend Express server automatically serves the frontend static files. Just open your browser and go to:
http://localhost:5000

Deployment
I've configured this project to be incredibly easy to deploy using Railway. Because I optimized the root package.json, it is practically a one-click deployment.

1. Connect your GitHub repository to a new Railway project.
2. Add a MySQL database plugin to the Railway project.
3. In your web service variables, set DATABASE_URL (using the Railway MySQL reference) and generate a JWT_SECRET.
4. Railway will automatically detect the Node.js environment, install the backend dependencies, run npx prisma db push to migrate the database, and start the app. No custom root directory configuration needed!

Code Structure
Task Manager/
├── backend/
│   ├── prisma/              # Database schema and migrations
│   ├── src/
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth & validation checks
│   │   ├── routes/          # API endpoints
│   │   └── app.js           # Express server setup
│   └── package.json
├── frontend/
│   ├── css/
│   ├── js/                  # API client and UI logic
│   └── index.html           # Main SPA entry point
├── package.json             # Root config for easy deployment
└── railway.toml             # Railway deployment settings

Thanks for checking out my project!
