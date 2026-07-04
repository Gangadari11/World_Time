import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HorizontalTabs } from "@/components/ui/horizontal-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { BranchList } from "@/components/branch-management/branch-list";
import { BranchDetails } from "@/components/branch-management/branch-details";
import { BranchEdit } from "@/components/branch-management/branch-edit";
import type { Branch, BranchStatus, CreateBranchInput } from "@/types/branch";
import { useBranches } from "@/hooks/useBranches";
import { useToast } from "@/hooks/useToast";
import { RoleGate } from "@/components/auth/role-gate";


const emptyForm : CreateBranchInput = {
	oracleCode: "",
	branchCode: "",
	branchName: "",
	lessee: "",
	status: "Active" as BranchStatus,
};

export function BranchManagementPage() {
	const [activeTab, setActiveTab] = useState<"list" | "details" | "editor">("list");
	const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
	const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
	const [formValues, setFormValues] = useState<CreateBranchInput>(emptyForm);

	const {
		fetchListLoading,
		fetchBranchLoading,
		mutationLoading,
		fetchListError,
		fetchBranchError,
		data: branchData,
		fetchBranch,
		addBranch,
		editBranch,
		editAndApproveBranch,
		resetErrors,
		refresh,
	} = useBranches();
	const { addToast } = useToast();

	const isEditing = activeTab === "editor" && selectedBranchId !== null;

	useEffect(() => {
		if (fetchListError) {
			const message =
				fetchListError instanceof Error
					? fetchListError.message
					: "Failed to fetch branch data.";
			addToast({
				title: "Unable to Load Branch Data",
				description: message,
				type: "error",
			});
		}
	}, [fetchListError, addToast]);

	useEffect(() => {
		resetErrors();
		if (activeTab === "list") {
			setSelectedBranchId(null);
			setFormValues(emptyForm);
		} else if (activeTab === "editor" && selectedBranchId) {
			const branch = branchData.find((b) => b.branchId === selectedBranchId);
			if (branch) {
				setFormValues({
					oracleCode: branch.oracleCode,
					branchCode: branch.branchCode,
					branchName: branch.branchName,
					lessee: branch.lessee,
					status: branch.status,
				});
			}
		}
	}, [activeTab]);

	useEffect(() => {
		if (!selectedBranchId) {
			setSelectedBranch(null);
			return;
		}

		const loadBranch = async () => {
			try {
				const result = await fetchBranch(selectedBranchId);
				setSelectedBranch(result);
				resetErrors();
			} catch (error) {
				setSelectedBranch(null);
				addToast({
					title: "Unable to Load Branch Details",
					description:
						error instanceof Error
							? error.message
							: "Failed to fetch branch details.",
					type: "error",
				});
			}
		};

		loadBranch();
	}, [selectedBranchId]);

	const handleSubmit = async (
		payload: CreateBranchInput,
		action: "submit" | "submit_and_approve",
		requestComments?: string,
	) => {
		try {
			if (isEditing && selectedBranchId) {
				if (action === "submit") {
					await editBranch(selectedBranchId, { ...payload, branchId: selectedBranchId, requestComments });
				} else if (action === "submit_and_approve") {
					await editAndApproveBranch(selectedBranchId, { ...payload, branchId: selectedBranchId, requestComments });
				}
				addToast({
					title: action === "submit_and_approve" ? "Branch Updated & Saved" : "Branch Update Request Submitted",
					description:
						action === "submit_and_approve"
							? `Branch "${payload.branchName}" has been updated and approved successfully.`
							: `Branch update request for "${payload.branchName}" has been submitted successfully.`,
					type: "success",
					duration: 10000,
				});
			} else {
				await addBranch(payload);
				addToast({
					title: "Branch Created",
					description: `Branch "${payload.branchName}" has been created successfully.`,
					type: "success",
				});
			}
			setFormValues(emptyForm);
		} catch (error) {
			addToast({
				title: "Unable to Save Branch",
				description:
					error instanceof Error
						? error.message
						: "An unexpected error occurred while saving the branch.",
				type: "error",
			});
		}
	};

	return (
		<section className="mx-auto w-full max-w-6xl space-y-6">
			<PageHeader
				title="Branch Management"
				description="All registered branches and their lease status."
				actions={
					<RoleGate allowedRoles={["admin", "data_entry"]}>
						<Button
							size="lg"
							className="px-4 cursor-pointer"
							onClick={() => {
								setSelectedBranchId(null);
								setFormValues(emptyForm);
								setActiveTab("editor");
							}}
						>
							<Plus className="size-4" />
							<span>Add Branch</span>
						</Button>
					</RoleGate>
				}
			/>

			<HorizontalTabs
				tabs={[
					{ value: "list", label: "Branch List" },
					{ value: "details", label: "Branch Details" },
					{ value: "editor", label: "Branch Editor", allowedRoles: ["admin", "data_entry"] },
				]}
				value={activeTab}
				onChange={(value) => setActiveTab(value as "list" | "details" | "editor")}
			/>

			{activeTab === "list" ? (
				<BranchList
					isLoading={fetchListLoading}
					error={fetchListError}
					branchData={branchData}
					onViewClick={(branchId) => {
						setSelectedBranchId(branchId);
						setActiveTab("details");
					}}
					onEditClick={(branchId) => {
						setSelectedBranchId(branchId);
						setActiveTab("editor");
					}}
					onRetry={() => refresh()}
				/>
			) : activeTab === "details" ? (
				<BranchDetails
					selectedBranch={selectedBranch}
					error={fetchBranchError}
					isLoading={fetchBranchLoading}
				/>
			) : (
				<RoleGate allowedRoles={["admin", "data_entry"]}>
					<BranchEdit
						isLoading={mutationLoading}
						isEditing={isEditing}
						initialFormValues={formValues}
						onCancel={() => {
							setActiveTab("list");
							setSelectedBranchId(null);
						}}
						onSubmit={handleSubmit}
					/>
				</RoleGate>
			)}
		</section>
	);
}
