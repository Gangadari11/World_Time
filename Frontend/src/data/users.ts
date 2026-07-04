import { type User } from "@/types/user"

export type RolePermissionRow = {
  permission: string
  admin: boolean
  data_entry: boolean
  auditor: boolean
}

export const userData: User[] = [
  {
    userId: 1,
    fullName: "Ariana Campos",
    email: "ariana.campos@ifrsbank.com",
    role: "admin",
  },
  {
    userId: 2,
    fullName: "Michael Perera",
    email: "michael.perera@ifrsbank.com",
    role: "data_entry",
  },
  {
    userId: 3,
    fullName: "Sasha Lim",
    email: "sasha.lim@ifrsbank.com",
    role: "auditor",
  },
  {
    userId: 4,
    fullName: "Nirmal Fernando",
    email: "nirmal.fernando@ifrsbank.com",
    role: "admin",
  },
]

export const rolePermissionMatrix: RolePermissionRow[] = [
  {
    permission: "View leases",
    admin: true,
    data_entry: true,
    auditor: true,
  },
  {
    permission: "Add/edit leases",
    admin: true,
    data_entry: true,
    auditor: false,
  },
  {
    permission: "Delete records",
    admin: true,
    data_entry: false,
    auditor: false,
  },
  {
    permission: "IFRS reports",
    admin: true,
    data_entry: true,
    auditor: true,
  },
  {
    permission: "User management",
    admin: true,
    data_entry: false,
    auditor: false,
  },
]
