import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  console.log("Middleware running for path:", req.nextUrl.pathname)

  // Create a response object that we'll modify and return
  const res = NextResponse.next()

  // Create a Supabase client specifically for the middleware
  const supabase = createMiddlewareClient({ req, res })

  // Get the session using the middleware client
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log("Middleware session check result:", !!session)
  if (session) {
    console.log("User authenticated in middleware:", session.user.email)
  }

  // Define protected routes
  const protectedRoutes = ["/dashboard", "/user-images", "/settings"]

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))
  console.log("Is protected route:", isProtectedRoute)

  // If there's no session and the user is trying to access a protected route, redirect to login
  if (!session && isProtectedRoute) {
    console.log("No session for protected route, redirecting to login")
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If there's a session and the user is trying to access login or register, redirect to dashboard
  if (session && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register")) {
    console.log("User is authenticated and trying to access login/register, redirecting to dashboard")
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Important: Return the response with the updated cookies
  console.log("Middleware completed, returning response")
  return res
}

// Update the matcher to exclude public assets and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}

