import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be provided in environment variables."
  )
}

// Session-bound server client for Server Components, Server Actions and
// Route Handlers. Uses the caller's Supabase Auth cookie so `auth.uid()`
// resolves and RLS enforces per-user ownership, instead of running as
// service-role with no ownership checks.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component render — safe to ignore because
          // middleware refreshes the session on every request.
        }
      },
    },
  })
}
