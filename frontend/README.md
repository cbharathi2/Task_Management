# Task Management Frontend

React + Vite frontend for the Task Management Dashboard.

## Local Development

### Prerequisites
- Node.js 18+
- Backend API running on `http://localhost:5000`

### Setup

1. Install dependencies:
	```bash
	npm install
	```

2. Create local environment file:
	```bash
	cp .env.example .env
	```

3. Start development server:
	```bash
	npm run dev
	```

Frontend runs at `http://localhost:5173`.

## Production Deployment (Vercel)

1. Import repository in Vercel
2. Set **Root Directory** to `frontend`
3. Set environment variable:

	```bash
	VITE_API_BASE_URL=https://<your-backend-domain>/api
	```

4. Deploy

## Build

```bash
npm run build
```

## Notes

- `VITE_API_BASE_URL` is used when defined
- Local fallback API URL is `http://localhost:5000/api`
- Production fallback API URL points to the currently deployed backend
