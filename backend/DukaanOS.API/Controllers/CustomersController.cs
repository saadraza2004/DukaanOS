using System.Security.Claims;
using DukaanOS.API.DTOs;
using DukaanOS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DukaanOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;

    public CustomersController(ICustomerService customerService)
    {
        _customerService = customerService;
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetCustomers([FromQuery] string? search)
    {
        var customers = await _customerService.GetCustomersAsync(search, GetStoreId());
        return Ok(customers);
    }

    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> GetCustomerById(int id)
    {
        var customer = await _customerService.GetCustomerByIdAsync(id, GetStoreId());
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpGet("top-debtors")]
    [Authorize]
    public async Task<IActionResult> GetTopDebtors([FromQuery] int limit = 10)
    {
        var debtors = await _customerService.GetTopDebtorsAsync(limit, GetStoreId());
        return Ok(debtors);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        var customer = await _customerService.CreateCustomerAsync(request, GetStoreId());
        return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, customer);
    }

    [HttpGet("{id:int}/ledger")]
    [Authorize]
    public async Task<IActionResult> GetCustomerLedger(int id)
    {
        var ledger = await _customerService.GetCustomerLedgerAsync(id);
        return Ok(ledger);
    }

    [HttpPost("{id:int}/payments")]
    [Authorize]
    public async Task<IActionResult> RecordPayment(int id, [FromBody] CustomerPaymentRequest request)
    {
        try
        {
            var userId = GetUserId();
            var customer = await _customerService.RecordPaymentAsync(id, request, userId);
            return Ok(customer);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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
