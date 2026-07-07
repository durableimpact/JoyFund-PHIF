import { ProtectedRoute } from '@/components/protected-route'
import React, { PropsWithChildren } from 'react'
import DonorNavbar from '@/components/dashboard/DonorNavbar'
import VerificationBanner from '@/components/dashboard/VerificationBanner'

function layout({children}: PropsWithChildren) {
  return (
    <ProtectedRoute requiredRole={"DONOR"}>
      <div className="min-h-screen flex-1 flex flex-col bg-background">
        <DonorNavbar />
        <main className="p-4 lg:p-6 flex-1 container mx-auto">
          <VerificationBanner />
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}

export default layout
