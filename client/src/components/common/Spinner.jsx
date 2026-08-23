import React from 'react'

export default function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} skeleton rounded-full`} />
  )
}

export function PageSpinner() {
  return (
    <div className="space-y-3 w-full animate-fade-in">
      <div className="skeleton h-20 w-full" />
      <div className="skeleton h-20 w-full" />
      <div className="skeleton h-40 w-full" />
    </div>
  )
}
