import { AuthCard } from "@/components/AuthCard";
import { SignupForm } from "@/components/AuthForms";

export default function SignupPage() {
  return (
    <AuthCard title="교사 회원가입">
      <SignupForm />
    </AuthCard>
  );
}
