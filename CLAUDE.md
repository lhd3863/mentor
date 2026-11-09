# 멘토르 — 프로젝트 안내 (Claude용)

멘토르가온센터학원 전용 **내신 맞춤 출제 시스템**. 원장님(이현덕)이 Claude Code와 함께 직접 개발한다.
기획 원문은 [PRD.md](PRD.md), 기획 질문(그릴링) 진행 상황은 [질문진행_기록.md](질문진행_기록.md).

- 모든 답변·설명·코드 주석·UI 문구는 **한국어**.
- 사용자는 개발자가 아님 → Supabase 대시보드 작업 등은 클릭 순서까지 안내한다.

## 폴더 구성
| 경로 | 내용 |
|---|---|
| `web/` | Next.js 15 (App Router) + TypeScript + Tailwind 4. 교사·학생 화면, 서버 액션 |
| `worker/` | Python 3.9 FastAPI 워커. SymPy 수식 동치 검증 `POST /verify/equivalent`, `GET /health` |
| `supabase/migrations/` | DB 스키마 SQL. **사용자가 Supabase SQL Editor에서 직접 실행**한다(CLI·DB 비밀번호 없음) |
| `README.md` | 사람용 준비·실행 방법 |

## 실행
```bash
cd worker && .venv/bin/uvicorn app.main:app --reload --port 8000   # 워커
cd web && npm run dev                                                # 웹 http://localhost:3000
cd web && npm run build                                              # 변경 후 빌드 확인
```
- `next start`로 띄운 프로세스 이름은 `next-server` → 끌 때 `pkill -f next-server` (`pkill -f "next start"`는 안 먹음).
- 서버를 띄우기 전 `lsof -nP -iTCP:3000 -sTCP:LISTEN`으로 포트 점유 확인.

## 외부 서비스
- **Supabase** 프로젝트: `https://dmcokgeldpzjloxbcylk.supabase.co` (리전 Seoul, Free)
  - 새 형식 키 사용: publishable(`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`, secret(`sb_secret_…`) → `SUPABASE_SERVICE_ROLE_KEY`
  - 기본 메일 발송은 시간당 몇 통 한도 → 가짜 주소로 가입 메일 보내지 말 것(테스트 계정은 관리자 API로 생성)
  - Redirect URLs에 `http://localhost:3000/**` 추가 필요(인증 메일 콜백)
- **환경변수**: `web/.env.local` (git 제외). 항목은 `web/.env.example` 참고. secret 키 값은 출력·채팅 노출 금지.
  - `TEACHER_SIGNUP_CODE`: 교사 회원가입 코드 / `TEST_TEACHER_PASSWORD`: 테스트 교사 비밀번호
  - `ANTHROPIC_API_KEY`: **아직 미설정**
- **GitHub**: `lhd3863/mentor` — 현재 PRD만 커밋됨. **코드는 아직 커밋 안 함**(사용자 확인 후 커밋).
- **Trello** 보드 `멘토르PRD`: https://trello.com/b/z1VA2tT7
  - 리스트: 1.기획(11/9~11/20) → 2.디자인(11/23~12/4) → 3.개발(12/7~12/24) → 4.배포(12/28~1/8) → ✅ 완료
  - 마감 시각은 한국 시간 18:00(UTC 09:00). 사용자 Trello 계정 timezone이 비어 있으니 Asia/Seoul로 계산.
  - 작업을 끝내면 해당 카드 체크리스트 항목을 체크하고, 카드가 끝나면 ✅ 완료 리스트로 옮긴다.

## 인증·권한 설계
- **교사**: 이메일+비밀번호, `/signup`에서 `TEACHER_SIGNUP_CODE`를 알아야 가입. 프로필(role=teacher)은 서버에서 관리자 키로만 생성.
- **학생**: **아이디+비밀번호**(이메일 없음). 내부적으로 `{아이디}@students.mentor.invalid` 이메일로 Auth 계정 생성(`lib/students.ts`), 인증 메일 없음.
  - `/join`(또는 `/join?code=XXXXXX`)에서 반 초대코드 입력 → 해당 반에 자동 배정.
  - **만 14세 미만은 가입 불가** (생년월일로 한국 시간 기준 만 나이 계산). 보호자 동의 기능은 만들지 않는다.
- `/login` 하나로 로그인: `@` 있으면 이메일(교사), 없으면 학생 아이디. 로그인 후 역할에 따라 `/teacher` 또는 `/student`.
- 미들웨어(`src/middleware.ts`)가 세션 갱신 + `/teacher`, `/student` 비로그인 접근 차단.
- 관리자 클라이언트(`lib/supabase/admin.ts`, `server-only`)는 RLS를 무시하므로 꼭 필요한 곳(프로필 생성, 초대코드 확인, 학생에게 반 이름 보여 주기)에만 쓴다.

## DB (Supabase, RLS 켜짐)
| 마이그레이션 | 내용 | 적용 |
|---|---|---|
| `0001_init.sql` | profiles(role: admin/teacher/student), classes(invite_code unique), class_members + RLS | ✅ |
| `0002_classes_teacher_only.sql` | `is_teacher()` 함수, 반은 교사만 생성·관리, 교사는 자기 반 학생·프로필 조회 | ✅ |
| `0003_student_signup.sql` | profiles에 `login_id`(unique), `birth_date`, 학년 범위 7~12 | ⏳ **사용자 실행 대기** |

- 학년 저장값: 중1=7 … 중3=9, 고1=10 … 고3=12 (`GRADES` in `lib/students.ts`).
- 초대코드: 6자리, 헷갈리는 글자(0 O 1 I L) 제외 31자, 균등 분포(`actions/classes.ts`).
- 학생은 classes 테이블을 직접 못 봄(초대코드 보호).
- 새 SQL은 `supabase/migrations/000N_설명.sql`로 만들고 `pbcopy`로 클립보드에 복사해 사용자에게 실행 요청.

## 테스트 방법
- 테스트 교사: `teacher.test@example.com` / 비밀번호는 `.env.local`의 `TEST_TEACHER_PASSWORD`. 이 계정 소유의 반 "중2 A반 (테스트)" 존재(초대코드는 교사 화면에서 확인 — 공개 저장소이므로 문서에 적지 않음).
- RLS 검증: 관리자 키로 임시 사용자를 만들고 publishable 키로 로그인해 확인한 뒤 **반드시 삭제**. 스크립트는 `web/` 안에 임시 `.mjs`로 두고 실행 후 지운다(`@supabase/supabase-js` 해석 때문).
- 화면(서버 액션) 검증: 페이지 HTML의 hidden input(`$ACTION_REF_1`, `$ACTION_1:0`, `$ACTION_KEY` …)을 **HTML 엔티티를 풀어서**(`&quot;` → `"`) multipart로 POST하면 JS 없이 폼 제출 가능. 안 풀면 서버에서 `t is not a function` 500.

## 진행 상황 (2026-11-09 기준)
- 완료: 코드 뼈대(web·worker·DB), Supabase 연결, 교사 로그인·회원가입, 반 만들기·초대코드 발급/재발급
- 진행 중: 학생 초대코드 가입 — 코드·빌드 완료, `0003` SQL 실행 후 시험 필요
  - 시험할 것: 가입→반 자동 배정·교사 화면 학생 수 증가, 만 14세 경계(생일 전날/당일), 틀린 코드·중복 아이디, 학생의 `/teacher` 접근 차단
  - 시험 후: Trello "만 14세 미만 법정대리인 동의…" 항목을 "만 14세 이상만 가입"으로 수정, PRD 7장 개인정보·대상 학년 내용 수정
- 사용자에게 확인 필요: 만 14세 미만 제외 시 **중1 전원·중2 대부분이 가입 불가**(PRD 대상은 중1~고3)
- 남은 기획 질문: `질문진행_기록.md`의 Q14~Q18(문제 데이터 형태 등) — 기출 가져오기 개발 전에 마무리
- 다음 개발 카드: 기출 업로드·판독·확정 (Trello 개발 리스트 체크리스트 참고)
- 미처리: npm audit 경고, sharp 설치 스크립트 경고(실행엔 지장 없음)

## 코드 규칙
- 서버 액션은 `src/app/actions/`, 폼 상태는 `useActionState` + `{ error?, message? }` 반환.
- 권한은 UI가 아니라 **RLS + 서버 검증**으로 막는다. 역할(role)은 사용자 입력으로 정하지 않는다.
- 사용자에게 보여 주는 오류 문구는 한국어로 구체적으로(무엇을 하면 되는지 포함).
