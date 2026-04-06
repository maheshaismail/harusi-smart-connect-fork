import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { budget, guests, location, date, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const lang = language === "sw" ? "Swahili" : "English";

    const systemPrompt = `You are a Tanzanian wedding planning AI assistant. You help couples plan their wedding by analyzing their budget, guest count, location, and date.

IMPORTANT: Respond in ${lang}.

You must return structured data using the provided tool/function.

Tanzanian wedding context:
- Currency is TZS (Tanzanian Shilling)
- Common cities: Dar es Salaam, Arusha, Mwanza, Dodoma, Mbeya, Zanzibar
- Wedding categories: Venue, Catering, MC/DJ, Photography/Video, Decoration, Makeup, Transport, Wedding Planner
- Budget should be realistic for Tanzania
- Consider local vendors and pricing`;

    const userPrompt = `Plan a wedding with these details:
- Budget: TZS ${budget.toLocaleString()}
- Guests: ${guests}
- Location: ${location}
- Date: ${date || "Not set yet"}

Provide a complete wedding plan with:
1. A budget breakdown across all categories (venue, catering, MC/DJ, photography, decoration, makeup, transport, planner, miscellaneous)
2. Tips specific to ${location}
3. A recommended timeline
4. Vendor recommendations for each category in ${location}

For vendor recommendations, suggest realistic Tanzanian vendor names and price ranges.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_wedding_plan",
                description:
                  "Generate a complete wedding plan with budget breakdown, tips, timeline, and vendor recommendations",
                parameters: {
                  type: "object",
                  properties: {
                    summary: {
                      type: "string",
                      description: "Brief overview of the wedding plan (2-3 sentences)",
                    },
                    budgetBreakdown: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: { type: "string" },
                          amount: { type: "number" },
                          percentage: { type: "number" },
                          notes: { type: "string" },
                        },
                        required: ["category", "amount", "percentage"],
                      },
                    },
                    tips: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-5 wedding planning tips specific to the location",
                    },
                    timeline: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          timeframe: { type: "string" },
                          tasks: {
                            type: "array",
                            items: { type: "string" },
                          },
                        },
                        required: ["timeframe", "tasks"],
                      },
                    },
                    vendorRecommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: { type: "string" },
                          vendors: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                name: { type: "string" },
                                priceRange: { type: "string" },
                                rating: { type: "number" },
                                description: { type: "string" },
                              },
                              required: ["name", "priceRange", "description"],
                            },
                          },
                        },
                        required: ["category", "vendors"],
                      },
                    },
                  },
                  required: [
                    "summary",
                    "budgetBreakdown",
                    "tips",
                    "timeline",
                    "vendorRecommendations",
                  ],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "generate_wedding_plan" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const plan = JSON.parse(toolCall.function.arguments);

    // Match AI-recommended vendors against real vendor_profiles in the database
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch all vendor profiles for matching
      const { data: vendors } = await supabase
        .from("vendor_profiles")
        .select("id, business_name, category, city")
        .eq("city", location);

      if (vendors && vendors.length > 0) {
        // Build a lookup: lowercase business_name -> vendor
        const vendorMap = new Map<string, { id: string; business_name: string; category: string }>();
        for (const v of vendors) {
          vendorMap.set(v.business_name.toLowerCase(), v);
        }

        // Try to match each AI recommendation to a real vendor
        for (const cat of plan.vendorRecommendations || []) {
          for (const rec of cat.vendors || []) {
            const nameLower = rec.name.toLowerCase();
            // Exact match
            const exact = vendorMap.get(nameLower);
            if (exact) {
              rec.vendorId = exact.id;
              continue;
            }
            // Partial match: check if vendor name contains or is contained by recommendation
            for (const [key, v] of vendorMap) {
              if (nameLower.includes(key) || key.includes(nameLower)) {
                rec.vendorId = v.id;
                break;
              }
            }
          }

          // Also append real vendors from this category that weren't already recommended
          const catVendors = vendors.filter(
            (v) => v.category.toLowerCase() === cat.category.toLowerCase()
          );
          const existingIds = new Set(cat.vendors.filter((r: any) => r.vendorId).map((r: any) => r.vendorId));
          for (const cv of catVendors) {
            if (!existingIds.has(cv.id) && cat.vendors.length < 5) {
              cat.vendors.push({
                name: cv.business_name,
                priceRange: "Contact for pricing",
                description: `Registered vendor in ${cv.city}`,
                vendorId: cv.id,
              });
            }
          }
        }
      }
    } catch (dbErr) {
      console.error("Vendor matching error (non-fatal):", dbErr);
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-plan error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
