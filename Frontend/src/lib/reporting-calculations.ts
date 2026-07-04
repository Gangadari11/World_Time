import type { AmortizationRow, CashflowResponse, CashflowRow } from "@/types/cashflow"
import type { Ifrs16LeaseIndentureSummaryRow } from "@/types/ifrs16-report"
import type { Lease } from "@/types/lease"
import type { MonthlyRentPayScheduleRow } from "@/types/monthly-rent-pay-schedule"

export type LeaseLiabilityScheduleRow = {
  leaseId: number
  branchCode: string | null
  branchName: string | null
  dueDate: string
  monthLabel: string
  openingBalance: number
  interestAccrued: number
  monthlyRentalPayment: number
  closingBalance: number
}

export function buildLeaseLiabilityScheduleRows(
  lease: Lease,
  cashflows: CashflowResponse["cashflows"],
  monthFrom: string,
  monthTo: string,
): LeaseLiabilityScheduleRow[] {
  const trimmedCashflows = trimCashflowsToLeasePeriod(
    cashflows,
    lease.startDate,
    lease.endDate,
  )

  if (!trimmedCashflows.length) {
    return []
  }

  const annualRate = Number(lease.annualRate ?? 0)
  const monthlyRate = annualRate / 12 / 100
  const isBeginningPaymentLease = lease.isPaymentAtBeginning
  const totalPresentValue = trimmedCashflows.reduce(
    (sum, row) => sum + Number(row.presentValue),
    0,
  )

  const builtRows: LeaseLiabilityScheduleRow[] = []
  let openingBalance = round2(totalPresentValue)

  for (const row of trimmedCashflows) {
    const dueDate = row.dueDate

    if (monthFrom && dueDate < `${monthFrom}-01`) {
      continue
    }

    if (monthTo) {
      const [toYear, toMonth] = monthTo.split("-").map(Number)
      const toDateLimit = new Date(toYear, toMonth, 0)
      const rowDate = new Date(dueDate)

      if (rowDate > toDateLimit) {
        const interest = round2(openingBalance * monthlyRate)
        const payment = round2(Number(row.netCashFlow))
        openingBalance = round2(openingBalance + interest - payment)
        continue
      }
    }

    const interest =
      isBeginningPaymentLease && row.monthNumber === 1
        ? 0
        : round2(openingBalance * monthlyRate)
    const payment = round2(Number(row.netCashFlow))
    const closingBalance = round2(openingBalance + interest - payment)

    builtRows.push({
      leaseId: lease.leaseId,
      branchCode: lease.branch?.branchCode ?? null,
      branchName: lease.branch?.branchName ?? null,
      dueDate,
      monthLabel: `${row.monthName} ${row.year}`,
      openingBalance,
      interestAccrued: interest,
      monthlyRentalPayment: payment,
      closingBalance,
    })

    openingBalance = closingBalance
  }

  return builtRows
}

export function buildAmortizationRows(
  leaseSummary: { annualRate: number; totals: { totalPresentValue: number } } | null,
  lease: Lease | null,
  cashflows: CashflowResponse["cashflows"] | null | undefined,
): AmortizationRow[] {
  if (!leaseSummary || !cashflows?.length) {
    return []
  }

  const monthlyRate = leaseSummary.annualRate / 100 / 12
  const isBeginningPaymentLease = lease?.isPaymentAtBeginning ?? false
  let openingLiability = leaseSummary.totals.totalPresentValue

  return cashflows.map((row, index) => {
    const payment = row.netCashFlow
    const interestExpense =
      isBeginningPaymentLease && row.monthNumber === 1
        ? 0
        : round2(openingLiability * monthlyRate)
    const principal = round2(payment - interestExpense)
    const closingLiability = round2(Math.max(openingLiability - principal, 0))

    const amortizationRow: AmortizationRow = {
      periodNumber: index + 1,
      periodLabel: `${row.monthName} ${row.year}`,
      openingLiability: round2(openingLiability),
      leasePayment: round2(payment),
      interestExpense,
      principal,
      closingLiability,
    }

    openingLiability = closingLiability
    return amortizationRow
  })
}

export function buildMonthlyRentPayScheduleRows(
  lease: Lease,
  cashflows: CashflowResponse["cashflows"],
): MonthlyRentPayScheduleRow[] {
  const trimmedCashflows = trimCashflowsToLeasePeriod(
    cashflows,
    lease.startDate,
    lease.endDate,
  )

  return trimmedCashflows.map((cashflow) => {
    const netRentPayment = round2(Number(cashflow.netCashFlow ?? 0))
    const utilityBillPayment = round2(Number(lease.utilityBill ?? 0))
    const grossRentPayable = round2(netRentPayment + utilityBillPayment)
    const whtRate = Number(lease.whtRate ?? 0)
    const vatRate = Number(lease.vatRate ?? 0)
    const whtAmount =
      grossRentPayable > 100000 ? round2((grossRentPayable * whtRate) / 100) : 0
    const netRentPay = round2(grossRentPayable - whtAmount)
    const vatAmount = round2((netRentPay * vatRate) / 100)
    const netRentPlusVat = round2(netRentPay + vatAmount)

    return {
      leaseId: lease.leaseId,
      branchName: lease.branch?.branchName ?? null,
      branchCode: lease.branch?.branchCode ?? null,
      lessorName: lease.lessor?.fullName ?? null,
      bankAccountNumber: lease.lessor?.accountNumber ?? null,
      bankCode: lease.lessor?.bankCode ?? null,
      dueDate: cashflow.dueDate,
      month: formatMonthLabel(cashflow.dueDate),
      netRentPayment,
      utilityBillPayment,
      grossRentPayable,
      whtAmount,
      netRentPay,
      vatAmount,
      netRentPlusVat,
    }
  })
}

export function enrichIfrs16LeaseSummaryRow(
  row: Ifrs16LeaseIndentureSummaryRow,
  lease: Lease | null | undefined,
  cashflows: CashflowRow[],
): Ifrs16LeaseIndentureSummaryRow {
  const rentAdvance = Number(lease?.rentAdvance ?? 0)
  const rentAdvancePeriod = Number(lease?.rentAdvancePeriod ?? 0)
  const refundableDeposit = Number(row.refundableDeposit ?? 0)

  const scheduledForYear = (year: number) => {
    if (row.numberOfYears != null && year > row.numberOfYears) {
      return null
    }

    const match = cashflows.find((cashflow) => cashflow.leaseYear === year)
    if (!match) {
      return null
    }

    return round2(Number(match.grossRent ?? 0))
  }

  const actualForYear = (year: number) => {
    if (row.numberOfYears != null && year > row.numberOfYears) {
      return null
    }

    const match = cashflows.find((cashflow) => cashflow.leaseYear === year)
    if (!match) {
      return null
    }

    return round2(Number(match.netCashFlow ?? 0))
  }

  const isTermination = row.leaseStatus?.toLowerCase() === "terminate"
  const monthsRecovered = isTermination
    ? Math.min(
        cashflows.filter((cashflow) => Number(cashflow.rentAdvanceDeduction ?? 0) > 0).length,
        rentAdvancePeriod,
      )
    : null
  const balanceMonthsToBeRecovered = isTermination
    ? Math.max(rentAdvancePeriod - (monthsRecovered ?? 0), 0)
    : null
  const rentAdvanceRecoveryPerMonth = isTermination
    ? rentAdvancePeriod > 0
      ? round2(rentAdvance / rentAdvancePeriod)
      : 0
    : null
  const totalRentAdvanceRecovery = isTermination
    ? round2((balanceMonthsToBeRecovered ?? 0) * (rentAdvanceRecoveryPerMonth ?? 0))
    : null
  const totalOutstandingReceivable = isTermination
    ? round2((totalRentAdvanceRecovery ?? 0) + refundableDeposit)
    : null

  return {
    ...row,
    utilityBill: lease?.utilityBill ?? row.utilityBill ?? null,
    firstYearScheduledAmount: scheduledForYear(1),
    secondYearScheduledAmount: scheduledForYear(2),
    thirdYearScheduledAmount: scheduledForYear(3),
    fourthYearScheduledAmount: scheduledForYear(4),
    fifthYearScheduledAmount: scheduledForYear(5),
    sixthYearScheduledAmount: scheduledForYear(6),
    firstYearActualAmount: actualForYear(1),
    secondYearActualAmount: actualForYear(2),
    thirdYearActualAmount: actualForYear(3),
    fourthYearActualAmount: actualForYear(4),
    fifthYearActualAmount: actualForYear(5),
    sixthYearActualAmount: actualForYear(6),
    monthsToRecoverRentAdvance: isTermination ? rentAdvancePeriod : null,
    monthsRecovered: isTermination ? monthsRecovered : null,
    balanceMonthsToBeRecovered: isTermination ? balanceMonthsToBeRecovered : null,
    rentAdvanceRecoveryPerMonth: isTermination ? rentAdvanceRecoveryPerMonth : null,
    totalRentAdvanceRecovery: isTermination ? totalRentAdvanceRecovery : null,
    totalOutstandingReceivable: isTermination ? totalOutstandingReceivable : null,
  }
}

export function trimCashflowsToLeasePeriod(
  cashflows: CashflowResponse["cashflows"],
  startDate: Lease["startDate"],
  endDate: Lease["endDate"],
) {
  if (!endDate) {
    return cashflows
  }

  const leaseStart = normalizeDateKey(startDate)
  const leaseEnd = normalizeDateKey(endDate)

  return cashflows.filter((row) => {
    const dueDate = normalizeDateKey(row.dueDate)

    if (leaseStart && dueDate < leaseStart) {
      return false
    }

    return dueDate <= leaseEnd
  })
}

function formatMonthLabel(dueDate: string) {
  const [year, month] = dueDate.split("-")
  const monthIndex = Number(month) - 1
  const monthName = monthNames[monthIndex] ?? month
  return `${year.slice(-2)}-${monthName}`
}

function normalizeDateKey(value: string | null | undefined) {
  return value?.slice(0, 10) ?? ""
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]