# 🏥 Pharmacy Hub - نظام إدارة المخزون المركزي

نظام **NestJS** يعمل كمركز مركزي يجمع مخزون عدة صيدليات في مكان واحد، ويستقبل التحديثات تلقائياً عبر Webhooks.

---

## 📐 هيكل النظام

```
صيدلية 1  ──┐
صيدلية 2  ──┤──► POST /webhooks/:slug ──► معالجة ──► قاعدة بيانات مركزية
صيدلية 3  ──┘
                                                              │
                                                              ▼
                                               GET /inventory ──► نتائج موحّدة
```

### منطق توحيد الأدوية (المشكلة الأصعب):

```
الباركود موجود؟ ──YES──► تطابق مباشر (الأقوى)
      │NO
      ▼
الاسم موجود؟ ──YES──► تطابق بالاسم (بعد تنظيفه)
      │NO
      ▼
الاسم التجاري؟ ──YES──► تطابق بالاسم التجاري
      │NO
      ▼
إنشاء دواء جديد في القاعدة المركزية
```

---

## 🚀 التثبيت والتشغيل

```bash
# 1. تثبيت الحزم
npm install

# 2. إعداد قاعدة البيانات
cp .env.example .env
# عدّل DATABASE_URL في .env

# 3. إنشاء جداول قاعدة البيانات
npx prisma migrate dev --name init

# 4. تشغيل النظام
npm run start:dev
```

التوثيق التفاعلي (Swagger): **http://localhost:3000/api/docs**

---

## 📋 خطوات الإعداد

### 1. تسجيل صيدلية جديدة

```bash
POST /pharmacies
Content-Type: application/json

{
  "name": "صيدلية النيل - القاهرة",
  "slug": "pharmacy-cairo-1"
}
```

**الاستجابة:**
```json
{
  "id": 1,
  "name": "صيدلية النيل - القاهرة",
  "slug": "pharmacy-cairo-1",
  "api_key": "abc123...",          ← احتفظ بهذا
  "webhook_secret": "xyz789...",   ← لتوقيع الطلبات
  "webhook_url": "/webhooks/pharmacy-cairo-1"
}
```

### 2. إعداد نظام الصيدلية ليرسل الأحداث

أضف في نظام كل صيدلية webhook يرسل عند أي حدث:

```
URL: https://your-hub.com/webhooks/pharmacy-cairo-1
Method: POST
Headers:
  X-Pharmacy-Api-Key: abc123...
  X-Webhook-Signature: <HMAC-SHA256 of payload>  (اختياري لكن مستحسن)
```

---

## 📨 أشكال الـ Payload (أمثلة لكل حدث)

### عند البيع (sale)
```json
{
  "event_type": "sale",
  "timestamp": "2024-01-15T10:30:00Z",
  "reference_id": 1234,
  "medicines": [
    {
      "barcode": "6223001234567",
      "name": "باراسيتامول 500",
      "trad_name": "بنادول",
      "local_medicine_id": 42,
      "quantity_affected": 3,
      "price": 15.50,
      "unit": "علبة"
    },
    {
      "barcode": null,
      "name": "أموكسيسيلين كبسول",
      "local_medicine_id": 17,
      "quantity_affected": 1,
      "unit": "شريط"
    }
  ]
}
```

### عند إضافة مخزون جديد (stock_added)
```json
{
  "event_type": "stock_added",
  "timestamp": "2024-01-15T09:00:00Z",
  "medicines": [
    {
      "barcode": "6223001234567",
      "name": "باراسيتامول 500mg",
      "local_medicine_id": 42,
      "quantity_affected": 100,
      "price": 15.50,
      "expiry_date": "2026-06-01",
      "unit": "علبة",
      "tablets_per_box": 20
    }
  ]
}
```

### عند حذف/إرجاع مخزون (stock_removed / return)
```json
{
  "event_type": "stock_removed",
  "timestamp": "2024-01-15T11:00:00Z",
  "medicines": [
    {
      "local_medicine_id": 42,
      "name": "باراسيتامول",
      "quantity_affected": 10
    }
  ]
}
```

### تحديث مباشر للكمية (stock_update)
```json
{
  "event_type": "stock_update",
  "timestamp": "2024-01-15T08:00:00Z",
  "medicines": [
    {
      "local_medicine_id": 42,
      "name": "باراسيتامول",
      "quantity_affected": 0,
      "current_quantity": 85
    }
  ]
}
```
> ⚠️ في `stock_update`: يُستخدم `current_quantity` كالكمية الفعلية الجديدة (يتجاهل `quantity_affected`)

### نقص مخزون (shortage)
```json
{
  "event_type": "shortage",
  "timestamp": "2024-01-15T12:00:00Z",
  "medicines": [
    {
      "local_medicine_id": 99,
      "name": "إنسولين نوفومكس",
      "quantity_affected": 0
    }
  ]
}
```
> ℹ️ الـ shortage لا يغيّر الكمية، يُسجَّل فقط للمتابعة.

---

## 🔍 API الاستعراض

```bash
# ملخص كل الصيدليات
GET /inventory/summary

# كل المخزون مجمّعاً (مرتّب بالدواء)
GET /inventory?page=1&limit=50

# فلترة
GET /inventory?name=باراسيتامول
GET /inventory?barcode=622300
GET /inventory?category=مسكنات

# مخزون صيدلية محددة
GET /inventory/pharmacy/pharmacy-cairo-1
GET /inventory/pharmacy/pharmacy-cairo-1?low_stock=5

# البحث عبر كل الصيدليات
GET /inventory/search?q=بنادول

# الأدوية التي توشك على النفاد
GET /inventory/low-stock?threshold=10
GET /inventory/low-stock?threshold=5&pharmacy=pharmacy-cairo-1
```

---

## 🔐 التوثيق بـ HMAC Signature

في نظام الصيدلية، احسب الـ signature هكذا:

```javascript
// Node.js مثال
const crypto = require('crypto');

const payload = JSON.stringify(webhookData);
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

// أرسله في الـ header
headers['X-Webhook-Signature'] = signature;
```

```python
# Python مثال
import hmac, hashlib, json

payload = json.dumps(webhook_data, separators=(',', ':'))
signature = hmac.new(
    WEBHOOK_SECRET.encode(),
    payload.encode(),
    hashlib.sha256
).hexdigest()
```

---

## 🗄️ هيكل قاعدة البيانات المركزية

```
pharmacies          ← الصيدليات المسجلة
master_medicines    ← الأدوية الموحدة (بالباركود)
medicine_aliases    ← أسماء الأدوية في كل صيدلية
pharmacy_stocks     ← كمية كل دواء في كل صيدلية
webhook_logs        ← سجل كل الأحداث الواردة
```

---

## ⚡ للإنتاج: استخدام Queue

استبدل `setImmediate` في `webhook.controller.ts` بـ BullMQ:

```bash
npm install @nestjs/bull bull ioredis
```

```typescript
// في الـ controller بدلاً من setImmediate:
await this.webhookQueue.add('process', { pharmacyId, payload, logId });

// في الـ processor:
@Process('process')
async handle(job: Job) {
  await this.processor.processWebhook(job.data.pharmacyId, job.data.payload, job.data.logId);
}
```
