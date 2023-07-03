using IHM.Cemig.API.Domain.Entity;
using IHM.Cemig.API.Mapping;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace IHM.Cemig.API.Domain.Context
{
    public class Context : DbContext
    {
        public Context(DbContextOptions<Context> option) : base(option) { }


        public DbSet<User> Users{ get; set; }
        public DbSet<Tarefa> Tarefa { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.HasAnnotation("ProductVersion", "2.2.4-common-10062");

            modelBuilder.ApplyConfiguration(new UserMap());
            modelBuilder.ApplyConfiguration(new TarefaMap());
            base.OnModelCreating(modelBuilder);
        }


    }
}
