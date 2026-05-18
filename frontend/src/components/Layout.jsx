import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/orders', label: 'Orders', icon: '📦' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-ocean-900 text-white flex flex-col">
        <div className="p-6 border-b border-ocean-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐟</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">Fish Farm</h1>
              <p className="text-ocean-200 text-xs">Management System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map(({ to, label, icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ocean-700 text-white'
                    : 'text-ocean-200 hover:bg-ocean-800 hover:text-white'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-ocean-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-ocean-700 flex items-center justify-center text-sm font-bold">
              {user?.full_name?.[0] || user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name || user?.username}</p>
              <p className="text-ocean-300 text-xs truncate">{user?.email || 'Administrator'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full text-left text-ocean-300 hover:text-white text-sm px-3 py-1.5 rounded hover:bg-ocean-800 transition-colors">
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
