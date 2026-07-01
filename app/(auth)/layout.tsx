export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7faf8] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#b8efc9] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div
          className="absolute top-40 right-10 w-72 h-72 bg-[#bff43f] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{ animation: "pulse 8s infinite alternate" }}
        />
        <div
          className="absolute -bottom-20 left-1/3 w-80 h-80 bg-[#aff1c5] rounded-full mix-blend-multiply filter blur-3xl opacity-20"
          style={{ animation: "pulse 6s infinite alternate-reverse" }}
        />
      </div>
      <div className="w-full max-w-md z-10 relative">
        {children}
      </div>
    </div>
  );
}
