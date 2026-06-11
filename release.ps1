<#
.SYNOPSIS
  Release CLI for Spoons and Forks — builds Desktop + Android apps and publishes.

.PARAMETER Version
  Semantic version to release (e.g. "0.5.0"). Required unless interactive mode.

.PARAMETER Tauri
  Build the Tauri desktop installer (.msi/.exe on Windows).

.PARAMETER Android
  Build the Android APK/AAB.

.PARAMETER GitCommit
  Create a git commit for this release.

.PARAMETER GitPush
  Push the commit to GitHub.

.PARAMETER SkipVersionSync
  Skip bumping version files. Useful if you already bumped them manually.

.PARAMETER DryRun
  Print what would be done without actually doing it.

.PARAMETER Draft
  Create the GitHub release as a draft (not publicly visible).

.PARAMETER CommitMessage
  Override the default commit message.
#>

param(
    [string]$Version = "",
    [switch]$Tauri,
    [switch]$Android,
    [switch]$GitCommit,
    [switch]$GitPush,
    [switch]$SkipVersionSync,
    [switch]$DryRun,
    [switch]$Draft,
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"

# ---- Project layout ----------------------------------------------------------

$ScriptDir = $PSScriptRoot
$ProjectRoot = $ScriptDir
while ($ProjectRoot -and -not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
    $parent = Split-Path -Parent $ProjectRoot
    if ($parent -eq $ProjectRoot) { $ProjectRoot = $null; break }
    $ProjectRoot = $parent
}
if (-not $ProjectRoot) {
    throw "Could not locate project root (no package.json found in '$ScriptDir' or any parent directory)."
}
Set-Location $ProjectRoot

# ---- Helpers -----------------------------------------------------------------

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Test-SemVer {
    param([string]$InputVersion)
    return $InputVersion -match '^\d+\.\d+\.\d+(-[A-Za-z0-9.-]+)?$'
}

function Invoke-Step {
    param([string]$Label, [scriptblock]$Action)
    Write-Host ""
    Write-Host "-> $Label" -ForegroundColor Yellow
    if ($DryRun) {
        Write-Host "   Dry run: skipped" -ForegroundColor DarkYellow
        return
    }
    & $Action
}

function Invoke-External {
    param(
        [string]$FilePath,
        [string[]]$ArgumentList,
        [string]$WorkingDirectory = $ProjectRoot
    )
    if ($DryRun) {
        $joined = ($ArgumentList | ForEach-Object {
            if ($_ -match '\s') { '"' + $_ + '"' } else { $_ }
        }) -join ' '
        Write-Host "   Dry run command: $FilePath $joined" -ForegroundColor DarkYellow
        return
    }
    Push-Location $WorkingDirectory
    try {
        & $FilePath @ArgumentList
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($ArgumentList -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

function Update-JsonVersion {
    param([string]$Path, [string]$InputVersion)
    $json = Get-Content $Path -Raw | ConvertFrom-Json
    $json.version = $InputVersion
    $json | ConvertTo-Json -Depth 100 | Set-Content $Path
    Write-Host "   updated  $Path" -ForegroundColor Green
}

function Update-RegexReplace {
    param([string]$Path, [string]$Pattern, [string]$Replacement)
    $content = Get-Content $Path -Raw
    if (-not [regex]::IsMatch($content, $Pattern, [System.Text.RegularExpressions.RegexOptions]::Multiline)) {
        throw "Failed to find pattern $Pattern in $Path"
    }
    $updated = [regex]::Replace($content, $Pattern, $Replacement, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    Set-Content $Path $updated
    Write-Host "   updated  $Path" -ForegroundColor Green
}

function Sync-VersionFiles {
    param([string]$InputVersion)
    Update-JsonVersion (Join-Path $ProjectRoot "package.json") $InputVersion
    Update-JsonVersion (Join-Path $ProjectRoot "src-tauri/tauri.conf.json") $InputVersion
    Update-RegexReplace (Join-Path $ProjectRoot "src-tauri/Cargo.toml") '(?m)^version = ".*"$' ('version = "{0}"' -f $InputVersion)
}

function Assert-Command {
    param([string]$Cmd)
    if (-not (Get-Command $Cmd -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Cmd. Please install it and retry."
    }
}

function Read-Choice {
    param([string]$Prompt, [bool]$DefaultValue = $true)
    $suffix = if ($DefaultValue) { "[Y/n]" } else { "[y/N]" }
    $answer = Read-Host "$Prompt $suffix"
    if ([string]::IsNullOrWhiteSpace($answer)) { return $DefaultValue }
    return $answer.Trim().ToLowerInvariant() -in @("y", "yes")
}

# ---- Interactive mode --------------------------------------------------------

$explicitActions = $Tauri -or $Android -or $GitCommit -or $GitPush -or $SkipVersionSync
if (-not $explicitActions -and -not $Version) {
    Write-Section "Spoons and Forks Release CLI"

    do {
        $Version = Read-Host "Version (semver, e.g. 0.5.0)"
    } while (-not (Test-SemVer $Version))

    Write-Host ""
    Write-Host "Version: $Version" -ForegroundColor White

    $SkipVersionSync = -not (Read-Choice "Sync version files?" $true)

    $Tauri = Read-Choice "Build Tauri desktop installer?" $true

    $Android = Read-Choice "Build Android APK/AAB?" $true

    $GitCommit = Read-Choice "Create a git commit?" $true
    if ($GitCommit) {
        $defaultMsg = "release: v$Version"
        $entered = Read-Host "Commit message [$defaultMsg]"
        $CommitMessage = if ([string]::IsNullOrWhiteSpace($entered)) { $defaultMsg } else { $entered }
        $GitPush = Read-Choice "Push to GitHub?" $true
    }
}

# ---- Validation --------------------------------------------------------------

if (-not (Test-SemVer $Version)) {
    throw "Invalid version '$Version'. Use semver like 0.5.0 or 0.5.0-rc.1."
}
if (-not $CommitMessage) { $CommitMessage = "release: v$Version" }

Assert-Command "node"
Assert-Command "npm"
Assert-Command "git"
Assert-Command "cargo"
Assert-Command "rustup"

# ---- Summary ----------------------------------------------------------------

Write-Section "Release Summary"
Write-Host "  Version       : $Version"  -ForegroundColor White
Write-Host "  Commit msg    : $CommitMessage" -ForegroundColor White
Write-Host "  Tauri desktop : $Tauri"    -ForegroundColor White
Write-Host "  Android       : $Android"  -ForegroundColor White
Write-Host "  Git commit    : $GitCommit" -ForegroundColor White
Write-Host "  Git push      : $GitPush"  -ForegroundColor White
Write-Host "  Dry run       : $DryRun"   -ForegroundColor White

# ---- Step 1: Sync version files ---------------------------------------------

if (-not $SkipVersionSync) {
    Invoke-Step "Syncing version files to $Version" {
        Sync-VersionFiles $Version
    }
}

# ---- Step 2: Ensure bundle enabled + icon list ------------------------------

$tauriConfPath = Join-Path $ProjectRoot "src-tauri/tauri.conf.json"

Invoke-Step "Verifying Tauri bundle config" {
    $config = Get-Content $tauriConfPath -Raw | ConvertFrom-Json
    if (-not $config.bundle.active) {
        Update-RegexReplace $tauriConfPath '"active"\s*:\s*false' '"active": true'
    }
}

# ---- Step 3: Ensure icon list has the full set -----------------------------

if ($Tauri -or $Android) {
    Invoke-Step "Updating icon list in tauri.conf.json" {
        $iconReplacement = @'
"icon": [
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ]
'@
        $content = Get-Content $tauriConfPath -Raw
        if ($content -match '"icon"\s*:\s*\[[^\]]*\]') {
            $content = $content -replace '"icon"\s*:\s*\[[^\]]*\]', $iconReplacement
            Set-Content $tauriConfPath $content -NoNewline
        }
    }
}

# ---- Step 4: Regenerate icons -----------------------------------------------

$sourceIcon = Join-Path $ProjectRoot "Icon.png"
if (($Tauri -or $Android) -and (Test-Path $sourceIcon)) {
    Invoke-Step "Regenerating icons from Icon.png" {
        Invoke-External "npx.cmd" @("tauri", "icon", $sourceIcon)
    }
}

# ---- Step 5: Tauri desktop build --------------------------------------------

if ($Tauri) {
    Invoke-Step "Building Tauri desktop app" {
        Invoke-External "npm.cmd" @("run", "tauri", "build")
    }
}

# ---- Step 5b: Verify Android keystore --------------------------------------

if ($Android) {
    $keystorePath = Join-Path $ProjectRoot "src-tauri/release-key.jks"
    $keystoreProps = Join-Path $ProjectRoot "src-tauri/gen/android/app/keystore.properties"
    if (-not (Test-Path $keystorePath)) {
        throw "Android keystore not found at $keystorePath. Generate it with:`n  keytool -genkey -v -keystore `"$keystorePath`" -keyalg RSA -keysize 2048 -validity 10000 -alias spoons-and-forks -storepass spoonsandforks -keypass spoonsandforks -dname `"CN=Spoons and Forks, OU=Dev, O=Spoons, L=NA, ST=NA, C=US`""
    }
    if (-not (Test-Path $keystoreProps)) {
        throw "keystore.properties not found at $keystoreProps. Create it with:`n  storeFile=../../../release-key.jks`n  storePassword=spoonsandforks`n  keyAlias=spoons-and-forks`n  keyPassword=spoonsandforks"
    }
    Write-Host "   keystore OK  $keystorePath" -ForegroundColor Green
}

# ---- Step 6: Android build --------------------------------------------------

if ($Android) {
    Invoke-Step "Building Android APK/AAB" {
        Invoke-External "npx.cmd" @("tauri", "android", "build")
    }
}

# ---- Step 7: Collect artifacts ----------------------------------------------

$artifacts = @()
if ($Tauri) {
    $desktopDir = Join-Path $ProjectRoot "src-tauri/target/release/bundle"
    if (Test-Path $desktopDir) {
        $artifacts += Get-ChildItem $desktopDir -Recurse -File -Include "*.msi","*.exe","*.nsis","*.dmg","*.AppImage","*.deb","*.app" -ErrorAction SilentlyContinue
    }
}
if ($Android) {
    $androidDir = Join-Path $ProjectRoot "src-tauri/gen/android/app/build/outputs"
    if (Test-Path $androidDir) {
        $artifacts += Get-ChildItem $androidDir -Recurse -File -Include "*.apk","*.aab" -ErrorAction SilentlyContinue
    }
}

if ($artifacts.Count -gt 0) {
    Write-Section "Build artifacts"
    foreach ($a in $artifacts) {
        $rel = $a.FullName.Substring($ProjectRoot.Length + 1)
        Write-Host "  $rel  ($([math]::Round($a.Length / 1MB, 2)) MB)" -ForegroundColor White
    }
} elseif (($Tauri -or $Android) -and (-not $DryRun)) {
    Write-Host "  (no artifacts found)" -ForegroundColor DarkGray
}

# ---- Step 8: Git commit -----------------------------------------------------

if ($GitCommit -and (-not $DryRun)) {
    Invoke-Step "Creating git commit" {
        $staged = @(
            "package.json",
            "src-tauri/tauri.conf.json",
            "src-tauri/Cargo.toml",
            "Icon.png"
        )
        Invoke-External "git.exe" @("add") + $staged
        Invoke-External "git.exe" @("commit", "-m", $CommitMessage)
    }
}

# ---- Step 9: Git push -------------------------------------------------------

if ($GitPush) {
    Invoke-Step "Pushing to origin" {
        Invoke-External "git.exe" @("push")
    }
}

# ---- Step 10: GitHub release ------------------------------------------------

$tag = "v$Version"
if (($Tauri -or $Android) -and $artifacts.Count -gt 0 -and (-not $DryRun)) {
    $hasGh = Get-Command "gh" -ErrorAction SilentlyContinue
    if ($hasGh) {
        Invoke-Step "Creating GitHub release $tag" {
            $ghArgs = @("release", "create", $tag) + $artifacts.FullName + @("--title", $CommitMessage, "--notes", $CommitMessage)
            if ($Draft) { $ghArgs += "--draft" }
            Invoke-External "gh.exe" $ghArgs
        }
    } else {
        Write-Host "  gh CLI not found - skipping GitHub release creation." -ForegroundColor DarkGray
        Write-Host "  Upload artifacts at: https://github.com/YOUR_USER/spoons-and-forks/releases/new?tag=$tag" -ForegroundColor DarkGray
    }
}

Write-Section "Done"
Write-Host "  v$Version" -ForegroundColor Green
