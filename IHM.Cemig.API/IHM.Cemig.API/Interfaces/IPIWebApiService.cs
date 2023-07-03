using System.Net.Http;
using System.Threading.Tasks;

namespace CemigApi.Interfaces
{
    public interface IPIWebApiService
    {
        ValueTask<dynamic> Get(string url, string auth);
        ValueTask<dynamic> Post(string url, string auth, string body);
    }
}
