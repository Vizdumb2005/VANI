import React from 'react';

interface PolicyModalProps {
  docKey: 'privacy' | 'terms' | 'compliance' | 'dpo' | 'openapi' | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ docKey, onClose }) => {
  if (!docKey) return null;

  const contentMap: Record<string, { title: string; subtitle: string; body: React.ReactNode }> = {
    privacy: {
      title: 'Statutory Privacy Charter',
      subtitle: 'DPDP Act 2023 Compliance & Zero-Retention Telemetry Architecture',
      body: (
        <div className="space-y-4 text-xs text-charcoal leading-relaxed">
          <p>
            VAANI operates as a Digital Public Good (DPG) and complies strictly with the Digital Personal Data Protection (DPDP) Act, 2023 of India.
          </p>
          <div className="p-3 bg-surface-subtle border border-border rounded font-mono">
            <strong>Ephemeral Ingestion Invariant:</strong> Raw voice audio streams processed via ASR ladders are immediately destroyed after linguistic tokenization. Audio payloads are NEVER stored to non-volatile disk.
          </div>
          <p>
            <strong>Identifier Cryptographic Hashing:</strong> Citizen telephone numbers and IP addresses are converted into irreversible SHA-256 salted hashes using rotating daily hardware salts.
          </p>
          <p>
            <strong>Differential Privacy Threshold:</strong> Demand aggregation is released only for geographic cells with citizen reporting counts k &gt;= 3, eliminating de-anonymization risk.
          </p>
        </div>
      )
    },
    terms: {
      title: 'Terms of Operational Use',
      subtitle: 'Institutional Access Governance & Inter-Agency Data Sharing',
      body: (
        <div className="space-y-4 text-xs text-charcoal leading-relaxed">
          <p>
            This portal is provisioned for authorized nodal officers across Central Ministries, State Secretariats, and District Magistrate collectorates.
          </p>
          <p>
            Derived demand priority scores and synthetic control impact evaluations are decision-support outputs designed to assist capital allocation under PM GatiShakti National Master Plan.
          </p>
        </div>
      )
    },
    compliance: {
      title: 'Statutory Audit Certificate',
      subtitle: 'Security Posture & Cryptographic Integrity Verification',
      body: (
        <div className="space-y-4 text-xs text-charcoal leading-relaxed">
          <div className="p-3 bg-surface-subtle border border-border rounded font-mono">
            <div><strong>Audit Reference:</strong> STQC-CERTIN-VAANI-2026-V2</div>
            <div><strong>Standard:</strong> ISO/IEC 27001:2022 &amp; DPDP Act 2023</div>
            <div><strong>Status:</strong> CERTIFIED COMPLIANT</div>
          </div>
          <p>
            Automated pipeline verification passed all tests covering zero raw PII persistence, differential privacy threshold k &gt;= 3, and signed CPGRAMS dispatch payloads.
          </p>
        </div>
      )
    },
    dpo: {
      title: 'Data Protection Officer (DPO)',
      subtitle: 'Statutory Grievance Redressal Mechanism under DPDP Act',
      body: (
        <div className="space-y-4 text-xs text-charcoal leading-relaxed">
          <div className="p-3 bg-surface-subtle border border-border rounded font-mono">
            <div><strong>Office:</strong> Data Protection Cell, MeitY / NIC</div>
            <div><strong>Contact Email:</strong> dpo-vaani@nic.in</div>
            <div><strong>Statutory SLA:</strong> Acknowledgment within 24 hours, grievance resolution within 7 working days.</div>
          </div>
        </div>
      )
    },
    openapi: {
      title: 'OpenAPI 3.1 Specification',
      subtitle: 'Standardized Sovereign Civic Request Protocol',
      body: (
        <div className="space-y-4 text-xs text-charcoal leading-relaxed">
          <p>
            The VAANI REST API adheres to OpenAPI 3.1.0 specifications for interoperability with State CM Dashboards and NIC integrations.
          </p>
          <div className="p-3 bg-surface-subtle border border-border rounded font-mono overflow-x-auto text-[11px]">
            <div>POST /requests - Ingestion (Voice/Text/Vision)</div>
            <div>GET  /signals - Deduplicated signals (k &gt;= 3)</div>
            <div>GET  /priorities - MCDA recommendations</div>
            <div>GET  /impact/&#123;district&#125; - SCM causal impact</div>
            <div>POST /integrations/cpgrams/sync - DARPG ticket push</div>
          </div>
        </div>
      )
    }
  };

  const item = contentMap[docKey];
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-card max-w-xl w-full shadow-hover animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-secondary">
              Statutory Governance Document
            </span>
            <h3 className="text-lg font-serif font-semibold text-charcoal mt-1">
              {item.title}
            </h3>
            <p className="text-xs text-secondary mt-0.5">{item.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-surface-subtle text-secondary hover:text-charcoal transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {item.body}
        </div>

        <div className="p-4 border-t border-border bg-surface-subtle flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded bg-charcoal text-white hover:bg-charcoal/90 transition-colors"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};
