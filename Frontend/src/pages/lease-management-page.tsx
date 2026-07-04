import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { approveChangeRequest } from "@/api/change-requests.api";
import { getBranches } from "@/api/branches.api";
import { LeaseDetails } from "@/components/lease-management/lease-details";
import { LeaseEdit } from "@/components/lease-management/lease-edit";
import { LeaseList } from "@/components/lease-management/lease-list";
import { Button } from "@/components/ui/button";
import { HorizontalTabs } from "@/components/ui/horizontal-tabs";
import { useLessors } from "@/hooks/useLessors";
import { useLeases } from "@/hooks/useLeases";
import { useToast } from "@/hooks/useToast";
import type { Branch } from "@/types/branch";
import type { CreateLeaseInput, Lease, UpdateLeaseInput } from "@/types/lease";
import { RoleGate } from "@/components/auth/role-gate";

type SubmitAction = "primary" | "combined";

export function LeaseManagementPage() {
  const { addToast } = useToast();
  const { data: branches } = useBranchCatalog();
  const { data: lessors } = useLessors();
  const {
    data: leases,
    loading,
    error,
    refresh,
    fetchLease,
    addLease,
    editLease,
  } = useLeases();

  const [activeTab, setActiveTab] = useState<"list" | "details" | "editor">(
    "list",
  );
  const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadLeaseDetails() {
      if (activeTab !== "details") {
        return;
      }

      if (!selectedLeaseId) {
        setSelectedLease(null);
        setDetailsError(null);
        return;
      }

      setDetailsLoading(true);
      setDetailsError(null);

      try {
        const lease = await fetchLease(selectedLeaseId);
        if (isActive) {
          setSelectedLease(lease);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load lease details.";
        if (isActive) {
          setSelectedLease(null);
          setDetailsError(message);
        }
        addToast({
          title: "Unable to load lease",
          description: message,
          type: "error",
        });
      } finally {
        if (isActive) {
          setDetailsLoading(false);
        }
      }
    }

    loadLeaseDetails();

    return () => {
      isActive = false;
    };
  }, [activeTab, addToast, fetchLease, selectedLeaseId]);

  const detailsSource =
    selectedLease ??
    leases.find((lease) => lease.leaseId === selectedLeaseId) ??
    null;

  const handleLeaseSubmit = async (
    payload: CreateLeaseInput | UpdateLeaseInput,
    action: SubmitAction,
  ) => {
    try {
      setSaving(true);

      if ("leaseId" in payload) {
        const updated = await editLease(payload.leaseId, payload, {
          updateLocalState: action !== "combined",
        });

        if (action === "combined") {
          await approveChangeRequest(updated.request.entityChangeRequestId);
        }

        const latestLease = await fetchLease(updated.lease.leaseId);
        setSelectedLease(latestLease);
        setSelectedLeaseId(latestLease.leaseId);
        await refresh();
        setActiveTab("details");
        addToast({
          title:
            action === "combined" ? "Lease Updated & Saved" : "Lease updated",
          description:
            action === "combined"
              ? `Lease ${latestLease.leaseNo ?? "record"} has been updated and saved successfully.`
              : `Lease ${latestLease.leaseNo ?? "record"} updated successfully.`,
          type: "success",
        });
        return;
      }

      const created = await addLease(payload);
      setSelectedLease(created);
      setSelectedLeaseId(created.leaseId);
      setActiveTab("details");
      addToast({
        title: "Lease created",
        description: `Lease ${created.leaseNo ?? "record"} created successfully.`,
        type: "success",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save lease.";
      addToast({ title: "Save failed", description: message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  function openCreateForm() {
    setSelectedLeaseId(null);
    setSelectedLease(null);
    setActiveTab("editor");
  }

  function openEditForm(lease: Lease) {
    setSelectedLeaseId(lease.leaseId);
    setSelectedLease(lease);
    setActiveTab("editor");
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Lease Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create lease records, review the full lease payload, and change only
            the lease status after creation.
          </p>
        </div>
        <RoleGate allowedRoles={["admin", "data_entry"]}>
        <Button
          size="lg"
          className="cursor-pointer px-4"
          onClick={openCreateForm}
        >
          <Plus className="size-4" />
          <span>Add Lease</span>
        </Button>
        </RoleGate>
      </header>

      <HorizontalTabs
        tabs={[
          { value: "list", label: "Lease List" },
          { value: "details", label: "Lease Details" },
          { value: "editor", label: "Lease Editor", allowedRoles: ["admin", "data_entry"] },
        ]}
        value={activeTab}
        onChange={(value) => {
          if (value === "editor") {
            if (detailsSource) {
              openEditForm(detailsSource);
            } else {
              openCreateForm();
            }
            return;
          }

          setActiveTab(value as "list" | "details");
        }}
      />

      {error ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load leases.
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
        <LeaseList
          loading={loading}
          error={error}
          leases={leases}
          onViewClick={(leaseId) => {
            setSelectedLeaseId(leaseId);
            setActiveTab("details");
          }}
          onEditClick={openEditForm}
          onRetry={refresh}
        />
      ) : activeTab === "details" ? (
        <LeaseDetails
          selectedLease={detailsSource}
          error={detailsError}
          isLoading={detailsLoading}
        />
      ) : (
        <LeaseEdit
          isLoading={saving}
          selectedLease={selectedLease}
          branches={branches}
          lessors={lessors}
          onSubmit={handleLeaseSubmit}
          onCancel={() => {
            setActiveTab("list");
            setSelectedLeaseId(null);
            setSelectedLease(null);
          }}
          onInvalid={(message) => {
            addToast({
              title: "Missing information",
              description: message,
              type: "error",
            });
          }}
        />
      )}
    </section>
  );
}

function useBranchCatalog() {
  const [data, setData] = useState<Branch[]>([]);

  const refresh = useMemo(
    () => async () => {
      try {
        const branchList = await getBranches();
        setData(branchList);
      } catch {
        setData([]);
      }
    },
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, refresh };
}
