import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-[var(--vs-bg)]">
      <Outlet />
    </div>
  )
}
