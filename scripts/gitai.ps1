param(
    [switch]$AddAll,
    [string]$AddPath,
    [switch]$MergeMain,
    [string]$Provider = "groq",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "--- Git AI Automation ---" -ForegroundColor Cyan

# 1. Run AI Commit (Staging + AI Message + Commit)
# If no changes are present, it will just return silently
$env:GIT_AI_PROVIDER = $Provider
$cmdArgs = @("scripts/gitai.py")

if ($AddAll) { $cmdArgs += "--add-all" }
elseif ($AddPath) {
    $cmdArgs += "--add"
    $cmdArgs += $AddPath
}

if ($DryRun) { $cmdArgs += "--dry-run" }

python $cmdArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error during AI commit process." -ForegroundColor Red
    exit
}

# 2. Push to Preview (Only if not a dry run)
if (-not $DryRun) {
    Write-Host "Pushing to preview..." -ForegroundColor Yellow
    git push origin preview
}

# 3. Optional Merge to Main
if ($MergeMain -and -not $DryRun) {
    Write-Host "Merging to main..." -ForegroundColor Green
    $currentBranch = git rev-parse --abbrev-ref HEAD

    try {
        git checkout main
        git merge preview --no-edit
        git push origin main
        Write-Host "Successfully merged and pushed to main." -ForegroundColor Green
    }
    catch {
        Write-Host "Merge to main failed. Please check for conflicts." -ForegroundColor Red
    }
    finally {
        git checkout $currentBranch
        Write-Host "Returned to $currentBranch."
    }
}

Write-Host "Done!" -ForegroundColor Cyan
