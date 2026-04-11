import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FUEL_TYPES = [
  { id: 'super98', name: 'Power Petrol', price: 105.50 },
  { id: 'special95', name: 'Regular Petrol', price: 96.70 },
  { id: 'diesel', name: 'Diesel', price: 89.20 },
];

export const QUANTITIES = [5, 10, 15, 20];

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'driver' | 'admin';
}

export interface Booking {
  id: string;
  user_id: string;
  driver_id: string | null;
  status: 'pending' | 'assigned' | 'on_the_way' | 'arrived' | 'refueling' | 'completed' | 'cancelled';
  fuel_type: string;
  quantity: number;
  lat: number;
  lng: number;
  address: string;
  total_price: number;
  eta_minutes: number;
  driver_name?: string;
  driver_lat?: number;
  driver_lng?: number;
}
