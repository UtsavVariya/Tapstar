'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, ExternalLink, QrCode as QrIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QRModalProps {
  cardCode: string;
  fullUrl: string;
  onClose: () => void;
}

export default function QRModal({ cardCode, fullUrl, onClose }: QRModalProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const qrImageUrl = `/api/cards/${encodeURIComponent(cardCode)}/qr`;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Card URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(qrImageUrl);
      if (!res.ok) throw new Error('Failed to fetch QR image');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${cardCode}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`QR code for ${cardCode} downloaded`);
    } catch {
      toast.error('Failed to download QR code image');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <QrIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 id="qr-modal-title" className="text-lg font-bold text-slate-900">
                Card QR Code
              </h2>
              <p className="text-xs font-mono font-medium text-slate-500">
                {cardCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="relative flex h-64 w-64 items-center justify-center rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-4 shadow-inner">
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                <span className="text-xs font-medium">Generating QR...</span>
              </div>
            )}
            {imageError ? (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                <div className="rounded-full bg-red-50 p-3 text-red-500">
                  <X className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-red-600">Unable to load QR image</span>
                <button
                  onClick={() => {
                    setImageError(false);
                    setImageLoaded(false);
                  }}
                  className="mt-2 text-xs font-semibold text-brand-600 hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrImageUrl}
                alt={`QR code for ${cardCode}`}
                className={`h-full w-full object-contain transition-opacity duration-200 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}
          </div>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 font-mono text-xs font-semibold text-brand-700">
            {cardCode}
          </span>
        </div>

        {/* URL Box */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Card Destination URL
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-mono text-xs text-slate-700 select-all" title={fullUrl}>
              {fullUrl}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                title="Copy URL"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                title="Open in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || imageError}
            className="btn-primary flex-1 justify-center py-2.5 text-sm"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download QR (PNG)</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary justify-center py-2.5 text-sm sm:w-28"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
