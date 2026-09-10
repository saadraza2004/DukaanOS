using System.Security.Claims;
using DukaanOS.API.DTOs;
using DukaanOS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DukaanOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet("batches")]
    public async Task<IActionResult> GetBatches([FromQuery] int? productId)
    {
        var batches = await _inventoryService.GetBatchesAsync(productId, GetStoreId());
        return Ok(batches);
    }

    [HttpPost("batches")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> CreateBatch([FromBody] CreateBatchRequest request)
    {
        var userId = GetUserId();
        var storeId = GetStoreId();
        var batch = await _inventoryService.CreateBatchAsync(request, userId, storeId);
        return Ok(batch);
    }

    [HttpPost("adjustments")]
    [Authorize]
    public async Task<IActionResult> AdjustStock([FromBody] StockAdjustmentRequest request)
    {
        var userId = GetUserId();
        var success = await _inventoryService.AdjustStockAsync(request, userId);
        if (!success) return BadRequest(new { message = "Stock adjustment nakam rahi." });
        return Ok(new { message = "Stock adjustment kamyabi se record ho gayi." });
    }

    [HttpGet("movements")]
    public async Task<IActionResult> GetMovements([FromQuery] int? productId, [FromQuery] int limit = 100)
    {
        var movements = await _inventoryService.GetMovementsAsync(productId, limit, GetStoreId());
        return Ok(movements);
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
