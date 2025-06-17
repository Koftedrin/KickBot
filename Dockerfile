# Используем официальный образ Node.js 18
FROM node:18-slim

# Устанавливаем Chrome и все его зависимости
RUN apt-get update && apt-get install -y \
    chromium \
    libgbm-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgtk-3-0 \
    --no-install-recommends

# Устанавливаем переменную окружения, чтобы puppeteer нашел Chrome
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Создаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей и устанавливаем их
COPY package*.json ./
RUN npm install

# Копируем остальной код проекта
COPY . .

# Запускаем бота
CMD ["npm", "start"]
