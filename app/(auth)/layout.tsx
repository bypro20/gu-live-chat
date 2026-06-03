export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F3FF] via-[#EDE9FE] to-[#DDD6FE] p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}