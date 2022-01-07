# Script will upload the extension (that is the parent path to this .ps1 script)
# if the extension already exists, it will be patched with the new version
# As optional parameter provide the folder, where qlik.exe (qlik CLI for SaaS) is found

# Christof Schwarz, 06-Jan-2022

Param(
    [string]$qlik_folder
)
$qlik_exe = -join ($qlik_folder, 'qlik.exe')

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

$extension_list = & $qlik_exe extension ls
$extension_list = $extension_list | ConvertFrom-Json

#Write-Host $extension_list
$extension_id = ""

foreach ($extension in $extension_list) {
    
    if ($extension.qextFilename -like "$($extension_name)") {
        $extension_id = $extension.id
        Write-Host "$($extension.name) has id $($extension_id)"
    } 
}

if ($extension_id -eq "") {
    Write-Host "New extension $($extension). Upload it first time ..."
    $resp = & $qlik_exe extension create "$($extension_id)" --file "$($file)"
}
else {
    $resp = & $qlik_exe extension patch "$($extension_id)" --file "$($file)"
}

if ($resp.Length -gt 0) {
    $resp = $resp | ConvertFrom-Json
    Write-Host "Extension $($resp.name) uploaded (server timestamp $($resp.updatedAt))"
}
else {
    Write-Host "An error occurred. Not getting expected response." -ForegroundColor 'red' -BackgroundColor 'black'
}