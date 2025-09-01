# TaskFlow Backend

Express + MongoDB + Mongoose backend for the TaskFlow UI shown in your screenshots.
It includes:

- Authentication with **JWT**, **httpOnly cookies**, **access + refresh token rotation**
- **Register / Login / Logout / Refresh** endpoints
- **Auto-create one Admin** on first server start (`Admin User`, `admin@taskflow.com`, password `admin123`)
- **Tasks CRUD** with status & priority
- **User dashboard** metrics (totals, completion %, priority breakdown, recent tasks)
- **Admin dashboard** (totals/users/tasks/completion rate, system health, recent activity, user management list)
- Profile update & change password
- Admin actions: Make Admin, (De)Activate, Delete user
- Optional demo data seeding

## Quick Start

```bash
cp .env.example .env
# edit MONGO_URI if needed and set JWT secrets to strong random strings

npm install
npm run dev   # nodemon in development
# or
npm start
```

The server listens on `PORT` (default **5000**).

### Default Admin (created once, first run only)

- **Name:** Admin User  
- **Email:** admin@taskflow.com  
- **Password:** admin123

If you delete all admins, the next server start will create the default admin again.

## API Overview

Base path: `/api`

### Auth
- `POST /api/auth/register` – public
- `POST /api/auth/login` – public
- `POST /api/auth/logout` – authenticated (clears cookies, revokes refresh token)
- `POST /api/auth/refresh` – uses refresh cookie to obtain a new access token (rotation)
- `GET /api/auth/me` – authenticated current user

### Profile
- `GET /api/profile` – get own profile
- `PUT /api/profile` – update name or preferences (e.g., darkMode)
- `PUT /api/profile/password` – change password

### Tasks
- `GET /api/tasks` – list (filters: `status`, `priority`, `search`, `sort`, `order`)
- `POST /api/tasks` – create
- `GET /api/tasks/:id` – get one
- `PUT /api/tasks/:id` – update
- `DELETE /api/tasks/:id` – delete
- `DELETE /api/tasks` – delete all (own tasks)
- `GET /api/tasks/summary` – counts for dashboard

### Dashboards
- `GET /api/dashboard/user` – metrics for the signed-in user
- `GET /api/dashboard/admin` – admin-only overview + system health + recent activity
- `GET /api/health` – basic health check

### Admin / User Management
- `GET /api/admin/users` – list users with tasks count, join date, last active (searchable by name/email)
- `PATCH /api/admin/users/:id/make-admin`
- `PATCH /api/admin/users/:id/activate`
- `PATCH /api/admin/users/:id/deactivate`
- `DELETE /api/admin/users/:id`

## Cookies & Tokens

- Cookies: `accessToken`, `refreshToken` (both **httpOnly**; `secure` in production).
- Access token lifetime: `ACCESS_TOKEN_EXPIRES` (default 15m).
- Refresh token lifetime: `REFRESH_TOKEN_EXPIRES` (default 7d).
- **Refresh Token Rotation**: each refresh issues a new refresh token and invalidates the previous one.

## Seeding Demo Data (optional)

Set `SEED_DEMO=true` in `.env` and run the server once, or run:

```bash
npm run seed
```

This creates example users and tasks similar to the screenshots.

---

> **Note**: The API is intentionally simple and opinionated to match the UI in the images; adapt schemas/validations as needed.