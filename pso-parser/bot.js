const config = require('../config.json');
var request = require('request')
  , cheerio = require('cheerio')
  , jquery = require('jquery');
var Discord = require("discord.js");
var bot = new Discord.Client();
var url = "http://pso2.swiki.jp/";
const helplist = `
    !emerg -> Show whole weekend emergency
    !help  -> Show available commands
`

bot.on("message", msg => {
  if (msg.content == "!help") {
      msg.reply(helplist);
  }
  if (msg.content == "!emerg") {
      var res = "\n";
      request(url, function(err, resp, body){
        $ = cheerio.load(body);
        $('.style_table').eq(4).children('thead').children('tr').children('td').each(function(i, s){
            if($(s).text() == ""){
                res += "XX(X)|";
            }else if($(s).text() != "終日ブーストイベント00:00～23:59"){
                res += $(s).text().replace(/[0-9]/g, function(m){
                    return {
                        '0': '０',
                        '1': '１',
                        '2': '２',
                        '3': '３',
                        '4': '４',
                        '5': '５',
                        '6': '６',
                        '7': '７',
                        '8': '８',
                        '9': '９',
                    }[m];
                });
                if(i<3){
                    res += '　|';
                }else{
                    res += '|';
                }
            }else {
                res = res.slice(0,-1);
            }
        });
        res += "\n";
        $('.style_table').eq(4).children('tbody').children('tr').each(function(i, p){
            $(p).children('td').each(function(j, s){
              if($(s).text() == ""){
                  res += "　　　|";
              } else if(j != 0){
                  res += $(s).text()+"  |";
              } else{
                  res += $(s).text()+"|";
              }
            });
            res = res.slice(0,-4);
            res += "\n";
        });
        console.log(res);
        msg.reply(res);
    });
  }
});

bot.login(config.token);
