using CemigApi.Interfaces;
using CemigApi.Services.Common;
using IHM.Cemig.API.Dto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace IHM.Cemig.API.Services
{
    public class ChallengeService : HttpClientService, IChallengeService
    {

        public ChallengeService(IHttpClientFactory clientFactory) : base(clientFactory)
        {
        }

        public Task<List<UserChallenge>> GetUsers()
        {
            return DoGetChallenge<List<UserChallenge>>();
        }

    }
}
