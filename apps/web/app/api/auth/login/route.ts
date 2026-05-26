import { fail, mapProfile, ok, supabaseAuth, supabaseRest } from "../../../lib/supabase-server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");
    const session = await supabaseAuth<any>("/token?grant_type=password", { email, password });
    const profiles = await supabaseRest<any[]>(`/profiles?id=eq.${session.user.id}&select=*`);
    const profile = profiles[0];
    if (!profile || profile.status !== "ACTIVE") throw new Error("Account is not active.");

    return ok({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user: mapProfile(profile),
    });
  } catch (error) {
    return fail(error, 401);
  }
}
