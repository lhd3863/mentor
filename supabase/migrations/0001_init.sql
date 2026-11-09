-- 멘토르 초기 스키마 (MVP 1단계 최소 골격)
-- Supabase 대시보드 → SQL Editor 에 붙여 넣어 실행하세요.
-- 세부 테이블(기출·문항·시험지 등)은 기획 단계의 '데이터 모델 설계' 카드에서 확정 후 추가합니다.

-- 사용자 프로필 (Supabase Auth 의 auth.users 와 1:1)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'teacher', 'student')),
  name text not null,
  school text,
  grade int,
  created_at timestamptz not null default now()
);

-- 반 (교사가 만들고 초대코드로 학생 가입)
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references public.profiles(id),
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

create table public.class_members (
  class_id uuid references public.classes(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  primary key (class_id, student_id)
);

-- 역할 기반 접근제어(RLS) 켜기
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;

-- 본인 프로필은 본인만 조회
create policy "본인 프로필 조회" on public.profiles
  for select using (auth.uid() = id);

-- 교사는 자기 반을 관리
create policy "교사 본인 반 관리" on public.classes
  for all using (auth.uid() = teacher_id);

-- 학생은 자기가 속한 반 소속 정보만 조회
create policy "학생 본인 소속 조회" on public.class_members
  for select using (auth.uid() = student_id);
