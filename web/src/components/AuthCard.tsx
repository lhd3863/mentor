export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <p className="text-sm font-semibold text-blue-600">멘토르</p>
        <h1 className="mb-6 mt-1 text-xl font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}
