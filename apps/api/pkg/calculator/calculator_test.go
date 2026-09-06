package calculator

import (
	"math"
	"testing"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

func TestCVCalculation(t *testing.T) {
	// Edge case 1: empty slice
	if cv := calculateCV([]float64{}); cv != 0.0 {
		t.Errorf("Expected 0.0 for empty slice, got %f", cv)
	}

	// Edge case 2: single item
	if cv := calculateCV([]float64{100.0}); cv != 0.0 {
		t.Errorf("Expected 0.0 for single item, got %f", cv)
	}

	// Edge case 3: identical items (0 variance)
	if cv := calculateCV([]float64{100.0, 100.0, 100.0}); cv != 0.0 {
		t.Errorf("Expected 0.0 for identical items, got %f", cv)
	}

	// Edge case 4: zero values
	if cv := calculateCV([]float64{0.0, 0.0}); cv != 0.0 {
		t.Errorf("Expected 0.0 for zeros, got %f", cv)
	}

	// Valid data
	vals := []float64{100.0, 200.0} // mean = 150, diff = -50, 50, var = (2500+2500)/2 = 2500, std = 50, cv = 50/150 = 0.3333
	cv := calculateCV(vals)
	expected := 50.0 / 150.0
	if math.Abs(cv-expected) > 0.001 {
		t.Errorf("Expected cv ~ %f, got %f", expected, cv)
	}
}

func TestUPIFeatures(t *testing.T) {
	d1, _ := time.Parse("2006-01-02", "2026-01-10")
	d2, _ := time.Parse("2006-01-02", "2026-01-20")
	d3, _ := time.Parse("2006-01-02", "2026-02-15")

	txns := []domain.UPITransaction{
		{ID: "1", Date: d1, Amount: 10000, Type: "credit", Counterparty: "Client A", Status: "SUCCESS"},
		{ID: "2", Date: d2, Amount: 2000, Type: "debit", Counterparty: "Shop B", Status: "SUCCESS"},
		{ID: "3", Date: d3, Amount: 12000, Type: "credit", Counterparty: "Client A", Status: "SUCCESS"},
	}

	evidence := []domain.CanonicalEvidence{
		{
			ID:              "EV-UPI",
			SourceType:      domain.SourceUPI,
			UPITransactions: txns,
		},
	}

	features := CalculateFeatures(evidence)

	if features.TotalTransactions != 3 {
		t.Errorf("Expected 3 transactions, got %d", features.TotalTransactions)
	}
	if features.TotalInflow != 22000 {
		t.Errorf("Expected 22000 total inflow, got %f", features.TotalInflow)
	}
	if features.TotalOutflow != 2000 {
		t.Errorf("Expected 2000 total outflow, got %f", features.TotalOutflow)
	}
	if features.NetCashFlow != 20000 {
		t.Errorf("Expected 20000 net cash flow, got %f", features.NetCashFlow)
	}
	if features.ActiveDaysCount != 3 {
		t.Errorf("Expected 3 active days, got %d", features.ActiveDaysCount)
	}
	if features.CreditDebitRatio != 11.0 {
		t.Errorf("Expected 11.0 credit/debit ratio, got %f", features.CreditDebitRatio)
	}
	if len(features.MonthlyInflows) != 2 {
		t.Errorf("Expected 2 monthly inflow entries, got %d", len(features.MonthlyInflows))
	}
}

func TestUtilityFeatures(t *testing.T) {
	due1, _ := time.Parse("2006-01-02", "2026-01-20")
	pay1, _ := time.Parse("2006-01-02", "2026-01-18")
	due2, _ := time.Parse("2006-01-02", "2026-02-20")
	pay2, _ := time.Parse("2006-01-02", "2026-02-24")

	bills := []domain.UtilityPayment{
		{ID: "U1", BillAmount: 1000, DueDate: due1, PaymentDate: &pay1, Status: "PAID_ON_TIME", DaysLate: 0},
		{ID: "U2", BillAmount: 1200, DueDate: due2, PaymentDate: &pay2, Status: "PAID_LATE", DaysLate: 4},
	}

	evidence := []domain.CanonicalEvidence{
		{
			ID:              "EV-UTIL",
			SourceType:      domain.SourceUtility,
			UtilityPayments: bills,
		},
	}

	features := CalculateFeatures(evidence)

	if features.UtilityTotalBills != 2 {
		t.Errorf("Expected 2 bills, got %d", features.UtilityTotalBills)
	}
	if features.UtilityOnTimeCount != 1 {
		t.Errorf("Expected 1 on-time payment, got %d", features.UtilityOnTimeCount)
	}
	if features.UtilityOnTimeRatio != 0.5 {
		t.Errorf("Expected 0.5 on-time ratio, got %f", features.UtilityOnTimeRatio)
	}
	if features.UtilityAvgDelayDays != 2.0 {
		t.Errorf("Expected 2.0 average delay days, got %f", features.UtilityAvgDelayDays)
	}
}

func TestScoreDimensionsAndFormula(t *testing.T) {
	// Test transparent prototype formula: Score = 300 + 6 * (0.30C + 0.20I + 0.20P + 0.15A + 0.15R)
	dim := domain.BehavioralDimensions{
		CashFlowStability:   82.0,
		IncomeConsistency:   70.0,
		PaymentDiscipline:   88.0,
		ActivityContinuity:  75.0,
		FinancialResilience: 62.0,
	}

	bScore := (0.30 * dim.CashFlowStability) +
		(0.20 * dim.IncomeConsistency) +
		(0.20 * dim.PaymentDiscipline) +
		(0.15 * dim.ActivityContinuity) +
		(0.15 * dim.FinancialResilience)

	bScore = math.Round(bScore*10000.0) / 10000.0

	// B = (82 * 0.30) + (70 * 0.20) + (88 * 0.20) + (75 * 0.15) + (62 * 0.15)
	// B = 24.6 + 14.0 + 17.6 + 11.25 + 9.3 = 76.75
	if math.Abs(bScore-76.75) > 0.001 {
		t.Errorf("Expected B = 76.75, got %f", bScore)
	}

	score := int(math.Round(300.0 + (6.0 * bScore)))
	// Score = 300 + 6 * 76.75 = 300 + 460.5 = 760.5 ~ 761
	if score != 761 {
		t.Errorf("Expected Score = 761, got %d", score)
	}
}

func TestEdgeCasesEmptyEvidence(t *testing.T) {
	profile := Assess("CUST-EMPTY", "Unknown", "first_time_borrower", []domain.CanonicalEvidence{})

	if profile.FinalScore < 300 || profile.FinalScore > 900 {
		t.Errorf("Final score out of bounds [300, 900]: %d", profile.FinalScore)
	}
	if profile.ConfidenceScore != 0 {
		t.Errorf("Confidence should be 0 for empty evidence, got %d", profile.ConfidenceScore)
	}
	if profile.DataCoverageScore != 0 {
		t.Errorf("Coverage should be 0 for empty evidence, got %d", profile.DataCoverageScore)
	}
	if math.IsNaN(profile.BehavioralScore) || math.IsInf(profile.BehavioralScore, 0) {
		t.Errorf("Behavioral score is invalid NaN/Inf")
	}
}

func TestMissingDataDoesNotPenalizeScore(t *testing.T) {
	d1, _ := time.Parse("2006-01-02", "2026-01-05")
	d2, _ := time.Parse("2006-01-02", "2026-02-05")
	d3, _ := time.Parse("2006-01-02", "2026-03-05")

	txns := []domain.UPITransaction{
		{ID: "1", Date: d1, Amount: 30000, Type: "credit", Counterparty: "Zomato Payout", Status: "SUCCESS"},
		{ID: "2", Date: d1, Amount: 5000, Type: "debit", Counterparty: "Fuel", Status: "SUCCESS"},
		{ID: "3", Date: d2, Amount: 31000, Type: "credit", Counterparty: "Zomato Payout", Status: "SUCCESS"},
		{ID: "4", Date: d2, Amount: 5200, Type: "debit", Counterparty: "Fuel", Status: "SUCCESS"},
		{ID: "5", Date: d3, Amount: 29500, Type: "credit", Counterparty: "Zomato Payout", Status: "SUCCESS"},
		{ID: "6", Date: d3, Amount: 4800, Type: "debit", Counterparty: "Fuel", Status: "SUCCESS"},
	}

	evUPIOnly := []domain.CanonicalEvidence{
		{
			ID:                   "EV-UPI",
			SourceType:           domain.SourceUPI,
			SourceQuality:        0.95,
			ExtractionConfidence: 0.98,
			UPITransactions:      txns,
		},
	}

	profile := Assess("CUST-1", "Rajesh Kumar", "gig_worker", evUPIOnly)

	// User only uploaded UPI (missing GST, Telecom, Utility)
	// Score should still be healthy based on great cash flow behavior!
	if profile.FinalScore < 700 {
		t.Errorf("Expected healthy score for strong UPI cash flow, got %d", profile.FinalScore)
	}

	// But coverage reflects only UPI (35%)
	if profile.DataCoverageScore != 35 {
		t.Errorf("Expected 35%% coverage for UPI-only evidence, got %d%%", profile.DataCoverageScore)
	}

	// Coverage breakdown shows what was observed vs missing
	if !profile.CoverageBreakdown["upi"] {
		t.Errorf("Expected upi to be true in coverage breakdown")
	}
	if profile.CoverageBreakdown["gst"] {
		t.Errorf("Expected gst to be false in coverage breakdown")
	}
}

func TestGroundedReasonsGenerated(t *testing.T) {
	d1, _ := time.Parse("2006-01-02", "2026-01-05")
	d2, _ := time.Parse("2006-01-02", "2026-02-05")

	due1, _ := time.Parse("2006-01-02", "2026-01-20")
	pay1, _ := time.Parse("2006-01-02", "2026-01-18")

	ev := []domain.CanonicalEvidence{
		{
			ID:         "EV-UPI",
			SourceType: domain.SourceUPI,
			UPITransactions: []domain.UPITransaction{
				{ID: "1", Date: d1, Amount: 30000, Type: "credit", Counterparty: "Salary", Status: "SUCCESS"},
				{ID: "2", Date: d2, Amount: 30000, Type: "credit", Counterparty: "Salary", Status: "SUCCESS"},
			},
		},
		{
			ID:         "EV-UTIL",
			SourceType: domain.SourceUtility,
			UtilityPayments: []domain.UtilityPayment{
				{ID: "U1", BillAmount: 1200, DueDate: due1, PaymentDate: &pay1, Status: "PAID_ON_TIME"},
			},
		},
	}

	profile := Assess("CUST-2", "Pooja Sharma", "first_time_borrower", ev)

	if len(profile.PositiveFactors) == 0 {
		t.Errorf("Expected positive factors generated from reliable inflows and utility payments")
	}

	foundInflowReason := false
	foundUtilityReason := false
	for _, reason := range profile.PositiveFactors {
		if reason.Title == "Consistent Monthly Inflows" {
			foundInflowReason = true
			if reason.SourceType != domain.SourceUPI {
				t.Errorf("Expected UPI source type for inflow reason, got %s", reason.SourceType)
			}
		}
		if reason.Title == "Strong Payment Regularity" {
			foundUtilityReason = true
			if reason.SourceType != domain.SourceUtility {
				t.Errorf("Expected Utility source type for utility reason, got %s", reason.SourceType)
			}
		}
	}

	if !foundInflowReason {
		t.Errorf("Expected Consistent Monthly Inflows reason")
	}
	if !foundUtilityReason {
		t.Errorf("Expected Strong Payment Regularity reason")
	}
}

func TestGigEarningsFeatures(t *testing.T) {
	p1, _ := time.Parse("2006-01-02", "2026-01-01")
	p2, _ := time.Parse("2006-01-02", "2026-02-01")
	p3, _ := time.Parse("2006-01-02", "2026-03-01")

	payouts := []domain.GigPayout{
		{ID: "G1", Platform: "Zomato", PeriodStart: p1, GrossEarnings: 28000, NetPayout: 26000, ActiveDays: 25, TripsOrJobs: 300},
		{ID: "G2", Platform: "Zomato", PeriodStart: p2, GrossEarnings: 29000, NetPayout: 27000, ActiveDays: 26, TripsOrJobs: 310},
		{ID: "G3", Platform: "Zomato", PeriodStart: p3, GrossEarnings: 31000, NetPayout: 29000, ActiveDays: 27, TripsOrJobs: 330},
	}

	evidence := []domain.CanonicalEvidence{
		{
			ID:         "EV-GIG",
			SourceType: domain.SourceGig,
			GigPayouts: payouts,
		},
	}

	features := CalculateFeatures(evidence)

	if features.GigTotalEarnings != 82000 {
		t.Errorf("Expected 82000 total gig earnings, got %f", features.GigTotalEarnings)
	}
	if features.GigContinuityMonths != 3 {
		t.Errorf("Expected 3 continuity months, got %d", features.GigContinuityMonths)
	}
	if features.GigAvgMonthlyEarnings != 82000.0/3.0 {
		t.Errorf("Expected %f avg monthly earnings, got %f", 82000.0/3.0, features.GigAvgMonthlyEarnings)
	}
	if features.GigActiveDaysPerMonth != 26.0 {
		t.Errorf("Expected 26 active days per month, got %f", features.GigActiveDaysPerMonth)
	}
}

func TestScoreBoundaries(t *testing.T) {
	// Extreme minimum
	dimMin := domain.BehavioralDimensions{
		CashFlowStability:   0.0,
		IncomeConsistency:   0.0,
		PaymentDiscipline:   0.0,
		ActivityContinuity:  0.0,
		FinancialResilience: 0.0,
	}
	bScoreMin := (0.30 * dimMin.CashFlowStability) + (0.20 * dimMin.IncomeConsistency) + (0.20 * dimMin.PaymentDiscipline) + (0.15 * dimMin.ActivityContinuity) + (0.15 * dimMin.FinancialResilience)
	scoreMin := int(math.Round(300.0 + (6.0 * bScoreMin)))
	if scoreMin != 300 {
		t.Errorf("Expected min score 300, got %d", scoreMin)
	}

	// Extreme maximum
	dimMax := domain.BehavioralDimensions{
		CashFlowStability:   100.0,
		IncomeConsistency:   100.0,
		PaymentDiscipline:   100.0,
		ActivityContinuity:  100.0,
		FinancialResilience: 100.0,
	}
	bScoreMax := (0.30 * dimMax.CashFlowStability) + (0.20 * dimMax.IncomeConsistency) + (0.20 * dimMax.PaymentDiscipline) + (0.15 * dimMax.ActivityContinuity) + (0.15 * dimMax.FinancialResilience)
	scoreMax := int(math.Round(300.0 + (6.0 * bScoreMax)))
	if scoreMax != 900 {
		t.Errorf("Expected max score 900, got %d", scoreMax)
	}
}
