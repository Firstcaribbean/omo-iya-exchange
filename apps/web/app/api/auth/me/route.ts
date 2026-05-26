import { fail, ok, requireProfile } from "../../../lib/supabase-server";

export async function GET(request: Request) {
  try {
    return ok(await requireProfile(request));
  } catch (error) {
    return fail(error, 401);
  }
}
