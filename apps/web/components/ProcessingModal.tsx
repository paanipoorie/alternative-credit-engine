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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-[#DDE3E0] text-center">
        {/* Animated Brand Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EBF2FC] text-[#1F4E8C] shadow-xs animate-pulse">
          <Shield className="h-7 w-7" />
        </div>

        <h3 className="mt-4 text-lg font-bold text-[#1F4E8C]">
          Analyzing Your Financial Evidence
        </h3>
        <p className="mt-1 text-xs text-[#5F6368]">
          Connecting extracted records to deterministic scoring core...
        </p>

        {/* Step Progression List */}
        <div className="mt-6 space-y-3 text-left">
          {STAGES.map((stage, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={stage}
                className={`flex items-center gap-3 rounded-lg p-2.5 text-xs transition ${
                  isCurrent
                    ? 'bg-[#EBF2FC] font-semibold text-[#1F4E8C] border border-[#BFDBFE]'
                    : isDone
                    ? 'bg-[#F7F9F8] text-[#0B9348]'
                    : 'text-[#858585] opacity-50'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0B9348]" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#1F4E8C]" />
                ) : (
                  <div className="h-4 w-4 shrink-0 rounded-full border border-[#DDE3E0]" />
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
