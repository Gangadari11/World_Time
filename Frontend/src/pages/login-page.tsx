import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { Landmark, Loader2 } from "lucide-react"

import { InitialAdminSetupForm } from "@/components/auth/admin-signup-form"
import { SignInForm } from "@/components/auth/signin-form"
import { useAuth } from "@/hooks/useAuth"
import { useAdminSetup } from "@/hooks/useAdminSetup"
import { useToast } from "@/hooks/useToast"


export function LoginPage() {
	const [adminNeeded, setAdminNeeded] = useState(false)
	const { isAuthenticated } = useAuth()

	const { checkAdminSetup, setupLoading, setupError, clearSetupError } = useAdminSetup()
	const { addToast } = useToast()

	useEffect(() => {
		let isActive = true

		async function checkSetupStatus() {
			setAdminNeeded(false)
			clearSetupError()
			try {
				const canSetup = await checkAdminSetup()
				if (isActive) { 
					setAdminNeeded(canSetup)
				}
			} catch (err) {
				addToast({
					title: "Error",
					description: "An unexpected error occurred while checking system setup status.",
					type: "error",
				})
			}
		}

		checkSetupStatus()

		return () => {
			isActive = false
		}
	}, [])

	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />
	}

	const showBootstrap = adminNeeded
	const heading = showBootstrap ? "Register initial admin account" : "Sign in to manage leases"
	const subheading = showBootstrap ? "This one-time setup unlocks user management and reporting." : "Securely access branch data, payment schedules, and reporting."

	return (
		<div className="grid h-svh grid-cols-1 overflow-hidden bg-background text-foreground lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
			<div className="flex flex-col justify-between overflow-y-auto px-6 py-10 sm:px-12 lg:px-14">
				<div className="flex items-center gap-2 text-sm font-semibold">
					<span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
						<Landmark className="size-4" />
					</span>
					<span>Softlogic Life</span>
				</div>

				<div className="mx-auto flex w-full max-w-md flex-col gap-6">
					<div className="space-y-2">
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
							IFRS 16 Lease Suite
						</p>
						<h1 className="text-3xl font-semibold">{heading}</h1>
						<p className="text-sm text-muted-foreground">{subheading}</p>
					</div>

					{setupLoading ? (
						<div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
							<Loader2 className="size-4 animate-spin" />
							<span>Checking system setup...</span>
						</div>
					) : setupError ? (
						<div className="rounded-xl border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
							{setupError}
						</div>
					) : showBootstrap ? (
						<InitialAdminSetupForm onCreated={() => setAdminNeeded(false)} />
					) : (
						<SignInForm />
					)}
				</div>

				{!showBootstrap && (
					<p className="text-xs text-muted-foreground">
						Need access? Contact your system administrator.
					</p>
				)}
			</div>

			<div className="hidden h-svh items-stretch justify-center overflow-hidden border-l bg-card lg:flex">
				<img
					src="/src/assets/pic.jpg"
					alt="Lease management overview"
					className="h-full w-full object-cover"
				/>
			</div>
		</div>
	)
}
