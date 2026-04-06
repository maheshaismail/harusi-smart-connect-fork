import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.100.1/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token, status } = await req.json();

    if (!token || !status || !["confirmed", "declined"].includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid token or status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find guest by token
    const { data: guest, error: findErr } = await supabase
      .from("guests")
      .select("id, name, status")
      .eq("rsvp_token", token)
      .single();

    if (findErr || !guest) {
      return new Response(JSON.stringify({ error: "Invalid RSVP link" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status
    const { error: updateErr } = await supabase
      .from("guests")
      .update({ status })
      .eq("id", guest.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: "Failed to update RSVP" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, name: guest.name, status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
