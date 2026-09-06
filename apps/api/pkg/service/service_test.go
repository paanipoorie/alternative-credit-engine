package service

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestServiceEndToEndIngestAndAssess(t *testing.T) {
	dataDir := findDataDir()
	svc := NewEvidenceService()

	// 1. Ingest UPI CSV
	csvPath := filepath.Join(dataDir, "upi_statement.csv")
	csvBytes, err := os.ReadFile(csvPath)
	if err != nil {
		t.Fatalf("Failed to read upi_statement.csv: %v", err)
	}

	evUPI, err := svc.IngestFile(context.Background(), "upi_statement.csv", "text/csv", csvBytes)
	if err != nil {
		t.Fatalf("IngestFile failed for UPI CSV: %v", err)
	}
	if len(evUPI.UPITransactions) == 0 {
		t.Errorf("Expected extracted UPI transactions")
	}

	// 2. Ingest Utility Bill PDF
	utilPath := filepath.Join(dataDir, "utility_bill_bescom.pdf")
	utilBytes, err := os.ReadFile(utilPath)
	if err != nil {
		t.Fatalf("Failed to read utility_bill_bescom.pdf: %v", err)
	}

	evUtil, err := svc.IngestFile(context.Background(), "utility_bill_bescom.pdf", "application/pdf", utilBytes)
	if err != nil {
		t.Fatalf("IngestFile failed for Utility PDF: %v", err)
	}
	if len(evUtil.UtilityPayments) == 0 {
		t.Errorf("Expected extracted utility payments")
	}

	// 3. Ingest Gig Earnings PDF
	gigPath := filepath.Join(dataDir, "zomato_earnings_summary.pdf")
	gigBytes, err := os.ReadFile(gigPath)
	if err != nil {
		t.Fatalf("Failed to read zomato_earnings_summary.pdf: %v", err)
	}

	evGig, err := svc.IngestFile(context.Background(), "zomato_earnings_summary.pdf", "application/pdf", gigBytes)
	if err != nil {
		t.Fatalf("IngestFile failed for Gig PDF: %v", err)
	}
	if len(evGig.GigPayouts) == 0 {
		t.Errorf("Expected extracted gig payouts")
	}

	// 4. Run Assessment
	profile := svc.AssessCurrent("CUST-TEST-001", "Rajesh Kumar", "gig_worker", nil)
	if profile.FinalScore < 300 || profile.FinalScore > 900 {
		t.Errorf("Final score out of bounds: %d", profile.FinalScore)
	}
	if profile.DataCoverageScore != 80 {
		t.Errorf("Expected 80%% coverage for 3 sources, got %d%%", profile.DataCoverageScore)
	}
	if profile.ConfidenceScore < 85 {
		t.Errorf("Expected confidence >= 85%%, got %d%%", profile.ConfidenceScore)
	}
	if len(profile.PositiveFactors) == 0 {
		t.Errorf("Expected positive factors to be generated")
	}

	t.Logf("End-to-End Ingestion Assessment Score: %d (%s), Confidence: %d%%, Coverage: %d%%",
		profile.FinalScore, profile.RiskBand, profile.ConfidenceScore, profile.DataCoverageScore)
}

func TestServiceInvalidFileRejection(t *testing.T) {
	svc := NewEvidenceService()

	// Corrupt / unidentifiable document
	_, err := svc.IngestFile(context.Background(), "malicious_script.exe", "application/octet-stream", []byte("echo hello"))
	if err == nil {
		t.Errorf("Expected error for executable file upload")
	}

	// Unidentifiable text
	_, err = svc.IngestFile(context.Background(), "notes.pdf", "application/pdf", []byte("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"))
	if err == nil {
		t.Errorf("Expected error for unidentifiable PDF")
	}
}
