import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
  type WheelEvent,
} from "react";
import { Pencil, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RoleGate } from "@/components/auth/role-gate";
import { LeaseCreatePreviewDialog } from "./lease-create-preview-dialog";
import type { Branch } from "@/types/branch";
import type { Lessor } from "@/types/lessor";
import type {
  CreateLeaseInput,
  Lease,
  LeasePaymentScheduleInput,
  LeaseStatus,
  UpdateLeaseInput,
} from "@/types/lease";

type SubmitAction = "primary" | "combined";

type LeaseCreatePreviewData = {
  payload: CreateLeaseInput;
  branchLabel: string;
  lessorLabel: string;
};

type LeaseCreateFormValues = Omit<
  CreateLeaseInput,
  | "paymentSchedules"
  | "branchId"
  | "lessorId"
  | "sqft"
  | "numberOfYears"
  | "rentAdvance"
  | "rentAdvancePeriod"
  | "refundableDeposit"
  | "noticePeriodMonths"
  | "agreementValue"
  | "annualRate"
  | "utilityBill"
  | "whtRate"
  | "vatRate"
> & {
  branchId: string;
  lessorId: string;
  sqft: string;
  numberOfYears: string;
  rentAdvance: string;
  rentAdvancePeriod: string;
  refundableDeposit: string;
  noticePeriodMonths: string;
  agreementValue: string;
  annualRate: string;
  utilityBill: string;
  whtRate: string;
  vatRate: string;
};

type LeaseEditProps = {
  isLoading: boolean;
  selectedLease: Lease | null;
  branches: Branch[];
  lessors: Lessor[];
  onSubmit: (
    payload: CreateLeaseInput | UpdateLeaseInput,
    action: SubmitAction,
  ) => Promise<void>;
  onCancel: () => void;
  onInvalid: (message: string) => void;
};

const emptyForm: LeaseCreateFormValues = {
  branchId: "",
  lessorId: "",
  leaseNo: "",
  leasePropertyAddress: "",
  sqft: "",
  startDate: "",
  endDate: "",
  extensions: "",
  numberOfYears: "",
  rentAdvance: "",
  rentAdvancePeriod: "",
  refundableDeposit: "",
  noticePeriodMonths: "",
  remarks: "",
  agreementValue: "",
  annualRate: "",
  utilityBill: "",
  whtRate: "",
  vatRate: "",
  leaseStatus: "Active",
  isPaymentAtBeginning: false,
};

const statusOptions: LeaseStatus[] = ["Active", "Terminate"];

const integerInputClass =
  "mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function stopWheelChange(event: WheelEvent<HTMLInputElement>) {
  event.currentTarget.blur();
}

export function LeaseEdit({
  isLoading,
  selectedLease,
  branches,
  lessors,
  onSubmit,
  onCancel,
  onInvalid,
}: LeaseEditProps) {
  const isEditing = Boolean(selectedLease);
  const [formValues, setFormValues] =
    useState<LeaseCreateFormValues>(emptyForm);
  const [yearlyGrossRents, setYearlyGrossRents] = useState<string[]>([]);
  const [editLeaseStatus, setEditLeaseStatus] = useState<LeaseStatus>("Active");
  const [previewData, setPreviewData] = useState<LeaseCreatePreviewData | null>(
    null,
  );

  useEffect(() => {
    if (!selectedLease) {
      setFormValues(emptyForm);
      setYearlyGrossRents([]);
      setEditLeaseStatus("Active");
      setPreviewData(null);
      return;
    }

    setPreviewData(null);
    setEditLeaseStatus(normalizeStatus(selectedLease.leaseStatus));

    setFormValues({
      branchId: selectedLease.branchId?.toString() ?? "",
      lessorId: selectedLease.lessorId?.toString() ?? "",
      leaseNo: selectedLease.leaseNo ?? "",
      leasePropertyAddress: selectedLease.leasePropertyAddress ?? "",
      sqft: selectedLease.sqft?.toString() ?? "",
      startDate: selectedLease.startDate ?? "",
      endDate: selectedLease.endDate ?? "",
      extensions: selectedLease.extensions ?? "",
      numberOfYears: selectedLease.numberOfYears?.toString() ?? "",
      rentAdvance: selectedLease.rentAdvance?.toString() ?? "",
      rentAdvancePeriod: selectedLease.rentAdvancePeriod?.toString() ?? "",
      refundableDeposit: selectedLease.refundableDeposit?.toString() ?? "",
      noticePeriodMonths: selectedLease.noticePeriodMonths?.toString() ?? "",
      remarks: selectedLease.remarks ?? "",
      agreementValue: selectedLease.agreementValue?.toString() ?? "",
      annualRate: selectedLease.annualRate?.toString() ?? "",
      utilityBill: selectedLease.utilityBill?.toString() ?? "",
      whtRate: selectedLease.whtRate?.toString() ?? "",
      vatRate: selectedLease.vatRate?.toString() ?? "",
      leaseStatus: normalizeStatus(selectedLease.leaseStatus),
      isPaymentAtBeginning: selectedLease.isPaymentAtBeginning,
    });
    setYearlyGrossRents(
      selectedLease.paymentSchedules?.map((schedule) =>
        schedule.grossAmount === null || schedule.grossAmount === undefined
          ? ""
          : String(schedule.grossAmount),
      ) ?? [],
    );
  }, [selectedLease]);

  const isTerminatedLease =
    isEditing && normalizeStatus(selectedLease?.leaseStatus) === "Terminate";

  const rentPayingMonths = useMemo(() => {
    const years = Number(formValues.numberOfYears);
    return Number.isInteger(years) && years > 0 ? years * 12 : 0;
  }, [formValues.numberOfYears]);

  const rentAdvancePeriodError = useMemo(() => {
    if (isEditing) {
      return null;
    }

    if (!formValues.rentAdvancePeriod.trim()) {
      return null;
    }

    const rentAdvancePeriodValue = Number(formValues.rentAdvancePeriod);
    if (Number.isNaN(rentAdvancePeriodValue) || rentAdvancePeriodValue <= 0) {
      return "Rent advance period must be greater than 0.";
    }

    if (rentPayingMonths > 0 && rentAdvancePeriodValue > rentPayingMonths) {
      return `Rent advance period cannot exceed ${rentPayingMonths} rent-paying months.`;
    }

    return null;
  }, [formValues.rentAdvancePeriod, isEditing, rentPayingMonths]);

  const rentAdvanceAmountError = useMemo(() => {
    if (isEditing) {
      return null;
    }

    if (!formValues.rentAdvance.trim()) {
      return null;
    }

    const rentAdvanceValue = Number(formValues.rentAdvance);
    if (Number.isNaN(rentAdvanceValue) || rentAdvanceValue < 0) {
      return "Rent advance must be 0 or greater.";
    }

    const agreementValue = Number(formValues.agreementValue);
    if (
      Number.isFinite(agreementValue) &&
      agreementValue >= 0 &&
      rentAdvanceValue > agreementValue
    ) {
      return "Rent advance cannot exceed agreement value.";
    }

    return null;
  }, [formValues.rentAdvance, formValues.agreementValue, isEditing]);

  useEffect(() => {
    if (isEditing) {
      setYearlyGrossRents([]);
      return;
    }

    const years = Number(formValues.numberOfYears);
    if (!Number.isInteger(years) || years <= 0) {
      setYearlyGrossRents([]);
      return;
    }

    setYearlyGrossRents((current) => {
      if (current.length === years) {
        return current;
      }

      if (current.length > years) {
        return current.slice(0, years);
      }

      return [
        ...current,
        ...Array.from({ length: years - current.length }, () => ""),
      ];
    });
  }, [formValues.numberOfYears, isEditing]);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    const years = Number(formValues.numberOfYears);
    if (!Number.isInteger(years) || years <= 0) {
      if (formValues.agreementValue !== "") {
        setFormValues((current) => ({
          ...current,
          agreementValue: "",
        }));
      }
      return;
    }

    const totalAgreementValue = yearlyGrossRents
      .slice(0, years)
      .reduce((sum, value) => {
        const amount = Number(value);
        return Number.isFinite(amount) && amount >= 0 ? sum + amount * 12 : sum;
      }, 0);

    const computedAgreementValue = totalAgreementValue.toString();
    if (computedAgreementValue !== formValues.agreementValue) {
      setFormValues((current) => ({
        ...current,
        agreementValue: computedAgreementValue,
      }));
    }
  }, [
    yearlyGrossRents,
    formValues.numberOfYears,
    formValues.agreementValue,
    isEditing,
  ]);

  useEffect(() => {
    if (isEditing) {
      return;
    }

    const years = Number(formValues.numberOfYears);
    if (!formValues.startDate || !Number.isInteger(years) || years <= 0) {
      return;
    }

    const derivedEndDate = calculateLeaseEndDate(formValues.startDate, years);
    if (derivedEndDate && derivedEndDate !== formValues.endDate) {
      setFormValues((current) => ({
        ...current,
        endDate: derivedEndDate,
      }));
    }
  }, [
    formValues.startDate,
    formValues.numberOfYears,
    formValues.endDate,
    isEditing,
  ]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submitEvent = event.nativeEvent as SubmitEvent;
    const submitter = submitEvent.submitter as HTMLButtonElement | null;
    const action: SubmitAction =
      submitter?.value === "combined" ? "combined" : "primary";

    if (isEditing) {
      if (!selectedLease) {
        onInvalid("The selected lease is not available for editing.");
        return;
      }

      await onSubmit(
        {
          leaseId: selectedLease.leaseId,
          branchId: selectedLease.branchId ?? 0,
          lessorId: selectedLease.lessorId ?? 0,
          leaseNo: selectedLease.leaseNo ?? "",
          leasePropertyAddress: selectedLease.leasePropertyAddress ?? "",
          sqft: selectedLease.sqft ?? 0,
          startDate: selectedLease.startDate ?? "",
          endDate: selectedLease.endDate ?? "",
          extensions: selectedLease.extensions ?? "",
          numberOfYears: selectedLease.numberOfYears ?? 0,
          rentAdvance: selectedLease.rentAdvance ?? 0,
          rentAdvancePeriod: selectedLease.rentAdvancePeriod ?? 0,
          refundableDeposit: selectedLease.refundableDeposit ?? 0,
          noticePeriodMonths: selectedLease.noticePeriodMonths ?? 0,
          remarks: selectedLease.remarks ?? "",
          agreementValue: selectedLease.agreementValue ?? 0,
          annualRate: selectedLease.annualRate ?? 0,
          utilityBill: selectedLease.utilityBill ?? 0,
          whtRate: selectedLease.whtRate ?? 0,
          vatRate: selectedLease.vatRate ?? 0,
          leaseStatus: editLeaseStatus,
          isPaymentAtBeginning: selectedLease.isPaymentAtBeginning,
        },
        action,
      );
      return;
    }

    const annualRateValue = Number(formValues.annualRate);
    const numberOfYearsValue = Number(formValues.numberOfYears);
    const paymentScheduleValues = yearlyGrossRents.map((value, index) => {
      const grossAmount = Number(value);

      return {
        leaseYear: index + 1,
        grossAmount,
      } satisfies LeasePaymentScheduleInput;
    });

    const hasMissingRequiredFields =
      !formValues.branchId.trim() ||
      !formValues.lessorId.trim() ||
      !formValues.leaseNo.trim() ||
      !formValues.leasePropertyAddress.trim() ||
      !formValues.sqft.trim() ||
      !formValues.numberOfYears.trim() ||
      !formValues.startDate ||
      !formValues.endDate ||
      !formValues.rentAdvance.trim() ||
      !formValues.rentAdvancePeriod.trim() ||
      !formValues.refundableDeposit.trim() ||
      !formValues.noticePeriodMonths.trim() ||
      !formValues.agreementValue.trim() ||
      !formValues.annualRate.trim() ||
      Number.isNaN(annualRateValue) ||
      annualRateValue < 0 ||
      annualRateValue > 100 ||
      !Number.isInteger(numberOfYearsValue) ||
      numberOfYearsValue <= 0 ||
      rentAdvanceAmountError !== null ||
      rentAdvancePeriodError !== null ||
      yearlyGrossRents.length !== numberOfYearsValue ||
      paymentScheduleValues.some(
        (schedule) =>
          Number.isNaN(schedule.grossAmount) || schedule.grossAmount < 0,
      );

    if (hasMissingRequiredFields) {
      onInvalid(
        rentAdvanceAmountError ??
          rentAdvancePeriodError ??
          "Please complete the lease fields and enter a gross rent value for each year.",
      );
      return;
    }

    const payload = {
      branchId: Number(formValues.branchId),
      lessorId: Number(formValues.lessorId),
      leaseNo: formValues.leaseNo,
      leasePropertyAddress: formValues.leasePropertyAddress,
      sqft: Number(formValues.sqft),
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      extensions: formValues.extensions,
      numberOfYears: Number(formValues.numberOfYears),
      rentAdvance: Number(formValues.rentAdvance),
      rentAdvancePeriod: Number(formValues.rentAdvancePeriod),
      refundableDeposit: Number(formValues.refundableDeposit),
      noticePeriodMonths: Number(formValues.noticePeriodMonths),
      remarks: formValues.remarks,
      agreementValue: Number(formValues.agreementValue),
      annualRate: Number(formValues.annualRate),
      utilityBill: Number(formValues.utilityBill),
      whtRate: Number(formValues.whtRate),
      vatRate: Number(formValues.vatRate),
      leaseStatus: formValues.leaseStatus,
      isPaymentAtBeginning: formValues.isPaymentAtBeginning,
      paymentSchedules: paymentScheduleValues,
    } satisfies CreateLeaseInput;

    setPreviewData({
      payload,
      branchLabel: getBranchLabel(branches, Number(formValues.branchId)),
      lessorLabel: getLessorLabel(lessors, Number(formValues.lessorId)),
    });
  };

  const handlePreviewConfirm = async () => {
    if (!previewData) {
      return;
    }

    const payload = previewData.payload;
    setPreviewData(null);
    await onSubmit(payload, "primary");
  };

  return (
    <form className="space-y-5 p-1" onSubmit={handleSubmit}>
      <div className="rounded-2xl border p-5">
        <SectionHeader
          icon={
            isEditing ? (
              <Pencil className="size-4 text-muted-foreground" />
            ) : (
              <Users className="size-4 text-muted-foreground" />
            )
          }
          title={isEditing ? "Edit Lease Status" : "Add Lease"}
        />

        {!isEditing ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Branch">
              <select
                value={formValues.branchId}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    branchId: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Select a branch</option>
                {branches.map((branch) => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.branchName ??
                      branch.oracleCode ??
                      `Branch ${branch.branchId}`}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Lessor">
              <select
                value={formValues.lessorId}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    lessorId: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Select a lessor</option>
                {lessors.map((lessor) => (
                  <option key={lessor.lessorId} value={lessor.lessorId}>
                    {lessor.fullName ?? `Lessor ${lessor.lessorId}`}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Lease No">
              <input
                value={formValues.leaseNo}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    leaseNo: event.target.value,
                  }))
                }
                placeholder="LEASE-2024-001"
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </FormField>
            <FormField label="Lease Property Address">
              <input
                value={formValues.leasePropertyAddress}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    leasePropertyAddress: event.target.value,
                  }))
                }
                placeholder="789 Property Avenue, City, Country"
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </FormField>
            <FormField label="Sqft">
              <input
                type="number"
                value={formValues.sqft}
                onWheel={stopWheelChange}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    sqft: event.target.value,
                  }))
                }
                className={integerInputClass}
                placeholder="5000"
              />
            </FormField>
            <FormField label="Number of Years">
              <input
                type="number"
                value={formValues.numberOfYears}
                onWheel={stopWheelChange}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    numberOfYears: event.target.value,
                  }))
                }
                className={integerInputClass}
                placeholder="3"
              />
            </FormField>
            {!isEditing && Number(formValues.numberOfYears) > 0 ? (
              <div className="sm:col-span-2 rounded-xl border border-dashed bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold">Yearly Gross Rent</h4>
                    <p className="text-xs text-muted-foreground">
                      Enter one gross rent value for each lease year.
                    </p>
                  </div>
                  <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                    {yearlyGrossRents.length} / {formValues.numberOfYears}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: Number(formValues.numberOfYears) }).map(
                    (_, index) => (
                      <FormField
                        key={index}
                        label={`Year ${index + 1} Gross Rent`}
                      >
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={yearlyGrossRents[index] ?? ""}
                          onWheel={stopWheelChange}
                          onChange={(event) =>
                            setYearlyGrossRents((current) => {
                              const next = [...current];
                              next[index] = event.target.value;
                              return next;
                            })
                          }
                          className={integerInputClass}
                          placeholder="500000"
                        />
                      </FormField>
                    ),
                  )}
                </div>
              </div>
            ) : null}
            <FormField label="Start Date">
              <input
                type="date"
                value={formValues.startDate}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </FormField>
            <FormField label="End Date">
              <input
                type="date"
                value={formValues.endDate}
                readOnly={!isEditing}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40 read-only:bg-muted/40"
              />
            </FormField>
            <FormField label="Rent Advance">
              <input
                type="number"
                value={formValues.rentAdvance}
                onWheel={stopWheelChange}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    rentAdvance: event.target.value,
                  }))
                }
                aria-invalid={Boolean(rentAdvanceAmountError)}
                className={cn(
                  integerInputClass,
                  rentAdvanceAmountError &&
                    "border-destructive focus:ring-destructive/30",
                )}
                placeholder="50000"
              />
              {rentAdvanceAmountError ? (
                <p className="mt-2 text-xs text-destructive">
                  {rentAdvanceAmountError}
                </p>
              ) : null}
            </FormField>
            <FormField label="Rent Advance Period">
              <input
                type="number"
                value={formValues.rentAdvancePeriod}
                onWheel={stopWheelChange}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    rentAdvancePeriod: event.target.value,
                  }))
                }
                aria-invalid={Boolean(rentAdvancePeriodError)}
                className={cn(
                  integerInputClass,
                  rentAdvancePeriodError &&
                    "border-destructive focus:ring-destructive/30",
                )}
                placeholder="12"
              />
              {rentAdvancePeriodError ? (
                <p className="mt-2 text-xs text-destructive">
                  {rentAdvancePeriodError}
                </p>
              ) : null}
            </FormField>
            <FormField label="Refundable Deposit">
              <input
                type="number"
                value={formValues.refundableDeposit}
                onWheel={stopWheelChange}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    refundableDeposit: event.target.value,
                  }))
                }
                className={integerInputClass}
                placeholder="100000"
              />
            </FormField>
            <FormField label="Notice Period Months">
              <input
                type="number"
                value={formValues.noticePeriodMonths}
                onWheel={stopWheelChange}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    noticePeriodMonths: event.target.value,
                  }))
                }
                className={integerInputClass}
                placeholder="3"
              />
            </FormField>
            <FormField label="Agreement Value">
              <input
                type="number"
                value={formValues.agreementValue}
                onWheel={stopWheelChange}
                readOnly
                className={cn(integerInputClass, "read-only:bg-muted/40")}
                placeholder="2000000"
              />
            </FormField>
            <FormField label="Annual Rate (%)">
              <input
                type="number"
                value={formValues.annualRate}
                min={0}
                max={100}
                step="0.01"
                onWheel={stopWheelChange}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    annualRate: event.target.value,
                  }))
                }
                className={integerInputClass}
                placeholder="3.50"
              />
            </FormField>
            <FormField label="Utility Bill">
              <input
                type="number"
                value={formValues.utilityBill}
                min={0}
                step="0.01"
                onWheel={stopWheelChange}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    utilityBill: event.target.value,
                  }))
                }
                className={integerInputClass}
                placeholder="0.00"
              />
            </FormField>
            <FormField label="WHT Rate (%)">
              <input
                type="number"
                value={formValues.whtRate}
                min={0}
                max={100}
                step="0.01"
                onWheel={stopWheelChange}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    whtRate: event.target.value,
                  }))
                }
                className={integerInputClass}
                placeholder="0.00"
              />
            </FormField>
            <FormField label="VAT Rate (%)">
              <input
                type="number"
                value={formValues.vatRate}
                min={0}
                max={100}
                step="0.01"
                onWheel={stopWheelChange}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    vatRate: event.target.value,
                  }))
                }
                className={integerInputClass}
                placeholder="0.00"
              />
            </FormField>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-foreground">
                Payment Timing
              </p>
              <div className="mt-2 flex gap-6">
                <label className="cursor-pointer flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="paymentTiming"
                    checked={!formValues.isPaymentAtBeginning}
                    onChange={() =>
                      setFormValues((current) => ({
                        ...current,
                        isPaymentAtBeginning: false,
                      }))
                    }
                  />
                  End of Month
                </label>
                <label className="cursor-pointer flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="paymentTiming"
                    checked={formValues.isPaymentAtBeginning}
                    onChange={() =>
                      setFormValues((current) => ({
                        ...current,
                        isPaymentAtBeginning: true,
                      }))
                    }
                  />
                  Beginning of Month
                </label>
              </div>
            </div>
            <FormField label="Extensions">
              <textarea
                value={formValues.extensions}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    extensions: event.target.value,
                  }))
                }
                rows={3}
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40 sm:col-span-2"
              />
            </FormField>
            <FormField label="Remarks">
              <textarea
                value={formValues.remarks}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    remarks: event.target.value,
                  }))
                }
                rows={3}
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40 sm:col-span-2"
              />
            </FormField>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <StaticField
              label="Lease No"
              value={selectedLease?.leaseNo ?? "--"}
            />
            <StaticField
              label="Branch"
              value={
                selectedLease?.branch?.branchName ??
                selectedLease?.branch?.oracleCode ??
                `#${selectedLease?.branchId ?? "--"}`
              }
            />
            <StaticField
              label="Lessor"
              value={
                selectedLease?.lessor?.fullName ??
                `#${selectedLease?.lessorId ?? "--"}`
              }
            />
            <StaticField
              label="Property Address"
              value={selectedLease?.leasePropertyAddress ?? "--"}
            />
            <StaticField
              label="Agreement Value"
              value={formatCurrency(selectedLease?.agreementValue ?? 0)}
            />
            <FormField label="Lease Status">
              <select
                value={editLeaseStatus}
                disabled={isTerminatedLease}
                onChange={(event) =>
                  setEditLeaseStatus(event.target.value as LeaseStatus)
                }
                className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted/40"
              >
                {statusOptions
                  .filter(
                    (status) => !isTerminatedLease || status === "Terminate",
                  )
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
              {isTerminatedLease ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  This lease is terminated and cannot be changed back to Active.
                </p>
              ) : null}
            </FormField>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            value="primary"
            className="px-4"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : isEditing ? "Update" : "Submit"}
          </Button>
          <RoleGate allowedRoles={["admin"]}>
            {isEditing ? (
              <Button
                type="submit"
                value="combined"
                className="px-4"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Update & Save"}
              </Button>
            ) : null}
          </RoleGate>
          <Button
            type="button"
            variant="outline"
            className="px-4"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>

      <LeaseCreatePreviewDialog
        open={previewData !== null}
        isSubmitting={isLoading}
        previewData={previewData}
        onCancel={() => setPreviewData(null)}
        onConfirm={handlePreviewConfirm}
      />
    </form>
  );
}

function SectionHeader({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 border-b pb-3">
      {icon}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="text-sm font-medium text-foreground">
      {label}
      {children}
    </label>
  );
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm font-medium text-foreground">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-2 rounded-lg border bg-muted/30 px-3 py-2 text-foreground">
        {value}
      </div>
    </div>
  );
}

function normalizeStatus(
  status: LeaseStatus | string | null | undefined,
): LeaseStatus {
  return status === "Terminate" ? "Terminate" : "Active";
}

function calculateLeaseEndDate(startDate: string, numberOfYears: number) {
  const start = new Date(`${startDate}T00:00:00Z`);
  if (
    Number.isNaN(start.getTime()) ||
    !Number.isInteger(numberOfYears) ||
    numberOfYears <= 0
  ) {
    return "";
  }

  const end = new Date(
    Date.UTC(
      start.getUTCFullYear() + numberOfYears,
      start.getUTCMonth(),
      start.getUTCDate(),
    ),
  );
  end.setUTCDate(end.getUTCDate() - 1);

  return end.toISOString().slice(0, 10);
}

function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-LK", { maximumFractionDigits: 2 }).format(
    numericValue,
  );
}

function getBranchLabel(branches: Branch[], branchId: number) {
  const branch = branches.find((item) => item.branchId === branchId);
  return branch?.branchName ?? branch?.oracleCode ?? `Branch ${branchId}`;
}

function getLessorLabel(lessors: Lessor[], lessorId: number) {
  const lessor = lessors.find((item) => item.lessorId === lessorId);
  return lessor?.fullName ?? `Lessor ${lessorId}`;
}
