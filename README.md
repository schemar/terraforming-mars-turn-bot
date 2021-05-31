# Terraforming Mars Turn Bot for Telegram

This bot informs a user when it is their turn in a game of https://github.com/bafolts/terraforming-mars.

It doesn't work perfectly for drafting or quick turn succession.

## Installation

1. Create a bot with the [BotFather](https://core.telegram.org/bots#6-botfather)
2. Note the token that you will receive
3. Clone this repo and execute the following steps

```shell
export TMTB_TOKEN="<token from the BotFather>"
yarn
yarn build
yarn start
```

Instead of `yarn start` you can use the simple `endless.sh` wrapper:
```shell
./endless.sh
```

## Usage

Search for the bot you created on Telegram. Send `/start` to get instructions.

The bot will notify you when it is your turn in a game of the open source version of Terraforming Mars.

To get informed, send a message to the bot that looks like this:
`/track <link-to-game>`

To stop getting messages, send a message like this: `/stop <link-to-game>`

A link to a game looks like this: `https://tm.example.com/player?id=abc123`

So an example would be: `/track https://tm.example.com/player?id=abc123"`
