# BloodLink — Deployment Guide

> Your app is a **full-stack Node.js application**:
> - React frontend (served as static files from Express)
> - Express + Socket.IO backend
> - SQLite database (file-based, no separate DB server needed)
>
> Everything runs from a **single port** — `npm run build` then `npm start`.

---

## Option 1 — Railway ⭐ (Recommended — Easiest)

**Railway** is the easiest cloud platform for Node.js + SQLite apps. Supports WebSockets, persistent volumes, and has a free tier.

### Steps

#### Step 1: Push your code to GitHub

```bash
# In your project folder:
git init
git add .
git commit -m "BloodLink production ready"
```

Go to [github.com](https://github.com) → New repository → name it `bloodlink` → Copy the remote URL.

```bash
git remote add origin https://github.com/YOUR_USERNAME/bloodlink.git
git push -u origin main
```

> ⚠️ Make sure `server/.env` and `server/bloodlink.db` are in your `.gitignore` (they already are).

---

#### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `bloodlink` repository
4. Railway detects Node.js automatically and uses `railway.json`

---

#### Step 3: Add a Persistent Volume (for SQLite)

Since SQLite stores data in `server/bloodlink.db`, you need persistent storage:

1. In Railway project → click your service → **"Volumes"** tab
2. Click **"Add Volume"**
3. Set **Mount Path** to `/app/server`
4. This ensures `bloodlink.db` survives redeploys

---

#### Step 4: Set Environment Variables

In Railway → your service → **"Variables"** tab → add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3001` (Railway sets this automatically, but add it anyway) |
| `JWT_SECRET` | A new 64-char random string (see below to generate one) |
| `JWT_EXPIRES_IN` | `7d` |
| `OTP_ENABLED` | `false` |
| `ALLOWED_ORIGINS` | Your Railway URL, e.g. `https://bloodlink.up.railway.app` |

**Generate a secure JWT_SECRET:**
```bash
node -e "const c=require('crypto');console.log(c.randomBytes(64).toString('hex'))"
```

---

#### Step 5: Deploy

Click **"Deploy"** → Railway builds your project with:
```
npm install && npm run build && npm start
```

Your app will be live at: `https://bloodlink.up.railway.app` (or your custom domain)

---

#### Step 6: Add a Custom Domain (Optional)

1. Railway → your service → **"Settings"** → **"Domains"**
2. Add your domain, e.g. `bloodlink.in`
3. Update DNS to point to Railway (they show you the CNAME record)
4. Update `ALLOWED_ORIGINS` env variable to your new domain

---

## Option 2 — Render (Free Tier Available)

[Render](https://render.com) is another excellent option.

### Steps

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. **"New"** → **"Web Service"** → Connect your GitHub repo
3. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server/index.js`
   - **Root Directory**: (leave empty)
4. Add environment variables (same as Railway list above)
5. **For SQLite persistence** → Go to **"Disks"** → Add disk → Mount at `/opt/render/project/src/server`

> ⚠️ Render's free tier **spins down after 15 minutes of inactivity**. For a blood donation app, upgrade to the $7/month **Starter** plan to keep it always-on.

---

## Option 3 — DigitalOcean Droplet (Full Control)

Best for production-grade, always-on deployments. Costs ~$6/month.

### Setup Script

SSH into your droplet and run:

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 (process manager — keeps app running 24/7)
sudo npm install -g pm2

# 3. Clone your repo
git clone https://github.com/YOUR_USERNAME/bloodlink.git
cd bloodlink

# 4. Create .env file
cat > server/.env << 'EOF'
PORT=3001
NODE_ENV=production
JWT_SECRET=YOUR_64_CHAR_SECRET_HERE
JWT_EXPIRES_IN=7d
OTP_ENABLED=false
ALLOWED_ORIGINS=https://yourdomain.com
EOF

# 5. Install and build
npm install && npm run build

# 6. Start with PM2
pm2 start server/index.js --name bloodlink
pm2 save
pm2 startup    # Run the output command to auto-start on reboot
```

### Nginx Reverse Proxy (serve on port 80/443)

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/bloodlink
```

Paste:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bloodlink /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Free HTTPS with Let's Encrypt
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Option 4 — Fly.io (Best for SQLite + WebSockets)

Fly.io has first-class support for SQLite via LiteFS. Good if you need very high reliability.

```bash
# Install Fly CLI
brew install flyctl

# Login
flyctl auth login

# In your project:
fly launch     # Detects Node.js automatically
fly volumes create bloodlink_data --size 1   # 1GB volume for SQLite
fly secrets set JWT_SECRET="your_secret_here" NODE_ENV=production
fly deploy
```

---

## Comparison Table

| Platform | Free Tier | SQLite | WebSockets | Ease | Always-On |
|---|---|---|---|---|---|
| **Railway** ⭐ | $5 credit | ✅ Volume | ✅ | ⭐⭐⭐⭐⭐ | ✅ |
| **Render** | Yes (sleeps) | ✅ Disk | ✅ | ⭐⭐⭐⭐ | ⚠️ |
| **Fly.io** | Yes | ✅ LiteFS | ✅ | ⭐⭐⭐ | ✅ |
| **DigitalOcean** | No (~$6/mo) | ✅ Native | ✅ | ⭐⭐ | ✅ |
| **Heroku** | No (~$7/mo) | ❌ Ephemeral | ✅ | ⭐⭐⭐ | ✅ |

---

## After Deployment — Final Checklist

- [ ] Visit your live URL and register an NGO
- [ ] Verify the NGO appears after page refresh (SQLite persistence confirmed)
- [ ] Register a volunteer — check the server log for OTP
- [ ] Submit a patient request
- [ ] Test Auto-Match dispatch via the patient dashboard
- [ ] Check `ALLOWED_ORIGINS` matches your exact production URL
- [ ] Set a strong `JWT_SECRET` (never reuse the dev one)
- [ ] Enable HTTPS on your domain (Railway/Render do this automatically)

---

## Quick Reference

```bash
# Local production test (before deploying)
npm run build      # Build React → dist/
npm start          # Start server; open http://localhost:3001

# Check health endpoint
curl http://localhost:3001/api/health
```
