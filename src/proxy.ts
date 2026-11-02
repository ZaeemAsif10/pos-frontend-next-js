import { NextResponse, type NextRequest } from "next/server";

// Public auth routes (guest only)
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
];

// Public marketing & informational routes (accessible to anyone)
const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/help",
  "/terms",
  "/privacy",
];

function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve auth token from cookies
  const token = request.cookies.get("paperless_access_token")?.value;
  const isAuthenticated = Boolean(token);

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));

  // Case 1: Already authenticated user trying to access /login, /register, etc. -> Send to dashboard
  if (isAuthenticated && isAuthRoute) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Case 2: Public marketing routes or guest auth routes -> Allow directly
  if (isPublicRoute || isAuthRoute) {
    return NextResponse.next();
  }

  // Case 3: Unauthenticated user trying to access protected routes (e.g. /dashboard, /admin) -> Redirect to /login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Case 4: Super Admin route protection (/admin or /admin/*)
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminRoute) {
    const payload = token ? parseJwtPayload(token) : null;
    if (!payload?.is_superadmin) {
      // Non-superadmin user (e.g. Accountant, Cashier, Manager) -> Block and send to /dashboard
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("error", "unauthorized_admin_access");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
