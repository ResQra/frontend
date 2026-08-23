# ResQra Frontend

React + Vite frontend for ResQra, a flood emergency response system with a resident PWA and a coordinator command console.

## Main Screens

- Resident login with OTP dev flow
- Resident SOS request, status tracking, safety guides, and chat assistant
- Coordinator command console at `/admin`
- Dispatch queue, live map, people signals, team management, public advisories, and ops assistant

## Tech Stack

- React
- Vite
- Tailwind CSS
- Leaflet / React Leaflet
- Lucide icons

## Clone And Run Locally

```bash
git clone https://github.com/ResQra/frontend.git
cd frontend
npm install
cp .env.example .env
npm run dev
```

Local app:

```text
http://localhost:5173
```

If Vite picks another port, use the URL printed in the terminal.

## Environment Variables

Create `.env` from `.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

For local development, this can point to the local FastAPI backend.

For Vercel, set:

```env
VITE_API_BASE_URL=https://your-backend-domain
```

Do not include a trailing slash.

## Backend Dependency

The frontend expects the backend API from:

```text
https://github.com/ResQra/Backend.git
```

The backend must be running before coordinator pages can load queue, teams, map data, advisories, and AI assistant responses.

## Coordinator Login

Coordinator accounts are created in the backend with:

```bash
python scripts/create_admin.py resqra-admin <password> "Control Room"
```

Then open:

```text
/login -> Official
```

After login, coordinators are routed to:

```text
/admin
```

## Build And Check

```bash
npm run build
npm run lint
```

## Vercel Deployment

1. Import `https://github.com/ResQra/frontend.git` into Vercel.
2. Set framework preset to Vite.
3. Set environment variable:

```env
VITE_API_BASE_URL=https://your-aws-backend-domain
```

4. Deploy.
5. Add the Vercel URL to backend `CORS_ORIGINS`.

## Notes

- The app stores JWT session data in browser local storage.
- Maps use OpenStreetMap tiles.
- AI behavior is exposed through backend endpoints, not directly from the frontend.
