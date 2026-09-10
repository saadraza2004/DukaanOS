using DukaanOS.API.DTOs;
using DukaanOS.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DukaanOS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "OWNER")]
public class AiController : ControllerBase
{
    private readonly IAiAssistantService _aiService;

    public AiController(IAiAssistantService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] AiChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Message khali nahi ho sakta." });
        }

        var response = await _aiService.AskAssistantAsync(request);
        return Ok(response);
    }
}
