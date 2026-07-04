import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Users } from "lucide-react";

import type { CreateLessorInput, Lessor } from "@/types/lessor";
import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/auth/role-gate";

type SubmitAction = "primary" | "combined";

type LessorEditProps = {
  lessor: Lessor | null;
  isLoading: boolean;
  onSubmit: (payload: CreateLessorInput, action: SubmitAction) => Promise<void>;
  onCancel: () => void;
};

const emptyForm: CreateLessorInput = {
  fullName: "",
  nic: "",
  address: "",
  bankName: "",
  accountNumber: "",
  bankCode: "",
};

export function LessorEdit({
  lessor,
  isLoading,
  onSubmit,
  onCancel,
}: LessorEditProps) {
  const [formValues, setFormValues] = useState<CreateLessorInput>(emptyForm);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(lessor);

  useEffect(() => {
    setFormValues(
      lessor
        ? {
            fullName: lessor.fullName ?? "",
            nic: lessor.nic ?? "",
            address: lessor.address ?? "",
            bankName: lessor.bankName ?? "",
            accountNumber: lessor.accountNumber ?? "",
            bankCode: lessor.bankCode ?? "",
          }
        : emptyForm,
    );
  }, [lessor]);

  const isFormValid =
    formValues.fullName.trim() !== "" &&
    formValues.nic.trim() !== "" &&
    formValues.address.trim() !== "" &&
    formValues.bankName.trim() !== "" &&
    formValues.accountNumber.trim() !== "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const submitEvent = event.nativeEvent as SubmitEvent;
    const submitter = submitEvent.submitter as HTMLButtonElement | null;
    const action: SubmitAction =
      submitter?.value === "combined" ? "combined" : "primary";

    await onSubmit(
      {
        fullName: formValues.fullName.trim(),
        nic: formValues.nic.trim(),
        address: formValues.address.trim(),
        bankName: formValues.bankName.trim(),
        accountNumber: formValues.accountNumber.trim(),
        bankCode: formValues.bankCode.trim(),
      },
      action,
    );
  }

  return (
    <form
      className="space-y-5 p-1"
      onSubmit={async (event) => {
        setSaving(true);
        try {
          await handleSubmit(event);
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="rounded-2xl border p-5">
        <div className="flex items-center gap-2 border-b pb-3">
          {isEditing ? (
            <Pencil className="size-4 text-muted-foreground" />
          ) : (
            <Users className="size-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {isEditing ? "Edit Lessor" : "Add Lessor"}
          </h3>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="Full name">
            <input
              value={formValues.fullName}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
              placeholder="John Doe"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </FormField>
          <FormField label="NIC">
            <input
              value={formValues.nic}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  nic: event.target.value,
                }))
              }
              placeholder="123456789"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </FormField>
          <FormField label="Bank name">
            <input
              value={formValues.bankName}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  bankName: event.target.value,
                }))
              }
              placeholder="First National Bank"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </FormField>
          <FormField label="Account number">
            <input
              value={formValues.accountNumber}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  accountNumber: event.target.value,
                }))
              }
              placeholder="98765432"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </FormField>
          <FormField label="Bank code">
            <input
              value={formValues.bankCode}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  bankCode: event.target.value,
                }))
              }
              placeholder="BOC"
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </FormField>
          <FormField label="Address">
            <textarea
              value={formValues.address}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              placeholder="123 Main Street, City, Country"
              rows={4}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40 sm:col-span-2"
            />
          </FormField>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            value="primary"
            className="px-4"
            disabled={saving || isLoading || !isFormValid}
          >
            {saving ? "Saving..." : isEditing ? "Update" : "Create Lessor"}
          </Button>
          <RoleGate allowedRoles={["admin"]}>
            {isEditing ? (
              <Button
                type="submit"
                value="combined"
                className="px-4"
                disabled={saving || isLoading || !isFormValid}
              >
                {saving ? "Saving..." : "Update & Save"}
              </Button>
            ) : null}
          </RoleGate>
          <Button
            type="button"
            variant="outline"
            className="px-4"
            onClick={onCancel}
            disabled={saving || isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-medium text-foreground">
      {label}
      {children}
    </label>
  );
}
