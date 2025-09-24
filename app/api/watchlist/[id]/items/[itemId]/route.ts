import { NextResponse, NextRequest } from "next/server";
import { addCorsHeaders, handleCorsPreflightRequest } from "@/lib/utils/cors";
import { getAuthSession } from "@/lib/auth";
import connectDB from "@/lib/db";
import { WatchList } from "@/lib/models/watchlist";
import mongoose from "mongoose";

// Get item by id
// export async function GET(request: NextRequest, //   req: Request,
//   { params }: { params: { id: string; itemId: string } }
// ) {
//   try {
//     const session = await getAuthSession();
//     if (!session) {
//       const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 }); return addCorsHeaders(response, request);
//     }

//     await connectDB();
//     const watchlist = await WatchList.findOne({
//       _id: params.id,
//       userId: session.user.id,
//     });

//     if (!watchlist) {
//       const response = NextResponse.json(
//         { error: "Watchlist not found" },
//         { status: 404 }
//       ); return addCorsHeaders(response, request);
//     }

//     const item = watchlist.items.find(
//       (item) => item.movieId === params.itemId
//     );

//     if (!item) {
//       const response = NextResponse.json({ error: "Item not found" }, { status: 404 }); return addCorsHeaders(response, request);
//     }

//     const response = NextResponse.json(item); return addCorsHeaders(response, request);
//   } catch (error) {
//     const response = NextResponse.json({ error: "Server error" }, { status: 500 }); return addCorsHeaders(response, request);
//   }
// }

// Update item by id

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
      return addCorsHeaders(response, request);
    }

    const { id, itemId } = await params;

    const { name, movieId, releaseDate, imageUrl } = await request.json();

    await connectDB();
    const watchlist = await WatchList.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: session.user.id,
        "items.movieId": itemId,
      },
      {
        $set: {
          "items.$": {
            name,
            movieId,
            releaseDate,
            imageUrl,
          },
        },
      },
      { new: true }
    );

    if (!watchlist) {
      const response = NextResponse.json(
        { error: "Watchlist or item not found" },
        { status: 404 }
      ); return addCorsHeaders(response, request);
    }

    const response = NextResponse.json(watchlist); return addCorsHeaders(response, request);
  } catch (error) {
    const response = NextResponse.json({ error: "Server error" }, { status: 500 }); return addCorsHeaders(response, request);
  }
}

// Remove item from watchlist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) {
      const response = NextResponse.json({ error: "Unauthorized" }, { status: 401 }); 
      return addCorsHeaders(response, request);
    }

    const { id, itemId } = await params;

    await connectDB();
    const watchlist = await WatchList.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), userId: session.user.id },
      {
        $pull: {
          items: { movieId: itemId },
        },
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
