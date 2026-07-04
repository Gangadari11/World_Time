# PostgreSQL Docker Setup Script
# File: start-postgres.ps1

$ErrorActionPreference = "Stop"

# Configuration
$containerName = "postgres-db"
$imageName = "postgres:16"

# Use a high port to avoid Windows reserved ports
$hostPort = 55432

$dbUser = "appuser"
$dbPassword = "apppassword"
$dbName = "appdb"

Write-Host ""
Write-Host "========================================="
Write-Host " PostgreSQL Docker Setup"
Write-Host "========================================="
Write-Host ""

# Check Docker
Write-Host "Checking Docker..."

try {
    docker version | Out-Null
}
catch {
    Write-Error "Docker Desktop is not running."
    exit 1
}

# Pull latest image
Write-Host "Pulling PostgreSQL image..."
docker pull $imageName

# Remove existing container if exists
Write-Host ""
Write-Host "Removing old container if exists..."

$existingContainer = docker ps -a --filter "name=$containerName" --format "{{.Names}}"

if ($existingContainer) {
    docker stop $containerName | Out-Null
    docker rm -f $containerName | Out-Null
    Write-Host "Old container removed."
}

# Check if port is already in use
Write-Host ""
Write-Host "Checking port $hostPort..."

$portInUse = netstat -ano | findstr ":$hostPort"

if ($portInUse) {
    Write-Error "Port $hostPort is already in use."
    Write-Host ""
    Write-Host "Try another port like 55433."
    exit 1
}

# Start container
Write-Host ""
Write-Host "Starting PostgreSQL container..."

docker run -d `
    --name $containerName `
    -e POSTGRES_USER=$dbUser `
    -e POSTGRES_PASSWORD=$dbPassword `
    -e POSTGRES_DB=$dbName `
    -p ${hostPort}:5432 `
    $imageName

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start PostgreSQL container."
    exit 1
}

# Wait for PostgreSQL
Write-Host ""
Write-Host "Waiting for PostgreSQL to become ready..."

$maxRetries = 30
$ready = $false

for ($i = 0; $i -lt $maxRetries; $i++) {

    try {
        $result = docker exec $containerName pg_isready -U $dbUser -d $dbName 2>&1

        if ($result -match "accepting connections") {
            $ready = $true
            break
        }
    }
    catch {
        # Ignore startup errors
    }

    Start-Sleep -Seconds 2
}

if (-not $ready) {
    Write-Error "PostgreSQL did not become ready."

    Write-Host ""
    Write-Host "Container logs:"
    docker logs $containerName

    exit 1
}

Write-Host ""
Write-Host "========================================="
Write-Host " PostgreSQL Started Successfully"
Write-Host "========================================="
Write-Host ""

Write-Host "Container : $containerName"
Write-Host "Host      : localhost"
Write-Host "Port      : $hostPort"
Write-Host "Database  : $dbName"
Write-Host "Username  : $dbUser"
Write-Host "Password  : $dbPassword"

Write-Host ""
Write-Host "Connection String:"
Write-Host ""
Write-Host "Host=localhost;Port=$hostPort;Database=$dbName;Username=$dbUser;Password=$dbPassword"
Write-Host ""

Write-Host "Useful Commands:"
Write-Host ""
Write-Host "View logs:"
Write-Host "docker logs $containerName"
Write-Host ""
Write-Host "Stop container:"
Write-Host "docker stop $containerName"
Write-Host ""
Write-Host "Start container again:"
Write-Host "docker start $containerName"
Write-Host ""
Write-Host "Open PostgreSQL shell:"
Write-Host "docker exec -it $containerName psql -U $dbUser -d $dbName"
Write-Host ""