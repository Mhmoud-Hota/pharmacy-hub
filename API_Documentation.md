# توثيق واجهة برمجة تطبيقات Pharmacy Hub

## مقدمة
يقدم هذا التوثيق الشامل تفاصيل حول واجهة برمجة تطبيقات (API) نظام إدارة المخزون المركزي للصيدليات (Pharmacy Hub). يهدف هذا النظام إلى توفير حلول متكاملة لإدارة المخزون، المصادقة، ومزامنة البيانات بين الصيدليات المختلفة. يركز هذا التوثيق بشكل خاص على تدفق المصادقة (Authentication Flow) وكيفية التعامل مع الرموز (Tokens) ومعالجة الأخطاء (Error Handling).

## 🔐 تدفق المصادقة | Authentication Flow

تتبع واجهة برمجة التطبيقات تدفق مصادقة آمن ومرن، يتضمن التسجيل، تسجيل الدخول، التحقق بخطوتين (OTP)، إعادة تعيين كلمة المرور، وآلية تجديد الرموز (Refresh Token) لضمان استمرارية الجلسة وأمانها.

### 1. تسجيل مستخدم جديد | Register New User

**الوصف**: ينشئ حساب مستخدم جديد في النظام ويرسل رمز التحقق لمرة واحدة (OTP) تلقائياً إلى رقم الهاتف المسجل.

*   **المسار**: `POST /auth/register`
*   **الاستجابة الناجحة (201 Created)**:
    ```json
    {
      "success": true,
      "message": "تم إنشاء الحساب، أدخل رمز OTP للتحقق",
      "user_id": 1
    }
    ```
*   **الاستجابات الخاطئة (4xx Error Responses)**:
    *   **409 Conflict**: رقم الهاتف مسجل مسبقاً.
        ```json
        {
          "statusCode": 409,
          "message": "رقم الهاتف مسجّل مسبقاً",
          "timestamp": "2026-06-21T08:00:00.000Z",
          "path": "/auth/register"
        }
        ```

### 2. تسجيل الدخول | Login

**الوصف**: يتحقق من بيانات اعتماد المستخدم (رقم الهاتف وكلمة المرور) ويُرجع `access_token` و `refresh_token`.

*   **المسار**: `POST /auth/login`
*   **الاستجابة الناجحة (200 OK)**:
    ```json
    {
      "success": true,
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "token_type": "Bearer",
      "user": {
        "id": 1,
        "name": "محمود أحمد",
        "phone": "+249912345678",
        "profile_image": null,
        "is_verified": true,
        "created_at": "2026-01-01T00:00:00.000Z"
      }
    }
    ```
*   **الاستجابات الخاطئة (4xx Error Responses)**:
    *   **401 Unauthorized**: فشل المصادقة (كلمة مرور خاطئة أو حساب غير مفعل).
        ```json
        {
          "statusCode": 401,
          "message": "كلمة المرور غير صحيحة",
          "timestamp": "2026-06-21T08:00:00.000Z",
          "path": "/auth/login"
        }
        ```
    *   **404 Not Found**: المستخدم غير موجود.
        ```json
        {
          "statusCode": 404,
          "message": "لا يوجد حساب بهذا الرقم",
          "timestamp": "2026-06-21T08:00:00.000Z",
          "path": "/auth/login"
        }
        ```

### 3. إرسال رمز التحقق (OTP) | Send OTP

**الوصف**: يُرسل رمز التحقق لمرة واحدة (OTP) إلى رقم الهاتف المحدد. يستخدم لعمليات مثل التحقق من الحساب أو إعادة تعيين كلمة المرور.

*   **المسار**: `POST /auth/send-otp`
*   **الاستجابة الناجحة (200 OK)**:
    ```json
    {
      "success": true,
      "message": "تم إرسال رمز التحقق"
    }
    ```
*   **الاستجابات الخاطئة (4xx Error Responses)**:
    *   **404 Not Found**: المستخدم غير موجود.
        ```json
        {
          "statusCode": 404,
          "message": "لا يوجد حساب بهذا الرقم",
          "timestamp": "2026-06-21T08:00:00.000Z",
          "path": "/auth/send-otp"
        }
        ```

### 4. التحقق من رمز OTP | Verify OTP

**الوصف**: يتحقق من صحة رمز OTP المرسل. في حال النجاح، يتم تفعيل الحساب (إذا لم يكن مفعلاً) ويُرجع `access_token` و `refresh_token`.

*   **المسار**: `POST /auth/verify-otp`
*   **الاستجابة الناجحة (200 OK)**:
    ```json
    {
      "success": true,
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "token_type": "Bearer",
      "user": {
        "id": 1,
        "name": "محمود أحمد",
        "phone": "+249912345678",
        "profile_image": null,
        "is_verified": true,
        "created_at": "2026-01-01T00:00:00.000Z"
      }
    }
    ```
*   **الاستجابات الخاطئة (4xx Error Responses)**:
    *   **401 Unauthorized**: رمز التحقق غير صحيح أو منتهي الصلاحية.
        ```json
        {
          "statusCode": 401,
          "message": "رمز التحقق غير صحيح أو منتهي الصلاحية",
          "timestamp": "2026-06-21T08:00:00.000Z",
          "path": "/auth/verify-otp"
        }
        ```

### 5. نسيت كلمة المرور | Forgot Password

**الوصف**: يبدأ عملية إعادة تعيين كلمة المرور عن طريق إرسال رمز OTP إلى رقم الهاتف المحدد.

*   **المسار**: `POST /auth/forgot-password`
*   **الاستجابة الناجحة (200 OK)**:
    ```json
    {
      "success": true,
      "message": "تم إرسال رمز إعادة التعيين"
    }
    ```
*   **الاستجابات الخاطئة (4xx Error Responses)**:
    *   **404 Not Found**: المستخدم غير موجود.
        ```json
        {
          "statusCode": 404,
          "message": "لا يوجد حساب بهذا الرقم",
          "timestamp": "2026-06-21T08:00:00.000Z",
          "path": "/auth/forgot-password"
        }
        ```

### 6. إعادة تعيين كلمة المرور | Reset Password

**الوصف**: يتحقق من رمز OTP ويقوم بتحديث كلمة مرور المستخدم بكلمة مرور جديدة.

*   **المسار**: `POST /auth/reset-password`
*   **الاستجابة الناجحة (200 OK)**:
    ```json
    {
      "success": true,
      "message": "تم تغيير كلمة المرور بنجاح"
    }
    ```
*   **الاستجابات الخاطئة (4xx Error Responses)**:
    *   **401 Unauthorized**: رمز التحقق غير صحيح أو منتهي الصلاحية.
        ```json
        {
          "statusCode": 401,
          "message": "رمز التحقق غير صحيح أو منتهي الصلاحية",
          "timestamp": "2026-06-21T08:00:00.000Z",
          "path": "/auth/reset-password"
        }
        ```

### 7. تجديد التوكن | Refresh Token

**الوصف**: يستخدم `refresh_token` صالح للحصول على `access_token` جديد و `refresh_token` جديد دون الحاجة لإعادة تسجيل الدخول.

*   **المسار**: `POST /auth/refresh-token`
*   **الاستجابة الناجحة (200 OK)**:
    ```json
    {
      "success": true,
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "token_type": "Bearer"
    }
    ```
*   **الاستجابات الخاطئة (4xx Error Responses)**:
    *   **401 Unauthorized**: `refresh_token` غير صالح أو منتهي الصلاحية.
        ```json
        {
          "statusCode": 401,
          "message": "Refresh Token غير صالح أو منتهي",
          "timestamp": "2026-06-21T08:00:00.000Z",
          "path": "/auth/refresh-token"
        }
        ```

### 8. بيانات المستخدم الحالي | Get Current User Data

**الوصف**: يُرجع بيانات المستخدم الحالي بناءً على `access_token` المقدم في ترويسة المصادقة.

*   **المسار**: `GET /auth/me`
*   **الاستجابة الناجحة (200 OK)**:
    ```json
    {
      "id": 1,
      "name": "محمود أحمد",
      "phone": "+249912345678",
      "profile_image": null,
      "is_verified": true,
      "created_at": "2026-01-01T00:00:00.000Z"
    }
    ```
*   **الاستجابات الخاطئة (4xx Error Responses)**:
    *   **401 Unauthorized**: `access_token` مفقود أو غير صالح أو منتهي الصلاحية.
        ```json
        {
          "statusCode": 401,
          "message": "Unauthorized",
          "timestamp": "2026-06-21T08:00:00.000Z",
          "path": "/auth/me"
        }
        ```

## 🔑 استخدام التوكن | Token Usage

بعد الحصول على `access_token`، يجب تضمينه في ترويسة `Authorization` لجميع الطلبات المحمية، بالصيغة التالية:

```http
Authorization: Bearer <access_token>
```

*   **`access_token`**: صالح لمدة 15 دقيقة. يستخدم للوصول إلى الموارد المحمية.
*   **`refresh_token`**: صالح لمدة 7 أيام. يستخدم لتجديد `access_token` عند انتهائه.

## ⚠️ معالجة الأخطاء | Error Handling

تتبع جميع الأخطاء في واجهة برمجة التطبيقات هيكلاً موحداً لتسهيل التعامل معها في الواجهات الأمامية. يتم إرجاع رسائل الأخطاء باللغة العربية لزيادة الوضوح للمستخدمين المحليين.

**مثال على استجابة الخطأ:**

```json
{
  "statusCode": 401,
  "message": "رسالة الخطأ باللغة العربية",
  "timestamp": "2026-06-21T08:00:00.000Z",
  "path": "/api/endpoint"
}
```

*   **`statusCode`**: رمز حالة HTTP للخطأ.
*   **`message`**: وصف موجز للخطأ باللغة العربية.
*   **`timestamp`**: الوقت الذي حدث فيه الخطأ.
*   **`path`**: المسار الذي تم فيه طلب API.

## ملخص نقاط نهاية المصادقة | Authentication Endpoints Summary

| المسار                      | الطريقة | الوصف                                        | الاستجابات الناجحة | الاستجابات الخاطئة |
| :-------------------------- | :----- | :------------------------------------------- | :---------------- | :---------------- |
| `/auth/register`            | `POST` | تسجيل مستخدم جديد وإرسال OTP                 | 201               | 409               |
| `/auth/login`               | `POST` | تسجيل الدخول وإرجاع Access/Refresh Tokens    | 200               | 401, 404          |
| `/auth/send-otp`            | `POST` | إرسال رمز OTP لرقم الهاتف                   | 200               | 404               |
| `/auth/verify-otp`          | `POST` | التحقق من OTP وتفعيل الحساب وإرجاع Tokens   | 200               | 401               |
| `/auth/forgot-password`     | `POST` | بدء عملية إعادة تعيين كلمة المرور (إرسال OTP) | 200               | 404               |
| `/auth/reset-password`      | `POST` | إعادة تعيين كلمة المرور بعد التحقق من OTP   | 200               | 401               |
| `/auth/refresh-token`       | `POST` | تجديد Access Token باستخدام Refresh Token    | 200               | 401               |
| `/auth/me`                  | `GET`  | الحصول على بيانات المستخدم الحالي            | 200               | 401               |
