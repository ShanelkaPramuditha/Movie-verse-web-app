import { getGenres } from "@/lib/tmdb";
import { Genre } from "@/lib/tmdb";
import { addCorsHeaders, handleCorsPreflightRequest } from "@/lib/utils/cors";
import { NextRequest, NextResponse } from "next/server";

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

// Export the GET handler as a named export for Next.js App Router
export async function GET(request: NextRequest) {
  try {
    const genres: Genre[] = await getGenres(); // Fetch genres from the getGenres function
    const response = NextResponse.json(genres, { status: 200 }); // Return genres as JSON with a 200 OK status
    return addCorsHeaders(response, request);
  } catch (error) {
    const response = NextResponse.json({
        error: "An error occurred while processing your request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}
