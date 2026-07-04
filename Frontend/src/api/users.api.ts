import { apiRequest } from "./client"
import type { User, CreateUserInput, UpdateUserInput, DeleteUserResult } from "@/types/user"


export async function getUsers() {
    return await apiRequest<User[]>("/users")
}

export async function getUserById(id: number) {
    return await apiRequest<User>(`/users/${id}`)
}

export async function createUser(payload: CreateUserInput) {
    return await apiRequest<User>("/users", {
        method: "POST",
        body: payload
    })
}

export async function updateUser(id: number, payload: UpdateUserInput) {
    return await apiRequest<User>(`/users/${id}`, {
        method: "PUT",
        body: payload
    })
}

export async function deleteUser(id: number) {
    return await apiRequest<DeleteUserResult>(`/users/${id}`, {
        method: "DELETE"
    })
}