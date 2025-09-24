import { NextResponse, NextRequest } from "next/server";
import { addCorsHeaders, handleCorsPreflightRequest } from "@/lib/utils/cors";
import connectDB from "@/lib/db";
import { WatchList } from "@/lib/models/watchlist";
import { v4 as uuidv4 } from "uuid";
import { getAuthSession } from "@/lib/auth";


// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
      return addCorsHeaders(response, request);
    }

    await connectDB(); // Connect to database
    const { watchlistId } = await request.json(); // Get watchlist ID from request

    const originalWatchlist = await WatchList.findById(watchlistId);
    if (!originalWatchlist) {
      const response = NextResponse.json(
        { error: "WatchList not found" },
        { status: 404 }
      ); return addCorsHeaders(response, request);
    }

    // Check if a snapshot already exists
    let existingSnapshot = await WatchList.findOne({
      isSnapshot: true,
      shareToken: { $exists: true },
      name: originalWatchlist.name,
      items: originalWatchlist.items,
    });

    if (existingSnapshot) {
      await WatchList.updateOne(
        { _id: existingSnapshot._id },
        {
          $set: {
            imageUrl: originalWatchlist.imageUrl,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        }
      );
      const response = NextResponse.json({
        message: "WatchList already shared!",
        shareUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/watchlist/shared/${existingSnapshot.shareToken}`,
      }); return addCorsHeaders(response, request);
    }

    // Create a new snapshot only if none exist
    const snapshotWatchlist = new WatchList({
      name: originalWatchlist.name,
      userId: null, // No owner, making it a shared snapshot
      items: originalWatchlist.items,
      shareToken: uuidv4(), // Generate a unique token
      imageUrl: originalWatchlist.imageUrl,
      isShared: true,
      isSnapshot: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await snapshotWatchlist.save();

    const response = NextResponse.json({
      message: "WatchList shared successfully!",
      shareUrl: `${process.env.NEXT_PUBLIC_SERVER_URL}/watchlist/shared/${snapshotWatchlist.shareToken}`,
    }); return addCorsHeaders(response, request);
  } catch (error) {
    console.error(error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ); return addCorsHeaders(response, request);
  }
}

