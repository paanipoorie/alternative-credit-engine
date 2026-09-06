package calculator

import (
	"fmt"
	"math"
	"strings"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

// BuildObservedProfile aggregates empirical values observed from normalized evidence
func BuildObservedProfile(features domain.DerivedFeatures, evidenceList []domain.CanonicalEvidence) *domain.ObservedProfile {
	profile := &domain.ObservedProfile{
		ObservedMonthlyIncome:   0,
		ObservedIncomeChannel:   "Not Observed",
		ObservedMonthlyExpenses: 0,
		ActiveMonths:            0,
		PrimaryInflowSource:     "None",
	}

	hasUPI := false
	hasGig := false
	hasGST := false

	for _, ev := range evidenceList {
		switch ev.SourceType {
		case domain.SourceUPI:
			if len(ev.UPITransactions) > 0 {
				hasUPI = true
			}
		case domain.SourceGig:
			if len(ev.GigPayouts) > 0 {
				hasGig = true
			}
		case domain.SourceGST:
			if len(ev.GSTRRecords) > 0 {
				hasGST = true
			}
		}
	}

	// 1. Observed Monthly Inflow/Income
	if features.AvgMonthlyInflow > 0 {
		profile.ObservedMonthlyIncome = features.AvgMonthlyInflow
		profile.PrimaryInflowSource = "UPI Inflows"
	} else if features.GigAvgMonthlyEarnings > 0 {
		profile.ObservedMonthlyIncome = features.GigAvgMonthlyEarnings
		profile.PrimaryInflowSource = "Gig Platform Payouts"
	} else if features.GSTAvgMonthlyTurnover > 0 {
		profile.ObservedMonthlyIncome = features.GSTAvgMonthlyTurnover
		profile.PrimaryInflowSource = "GST Declared Turnover"
	}

	// If both Gig and UPI exist, prioritize higher observed reliable cash inflow or combined
	if hasGig && hasUPI && features.AvgMonthlyInflow > 0 {
		profile.ObservedMonthlyIncome = features.AvgMonthlyInflow
		profile.PrimaryInflowSource = "UPI & Gig Work Combined"
	}

	// 2. Observed Monthly Outflow/Expenses
	if features.AvgMonthlyOutflow > 0 {
		profile.ObservedMonthlyExpenses = features.AvgMonthlyOutflow
	}

	// 3. Observed Primary Channel
	if hasUPI && hasGig {
		profile.ObservedIncomeChannel = "UPI & Platform Direct Credit"
	} else if hasUPI {
		profile.ObservedIncomeChannel = "UPI Transfer"
	} else if hasGig {
		profile.ObservedIncomeChannel = "Platform Direct Credit"
	} else if hasGST {
		profile.ObservedIncomeChannel = "Commercial Invoicing"
	}

	// 4. Active Months
	monthsMap := make(map[string]bool)
	for _, m := range features.MonthlyInflows {
		monthsMap[m.Month] = true
	}
	for _, m := range features.GigMonthlyEarnings {
		monthsMap[m.Month] = true
	}
	if len(monthsMap) > 0 {
		profile.ActiveMonths = len(monthsMap)
	} else if features.ActiveDaysCount > 0 {
		profile.ActiveMonths = int(math.Ceil(float64(features.ActiveDaysCount) / 30.0))
	}

	return profile
}

// ReconcileProfiles compares declared values with observed evidence
func ReconcileProfiles(declared *domain.DeclaredProfile, observed *domain.ObservedProfile, features domain.DerivedFeatures, evidenceList []domain.CanonicalEvidence) *domain.ReconciliationReport {
	if declared == nil {
		return &domain.ReconciliationReport{
			OverallStatus: string(domain.ReconNotObserved),
			Summary:       "No declared profile provided for reconciliation.",
			Items:         []domain.ReconciliationItem{},
		}
	}

	var items []domain.ReconciliationItem
	var consistentCount, minorCount, sigCount, unobservedCount int

	// 1. Monthly Income Reconciliation
	incomeItem := reconcileNumericField(
		"Monthly Inflow / Income",
		declared.MonthlyIncome,
		observed.ObservedMonthlyIncome,
		"₹",
		"Declared monthly earnings vs. observed recurring inflows & gig payouts",
		observed.ObservedMonthlyIncome > 0,
	)
	items = append(items, incomeItem)

	// 2. Monthly Expenses / Outflows Reconciliation
	expenseItem := reconcileNumericField(
		"Monthly Outflows / Expenses",
		declared.MonthlyExpenses,
		observed.ObservedMonthlyExpenses,
		"₹",
		"Declared monthly expenses vs. observed bank/UPI debit volume",
		observed.ObservedMonthlyExpenses > 0,
	)
	items = append(items, expenseItem)

	// 3. Income Channel Reconciliation
	channelItem := reconcileChannelField(declared.IncomeChannel, observed.ObservedIncomeChannel, evidenceList)
	items = append(items, channelItem)

	// 4. Activity Period / Continuity Reconciliation
	activityItem := reconcileActivityField(declared, observed, features)
	items = append(items, activityItem)

	// Evaluate counts
	for _, it := range items {
		switch it.Status {
		case domain.ReconConsistent:
			consistentCount++
		case domain.ReconMinorVariance:
			minorCount++
		case domain.ReconSignificantVariance:
			sigCount++
		case domain.ReconNotObserved:
			unobservedCount++
		}
	}

	// Determine overall reconciliation status
	overallStatus := string(domain.ReconConsistent)
	summary := "Observed financial behaviour matches declared applicant context with high consistency."

	if sigCount > 0 {
		overallStatus = string(domain.ReconSignificantVariance)
		summary = fmt.Sprintf("Observed %d significant variance(s) between self-declared context and verified document records.", sigCount)
	} else if minorCount > 0 {
		overallStatus = string(domain.ReconMinorVariance)
		summary = fmt.Sprintf("Observed %d minor variance(s) between declared profile and document records, within acceptable underwriting tolerance.", minorCount)
	} else if unobservedCount >= 2 {
		overallStatus = string(domain.ReconPartiallyObserved)
		summary = "Partial declared profile verified. Supplemental evidence documents recommended for comprehensive validation."
	}

	return &domain.ReconciliationReport{
		OverallStatus: overallStatus,
		Summary:       summary,
		Items:         items,
	}
}

func reconcileNumericField(field string, declared, observed float64, unit, description string, isObserved bool) domain.ReconciliationItem {
	item := domain.ReconciliationItem{
		Field:         field,
		DeclaredValue: fmt.Sprintf("%s%.0f", unit, declared),
		Description:   description,
	}

	if !isObserved || observed == 0 {
		item.ObservedValue = "Not observed in uploaded documents"
		item.Status = domain.ReconNotObserved
		item.VariancePct = 0
		item.Explanation = "No corresponding transactional inflow or expense data was found in the provided evidence."
		return item
	}

	item.ObservedValue = fmt.Sprintf("%s%.0f", unit, observed)
	varianceAmt := observed - declared
	variancePct := 0.0
	if declared > 0 {
		variancePct = math.Abs(varianceAmt) / declared * 100.0
	}
	variancePct = math.Round(variancePct*10) / 10
	item.VariancePct = variancePct

	isExpense := strings.Contains(strings.ToLower(field), "expense") || strings.Contains(strings.ToLower(field), "outflow")

	if isExpense {
		if observed <= declared {
			item.Status = domain.ReconConsistent
			item.Explanation = fmt.Sprintf("Observed digital outflows (%s%.0f) remain comfortably within declared expenditure ceiling (%s%.0f).", unit, observed, unit, declared)
		} else if variancePct <= 25.0 {
			item.Status = domain.ReconMinorVariance
			item.Explanation = fmt.Sprintf("Observed outflows exceed declared budget by %.1f%% (%s%.0f vs %s%.0f), within typical seasonal fluctuation.", variancePct, unit, observed, unit, declared)
		} else {
			item.Status = domain.ReconSignificantVariance
			item.Explanation = fmt.Sprintf("Observed debits significantly exceed declared monthly expenses by %.1f%% (%s%.0f vs %s%.0f).", variancePct, unit, observed, unit, declared)
		}
		return item
	}

	// Income / Inflows
	if variancePct <= 10.0 {
		item.Status = domain.ReconConsistent
		item.Explanation = fmt.Sprintf("Observed inflows of %s%.0f align with declared income (%s%.0f) within %.1f%% tolerance.", unit, observed, unit, declared, variancePct)
	} else if observed > declared {
		item.Status = domain.ReconConsistent
		item.Explanation = fmt.Sprintf("Observed inflows (%s%.0f) exceed declared income (%s%.0f) by %.1f%%, indicating favorable earning capacity.", unit, observed, unit, declared, variancePct)
	} else if variancePct <= 25.0 {
		item.Status = domain.ReconMinorVariance
		item.Explanation = fmt.Sprintf("Observed inflows (%s%.0f) are %.1f%% lower than declared (%s%.0f), within normal gig/informal variability.", unit, observed, variancePct, unit, declared)
	} else {
		item.Status = domain.ReconSignificantVariance
		item.Explanation = fmt.Sprintf("Observed inflows are %.1f%% lower than declared income (%s%.0f vs %s%.0f). Supplementary documentation recommended.", variancePct, unit, observed, unit, declared)
	}

	return item
}

func reconcileChannelField(declaredChannel, observedChannel string, evidenceList []domain.CanonicalEvidence) domain.ReconciliationItem {
	item := domain.ReconciliationItem{
		Field:         "Primary Income Channel",
		DeclaredValue: formatChannelName(declaredChannel),
		Description:   "Self-reported primary transaction method vs observed settlement source",
	}

	if observedChannel == "" || observedChannel == "Not Observed" || len(evidenceList) == 0 {
		item.ObservedValue = "Not Observed"
		item.Status = domain.ReconNotObserved
		item.Explanation = "No payment transaction channels observed in uploaded documents."
		return item
	}

	item.ObservedValue = observedChannel

	decNorm := strings.ToLower(strings.ReplaceAll(declaredChannel, "_", " "))
	obsNorm := strings.ToLower(observedChannel)

	if strings.Contains(obsNorm, decNorm) || strings.Contains(decNorm, obsNorm) ||
		(strings.Contains(decNorm, "upi") && strings.Contains(obsNorm, "upi")) ||
		(strings.Contains(decNorm, "bank") && strings.Contains(obsNorm, "bank")) ||
		(strings.Contains(decNorm, "gig") && strings.Contains(obsNorm, "platform")) {
		item.Status = domain.ReconConsistent
		item.Explanation = "Observed inflow channels align directly with declared income method."
	} else if decNorm == "multiple" || decNorm == "informal" || decNorm == "other" {
		item.Status = domain.ReconConsistent
		item.Explanation = fmt.Sprintf("Observed channel (%s) is compatible with declared multi-channel pattern.", observedChannel)
	} else {
		item.Status = domain.ReconMinorVariance
		item.Explanation = fmt.Sprintf("Applicant declared '%s', but evidence primarily exhibits '%s'.", declaredChannel, observedChannel)
	}

	return item
}

func reconcileActivityField(declared *domain.DeclaredProfile, observed *domain.ObservedProfile, features domain.DerivedFeatures) domain.ReconciliationItem {
	item := domain.ReconciliationItem{
		Field:         "Activity History / Active Months",
		DeclaredValue: "Active Working Profile",
		Description:   "Declared employment tenure vs observed empirical activity span",
	}

	if observed.ActiveMonths == 0 && features.ActiveDaysCount == 0 {
		item.ObservedValue = "Not Observed"
		item.Status = domain.ReconNotObserved
		item.Explanation = "No transactional timeline data available to measure activity duration."
		return item
	}

	item.ObservedValue = fmt.Sprintf("%d active month(s) (%d active days)", observed.ActiveMonths, features.ActiveDaysCount)

	if observed.ActiveMonths >= 3 || features.ActiveDaysCount >= 45 {
		item.Status = domain.ReconConsistent
		item.Explanation = fmt.Sprintf("Observed %d months of consistent transaction activity verifying continuous engagement.", observed.ActiveMonths)
	} else if observed.ActiveMonths >= 1 || features.ActiveDaysCount >= 10 {
		item.Status = domain.ReconMinorVariance
		item.Explanation = fmt.Sprintf("Observed %d month(s) of activity. A longer track record would strengthen assessment confidence.", observed.ActiveMonths)
	} else {
		item.Status = domain.ReconSignificantVariance
		item.Explanation = "Observed transaction history is very brief (<10 days), indicating limited recent track record."
	}

	return item
}

func formatChannelName(ch string) string {
	switch ch {
	case "bank_transfer":
		return "Bank Transfer"
	case "upi":
		return "UPI (Digital Payments)"
	case "cash":
		return "Cash / Cash in Hand"
	case "cheque":
		return "Cheque"
	case "multiple":
		return "Multiple Channels"
	default:
		return strings.Title(strings.ReplaceAll(ch, "_", " "))
	}
}

// GenerateAssessmentFlags produces deterministic underwriting flags with clear plain-English explanations
func GenerateAssessmentFlags(
	declared *domain.DeclaredProfile,
	features domain.DerivedFeatures,
	dimensions domain.BehavioralDimensions,
	evidenceList []domain.CanonicalEvidence,
	recon *domain.ReconciliationReport,
) []domain.AssessmentFlag {
	var flags []domain.AssessmentFlag

	// 1. Income Consistency vs Variance Flag
	incomeItemFound := false
	if recon != nil {
		for _, it := range recon.Items {
			if it.Field == "Monthly Inflow / Income" && it.Status != domain.ReconNotObserved {
				incomeItemFound = true
				if it.VariancePct <= 10.0 {
					flags = append(flags, domain.AssessmentFlag{
						Code:        domain.FlagIncomeConsistent,
						Title:       "Income Reconciled Within Tolerance",
						Description: fmt.Sprintf("Declared income (%s) matches observed inflows (%s) within %.1f%% variance.", it.DeclaredValue, it.ObservedValue, it.VariancePct),
						Severity:    domain.FlagInfo,
						Category:    "RECONCILIATION",
					})
				} else if it.VariancePct > 25.0 {
					flags = append(flags, domain.AssessmentFlag{
						Code:        domain.FlagDeclaredObservedMismatch,
						Title:       "Declared vs Observed Income Variance",
						Description: fmt.Sprintf("Significant divergence of %.1f%% between declared income (%s) and observed document inflows (%s).", it.VariancePct, it.DeclaredValue, it.ObservedValue),
						Severity:    domain.FlagWatch,
						Category:    "RECONCILIATION",
					})
				} else {
					flags = append(flags, domain.AssessmentFlag{
						Code:        domain.FlagIncomeVariance,
						Title:       "Minor Income Variance Observed",
						Description: fmt.Sprintf("Observed inflows (%s) deviate by %.1f%% from declared income (%s).", it.ObservedValue, it.VariancePct, it.DeclaredValue),
						Severity:    domain.FlagInfo,
						Category:    "RECONCILIATION",
					})
				}
			}
		}
	}

	// If income was completely unobserved
	if !incomeItemFound && declared != nil && declared.MonthlyIncome > 0 {
		flags = append(flags, domain.AssessmentFlag{
			Code:        domain.FlagLimitedEvidence,
			Title:       "Income Documents Pending",
			Description: "Declared monthly income could not be independently cross-verified due to absence of banking or gig earnings records.",
			Severity:    domain.FlagWatch,
			Category:    "COVERAGE",
		})
	}

	// 2. Payment Regularity vs Irregularity
	if features.UtilityTotalBills > 0 {
		if features.UtilityOnTimeRatio >= 0.80 {
			flags = append(flags, domain.AssessmentFlag{
				Code:        domain.FlagPaymentRegular,
				Title:       "Demonstrated Payment Regularity",
				Description: fmt.Sprintf("Maintains high on-time payment track record across %d utility bills (%.0f%% on-time).", features.UtilityTotalBills, features.UtilityOnTimeRatio*100),
				Severity:    domain.FlagInfo,
				Category:    "BEHAVIOURAL",
			})
		} else if features.UtilityOnTimeRatio < 0.70 || features.UtilityAvgDelayDays > 10.0 {
			flags = append(flags, domain.AssessmentFlag{
				Code:        domain.FlagPaymentIrregular,
				Title:       "Utility Payment Delays Detected",
				Description: fmt.Sprintf("Recorded %d late payments with an average delay of %.1f days across %d tracked cycles.", features.UtilityTotalBills-features.UtilityOnTimeCount, features.UtilityAvgDelayDays, features.UtilityTotalBills),
				Severity:    domain.FlagWatch,
				Category:    "BEHAVIOURAL",
			})
		}
	}

	// 3. Multi-Source Verified
	distinctSources := make(map[domain.SourceType]bool)
	for _, ev := range evidenceList {
		if ev.SourceQuality > 0.3 {
			distinctSources[ev.SourceType] = true
		}
	}
	if len(distinctSources) >= 2 {
		flags = append(flags, domain.AssessmentFlag{
			Code:        domain.FlagMultiSourceVerified,
			Title:       "Multi-Source Corroboration",
			Description: fmt.Sprintf("Applicant profile is validated across %d independent evidence sources, reinforcing signal reliability.", len(distinctSources)),
			Severity:    domain.FlagInfo,
			Category:    "VERIFICATION",
		})
	} else if len(distinctSources) <= 1 {
		flags = append(flags, domain.AssessmentFlag{
			Code:        domain.FlagLimitedEvidence,
			Title:       "Single / Limited Evidence Source",
			Description: "Assessment is based on a single evidence stream. Supplying complementary bills or banking records increases confidence.",
			Severity:    domain.FlagWatch,
			Category:    "COVERAGE",
		})
	}

	// 4. Activity History Span
	if features.ActiveDaysCount >= 45 || len(features.MonthlyInflows) >= 4 || features.GigContinuityMonths >= 4 {
		flags = append(flags, domain.AssessmentFlag{
			Code:        domain.FlagLongActivityHistory,
			Title:       "Established Activity Span",
			Description: fmt.Sprintf("Verified consistent transactional activity across %d distinct active days.", features.ActiveDaysCount),
			Severity:    domain.FlagInfo,
			Category:    "BEHAVIOURAL",
		})
	} else if features.ActiveDaysCount > 0 && features.ActiveDaysCount < 15 {
		flags = append(flags, domain.AssessmentFlag{
			Code:        domain.FlagShortObservationPeriod,
			Title:       "Short Observation Window",
			Description: fmt.Sprintf("Observed dataset covers only %d active days; broader historical records will establish higher confidence.", features.ActiveDaysCount),
			Severity:    domain.FlagWatch,
			Category:    "COVERAGE",
		})
	}

	// 5. Evidence Validation & Review Needs
	needsReviewCount := 0
	for _, ev := range evidenceList {
		if ev.Provenance.ValidationStatus == "NEEDS_REVIEW" || ev.Provenance.ValidationStatus == "FAILED" || ev.ExtractionConfidence < 0.60 {
			needsReviewCount++
		}
	}
	if needsReviewCount > 0 {
		flags = append(flags, domain.AssessmentFlag{
			Code:        domain.FlagEvidenceNeedsReview,
			Title:       "Document Validation Warning",
			Description: fmt.Sprintf("%d uploaded document(s) exhibited formatting anomalies or extraction warnings and warrant underwriting review.", needsReviewCount),
			Severity:    domain.FlagReview,
			Category:    "DATA_INTEGRITY",
		})
	}

	return flags
}

// DetermineAssessmentBand assigns an underwriting recommendation band
func DetermineAssessmentBand(
	finalScore int,
	confidence int,
	coverage int,
	flags []domain.AssessmentFlag,
	evidenceList []domain.CanonicalEvidence,
) string {
	// Check for critical review flags first
	hasReviewFlag := false
	hasSigMismatch := false
	for _, fl := range flags {
		if fl.Severity == domain.FlagReview {
			hasReviewFlag = true
		}
		if fl.Code == domain.FlagDeclaredObservedMismatch {
			hasSigMismatch = true
		}
	}

	// Review required if validation issues or strong mismatch with high score claim
	if hasReviewFlag {
		return string(domain.BandReviewRequired)
	}

	// Score-based & coverage-based logic
	if finalScore >= 750 {
		if coverage >= 45 && confidence >= 65 && !hasSigMismatch {
			return string(domain.BandLowRisk)
		}
		// If high score but very low coverage, recommend review rather than penalizing score directly
		if coverage < 30 {
			return string(domain.BandReviewRequired)
		}
		return string(domain.BandModerateRisk)
	}

	if finalScore >= 670 {
		if hasSigMismatch {
			return string(domain.BandReviewRequired)
		}
		return string(domain.BandModerateRisk)
	}

	if finalScore >= 580 {
		return string(domain.BandModerateRisk)
	}

	return string(domain.BandHighRisk)
}

// GenerateEvidenceTraces details how specific evidence sources contributed to each dimension
func GenerateEvidenceTraces(
	features domain.DerivedFeatures,
	dimensions domain.BehavioralDimensions,
	evidenceList []domain.CanonicalEvidence,
) []domain.EvidenceTraceItem {
	var traces []domain.EvidenceTraceItem

	// Source mapping helper
	getSourcesFor := func(types ...domain.SourceType) []string {
		var list []string
		for _, ev := range evidenceList {
			for _, t := range types {
				if ev.SourceType == t {
					list = append(list, fmt.Sprintf("%s (%s)", string(ev.SourceType), ev.Provenance.DocumentName))
				}
			}
		}
		if len(list) == 0 {
			return []string{"Default Conservative Prior (Unobserved)"}
		}
		return list
	}

	// 1. Cash Flow Stability Trace
	cfSources := getSourcesFor(domain.SourceUPI, domain.SourceGig)
	var cfSignals []string
	if features.TotalInflow > 0 {
		cfSignals = append(cfSignals, fmt.Sprintf("Inflow Volatility CV: %.2f", features.InflowVolatilityCV))
		cfSignals = append(cfSignals, fmt.Sprintf("Net Monthly Flow: ₹%.0f", features.NetCashFlow))
		cfSignals = append(cfSignals, fmt.Sprintf("Recurring Inflow Ratio: %.0f%%", features.RecurringInflowRatio*100))
	} else if features.GigTotalEarnings > 0 {
		cfSignals = append(cfSignals, fmt.Sprintf("Gig Earnings Volatility CV: %.2f", features.GigEarningsVolatilityCV))
		cfSignals = append(cfSignals, fmt.Sprintf("Average Monthly Earnings: ₹%.0f", features.GigAvgMonthlyEarnings))
	} else {
		cfSignals = append(cfSignals, "No direct cash flow records supplied; neutral baseline score applied.")
	}

	traces = append(traces, domain.EvidenceTraceItem{
		Dimension:        "cash_flow_stability",
		DimensionTitle:   "Cash-Flow Stability",
		Score:            dimensions.CashFlowStability,
		Sources:          cfSources,
		ExtractedSignals: cfSignals,
		Summary:          fmt.Sprintf("Derived from inflow volume continuity, net liquidity buffer, and monthly cash flow coefficient of variation (Score: %.1f/100).", dimensions.CashFlowStability),
	})

	// 2. Income Consistency Trace
	icSources := getSourcesFor(domain.SourceGig, domain.SourceGST, domain.SourceUPI)
	var icSignals []string
	if features.GigTotalEarnings > 0 {
		icSignals = append(icSignals, fmt.Sprintf("Continuous Gig Months: %d", features.GigContinuityMonths))
		icSignals = append(icSignals, fmt.Sprintf("Active Working Days/Mo: %.1f", features.GigActiveDaysPerMonth))
		icSignals = append(icSignals, fmt.Sprintf("Earnings Per Active Day: ₹%.0f", features.GigEarningsPerActiveDay))
	} else if features.GSTTotalTurnover > 0 {
		icSignals = append(icSignals, fmt.Sprintf("GST Filing Consistency: %.0f%%", features.GSTFilingConsistency*100))
		icSignals = append(icSignals, fmt.Sprintf("Turnover Volatility CV: %.2f", features.GSTTurnoverVolatilityCV))
	} else if features.TotalInflow > 0 {
		icSignals = append(icSignals, fmt.Sprintf("Recurring Inflow Rate: %.0f%%", features.RecurringInflowRatio*100))
		icSignals = append(icSignals, fmt.Sprintf("Active Inflow Months: %d", len(features.MonthlyInflows)))
	} else {
		icSignals = append(icSignals, "Unobserved income stream; neutral prior applied.")
	}

	traces = append(traces, domain.EvidenceTraceItem{
		Dimension:        "income_consistency",
		DimensionTitle:   "Income Consistency",
		Score:            dimensions.IncomeConsistency,
		Sources:          icSources,
		ExtractedSignals: icSignals,
		Summary:          fmt.Sprintf("Evaluated on earning frequency, active working day density, and earning stability across observation cycles (Score: %.1f/100).", dimensions.IncomeConsistency),
	})

	// 3. Payment Discipline Trace
	pdSources := getSourcesFor(domain.SourceUtility, domain.SourceUPI)
	var pdSignals []string
	if features.UtilityTotalBills > 0 {
		pdSignals = append(pdSignals, fmt.Sprintf("Utility On-Time Rate: %.1f%% (%d/%d bills)", features.UtilityOnTimeRatio*100, features.UtilityOnTimeCount, features.UtilityTotalBills))
		pdSignals = append(pdSignals, fmt.Sprintf("Average Late Days: %.1f days", features.UtilityAvgDelayDays))
	} else if features.TotalInflow > 0 {
		pdSignals = append(pdSignals, fmt.Sprintf("Inflow to Outflow Ratio: %.2fx", features.CreditDebitRatio))
	} else {
		pdSignals = append(pdSignals, "No utility or bill payment records present; neutral discipline score applied.")
	}

	traces = append(traces, domain.EvidenceTraceItem{
		Dimension:        "payment_discipline",
		DimensionTitle:   "Payment Discipline",
		Score:            dimensions.PaymentDiscipline,
		Sources:          pdSources,
		ExtractedSignals: pdSignals,
		Summary:          fmt.Sprintf("Computed from recurring bill fulfillment punctuality, absence of overdue penalties, and expenditure discipline (Score: %.1f/100).", dimensions.PaymentDiscipline),
	})

	// 4. Activity Continuity Trace
	acSources := getSourcesFor(domain.SourceUPI, domain.SourceGig, domain.SourceTelecom)
	var acSignals []string
	acSignals = append(acSignals, fmt.Sprintf("Calendar Active Days: %d", features.ActiveDaysCount))
	acSignals = append(acSignals, fmt.Sprintf("Total Transactions Tracked: %d", features.TotalTransactions))
	acSignals = append(acSignals, fmt.Sprintf("Active Days Ratio: %.1f%%", features.ActiveDaysRatio*100))

	traces = append(traces, domain.EvidenceTraceItem{
		Dimension:        "activity_continuity",
		DimensionTitle:   "Activity Continuity",
		Score:            dimensions.ActivityContinuity,
		Sources:          acSources,
		ExtractedSignals: acSignals,
		Summary:          fmt.Sprintf("Reflects day-to-day economic engagement density and operational persistence over calendar periods (Score: %.1f/100).", dimensions.ActivityContinuity),
	})

	// 5. Financial Resilience Trace
	frSources := getSourcesFor(domain.SourceUPI, domain.SourceUtility, domain.SourceGig)
	var frSignals []string
	if features.TotalInflow > 0 {
		frSignals = append(frSignals, fmt.Sprintf("Credit/Debit Ratio: %.2fx", features.CreditDebitRatio))
		frSignals = append(frSignals, fmt.Sprintf("Net Cash Buffer: ₹%.0f", features.NetCashFlow))
		frSignals = append(frSignals, fmt.Sprintf("Recurring Inflow Cushion: %.0f%%", features.RecurringInflowRatio*100))
	} else {
		frSignals = append(frSignals, "Baseline solvency prior applied in absence of complete outflow records.")
	}

	traces = append(traces, domain.EvidenceTraceItem{
		Dimension:        "financial_resilience",
		DimensionTitle:   "Financial Resilience",
		Score:            dimensions.FinancialResilience,
		Sources:          frSources,
		ExtractedSignals: frSignals,
		Summary:          fmt.Sprintf("Calculated from net surplus liquidity, expense cushion ratio, and recurring buffer strength (Score: %.1f/100).", dimensions.FinancialResilience),
	})

	return traces
}
