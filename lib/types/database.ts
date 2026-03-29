// Database Types for ElektroSmart PRO

export type ProjectStatus = "draft" | "final" | "archived";

// CRM Types
export type ClientType = "individual" | "company";
export type ClientSource = "referral" | "website" | "cold_call" | "other";

export interface Client {
  id: string;
  user_id: string;
  team_id?: string | null;
  name: string;
  company_name?: string | null;
  type: ClientType;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  nip?: string | null;
  regon?: string | null;
  tags: string[];
  notes?: string | null;
  source?: ClientSource | null;
  total_projects: number;
  total_revenue: number;
  last_project_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientWithProjects extends Client {
  projects?: ProjectWithRelations[];
}

export type FeedbackType = "bug" | "feature" | "contact";
export type FeedbackStatus = "new" | "read" | "archived";

// V4.0: Co-pilot Mode Types
export type ProjectMemberRole = "owner" | "editor" | "viewer";
export type ProjectMemberStatus = "pending" | "active" | "declined";

// Team Data Sharing Types
export type DataVisibility = "personal" | "team";
export type TeamRole = "admin" | "kierownik" | "elektryk";

// Market Intelligence Types
export type ConfidenceLevel = "low" | "medium" | "high";
export type MarketSentiment = "stable" | "up" | "down";
export type MarketCommentType = "material_cost" | "seasonal_demand" | "regulatory_change" | "regional_factor";
/** Source of labor rate: 'engine' = ES-Engine 2026 base rate, 'manual' = user's own rate (Własna Baza) */
export type RateSource = "engine" | "manual";
export type DataSource = "manual" | "ai_analysis" | "market_index" | "admin_override";

export interface Feedback {
  id: string;
  created_at: string;
  user_id: string | null;
  type: FeedbackType;
  message: string;
  contact_email: string | null;
  status: FeedbackStatus;
  metadata: Record<string, unknown>;
}

export interface UserSurvey {
  id: string;
  created_at: string;
  user_id: string;
  overall_rating: number; // 1-5
  favorite_feature: string | null;
  improvement_suggestion: string | null;
  would_recommend: boolean | null;
  metadata: Record<string, unknown>;
}

export type PaymentStatus = "succeeded" | "pending" | "failed" | "refunded";

export interface Payment {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_subscription_id: string | null;
  amount_total: number;
  amount_net: number;
  amount_vat: number;
  vat_rate: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  metadata: Record<string, unknown>;
}

export interface Profile {
  id: string;
  full_name: string | null;
  company_name: string | null;
  nip: string | null;
  regon: string | null;
  address: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  bank_account: string | null;
  logo_url: string | null;
  is_pro: boolean;
  max_projects: number;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  role: 'user' | 'admin';
  default_region_id: string | null;
  show_global_catalog: boolean; // When true, shows global catalog (simplified single toggle)
  infakt_api_key?: string | null; // User's InFakt API key for invoice generation
  last_survey_at?: string | null; // Last time user completed in-app survey
  onboarding_completed?: boolean; // Whether user has completed the onboarding tour
  hourly_rate?: number; // Hourly rate for profitability reports (zł/h)
  use_custom_rates?: boolean; // use personal RBH rate instead of admin base rate (P1 mode)
  custom_labor_rate?: number | null; // personal RBH rate (PLN/h), active when use_custom_rates=true (P1 mode)
  portfolio_visible?: boolean; // Show portfolio in client offers
  portfolio_limit?: number; // Max portfolio items shown in offers
  coeff_height?: boolean;     // Sprint v1.2: Praca na wysokości >3m → ×1.25 robocizna
  coeff_difficulty?: boolean; // Sprint v1.2: Utrudnienia / zamieszkały lokal → ×1.22 robocizna
  coeff_surface?: boolean;    // Sprint v1.2: Trudne podłoże → +15% surface modifier
  investment_context?: string | null; // Sprint v1.2: ES-Engine AI context (e.g. "KNX villa 400m²")
  material_multiplier?: number | null; // Material price inflation multiplier (default 1.08)
  ai_usage_count?: number; // Monthly AI request counter
  ai_usage_reset_at?: string | null; // When AI usage counter was last reset
  created_at: string;
  updated_at: string;
}

export type PortfolioCategory = 'Mieszkanie' | 'Dom' | 'Biuro' | 'Przemysł' | 'Zewnętrzne' | 'Inne';

export interface PortfolioItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  completion_date: string | null;
  category: PortfolioCategory;
  images: string[];
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: string;
  name: string;
  slug: string;
  price_modifier: number;
  created_at: string;
  updated_at: string;
}

export interface ObjectType {
  id: string;
  name: string;
  slug: string;
  default_vat_rate: number;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: ProjectStatus;
  object_type_id: string | null;
  region_id: string;
  category_id: string | null;
  vat_rate: number;
  target_budget: number | null;
  global_discount_percent: number;
  materials_owned_by_customer: boolean;
  adjustment_percentage: number;
  notes: string | null;
  client_name: string | null;
  client_address: string | null;
  client_nip: string | null;
  rate_source: RateSource; // Labor rate source: 'engine' = ES-Engine 2026 | 'manual' = Własna Baza
  deadline: string | null; // Project completion deadline
  // Narzuty system (Polish construction surcharges)
  kp_percent: number; // Koszty pośrednie (indirect costs) - % of labor
  z_percent: number; // Zysk (profit) - % of (labor + Kp)
  kz_percent: number; // Koszty zakupu materiałów (procurement) - % of materials
  // Material safety factors (v2.4 — user-configurable, applied during AI pricing)
  aux_material_pct: number; // Materiały pomocnicze surcharge % (default 3%)
  cable_waste_pct: number;  // Zapas kabli/rur waste factor % for mb/m items (default 5%)
  // v3.0 Finance Core — split markups + contingency + complexity
  mat_markup_pct: number;    // Narzut na materiały % applied at display time (default 0)
  lab_markup_pct: number;    // Narzut na robociznę % applied at display time (default 0)
  contingency_pct: number;   // Rezerwa budżetowa % — applied to totalNetto BEFORE VAT (default 0)
  complexity_factor: number; // Labor complexity multiplier: 1.0=Standard, 1.3=Smart/KNX, 1.2=Industrial (default 1.0)
  // Labor time support
  default_hourly_rate: number; // Stawka r-g in PLN (default 100.00)
  show_labor_hours_in_pdf: boolean; // Show Roboczogodziny column in PDF
  // KNR pricing overrides (project-level) — Sprint v1.2+
  pricing_overrides?: {
    coeff_height?:     boolean | null;
    coeff_difficulty?: boolean | null;
    coeff_surface?:    boolean | null;
  } | null;
  // Document output settings (Pult 5-w-1) — Iron Rule: affect PDF/Portal only, never the internal editor
  show_knr: boolean;        // Show KNR code prefix in PDF/Portal (e.g. "[KNR 5-08 0401-03] Montaż gniazda")
  brutto_mode: boolean;     // Show Brutto prices (with VAT) in PDF/Portal instead of Netto
  expert_coloring: boolean; // Use color coding in PDF (green=labor, orange=materials)
  is_demo_project: boolean; // System-generated showcase — bypasses free-tier blur + PDF paywall; permanently read-only
  created_at: string;
  updated_at: string;
}

export interface ProjectWithRelations extends Project {
  regions?: Region;
  object_types?: ObjectType;
  project_members?: {
    role: ProjectMemberRole;
    status: ProjectMemberStatus;
  }[];
  assigned_to?: string | null;
  color?: string | null;
  item_count?: number;
  section_count?: number;
  unpriced_count?: number;
  offer_link_status?: "pending" | "viewed" | "accepted" | "rejected" | "negotiating" | null;
}

// V4.0: Co-pilot Mode - Project Members
export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  status: ProjectMemberStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectMemberWithProfile extends ProjectMember {
  profiles?: Profile;
}

export interface EmailLog {
  id: string;
  user_id: string;
  project_id: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  template_type: string; // 'offer', 'reminder', 'confirmation', 'custom'
  status: string; // 'sent', 'failed', 'opened', 'clicked'
  resend_id: string | null;
  error_message: string | null;
  sent_at: string;
  opened_at: string | null;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  last_used_at: string;
}

export interface CatalogCategory {
  id: string;
  object_type_id: string;
  name: string;
  icon_name: string | null;
  sort_order: number;
  created_at: string;
}

export type UnitType = "m" | "mb" | "szt" | "kpl" | "h" | "m2" | "m3";

export interface CatalogItem {
  id: string;
  user_id: string | null; // NULL = global item
  category_id: string;
  name: string;
  description: string | null;
  unit: UnitType;
  base_material_price: number;
  base_labor_price: number;
  is_assembly_parent: boolean;
  is_active: boolean;
  // Team Data Sharing
  team_id?: string | null; // Team that owns this item (for team-shared items)
  visibility?: DataVisibility; // 'personal' or 'team'
  // Market Intelligence fields
  price_min: number | null;
  price_max: number | null;
  price_trend: MarketSentiment;
  confidence_level: ConfidenceLevel;
  confidence_reason: string | null;
  market_comment: string | null;
  market_comment_type: MarketCommentType | null;
  last_verified_at: string;
  created_at: string;
  updated_at: string;
  // KNR / DIN Panel fields (added in 20260224 migration)
  knr_code?: string | null;
  labor_norm_rbh?: number | null;
  panel_category?: string | null;
  catalog_confidence?: string | null;
}

export interface ProjectItem {
  id: string;
  project_id: string;
  catalog_item_id: string | null;
  name: string;
  description?: string | null;
  notes?: string | null;
  unit: UnitType;
  quantity: number;
  material_price?: number;       // Base material price (no regionModifier)
  labor_price?: number;          // Base labor price (no regionModifier)
  final_material_price?: number; // Override material price (BASE — calcRowPrices applies region at display)
  final_labor_price?: number;    // Override labor price (BASE — calcRowPrices applies region at display)
  price_min?: number | null;     // Market intelligence: lower price bound
  price_max?: number | null;     // Market intelligence: upper price bound
  is_custom?: boolean;
  is_assembly_child?: boolean;
  parent_assembly_id?: string | null;
  section?: string | null;
  work_status?: string | null;
  // Labor time support (nullable — legacy items unaffected)
  labor_norm?: number | null;        // KNR/AI norm: hours per unit (rbh/szt)
  labor_hours_total?: number | null; // Calculated: quantity * labor_norm
  /** Shadow: KNR dictionary norm suggestion. Never overwrites a protected labor_norm. */
  suggested_norm?: number | null;
  /** Protected Data Logic v2.2: if true, engine skips overwriting labor_norm */
  norm_protected?: boolean | null;
  // Panel configurator sync (nullable — manual items unaffected)
  origin_id?: string | null;         // UUID of the RailModule in panel configurator
  origin_type?: "panel_material" | "panel_labor" | "panel_consumable" | "panel_busbar" | "panel_assembly" | null; // Panel sync row type
  // KNR traceability (Iron Rule: knr_code belongs to Robocizna, region never changes it)
  knr_code?: string | null;          // e.g. "KNR 5-08 0401-03"
  knr_source?: "user_knr" | "system_knr" | "ai_estimation" | "catalog" | "es_synthetic" | null;
  // AI Confidence Score (nullable — legacy/manual items have no level)
  confidence_level?: "verified" | "analog" | "estimated" | "uncertain" | "manual" | "unmatched" | null;
  confidence_note?: string | null;   // e.g. "Analog: Schneider Resi9 16A"
  // Equipment ("S") category — Sprint v1.2
  equipment_price?: number | null;   // PLN/jm rental cost (excavator, crane, etc.)
  equipment_norm?: number | null;    // mh/jm (machine hours per unit)
  // v3.0: Ryczałt — if true, price is fixed regardless of quantity
  is_lump_sum?: boolean | null;
  // Materiał Inwestora — material supplied by client, labor-only billing
  is_investor_material?: boolean | null;
  sort_order: number;
  created_at: string;
  updated_at?: string;
  // ES-Engine Composer metadata (recipe_key, qty_factor, component_id, etc.)
  metadata?: Record<string, unknown> | null;
  // Joined from catalog_items → catalog_categories (optional, populated by getProjectItems)
  catalog_categories?: { id: string; name: string } | null;
}

// Kits (Zestawy) - Expert Point System
export interface Kit {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface KitItem {
  id: string;
  kit_id: string;
  item_name: string;
  item_unit: UnitType;
  labor_price: number;
  material_price: number;
  quantity_multiplier: number;
  display_order: number;
  created_at: string;
}

export interface KitWithItems extends Kit {
  kit_items?: KitItem[];
  catalog_categories?: CatalogCategory;
}

// User Custom Assemblies (Zestawy użytkownika)
export interface UserAssembly {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  building_type?: string | null; // Dom, Biuro, Sklep, Przemysł
  is_ai_generated?: boolean; // TRUE if generated by AI Assembly Generator
  // Team Data Sharing
  team_id?: string | null; // Team that owns this assembly (for team-shared assemblies)
  visibility?: DataVisibility; // 'personal' or 'team'
  created_at: string;
  updated_at: string;
}

export interface UserAssemblyItem {
  id: string;
  assembly_id: string;
  name: string;
  unit: UnitType;
  type: "material" | "labor";
  price: number;
  quantity: number;
  sort_order: number;
  knr_code?: string | null;
  labor_norm_rbh?: number | null;
}

export interface UserAssemblyWithItems extends UserAssembly {
  user_assembly_items?: UserAssemblyItem[];
}

// Market Intelligence: Price History Log
export interface PriceHistoryLog {
  id: string;
  item_id: string;
  recorded_at: string;
  price_labor_min: number | null;
  price_labor_avg: number;
  price_labor_max: number | null;
  price_material_min: number | null;
  price_material_avg: number;
  price_material_max: number | null;
  source_type: DataSource;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

// Teams System
export interface Team {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  max_members: number;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export type TeamMemberStatus = "pending" | "active" | "suspended";

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  status: TeamMemberStatus;
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberWithProfile extends TeamMember {
  profiles?: Profile;
}

export interface TeamWithMembers extends Team {
  team_members?: TeamMemberWithProfile[];
}

// =============================================
// ADDITIONAL TABLE TYPES
// =============================================

export interface ProjectCategory {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface TeamInvitation {
  id: string;
  team_id: string;
  email: string;
  role: TeamRole;
  status: "pending" | "accepted" | "declined" | "expired";
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface TeamMessage {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
}

export interface ProjectTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  region_id: string | null;
  object_type_id: string | null;
  vat_rate: number;
  rate_source: RateSource;
  items: Record<string, unknown>[];
  is_public: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectInvoice {
  id: string;
  project_id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_nip: string | null;
  client_address: string | null;
  total_net: number;
  total_gross: number;
  vat_rate: number;
  status: "draft" | "sent" | "paid";
  payment_method: "transfer" | "cash" | "card";
  payment_days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  hourly_rate: number | null;
  created_at: string;
}

export interface AiUsage {
  id: string;
  user_id: string;
  feature: string;
  tokens_used: number;
  model: string;
  created_at: string;
}

export interface ProjectTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ProjectTagAssignment {
  id: string;
  project_id: string;
  tag_id: string;
  created_at: string;
}

export interface ItemComment {
  id: string;
  item_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AssemblyCategory {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// =============================================
// MEASUREMENT PROTOCOLS
// =============================================

export type InstallationType = "new" | "renovation" | "periodic";
export type SupplySystem = "TN-S" | "TN-C-S" | "TN-C" | "TT" | "IT";
export type ProtocolResult = "positive" | "negative" | "conditional";
export type MeasurementType = "insulation_resistance" | "loop_impedance" | "rcd_trip_time" | "continuity" | "earth_resistance";
export type MeasurementResult = "pass" | "fail" | "warning";

export interface MeasurementProtocol {
  id: string;
  project_id: string;
  user_id: string;
  protocol_number: string | null;
  protocol_date: string;
  inspector_name: string | null;
  inspector_qualifications: string | null;
  installation_type: InstallationType;
  supply_system: SupplySystem;
  nominal_voltage: number;
  temperature: number | null;
  humidity: number | null;
  instrument_name: string | null;
  instrument_serial: string | null;
  calibration_date: string | null;
  overall_result: ProtocolResult;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeasurementEntry {
  id: string;
  protocol_id: string;
  circuit_name: string;
  circuit_number: string | null;
  location: string | null;
  measurement_type: MeasurementType;
  measured_value: number | null;
  unit: string;
  required_value: number | null;
  rcd_type: string | null;
  rcd_current: number | null;
  breaker_type: string | null;
  breaker_rating: number | null;
  result: MeasurementResult;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export interface MeasurementProtocolWithEntries extends MeasurementProtocol {
  measurement_entries?: MeasurementEntry[];
}

// =============================================
// PROJECT PHOTOS (Documentation)
// =============================================

export type PhotoType = "before" | "after" | "progress" | "issue" | "detail";

export interface ProjectPhoto {
  id: string;
  project_id: string;
  item_id: string | null;
  user_id: string;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string;
  caption: string | null;
  location: string | null;
  photo_type: PhotoType;
  taken_at: string;
  created_at: string;
}