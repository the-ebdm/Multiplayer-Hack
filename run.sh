#!/usr/bin/env bash
clear
if hash nodejs 2>/dev/null; then
    nodejs server.js
else
    node server.js
fi
