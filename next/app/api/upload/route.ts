// This route has been moved to the backend to handle large file uploads and processing
// See: backend/src/routes/upload.ts

export const runtime = "edge";
export async function POST() {
  return new Response(
    JSON.stringify({
      error: "This endpoint is deprecated. Use the backend /api/upload endpoint instead.",
    }),
    { status: 410 }
  );
}
