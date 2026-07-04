using IFRS.Data;
using IFRS.Notifications.DTOs;
using IFRS.Notifications.Helpers;
using IFRS.Notifications.Interfaces;
using IFRS.Notifications.Mappings;
using IFRS.models;
using IFRS.Notifications.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace IFRS.Notifications.Services;

/// <summary>
/// Coordinates notification creation, history, and real-time dispatch.
/// </summary>
public sealed class NotificationService : INotificationService
{
    private readonly IFRSDbContext _dbContext;
    private readonly INotificationRepository _notificationRepository;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IFRSDbContext dbContext,
        INotificationRepository notificationRepository,
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _dbContext = dbContext;
        _notificationRepository = notificationRepository;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto request, CancellationToken cancellationToken = default)
    {
        if (request.UserId == null)
            throw new ArgumentException("A user id is required to create a notification.", nameof(request));

        var notification = await CreateEntityAsync(request.UserId.Value, request, cancellationToken);
        return notification;
    }

    public async Task<IReadOnlyList<NotificationDto>> CreateNotificationsForUsersAsync(IEnumerable<int> userIds, CreateNotificationDto request, CancellationToken cancellationToken = default)
    {
        var recipients = userIds.Distinct().ToArray();
        var results = new List<NotificationDto>(recipients.Length);

        foreach (var userId in recipients)
        {
            var notification = await CreateEntityAsync(userId, request, cancellationToken);
            results.Add(notification);
        }

        return results;
    }

    public async Task<IReadOnlyList<NotificationDto>> CreateForUserAndAdminsAsync(int userId, CreateNotificationDto request, CancellationToken cancellationToken = default)
    {
        var subjectUser = await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.UserId == userId, cancellationToken);

        if (subjectUser == null)
            throw new ArgumentException("User not found.", nameof(userId));

        var adminIds = await GetAdminUserIdsAsync(cancellationToken);
        var recipients = new HashSet<int>(adminIds);

        if (subjectUser.Role != UserRole.admin)
            recipients.Add(subjectUser.UserId);

        return await CreateNotificationsForUsersAsync(recipients, request, cancellationToken);
    }

    public async Task<PagedResult<NotificationDto>> GetUserNotificationsAsync(int userId, NotificationQueryParameters query, CancellationToken cancellationToken = default)
    {
        var pageNumber = Math.Max(query.PageNumber, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var skip = (pageNumber - 1) * pageSize;

        var totalCount = await _notificationRepository.CountAsync(userId, query.IsRead, cancellationToken);
        var items = await _notificationRepository.GetPagedAsync(userId, skip, pageSize, query.IsRead, cancellationToken);

        return new PagedResult<NotificationDto>
        {
            Items = items.Select(notification => notification.ToDto()).ToList(),
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            HasNextPage = skip + items.Count < totalCount,
            HasPreviousPage = pageNumber > 1
        };
    }

    public async Task<PagedResult<NotificationDto>> GetUnreadNotificationsAsync(int userId, NotificationQueryParameters query, CancellationToken cancellationToken = default)
    {
        return await GetUserNotificationsAsync(userId, new NotificationQueryParameters
        {
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            IsRead = false
        }, cancellationToken);
    }

    public async Task<NotificationDto?> MarkAsReadAsync(int notificationId, int userId, CancellationToken cancellationToken = default)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId, cancellationToken);
        if (notification == null || notification.UserId != userId)
            return null;

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return notification.ToDto();
    }

    public async Task<int> MarkAllAsReadAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _notificationRepository.MarkAllAsReadAsync(userId, cancellationToken);
    }

    public async Task DeleteAsync(int notificationId, int userId, CancellationToken cancellationToken = default)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId, cancellationToken);
        if (notification == null || notification.UserId != userId)
            return;

        await _notificationRepository.DeleteAsync(notification, cancellationToken);
    }

    public async Task SendRealTimeNotificationAsync(NotificationDto notification, CancellationToken cancellationToken = default)
    {
        await _hubContext.Clients.User(notification.UserId.ToString())
            .SendAsync("ReceiveNotification", notification, cancellationToken);
    }

    private async Task<NotificationDto> CreateEntityAsync(int userId, CreateNotificationDto request, CancellationToken cancellationToken)
    {
        var notification = new Notification
        {
            UserId = userId,
            Title = request.Title,
            Message = request.Message,
            Type = request.Type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            ReferenceId = request.ReferenceId,
            ReferenceType = request.ReferenceType
        };

        var duplicateWindow = DateTime.UtcNow.AddMinutes(-60);
        var isDuplicate = await _notificationRepository.ExistsRecentAsync(
            userId,
            request.Type,
            request.ReferenceId,
            request.ReferenceType,
            duplicateWindow,
            cancellationToken);

        if (isDuplicate)
        {
            _logger.LogInformation("Skipping duplicate notification for user {UserId}, type {Type}, reference {ReferenceType}/{ReferenceId}.", userId, request.Type, request.ReferenceType, request.ReferenceId);

            var existing = await _notificationRepository.GetPagedAsync(userId, 0, 1, null, cancellationToken);
            var latest = existing.FirstOrDefault();
            if (latest != null)
                return latest.ToDto();
        }

        await _notificationRepository.AddAsync(notification, cancellationToken);

        var dto = notification.ToDto();
        await SendRealTimeNotificationAsync(dto, cancellationToken);
        return dto;
    }

    private async Task<IReadOnlyList<int>> GetAdminUserIdsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Where(user => user.Role == UserRole.admin)
            .Select(user => user.UserId)
            .ToListAsync(cancellationToken);
    }
}
