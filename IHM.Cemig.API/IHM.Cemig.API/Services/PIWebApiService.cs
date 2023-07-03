using CemigApi.Interfaces;
using CemigApi.Services.Common;
using IHM.Cemig.API.Domain.Context;
using IHM.Cemig.API.Domain.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;

namespace CemigApi.Services
{
    public class PIWebApiService : HttpClientService, IPIWebApiService
    {
        protected readonly Context _context;

        public PIWebApiService(IHttpClientFactory clientFactory, Context context) : base(clientFactory)
        {
            _context = context;
        }

        public ValueTask<dynamic> Get(string url, string auth)
        {
            //var date = DateTime.Now;
            //var dateStr = date.ToString();

            //var tarefa1 = new Tarefa
            //{
            //    Model = $"{"1"} - {dateStr}"
            //};
            //var tarefa2 = new Tarefa
            //{
            //    Model = $"{"2"} - {dateStr}"
            //};

            //var user = new User
            //{
            //    Name = $"{"Bruno"} - {dateStr}",
            //    Date = date,
            //    Tarefas = new List<Tarefa> { tarefa1, tarefa2 }
            //};

            //_context.Users.Add(user);

          

            //_context.SaveChanges();

            //var users = _context.Users.ToList();

            //var list = (from _user in _context.Users
            //  join tarefa in _context.Tarefa on _user.Id equals tarefa.IdUser into juncao
            //     from j in juncao.DefaultIfEmpty()

            //            select new
            // {
            //     idBoth = $"{_user.Id}-{(j == null ? "" : j.Id.ToString())}",
            //     person = _user.Name,
            //     tarefa = (j == null ? "" : j.Model)
            //            }).ToList();
                  

            return DoGet(url, auth);
        }

        private string getId(Tarefa task)
        {
            return task == null ? "" : task.Id.ToString();
        }

        public ValueTask<dynamic> Post(string url, string auth, string body)
        {
            return DoPost(url, auth, body);
        }
    }
}
