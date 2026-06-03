import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

type AuthSuccess = { userId: string; response?: never };
type AuthFailure = { userId?: never; response: NextResponse };

export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const userId = (session.user as { id?: string }).id ?? "";
  return { userId };
}
