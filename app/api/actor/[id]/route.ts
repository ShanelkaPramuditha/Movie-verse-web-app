import { NextResponse, NextRequest } from "next/server";
import {
  sanitizeObject,
  containsPII,
  logPIIDetection,
} from "@/lib/utils/sanitize";
import { addCorsHeaders, handleCorsPreflightRequest } from "@/lib/utils/cors";

const BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    const response = NextResponse.json(
      { error: "Actor ID is required" },
      { status: 400 }
    );
    return addCorsHeaders(response, req);
  }

  try {
    // Fetch actor details
    const actorRes = await fetch(
      `${BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    const actorData = await actorRes.json();

    // Fetch actor movie credits
    const creditsRes = await fetch(
      `${BASE_URL}/person/${id}/movie_credits?api_key=${TMDB_API_KEY}&language=en-US`
    );
    const creditsData = await creditsRes.json();

    // Sanitize both responses
    const sanitizedActorData = sanitizeObject(actorData, true);
    const sanitizedCreditsData = sanitizeObject(creditsData, true);

    // Log PII detection for monitoring
    if (process.env.NODE_ENV !== "production") {
      if (containsPII(JSON.stringify(actorData))) {
        logPIIDetection("TMDB-actor", `actor-${id}`, JSON.stringify(actorData));
      }
      if (containsPII(JSON.stringify(creditsData))) {
        logPIIDetection(
          "TMDB-credits",
          `actor-${id}`,
          JSON.stringify(creditsData)
        );
      }
    }

    // Return combined response
    const response = NextResponse.json({
      id: sanitizedActorData.id,
      name: sanitizedActorData.name,
      birthday: sanitizedActorData.birthday,
      place_of_birth: sanitizedActorData.place_of_birth,
      biography: sanitizedActorData.biography,
      profile_image: `https://image.tmdb.org/t/p/w500${sanitizedActorData.profile_path}`,
      popularity: sanitizedActorData.popularity,
      known_for: sanitizedActorData.known_for_department,
      movies: sanitizedCreditsData.cast.map((movie: any) => ({
        id: movie.id,
        title: movie.title,
        character: movie.character,
        release_date: movie.release_date,
        poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      })),
    });
    return addCorsHeaders(response, req);
  } catch (error) {
    console.error("Error fetching actor details:", error);
    const response = NextResponse.json({ error: "Server error" }, { status: 500 });
    return addCorsHeaders(response, req);
  }
}
