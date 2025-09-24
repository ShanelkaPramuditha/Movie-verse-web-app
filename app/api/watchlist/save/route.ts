import { NextResponse, NextRequest } from "next/server";
import { addCorsHeaders, handleCorsPreflightRequest } from "@/lib/utils/cors";
import connectDB from "@/lib/db";
import { WatchList } from "@/lib/models/watchlist";
import { getAuthSession } from "@/lib/auth";


// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      const response = NextResponse.json({ error: "Please log in" }, { status: 401 }); return addCorsHeaders(response, request);
    }
    await connectDB();
    const { shareToken } = await request.json();
    const snapshot = await WatchList.findOne({ shareToken, isSnapshot: true });
    if (!snapshot) {
      const response = NextResponse.json(
        { error: "Shared watchlist not found or expired" },
        { status: 404 }
      ); return addCorsHeaders(response, request);
    }

    let existingWatchlist = await WatchList.findOne({
      name: snapshot.name,
      items: snapshot.items,
      isSnapshot: false,
    });

    if (existingWatchlist) {
      const response = NextResponse.json(
        {
          error: "Watchlist already exists!",
        },
        { status: 400 }
      ); return addCorsHeaders(response, request);
    }

    // Create a new personal copy for the user
    const newWatchlist = new WatchList({
      name: snapshot.name,
      userId: session.user.id,
      imageUrl: snapshot.imageUrl,
      items: snapshot.items,
      isShared: false,
    });

    await newWatchlist.save();

    const response = NextResponse.json({ message: "WatchList saved successfully!" }); return addCorsHeaders(response, request);
  } catch (error) {
    console.error(error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ); return addCorsHeaders(response, request);
  }
}

