package ai

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/extractor"
)

// DeterministicProvider extracts and normalizes financial evidence using rule-based and structural parsing
type DeterministicProvider struct{}

func NewDeterministicProvider() *DeterministicProvider {
	return &DeterministicProvider{}
}

func (p *DeterministicProvider) Name() string {
	return "DeterministicRuleEngine"
}

func (p *DeterministicProvider) Classify(ctx context.Context, input DocumentInput) (*domain.ClassificationResult, error) {
	text := input.ExtractedText
	if text == "" && (input.Format == domain.FormatCSV || input.Format == domain.FormatJSON) {
		text = string(input.RawBytes)
	}

	result := extractor.ClassifyDocument(input.Filename, input.MimeType, text)
	return result, nil
}

func (p *DeterministicProvider) Extract(ctx context.Context, input DocumentInput, sourceType domain.SourceType) (*domain.CanonicalEvidence, error) {
	evidenceID := fmt.Sprintf("EV-%s-%d", sourceType, time.Now().UnixNano()/1000000)
	docName := filepath.Base(input.Filename)

	ev := &domain.CanonicalEvidence{
		ID:                   evidenceID,
		CustomerID:           "CUST-APPLICANT-001",
		SourceType:           sourceType,
		SourceProvider:       "Verified Source",
		ExtractionConfidence: 0.95,
		SourceQuality:        0.95,
		Provenance: domain.ProvenanceItem{
			EvidenceID:           evidenceID,
			SourceType:           sourceType,
			DocumentName:         docName,
			DocumentFormat:       input.Format,
			ExtractionConfidence: 0.95,
			SourceQualityScore:   0.95,
			ValidationStatus:     "PASSED",
			IngestedAt:           time.Now(),
		},
	}

	switch sourceType {
	case domain.SourceUPI:
		ev.SourceProvider = "BHIM UPI / Bank"
		if input.Format == domain.FormatCSV {
			txns, err := extractor.ParseUPICSV(input.RawBytes)
			if err != nil {
				return nil, fmt.Errorf("failed to parse UPI CSV: %w", err)
			}
			ev.UPITransactions = txns
			ev.ExtractionConfidence = 0.98
		} else {
			txns, err := extractor.ParseUPIText(input.ExtractedText)
			if err != nil {
				return nil, fmt.Errorf("failed to parse UPI statement text: %w", err)
			}
			ev.UPITransactions = txns
			ev.ExtractionConfidence = 0.96
		}

		if len(ev.UPITransactions) > 0 {
			minD := ev.UPITransactions[0].Date
			maxD := ev.UPITransactions[0].Date
			for _, t := range ev.UPITransactions {
				if t.Date.Before(minD) {
					minD = t.Date
				}
				if t.Date.After(maxD) {
					maxD = t.Date
				}
			}
			ev.PeriodStart = minD.Format("2006-01-02")
			ev.PeriodEnd = maxD.Format("2006-01-02")
			ev.Provenance.PeriodStart = ev.PeriodStart
			ev.Provenance.PeriodEnd = ev.PeriodEnd
		}

	case domain.SourceUtility:
		ev.SourceProvider = "BESCOM Electricity"
		bills, err := extractor.ParseUtilityText(input.ExtractedText)
		if err != nil {
			return nil, fmt.Errorf("failed to parse utility bill text: %w", err)
		}
		ev.UtilityPayments = bills
		ev.PeriodStart = "2026-01-01"
		ev.PeriodEnd = "2026-03-31"
		ev.Provenance.PeriodStart = ev.PeriodStart
		ev.Provenance.PeriodEnd = ev.PeriodEnd

	case domain.SourceGig:
		ev.SourceProvider = "Zomato Delivery Partner"
		payouts, err := extractor.ParseGigText(input.ExtractedText)
		if err != nil {
			return nil, fmt.Errorf("failed to parse gig earnings text: %w", err)
		}
		ev.GigPayouts = payouts
		if len(payouts) > 0 {
			ev.PeriodStart = payouts[0].PeriodStart.Format("2006-01-02")
			ev.PeriodEnd = payouts[len(payouts)-1].PeriodEnd.Format("2006-01-02")
			ev.Provenance.PeriodStart = ev.PeriodStart
			ev.Provenance.PeriodEnd = ev.PeriodEnd
		}

	default:
		return nil, fmt.Errorf("unsupported source type for deterministic extraction: %s", sourceType)
	}

	ev.Provenance.RecordCount = len(ev.UPITransactions) + len(ev.UtilityPayments) + len(ev.GigPayouts) + len(ev.GSTRRecords) + len(ev.TelecomRecords)
	return ev, nil
}
