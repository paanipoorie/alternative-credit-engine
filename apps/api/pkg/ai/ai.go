package ai

import (
	"context"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

// DocumentInput represents an uploaded document payload for AI or deterministic processing
type DocumentInput struct {
	Filename      string
	MimeType      string
	Format        domain.DocumentFormat
	RawBytes      []byte
	ExtractedText string
}

// AIProvider defines the contract for document understanding and information extraction.
// Guardrail: AI must NEVER calculate the final credit score or make lending decisions.
type AIProvider interface {
	Name() string
	Classify(ctx context.Context, input DocumentInput) (*domain.ClassificationResult, error)
	Extract(ctx context.Context, input DocumentInput, classifiedType domain.SourceType) (*domain.CanonicalEvidence, error)
}
