import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Access Denied",
  description: "You don't have permission to access this resource",
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
        </p>
        
        <Link href="/dashboard" className="inline-block">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
