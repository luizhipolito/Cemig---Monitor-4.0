using IHM.Cemig.API.Dto;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace CemigApi.Interfaces
{
    public interface IChallengeService
    {
        Task<List<UserChallenge>> GetUsers();
    }
}
