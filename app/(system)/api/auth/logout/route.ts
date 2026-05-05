import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, destroySession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token) destroySession(token);

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
