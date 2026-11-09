import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 가입 인증 메일의 링크가 돌아오는 곳: 인증 코드를 로그인 세션으로 바꾼다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/teacher`);
  }
  // 다른 브라우저에서 링크를 연 경우 등: 인증 자체는 끝났을 수 있으니 로그인으로 안내
  return NextResponse.redirect(`${origin}/login?notice=confirm`);
}
