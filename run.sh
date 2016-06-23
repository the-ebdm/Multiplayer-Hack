#!/usr/bin/env bash
clear
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if hash nodejs 2>/dev/null; then
    nodejs $DIR/server.js
else
    node $DIR/server.js
fi
