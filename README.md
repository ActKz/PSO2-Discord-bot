# PSO2 Discord bot

## Screenshot

![!emerg](/screenshot/screenshot_emerg.png "!emerg")
![!twit](/screenshot/screenshot_twit.png "!twit")

## Commands

- !emerg -> Show whole weekend emergency
- !twit <PositiveInteger> -> Show number of tweets from @pso2_emg_hour (Number too big may not work), default is 2
- !help  -> Show available commands

## Features

This bot could only parse the emergency events table on [PSO2 wiki](http://pso2.swiki.jp/) now.

## Dependency

- npm

## Setup - Create your own bot

### STEP1 - Build your server

Clone this project and install packages
```
npm install
```

Create a file named *config.json* and paste this on
```
{
  "token": "YOUR_APP_TOKEN_HERE"
}
```

Run server
```
node pso-parser/bot.js
```

### STEP2 - Add bot to server

- Goto [Discord Developer Console](https://discordapp.com/developers/).
- Create your new app.
- Replace the *client ID* in url with your own APP's *client ID* and goto https://discordapp.com/oauth2/authorize?&client_id=YOUR_CLIENT_ID_HERE&scope=bot&permissions=0
- Add the bot to your server.
