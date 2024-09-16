using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text;
using System.Net.Http.Headers;
using System.Text.Json;
using IHM.Cemig.API.Services.Common;
using System.Net;

namespace CemigApi.Services.Common
{
    public class HttpClientService
    {
        private readonly IHttpClientFactory _clientFactory;
        /// <summary>
        /// Constructor
        /// </summary>
        public HttpClientService(IHttpClientFactory clientFactory)
        {
            _clientFactory = clientFactory;
        }


        public async Task<T> DoGetChallenge<T>()
        {

            var request = new HttpRequestMessage(HttpMethod.Get, "https://gorest.co.in/public/v2/users");

            var client = _clientFactory.CreateClient();
            var response = await client.SendAsync(request);
            var responseStream = await response.Content.ReadAsStreamAsync();

            return await JsonSerializer.DeserializeAsync
                        <T>(responseStream);

        }



        /// <summary>
        /// Http Get Request
        /// </summary>
        public async ValueTask<dynamic> DoGet(string url, string auth)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, url);
                auth = auth.Trim();
                var headers = auth.Split(" ");

                request.Headers.Authorization =
                    new AuthenticationHeaderValue(headers[0], headers[1]);

                var client = _clientFactory.CreateClient("HttpClientWithSSLUntrusted");

                var response = await client.SendAsync(request);
                var responseStream = await response.Content.ReadAsStreamAsync();

                if (response.IsSuccessStatusCode)
                {
                    return JsonSerializer.DeserializeAsync<dynamic>(responseStream).Result;
                }
                else
                {
                    throw new PIWebApiException((int)response.StatusCode, response.Content.ReadAsStringAsync().Result);
                }

            }
            catch (PIWebApiException ex)
            {
                throw ex;
            }
            catch (Exception ex)
            {
                throw new PIWebApiException((int)HttpStatusCode.InternalServerError, ex.Message);
            }
        }
        public async ValueTask<dynamic> DoPost(string url, string auth, string body)
        {
            try
            {
                auth = auth.Trim();

                var client = _clientFactory.CreateClient("HttpClientWithSSLUntrusted");
                client.DefaultRequestHeaders.Add("Authorization", auth);

                var content = new StringContent(body, Encoding.UTF8, "application/json");

                var response = await client.PostAsync(url, content);
                var responseStream = await response.Content.ReadAsStreamAsync();

                if (response.IsSuccessStatusCode)
                {
                    return JsonSerializer.DeserializeAsync<dynamic>(responseStream).Result;
                }
                else
                {
                    throw new PIWebApiException((int)response.StatusCode, response.Content.ReadAsStringAsync().Result);
                }
            }
            catch (PIWebApiException ex)
            {
                throw ex;
            }
            catch (Exception ex)
            {
                throw new PIWebApiException((int)HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        private string SetUrlParams(string url, Dictionary<string, string> parameters)
        {
            if (parameters != null)
            {
                var parametersList = new List<string>();
                foreach (var p in parameters)
                {
                    parametersList.Add($"{p.Key}={p.Value}");
                }

                url = $"{url}?{String.Join("&", parametersList)}";
            }

            return url;
        }
    }
}
