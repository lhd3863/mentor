import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 관리자(secret 키) 클라이언트: RLS를 무시하므로 서버 코드에서만, 꼭 필요한 곳에만 쓴다.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
