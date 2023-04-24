using CemigApi.Interfaces;
using IHM.Cemig.API.Services.Common;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CemigApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PIWebApiController : ControllerBase
    {
        private readonly IPIWebApiService _pIWebApiService;

        public PIWebApiController(IPIWebApiService pIWebApiService)
        {
            _pIWebApiService = pIWebApiService;
        }

        [HttpGet]
        [Route("GetTest")]
        public string GetTest()
        {
            return new DateTime().ToString();
        }

        [HttpGet]
        [Route("GetIhmTeste")]
        public ValueTask<dynamic> GetIhmTest()
        {
            return _pIWebApiService.Get("https://srvbhz24/piwebapi", "Basic YnJ1bm8ubWFpYTpTZW5oYS1paG1AMjAyNw==");
        }

        [HttpGet]
        [Route("GetCemigTeste")]
        public ValueTask<dynamic> GetCemigTest()
        {
            return _pIWebApiService.Get("https://pwnpo-bhepiapp1/piwebapi", "Basic ZTI1NjA2MTpDb21wdXRhZG9yLjkwMA==");
        }

        [HttpGet]
        public async Task<ActionResult> Get([FromQuery] string urlParam)
        {
            var auth = Request.Headers.Where(h => h.Key.Equals("Authorization")).FirstOrDefault();
            try
            {
                var data = await _pIWebApiService.Get(urlParam, auth.Value.ToString());
                return Ok(data);
            } catch(PIWebApiException ex)
            {
                return StatusCode(ex.Code, new { message = ex.CustomMessage });
            }
        }

        [HttpPost]
        public async Task<ActionResult> Post([FromQuery] string urlParam, object body)
        {
            var auth = Request.Headers.Where(h => h.Key.Equals("Authorization")).FirstOrDefault();
            try
            {
                var data = await _pIWebApiService.Post(urlParam, auth.Value.ToString(), body.ToString());
                return Ok(data);
            }
            catch (PIWebApiException ex)
            {
                return StatusCode(ex.Code, new { message = ex.CustomMessage });
            }
        }
    }
}