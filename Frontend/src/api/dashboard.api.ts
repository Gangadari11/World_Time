import { apiRequest } from "./client"

export async function getDashboardSummary() {
    return await apiRequest<{ totalActiveLeases: number; totalAgreementValue: number; averageRentPerSqft: number }>("/dashboard/summary")
}

export async function getRemainingTermDistribution() {
    return await apiRequest<Record<string, number>>("/dashboard/remaining-term-distribution")
}

export async function getUpcomingExpirations() {
    return await apiRequest<{ count30: number; count90: number; count365: number; items: any[] }>("/dashboard/upcoming-expirations")
}

export async function getTopLessors(top = 10) {
    return await apiRequest<Array<{ lessor: string; totalAgreementValue: number }>>(`/dashboard/top-lessors?top=${top}`)
}

export async function getBranchSummary() {
    return await apiRequest<Array<any>>("/dashboard/branch-summary")
}
