"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ClassFormState = { error?: string; message?: string; nonce?: number } | undefined;

// 헷갈리는 글자(0/O, 1/I/L)를 뺀 31자 → 6자리 초대코드 (약 8억 가지)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_TRIES = 5;
const UNIQUE_VIOLATION = "23505";
// 248 = 31 × 8: 이 이상 값은 버려서 모든 글자가 같은 확률로 나오게 한다
const BYTE_LIMIT = 256 - (256 % ALPHABET.length);

function makeInviteCode() {
  let code = "";
  while (code.length < CODE_LENGTH) {
    for (const b of crypto.getRandomValues(new Uint8Array(CODE_LENGTH * 2))) {
      if (b < BYTE_LIMIT && code.length < CODE_LENGTH) code += ALPHABET[b % ALPHABET.length];
    }
  }
  return code;
}

export async function createClass(_prev: ClassFormState, formData: FormData): Promise<ClassFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "반 이름을 입력하세요." };
  if (name.length > 40) return { error: "반 이름은 40자 이하로 입력하세요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  for (let i = 0; i < MAX_TRIES; i++) {
    const { error } = await supabase
      .from("classes")
      .insert({ name, teacher_id: user.id, invite_code: makeInviteCode() });
    if (!error) {
      revalidatePath("/teacher");
      return { message: `'${name}' 반을 만들었습니다.`, nonce: Date.now() };
    }
    if (error.code !== UNIQUE_VIOLATION) {
      // RLS 거부 = 교사 계정이 아님
      if (error.code === "42501") return { error: "교사 계정만 반을 만들 수 있습니다." };
      return { error: `반을 만들지 못했습니다: ${error.message}` };
    }
  }
  return { error: "초대코드를 만들지 못했습니다. 다시 시도하세요." };
}

export async function regenerateInviteCode(classId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  for (let i = 0; i < MAX_TRIES; i++) {
    const { data, error } = await supabase
      .from("classes")
      .update({ invite_code: makeInviteCode() })
      .eq("id", classId)
      .select("id");
    if (!error) {
      if (!data?.length) return { error: "이 반의 코드를 바꿀 권한이 없습니다." };
      revalidatePath("/teacher");
      return {};
    }
    if (error.code !== UNIQUE_VIOLATION) return { error: `코드를 바꾸지 못했습니다: ${error.message}` };
  }
  return { error: "초대코드를 만들지 못했습니다. 다시 시도하세요." };
}
