# 🏠 RealEstateApp

A full-stack Real Estate mobile application built with **React Native (Expo)**, **Node.js**, **MongoDB**, and **Socket.IO** real-time chat.

---

## Features

| Module | Details |
|--------|---------|
| 🏠 Properties | List, Search, Filter by type/status/bedrooms/city, Paginated |
| 🔍 Search | Full-text search on title, description, address |
| 🖼️ Gallery | Swipeable image gallery on property detail |
| 📍 Location | Address, city, lat/lng stored (Google Maps plug-in ready) |
| 👤 Auth | Register/Login, JWT, role: buyer \| agent |
| ❤️ Favorites | Save & remove, auth-gated |
| 💬 Real-Time Chat | Socket.IO 1-to-1 chat, online status, typing indicators, read receipts |
| 📦 Messages DB | All messages persisted to MongoDB |

---

## Project Structure

```
RealEstateApp/
├── backend/         # Node.js + Express API + Socket.IO
└── mobile/          # React Native / Expo app
```

---

## Quick Start

### 1. Prerequisites
- Node.js ≥ 18
- MongoDB running locally (`mongod`) OR a free [MongoDB Atlas](https://cloud.mongodb.com) cluster

### 2. Backend Setup

```bash
cd backend

# Edit .env if needed (MONGO_URI default: mongodb://localhost:27017/realestate)

# Install deps (already done)
npm install

# Optional: seed demo data
node seed.js

# Start dev server
npm run dev
```

Server runs at: **http://localhost:5000**

### 3. Mobile App Setup

```bash
cd mobile
npm install

# Start Expo
npx expo start
```

- Press `a` → Android emulator
- Press `i` → iOS simulator  
- Press `w` → Web browser (for quick preview)
- Scan QR code → **Expo Go** app on your phone

> **⚠️ Device Testing**: If testing on a real phone, update `API_BASE_URL` in `mobile/constants/index.js` to your machine's local IP (e.g., `http://192.168.1.5:5000`)

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register |
| POST | `/api/auth/login` | ❌ | Login → JWT |
| GET | `/api/auth/me` | ✅ | Get profile |
| GET | `/api/properties` | ❌ | List + filter |
| GET | `/api/properties/:id` | ❌ | Property detail |
| POST | `/api/properties` | ✅ Agent | Create listing |
| PUT | `/api/properties/:id` | ✅ Agent | Update listing |
| DELETE | `/api/properties/:id` | ✅ Agent | Delete listing |
| GET | `/api/favorites` | ✅ | My favorites |
| POST | `/api/favorites/:id` | ✅ | Add favorite |
| DELETE | `/api/favorites/:id` | ✅ | Remove favorite |
| GET | `/api/chats/rooms` | ✅ | My chat rooms |
| POST | `/api/chats/rooms` | ✅ | Create/get room |
| GET | `/api/chats/rooms/:id/messages` | ✅ | Message history |

## Socket.IO Events

| Emit | On | Description |
|------|----|-------------|
| `join_room` | — | Join a chat room |
| `send_message` | `new_message` | Send & receive messages |
| `typing` | `user_typing` | Typing indicator |
| `stop_typing` | `user_stop_typing` | Stop typing |
| `mark_read` | `messages_read` | Mark messages as read |
| — | `user_status` | Online/offline status |


## Tech Stack

- **Mobile**: React Native + Expo + React Navigation (Stack + Bottom Tabs)
- **State**: Zustand (with AsyncStorage persistence)
- **API**: Axios with JWT interceptor
- **Backend**: Node.js + Express + Morgan
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcryptjs
- **Real-Time**: Socket.IO (WebSocket)
- **File Upload**: Multer (local `uploads/` folder)
