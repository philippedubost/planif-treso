import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['fr', 'en'];
const defaultLocale = 'fr';

export function middleware(request: NextRequest) {
    // Check if there is any supported locale in the pathname
    const { pathname } = request.nextUrl;

    // Exclude static assets, api routes, Next.js internal files
    if (
        pathname.startsWith('/_next') ||
        pathname.includes('/api/') ||
        pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)
    ) {
        return NextResponse.next();
    }

    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) return NextResponse.next();

    // Redirect if there is no locale
    const locale = defaultLocale;
    request.nextUrl.pathname = `/${locale}${pathname}`;

    // e.g. incoming request is /dashboard
    // The new URL is now /fr/dashboard
    return NextResponse.redirect(request.nextUrl);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
