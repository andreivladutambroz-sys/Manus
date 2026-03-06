/**
 * Vercel Middleware: Bypass Protection for API Routes
 * 
 * Allows public access to /api/* routes for swarm execution
 */

export const config = {
  matcher: '/api/:path*',
};

export default function middleware(request) {
  // Allow all requests to /api/* routes
  // Remove any protection headers
  const response = new Response(null, {
    status: 200,
    headers: {
      'x-middleware-skip': '1',
    },
  });

  return response;
}
