package calculator

import (
	"encoding/csv"
	"encoding/json"
	"os"
	"path/filepath"
	"strconv"
	"testing"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

func findDataDir() string {
	candidates := []string{
		"../../../../data/synthetic",
		"../../../data/synthetic",
		"../../data/synthetic",
		"data/synthetic",
		"/home/nish4nt/dev/alternative-credit-engine/data/synthetic",
	}
	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return "data/synthetic"
}

func TestSyntheticDatasetsAssessment(t *testing.T) {
	dataDir := findDataDir()

	// 1. Load Synthetic UPI CSV
	csvPath := filepath.Join(dataDir, "upi_statement.csv")
	csvFile, err := os.Open(csvPath)
	if err != nil {
		t.Fatalf("Failed to open synthetic UPI CSV (%s): %v", csvPath, err)
	}
	defer csvFile.Close()

	reader := csv.NewReader(csvFile)
	records, err := reader.ReadAll()
	if err != nil {
		t.Fatalf("Failed to parse synthetic UPI CSV: %v", err)
	}

	var upiTxns []domain.UPITransaction
	for i, row := range records {
		if i == 0 || len(row) < 8 {
			continue // Skip header
		}
		amt, _ := strconv.ParseFloat(row[2], 64)
		parsedDate, _ := time.Parse("2006-01-02 15:04:05", row[1])

		upiTxns = append(upiTxns, domain.UPITransaction{
			ID:           row[0],
			Date:         parsedDate,
			Amount:       amt,
			Type:         row[3],
			Counterparty: row[4],
			Description:  row[5],
			Status:       row[6],
			Category:     row[7],
		})
	}

	if len(upiTxns) == 0 {
		t.Fatalf("Expected non-empty UPI transactions from synthetic CSV")
	}

	// 2. Load Synthetic Utility JSON
	utilPath := filepath.Join(dataDir, "utility_bills.json")
	utilBytes, err := os.ReadFile(utilPath)
	if err != nil {
		t.Fatalf("Failed to open synthetic utility JSON (%s): %v", utilPath, err)
	}
	var utilityPayments []domain.UtilityPayment
	if err := json.Unmarshal(utilBytes, &utilityPayments); err != nil {
		t.Fatalf("Failed to parse synthetic utility JSON: %v", err)
	}

	// 3. Load Synthetic Gig JSON
	gigPath := filepath.Join(dataDir, "gig_payouts.json")
	gigBytes, err := os.ReadFile(gigPath)
	if err != nil {
		t.Fatalf("Failed to open synthetic gig JSON (%s): %v", gigPath, err)
	}
	var gigPayouts []domain.GigPayout
	if err := json.Unmarshal(gigBytes, &gigPayouts); err != nil {
		t.Fatalf("Failed to parse synthetic gig JSON: %v", err)
	}

	// Assemble Canonical Evidence Bundles
	evidenceList := []domain.CanonicalEvidence{
		{
			ID:                   "EV-UPI-001",
			CustomerID:           "CUST-RAJESH-001",
			SourceType:           domain.SourceUPI,
			SourceProvider:       "BHIM UPI / Bank",
			PeriodStart:          "2026-01-01",
			PeriodEnd:            "2026-03-31",
			SourceQuality:        0.95,
			ExtractionConfidence: 0.98,
			Provenance: domain.ProvenanceItem{
				EvidenceID:           "EV-UPI-001",
				SourceType:           domain.SourceUPI,
				DocumentName:         "upi_statement.csv",
				DocumentFormat:       domain.FormatCSV,
				PeriodStart:          "2026-01-01",
				PeriodEnd:            "2026-03-31",
				RecordCount:          len(upiTxns),
				ExtractionConfidence: 0.98,
				SourceQualityScore:   0.95,
				ValidationStatus:     "PASSED",
				IngestedAt:           time.Now(),
			},
			UPITransactions: upiTxns,
		},
		{
			ID:                   "EV-UTIL-002",
			CustomerID:           "CUST-RAJESH-001",
			SourceType:           domain.SourceUtility,
			SourceProvider:       "BESCOM Electricity",
			PeriodStart:          "2025-11-01",
			PeriodEnd:            "2026-03-31",
			SourceQuality:        0.90,
			ExtractionConfidence: 0.95,
			Provenance: domain.ProvenanceItem{
				EvidenceID:           "EV-UTIL-002",
				SourceType:           domain.SourceUtility,
				DocumentName:         "utility_bill_bescom.pdf",
				DocumentFormat:       domain.FormatPDF,
				PeriodStart:          "2025-11-01",
				PeriodEnd:            "2026-03-31",
				RecordCount:          len(utilityPayments),
				ExtractionConfidence: 0.95,
				SourceQualityScore:   0.90,
				ValidationStatus:     "PASSED",
				IngestedAt:           time.Now(),
			},
			UtilityPayments: utilityPayments,
		},
		{
			ID:                   "EV-GIG-003",
			CustomerID:           "CUST-RAJESH-001",
			SourceType:           domain.SourceGig,
			SourceProvider:       "Zomato Delivery Partner",
			PeriodStart:          "2026-01-01",
			PeriodEnd:            "2026-03-31",
			SourceQuality:        0.95,
			ExtractionConfidence: 0.96,
			Provenance: domain.ProvenanceItem{
				EvidenceID:           "EV-GIG-003",
				SourceType:           domain.SourceGig,
				DocumentName:         "zomato_earnings_summary.pdf",
				DocumentFormat:       domain.FormatPDF,
				PeriodStart:          "2026-01-01",
				PeriodEnd:            "2026-03-31",
				RecordCount:          len(gigPayouts),
				ExtractionConfidence: 0.96,
				SourceQualityScore:   0.95,
				ValidationStatus:     "PASSED",
				IngestedAt:           time.Now(),
			},
			GigPayouts: gigPayouts,
		},
	}

	// Execute Assessment
	profile := Assess("CUST-RAJESH-001", "Rajesh Kumar", "gig_worker", evidenceList)

	// Validate deterministic constraints
	if profile.FinalScore < 300 || profile.FinalScore > 900 {
		t.Fatalf("Score out of bounds: %d", profile.FinalScore)
	}
	if profile.ConfidenceScore < 70 || profile.ConfidenceScore > 100 {
		t.Fatalf("Confidence unexpected: %d%%", profile.ConfidenceScore)
	}
	if profile.DataCoverageScore != 80 { // UPI (35%) + Gig (25%) + Utility (20%) = 80%
		t.Fatalf("Expected 80%% coverage, got %d%%", profile.DataCoverageScore)
	}

	// Verify dimensions are within valid range
	d := profile.Dimensions
	if d.CashFlowStability < 50 || d.CashFlowStability > 100 {
		t.Errorf("CashFlowStability unexpected: %f", d.CashFlowStability)
	}
	if d.IncomeConsistency < 50 || d.IncomeConsistency > 100 {
		t.Errorf("IncomeConsistency unexpected: %f", d.IncomeConsistency)
	}
	if d.PaymentDiscipline < 50 || d.PaymentDiscipline > 100 {
		t.Errorf("PaymentDiscipline unexpected: %f", d.PaymentDiscipline)
	}
	if d.ActivityContinuity < 50 || d.ActivityContinuity > 100 {
		t.Errorf("ActivityContinuity unexpected: %f", d.ActivityContinuity)
	}
	if d.FinancialResilience < 50 || d.FinancialResilience > 100 {
		t.Errorf("FinancialResilience unexpected: %f", d.FinancialResilience)
	}

	// Verify reasons
	if len(profile.PositiveFactors) < 3 {
		t.Errorf("Expected at least 3 positive factors, got %d", len(profile.PositiveFactors))
	}

	t.Logf("=== Synthetic Dataset Ground-Truth Assessment ===")
	t.Logf("Customer: %s (%s)", profile.CustomerName, profile.PersonaType)
	t.Logf("Score: %d / 900 (%s)", profile.FinalScore, profile.RiskBand)
	t.Logf("Behavioral Score (B): %.2f", profile.BehavioralScore)
	t.Logf("Confidence: %d%% | Coverage: %d%%", profile.ConfidenceScore, profile.DataCoverageScore)
	t.Logf("Dimensions: CashFlow=%.1f, Income=%.1f, Payment=%.1f, Activity=%.1f, Resilience=%.1f",
		d.CashFlowStability, d.IncomeConsistency, d.PaymentDiscipline, d.ActivityContinuity, d.FinancialResilience)
	t.Logf("Positive Reasons: %d | Attention Reasons: %d", len(profile.PositiveFactors), len(profile.AttentionFactors))
}
