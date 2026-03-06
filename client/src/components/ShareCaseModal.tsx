import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import type { FavoriteCase } from '@/hooks/useFavorites';
import { createSharePayload, generateShareSummary, encodePayloadForQR, copyToClipboard } from '@/lib/shareCase';

interface ShareCaseModalProps {
  caseData: FavoriteCase;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareCaseModal({ caseData, isOpen, onClose }: ShareCaseModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const payload = createSharePayload(caseData);
  const summary = generateShareSummary(caseData);
  const qrValue = encodePayloadForQR(payload);

  const handleCopy = async () => {
    const success = await copyToClipboard(summary);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full p-6 border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Share Diagnostic Case</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Case Info */}
        <div className="bg-slate-700 rounded p-4 mb-6">
          <p className="text-white font-semibold mb-2">
            {caseData.vehicleMake} {caseData.vehicleModel}
          </p>
          <p className="text-slate-300 text-sm">
            Error: {caseData.errorCode} • Status: {caseData.status || 'Pending'}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6 bg-white p-4 rounded">
          <QRCode
            value={qrValue}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-medium transition-colors mb-4 ${
            copied
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Summary
            </>
          )}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors"
        >
          Close
        </button>

        {/* Info */}
        <p className="text-xs text-slate-400 mt-4 text-center">
          Share this QR code or summary with colleagues
        </p>
      </div>
    </div>
  );
}
