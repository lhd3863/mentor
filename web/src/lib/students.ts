// 학생 계정 관련 규칙 (서버·클라이언트 공용)

// 학생은 아이디로 로그인하지만 Supabase Auth는 이메일이 필요하므로, 실제로 쓰지 않는 내부 주소로 바꿔 저장한다.
// .invalid 는 실제로 존재할 수 없는 예약 도메인이라 메일이 나가지 않는다.
const STUDENT_EMAIL_DOMAIN = "students.mentor.invalid";

export const LOGIN_ID_PATTERN = /^[a-z0-9_]{4,20}$/;
export const LOGIN_ID_RULE = "영문 소문자·숫자·밑줄(_) 4~20자";

export function studentEmail(loginId: string) {
  return `${loginId}@${STUDENT_EMAIL_DOMAIN}`;
}

export const MIN_AGE = 14;

// 만 나이: 올해 생일이 안 지났으면 1을 뺀다 (한국 시간 기준 오늘)
export function koreanFullAge(birth: Date, today = todayInSeoul()) {
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function todayInSeoul() {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  return new Date(`${ymd}T00:00:00Z`);
}

export const GRADES = [
  { value: 7, label: "중1" },
  { value: 8, label: "중2" },
  { value: 9, label: "중3" },
  { value: 10, label: "고1" },
  { value: 11, label: "고2" },
  { value: 12, label: "고3" },
] as const;

export function gradeLabel(grade: number | null | undefined) {
  return GRADES.find((g) => g.value === grade)?.label ?? "";
}

export function homePathFor(role: string | null | undefined) {
  return role === "student" ? "/student" : "/teacher";
}
