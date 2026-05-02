export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-stovest-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-stovest-blue/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 border-2 border-stovest-blue rounded-lg flex items-center justify-center font-mono text-stovest-blue-light text-sm font-medium shadow-[0_0_20px_rgba(29,78,216,0.3)]">
            A
          </div>
          <div>
            <div className="text-white font-syne font-bold text-lg leading-none">Arc<span className="text-gray-500 font-normal">Arena</span></div>
            <div className="text-gray-500 text-xs tracking-widest uppercase leading-none mt-0.5">
              Compete · Collect · Rise
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}