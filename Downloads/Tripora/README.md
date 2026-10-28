# Tripora — Immersive 3D Travel Platform

A modern, high-performance travel booking application featuring interactive 3D-inspired storytelling, multi-service search (Flights, Hotels, Packages, Buses, Trains, Cabs, Activities), wishlist management, a template-based trip planner, a 3-step checkout flow, and role-based portals for **Customers**, **Administrators**, and **Travel Partners / Vendors**.

---

## 🚀 Quick Start

Open `index.html` directly in any modern web browser, or serve it using any local HTTP server:

```bash
# Using Python
python -m http.server 3000

# Using Node.js
npx serve .
```

---

## 🔑 Demo Accounts & Test Credentials

Tripora comes pre-seeded with three verified demo accounts. You can sign in using the **Log in** button in the navigation bar, select the respective portal, or click the **1-Click Fill** pills in the login modal:

| Portal | Role | Email | Password | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | `customer` | `alex@example.com` | `secret123` | Booking management, wishlist, traveller profile |
| **Admin Portal** | `admin` | `admin@tripora.com` | `admin123` | Platform oversight, metrics, partner approvals, settings |
| **Partner Portal** | `partner` | `vendor@tripora.com` | `vendor123` | Hotel & tour listings, pricing, guest reservations, payouts |

---

## 🛠️ Architecture & Key Features

### 1. Robust Authentication & Route Protection
- **Separated Portals**: Individual login flows for Customer, Admin, and Partner.
- **Role Verification**: Prevents credential misuse across portals (e.g., Customer credentials cannot access the Admin Portal; informative error messages guide the user).
- **Route Guards**: Direct navigation or programmatic calls to `adminPanel` or `partnerPanel` enforce strict user role checks. Unauthorized attempts trigger access-denied warnings and redirect to safe views.
- **Session Persistence**: Sessions are saved locally (`localStorage`) without storing plaintext passwords.

### 2. Administrator Dashboard (`Admin Control Center`)
- **Dashboard Overview**: Summary cards for Total Bookings, Registered Travellers, Active Partners, Pending Approvals, and estimated GMV.
- **Booking Management**: Real-time search by booking ID, traveller name, or service title with cancellation actions.
- **User Management**: View registered platform users, roles, and status.
- **Partner Management**: Review and approve/reject pending vendor applications.
- **Destination Management**: Add new destinations with live previews and delete existing ones.
- **Travel Service Management**: View all listed hotels and toggle active/inactive status.
- **Concierge Support Desk**: Track incoming tickets, view urgency, and resolve inquiries.
- **Global Settings**: Configure commission rate, emergency hotline, support email, and maintenance mode.

### 3. Partner / Vendor Hub (`Partner & Vendor Hub`)
- **Business Overview**: Active properties count, total guest bookings, pending inquiries, and net payouts.
- **My Listings**: Manage property inventories with status badges (Active/Inactive).
- **Add New Listing**: Comprehensive form to publish new hotels, tours, or activities to Tripora's catalogue.
- **Manage Bookings**: View guest reservations, guest contact info, and manage check-ins or cancellations.
- **Pricing & Availability**: Adjust seasonal nightly rates and promotional discounts with instant feedback.
- **Earnings & Payouts**: Review available balances, payout history, and initiate demo bank transfers.
- **Guest Reviews**: Inspect traveller feedback and reply directly to guest reviews.
- **Business Profile**: Update company name, representative, phone, and verification badges.

### 4. Interactive Customer Travel Experience
- **3D Airplane & Curved Flight Trail Animation**: Lightweight, cute 3D-style white airliner flying along a glowing curved lavender and light-blue route with soft drifting clouds, radar destination pin, twinkling sparkles, GSAP ScrollTrigger trajectory progression, and subtle mouse-responsive parallax.
- **Hero & Search Widget**: Tabbed trip search across 7 travel categories with date pickers, traveller steppers, and origin/destination swap.
- **Interactive Storytelling**: Scroll-driven route showcase powered by GSAP and ScrollTrigger.
- **Curated Destination Rail**: Dynamic destination cards with interactive wishlist hearts.
- **Itinerary Builder**: Fast trip outlines with customizable duration, budget, and travel style.
- **3-Step Checkout Flow**: Review -> Traveller Details -> Simulated Confirmation with generated references (e.g. `TR-892410`).
- **Multi-Currency Converter**: Real-time currency conversions across USD, EUR, INR, and GBP.

### 5. Nova AI — Intelligent Travel Companion
- **Floating AI Trigger**: Luxury circular glowing button in the bottom-right corner ("Ask Nova AI") with smooth pulse animations.
- **Interactive Chat Interface**: Sleek dark-mode dialog with real-time typing indicators, suggestions, and conversation memory.
- **Natural Language Capabilities**:
  - **Destination Discovery**: Analyzes travel style, budget, and weather to recommend destinations.
  - **Custom Itineraries**: Generates 3-day, 5-day, or 7-day day-by-day plans (Morning, Afternoon, Evening, Local Cuisine).
  - **Budget Planning**: Itemized breakdowns for Lodging, Transit, Dining, and Sightseeing.
  - **Listing Recommendations**: Direct links and interactive cards to Tripora hotels, packages, and flights.
  - **Copy Itinerary**: One-click button to copy structured itinerary plans to the clipboard.
- **Backend Architecture**:
  - `POST /api/chat` endpoint on `server.js`.
  - **Zero-Config Smart Engine**: Works out-of-the-box in demo mode without requiring an API key.
  - **Live LLM Support**: Connects to Google Gemini or OpenAI when `AI_API_KEY` is provided in `.env` (see `.env.example`).

---

## 🔒 Security & Backend Integration Notes

This build is configured as a standalone frontend demo using browser-based storage (`localStorage`) for demonstration. 

For a production deployment:
1. Connect the login handlers in `af.onsubmit` to a secure backend API endpoint (e.g., `POST /api/v1/auth/login`).
2. Issue HTTP-only, Secure JSON Web Tokens (JWT) or server-side session cookies.
3. Validate user roles and enforce authorization headers on protected server endpoints (`/api/admin/*`, `/api/partner/*`).
4. Store passwords using bcrypt or Argon2 password hashing on the server database (PostgreSQL, MongoDB, etc.).

