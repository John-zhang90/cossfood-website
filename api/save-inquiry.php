<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$allowedOrigins = [
    'https://cossfood.com',
    'https://www.cossfood.com',
    'https://john-zhang90.github.io',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Method not allowed']);
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput ?: '', true);
if (!is_array($input)) {
    $input = $_POST;
}

if (!empty($input['_website'])) {
    respond(400, ['success' => false, 'message' => 'Invalid submission']);
}

$clean = static function ($value, int $maxLength): string {
    $value = trim(strip_tags((string) $value));
    $value = preg_replace('/[\x00-\x1F\x7F]/u', '', $value) ?? '';
    return function_exists('mb_substr') ? mb_substr($value, 0, $maxLength) : substr($value, 0, $maxLength);
};

$name = $clean($input['name'] ?? '', 100);
$address = $clean($input['address'] ?? '', 500);
$phone = $clean($input['phone'] ?? '', 30);
$deliverySlot = $clean($input['deliverySlot'] ?? '', 30);

if ($name === '' || $address === '' || $phone === '' || $deliverySlot === '') {
    respond(422, ['success' => false, 'message' => 'Required fields are missing']);
}
if (!in_array($deliverySlot, ['早车（09:00–17:00）', '晚车（17:00–21:00）'], true)) {
    respond(422, ['success' => false, 'message' => 'Invalid delivery slot']);
}

// Keep customer data outside public_html so it cannot be downloaded from the website.
$dataDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'customer_data';
if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0700, true) && !is_dir($dataDirectory)) {
    respond(500, ['success' => false, 'message' => 'Unable to prepare storage']);
}

$csvFile = $dataDirectory . DIRECTORY_SEPARATOR . 'customer-inquiries.csv';
$xlsxFile = $dataDirectory . DIRECTORY_SEPARATOR . 'customer-inquiries.xlsx';
$lockFile = $dataDirectory . DIRECTORY_SEPARATOR . 'customer-inquiries.lock';
$lock = fopen($lockFile, 'c+');
if ($lock === false || !flock($lock, LOCK_EX)) {
    respond(500, ['success' => false, 'message' => 'Unable to lock storage']);
}

$nextSequence = 1;
if (is_file($csvFile)) {
    $existing = fopen($csvFile, 'rb');
    if ($existing !== false) {
        while (($row = fgetcsv($existing)) !== false) {
            if (isset($row[0]) && ctype_digit((string) $row[0])) {
                $nextSequence = max($nextSequence, ((int) $row[0]) + 1);
            }
        }
        fclose($existing);
    }
}

$timestamp = (new DateTimeImmutable('now', new DateTimeZone('Asia/Singapore')))->format('Y-m-d H:i:s');
$fileExists = is_file($csvFile) && filesize($csvFile) > 0;
$csv = fopen($csvFile, 'ab');
if ($csv === false) {
    flock($lock, LOCK_UN);
    fclose($lock);
    respond(500, ['success' => false, 'message' => 'Unable to save inquiry']);
}

if (!$fileExists) {
    fwrite($csv, "\xEF\xBB\xBF");
    fputcsv($csv, ['序号', '名字', '地址', '电话', '配送时间段', '时间']);
}

// Prefix spreadsheet formula-like values so customer input cannot execute as a formula in Excel.
$safeCell = static function (string $value): string {
    return preg_match('/^[=+\-@]/', $value) === 1 ? "'" . $value : $value;
};
$record = [$nextSequence, $safeCell($name), $safeCell($address), $safeCell($phone), $deliverySlot, $timestamp];
fputcsv($csv, $record);
fflush($csv);
fclose($csv);

// Create a native .xlsx copy when the cPanel PHP build provides ZipArchive.
$xlsxCreated = false;
if (class_exists('ZipArchive')) {
    $rows = [];
    $reader = fopen($csvFile, 'rb');
    if ($reader !== false) {
        while (($row = fgetcsv($reader)) !== false) {
            if (count($rows) === 0 && isset($row[0])) {
                $row[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $row[0]) ?? $row[0];
            }
            $rows[] = $row;
        }
        fclose($reader);
    }

    $xml = static function (string $value): string {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    };
    $sheetRows = [];
    foreach ($rows as $rowIndex => $row) {
        $cells = [];
        foreach ($row as $columnIndex => $value) {
            $column = '';
            $number = $columnIndex + 1;
            while ($number > 0) {
                $number--;
                $column = chr(65 + ($number % 26)) . $column;
                $number = intdiv($number, 26);
            }
            $cellRef = $column . ($rowIndex + 1);
            $cells[] = '<c r="' . $cellRef . '" t="inlineStr"><is><t>' . $xml((string) $value) . '</t></is></c>';
        }
        $sheetRows[] = '<row r="' . ($rowIndex + 1) . '">' . implode('', $cells) . '</row>';
    }
    $worksheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' . implode('', $sheetRows) . '</sheetData></worksheet>';
    $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
    $rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="客户询价" sheetId="1" r:id="rId1"/></sheets></workbook>';
    $workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellXfs></styleSheet>';
    $zip = new ZipArchive();
    if ($zip->open($xlsxFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
        $zip->addFromString('[Content_Types].xml', $contentTypes);
        $zip->addFromString('_rels/.rels', $rootRels);
        $zip->addFromString('xl/workbook.xml', $workbook);
        $zip->addFromString('xl/_rels/workbook.xml.rels', $workbookRels);
        $zip->addFromString('xl/worksheets/sheet1.xml', $worksheet);
        $zip->addFromString('xl/styles.xml', $styles);
        $zip->close();
        $xlsxCreated = is_file($xlsxFile) && filesize($xlsxFile) > 0;
    }
}

flock($lock, LOCK_UN);
fclose($lock);
respond(200, ['success' => true, 'sequence' => $nextSequence, 'xlsx' => $xlsxCreated]);
