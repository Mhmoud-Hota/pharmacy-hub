<?php
/**
 * send-initial-stock.php
 * ───────────────────────
 * سكريبت PHP لاستخراج مخزون الصيدلية من قاعدة بياناتها المحلية
 * وإرساله للنظام المركزي (pharmacy-hub).
 *
 * شغّله مرة واحدة عند إعداد الصيدلية، أو بعد أي جرد يدوي.
 *
 * الاستخدام:
 *   php send-initial-stock.php
 *   php send-initial-stock.php --replace   ← يمسح القديم أولاً
 */

// ── إعدادات الصيدلية ─────────────────────────────────────────────────────────
define('HUB_URL',      'https://your-hub.com/inventory/import/pharmacy-cairo-1');
define('API_KEY',      'YOUR_API_KEY_HERE');   // المفتاح من عند تسجيل الصيدلية
define('BATCH_SIZE',   500);                   // عدد الأدوية في كل إرسال

// ── إعدادات قاعدة بيانات الصيدلية المحلية ────────────────────────────────────
$db = new PDO(
    'mysql:host=localhost;dbname=medicore;charset=utf8mb4',
    'db_user',
    'db_pass',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$replaceExisting = in_array('--replace', $argv ?? []);

// ── استخراج المخزون الكامل ────────────────────────────────────────────────────
// هذا الاستعلام مبني على جداول نظامك الأصلي (medicines + batches)
$sql = "
    SELECT
        m.id                         AS local_medicine_id,
        m.barcode,
        m.name,
        m.trad_name,
        m.scientific_name,
        COALESCE(SUM(b.quantity), 0) AS quantity,
        m.price,
        m.unit,
        m.tablets_per_box,
        MIN(b.expiry_date)           AS expiry_date,
        m.category
    FROM medicines m
    LEFT JOIN batches b
        ON  b.medicine_id = m.id
        AND b.quantity    > 0
        AND (b.expiry_date IS NULL OR b.expiry_date > CURDATE())
    WHERE m.is_deleted = 0
    GROUP BY
        m.id, m.barcode, m.name, m.trad_name,
        m.scientific_name, m.price, m.unit, m.tablets_per_box, m.category
    ORDER BY m.name
";

$stmt = $db->query($sql);
$medicines = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "📦 استُخرج " . count($medicines) . " دواء من قاعدة البيانات\n";

// ── تقسيم إلى دفعات وإرسال ────────────────────────────────────────────────────
$batches    = array_chunk($medicines, BATCH_SIZE);
$totalSent  = 0;
$totalFail  = 0;
$firstBatch = true;

foreach ($batches as $i => $batch) {
    echo "⬆️  إرسال الدفعة " . ($i + 1) . "/" . count($batches) . " (" . count($batch) . " دواء)... ";

    $payload = [
        'medicines'        => array_map('cleanMedicine', $batch),
        // replace_existing فقط في أول دفعة (تمسح القديم مرة واحدة)
        'replace_existing' => $firstBatch && $replaceExisting,
    ];
    $firstBatch = false;

    $result = sendToHub($payload);

    if ($result['success']) {
        $totalSent += $result['summary']['processed'];
        echo "✅ تم (جديد: {$result['summary']['created']}, محدّث: {$result['summary']['updated']})\n";
    } else {
        $totalFail += count($batch);
        echo "❌ فشل: " . ($result['message'] ?? 'خطأ غير معروف') . "\n";
        if (!empty($result['errors'])) {
            foreach (array_slice($result['errors'], 0, 3) as $err) {
                echo "   → $err\n";
            }
        }
    }

    // انتظر قليلاً بين الدفعات لتخفيف الضغط
    if ($i < count($batches) - 1) usleep(200_000); // 200ms
}

echo "\n✅ انتهى: أُرسل $totalSent | فشل $totalFail\n";

// ── الدوال المساعدة ────────────────────────────────────────────────────────────

function cleanMedicine(array $row): array {
    return array_filter([
        'local_medicine_id' => (int) $row['local_medicine_id'],
        'barcode'           => $row['barcode']       ?: null,
        'name'              => $row['name'],
        'trad_name'         => $row['trad_name']     ?: null,
        'scientific_name'   => $row['scientific_name'] ?: null,
        'quantity'          => (int) $row['quantity'],
        'price'             => $row['price']          ? (float) $row['price'] : null,
        'unit'              => $row['unit']           ?: null,
        'tablets_per_box'   => $row['tablets_per_box'] ? (int) $row['tablets_per_box'] : null,
        'expiry_date'       => $row['expiry_date']   ?: null,
        'category'          => $row['category']      ?: null,
    ], fn($v) => $v !== null);
}

function sendToHub(array $payload): array {
    $ch = curl_init(HUB_URL);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-Pharmacy-Api-Key: ' . API_KEY,
        ],
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode >= 500) {
        return ['success' => false, 'message' => "HTTP $httpCode"];
    }

    return json_decode($response, true) ?? ['success' => false, 'message' => 'Invalid JSON'];
}
