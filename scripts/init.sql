-- Revenue Leak Radar — PostgreSQL Init Script
-- Runs automatically when the PostgreSQL Docker container first starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE revenue_leak_radar TO rlr_user;
