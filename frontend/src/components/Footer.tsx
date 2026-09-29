import React from 'react';

interface FooterProps {
  onOpenPolicy: (doc: 'privacy' | 'terms' | 'compliance' | 'dpo' | 'openapi') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPolicy }) => {
  return (
    <footer className="mt-16 border-t border-border bg-surface py-6 px-6 md:px-12 text-xs text-secondary font-mono">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className="font-semibold text-charcoal">VAANI Operations</span>
          <span className="hidden sm:inline text-border">|</span>
          <span>Compliant with the Digital Personal Data Protection (DPDP) Act, 2023. Zero PII persistence.</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-secondary">
          <button
            onClick={() => onOpenPolicy('privacy')}
            className="hover:text-charcoal transition-colors underline-offset-4 hover:underline"
          >
            Privacy Charter
          </button>
          <button
            onClick={() => onOpenPolicy('terms')}
            className="hover:text-charcoal transition-colors underline-offset-4 hover:underline"
          >
            Terms of Use
          </button>
          <button
            onClick={() => onOpenPolicy('compliance')}
            className="hover:text-charcoal transition-colors underline-offset-4 hover:underline"
          >
            Audit Certificate
          </button>
          <button
            onClick={() => onOpenPolicy('dpo')}
            className="hover:text-charcoal transition-colors underline-offset-4 hover:underline"
          >
            Data Protection Officer
          </button>
          <button
            onClick={() => onOpenPolicy('openapi')}
            className="hover:text-charcoal transition-colors underline-offset-4 hover:underline"
          >
            OpenAPI Spec
          </button>
        </div>
      </div>
    </footer>
  );
};
