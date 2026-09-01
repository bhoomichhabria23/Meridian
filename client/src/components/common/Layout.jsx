import React from 'react'
import Sidebar from './Sidebar'
import ReceptionNavbar from './ReceptionNavbar'

export default function Layout({ children, links }) {
  const isReceptionLayout = links?.some((link) => link.to?.startsWith('/reception'))
  if (isReceptionLayout) {
    return (
      <div className="min-h-screen bg-[#f5faf7]">
        <ReceptionNavbar />
        <main className="animate-fade-in p-4 md:p-8">
          {children}
        </main>
      </div>
    )
  }
  return (
    <div className="flex min-h-screen">
      <Sidebar links={links} />
      <main className="flex-1 p-4 md:p-8 md:ml-64 animate-fade-in">
        {children}
      </main>
    </div>
  )
}
