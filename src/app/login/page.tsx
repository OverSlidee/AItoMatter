'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '../actions/auth'
import { Layers } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Ambient bronze glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bronze-glow-orb pointer-events-none opacity-60" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] copper-glow-orb pointer-events-none opacity-40" />

      {/* Dot grid background */}
      <div className="dot-grid" />

      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-panel glow-card rounded-2xl p-8 md:p-10 space-y-8">
          {/* Branding */}
          <div className="flex flex-col items-center space-y-4">
            <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
              <Layers className="h-7 w-7 text-amber-500" />
            </div>
            <div className="text-center space-y-1.5">
              <h1 className="font-mono font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600 text-sm">
                VELOLABS CEM
              </h1>
              <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-zinc-500">
                AUTHENTICATION PORTAL
              </p>
            </div>
          </div>

          {/* Form */}
          <form action={action} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-500">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="operator@velolabs.io"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-3 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none transition-colors font-mono placeholder-zinc-700"
              />
              {state?.errors?.email && (
                <p className="text-red-400 text-xs font-mono">{state.errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-500">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-3 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none transition-colors font-mono placeholder-zinc-700"
              />
              {state?.errors?.password && (
                <p className="text-red-400 text-xs font-mono">{state.errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={pending}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-mono font-bold text-xs py-3.5 px-8 rounded w-full transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]"
            >
              {pending ? 'AUTHENTICATING...' : 'SIGN IN'}
            </button>
          </form>

          {/* Link to signup */}
          <div className="text-center">
            <p className="text-zinc-500 text-xs font-mono">
              No account?{' '}
              <Link href="/signup" className="text-amber-500 hover:text-amber-400 transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
