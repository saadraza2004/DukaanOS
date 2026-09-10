using System.Security.Claims;
using DukaanOS.API.DTOs;
using DukaanOS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DukaanOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "OWNER")]
public class DayClosingController : ControllerBase
{
    private readonly IDayClosingService _dayClosingService;

    public DayClosingController(IDayClosingService dayClosingService)
    {
        _dayClosingService = dayClosingService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] decimal openingCash = 0m)
    {
        var summary = await _dayClosingService.GetTodayClosingSummaryAsync(openingCash, GetStoreId());
        return Ok(summary);
    }

    [HttpPost("submit")]
    public async Task<IActionResult> SubmitClosing([FromBody] SubmitDayClosingRequest request)
    {
        var userId = GetUserId();
        var storeId = GetStoreId();
        var closing = await _dayClosingService.SubmitDayClosingAsync(request, userId, storeId);
        return Ok(closing);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] int limit = 30)
    {
        var history = await _dayClosingService.GetClosingHistoryAsync(limit, GetStoreId());
        return Ok(history);
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 1;
    }

    private int GetStoreId()
    {
        var claim = User.FindFirst("StoreId")?.Value;
        return int.TryParse(claim, out var id) ? id : 1;
    }
}
