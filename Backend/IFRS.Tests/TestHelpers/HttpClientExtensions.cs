using System.Net.Http.Headers;
using IFRS.Tests.Infrastructure;

namespace IFRS.Tests.Helpers;

public static class HttpClientExtensions
{
    public static HttpClient AsAuthenticated(this HttpClient client)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(TestAuthScheme.Scheme);
        return client;
    }
}
