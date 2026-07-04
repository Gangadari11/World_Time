import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type UserRole, USER_ROLES as userRoles } from "@/types/user"
import { RoleGate } from "@/components/auth/role-gate"


type HorizontalTab = {
	value: string
	label: string
	allowedRoles?: UserRole[]
}

type HorizontalTabsProps = {
	tabs: HorizontalTab[]
	value: string
	onChange: (value: string) => void
	className?: string
}

export function HorizontalTabs({ tabs, value, onChange, className }: HorizontalTabsProps) {

	return (
		<div className={cn("border-b", className)}>
			{tabs.map((tab) => (
				<RoleGate key={tab.value} allowedRoles={tab.allowedRoles ?? userRoles}>
					<Button
						key={tab.value}
						variant="ghost"
						className={cn(
							"h-10 rounded-none border-b-2 border-transparent px-4 text-muted-foreground cursor-pointer",
							value === tab.value && "border-b-primary text-primary"
						)}
						onClick={() => onChange(tab.value)}
					>
						{tab.label}
					</Button>
				</RoleGate>
			))}
		</div>
	)
}
