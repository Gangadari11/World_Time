import { useEffect, useState } from "react"
import { getBranchSummary, getDashboardSummary, getRemainingTermDistribution, getTopLessors, getUpcomingExpirations } from "@/api/dashboard.api"

export function useDashboard() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<unknown>(null)
    const [summary, setSummary] = useState<any>(null)
    const [distribution, setDistribution] = useState<Record<string, number> | null>(null)
    const [expirations, setExpirations] = useState<any>(null)
    const [topLessors, setTopLessors] = useState<any[]>([])
    const [branches, setBranches] = useState<any[]>([])

    useEffect(() => {
        let mounted = true

        async function load() {
            setLoading(true)
            try {
                const [s, d, e, t, b] = await Promise.all([
                    getDashboardSummary(),
                    getRemainingTermDistribution(),
                    getUpcomingExpirations(),
                    getTopLessors(8),
                    getBranchSummary(),
                ])

                if (!mounted) return
                setSummary(s)
                setDistribution(d)
                setExpirations(e)
                setTopLessors(t)
                setBranches(b)
            } catch (err) {
                if (!mounted) return
                setError(err)
            } finally {
                if (!mounted) return
                setLoading(false)
            }
        }

        void load()

        return () => {
            mounted = false
        }
    }, [])

    return { loading, error, summary, distribution, expirations, topLessors, branches }
}
