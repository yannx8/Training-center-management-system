# Training Center Management System (TCMS)

A web-based platform for managing vocational training centers.

## Tech Stack
- **Backend:** Node.js, Express, PostgreSQL
- **Frontend:** React (Vite), Standard CSS
- **Authentication:** JWT with multi-role support
- **Security:** Bcrypt hashing, Parameterized SQL

## Key Features
- **Multi-Role Authentication:** Support for Admin, Secretary, HOD, Trainer, Student, and Parent roles.
- **Atomic Student Registration:** Transactional creation of student, parent, and enrollment records.
- **Automated Timetable Generation:** Conflict detection for trainers and rooms.
- **Grade Management:** Trainer-led grade entry with student appeal workflow.
- **Complaint System:** Integrated feedback loops for students and parents.

## Setup Instructions

### Backend
1. Navigate to `backend/`
2. Run `npm install`
3. Create a `.env` file with:
   ```
   DB_USER=your_user
   DB_HOST=localhost
   DB_NAME=tcms
   DB_PASSWORD=your_password
   DB_PORT=5432
   JWT_SECRET=your_secret
   ```
4. Run `node server.js`

### Frontend
1. Navigate to `frontend/`
2. Run `npm install`
3. Run `npm run dev`

### Database
1. Run the `db.sql` script in your PostgreSQL instance.
