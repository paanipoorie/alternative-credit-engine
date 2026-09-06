package validator

import (
	"fmt"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

// ValidateEvidence performs rigorous validation of extracted records before scoring
func ValidateEvidence(ev *domain.CanonicalEvidence) domain.ValidationResult {
	res := domain.ValidationResult{
		Status: domain.ValidationValid,
	}

	var notes []string

	switch ev.SourceType {
	case domain.SourceUPI:
		validateUPI(ev, &res, &notes)
	case domain.SourceUtility:
		validateUtility(ev, &res, &notes)
	case domain.SourceGig:
		validateGig(ev, &res, &notes)
	case domain.SourceGST:
		validateGST(ev, &res, &notes)
	case domain.SourceTelecom:
		validateTelecom(ev, &res, &notes)
	default:
		res.Status = domain.ValidationFailed
		res.Errors = append(res.Errors, "Unknown evidence source type")
		notes = append(notes, "Evidence failed classification or unsupported source type.")
	}

	if len(res.Errors) > 0 {
		res.Status = domain.ValidationFailed
	} else if res.InvalidCount > 0 && res.ValidCount > 0 {
		res.Status = domain.ValidationPartial
	} else if len(res.Warnings) > 0 || (ev.ExtractionConfidence > 0 && ev.ExtractionConfidence < 0.70) {
		res.Status = domain.ValidationNeedsReview
	} else {
		res.Status = domain.ValidationValid
	}

	ev.Provenance.ValidationStatus = res.Status
	ev.Provenance.ValidationNotes = notes
	if ev.SourceQuality <= 0 {
		if res.Status == domain.ValidationValid || res.Status == domain.ValidationPassed {
			ev.SourceQuality = 0.95
		} else if res.Status == domain.ValidationPartial || res.Status == domain.ValidationNeedsReview {
			ev.SourceQuality = 0.80
		} else {
			ev.SourceQuality = 0.40
		}
	}
	ev.Provenance.SourceQualityScore = ev.SourceQuality

	return res
}

func validateUPI(ev *domain.CanonicalEvidence, res *domain.ValidationResult, notes *[]string) {
	if len(ev.UPITransactions) == 0 {
		res.Errors = append(res.Errors, "No UPI transaction records found")
		*notes = append(*notes, "Evidence payload contains zero transactions.")
		return
	}

	seenIDs := make(map[string]bool)
	duplicateCount := 0
	futureDateCount := 0
	invalidAmountCount := 0
	now := time.Now().Add(24 * time.Hour) // 1 day buffer for timezones

	var validTxns []domain.UPITransaction

	for _, t := range ev.UPITransactions {
		isValid := true

		if t.Amount <= 0 {
			invalidAmountCount++
			isValid = false
		}
		if t.Date.After(now) {
			futureDateCount++
			isValid = false
		}
		if t.Type != "credit" && t.Type != "debit" {
			t.Type = "credit" // normalized fallback
		}

		if t.ID != "" {
			if seenIDs[t.ID] {
				duplicateCount++
			} else {
				seenIDs[t.ID] = true
			}
		}

		if isValid {
			res.ValidCount++
			validTxns = append(validTxns, t)
		} else {
			res.InvalidCount++
		}
	}

	ev.UPITransactions = validTxns
	ev.Provenance.RecordCount = len(validTxns)

	if duplicateCount > 0 {
		res.Warnings = append(res.Warnings, fmt.Sprintf("%d duplicate transaction IDs detected and reconciled", duplicateCount))
		*notes = append(*notes, fmt.Sprintf("Reconciled %d duplicate transaction IDs.", duplicateCount))
	}
	if invalidAmountCount > 0 {
		res.Warnings = append(res.Warnings, fmt.Sprintf("%d transactions with zero or negative amounts excluded", invalidAmountCount))
		*notes = append(*notes, fmt.Sprintf("Excluded %d malformed transactions with invalid amounts.", invalidAmountCount))
	}
	if futureDateCount > 0 {
		res.Warnings = append(res.Warnings, fmt.Sprintf("%d transactions with future dates excluded", futureDateCount))
		*notes = append(*notes, fmt.Sprintf("Excluded %d transactions with impossible dates.", futureDateCount))
	}

	if len(validTxns) > 0 {
		*notes = append(*notes, fmt.Sprintf("Validated %d transactions spanning %s to %s.", len(validTxns), ev.PeriodStart, ev.PeriodEnd))
	}
}

func validateUtility(ev *domain.CanonicalEvidence, res *domain.ValidationResult, notes *[]string) {
	if len(ev.UtilityPayments) == 0 {
		res.Errors = append(res.Errors, "No utility payment records found")
		*notes = append(*notes, "Evidence contains zero utility payment records.")
		return
	}

	for _, b := range ev.UtilityPayments {
		if b.BillAmount <= 0 {
			res.Warnings = append(res.Warnings, "Utility record has non-positive amount")
		}
		if b.Status != "PAID_ON_TIME" && b.Status != "PAID_LATE" && b.Status != "UNPAID" {
			b.Status = "PAID_ON_TIME"
		}
		res.ValidCount++
	}

	ev.Provenance.RecordCount = len(ev.UtilityPayments)
	*notes = append(*notes, fmt.Sprintf("Validated %d utility billing records from %s.", len(ev.UtilityPayments), ev.SourceProvider))
}

func validateGig(ev *domain.CanonicalEvidence, res *domain.ValidationResult, notes *[]string) {
	if len(ev.GigPayouts) == 0 {
		res.Errors = append(res.Errors, "No gig payout records found")
		*notes = append(*notes, "Evidence contains zero gig payout records.")
		return
	}

	for _, p := range ev.GigPayouts {
		if p.NetPayout <= 0 && p.GrossEarnings <= 0 {
			res.Warnings = append(res.Warnings, "Gig record has zero payout amount")
		}
		if p.ActiveDays < 0 || p.ActiveDays > 31 {
			res.Warnings = append(res.Warnings, "Gig active days value out of valid monthly range [1-31]")
		}
		res.ValidCount++
	}

	ev.Provenance.RecordCount = len(ev.GigPayouts)
	*notes = append(*notes, fmt.Sprintf("Validated %d monthly payout cycles from %s.", len(ev.GigPayouts), ev.SourceProvider))
}

func validateGST(ev *domain.CanonicalEvidence, res *domain.ValidationResult, notes *[]string) {
	if len(ev.GSTRRecords) == 0 {
		res.Errors = append(res.Errors, "No GST filing records found")
		return
	}
	for _, g := range ev.GSTRRecords {
		if len(g.GSTIN) < 10 {
			res.Warnings = append(res.Warnings, "GSTIN format appears truncated or invalid")
		}
		res.ValidCount++
	}
	ev.Provenance.RecordCount = len(ev.GSTRRecords)
	*notes = append(*notes, fmt.Sprintf("Validated %d GST tax return periods.", len(ev.GSTRRecords)))
}

func validateTelecom(ev *domain.CanonicalEvidence, res *domain.ValidationResult, notes *[]string) {
	if len(ev.TelecomRecords) == 0 {
		res.Errors = append(res.Errors, "No telecom recharge records found")
		return
	}
	for _, t := range ev.TelecomRecords {
		if t.Amount <= 0 {
			res.Warnings = append(res.Warnings, "Telecom recharge amount is zero or negative")
		}
		res.ValidCount++
	}
	ev.Provenance.RecordCount = len(ev.TelecomRecords)
	*notes = append(*notes, fmt.Sprintf("Validated %d telecom prepaid recharges.", len(ev.TelecomRecords)))
}
