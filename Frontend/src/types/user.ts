export const USER_ROLE_OPTIONS = 
[
    { displayName: "Admin", value: "admin" },
    { displayName: "Data Entry Officer", value: "data_entry" },
    { displayName: "Auditor", value: "auditor" }
] as const

export type UserRole = typeof USER_ROLE_OPTIONS[number]["value"]

export const USER_ROLES = USER_ROLE_OPTIONS.map((option) => option.value as UserRole)

export const getUserRoleDisplayName = (role: UserRole) =>
    USER_ROLE_OPTIONS.find((option) => option.value === role)?.displayName ?? role

export type User = {
    userId: number
    fullName: string
    email: string
    role: UserRole
    createdAt?: string
}

export type CreateUserInput = {
    fullName: string
    email: string
    role: UserRole
    password: string
}

export type UpdateUserInput = {
    fullName: string
    email: string
    role: UserRole
}

export type DeleteUserResult = {
    message: string
}