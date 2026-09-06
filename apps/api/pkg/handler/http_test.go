package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
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
