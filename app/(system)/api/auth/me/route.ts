import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ role: null }, { status: 200 });
  }
  const session = getSession(token);
  if (!session) {
    return NextResponse.json({ role: null }, { status: 200 });
  }
  return NextResponse.json({ role: session.role, employeeId: session.employeeId });
}
