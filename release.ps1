<#
.SYNOPSIS
  Builds the Tauri desktop installer and publishes a new GitHub release.

.DESCRIPTION
  1. Updates the version across package.json, src-tauri/Cargo.toml, and src-tauri/tauri.conf.json.
  2. Initializes a git repo (if needed), commits, and pushes to GitHub.
  3. Builds the Tauri installer (MSI/NSIS on Windows, .dmg/.AppImage on Linux/macOS).
  4. Creates (or updates) a GitHub release tagged with the version and attaches the installers.

.PARAMETER Version
  The semantic version to release (e.g. "0.2.0"). REQUIRED.

.PARAMETER Message
  Optional release notes / commit message. Defaults to "Release v$Version".

.PARAMETER Remote
  Git remote name. Defaults to "origin".

.PARAMETER Branch
  Branch to push to. Defaults to "main".

.PARAMETER SkipPush
  Skip the git push step (useful for testing the build locally).

.PARAMETER SkipBuild
  Skip the Tauri build step (useful when only committing version bumps).

.PARAMETER Draft
  Create the GitHub release as a draft (not publicly visible).

.EXAMPLE
  .\release.ps1 -Version "0.2.0"
.EXAMPLE
  .\release.ps1 -Version "0.3.0-beta.1" -Message "Beta release" -Draft
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Version,

    [string]$Message,

    [string]$Remote = "origin",

    [string]$Branch = "main",

    [switch]$SkipPush,

    [switch]$SkipBuild,

    [switch]$Draft
)

$ErrorActionPreference = "Stop"

# Resolve the project root: start at the script's own directory and walk up
# until we find package.json. This makes the script runnable from anywhere.
$ProjectRoot = $PSScriptRoot
while ($ProjectRoot -and -not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
    $parent = Split-Path -Parent $ProjectRoot
    if ($parent -eq $ProjectRoot) { $ProjectRoot = $null; break }
    $ProjectRoot = $parent
}
if (-not $ProjectRoot) {
    throw "Could not locate project root (no package.json found in '$PSScriptRoot' or any parent directory)."
}
Set-Location $ProjectRoot

# ---- Helpers ----------------------------------------------------------------

function Write-Section($title) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

function Update-VersionInFile($path, $pattern, $replacement) {
    if (-not (Test-Path $path)) {
        throw "File not found: $path"
    }
    $content = Get-Content $path -Raw
    if ($content -notmatch $pattern) {
        throw "Pattern not found in $path : $pattern"
    }
    $newContent = $content -replace $pattern, $replacement
    Set-Content -Path $path -Value $newContent -NoNewline
    Write-Host "  updated  $path" -ForegroundColor Green
}

function Assert-Command($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $cmd. Please install it and retry."
    }
}

# ---- Preflight --------------------------------------------------------------

Write-Section "Preflight"

Assert-Command "node"
Assert-Command "npm"
Assert-Command "git"
Assert-Command "cargo"

if ($Version -notmatch '^\d+\.\d+\.\d+(-[A-Za-z0-9.-]+)?$') {
    throw "Version '$Version' is not a valid semver (e.g. 1.2.3 or 1.2.3-rc.1)"
}

if (-not $Message) {
    $Message = "Release v$Version"
}

Write-Host "  version   $Version" -ForegroundColor White
Write-Host "  message   $Message" -ForegroundColor White
Write-Host "  root      $ProjectRoot" -ForegroundColor White
Write-Host "  remote    $Remote" -ForegroundColor White
Write-Host "  branch    $Branch" -ForegroundColor White

# ---- Step 1: Bump version across manifests ---------------------------------

Write-Section "1/5  Bumping version to $Version"

Update-VersionInFile "package.json"            '"version"\s*:\s*"[^"]+"' "`"version`": `"$Version`""
Update-VersionInFile "src-tauri/Cargo.toml"     '(?m)^version\s*=\s*"[^"]+"' "version = `"$Version`""
Update-VersionInFile "src-tauri/tauri.conf.json" '"version"\s*:\s*"[^"]+"' "`"version`": `"$Version`""

# ---- Step 2: Ensure bundle is enabled for installer build ------------------

Write-Section "2/5  Verifying Tauri bundle config"

$tauriConf = Get-Content "src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json
if (-not $tauriConf.bundle.active) {
    Write-Host "  enabling bundle in tauri.conf.json (was disabled for dev)" -ForegroundColor Yellow
    Update-VersionInFile "src-tauri/tauri.conf.json" '"active"\s*:\s*false' '"active": true'
}

# Ensure icon list points at the full generated set (regardless of bundle state)
$iconReplacement = @'
"icon": [
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ]
'@
$confPath = "src-tauri/tauri.conf.json"
$confContent = Get-Content $confPath -Raw
if ($confContent -match '"icon"\s*:\s*\[[^\]]*\]') {
    $confContent = $confContent -replace '"icon"\s*:\s*\[[^\]]*\]', $iconReplacement
    Set-Content -Path $confPath -Value $confContent -NoNewline
    Write-Host "  updated  $confPath (icon list)" -ForegroundColor Green
}

# ---- Step 2b: Regenerate ALL icons from the canonical source.png -----------
# This guarantees icon.ico, .icns, 32x32.png, 128x128.png, 128x128@2x.png and
# every platform variant are all derived from src-tauri/icons/source.png so
# they always match the brand. Run only when we're actually building.
$sourceIcon = "src-tauri/icons/source.png"
if (-not $SkipBuild) {
    Write-Section "2b   Regenerating icons from source.png"
    if (Test-Path $sourceIcon) {
        Write-Host "  source  $sourceIcon" -ForegroundColor White
        npx tauri icon $sourceIcon
        if ($LASTEXITCODE -ne 0) {
            throw "tauri icon generation failed (exit $LASTEXITCODE)"
        }
        Write-Host "  icons regenerated" -ForegroundColor Green
    } else {
        Write-Host "  no $sourceIcon found -- skipping (icons unchanged)" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  skipping icon regen (--SkipBuild)" -ForegroundColor DarkGray
}

# ---- Step 3: Install + Build ------------------------------------------------

if (-not $SkipBuild) {
    Write-Section "3/5  Installing dependencies"
    npm install

    Write-Section "4/5  Building Tauri installer"
    npm run tauri build

    Write-Section "4b   Building Android APK/AAB"
    npx tauri android build
} else {
    Write-Section "3/5  Skipping install (--SkipBuild)"
    Write-Section "4/5  Skipping Tauri build (--SkipBuild)"
    Write-Section "4b   Skipping Android build (--SkipBuild)"
}

# Locate the built bundles
# Desktop: src-tauri/target/release/bundle
# Android: src-tauri/gen/android/app/build/outputs/
$bundleRoot = Join-Path $ProjectRoot "src-tauri/target/release/bundle"
$androidRoot = Join-Path $ProjectRoot "src-tauri/gen/android/app/build/outputs"
$artifacts = @()
if (Test-Path $bundleRoot) {
    $artifacts += Get-ChildItem -Path $bundleRoot -Recurse -File -Include "*.msi","*.exe","*.nsis","*.dmg","*.AppImage","*.deb","*.app" -ErrorAction SilentlyContinue
}
if (Test-Path $androidRoot) {
    $artifacts += Get-ChildItem -Path $androidRoot -Recurse -File -Include "*.apk","*.aab" -ErrorAction SilentlyContinue
}

if ($artifacts.Count -gt 0) {
    Write-Section "Build artifacts"
    foreach ($a in $artifacts) {
        $rel = $a.FullName.Substring($ProjectRoot.Length + 1)
        Write-Host "  $rel  ($([math]::Round($a.Length / 1MB, 2)) MB)" -ForegroundColor White
    }
} else {
    Write-Host "  (no installer artifacts found under $bundleRoot)" -ForegroundColor DarkGray
}

# ---- Step 5: Git commit / push / GitHub release -----------------------------

Write-Section "5/5  Committing and publishing"

if (-not (Test-Path ".git")) {
    Write-Host "  initializing git repository" -ForegroundColor Yellow
    git init *> $null
    git checkout -b $Branch *> $null
}

# Make sure the remote exists; if not, add it (user must provide via env or edit script)
$remotes = git remote
if ($remotes -notcontains $Remote) {
    $repoUrl = $env:GITHUB_REPO_URL
    if (-not $repoUrl) {
        throw "Git remote '$Remote' is not configured. Set `$env:GITHUB_REPO_URL = 'https://github.com/USER/REPO.git' and retry."
    }
    Write-Host "  adding remote $Remote -> $repoUrl" -ForegroundColor Yellow
    git remote add $Remote $repoUrl
}

git add -A

# Skip the commit if there are no staged changes
$diff = git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m $Message
} else {
    Write-Host "  no staged changes to commit" -ForegroundColor DarkGray
}

if (-not $SkipPush) {
    Write-Host "  pushing to $Remote/$Branch" -ForegroundColor Yellow
    git push $Remote $Branch
} else {
    Write-Host "  skipped push (--SkipPush)" -ForegroundColor DarkGray
}

# Optionally create a GitHub release with the installer artifacts
$tag = "v$Version"
if ($artifacts.Count -gt 0 -and (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Section "Creating GitHub release $tag"
    $ghArgs = @("release", "create", $tag) + $artifacts.FullName + @("--title", $Message, "--notes", $Message)
    if ($Draft) { $ghArgs += "--draft" }
    & gh @ghArgs
} elseif ($artifacts.Count -gt 0) {
    Write-Host "  gh CLI not found - skipping GitHub release creation." -ForegroundColor DarkGray
    Write-Host "  Manually upload artifacts to: https://github.com/$(git config --get remote.$Remote.url | Select-String 'github.com[:/](.+?)(?:\.git)?$' | ForEach-Object { $_.Matches[0].Groups[1].Value })/releases/new?tag=$tag" -ForegroundColor DarkGray
}

Write-Section "Done"
Write-Host "  Released v$Version" -ForegroundColor Green
