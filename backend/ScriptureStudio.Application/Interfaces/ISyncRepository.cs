using System.Collections.Generic;
using System.Threading.Tasks;
using ScriptureStudio.Domain.Entities;

namespace ScriptureStudio.Application.Interfaces;

public interface ISyncRepository
{
    Task<List<SermonProgram>> GetProgramsByOrgIdAsync(string orgId);
    Task SaveProgramsAsync(string orgId, List<SermonProgram> programs);
}

