import mongoose from "mongoose";
import { NextResponse, NextRequest } from "next/server";
import { addCorsHeaders, handleCorsPreflightRequest } from "@/lib/utils/cors";
import { getAuthSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import { WatchList } from "@/lib/models/watchlist";

// Add item to watchlist

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function POST(request: NextRequest, req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 }); return addCorsHeaders(response, request);
    }

    const { name, movieId, releaseDate, imageUrl, moviebackdrop_path } =
      await req.json();

    const { id } = await params;

    const movie_id = new mongoose.Types.ObjectId(id);

    await connectDB();

    const existingWatchlist = await WatchList.findOne({
      _id: movie_id,
      userId: session.user.id,
      "items.movieId": movieId,
    });

    if (existingWatchlist) {
      const response = NextResponse.json(
        { error: "Movie already exists in the watchlist" },
        { status: 400 }
      ); return addCorsHeaders(response, request);
    }
    // Update the watchlist by adding the new movie and conditionally updating imageUrl
    const updatedWatchlist = await WatchList.findOneAndUpdate(
      {
        _id: movie_id,
        userId: session.user.id,
        "items.movieId": { $ne: movieId },
      },
      {
        $set: {
          $cond: {
            if: { $eq: ["$imageUrl", ""] },
            then: imageUrl,
            else: "$imageUrl",
          },
        },
        $push: {
          items: { name, movieId, releaseDate, imageUrl, moviebackdrop_path },
        },
      },
      { new: true }
    );

    if (!updatedWatchlist) {
      const response = NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      ); return addCorsHeaders(response, request);
    }

    const response = NextResponse.json(updatedWatchlist, { status: 200 }); return addCorsHeaders(response, request);
  } catch (error) {
    console.error(error);
    const response = NextResponse.json({ error: "An error occurred" }, { status: 500 }); return addCorsHeaders(response, request);
  }
}

// update watchlist image
export async function PUT(request: NextRequest, req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 }); return addCorsHeaders(response, request);
    }

    const { imageUrl } = await req.json();
    const { id } = await params;

    await connectDB();
    const watchlist = await WatchList.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), userId: session.user.id },
      {
        imageUrl,
      },
      { new: true }
    );

    if (!watchlist) {
      const response = NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      ); return addCorsHeaders(response, request);
    }

    const response = NextResponse.json(watchlist); return addCorsHeaders(response, request);
  } catch (error) {
    const response = NextResponse.json({ error: "Server error" }, { status: 500 }); return addCorsHeaders(response, request);
  }
}

// Get all items in watchlist
export async function GET(request: NextRequest, req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 }); return addCorsHeaders(response, request);
    }

    await connectDB();

    const { id } = await params;

    const watchlist = await WatchList.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: session.user.id,
    });
    if (!watchlist) {
      const response = NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      ); return addCorsHeaders(response, request);
    }

    const response = NextResponse.json(watchlist); return addCorsHeaders(response, request);
  } catch (error: any) {
    console.log(`Error type: ${error.constructor.name}`);
    if (error.name === "BSONError") {
      const response = NextResponse.json({ error: "Invalid ID" }, { status: 400 }); return addCorsHeaders(response, request);
    }
    const response = NextResponse.json({ error: "Server error" }, { status: 500 }); return addCorsHeaders(response, request);
  }
}

// Delete watchlist
export async function DELETE(request: NextRequest, req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 }); return addCorsHeaders(response, request);
    }

    const { id } = await params;

    await connectDB();
    const watchlist = await WatchList.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: session.user.id,
    });

    if (!watchlist) {
      const response = NextResponse.json(
        { error: "Watchlist not found" },
        { status: 404 }
      ); return addCorsHeaders(response, request);
    }

    const response = NextResponse.json({ message: "Watchlist deleted successfully" }); return addCorsHeaders(response, request);
  } catch (error) {
    const response = NextResponse.json({ error: "Server error" }, { status: 500 }); return addCorsHeaders(response, request);
  }
}
