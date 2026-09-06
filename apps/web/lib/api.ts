import { AssessmentProfile, CanonicalEvidence, DeclaredProfile, WhatIfResponse } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function uploadEvidenceFile(file: File): Promise<CanonicalEvidence> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/evidence/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: `Upload failed (status ${res.status})` }));
    throw new Error(errData.error || `Upload failed with status ${res.status}`);
  }

  return res.json();
}

export async function fetchEvidenceList(): Promise<CanonicalEvidence[]> {
  const res = await fetch(`${API_BASE}/api/evidence`);
  if (!res.ok) {
    throw new Error(`Failed to fetch evidence list: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteEvidenceItem(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/evidence/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to delete evidence: ${res.statusText}`);
  }
}

export async function clearAllEvidence(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/evidence`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Failed to clear evidence: ${res.statusText}`);
  }
}

export async function analyzeProfile(
  declaredProfile?: DeclaredProfile,
  evidence?: CanonicalEvidence[]
): Promise<AssessmentProfile> {
  const res = await fetch(`${API_BASE}/api/assess/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: 'CUST-APPLICANT-001',
      customer_name: declaredProfile?.full_name || 'Verified Applicant',
      persona_type: declaredProfile?.employment_type || 'gig_worker',
      declared_profile: declaredProfile,
      evidence: evidence,
    }),
  });

  if (!res.ok) {
    throw new Error(`Assessment failed: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchDemoProfile(): Promise<AssessmentProfile> {
  const res = await fetch(`${API_BASE}/api/assess/demo`);
  if (!res.ok) {
    throw new Error(`Demo assessment failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchStrongDemoProfile(): Promise<AssessmentProfile> {
  const res = await fetch(`${API_BASE}/api/assess/demo/strong`);
  if (!res.ok) {
    throw new Error(`Strong demo assessment failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchReviewDemoProfile(): Promise<AssessmentProfile> {
  const res = await fetch(`${API_BASE}/api/assess/demo/review`);
  if (!res.ok) {
    throw new Error(`Review demo assessment failed: ${res.statusText}`);
  }
  return res.json();
}

export async function calculateWhatIf(
  currentAssessment: AssessmentProfile,
  incomeStabilityDelta: number,
  paymentDisciplineDelta: number,
  activityContinuityDelta: number = 0,
  additionalInflowMonthly: number = 0
): Promise<WhatIfResponse> {
  const res = await fetch(`${API_BASE}/api/assess/what-if`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_assessment: currentAssessment,
      income_stability_delta: incomeStabilityDelta,
      payment_discipline_delta: paymentDisciplineDelta,
      activity_continuity_delta: activityContinuityDelta,
      additional_inflow_monthly: additionalInflowMonthly,
    }),
  });

  if (!res.ok) {
    throw new Error(`What-If calculation failed: ${res.statusText}`);
  }

  return res.json();
}
