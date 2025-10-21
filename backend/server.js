import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB Error:", err));

// --- Schemas ---
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: { type: String, default: "user" }
});
const WalletSchema = new mongoose.Schema({
  name: String,
  wallet: String,
  addedBy: String
});
const CombatSchema = new mongoose.Schema({
  name: String,
  image: String,
  power: String,
  addedBy: String
});

const User = mongoose.model("User", UserSchema);
const Wallet = mongoose.model("Wallet", WalletSchema);
const Combat = mongoose.model("Combat", CombatSchema);

// --- Routes ---
// Register new user
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ error: "User already exists" });
  await User.create({ username, password });
  res.json({ message: "Registered successfully" });
});

// Login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  res.json(user);
});

// Wallet APIs
app.get("/api/wallets", async (_, res) => res.json(await Wallet.find()));
app.post("/api/wallets", async (req, res) => res.json(await Wallet.create(req.body)));
app.put("/api/wallets/:id", async (req, res) =>
  res.json(await Wallet.findByIdAndUpdate(req.params.id, req.body, { new: true }))
);
app.delete("/api/wallets/:id", async (req, res) => {
  await Wallet.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// Combat APIs
app.get("/api/combats", async (_, res) => res.json(await Combat.find()));
app.post("/api/combats", async (req, res) => res.json(await Combat.create(req.body)));
app.put("/api/combats/:id", async (req, res) =>
  res.json(await Combat.findByIdAndUpdate(req.params.id, req.body, { new: true }))
);
app.delete("/api/combats/:id", async (req, res) => {
  await Combat.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
