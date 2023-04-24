using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IHM.Cemig.API.Domain.Entity
{
    public class Tarefa
    {
        public int Id { get; set; }
        public string Model { get; set; }
        public int IdUser { get; set; }
        public virtual User User { get; set; }
    }
}
