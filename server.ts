import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/instasmart";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    if (err.message.includes("MongooseServerSelectionError")) {
      console.warn(
        "HINT: If you are using MongoDB Atlas, ensure your IP address is whitelisted (or use 0.0.0.0/0 for testing).",
      );
    }
  });

// --- Email Transporter ---
const transporter = nodemailer.createTransport({
  service: "gmail", // ✅ IMPORTANT
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// --- Models ---

const UserSchema = new mongoose.Schema({
  crmUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CrmUser",
    required: true,
  },
  username: { type: String, required: true },
  name: String,
  bio: String,
  inferredGender: {
    type: String,
    enum: ["male", "female", "unknown"],
    default: "unknown",
  },
  profession: String,
  tags: [String],
  status: {
    type: String,
    enum: [
      "new",
      "contacted",
      "follow-up-1",
      "follow-up-2",
      "interested",
      "not-interested",
      "converted",
    ],
    default: "new",
  },
  lastMessageSentAt: Date,
  followUpDueAt: Date,
  followUpCount: { type: Number, default: 0 },
  lastContactedDate: Date,
  nextFollowUpDate: Date,
  messageHistory: [
    {
      content: String,
      sentAt: { type: Date, default: Date.now },
      type: { type: String, enum: ["initial", "follow-up"] },
    },
  ],
  notes: String,
});

// Ensure username is unique per CRM user
UserSchema.index({ crmUserId: 1, username: 1 }, { unique: true });

const InstagramUser = mongoose.model("InstagramUser", UserSchema);

const TemplateSchema = new mongoose.Schema({
  crmUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CrmUser",
    required: true,
  },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["gender", "profession", "follow-up"],
    required: true,
  },
  category: String, // e.g., "male", "female", "dentist", "1st follow-up"
  content: { type: String, required: true },
});

const Template = mongoose.model("Template", TemplateSchema);

const LogSchema = new mongoose.Schema({
  crmUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CrmUser",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "InstagramUser" },
  action: String,
  status: { type: String, enum: ["success", "failed"] },
  details: String,
  timestamp: { type: Date, default: Date.now },
});

const ActivityLog = mongoose.model("ActivityLog", LogSchema);

const CrmUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  createdAt: { type: Date, default: Date.now },
});

const CrmUser = mongoose.model("CrmUser", CrmUserSchema);

const SettingsSchema = new mongoose.Schema({
  crmUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CrmUser",
    required: true,
    unique: true,
  },
  messageDelay: { type: Number, default: 30 },
  followUpInterval: { type: Number, default: 2 },
  maxFollowUps: { type: Number, default: 4 },
  autoAnalyze: { type: Boolean, default: true },
  safeMode: { type: Boolean, default: true },
  instagramUsername: String,
  instagramPassword: { type: String, select: false }, // Don't return password by default
});

const Settings = mongoose.model("Settings", SettingsSchema);

// --- API Routes ---

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    env: process.env.NODE_ENV,
  });
});

// Auth Middleware (Simplified for demo)
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Auth Routes
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new CrmUser({ email, password: hashedPassword, name });
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await CrmUser.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" },
    );
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", authenticate, async (req: any, res) => {
  try {
    const user = await CrmUser.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await CrmUser.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // Hash token before saving
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Reset URL (FRONTEND URL)

    // Email content
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your InstaSmart CRM account. Please use the token below to reset your password:</p>
          <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #18181b;">${token}</span>
          </div>
          <p>This token will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          <p style="font-size: 12px; color: #71717a;">InstaSmart CRM - Your Instagram Lead Management Partner</p>
        </div>
      `,
    };
    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error("MAIL ERROR:", err);

      return res.json({
        message: "Token generated (email failed)",
        token,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    // Hash incoming token (same as saved)
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await CrmUser.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ error: "Invalid or expired token" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

// Auth Middleware (Simplified for demo)
// Moved up to fix hoisting issue
// Users
app.get("/api/users", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const { status, due, followUpCount, tag } = req.query;
    let query: any = { crmUserId: req.user.id };

    if (status) query.status = status;
    if (tag) query.tags = tag;
    if (followUpCount)
      query.followUpCount = { $lt: parseInt(followUpCount as string) };

    if (due === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      query.nextFollowUpDate = { $gte: today, $lt: tomorrow };
    } else if (due === "overdue") {
      query.nextFollowUpDate = { $lt: new Date() };
      query.status = { $nin: ["converted", "not-interested"] };
    }

    const users = await InstagramUser.find(query).sort({
      nextFollowUpDate: 1,
      lastMessageSentAt: -1,
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/api/users/upload", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const { users } = req.body; // Array of { username, name, bio }
    const usersWithId = users.map((u: any) => ({
      ...u,
      crmUserId: req.user.id,
    }));
    const results = await InstagramUser.insertMany(usersWithId, {
      ordered: false,
    }).catch((err) => {
      // Handle duplicates
      return err.insertedDocs;
    });
    res.json({ message: "Users uploaded successfully", count: users.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to upload users" });
  }
});

app.post("/api/users/analyze", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  // This would normally call Gemini or a heuristic engine
  // For now, we'll just mock it or provide the endpoint
  res.json({ message: "Analysis started" });
});

app.patch("/api/users/:id", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const user = await InstagramUser.findOneAndUpdate(
      { _id: req.params.id, crmUserId: req.user.id },
      req.body,
      { new: true },
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

app.delete("/api/users/:id", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const user = await InstagramUser.findOneAndDelete({
      _id: req.params.id,
      crmUserId: req.user.id,
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.post("/api/users/bulk-delete", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const { ids } = req.body;
    await InstagramUser.deleteMany({
      _id: { $in: ids },
      crmUserId: req.user.id,
    });
    res.json({ message: "Users deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete users" });
  }
});

// Templates
app.get("/api/templates", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const templates = await Template.find({ crmUserId: req.user.id });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

app.post("/api/templates", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const template = new Template({ ...req.body, crmUserId: req.user.id });
    await template.save();
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: "Failed to create template" });
  }
});

// Logs
app.get("/api/logs", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const logs = await ActivityLog.find({ crmUserId: req.user.id })
      .populate("userId")
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// Settings
app.get("/api/settings", authenticate, async (req: any, res) => {
  try {
    let settings = await Settings.findOne({ crmUserId: req.user.id });
    if (!settings) {
      settings = new Settings({ crmUserId: req.user.id });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.patch("/api/settings", authenticate, async (req: any, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { crmUserId: req.user.id },
      req.body,
      { new: true, upsert: true },
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Instagram Messaging (Mock/Puppeteer logic)
app.post("/api/messages/send", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  const { userId, templateId } = req.body;
  try {
    const user = await InstagramUser.findOne({
      _id: userId,
      crmUserId: req.user.id,
    });
    const template = await Template.findOne({
      _id: templateId,
      crmUserId: req.user.id,
    });
    const settings = (await Settings.findOne({ crmUserId: req.user.id })) || {
      followUpInterval: 2,
      maxFollowUps: 4,
    };

    if (!user || !template) return res.status(404).json({ error: "Not found" });

    // Check max follow ups
    if ((user.followUpCount || 0) >= (settings.maxFollowUps || 4)) {
      return res
        .status(400)
        .json({ error: "Maximum follow-up limit reached for this lead" });
    }

    // Replace variables
    let content = template.content
      .replace(/{name}/g, user.name || user.username)
      .replace(/{username}/g, user.username)
      .replace(/{profession}/g, user.profession || "professional");

    // Update user
    user.followUpCount = (user.followUpCount || 0) + 1;
    user.lastContactedDate = new Date();
    user.lastMessageSentAt = new Date();

    // Auto-status update logic
    if (user.followUpCount === 1) user.status = "contacted";
    else if (user.followUpCount === 2) user.status = "follow-up-1";
    else if (user.followUpCount >= 3) user.status = "follow-up-2";

    // Set next follow-up based on settings
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (settings.followUpInterval || 2));
    user.nextFollowUpDate = nextDate;
    user.followUpDueAt = nextDate;

    user.messageHistory.push({
      content,
      type: user.followUpCount === 1 ? "initial" : "follow-up",
    });
    await user.save();

    // Log action
    const log = new ActivityLog({
      crmUserId: req.user.id,
      userId: user._id,
      action: "message_prepared",
      status: "success",
      details: `Prepared message for @${user.username}`,
    });
    await log.save();

    res.json({ message: "Message status updated", user });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.post("/api/messages/bulk-send", authenticate, async (req: any, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database not connected" });
  }
  const { userIds, templateId } = req.body;
  try {
    const template = await Template.findOne({
      _id: templateId,
      crmUserId: req.user.id,
    });
    if (!template) return res.status(404).json({ error: "Template not found" });

    const settings = (await Settings.findOne({ crmUserId: req.user.id })) || {
      followUpInterval: 2,
      maxFollowUps: 4,
    };
    const users = await InstagramUser.find({
      _id: { $in: userIds },
      crmUserId: req.user.id,
    });

    const updates = users.map(async (user) => {
      // Skip if max follow ups reached
      if ((user.followUpCount || 0) >= (settings.maxFollowUps || 4)) return;

      const content = template.content
        .replace(/{name}/g, user.name || user.username)
        .replace(/{username}/g, user.username)
        .replace(/{profession}/g, user.profession || "professional");

      user.followUpCount = (user.followUpCount || 0) + 1;
      user.lastContactedDate = new Date();
      user.lastMessageSentAt = new Date();

      if (user.followUpCount === 1) user.status = "contacted";
      else if (user.followUpCount === 2) user.status = "follow-up-1";
      else if (user.followUpCount >= 3) user.status = "follow-up-2";

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + (settings.followUpInterval || 2));
      user.nextFollowUpDate = nextDate;
      user.followUpDueAt = nextDate;

      user.messageHistory.push({
        content,
        type: user.followUpCount === 1 ? "initial" : "follow-up",
      });
      await user.save();

      const log = new ActivityLog({
        crmUserId: req.user.id,
        userId: user._id,
        action: "message_prepared",
        status: "success",
        details: `Prepared bulk message for @${user.username}`,
      });
      await log.save();
    });

    await Promise.all(updates);
    res.json({ message: "Bulk message status updated", count: userIds.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to process bulk messages" });
  }
});

// Seed initial templates
const seedTemplates = async () => {
  if (mongoose.connection.readyState !== 1) {
    console.log("Skipping seed: MongoDB not connected");
    return;
  }
  const count = await Template.countDocuments();
  if (count === 0) {
    await Template.insertMany([
      {
        name: "Initial Dentist (Male)",
        type: "profession",
        category: "dentist",
        content:
          "Hi Dr. {name}, I came across your practice and was impressed by your work. Are you looking to grow your patient base this month?",
      },
      {
        name: "Initial Coach (Female)",
        type: "profession",
        category: "coach",
        content:
          "Hi {name}! Love your content on coaching. I help coaches like you scale their business. Would you be open to a quick chat?",
      },
      {
        name: "Follow-up 1",
        type: "follow-up",
        category: "1st follow-up",
        content:
          "Hi {name}, just following up on my previous message. Did you get a chance to see it?",
      },
    ]);
    console.log("Sample templates seeded");
  }
};

// Vite middleware setup
async function startServer() {
  try {
    // Attempt to seed templates only if connected
    if (mongoose.connection.readyState === 1) {
      await seedTemplates();
    } else {
      console.log(
        "MongoDB not connected yet, skipping initial seed. Will retry on first request.",
      );
    }
  } catch (err) {
    console.error("Error during initial seed:", err);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
