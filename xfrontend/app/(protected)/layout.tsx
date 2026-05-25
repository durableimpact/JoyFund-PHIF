import React, { PropsWithChildren } from 'react'

function ProtectedLayout({children}:PropsWithChildren) {
  return (
    <React.Fragment>{children}</React.Fragment>
  )
}

export default ProtectedLayout