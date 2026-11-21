param(
    [string]$RepoName = "jlpt-n5-voca-500"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " PRISM NIHONGO N5 (500 Words) - GitHub Repo & Pages Publisher" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check GitHub CLI authentication (auto-prompt browser login if needed)
$authOk = $false
try {
    gh auth status *> $null
    if ($LASTEXITCODE -eq 0) {
        $authOk = $true
    }
} catch {
    $authOk = $false
}

if (-not $authOk) {
    Write-Host "[1/3] GitHub CLI login required. Launching browser authentication..." -ForegroundColor Yellow
    gh auth login --web -h github.com -p https
    if ($LASTEXITCODE -ne 0) {
        Write-Error "GitHub authentication was cancelled or failed."
        exit 1
    }
} else {
    Write-Host "[1/3] GitHub CLI authentication verified." -ForegroundColor Green
}

$Owner = (gh api user --jq ".login").Trim()
if ([string]::IsNullOrWhiteSpace($Owner)) {
    Write-Error "Could not determine GitHub username."
    exit 1
}
Write-Host "      Signed in as: @$Owner" -ForegroundColor Gray

# 2. Create Public Repository & Push main branch (idempotent on re-runs)
Write-Host "[2/3] Creating/updating public repository '$Owner/$RepoName' and pushing 'main'..." -ForegroundColor Cyan
$repoExists = $false
try {
    gh repo view "$Owner/$RepoName" *> $null
    if ($LASTEXITCODE -eq 0) {
        $repoExists = $true
    }
} catch {
    $repoExists = $false
}

if (-not $repoExists) {
    gh repo create $RepoName --public --source=. --remote=origin --push --description "PRISM NIHONGO N5 - Sakura Aurora Glassmorphism JLPT N5 Essential 500 Vocabulary Mini-Game"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to create or push GitHub repository."
        exit 1
    }
} else {
    $remoteUrl = "https://github.com/$Owner/$RepoName.git"
    $existingRemotes = git remote
    if ($existingRemotes -contains "origin") {
        git remote set-url origin $remoteUrl
    } else {
        git remote add origin $remoteUrl
    }
    git push -u origin main
}

# 3. Enable GitHub Pages from main branch root (/)
Write-Host "[3/3] Activating GitHub Pages (branch: main, path: /)..." -ForegroundColor Cyan
try {
    gh api "repos/$Owner/$RepoName/pages" -X POST -f build_type=legacy -f "source[branch]=main" -f "source[path]=/" *> $null
} catch {
    Write-Host "      (GitHub Pages is already enabled or initializing.)" -ForegroundColor DarkGray
}

$RepoUrl = "https://github.com/$Owner/$RepoName"
$PagesUrl = "https://$Owner.github.io/$RepoName/"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host " - GitHub Repository : $RepoUrl" -ForegroundColor White
Write-Host " - GitHub Pages URL  : $PagesUrl" -ForegroundColor Yellow
Write-Host "   (Note: GitHub Pages initial build takes ~30-60 seconds)" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green
