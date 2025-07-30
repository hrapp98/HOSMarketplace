import { auth } from "@/app/lib/auth"
import { NextResponse } from "next/server"
import { applyMiddleware } from "./lib/middleware"

export default auth(async (req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  const isOnEmployer = req.nextUrl.pathname.startsWith("/employer")
  const isOnFreelancer = req.nextUrl.pathname.startsWith("/freelancer")
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin")
  const isOnAuth = req.nextUrl.pathname.startsWith("/auth")
  const isOnAPI = req.nextUrl.pathname.startsWith("/api")

  // Apply security and rate limiting middleware for API routes
  if (isOnAPI) {
    try {
      const middlewareResponse = await applyMiddleware(req)
      // If middleware returns a response (e.g., rate limited), return it
      if (middlewareResponse.status !== 200 && middlewareResponse.headers.get('x-middleware') !== 'next') {
        return middlewareResponse
      }
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      )
    }
  }

  // Authentication redirects for page routes
  if (isOnAuth && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  if (isOnEmployer && (!isLoggedIn || req.auth?.user?.role !== "EMPLOYER")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isOnFreelancer && (!isLoggedIn || req.auth?.user?.role !== "FREELANCER")) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isOnAdmin && (!isLoggedIn || req.auth?.user?.role !== "ADMIN")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Include all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}