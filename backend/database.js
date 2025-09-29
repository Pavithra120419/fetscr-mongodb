// backend/database.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// ----------------- DB Connection -----------------
export async function initDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 50,   // ✅ allow 50 concurrent DB connections
      minPoolSize: 10,   // ✅ keep warm connections ready
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB Connected with Pooling");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

// ----------------- Schemas -----------------
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, index: true }, // ✅ index for fast login lookups
  password: String,
  plan_type: { type: String, default: "free" },
  allowed_queries: { type: Number, default: 2 },
  results_per_query: { type: Number, default: 5 },
  queries_used: { type: Number, default: 0 },
  last_reset: { type: Date, default: Date.now },
  upiId: String,
  created_at: { type: Date, default: Date.now },
});

const scrapedQuerySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  query: String,
  result_count: Number,
  timestamp: { type: Date, default: Date.now },
});

const paymentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  plan: String,
  amount: Number,
  platform: String,
  upiId: String,
  queries: Number,
  results_per_query: Number,
  createdAt: { type: Date, default: Date.now },
});

// ----------------- Models -----------------
export const User = mongoose.model("User", userSchema);
export const ScrapedQuery = mongoose.model("ScrapedQuery", scrapedQuerySchema);
export const Payment = mongoose.model("Payment", paymentSchema);
