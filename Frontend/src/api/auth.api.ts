import { apiRequest } from "./client"


type CanRegisterResponse = {
    canRegister: boolean
}

type BootstrapAdminInput = {
    fullName: string
    email: string
    password: string
    role: "Admin"
}

type LoginInput = { 
    email: string 
    password: string 
}

type LoginResponse = { 
    accessToken: string 
    userId: number 
    role: string 
    fullName: string 
}

export function canRegisterFirstAdmin() {
    return apiRequest<CanRegisterResponse>("/auth/setup", {
        method: "GET"
    })
}

export function createInitialAdmin(payload: BootstrapAdminInput) {
    return apiRequest<unknown>("/auth/setup", {
        method: "POST",
        body: {
            password: payload.password,
            fullName: payload.fullName,
            email: payload.email,
        },
    })
}

export function login(payload: LoginInput) {
    return apiRequest<LoginResponse>("/auth", {
        method: "POST",
        body: payload
    })
}

export function logout() {
    return apiRequest("/auth/logout", {
        method: "POST"
    })
}

export function refreshToken() {
    return apiRequest<LoginResponse>("/auth/refresh", {
        method: "POST"
    })
}

