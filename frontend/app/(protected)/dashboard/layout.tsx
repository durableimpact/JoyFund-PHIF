import React from 'react'
import { requireAuth } from '@/lib/auth-server'

async function DashboardLayout({children}: {children: React.ReactNode}) {
  // Ensure user is authenticated before rendering dashboard
  // If not authenticated, this will redirect to /login
  await requireAuth()

  return (
    <div>{children}</div>
  )
}

export default DashboardLayout