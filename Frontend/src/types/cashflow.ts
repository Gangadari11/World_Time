export type CashflowLeaseInfo = {
    leaseId: number
    leaseNo: string | null
    startDate: string | null
    endDate: string | null
    rentAdvance: number | null
    rentAdvancePeriod: number | null
    isPaymentAtBeginning: boolean
}

export type CashflowAssumptions = {
    interestRate: number
}

export type CashflowRow = {
    monthNumber: number
    leaseYear: number
    monthName: string
    year: number
    dueDate: string
    grossRent: number
    rentAdvanceDeduction: number
    netCashFlow: number
    discountFactor: number
    presentValue: number
}

export type CashflowTotals = {
    totalGrossRent: number
    totalRentAdvanceDeduction: number
    totalNetCashFlow: number
    totalPresentValue: number
}

export type CashflowSummary = {
    annualRate: number
    period: number | null
    advance: number | null
    advancePeriod: number | null
    paymentTiming: string
    address: string | null
    totals: CashflowTotals
}

export type CashflowResponse = {
    lease: CashflowLeaseInfo
    assumptions: CashflowAssumptions
    cashflows: CashflowRow[]
    totals: CashflowTotals
}

export type AmortizationRow = {
    periodNumber: number
    periodLabel: string
    openingLiability: number
    leasePayment: number
    interestExpense: number
    principal: number
    closingLiability: number
}