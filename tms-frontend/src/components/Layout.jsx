import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#F4F6FA] font-sans">
      <Navbar />
      <main className="mx-auto max-w-[1400px] px-3 py-4 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
