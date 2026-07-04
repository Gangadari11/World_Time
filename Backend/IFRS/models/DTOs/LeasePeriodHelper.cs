using System.Globalization;

namespace IFRS.models.DTOs;

public static class LeasePeriodHelper
{
    public static string? CalculateRemainingPeriod(DateOnly? endDate)
    {
        if (endDate is null)
        {
            return null;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        if (endDate.Value < today)
        {
            return "Expired";
        }

        if (endDate.Value == today)
        {
            return "Today";
        }

        var cursor = today;
        var years = 0;
        var months = 0;

        while (cursor.AddYears(1) <= endDate.Value)
        {
            cursor = cursor.AddYears(1);
            years++;
        }

        while (cursor.AddMonths(1) <= endDate.Value)
        {
            cursor = cursor.AddMonths(1);
            months++;
        }

        var days = endDate.Value.DayNumber - cursor.DayNumber;

        var parts = new List<string>();

        if (years > 0)
        {
            parts.Add(string.Format(CultureInfo.InvariantCulture, "{0} year{1}", years, years == 1 ? "" : "s"));
        }

        if (months > 0)
        {
            parts.Add(string.Format(CultureInfo.InvariantCulture, "{0} month{1}", months, months == 1 ? "" : "s"));
        }

        if (days > 0)
        {
            parts.Add(string.Format(CultureInfo.InvariantCulture, "{0} day{1}", days, days == 1 ? "" : "s"));
        }

        return string.Join(", ", parts);
    }
}