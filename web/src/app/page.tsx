import katex from "katex";
import "katex/dist/katex.min.css";

const WORKER_URL = process.env.WORKER_URL ?? "http://localhost:8000";

async function checkWorker(): Promise<string> {
  try {
    const res = await fetch(`${WORKER_URL}/health`, { cache: "no-store" });
    return res.ok ? "연결됨" : `응답 오류 (${res.status})`;
  } catch {
    return "꺼져 있음";
  }
}

export default async function Home() {
  const workerStatus = await checkWorker();
  const supabaseReady = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const anthropicReady = Boolean(process.env.ANTHROPIC_API_KEY);
  const sample = katex.renderToString("x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}", {
    throwOnError: false,
  });

  const rows: [string, string][] = [
    ["Python 워커 (수식 검증)", workerStatus],
    ["Supabase 설정", supabaseReady ? "설정됨" : "미설정 (.env.local 확인)"],
    ["Claude API 키", anthropicReady ? "설정됨" : "미설정 (.env.local 확인)"],
  ];

  return (
    <main className="mx-auto max-w-xl p-8 font-sans">
      <h1 className="text-2xl font-bold">멘토르</h1>
      <p className="mt-1 text-sm text-gray-500">내신 맞춤 출제 시스템 — 개발 환경 점검</p>
      <a href="/login" className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
        교사 로그인
      </a>

      <table className="mt-6 w-full text-sm">
        <tbody>
          {rows.map(([name, status]) => (
            <tr key={name} className="border-b">
              <td className="py-2">{name}</td>
              <td className="py-2 text-right">{status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-8 font-semibold">수식 렌더링(KaTeX) 확인</h2>
      <div className="mt-2" dangerouslySetInnerHTML={{ __html: sample }} />
    </main>
  );
}
