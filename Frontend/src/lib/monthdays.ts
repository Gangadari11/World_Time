export const calculateDaysInMonth = (
  periodLabel: string,
): number => {
  const date = new Date(periodLabel);

  if (isNaN(date.getTime())) {
    console.error(`Invalid periodLabel: ${periodLabel}`);
    return 0;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return new Date(year, month, 0).getDate();
};

export const calculateTotalnumberOfDays = (
  startDate: string | undefined | null,
  endDate: string | undefined | null,
): number => {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }

  if (end < start) {
    return 0;
  }

  const msPerDay = 1000 * 60 * 60 * 24;

  // Inclusive count (most lease calculations use this)
  return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
};