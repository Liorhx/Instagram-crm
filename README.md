<h1 align="center">🚀 InstaCRM – Smart CRM & Workflow System</h1>

<p align="center">
A CRM platform to manage Instagram leads, automate workflows, and streamline sales processes.
</p>
## 🧠 Overview

**InstaCRM** is a full-stack CRM platform designed to manage leads, track customer interactions, and optimize sales pipelines.

It enables businesses to handle the full lifecycle from **lead → follow-up → conversion** with automated workflows and real-time tracking.

---

## Live Link

https://instagram-crm.onrender.com

<p align="center">
    <img src="./public/Screenshot3.png" width="800">
  <img src="./public/Screenshot1.png" width="800">
  <img src="./public/Screenshot2.png" width="800">
  <img src="./public/Screenshot4.png" width="800">
  <img src="./public/Screenshot5.png" width="800">
  <img src="./public/Screenshot6.png" width="800">
  <img src="./public/Screenshot7.png" width="800">
</p>

---

## ✨ Features

- Lead management and sales pipeline tracking
- Automated follow-ups with "Next Due" date calculation
- Status-based filtering (New, Contacted, Converted)
- Bulk import system for high-volume data
- Template engine for quick outreach
- Real-time task indicators (Due Today, Overdue)
- Fully responsive dashboard

---

## 🛠 Tech Stack

**Frontend:** React.js, Tailwind CSS  
**Backend:** Node.js, Express.js ,Typescript
**Database:** MongoDB  
**Authentication:** JWT  
**Tools:** Git, GitHub, Postman, Vite

---

## 🏗 Architecture

- Built using **MERN stack** with modular backend structure
- Designed **REST APIs** for lead management and workflows
- Implemented **multi-step workflow logic** for customer lifecycle
- Optimized performance with efficient API and database handling

---

## 📁 Project Structure

root/
├── src/ # Frontend source code
├── server.ts # Backend entry point
├── index.html # Main HTML file
├── components.json # UI configuration
├── package.json # Dependencies
├── tsconfig.json # TypeScript config
└── vite.config.ts # Vite config

---

## ⚙️ Setup

```bash
git clone https://github.com/Liorhx/instacrm.git
npm install
npm install --save-dev typescript @types/react @types/react-dom
npm run dev
```

# MongoDB Connection String

MONGODB_URI=your_mongodb_connection

# JWT Secret for authentication

JWT_SECRET=your_secret_key

# SMTP Configuration for Emails (e.g., Gmail, SendGrid, Mailtrap)

SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your_email@example.com"
SMTP_PASS="your_password_or_app_token"
SMTP_FROM="InstaSmart CRM <noreply@example.com>"
