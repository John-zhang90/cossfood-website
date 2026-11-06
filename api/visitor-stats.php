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

function readCsvRows(string $file): array
{
    if (!is_file($file)) {
        return [];
    }
    $handle = fopen($file, 'rb');
    if ($handle === false) {
        return [];
    }
    $rows = [];
    while (($row = fgetcsv($handle)) !== false) {
        if (count($rows) === 0 && isset($row[0])) {
            $row[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $row[0]) ?? $row[0];
        }
        $rows[] = $row;
    }
    fclose($handle);
    return $rows;
}

function writeCsvRows(string $file, array $rows): bool
{
    $temporary = $file . '.tmp-' . bin2hex(random_bytes(6));
    $handle = fopen($temporary, 'wb');
    if ($handle === false) {
        return false;
    }
    fwrite($handle, "\xEF\xBB\xBF");
    foreach ($rows as $row) {
        fputcsv($handle, $row);
    }
    fflush($handle);
    fclose($handle);
    chmod($temporary, 0600);
    return rename($temporary, $file);
}

function excelColumnName(int $index): string
{
    $column = '';
    $number = $index + 1;
    while ($number > 0) {
        $number--;
        $column = chr(65 + ($number % 26)) . $column;
        $number = intdiv($number, 26);
    }
    return $column;
}

function writeXlsx(string $file, array $rows, string $sheetName): bool
{
    if (!class_exists('ZipArchive')) {
        return false;
    }
    $xml = static function (string $value): string {
        return htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
    };
    $sheetRows = [];
    foreach ($rows as $rowIndex => $row) {
        $cells = [];
        foreach ($row as $columnIndex => $value) {
            $cellRef = excelColumnName($columnIndex) . ($rowIndex + 1);
            $cells[] = '<c r="' . $cellRef . '" t="inlineStr"><is><t>' . $xml((string) $value) . '</t></is></c>';
        }
        $sheetRows[] = '<row r="' . ($rowIndex + 1) . '">' . implode('', $cells) . '</row>';
    }

    $worksheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>' . implode('', $sheetRows) . '</sheetData></worksheet>';
    $contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
    $rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    $workbook = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' . $xml($sheetName) . '" sheetId="1" r:id="rId1"/></sheets></workbook>';
    $workbookRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    $styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellXfs></styleSheet>';

    $temporary = $file . '.tmp-' . bin2hex(random_bytes(6));
    $zip = new ZipArchive();
    if ($zip->open($temporary, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        return false;
    }
    $zip->addFromString('[Content_Types].xml', $contentTypes);
    $zip->addFromString('_rels/.rels', $rootRels);
    $zip->addFromString('xl/workbook.xml', $workbook);
    $zip->addFromString('xl/_rels/workbook.xml.rels', $workbookRels);
    $zip->addFromString('xl/worksheets/sheet1.xml', $worksheet);
    $zip->addFromString('xl/styles.xml', $styles);
    $zip->close();
    chmod($temporary, 0600);
    return rename($temporary, $file);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Method not allowed']);
}

$dataDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'customer_data';
if (!is_dir($dataDirectory) && !mkdir($dataDirectory, 0700, true) && !is_dir($dataDirectory)) {
    respond(500, ['success' => false, 'message' => 'Unable to prepare storage']);
}

$lock = fopen($dataDirectory . DIRECTORY_SEPARATOR . 'visitor-stats.lock', 'c+');
if ($lock === false || !flock($lock, LOCK_EX)) {
    respond(500, ['success' => false, 'message' => 'Unable to lock storage']);
}

$timezone = new DateTimeZone('Asia/Singapore');
$date = (new DateTimeImmutable('now', $timezone))->format('Y-m-d');
$timestamp = (new DateTimeImmutable('now', $timezone))->format('Y-m-d H:i:s');
$saltFile = $dataDirectory . DIRECTORY_SEPARATOR . 'visitor-salt.key';
if (!is_file($saltFile)) {
    file_put_contents($saltFile, bin2hex(random_bytes(32)), LOCK_EX);
    chmod($saltFile, 0600);
}
$salt = trim((string) file_get_contents($saltFile));
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$userAgent = (string) ($_SERVER['HTTP_USER_AGENT'] ?? 'unknown');
$visitorKey = hash('sha256', $salt . '|' . $date . '|' . $ip . '|' . $userAgent);

$keysFile = $dataDirectory . DIRECTORY_SEPARATOR . 'visitor-keys-' . $date . '.txt';
$keys = is_file($keysFile) ? (file($keysFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: []) : [];
$knownKeys = array_fill_keys($keys, true);
if (!isset($knownKeys[$visitorKey])) {
    file_put_contents($keysFile, $visitorKey . PHP_EOL, FILE_APPEND | LOCK_EX);
    $keys[] = $visitorKey;
}
$todayVisitors = count($keys);

$reportCsv = $dataDirectory . DIRECTORY_SEPARATOR . 'visitor-stats.csv';
$reportXlsx = $dataDirectory . DIRECTORY_SEPARATOR . 'visitor-stats.xlsx';
$dailyCounts = [];
foreach (readCsvRows($reportCsv) as $index => $row) {
    if ($index === 0 || count($row) < 2 || !preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $row[0])) {
        continue;
    }
    $dailyCounts[(string) $row[0]] = max(0, (int) $row[1]);
}
$dailyCounts[$date] = $todayVisitors;
ksort($dailyCounts);
$reportRows = [['日期', '当日访问人数', '累计访问人数', '最后更新时间']];
$totalVisitors = 0;
foreach ($dailyCounts as $day => $count) {
    $totalVisitors += $count;
    $reportRows[] = [$day, $count, $totalVisitors, $day === $date ? $timestamp : ''];
}

if (!writeCsvRows($reportCsv, $reportRows)) {
    flock($lock, LOCK_UN);
    fclose($lock);
    respond(500, ['success' => false, 'message' => 'Unable to save visitor report']);
}
$xlsxCreated = writeXlsx($reportXlsx, $reportRows, '每日访问统计');

flock($lock, LOCK_UN);
fclose($lock);
respond(200, [
    'success' => true,
    'todayVisitors' => $todayVisitors,
    'totalVisitors' => $totalVisitors,
    'xlsx' => $xlsxCreated,
]);
