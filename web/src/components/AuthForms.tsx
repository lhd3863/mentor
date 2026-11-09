"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signupStudent, signupTeacher, type FormState } from "@/app/actions/auth";
import { GRADES, LOGIN_ID_RULE, MIN_AGE } from "@/lib/students";

const inputClass =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none";
const buttonClass =
  "mt-2 w-full rounded-md bg-blue-600 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50";

function Field(props: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  defaultValue?: string;
  autoCapitalize?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {props.label}
      <input
        name={props.name}
        type={props.type ?? "text"}
        autoComplete={props.autoComplete}
        defaultValue={props.defaultValue}
        autoCapitalize={props.autoCapitalize}
        required
        className={inputClass}
      />
      {props.hint && <span className="mt-1 block text-xs text-gray-500">{props.hint}</span>}
    </label>
  );
}

function Status({ state }: { state: FormState }) {
  if (state?.error) return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>;
  if (state?.message) return <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">{state.message}</p>;
  return null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field
        label="아이디 또는 이메일"
        name="email"
        autoComplete="username"
        autoCapitalize="none"
        hint="학생은 아이디, 선생님은 이메일"
      />
      <Field label="비밀번호" name="password" type="password" autoComplete="current-password" />
      <Status state={state} />
      <button className={buttonClass} disabled={pending}>
        {pending ? "로그인 중…" : "로그인"}
      </button>
      <div className="space-y-1 text-center text-sm text-gray-600">
        <p>
          학생이에요{" "}
          <Link href="/join" className="font-medium text-blue-600 hover:underline">
            초대코드로 가입
          </Link>
        </p>
        <p>
          선생님이에요{" "}
          <Link href="/signup" className="font-medium text-blue-600 hover:underline">
            교사 회원가입
          </Link>
        </p>
      </div>
    </form>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState(signupTeacher, undefined);
  if (state?.message) {
    return (
      <div className="space-y-4">
        <Status state={state} />
        <Link href="/login" className={`${buttonClass} block text-center`}>
          로그인 화면으로
        </Link>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-4">
      <Field label="이름" name="name" autoComplete="name" />
      <Field label="이메일" name="email" type="email" autoComplete="email" />
      <Field label="비밀번호" name="password" type="password" autoComplete="new-password" hint="8자 이상" />
      <Field label="교사 가입 코드" name="code" hint="원장님께 받은 코드를 입력하세요" />
      <Status state={state} />
      <button className={buttonClass} disabled={pending}>
        {pending ? "가입 중…" : "가입하기"}
      </button>
      <p className="text-center text-sm text-gray-600">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}

export function StudentSignupForm({ initialCode }: { initialCode?: string }) {
  const [state, action, pending] = useActionState(signupStudent, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field
        label="초대코드"
        name="inviteCode"
        defaultValue={initialCode}
        autoCapitalize="characters"
        hint="선생님께 받은 6자리 코드"
      />
      <Field label="이름" name="name" autoComplete="name" />
      <Field label="아이디" name="loginId" autoComplete="username" autoCapitalize="none" hint={LOGIN_ID_RULE} />
      <Field label="비밀번호" name="password" type="password" autoComplete="new-password" hint="8자 이상" />
      <Field label="생년월일" name="birthDate" type="date" hint={`만 ${MIN_AGE}세 이상만 가입할 수 있어요`} />
      <Field label="학교" name="school" hint="예: 가온중학교" />
      <label className="block text-sm font-medium">
        학년
        <select name="grade" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            선택하세요
          </option>
          {GRADES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </label>
      <Status state={state} />
      <button className={buttonClass} disabled={pending}>
        {pending ? "가입 중…" : "가입하기"}
      </button>
      <p className="text-center text-sm text-gray-600">
        이미 계정이 있나요?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
