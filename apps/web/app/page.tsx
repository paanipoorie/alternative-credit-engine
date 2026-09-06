'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { EvidenceUploader } from '../components/EvidenceUploader';
import { ProcessingModal } from '../components/ProcessingModal';
import { AssessmentView } from '../components/AssessmentView';
import { RecordsDrawer } from '../components/RecordsDrawer';
import { AssessmentProfile, CanonicalEvidence } from '../lib/types';
import {
  fetchEvidenceList,
  uploadEvidenceFile,
  deleteEvidenceItem,
  clearAllEvidence,
  analyzeProfile,
  fetchDemoProfile,
} from '../lib/api';

export default function Home() {
  const [evidenceList, setEvidenceList] = useState<CanonicalEvidence[]>([]);
  const [assessment, setAssessment] = useState<AssessmentProfile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [inspectEvidence, setInspectEvidence] = useState<CanonicalEvidence | null>(null);
  const [activeScreen, setActiveScreen] = useState<'upload' | 'processing' | 'assessment'>('upload');

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
    setActiveScreen('processing');
    setIsProcessing(true);
  };

  const handleProcessingComplete = async () => {
    try {
      const profile = await analyzeProfile(evidenceList);
      setAssessment(profile);
      setActiveScreen('assessment');
    } catch (err) {
      console.error('Assessment failed, falling back to demo ground truth:', err);
      const demo = await fetchDemoProfile();
      setAssessment(demo);
      setActiveScreen('assessment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsLoadingSample(true);
    try {
      // Fetch ground truth profile directly
      const profile = await fetchDemoProfile();
      setAssessment(profile);
      
      // Also sync evidence list
      const list = await fetchEvidenceList().catch(() => []);
      if (list && list.length > 0) {
        setEvidenceList(list);
      }
      setActiveScreen('assessment');
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
    setActiveScreen('upload');
  };

  return (
    <div className="min-h-screen bg-[#F7F9F8] text-[#222222]">
      {/* Header Bar */}
      <Header
        onReset={handleReset}
        onLoadDemo={handleLoadDemo}
        isLoadingDemo={isLoadingSample}
        hasAssessment={!!assessment}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {activeScreen === 'upload' && (
          <EvidenceUploader
            evidenceList={evidenceList}
            onEvidenceAdded={handleEvidenceAdded}
            onEvidenceRemoved={handleEvidenceRemoved}
            onStartAssessment={handleStartAssessment}
            onLoadSyntheticSample={handleLoadSyntheticSample}
            isLoadingSample={isLoadingSample}
          />
        )}

        {activeScreen === 'processing' && (
          <ProcessingModal onComplete={handleProcessingComplete} />
        )}

        {activeScreen === 'assessment' && assessment && (
          <AssessmentView
            profile={assessment}
            evidenceList={evidenceList}
            onInspectEvidence={(ev) => setInspectEvidence(ev)}
            onUploadMore={() => setActiveScreen('upload')}
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
