package extractor

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

func findTestDataDir() string {
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

func TestClassifyDocuments(t *testing.T) {
	tests := []struct {
		filename   string
		text       string
		wantSource domain.SourceType
	}{
		{
			filename:   "upi_statement.pdf",
			text:       "BHIM UPI / Bank Account Statement\nAccount Holder: Rajesh Kumar | UPI ID: rajesh.k@okhdfcbank",
			wantSource: domain.SourceUPI,
		},
		{
			filename:   "upi_statement.csv",
			text:       "txn_id,date,amount,type,counterparty,description,status,category\nTXN-001,2026-01-02,3500,credit,Zomato",
			wantSource: domain.SourceUPI,
		},
		{
			filename:   "utility_bill_bescom.pdf",
			text:       "BESCOM - Electricity Bill & Payment Receipt\nConsumer No: 8842109912 | Sub-division: Indiranagar",
			wantSource: domain.SourceUtility,
		},
		{
			filename:   "zomato_earnings_summary.pdf",
			text:       "Zomato Delivery Partner - Monthly Earnings Summary\nPartner ID: ZOM-99214 | Partner Name: Rajesh Kumar",
			wantSource: domain.SourceGig,
		},
		{
			// Verify random filename is classified by content, not filename
			filename:   "random_statement_123.pdf",
			text:       "BHIM UPI / Bank Account Statement\nAccount Holder: Rajesh Kumar | UPI ID: rajesh.k@okhdfcbank",
			wantSource: domain.SourceUPI,
		},
		{
			filename:   "random_utility_doc.pdf",
			text:       "BESCOM - Electricity Bill & Payment Receipt\nConsumer No: 8842109912 | Amount Payable: 1350.00",
			wantSource: domain.SourceUtility,
		},
		{
			filename:   "random_gig_doc.pdf",
			text:       "Zomato Delivery Partner - Monthly Earnings Summary\nPartner ID: ZOM-99214 | Active Days: 26 | Net Payout: 25000",
			wantSource: domain.SourceGig,
		},
		{
			filename:   "random_document.pdf",
			text:       "General receipt for office stationary with no alternative credit indicators",
			wantSource: "",
		},
	}

	for _, tt := range tests {
		res := ClassifyDocument(tt.filename, "application/pdf", tt.text)
		if res.SourceType != tt.wantSource {
			t.Errorf("ClassifyDocument(%s) = %v, want %v", tt.filename, res.SourceType, tt.wantSource)
		}
	}
}

func TestNormalizeToEvents(t *testing.T) {
	ev := &domain.CanonicalEvidence{
		ID:                   "EV-TEST-001",
		SourceType:           domain.SourceUPI,
		ExtractionConfidence: 0.96,
		UPITransactions: []domain.UPITransaction{
			{
				ID:           "TXN-001",
				Date:         time.Now(),
				Amount:       1500,
				Type:         "credit",
				Counterparty: "Zomato",
				Description:  "Payout",
				Status:       "SUCCESS",
				Category:     "gig_earnings",
			},
		},
	}

	events := NormalizeToEvents(ev)
	if len(events) != 1 {
		t.Fatalf("Expected 1 event, got %d", len(events))
	}
	if events[0].EventType != "transaction" {
		t.Errorf("Expected event type transaction, got %s", events[0].EventType)
	}
	if events[0].Amount != 1500 {
		t.Errorf("Expected amount 1500, got %f", events[0].Amount)
	}
	if events[0].Direction != "credit" {
		t.Errorf("Expected direction credit, got %s", events[0].Direction)
	}
}

func TestExtractAndParseSyntheticPDFs(t *testing.T) {
	dataDir := findTestDataDir()

	// 1. UPI PDF
	upiPDFPath := filepath.Join(dataDir, "upi_statement.pdf")
	upiBytes, err := os.ReadFile(upiPDFPath)
	if err != nil {
		t.Fatalf("Failed to read upi_statement.pdf: %v", err)
	}

	upiText, err := ExtractTextFromPDF(upiBytes)
	if err != nil {
		t.Fatalf("ExtractTextFromPDF failed for upi_statement.pdf: %v", err)
	}
	if len(upiText) == 0 {
		t.Fatalf("Extracted empty text from upi_statement.pdf")
	}

	upiTxns, err := ParseUPIText(upiText)
	if err != nil {
		t.Fatalf("ParseUPIText failed: %v", err)
	}
	if len(upiTxns) < 10 {
		t.Errorf("Expected at least 10 UPI transactions from PDF, got %d", len(upiTxns))
	}

	// 2. Utility Bill PDF
	utilPDFPath := filepath.Join(dataDir, "utility_bill_bescom.pdf")
	utilBytes, err := os.ReadFile(utilPDFPath)
	if err != nil {
		t.Fatalf("Failed to read utility_bill_bescom.pdf: %v", err)
	}

	utilText, err := ExtractTextFromPDF(utilBytes)
	if err != nil {
		t.Fatalf("ExtractTextFromPDF failed for utility_bill_bescom.pdf: %v", err)
	}
	bills, err := ParseUtilityText(utilText)
	if err != nil {
		t.Fatalf("ParseUtilityText failed: %v", err)
	}
	if len(bills) == 0 {
		t.Fatalf("Expected non-empty utility bills")
	}
	if bills[0].BillAmount != 1350.00 {
		t.Errorf("Expected bill amount 1350.00, got %f", bills[0].BillAmount)
	}
	if bills[0].Status != "PAID_ON_TIME" {
		t.Errorf("Expected status PAID_ON_TIME, got %s", bills[0].Status)
	}

	// 3. Gig Earnings PDF
	gigPDFPath := filepath.Join(dataDir, "zomato_earnings_summary.pdf")
	gigBytes, err := os.ReadFile(gigPDFPath)
	if err != nil {
		t.Fatalf("Failed to read zomato_earnings_summary.pdf: %v", err)
	}

	gigText, err := ExtractTextFromPDF(gigBytes)
	if err != nil {
		t.Fatalf("ExtractTextFromPDF failed for zomato_earnings_summary.pdf: %v", err)
	}
	payouts, err := ParseGigText(gigText)
	if err != nil {
		t.Fatalf("ParseGigText failed: %v", err)
	}
	if len(payouts) != 3 {
		t.Errorf("Expected 3 monthly payout rows, got %d", len(payouts))
	}
}

func TestParseUPICSV(t *testing.T) {
	dataDir := findTestDataDir()
	csvPath := filepath.Join(dataDir, "upi_statement.csv")
	csvBytes, err := os.ReadFile(csvPath)
	if err != nil {
		t.Fatalf("Failed to read upi_statement.csv: %v", err)
	}

	txns, err := ParseUPICSV(csvBytes)
	if err != nil {
		t.Fatalf("ParseUPICSV failed: %v", err)
	}
	if len(txns) != 39 {
		t.Errorf("Expected 39 transactions from synthetic CSV, got %d", len(txns))
	}
}
