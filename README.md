# BloodLink — Intelligent Blood Donor & NGO Network

<div align="center">

[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)]()
[![React](https://img.shields.io/badge/react-19.2.4-61dafb?logo=react)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Status](https://img.shields.io/badge/status-Active%20Development-success)]()

*AI-powered platform connecting patients in critical need of blood with nearby NGOs and blood centers instantly.*

[🚀 Deploy Now](#-deploy-now) • [Features](#features) • [Installation](#installation) • [Documentation](#documentation)

</div>

---

## 📋 Overview

**BloodLink** is an intelligent blood donor network platform that leverages AI-powered matching algorithms to connect patients urgently needing blood transfusions with nearby blood banks, NGOs, and registered donors in real-time.

### 🎯 Mission
To revolutionize blood donation coordination by eliminating delays and creating a seamless connection between those in need and those who can help, ultimately saving lives.

---

## 🚀 Deploy Now

Since we don't have a live demo yet, you can easily deploy BloodLink to the cloud with one click:

### Quick Deploy Options

#### **Deploy on Railway** (Recommended - Fastest)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/ImSuvodeep/bloodlink)

```bash
# Or clone and deploy manually:
git clone https://github.com/ImSuvodeep/bloodlink.git
cd bloodlink
railway login
railway up
```

#### **Deploy on Render**
```bash
git clone https://github.com/ImSuvodeep/bloodlink.git
cd bloodlink
# Connect your GitHub repo on render.com
# Render will auto-detect render.yaml configuration
```

#### **Deploy on Vercel (Frontend Only)**
```bash
npm run build
vercel --prod
```

#### **Deploy on Heroku**
```bash
git clone https://github.com/ImSuvodeep/bloodlink.git
cd bloodlink
heroku login
heroku create your-bloodlink-app
git push heroku main
```

#### **Deploy on Replit (Free Tier)**
[![Run on Replit](https://replit.com/badge/github/ImSuvodeep/bloodlink)](https://replit.com/github/ImSuvodeep/bloodlink)

#### **Deploy with Docker**
```bash
git clone https://github.com/ImSuvodeep/bloodlink.git
cd bloodlink
docker build -t bloodlink .
docker run -p 3000:3000 bloodlink
```

**After deploying, share your live URL in the repo discussions!** 🎉

---

## ✨ Features

### Core Functionality
- **🤖 AI-Powered Matching Engine** — Intelligent algorithm that matches blood requirements with available inventory considering blood type compatibility, location proximity, and NGO availability
- **👥 Dual User System** — Separate interfaces for patients (seeking blood) and NGOs (providing blood)
- **📍 Real-Time Location Matching** — Pincode-based geographic proximity matching for faster fulfillment
- **🔐 Secure Authentication** — JWT-based authentication with bcrypt password hashing
- **📊 Blood Type Compatibility** — Automatic calculation of compatible blood types (O→All, AB←All, etc.)
- **💬 Real-Time Communication** — WebSocket integration for live notifications and updates

### Security & Performance
- **🛡️ Helmet.js** — HTTP headers security middleware
- **⚡ Rate Limiting** — Express rate limit to prevent abuse
- **✅ Input Validation** — Express validator for robust data validation
- **🗄️ SQLite Database** — Lightweight, reliable local database with better-sqlite3
- **🔒 CORS Protection** — Cross-origin resource sharing configuration

### Technology Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19.2.4, React Router DOM 7.14.0, Vite |
| **Backend** | Node.js 20+, Express 5.2.1 |
| **Database** | SQLite3 (better-sqlite3) |
| **Real-Time** | Socket.IO 4.8.3 |
| **Security** | bcryptjs, jsonwebtoken, helmet, express-validator |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
bloodlink/
├── 📄 index.html                 # Main HTML entry point
├── 📄 package.json              # Project dependencies & scripts
├── 📄 vite.config.js            # Vite configuration
├── 📄 eslint.config.js          # ESLint rules
│
├── 📂 src/                       # Frontend application
│   ├── main.jsx                 # React entry point
│   ├── App.jsx                  # Main App component
│   ├── index.css                # Global styles
│   ├── App.css                  # App component styles
│   ├── 📂 pages/                # Page components
│   │   ├── PatientDashboard.jsx
│   │   ├── NGODashboard.jsx
│   │   ├── RequestBlood.jsx
│   │   ├── FindDonors.jsx
│   │   └── ...
│   ├── 📂 components/           # Reusable UI components
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   ├── BloodCard.jsx
│   │   ├── NGOCard.jsx
│   │   └── ...
│   ├── 📂 context/              # React Context for state management
│   │   ├── AuthContext.jsx
│   │   └── BloodContext.jsx
│   ├── 📂 hooks/                # Custom React hooks
│   │   ├── useAuth.js
│   │   └── useFetch.js
│   ├── 📂 api/                  # API communication
│   │   └── client.js
│   └── 📂 assets/               # Images, icons, static files
│
├── 📂 server/                   # Backend Node.js server
│   ├── index.js                 # Express server setup & routes
│   ├── auth.js                  # Authentication logic & JWT
│   ├── database.js              # Database initialization & schemas
│   ├── db.js                    # Database queries helper
│   ├── matchingEngine.js        # AI matching algorithm
│   ├── bloodCompat.js           # Blood type compatibility logic
│   ├── pincodeDB.js             # Pincode to location mapping
│   ├── .env.example             # Environment variables template
│   └── 📂 routes/               # API route handlers
│       ├── auth.js              # Authentication endpoints
│       ├── patients.js          # Patient endpoints
│       ├── ngos.js              # NGO endpoints
│       ├── blood.js             # Blood request/inventory endpoints
│       └── notifications.js     # Real-time notification routes
│
├── 📂 public/                   # Static public assets
├── 📂 docs/                     # Documentation
├── 📄 .gitignore                # Git ignore file
├── 📄 .npmrc                    # NPM configuration
├── 📄 Procfile                  # Heroku deployment config
├── 📄 railway.json              # Railway.app deployment config
├── 📄 render.yaml               # Render.com deployment config
└── 📄 nixpacks.toml             # Nixpacks deployment config
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 20.0.0
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ImSuvodeep/bloodlink.git
   cd bloodlink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp server/.env.example server/.env
   # Edit .env with your configuration
   ```

4. **Required environment variables** (in `server/.env`):
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key
   DATABASE_PATH=./blood_donation.db
   VITE_API_URL=http://localhost:3000
   ```

### Development

**Option 1: Run Frontend & Backend Separately**
```bash
# Terminal 1: Run frontend (Vite dev server)
npm run dev

# Terminal 2: Run backend server
npm run server
```

**Option 2: Run Both Concurrently**
```bash
npm run dev:full
```

### Production Build

```bash
# Build frontend assets
npm run build

# Start production server
npm run start
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` — Register new patient or NGO
- `POST /api/auth/login` — User login
- `POST /api/auth/logout` — User logout
- `GET /api/auth/verify` — Verify JWT token

### Patients
- `GET /api/patients/:id` — Get patient profile
- `POST /api/patients/blood-request` — Create blood request
- `GET /api/patients/requests` — Get patient's blood requests
- `PUT /api/patients/:id` — Update patient profile

### NGOs
- `GET /api/ngos/:id` — Get NGO profile
- `GET /api/ngos/nearby` — Find nearby NGOs
- `POST /api/ngos/inventory` — Update blood inventory
- `GET /api/ngos/inventory` — View inventory

### Blood Matching
- `GET /api/blood/matches` — Get matched donors/NGOs for blood request
- `POST /api/blood/request/:id/fulfill` — Fulfill blood request
- `GET /api/blood/compatibility` — Get blood type compatibility info

### Notifications (WebSocket)
- Real-time blood request updates
- Live NGO availability notifications
- Request fulfillment status updates

---

## 🧠 Matching Algorithm

The AI-powered matching engine considers:

1. **Blood Type Compatibility**
   - O- (Universal Donor) → All blood types
   - O+ → O+, A+, B+, AB+
   - AB (Universal Recipient) ← All blood types
   - *Automatic calculation based on blood type*

2. **Geographic Proximity**
   - Pincode-based distance calculation
   - Prioritizes closest available NGOs
   - Considers traffic and accessibility

3. **Availability**
   - Real-time inventory checking
   - NGO operating hours verification
   - Stock status monitoring

4. **Urgency Level**
   - Priority scoring for critical requests
   - Expected fulfillment time estimation

---

## 🔐 Security Features

- **Password Encryption** — bcryptjs with salt rounds
- **JWT Tokens** — Secure, expiring authentication tokens
- **Input Validation** — Sanitization and validation on all inputs
- **CORS Configuration** — Restricted cross-origin requests
- **Helmet.js** — Secure HTTP headers
- **Rate Limiting** — Prevents brute force attacks
- **Error Handling** — Secure error messages without sensitive information

---

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  userType TEXT CHECK(userType IN ('patient', 'ngo')),
  phone TEXT,
  address TEXT,
  pincode TEXT,
  bloodType TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Blood Requests Table
```sql
CREATE TABLE blood_requests (
  id INTEGER PRIMARY KEY,
  patientId INTEGER,
  bloodType TEXT NOT NULL,
  units INTEGER NOT NULL,
  urgencyLevel TEXT CHECK(urgencyLevel IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending',
  matchedNGO INTEGER,
  createdAt TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES users(id)
)
```

---

## 🌐 Deployment Guides

### Deploy to Railway.app
```bash
# 1. Push your repo to GitHub
# 2. Go to railway.app and connect your GitHub
# 3. Railway auto-detects railway.json
# 4. Your app will be live!
```

### Deploy to Render.com
```bash
# 1. Connect GitHub repo on render.com
# 2. Render auto-detects render.yaml
# 3. Set environment variables
# 4. Deploy!
```

### Deploy to Heroku
```bash
git clone https://github.com/ImSuvodeep/bloodlink.git
cd bloodlink
heroku login
heroku create your-bloodlink-app
git push heroku main
heroku open
```

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:full` | Run frontend and backend concurrently |
| `npm run server` | Start Node.js backend server |
| `npm run start` | Start production server |
| `npm run build` | Build frontend for production |
| `npm run lint` | Run ESLint checks |
| `npm run preview` | Preview production build locally |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- ESLint configuration must pass
- Meaningful commit messages
- Comments for complex logic
- Responsive design for all features

---

## 📚 Documentation

- **Full Documentation** — See `/docs` folder
- **System Overview** — See `/docs/01_system_overview.md`
- **API Reference** — See `/docs/07_api_reference.md`
- **Database Schema** — See `/docs/06_database_schema.md`
- **Security Guide** — See `/docs/08_security.md`

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### Database Errors
```bash
# Remove existing database and recreate
rm blood_donation.db
npm run server
```

### CORS Issues
- Check `VITE_API_URL` matches backend URL
- Verify CORS settings in `server/index.js`

### JWT Errors
- Ensure `JWT_SECRET` is set in `.env`
- Clear browser localStorage and re-login

---

## 📞 Support & Contact

- **Issues** — [GitHub Issues](https://github.com/ImSuvodeep/bloodlink/issues)
- **GitHub** — [ImSuvodeep](https://github.com/ImSuvodeep)
- **Discussions** — [GitHub Discussions](https://github.com/ImSuvodeep/bloodlink/discussions)

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.

---

## 🙏 Acknowledgments

- React team for an amazing frontend framework
- Express.js community for robust backend framework
- Railway, Render, Vercel for free deployment options
- All contributors who have helped improve BloodLink
- Blood donation centers and NGOs for their invaluable work

---

## 🔄 Project Status

| Aspect | Status |
|--------|--------|
| Frontend | 🟢 Active Development |
| Backend API | 🟢 Active Development |
| Database | 🟢 Stable |
| Matching Engine | 🟡 Testing |
| Real-Time Features | 🟡 Implementation |
| Deployment | 🟢 Ready |
| Live Demo | 🔴 Coming Soon |

---

<div align="center">

**Made with ❤️ for life-saving connections**

### 🚀 [Deploy Now & Share Your Live URL](#-deploy-now)

[⬆ Back to top](#bloodlink--intelligent-blood-donor--ngo-network)

</div>
