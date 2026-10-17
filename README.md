# 🏎️ Type Rush Racing (Real-Time Multiplayer Speed Battle)

A high-octane real-time multiplayer car racing game powered by typing speed, inspired by **Type Rush** and **Monkeytype**! Drivers battle head-to-head on a multi-lane track where their typing speed (WPM) directly drives their car forward with live engine sounds and energetic voice race commentary.

---

## ✨ Features

- **🌐 Multiplayer Rooms with 4-Digit PINs**:
  - Enter your racer name and pick from 5 iconic cars with custom paint colors.
  - **Create Room**: Instantly generates a unique 4-digit code (e.g. `4821`).
  - **Join with PIN**: Seamless 4-digit pin box input with auto-advance and clipboard paste support.
  - Live player list with car badges and real-time connection status.

- **🚗 Real-World Iconic Cars & Authentic Engine Sounds**:
  - **Porsche 911 GT3 RS**: High-revving naturally aspirated 4.0L Boxer-6 rasp.
  - **Lamborghini Huracán STO**: Screaming 5.2L V10 operatic wail and crackles.
  - **Shelby GT500 Mustang**: Deep supercharged 5.2L American V8 muscle roar.
  - **Formula 1 Grand Prix**: Naturally aspirated screaming 18,000 RPM V8 engine flyby.
  - **Nissan GT-R Nismo**: Twin-turbo 3.8L VR38DETT V6 exhaust growl.
  - Dynamic RPM Modulation: Engine pitch and revs increase in real-time as your typing speed accelerates!
  - Interactive Garage Preview: Click any car chip or preview image in Driver Setup to hear its engine rev.

- **⌨️ Monkeytype-Style Typing Engine**:
  - Clean single-line smooth sliding window format.
  - Procedurally generated racing commentary with randomized vocabulary every race (100% lowercase, no symbols).
  - Backspacing allowed to correct spelling errors.
  - Car only advances on correct keystrokes; errors are capped to the target word length.

- **🎙️ Web Speech API Race Announcer**:
  - Declares the winner aloud the instant they cross the finish line in 1st place using their exact starting name.
  - Proclaims the champion and final stats during the podium ceremony.

- **🏆 Podium & Standings**:
  - Live position tracking (`1st`, `2nd`, `3rd`, etc.).
  - Celebratory confetti and 3D podium stage.
  - Rematch button for instant continuous room play.

---

## 🚀 How to Run Locally

1. **Clone or navigate to the project directory**:
   ```bash
   cd type-rush-racing
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the game server**:
   ```bash
   npm start
   ```

4. **Open your browser**:
   ```text
   http://localhost:3000
   ```

---

## 📦 How to Upload to GitHub

Follow these steps in your terminal inside the project directory:

1. **Initialize Git**:
   ```bash
   git init
   ```

2. **Add all files to staging**:
   ```bash
   git add .
   ```

3. **Commit your code**:
   ```bash
   git commit -m "Initial commit: Type Rush Racing multiplayer game"
   ```

4. **Create a new repository on GitHub**:
   - Go to [github.com/new](https://github.com/new).
   - Enter repository name: `type-rush-racing`.
   - Set visibility to **Public** (or **Private**).
   - Leave "Initialize with README / .gitignore" unchecked (we already have them!).
   - Click **Create repository**.

5. **Link and push to GitHub**:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/type-rush-racing.git
   git push -u origin main
   ```

---

## ☁️ How to Deploy on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and log in (or sign up with GitHub).
2. Click **New +** and select **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your `type-rush-racing` repository.
4. Configure the settings:
   - **Name**: `type-rush-racing` (or your preferred name)
   - **Region**: Choose the closest region to you (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. Click **Create Web Service**.
6. Render will automatically build and deploy your game. Once deployed, you will get a live URL like:
   `https://type-rush-racing.onrender.com`

---

## ⚡ How to Keep Render Server "Always On" (24/7 Without Sleeping)

On Render's Free tier, services automatically spin down (sleep) after **15 minutes of inactivity**. The next visitor then has to wait 30–50 seconds for a "cold start."

To keep your game **always awake and running 24/7 for free**, use one of the following methods:

### Method 1: UptimeRobot (Recommended — Free & Takes 1 Minute)
1. Go to [uptimerobot.com](https://uptimerobot.com) and create a free account.
2. Click **+ Add New Monitor**.
3. Fill in the details:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Type Rush Racing`
   - **URL (or IP)**: `https://your-service-name.onrender.com/health`
   - **Monitoring Interval**: `5 minutes` (or `10 minutes`)
4. Click **Create Monitor**.
> **Why this works**: UptimeRobot sends a tiny HTTP request to your `/health` endpoint every 5 minutes. Since the traffic interval is well below Render's 15-minute threshold, Render **never goes to sleep**, keeping your multiplayer WebSocket server active 24/7!

---

### Method 2: cron-job.org (Alternative Free Pinger)
1. Go to [cron-job.org](https://cron-job.org) and register for free.
2. Click **Create Cronjob**.
3. Set the Title to `Type Rush Render Keepalive`.
4. Set the URL to `https://your-service-name.onrender.com/ping`.
5. Set the execution schedule to **Every 10 minutes**.
6. Save the job.

---

### Method 3: Built-in Heartbeat
In `server.js`, an automatic keep-alive timer is built-in. If Render's environment variable `RENDER_EXTERNAL_URL` is detected, the server automatically pings its own `/health` endpoint every 10 minutes while awake. Pairing this with **UptimeRobot** provides guaranteed 100% continuous uptime!

---

## 📜 License
MIT
