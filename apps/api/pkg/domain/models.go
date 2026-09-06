package domain

import "time"

// SourceType represents the category of evidence submitted
type SourceType string

const (
	SourceUPI        SourceType = "upi"
	SourceGST        SourceType = "gst"
	SourceGig        SourceType = "gig_earnings"
	SourceUtility    SourceType = "utility"
	SourceTelecom    SourceType = "telecom"
	SourceEcommerce  SourceType = "ecommerce"
	SourceVehicle    SourceType = "vehicle"
)

// DocumentFormat represents the physical file format
type DocumentFormat string

const (
	FormatPDF   DocumentFormat = "pdf"
	FormatCSV   DocumentFormat = "csv"
	FormatExcel DocumentFormat = "xlsx"
	FormatImage DocumentFormat = "image"
	FormatJSON  DocumentFormat = "json"
)

// UPITransaction represents a single normalized UPI transaction
type UPITransaction struct {
	ID           string    `json:"id"`
	Date         time.Time `json:"date"`
	Amount       float64   `json:"amount"`
	Type         string    `json:"type"` // "credit" (inflow) or "debit" (outflow)
	Counterparty string    `json:"counterparty"`
	Description  string    `json:"description"`
	Status       string    `json:"status"` // "SUCCESS", "FAILED", "PENDING"
	Category     string    `json:"category,omitempty"` // "p2p", "merchant_qr", "salary", "bill_payment", etc.
}

// UtilityPayment represents a utility bill payment record
type UtilityPayment struct {
	ID            string     `json:"id"`
	BillPeriod    string     `json:"bill_period"` // e.g., "2026-01"
	ProviderName  string     `json:"provider_name"`
	ServiceType   string     `json:"service_type"` // "electricity", "water", "gas"
	BillAmount    float64    `json:"bill_amount"`
	DueDate       time.Time  `json:"due_date"`
	PaymentDate   *time.Time `json:"payment_date,omitempty"`
	Status        string     `json:"status"` // "PAID_ON_TIME", "PAID_LATE", "UNPAID"
	DaysLate      int        `json:"days_late"`
	PaymentAmount float64    `json:"payment_amount"`
}

// GigPayout represents periodic earnings from gig/work platforms
type GigPayout struct {
	ID            string    `json:"id"`
	Platform      string    `json:"platform"` // "Swiggy", "Zomato", "Uber", "UrbanCompany"
	PeriodStart   time.Time `json:"period_start"`
	PeriodEnd     time.Time `json:"period_end"`
	GrossEarnings float64   `json:"gross_earnings"`
	NetPayout     float64   `json:"net_payout"`
	ActiveDays    int       `json:"active_days"`
	TripsOrJobs   int       `json:"trips_or_jobs"`
	Incentives    float64   `json:"incentives"`
	Tips          float64   `json:"tips"`
}

// GSTRRecord represents a GST return filing record
type GSTRRecord struct {
	ID               string    `json:"id"`
	GSTIN            string    `json:"gstin"`
	ReturnPeriod     string    `json:"return_period"` // e.g. "2025-Q4" or "2026-02"
	ReturnType       string    `json:"return_type"`   // "GSTR-3B", "GSTR-1"
	FilingDate       time.Time `json:"filing_date"`
	ReportedTurnover float64   `json:"reported_turnover"`
	TaxLiability     float64   `json:"tax_liability"`
	TaxPaid          float64   `json:"tax_paid"`
	FilingStatus     string    `json:"filing_status"` // "ON_TIME", "DELAYED"
}

// TelecomRecharge represents a mobile/data recharge record
type TelecomRecharge struct {
	ID           string    `json:"id"`
	Operator     string    `json:"operator"` // "Jio", "Airtel", "Vi"
	Date         time.Time `json:"date"`
	Amount       float64   `json:"amount"`
	ValidityDays int       `json:"validity_days"`
	PlanType     string    `json:"plan_type"` // "unlimited_data", "top_up"
}

// ProvenanceItem captures origin and validation details for every processed piece of evidence
type ProvenanceItem struct {
	EvidenceID           string         `json:"evidence_id"`
	SourceType           SourceType     `json:"source_type"`
	DocumentName         string         `json:"document_name"`
	DocumentFormat       DocumentFormat `json:"document_format"`
	PeriodStart          string         `json:"period_start"`
	PeriodEnd            string         `json:"period_end"`
	RecordCount          int            `json:"record_count"`
	ExtractionConfidence float64        `json:"extraction_confidence"` // 0.0 to 1.0
	SourceQualityScore   float64        `json:"source_quality_score"`   // 0.0 to 1.0
	ValidationStatus     string         `json:"validation_status"`     // "PASSED", "WARNING", "FAILED"
	ValidationNotes      []string       `json:"validation_notes,omitempty"`
	IngestedAt           time.Time      `json:"ingested_at"`
}

// CanonicalEvidence represents normalized data bundle from any source
type CanonicalEvidence struct {
	ID                   string         `json:"id"`
	CustomerID           string         `json:"customer_id"`
	SourceType           SourceType     `json:"source_type"`
	SourceProvider       string         `json:"source_provider"`
	PeriodStart          string         `json:"period_start"`
	PeriodEnd            string         `json:"period_end"`
	SourceQuality        float64        `json:"source_quality"`
	ExtractionConfidence float64        `json:"extraction_confidence"`
	Provenance           ProvenanceItem `json:"provenance"`

	// Typed record sets (populated depending on SourceType)
	UPITransactions []UPITransaction  `json:"upi_transactions,omitempty"`
	UtilityPayments []UtilityPayment  `json:"utility_payments,omitempty"`
	GigPayouts      []GigPayout       `json:"gig_payouts,omitempty"`
	GSTRRecords     []GSTRRecord      `json:"gstr_records,omitempty"`
	TelecomRecords  []TelecomRecharge `json:"telecom_records,omitempty"`
}

// MonthlyMetric stores periodic aggregations for charting & verification
type MonthlyMetric struct {
	Month  string  `json:"month"` // "2026-01"
	Amount float64 `json:"amount"`
	Count  int     `json:"count"`
}

// DerivedFeatures holds mathematically computed signals across all evidence
type DerivedFeatures struct {
	// Cash Flow Features (UPI/Bank)
	TotalInflow          float64         `json:"total_inflow"`
	TotalOutflow         float64         `json:"total_outflow"`
	AvgMonthlyInflow     float64         `json:"avg_monthly_inflow"`
	AvgMonthlyOutflow    float64         `json:"avg_monthly_outflow"`
	NetCashFlow          float64         `json:"net_cash_flow"`
	InflowVolatilityCV   float64         `json:"inflow_volatility_cv"` // Coefficient of Variation (lower is more stable)
	OutflowVolatilityCV  float64         `json:"outflow_volatility_cv"`
	CreditDebitRatio     float64         `json:"credit_debit_ratio"`
	TotalTransactions    int             `json:"total_transactions"`
	ActiveDaysCount      int             `json:"active_days_count"`
	ActiveDaysRatio      float64         `json:"active_days_ratio"`
	MonthlyInflows       []MonthlyMetric `json:"monthly_inflows"`
	RecurringInflowRatio float64         `json:"recurring_inflow_ratio"`

	// Income Consistency Features (Gig & Inflows)
	GigTotalEarnings        float64         `json:"gig_total_earnings"`
	GigAvgMonthlyEarnings   float64         `json:"gig_avg_monthly_earnings"`
	GigEarningsVolatilityCV float64         `json:"gig_earnings_volatility_cv"`
	GigActiveDaysPerMonth   float64         `json:"gig_active_days_per_month"`
	GigContinuityMonths     int             `json:"gig_continuity_months"`
	GigEarningsPerActiveDay float64         `json:"gig_earnings_per_active_day"`
	GigMonthlyEarnings      []MonthlyMetric `json:"gig_monthly_earnings"`

	// Payment Discipline Features (Utility & Bills)
	UtilityTotalBills     int              `json:"utility_total_bills"`
	UtilityOnTimeCount    int              `json:"utility_on_time_count"`
	UtilityOnTimeRatio    float64          `json:"utility_on_time_ratio"`
	UtilityAvgDelayDays   float64          `json:"utility_avg_delay_days"`
	UtilityPaymentRecords []UtilityPayment `json:"utility_payment_records,omitempty"`

	// GST Features (Merchants)
	GSTTotalTurnover        float64 `json:"gst_total_turnover"`
	GSTAvgMonthlyTurnover   float64 `json:"gst_avg_monthly_turnover"`
	GSTTurnoverVolatilityCV float64 `json:"gst_turnover_volatility_cv"`
	GSTFilingConsistency    float64 `json:"gst_filing_consistency"` // 0.0 to 1.0

	// Telecom Features
	TelecomRechargeCount  int     `json:"telecom_recharge_count"`
	TelecomAvgRecharge    float64 `json:"telecom_avg_recharge"`
	TelecomPlanContinuity float64 `json:"telecom_plan_continuity"`
}

// BehavioralDimensions holds the 5 core 0-100 dimensional scores
type BehavioralDimensions struct {
	CashFlowStability   float64 `json:"cash_flow_stability"`   // Weight: 30%
	IncomeConsistency   float64 `json:"income_consistency"`    // Weight: 20%
	PaymentDiscipline   float64 `json:"payment_discipline"`    // Weight: 20%
	ActivityContinuity  float64 `json:"activity_continuity"`   // Weight: 15%
	FinancialResilience float64 `json:"financial_resilience"`  // Weight: 15%
}

// ExplainableReason provides evidence-traceable explanations
type ExplainableReason struct {
	Type          string     `json:"type"` // "positive" or "attention"
	Title         string     `json:"title"`
	Summary       string     `json:"summary"`
	SourceType    SourceType `json:"source_type"`
	EvidenceRef   string     `json:"evidence_ref"`
	ObservedValue string     `json:"observed_value"`
	Impact        string     `json:"impact"` // "HIGH", "MEDIUM", "LOW"
}

// AssessmentProfile represents the complete evaluation result
type AssessmentProfile struct {
	AssessmentID      string               `json:"assessment_id"`
	CustomerID        string               `json:"customer_id"`
	CustomerName      string               `json:"customer_name,omitempty"`
	PersonaType       string               `json:"persona_type,omitempty"` // "gig_worker", "small_merchant", "first_time_borrower", "informal_worker"
	BehavioralScore   float64              `json:"behavioral_score"`       // 0 - 100
	FinalScore        int                  `json:"final_score"`            // 300 - 900 (300 + 6 * BehavioralScore)
	RiskBand          string               `json:"risk_band"`              // "Low Risk", "Low-Moderate Risk", "Moderate Risk", "Higher Risk"
	ConfidenceScore   int                  `json:"confidence_score"`       // 0 - 100%
	DataCoverageScore int                  `json:"data_coverage_score"`    // 0 - 100%
	Dimensions        BehavioralDimensions `json:"dimensions"`
	DimensionWeights  map[string]float64   `json:"dimension_weights"`
	PositiveFactors   []ExplainableReason  `json:"positive_factors"`
	AttentionFactors  []ExplainableReason  `json:"attention_factors"`
	Features          DerivedFeatures      `json:"features"`
	Provenance        []ProvenanceItem     `json:"provenance"`
	CoverageBreakdown map[string]bool      `json:"coverage_breakdown"`
	CreatedAt         time.Time            `json:"created_at"`
	Disclaimer        string               `json:"disclaimer"`
}
