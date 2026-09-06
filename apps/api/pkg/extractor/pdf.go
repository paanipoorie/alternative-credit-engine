package extractor

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"

	"github.com/ledongthuc/pdf"
)

// ExtractTextFromPDF extracts all plain text from PDF bytes
func ExtractTextFromPDF(data []byte) (string, error) {
	if len(data) == 0 {
		return "", fmt.Errorf("empty pdf data")
	}

	reader, err := pdf.NewReader(bytes.NewReader(data), int64(len(data)))
	if err == nil {
		numPages := reader.NumPage()
		var fullText strings.Builder
		for i := 1; i <= numPages; i++ {
			page := reader.Page(i)
			if page.V.IsNull() {
				continue
			}
			text, err := page.GetPlainText(nil)
			if err == nil && strings.TrimSpace(text) != "" {
				fullText.WriteString(text)
				fullText.WriteString("\n")
			}
		}

		res := strings.TrimSpace(fullText.String())
		if len(res) > 20 {
			return res, nil
		}
	}

	// Fallback to stream / text-chunk parser
	fallbackText := extractRawStringsFromPDF(data)
	if len(fallbackText) > 0 {
		return fallbackText, nil
	}

	if err != nil {
		return "", fmt.Errorf("unable to read pdf: %w", err)
	}
	return "", fmt.Errorf("no extractable text in pdf")
}

// extractRawStringsFromPDF extracts ASCII / printable text chunks from PDF streams
func extractRawStringsFromPDF(data []byte) string {
	var builder strings.Builder
	// Match text inside standard PDF parentheses (text) or BT ... ET blocks
	reText := regexp.MustCompile(`\(([^\)]+)\)`)
	matches := reText.FindAllSubmatch(data, -1)
	for _, m := range matches {
		if len(m) > 1 {
			clean := strings.TrimSpace(string(m[1]))
			if len(clean) > 0 {
				builder.WriteString(clean)
				builder.WriteString("\n")
			}
		}
	}
	return strings.TrimSpace(builder.String())
}
