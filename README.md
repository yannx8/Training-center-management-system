# Training Center Management System (TCMS) 
 
A comprehensive full-stack application for managing vocational training centers with multi-role access control. 
 
## Features 
 
- **Multi-Role System**: Admin, HOD, Trainer, Secretary, Student, Parent 
- **Academic Management**: Programs, courses, certifications, timetables 
- **User Management**: Role-based access with multiple roles per user 
- **Scheduling**: Automated timetable generation with conflict detection 
- **Grading**: Grade entry with complaint/appeal system 
- **Parent Portal**: Monitor children's progress and submit complaints 
 
## Tech Stack 
 
### Backend 
- Node.js with Express 
- PostgreSQL database 
- JWT authentication 
- bcrypt password hashing 
 
### Frontend 
- React 19 with Vite 
- React Router for navigation 
- Axios for API communication 
- CSS modules for styling 
 
## Project Structure 
 
``` 
training-center-management-system/ 
ÃÄÄ backend/          # Node.js/Express API 
ÃÄÄ frontend/         # React 19 application 
ÀÄÄ database/         # SQL schema and seed data 
``` 
 
## Getting Started 
 
### Prerequisites 
- Node.js (v18+) 
- PostgreSQL (v14+) 
- Git 
 
### Backend Setup 
 
```bash 
cd backend 
npm install 
# Create .env file based on .env.example 
npm run dev 
``` 
 
### Frontend Setup 
 
```bash 
cd frontend 
npm install 
npm run dev 
``` 
 
### Database Setup 
 
1. Create PostgreSQL database 
2. Run `database/db.sql` to create schema and seed data 
 
## Default Credentials 
 
| Role | Email | Password | 
|------|-------|----------| 
| Admin | admin@center.com | admin1234 | 
 
Other demo accounts use: `password123` 
 
## License 
 
ISC 
