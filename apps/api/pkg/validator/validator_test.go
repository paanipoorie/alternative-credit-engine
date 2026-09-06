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
	if res.Status != domain.ValidationPartial && res.Status != "WARNING" {
		t.Errorf("Expected status PARTIAL/WARNING due to duplicates and negative amount, got %s", res.Status)
	}
	if len(ev.UPITransactions) != 2 {
		t.Errorf("Expected 2 valid transactions after excluding invalid amount, got %d", len(ev.UPITransactions))
	}
}

func TestValidateEvidenceUtility(t *testing.T) {
	dueDate := time.Date(2026, 1, 20, 0, 0, 0, 0, time.UTC)
	payDate := time.Date(2026, 1, 18, 0, 0, 0, 0, time.UTC)
	ev := &domain.CanonicalEvidence{
		SourceType: domain.SourceUtility,
		UtilityPayments: []domain.UtilityPayment{
			{
				ID:            "UTIL-1",
				BillPeriod:    "2026-01",
				ProviderName:  "BESCOM",
				ServiceType:   "electricity",
				BillAmount:    1200.0,
				DueDate:       dueDate,
				PaymentDate:   &payDate,
				Status:        "PAID_ON_TIME",
				PaymentAmount: 1200.0,
			},
		},
	}

	res := ValidateEvidence(ev)
	if res.Status != domain.ValidationValid && res.Status != "PASSED" {
		t.Errorf("Expected status VALID for clean utility record, got %s", res.Status)
	}
}

func TestValidateEmptyEvidence(t *testing.T) {
	ev := &domain.CanonicalEvidence{
		SourceType: domain.SourceUPI,
	}

	res := ValidateEvidence(ev)
	if res.Status != domain.ValidationFailed && res.Status != "FAILED" {
		t.Errorf("Expected status FAILED for empty evidence, got %s", res.Status)
	}
}
