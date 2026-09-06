'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { StructuredProfileForm } from '../components/StructuredProfileForm';
import { EvidenceStrengthenView } from '../components/EvidenceStrengthenView';
import { ProcessingModal } from '../components/ProcessingModal';
import { AssessmentView } from '../components/AssessmentView';
import { RecordsDrawer } from '../components/RecordsDrawer';
import { AssessmentProfile, CanonicalEvidence, DeclaredProfile } from '../lib/types';
import {
  fetchEvidenceList,
  uploadEvidenceFile,
  deleteEvidenceItem,
  clearAllEvidence,
  analyzeProfile,
  fetchDemoProfile,
} from '../lib/api';

const DEFAULT_INITIAL_PROFILE: DeclaredProfile = {
  full_name: 'Rajesh Kumar',
  age: 29,
  city: 'Bengaluru',
  pincode: '560038',
  employment_type: 'gig_worker',
  monthly_income: 32000,
  income_channel: 'upi',
  monthly_expenses: 16500,
  dependents: 2,
};

export default function Home() {
  const [declaredProfile, setDeclaredProfile] = useState<DeclaredProfile>(DEFAULT_INITIAL_PROFILE);
  const [evidenceList, setEvidenceList] = useState<CanonicalEvidence[]>([]);
  const [assessment, setAssessment] = useState<AssessmentProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [inspectEvidence, setInspectEvidence] = useState<CanonicalEvidence | null>(null);
  const [activeStep, setActiveStep] = useState<'profile' | 'evidence' | 'processing' | 'assessment'>('profile');

  // Load existing session evidence on mount
  useEffect(() => {
    fetchEvidenceList()
      .then((list) => {
        if (list && list.length > 0) {
          setEvidenceList(list);
        }
      })
      .catch((err) => console.log('API not ready or local mode:', err));
  }, []);

  const handleProfileContinue = (profile: DeclaredProfile) => {
    setDeclaredProfile(profile);
    setActiveStep('evidence');
  };

  const handleEvidenceAdded = (ev: CanonicalEvidence) => {
    setEvidenceList((prev) => {
      const filtered = prev.filter((item) => item.id !== ev.id);
      return [...filtered, ev];
    });
  };

  const handleEvidenceRemoved = async (id: string) => {
    try {
      await deleteEvidenceItem(id);
    } catch (e) {
      console.error(e);
    }
    setEvidenceList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStartAssessment = () => {
    setActiveStep('processing');
    setIsProcessing(true);
  };

  const handleProcessingComplete = async () => {
    try {
      const profile = await analyzeProfile(declaredProfile, evidenceList);
      setAssessment(profile);
      setActiveStep('assessment');
    } catch (err) {
      console.error('Assessment failed, falling back to demo ground truth:', err);
      const demo = await fetchDemoProfile();
      setAssessment(demo);
      setActiveStep('assessment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadDemoCustomer = async () => {
    setIsLoadingSample(true);
    try {
      setDeclaredProfile(DEFAULT_INITIAL_PROFILE);
      const profile = await fetchDemoProfile();
      setAssessment(profile);

      const list = await fetchEvidenceList().catch(() => []);
      if (list && list.length > 0) {
        setEvidenceList(list);
      }
      setActiveStep('assessment');
    } catch (err) {
      console.error('Failed to load demo profile:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleLoadSyntheticSample = async (filename: string) => {
    setIsLoadingSample(true);
    try {
      const res = await fetch(`/samples/${filename}`);
      if (!res.ok) {
        throw new Error(`Failed to load sample ${filename}`);
      }
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
      const ev = await uploadEvidenceFile(file);
      handleEvidenceAdded(ev);
    } catch (err: any) {
      console.error(`Failed to ingest sample ${filename}:`, err);
      alert(`Could not load sample file: ${err.message}`);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleReset = async () => {
    try {
      await clearAllEvidence();
    } catch (e) {
      console.error(e);
    }
    setEvidenceList([]);
    setAssessment(null);
    setDeclaredProfile(DEFAULT_INITIAL_PROFILE);
    setActiveStep('profile');
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-[#F3F5F4]">
      {/* Header Bar */}
      <Header
        onReset={handleReset}
        onLoadDemo={handleLoadDemoCustomer}
        isLoadingDemo={isLoadingSample}
        hasAssessment={!!assessment}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {activeStep === 'profile' && (
          <StructuredProfileForm
            initialProfile={declaredProfile}
            onContinue={handleProfileContinue}
          />
        )}

        {activeStep === 'evidence' && (
          <EvidenceStrengthenView
            declaredProfile={declaredProfile}
            evidenceList={evidenceList}
            onEvidenceAdded={handleEvidenceAdded}
            onEvidenceRemoved={handleEvidenceRemoved}
            onInspectEvidence={(ev) => setInspectEvidence(ev)}
            onBack={() => setActiveStep('profile')}
            onStartAssessment={handleStartAssessment}
            onLoadSyntheticSample={handleLoadSyntheticSample}
            isLoadingSample={isLoadingSample}
          />
        )}

        {activeStep === 'processing' && (
          <ProcessingModal onComplete={handleProcessingComplete} />
        )}

        {activeStep === 'assessment' && assessment && (
          <AssessmentView
            profile={assessment}
            evidenceList={evidenceList}
            onInspectEvidence={(ev) => setInspectEvidence(ev)}
            onUploadMore={() => setActiveStep('evidence')}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Inspect Raw Records Drawer / Modal */}
      {inspectEvidence && (
        <RecordsDrawer
          evidence={inspectEvidence}
          onClose={() => setInspectEvidence(null)}
        />
      )}
    </div>
  );
}
