# StayBook AI — Full-Stack MERN Hotel Booking Platform

StayBook AI is a production-ready MERN hotel-booking application with a modern Tailwind UI, AI-powered discovery, dual payment rails (Razorpay + Stripe), and role-based operations for guests and administrators.

## Core stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Authentication:** JWT + Google OAuth + optional Firebase Google sign-in
- **Media:** Cloudinary signed upload flow
- **Payments:** Razorpay (primary) + Stripe (optional fallback)
- **Notifications:** Nodemailer transactional emails
- **AI modules:** recommendation engine, smart search, pricing insights, review summarizer, concierge chat

## Feature coverage

### User-side
- Responsive hotel and room listing pages with advanced filters and smart query search
- Voice search (Web Speech API) for hands-free hotel search prompts
- Dynamic date-based pricing during booking
- Razorpay checkout + Stripe checkout + reserve-now-pay-later flow
- Dashboard for bookings, wishlist, profile flows, and AI recommendations
- AI concierge chat for booking assistance and support answers
- Multi-language shell support (English, Hindi, Spanish)

### Admin-side
- Rooms, users, bookings list management
- Analytics dashboard (revenue, booking volume, user/room counts)
- Role management and admin booking cancellation
- Cloudinary upload signature API for secure image management

### AI features
- **AI hotel recommendations** (`/api/ai/recommendations`)
- **Smart natural-language search** (`/api/ai/search`)
- **AI pricing insights** (`/api/ai/pricing/:roomId`)
- **AI review summarizer** (`/api/ai/reviews/:roomId/summary`)
- **AI booking assistant chat** (`/api/chat/messages`)

## Local development

```bash
cd backend && npm install
cd ../frontend && npm install
```

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## Environment variables

### Backend (`backend/.env`)
- `PORT=5000`
- `MONGO_URI=...`
- `JWT_ACCESS_SECRET=...`
- `CORS_ORIGIN=http://localhost:5173`
- `GOOGLE_CLIENT_ID=...`
- `SEED_ADMIN_EMAIL=admin@example.com`
- `EMAIL_HOST=...`
- `EMAIL_PORT=587`
- `EMAIL_USER=...`
- `EMAIL_PASS=...`
- `EMAIL_FROM=...`

#### Razorpay
- `ENABLE_RAZORPAY=true|false`
- `RAZORPAY_KEY_ID=...`
- `RAZORPAY_KEY_SECRET=...`

#### Stripe (optional)
- `ENABLE_STRIPE=true|false`
- `STRIPE_SECRET_KEY=...`
- `STRIPE_WEBHOOK_SECRET=...`
- `STRIPE_CURRENCY=inr`

#### Cloudinary
- `CLOUDINARY_CLOUD_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`

### Frontend (`frontend/.env`)
- `VITE_API_URL=http://localhost:5000`
- `VITE_STRIPE_PUBLISHABLE_KEY=...`
- `VITE_GOOGLE_CLIENT_ID=...`
- `VITE_SOCKET_URL=http://localhost:5000`

#### Firebase (optional)
- `VITE_FIREBASE_API_KEY=...`
- `VITE_FIREBASE_AUTH_DOMAIN=...`
- `VITE_FIREBASE_PROJECT_ID=...`
- `VITE_FIREBASE_APP_ID=...`
