'use server'

import { createSession, deleteSession } from '@/lib/session'
import { createUser, getUserByEmail } from '@/db/db'
import { redirect } from 'next/navigation'

// --- PBKDF2 Password Hashing via Web Crypto API ---

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  const hashArray = new Uint8Array(derivedBits)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, storedHashHex] = stored.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  )
  const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex === storedHashHex
}

// --- Server Actions ---

export async function signup(state: any, formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  const errors: Record<string, string> = {}

  if (!name || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  }
  if (!email || !email.includes('@')) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  // Check if email is already taken
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    return { errors: { email: 'An account with this email already exists.' } }
  }

  const passwordHash = await hashPassword(password)
  const userId = crypto.randomUUID()

  await createUser(userId, email, passwordHash, name.trim())
  await createSession(userId)
  redirect('/workspace')
}

export async function login(state: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const errors: Record<string, string> = {}

  if (!email || !email.includes('@')) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!password) {
    errors.password = 'Please enter your password.'
  }

  if (Object.keys(errors).length > 0) {
    return { errors }
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return { errors: { email: 'No account found with this email.' } }
  }

  const validPassword = await verifyPassword(password, user.passwordHash)
  if (!validPassword) {
    return { errors: { password: 'Incorrect password.' } }
  }

  await createSession(user.id)
  redirect('/workspace')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
