import express from "express";
import ViteExpress from "vite-express";
import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from "@google/genai";
import Stripe from 'stripe';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Type Definitions
interface Booking {
  id: string;
  user_id: string;
  driver_id: string | null;
  status: string;
  fuel_type: string;
  quantity: number;
  lat: number;
  lng: number;
  address: string;
  plate_number: string;
  created_at: string;
  estimated_arrival: string | null;
  total_amount: number;
  payment_status: string;
}

interface CountResult {
  count: number;
}

interface SumResult {
  sum: number | null;
}

const app = express();
const server = createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());

// Database
const dbPath = path.join(process.cwd(), 'fuelrescue.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'user',
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    make TEXT,
    model TEXT,
    plate TEXT,
    fuel_type TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT DEFAULT 'offline',
    lat REAL,
    lng REAL,
    vehicle_type TEXT,
    fuel_inventory TEXT,
    rating REAL DEFAULT 5.0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    driver_id TEXT,
    status TEXT DEFAULT 'pending',
    fuel_type TEXT,
    quantity REAL,
    lat REAL,
    lng REAL,
    address TEXT,
    plate_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    estimated_arrival DATETIME,
    total_amount REAL,
    payment_status TEXT DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT,
    amount REAL,
    method TEXT,
    status TEXT,
    stripe_payment_intent_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  );
`);

// AI Service
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20' as any,
}) : null;

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, phone, role = 'user' } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO users (id, email, password, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)').run(id, email, password, name, phone, role);
    const user = db.prepare('SELECT id, email, name, phone, role, created_at FROM users WHERE id = ?').get(id);

    res.json({ success: true, user });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup' });
  }
});

// Booking routes
app.get('/api/bookings/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC').all(userId);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { userId, fuelType, quantity, lat, lng, address, plateNumber } = req.body;
    
    // Validate required fields
    if (!userId || !fuelType || !quantity || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const id = uuidv4();
    
    // Calculate amount (simple pricing) - using frontend fuel prices
    const pricePerLiter: Record<string, number> = { 
      'Power Petrol': 105.50, 
      'Regular Petrol': 96.70, 
      'Diesel': 89.20 
    };
    const amount = quantity * (pricePerLiter[fuelType] || 100);
    const totalWithFee = amount + 49; // Add emergency fee
    
    db.prepare(`
      INSERT INTO bookings (id, user_id, fuel_type, quantity, lat, lng, address, plate_number, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, fuelType, quantity, lat, lng, address, plateNumber, totalWithFee, 'pending');
    
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Booking | undefined;
    
    if (!booking) {
      return res.status(500).json({ error: 'Failed to create booking' });
    }
    
    // Map database column names to expected format
    res.json({
      id: booking.id,
      user_id: booking.user_id,
      fuel_type: booking.fuel_type,
      quantity: booking.quantity,
      lat: booking.lat,
      lng: booking.lng,
      address: booking.address,
      plate_number: booking.plate_number,
      total_amount: booking.total_amount,
      status: booking.status,
      created_at: booking.created_at
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Server error during booking creation' });
  }
});

app.post('/api/bookings/:id/add-cod-fee', (req, res) => {
  try {
    const { id } = req.params;
    // Add COD fee logic here
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Payment routes
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe not configured' });
    }
    const { amount, bookingId } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'inr',
      metadata: { bookingId }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/payments/qr-generate', (req, res) => {
  try {
    const { amount, bookingId } = req.body;
    // Generate UPI QR code
    const upiId = 'fuelresq@upi';
    const qrData = `upi://pay?pa=${upiId}&pn=FuelresQ&am=${amount}&cu=INR&tn=Fuel Delivery`;
    res.json({ qrData });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/payments/status-update', (req, res) => {
  try {
    const { paymentId, orderId, status, method } = req.body;
    // Update payment status
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/payments/cod-confirm', (req, res) => {
  try {
    const { bookingId } = req.body;
    // Confirm COD payment
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
app.get('/api/admin/stats', (req, res) => {
  try {
    const countResult1 = db.prepare('SELECT COUNT(*) as count FROM bookings').get() as CountResult;
    const countResult2 = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status NOT IN ("completed", "cancelled")').get() as CountResult;
    const sumResult = db.prepare('SELECT SUM(total_amount) as sum FROM bookings WHERE payment_status = "completed"').get() as SumResult;
    const countResult3 = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE status = "online"').get() as CountResult;
    
    const stats = {
      totalBookings: countResult1.count,
      activeBookings: countResult2.count,
      totalRevenue: sumResult.sum || 0,
      activeDrivers: countResult3.count
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/bookings', (req, res) => {
  try {
    const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 50').all();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/admin/partners', (req, res) => {
  try {
    const partners = db.prepare('SELECT * FROM drivers').all();
    res.json(partners);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-booking', (bookingId) => {
    socket.join(`booking-${bookingId}`);
  });
  
  socket.on('update-location', (data) => {
    // Broadcast location updates
    socket.broadcast.emit('driver-location', data);
  });
});

app.get("/api/hello", (req, res) => res.send("Hello World"));

ViteExpress.listen(app, 3000, () => console.log("Server started on port 3000"));
