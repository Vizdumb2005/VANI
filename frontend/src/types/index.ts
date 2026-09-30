export type ActiveView = 'dashboard' | 'gis' | 'mcda' | 'gateways' | 'cpgrams' | 'scm' | 'brics' | 'compliance';

export interface GisHotspot {
  district: string;
  category: string;
  report_count: number;
  excess_ratio: number;
  lat: number;
  lon?: number;
  state: string;
  lgd?: string;
  lgd_district_code?: number | string;
  id?: string;
  lng?: number;
  status?: string;
}

export type GeocodedHotspot = GisHotspot;
export type InfrastructureCategory = 'roads' | 'water_sanitation' | 'power' | 'health' | 'education' | 'public_safety' | 'other';

export interface DemandSignal {
  lgd_district_code: number;
  district: string;
  category: string;
  report_count: number;
  signal_count: number;
  urgency: number;
}

export interface McdaComponents {
  D_demand: number;
  G_deprivation: number;
  P_population: number;
  S_scheme_alignment: number;
}

export interface SchemeMatch {
  scheme: string;
  description: string;
  current_coverage: number;
}

export interface PriorityProject {
  rank: number;
  category: string;
  location: string;
  lgd_district_code: number;
  demand_intensity: {
    report_count: number;
    excess_ratio: number;
    per_lakh_per_year?: number;
  };
  deprivation_score: number;
  scheme_match: SchemeMatch;
  cost_per_beneficiary_proxy: number;
  priority: number;
  components: McdaComponents;
  dynamicScore?: number;
  origIdx?: number;
}

export type PriorityCard = PriorityProject;

export interface ScmSeries {
  observed: number[];
  synthetic: number[];
}

export interface ScmDistrictImpact {
  district: string;
  category: string;
  lgd_district_code: number;
  treatment_completed: string;
  pre_months: number;
  post_months: number;
  pre_rmspe: number;
  pre_rmspe_relative_to_mean: number;
  observed_post_mean: number;
  synthetic_post_mean: number;
  demand_decay_effect: number;
  decay_pct: number;
  intime_placebo_effect: number;
  inspace_placebo_pvalue: number;
  donor_weights_top: Record<string, number>;
  series: ScmSeries;
  status: string;
}

export interface ScmImpactReport {
  districts: ScmDistrictImpact[];
  method: string;
  panel_months: string[];
}

export interface GeminiVisionInspection {
  damage_type: string;
  severity_score: number;
  hazard_level: string;
  visual_verification_passed: boolean;
  ai_damage_assessment: string;
  recommended_remediation: string;
}

export type VisionDamageInspection = GeminiVisionInspection;

export interface CitizenIntakeResponse {
  request_id: string;
  language: string;
  transcript_preview: string;
  asr_rung: string;
  ticket_id?: string;
  status?: string;
  gemini_vision_inspection?: GeminiVisionInspection | null;
  text_reply?: string;
  voice_reply?: {
    status?: string;
    language?: string;
    text?: string;
    format?: string;
    audio_base64?: string;
    engine?: string;
  };
  persisted_at?: string;
}

export interface CabinetMemo {
  memo_title: string;
  executive_summary: string;
  urgency_justification: string;
  gatishakti_alignment: string;
  recommended_sanction_inr_crores: number | string;
  projected_demand_decay_pct: number;
  model_used?: string;
  source?: string;
}

export interface CpgramsTicket {
  grievance_registration_number: string;
  administrative_routing: {
    ministry: string;
    district_name: string;
    lgd_district_code: string;
  };
  intelligence_metrics: {
    deduplicated_petition_count: number;
  };
  status: string;
}

export interface CpgramsBatch {
  batch_id: string;
  status: string;
  tickets: CpgramsTicket[];
}

export interface BricsProfile {
  iso: string;
  name: string;
  administrative_level: string;
  primary_schemes: string[];
  population_covered: string;
  spatial_anchor: string;
  description: string;
}

export interface ProductionChannel {
  name: string;
  provider: string;
  protocol: string;
  status: 'operational' | 'connected' | 'healthy';
  throughput: string;
  lastEvent: string;
}

export interface IngestedLiveEvent {
  id: string;
  channel: string;
  district: string;
  state: string;
  category: string;
  timestamp: string;
  status: string;
  hasVisualEvidence: boolean;
}

