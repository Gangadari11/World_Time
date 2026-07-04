import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { approveChangeRequest } from "@/api/change-requests.api";
import { LessorDetails } from "@/components/lessor-management/lessor-details";
import { LessorEdit } from "@/components/lessor-management/lessor-edit";
import { LessorList } from "@/components/lessor-management/lessor-list";
import { Button } from "@/components/ui/button";
import { HorizontalTabs } from "@/components/ui/horizontal-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { useLessors } from "@/hooks/useLessors";
import { useToast } from "@/hooks/useToast";
import type { Lessor } from "@/types/lessor";
import { RoleGate } from "@/components/auth/role-gate";

export function LessorManagementPage() {
  const { addToast } = useToast();
  const {
    data: lessors,
    loading,
    error,
    refresh,
    fetchLessor,
    addLessor,
    editLessor,
  } = useLessors();

  const [activeTab, setActiveTab] = useState<"list" | "details" | "editor">(
    "list",
  );
  const [selectedLessorId, setSelectedLessorId] = useState<number | null>(null);
  const [selectedLessor, setSelectedLessor] = useState<Lessor | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadLessorDetails() {
      if (activeTab !== "details") {
        return;
      }

      if (!selectedLessorId) {
        setSelectedLessor(null);
        setDetailsError(null);
        return;
      }

      setDetailsLoading(true);
      setDetailsError(null);

      try {
        const lessor = await fetchLessor(selectedLessorId);
        if (isActive) {
          setSelectedLessor(lessor);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load lessor details.";
        if (isActive) {
          setSelectedLessor(null);
          setDetailsError(message);
        }
        addToast({
          title: "Unable to load lessor",
          description: message,
          type: "error",
        });
      } finally {
        if (isActive) {
          setDetailsLoading(false);
        }
      }
    }

    loadLessorDetails();

    return () => {
      isActive = false;
    };
  }, [activeTab, addToast, fetchLessor, selectedLessorId]);

  function openCreateForm() {
    setSelectedLessorId(null);
    setSelectedLessor(null);
    setDetailsError(null);
    setActiveTab("editor");
  }

  function openEditForm(lessor: Lessor) {
    setSelectedLessorId(lessor.lessorId);
    setSelectedLessor(lessor);
    setDetailsError(null);
    setActiveTab("editor");
  }

  const detailsSource =
    selectedLessor ??
    lessors.find((lessor) => lessor.lessorId === selectedLessorId) ??
    null;

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Lessor Management"
        description="Create, review, update, and remove lessor records for IFRS lease tracking."
        actions={
          <RoleGate allowedRoles={["admin", "data_entry"]}>
          <Button
            size="lg"
            className="cursor-pointer px-4"
            onClick={openCreateForm}
          >
            <Plus className="size-4" />
            <span>Add Lessor</span>
          </Button>
          </RoleGate>
        }
      />

      <HorizontalTabs
        tabs={[
          { value: "list", label: "Lessor List" },
          { value: "details", label: "Lessor Details" },
          { value: "editor", label: "Lessor Editor", allowedRoles: ["admin", "data_entry"] },
        ]}
        value={activeTab}
        onChange={(value) =>
          setActiveTab(value as "list" | "details" | "editor")
        }
      />

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load lessors.
          <Button
            variant="link"
            className="ml-2 h-auto p-0 text-destructive"
            onClick={refresh}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {activeTab === "list" ? (
        <LessorList
          loading={loading}
          error={error}
          lessors={lessors}
          onViewClick={(lessorId) => {
            setSelectedLessorId(lessorId);
            setActiveTab("details");
          }}
          onEditClick={openEditForm}
          onRetry={refresh}
        />
      ) : activeTab === "details" ? (
        <LessorDetails
          selectedLessor={detailsSource}
          error={detailsError}
          isLoading={detailsLoading}
        />
      ) : (
        <LessorEdit
          lessor={detailsSource}
          isLoading={false}
          onCancel={() => {
            setSelectedLessorId(null);
            setSelectedLessor(null);
            setDetailsError(null);
            setActiveTab("list");
          }}
          onSubmit={async (payload, action) => {
            if (
              !payload.fullName.trim() ||
              !payload.nic.trim() ||
              !payload.address.trim() ||
              !payload.bankName.trim() ||
              !payload.accountNumber.trim()
            ) {
              addToast({
                title: "Missing information",
                description: "Please fill in every lessor field before saving.",
                type: "error",
              });
              return;
            }

            try {
              if (selectedLessorId) {
                const updated = await editLessor(
                  selectedLessorId,
                  {
                    lessorId: selectedLessorId,
                    ...payload,
                  },
                  {
                    updateLocalState: action !== "combined",
                  },
                );

                if (action === "combined") {
                  await approveChangeRequest(
                    updated.request.entityChangeRequestId,
                  );
                }

                const latestLessor = await fetchLessor(updated.lessor.lessorId);
                setSelectedLessor(latestLessor);
                setSelectedLessorId(latestLessor.lessorId);
                await refresh();
                setActiveTab("details");
                addToast({
                  title:
                    action === "combined"
                      ? "Lessor Updated & Saved"
                      : "Lessor updated",
                  description:
                    action === "combined"
                      ? `${latestLessor.fullName ?? "Lessor"} has been updated and saved successfully.`
                      : `${latestLessor.fullName ?? "Lessor"} has been updated successfully.`,
                  type: "success",
                });
              } else {
                const created = await addLessor(payload);
                setSelectedLessor(created);
                setSelectedLessorId(created.lessorId);
                await refresh();
                setActiveTab("details");
                addToast({
                  title: "Lessor created",
                  description: `${created.fullName ?? "Lessor"} has been added successfully.`,
                  type: "success",
                });
              }
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Unable to save lessor.";
              addToast({
                title: "Save failed",
                description: message,
                type: "error",
              });
            }
          }}
        />
      )}
    </section>
  );
}
