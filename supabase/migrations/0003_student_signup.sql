-- 0003: 학생 가입용 컬럼
-- 학생은 이메일 대신 아이디로 로그인하고, 만 14세 이상만 가입할 수 있다(생년월일 확인).
-- Supabase 대시보드 → SQL Editor 에 붙여 넣어 실행하세요.

alter table public.profiles
  add column login_id text unique,
  add column birth_date date;

-- 학년: 중1=7 … 중3=9, 고1=10 … 고3=12
alter table public.profiles
  add constraint profiles_grade_range check (grade is null or grade between 7 and 12);
