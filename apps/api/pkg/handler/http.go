package handler

import (
	"encoding/csv"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/calculator"
	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

type AnalyzeRequest struct {
	CustomerID   string                     `json:"customer_id"`
	CustomerName string                     `json:"customer_name,omitempty"`
	PersonaType  string                     `json:"persona_type,omitempty"`
	Evidence     []domain.CanonicalEvidence `json:"evidence"`
}

type WhatIfRequest struct {
	CurrentAssessment      domain.AssessmentProfile `json:"current_assessment"`
	IncomeStabilityDelta   float64                  `json:"income_stability_delta,omitempty"`   // e.g. +0.10 (+10% stability)
	PaymentDisciplineDelta float64                  `json:"payment_discipline_delta,omitempty"` // e.g. +0.10
}

type WhatIfResponse struct {
	OriginalScore   int     `json:"original_score"`
	EstimatedScore  int     `json:"estimated_score"`
	ScoreDelta      int     `json:"score_delta"`
	Explanation     string  `json:"explanation"`
	OriginalBScore  float64 `json:"original_b_score"`
	EstimatedBScore float64 `json:"estimated_b_score"`
}

// RegisterRoutes registers assessment API endpoints
func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/assess/analyze", handleAnalyze)
	mux.HandleFunc("/api/assess/demo", handleDemoAssessment)
	mux.HandleFunc("/api/assess/what-if", handleWhatIf)
}

func handleAnalyze(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.CustomerID == "" {
		req.CustomerID = "CUST-" + strconv.FormatInt(time.Now().Unix(), 10)
	}
	if req.CustomerName == "" {
		req.CustomerName = "Verified Applicant"
	}

	profile := calculator.Assess(req.CustomerID, req.CustomerName, req.PersonaType, req.Evidence)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(profile)
}

func handleDemoAssessment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	evidenceList := loadSyntheticEvidence()
	profile := calculator.Assess("DEMO-RAJESH-001", "Rajesh Kumar", "gig_worker", evidenceList)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(profile)
}

func handleWhatIf(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req WhatIfRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	origDim := req.CurrentAssessment.Dimensions
	simDim := origDim

	// Simulate improvements
	if req.IncomeStabilityDelta != 0 {
		simDim.CashFlowStability = clamp(simDim.CashFlowStability*(1.0+req.IncomeStabilityDelta), 0, 100)
		simDim.IncomeConsistency = clamp(simDim.IncomeConsistency*(1.0+req.IncomeStabilityDelta), 0, 100)
	}
	if req.PaymentDisciplineDelta != 0 {
		simDim.PaymentDiscipline = clamp(simDim.PaymentDiscipline*(1.0+req.PaymentDisciplineDelta), 0, 100)
	}

	origB := req.CurrentAssessment.BehavioralScore
	simB := (0.30 * simDim.CashFlowStability) +
		(0.20 * simDim.IncomeConsistency) +
		(0.20 * simDim.PaymentDiscipline) +
		(0.15 * simDim.ActivityContinuity) +
		(0.15 * simDim.FinancialResilience)

	simB = clamp(simB, 0, 100)
	estScore := int(300.0 + (6.0 * simB))
	if estScore > 900 {
		estScore = 900
	}
	if estScore < 300 {
		estScore = 300
	}

	delta := estScore - req.CurrentAssessment.FinalScore

	explanation := "Improving income stability and maintaining on-time payment records enhances the Cash-Flow Stability and Payment Discipline behavioral dimensions."
	if delta < 0 {
		explanation = "Observed reduction in stability or delayed payments lowers the behavioral score."
	}

	resp := WhatIfResponse{
		OriginalScore:   req.CurrentAssessment.FinalScore,
		EstimatedScore:  estScore,
		ScoreDelta:      delta,
		Explanation:     explanation,
		OriginalBScore:  origB,
		EstimatedBScore: simB,
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func loadSyntheticEvidence() []domain.CanonicalEvidence {
	dataDir := findDataDir()
	var evidenceList []domain.CanonicalEvidence

	// 1. UPI
	csvPath := filepath.Join(dataDir, "upi_statement.csv")
	if csvFile, err := os.Open(csvPath); err == nil {
		defer csvFile.Close()
		reader := csv.NewReader(csvFile)
		if records, err := reader.ReadAll(); err == nil {
			var txns []domain.UPITransaction
			for i, row := range records {
				if i == 0 || len(row) < 8 {
					continue
				}
				amt, _ := strconv.ParseFloat(row[2], 64)
				parsedDate, _ := time.Parse("2006-01-02 15:04:05", row[1])
				txns = append(txns, domain.UPITransaction{
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
			evidenceList = append(evidenceList, domain.CanonicalEvidence{
				ID:                   "EV-UPI-DEMO",
				CustomerID:           "DEMO-RAJESH-001",
				SourceType:           domain.SourceUPI,
				SourceProvider:       "BHIM UPI / Bank",
				PeriodStart:          "2026-01-01",
				PeriodEnd:            "2026-03-31",
				SourceQuality:        0.95,
				ExtractionConfidence: 0.98,
				Provenance: domain.ProvenanceItem{
					EvidenceID:           "EV-UPI-DEMO",
					SourceType:           domain.SourceUPI,
					DocumentName:         "upi_statement.csv",
					DocumentFormat:       domain.FormatCSV,
					PeriodStart:          "2026-01-01",
					PeriodEnd:            "2026-03-31",
					RecordCount:          len(txns),
					ExtractionConfidence: 0.98,
					SourceQualityScore:   0.95,
					ValidationStatus:     "PASSED",
					IngestedAt:           time.Now(),
				},
				UPITransactions: txns,
			})
		}
	}

	// 2. Utility
	utilPath := filepath.Join(dataDir, "utility_bills.json")
	if utilBytes, err := os.ReadFile(utilPath); err == nil {
		var bills []domain.UtilityPayment
		if err := json.Unmarshal(utilBytes, &bills); err == nil {
			evidenceList = append(evidenceList, domain.CanonicalEvidence{
				ID:                   "EV-UTIL-DEMO",
				CustomerID:           "DEMO-RAJESH-001",
				SourceType:           domain.SourceUtility,
				SourceProvider:       "BESCOM Electricity",
				PeriodStart:          "2025-11-01",
				PeriodEnd:            "2026-03-31",
				SourceQuality:        0.90,
				ExtractionConfidence: 0.95,
				Provenance: domain.ProvenanceItem{
					EvidenceID:           "EV-UTIL-DEMO",
					SourceType:           domain.SourceUtility,
					DocumentName:         "utility_bill_bescom.pdf",
					DocumentFormat:       domain.FormatPDF,
					PeriodStart:          "2025-11-01",
					PeriodEnd:            "2026-03-31",
					RecordCount:          len(bills),
					ExtractionConfidence: 0.95,
					SourceQualityScore:   0.90,
					ValidationStatus:     "PASSED",
					IngestedAt:           time.Now(),
				},
				UtilityPayments: bills,
			})
		}
	}

	// 3. Gig
	gigPath := filepath.Join(dataDir, "gig_payouts.json")
	if gigBytes, err := os.ReadFile(gigPath); err == nil {
		var payouts []domain.GigPayout
		if err := json.Unmarshal(gigBytes, &payouts); err == nil {
			evidenceList = append(evidenceList, domain.CanonicalEvidence{
				ID:                   "EV-GIG-DEMO",
				CustomerID:           "DEMO-RAJESH-001",
				SourceType:           domain.SourceGig,
				SourceProvider:       "Zomato Delivery Partner",
				PeriodStart:          "2026-01-01",
				PeriodEnd:            "2026-03-31",
				SourceQuality:        0.95,
				ExtractionConfidence: 0.96,
				Provenance: domain.ProvenanceItem{
					EvidenceID:           "EV-GIG-DEMO",
					SourceType:           domain.SourceGig,
					DocumentName:         "zomato_earnings_summary.pdf",
					DocumentFormat:       domain.FormatPDF,
					PeriodStart:          "2026-01-01",
					PeriodEnd:            "2026-03-31",
					RecordCount:          len(payouts),
					ExtractionConfidence: 0.96,
					SourceQualityScore:   0.95,
					ValidationStatus:     "PASSED",
					IngestedAt:           time.Now(),
				},
				GigPayouts: payouts,
			})
		}
	}

	return evidenceList
}

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

func clamp(val, min, max float64) float64 {
	if val < min {
		return min
	}
	if val > max {
		return max
	}
	return val
}
