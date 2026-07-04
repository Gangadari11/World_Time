import { useMemo, useState } from "react";
import { Loader2, Search, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Lessor } from "@/types/lessor";
import { RoleGate } from "@/components/auth/role-gate";

type LessorListProps = {
  loading: boolean;
  error: unknown;
  lessors: Lessor[];
  onViewClick: (lessorId: number) => void;
  onEditClick: (lessor: Lessor) => void;
  onRetry: () => void;
};

export function LessorList({
  loading,
  error,
  lessors,
  onViewClick,
  onEditClick,
  onRetry,
}: LessorListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLessors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return lessors;
    }

    return lessors.filter((lessor) => {
      const haystack = [
        lessor.fullName,
        lessor.nic,
        lessor.bankName,
        lessor.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [lessors, searchQuery]);

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-1 items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm shadow-xs">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name, NIC, address, or bank"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="cursor-default">
            All ({lessors.length})
          </Button>
          <Button size="sm" variant="outline" className="cursor-default">
            Filtered ({filteredLessors.length})
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/90 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Full Name</th>
                <th className="px-4 py-3 text-left">NIC</th>
                <th className="px-4 py-3 text-left">Bank</th>
                <th className="px-4 py-3 text-left">Account Number</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Loading lessors...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>An unexpected error occurred.</span>
                      <Button
                        size="sm"
                        variant="link"
                        className="h-auto cursor-pointer p-0 text-foreground underline hover:text-foreground"
                        onClick={onRetry}
                      >
                        Retry
                        <RotateCw className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : filteredLessors.length > 0 ? (
                filteredLessors.map((lessor) => (
                  <tr
                    key={lessor.lessorId}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {lessor.fullName ?? "--"}
                    </td>
                    <td className="px-4 py-3">{lessor.nic ?? "--"}</td>
                    <td className="px-4 py-3">{lessor.bankName ?? "--"}</td>
                    <td className="px-4 py-3">
                      {lessor.accountNumber ?? "--"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => onViewClick(lessor.lessorId)}
                      >
                        View
                      </Button>
                      <RoleGate allowedRoles={["admin", "data_entry"]}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2 cursor-pointer"
                          onClick={() => onEditClick(lessor)}
                        >
                        Edit
                      </Button>
                      </RoleGate>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={5}
                  >
                    No lessors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
