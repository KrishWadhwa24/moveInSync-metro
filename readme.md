# 🚇 Metro Routing & Booking Platform

A backend system for a metro transportation platform built with **Node.js**, **PostgreSQL**, and a custom **graph-based routing engine**.

---

## ✨ Features

- 🚉 Graph-based route optimization
- ⚡ Fastest and least-transfer routing strategies
- 🔐 JWT authentication & role-based authorization
- 🎟 Idempotent booking system
- 📱 Tamper-resistant QR ticket generation
- 🔄 Real-time graph rebuilding on route updates

---

## 📌 System Overview

This platform simulates a real-world metro infrastructure system consisting of:

- **Stop Management** — CRUD for metro stations
- **Route Management** — Define lines, stop sequences, travel times
- **Graph-Based Pathfinding Engine** — In-memory Dijkstra's algorithm
- **Booking System** — Idempotent ticket booking
- **QR Ticket Generation** — HMAC-signed tamper-proof tickets
- **Role-Based Auth** — Admin and User access levels

---

## 🏗 System Architecture

```
Client
  ↓
JWT Authentication Middleware
  ↓
REST API (Express)
  ↓
Graph Engine (Dijkstra)
  ↓
Booking System
  ↓
QR Generation (HMAC-SHA256)
  ↓
PostgreSQL Database
```

The graph is stored **in-memory** for high performance and rebuilt whenever the network topology changes.

---

## 🧠 Algorithms & Logic

### 1️⃣ Dijkstra's Algorithm — Core Routing Engine

**File:** `graph/Dijkstra.js`

Used to find the shortest path between two metro stops across a weighted graph. Supports two strategies:

| Strategy | Edge Cost |
|---|---|
| 🚀 Fastest Route | `travel_time` |
| 🔄 Least Transfers | `travel_time + transfer_penalty` |

The transfer penalty converts the "minimize transfers" problem into a standard weighted shortest-path problem — Dijkstra handles both with the same algorithm.

---

### 2️⃣ HMAC-SHA256 — QR Security

**File:** `generateQRString()`

Each QR ticket is signed to prevent tampering:

```
payload   = bookingId | source | destination | timestamp
signature = HMAC_SHA256(payload, SECRET_KEY)
```

If any field in the payload is modified, the signature won't match on verification — ensuring integrity and anti-forgery protection.

---

### 3️⃣ Idempotency Logic — Duplicate Booking Prevention

Booking requests are deduplicated using a composite key:

```
userId : source : destination : 5-minute-window
```

If the same request is made within 5 minutes, the existing booking is returned instead of creating a new DB entry. This ensures safe retry behavior for network failures.

---

## 🗂 Data Structures

### Graph — Adjacency List

```
Map<"stopId:routeId", Array<Edge>>
```

Each node is a **stop on a specific route** (not just a stop). This allows the same physical station (e.g. Rajiv Chowk) to exist as separate nodes on Yellow and Blue lines, with an explicit transfer edge between them.

### stopRouteMap

```
Map<stopId, Array<routeId>>
```

Used to detect interchange stations and create transfer edges during graph construction.

### nodeMetaMap

```
Map<nodeKey, { stopName, stopCode, routeName, routeColor }>
```

Lookup table used to format human-readable API responses after pathfinding.

### Min Priority Queue

Used inside Dijkstra to always process the lowest-cost node next. Implemented as a sorted array.

---

## 🗄 Database Schema

| Table | Purpose |
|---|---|
| `users` | Auth credentials and roles |
| `stops` | Metro stations |
| `routes` | Metro lines with color |
| `route_stops` | Stop order and travel time per route |
| `bookings` | Ticket bookings with idempotency |

Interchange stations are modeled by **reusing the same stop row** across multiple routes in `route_stops` — no duplication needed.

---

## 🔐 Security

- JWT-based stateless authentication
- Role-based authorization (Admin / User)
- HMAC-SHA256 signed QR tickets
- Parameterized queries (SQL injection prevention)
- Unique constraints enforced at DB level
- Idempotency keys on bookings

---

## ⚙️ Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd metro-platform
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root:

```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/metro_db
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
TRANSFER_PENALTY_MINUTES=10
```

### 4. Set up the database

```sql
CREATE DATABASE metro_db;
```

Then run migrations to create tables: `users`, `stops`, `routes`, `route_stops`, `bookings`.

### 5. Seed the database

```bash
npm run seed
```

This inserts Yellow, Blue, Pink, and Violet metro lines with all interchange stations.

### 6. Start the server

```bash
npm start
```

Server runs at `http://localhost:5000`

---

## 📡 API Reference

### 🔐 Auth

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |

### 🚉 Stops

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/stops` | Admin |
| GET | `/api/stops` | Public |

### 🛤 Routes

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/routes` | Admin |
| GET | `/api/routes` | Public |
| GET | `/api/routes/map` | Public |
| GET | `/api/routes/search?from=&to=&strategy=fastest` | User |

### 🎟 Bookings

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/bookings` | User |
| GET | `/api/bookings/:id` | User |

---

## 🧪 Test Credentials

```
Admin → admin@metro.com / admin123
User  → user@metro.com  / user123
```

---

## 🚉 Interchange Stations

| Station | Lines |
|---|---|
| Rajiv Chowk | Yellow ↔ Blue |
| Kashmere Gate | Yellow ↔ Violet |
| Central Secretariat | Yellow ↔ Violet |
| INA | Yellow ↔ Pink |
| Rajouri Garden | Blue ↔ Pink |
| Mandi House | Blue ↔ Violet |
| Lajpat Nagar | Pink ↔ Violet |
| Anand Vihar | Blue ↔ Pink |