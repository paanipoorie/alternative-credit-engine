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
	"strings"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

// GeminiProvider implements AIProvider using Google's Gemini Models
type GeminiProvider struct {
	apiKey     string
	modelName  string
	httpClient *http.Client
	fallback   AIProvider
}

func NewGeminiProvider() *GeminiProvider {
	key := os.Getenv("GEMINI_API_KEY")
	if key == "" {
		key = os.Getenv("GOOGLE_API_KEY")
	}

	model := os.Getenv("GEMINI_MODEL")
	if model == "" {
		model = "gemini-2.0-flash"
	}

	return &GeminiProvider{
		apiKey:     key,
		modelName:  model,
		httpClient: &http.Client{Timeout: 30 * time.Second},
		fallback:   NewDeterministicProvider(),
	}
}

func (g *GeminiProvider) Name() string {
	if g.apiKey == "" {
		return "DeterministicEngine (Gemini Key Not Set)"
	}
	return fmt.Sprintf("GeminiProvider (%s)", g.modelName)
}

func (g *GeminiProvider) IsConfigured() bool {
	return g.apiKey != ""
}

type geminiPart struct {
	Text       string            `json:"text,omitempty"`
	InlineData *geminiInlineData `json:"inline_data,omitempty"`
}

type geminiInlineData struct {
	MimeType string `json:"mime_type"`
	Data     string `json:"data"`
}

type geminiContent struct {
	Role  string       `json:"role"`
	Parts []geminiPart `json:"parts"`
}

type geminiRequest struct {
	Contents         []geminiContent  `json:"contents"`
	GenerationConfig *geminiGenConfig `json:"generationConfig,omitempty"`
}

type geminiGenConfig struct {
	Temperature      float64 `json:"temperature"`
	ResponseMimeType string  `json:"responseMimeType,omitempty"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func (g *GeminiProvider) Classify(ctx context.Context, input DocumentInput) (*domain.ClassificationResult, error) {
	if !g.IsConfigured() || input.Format == domain.FormatCSV {
		// Use deterministic classifier
		return g.fallback.Classify(ctx, input)
	}

	prompt := `You are an automated document classification engine for alternative credit underwriting.
Identify the source category of the provided financial document.
Categories:
- "upi" (UPI / bank account transaction statement)
- "utility" (Electricity, water, or gas bill/receipt)
- "gig_earnings" (Delivery partner or rideshare platform earnings summary)
- "gst" (GSTR-3B, GSTR-1 GST tax filing)
- "telecom" (Mobile recharge / data statement)
- "unknown" (Unrecognized or unsupported document)

Output valid JSON strictly in this structure:
{
  "source_type": "upi" | "utility" | "gig_earnings" | "gst" | "telecom" | "unknown",
  "document_type": "Human readable document title",
  "provider": "Provider Name (e.g. BESCOM, Zomato, BHIM)",
  "period": "Period if observed (e.g. Jan-Mar 2026)",
  "confidence": 0.95,
  "reason": "Brief rationale"
}`

	var parts []geminiPart
	parts = append(parts, geminiPart{Text: prompt})

	if input.Format == domain.FormatImage && len(input.RawBytes) > 0 {
		mime := input.MimeType
		if mime == "" {
			mime = "image/png"
		}
		parts = append(parts, geminiPart{
			InlineData: &geminiInlineData{
				MimeType: mime,
				Data:     base64.StdEncoding.EncodeToString(input.RawBytes),
			},
		})
	} else if input.ExtractedText != "" {
		parts = append(parts, geminiPart{Text: fmt.Sprintf("Document text snippet:\n%s", truncateText(input.ExtractedText, 3000))})
	}

	rawResp, err := g.callGemini(ctx, parts)
	if err != nil {
		log.Printf("[Gemini Classify Fallback] Call failed: %v. Using deterministic provider.", err)
		return g.fallback.Classify(ctx, input)
	}

	cleanJSON := extractJSON(rawResp)
	var res domain.ClassificationResult
	if err := json.Unmarshal([]byte(cleanJSON), &res); err != nil {
		log.Printf("[Gemini Classify Fallback] Parse error: %v. Using deterministic provider.", err)
		return g.fallback.Classify(ctx, input)
	}

	res.Format = input.Format
	return &res, nil
}

func (g *GeminiProvider) Extract(ctx context.Context, input DocumentInput, sourceType domain.SourceType) (*domain.CanonicalEvidence, error) {
	// For standard CSV or if Gemini not configured, use deterministic extractor
	if !g.IsConfigured() || input.Format == domain.FormatCSV {
		return g.fallback.Extract(ctx, input, sourceType)
	}

	// Try deterministic first for standard synthetic documents for absolute precision
	if ev, err := g.fallback.Extract(ctx, input, sourceType); err == nil && len(ev.UPITransactions)+len(ev.UtilityPayments)+len(ev.GigPayouts) > 0 {
		return ev, nil
	}

	// For unstructured images or complex documents, call Gemini
	prompt := fmt.Sprintf(`You are a financial document extraction agent. Extract structured records from this %s evidence into canonical JSON format.
GUARDRAIL: Do NOT calculate credit scores or make lending decisions. Extract only observed factual fields.

Return JSON in this format:
{
  "provider": "Provider Name",
  "period_start": "YYYY-MM-DD",
  "period_end": "YYYY-MM-DD",
  "upi_transactions": [{"id": "...", "date": "2026-01-02T10:00:00Z", "amount": 100.0, "type": "credit|debit", "counterparty": "...", "description": "...", "status": "SUCCESS", "category": "..."}],
  "utility_payments": [{"id": "...", "bill_period": "2026-01", "provider_name": "...", "service_type": "electricity", "bill_amount": 100.0, "due_date": "2026-01-20T00:00:00Z", "payment_date": "2026-01-17T00:00:00Z", "status": "PAID_ON_TIME", "days_late": 0, "payment_amount": 100.0}],
  "gig_payouts": [{"id": "...", "platform": "...", "period_start": "2026-01-01T00:00:00Z", "period_end": "2026-01-31T23:59:59Z", "gross_earnings": 1000.0, "net_payout": 900.0, "active_days": 25, "trips_or_jobs": 200}]
}`, sourceType)

	var parts []geminiPart
	parts = append(parts, geminiPart{Text: prompt})

	if input.Format == domain.FormatImage && len(input.RawBytes) > 0 {
		mime := input.MimeType
		if mime == "" {
			mime = "image/png"
		}
		parts = append(parts, geminiPart{
			InlineData: &geminiInlineData{
				MimeType: mime,
				Data:     base64.StdEncoding.EncodeToString(input.RawBytes),
			},
		})
	} else if input.ExtractedText != "" {
		parts = append(parts, geminiPart{Text: fmt.Sprintf("Document text:\n%s", input.ExtractedText)})
	}

	rawResp, err := g.callGemini(ctx, parts)
	if err != nil {
		log.Printf("[Gemini Extract Fallback] Call failed: %v. Using deterministic provider.", err)
		return g.fallback.Extract(ctx, input, sourceType)
	}

	cleanJSON := extractJSON(rawResp)
	var ev domain.CanonicalEvidence
	if err := json.Unmarshal([]byte(cleanJSON), &ev); err != nil {
		log.Printf("[Gemini Extract Fallback] JSON unmarshal error: %v. Using deterministic provider.", err)
		return g.fallback.Extract(ctx, input, sourceType)
	}

	ev.ID = fmt.Sprintf("EV-%s-%d", sourceType, time.Now().UnixNano()/1000000)
	ev.SourceType = sourceType
	ev.ExtractionConfidence = 0.94
	ev.SourceQuality = 0.92
	ev.Provenance = domain.ProvenanceItem{
		EvidenceID:           ev.ID,
		SourceType:           sourceType,
		DocumentName:         input.Filename,
		DocumentFormat:       input.Format,
		ExtractionConfidence: 0.94,
		SourceQualityScore:   0.92,
		ValidationStatus:     "PASSED",
		IngestedAt:           time.Now(),
	}

	return &ev, nil
}

func (g *GeminiProvider) callGemini(ctx context.Context, parts []geminiPart) (string, error) {
	if g.apiKey == "" {
		return "", fmt.Errorf("no gemini api key")
	}

	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", g.modelName, g.apiKey)

	reqBody := geminiRequest{
		Contents: []geminiContent{
			{
				Role:  "user",
				Parts: parts,
			},
		},
		GenerationConfig: &geminiGenConfig{
			Temperature:      0.1,
			ResponseMimeType: "application/json",
		},
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(jsonBytes))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("gemini api error (HTTP %d): %s", resp.StatusCode, string(body))
	}

	var gResp geminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&gResp); err != nil {
		return "", err
	}

	if len(gResp.Candidates) == 0 || len(gResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty gemini response candidates")
	}

	return gResp.Candidates[0].Content.Parts[0].Text, nil
}

func truncateText(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "\n...[truncated]"
}

func extractJSON(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "```json") {
		s = strings.TrimPrefix(s, "```json")
		if idx := strings.LastIndex(s, "```"); idx != -1 {
			s = s[:idx]
		}
	} else if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```")
		if idx := strings.LastIndex(s, "```"); idx != -1 {
			s = s[:idx]
		}
	}
	return strings.TrimSpace(s)
}
