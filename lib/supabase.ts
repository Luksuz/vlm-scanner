import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
}

// Use createClientComponentClient for client-side components
export const supabase = createClientComponentClient()

