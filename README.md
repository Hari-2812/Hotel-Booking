# StayBook AI

StayBook AI is an upgraded MERN hotel-booking platform with a modern responsive UI, AI-assisted discovery flows, secure payments, role-based administration, and deployment-ready configuration.

## What is included

### Frontend
- React + Vite SPA with responsive Tailwind-based UI
- Lazy-loaded routes and skeleton states
- Smart natural-language hotel search
- Personalized dashboard, wishlist, review flows, and AI concierge chat
- Stripe checkout integration
- Optional Google Identity sign-in using environment configuration

### Backend
- Express + MongoDB REST API
- JWT authentication with role-based access control
- Optional Google OAuth token login flow
- AI recommendation/search/pricing insight endpoints powered by heuristic matching
- Stripe payment intents + confirmation webhook support
- Admin analytics for bookings, revenue, rooms, and users
- Booking cancellation and modification support

## Folder structure

```text
backend/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    services/
frontend/
  src/
    components/
    context/
    pages/
    services/
```

## Local development

### 1) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Configure environment variables

Copy the example files and fill in your secrets.

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3) Run the backend

```bash
cd backend
npm run dev
```

### 4) Run the frontend

```bash
cd frontend
npm run dev
```

## Environment variables

### Backend (`backend/.env`)
- `PORT=5000`
- `MONGO_URI=your_mongodb_connection_string`
- `JWT_ACCESS_SECRET=your_jwt_secret`
- `CORS_ORIGIN=http://localhost:5173`
- `ENABLE_STRIPE=true|false`
- `STRIPE_SECRET_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`
- `STRIPE_CURRENCY=usd`
- `GOOGLE_CLIENT_ID=your_google_oauth_client_id`
- `SEED_ADMIN_EMAIL=admin@example.com`
- `EMAIL_HOST=...`
- `EMAIL_PORT=587`
- `EMAIL_USER=...`
- `EMAIL_PASS=...`
- `EMAIL_FROM=...`

### Frontend (`frontend/.env`)
- `VITE_API_URL=http://localhost:5000`
- `VITE_STRIPE_PUBLISHABLE_KEY=...`
- `VITE_GOOGLE_CLIENT_ID=...`
- `VITE_SOCKET_URL=http://localhost:5000`

## Deployment notes

### Frontend → Vercel
- Set the frontend environment variables in the Vercel dashboard.
- Ensure `VITE_API_URL` points to the deployed backend.

### Backend → Render
- Deploy the `backend` folder as a Node service.
- Add MongoDB, JWT, Stripe, email, and Google OAuth variables in Render.
- Set `CORS_ORIGIN` to your Vercel domain.

## AI features overview

- **Recommendations:** ranks hotels by budget, amenities, guest capacity, ratings, and prior user behavior.
- **Smart search:** parses natural language phrases into filters and relevance scoring.
- **Pricing insights:** compares a hotel against nearby inventory and suggests booking timing.
- **AI concierge:** responds to support-style prompts about bookings, payments, and policies.
- **Personalized dashboard:** combines recent searches, booking history, and recommendations.

## Suggested production follow-ups

- Add automated tests for booking, auth, and AI routes.
- Persist analytics snapshots for long-term trend reporting.
- Add image upload storage (S3/Cloudinary) instead of direct URLs.
- Add refund orchestration for Stripe cancellations.
- Add dedicated websocket rooms for live admin and inventory updates.
