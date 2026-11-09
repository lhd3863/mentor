"use client";

import { useActionState, useState, useTransition } from "react";
import { createClass, regenerateInviteCode } from "@/app/actions/classes";

export function CreateClassForm() {
  const [state, action, pending] = useActionState(createClass, undefined);
  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        {/* 성공할 때마다 nonce가 바뀌어 입력칸이 비워진다 */}
        <input
          key={state?.nonce ?? 0}
          name="name"
          required
          maxLength={40}
          placeholder="예: 중2 A반 (월수금)"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {state?.error && <p className="mt-1 text-sm text-red-600">{state.error}</p>}
        {state?.message && <p className="mt-1 text-sm text-green-700">{state.message}</p>}
      </div>
      <button
        disabled={pending}
        className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {pending ? "만드는 중…" : "반 만들기"}
      </button>
    </form>
  );
}

export function InviteCodeActions({ classId, code }: { classId: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("복사하지 못했습니다. 코드를 직접 적어 주세요.");
    }
  }

  function regenerate() {
    if (!confirm("초대코드를 새로 만들까요? 기존 코드로는 더 이상 가입할 수 없습니다.")) return;
    startTransition(async () => {
      const res = await regenerateInviteCode(classId);
      setError(res.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button onClick={copy} className="rounded-md border px-3 py-1.5 hover:bg-gray-50">
        {copied ? "복사됨 ✓" : "코드 복사"}
      </button>
      <button onClick={regenerate} disabled={pending} className="rounded-md border px-3 py-1.5 hover:bg-gray-50 disabled:opacity-50">
        {pending ? "바꾸는 중…" : "코드 새로 만들기"}
      </button>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
