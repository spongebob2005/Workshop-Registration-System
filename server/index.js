import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Joi from "joi";
import rateLimit from "express-rate-limit";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB ?? "workshophub";
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in environment. Please add it to .env.");
  process.exit(1);
}

if (!JWT_SECRET || JWT_SECRET === "your-secret-key-change-in-production") {
  console.error("Missing or default JWT_SECRET in environment. Please set a secure JWT_SECRET in .env.");
  process.exit(1);
}

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: "Too many login attempts, please try again later."
});

app.use(limiter);
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));

let db;
let client;

const connectDb = async () => {
  if (db) return db;
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("workshops").createIndex({ id: 1 }, { unique: true }),
    db.collection("bookings").createIndex({ id: 1 }, { unique: true }),
    db.collection("payments").createIndex({ id: 1 }, { unique: true }),
    db.collection("events").createIndex({ timestamp: -1 }),
  ]);

  return db;
};

const getCollection = async (name) => {
  const database = await connectDb();
  return database.collection(name);
};

const logEvent = async (event) => {
  const col = await getCollection("events");
  await col.insertOne({ ...event, timestamp: new Date() });
};

const adjustWorkshopSeats = async (workshopId, delta) => {
  if (!workshopId) return;
  const col = await getCollection("workshops");
  const result = await col.findOneAndUpdate(
    { id: workshopId },
    { $inc: { availableSeats: delta } },
    { returnDocument: "after" }
  );

  if (result.value && result.value.availableSeats < 0) {
    await col.updateOne({ id: workshopId }, { $set: { availableSeats: 0 } });
  }
};

const upsertDocument = async (collectionName, query, value) => {
  const collection = await getCollection(collectionName);
  await collection.updateOne(query, { $set: value }, { upsert: true });
};

const appLogger = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Authorization middleware for admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Input validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'admin').required()
});

const registerSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('student', 'admin').default('student')
});

const emailParamSchema = Joi.object({
  email: Joi.string().email().required()
});

app.use(appLogger);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/users", authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const users = await (await getCollection("users")).find({}).toArray();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.post("/api/login", authLimiter, async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const { email, password, role } = value;
    const user = await (await getCollection("users")).findOne({ email, role });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logEvent({ type: "login", userId: user.id, email: user.email, role: user.role });

    const { password: _password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message });
    }

    const user = { ...value };
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;

    await upsertDocument("users", { email: user.email }, user);
    await logEvent({ type: "register", userId: user.id, email: user.email, role: user.role });

    const { password: _password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.put("/api/users/:email", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error } = emailParamSchema.validate({ email: req.params.email });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const email = req.params.email;
    const updates = req.body;
    const users = await getCollection("users");
    const existingUser = await users.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }
    const updatedUser = { ...existingUser, ...updates };
    if (updates.password) {
      updatedUser.password = await bcrypt.hash(updates.password, 10);
    }
    await users.updateOne({ email }, { $set: updatedUser });
    const { password: _password, ...userWithoutPassword } = updatedUser;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.delete("/api/users/:email", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error } = emailParamSchema.validate({ email: req.params.email });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    await (await getCollection("users")).deleteOne({ email: req.params.email });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.get("/api/workshops", async (_req, res) => {
  try {
    const workshops = await (await getCollection("workshops")).find({}).toArray();
    res.json(workshops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.post("/api/workshops", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const workshop = req.body;
    await upsertDocument("workshops", { id: workshop.id }, workshop);
    res.json({ success: true, workshop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.put("/api/workshops/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const workshops = await getCollection("workshops");
    const existingWorkshop = await workshops.findOne({ id });
    if (!existingWorkshop) {
      return res.status(404).json({ error: "Workshop not found" });
    }
    const updatedWorkshop = { ...existingWorkshop, ...updates };
    await workshops.updateOne({ id }, { $set: updatedWorkshop });
    res.json({ success: true, workshop: updatedWorkshop });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.delete("/api/workshops/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    await (await getCollection("workshops")).deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.post("/api/workshops/init", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const workshops = req.body.workshops ?? [];
    const existing = await (await getCollection("workshops")).find({}).limit(1).toArray();
    if (existing.length > 0) {
      return res.json({ success: true, message: "Workshops already initialized" });
    }
    if (workshops.length > 0) {
      await (await getCollection("workshops")).insertMany(workshops.map((workshop) => ({ ...workshop })));
    }
    res.json({ success: true, count: workshops.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.get("/api/bookings", async (_req, res) => {
  try {
    const bookings = await (await getCollection("bookings")).find({}).toArray();
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const booking = req.body;
    const bookings = await getCollection("bookings");
    const existingBooking = await bookings.findOne({ id: booking.id });

    if (existingBooking) {
      if (existingBooking.status === "cancelled" && booking.status === "confirmed") {
        await adjustWorkshopSeats(booking.workshopId, -1);
      } else if (existingBooking.status === "confirmed" && booking.status === "cancelled") {
        await adjustWorkshopSeats(booking.workshopId, 1);
      }
    } else if (booking.status === "confirmed") {
      await adjustWorkshopSeats(booking.workshopId, -1);
    }

    await upsertDocument("bookings", { id: booking.id }, booking);
    await logEvent({ type: "booking", userId: booking.userId, workshopId: booking.workshopId, amount: booking.amount });
    res.json({ success: true, booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.delete("/api/bookings/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    await (await getCollection("bookings")).deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.get("/api/payments", async (_req, res) => {
  try {
    const payments = await (await getCollection("payments")).find({}).toArray();
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.post("/api/payments", async (req, res) => {
  try {
    const payment = req.body;
    await upsertDocument("payments", { id: payment.id }, payment);
    await logEvent({ type: "payment", paymentId: payment.id, userId: payment.userId, amount: payment.amount });
    res.json({ success: true, payment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.get("/api/admin/stats", authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const users = await (await getCollection("users")).find({}).toArray();
    const workshops = await (await getCollection("workshops")).find({}).toArray();
    const bookings = await (await getCollection("bookings")).find({}).toArray();

    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
    const adminUsers = users.filter((user) => user.role === "admin");
    const studentUsers = users.filter((user) => user.role !== "admin");

    res.json({
      totalUsers: users.length,
      totalAdmins: adminUsers.length,
      totalStudents: studentUsers.length,
      totalWorkshops: workshops.length,
      totalBookings: bookings.length,
      totalRevenue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.get("/api/events", async (_req, res) => {
  try {
    const events = await (await getCollection("events")).find({}).sort({ timestamp: -1 }).toArray();
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: String(error) });
  }
});

app.listen(PORT, async () => {
  await connectDb();
  console.log(`MongoDB API server is running on http://localhost:${PORT}`);
});
