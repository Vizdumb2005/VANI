import {
  DemandSignal,
  PriorityProject,
  ScmImpactReport,
  ScmDistrictImpact,
  CabinetMemo,
  CpgramsBatch,
  CitizenIntakeResponse,
} from "../types";
import {
  INITIAL_PRIORITIES,
  INITIAL_SIGNALS,
  INITIAL_IMPACT_REPORT,
  INITIAL_CPGRAMS_BATCH,
} from "../data/initialData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

type RequestOptions = RequestInit & { token?: string | null };

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...init } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

export async function fetchPriorities(): Promise<PriorityProject[]> {
  try {
    const data = await requestJson<PriorityProject[] | { top_recommendations: PriorityProject[] }>("/priorities");
    return Array.isArray(data) ? data : data.top_recommendations || INITIAL_PRIORITIES;
  } catch (error) {
    console.warn("API /priorities unavailable, serving local baseline:", error);
    return INITIAL_PRIORITIES;
  }
}

export async function fetchSignals(): Promise<DemandSignal[]> {
  try {
    const data = await requestJson<DemandSignal[]>("/signals");
    return Array.isArray(data) ? data : INITIAL_SIGNALS;
  } catch (error) {
    console.warn("API /signals unavailable, serving local baseline:", error);
    return INITIAL_SIGNALS;
  }
}

export async function fetchImpactReport(): Promise<ScmImpactReport> {
  try {
    const data = await requestJson<ScmDistrictImpact>("/impact/Varanasi");
    return {
      method: "Synthetic Control Method (Abadie et al.)",
      panel_months: INITIAL_IMPACT_REPORT.panel_months,
      districts: [data, ...INITIAL_IMPACT_REPORT.districts.filter((d) => d.district.toLowerCase() !== "varanasi")],
    };
  } catch (error) {
    console.warn("API /impact unavailable, serving local baseline:", error);
    return INITIAL_IMPACT_REPORT;
  }
}

export async function fetchDistrictImpact(district: string): Promise<ScmDistrictImpact | null> {
  try {
    return await requestJson<ScmDistrictImpact>(`/impact/${encodeURIComponent(district)}`);
  } catch (error) {
    console.warn(`API /impact unavailable for ${district}, serving local baseline:`, error);
    return INITIAL_IMPACT_REPORT.districts.find(
      (item) => item.district.toLowerCase() === district.toLowerCase(),
    ) || null;
  }
}

export async function fetchCabinetMemo(rank: number): Promise<CabinetMemo> {
  try {
    return await requestJson<CabinetMemo>(`/priorities/${rank}/memo`);
  } catch (error) {
    console.warn("API /memo unavailable, serving structured memo template:", error);
  }

  const p = INITIAL_PRIORITIES.find((x) => x.rank === rank) || INITIAL_PRIORITIES[0];
  return {
    memo_title: `Cabinet Policy Brief: Priority Infrastructure Sanction (${p.location} - Rank #${p.rank})`,
    executive_summary: `VAANI sovereign intelligence has surfaced a verified statistical demand hotspot in ${p.location} (${p.category.replace("_", " ")}). Cross-referencing Census demographics and NFHS-5 reveals an underserved national corridor requiring immediate capital sanction.`,
    urgency_justification: `Statistically validated citizen demand volume across local linguistic cohorts indicates high public utility necessity with an excess ratio of ${p.demand_intensity.excess_ratio}x.`,
    gatishakti_alignment: `Directly fulfills PM GatiShakti National Master Plan logistics corridor objectives and synchronizes with Union budget allocations for ${p.scheme_match.scheme}.`,
    recommended_sanction_inr_crores: 24.5,
    projected_demand_decay_pct: 56.2,
    source: "local_baseline",
  };
}

export async function syncCpgramsBatch(batchSize = 10, token?: string | null): Promise<CpgramsBatch> {
  if (!token) throw new Error("Operator sign-in is required before CPGRAMS dispatch");
  return requestJson<CpgramsBatch>(`/integrations/cpgrams/sync?batch_size=${batchSize}`, {
    method: "POST",
    token,
  });
}

export async function submitCitizenIntake(payload: {
  channel: string;
  text?: string;
  audio_uri?: string;
  cached_reference?: string;
  device_id: string;
  image_base64?: string;
}): Promise<CitizenIntakeResponse> {
  return requestJson<CitizenIntakeResponse>("/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const submitRequest = submitCitizenIntake;
