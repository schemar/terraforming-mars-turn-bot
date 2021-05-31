# Terraforming Mars Turn Bot for Telegram

This bot informs a user when it is their turn in a game of https://github.com/bafolts/terraforming-mars.

It doesn't work perfectly for drafting or quick turn succession.

## Installation

1. Create a bot with the [BotFather](https://core.telegram.org/bots#6-botfather)
2. Note the token that you will receive
3. Note the list of allowed Terraforming Mars game servers, that this bot should interact with.
4. Clone this repo and execute the following steps

```shell
export TMTB_TOKEN="<token from the BotFather>"
export TMTB_SERVERS="<one or more allowed servers>"
yarn
yarn build
yarn start
```

Instead of `yarn start` you can use the simple `endless.sh` wrapper:
```shell
./endless.sh
```

The bot uses the following rate limit when querying the server for updates:
* Wait until all games were checked before starting another round of checks
* If checking all games took less than 60 seconds, wait until 60 seconds have passed since starting the previous check
* When sending requests to the game server(s):
    * Max two running requests in parallel
    * Wait 10 milliseconds after each request

### List of servers
The bot will only track games for a set list of game servers that you define.
For example, if your game server runs at https://tm.example.com and a game link
was https://tm.example.com/player?id=... then you would run:

```shell
export TMTB_SERVERS="https://tm.example.com"
```

Without a trailing slash and without a game link.

If you have more servers and you want to allow them with your bot, separate them by comma:

```shell
export TMTB_SERVERS="https://tm.example.com,https://terraformer.test.uk"
```

## Usage

Search for the bot you created on Telegram. Send `/help` to get instructions.

The bot will notify you when it is your turn in a game of the open source version of Terraforming Mars.

Unfortunately, the bot is currently not able to inform you about updates during a research or drafting phase.

A link to a game for the `/start` and `/stop` commands looks like this: `https://tm.example.com/player?id=abc123`
