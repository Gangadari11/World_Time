namespace IFRS.Tests.Infrastructure;

public class TestUser
{
    public static TestUser Current { get; } = new TestUser();

    public string UserId { get; set; } = "1";
    public string Name { get; set; } = "Test User";
    public string Role { get; set; } = "admin";
}
