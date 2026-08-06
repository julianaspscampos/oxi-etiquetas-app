$src = "C:\Users\Wagner\oxi-etiquetas-app\dist\OxiEtiquetas-win32-x64"
$dst = "C:\Users\Wagner\oxi-etiquetas-app\dist\OxiEtiquetas-v1.0.0-Portatil.zip"
if (Test-Path $dst) { Remove-Item $dst -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($src, $dst, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Write-Host "ZIP criado:" (Get-Item $dst).Length "bytes"