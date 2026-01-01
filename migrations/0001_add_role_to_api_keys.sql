-- Migration: Add role column to api_keys table
-- Description: Adds role field to api_keys for RBAC (Role-Based Access Control)

ALTER TABLE api_keys ADD COLUMN role TEXT DEFAULT 'read' CHECK(role IN ('admin', 'write', 'read'));
