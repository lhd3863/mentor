"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  GRADES,
  homePathFor,
  koreanFullAge,
  LOGIN_ID_PATTERN,
  LOGIN_ID_RULE,
  MIN_AGE,
  studentEmail,
} from "@/lib/students";

export type FormState = { error?: string; message?: string } | undefined;

const field = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  // 교사는 이메일, 학생은 아이디로 로그인한다
  const idOrEmail = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!idOrEmail || !password) return { error: "아이디(또는 이메일)와 비밀번호를 입력하세요." };
  const email = idOrEmail.includes("@") ? idOrEmail : studentEmail(idOrEmail);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "이메일 인증이 아직 안 됐습니다. 가입할 때 받은 메일의 링크를 눌러 주세요." };
    }
    return { error: "아이디(또는 이메일)나 비밀번호가 맞지 않습니다." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  redirect(homePathFor(profile?.role));
}

export async function signupTeacher(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");
  const code = field(formData, "code");

  const expectedCode = process.env.TEACHER_SIGNUP_CODE;
  if (!expectedCode) return { error: "서버에 교사 가입 코드가 설정되지 않았습니다. 관리자에게 문의하세요." };
  if (!name || !email || !password || !code) return { error: "모든 항목을 입력하세요." };
  if (code !== expectedCode) return { error: "교사 가입 코드가 맞지 않습니다." };
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback`, data: { name } },
  });

  if (error) {
    if (error.code === "user_already_exists") return { error: "이미 가입된 이메일입니다." };
    if (error.code === "over_email_send_rate_limit") {
      return { error: "인증 메일 발송 한도를 넘었습니다. 잠시 후 다시 시도하세요." };
    }
    return { error: `가입하지 못했습니다: ${error.message}` };
  }
  // 이메일 인증을 켜 둔 상태에서 이미 있는 이메일이면, Supabase는 빈 identities를 돌려준다
  if (!data.user || data.user.identities?.length === 0) return { error: "이미 가입된 이메일입니다." };

  // 교사 권한은 사용자 입력이 아니라 서버(관리자 키)에서만 부여한다
  const { error: profileError } = await createAdminClient()
    .from("profiles")
    .insert({ id: data.user.id, role: "teacher", name });
  if (profileError) return { error: `프로필을 저장하지 못했습니다: ${profileError.message}` };

  if (data.session) redirect("/teacher");
  return { message: `${email} 로 인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요.` };
}

export async function signupStudent(_prev: FormState, formData: FormData): Promise<FormState> {
  const inviteCode = field(formData, "inviteCode").toUpperCase().replace(/\s/g, "");
  const name = field(formData, "name");
  const loginId = field(formData, "loginId").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const birth = field(formData, "birthDate");
  const school = field(formData, "school");
  const grade = Number(field(formData, "grade"));

  if (!inviteCode || !name || !loginId || !password || !birth || !school || !grade) {
    return { error: "모든 항목을 입력하세요." };
  }
  if (!LOGIN_ID_PATTERN.test(loginId)) return { error: `아이디는 ${LOGIN_ID_RULE}로 만들어 주세요.` };
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };
  if (!GRADES.some((g) => g.value === grade)) return { error: "학년을 선택하세요." };
  if (name.length > 20 || school.length > 40) return { error: "이름 또는 학교 이름이 너무 깁니다." };

  const birthDate = new Date(`${birth}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime())) return { error: "생년월일을 확인하세요." };
  const age = koreanFullAge(birthDate);
  if (age < 0 || age > 30) return { error: "생년월일을 확인하세요." };
  if (age < MIN_AGE) {
    return { error: `만 ${MIN_AGE}세 미만은 가입할 수 없습니다. 선생님께 문의하세요.` };
  }

  // 학생은 반 정보를 직접 조회할 수 없으므로 서버(관리자 키)에서 초대코드를 확인한다
  const admin = createAdminClient();
  const { data: klass } = await admin
    .from("classes")
    .select("id")
    .eq("invite_code", inviteCode)
    .maybeSingle();
  if (!klass) return { error: "초대코드가 맞지 않습니다. 선생님께 받은 코드를 다시 확인하세요." };

  const { data: taken } = await admin.from("profiles").select("id").eq("login_id", loginId).maybeSingle();
  if (taken) return { error: "이미 사용 중인 아이디입니다. 다른 아이디를 입력하세요." };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: studentEmail(loginId),
    password,
    email_confirm: true, // 내부 주소라 인증 메일을 보내지 않는다
    user_metadata: { name },
  });
  if (createError || !created.user) {
    if (createError?.code === "email_exists") return { error: "이미 사용 중인 아이디입니다. 다른 아이디를 입력하세요." };
    return { error: `가입하지 못했습니다: ${createError?.message}` };
  }
  const userId = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    role: "student",
    name,
    login_id: loginId,
    birth_date: birth,
    school,
    grade,
  });
  const { error: memberError } = profileError
    ? { error: null }
    : await admin.from("class_members").insert({ class_id: klass.id, student_id: userId });

  if (profileError || memberError) {
    // 중간에 실패하면 만든 계정을 지워 반쯤 가입된 상태를 남기지 않는다
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
    return { error: `가입하지 못했습니다: ${(profileError ?? memberError)?.message}` };
  }

  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email: studentEmail(loginId), password });
  redirect("/student");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
