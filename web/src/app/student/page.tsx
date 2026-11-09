import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { gradeLabel } from "@/lib/students";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function StudentHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, school, grade")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") redirect("/teacher");

  // 학생은 반 테이블(초대코드 포함)을 직접 볼 수 없으므로, 서버에서 반 이름만 골라 보여 준다
  const { data: memberships } = await supabase.from("class_members").select("class_id").eq("student_id", user.id);
  const classIds = memberships?.map((m) => m.class_id) ?? [];
  const { data: classes } = classIds.length
    ? await createAdminClient().from("classes").select("name").in("id", classIds)
    : { data: [] };

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-blue-600">멘토르</p>
        <form action={logout}>
          <button className="text-sm text-gray-600 hover:underline">로그아웃</button>
        </form>
      </header>

      <h1 className="mt-4 text-2xl font-bold">{profile.name} 학생, 반가워요</h1>
      <p className="mt-1 text-sm text-gray-600">
        {profile.school} {gradeLabel(profile.grade)}
      </p>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-500">내 반</h2>
        {classes?.length ? (
          <ul className="mt-2 space-y-1">
            {classes.map((c) => (
              <li key={c.name} className="font-medium">
                {c.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-500">아직 들어간 반이 없어요.</p>
        )}
      </section>

      <p className="mt-6 text-sm text-gray-500">시험지의 QR을 찍으면 답안을 입력할 수 있어요. (준비 중)</p>
    </main>
  );
}
