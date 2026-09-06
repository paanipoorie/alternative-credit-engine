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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-[#171A1D] shadow-2xl border border-[#2B3035] overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#2B3035] bg-[#1D2125] px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#3D78C2]" />
              <h3 className="text-lg font-bold text-[#F3F5F4]">
                {evidence.provenance.document_name}
              </h3>
              <span className="rounded-full bg-[#1E2C3D] px-2.5 py-0.5 text-xs font-semibold text-[#7AB3EF] border border-[#3D78C2]/30 uppercase">
                {evidence.source_type}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#A7AFB5]">
              {evidence.provenance.record_count} extracted canonical records • {evidence.period_start} to {evidence.period_end} • Confidence: {Math.round(evidence.extraction_confidence * 100)}%
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#737C83] hover:bg-[#24292E] hover:text-[#F3F5F4] transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Records Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* UPI Transactions Table */}
          {evidence.upi_transactions && evidence.upi_transactions.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[#2B3035]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1D2125] text-[#A7AFB5] font-semibold border-b border-[#2B3035]">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Txn ID</th>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5">Type</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                    <th className="px-3 py-2.5">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3035]">
                  {evidence.upi_transactions.map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-[#1D2125]/70 transition">
                      <td className="px-3 py-2 text-[#A7AFB5] whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-[#F3F5F4]">{tx.id}</td>
                      <td className="px-3 py-2 font-medium text-[#F3F5F4] max-w-[200px] truncate">{tx.description || tx.counterparty}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          tx.type === 'credit' ? 'bg-[#132E20] text-[#4ADE80] border border-[#16A05A]/30' : 'bg-[#381818] text-[#F87171] border border-rose-800/40'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-[#F3F5F4]">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-3 py-2 text-[#737C83] text-[11px]">{tx.category || 'general'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Utility Payments */}
          {evidence.utility_payments && evidence.utility_payments.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-[#2B3035]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1D2125] text-[#A7AFB5] font-semibold border-b border-[#2B3035]">
                  <tr>
                    <th className="px-3 py-2.5">Bill Period</th>
                    <th className="px-3 py-2.5">Provider</th>
                    <th className="px-3 py-2.5">Due Date</th>
                    <th className="px-3 py-2.5">Payment Date</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3035]">
                  {evidence.utility_payments.map((bill, idx) => (
                    <tr key={bill.id || idx} className="hover:bg-[#1D2125]/70 transition">
                      <td className="px-3 py-2 font-medium text-[#F3F5F4]">{bill.bill_period}</td>
                      <td className="px-3 py-2 text-[#A7AFB5]">{bill.provider_name}</td>
                      <td className="px-3 py-2 text-[#A7AFB5]">
                        {new Date(bill.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 text-[#A7AFB5]">
                        {bill.payment_date ? new Date(bill.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-[#F3F5F4]">
                        {formatCurrency(bill.bill_amount)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          bill.status === 'PAID_ON_TIME' ? 'bg-[#132E20] text-[#4ADE80] border border-[#16A05A]/30' : 'bg-[#332511] text-[#FBBF24] border border-[#D89A24]/40'
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
            <div className="overflow-x-auto rounded-xl border border-[#2B3035]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1D2125] text-[#A7AFB5] font-semibold border-b border-[#2B3035]">
                  <tr>
                    <th className="px-3 py-2.5">Period</th>
                    <th className="px-3 py-2.5">Platform</th>
                    <th className="px-3 py-2.5 text-center">Active Days</th>
                    <th className="px-3 py-2.5 text-center">Trips / Jobs</th>
                    <th className="px-3 py-2.5 text-right">Net Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3035]">
                  {evidence.gig_payouts.map((gig, idx) => (
                    <tr key={gig.id || idx} className="hover:bg-[#1D2125]/70 transition">
                      <td className="px-3 py-2 font-medium text-[#F3F5F4]">
                        {new Date(gig.period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2 text-[#A7AFB5]">{gig.platform}</td>
                      <td className="px-3 py-2 text-center font-semibold text-[#7AB3EF]">{gig.active_days} days</td>
                      <td className="px-3 py-2 text-center text-[#A7AFB5]">{gig.trips_or_jobs} orders</td>
                      <td className="px-3 py-2 text-right font-bold text-[#4ADE80]">
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
            <div className="rounded-xl bg-[#1D2125] p-4 border border-[#2B3035] text-xs">
              <h4 className="font-semibold text-[#F3F5F4] mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#4ADE80]" />
                Validation Integrity Summary
              </h4>
              <ul className="list-disc list-inside space-y-1 text-[#A7AFB5]">
                {evidence.provenance.validation_notes.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-[#2B3035] bg-[#1D2125] px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#3D78C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2A5A96] transition shadow-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
