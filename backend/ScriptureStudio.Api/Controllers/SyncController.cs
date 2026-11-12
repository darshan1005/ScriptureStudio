using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

namespace ScriptureStudio.Api.Controllers;

public record SyncProgramItemDto(string Id, int Position, string ItemType, string Title, string? ReferenceJson);
public record SyncProgramDto(string Id, string Name, DateTime UpdatedAt, List<SyncProgramItemDto> Items);
public record SyncRequest(string ChurchOrgId, List<SyncProgramDto> Programs);
public record SyncResponse(bool Success, int SyncedCount, DateTime ServerTimestamp);

[ApiController]
[Route("api/v1/[controller]")]
public class SyncController : ControllerBase
{
    private static readonly Dictionary<string, List<SyncProgramDto>> OrgStorage = new();

    [HttpPost("programs")]
    public ActionResult<SyncResponse> SyncPrograms([FromBody] SyncRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ChurchOrgId))
        {
            return BadRequest("ChurchOrgId is required.");
        }

        OrgStorage[request.ChurchOrgId] = request.Programs;

        return Ok(new SyncResponse(
            Success: true,
            SyncedCount: request.Programs.Count,
            ServerTimestamp: DateTime.UtcNow
        ));
    }

    [HttpGet("programs/{orgId}")]
    public ActionResult<List<SyncProgramDto>> GetPrograms(string orgId)
    {
        if (OrgStorage.TryGetValue(orgId, out var programs))
        {
            return Ok(programs);
        }

        return Ok(new List<SyncProgramDto>());
    }
}

