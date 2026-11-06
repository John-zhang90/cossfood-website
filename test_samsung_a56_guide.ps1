$ErrorActionPreference = 'Stop'
$docs = @(Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.doc' -File)
if ($docs.Count -ne 1) { throw "Expected exactly one Word-compatible .doc guide, found $($docs.Count)." }
$doc = $docs[0].FullName
$text = Get-Content -LiteralPath $doc -Raw -Encoding UTF8
$required = @(
  'SM-A5660',
  'SM-A566B',
  'Smart Switch',
  'Play Protect',
  'samsung.com/sg/support/service-centre',
  'samsung.com.cn/support/model'
)
foreach ($needle in $required) {
  if ($text -notmatch [regex]::Escape($needle)) { throw "Missing required content: $needle" }
}
if ($text -notmatch '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">') {
  throw 'Document must declare UTF-8 encoding.'
}
Write-Output 'PASS: Samsung A56 guide contains required safety and validation content.'
