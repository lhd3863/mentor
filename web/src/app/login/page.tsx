import { redirect } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "@/components/AuthForms";
import { homePathFor } from "@/lib/students";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    redirect(homePathFor(profile?.role));
  }

  const { notice } = await searchParams;
  return (
    <AuthCard title="로그인">
      {notice === "confirm" && (
        <p className="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          이메일 인증이 처리되었습니다. 로그인해 주세요.
        </p>
      )}
      <LoginForm />
    </AuthCard>
  );
}
