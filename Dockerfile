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

# Устанавливаем переменную, чтобы puppeteer нашел Chrome
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Создаем обычного пользователя, чтобы не работать под root
RUN useradd -m nodeuser

# Создаем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей и устанавливаем их
COPY package*.json ./
RUN npm install

# Копируем остальной код проекта
COPY . .

# Отдаем папку новому пользователю
RUN chown -R nodeuser:nodeuser /app

# Переключаемся на нового пользователя
USER nodeuser

# Запускаем бота
CMD ["npm", "start"]
