# Script will upload the extension (provided as a path)
# if the extension already exists, it will be removed and replaced by the new version

# Christof Schwarz 06-Jan-2022

$cert = Get-PfxCertificate -FilePath c:\certificates\qs-i-dev\client.pfx
$api_url = 'https://qs-i-dev.databridge.ch:4242/qrs'
$xrfkey = 'xrfkey=1234567890123456'
$headers = @{
    'X-Qlik-User'   = 'UserDirectory=INTERNAL;UserID=sa_repository'; 
    'X-Qlik-Xrfkey' = '1234567890123456'
}

$folder = (Split-Path $PSScriptRoot -Parent)
if ((Get-ChildItem -Path $folder -filter *.qext | Measure-Object).Count -ne 1) {
    Write-Host "The extension folder does not have ONE .qext file" -ForegroundColor 'red' -BackgroundColor 'black'
    Exit
}
$extension_name = (Get-ChildItem "$($folder)\*.qext" | Select-Object BaseName).BaseName
Write-Host "Extension is $($extension_name)"

# Make a temp copy of this work folder but remove the .ps1 file (Qlik Cloud wont
# allow a .ps1 file to be part of an extension .zip)
$rnd = Get-Random
Copy-Item "$($folder)" -Destination "$($folder)$($rnd)" -Recurse -Container
Remove-Item -LiteralPath "$($folder)$($rnd)\.vscode" -Force -Recurse
Write-Host "Creating zip file from folder '$($folder)'"

# create a zip file from the temp folder then remove the temp folder 
$file = "$($folder)_upload.zip"
if (Test-Path $file) {
    Remove-Item $file
}
Compress-Archive -Path "$($folder)$($rnd)" -DestinationPath "$file"
Remove-Item -LiteralPath "$($folder)$($rnd)" -Force -Recurse

# $check = Invoke-RestMethod "$($api_url)/about?$($xrfkey)" -Headers $headers -Certificate $cert -SkipCertificateCheck | ConvertTo-Json
# Write-Host $check

$extension_list = Invoke-RestMethod "$($api_url)/extension?filter=name eq '$($extension_name)'&$($xrfkey)" `
    -Headers $headers `
    -Certificate $cert -SkipCertificateCheck `
| ConvertTo-Json
$extension_list = $extension_list | ConvertFrom-Json

if ($extension_list.length -eq 0) {
    Write-Host "Extension '$($extension_name)' does not exist. Uploading it first time ...'" 
    $gotoupload = 1
}
elseif ($extension_list.length -eq 1) {
    $extension_id = $extension_list[0].id
    Write-Host "Removing existing extension '$($extension_name)' ($($extension_id)) ..." 
    Invoke-RestMethod -method 'DELETE' "$($api_url)/extension/$($extension_id)?$($xrfkey)" `
        -Headers $headers `
        -Certificate $cert -SkipCertificateCheck
    $gotoupload = 1
}
else {
    Write-Host "The name '$($extension_name)' exists $($extension_list.value.length) times."
    $gotoupload = 0
}
if ($gotoupload -eq 1) {
    $new_ext = Invoke-RestMethod -method 'POST' "$($api_url)/extension/upload?$($xrfkey)" `
        -Headers $headers `
        -Certificate $cert -SkipCertificateCheck `
        -inFile $file `
    | ConvertTo-Json -Depth 4
    # Remove-Item $file
    $new_ext = $new_ext | ConvertFrom-Json
    Write-Host "Extension '$($extension_name)' uploaded ($($new_ext[0].id))"
}
