import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/session'

const protectedRoutes = ['/workspace']
const publicOnlyRoutes = ['/login', '/signup']

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtected = protectedRoutes.some(route => path.startsWith(route))
  const isPublicOnly = publicOnlyRoutes.some(route => path.startsWith(route))

  const cookie = req.cookies.get('session')?.value
  const session = await decrypt(cookie)

  if (isProtected && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isPublicOnly && session?.userId) {
    return NextResponse.redirect(new URL('/workspace', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.mp4$|.*\\.ico$).*)'],
}
