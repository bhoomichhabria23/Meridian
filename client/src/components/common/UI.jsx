import React, { useEffect, useMemo, useState } from 'react'

export function PageLoader() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-20 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-28 w-full" />
      </div>
      <div className="skeleton h-72 w-full" />
    </div>
  )
}

export function StatCard({ label, value, icon, color = 'teal' }) {
  const tone = {
    teal: 'from-teal-400/30 to-cyan-400/20',
    purple: 'from-purple-400/30 to-fuchsia-400/20',
    blue: 'from-blue-400/30 to-indigo-400/20',
    red: 'from-red-400/30 to-pink-400/20',
    amber: 'from-amber-400/30 to-yellow-400/20',
    green: 'from-emerald-400/30 to-teal-400/20',
  }[color]

  return (
    <div className="glass-card p-4 hover-lift">
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${tone} border border-white/20 flex items-center justify-center text-lg`}>
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-slate-300">{label}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
        </div>
      </div>
    </div>
  )
}

export function Empty({ icon = '○', title, desc }) {
  return (
    <div className="glass-card p-8 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-white font-semibold">{title}</p>
      {desc ? <p className="text-slate-300 text-sm mt-1">{desc}</p> : null}
    </div>
  )
}

export function StatusBadge({ status }) {
  const cls = {
    confirmed: 'badge-success',
    pending: 'badge-warning',
    completed: 'badge-info',
    cancelled: 'badge-danger',
  }[status] || 'badge-info'

  return <span className={cls}>{status}</span>
}

export function AnimatedCounter({ value = 0, duration = 800 }) {
  const target = useMemo(() => Number(value) || 0, [value])
  const [count, setCount] = useState(0)

  useEffect(() => {
    let frame = 0
    const steps = 24
    const tick = () => {
      frame += 1
      const progress = Math.min(frame / steps, 1)
      setCount(Math.round(target * progress))
      if (progress < 1) window.requestAnimationFrame(tick)
    }
    window.requestAnimationFrame(tick)
  }, [target, duration])

  return <>{count}</>
}
