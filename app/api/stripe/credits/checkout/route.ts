import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { packageId } = await req.json();
  if (!packageId) return NextResponse.json({ error: "packageId required" }, { status: 400 });

  const { data: pkg } = await sb
    .from("credit_packages")
    .select("*")
    .eq("id", packageId)
    .eq("is_active", true)
    .single();

  if (!pkg) return NextResponse.json({ error: "package not found" }, { status: 404 });

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "jpy",
        product_data: {
          name: `【MOAI Crowd】AIクレジット: ${pkg.name}`,
          description: pkg.description || `${pkg.credits}クレジット`,
        },
        unit_amount: pkg.price_jpy,
      },
      quantity: 1,
    }],
    metadata: {
      type: "credit_purchase",
      user_id: user.id,
      package_id: pkg.id,
      credits: String(pkg.credits),
    },
    success_url: `${origin}/credits?status=success&package=${pkg.id}`,
    cancel_url: `${origin}/credits?status=canceled`,
  });

  return NextResponse.json({ url: session.url });
}
