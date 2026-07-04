using IFRS.models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IFRS.Notifications.Mappings;

/// <summary>
/// Fluent EF Core configuration for the notifications table.
/// </summary>
public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");

        builder.HasKey(notification => notification.Id);

        builder.Property(notification => notification.Type)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(notification => notification.Title)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(notification => notification.Message)
            .IsRequired();

        builder.Property(notification => notification.ReferenceId)
            .HasMaxLength(100);

        builder.Property(notification => notification.ReferenceType)
            .HasMaxLength(100);

        builder.HasIndex(notification => new { notification.UserId, notification.IsRead });
        builder.HasIndex(notification => new { notification.UserId, notification.Type, notification.ReferenceType, notification.ReferenceId });

        builder.HasOne(notification => notification.User)
            .WithMany()
            .HasForeignKey(notification => notification.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
