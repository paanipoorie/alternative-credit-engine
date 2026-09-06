'use client';

import React from 'react';
import { Shield, Sparkles, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onLoadDemo: () => void;
  isLoadingDemo?: boolean;
  hasAssessment?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  onLoadDemo,
  isLoadingDemo = false,
  hasAssessment = false,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#DDE3E0] bg-white/95 backdrop-blur-sm shadow-xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F4E8C] text-white shadow-xs">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#1F4E8C]">
                TVS CREDIT
              </span>
              <span className="rounded-full bg-[#EBF2FC] px-2 py-0.5 text-xs font-semibold text-[#1F4E8C] border border-[#BFDBFE]">
                Alternative Intelligence
              </span>
            </div>
            <p className="text-xs text-[#5F6368]">
              Evidence-First Behavioural Risk Assessment Layer
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onLoadDemo}
            disabled={isLoadingDemo}
            className="flex items-center gap-1.5 rounded-lg bg-[#0B9348] px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-[#08783B] disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isLoadingDemo ? 'Loading Demo...' : 'Load Demo (Rajesh Kumar)'}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded-lg border border-[#DDE3E0] bg-white px-2.5 py-1.5 text-xs font-medium text-[#5F6368] hover:bg-[#F7F9F8] hover:text-[#222222] transition shadow-xs"
            title="Reset Assessment"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
