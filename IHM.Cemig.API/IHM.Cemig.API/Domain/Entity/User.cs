using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IHM.Cemig.API.Domain.Entity
{
    public class User
    {
        public User()
        {
            Tarefas = new List<Tarefa>();
        }

        public int Id { get; set; }
        public string Name { get; set; }
        public DateTime Date { get; set; }

        public virtual List<Tarefa> Tarefas {get; set;}
    }
}
