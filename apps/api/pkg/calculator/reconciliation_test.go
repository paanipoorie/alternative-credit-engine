package calculator

import (
	"testing"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

func TestReconcileProfiles(t *testing.T) {
	t.Run("Consistent Income and Expenses", func(t *testing.T) {
		declared := &domain.DeclaredProfile{
			FullName:        "Rajesh Kumar",
			MonthlyIncome:   32000,
			MonthlyExpenses: 16000,
			IncomeChannel:   "upi",
		}
		observed := &domain.ObservedProfile{
			ObservedMonthlyIncome:   33000,
			ObservedMonthlyExpenses: 15500,
			ObservedIncomeChannel:   "UPI Transfer",
			ActiveMonths:            4,
		}
		features := domain.DerivedFeatures{
			AvgMonthlyInflow:  33000,
			AvgMonthlyOutflow: 15500,
			ActiveDaysCount:   50,
		}

		report := ReconcileProfiles(declared, observed, features, []domain.CanonicalEvidence{
			{SourceType: domain.SourceUPI},
		})

		if report == nil {
			t.Fatal("expected report to be non-nil")
		}
		if report.OverallStatus != domain.ReconConsistent {
			t.Errorf("expected overall status %s, got %s", domain.ReconConsistent, report.OverallStatus)
		}
	})

	t.Run("Significant Variance", func(t *testing.T) {
		declared := &domain.DeclaredProfile{
			FullName:        "Applicant X",
			MonthlyIncome:   80000,
			MonthlyExpenses: 20000,
			IncomeChannel:   "bank_transfer",
		}
		observed := &domain.ObservedProfile{
			ObservedMonthlyIncome:   25000, // 68.7% divergence
			ObservedMonthlyExpenses: 20000,
			ObservedIncomeChannel:   "UPI Transfer",
			ActiveMonths:            1,
		}
		features := domain.DerivedFeatures{
			AvgMonthlyInflow: 25000,
			ActiveDaysCount:  10,
		}

		report := ReconcileProfiles(declared, observed, features, []domain.CanonicalEvidence{
			{SourceType: domain.SourceUPI},
		})

		if report.OverallStatus != domain.ReconSignificantVariance {
			t.Errorf("expected overall status %s, got %s", domain.ReconSignificantVariance, report.OverallStatus)
		}
	})

	t.Run("Unobserved Attributes", func(t *testing.T) {
		declared := &domain.DeclaredProfile{
			MonthlyIncome:   40000,
			MonthlyExpenses: 20000,
			IncomeChannel:   "cash",
		}
		observed := &domain.ObservedProfile{
			ObservedMonthlyIncome:   0,
			ObservedMonthlyExpenses: 0,
			ObservedIncomeChannel:   "Not Observed",
			ActiveMonths:            0,
		}
		features := domain.DerivedFeatures{}

		report := ReconcileProfiles(declared, observed, features, nil)
		if report.OverallStatus != domain.ReconPartiallyObserved {
			t.Errorf("expected %s, got %s", domain.ReconPartiallyObserved, report.OverallStatus)
		}
	})
}

func TestGenerateAssessmentFlags(t *testing.T) {
	declared := &domain.DeclaredProfile{
		MonthlyIncome: 30000,
	}
	observed := &domain.ObservedProfile{
		ObservedMonthlyIncome: 30500,
		ActiveMonths:          4,
	}
	features := domain.DerivedFeatures{
		AvgMonthlyInflow:   30500,
		UtilityTotalBills:  5,
		UtilityOnTimeCount: 5,
		UtilityOnTimeRatio: 1.0,
		ActiveDaysCount:    60,
	}
	dimensions := domain.BehavioralDimensions{
		CashFlowStability:   85,
		IncomeConsistency:   80,
		PaymentDiscipline:   95,
		ActivityContinuity:  90,
		FinancialResilience: 80,
	}
	evidenceList := []domain.CanonicalEvidence{
		{SourceType: domain.SourceUPI, SourceQuality: 0.9, Provenance: domain.ProvenanceItem{ValidationStatus: "PASSED"}},
		{SourceType: domain.SourceUtility, SourceQuality: 0.85, Provenance: domain.ProvenanceItem{ValidationStatus: "PASSED"}},
	}

	recon := ReconcileProfiles(declared, observed, features, evidenceList)
	flags := GenerateAssessmentFlags(declared, features, dimensions, evidenceList, recon)

	foundConsistent := false
	foundRegularPayment := false
	foundMultiSource := false
	foundLongHistory := false

	for _, fl := range flags {
		switch fl.Code {
		case domain.FlagIncomeConsistent:
			foundConsistent = true
		case domain.FlagPaymentRegular:
			foundRegularPayment = true
		case domain.FlagMultiSourceVerified:
			foundMultiSource = true
		case domain.FlagLongActivityHistory:
			foundLongHistory = true
		}
	}

	if !foundConsistent {
		t.Error("expected FlagIncomeConsistent")
	}
	if !foundRegularPayment {
		t.Error("expected FlagPaymentRegular")
	}
	if !foundMultiSource {
		t.Error("expected FlagMultiSourceVerified")
	}
	if !foundLongHistory {
		t.Error("expected FlagLongActivityHistory")
	}
}

func TestDetermineAssessmentBand(t *testing.T) {
	evList := []domain.CanonicalEvidence{
		{SourceType: domain.SourceUPI, SourceQuality: 0.9},
	}

	t.Run("Low Risk Tier", func(t *testing.T) {
		flags := []domain.AssessmentFlag{
			{Code: domain.FlagIncomeConsistent, Severity: domain.FlagInfo},
		}
		band := DetermineAssessmentBand(780, 85, 70, flags, evList)
		if band != domain.BandLowRisk {
			t.Errorf("expected %s, got %s", domain.BandLowRisk, band)
		}
	})

	t.Run("Review Required for Validation Warning", func(t *testing.T) {
		flags := []domain.AssessmentFlag{
			{Code: domain.FlagEvidenceNeedsReview, Severity: domain.FlagReview},
		}
		band := DetermineAssessmentBand(780, 85, 70, flags, evList)
		if band != domain.BandReviewRequired {
			t.Errorf("expected %s, got %s", domain.BandReviewRequired, band)
		}
	})

	t.Run("Review Required for Low Coverage on High Claim", func(t *testing.T) {
		flags := []domain.AssessmentFlag{}
		band := DetermineAssessmentBand(780, 40, 20, flags, evList)
		if band != domain.BandReviewRequired {
			t.Errorf("expected %s, got %s", domain.BandReviewRequired, band)
		}
	})

	t.Run("Moderate Risk Tier", func(t *testing.T) {
		flags := []domain.AssessmentFlag{}
		band := DetermineAssessmentBand(650, 70, 50, flags, evList)
		if band != domain.BandModerateRisk {
			t.Errorf("expected %s, got %s", domain.BandModerateRisk, band)
		}
	})

	t.Run("High Risk Tier", func(t *testing.T) {
		flags := []domain.AssessmentFlag{}
		band := DetermineAssessmentBand(520, 70, 50, flags, evList)
		if band != domain.BandHighRisk {
			t.Errorf("expected %s, got %s", domain.BandHighRisk, band)
		}
	})
}

func TestGenerateEvidenceTraces(t *testing.T) {
	features := domain.DerivedFeatures{
		TotalInflow:           90000,
		AvgMonthlyInflow:      30000,
		InflowVolatilityCV:    0.12,
		CreditDebitRatio:      1.6,
		NetCashFlow:           14000,
		RecurringInflowRatio:  0.8,
		GigTotalEarnings:      90000,
		GigContinuityMonths:   3,
		GigActiveDaysPerMonth: 22,
		UtilityTotalBills:     4,
		UtilityOnTimeCount:    4,
		UtilityOnTimeRatio:    1.0,
		ActiveDaysCount:       65,
		TotalTransactions:     120,
		ActiveDaysRatio:       0.72,
	}
	dimensions := domain.BehavioralDimensions{
		CashFlowStability:   88,
		IncomeConsistency:   82,
		PaymentDiscipline:   94,
		ActivityContinuity:  89,
		FinancialResilience: 84,
	}
	evidenceList := []domain.CanonicalEvidence{
		{SourceType: domain.SourceUPI, Provenance: domain.ProvenanceItem{DocumentName: "bank_statement.pdf"}},
		{SourceType: domain.SourceGig, Provenance: domain.ProvenanceItem{DocumentName: "zomato_earnings.csv"}},
		{SourceType: domain.SourceUtility, Provenance: domain.ProvenanceItem{DocumentName: "bescom_bill.pdf"}},
	}

	traces := GenerateEvidenceTraces(features, dimensions, evidenceList)
	if len(traces) != 5 {
		t.Fatalf("expected 5 evidence traces, got %d", len(traces))
	}

	for _, tr := range traces {
		if tr.DimensionTitle == "" {
			t.Errorf("trace %s missing DimensionTitle", tr.Dimension)
		}
		if len(tr.Sources) == 0 {
			t.Errorf("trace %s has no sources", tr.Dimension)
		}
		if len(tr.ExtractedSignals) == 0 {
			t.Errorf("trace %s has no extracted signals", tr.Dimension)
		}
	}
}

func TestAssessEndToEndIntegration(t *testing.T) {
	declared := &domain.DeclaredProfile{
		FullName:        "Rajesh Kumar",
		Age:             29,
		City:            "Bengaluru",
		Pincode:         "560038",
		EmploymentType:  "gig_worker",
		MonthlyIncome:   32000,
		IncomeChannel:   "upi",
		MonthlyExpenses: 16500,
		Dependents:      2,
	}

	evidenceList := []domain.CanonicalEvidence{
		{
			ID:             "EV-UPI",
			SourceType:     domain.SourceUPI,
			SourceProvider: "Axis UPI",
			SourceQuality:  0.95,
			Provenance: domain.ProvenanceItem{
				DocumentName:     "upi_records.csv",
				ValidationStatus: "PASSED",
				IngestedAt:       time.Now(),
			},
			UPITransactions: []domain.UPITransaction{
				{Date: time.Date(2026, 1, 5, 0, 0, 0, 0, time.UTC), Amount: 32000, Type: "credit", Status: "SUCCESS"},
				{Date: time.Date(2026, 1, 10, 0, 0, 0, 0, time.UTC), Amount: 15000, Type: "debit", Status: "SUCCESS"},
				{Date: time.Date(2026, 2, 5, 0, 0, 0, 0, time.UTC), Amount: 32000, Type: "credit", Status: "SUCCESS"},
				{Date: time.Date(2026, 2, 10, 0, 0, 0, 0, time.UTC), Amount: 16000, Type: "debit", Status: "SUCCESS"},
			},
		},
	}

	profile := Assess("CUST-100", "Rajesh Kumar", "gig_worker", evidenceList, declared)

	if profile.Reconciliation == nil {
		t.Fatal("expected Reconciliation to be populated")
	}
	if profile.AssessmentBand == "" {
		t.Fatal("expected AssessmentBand to be populated")
	}
	if len(profile.AssessmentFlags) == 0 {
		t.Fatal("expected AssessmentFlags to be generated")
	}
	if len(profile.EvidenceTraces) != 5 {
		t.Fatalf("expected 5 evidence traces, got %d", len(profile.EvidenceTraces))
	}
}
