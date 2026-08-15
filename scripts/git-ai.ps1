param(
    [switch]$AddAll,
    [string]$AddPath,
    [switch]$MergeMain,
    [string]$Provider = "groq",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "--- Git AI Automation ---" -ForegroundColor Cyan

# 1. Run AI Commit with Auto-Add options
$env:GIT_AI_PROVIDER = $Provider
$cmdArgs = @("scripts/git-ai.py")

if ($AddAll) { $cmdArgs += "--add-all" }
elseif ($AddPath) {
    $cmdArgs += "--add"
    $cmdArgs += $AddPath
}

if ($DryRun) { $cmdArgs += "--dry-run" }

python $cmdArgs

if ($LASTEXITCODE -ne 0 -or $DryRun) {
    if ($DryRun) { Write-Host "Dry run completed." }
    exit
}

# 2. Push to Preview
Write-Host "Pushing to preview..." -ForegroundColor Yellow
git push origin preview

# 3. Optional Merge to Main
if ($MergeMain) {
    Write-Host "Merging to main..." -ForegroundColor Green
    $currentBranch = git rev-parse --abbrev-ref HEAD

    try {
        git checkout main
        git merge preview --no-edit
        git push origin main
        Write-Host "Successfully merged and pushed to main." -ForegroundColor Green
    }
    finally {
        git checkout $currentBranch
        Write-Host "Returned to $currentBranch."
    }
}

Write-Host "Done!" -ForegroundColor Cyan
