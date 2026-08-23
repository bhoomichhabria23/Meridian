import React from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children, links }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar links={links} />
      <main className="flex-1 p-4 md:p-8 md:ml-64 animate-fade-in">
        {children}
      </main>
    </div>
  )
}
