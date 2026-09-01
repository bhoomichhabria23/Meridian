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
          className="fixed left-4 top-4 z-50 rounded-xl border border-[#b9dac2] bg-white px-3 py-2 text-sm text-[#25854d] shadow-sm md:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
      <aside className={`fixed left-0 top-0 z-40 flex min-h-screen w-64 flex-col border-r border-[#d5ebdc] bg-[#f5faf7] px-4 py-6 shadow-[8px_0_30px_rgba(31,105,59,0.06)] transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
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
            : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d9efdf] text-xs font-bold text-[#25854d]">{displayName?.[0]}</div>
          }
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-[#315343]">{displayName}</p>
            <p className="text-xs capitalize text-[#819087]">{user?.role || 'patient'}</p>
          </div>
        </div>
        <button onClick={logout} className="sidebar-link w-full text-rose-200 hover:bg-rose-500/20 hover:text-rose-100">
           <span>↪</span> Sign out
        </button>
      </div>
      </aside>
    </>
  )
}
