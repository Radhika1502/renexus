# Manual Migration Script for Renexus Monorepo Restructuring
# This script will copy files from the old structure to the new monorepo structure

$rootDir = "C:\Users\HP\Renexus"

# Create necessary directories if they don't exist
Write-Host "Creating directory structure..."

$directories = @(
    "apps\frontend\web\pages",
    "apps\frontend\web\public",
    "apps\frontend\web\src",
    "apps\backend\api\src",
    "apps\backend\auth\src",
    "apps\backend\notifications\src",
    "apps\backend\tasks\src",
    "packages\database\src\models",
    "packages\shared\types\src",
    "packages\shared\utils\src",
    "packages\ui\src\components"
)

foreach ($dir in $directories) {
    $fullPath = Join-Path -Path $rootDir -ChildPath $dir
    if (-not (Test-Path -Path $fullPath)) {
        New-Item -Path $fullPath -ItemType Directory -Force | Out-Null
        Write-Host "Created directory: $dir"
    }
}

# Copy frontend files
Write-Host "Copying frontend files..."

# Copy frontend web files
Copy-Item -Path "$rootDir\frontend\web\pages\*" -Destination "$rootDir\apps\frontend\web\pages\" -Recurse -Force
Copy-Item -Path "$rootDir\frontend\web\public\*" -Destination "$rootDir\apps\frontend\web\public\" -Recurse -Force
Copy-Item -Path "$rootDir\frontend\web\src\*" -Destination "$rootDir\apps\frontend\web\src\" -Recurse -Force
Copy-Item -Path "$rootDir\frontend\web\package.json" -Destination "$rootDir\apps\frontend\web\" -Force
Copy-Item -Path "$rootDir\frontend\web\tsconfig.json" -Destination "$rootDir\apps\frontend\web\" -Force
Copy-Item -Path "$rootDir\frontend\web\next.config.js" -Destination "$rootDir\apps\frontend\web\" -Force -ErrorAction SilentlyContinue

# Copy backend files
Write-Host "Copying backend files..."

# Copy backend API files
Copy-Item -Path "$rootDir\backend\api\src\*" -Destination "$rootDir\apps\backend\api\src\" -Recurse -Force
Copy-Item -Path "$rootDir\backend\api\package.json" -Destination "$rootDir\apps\backend\api\" -Force
Copy-Item -Path "$rootDir\backend\api\tsconfig.json" -Destination "$rootDir\apps\backend\api\" -Force -ErrorAction SilentlyContinue

# Copy auth service files
Copy-Item -Path "$rootDir\backend\auth-service\*" -Destination "$rootDir\apps\backend\auth\" -Recurse -Force

# Copy notification service files
Copy-Item -Path "$rootDir\backend\notification-service\*" -Destination "$rootDir\apps\backend\notifications\" -Recurse -Force

# Copy task service files
Copy-Item -Path "$rootDir\backend\task-service\*" -Destination "$rootDir\apps\backend\tasks\" -Recurse -Force

# Copy shared packages
Write-Host "Copying shared packages..."

# Copy database files
Copy-Item -Path "$rootDir\backend\database\*" -Destination "$rootDir\packages\database\src\" -Recurse -Force
Copy-Item -Path "$rootDir\prisma\*" -Destination "$rootDir\packages\database\src\models\" -Recurse -Force -ErrorAction SilentlyContinue

# Copy shared types
Copy-Item -Path "$rootDir\shared\types\*" -Destination "$rootDir\packages\shared\types\src\" -Recurse -Force

# Copy shared utils
Copy-Item -Path "$rootDir\shared\utils\*" -Destination "$rootDir\packages\shared\utils\src\" -Recurse -Force

# Copy shared config
Copy-Item -Path "$rootDir\shared\config\*" -Destination "$rootDir\packages\shared\config\src\" -Recurse -Force

# Create package.json files for packages
Write-Host "Creating package.json files for packages..."

$packageDirs = @(
    "packages\database",
    "packages\shared\api-client",
    "packages\shared\config",
    "packages\shared\types",
    "packages\shared\utils",
    "packages\ui"
)

foreach ($dir in $packageDirs) {
    $packagePath = Join-Path -Path $rootDir -ChildPath "$dir\package.json"
    
    if (-not (Test-Path -Path $packagePath)) {
        $packageName = "@renexus/$($dir.Replace('packages\', '').Replace('\', '-'))"
        
        $packageJson = @{
            name = $packageName
            version = "0.1.0"
            private = $true
            main = "dist/index.js"
            types = "dist/index.d.ts"
            scripts = @{
                build = "tsc"
                clean = "rimraf dist"
                dev = "tsc --watch"
                lint = "eslint src --ext .ts,.tsx"
            }
            dependencies = @{}
            devDependencies = @{}
        } | ConvertTo-Json -Depth 4
        
        Set-Content -Path $packagePath -Value $packageJson
        Write-Host "Created package.json for: $dir"
    }
}

# Create root package.json for monorepo
Write-Host "Creating root package.json..."

$rootPackagePath = Join-Path -Path $rootDir -ChildPath "package.json"
$rootPackage = @{
    name = "renexus"
    private = $true
    workspaces = @(
        "apps/*",
        "packages/*",
        "packages/shared/*"
    )
    scripts = @{
        build = "turbo run build"
        dev = "turbo run dev"
        lint = "turbo run lint"
        clean = "turbo run clean"
    }
}

$rootPackageJson = $rootPackage | ConvertTo-Json -Depth 4
Set-Content -Path $rootPackagePath -Value $rootPackageJson
Write-Host "Created root package.json"

# Create tsconfig.json files
Write-Host "Creating tsconfig files..."

$baseTsConfigPath = Join-Path -Path $rootDir -ChildPath "tsconfig.base.json"
$baseTsConfig = @{
    compilerOptions = @{
        target = "es2018"
        module = "commonjs"
        declaration = $true
        strict = $true
        esModuleInterop = $true
        skipLibCheck = $true
        forceConsistentCasingInFileNames = $true
        paths = @{
            "@apps/backend/*" = @("apps/backend/*")
            "@apps/frontend/*" = @("apps/frontend/*")
            "@packages/database" = @("packages/database/src")
            "@packages/shared/api-client" = @("packages/shared/api-client/src")
            "@packages/shared/config" = @("packages/shared/config/src")
            "@packages/shared/types" = @("packages/shared/types/src")
            "@packages/shared/utils" = @("packages/shared/utils/src")
            "@packages/ui" = @("packages/ui/src")
        }
    }
} | ConvertTo-Json -Depth 4

Set-Content -Path $baseTsConfigPath -Value $baseTsConfig
Write-Host "Created base tsconfig.json"

Write-Host "Directory restructuring completed successfully!"
