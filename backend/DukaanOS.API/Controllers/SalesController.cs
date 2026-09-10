using System.Security.Claims;
using DukaanOS.API.DTOs;
using DukaanOS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DukaanOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SalesController : ControllerBase
{
    private readonly ISaleService _saleService;

    public SalesController(ISaleService saleService)
    {
        _saleService = saleService;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateSale([FromBody] CreateSaleRequest request)
    {
        try
        {
            var cashierId = GetUserId();
            var storeId = GetStoreId();
            var sale = await _saleService.ProcessSaleAsync(request, cashierId, storeId);
            return Ok(sale);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Sale process karte waqt khata pesh aayi.", error = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetSaleById(Guid id)
    {
        var sale = await _saleService.GetSaleByIdAsync(id, GetStoreId());
        if (sale == null) return NotFound(new { message = "Sale invoice nahi mila." });
        return Ok(sale);
    }

    [HttpGet("recent")]
    [Authorize]
    public async Task<IActionResult> GetRecentSales([FromQuery] int limit = 50)
    {
        var sales = await _saleService.GetRecentSalesAsync(limit, GetStoreId());
        return Ok(sales);
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
