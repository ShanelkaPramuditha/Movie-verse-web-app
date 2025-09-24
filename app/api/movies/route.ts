import { NextResponse, NextRequest } from "next/server";
import {
  getTrendingMovies,
  getUpcomingMovies,
  getMoviesByGenre,
  searchMovies,
  Movie,
} from "@/lib/tmdb";
import { handleCorsPreflightRequest, addCorsHeaders } from "@/lib/utils/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const id = searchParams.get("id");
  const query = searchParams.get("query");

  try {
    let data: Movie[] | undefined;

    switch (action) {
      case "trending":
        if (id || query) {
          return NextResponse.json(
            { error: "Unexpected parameters for this action" },
            { status: 400 }
          );
        }
        data = await getTrendingMovies();
        break;

      case "upcoming":
        if (id || query) {
          return NextResponse.json(
            { error: "Unexpected parameters for this action" },
            { status: 400 }
          );
        }
        data = await getUpcomingMovies();
        break;

      case "byGenre":
        if (!id || isNaN(Number(id))) {
          return NextResponse.json(
            { error: "Invalid or missing genre ID" },
            { status: 400 }
          );
        }
        data = await getMoviesByGenre(id);
        break;

      case "search":
        if (!query || query.length < 3) {
          return NextResponse.json(
            {
              error:
                "Invalid or missing search query. Query must be at least 3 characters long.",
            },
            { status: 400 }
          );
        }
        data = await searchMovies(query);
        break;

      default:
        return NextResponse.json(
          { error: `Invalid action parameter: ${action}` },
          { status: 400 }
        );
    }

    if (data && data.length > 0) {
      const response = NextResponse.json({ data });
      return addCorsHeaders(response, request);
    } else {
      const response = NextResponse.json({ error: "Data not found" }, { status: 404 });
      return addCorsHeaders(response, request);
    }
  } catch (error) {
    console.error("Error in API handler:", error);
    const response = NextResponse.json(
      {
        error: "An error occurred while processing your request",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
    return addCorsHeaders(response, request);
  }
}

