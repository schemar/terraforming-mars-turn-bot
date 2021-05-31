#!/bin/bash

# Use this file as a simple wrapper to ensure that the bot keeps running in case
# the node process dies for some reason.

while :
do
    echo "Starting bot."
    node ./build/index.js

    echo "Restarting bot in 5 Seconds ..."
    sleep 5
done
