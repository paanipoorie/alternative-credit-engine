package calculator_test

import (
	"testing"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/calculator"
	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

// Scenario 1: Document content hashing and metadata retention
func TestDocumentIntegrityAndHashing(t *testing.T) {
	evList := []domain.CanonicalEvidence{
		{
			ID:             "EV-1",
			SourceType:     domain.SourceUPI,
			PeriodStart:    "2026-01-01",
			PeriodEnd:      "2026-03-31",
			Provenance: domain.ProvenanceItem{
				DocumentName: "bank_statement.pdf",
				ContentHash:  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
				FileSize:     10240,
				MimeType:     "application/pdf",
			},
		},
	}

	deduped, _, _ := calculator.DeduplicateAndFilterEvidence(evList)
	if len(deduped) != 1 {
		t.Fatalf("expected 1 evidence item, got %d", len(deduped))
	}
	if deduped[0].Provenance.ContentHash != "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" {
		t.Errorf("expected content hash to be preserved, got %s", deduped[0].Provenance.ContentHash)
	}
}

// Scenario 2 & 3: Duplicate document upload detection (same hash, same/different filename)
func TestDuplicateDocumentDetection(t *testing.T) {
	sameHash := "aabbcc1122334455"
	evList := []domain.CanonicalEvidence{
		{
			ID:          "EV-ORIGINAL",
			SourceType:  domain.SourceUPI,
			PeriodStart: "2026-01-01",
			PeriodEnd:   "2026-03-31",
			Provenance: domain.ProvenanceItem{
				DocumentName: "upi_statement_jan.csv",
				ContentHash:  sameHash,
			},
		},
		{
			ID:          "EV-DUPLICATE-COPY",
			SourceType:  domain.SourceUPI,
			PeriodStart: "2026-01-01",
			PeriodEnd:   "2026-03-31",
			Provenance: domain.ProvenanceItem{
				DocumentName: "upi_statement_jan_renamed.csv",
				ContentHash:  sameHash,
			},
		},
	}

	deduped, dupNotes, _ := calculator.DeduplicateAndFilterEvidence(evList)
	if len(dupNotes) != 1 {
		t.Fatalf("expected 1 duplicate note, got %d", len(dupNotes))
	}
	if deduped[1].Provenance.DuplicateOf != "upi_statement_jan.csv" {
		t.Errorf("expected DuplicateOf to point to original file, got '%s'", deduped[1].Provenance.DuplicateOf)
	}
}

// Scenario 4: Overlapping transaction detection & deduplication (prevent double counting)
func TestTransactionDeduplication(t *testing.T) {
	t1, _ := time.Parse("2006-01-02", "2026-01-15")
	txnsDoc1 := []domain.UPITransaction{
		{ID: "TXN-1", Date: t1, Amount: 5000, Type: "credit", Counterparty: "Zomato", Status: "SUCCESS"},
		{ID: "TXN-2", Date: t1, Amount: 200, Type: "debit", Counterparty: "Chai", Status: "SUCCESS"},
	}
	// Identical transaction in Doc 2
	txnsDoc2 := []domain.UPITransaction{
		{ID: "TXN-3", Date: t1, Amount: 5000, Type: "credit", Counterparty: "Zomato", Status: "SUCCESS"},
		{ID: "TXN-4", Date: t1, Amount: 800, Type: "debit", Counterparty: "Grocery", Status: "SUCCESS"},
	}

	evList := []domain.CanonicalEvidence{
		{ID: "EV-1", SourceType: domain.SourceUPI, UPITransactions: txnsDoc1},
		{ID: "EV-2", SourceType: domain.SourceUPI, UPITransactions: txnsDoc2},
	}

	deduped, _, dupTxnCount := calculator.DeduplicateAndFilterEvidence(evList)
	if dupTxnCount != 1 {
		t.Fatalf("expected 1 duplicate transaction detected, got %d", dupTxnCount)
	}

	// Calculate features and verify total inflow is ₹5,000 (not double counted to ₹10,000)
	features := calculator.CalculateFeatures(deduped)
	if features.TotalInflow != 5000 {
		t.Errorf("expected total inflow to be ₹5000 after deduplication, got ₹%.2f", features.TotalInflow)
	}
}

// Scenario 5: Observation completeness and density check
func TestObservationDensity(t *testing.T) {
	// 5 days active vs 45 days active
	fShort := domain.DerivedFeatures{ActiveDaysCount: 8}
	evShort := []domain.CanonicalEvidence{{PeriodStart: "2026-03-01", PeriodEnd: "2026-03-10"}}

	_, densityShort, _ := calculator.EvaluateObservationDensity(fShort, evShort)
	if densityShort != domain.CodeLowObservationDensity {
		t.Errorf("expected LOW_OBSERVATION_DENSITY for 8 days, got %s", densityShort)
	}

	fComplete := domain.DerivedFeatures{
		ActiveDaysCount: 50,
		MonthlyInflows: []domain.MonthlyMetric{
			{Month: "2026-01", Amount: 30000},
			{Month: "2026-02", Amount: 32000},
			{Month: "2026-03", Amount: 31000},
		},
	}
	evComplete := []domain.CanonicalEvidence{{PeriodStart: "2026-01-01", PeriodEnd: "2026-03-31"}}
	_, densityComplete, _ := calculator.EvaluateObservationDensity(fComplete, evComplete)
	if densityComplete != "COMPLETE" {
		t.Errorf("expected COMPLETE density for 3 months, got %s", densityComplete)
	}
}

// Scenario 6: Declared vs observed income contradiction (>25% divergence)
func TestContradictionEngineDeclaredIncomeMismatch(t *testing.T) {
	declared := &domain.DeclaredProfile{
		MonthlyIncome: 50000,
	}
	features := domain.DerivedFeatures{
		AvgMonthlyInflow: 15000, // 70% divergence
		MonthlyInflows:   []domain.MonthlyMetric{{Month: "2026-01", Amount: 15000}},
	}
	evList := []domain.CanonicalEvidence{
		{ID: "EV-1", SourceType: domain.SourceUPI, PeriodStart: "2026-01-01", PeriodEnd: "2026-03-31"},
	}

	observed := calculator.BuildObservedProfile(features, evList)
	recon := calculator.ReconcileProfiles(declared, observed, features, evList)
	contradictions := calculator.RunContradictionEngine(declared, features, evList, recon, 0, nil)

	foundMismatch := false
	for _, c := range contradictions {
		if c.Code == domain.CodeDeclaredObservedIncomeMismatch && c.Severity == domain.SeverityReview {
			foundMismatch = true
			break
		}
	}

	if !foundMismatch {
		t.Fatalf("expected REVIEW level DECLARED_OBSERVED_INCOME_MISMATCH contradiction")
	}
}

// Scenario 7: Cross-source income contradiction (Gig vs UPI)
func TestCrossSourceIncomeMismatch(t *testing.T) {
	declared := &domain.DeclaredProfile{MonthlyIncome: 35000}
	features := domain.DerivedFeatures{
		GigAvgMonthlyEarnings: 40000, // Claims 40k gig earnings
		AvgMonthlyInflow:      15000, // But bank account shows only 15k
		MonthlyInflows:        []domain.MonthlyMetric{{Month: "2026-01", Amount: 15000}},
	}
	evList := []domain.CanonicalEvidence{
		{ID: "EV-GIG", SourceType: domain.SourceGig, GigPayouts: []domain.GigPayout{{GrossEarnings: 40000}}},
		{ID: "EV-UPI", SourceType: domain.SourceUPI, UPITransactions: []domain.UPITransaction{{Amount: 15000}}},
	}

	observed := calculator.BuildObservedProfile(features, evList)
	recon := calculator.ReconcileProfiles(declared, observed, features, evList)
	contradictions := calculator.RunContradictionEngine(declared, features, evList, recon, 0, nil)

	foundCrossMismatch := false
	for _, c := range contradictions {
		if c.Code == domain.CodeCrossSourceIncomeMismatch {
			foundCrossMismatch = true
			break
		}
	}

	if !foundCrossMismatch {
		t.Fatalf("expected CROSS_SOURCE_INCOME_MISMATCH contradiction when gig earnings diverge from bank inflows")
	}
}

// Scenario 8: Extraction / validation inconsistency detection
func TestExtractionInconsistencyContradiction(t *testing.T) {
	evList := []domain.CanonicalEvidence{
		{
			ID:                   "EV-1",
			SourceType:           domain.SourceUPI,
			ExtractionConfidence: 0.55, // Low extraction confidence
			Provenance: domain.ProvenanceItem{
				DocumentName:     "blurry_scanned_receipt.jpg",
				ValidationStatus: domain.ValidationNeedsReview,
			},
		},
	}

	contradictions := calculator.RunContradictionEngine(nil, domain.DerivedFeatures{}, evList, nil, 0, nil)
	if len(contradictions) == 0 {
		t.Fatalf("expected contradiction finding for NEEDS_REVIEW validation status")
	}
}

// Scenario 9: Evidence quality state evaluation (HIGH, MEDIUM, LOW, UNRELIABLE)
func TestEvidenceQualityState(t *testing.T) {
	// Test High Quality
	highEvList := []domain.CanonicalEvidence{
		{
			ID:                   "EV-1",
			ExtractionConfidence: 0.95,
			Provenance:           domain.ProvenanceItem{ValidationStatus: domain.ValidationValid},
		},
	}
	highQuality := calculator.AssessEvidenceQuality(highEvList, nil, nil, 0, nil, "Jan 2026 - Mar 2026", "COMPLETE", nil)
	if highQuality.OverallQuality != domain.QualityHigh {
		t.Errorf("expected HIGH quality, got %s", highQuality.OverallQuality)
	}

	// Test Unreliable Quality
	failedEvList := []domain.CanonicalEvidence{
		{
			ID:                   "EV-2",
			ExtractionConfidence: 0.90,
			Provenance:           domain.ProvenanceItem{ValidationStatus: domain.ValidationFailed},
		},
	}
	unreliableQuality := calculator.AssessEvidenceQuality(failedEvList, nil, nil, 0, nil, "Jan 2026", "PARTIAL", nil)
	if unreliableQuality.OverallQuality != domain.QualityUnreliable {
		t.Errorf("expected UNRELIABLE quality, got %s", unreliableQuality.OverallQuality)
	}
}

// Scenario 10: Decision Guardrail: High Score + Low Coverage (<30%) triggers REVIEW_REQUIRED
func TestDecisionGuardrailHighCoverageThreshold(t *testing.T) {
	finalScore := 780 // Prime score
	confidence := 85
	coverage := 20 // Low coverage (<30%)

	quality := &domain.EvidenceQualityReport{OverallQuality: domain.QualityMedium}
	band, reviewDetails := calculator.EvaluateDecisionGuardrails(finalScore, confidence, coverage, quality, nil, nil, nil)

	if band != domain.BandReviewRequired {
		t.Fatalf("expected REVIEW_REQUIRED band for high score with low coverage (<30%%), got %s", band)
	}
	if reviewDetails == nil || reviewDetails.TriggerReason == "" {
		t.Errorf("expected populated ReviewRequiredDetail")
	}
}

// Scenario 11: Decision Guardrail: High Score + Low Confidence (<60%) triggers REVIEW_REQUIRED
func TestDecisionGuardrailLowConfidence(t *testing.T) {
	finalScore := 760
	confidence := 45 // Low confidence (<60%)
	coverage := 60

	quality := &domain.EvidenceQualityReport{OverallQuality: domain.QualityMedium}
	band, reviewDetails := calculator.EvaluateDecisionGuardrails(finalScore, confidence, coverage, quality, nil, nil, nil)

	if band != domain.BandReviewRequired {
		t.Fatalf("expected REVIEW_REQUIRED band for high score with low confidence (<60%%), got %s", band)
	}
	if reviewDetails == nil {
		t.Errorf("expected populated ReviewRequiredDetail")
	}
}

// Scenario 12: Score vs Trust Separation: Contradiction triggers REVIEW_REQUIRED without altering credit score
func TestScoreVsTrustSeparation(t *testing.T) {
	declared := &domain.DeclaredProfile{
		MonthlyIncome:   70000,
		IncomeChannel:   "upi",
		MonthlyExpenses: 20000,
	}

	t1, _ := time.Parse("2006-01-02", "2026-01-15")
	t2, _ := time.Parse("2006-01-02", "2026-02-15")
	t3, _ := time.Parse("2006-01-02", "2026-03-15")

	txns := []domain.UPITransaction{
		{ID: "T-1", Date: t1, Amount: 15000, Type: "credit", Counterparty: "Client A", Status: "SUCCESS"},
		{ID: "T-2", Date: t2, Amount: 15000, Type: "credit", Counterparty: "Client A", Status: "SUCCESS"},
		{ID: "T-3", Date: t3, Amount: 15000, Type: "credit", Counterparty: "Client A", Status: "SUCCESS"},
		{ID: "T-4", Date: t1, Amount: 3000, Type: "debit", Counterparty: "Rent", Status: "SUCCESS"},
	}

	evList := []domain.CanonicalEvidence{
		{
			ID:                   "EV-UPI",
			SourceType:           domain.SourceUPI,
			PeriodStart:          "2026-01-01",
			PeriodEnd:            "2026-03-31",
			SourceQuality:        0.95,
			ExtractionConfidence: 0.95,
			UPITransactions:      txns,
			Provenance: domain.ProvenanceItem{
				DocumentName:     "upi_statement.csv",
				ValidationStatus: domain.ValidationValid,
			},
		},
	}

	profile := calculator.Assess("CUST-1", "Test Applicant", "freelancer", evList, declared)

	// Final credit score is mathematically computed from features
	if profile.FinalScore < 300 || profile.FinalScore > 900 {
		t.Errorf("score should be valid 300-900, got %d", profile.FinalScore)
	}

	// Band must be REVIEW_REQUIRED due to declared ₹70k vs observed ₹15k mismatch
	if profile.AssessmentBand != domain.BandReviewRequired {
		t.Errorf("expected AssessmentBand REVIEW_REQUIRED due to income divergence, got %s", profile.AssessmentBand)
	}

	if profile.ReviewDetails == nil {
		t.Errorf("expected ReviewDetails to explain underwriter review reason")
	}
}

// Scenario 13: 7-Stage Evidence Trace generation across all dimensions
func TestSevenStageTraceGeneration(t *testing.T) {
	features := domain.DerivedFeatures{
		TotalInflow:         35000,
		InflowVolatilityCV:  0.15,
		CreditDebitRatio:    1.8,
		UtilityTotalBills:   4,
		UtilityOnTimeRatio:  1.0,
		GigContinuityMonths: 3,
		ActiveDaysCount:     40,
		TotalTransactions:   30,
	}
	dims := domain.BehavioralDimensions{
		CashFlowStability:   85,
		IncomeConsistency:   80,
		PaymentDiscipline:   90,
		ActivityContinuity:  82,
		FinancialResilience: 84,
	}
	evList := []domain.CanonicalEvidence{
		{ID: "EV-1", SourceType: domain.SourceUPI, Provenance: domain.ProvenanceItem{DocumentName: "upi.csv"}},
		{ID: "EV-2", SourceType: domain.SourceUtility, Provenance: domain.ProvenanceItem{DocumentName: "utility.pdf"}},
		{ID: "EV-3", SourceType: domain.SourceGig, Provenance: domain.ProvenanceItem{DocumentName: "gig.pdf"}},
	}

	traces := calculator.GenerateSevenStageTraces(features, dims, evList)
	if len(traces) != 5 {
		t.Fatalf("expected 5 behavioral dimension traces, got %d", len(traces))
	}

	for _, tr := range traces {
		if tr.Stages == nil {
			t.Fatalf("expected Stages to be populated for dimension %s", tr.Dimension)
		}
		if tr.Stages.Document == "" || tr.Stages.Extraction == "" || tr.Stages.Validation == "" ||
			tr.Stages.Normalization == "" || tr.Stages.ConsistencyCheck == "" ||
			tr.Stages.BehaviouralSignal == "" || tr.Stages.AssessmentImpact == "" {
			t.Errorf("incomplete 7-stage details for dimension %s", tr.Dimension)
		}
	}
}
