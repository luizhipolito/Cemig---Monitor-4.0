using System;
using System.Net;

namespace IHM.Cemig.API.Services.Common
{
    public class PIWebApiException : Exception
    {
        public int Code { get; set; }
        public string CustomMessage { get; set; }
        public PIWebApiException(int code, string message)
        {
            this.Code = code;
            this.CustomMessage = message;
        }
    }
}
