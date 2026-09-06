package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/service"
)

var defaultService = service.NewEvidenceService()

type AnalyzeRequest struct {
	CustomerID      string                     `json:"customer_id,omitempty"`
	CustomerName    string                     `json:"customer_name,omitempty"`
	PersonaType     string                     `json:"persona_type,omitempty"`
	DeclaredProfile *domain.DeclaredProfile    `json:"declared_profile,omitempty"`
	EvidenceIDs     []string                   `json:"evidence_ids,omitempty"`
	Evidence        []domain.CanonicalEvidence `json:"evidence,omitempty"`
}

type WhatIfRequest struct {
	CurrentAssessment       domain.AssessmentProfile `json:"current_assessment"`
	IncomeStabilityDelta    float64                  `json:"income_stability_delta,omitempty"`    // e.g. +0.10 (+10% stability)
	PaymentDisciplineDelta  float64                  `json:"payment_discipline_delta,omitempty"`  // e.g. +0.10 (+10% punctuality)
	ActivityContinuityDelta float64                  `json:"activity_continuity_delta,omitempty"` // e.g. +0.10 (+10% activity)
	AdditionalInflowMonthly float64                  `json:"additional_inflow_monthly,omitempty"` // e.g. +5000
}

type WhatIfResponse struct {
	IsHypothetical      bool                        `json:"is_hypothetical"`
	OriginalScore       int                         `json:"original_score"`
	EstimatedScore      int                         `json:"estimated_score"`
	ScoreDelta          int                         `json:"score_delta"`
	OriginalBScore      float64                     `json:"original_b_score"`
	EstimatedBScore     float64                     `json:"estimated_b_score"`
	SimulatedDimensions domain.BehavioralDimensions `json:"simulated_dimensions"`
	Explanation         string                      `json:"explanation"`
	SimulationSteps     []string                    `json:"simulation_steps,omitempty"`
}

// RegisterRoutes registers all assessment and evidence ingestion endpoints
func RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/evidence/upload", handleUploadEvidence)
	mux.HandleFunc("/api/evidence/process", handleProcessEvidence)
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

type ProcessEvidenceRequest struct {
	Filename string `json:"filename"`
	MimeType string `json:"mime_type,omitempty"`
	Content  string `json:"content"`
}

func handleProcessEvidence(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ProcessEvidenceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON payload: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Filename == "" {
		req.Filename = "evidence_document.txt"
	}
	if req.MimeType == "" {
		req.MimeType = "text/plain"
	}

	evidence, err := defaultService.IngestFile(r.Context(), req.Filename, req.MimeType, []byte(req.Content))
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnprocessableEntity)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":    err.Error(),
			"filename": req.Filename,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
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

	name := req.CustomerName
	if name == "" && req.DeclaredProfile != nil && req.DeclaredProfile.FullName != "" {
		name = req.DeclaredProfile.FullName
	}
	persona := req.PersonaType
	if persona == "" && req.DeclaredProfile != nil && req.DeclaredProfile.EmploymentType != "" {
		persona = req.DeclaredProfile.EmploymentType
	}

	profile := defaultService.AssessCurrent(req.CustomerID, name, persona, req.Evidence, req.DeclaredProfile)

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

	demoDeclared := &domain.DeclaredProfile{
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

	profile := defaultService.AssessCurrent("DEMO-RAJESH-001", "Rajesh Kumar", "gig_worker", groundTruth, demoDeclared)

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
	var simSteps []string

	// 1. Simulate Income Stability improvements
	if req.IncomeStabilityDelta != 0 {
		pct := int(req.IncomeStabilityDelta * 100)
		simDim.CashFlowStability = clamp(simDim.CashFlowStability*(1.0+req.IncomeStabilityDelta), 0, 100)
		simDim.IncomeConsistency = clamp(simDim.IncomeConsistency*(1.0+req.IncomeStabilityDelta), 0, 100)
		if pct > 0 {
			simSteps = append(simSteps, fmt.Sprintf("+%d%% steady income consistency reduces monthly variance", pct))
		} else {
			simSteps = append(simSteps, fmt.Sprintf("%d%% income volatility increases cash flow risk", pct))
		}
	}

	// 2. Simulate Payment Discipline improvements
	if req.PaymentDisciplineDelta != 0 {
		pct := int(req.PaymentDisciplineDelta * 100)
		simDim.PaymentDiscipline = clamp(simDim.PaymentDiscipline*(1.0+req.PaymentDisciplineDelta), 0, 100)
		if pct > 0 {
			simSteps = append(simSteps, fmt.Sprintf("+%d%% on-time payment track record across billing cycles", pct))
		} else {
			simSteps = append(simSteps, fmt.Sprintf("%d%% payment delay frequency", pct))
		}
	}

	// 3. Simulate Activity Continuity
	if req.ActivityContinuityDelta != 0 {
		pct := int(req.ActivityContinuityDelta * 100)
		simDim.ActivityContinuity = clamp(simDim.ActivityContinuity*(1.0+req.ActivityContinuityDelta), 0, 100)
		if pct > 0 {
			simSteps = append(simSteps, fmt.Sprintf("+%d%% continuous active days on platform", pct))
		}
	}

	// 4. Simulate Additional Monthly Inflow
	if req.AdditionalInflowMonthly > 0 {
		simDim.FinancialResilience = clamp(simDim.FinancialResilience+8.0, 0, 100)
		simSteps = append(simSteps, fmt.Sprintf("+₹%.0f monthly buffer enhances financial resilience", req.AdditionalInflowMonthly))
	}

	origB := req.CurrentAssessment.BehavioralScore
	simB := (0.30 * simDim.CashFlowStability) +
		(0.20 * simDim.IncomeConsistency) +
		(0.20 * simDim.PaymentDiscipline) +
		(0.15 * simDim.ActivityContinuity) +
		(0.15 * simDim.FinancialResilience)

	simB = clamp(simB, 0, 100)
	simB = math.Round(simB*100) / 100
	estScore := int(math.Round(300.0 + (6.0 * simB)))
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
	} else if delta == 0 {
		explanation = "Simulated adjustments maintain the current solid behavioral score profile."
	}

	resp := WhatIfResponse{
		IsHypothetical:      true,
		OriginalScore:       req.CurrentAssessment.FinalScore,
		EstimatedScore:      estScore,
		ScoreDelta:          delta,
		OriginalBScore:      origB,
		EstimatedBScore:     simB,
		SimulatedDimensions: simDim,
		Explanation:         explanation,
		SimulationSteps:     simSteps,
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

