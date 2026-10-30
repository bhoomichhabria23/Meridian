# Meridian

Meridian is a full-stack healthcare management platform for patients, doctors, and reception staff. It provides role-based dashboards, appointments, medical records, prescriptions, reports, reminders, lab results, and AI-assisted healthcare workflows.

## Features

- Patient, doctor, and receptionist roles
- Authentication with JWT and Firebase/Google sign-in
- Patient medical history, timeline, medications, prescriptions, and reports
- Appointment booking and scheduling
- Doctor dashboards, patient search, safety alerts, and e-prescriptions
- Receptionist workflows for patients, doctors, appointments, and report uploads
- AI-powered assistance and medical report analysis
- Responsive React interface

## Tech Stack

### Frontend

- React 18
- Vite 5
- React Router
- Axios
- Firebase
- Tailwind CSS
- Recharts

### Backend

- Node.js
- Express 5
- MongoDB and Mongoose
- Firebase Admin
- JWT and Passport
- Groq SDK
- SendGrid

## Project Structure

```text
Meridian/
├── client/          # React frontend
├── server/          # Express backend
├── package.json     # Runs the frontend and backend together
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB (local installation or MongoDB Atlas)
- A Firebase project

Optional integrations require their own credentials:

- Groq API
- Google OAuth
- SendGrid

## Setup

1. Clone the repository:

```bash
git clone https://github.com/bhoomichhabria23/Meridian.git
cd Meridian
```

2. Install the root, frontend, and backend dependencies:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

3. Create `server/.env` using the variables below:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/meridian
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development

# Optional integrations
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT=
GOOGLE_APPLICATION_CREDENTIALS=
GROQ_API_KEY=
GROQ_MODEL=mixtral-8x7b-32768
SENDGRID_API_KEY=
```

4. Configure the frontend Firebase values in `client/src/firebase.js`, if required, and optionally create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Run Locally

Start both the frontend and backend from the project root:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Available Scripts

### Root

```bash
npm run dev
```

Runs the frontend and backend concurrently.

### Frontend

```bash
npm run dev --prefix client
npm run build --prefix client
npm run preview --prefix client
```

### Backend

```bash
npm run start --prefix server
```

## Production Notes

- Use HTTPS URLs for `CLIENT_URL` and the frontend API URL in production.
- Store secrets as environment variables or in your hosting provider's secret manager.
- Never commit `.env`, service-account JSON, API keys, or credentials.
- Configure MongoDB network access and Firebase credentials for the deployed environment.

## License

Add a license file before publishing the project under a specific open-source license.
