import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { WatchList } from "@/lib/models/watchlist";
import { getAuthSession } from "@/lib/auth";
import { handleCorsPreflightRequest, addCorsHeaders } from "@/lib/utils/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

// Create a new watchlist
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return addCorsHeaders(response, req);
    }

    const { name } = await req.json();
    if (!name) {
      const response = NextResponse.json({ error: "Name is required" }, { status: 400 });
      return addCorsHeaders(response, req);
    }

    await connectDB();
    const watchlist = await WatchList.create({
      name,
      userId: session.user.id,
      items: [],
    });

    const response = NextResponse.json(watchlist);
    return addCorsHeaders(response, req);
  } catch (error) {
    const response = NextResponse.json({ error: "Server error" }, { status: 500 });
    return addCorsHeaders(response, req);
  }
}

// Get all watchlists for the user
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      return addCorsHeaders(response, req);
    }

    await connectDB();
    const watchlists = await WatchList.find({ userId: session.user.id });
    const response = NextResponse.json(watchlists);
    return addCorsHeaders(response, req);
  } catch (error) {
    const response = NextResponse.json({ error: "Server error" }, { status: 500 });
    return addCorsHeaders(response, req);
  }
}

