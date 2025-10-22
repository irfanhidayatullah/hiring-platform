# Job Portal Web Application

## 1. Project Overview
This project is a **Job Portal Web Application** built with **Next.js** and **Supabase**, designed to provide a seamless experience for both jobseekers and administrators.  
- **Admins** can create and manage job postings, configure application form fields (mandatory, optional, or off), and review submitted candidates.  
- **Jobseekers** can browse active job listings and apply through a dynamically generated application form that adapts based on each job’s configuration.  

The platform demonstrates **role-based access control**, **dynamic form rendering**, and **Supabase integration** for authentication, data storage, and file uploads.

---

## 2. Tech Stack Used

**Frontend**
- [Next.js]
- [TypeScript]
- [Tailwind CSS]
- [React Query (TanStack Query)]
- [Formik] + [Yup] for form handling and validation
- [React Toastify] for user notifications
- [Lucide Icons] for clean and consistent icons
- [React Calendar] for date selection

**Backend / Database**
- [Supabase]
  - Authentication (email/password login)
  - PostgreSQL database with Row-Level Security (RLS)
  - File Storage for profile photos (`candidate-photos` bucket)
  - Realtime queries and role-based access policies

**Deployment**
- [Vercel] for frontend deployment  
- [Supabase Cloud] for backend services

---

## 3. How to Run Locally

Follow these steps to run the project on your local machine:

### 1. Clone the Repository
### 2. create .env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

Optional:
If you’re connecting to a new Supabase project, make sure you have the following tables:
#jobs
#job_configs
#candidates
#candidate_attributes
#users

You can refer to the SQL schema included in the /supabase/schema.sql file for structure reference.
### 3. npm i
### 4. npm run dev

