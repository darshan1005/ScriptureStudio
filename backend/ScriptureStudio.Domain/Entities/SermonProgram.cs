using System;
using System.Collections.Generic;

namespace ScriptureStudio.Domain.Entities;

public class SermonProgram
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ChurchOrgId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public List<SermonProgramItem> Items { get; set; } = new();
}

public class SermonProgramItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string ProgramId { get; set; } = string.Empty;
    public int Position { get; set; }
    public string ItemType { get; set; } = "SCRIPTURE";
    public string? Title { get; set; }
    public string? ReferenceJson { get; set; }
    public string? Notes { get; set; }
}

