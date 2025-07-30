-- Database initialization script for HireOverseas Marketplace
-- This script runs when the PostgreSQL container is first created

-- Create additional databases for different environments
CREATE DATABASE hireoverseas_test;
CREATE DATABASE hireoverseas_staging;

-- Create a dedicated user for the application
CREATE USER hireoverseas_user WITH PASSWORD 'hireoverseas_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hireoverseas TO hireoverseas_user;
GRANT ALL PRIVILEGES ON DATABASE hireoverseas_test TO hireoverseas_user;
GRANT ALL PRIVILEGES ON DATABASE hireoverseas_staging TO hireoverseas_user;

-- Enable required extensions
\c hireoverseas;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

\c hireoverseas_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

\c hireoverseas_staging;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";