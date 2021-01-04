using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SpyCloudBackend.Model;
using TinyCsvParser;
using Newtonsoft.Json;
using MailKit.Net.Smtp;
using MimeKit;

namespace SpyCloudBackend.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Post([FromForm] FileModel file)
        {
            try
            {
                // Save file to "wwwroot" folder
                string path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", file.FileName);
                using (Stream stream = new FileStream(path, FileMode.Create))
                {
                    file.FormFile.CopyTo(stream);
                }

                // Parse CSV
                CsvParserOptions csvParserOptions = new CsvParserOptions(true, ',');
                CsvAccountInfoMapping csvMapper = new CsvAccountInfoMapping();
                CsvParser<AccountInfo> csvParser = new CsvParser<AccountInfo>(csvParserOptions, csvMapper);
                // CSV list
                var result = csvParser
                             .ReadFromFile(path, Encoding.UTF8)
                             .ToList();
                // correct match list
                List<object> list = new List<object>();
                // all result by email
                List<object> allList = new List<object>();

                // iterate csv list
                foreach (var details in result)
                {
                    //ret += details.Result.Email + ", " + details.Result.Password;
                    var email = details.Result.Email;
                    var password = details.Result.Password;

                    // set SpyCloud base url
                    var baseAddress = new Uri("https://api.spycloud.io/enterprise-v2/");
                    
                    // send request to SpyCloud
                    using (var httpClient = new HttpClient { BaseAddress = baseAddress })
                    {
                        httpClient.DefaultRequestHeaders.TryAddWithoutValidation("x-api-key", "CC3STu9arV4mVHonF6JJb9F2fAGIqGY37mo5qAQp");
                        //Get response from SpyCloud
                        using (var response = await httpClient.GetAsync("breach/data/emails/" + email))
                        {
                            // Response from SpyCloud
                            string responseData = await response.Content.ReadAsStringAsync();
                            // Convert from string to json data
                            dynamic dataList = JsonConvert.DeserializeObject<dynamic>(responseData);
                            // Parse results in response data
                            dynamic results = dataList.results;
                            if (results != null)
                            {
                                // iterate payload in results of response
                                foreach (var payload in results)
                                {
                                    var item = new
                                    {
                                        payload,
                                    };
                                    // Add each item(payload) to all result
                                    allList.Add(item);
                                    dynamic pwd = payload.password;
                                    // Add item which is matched 
                                    if (pwd == password)
                                    {
                                        AccountInfo accountInfo = new AccountInfo();
                                        accountInfo.Email = email;
                                        accountInfo.Password = password;
                                        list.Add(accountInfo);
                                        // Send email if the credential is correct
                                        this.SendEmail(email);
                                    }
                                }
                            }
                        }
                    }
                }
                // Make Result object
                var returnObject = new
                {
                    csvData = result,
                    apiResult = allList,
                    matchedResult = list
                };

                return Ok(returnObject);
            }
            catch(Exception e)
            {
                Console.WriteLine(e);
                return StatusCode(StatusCodes.Status500InternalServerError);
            }
        }
    
        public void SendEmail(string email)
        {
            var mailService =
            new
            {
                email = "kalebniven.ru@gmail.com",
                password = "r%d&L3GaW37g"
            };

            MimeMessage message = new MimeMessage();

            MailboxAddress from = new MailboxAddress("Admin", mailService.email);
            message.From.Add(from);

            MailboxAddress to = new MailboxAddress("User",  email);
            message.To.Add(to);

            message.Subject = "Confirm";

            BodyBuilder bodyBuilder = new BodyBuilder();
            bodyBuilder.HtmlBody = "<h1>Hello!</h1>";
            bodyBuilder.TextBody = "Your user credentials have been breached - Protection by SpyCloud";

            message.Body = bodyBuilder.ToMessageBody();

            SmtpClient client = new SmtpClient();
            client.Connect("smtp.gmail.com", 587, true);
            client.Authenticate(mailService.email, mailService.password);

            client.Send(message);
            client.Disconnect(true);
            client.Dispose();
        }
    }
}