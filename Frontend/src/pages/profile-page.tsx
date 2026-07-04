import { useState } from "react"
import { PencilLine } from "lucide-react"

import { ProfileDetails } from "@/components/profile/profile-details"
import { ProfileUpdate, type ProfileUpdateInput } from "@/components/profile/profile-update"
import { Button } from "@/components/ui/button"
import { HorizontalTabs } from "@/components/ui/horizontal-tabs"
import { PageHeader } from "@/components/ui/page-header"
import { type UserRole } from "@/types/user"

type Profile = {
	fullName: string
	email: string
	role: UserRole
	registeredAt: string
}

const sampleProfile: Profile = {
	fullName: "System User",
	email: "user@softlogic.com",
	role: "data_entry" as UserRole,
	registeredAt: "2026-05-10T08:15:00.000Z",
}

export function ProfilePage() {
	const [activeTab, setActiveTab] = useState<"details" | "update">("details")
	const [profile, setProfile] = useState<Profile>(sampleProfile)
	const [isSaving, setIsSaving] = useState(false)

	const handleSubmit = async (payload: ProfileUpdateInput) => {
		setIsSaving(true)

		try {
			setProfile((current) => ({
				...current,
				fullName: payload.fullName,
				email: payload.email,
			}))

			setActiveTab("details")
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<section className="mx-auto w-full max-w-6xl space-y-6">
			<PageHeader
				title="My Profile"
				description="View and manage your account information and security settings."
				actions={
					<Button
						size="lg"
						className="cursor-pointer px-4"
						onClick={() => setActiveTab("update")}
					>
						<PencilLine className="size-4" />
						<span>Update Profile</span>
					</Button>
				}
			/>

			<HorizontalTabs
				tabs={[
					{ value: "details", label: "Profile Details" },
					{ value: "update", label: "Update Profile" },
				]}
				value={activeTab}
				onChange={(value) => setActiveTab(value as "details" | "update")}
			/>

			{activeTab === "details" ? (
				<ProfileDetails
					profile={profile}
					onEditProfile={() => setActiveTab("update")}
				/>
			) : (
				<ProfileUpdate
					isSaving={isSaving}
					profile={profile}
					onCancel={() => setActiveTab("details")}
					onSubmit={handleSubmit}
				/>
			)}
		</section>
	)
}
