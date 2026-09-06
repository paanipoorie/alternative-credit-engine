package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/service"
)

var defaultService = service.NewEvidenceService()

type AnalyzeRequest struct {
	CustomerID   string                     `json:"customer_id,omitempty"`
	CustomerName string                     `json:"customer_name,omitempty"`
	PersonaType  string                     `json:"persona_type,omitempty"`
	EvidenceIDs  []string                   `json:"evidence_ids,omitempty"`
	Evidence     []domain.CanonicalEvidence `json:"evidence,omitempty"`
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

// RegisterRoutes registers all assessment and evidence ingestion endpoints
func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/evidence/upload", handleUploadEvidence)
	mux.HandleFunc("/api/evidence", handleListOrClearEvidence)
	mux.HandleFunc("/api/evidence/", handleSingleEvidence)

	mux.HandleFunc("/api/assess/analyze", handleAnalyze)
	mux.HandleFunc("/api/assess/demo", handleDemoAssessment)
	mux.HandleFunc("/api/assess/what-if", handleWhatIf)
}

func handleUploadEvidence(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 25MB max memory for multipart form
	if err := r.ParseMultipartForm(25 << 20); err != nil {
		http.Error(w, "Failed to parse multipart form: "+err.Error(), http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Form field 'file' is required: "+err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Failed to read uploaded file: "+err.Error(), http.StatusInternalServerError)
		return
	}

	mimeType := header.Header.Get("Content-Type")
	evidence, err := defaultService.IngestFile(r.Context(), header.Filename, mimeType, fileBytes)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":    err.Error(),
			"filename": header.Filename,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(evidence)
}

func handleListOrClearEvidence(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		items := defaultService.ListEvidence()
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(items)
		return
	}

	if r.Method == http.MethodDelete {
		defaultService.ClearEvidence()
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "All evidence cleared successfully"})
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func handleSingleEvidence(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/api/evidence/")
	if id == "" {
		http.Error(w, "Evidence ID required", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		ev, err := defaultService.GetEvidence(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(ev)

	case http.MethodDelete:
		found := defaultService.DeleteEvidence(id)
		if !found {
			http.Error(w, "Evidence not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"message": "Evidence deleted successfully", "id": id})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleAnalyze(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AnalyzeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	profile := defaultService.AssessCurrent(req.CustomerID, req.CustomerName, req.PersonaType, req.Evidence)

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(profile)
}

func handleDemoAssessment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	groundTruth := service.LoadSyntheticGroundTruth()
	var ptrList []*domain.CanonicalEvidence
	for i := range groundTruth {
		ptrList = append(ptrList, &groundTruth[i])
	}
	defaultService.SetEvidenceList(ptrList)

	profile := defaultService.AssessCurrent("DEMO-RAJESH-001", "Rajesh Kumar", "gig_worker", groundTruth)

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

func clamp(val, min, max float64) float64 {
	if val < min {
		return min
	}
	if val > max {
		return max
	}
	return val
}

func dummyUsageForImports() {
	_ = filepath.Base("")
}
