# المرحلة 1: بناء التطبيق (Build Stage)
FROM node:20-alpine AS builder

WORKDIR /app

# نسخ ملفات الحزم فقط لتسريع التثبيت (Caching)
COPY package*.json ./
RUN npm install

# نسخ باقي الملفات وبناء المشروع
COPY . .
RUN npm run build

# المرحلة 2: التشغيل (Production Stage)
FROM node:20-alpine

WORKDIR /app

# نسخ الحزم الضرورية فقط والملفات المبنية
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# تشغيل التطبيق
EXPOSE 3000
CMD ["node", "dist/main"]
