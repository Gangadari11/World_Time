using Microsoft.EntityFrameworkCore;
using IFRS.models;

namespace IFRS.Data;

public class IFRSDbContext : DbContext
{
    public IFRSDbContext(DbContextOptions<IFRSDbContext> options) : base(options)
    {
    }

    public DbSet<Branch> Branches { get; set; }
    public DbSet<Lessor> Lessors { get; set; }
    public DbSet<Lease> Leases { get; set; }
    public DbSet<LeasePaymentSchedule> LeasePaymentSchedules { get; set; }
    public DbSet<EntityChangeRequest> EntityChangeRequests { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresEnum<UserRole>("public", "user_role");

        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasColumnType("user_role");

        modelBuilder.Entity<RefreshToken>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(r => r.Token)
            .IsUnique();

        modelBuilder.Entity<EntityChangeRequest>()
            .Property(r => r.EntityType)
            .HasConversion<string>();

        modelBuilder.Entity<EntityChangeRequest>()
            .Property(r => r.Operation)
            .HasConversion<string>();

        modelBuilder.Entity<EntityChangeRequest>()
            .Property(r => r.Status)
            .HasConversion<string>();

        modelBuilder.Entity<EntityChangeRequest>()
            .Property(r => r.OldValueSnapshot)
            .HasColumnType("jsonb");

        modelBuilder.Entity<EntityChangeRequest>()
            .Property(r => r.NewValueSnapshot)
            .HasColumnType("jsonb");

        modelBuilder.Entity<EntityChangeRequest>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(r => r.RequestedBy)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<EntityChangeRequest>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(r => r.ReviewedBy)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<EntityChangeRequest>()
            .HasIndex(r => new { r.Status, r.EntityType, r.EntityId });

        modelBuilder.Entity<EntityChangeRequest>()
            .HasIndex(r => r.RequestedAt);

        // Configure relationships
        modelBuilder.Entity<Lease>()
            .HasOne(l => l.Branch)
            .WithMany(b => b.Leases)
            .HasForeignKey(l => l.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Lease>()
            .HasOne(l => l.Lessor)
            .WithMany(les => les.Leases)
            .HasForeignKey(l => l.LessorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<LeasePaymentSchedule>()
            .HasOne(lps => lps.Lease)
            .WithMany(l => l.PaymentSchedules)
            .HasForeignKey(lps => lps.LeaseId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.ApplyConfiguration(new IFRS.Notifications.Mappings.NotificationConfiguration());
    }
}
