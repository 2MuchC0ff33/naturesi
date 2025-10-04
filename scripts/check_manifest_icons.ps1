Param(
    [string]$Root
)

# Default to repository root (parent of script folder) when no Root provided
if (-not $Root) {
    $Root = Resolve-Path -Path (Join-Path $PSScriptRoot "..")
}

$manifestPath = Join-Path $Root 'manifest.json'
if (-not (Test-Path $manifestPath)) {
    Write-Output "ERROR: manifest.json not found at $manifestPath"
    exit 2
}

try {
    $m = Get-Content -Raw -Path $manifestPath | ConvertFrom-Json
} catch {
    Write-Output "ERROR: Failed to parse manifest.json: $_"
    exit 3
}

$paths = @()
if ($m.icons) { $paths += ($m.icons | ForEach-Object { $_.src }) }
if ($m.screenshots) { $paths += ($m.screenshots | ForEach-Object { $_.src }) }
if ($m.shortcuts) {
    foreach ($s in $m.shortcuts) {
        if ($s.url) { $paths += $s.url }
        if ($s.icons) { $paths += ($s.icons | ForEach-Object { $_.src }) }
    }
}
if ($m.share_target -and $m.share_target.action) { $paths += $m.share_target.action }
if ($m.serviceworker -and $m.serviceworker.src) { $paths += $m.serviceworker.src }
if ($m.web_accessible_resources) {
    foreach ($w in $m.web_accessible_resources) {
        if ($w.resources) { $paths += $w.resources }
    }
}

# Normalize and deduplicate
$paths = $paths | ForEach-Object { $_ -replace '^/','' } | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne $null -and $_ -ne '' } | Sort-Object -Unique

Write-Output "Checking $($paths.Count) referenced paths from manifest.json..."
$missing = @()

foreach ($p in $paths) {
    if ($p -match '[\*\?\[\]]') {
        # Handle glob patterns: check for any matching file
        $globFull = Join-Path $Root $p
        $dir = Split-Path $globFull -Parent
        $pattern = Split-Path $p -Leaf
        if (-not (Test-Path $dir)) {
            $missing += "$p (no matching directory: $dir)"
            continue
        }
        $matches = Get-ChildItem -Path $dir -Filter $pattern -File -ErrorAction SilentlyContinue
        if (-not $matches -or $matches.Count -eq 0) {
            $missing += "$p (no files match glob)"
        }
    } else {
        $full = Join-Path $Root $p
        if (-not (Test-Path $full)) {
            $missing += $p
        }
    }
}

if ($missing.Count -eq 0) {
    Write-Output "All referenced files exist."
    exit 0
} else {
    Write-Output "Missing files or globs with no matches:"
    foreach ($m in $missing) { Write-Output " - $m" }
    exit 1
}
