import { ProtectedRoute } from '@/components/protected-route'
import React, { PropsWithChildren } from 'react'

function layout({children}:PropsWithChildren) {
  return (
    <ProtectedRoute requiredRole={"DONOR"}>{children}</ProtectedRoute>
  )
}

export default layout