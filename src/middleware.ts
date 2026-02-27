import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['fr', 'en'];
const defaultLocale = 'fr';

const MOBILE_UA = /android|iphone|ipod|blackberry|iemobile|opera mini|mobile/i;

/** Routes that should NOT trigger the mobile redirect even on mobile devices */
const MOBILE_EXCLUDED = ['/mobile', '/mobile-vertical', '/dashboard-mobile', '/onboarding'];

function getLocaleFromPath(pathname: string): string {
    for (const locale of locales) {
        if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
            return locale;
        }
    }
    return defaultLocale;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Exclude static assets and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.includes('/api/') ||
        pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/)
    ) {
        return NextResponse.next();
    }

    // ── 1. Mobile UA detection ──────────────────────────────────
    const ua = request.headers.get('user-agent') || '';
    const isMobile = MOBILE_UA.test(ua);

    if (isMobile) {
        const locale = getLocaleFromPath(pathname);

        // Strip locale prefix to get the base path
        let basePath = pathname;
        for (const l of locales) {
            if (pathname.startsWith(`/${l}/`)) { basePath = pathname.slice(l.length + 1); break; }
            if (pathname === `/${l}`) { basePath = '/'; break; }
        }

        // Don't redirect if already on a mobile-specific route
        const alreadyMobile = MOBILE_EXCLUDED.some(p => basePath.startsWith(p));
        if (!alreadyMobile) {
            const url = request.nextUrl.clone();
            url.pathname = `/${locale}/mobile`;
            return NextResponse.redirect(url);
        }
    }

    // ── 2. Locale injection (existing logic) ────────────────────
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) return NextResponse.next();

    const locale = defaultLocale;
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
