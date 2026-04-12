import 'dotenv/config';
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
    user_id TEXT,
    amount REAL,
    method TEXT,
    status TEXT DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    transaction_ref TEXT,
    upi_ref TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  );
`);

// Safely add columns if they don't exist yet (migration safety)
const safeAddColumn = (table: string, column: string, type: string) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  } catch (_) {
    // Column already exists — ignore
  }
};
safeAddColumn('payments', 'user_id', 'TEXT');
safeAddColumn('payments', 'transaction_ref', 'TEXT');
safeAddColumn('payments', 'upi_ref', 'TEXT');

// AI Service
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20' as any,
}) : null;

// Merchant UPI config
const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID;
if (!MERCHANT_UPI_ID) {
  console.error('❌ MERCHANT_UPI_ID is not set in .env! UPI payments will not work.');
}
const MERCHANT_NAME = 'FuelresQ';

// ─── Auth routes ──────────────────────────────────────────────────────────────

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

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
    }

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

// ─── Booking routes ───────────────────────────────────────────────────────────

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

    if (!userId || !fuelType || !quantity || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();

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
      total_price: booking.total_amount, // alias for frontend compatibility
      status: booking.status,
      payment_status: booking.payment_status,
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
    // Return existing booking data (COD fee already factored in or handled separately)
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Booking | undefined;
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    res.json({
      ...booking,
      total_price: booking.total_amount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Payment routes ───────────────────────────────────────────────────────────

/**
 * POST /api/payments/create-upi
 * Generates a real UPI deep link for the given booking/amount.
 * Returns the deep link and an individual payment record ID.
 */
app.post('/api/payments/create-upi', (req, res) => {
  try {
    const { bookingId, userId, amount } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({ error: 'bookingId and amount are required' });
    }

    if (!MERCHANT_UPI_ID) {
      return res.status(500).json({ error: 'UPI not configured on server. Please set MERCHANT_UPI_ID in .env' });
    }

    // Sanitize amount to 2 decimal places — UPI mandates this
    const amountFixed = parseFloat(parseFloat(amount).toFixed(2));

    // UPI transaction note — max 50 chars
    const txnNote = `FuelresQ_${bookingId.slice(0, 20)}`;

    // Build the canonical UPI deep link
    const upiUrl = `upi://pay?pa=${encodeURIComponent(MERCHANT_UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amountFixed}&cu=INR&tn=${encodeURIComponent(txnNote)}`;

    // Also build per-app intent URLs
    const baseParams = `pa=${encodeURIComponent(MERCHANT_UPI_ID)}&pn=${encodeURIComponent(MERCHANT_NAME)}&am=${amountFixed}&cu=INR&tn=${encodeURIComponent(txnNote)}`;
    const gpayUrl = `tez://upi/pay?${baseParams}&mc=0000`;
    const phonePeUrl = `phonepe://pay?${baseParams}`;
    const paytmUrl = `paytmmp://pay?${baseParams}`;

    // Create a pending payment record
    const paymentId = uuidv4();
    db.prepare(`
      INSERT INTO payments (id, booking_id, user_id, amount, method, status)
      VALUES (?, ?, ?, ?, 'upi', 'pending')
    `).run(paymentId, bookingId, userId || null, amountFixed);

    res.json({
      paymentId,
      upiUrl,
      gpayUrl,
      phonePeUrl,
      paytmUrl,
      upiId: MERCHANT_UPI_ID,
      merchantName: MERCHANT_NAME,
      amount: amountFixed,
    });
  } catch (error) {
    console.error('UPI create error:', error);
    res.status(500).json({ error: 'Failed to generate UPI link' });
  }
});

/**
 * POST /api/payments/verify-upi
 * Called when user taps "I HAVE PAID".
 * Marks the payment and booking as completed.
 */
app.post('/api/payments/verify-upi', (req, res) => {
  try {
    const { paymentId, bookingId, transactionRef } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    const ref = transactionRef || `MANUAL_${Date.now()}`;

    // Update payment record
    if (paymentId) {
      db.prepare(`
        UPDATE payments
        SET status = 'success', transaction_ref = ?, upi_ref = ?
        WHERE id = ?
      `).run(ref, ref, paymentId);
    } else {
      // If no specific paymentId, update latest pending UPI payment for this booking
      db.prepare(`
        UPDATE payments
        SET status = 'success', transaction_ref = ?, upi_ref = ?
        WHERE booking_id = ? AND method = 'upi' AND status = 'pending'
      `).run(ref, ref, bookingId);
    }

    // Update booking payment status
    db.prepare(`
      UPDATE bookings SET payment_status = 'completed' WHERE id = ?
    `).run(bookingId);

    // Notify via socket
    io.to(`booking-${bookingId}`).emit('payment_confirmed', {
      bookingId,
      method: 'upi',
      transactionRef: ref,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      transactionRef: ref,
    });
  } catch (error) {
    console.error('UPI verify error:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

/**
 * POST /api/payments/webhook
 * Placeholder for Razorpay/Cashfree webhook auto-verification.
 */
app.post('/api/payments/webhook', (req, res) => {
  try {
    const { bookingId, transactionRef, status } = req.body;
    if (bookingId && status === 'SUCCESS') {
      db.prepare(`UPDATE bookings SET payment_status = 'completed' WHERE id = ?`).run(bookingId);
      db.prepare(`UPDATE payments SET status = 'success', transaction_ref = ? WHERE booking_id = ? AND method = 'upi'`).run(transactionRef, bookingId);
    }
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/payments/create-intent  (Stripe)
 * Unchanged — kept for card payments.
 */
app.post('/api/payments/create-intent', async (req, res) => {
  try {
    if (!stripe) {
      // Mock fallback for development
      const mockSecret = `pi_mock_${uuidv4().replace(/-/g, '')}_secret_mock`;
      return res.json({ clientSecret: mockSecret, mock: true });
    }
    const { amount, bookingId } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'inr',
      metadata: { bookingId }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: 'Stripe error' });
  }
});

/**
 * POST /api/payments/status-update
 * Generic status update (used by card mock flow).
 */
app.post('/api/payments/status-update', (req, res) => {
  try {
    const { orderId, status, method } = req.body;

    if (orderId && status === 'success') {
      const paymentId = uuidv4();
      // Upsert payment record
      const existing = db.prepare(`SELECT id FROM payments WHERE booking_id = ? AND method = ?`).get(orderId, method || 'card');
      if (existing) {
        db.prepare(`UPDATE payments SET status = 'success' WHERE booking_id = ? AND method = ?`).run(orderId, method || 'card');
      } else {
        db.prepare(`INSERT INTO payments (id, booking_id, amount, method, status) VALUES (?, ?, 0, ?, 'success')`).run(paymentId, orderId, method || 'card');
      }
      db.prepare(`UPDATE bookings SET payment_status = 'completed' WHERE id = ?`).run(orderId);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/payments/cod-confirm
 * Driver taps "Cash Collected" — marks payment and booking as complete.
 */
app.post('/api/payments/cod-confirm', (req, res) => {
  try {
    const { bookingId, orderId, driverId } = req.body;
    const id = bookingId || orderId;

    if (!id) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    // Insert or update COD payment record
    const existing = db.prepare(`SELECT id FROM payments WHERE booking_id = ? AND method = 'cod'`).get(id);
    if (existing) {
      db.prepare(`UPDATE payments SET status = 'success' WHERE booking_id = ? AND method = 'cod'`).run(id);
    } else {
      // Fetch amount from booking
      const booking = db.prepare(`SELECT total_amount FROM bookings WHERE id = ?`).get(id) as { total_amount: number } | undefined;
      const amt = booking?.total_amount || 0;
      db.prepare(`INSERT INTO payments (id, booking_id, amount, method, status) VALUES (?, ?, ?, 'cod', 'success')`).run(uuidv4(), id, amt);
    }

    // Mark booking as fully completed
    db.prepare(`UPDATE bookings SET payment_status = 'completed', status = 'completed' WHERE id = ?`).run(id);

    // Notify via socket
    io.to(`booking-${id}`).emit('payment_confirmed', {
      bookingId: id,
      method: 'cod',
    });

    res.json({ success: true, message: 'Cash payment confirmed' });
  } catch (error) {
    console.error('COD confirm error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Admin routes ─────────────────────────────────────────────────────────────

app.get('/api/admin/stats', (req, res) => {
  try {
    const countResult1 = db.prepare('SELECT COUNT(*) as count FROM bookings').get() as CountResult;
    const countResult2 = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status NOT IN ("completed", "cancelled")').get() as CountResult;
    const sumResult = db.prepare('SELECT SUM(total_amount) as sum FROM bookings WHERE payment_status = "completed"').get() as SumResult;
    const countResult3 = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE status = "online"').get() as CountResult;

    res.json({
      totalBookings: countResult1.count,
      activeBookings: countResult2.count,
      totalRevenue: sumResult.sum || 0,
      activeDrivers: countResult3.count
    });
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

// ─── Socket.IO ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-booking', (bookingId) => {
    socket.join(`booking-${bookingId}`);
  });

  socket.on('update-location', (data) => {
    socket.broadcast.emit('driver-location', data);
  });
});

app.get("/api/hello", (req, res) => res.send("Hello World"));

ViteExpress.listen(app, 3000, () => console.log("Server started on port 3000"));
