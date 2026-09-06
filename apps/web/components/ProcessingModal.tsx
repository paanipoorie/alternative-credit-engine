'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Shield } from 'lucide-react';

interface ProcessingModalProps {
  onComplete: () => void;
}

const STAGES = [
  'File received & validated',
  'Document classification identified',
  'Transactions & records extracted',
  'Data integrity verified',
  'Financial behaviour calculated',
  'Generating credit profile',
];

export const ProcessingModal: React.FC<ProcessingModalProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STAGES.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(onComplete, 350);
          return prev;
        }
      });
    }, 280);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#171A1D] p-6 sm:p-8 shadow-2xl border border-[#2B3035] text-center">
        {/* Animated Brand Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E2C3D] text-[#7AB3EF] shadow-xs animate-pulse border border-[#3D78C2]/30">
          <Shield className="h-7 w-7" />
        </div>

        <h3 className="mt-4 text-lg font-bold text-[#F3F5F4]">
          Analyzing Your Financial Evidence
        </h3>
        <p className="mt-1 text-xs text-[#A7AFB5]">
          Organizing evidence and assessing financial behaviour patterns...
        </p>

        {/* Step Progression List */}
        <div className="mt-6 space-y-3 text-left">
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={stage}
                className={`flex items-center gap-3 rounded-lg p-2.5 text-xs transition border ${
                  isCurrent
                    ? 'bg-[#1E2C3D] font-semibold text-[#7AB3EF] border-[#3D78C2]/50'
                    : isDone
                    ? 'bg-[#132E20] text-[#4ADE80] border-[#16A05A]/30'
                    : 'bg-[#1D2125]/50 text-[#737C83] border-[#2B3035]/40 opacity-60'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4ADE80]" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#7AB3EF]" />
                ) : (
                  <div className="h-4 w-4 shrink-0 rounded-full border border-[#2B3035]" />
                )}
                <span>{stage}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
