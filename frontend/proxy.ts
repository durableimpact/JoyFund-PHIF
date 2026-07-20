import { auth } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";
import type { NextProxy } from "next/server";
import { roleRedirectMap } from "@/lib/role-redirect";
import { createI18nMiddleware } from "next-international/middleware";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "fr"],
  defaultLocale: "en",
});

const protectedRoutes = ["/dashboard", "/profile", "/settings"];
const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];
const adminRoutes = ["/dashboard/admin", "/dashboard/system-admin"];

export const proxy: NextProxy = async (request, event) => {
  const i18nResponse = I18nMiddleware(request);
  if (i18nResponse.status >= 300 && i18nResponse.status < 400) {
    return i18nResponse;
  }

  const { pathname } = request.nextUrl;
  const session = await auth();

  const getLocaleFromPath = (path: string): string => {
    const segments = path.split("/").filter(Boolean);
    if (segments.length > 0 && (segments[0] === "en" || segments[0] === "fr")) {
      return segments[0];
    }
    return "en";
  };

  const locale = getLocaleFromPath(pathname);

  const localePrefix = `/${locale}`;
  const pathWithoutLocale = pathname.startsWith(localePrefix)
    ? pathname.slice(localePrefix.length) || "/"
    : pathname;

  const redirect = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${path}`;
    return NextResponse.redirect(url);
  };

  // 0. CHECK FOR REFRESH TOKEN ERRORS
  const isProtectedRoute =
    protectedRoutes.some((route) => pathWithoutLocale.startsWith(route)) ||
    adminRoutes.some((route) => pathWithoutLocale.startsWith(route));

  if (
    session &&
    (session as any).error === "RefreshAccessTokenError" &&
    isProtectedRoute &&
    !pathWithoutLocale.startsWith("/login")
  ) {
    console.warn("[proxy] Token refresh failed on protected route - forcing login");
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    loginUrl.searchParams.set("reason", "session_expired");
    const original = pathname + request.nextUrl.search;
    loginUrl.searchParams.set("redirect", original);
    return NextResponse.redirect(loginUrl);
  }

  if (session && !session.accessToken && !pathWithoutLocale.startsWith("/login")) {
    console.error("[proxy] No access token in session - forcing logout");
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    loginUrl.searchParams.set("reason", "unauthorized");
    return NextResponse.redirect(loginUrl);
  }

  // 1. PROTECTED ROUTES
  if (protectedRoutes.some((route) => pathWithoutLocale.startsWith(route))) {
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/login`;
      const original = pathname + request.nextUrl.search;
      loginUrl.searchParams.set("redirect", original);
      return NextResponse.redirect(loginUrl);
    }

    if (pathWithoutLocale === "/dashboard") {
      const userRole = (session.user as any)?.role as USER_ROLE;
      if (userRole && roleRedirectMap[userRole]) {
        return redirect(roleRedirectMap[userRole]);
      }
    }
  }

  // 2. AUTH ROUTES
  if (authRoutes.some((route) => pathWithoutLocale.startsWith(route))) {
    if (session && !(session as any).error) {
      const redirectParam = request.nextUrl.searchParams.get("redirect");
      const next = request.nextUrl.searchParams.get("next");
      const candidate = redirectParam || next || "/dashboard";

      let destination =
        candidate && candidate.startsWith("/") && !candidate.startsWith("//")
          ? candidate
          : "/dashboard";

      const userRole = (session.user as any)?.role as USER_ROLE;
      if (userRole && roleRedirectMap[userRole]) {
        destination = roleRedirectMap[userRole];
      }

      return redirect(destination);
    }
  }

  // 3. ADMIN ROUTES
  if (adminRoutes.some((route) => pathWithoutLocale.startsWith(route))) {
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/login`;
      const original = pathname + request.nextUrl.search;
      loginUrl.searchParams.set("redirect", original);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = (session?.user as any)?.role;
    const adminRoles = ["SYSTEM_ADMIN", "HOSPITAL_ADMIN"];

    if (!adminRoles.includes(userRole)) {
      console.warn(
        `[proxy] Unauthorized admin access attempt. User: ${session.user?.email}, Role: ${userRole}, Path: ${pathname}. Redirecting to correct dashboard.`,
      );
      const correctDashboard = roleRedirectMap[userRole as USER_ROLE];
      if (correctDashboard) {
        return redirect(correctDashboard);
      }
      return redirect("/unauthorized");
    }
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|monitoring|favicon.ico|sitemap\\.xml|robots\\.txt|sw\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|json|woff|woff2|ttf|eot)$).*)",
  ],
};
