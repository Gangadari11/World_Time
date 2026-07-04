using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;

namespace IFRS.Tests.TestHelpers;

internal class HostingEnvironmentStub : IWebHostEnvironment
{
    public HostingEnvironmentStub(string environmentName)
    {
        EnvironmentName = environmentName;
        ApplicationName = "IFRS.Tests";
        ContentRootPath = AppContext.BaseDirectory;
        WebRootPath = AppContext.BaseDirectory;
        ContentRootFileProvider = new PhysicalFileProvider(ContentRootPath);
        WebRootFileProvider = new PhysicalFileProvider(WebRootPath);
    }

    public string EnvironmentName { get; set; }
    public string ApplicationName { get; set; }
    public string ContentRootPath { get; set; }
    public IFileProvider ContentRootFileProvider { get; set; }
    public string WebRootPath { get; set; }
    public IFileProvider WebRootFileProvider { get; set; }
}
