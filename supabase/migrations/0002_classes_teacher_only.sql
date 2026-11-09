-- 0002: 반 관리 권한 정리
-- 1) 반은 교사(또는 관리자)만 만들고 관리할 수 있다
-- 2) 교사는 자기 반 소속 학생 목록과 그 학생 프로필을 볼 수 있다
-- Supabase 대시보드 → SQL Editor 에 붙여 넣어 실행하세요.

-- 현재 로그인한 사람이 교사/관리자인지 (RLS 순환을 피하려고 security definer 사용)
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('teacher', 'admin')
  );
$$;

drop policy if exists "교사 본인 반 관리" on public.classes;
create policy "교사 본인 반 관리" on public.classes
  for all
  using (auth.uid() = teacher_id and public.is_teacher())
  with check (auth.uid() = teacher_id and public.is_teacher());

create policy "교사 본인 반 학생 조회" on public.class_members
  for select using (
    exists (
      select 1 from public.classes c
      where c.id = class_members.class_id and c.teacher_id = auth.uid()
    )
  );

create policy "교사 본인 반 학생 프로필 조회" on public.profiles
  for select using (
    exists (
      select 1
      from public.class_members m
      join public.classes c on c.id = m.class_id
      where m.student_id = profiles.id and c.teacher_id = auth.uid()
    )
  );
