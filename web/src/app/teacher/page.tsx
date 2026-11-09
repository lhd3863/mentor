import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { CreateClassForm, InviteCodeActions } from "@/components/ClassForms";
import { createClient } from "@/lib/supabase/server";

type ClassRow = {
  id: string;
  name: string;
  invite_code: string;
  class_members: { count: number }[];
};

export default async function TeacherHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "student") redirect("/student");
  const isTeacher = profile?.role === "teacher" || profile?.role === "admin";

  const { data: classes, error: classesError } = isTeacher
    ? await supabase
        .from("classes")
        .select("id, name, invite_code, class_members(count)")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: true })
        .returns<ClassRow[]>()
    : { data: null, error: null };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="flex items-center justify-between">
        <p className="text-sm font-semibold text-blue-600">멘토르</p>
        <form action={logout}>
          <button className="text-sm text-gray-600 hover:underline">로그아웃</button>
        </form>
      </header>

      {!isTeacher ? (
        <>
          <h1 className="mt-4 text-2xl font-bold">교사 계정이 아닙니다</h1>
          <p className="mt-2 text-gray-600">이 화면은 교사만 이용할 수 있습니다. 원장님께 문의하세요.</p>
        </>
      ) : (
        <>
          <h1 className="mt-4 text-2xl font-bold">{profile.name} 선생님, 환영합니다</h1>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">내 반</h2>
            <p className="mt-1 text-sm text-gray-600">
              반을 만들면 초대코드가 생깁니다. 학생은 가입할 때 이 코드를 입력하면 해당 반에 자동으로 들어옵니다.
            </p>

            <div className="mt-4">
              <CreateClassForm />
            </div>

            {classesError && (
              <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                반 목록을 불러오지 못했습니다: {classesError.message}
              </p>
            )}

            {classes && classes.length === 0 && (
              <p className="mt-6 rounded-md border border-dashed p-6 text-center text-sm text-gray-500">
                아직 만든 반이 없습니다.
              </p>
            )}

            <ul className="mt-6 space-y-3">
              {classes?.map((c) => (
                <li key={c.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{c.name}</h3>
                    <span className="text-sm text-gray-500">학생 {c.class_members[0]?.count ?? 0}명</span>
                  </div>
                  <p className="mt-3 text-sm text-gray-500">초대코드</p>
                  <p className="font-mono text-2xl font-bold tracking-[0.3em]">{c.invite_code}</p>
                  <div className="mt-3">
                    <InviteCodeActions classId={c.id} code={c.invite_code} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
