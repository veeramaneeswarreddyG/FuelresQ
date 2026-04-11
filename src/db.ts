import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('fuelrescue.db');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'user', -- 'user', 'driver', 'admin'
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
    status TEXT DEFAULT 'offline', -- 'online', 'offline', 'busy'
    lat REAL,
    lng REAL,
    vehicle_type TEXT,
    fuel_inventory TEXT, -- JSON string of fuel types and quantities
    rating REAL DEFAULT 5.0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    driver_id TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'on_the_way', 'arrived', 'refueling', 'completed', 'cancelled'
    fuel_type TEXT,
    quantity REAL,
    lat REAL,
    lng REAL,
    address TEXT,
    plate_number TEXT,
    total_price REAL,
    eta_minutes INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(driver_id) REFERENCES drivers(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    order_id TEXT,
    amount REAL,
    payment_method TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
    transaction_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(order_id) REFERENCES bookings(id)
  );
`);

// Migration: Ensure password column exists in users table
try {
  db.prepare("ALTER TABLE users ADD COLUMN password TEXT").run();
} catch (e) {}

// Migration: Ensure plate_number column exists in bookings table
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN plate_number TEXT").run();
} catch (e) {}

// Migration: Ensure total_price column exists in bookings table
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN total_price REAL").run();
} catch (e) {}

// Migration: Ensure stripe_customer_id column exists
try {
  db.prepare("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT").run();
} catch (e) {}

// Migration: Ensure payment tracking in bookings
try {
  db.prepare("ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending'").run();
  db.prepare("ALTER TABLE bookings ADD COLUMN payment_method TEXT").run();
} catch (e) {}

// Seed initial settings if not present
const seedSettings = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
seedSettings.run('base_price_super98', '105.50');
seedSettings.run('base_price_special95', '96.70');
seedSettings.run('base_price_diesel', '89.20');
seedSettings.run('emergency_fee', '49.00');

export default db;
