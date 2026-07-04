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

public class LessorsControllerTests
{
    [Fact]
    public async Task Create_Get_Update_Delete_Lessor_Workflow()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        var workflowService = new EntityChangeRequestService(db);
        var controller = new LessorsController(db, workflowService);
        SetCurrentUser(controller, 1);

        // Create
        var createResult = await controller.CreateLessor(new Lessor
        {
            FullName = "Lessor A",
            Nic = "123456789V",
            Address = "Some Address",
            BankName = "Bank",
            AccountNumber = "000111222"
        });

        var created = Assert.IsType<CreatedAtActionResult>(createResult.Result);

        // Get list
        var listResult = await controller.GetLessors();
        var okList = Assert.IsType<OkObjectResult>(listResult.Result);

        // Get by id
        var lessor = await db.Lessors.FirstAsync();
        var getResult = await controller.GetLessor(lessor.LessorId);
        Assert.IsType<OkObjectResult>(getResult.Result);

        // Update
        var updateRequest = new IFRS.models.DTOs.LessorUpdateRequestDto
        {
            LessorId = lessor.LessorId,
            FullName = "Lessor A Updated",
            Nic = lessor.Nic,
            Address = lessor.Address,
            BankName = lessor.BankName,
            AccountNumber = lessor.AccountNumber,
            BankCode = lessor.BankCode
        };

        var updateResult = await controller.UpdateLessor(lessor.LessorId, updateRequest);
        var okUpdate = Assert.IsType<ObjectResult>(updateResult);
        Assert.Equal(StatusCodes.Status202Accepted, okUpdate.StatusCode);

        // Delete
        var deleteResult = await controller.DeleteLessor(lessor.LessorId);
        Assert.IsType<OkObjectResult>(deleteResult);
    }

    [Fact]
    public async Task GetLessor_NotFound_ReturnsNotFound()
    {
        await using var db = DbContextFactory.Create(Guid.NewGuid().ToString());
        var workflowService = new EntityChangeRequestService(db);
        var controller = new LessorsController(db, workflowService);

        var result = await controller.GetLessor(999);
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
