import { NextResponse } from "next/server"

import { createSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("_connection_check").select("*").limit(1)

    if (error) {
      return NextResponse.json(
        {
          connected: false,
          error: error.message,
          hint:
            "Supabase client is configured, but the test table does not exist. Create it or change the check query.",
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ connected: true, data }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        hint: "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      },
      { status: 500 },
    )
  }
}
