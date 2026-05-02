import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/ui/Header'
import Sidebar from '@/components/ui/Sidebar'
export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden bg-stovest-bg">
      <Sidebar profile={profile} />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative text-white">
        <Header profile={profile} />
        
        <main className="max-w-6xl mx-auto w-full px-8 py-2">
          {children}
        </main>
      </div>
    </div>
  )
}