import { NextRequest, NextResponse } from 'next/server';

// CORS configuration for Cross-Domain Misconfiguration fix
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.NEXT_PUBLIC_SERVER_URL,
  // Add your production domain here
].filter(Boolean) as string[];

export function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  return response;
}

export function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  
  if (origin && allowedOrigins.includes(origin)) {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Max-Age', '86400');
    
    return new NextResponse(null, { status: 200, headers });
  }
  
  return new NextResponse(null, { status: 403 });
}