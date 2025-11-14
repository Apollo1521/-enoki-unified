# enoki-unified

Unified monorepo for the **E‑Noki System**, containing the mobile application, admin/kiosk frontend, backend API, landing page, embedded firmware, and kiosk retry scripts.
This README includes **full documentation**, **production setup**, and **NGINX configuration**.

---

# 📁 Project Structure

```
enoki-unified/
│
├── app/                      # Expo mobile application
├── frontend/                 # Admin + kiosk panels (Next.js SSR)
├── backend/                  # Express backend, Prisma, PostgreSQL
├── landing-page/
│   └── landing-page-enoki/   # APK download landing page
├── hardware-espressif/       # ESP32/ESP8266 firmware (C)
└── retry-plog/               # Retry script for kiosk initialization
```

---

# 📱 app/ — Expo Mobile Application

### Build

```bash
npm install
npm run build:android-production
```

Produces the production Android APK.

---

# 🖥 frontend/ — Admin Panel + Kiosk Panel (Next.js SSR)

### Required Environment Variables

```
API=
NEXT_PUBLIC_API=
NEXT_PUBLIC_WS_URL=
```

### Build & Run

```bash
npm install
npm run build
npm run start
```

---

# 🛠 backend/ — Express + Prisma + PostgreSQL

### Required Environment Variables

```
PORT=
VERSION=
DATABASE_URL=
SECRET_ACCESS=
SECRET_REFRESH=
RFID_PORT_PATH=/dev/ttyUSB0
ORIGIN=
ENOKI_LED_SYSTEM_TIMEOUT=
```

### Run

```bash
npm install
npx prisma generate
npm run start
```

Database migrations:

```bash
npx prisma migrate deploy
```

---

# 🌐 landing-page/landing-page-enoki — APK Download Page

```
npm install
npm run build
npm run dev
```

---

# 🔌 hardware-espressif/ — ESP32 & ESP8266 Firmware

- Firmware written in C (ESP-IDF or Arduino framework).
- Handles:
  - RFID scanning
  - LED indicator system
  - WebSocket/HTTP communication
  - Device authentication
  - Kiosk interfacing

Flash using `esptool.py`, ESP-IDF, or Arduino IDE depending on firmware structure.

---

# 🔄 retry-plog/ — Kiosk Retry Script

Used to:

- Retry connections to backend
- Ensure kiosk UI does not load until backend + hardware are ready
- Automatically redirect Chromium once system becomes active

Chromium must start pointed to `/retry-plog`.

---

# 🏭 PRODUCTION DEPLOYMENT REQUIREMENTS (KIOSK SETUP)

Production kiosks **must follow this configuration**.

---

## ✔️ Base OS Requirements

- **Debian 13+**
- **XFCE Desktop Environment**
- **A Cloudflare Account**
- **CH340 Drivers in relation to /dev/ttyUSB0**

---

## ✔️ Display Power Management (Must Disable Everything)

```bash
xset -dpms
xset s off
xset s noblank
```

Disable & uninstall X‑screensaver:

```bash
sudo apt remove xscreensaver
```

---

## ✔️ XFCE Modifications (True Kiosk Mode)

- Remove XFCE panel(s)
- Disable notifications
- Disable session lock
- Disable LightDM auto-lock
- Enable auto-login
- Disable screen blanking inside Power Manager
- Disable sleep/hibernate

This prevents UI interruptions.

---

## ✔️ Required Services

### **NGINX**

Reverse proxy for frontend, backend, WebSocket, and ESP WS endpoints.

### **PM2 Autostart**

```bash
pm2 start backend/index.js
pm2 save
pm2 startup
```

### **CloudflareD Tunnel**

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## ✔️ Chromium Autostart (Kiosk Mode)

Chromium must point to `/retry-plog`:

Example autostart file:

```
chromium --kiosk --noerrdialogs --disable-infobars   --check-for-update-interval=31536000   http://localhost/retry-plog
```

Chromium will automatically redirect to kiosk UI once backend becomes active.

---

# ⚙️ Bare Minimum NGINX Configuration

**Includes: `/`, `/api`, `/socket.io`, `/esp` with HTTP -> TCP Upgrade logic.**

# ⚙️ Network Topology

**Uncomitted. Requires a specific network topology to run.**

```
server {
    listen 80;
    server_name YOUR_DOMAIN_HERE;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
    }

    # Backend API (Express)
    location /api/ {
        proxy_pass http://localhost:4000;
    }

    # Socket.IO (WebSocket Upgrade)
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # ESP Native WebSocket
    location /esp/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

---

Developers:

- charliecatxph
- Apollo1521

DevOps:

- charliecatxph

Hardware:

- Harvey De Joya
- Apollo1521
- charliecatxph

Kernel Modification (in regards to the incompatible AMD Carrizo APU installed):

- charliecatxph
