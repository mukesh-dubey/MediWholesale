# MediWholesale

End-to-end wholesale medicine supply platform for India — inventory, B2B customers (hospitals, clinics, medical stores), sales orders, and GST-ready billing foundation.

## Architecture

| Layer | Technology |
|-------|------------|
| Staff portal | Angular 21 + Material |
| Customer portal | Same app, role-based routes (`/portal`) |
| API | ASP.NET Core 10 Web API + JWT |
| Database | SQL Server + EF Core |

## Quick start (local)

### 1. SQL Server

Use Docker:

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Your_strong_password123" -p 1433:1433 -d mcr.microsoft.com/mssql/server:2022-latest
```

### 2. API

```bash
cd backend/MediWholesale.Api
dotnet run
```

API: http://localhost:5152 — Swagger: http://localhost:5152/swagger

Database is migrated and seeded on startup.

### 3. Web app

```bash
cd frontend/medi-wholesale-web
npm start
```

App: http://localhost:4200

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mediwholesale.in | Admin@123 |
| Staff | staff@mediwholesale.in | Staff@123 |
| Customer (hospital) | customer@cityhospital.in | Customer@123 |

## Cloud deploy (Docker Compose)

From repo root:

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Web | http://localhost |
| API | http://localhost:5152 |
| SQL Server | localhost:1433 |

**Before production:** change SQL password, JWT key, and seed passwords in `Infrastructure/Seed/DbSeeder.cs`.

## Project structure

```
MediWholesale/
├── backend/
│   ├── MediWholesale.Domain/      # Entities, enums
│   ├── MediWholesale.Infrastructure/  # EF Core, Identity, seed
│   └── MediWholesale.Api/         # REST controllers
├── frontend/medi-wholesale-web/   # Angular staff + customer UI
└── docker-compose.yml
```

## Roadmap (next phases)

- [ ] GST tax invoices with PDF print
- [ ] FEFO batch allocation on dispatch
- [ ] Purchase orders & GRN
- [ ] Payment ledger & outstanding reports
- [ ] Azure/AWS deploy templates (App Service + Azure SQL)
