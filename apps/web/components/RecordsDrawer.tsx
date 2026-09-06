'use client';

import React from 'react';
import { X, CheckCircle2, AlertCircle, FileText, Calendar, DollarSign, Tag } from 'lucide-react';
import { CanonicalEvidence } from '../lib/types';
import { formatCurrency } from '../lib/utils';

interface RecordsDrawerProps {
  evidence: CanonicalEvidence | null;
  onClose: () => void;
}

export const RecordsDrawer: React.FC<RecordsDrawerProps> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl border border-[#DDE3E0] overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#DDE3E0] bg-[#F7F9F8] px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#1F4E8C]" />
              <h3 className="text-lg font-bold text-[#1F4E8C]">
                {evidence.provenance.document_name}
              </h3>
              <span className="rounded-full bg-[#EBF2FC] px-2.5 py-0.5 text-xs font-semibold text-[#1F4E8C] uppercase">
                {evidence.source_type}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#5F6368]">
              {evidence.provenance.record_count} extracted canonical records • {evidence.period_start} to {evidence.period_end} • Confidence: {Math.round(evidence.extraction_confidence * 100)}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#858585] hover:bg-[#DDE3E0]/50 hover:text-[#222222] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Records Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* UPI Transactions Table */}
          {evidence.upi_transactions && evidence.upi_transactions.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[#DDE3E0]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F4F3] text-[#5F6368] font-semibold border-b border-[#DDE3E0]">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Txn ID</th>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                    <th className="px-3 py-2.5">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3E0]">
                  {evidence.upi_transactions.map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-[#F7F9F8]">
                      <td className="px-3 py-2 text-[#5F6368] whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-[#222222]">{tx.id}</td>
                      <td className="px-3 py-2 font-medium text-[#222222] max-w-[200px] truncate">{tx.description || tx.counterparty}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          tx.type === 'credit' ? 'bg-[#E8F6EE] text-[#0B9348]' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-[#222222]">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-3 py-2 text-[#858585] text-[11px]">{tx.category || 'general'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Utility Payments */}
          {evidence.utility_payments && evidence.utility_payments.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[#DDE3E0]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F4F3] text-[#5F6368] font-semibold border-b border-[#DDE3E0]">
                  <tr>
                    <th className="px-3 py-2.5">Bill Period</th>
                    <th className="px-3 py-2.5">Provider</th>
                    <th className="px-3 py-2.5">Due Date</th>
                    <th className="px-3 py-2.5">Payment Date</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3E0]">
                  {evidence.utility_payments.map((bill, idx) => (
                    <tr key={bill.id || idx} className="hover:bg-[#F7F9F8]">
                      <td className="px-3 py-2 font-medium text-[#222222]">{bill.bill_period}</td>
                      <td className="px-3 py-2 text-[#5F6368]">{bill.provider_name}</td>
                      <td className="px-3 py-2 text-[#5F6368]">
                        {new Date(bill.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 text-[#5F6368]">
                        {bill.payment_date ? new Date(bill.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-[#222222]">
                        {formatCurrency(bill.bill_amount)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          bill.status === 'PAID_ON_TIME' ? 'bg-[#E8F6EE] text-[#0B9348]' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {bill.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Gig Payouts */}
          {evidence.gig_payouts && evidence.gig_payouts.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[#DDE3E0]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F4F3] text-[#5F6368] font-semibold border-b border-[#DDE3E0]">
                  <tr>
                    <th className="px-3 py-2.5">Period</th>
                    <th className="px-3 py-2.5">Platform</th>
                    <th className="px-3 py-2.5 text-center">Active Days</th>
                    <th className="px-3 py-2.5 text-center">Trips / Jobs</th>
                    <th className="px-3 py-2.5 text-right">Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DDE3E0]">
                  {evidence.gig_payouts.map((gig, idx) => (
                    <tr key={gig.id || idx} className="hover:bg-[#F7F9F8]">
                      <td className="px-3 py-2 font-medium text-[#222222]">
                        {new Date(gig.period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 text-[#5F6368]">{gig.platform}</td>
                      <td className="px-3 py-2 text-center font-semibold text-[#1F4E8C]">{gig.active_days} days</td>
                      <td className="px-3 py-2 text-center text-[#5F6368]">{gig.trips_or_jobs} orders</td>
                      <td className="px-3 py-2 text-right font-bold text-[#0B9348]">
                        {formatCurrency(gig.net_payout)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Provenance and Validation Notes */}
          {evidence.provenance.validation_notes && evidence.provenance.validation_notes.length > 0 && (
            <div className="rounded-xl bg-[#F7F9F8] p-4 border border-[#DDE3E0] text-xs">
              <h4 className="font-semibold text-[#222222] mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#0B9348]" />
                Validation Integrity Summary
              </h4>
              <ul className="list-disc list-inside space-y-1 text-[#5F6368]">
                {evidence.provenance.validation_notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-[#DDE3E0] bg-[#F7F9F8] px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#1F4E8C] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173D70] transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
