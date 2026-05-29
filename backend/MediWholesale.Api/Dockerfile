FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY MediWholesale.sln ./
COPY backend/MediWholesale.Domain/MediWholesale.Domain.csproj backend/MediWholesale.Domain/
COPY backend/MediWholesale.Infrastructure/MediWholesale.Infrastructure.csproj backend/MediWholesale.Infrastructure/
COPY backend/MediWholesale.Api/MediWholesale.Api.csproj backend/MediWholesale.Api/
RUN dotnet restore backend/MediWholesale.Api/MediWholesale.Api.csproj
COPY backend/ backend/
RUN dotnet publish backend/MediWholesale.Api/MediWholesale.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "MediWholesale.Api.dll"]
