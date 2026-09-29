import { GisHotspot, PriorityProject, DemandSignal, ScmImpactReport, CpgramsBatch } from '../types';

export const INITIAL_HOTSPOTS: GisHotspot[] = [
  { district: 'Jabalpur', category: 'public_safety', report_count: 141, excess_ratio: 32.8, lat: 23.1815, lon: 79.9864, state: 'Madhya Pradesh', lgd: '153' },
  { district: 'Deoghar', category: 'public_safety', report_count: 100, excess_ratio: 7.1, lat: 24.4826, lon: 86.7000, state: 'Jharkhand', lgd: '217' },
  { district: 'Yavatmal', category: 'health', report_count: 72, excess_ratio: 3.7, lat: 20.3888, lon: 78.1204, state: 'Maharashtra', lgd: '480' },
  { district: 'Varanasi', category: 'roads', report_count: 68, excess_ratio: 3.4, lat: 25.3176, lon: 82.9739, state: 'Uttar Pradesh', lgd: '102' },
  { district: 'Bhagalpur', category: 'roads', report_count: 61, excess_ratio: 3.2, lat: 25.2425, lon: 86.9842, state: 'Bihar', lgd: '218' },
  { district: 'Gaya', category: 'water_sanitation', report_count: 54, excess_ratio: 3.1, lat: 24.7914, lon: 85.0002, state: 'Bihar', lgd: '215' },
  { district: 'Pune', category: 'water_sanitation', report_count: 52, excess_ratio: 2.6, lat: 18.5204, lon: 73.8567, state: 'Maharashtra', lgd: '490' },
  { district: 'Madurai', category: 'power', report_count: 49, excess_ratio: 2.9, lat: 9.9252, lon: 78.1198, state: 'Tamil Nadu', lgd: '588' },
  { district: 'Lucknow', category: 'education', report_count: 45, excess_ratio: 2.2, lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh', lgd: '156' },
  { district: 'Koraput', category: 'roads', report_count: 42, excess_ratio: 2.7, lat: 18.8135, lon: 82.7123, state: 'Odisha', lgd: '350' },
  { district: 'Salem', category: 'education', report_count: 38, excess_ratio: 2.5, lat: 11.6643, lon: 78.1460, state: 'Tamil Nadu', lgd: '593' },
  { district: 'Cuttack', category: 'water_sanitation', report_count: 36, excess_ratio: 2.4, lat: 20.4625, lon: 85.8828, state: 'Odisha', lgd: '341' }
];

export const INITIAL_PRIORITIES: PriorityProject[] = [
  {
    rank: 1,
    category: 'public_safety',
    location: 'Jabalpur',
    lgd_district_code: 153,
    demand_intensity: { report_count: 141, excess_ratio: 32.83, per_lakh_per_year: 19.0 },
    deprivation_score: 0.6,
    scheme_match: { scheme: 'Safe City Project', description: 'Nirbhaya Fund urban safety corridors & CCTV telemetry', current_coverage: 0.128 },
    cost_per_beneficiary_proxy: 24.2,
    priority: 0.8014,
    components: { D_demand: 1.0, G_deprivation: 0.791, P_population: 0.204, S_scheme_alignment: 0.866 }
  },
  {
    rank: 2,
    category: 'public_safety',
    location: 'Deoghar',
    lgd_district_code: 217,
    demand_intensity: { report_count: 100, excess_ratio: 7.11, per_lakh_per_year: 4.1 },
    deprivation_score: 0.9,
    scheme_match: { scheme: 'Safe City Project', description: 'Pilgrim corridor surveillance & crowd safety infrastructure', current_coverage: 0.02 },
    cost_per_beneficiary_proxy: 7.4,
    priority: 0.7287,
    components: { D_demand: 0.82, G_deprivation: 0.91, P_population: 0.15, S_scheme_alignment: 0.84 }
  },
  {
    rank: 3,
    category: 'health',
    location: 'Yavatmal',
    lgd_district_code: 480,
    demand_intensity: { report_count: 72, excess_ratio: 3.72, per_lakh_per_year: 8.5 },
    deprivation_score: 0.78,
    scheme_match: { scheme: 'PM-ABHIM', description: 'Primary health center diagnostic lab & critical care block', current_coverage: 0.35 },
    cost_per_beneficiary_proxy: 150.0,
    priority: 0.7590,
    components: { D_demand: 0.91, G_deprivation: 0.82, P_population: 0.41, S_scheme_alignment: 0.89 }
  },
  {
    rank: 4,
    category: 'roads',
    location: 'Varanasi',
    lgd_district_code: 102,
    demand_intensity: { report_count: 68, excess_ratio: 3.41, per_lakh_per_year: 5.6 },
    deprivation_score: 0.62,
    scheme_match: { scheme: 'PMGSY III', description: 'All-weather peri-urban transport and feeder link retrofit', current_coverage: 0.45 },
    cost_per_beneficiary_proxy: 180.0,
    priority: 0.7682,
    components: { D_demand: 0.88, G_deprivation: 0.72, P_population: 0.65, S_scheme_alignment: 0.95 }
  },
  {
    rank: 5,
    category: 'water_sanitation',
    location: 'Gaya',
    lgd_district_code: 215,
    demand_intensity: { report_count: 54, excess_ratio: 3.12, per_lakh_per_year: 4.8 },
    deprivation_score: 0.75,
    scheme_match: { scheme: 'Jal Jeevan Mission', description: 'Har Ghar Jal piped distribution pipeline expansion', current_coverage: 0.52 },
    cost_per_beneficiary_proxy: 120.0,
    priority: 0.7451,
    components: { D_demand: 0.82, G_deprivation: 0.85, P_population: 0.45, S_scheme_alignment: 0.90 }
  },
  {
    rank: 6,
    category: 'power',
    location: 'Madurai',
    lgd_district_code: 588,
    demand_intensity: { report_count: 49, excess_ratio: 2.89, per_lakh_per_year: 3.9 },
    deprivation_score: 0.52,
    scheme_match: { scheme: 'RDSS', description: 'Distribution transformer replacement and feeder automation', current_coverage: 0.68 },
    cost_per_beneficiary_proxy: 95.0,
    priority: 0.7120,
    components: { D_demand: 0.76, G_deprivation: 0.61, P_population: 0.68, S_scheme_alignment: 0.84 }
  }
];

export const INITIAL_SIGNALS: DemandSignal[] = [
  { lgd_district_code: 153, district: 'Jabalpur', category: 'public_safety', report_count: 141, signal_count: 12, urgency: 0.94 },
  { lgd_district_code: 217, district: 'Deoghar', category: 'public_safety', report_count: 100, signal_count: 9, urgency: 0.88 },
  { lgd_district_code: 480, district: 'Yavatmal', category: 'health', report_count: 72, signal_count: 8, urgency: 0.85 },
  { lgd_district_code: 102, district: 'Varanasi', category: 'roads', report_count: 68, signal_count: 7, urgency: 0.81 },
  { lgd_district_code: 218, district: 'Bhagalpur', category: 'roads', report_count: 61, signal_count: 6, urgency: 0.79 },
  { lgd_district_code: 215, district: 'Gaya', category: 'water_sanitation', report_count: 54, signal_count: 6, urgency: 0.78 },
  { lgd_district_code: 490, district: 'Pune', category: 'water_sanitation', report_count: 52, signal_count: 5, urgency: 0.72 },
  { lgd_district_code: 588, district: 'Madurai', category: 'power', report_count: 49, signal_count: 5, urgency: 0.70 }
];

export const INITIAL_IMPACT_REPORT: ScmImpactReport = {
  method: 'Generalized Synthetic Control Method (Abadie causal inference)',
  panel_months: ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'],
  districts: [
    {
      district: 'Varanasi',
      category: 'roads',
      lgd_district_code: 102,
      treatment_completed: '2025-07-01',
      pre_months: 6,
      post_months: 6,
      pre_rmspe: 0.041,
      pre_rmspe_relative_to_mean: 0.082,
      observed_post_mean: 18.4,
      synthetic_post_mean: 42.1,
      demand_decay_effect: -23.7,
      decay_pct: 56.3,
      intime_placebo_effect: 1.2,
      inspace_placebo_pvalue: 0.024,
      donor_weights_top: { 'Prayagraj': 0.42, 'Gorakhpur': 0.31, 'Mirzapur': 0.27 },
      series: {
        observed: [40, 42, 45, 43, 44, 46, 30, 22, 19, 18, 17, 16],
        synthetic: [39, 41, 44, 43, 45, 45, 44, 43, 42, 41, 41, 42]
      },
      status: 'VERIFIED_CAUSAL_IMPACT'
    },
    {
      district: 'Gaya',
      category: 'water_sanitation',
      lgd_district_code: 215,
      treatment_completed: '2025-08-01',
      pre_months: 7,
      post_months: 5,
      pre_rmspe: 0.038,
      pre_rmspe_relative_to_mean: 0.075,
      observed_post_mean: 14.2,
      synthetic_post_mean: 36.8,
      demand_decay_effect: -22.6,
      decay_pct: 61.4,
      intime_placebo_effect: 0.9,
      inspace_placebo_pvalue: 0.018,
      donor_weights_top: { 'Nawada': 0.51, 'Jehanabad': 0.29, 'Aurangabad': 0.20 },
      series: {
        observed: [34, 36, 38, 37, 39, 38, 39, 21, 16, 14, 13, 12],
        synthetic: [35, 36, 37, 38, 38, 39, 38, 37, 37, 36, 36, 37]
      },
      status: 'VERIFIED_CAUSAL_IMPACT'
    }
  ]
};

export const INITIAL_CPGRAMS_BATCH: CpgramsBatch = {
  batch_id: 'NIC-DARPG-2026-0929-B01',
  status: 'BATCH_DISPATCH_SUCCESSFUL',
  tickets: [
    {
      grievance_registration_number: 'DARPG/P/2026/00153',
      administrative_routing: {
        ministry: 'Ministry of Home Affairs',
        district_name: 'Jabalpur',
        lgd_district_code: '153'
      },
      intelligence_metrics: {
        deduplicated_petition_count: 141
      },
      status: 'DISPATCHED_TO_NODAL_OFFICER'
    },
    {
      grievance_registration_number: 'DARPG/P/2026/00217',
      administrative_routing: {
        ministry: 'Ministry of Home Affairs',
        district_name: 'Deoghar',
        lgd_district_code: '217'
      },
      intelligence_metrics: {
        deduplicated_petition_count: 100
      },
      status: 'DISPATCHED_TO_NODAL_OFFICER'
    },
    {
      grievance_registration_number: 'DARPG/P/2026/00480',
      administrative_routing: {
        ministry: 'Ministry of Health and Family Welfare',
        district_name: 'Yavatmal',
        lgd_district_code: '480'
      },
      intelligence_metrics: {
        deduplicated_petition_count: 72
      },
      status: 'DISPATCHED_TO_NODAL_OFFICER'
    },
    {
      grievance_registration_number: 'DARPG/P/2026/00102',
      administrative_routing: {
        ministry: 'Ministry of Rural Development',
        district_name: 'Varanasi',
        lgd_district_code: '102'
      },
      intelligence_metrics: {
        deduplicated_petition_count: 68
      },
      status: 'DISPATCHED_TO_NODAL_OFFICER'
    }
  ]
};

export const BRICS_PROFILES: Record<string, import('../types').BricsProfile> = {
  IND: {
    iso: 'IND',
    name: 'Republic of India',
    administrative_level: 'State / District (LGD)',
    primary_schemes: ['PMGSY III', 'Jal Jeevan Mission', 'RDSS', 'Safe City Project', 'PM-ABHIM'],
    population_covered: '1.42 Billion across 765 Districts',
    spatial_anchor: 'Local Government Directory (LGD 6-digit Code)',
    description: 'National digital public infrastructure anchored on Census demographics, Aspirational Districts Program indices, and MoPR spatial hierarchy.'
  },
  BRA: {
    iso: 'BRA',
    name: 'Federative Republic of Brazil',
    administrative_level: 'Estado / Município (IBGE)',
    primary_schemes: ['Novo PAC Rodovias', 'Marco Legal do Saneamento', 'Luz para Todos', 'SUS Digital'],
    population_covered: '215 Million across 5,570 Municípios',
    spatial_anchor: 'IBGE Código de Município (7 dígitos)',
    description: 'Federal participatory infrastructure targeting Amazonian and Northeast underserved municipal clusters via DataSUS and SNIS integration.'
  },
  ZAF: {
    iso: 'ZAF',
    name: 'Republic of South Africa',
    administrative_level: 'Province / Category B/C Municipality',
    primary_schemes: ["S'hamba Sonke", 'Municipal Infrastructure Grant (MIG)', 'Eskom INEP', 'NHI'],
    population_covered: '60 Million across 257 Municipalities',
    spatial_anchor: 'Municipal Demarcation Board (MDB Code)',
    description: 'National Development Plan 2030 spatial transformation framework prioritizing rural district municipalities and informal urban settlements.'
  }
};
