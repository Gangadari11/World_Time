using IFRS.models;
using IFRS.models.DTOs;
using IFRS.Notifications.Filters;
using IFRS.services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IFRS.controllers;

[Route("api/entity-change-requests")]
[ApiController]
[Authorize(Roles = "admin")]
public class EntityChangeRequestsController : ControllerBase
{
    private readonly EntityChangeRequestService _workflowService;

    public EntityChangeRequestsController(EntityChangeRequestService workflowService)
    {
        _workflowService = workflowService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EntityChangeRequestDto>>> GetRequests(
        [FromQuery] ApprovalRequestStatus? status = ApprovalRequestStatus.Pending,
        [FromQuery] ApprovalEntityType? entityType = null)
    {
        var requests = await _workflowService.GetRequestsAsync(status, entityType);
        return Ok(requests);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRequest(int id)
    {
        var request = await _workflowService.GetRequestAsync(id);
        if (request == null)
        {
            return NotFound(new { message = "Approval request not found." });
        }

        return Ok(request);
    }

    [HttpPost("{id}/review")]
    [NotifyOnSuccess("Request {action}", "Your request was {action} by {userName}.", nameof(EntityChangeRequest), NotificationScenario.ReviewOutcome)]

    public async Task<IActionResult> ReviewRequest(int id, ReviewEntityChangeRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var currentUserId = User.GetCurrentUserId();
        if (!currentUserId.HasValue)
        {
            return Unauthorized(new { message = "Invalid token." });
        }

        var result = await _workflowService.ReviewRequestAsync(id, currentUserId.Value, dto.Status, dto.ReviewComments);
        return StatusCode(result.StatusCode, new { message = result.Message, data = result.Data });
    }
}