using System.Text.Json;
using IFRS.Data;
using IFRS.models;
using IFRS.models.DTOs;
using Microsoft.EntityFrameworkCore;
using IFRS.Notifications.DTOs;
using IFRS.Notifications.Interfaces;


namespace IFRS.services;

public record WorkflowResult(int StatusCode, string Message, EntityChangeRequestDto? Data = null);

public class EntityChangeRequestService
{
    private sealed record UserSummary(int UserId, string? FullName, string? Email);
    private sealed record EntitySummary(int EntityId, string? EntityType, string? Name, string? Reference);
    private static readonly JsonSerializerOptions SnapshotJsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly IFRSDbContext _context;

    public EntityChangeRequestService(IFRSDbContext context)
    {
        _context = context;
    }

   
    public async Task<IReadOnlyList<EntityChangeRequestDto>> GetRequestsAsync(
        ApprovalRequestStatus? status = null,
        ApprovalEntityType? entityType = null)
    {
        var query = _context.EntityChangeRequests.AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(request => request.Status == status.Value);
        }

        if (entityType.HasValue)
        {
            query = query.Where(request => request.EntityType == entityType.Value);
        }

        var requests = await query
            .OrderByDescending(request => request.RequestedAt)
            .ToListAsync();

        var userLookup = await BuildUserLookupAsync(requests);
        var entityLookup = await BuildEntityLookupAsync(requests);

        return requests
            .Select(request => MapToDto(
                request,
                userLookup.GetValueOrDefault(request.RequestedBy),
                request.ReviewedBy.HasValue ? userLookup.GetValueOrDefault(request.ReviewedBy.Value) : null,
                entityLookup.GetValueOrDefault((request.EntityType, request.EntityId))
            ))
            .ToList();
    }

    public async Task<EntityChangeRequestDto?> GetRequestAsync(int requestId)
    {
        var request = await _context.EntityChangeRequests
            .FirstOrDefaultAsync(change => change.EntityChangeRequestId == requestId);

        if (request == null)
        {
            return null;
        }

        var requestedBy = await GetUserSummaryAsync(request.RequestedBy);
        var reviewedBy = request.ReviewedBy.HasValue
            ? await GetUserSummaryAsync(request.ReviewedBy.Value)
            : null;
        var entitySummary = await GetEntitySummaryAsync(request.EntityType, request.EntityId);

        return MapToDto(request, requestedBy, reviewedBy, entitySummary);
    }

    public async Task<WorkflowResult> SubmitBranchUpdateAsync(int requestedBy, BranchUpdateRequestDto dto)
    {
        var existingBranch = await _context.Branches.FirstOrDefaultAsync(branch => branch.BranchId == dto.BranchId);
        if (existingBranch == null)
        {
            return new WorkflowResult(StatusCodes.Status404NotFound, "Branch not found.");
        }

        if (string.IsNullOrWhiteSpace(dto.BranchName))
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Branch name is required.");
        }

        var duplicateExists = await HasPendingRequestAsync(ApprovalEntityType.Branch, dto.BranchId);
        if (duplicateExists)
        {
            return new WorkflowResult(StatusCodes.Status409Conflict, "A pending branch update already exists.");
        }

        var request = new EntityChangeRequest
        {
            EntityId = dto.BranchId,
            EntityType = ApprovalEntityType.Branch,
            Operation = ApprovalOperation.Update,
            Status = ApprovalRequestStatus.Pending,
            RequestedBy = requestedBy,
            RequestedAt = DateTime.UtcNow,
            RequestComments = dto.RequestComments,
            OldValueSnapshot = ToJsonElement(ToBranchUpdateValueSnapshotDto(existingBranch)),
            NewValueSnapshot = ToJsonElement(ToBranchUpdateValueSnapshotDto(dto)),
            EntityUpdatedAtSnapshot = existingBranch.UpdatedAt
        };

        _context.EntityChangeRequests.Add(request);
        await _context.SaveChangesAsync();

        var requestedBySummary = await GetUserSummaryAsync(requestedBy);
        var entitySummary = BuildBranchSummary(existingBranch);
        var responseDto = MapToDto(request, requestedBySummary, null, entitySummary);

        

        return new WorkflowResult(StatusCodes.Status202Accepted, "Branch update submitted for approval.", responseDto);
    }

    public async Task<WorkflowResult> SubmitLessorUpdateAsync(int requestedBy, LessorUpdateRequestDto dto)
    {
        var existingLessor = await _context.Lessors.FirstOrDefaultAsync(lessor => lessor.LessorId == dto.LessorId);
        if (existingLessor == null)
        {
            return new WorkflowResult(StatusCodes.Status404NotFound, "Lessor not found.");
        }

        if (string.IsNullOrWhiteSpace(dto.FullName))
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Full name is required.");
        }

        var duplicateExists = await HasPendingRequestAsync(ApprovalEntityType.Lessor, dto.LessorId);
        if (duplicateExists)
        {
            return new WorkflowResult(StatusCodes.Status409Conflict, "A pending lessor update already exists.");
        }

        var request = new EntityChangeRequest
        {
            EntityId = dto.LessorId,
            EntityType = ApprovalEntityType.Lessor,
            Operation = ApprovalOperation.Update,
            Status = ApprovalRequestStatus.Pending,
            RequestedBy = requestedBy,
            RequestedAt = DateTime.UtcNow,
            OldValueSnapshot = ToJsonElement(ToLessorUpdateDto(existingLessor)),
            NewValueSnapshot = ToJsonElement(dto),
            RequestComments = dto.RequestComments,
            EntityUpdatedAtSnapshot = existingLessor.UpdatedAt
        };

        _context.EntityChangeRequests.Add(request);
        await _context.SaveChangesAsync();

        var requestedBySummary = await GetUserSummaryAsync(requestedBy);
        var entitySummary = BuildLessorSummary(existingLessor);
        var responseDto = MapToDto(request, requestedBySummary, null, entitySummary);

        
        return new WorkflowResult(StatusCodes.Status202Accepted, "Lessor update submitted for approval.", responseDto);
    }

    public async Task<WorkflowResult> SubmitLeaseUpdateAsync(int requestedBy, LeaseUpdateRequestDto dto)
    {
        var existingLease = await _context.Leases.FirstOrDefaultAsync(lease => lease.LeaseId == dto.LeaseId);
        if (existingLease == null)
        {
            return new WorkflowResult(StatusCodes.Status404NotFound, "Lease not found.");
        }

        var branchExists = dto.BranchId == null || await _context.Branches.AnyAsync(branch => branch.BranchId == dto.BranchId.Value);
        if (!branchExists)
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Invalid BranchId.");
        }

        var lessorExists = dto.LessorId == null || await _context.Lessors.AnyAsync(lessor => lessor.LessorId == dto.LessorId.Value);
        if (!lessorExists)
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Invalid LessorId.");
        }

        if (
            string.Equals(existingLease.LeaseStatus, "Terminate", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(dto.LeaseStatus, "Active", StringComparison.OrdinalIgnoreCase))
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Terminated leases cannot be changed back to Active.");
        }

        var duplicateExists = await HasPendingRequestAsync(ApprovalEntityType.Lease, dto.LeaseId);
        if (duplicateExists)
        {
            return new WorkflowResult(StatusCodes.Status409Conflict, "A pending lease update already exists.");
        }

        var request = new EntityChangeRequest
        {
            EntityId = dto.LeaseId,
            EntityType = ApprovalEntityType.Lease,
            Operation = ApprovalOperation.Update,
            Status = ApprovalRequestStatus.Pending,
            RequestedBy = requestedBy,
            RequestedAt = DateTime.UtcNow,
            OldValueSnapshot = ToJsonElement(ToLeaseUpdateDto(existingLease)),
            NewValueSnapshot = ToJsonElement(dto),
            RequestComments = dto.RequestComments,
            EntityUpdatedAtSnapshot = existingLease.UpdatedAt
        };

        _context.EntityChangeRequests.Add(request);
        await _context.SaveChangesAsync();

        var requestedBySummary = await GetUserSummaryAsync(requestedBy);
        var entitySummary = BuildLeaseSummary(existingLease);
        var responseDto = MapToDto(request, requestedBySummary, null, entitySummary);

        
        return new WorkflowResult(StatusCodes.Status202Accepted, "Lease update submitted for approval.", responseDto);
    }

    public async Task<WorkflowResult> ReviewRequestAsync(int requestId, int reviewedBy, ApprovalRequestStatus status, string? reviewComments)
    {
        if (status is not ApprovalRequestStatus.Approved and not ApprovalRequestStatus.Rejected)
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Status must be Approved or Rejected.");
        }

        var request = await _context.EntityChangeRequests.FirstOrDefaultAsync(change => change.EntityChangeRequestId == requestId);
        if (request == null)
        {
            return new WorkflowResult(StatusCodes.Status404NotFound, "Approval request not found.");
        }

        if (request.Status != ApprovalRequestStatus.Pending)
        {
            return new WorkflowResult(StatusCodes.Status409Conflict, "This request has already been reviewed.");
        }

        if (status == ApprovalRequestStatus.Rejected)
        {
            request.Status = ApprovalRequestStatus.Rejected;
            request.ReviewedBy = reviewedBy;
            request.ReviewedAt = DateTime.UtcNow;
            request.ReviewComments = reviewComments;

            await _context.SaveChangesAsync();
            var requestedBySummary = await GetUserSummaryAsync(request.RequestedBy);
            var reviewedBySummary = await GetUserSummaryAsync(reviewedBy);
            var entitySummary = await GetEntitySummaryAsync(request.EntityType, request.EntityId);
            var rejectedDto = MapToDto(request, requestedBySummary, reviewedBySummary, entitySummary);

            return new WorkflowResult(StatusCodes.Status200OK, "Request rejected.", rejectedDto);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync();

        var applyResult = await ApplyApprovedRequestAsync(request);
        if (applyResult.StatusCode >= 400)
        {
            await transaction.RollbackAsync();
            return new WorkflowResult(applyResult.StatusCode, applyResult.Message);
        }

        request.Status = ApprovalRequestStatus.Approved;
        request.ReviewedBy = reviewedBy;
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewComments = reviewComments;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        var requestedByApproved = await GetUserSummaryAsync(request.RequestedBy);
        var reviewedByApproved = await GetUserSummaryAsync(reviewedBy);
        var approvedEntitySummary = await GetEntitySummaryAsync(request.EntityType, request.EntityId);
        var responseDto = MapToDto(request, requestedByApproved, reviewedByApproved, approvedEntitySummary);

        return new WorkflowResult(StatusCodes.Status200OK, "Request approved and applied.", responseDto);
    }

    private async Task<WorkflowResult> ApplyApprovedRequestAsync(EntityChangeRequest request)
    {
        return request.EntityType switch
        {
            ApprovalEntityType.Branch => await ApplyBranchUpdateAsync(request),
            ApprovalEntityType.Lessor => await ApplyLessorUpdateAsync(request),
            ApprovalEntityType.Lease => await ApplyLeaseUpdateAsync(request),
            _ => new WorkflowResult(StatusCodes.Status400BadRequest, "Unsupported entity type.")
        };
    }

    private async Task<WorkflowResult> ApplyBranchUpdateAsync(EntityChangeRequest request)
    {
        var payload = DeserializeSnapshot<BranchUpdateRequestDto>(request.NewValueSnapshot);
        if (payload == null)
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Invalid branch payload.");
        }

        var branch = await _context.Branches.FirstOrDefaultAsync(item => item.BranchId == request.EntityId);
        if (branch == null)
        {
            return new WorkflowResult(StatusCodes.Status404NotFound, "Branch not found.");
        }

        if (request.EntityUpdatedAtSnapshot.HasValue && branch.UpdatedAt != request.EntityUpdatedAtSnapshot.Value)
        {
            return new WorkflowResult(StatusCodes.Status409Conflict, "Branch has changed since the request was submitted.");
        }

        if (string.IsNullOrWhiteSpace(payload.BranchName))
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Branch name is required.");
        }

        branch.OracleCode = payload.OracleCode;
        branch.BranchCode = payload.BranchCode;
        branch.BranchName = payload.BranchName;
        branch.Lessee = payload.Lessee;
        branch.Status = payload.Status;
        branch.UpdatedAt = DateTime.UtcNow;

        return new WorkflowResult(StatusCodes.Status200OK, "Branch update applied.");
    }

    private async Task<WorkflowResult> ApplyLessorUpdateAsync(EntityChangeRequest request)
    {
        var payload = DeserializeSnapshot<LessorUpdateRequestDto>(request.NewValueSnapshot);
        if (payload == null)
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Invalid lessor payload.");
        }

        var lessor = await _context.Lessors.FirstOrDefaultAsync(item => item.LessorId == request.EntityId);
        if (lessor == null)
        {
            return new WorkflowResult(StatusCodes.Status404NotFound, "Lessor not found.");
        }

        if (request.EntityUpdatedAtSnapshot.HasValue && lessor.UpdatedAt != request.EntityUpdatedAtSnapshot.Value)
        {
            return new WorkflowResult(StatusCodes.Status409Conflict, "Lessor has changed since the request was submitted.");
        }

        if (string.IsNullOrWhiteSpace(payload.FullName))
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Full name is required.");
        }

        lessor.FullName = payload.FullName;
        lessor.Nic = payload.Nic;
        lessor.Address = payload.Address;
        lessor.BankName = payload.BankName;
        lessor.AccountNumber = payload.AccountNumber;
        lessor.BankCode = payload.BankCode;
        lessor.UpdatedAt = DateTime.UtcNow;

        return new WorkflowResult(StatusCodes.Status200OK, "Lessor update applied.");
    }

    private async Task<WorkflowResult> ApplyLeaseUpdateAsync(EntityChangeRequest request)
    {
        var payload = DeserializeSnapshot<LeaseUpdateRequestDto>(request.NewValueSnapshot);
        if (payload == null)
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Invalid lease payload.");
        }

        var lease = await _context.Leases.FirstOrDefaultAsync(item => item.LeaseId == request.EntityId);
        if (lease == null)
        {
            return new WorkflowResult(StatusCodes.Status404NotFound, "Lease not found.");
        }

        if (request.EntityUpdatedAtSnapshot.HasValue && lease.UpdatedAt != request.EntityUpdatedAtSnapshot.Value)
        {
            return new WorkflowResult(StatusCodes.Status409Conflict, "Lease has changed since the request was submitted.");
        }

        if (payload.BranchId != null && !await _context.Branches.AnyAsync(branch => branch.BranchId == payload.BranchId))
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Invalid BranchId.");
        }

        if (payload.LessorId != null && !await _context.Lessors.AnyAsync(lessor => lessor.LessorId == payload.LessorId))
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Invalid LessorId.");
        }

        if (
            string.Equals(lease.LeaseStatus, "Terminate", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(payload.LeaseStatus, "Active", StringComparison.OrdinalIgnoreCase))
        {
            return new WorkflowResult(StatusCodes.Status400BadRequest, "Terminated leases cannot be changed back to Active.");
        }

        lease.BranchId = payload.BranchId;
        lease.LessorId = payload.LessorId;
        lease.LeaseNo = payload.LeaseNo;
        lease.LeasePropertyAddress = payload.LeasePropertyAddress;
        lease.Sqft = payload.Sqft;
        lease.StartDate = payload.StartDate;
        lease.EndDate = payload.EndDate;
        lease.Extensions = payload.Extensions;
        lease.NumberOfYears = payload.NumberOfYears;
        lease.RentAdvance = payload.RentAdvance;
        lease.RentAdvancePeriod = payload.RentAdvancePeriod;
        lease.RefundableDeposit = payload.RefundableDeposit;
        lease.NoticePeriodMonths = payload.NoticePeriodMonths;
        lease.Remarks = payload.Remarks;
        lease.AgreementValue = payload.AgreementValue;
        lease.AnnualRate = payload.AnnualRate;
        lease.UtilityBill = payload.UtilityBill;
        lease.WhtRate = payload.WhtRate;
        lease.VatRate = payload.VatRate;
        lease.LeaseStatus = payload.LeaseStatus;
        lease.IsPaymentAtBeginning = payload.IsPaymentAtBeginning;
        lease.UpdatedAt = DateTime.UtcNow;

        return new WorkflowResult(StatusCodes.Status200OK, "Lease update applied.");
    }

    public async Task<bool> HasPendingRequestAsync(ApprovalEntityType entityType, int entityId)
    {
        return await _context.EntityChangeRequests.AnyAsync(request =>
            request.EntityType == entityType &&
            request.EntityId == entityId &&
            request.Status == ApprovalRequestStatus.Pending);
    }

    private static JsonElement ToJsonElement<T>(T value)
    {
        return JsonSerializer.SerializeToElement(value, SnapshotJsonOptions);
    }

    private static T? DeserializeSnapshot<T>(JsonElement snapshot)
    {
        return JsonSerializer.Deserialize<T>(snapshot.GetRawText(), SnapshotJsonOptions);
    }

    private static EntityChangeRequestDto MapToDto(
        EntityChangeRequest request,
        UserSummary? requestedBy,
        UserSummary? reviewedBy,
        EntitySummary? entitySummary)
    {
        return new EntityChangeRequestDto
        {
            EntityChangeRequestId = request.EntityChangeRequestId,
            EntityId = request.EntityId,
            EntityType = request.EntityType.ToString(),
            EntitySummary = entitySummary == null
                ? null
                : new EntitySummaryDto
                {
                    EntityId = entitySummary.EntityId,
                    EntityType = entitySummary.EntityType,
                    Name = entitySummary.Name,
                    Reference = entitySummary.Reference,
                },
            Operation = request.Operation.ToString(),
            OldValueSnapshot = request.OldValueSnapshot,
            NewValueSnapshot = request.NewValueSnapshot,
            Status = request.Status.ToString(),
            RequestedBy = request.RequestedBy,
            RequestedByUser = requestedBy == null
                ? null
                : new UserSummaryDto
                {
                    UserId = requestedBy.UserId,
                    FullName = requestedBy.FullName,
                    Email = requestedBy.Email,
                },
            RequestedAt = request.RequestedAt,
            RequestComments = request.RequestComments,
            ReviewedBy = request.ReviewedBy,
            ReviewedByUser = reviewedBy == null
                ? null
                : new UserSummaryDto
                {
                    UserId = reviewedBy.UserId,
                    FullName = reviewedBy.FullName,
                    Email = reviewedBy.Email,
                },
            ReviewedAt = request.ReviewedAt,
            ReviewComments = request.ReviewComments,
            EntityUpdatedAtSnapshot = request.EntityUpdatedAtSnapshot
        };
    }

    private async Task<Dictionary<int, UserSummary>> BuildUserLookupAsync(IEnumerable<EntityChangeRequest> requests)
    {
        var userIds = requests
            .SelectMany(request => request.ReviewedBy.HasValue
                ? new[] { request.RequestedBy, request.ReviewedBy.Value }
                : new[] { request.RequestedBy })
            .Distinct()
            .ToList();

        if (userIds.Count == 0)
        {
            return new Dictionary<int, UserSummary>();
        }

        return await _context.Users
            .Where(user => userIds.Contains(user.UserId))
            .Select(user => new UserSummary(user.UserId, user.FullName, user.Email))
            .ToDictionaryAsync(user => user.UserId, user => user);
    }

    private async Task<UserSummary?> GetUserSummaryAsync(int userId)
    {
        return await _context.Users
            .Where(item => item.UserId == userId)
            .Select(item => new UserSummary(item.UserId, item.FullName, item.Email))
            .FirstOrDefaultAsync();
    }

    private async Task<Dictionary<(ApprovalEntityType, int), EntitySummary>> BuildEntityLookupAsync(
        IEnumerable<EntityChangeRequest> requests)
    {
        var branchIds = requests
            .Where(request => request.EntityType == ApprovalEntityType.Branch)
            .Select(request => request.EntityId)
            .Distinct()
            .ToList();

        var lessorIds = requests
            .Where(request => request.EntityType == ApprovalEntityType.Lessor)
            .Select(request => request.EntityId)
            .Distinct()
            .ToList();

        var leaseIds = requests
            .Where(request => request.EntityType == ApprovalEntityType.Lease)
            .Select(request => request.EntityId)
            .Distinct()
            .ToList();

        var result = new Dictionary<(ApprovalEntityType, int), EntitySummary>();

        if (branchIds.Count > 0)
        {
            var branches = await _context.Branches
                .Where(branch => branchIds.Contains(branch.BranchId))
                .Select(branch => new { branch.BranchId, branch.BranchName, branch.BranchCode, branch.OracleCode })
                .ToListAsync();

            foreach (var branch in branches)
            {
                result[(ApprovalEntityType.Branch, branch.BranchId)] = new EntitySummary(
                    branch.BranchId,
                    ApprovalEntityType.Branch.ToString(),
                    branch.BranchName,
                    branch.BranchCode ?? branch.OracleCode
                );
            }
        }

        if (lessorIds.Count > 0)
        {
            var lessors = await _context.Lessors
                .Where(lessor => lessorIds.Contains(lessor.LessorId))
                .Select(lessor => new { lessor.LessorId, lessor.FullName, lessor.Nic })
                .ToListAsync();

            foreach (var lessor in lessors)
            {
                result[(ApprovalEntityType.Lessor, lessor.LessorId)] = new EntitySummary(
                    lessor.LessorId,
                    ApprovalEntityType.Lessor.ToString(),
                    lessor.FullName,
                    lessor.Nic
                );
            }
        }

        if (leaseIds.Count > 0)
        {
            var leases = await _context.Leases
                .Where(lease => leaseIds.Contains(lease.LeaseId))
                .Select(lease => new { lease.LeaseId, lease.LeaseNo, lease.LeasePropertyAddress })
                .ToListAsync();

            foreach (var lease in leases)
            {
                result[(ApprovalEntityType.Lease, lease.LeaseId)] = new EntitySummary(
                    lease.LeaseId,
                    ApprovalEntityType.Lease.ToString(),
                    lease.LeaseNo,
                    lease.LeasePropertyAddress
                );
            }
        }

        return result;
    }

    private async Task<EntitySummary?> GetEntitySummaryAsync(ApprovalEntityType entityType, int entityId)
    {
        return entityType switch
        {
            ApprovalEntityType.Branch => await _context.Branches
                .Where(branch => branch.BranchId == entityId)
                .Select(branch => BuildBranchSummary(branch))
                .FirstOrDefaultAsync(),
            ApprovalEntityType.Lessor => await _context.Lessors
                .Where(lessor => lessor.LessorId == entityId)
                .Select(lessor => BuildLessorSummary(lessor))
                .FirstOrDefaultAsync(),
            ApprovalEntityType.Lease => await _context.Leases
                .Where(lease => lease.LeaseId == entityId)
                .Select(lease => BuildLeaseSummary(lease))
                .FirstOrDefaultAsync(),
            _ => null,
        };
    }

    private static EntitySummary BuildBranchSummary(Branch branch)
    {
        return new EntitySummary(
            branch.BranchId,
            ApprovalEntityType.Branch.ToString(),
            branch.BranchName,
            branch.BranchCode ?? branch.OracleCode
        );
    }

    private static EntitySummary BuildLessorSummary(Lessor lessor)
    {
        return new EntitySummary(
            lessor.LessorId,
            ApprovalEntityType.Lessor.ToString(),
            lessor.FullName,
            lessor.Nic
        );
    }

    private static EntitySummary BuildLeaseSummary(Lease lease)
    {
        return new EntitySummary(
            lease.LeaseId,
            ApprovalEntityType.Lease.ToString(),
            lease.LeaseNo,
            lease.LeasePropertyAddress
        );
    }

    private static BranchUpdateValueSnapshotDto ToBranchUpdateValueSnapshotDto(Branch branch)
    {
        return new BranchUpdateValueSnapshotDto
        {
            BranchId = branch.BranchId,
            OracleCode = branch.OracleCode,
            BranchCode = branch.BranchCode,
            BranchName = branch.BranchName,
            Lessee = branch.Lessee,
            Status = branch.Status
        };
    }

    // Method overload of above method for dto
    private static BranchUpdateValueSnapshotDto ToBranchUpdateValueSnapshotDto(BranchUpdateRequestDto branch)
    {
        return new BranchUpdateValueSnapshotDto
        {
            BranchId = branch.BranchId,
            OracleCode = branch.OracleCode,
            BranchCode = branch.BranchCode,
            BranchName = branch.BranchName,
            Lessee = branch.Lessee,
            Status = branch.Status
        };
    }

    private static LessorUpdateRequestDto ToLessorUpdateDto(Lessor lessor)
    {
        return new LessorUpdateRequestDto
        {
            LessorId = lessor.LessorId,
            FullName = lessor.FullName,
            Nic = lessor.Nic,
            Address = lessor.Address,
            BankName = lessor.BankName,
            AccountNumber = lessor.AccountNumber,
            BankCode = lessor.BankCode
        };
    }

    private static LeaseUpdateRequestDto ToLeaseUpdateDto(Lease lease)
    {
        return new LeaseUpdateRequestDto
        {
            LeaseId = lease.LeaseId,
            BranchId = lease.BranchId,
            LessorId = lease.LessorId,
            LeaseNo = lease.LeaseNo,
            LeasePropertyAddress = lease.LeasePropertyAddress,
            Sqft = lease.Sqft,
            StartDate = lease.StartDate,
            EndDate = lease.EndDate,
            Extensions = lease.Extensions,
            NumberOfYears = lease.NumberOfYears,
            RentAdvance = lease.RentAdvance,
            RentAdvancePeriod = lease.RentAdvancePeriod,
            RefundableDeposit = lease.RefundableDeposit,
            NoticePeriodMonths = lease.NoticePeriodMonths,
            Remarks = lease.Remarks,
            AgreementValue = lease.AgreementValue,
            AnnualRate = lease.AnnualRate,
            UtilityBill = lease.UtilityBill,
            WhtRate = lease.WhtRate,
            VatRate = lease.VatRate,
            LeaseStatus = lease.LeaseStatus,
            IsPaymentAtBeginning = lease.IsPaymentAtBeginning
        };
    }
}