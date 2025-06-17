#!/usr/bin/env bash
# exit on error
set -o errexit

# Устанавливаем зависимости Puppeteer (Chrome)
apt-get update
apt-get install -y libgbm-dev libnss3 libxss1 libasound2 libatk-bridge2.0-0 libcups2 libgtk-3-0

# Устанавливаем зависимости нашего проекта
npm install
