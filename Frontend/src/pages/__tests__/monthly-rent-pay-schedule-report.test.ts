import { describe, expect, it } from "vitest"

import { trimCashflowsToLeasePeriod } from "@/lib/reporting-calculations"

describe("monthly report trimming", () => {
  it("does not include terminal month if lease ends before that month's end", () => {
    const cashflows = [
      { dueDate: "2025-05-31" },
      { dueDate: "2025-06-30" },
      { dueDate: "2025-07-31" },
      { dueDate: "2030-04-30" },
      { dueDate: "2030-05-31" },
    ] as any

    const trimmed = trimCashflowsToLeasePeriod(cashflows, "2025-05-15", "2030-05-14")

    expect(trimmed).toHaveLength(4)
    expect(trimmed.map((r) => r.dueDate)).toEqual([
      "2025-05-31",
      "2025-06-30",
      "2025-07-31",
      "2030-04-30",
    ])
  })
})
