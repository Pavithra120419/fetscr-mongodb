// backend.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import cluster from "cluster";     // ✅ for multi-core usage
import os from "os";              // ✅ get CPU count
import { initDB, User, Payment, ScrapedQuery } from "./database.js";

dotenv.config();



const PORT = process.env.PORT || 5000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CX = process.env.CX;
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ----------------- CLUSTER MODE -----------------
if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`⚡ Master running. Forking ${numCPUs} workers...`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {

  // ----------------- App Setup -----------------
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none"); 
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});


// Initialize DB
initDB();

// Root
app.get("/", (req, res) => {
  res.json({ success: true, message: "FETSCR backend is running (MongoDB)" });
});


//google 

app.post("/social-login/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, error: "No credential provided" });
    }

    // Verify token with Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // ✅ Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user if not found
      user = new User({
        name,
        email,
        password: null, // no password for Google auth
        plan_type: "free",
        allowed_queries: 2,
        results_per_query: 5,
        queries_used: 0,
        picture,
        provider: "google",
      });
      await user.save();
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const plan = {
      plan_type: user.plan_type || "free",
      allowed_queries: user.allowed_queries ?? 2,
      results_per_query: user.results_per_query ?? 5,
      queries_used: user.queries_used ?? 0,
    };
    plan.queries_remaining = Math.max(0, plan.allowed_queries - plan.queries_used);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, picture: user.picture },
      plan,
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ success: false, error: "Google login failed" });
  }
});



// ----------------- Signup -----------------
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashed,
      plan_type: "free",
      allowed_queries: 2,
      results_per_query: 5,
      queries_used: 0,
    });
    await newUser.save();

    res.json({ success: true, message: "User registered" });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Login -----------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ success: false, error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const plan = {
      plan_type: user.plan_type || "free",
      allowed_queries: user.allowed_queries ?? 2,
      results_per_query: user.results_per_query ?? 5,
      queries_used: user.queries_used ?? 0,
    };
    plan.queries_remaining = Math.max(0, plan.allowed_queries - plan.queries_used);

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email },
      plan,
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Reset Password -----------------
app.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword)
      return res.status(400).json({ success: false, error: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, error: "No user found with that email" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    console.error("reset password error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Middleware -----------------
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ success: false, error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }
}

// ----------------- Payments -----------------
app.post("/api/payments", authenticate, async (req, res) => {
  try {
    const { plan, amount, queries = 0, resultsPerQuery = 0, platform, upiId } = req.body;
    if (!plan || !amount || !platform || !upiId)
      return res.status(400).json({ success: false, error: "Missing payment fields" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const cleanAmount = parseFloat(String(amount).replace(/[^0-9.]/g, ""));
    if (isNaN(cleanAmount)) {
      return res.status(400).json({ success: false, error: "Invalid amount format" });
    }

    const payment = new Payment({
      user_id: user._id,
      plan,
      amount: cleanAmount,
      platform,
      upiId,
      queries,
      results_per_query: resultsPerQuery,
    });
    await payment.save();

    await User.findByIdAndUpdate(user._id, {
      plan_type: plan,
      allowed_queries: queries,
      results_per_query: resultsPerQuery,
      queries_used: 0,
      upiId,
    });

    res.json({
      success: true,
      message: "Payment recorded and plan activated",
      activePlan: { plan, amount: cleanAmount, remainingQueries: queries, resultsPerQuery, upiId },
    });
  } catch (err) {
    console.error("payment error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Set Plan -----------------
app.post("/setPlan", authenticate, async (req, res) => {
  try {
    const { plan, queries, results, resultsPerQuery } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    let plan_type = "free",
      allowed_queries = 2,
      results_per_query = 5,
      priceUSD = 0;

    if (plan === "free") {
      plan_type = "free"; 
      allowed_queries = 2; 
      results_per_query = 5;
    } else if (plan === "sub1") {
      plan_type = "sub1"; 
      allowed_queries = 30; 
      results_per_query = 20; 
      priceUSD = 21.18;
    } else if (plan === "sub2") {
      plan_type = "sub2"; 
      allowed_queries = 30; 
      results_per_query = 50; 
      priceUSD = 52.94;
    } else if (plan === "sub3") {
      plan_type = "sub3"; 
      allowed_queries = 30; 
      results_per_query = 25; 
      priceUSD = 26.47;
    } else if (plan === "sub4") {
      plan_type = "sub4"; 
      allowed_queries = 20; 
      results_per_query = 50; 
      priceUSD = 35.29;
    } else if (plan === "enterprise") {
      const q = Number(queries) || 1000;   // default 1000 queries
      const r = Number(results ?? resultsPerQuery) || 100; // default 100 results
      allowed_queries = Math.max(1, Math.min(10000, q));
      results_per_query = Math.max(1, Math.min(100, r));
      plan_type = "enterprise";
      priceUSD = ((allowed_queries * results_per_query) * 0.04).toFixed(2);
    } else {
      return res.status(400).json({ success: false, error: "Unknown plan" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      plan_type,
      allowed_queries,
      results_per_query,
      queries_used: 0,
    });

    res.json({
      success: true,
      plan: plan_type,
      allowed_queries,
      results_per_query,
      priceUSD,
      message: "Plan updated",
    });
  } catch (err) {
    console.error("setPlan error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ----------------- Get Plan -----------------
app.get("/getPlan", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const plan = {
      plan_type: user.plan_type || "free",
      allowed_queries: user.allowed_queries ?? 2,
      results_per_query: user.results_per_query ?? 5,
      queries_used: user.queries_used ?? 0,
    };
    plan.queries_remaining = Math.max(0, plan.allowed_queries - plan.queries_used);

    res.json({ success: true, plan });
  } catch (err) {
    console.error("getPlan error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- Scrape -----------------
async function scrapeGoogle(query, startIndex = 1) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&start=${startIndex}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google API error ${res.status}`);
  const data = await res.json();
  if (!data.items?.length) return [];

  let nextStartIndex = 1;
  if (data.queries?.nextPage?.[0]) nextStartIndex = data.queries.nextPage[0].startIndex;
  const hasMoreResults = nextStartIndex <= 100;

  return data.items.map((item) => ({
    name: (item.title || "").split(" - ")[0] || null,
    title: (item.title || "").split(" - ").slice(1).join(" - ") || null,
    link: item.link || null,
    snippet: item.snippet || null,
    image: item.pagemap?.cse_thumbnail?.[0]?.src || null,
    startIndex: nextStartIndex,
    hasMoreResults,
  }));
}

app.post("/scrape", authenticate, async (req, res) => {
  try {
    const { query } = req.body;
    if (!query?.trim()) return res.status(400).json({ success: false, error: "Missing query" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (user.queries_used >= user.allowed_queries)
      return res.status(403).json({ success: false, error: "Query limit reached. Please upgrade." });

    // ✅ Calculate required pages automatically based on user plan
    const pagesNeeded = Math.ceil(user.results_per_query / 10);
    const maxPages = Math.min(pagesNeeded, 10); // Google API hard limit = 100 results

    let start = 1, results = [];

    for (let i = 0; i < maxPages; i++) {
      const pageResults = await scrapeGoogle(query, start);
      if (!pageResults.length) break;
      results.push(...pageResults);

      start = pageResults[pageResults.length - 1]?.startIndex || start + 10;
      if (!pageResults[0]?.hasMoreResults) break;

      // ✅ Stop once enough results are collected
      if (results.length >= user.results_per_query) break;
    }

    // ✅ Trim to the exact number user’s plan allows
    const limited = results.slice(0, user.results_per_query);

    await new ScrapedQuery({
      user_id: user._id,
      query,
      result_count: limited.length,
    }).save();

    user.queries_used += 1;
    await user.save();

    const queries_remaining = Math.max(0, user.allowed_queries - user.queries_used);

    res.json({
      success: true,
      count: limited.length,
      results: limited,
      queries_used: user.queries_used,
      queries_remaining,
      results_per_query: user.results_per_query,
    });
  } catch (err) {
    console.error("scrape error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ----------------- History -----------------
app.get("/my-scrapes", authenticate, async (req, res) => {
  try {
    const history = await ScrapedQuery.find({ user_id: req.user.id }).sort({ timestamp: -1 });
    res.json({ success: true, history });
  } catch (err) {
    console.error("my-scrapes error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
}