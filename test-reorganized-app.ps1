# Test Reorganized Application Script
# This script will test if the application still works correctly after reorganization

Write-Host "Starting Renexus Application Test..." -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan

# Define paths
$rootPath = "c:\Users\HP\Renexus"
$backendPath = "$rootPath\backend"
$frontendPath = "$rootPath\frontend"
$sharedPath = "$rootPath\shared"
$logPath = "$rootPath\reorganization_test_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Create log file
"Renexus Reorganization Test Log - $(Get-Date)" | Out-File -FilePath $logPath -Force

# Function to log messages
function Write-Log {
    param (
        [string]$Message,
        [string]$Type = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Type] $Message"
    $logMessage | Out-File -FilePath $logPath -Append
    
    switch ($Type) {
        "INFO" { Write-Host $Message -ForegroundColor White }
        "SUCCESS" { Write-Host $Message -ForegroundColor Green }
        "WARNING" { Write-Host $Message -ForegroundColor Yellow }
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        default { Write-Host $Message }
    }
}

# Function to test if a directory exists
function Test-DirectoryStructure {
    param (
        [string]$Path,
        [string]$Description
    )
    
    if (Test-Path -Path $Path -PathType Container) {
        Write-Log "$Description directory exists at: $Path" "SUCCESS"
        return $true
    } else {
        Write-Log "$Description directory not found at: $Path" "ERROR"
        return $false
    }
}

# Function to test if npm packages are installed
function Test-NpmPackages {
    try {
        Write-Log "Testing npm packages installation..." "INFO"
        $output = npm list --depth=0 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "npm packages are installed correctly" "SUCCESS"
            return $true
        } else {
            Write-Log "npm packages may have issues: $output" "WARNING"
            return $false
        }
    }
    catch {
        Write-Log "Error checking npm packages: $_" "ERROR"
        return $false
    }
}

# Function to test TypeScript compilation
function Test-TypeScriptCompilation {
    try {
        Write-Log "Testing TypeScript compilation..." "INFO"
        
        # Try to compile TypeScript files
        $output = npx tsc --noEmit 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "TypeScript compilation successful" "SUCCESS"
            return $true
        } else {
            Write-Log "TypeScript compilation errors: $output" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Error during TypeScript compilation: $_" "ERROR"
        return $false
    }
}

# Function to test backend server startup
function Test-BackendServer {
    try {
        Write-Log "Testing backend server startup..." "INFO"
        
        # Start backend server in a new process
        $process = Start-Process -FilePath "node" -ArgumentList "$backendPath\simple-server.js" -PassThru -NoNewWindow
        
        # Wait a bit for server to start
        Start-Sleep -Seconds 5
        
        # Check if process is still running
        if (-not $process.HasExited) {
            Write-Log "Backend server started successfully" "SUCCESS"
            
            # Try to access the server
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5
                Write-Log "Backend server responded with status code: $($response.StatusCode)" "SUCCESS"
            }
            catch {
                Write-Log "Could not connect to backend server: $_" "WARNING"
            }
            
            # Stop the server
            Stop-Process -Id $process.Id -Force
            return $true
        } else {
            Write-Log "Backend server failed to start" "ERROR"
            return $false
        }
    }
    catch {
        Write-Log "Error testing backend server: $_" "ERROR"
        return $false
    }
}

# Function to check for import path issues
function Test-ImportPaths {
    param (
        [string]$Directory
    )
    
    Write-Log "Checking for import path issues in $Directory..." "INFO"
    
    $fileCount = 0
    $errorCount = 0
    
    # Get all TypeScript/JavaScript files
    $files = Get-ChildItem -Path $Directory -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx"
    
    foreach ($file in $files) {
        $fileCount++
        $content = Get-Content -Path $file.FullName -Raw
        
        # Look for common import path patterns that might be broken
        if ($content -match "import .* from ['\"]\.\.\/((?!\.\.\/shared).+)['\"];") {
            Write-Log "Potential import path issue in $($file.FullName)" "WARNING"
            $errorCount++
        }
    }
    
    Write-Log "Checked $fileCount files, found $errorCount potential import path issues" "INFO"
    
    if ($errorCount -gt 0) {
        return $false
    } else {
        return $true
    }
}

# Main test sequence
Write-Log "Starting tests for reorganized Renexus application" "INFO"

# Test directory structure
$structureOk = $true
$structureOk = $structureOk -and (Test-DirectoryStructure -Path $backendPath -Description "Backend")
$structureOk = $structureOk -and (Test-DirectoryStructure -Path $frontendPath -Description "Frontend")
$structureOk = $structureOk -and (Test-DirectoryStructure -Path $sharedPath -Description "Shared")

if ($structureOk) {
    Write-Log "Directory structure test passed" "SUCCESS"
} else {
    Write-Log "Directory structure test failed" "ERROR"
}

# Test npm packages
$npmOk = Test-NpmPackages
if ($npmOk) {
    Write-Log "npm packages test passed" "SUCCESS"
} else {
    Write-Log "npm packages test failed" "WARNING"
}

# Test TypeScript compilation
$tsOk = Test-TypeScriptCompilation
if ($tsOk) {
    Write-Log "TypeScript compilation test passed" "SUCCESS"
} else {
    Write-Log "TypeScript compilation test failed" "ERROR"
}

# Test import paths
$backendImportsOk = Test-ImportPaths -Directory $backendPath
$frontendImportsOk = Test-ImportPaths -Directory $frontendPath
$sharedImportsOk = Test-ImportPaths -Directory $sharedPath

if ($backendImportsOk -and $frontendImportsOk -and $sharedImportsOk) {
    Write-Log "Import paths test passed" "SUCCESS"
} else {
    Write-Log "Import paths test failed - manual review recommended" "WARNING"
}

# Test backend server
$backendOk = Test-BackendServer
if ($backendOk) {
    Write-Log "Backend server test passed" "SUCCESS"
} else {
    Write-Log "Backend server test failed" "ERROR"
}

# Summary
Write-Host ""
Write-Host "Test Summary:" -ForegroundColor Cyan
Write-Host "------------------------------------------" -ForegroundColor Cyan
Write-Host "Directory Structure: $(if ($structureOk) { "PASSED" } else { "FAILED" })" -ForegroundColor $(if ($structureOk) { "Green" } else { "Red" })
Write-Host "npm Packages: $(if ($npmOk) { "PASSED" } else { "WARNING" })" -ForegroundColor $(if ($npmOk) { "Green" } else { "Yellow" })
Write-Host "TypeScript Compilation: $(if ($tsOk) { "PASSED" } else { "FAILED" })" -ForegroundColor $(if ($tsOk) { "Green" } else { "Red" })
Write-Host "Import Paths: $(if ($backendImportsOk -and $frontendImportsOk -and $sharedImportsOk) { "PASSED" } else { "WARNING" })" -ForegroundColor $(if ($backendImportsOk -and $frontendImportsOk -and $sharedImportsOk) { "Green" } else { "Yellow" })
Write-Host "Backend Server: $(if ($backendOk) { "PASSED" } else { "FAILED" })" -ForegroundColor $(if ($backendOk) { "Green" } else { "Red" })
Write-Host ""

# Final result
if ($structureOk -and $npmOk -and $tsOk -and $backendImportsOk -and $frontendImportsOk -and $sharedImportsOk -and $backendOk) {
    Write-Host "Overall Test Result: PASSED" -ForegroundColor Green
    Write-Log "All tests passed. The reorganized application appears to be working correctly." "SUCCESS"
} else {
    Write-Host "Overall Test Result: FAILED" -ForegroundColor Red
    Write-Log "Some tests failed. Manual review and fixes may be required." "ERROR"
    
    # Provide recommendations
    Write-Host ""
    Write-Host "Recommendations:" -ForegroundColor Yellow
    
    if (-not $structureOk) {
        Write-Host "- Check that all directories were created correctly" -ForegroundColor Yellow
    }
    
    if (-not $npmOk) {
        Write-Host "- Run 'npm install' to reinstall dependencies" -ForegroundColor Yellow
    }
    
    if (-not $tsOk) {
        Write-Host "- Fix TypeScript compilation errors, likely due to incorrect import paths" -ForegroundColor Yellow
    }
    
    if (-not ($backendImportsOk -and $frontendImportsOk -and $sharedImportsOk)) {
        Write-Host "- Review import paths in the codebase and update them manually" -ForegroundColor Yellow
    }
    
    if (-not $backendOk) {
        Write-Host "- Check backend server configuration and dependencies" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Log file created at: $logPath" -ForegroundColor Cyan
