import { useEffect, useState } from "react"
import type { CreateUserInput, User, UpdateUserInput } from "@/types/user"
import { getUsers, createUser, updateUser, deleteUser, getUserById } from "@/api/users.api"


export function useUsers() {
    const [data, setData] = useState<User[]>([])
    
    const [fetchListLoading, setFetchListLoading] = useState(false)
    const [fetchUserLoading, setFetchUserLoading] = useState(false)
    const [mutationLoading, setMutationLoading] = useState(false)
    
    const [fetchListError, setFetchListError] = useState<unknown>(null)
    const [fetchUserError, setFetchUserError] = useState<unknown>(null)
    const [mutationError, setMutationError] = useState<unknown>(null)

    async function refresh() {
        setFetchListLoading(true)
        resetErrors()
        setFetchListError(null)
        try {
            const users = await getUsers()
            setData(users)
        } catch (err) {
            setFetchListError(err)
            throw err
        } finally {
            setFetchListLoading(false)
        }
    }

    async function fetchUser(id: number) {
        setFetchUserLoading(true)
        resetErrors()
        try {
            return await getUserById(id)
        } catch (err) {
            setFetchUserError(err)
            throw err
        } finally {
            setFetchUserLoading(false)
        }
    }

    async function addUser(payload: CreateUserInput) {
        setMutationLoading(true)
        resetErrors()
        try {
            const created = await createUser(payload)
            setData((prev) => [...prev, created])
            return created
        } catch (err) {
            setMutationError(err)
            throw err
        } finally {
            setMutationLoading(false)
        }
    }

    async function editUser(id: number, payload: UpdateUserInput) {
        setMutationLoading(true)
        resetErrors()
        try {
            const updated = await updateUser(id, payload)
            setData((prev) => prev.map((u) => (u.userId === id ? updated : u)))
            return updated
        } catch (err) {
            setMutationError(err)
            throw err
        } finally {
            setMutationLoading(false)
        }
    }

    async function removeUser(id: number) {
        setMutationLoading(true)
        resetErrors()
        try {
            await deleteUser(id)
            setData((prev) => prev.filter((u) => u.userId !== id))
        } catch (err) {
            setMutationError(err)
            throw err
        } finally {
            setMutationLoading(false)
        }
    }

    function resetErrors() {
        setMutationError(null)
        setFetchUserError(null)
    }

    useEffect(() => {
        refresh()
    }, [])

    return {  
        data, 
        fetchListLoading,
        fetchUserLoading, 
        mutationLoading, 
        fetchListError, 
        fetchUserError,
        mutationError, 
        refresh,
        fetchUser,
        addUser, 
        editUser, 
        removeUser,
        resetErrors
    }
}