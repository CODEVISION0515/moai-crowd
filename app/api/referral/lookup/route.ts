import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const admin = createAdminClient();
  const { data: ref } = await admin
    .from("referral_codes")
    .select("owner_id")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (!ref) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: profile } = await admin
    .from("profiles")
    .select("handle, display_name")
    .eq("id", ref.owner_id)
    .single();
  if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({ handle: profile.handle, display_name: profile.display_name });
}
