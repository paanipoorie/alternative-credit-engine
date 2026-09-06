package validator

import (
	"testing"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

func TestValidateEvidenceUPI(t *testing.T) {
	now := time.Now()
	ev := &domain.CanonicalEvidence{
		SourceType: domain.SourceUPI,
		UPITransactions: []domain.UPITransaction{
			{
				ID:     "TXN-1",
				Date:   now.AddDate(0, 0, -5),
				Amount: 1500.0,
				Type:   "credit",
			},
			{
				ID:     "TXN-1", // duplicate
				Date:   now.AddDate(0, 0, -4),
				Amount: 2000.0,
				Type:   "credit",
			},
			{
				ID:     "TXN-2",
				Date:   now.AddDate(0, 0, -3),
				Amount: -50.0, // invalid amount
				Type:   "debit",
			},
		},
	}

	res := ValidateEvidence(ev)
	if res.Status != "WARNING" {
		t.Errorf("Expected status WARNING due to duplicates and negative amount, got %s", res.Status)
	}
	if len(ev.UPITransactions) != 2 {
		t.Errorf("Expected 2 valid transactions after excluding invalid amount, got %d", len(ev.UPITransactions))
	}
}

func TestValidateEmptyEvidence(t *testing.T) {
	ev := &domain.CanonicalEvidence{
		SourceType: domain.SourceUPI,
	}

	res := ValidateEvidence(ev)
	if res.Status != "FAILED" {
		t.Errorf("Expected status FAILED for empty evidence, got %s", res.Status)
	}
}
