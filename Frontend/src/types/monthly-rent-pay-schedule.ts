export type MonthlyRentPayScheduleRow = {
  leaseId: number
  branchName: string | null
  branchCode: string | null
  lessorName: string | null
  bankAccountNumber: string | null
  bankCode: string | null
  dueDate: string
  month: string
  netRentPayment: number
  utilityBillPayment: number
  grossRentPayable: number
  whtAmount: number
  netRentPay: number
  vatAmount: number
  netRentPlusVat: number
}
