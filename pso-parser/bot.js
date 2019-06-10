"use strict";
const token = require("../config.json");
var request = require('request'),
    cheerio = require('cheerio'),
    Discord = require("discord.js"),
    eaw = require('eastasianwidth');
var bot = new Discord.Client();
var eventList = {};
var day;
var charlist = ['＃','＄','＆','＊','＠','！','？','＾'];
var randList = {};
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
		}else if(txt.match(/[0-9][0-9]:[0-9][0-9]/)){
            return "　　|";
        }else{
            let spec = charlist.pop();
            TooLong[txt] = spec;
            return spec.repeat(2)+'|';
        }

    }
}

// Also delete '(' ')'
function convertFullWidth(str){
    return str.replace(/[0-9() ]/g, function(m){
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
			' ': '　',
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

function parseHtml(msg, body){
	headlen = 0,
    res = "\n";
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
                console.log(rowshift);
                res += "　　|".repeat(rowshift.shift());
                let colspan = $(s).attr('colspan') || 1;
                res += buildTooLong($(s).text()).repeat(colspan);
                if(colspan > 1){
                    res += "　　|".repeat(rowshift.shift());
                }
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
    				console.log($(s).text().length);
    				if($(s).text().length == 4)
    					res +=  "　";
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

}

function updateEvent(msg){
    let url = "https://pso2m.swiki.jp/index.php?%E7%B7%8A%E6%80%A5%E6%8E%B2%E7%A4%BA%E6%9D%BF%2F%E4%BA%88%E5%AE%9A%E8%A1%A8",
		headlen = 0,
        res = "\n";
    request({uri: url, strictSSL: false}, function(err, resp, body){
        if(err){
            url = "https://pso2.swiki.jp/index.php?%E7%B7%8A%E6%80%A5%E6%8E%B2%E7%A4%BA%E6%9D%BF%2F%E4%BA%88%E5%AE%9A%E8%A1%A8";
            request({uri: url, strictSSL: false}, function(err, resp, body){
                if(err){
                    msg.reply("ERROR: "+err);
                } else {
                    parseHtml(msg, body);
                }
            });
        } else {
            parseHtml(msg, body);
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
            if(err){
                msg.reply("ERROR: "+err);
                return;
            }
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
    if (msg.content.startsWith("!addList")) {
        if (Object.keys(randList).length > 5) {
            msg.reply("Please subscribe 4.99 to unlock more list");
        } else {
            let tok = msg.content.split(/\s+/);
            console.log(tok);
            if (tok.length < 3) {
                msg.reply("!addList LIST_NAME LIST_ITEM(,LIST_ITEM,...)");
            } else {
                if(tok[1] in randList) {
                    randList[tok[1]] = randList[tok[1]].concat(tok.slice(2));
                    randList[tok[1]] = randList[tok[1]].filter((v, i, a) => a.indexOf(v) === i);
                } else {
                    randList[tok[1]] = tok.slice(2);
                }

                msg.reply(tok[1] + ": (" + randList[tok[1]].join(",") + ")");
            }
        }
    }
    if (msg.content.startsWith("!clearList")) {
        randList = {};
        msg.reply("Okay, clear");
    }
    if (msg.content.startsWith("!幫我選")) {
        let tok = msg.content.split(/\s+/);
        if(tok.length != 3 | !(tok[1] in randList)) {
            msg.reply("!幫我選 LIST_NAME COUNT");
        } else {
            let c = Math.min(parseInt(tok[2], 10), randList[tok[1]].length);
            console.log(c);
            let p = [];
            for(let s = 0; s < randList[tok[1]].length; s++) {
                p.push([Math.random(), randList[tok[1]][s]]);
            }
            p.sort(function(a, b){return a[0] < b[0]});
            let res = "";
            for(let s = 0; s < c; s++) {
                res += p[s][1] + " ";
            }
            msg.reply(res);
        }
    }
    if (msg.content.startsWith("!曬卡")) {
        const a = msg.mentions._guild.emojis.find(emoji => emoji.name === "chick");
        const aa = msg.mentions._guild.emojis.find(emoji => emoji.name === "chicken");
        let res = ``;
        for(let s = 0; s < 10; s++) {
            if(Math.random() > 0.03) {
                res += `${a}`;
            } else {
                res += `${aa}`;
            }
        }
        res += msg.content.substr(3);
        msg.reply(res);
    }
});


bot.login(token.token);
