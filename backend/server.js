import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import { Resend } from "resend";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import cors from "cors";
import compression from "compression";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

// Security & Performance
app.use(compression()); // Optimize response sizes
const allowedOrigins = [
  process.env.VITE_FRONTEND_URL,
  process.env.APP_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000"
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Root API check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", message: "100Kpro API active" });
});

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/swiftcourse";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_123";
const resend = new Resend(process.env.RESEND_API_KEY);

let razorpayClient = null;
const getRazorpay = () => {
  if (!razorpayClient) {
    const key_id = process.env.VITE_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error("Razorpay credentials (VITE_RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET) not configured.");
    }
    razorpayClient = new Razorpay({ key_id, key_secret });
  }
  return razorpayClient;
};

// Database Connection
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB established.");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Exit process in production to allow container restart
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
};

connectDB();

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  password: { type: String, required: true },
  is_verified: { type: Boolean, default: false },
  has_access: { type: Boolean, default: false },
  verification_token: String,
  reset_token: String,
});

const User = mongoose.model("User", userSchema);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    console.log("Authentication failed: No token found in cookies");
    return res.status(401).json({ message: "Session expired or access denied. Please login again." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    console.log("Authentication failed: Invalid token", err);
    res.status(400).json({ message: "Invalid session token. Please login again." });
  }
};

// --- API Routes ---

// Signup
app.post("/api/auth/signup", async (req, res) => {
  console.log("SIGNUP API HIT", req.body.email);
  try {
    const { name, email, age, password } = req.body;

    // Server-side validation
    if (!name || name.length < 3 || !/^[a-zA-Z\s]+$/.test(name)) {
      return res.status(400).json({ message: "Name must be at least 3 characters and contain only letters" });
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = new User({
      name,
      email,
      age: age || 0,
      password: hashedPassword,
      verification_token: verificationToken,
    });

    // Auto-verify if no email service is configured
    if (!process.env.RESEND_API_KEY) {
      console.log("No RESEND_API_KEY found. Auto-verifying user for demo.");
      user.is_verified = true;
      user.verification_token = undefined;
    }

    await user.save();

    // Send verification email
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const verificationLink = `${appUrl}/verify?token=${verificationToken}`;

    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "100Kpro <onboarding@resend.dev>",
          to: email,
          subject: "Verify your email - 100Kpro",
          html: `
            <div style="background-color: #000000; color: #ffffff; font-family: sans-serif; padding: 40px; text-align: center; border-radius: 20px;">
              <h1 style="text-transform: uppercase; letter-spacing: 2px; font-weight: 900; margin-bottom: 20px;">Verify Your Identity</h1>
              <p style="color: #a1a1aa; margin-bottom: 30px; font-size: 16px;">Welcome to the portal. Click the button below to authorize your account and gain access to the 100Kpro neural network.</p>
              <a href="${verificationLink}" style="background-color: #ffffff; color: #000000; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; text-transform: uppercase;">Verify Account</a>
              <p style="color: #71717a; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email.</p>
              <hr style="border-top: 1px solid #27272a; margin-top: 30px;">
              <p style="color: #3f3f46; font-size: 10px; margin-top: 20px;">100KPRO / 2026 / SYSTEM_MAIL</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
        // We don't fail registration if only email fails in demo
      }
    }

    res.status(201).json({ 
      message: process.env.RESEND_API_KEY 
        ? "User created. Check your email for verification." 
        : "User created and auto-verified for demo.",
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ message: "Registration failed. Internal logic error." });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Identity not found in database." });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ message: "Invalid credentials." });

    if (!user.is_verified) return res.status(400).json({ message: "Almost there! Verify your email to unlock full account access." });

    const token = jwt.sign({ _id: user._id, email: user.email }, JWT_SECRET);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000 * 24, // 24h
      sameSite: "none",
      path: "/"
    });

    res.json({ message: "Logged in", user: { name: user.name, email: user.email, has_access: user.has_access } });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login sequence failed." });
  }
});

// Logout
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ message: "Logged out" });
});

// Verify Email
app.get("/api/auth/verify", async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ message: "Identification protocol missing. Access denied." });
    
    // Check if token exists in DB
    const user = await User.findOne({ verification_token: token });
    
    if (!user) {
      return res.json({ 
        message: "Identity authenticated or already active. Redirecting to portal...",
        alreadyVerified: true 
      });
    }

    user.is_verified = true;
    user.verification_token = undefined;
    await user.save();

    // Generate token for auto-login
    const jwtToken = jwt.sign({ _id: user._id, email: user.email }, JWT_SECRET);

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: true,
      maxAge: 3600000 * 24, // 24h
      sameSite: "none",
      path: "/"
    });

    res.json({ 
      message: "Email verified successfully. Neural link active.", 
      token: jwtToken,
      user: { name: user.name, email: user.email, has_access: user.has_access }
    });
  } catch (err) {
    res.status(500).json({ message: "Verification sequence corrupted." });
  }
});

// Get Current User
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      res.clearCookie("token");
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Internal server error during identity check" });
  }
});

// --- Payment Routes ---

app.post("/api/payments/create-order", authenticateToken, async (req, res) => {
  console.log("CREATE ORDER API HIT by user:", req.user?.email);
  try {
    const rzp = getRazorpay();
    const options = {
      amount: 49900, // Rs 499 in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await rzp.orders.create(options);
    console.log("Razorpay order created:", order.id);
    res.json(order);
  } catch (err) {
    console.error("Order Creation Error Details:", err);
    // If it's a 401/403 from Razorpay, it might mean bad credentials
    const errorMessage = err.message || "Failed to initiate payment protocol.";
    res.status(err.statusCode || 500).json({ 
      message: errorMessage,
      details: err.error ? err.error.description : "Gateway rejected request."
    });
  }
});

app.post("/api/payments/verify", authenticateToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_secret) {
      return res.status(500).json({ message: "Payment verification failed: secret missing." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      await User.findByIdAndUpdate(req.user._id, { has_access: true });
      res.json({ success: true, message: "Payment verified and access granted" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Forgot Password
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: "If an account exists with that email, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.reset_token = resetToken;
    await user.save();

    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "100Kpro <security@resend.dev>",
        to: email,
        subject: "Reset your password - 100Kpro",
        html: `
          <div style="background-color: #000000; color: #ffffff; font-family: sans-serif; padding: 40px; text-align: center; border-radius: 20px;">
            <h1 style="text-transform: uppercase; letter-spacing: 2px; font-weight: 900; margin-bottom: 20px;">Password Reset</h1>
            <p style="color: #a1a1aa; margin-bottom: 30px; font-size: 16px;">We received a request to reset your password. Click the button below to secure your account.</p>
            <a href="${resetLink}" style="background-color: #FACC15; color: #000000; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; text-transform: uppercase;">Reset Password</a>
            <p style="color: #71717a; font-size: 12px; margin-top: 30px;">This link will expire soon. If you did not request this, please ignore this email.</p>
            <hr style="border-top: 1px solid #27272a; margin-top: 30px;">
            <p style="color: #3f3f46; font-size: 10px; margin-top: 20px;">100KPRO / 2026 / SECURITY_SYSTEM</p>
          </div>
        `,
      });
    } else {
      console.log("No RESEND_API_KEY. Reset link:", resetLink);
    }

    res.json({ message: "If an account exists with that email, a reset link has been sent." });
  } catch (err) {
    res.status(500).json({ message: "Reset request failed." });
  }
});

// Reset Password
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ message: "Invalid request or weak password." });
    }

    const user = await User.findOne({ reset_token: token });
    if (!user) return res.status(400).json({ message: "Invalid or expired reset token." });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.reset_token = undefined;
    await user.save();

    res.json({ message: "Password updated successfully. Please login with your new credentials." });
  } catch (err) {
    res.status(500).json({ message: "Password reset sequence corrupted." });
  }
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("GLOBAL_ERROR_HANDLER:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    status: "error",
    message: err.message || "An unexpected error occurred internal to the system.",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
