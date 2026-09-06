package extractor

import (
	"fmt"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

// NormalizeToEvents converts any canonical evidence bundle into a stream of normalized EvidenceEvent objects
func NormalizeToEvents(ev *domain.CanonicalEvidence) []domain.EvidenceEvent {
	var events []domain.EvidenceEvent

	// 1. UPI Transactions
	for idx, t := range ev.UPITransactions {
		eventID := t.ID
		if eventID == "" {
			eventID = fmt.Sprintf("EVT-UPI-%d", idx+1)
		}
		events = append(events, domain.EvidenceEvent{
			ID:         eventID,
			Timestamp:  t.Date,
			SourceType: domain.SourceUPI,
			EventType:  "transaction",
			Amount:     t.Amount,
			Direction:  t.Type,
			Category:   t.Category,
			Status:     t.Status,
			Metadata: map[string]interface{}{
				"counterparty": t.Counterparty,
				"description":  t.Description,
			},
			Confidence: ev.ExtractionConfidence,
			Provenance: ev.Provenance,
		})
	}

	// 2. Utility Payments
	for idx, b := range ev.UtilityPayments {
		ts := b.DueDate
		if b.PaymentDate != nil {
			ts = *b.PaymentDate
		}
		eventID := b.ID
		if eventID == "" {
			eventID = fmt.Sprintf("EVT-UTIL-%d", idx+1)
		}
		events = append(events, domain.EvidenceEvent{
			ID:         eventID,
			Timestamp:  ts,
			SourceType: domain.SourceUtility,
			EventType:  "bill_payment",
			Amount:     b.BillAmount,
			Direction:  "debit",
			Category:   b.ServiceType,
			Status:     b.Status,
			Metadata: map[string]interface{}{
				"provider_name": b.ProviderName,
				"bill_period":   b.BillPeriod,
				"due_date":      b.DueDate.Format("2006-01-02"),
				"days_late":     b.DaysLate,
			},
			Confidence: ev.ExtractionConfidence,
			Provenance: ev.Provenance,
		})
	}

	// 3. Gig Earnings
	for idx, p := range ev.GigPayouts {
		eventID := p.ID
		if eventID == "" {
			eventID = fmt.Sprintf("EVT-GIG-%d", idx+1)
		}
		earnings := p.NetPayout
		if earnings <= 0 {
			earnings = p.GrossEarnings
		}
		events = append(events, domain.EvidenceEvent{
			ID:         eventID,
			Timestamp:  p.PeriodEnd,
			SourceType: domain.SourceGig,
			EventType:  "gig_earning",
			Amount:     earnings,
			Direction:  "credit",
			Category:   "gig_earnings",
			Status:     "SUCCESS",
			Metadata: map[string]interface{}{
				"platform":       p.Platform,
				"period_start":   p.PeriodStart.Format("2006-01-02"),
				"period_end":     p.PeriodEnd.Format("2006-01-02"),
				"gross_earnings": p.GrossEarnings,
				"net_payout":     p.NetPayout,
				"active_days":    p.ActiveDays,
				"trips_or_jobs":  p.TripsOrJobs,
			},
			Confidence: ev.ExtractionConfidence,
			Provenance: ev.Provenance,
		})
	}

	// 4. GST Filings
	for idx, g := range ev.GSTRRecords {
		eventID := g.ID
		if eventID == "" {
			eventID = fmt.Sprintf("EVT-GST-%d", idx+1)
		}
		events = append(events, domain.EvidenceEvent{
			ID:         eventID,
			Timestamp:  g.FilingDate,
			SourceType: domain.SourceGST,
			EventType:  "tax_filing",
			Amount:     g.ReportedTurnover,
			Direction:  "neutral",
			Category:   "gst_turnover",
			Status:     g.FilingStatus,
			Metadata: map[string]interface{}{
				"gstin":         g.GSTIN,
				"return_period": g.ReturnPeriod,
				"return_type":   g.ReturnType,
				"tax_liability": g.TaxLiability,
				"tax_paid":      g.TaxPaid,
			},
			Confidence: ev.ExtractionConfidence,
			Provenance: ev.Provenance,
		})
	}

	// 5. Telecom
	for idx, t := range ev.TelecomRecords {
		eventID := t.ID
		if eventID == "" {
			eventID = fmt.Sprintf("EVT-TEL-%d", idx+1)
		}
		events = append(events, domain.EvidenceEvent{
			ID:         eventID,
			Timestamp:  t.Date,
			SourceType: domain.SourceTelecom,
			EventType:  "telecom_recharge",
			Amount:     t.Amount,
			Direction:  "debit",
			Category:   t.PlanType,
			Status:     "SUCCESS",
			Metadata: map[string]interface{}{
				"operator":      t.Operator,
				"validity_days": t.ValidityDays,
			},
			Confidence: ev.ExtractionConfidence,
			Provenance: ev.Provenance,
		})
	}

	return events
}
