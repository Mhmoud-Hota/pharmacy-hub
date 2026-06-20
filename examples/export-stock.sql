-- ════════════════════════════════════════════════════════════════════════════
-- SQL Query للصيدلية: استخراج كل المخزون الحالي بالشكل المطلوب
-- شغّلها على قاعدة بيانات الصيدلية (المبنية على جداولك الأصلية)
-- ════════════════════════════════════════════════════════════════════════════

-- ── الاستعلام الرئيسي: كل الأدوية مع كمياتها الحالية ────────────────────────
SELECT
    m.id                AS local_medicine_id,
    m.barcode,
    m.name,
    m.trad_name,
    m.scientific_name,
    m.quantity          AS quantity,
    m.price,
    m.unit,
    m.tablets_per_box,
    m.expiry_date,
    m.category
FROM medicines m
WHERE
    m.is_deleted = 0        -- استبعد المحذوفة
    AND m.quantity >= 0     -- الكمية الحالية (صفر مسموح)
ORDER BY m.name;


-- ════════════════════════════════════════════════════════════════════════════
-- إذا كانت الكميات مبعثرة في جدول batches بدلاً من medicines مباشرة،
-- استخدم هذا الاستعلام الذي يجمّع الكميات من الدُفعات:
-- ════════════════════════════════════════════════════════════════════════════
SELECT
    m.id                        AS local_medicine_id,
    m.barcode,
    m.name,
    m.trad_name,
    m.scientific_name,
    COALESCE(SUM(b.quantity), 0) AS quantity,
    m.price,
    m.unit,
    m.tablets_per_box,
    MIN(b.expiry_date)          AS expiry_date,   -- أقرب تاريخ انتهاء
    m.category
FROM medicines m
LEFT JOIN batches b
    ON b.medicine_id = m.id
    AND b.quantity > 0
    AND (b.expiry_date IS NULL OR b.expiry_date > CURDATE())
WHERE m.is_deleted = 0
GROUP BY
    m.id, m.barcode, m.name, m.trad_name,
    m.scientific_name, m.price, m.unit,
    m.tablets_per_box, m.category
ORDER BY m.name;


-- ════════════════════════════════════════════════════════════════════════════
-- إخراج النتيجة كـ JSON جاهز للإرسال (MySQL 5.7+)
-- ════════════════════════════════════════════════════════════════════════════
SELECT JSON_OBJECT(
    'medicines', JSON_ARRAYAGG(
        JSON_OBJECT(
            'local_medicine_id', m.id,
            'barcode',           m.barcode,
            'name',              m.name,
            'trad_name',         m.trad_name,
            'scientific_name',   m.scientific_name,
            'quantity',          m.quantity,
            'price',             m.price,
            'unit',              m.unit,
            'tablets_per_box',   m.tablets_per_box,
            'expiry_date',       DATE_FORMAT(m.expiry_date, '%Y-%m-%d'),
            'category',          m.category
        )
    ),
    'replace_existing', FALSE
) AS payload
FROM medicines m
WHERE m.is_deleted = 0;
