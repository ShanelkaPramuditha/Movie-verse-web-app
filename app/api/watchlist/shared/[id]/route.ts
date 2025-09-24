import { NextResponse, NextRequest } from "next/server";
import { addCorsHeaders, handleCorsPreflightRequest } from "@/lib/utils/cors";
import connectDB from "@/lib/db";
import { WatchList } from "@/lib/models/watchlist";

// Get watchlist id by share token

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest, req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();
    const watchlist = await WatchList.findOne({
      shareToken: id as string,
      isSnapshot: true,
    });
    if (!watchlist) {
      const response = NextResponse.json(
        { error: "Watchlist not found or expired" },
        { status: 404 }
      ); return addCorsHeaders(response, request);
    }
    const response = NextResponse.json(watchlist); return addCorsHeaders(response, request);
  } catch (error) {
    console.error(error);
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ); return addCorsHeaders(response, request);
  }
}
