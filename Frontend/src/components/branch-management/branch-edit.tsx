import { useEffect, useState, type SubmitEvent } from "react";
import { Building2 } from "lucide-react";

import type { BranchStatus, CreateBranchInput } from "@/types/branch";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/auth/role-gate";


type SubmitAction = "submit" | "submit_and_approve";

type BranchEditProps = {
	isLoading: boolean;
	initialFormValues: CreateBranchInput;
	isEditing: boolean;
	onSubmit: (payload: CreateBranchInput, action: SubmitAction, requestComments?: string) => Promise<void>;
	onCancel: () => void;
};

export function BranchEdit({ isLoading, isEditing, initialFormValues, onCancel, onSubmit }: BranchEditProps) {
	const [formValues, setFormValues] = useState(initialFormValues);
	const [requestComments, setRequestComments] = useState("");

	useEffect(() => {
		setFormValues(initialFormValues);
		setRequestComments("");
	}, [initialFormValues, isEditing]);

	const isFormValid =
		formValues.oracleCode.trim() !== "" &&
		formValues.branchCode.trim() !== "" &&
		formValues.branchName.trim() !== "" &&
		formValues.lessee.trim() !== "" &&
		(isEditing
			? formValues.oracleCode !== initialFormValues.oracleCode ||
			formValues.branchCode !== initialFormValues.branchCode ||
			formValues.branchName !== initialFormValues.branchName ||
			formValues.lessee !== initialFormValues.lessee ||
			formValues.status !== initialFormValues.status
			: true);

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		const submitter = event.nativeEvent.submitter as HTMLButtonElement | null;
		const action: SubmitAction = submitter?.value === "submit_and_approve" ? "submit_and_approve" : "submit";

		const trimmedValues: CreateBranchInput = {
			oracleCode: formValues.oracleCode.trim(),
			branchCode: formValues.branchCode.trim(),
			branchName: formValues.branchName.trim(),
			lessee: formValues.lessee.trim(),
			status: formValues.status,
		};
		const trimmedComments = requestComments.trim() ?? undefined;

		await onSubmit(trimmedValues, action, trimmedComments);

		if (!isEditing) {
			setFormValues(initialFormValues);
		}
	};

	return (
		<form className="space-y-5 p-1" onSubmit={handleSubmit}>
			<div className="rounded-2xl border p-5">
				<div className="flex items-center gap-2 border-b pb-3">
					<Building2 className="size-4 text-muted-foreground" />
					<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
						{isEditing ? "Edit Branch" : "Add Branch"}
					</h3>
				</div>

				<div className="mt-4 grid gap-4 sm:grid-cols-2">
					<label
						htmlFor="branch-oracle-code"
						className="text-sm font-medium text-foreground"
					>
						Oracle Code
						<input
							id="branch-oracle-code"
							name="oracleCode"
							value={formValues.oracleCode}
							onChange={(event) =>
								setFormValues((prev) => ({
									...prev,
									oracleCode: event.target.value,
								}))
							}
							placeholder="OR-1001"
							className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
						/>
					</label>

					<label
						htmlFor="branch-code"
						className="text-sm font-medium text-foreground"
					>
						Branch Code
						<input
							id="branch-code"
							name="branchCode"
							value={formValues.branchCode}
							onChange={(event) =>
								setFormValues((prev) => ({
									...prev,
									branchCode: event.target.value,
								}))
							}
							placeholder="BR-0001"
							className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
						/>
					</label>

					<label
						htmlFor="branch-name"
						className="text-sm font-medium text-foreground"
					>
						Branch Name
						<input
							id="branch-name"
							name="branchName"
							value={formValues.branchName}
							onChange={(event) =>
								setFormValues((prev) => ({
									...prev,
									branchName: event.target.value,
								}))
							}
							placeholder="Enter branch name"
							className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
						/>
					</label>

					<label
						htmlFor="branch-lessee"
						className="text-sm font-medium text-foreground"
					>
						Lessee
						<input
							id="branch-lessee"
							name="lessee"
							value={formValues.lessee}
							onChange={(event) =>
								setFormValues((prev) => ({
									...prev,
									lessee: event.target.value,
								}))
							}
							placeholder="Enter lessee"
							className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
						/>
					</label>

					<label
						htmlFor="branch-status"
						className="text-sm font-medium text-foreground"
					>
						Status
						<select
							id="branch-status"
							name="status"
							value={formValues.status}
							onChange={(event) =>
								setFormValues((prev) => ({
									...prev,
									status: event.target.value as BranchStatus,
								}))
							}
							className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
						>
							<option value="Active">Active</option>
							<option value="Inactive">Inactive</option>
						</select>
					</label>
					
					{isEditing && (
						<label
							htmlFor="request-comments"
							className="text-sm font-medium text-foreground"
						>
							Comments (optional)
							<textarea
								id="request-comments"
								name="requestComments"
								value={requestComments}
								rows={1}
								onChange={(event) => setRequestComments(event.target.value)}
								placeholder="Optional comment for update request"
								className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
							/>
						</label>
					)}
				</div>

				<div className="mt-8 flex flex-wrap items-center gap-3">
					<Button
						className="px-4 py-4 cursor-pointer"
						type="submit"
						value="submit"
						disabled={isLoading || !isFormValid}
					>
						{isLoading ? "Saving..." : isEditing ? "Submit Request" : "Create Branch"}
					</Button>
					<RoleGate allowedRoles={["admin"]}>
						{isEditing ? (
							<Button
								type="submit"
								value="submit_and_approve"
								className="px-4 py-4 cursor-pointer"
								disabled={isLoading || !isFormValid}
							>
								{isLoading ? "Saving..." : "Submit & Approve"}
							</Button>
						) : null}
					</RoleGate>
					<Button
						variant="outline"
						className="px-4 py-4 cursor-pointer"
						type="button"
						onClick={onCancel}
						disabled={isLoading}
					>
						Cancel
					</Button>
				</div>
			</div>
		</form>
	);
}
