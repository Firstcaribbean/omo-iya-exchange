import { fail, ok, orderWithItems, requireProfile, supabaseRest } from "../../lib/supabase-server";

export async function GET(request: Request) {
  try {
    const profile = await requireProfile(request);
    return ok(await orderWithItems(`user_id=eq.${profile.id}&select=*`));
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireProfile(request);
    if (profile.role !== "CUSTOMER") throw new Error("Only customers can create orders.");
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) throw new Error("Add at least one service before checkout.");

    const total = items.reduce(
      (sum: number, item: any) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0,
    );
    const id = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const orders = await supabaseRest<any[]>("/orders", {
      method: "POST",
      prefer: "return=representation",
      body: {
        id,
        user_id: profile.id,
        total,
        status: "PENDING",
      },
    });

    await supabaseRest("/order_items", {
      method: "POST",
      body: items.map((item: any) => ({
        order_id: id,
        product_id: item.productId,
        name: item.name,
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        delivered_number: "",
        username: "",
        pin: "",
        otp_code: "",
        fulfillment_note: "",
      })),
    });

    return ok({ id: orders[0].id, total });
  } catch (error) {
    return fail(error, 401);
  }
}
