# 멘토르

내신 맞춤 출제 시스템. 기획 문서는 [PRD.md](PRD.md).

## 폴더 구성

| 폴더 | 내용 |
|---|---|
| `web/` | Next.js(TypeScript) 웹앱: 교사·학생 화면, API, KaTeX 수식 표시 |
| `worker/` | Python(FastAPI) 워커: SymPy 수식 검증 등 무거운 작업 |
| `supabase/migrations/` | DB 스키마 SQL (Supabase SQL Editor에서 실행) |

## 처음 한 번 준비

1. **Supabase 프로젝트 만들기**: supabase.com → New project (리전: Northeast Asia (Seoul))
2. **SQL 실행**: Supabase SQL Editor에 `supabase/migrations/0001_init.sql` 내용을 붙여 넣고 실행
3. **Claude API 키 발급**: console.anthropic.com
4. **환경변수**: `web/.env.example` 을 `web/.env.local` 로 복사하고 값 채우기

## 실행

터미널 두 개를 엽니다.

```bash
# 1) 워커
cd worker
python3 -m venv .venv && source .venv/bin/activate   # 처음 한 번
pip install -r requirements.txt                       # 처음 한 번
uvicorn app.main:app --reload --port 8000

# 2) 웹
cd web
npm install          # 처음 한 번
npm run dev
```

브라우저에서 http://localhost:3000 을 열면 워커·Supabase·API 키 연결 상태를 확인할 수 있습니다.
