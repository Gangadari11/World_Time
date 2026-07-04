import { useEffect, useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HorizontalTabs } from "@/components/ui/horizontal-tabs"
import { PageHeader } from "@/components/ui/page-header"
import { UserDetails } from "@/components/user-management/user-details"
import { UserEdit } from "@/components/user-management/user-edit"
import { type User, type UserRole, type CreateUserInput } from "@/types/user"
import { useUsers } from "@/hooks/useUsers"
import { useToast } from "@/hooks/useToast"


const emptyForm : CreateUserInput = {
    fullName: "",
    email: "",
    role: "data_entry" as UserRole,
    password: "",
}

export function UserManagementPage() {
    const [activeTab, setActiveTab] = useState<"details" | "form">("details")
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [formValues, setFormValues] = useState(emptyForm)

    const { addToast } = useToast()
    const { data: userData, fetchListError, fetchListLoading, mutationLoading, addUser, editUser, refresh } = useUsers()

    const isEditing = Boolean(selectedUser)

    useEffect(() => {
        if (fetchListError) {
            const message = fetchListError instanceof Error ? fetchListError.message : "Failed to fetch user data."
            addToast({
                title: "Unable to Load User Data",
                description: message,
                type: "error"
            })
        }
    }, [fetchListError, addToast])
    
    useEffect(() => {
        if (selectedUser) {
            setFormValues({
                fullName: selectedUser.fullName,
                email: selectedUser.email,
                role: selectedUser.role,
                password: "",
            })
            setActiveTab("form")
            return
        } else {
            setFormValues(emptyForm)
        }
    }, [selectedUser])

    const handleSubmit = async (payload: CreateUserInput) => {
        try {
            if (isEditing && selectedUser) {
                await editUser(selectedUser.userId, { ...payload })
                addToast({
                    title: "User Updated",
                    description: `User "${payload.fullName}" has been updated successfully.`,
                    type: "success"
                })
            } else {
                await addUser(payload)
                addToast({
                    title: "User Registered",
                    description: `User "${payload.fullName}" has been registered successfully.`,
                    type: "success"
                })
            }
            setSelectedUser(null)
        } catch (error) {
            addToast({
                title: "Error",
                description: error instanceof Error ? error.message : "An error occurred while saving the user.",
                type: "error"
            })
        }
    }

    return (
        <section className="mx-auto w-full max-w-6xl space-y-6">
            <PageHeader
                title="User Management"
                description="Manage user access, roles, and authentication activity."
                actions={
                    <Button
                        size="lg"
                        className="px-4 cursor-pointer"
                        onClick={() => { setSelectedUser(null); setActiveTab("form") }}
                    >
                        <Plus className="size-4" />
                        <span>Register User</span>
                    </Button>
                }
            />

            <HorizontalTabs
                tabs={[
                    { value: "details", label: "User Details" },
                    { value: "form", label: "User Editor" },
                ]}
                value={activeTab}
                onChange={(value) => {
                    if (value === "details") {
                        setSelectedUser(null)
                    }
                    setActiveTab(value as "details" | "form")
                }}
            />

            {activeTab === "details" ? (
                <UserDetails
                    isLoading={fetchListLoading}
                    error={fetchListError}
                    userData={userData}
                    onRetry={refresh}
                    onEdit={(user) => setSelectedUser(user)}
                />
            ) : (
                <UserEdit
                    isLoading={mutationLoading}
                    isEditing={isEditing}
                    initialFormValues={formValues}
                    onSubmit={handleSubmit}
                    onCancel={() => { setSelectedUser(null); setActiveTab("details") }}
                />
            )}
        </section>
    )
}
