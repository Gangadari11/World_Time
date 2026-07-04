import { useEffect, useState } from "react";
import type { CreateBranchInput, UpdateBranchInput, Branch } from "@/types/branch";
import { getBranches, getBranchById, createBranch, updateBranch, deleteBranch } from "@/api/branches.api";
import { approveChangeRequest } from "@/api/change-requests.api";


export function useBranches() {
    const [data, setData] = useState<Branch[]>([]);
    
    const [fetchListLoading, setFetchListLoading] = useState(false);
    const [fetchBranchLoading, setFetchBranchLoading] = useState(false);
    const [mutationLoading, setMutationLoading] = useState(false);
    
    const [fetchListError, setFetchListError] = useState<unknown>(null);
    const [fetchBranchError, setFetchBranchError] = useState<unknown>(null);
    const [mutationError, setMutationError] = useState<unknown>(null);

    async function refresh() {
        setFetchListLoading(true);
        resetErrors();
        setFetchListError(null);
        try {
            const branches = await getBranches();
            setData(branches);
        } catch (err) {
            setFetchListError(err);
            throw err;
        } finally {
            setFetchListLoading(false);
        }
    }

    async function fetchBranch(id: number) {
        setFetchBranchLoading(true);
        resetErrors();
        try {
            return await getBranchById(id);
        } catch (err) {
            setFetchBranchError(err);
            throw err;
        } finally {
            setFetchBranchLoading(false);
        }
    }

    async function addBranch(payload: CreateBranchInput) {
        setMutationLoading(true);
        resetErrors();
        try {
            const created = await createBranch(payload);
            setData((prev) => [...prev, created]);
            return created;
        } catch (err) {
            setMutationError(err);
            throw err;
        } finally {
            setMutationLoading(false);
        }
    }

    async function editBranch(id: number, payload: UpdateBranchInput) {
        setMutationLoading(true);
        resetErrors();
        try {
            const request = await updateBranch(id, payload);
            return request;
        } catch (err) {
            setMutationError(err);
            throw err;
        } finally {
            setMutationLoading(false);
        }
    }

    async function editAndApproveBranch(id: number, payload: UpdateBranchInput) {
        setMutationLoading(true);
        resetErrors();
        try {
            const request = await editBranch(id, payload);
            await approveChangeRequest(request.entityChangeRequestId);
            refresh();
            return;
        } catch (err) {
            setMutationError(err);
            throw err;
        } finally {
            setMutationLoading(false);
        }
    }

    async function removeBranch(id: number) {
        setMutationLoading(true);
        resetErrors();
        try {
            await deleteBranch(id);
            setData((prev) => prev.filter((u) => u.branchId !== id));
        } catch (err) {
            setMutationError(err);
            throw err;
        } finally {
            setMutationLoading(false);
        }
    }

    function resetErrors() {
        setMutationError(null);
        setFetchBranchError(null);
    }
    
    useEffect(() => {
        refresh();
    }, [])

    return {  
        data, 
        fetchListLoading,
        fetchBranchLoading,
        mutationLoading,
        mutationError, 
        fetchListError,
        fetchBranchError, 
        refresh, 
        fetchBranch, 
        addBranch, 
        editBranch, 
        editAndApproveBranch,
        removeBranch,
        resetErrors
    }
}