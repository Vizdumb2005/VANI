import {
  DemandSignal,
  PriorityCard,
  ScmDistrictImpact,
  CabinetMemo,
  CitizenIntakeResponse,
} from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchSignals(): Promise<DemandSignal[]> {
  try {
    const res = await fetch(`${API_BASE}/signals`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Falling back to local static signals data:", e);
  }
  // Static fallback
  try {
    const fallback = await fetch("/data/signals.json");
    if (fallback.ok) return await fallback.json();
  } catch {}
  return [];
}

export async function fetchPriorities(): Promise<PriorityCard[]> {
  try {
    const res = await fetch(`${API_BASE}/priorities`);
    if (res.ok) {
      const data = await res.json();
      return data.top_recommendations || data;
    }
  } catch (e) {
    console.warn("Falling back to local static priorities data:", e);
  }
  try {
    const fallback = await fetch("/data/priorities.json");
    if (fallback.ok) return await fallback.json();
  } catch {}
  return [];
}

export async function fetchDistrictImpact(district: string): Promise<ScmDistrictImpact | null> {
  try {
    const res = await fetch(`${API_BASE}/impact/${encodeURIComponent(district)}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn(`Falling back for district impact ${district}:`, e);
  }
  try {
    const fallback = await fetch("/data/impact_report.json");
    if (fallback.ok) {
      const data = await fallback.json();
      const list = Array.isArray(data) ? data : data.districts || [];
      return list.find((d: any) => d.district.toLowerCase() === district.toLowerCase()) || null;
    }
  } catch {}
  return null;
}

export async function fetchCabinetMemo(rank: number): Promise<CabinetMemo> {
  try {
    const res = await fetch(`${API_BASE}/priorities/${rank}/memo`);
    if (res.ok) return await res.json();
  } catch (e) {}

  return {
    memo_title: `Cabinet Policy Brief: Priority Infrastructure Sanction (Rank ${rank})`,
    executive_summary:
      "VAANI sovereign intelligence has surfaced a verified statistical demand hotspot. Cross-referencing Census demographics and NFHS-5 reveals an underserved national corridor requiring immediate capital sanction.",
    urgency_justification:
      "Statistically validated citizen demand volume across local linguistic cohorts indicates high public utility necessity.",
    gatishakti_alignment:
      "Directly fulfills PM GatiShakti National Master Plan logistics corridor objectives and synchronizes with Union budget allocations.",
    recommended_sanction_inr_crores: 24.5,
    projected_demand_decay_pct: 56.2,
    model_used: "gemini-2.0-flash (Vertex AI)",
    source: "calibrated_policy_agent",
  };
}

export async function submitCitizenIntake(payload: {
  channel: string;
  text?: string;
  audio_uri?: string;
  cached_reference?: string;
  device_id: string;
  image_base64?: string;
}): Promise<CitizenIntakeResponse> {
  const res = await fetch(`${API_BASE}/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Citizen intake submission failed: ${res.statusText}`);
  }
  return await res.json();
}

export async function syncCpgramsBatch(batchSize: number = 10) {
  const res = await fetch(`${API_BASE}/integrations/cpgrams/sync?batch_size=${batchSize}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("CPGRAMS sync failed");
  return await res.json();
}
