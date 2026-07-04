import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function NotFoundPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Button asChild size="lg">
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
