import { SettingsNav } from '@/components/dashboard/settings-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col lg:flex-row">
      <SettingsNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
