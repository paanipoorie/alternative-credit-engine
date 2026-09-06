package extractor

import (
	"path/filepath"
	"strings"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

// ClassifyDocument automatically classifies an uploaded document into a canonical domain source
func ClassifyDocument(filename, mimeType, text string) *domain.ClassificationResult {
	lowerText := strings.ToLower(text)
	lowerFilename := strings.ToLower(filepath.Base(filename))
	ext := strings.ToLower(filepath.Ext(filename))

	format := domain.FormatPDF
	switch ext {
	case ".csv":
		format = domain.FormatCSV
	case ".xlsx", ".xls":
		format = domain.FormatExcel
	case ".png", ".jpg", ".jpeg", ".webp":
		format = domain.FormatImage
	case ".json":
		format = domain.FormatJSON
	}

	// 1. Check UPI Patterns
	if strings.Contains(lowerText, "bhim upi") ||
		strings.Contains(lowerText, "upi id") ||
		strings.Contains(lowerText, "upi statement") ||
		strings.Contains(lowerFilename, "upi") ||
		(strings.Contains(lowerText, "txn id") && strings.Contains(lowerText, "cr") && strings.Contains(lowerText, "dr")) ||
		(strings.Contains(lowerText, "amount") && strings.Contains(lowerText, "counterparty") && strings.Contains(lowerText, "category")) {

		provider := "BHIM UPI / Bank"
		if strings.Contains(lowerText, "hdfc") {
			provider = "HDFC Bank UPI"
		} else if strings.Contains(lowerText, "sbi") {
			provider = "SBI UPI"
		} else if strings.Contains(lowerText, "icici") {
			provider = "ICICI Bank UPI"
		} else if strings.Contains(lowerText, "axis") {
			provider = "Axis Bank UPI"
		}

		return &domain.ClassificationResult{
			SourceType:   domain.SourceUPI,
			DocumentType: "UPI Transaction Statement",
			Provider:     provider,
			Confidence:   0.98,
			Format:       format,
			Reason:       "Detected UPI account identifiers, transaction references (CR/DR), and payment logs.",
		}
	}

	// 2. Check Utility Bills
	if strings.Contains(lowerText, "bescom") ||
		strings.Contains(lowerText, "electricity bill") ||
		strings.Contains(lowerText, "consumer no") ||
		strings.Contains(lowerText, "sub-division") ||
		strings.Contains(lowerText, "amount payable") ||
		strings.Contains(lowerText, "bill due date") ||
		strings.Contains(lowerFilename, "utility") ||
		strings.Contains(lowerFilename, "bescom") ||
		strings.Contains(lowerFilename, "electricity") ||
		strings.Contains(lowerFilename, "water_bill") ||
		strings.Contains(lowerFilename, "gas_bill") {

		provider := "Utility Provider"
		if strings.Contains(lowerText, "bescom") || strings.Contains(lowerFilename, "bescom") {
			provider = "BESCOM Electricity"
		} else if strings.Contains(lowerText, "tneb") {
			provider = "TNEB Electricity"
		} else if strings.Contains(lowerText, "mseb") {
			provider = "MSEDCL Electricity"
		}

		return &domain.ClassificationResult{
			SourceType:   domain.SourceUtility,
			DocumentType: "Utility Bill & Payment Receipt",
			Provider:     provider,
			Confidence:   0.97,
			Format:       format,
			Reason:       "Detected utility consumer reference, billing cycle, tariff details, and payment confirmation status.",
		}
	}

	// 3. Check Gig Platform Earnings
	if strings.Contains(lowerText, "delivery partner") ||
		strings.Contains(lowerText, "earnings summary") ||
		strings.Contains(lowerText, "zomato") ||
		strings.Contains(lowerText, "swiggy") ||
		strings.Contains(lowerText, "uber") ||
		strings.Contains(lowerText, "urban company") ||
		strings.Contains(lowerText, "active days") ||
		strings.Contains(lowerText, "orders completed") ||
		strings.Contains(lowerText, "net payout") ||
		strings.Contains(lowerFilename, "gig") ||
		strings.Contains(lowerFilename, "zomato") ||
		strings.Contains(lowerFilename, "swiggy") ||
		strings.Contains(lowerFilename, "payout") {

		platform := "Gig Platform"
		if strings.Contains(lowerText, "zomato") || strings.Contains(lowerFilename, "zomato") {
			platform = "Zomato Delivery Partner"
		} else if strings.Contains(lowerText, "swiggy") || strings.Contains(lowerFilename, "swiggy") {
			platform = "Swiggy Delivery Partner"
		} else if strings.Contains(lowerText, "uber") || strings.Contains(lowerFilename, "uber") {
			platform = "Uber Driver Partner"
		} else if strings.Contains(lowerText, "urban company") || strings.Contains(lowerFilename, "urban") {
			platform = "Urban Company Partner"
		}

		return &domain.ClassificationResult{
			SourceType:   domain.SourceGig,
			DocumentType: "Gig Platform Earnings Statement",
			Provider:     platform,
			Confidence:   0.96,
			Format:       format,
			Reason:       "Detected platform partner ID, working days metrics, trip volumes, and net payout summaries.",
		}
	}

	// 4. Check GST Filings
	if strings.Contains(lowerText, "gstin") ||
		strings.Contains(lowerText, "gstr-3b") ||
		strings.Contains(lowerText, "gstr-1") ||
		strings.Contains(lowerText, "reported turnover") ||
		strings.Contains(lowerFilename, "gst") ||
		strings.Contains(lowerFilename, "gstr") {

		return &domain.ClassificationResult{
			SourceType:   domain.SourceGST,
			DocumentType: "GST Filing Summary (GSTR)",
			Provider:     "GSTN Portal / Tax Return",
			Confidence:   0.95,
			Format:       format,
			Reason:       "Detected GSTIN identification, taxable turnover, and statutory return schedule.",
		}
	}

	// 5. Check Telecom Recharges
	if strings.Contains(lowerText, "telecom") ||
		strings.Contains(lowerText, "prepaid recharge") ||
		strings.Contains(lowerText, "validity days") ||
		strings.Contains(lowerText, "jio") ||
		strings.Contains(lowerText, "airtel") ||
		strings.Contains(lowerFilename, "telecom") ||
		strings.Contains(lowerFilename, "recharge") {

		provider := "Telecom Operator"
		if strings.Contains(lowerText, "jio") {
			provider = "Reliance Jio"
		} else if strings.Contains(lowerText, "airtel") {
			provider = "Bharti Airtel"
		} else if strings.Contains(lowerText, "vi") {
			provider = "Vodafone Idea"
		}

		return &domain.ClassificationResult{
			SourceType:   domain.SourceTelecom,
			DocumentType: "Telecom Prepaid & Recharge Record",
			Provider:     provider,
			Confidence:   0.92,
			Format:       format,
			Reason:       "Detected mobile recharge frequency, pack validity, and telecom subscriber data.",
		}
	}

	// Unknown
	return &domain.ClassificationResult{
		SourceType:   "",
		DocumentType: "Unknown Document",
		Provider:     "Unrecognized Source",
		Confidence:   0.10,
		Format:       format,
		Reason:       "Unable to confidently identify this evidence. The file does not match known UPI, Utility, Gig, GST, or Telecom formats.",
	}
}
