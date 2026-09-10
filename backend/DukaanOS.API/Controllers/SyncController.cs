using System.Security.Claims;
using DukaanOS.API.DTOs;
using DukaanOS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DukaanOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SyncController : ControllerBase
{
    private readonly ISaleService _saleService;

    public SyncController(ISaleService saleService)
    {
        _saleService = saleService;
    }

    [HttpPost("sales-batch")]
    [Authorize]
    public async Task<IActionResult> SyncSalesBatch([FromBody] SyncSalesBatchRequest request)
    {
        var cashierId = GetUserId();
        var storeId = GetStoreId();
        var processedIds = new List<Guid>();
        int syncedCount = 0;
        int duplicateCount = 0;

        foreach (var saleReq in request.Sales)
        {
            if (saleReq.ClientSaleId.HasValue)
            {
                var existing = await _saleService.GetSaleByIdAsync(saleReq.ClientSaleId.Value, storeId);
                if (existing != null)
                {
                    duplicateCount++;
                    processedIds.Add(existing.Id);
                    continue;
                }
            }

            try
            {
                var result = await _saleService.ProcessSaleAsync(saleReq, cashierId, storeId);
                syncedCount++;
                processedIds.Add(result.Id);
            }
            catch (Exception)
            {
                // Continue with other sales in batch so one bad record does not block others
            }
        }

        return Ok(new SyncBatchResponse(syncedCount, duplicateCount, processedIds));
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
