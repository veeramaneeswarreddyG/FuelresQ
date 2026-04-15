import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingFooter() {
  return (
    <footer className="relative bg-black border-t border-white/5 overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-zinc-600/5 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 px-6 py-20 max-w-7xl mx-auto text-center">
        {/* Main Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="inline-flex flex-col items-center gap-6 mb-8">
            <h2 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-red-500 via-red-400 to-orange-500 bg-clip-text text-transparent">
                Built for rescue workers,
              </span>
              <br />
              <span className="text-white">by </span>
              <span style={{ fontFamily: 'Great Vibes, cursive' }} className="text-white">Buddi</span>
            </h2>
          </div>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
            FuelresQ is built to revolutionize emergency fuel delivery. We ensure stranded drivers never wait more than 15 minutes for help. Because every moment matters on the road.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
              <div className="text-3xl font-black text-red-500 mb-2">15+</div>
              <p className="text-sm text-zinc-400">Minutes Delivery Guarantee</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
              <div className="text-3xl font-black text-red-500 mb-2">24/7</div>
              <p className="text-sm text-zinc-400">Round the Clock Service</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-red-500/30 transition-colors">
              <div className="text-3xl font-black text-red-500 mb-2">100%</div>
              <p className="text-sm text-zinc-400">Safe & Certified Delivery</p>
            </div>
          </div>
        </motion.div>

        {/* Credit Line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="pt-8 border-t border-white/5"
        >
          <p className="text-sm text-zinc-500 mb-6">
            © 2026 FuelresQ India. Engineered for emergency.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 pt-8"
          >
            <p className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-600 mb-2">
              Made with{' '}
              <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />{' '}
              by
            </p>
            <span className="text-2xl text-white block text-center">Buddi</span>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}

export function CompactFooter() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-600 py-4"
    >
      Made with{' '}
      <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />{' '}
      by <span className="text-white">Buddi</span>
    </motion.div>
  );
}

export function PaymentFooter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="flex flex-col items-center gap-4 py-6"
    >
      <div className="flex items-center justify-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
        </motion.div>
      </div>
      <p className="text-sm text-zinc-400 uppercase tracking-[0.25em] font-semibold">Made with love by</p>
      <span style={{ fontFamily: 'Great Vibes, cursive' }} className="text-4xl text-white">Buddi</span>
    </motion.div>
  );
}
