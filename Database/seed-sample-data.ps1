param(
    [string]$Database = "appdb",
    [string]$Host = "localhost",
    [int]$Port = 55432,
    [string]$Username = "appuser",
    [string]$Password = "apppassword",
    [string]$ContainerName = "postgres-db"
)

$ErrorActionPreference = "Stop"

$SqlFile = Join-Path $PSScriptRoot "seed-sample-data.sql"

if (-not (Test-Path $SqlFile)) {
    throw "Seed file not found: $SqlFile"
}

function Invoke-SeedWithPsql {
    Write-Host "Seeding database with local psql..."
    $env:PGPASSWORD = $Password
    & psql -h $Host -p $Port -U $Username -d $Database -v ON_ERROR_STOP=1 -f $SqlFile
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

function Invoke-SeedWithDocker {
    Write-Host "Seeding database through Docker container $ContainerName..."
    Get-Content -Raw $SqlFile | & docker exec -i $ContainerName psql -U $Username -d $Database -v ON_ERROR_STOP=1
}

if (Get-Command psql -ErrorAction SilentlyContinue) {
    Invoke-SeedWithPsql
    return
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Invoke-SeedWithDocker
    return
}

throw "Neither psql nor docker was found. Install PostgreSQL client tools or start the Docker container first."
