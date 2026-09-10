using System.Security.Claims;
using DukaanOS.API.DTOs;
using DukaanOS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DukaanOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string? search, [FromQuery] int? categoryId, [FromQuery] bool lowStockOnly = false)
    {
        var products = await _productService.GetProductsAsync(search, categoryId, lowStockOnly, GetStoreId());
        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetProductById(int id)
    {
        var product = await _productService.GetProductByIdAsync(id, GetStoreId());
        if (product == null) return NotFound(new { message = "Product nahi mila." });
        return Ok(product);
    }

    [HttpPost]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        var userId = GetUserId();
        var storeId = GetStoreId();
        var product = await _productService.CreateProductAsync(request, userId, storeId);
        return CreatedAtAction(nameof(GetProductById), new { id = product.Id }, product);
    }

    [HttpPut("{id:int}/price")]
    [Authorize(Roles = "OWNER")]
    public async Task<IActionResult> UpdatePrice(int id, [FromBody] UpdateProductPriceRequest request)
    {
        var userId = GetUserId();
        var updated = await _productService.UpdateSellingPriceAsync(id, request.NewPrice, userId, GetStoreId());
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpGet("{id:int}/price-history")]
    public async Task<IActionResult> GetPriceHistory(int id)
    {
        var history = await _productService.GetPriceHistoryAsync(id);
        return Ok(history);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _productService.GetCategoriesAsync(GetStoreId());
        return Ok(categories);
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
