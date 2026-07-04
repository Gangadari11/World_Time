using IFRS.Data;
using Microsoft.EntityFrameworkCore;

namespace IFRS.Tests.TestHelpers;

internal static class DbContextFactory
{
    public static IFRSDbContext Create(string databaseName)
    {
        var options = new DbContextOptionsBuilder<IFRSDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new IFRSDbContext(options);
    }
}