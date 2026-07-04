export type Ifrs16ReportFilters = {
  branchId?: number
  leaseStatus?: string
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
}

export type Ifrs16LeaseIndentureSummaryRow = {
  leaseId: number
  oracleCode: string | null
  branchCode: string | null
  branchName: string | null
  lessee: string | null
  lessorFullName: string | null
  leaseNo: string | null
  nic: string | null
  lessorAddress: string | null
  sqft: number | null
  leasePropertyAddress: string | null
  startDate: string | null
  endDate: string | null
  extensions: string | null
  numberOfYears: number | null
  today: string
  remainingPeriodYears: number | null
  firstYearScheduledAmount: number | null
  secondYearScheduledAmount: number | null
  thirdYearScheduledAmount: number | null
  fourthYearScheduledAmount: number | null
  fifthYearScheduledAmount: number | null
  sixthYearScheduledAmount: number | null
  firstYearActualAmount: number | null
  secondYearActualAmount: number | null
  thirdYearActualAmount: number | null
  fourthYearActualAmount: number | null
  fifthYearActualAmount: number | null
  sixthYearActualAmount: number | null
  accountNumber: string | null
  bankName: string | null
  utilityBill: number | null
  rentAdvance: number | null
  refundableDeposit: number | null
  noticePeriodMonths: number | null
  remarks: string | null
  rentAdvancePeriod: number | null
  requiredDeductionFromMonthlyRental: number | null
  agreementValue: number | null
  leaseStatus: string | null
  monthsToRecoverRentAdvance: number | null
  monthsRecovered: number | null
  balanceMonthsToBeRecovered: number | null
  rentAdvanceRecoveryPerMonth: number | null
  totalRentAdvanceRecovery: number | null
  totalOutstandingReceivable: number | null
}
