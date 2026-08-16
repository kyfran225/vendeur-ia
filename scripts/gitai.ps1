param(
    [switch]$AddAll,
    [switch]$MergeMain,
    [string]$Provider = "groq",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "--- Git AI Automation (Stable Version) ---" -ForegroundColor Cyan

$env:GIT_AI_PROVIDER = $Provider
$cmdArgs = @("scripts/gitai.py")

if ($AddAll) { $cmdArgs += "--add-all" }
if ($DryRun) { $cmdArgs += "--dry-run" }

# 1. Run AI Commit
python $cmdArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "Le processus de commit a été ignoré ou a échoué." -ForegroundColor Yellow
}

# 2. Push to Preview
if (-not $DryRun) {
    Write-Host "`nPushing to preview..." -ForegroundColor Yellow
    git push origin preview
}

# 3. Optional Merge to Main
if ($MergeMain -and -not $DryRun) {
    Write-Host "`nMerging to main..." -ForegroundColor Green
    $currentBranch = git rev-parse --abbrev-ref HEAD

    try {
        git checkout main
        # Merge simple
        git merge preview --no-edit
        git push origin main
        Write-Host "Fusion et push sur main terminés avec succès." -ForegroundColor Green
    }
    catch {
        Write-Host "Échec de la fusion sur main. Vérifiez les conflits." -ForegroundColor Red
    }
    finally {
        git checkout $currentBranch
        Write-Host "Retour sur la branche $currentBranch."
    }
}

Write-Host "`nTerminé !" -ForegroundColor Cyan
