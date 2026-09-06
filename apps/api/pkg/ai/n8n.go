package ai

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

// N8NProvider implements AIProvider by delegating document processing to an n8n webhook workflow
type N8NProvider struct {
	webhookURL string
	apiKey     string
	httpClient *http.Client
	fallback   AIProvider
}

func NewN8NProvider(fallback AIProvider) *N8NProvider {
	url := os.Getenv("N8N_WEBHOOK_URL")
	key := os.Getenv("N8N_API_KEY")

	if fallback == nil {
		fallback = NewGeminiProvider()
	}

	return &N8NProvider{
		webhookURL: url,
		apiKey:     key,
		httpClient: &http.Client{Timeout: 30 * time.Second},
		fallback:   fallback,
	}
}

func (p *N8NProvider) Name() string {
	if p.webhookURL == "" {
		return fmt.Sprintf("N8N (Unconfigured) -> %s", p.fallback.Name())
	}
	return "n8n Orchestration Pipeline"
}

func (p *N8NProvider) IsConfigured() bool {
	return p.webhookURL != ""
}

type n8nWebhookPayload struct {
	Action         string                `json:"action"` // "classify" | "extract"
	Filename       string                `json:"filename"`
	MimeType       string                `json:"mime_type"`
	Format         domain.DocumentFormat `json:"format"`
	ExtractedText  string                `json:"extracted_text,omitempty"`
	RawBytesBase64 string                `json:"raw_bytes_base64,omitempty"`
	SourceType     domain.SourceType     `json:"source_type,omitempty"`
}

func (p *N8NProvider) Classify(ctx context.Context, input DocumentInput) (*domain.ClassificationResult, error) {
	if !p.IsConfigured() {
		return p.fallback.Classify(ctx, input)
	}

	payload := n8nWebhookPayload{
		Action:        "classify",
		Filename:      input.Filename,
		MimeType:      input.MimeType,
		Format:        input.Format,
		ExtractedText: input.ExtractedText,
	}
	if len(input.RawBytes) > 0 && input.Format == domain.FormatImage {
		payload.RawBytesBase64 = base64.StdEncoding.EncodeToString(input.RawBytes)
	}

	respBody, err := p.callWebhook(ctx, payload)
	if err != nil {
		log.Printf("[n8n Classify Fallback] Webhook failed: %v. Falling back to %s.", err, p.fallback.Name())
		return p.fallback.Classify(ctx, input)
	}

	var res domain.ClassificationResult
	if err := json.Unmarshal(respBody, &res); err != nil {
		log.Printf("[n8n Classify Fallback] JSON decode failed: %v. Falling back to %s.", err, p.fallback.Name())
		return p.fallback.Classify(ctx, input)
	}

	if res.SourceType == "" {
		return p.fallback.Classify(ctx, input)
	}

	res.Format = input.Format
	return &res, nil
}

func (p *N8NProvider) Extract(ctx context.Context, input DocumentInput, sourceType domain.SourceType) (*domain.CanonicalEvidence, error) {
	if !p.IsConfigured() {
		return p.fallback.Extract(ctx, input, sourceType)
	}

	payload := n8nWebhookPayload{
		Action:        "extract",
		Filename:      input.Filename,
		MimeType:      input.MimeType,
		Format:        input.Format,
		ExtractedText: input.ExtractedText,
		SourceType:    sourceType,
	}
	if len(input.RawBytes) > 0 && input.Format == domain.FormatImage {
		payload.RawBytesBase64 = base64.StdEncoding.EncodeToString(input.RawBytes)
	}

	respBody, err := p.callWebhook(ctx, payload)
	if err != nil {
		log.Printf("[n8n Extract Fallback] Webhook failed: %v. Falling back to %s.", err, p.fallback.Name())
		return p.fallback.Extract(ctx, input, sourceType)
	}

	var ev domain.CanonicalEvidence
	if err := json.Unmarshal(respBody, &ev); err != nil {
		log.Printf("[n8n Extract Fallback] JSON decode failed: %v. Falling back to %s.", err, p.fallback.Name())
		return p.fallback.Extract(ctx, input, sourceType)
	}

	if ev.ID == "" {
		ev.ID = fmt.Sprintf("EV-%s-%d", sourceType, time.Now().UnixNano()/1000000)
	}
	ev.SourceType = sourceType
	if ev.Origin == "" {
		ev.Origin = domain.OriginLiveN8NGemini
	}
	ev.Provenance.Origin = ev.Origin
	ev.Provenance.EvidenceID = ev.ID
	ev.Provenance.DocumentName = input.Filename
	ev.Provenance.DocumentFormat = input.Format
	ev.Provenance.IngestedAt = time.Now()

	return &ev, nil
}

func (p *N8NProvider) callWebhook(ctx context.Context, payload n8nWebhookPayload) ([]byte, error) {
	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.webhookURL, bytes.NewReader(jsonBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	if p.apiKey != "" {
		req.Header.Set("X-N8N-API-KEY", p.apiKey)
		req.Header.Set("Authorization", "Bearer "+p.apiKey)
	}

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("n8n returned status HTTP %d: %s", resp.StatusCode, string(body))
	}

	return io.ReadAll(resp.Body)
}
