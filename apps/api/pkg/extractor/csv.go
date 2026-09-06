package extractor

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/paanipoorie/alternative-credit-engine/apps/api/pkg/domain"
)

// ParseUPICSV parses a standard or synthetic UPI CSV document
func ParseUPICSV(data []byte) ([]domain.UPITransaction, error) {
	reader := csv.NewReader(bytes.NewReader(data))
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("invalid csv format: %w", err)
	}

	if len(records) < 2 {
		return nil, fmt.Errorf("csv contains no data rows")
	}

	header := records[0]
	colMap := make(map[string]int)
	for i, col := range header {
		clean := strings.ToLower(strings.TrimSpace(col))
		clean = strings.ReplaceAll(clean, " ", "_")
		colMap[clean] = i
	}

	var txns []domain.UPITransaction
	for rowIdx, row := range records[1:] {
		if len(row) == 0 {
			continue
		}

		id := getCol(row, colMap, "txn_id", "id", "transaction_id", "ref_no")
		if id == "" {
			id = fmt.Sprintf("TXN-%d", rowIdx+1)
		}

		dateStr := getCol(row, colMap, "date", "txn_date", "timestamp", "datetime")
		parsedDate := parseFlexibleDate(dateStr)

		amtStr := getCol(row, colMap, "amount", "amt", "transaction_amount", "inr")
		amtStr = cleanAmount(amtStr)
		amt, _ := strconv.ParseFloat(amtStr, 64)

		txnType := strings.ToLower(getCol(row, colMap, "type", "direction", "dr_cr", "cr_dr"))
		if strings.HasPrefix(txnType, "cr") || txnType == "inflow" || txnType == "deposit" {
			txnType = "credit"
		} else if strings.HasPrefix(txnType, "dr") || txnType == "outflow" || txnType == "withdrawal" {
			txnType = "debit"
		} else if txnType == "" {
			txnType = "credit"
		}

		counterparty := getCol(row, colMap, "counterparty", "payee", "payer", "beneficiary", "merchant")
		description := getCol(row, colMap, "description", "narration", "remarks", "note")
		status := strings.ToUpper(getCol(row, colMap, "status", "txn_status", "result"))
		if status == "" {
			status = "SUCCESS"
		}

		category := getCol(row, colMap, "category", "txn_category", "type_tag")

		txns = append(txns, domain.UPITransaction{
			ID:           id,
			Date:         parsedDate,
			Amount:       amt,
			Type:         txnType,
			Counterparty: counterparty,
			Description:  description,
			Status:       status,
			Category:     category,
		})
	}

	if len(txns) == 0 {
		return nil, fmt.Errorf("no valid UPI transactions parsed from CSV")
	}

	return txns, nil
}

func getCol(row []string, colMap map[string]int, keys ...string) string {
	for _, k := range keys {
		if idx, ok := colMap[k]; ok && idx < len(row) {
			return strings.TrimSpace(row[idx])
		}
	}
	return ""
}

func cleanAmount(s string) string {
	s = strings.ReplaceAll(s, "INR", "")
	s = strings.ReplaceAll(s, "Rs.", "")
	s = strings.ReplaceAll(s, "₹", "")
	s = strings.ReplaceAll(s, ",", "")
	return strings.TrimSpace(s)
}

func parseFlexibleDate(s string) time.Time {
	formats := []string{
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05Z",
		"2006-01-02",
		"02/01/2006 15:04:05",
		"02/01/2006",
		"02-01-2006",
		"02-Jan-2006 15:04:05",
		"02-Jan-2006 03:04 PM",
		"02-Jan-2006 15:04",
		"02-Jan-2006",
		"Jan 2006",
		"January 2006",
	}

	s = strings.TrimSpace(s)
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return t
		}
	}
	return time.Now()
}
