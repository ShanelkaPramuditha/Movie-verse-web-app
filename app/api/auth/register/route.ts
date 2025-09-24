import { NextResponse, NextRequest } from "next/server";
import { addCorsHeaders, handleCorsPreflightRequest } from "@/lib/utils/cors";
import connectDB from '@/lib/db';
import User from '@/lib/models/user';


// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest, req: Request) {
  try {
    const { email, password, name, role = 'user' } = await req.json();

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const response = NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      ); return addCorsHeaders(response, request);
    }

    const user = await User.create({
      email,
      password,
      name,
      role,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    ); return addCorsHeaders(response, request);
  } catch (error: any) {
    const response = NextResponse.json(
      { error: error.message },
      { status: 500 }
    ); return addCorsHeaders(response, request);
  }
}