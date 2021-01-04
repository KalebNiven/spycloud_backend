using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TinyCsvParser.Mapping;

namespace SpyCloudBackend.Model
{
    // Model for CSV Result parsed
    public class CsvAccountInfoMapping : CsvMapping<AccountInfo>
    {
        public CsvAccountInfoMapping()
        {
            MapProperty(0, x => x.Email);
            MapProperty(1, x => x.Password);
        }
    }
}
