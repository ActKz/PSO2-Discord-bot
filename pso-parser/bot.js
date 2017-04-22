const token = require("../config.json");
var request = require('request'),
    cheerio = require('cheerio'),
    Discord = require("discord.js"),
    eaw = require('eastasianwidth');
var bot = new Discord.Client();
var eventList = {};
var day;
var charlist = ['＃','＄','＆','＊','＠','！','？','＾'];
const helplist = `
    Command List:
    --------------------------
    !emerg -> Show whole weekend emergency
    !twit <PositiveInteger> -> Show number of tweets from @pso2_emg_hour (Number too big may not work), default is 2
    !re -> Reset the event list name
    !update -> Update event cache
    !help  -> Show available commands
    --------------------------
`
var TooLong = {};
function isFullWidth(c){ return c != undefined && eaw.eastAsianWidth(c) == 'W';}
function buildTooLong(txt){
    if (isFullWidth(txt[0]) && isFullWidth(txt[1])){
        return txt.slice(0,2)+'|';
    }else{
        if(txt in TooLong){
            return TooLong[txt].repeat(2)+'|';
        }else{
            let spec = charlist.pop();
            TooLong[txt] = spec;
            return spec.repeat(2)+'|';
        }

    }
}

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

function getCurrJPDate(){
    let JPDate = new Date();
    JPDate.setHours(JPDate.getHours()+9);
    return JPDate.getDate();
}

function updateEvent(msg){
    let url = "http://pso2.swiki.jp/index.php?%E7%B7%8A%E6%80%A5%E6%8E%B2%E7%A4%BA%E6%9D%BF%2F%E4%BA%88%E5%AE%9A%E8%A1%A8",
		headlen = 0,
        res = "\n";
    request(url, function(err, resp, body){
        $ = cheerio.load(body);
        $('.style_table').eq(1).children('thead').children('tr').children('td').each(function(i, s){
            let len = $(s).text().length;
            if($(s).text().length <= 3){
                res += '　'.repeat(3-len) + convertFullWidth($(s).text().slice(0,-1)) + "|";
				headlen += 1;
            }
        });
        res = res.slice(0,-1)+"\n";
        let rowspan = 0, rowshift = [0];
        $('.style_table').eq(1).children('tbody').children('tr').each(function(i, p){
            if(rowshift[rowshift.length-1] != 0){
                res += "　　　|";
                $(p).children('td').each(function(j, s){
                    res += "　　|".repeat(rowshift.shift());
                    res += buildTooLong($(s).text());
                });
                res += "　　|".repeat(rowshift.shift());
                rowshift = [0];
            }else{
            $(p).children('td').each(function(j, s){
                if(j != 0){
                    let text = ($(s).text() == "")?"　　|":
                        buildTooLong($(s).text()),
                        colspan = $(s).attr('colspan') || 1;
                    if($(s).attr('rowspan') == rowspan){
                        rowshift[rowshift.length-1] += parseInt(colspan);
                    } else {
                        rowshift.push(0);
                    }
                    res += text.repeat(colspan);
                } else{
                    rowspan = $(s).attr('rowspan');
                    res += convertFullWidth($(s).text()) + "|";
                }
				if(rowshift[0] == headlen){
					rowshift[0] = 0;
				}
            });
            }

            res = res.slice(0,-4) + "\n"; // forget why 4!
        });
        for (var key in TooLong){
            res += TooLong[key]+": "+key+"\n";
        }
        if( eventList.e == undefined || eventList.e != res){
            eventList.e = res;
            msg.reply(res);
        }else{
            msg.reply(eventList.e);
        }

      });
}

bot.on("message", msg => {
    if (msg.content == "!help") {
        msg.reply(helplist);
    }
    if (msg.content == "!re") {
        charlist = ['＃','＄','＆','＊','＠','！','？','＾'];
        TooLong = {};
        msg.reply("List reset");
    }
    if (msg.content.startsWith("!twit")){
        let url = "https://twitter.com/pso2_emg_hour?lang=zh-tw",
            div = "-------------------\n",
            res = "\nLatest\n" + div,
            tweets = 2,
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
        let JPDate = getCurrJPDate();
        if(eventList == undefined || JPDate != eventList.d){
            eventList.d = JPDate;
        }
        updateEvent(msg);
    }
    if (msg.content == "!update") {
        eventList.d = getCurrJPDate();
        updateEvent(msg);
    }
});


bot.login(token.token);
