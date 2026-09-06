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
    <header className="sticky top-0 z-40 border-b border-[#2B3035] bg-[#171A1D]/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3D78C2] text-white shadow-xs">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-[#F3F5F4]">
                TVS CREDIT
              </span>
              <span className="rounded-full bg-[#1D2125] px-2.5 py-0.5 text-xs font-semibold text-[#7AB3EF] border border-[#2B3035]">
                Alternative Intelligence
              </span>
            </div>
            <p className="text-xs text-[#A7AFB5]">
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
            className="flex items-center gap-1.5 rounded-lg bg-[#16A05A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#08783B] disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isLoadingDemo ? 'Loading Demo...' : 'Load Demo (Rajesh Kumar)'}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded-lg border border-[#2B3035] bg-[#1D2125] px-2.5 py-1.5 text-xs font-medium text-[#A7AFB5] hover:bg-[#24292E] hover:text-[#F3F5F4] transition shadow-xs cursor-pointer"
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
