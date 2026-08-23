import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2 mb-8">
      <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
          <path d="M16 8v8M12 12h8" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="16" cy="16" r="11" stroke="white" strokeWidth="2" strokeOpacity="0.5"/>
        </svg>
      </div>
      <span className="font-display text-lg font-light text-gray-900">Meridian</span>
    </div>
  )
}

export default function Sidebar({ links }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  const displayName = user?.name || user?.displayName || 'User'
  const avatar = user?.avatar || user?.photoURL || ''

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 glass-card px-3 py-2 text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
      <aside className={`w-64 min-h-screen glass-card border-0 flex flex-col py-6 px-4 fixed left-0 top-0 z-40 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
      <Logo />

      <nav className="flex-1 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="flex items-center gap-3 px-2 mb-3">
          {avatar
            ? <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
            : <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-100 text-xs font-bold">{displayName?.[0]}</div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">{displayName}</p>
            <p className="text-xs text-slate-300 capitalize">{user?.role || 'patient'}</p>
          </div>
        </div>
        <button onClick={logout} className="sidebar-link w-full text-rose-200 hover:bg-rose-500/20 hover:text-rose-100">
          <span>🚪</span> Sign out
        </button>
      </div>
      </aside>
    </>
  )
}
