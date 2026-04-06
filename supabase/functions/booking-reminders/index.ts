const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find bookings with event_date within 3 days that haven't had reminders sent
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const today = new Date().toISOString().split("T")[0];
    const futureDate = threeDaysFromNow.toISOString().split("T")[0];

    const { data: upcomingBookings, error } = await supabase
      .from("booking_requests")
      .select("*, vendor_profiles(business_name, phone)")
      .eq("status", "accepted")
      .gte("event_date", today)
      .lte("event_date", futureDate)
      .is("reminder_sent_at", null);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reminders: Array<{ booking_id: string; customer: string; vendor: string; event_date: string }> = [];

    for (const booking of upcomingBookings || []) {
      // Mark reminder as sent
      await supabase
        .from("booking_requests")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", booking.id);

      reminders.push({
        booking_id: booking.id,
        customer: booking.customer_name,
        vendor: (booking.vendor_profiles as any)?.business_name || "Vendor",
        event_date: booking.event_date,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminders_sent: reminders.length,
        reminders,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
