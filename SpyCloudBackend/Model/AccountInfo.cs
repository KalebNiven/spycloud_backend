using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SpyCloudBackend.Model
{
    // Object model for matched credentials
    public class AccountInfo
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}
