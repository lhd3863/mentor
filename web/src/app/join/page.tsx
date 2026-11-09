import { AuthCard } from "@/components/AuthCard";
import { StudentSignupForm } from "@/components/AuthForms";

// /join?code=ABC123 으로 들어오면 초대코드가 미리 채워진다 (QR·링크 공유용)
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return (
    <AuthCard title="학생 가입">
      <StudentSignupForm initialCode={code?.toUpperCase().slice(0, 12)} />
    </AuthCard>
  );
}
