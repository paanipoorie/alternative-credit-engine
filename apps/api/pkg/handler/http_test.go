package handler

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

func TestDemoAssessmentEndpoint(t *testing.T) {
	mux := http.NewServeMux()
	RegisterRoutes(mux)

	req := httptest.NewRequest("GET", "/api/assess/demo", nil)
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d: %s", rec.Code, rec.Body.String())
	}

	var profile domain.AssessmentProfile
	if err := json.NewDecoder(rec.Body).Decode(&profile); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if profile.FinalScore < 300 || profile.FinalScore > 900 {
		t.Errorf("Score out of bounds: %d", profile.FinalScore)
	}
	if profile.DataCoverageScore != 80 {
		t.Errorf("Expected 80%% data coverage, got %d%%", profile.DataCoverageScore)
	}
	if len(profile.PositiveFactors) == 0 {
		t.Errorf("Expected positive factors in assessment")
	}
}

func TestWhatIfEndpoint(t *testing.T) {
	mux := http.NewServeMux()
	RegisterRoutes(mux)

	current := domain.AssessmentProfile{
		FinalScore:      750,
		BehavioralScore: 75.0,
		Dimensions: domain.BehavioralDimensions{
			CashFlowStability:   70.0,
			IncomeConsistency:   70.0,
			PaymentDiscipline:   70.0,
			ActivityContinuity:  70.0,
			FinancialResilience: 70.0,
		},
	}

	whatIfReq := WhatIfRequest{
		CurrentAssessment:      current,
		IncomeStabilityDelta:   0.15, // +15% improvement
		PaymentDisciplineDelta: 0.10, // +10% improvement
	}

	body, _ := json.Marshal(whatIfReq)
	req := httptest.NewRequest("POST", "/api/assess/what-if", bytes.NewReader(body))
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", rec.Code)
	}

	var resp WhatIfResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	if resp.ScoreDelta <= 0 {
		t.Errorf("Expected positive score delta for improved stability, got %d", resp.ScoreDelta)
	}
	if resp.EstimatedScore <= resp.OriginalScore {
		t.Errorf("Estimated score %d should be greater than original %d", resp.EstimatedScore, resp.OriginalScore)
	}
}

func TestUploadEvidenceEndpoint(t *testing.T) {
	mux := http.NewServeMux()
	RegisterRoutes(mux)

	// Create multipart body
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", "upi_sample.csv")
	if err != nil {
		t.Fatalf("CreateFormFile failed: %v", err)
	}

	csvData := `txn_id,date,amount,type,counterparty,description,status,category
TXN001,2026-01-02 09:00:00,5000.0,credit,Zomato Payout,Earnings,SUCCESS,gig_earnings
TXN002,2026-01-05 14:00:00,1200.0,debit,HPCL Fuel,Fuel,SUCCESS,merchant_qr`

	part.Write([]byte(csvData))
	writer.Close()

	req := httptest.NewRequest("POST", "/api/evidence/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	rec := httptest.NewRecorder()

	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created, got %d: %s", rec.Code, rec.Body.String())
	}

	var ev domain.CanonicalEvidence
	if err := json.NewDecoder(rec.Body).Decode(&ev); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if ev.SourceType != domain.SourceUPI {
		t.Errorf("Expected source type upi, got %s", ev.SourceType)
	}
	if len(ev.UPITransactions) != 2 {
		t.Errorf("Expected 2 transactions, got %d", len(ev.UPITransactions))
	}
	if ev.Provenance.ValidationStatus != domain.ValidationValid && ev.Provenance.ValidationStatus != "PASSED" {
		t.Errorf("Expected validation VALID or PASSED, got %s", ev.Provenance.ValidationStatus)
	}

	// Test POST /api/evidence/process
	processJSON := `{"filename":"upi_statement.csv","mime_type":"text/csv","content":"txn_id,date,amount,type,counterparty,description,status,category\nTXN-001,2026-01-02 10:00:00,1000,credit,Client,Payment,SUCCESS,p2p"}`
	processReq := httptest.NewRequest("POST", "/api/evidence/process", strings.NewReader(processJSON))
	processReq.Header.Set("Content-Type", "application/json")
	processRec := httptest.NewRecorder()
	mux.ServeHTTP(processRec, processReq)

	if processRec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK from /api/evidence/process, got %d: %s", processRec.Code, processRec.Body.String())
	}

	// Test GET /api/evidence
	getReq := httptest.NewRequest("GET", "/api/evidence", nil)
	getRec := httptest.NewRecorder()
	mux.ServeHTTP(getRec, getReq)

	if getRec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK from GET /api/evidence, got %d", getRec.Code)
	}

	// Test POST /api/assess/analyze
	analyzeReq := httptest.NewRequest("POST", "/api/assess/analyze", bytes.NewReader([]byte("{}")))
	analyzeRec := httptest.NewRecorder()
	mux.ServeHTTP(analyzeRec, analyzeReq)

	if analyzeRec.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK from analyze, got %d: %s", analyzeRec.Code, analyzeRec.Body.String())
	}
}
