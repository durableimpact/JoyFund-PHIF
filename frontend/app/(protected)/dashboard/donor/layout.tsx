import { ProtectedRoute } from '@/components/protected-route'
import React, { PropsWithChildren } from 'react'
import DonorNavbar from '@/components/dashboard/DonorNavbar'

function layout({children}: PropsWithChildren) {
  return (
    <ProtectedRoute requiredRole={"DONOR"}>
      <div className="min-h-screen bg-background">
        <DonorNavbar />
        <main className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}

export default layout
