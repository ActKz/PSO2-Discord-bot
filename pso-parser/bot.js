const config = require('../config.json');
var request = require('request'),
    cheerio = require('cheerio'),
    Discord = require("discord.js");
var bot = new Discord.Client();

const helplist = `
    Command List:
    --------------------------
    !emerg -> Show whole weekend emergency
    !twit <PositiveInteger> -> Show number of tweets from @pso2_emg_hour (Number too big may not work), default is 3
    !help  -> Show available commands
    --------------------------
    Notice:'＊' means special events or server maintainence.
`

// Also delete '(' ')'
function convertFullWidth(str){
    return str.replace(/[0-9()]/g, function(m){
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
            '(': '',
            ')': ''
        }[m];
    });
}

bot.on("message", msg => {
    if (msg.content == "!help") {
        msg.reply(helplist);
    }
    if (msg.content.startsWith("!twit")){
        let url = "https://twitter.com/pso2_emg_hour?lang=zh-tw",
            div = "-------------------\n",
            res = "\nLatest\n" + div,
            tweets = 3,
            argv = msg.content.split(" ");
        if(argv.length > 1 && parseInt(argv[1])!= NaN && argv[1] > 0){
            tweets = argv[1];
        }
        request(url, function(err, resp, body){
            $ = cheerio.load(body);
            $('.TweetTextSize').each(function(i, s){
                if(i > 0 && i <= tweets){
                  console.log($(s).text());
                  res += $(s).text()+"\n"+div;
                }
            });
            msg.reply(res);
        });
    }
    if (msg.content == "!emerg") {
        let url = "http://pso2.swiki.jp/",
            res = "\n";
        request(url, function(err, resp, body){
            $ = cheerio.load(body);
            $('.style_table').eq(4).children('thead').children('tr').children('td').each(function(i, s){
                let len = $(s).text().length;
                if($(s).text().length <= 3){
                    res += '　'.repeat(3-len) + convertFullWidth($(s).text().slice(0,-1)) + "|";
                }
            });
            res = res.slice(0,-1)+"\n";
            $('.style_table').eq(4).children('tbody').children('tr').each(function(i, p){
                $(p).children('td').each(function(j, s){
                    if($(s).text() == ""){
                        res += "　　|";
                    } else if(j != 0){
                        let text = ($(s).text().length<=2) ? $(s).text()+"|" : "＊＊|",
                            colspan = $(s).attr('colspan') || 1;
                        res += text.repeat(colspan);
                    } else{
                        res += convertFullWidth($(s).text()) + "|";
                    }
                });
                res = res.slice(0,-4) + "\n"; // forget why 4!
            });
            console.log(res);
            msg.reply(res);
      });
    }
});

bot.login(config.token);
