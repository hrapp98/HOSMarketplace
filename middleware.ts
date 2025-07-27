import { auth } from "@/app/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  const isOnEmployer = req.nextUrl.pathname.startsWith("/employer")
  const isOnFreelancer = req.nextUrl.pathname.startsWith("/freelancer")
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin")
  const isOnAuth = req.nextUrl.pathname.startsWith("/auth")

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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}