using IFRS.controllers;
using IFRS.Data;
using IFRS.models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using IFRS.services;
using IFRS.Tests.TestHelpers;
using Xunit;


namespace IFRS.Tests.Controllers;

public class BranchesControllerTests
{
    [Fact]
    public async Task Create_Get_Update_Delete_Branch_Workflow()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        var workflowService = new EntityChangeRequestService(db);
        var controller = new BranchesController(db, workflowService);
        SetCurrentUser(controller, 1);

        // Create
        var createResult = await controller.CreateBranch(new Branch
        {
            BranchName = "Main Branch",
            OracleCode = "ORCL001",
            Lessee = "Lessee A",
            Status = "active"
        });

        var created = Assert.IsAssignableFrom<CreatedAtActionResult>(createResult.Result);
        var createdDto = Assert.IsType<IFRS.models.DTOs.BranchDetailDto>(created.Value);

        // Get all
        var listResult = await controller.GetBranches();
        var okList = Assert.IsType<OkObjectResult>(listResult.Result);

        // Get by id
        var branchEntity = await db.Branches.FirstAsync();
        var getResult = await controller.GetBranch(branchEntity.BranchId);
        var okGet = Assert.IsType<OkObjectResult>(getResult.Result);

        // Update
        var updateRequest = new IFRS.models.DTOs.BranchUpdateRequestDto
        {
            BranchId = branchEntity.BranchId,
            BranchName = "Updated Branch",
            OracleCode = branchEntity.OracleCode,
            BranchCode = branchEntity.BranchCode,
            Lessee = branchEntity.Lessee,
            Status = branchEntity.Status
        };

        var updateResult = await controller.UpdateBranch(branchEntity.BranchId, updateRequest);
        var okUpdate = Assert.IsType<ObjectResult>(updateResult);
        Assert.Equal(StatusCodes.Status202Accepted, okUpdate.StatusCode);

        // Delete
        var deleteResult = await controller.DeleteBranch(branchEntity.BranchId);
        Assert.IsType<OkObjectResult>(deleteResult);
    }

    [Fact]
    public async Task GetBranch_NotFound_ReturnsNotFound()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        var workflowService = new EntityChangeRequestService(db);
        var controller = new BranchesController(db, workflowService);

        var result = await controller.GetBranch(999);
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    private static void SetCurrentUser(ControllerBase controller, int userId)
    {
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[] { new Claim("sub", userId.ToString()) },
                authenticationType: "TestAuth"))
        };

        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
    }
}
