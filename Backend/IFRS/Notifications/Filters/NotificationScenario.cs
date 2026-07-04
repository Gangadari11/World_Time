namespace IFRS.Notifications.Filters;

public enum NotificationScenario
{
    // data_entry submits create/update → notify requester + admins to review
    SubmitForApproval,

    // admin approves/rejects → notify the original requester of outcome
    ReviewOutcome,

    // admin creates directly (no approval needed) → notify requester + admins
    DirectCreate
}