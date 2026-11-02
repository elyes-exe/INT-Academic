# INT App

INT App is an academic management system for an institute. It provides a dashboard for managing students, staff, classrooms, exams, announcements, and class timetables.

## Features

- Student registration, email verification, and administrator approval
- Student and staff records, classrooms, exams, announcements, and timetables
- Administrator account moderation and account settings
- Optional Google sign-in through Supabase Auth
- English/French interface switch and light/dark theme
- MySQL storage, with the dashboard database and tables created automatically

## Technology

- Next.js 16, React 19, TypeScript, and Tailwind CSS
- MySQL via `mysql2` (works with XAMPP/WampServer)
- Supabase Auth for optional Google sign-in
- Nodemailer or Resend for optional email delivery

The repository also includes a Symfony 6.4 application in `symfony-app/`.

## Run the Next.js app locally

### Requirements

- Node.js and pnpm
- MySQL running locally, such as through XAMPP

From the repository root, install dependencies and create your local environment file:

```powershell
pnpm install
Copy-Item .env.local.example .env.local
```

Edit `.env.local` with your settings. The MySQL defaults target a local XAMPP installation:

```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=int_app
```

Start the development server:

```powershell
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app creates its MySQL database and tables when it first connects.

## Optional services

### Google sign-in

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, enable Google under Supabase Authentication providers, and allow `http://localhost:3000/auth/google/callback` in Supabase's redirect URL settings. Configure the Google OAuth client in the Supabase provider settings.

### Email verification

For actual email delivery, configure either the SMTP variables or the Resend variables in `.env.local`. Without a provider, development verification codes can be shown by the app for local testing.

## Repository layout

- `app/` — Next.js pages and API routes
- `components/` — shared interface components
- `lib/` — authentication, database, and localization helpers
- `scripts/` — database setup scripts
- `symfony-app/` — Symfony 6.4 companion application

## Author

- GitHub: [elyes-exe](https://github.com/elyes-exe)
- Email: [chaouch.elyes@esprit.tn](mailto:chaouch.elyes@esprit.tn)
