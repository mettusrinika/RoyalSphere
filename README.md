# 👑 Royal Sphere — AI-Powered Services Ecosystem

A production-ready marketplace platform connecting customers, vendors, and administrators for event services including photography, decoration, catering, makeup, entertainment, and more.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand, React Query |
| Backend | NestJS, TypeScript, MongoDB Atlas, JWT, Socket.io |
| Payments | Razorpay |
| Storage | Cloudinary |
| Email | Nodemailer (SMTP) |
| AI | Custom recommendation engine (MongoDB-driven) |

---

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone <repo-url>
cd royal-sphere
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
npm install
```

**Required .env values:**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-32-char-secret
JWT_REFRESH_SECRET=your-32-char-refresh-secret
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SMTP_HOST=smtp.gmail.com
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@royalsphere.com
ADMIN_PASSWORD=Admin@Royal2024
```

**Seed database (first run):**
```bash
npx ts-node src/seed.ts
```

**Run backend:**
```bash
npm run start:dev   # Development
npm run build && npm start  # Production
```

Backend runs at: `http://localhost:4000`  
Swagger docs: `http://localhost:4000/api/docs`

---

### 3. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local
npm install
npm run dev
```

**Required .env.local values:**
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_RAZORPAY_KEY=rzp_test_...
```

Frontend runs at: `http://localhost:3000`

---

## 👥 User Roles

| Role | Access | Default Login |
|---|---|---|
| Admin | Full platform control | admin@royalsphere.com / Admin@Royal2024 |
| Vendor | Vendor dashboard (after approval) | Register → Apply → Admin approves |
| Customer | Browse, book, pay, review | Register |

---

## 🗺️ Key Routes

### Public
- `/` — Homepage with featured services
- `/services` — Service search & browse
- `/services/[id]` — Service detail + booking
- `/ai/budget-planner` — AI event budget planner
- `/auth/login` — Login
- `/auth/register` — Register

### Customer Dashboard
- `/dashboard/customer` — Overview
- `/dashboard/customer/bookings` — My bookings
- `/dashboard/customer/payments` — Payment history
- `/dashboard/customer/saved` — Saved services
- `/dashboard/customer/reviews` — My reviews

### Vendor Dashboard
- `/dashboard/vendor` — Overview + revenue chart
- `/dashboard/vendor/services` — Manage services
- `/dashboard/vendor/services/new` — Add service
- `/dashboard/vendor/bookings` — Accept/reject bookings
- `/dashboard/vendor/earnings` — Earnings & payouts
- `/dashboard/vendor/reviews` — Customer reviews

### Admin Dashboard
- `/dashboard/admin` — Platform KPIs
- `/dashboard/admin/applications` — Vendor approval
- `/dashboard/admin/users` — User management
- `/dashboard/admin/bookings` — All bookings
- `/dashboard/admin/payments` — Revenue & commissions
- `/dashboard/admin/categories` — Category management
- `/dashboard/admin/analytics` — Charts & insights
- `/dashboard/admin/services` — All services

---

## 🔄 Core Workflows

### Booking Flow
```
Customer searches → Views service → Creates booking
→ Vendor accepts → Customer pays (Razorpay)
→ Service delivered → Customer reviews
```

### Vendor Onboarding
```
Register → Apply as vendor → Upload documents
→ Admin reviews → Approve/Reject
→ If approved: Vendor dashboard unlocked
```

### Payment Flow (Razorpay)
```
Create Razorpay order → Customer pays
→ Verify signature → Booking confirmed
→ Commission calculated → Vendor payout recorded
```

---

## 🤖 AI Features

| Feature | Description |
|---|---|
| Smart Vendor Recommendations | Score vendors by rating, reviews, bookings, budget fit |
| Service Recommendations | Personalized by booking history & saved services |
| Budget Planner | AI allocates budget by event type, suggests vendors |
| Trending Scores | Auto-updated via booking frequency & conversion rates |

Run trending score update (admin):
```
POST /api/v1/ai/update-trending
```

---

## 📁 Project Structure

```
royal-sphere/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── vendor-applications/
│   │   │   ├── categories/
│   │   │   ├── services/
│   │   │   ├── bookings/
│   │   │   ├── payments/
│   │   │   ├── reviews/
│   │   │   ├── messaging/
│   │   │   ├── notifications/
│   │   │   ├── analytics/
│   │   │   └── ai/
│   │   ├── common/
│   │   └── seed.ts
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/           # Next.js 15 App Router pages
    │   ├── components/    # Reusable UI components
    │   └── lib/           # API, hooks, stores, utils, types
    └── package.json
```

---

## 🚢 Deployment

### Backend (Railway / Render)
1. Set all environment variables
2. Run `npm run build`
3. Start command: `npm run start:prod`

### Frontend (Vercel)
1. Connect GitHub repo
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

---

## 🔐 Security
- JWT + Refresh token rotation
- Bcrypt password hashing (12 rounds)
- Role-based access control on all routes
- Razorpay signature verification
- Input validation on all DTOs
- Rate limiting (100 req/min)
- Helmet.js security headers

---

## 📧 Email Setup (Gmail)
1. Enable 2FA on Gmail
2. Generate App Password: Google Account → Security → App passwords
3. Use app password as `SMTP_PASS`

---

**Built with ❤️ for Royal Sphere**
