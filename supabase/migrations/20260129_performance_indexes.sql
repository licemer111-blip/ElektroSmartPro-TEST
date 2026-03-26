-- =====================================================
-- Performance Indexes Migration
-- Created: 2026-01-29
-- Purpose: Add missing indexes for query optimization
-- =====================================================

-- =====================================================
-- 1. PROJECT_ITEMS - Critical! Most queried table without indexes
-- =====================================================

-- Basic lookup by project
CREATE INDEX IF NOT EXISTS idx_project_items_project_id 
  ON project_items(project_id);

-- Sort order within project
CREATE INDEX IF NOT EXISTS idx_project_items_sort_order 
  ON project_items(project_id, sort_order);

-- Parent assembly lookups
CREATE INDEX IF NOT EXISTS idx_project_items_parent_assembly 
  ON project_items(parent_assembly_id) 
  WHERE parent_assembly_id IS NOT NULL;

-- Catalog item reference
CREATE INDEX IF NOT EXISTS idx_project_items_catalog_item 
  ON project_items(catalog_item_id) 
  WHERE catalog_item_id IS NOT NULL;

-- =====================================================
-- 2. PROJECTS - Composite indexes for common queries
-- =====================================================

-- User's projects by status (dashboard)
CREATE INDEX IF NOT EXISTS idx_projects_user_status 
  ON projects(user_id, status);

-- User's projects sorted by creation date
CREATE INDEX IF NOT EXISTS idx_projects_user_created 
  ON projects(user_id, created_at DESC);

-- Team projects by status
CREATE INDEX IF NOT EXISTS idx_projects_team_status 
  ON projects(team_id, status) 
  WHERE team_id IS NOT NULL;

-- =====================================================
-- 3. CATALOG_ITEMS - Composite indexes for filters
-- =====================================================

-- User's items by visibility
CREATE INDEX IF NOT EXISTS idx_catalog_items_user_visibility 
  ON catalog_items(user_id, visibility) 
  WHERE user_id IS NOT NULL;

-- Team items lookup
CREATE INDEX IF NOT EXISTS idx_catalog_items_team_visibility 
  ON catalog_items(team_id, visibility) 
  WHERE team_id IS NOT NULL AND visibility = 'team';

-- Category + type + name for sorted listings
CREATE INDEX IF NOT EXISTS idx_catalog_items_category_type_name 
  ON catalog_items(category_id, type, is_active, name) 
  WHERE is_active = true;

-- Global items by category (for faster global catalog)
CREATE INDEX IF NOT EXISTS idx_catalog_items_global_category 
  ON catalog_items(category_id, type, name) 
  WHERE user_id IS NULL AND is_active = true;

-- =====================================================
-- 4. PROJECT_MEMBERS - Composite indexes
-- =====================================================

-- Full membership lookup
CREATE INDEX IF NOT EXISTS idx_project_members_project_user_status 
  ON project_members(project_id, user_id, status);

-- User's memberships
CREATE INDEX IF NOT EXISTS idx_project_members_user_status 
  ON project_members(user_id, status);

-- =====================================================
-- 5. TEAM_MEMBERS - Composite indexes
-- =====================================================

-- User's active team memberships
CREATE INDEX IF NOT EXISTS idx_team_members_user_status 
  ON team_members(user_id, status);

-- Full membership check
CREATE INDEX IF NOT EXISTS idx_team_members_team_user_status 
  ON team_members(team_id, user_id, status);

-- =====================================================
-- 6. USER_ASSEMBLIES - Composite indexes
-- =====================================================

-- User's assemblies by visibility and creation
CREATE INDEX IF NOT EXISTS idx_user_assemblies_user_visibility_created 
  ON user_assemblies(user_id, visibility, created_at DESC);

-- =====================================================
-- 7. CATALOG_CATEGORIES - Sorting
-- =====================================================

-- Sort order for category listings
CREATE INDEX IF NOT EXISTS idx_catalog_categories_sort_order 
  ON catalog_categories(sort_order);

-- =====================================================
-- 8. HIDDEN/FAVORITE CATALOG ITEMS - Composite lookups
-- =====================================================

-- Efficient EXISTS checks for hidden items
CREATE INDEX IF NOT EXISTS idx_hidden_catalog_items_user_item 
  ON hidden_catalog_items(user_id, catalog_item_id);

-- Efficient EXISTS checks for favorite items
CREATE INDEX IF NOT EXISTS idx_favorite_catalog_items_user_item 
  ON favorite_catalog_items(user_id, catalog_item_id);

-- =====================================================
-- 9. TIME_ENTRIES - Performance for time tracking
-- =====================================================

-- User's time entries by created_at
CREATE INDEX IF NOT EXISTS idx_time_entries_user_created 
  ON time_entries(user_id, created_at DESC);

-- Project time entries
CREATE INDEX IF NOT EXISTS idx_time_entries_project 
  ON time_entries(project_id) 
  WHERE project_id IS NOT NULL;

-- =====================================================
-- 10. ACTIVITY_LOGS - Performance for activity feed
-- =====================================================

-- Project activity by time
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_time 
  ON activity_logs(project_id, created_at DESC);

-- User activity
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_time 
  ON activity_logs(user_id, created_at DESC);

-- =====================================================
-- 11. TEAM_MESSAGES - Chat performance
-- =====================================================

-- Team messages by time
CREATE INDEX IF NOT EXISTS idx_team_messages_team_time 
  ON team_messages(team_id, created_at DESC);

-- =====================================================
-- Analyze tables to update statistics
-- =====================================================

ANALYZE project_items;
ANALYZE projects;
ANALYZE catalog_items;
ANALYZE project_members;
ANALYZE team_members;
ANALYZE user_assemblies;
