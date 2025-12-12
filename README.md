# 🏥 MediSlot: Production-Grade Patient Appointment Scheduling System

**Project Objective:** To design and implement a production-grade doctor appointment booking system that handles high concurrency and prevents double-booking using database-level locking.

| Deliverable | Status | URL/Note |
| :--- | :--- | :--- |
| **Deployed Frontend URL** | ✅ **Ready** | `[PASTE YOUR VERCEL URL HERE]` |
| **Deployed Backend API URL** | ✅ **Ready** | `[PASTE YOUR RENDER URL HERE]` |
| **Source Code Repository** | ✅ **Ready** | `[LINK TO THIS GITHUB REPO]` |

## I. Tech Stack & Architecture

| Component | Technology | Reasoning (The "Why") |
| :--- | :--- | :--- |
| **Backend** | Node.js (TypeScript), Express, `pg`, `node-cron` | Lightweight, asynchronous environment suited for high I/O (API calls). TypeScript ensures strong type safety. |
| **Database** | PostgreSQL (Neon/Supabase) | Chosen for its robust support of **ACID Transactions** and **Pessimistic Row Locking** (`SELECT ... FOR UPDATE`), which is critical for concurrency control. |
| **Frontend** | React.js (TypeScript), Context API, Tailwind CSS, Framer Motion | Modern, efficient component rendering. Context API manages global state. Tailwind + Framer Motion delivers premium UI/UX. |
| **Deployment** | Render (Backend), Vercel (Frontend) | Industry-standard, specialized platforms for simplified continuous deployment. |

## II. Functionality & Features

### A. Core Requirements
* **Concurrency Handling:** Implemented database transactions with `SELECT ... FOR UPDATE` to prevent two users from booking the same slot simultaneously.
* **Status Flow:** Bookings transition from `CONFIRMED` to `BUFFER` (Admin Cancel) or `CANCELLED` (User Cancel).
* **Admin Features:** Create Doctors, Create Slots, View All Bookings, Cancel Bookings, Delete Slots, Delete Doctors.
* **User Features:** View available slots, dedicated Booking Confirmation Page, and personal Booking History/Cancellation.

### B. Innovation & Differentiators (Key Standout Points)

| Innovation | Distinction | Evaluation Criterion |
| :--- | :--- | :--- |
| **Dynamic Slot Buffering** | When an Admin cancels a booking, it is marked `status = 'BUFFER'` and held for 10 minutes (a "buffer window") before being released to the public pool. This simulates a real-world **waitlist queue** and optimizes revenue recovery from no-shows. | Original thinking & Business Logic depth. |
| **Pessimistic Locking Implementation** | The use of **ACID-compliant transactions** and `FOR UPDATE` locking provides the highest guarantee against race conditions, which is superior to application-level checks. | Strong Architecture & Concurrency Quality. |
| **Optimistic UI & Shimmer Button** | Slots visually lock when clicked (`Locking...`) and the confirmation button uses a premium Shimmer effect, providing immediate feedback and a superior user experience (UI/UX Quality). | Advanced UI/UX and Clean Component Structure. |

## III. Assumptions Made & Known Limitations

### A. Assumptions Made
* **Database Role:** The solution assumes the PostgreSQL user role used in the connection string has full read/write/delete privileges (`CRUD`) necessary for all Admin and Booking operations.
* **Deployment Context:** The system assumes a simple CI/CD setup (Vercel/Render) where the backend and frontend are hosted on separate subdomains with proper CORS handling enabled.
* **Time Zones:** The system currently stores and displays all times in UTC format (as per `TIMESTAMP` in Postgres). A production system would require client-side time zone detection and conversion.
* **Admin Access:** The system currently grants Admin access solely based on the `role` field in the user object stored in the JWT. A real-world application requires a more secure token or role management system (e.g., role-based access control middleware).

### B. Known Limitations
* **Single Seat Booking:** The current model is strictly for Doctor Appointments (one slot = one person). It does not support multi-seat booking (like a bus ticket system's seat map).
* **Payment Gateway:** There is no integration with a real payment gateway. The booking goes straight to `CONFIRMED`. If payment were required, the status flow would involve `PENDING` -> (Payment Success) -> `CONFIRMED`.
* **Missing Search/Filter:** The frontend currently lists all doctors and slots without advanced filtering (e.g., filter by date or specialization).
* **User Authentication:** The JWT token is managed purely client-side (Local Storage). A production system should use HTTP-only cookies to mitigate XSS risks.

## IV. Setup Instructions

1.  **Clone Repository:** `git clone [REPO URL]`
2.  **Install Dependencies:**
    * `cd medislot/backend && npm install`
    * `cd medislot/frontend && npm install`
3.  **Database Setup:** Create your PostgreSQL DB (Neon/Supabase) and run the provided SQL schema script.
4.  **Local Run:**
    * **Backend:** Set `DATABASE_URL` and `JWT_SECRET` in `backend/.env`. Run `npm run dev`.
    * **Frontend:** Set `VITE_API_URL=http://localhost:5000/api` in `frontend/.env.local`. Run `npm run dev`.

## V. System Design & Scalability (Technical Document)

### A. High-Level Architecture
The system uses a Microservices-ready Monolith architecture, logically separating Auth, Doctors, and Bookings. This separation allows the core Booking logic (which requires database locking) to be independent while allowing seamless vertical scaling of read-heavy components.

### B. Concurrency Implementation (Locking)
We leverage PostgreSQL's native locking mechanism: **Pessimistic Locking**.

The `bookSlot` API endpoint ensures atomicity by:
1.  Obtaining a connection client and running `BEGIN`.
2.  Executing the blocking query: `SELECT id, is_booked FROM slots WHERE id = $1 FOR UPDATE`. This locks the target row.
3.  If `is_booked` is false, the transaction proceeds to update the slot and create the booking.
4.  If the lock is obtained and the slot is available, the transaction runs `COMMIT`. If the slot is taken or an error occurs, the transaction runs `ROLLBACK`, releasing the lock and preserving integrity.

### C. Database and Scaling Strategy
* **Read/Write Split:** We would use a primary database instance for writes (bookings, admin creation) and multiple **Read Replicas** for read-heavy operations (listing doctors/slots).
* **Sharding:** If the system scales globally, the `bookings` table would be sharded based on `doctor_id` or geographical region (`facility_id`) to distribute the write load across multiple database clusters.

### D. Caching and Decoupling
* **Caching:** Redis would be implemented using a **Cache-Aside** strategy to store the list of available doctors and slots. This data is only updated (written-through) when a booking is successfully committed.
* **Message Queues:** For critical operations that don't need immediate HTTP response, such as sending confirmation emails or payment gateway handshakes, a **Message Queue (e.g., Kafka)** would decouple the request flow.
