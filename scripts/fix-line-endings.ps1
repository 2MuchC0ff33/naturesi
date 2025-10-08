# Script to fix line endings in all markdown files (PowerShell version)

Write-Host "Normalising line endings in markdown files..."


# Get all files recursively and replace CRLF with LF
Get-ChildItem -Path . -File -Recurse | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace "`r`n", "`n"
    Set-Content $_.FullName $content
}

Write-Host "Done! All markdown files now have LF line endings."