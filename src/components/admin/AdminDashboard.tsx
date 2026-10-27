'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle,
  Clock,
  BarChart3,
  Search,
  RefreshCw,
  PlusCircle,
  Download,
  QrCode as QrIcon,
  Edit2,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
  FileText,
} from 'lucide-react';
import { CardData, BulkGenerateResult } from '@/types';
import { toast } from 'sonner';
import QRModal from './QRModal';
import EditCardModal from './EditCardModal';

export default function AdminDashboard() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'cards' | 'bulk' | 'export'>('cards');

  // Cards State
  const [cards, setCards] = useState<CardData[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unclaimed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'scans' | 'code' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Password visibility map (card id -> boolean)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modals
  const [qrModalData, setQrModalData] = useState<{ cardCode: string; fullUrl: string } | null>(null);
  const [editModalCard, setEditModalCard] = useState<CardData | null>(null);

  // Confirm Action Modal (for Reset or Delete)
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'reset' | 'delete';
    card: CardData;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Bulk Generator State
  const [bulkCount, setBulkCount] = useState<number>(10);
  const [bulkPrefix, setBulkPrefix] = useState<string>('CARD');
  const [generatingBulk, setGeneratingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkGenerateResult['cards'] | null>(null);

  // Batch QR Download State
  const [isDownloadingAllQRs, setIsDownloadingAllQRs] = useState(false);
  const [qrDownloadProgress, setQrDownloadProgress] = useState<{ current: number; total: number } | null>(null);

  // Base URL for links
  const [origin, setOrigin] = useState<string>('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const getFullUrl = useCallback((cardCode: string) => {
    const base = origin || 'http://localhost:3000';
    return `${base}/c/${cardCode}`;
  }, [origin]);

  // Fetch Cards
  const fetchCards = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoadingCards(true);

    try {
      const res = await fetch('/api/cards', {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch cards (${res.status})`);
      }

      const json = await res.json();
      const loadedCards: CardData[] = Array.isArray(json)
        ? json
        : json.data?.cards || json.data || json.cards || [];

      setCards(loadedCards);
      if (isRefresh) toast.success('Cards updated');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load cards';
      console.error('Fetch cards error:', err);
      toast.error(msg);
    } finally {
      setLoadingCards(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin', {
        method: 'DELETE',
        credentials: 'include',
      });
      toast.success('Logged out successfully');
      window.location.reload();
    } catch {
      toast.error('Logout failed');
    }
  };

  // Stats Calculations
  const stats = useMemo(() => {
    const totalCards = cards.length;
    const activeCards = cards.filter((c) => c.is_configured).length;
    const unclaimedCards = cards.filter((c) => !c.is_configured).length;
    const totalScans = cards.reduce((acc, c) => acc + (c.scan_count || 0), 0);
    const totalReviews = cards.reduce((acc, c) => acc + (c.review_clicks || 0), 0);
    const totalWhatsApp = cards.reduce((acc, c) => acc + (c.whatsapp_clicks || 0), 0);
    const totalInstagram = cards.reduce((acc, c) => acc + (c.instagram_clicks || 0), 0);

    return {
      totalCards,
      activeCards,
      unclaimedCards,
      totalScans,
      totalReviews,
      totalWhatsApp,
      totalInstagram,
    };
  }, [cards]);

  // Filter & Sort Cards
  const filteredCards = useMemo(() => {
    return cards
      .filter((card) => {
        // Status filter
        if (statusFilter === 'active' && !card.is_configured) return false;
        if (statusFilter === 'unclaimed' && card.is_configured) return false;

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = card.card_code?.toLowerCase().includes(q);
        const shopMatch = card.shop_name?.toLowerCase().includes(q);
        const userMatch = card.username?.toLowerCase().includes(q);
        const categoryMatch = card.business_category?.toLowerCase().includes(q);

        return codeMatch || shopMatch || userMatch || categoryMatch;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'scans') {
          comp = (a.scan_count || 0) - (b.scan_count || 0);
        } else if (sortBy === 'code') {
          comp = a.card_code.localeCompare(b.card_code);
        } else if (sortBy === 'name') {
          comp = (a.shop_name || '').localeCompare(b.shop_name || '');
        } else {
          // date
          const dateA = new Date(a.created_at).getTime() || 0;
          const dateB = new Date(b.created_at).getTime() || 0;
          comp = dateA - dateB;
        }
        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [cards, searchQuery, statusFilter, sortBy, sortOrder]);

  // Copy URL to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Toggle Password Reveal
  const togglePasswordReveal = (cardId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  // Handle Card Reset
  const handleResetConfirm = async () => {
    if (!confirmDialog) return;
    const { card } = confirmDialog;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(card.card_code)}/reset`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Reset failed with status ${res.status}`);
      }

      toast.success(`Card ${card.card_code} has been reset`);
      setConfirmDialog(null);
      fetchCards(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset card';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Card Delete
  const handleDeleteConfirm = async () => {
    if (!confirmDialog) return;
    const { card } = confirmDialog;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(card.card_code)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Delete failed with status ${res.status}`);
      }

      toast.success(`Card ${card.card_code} deleted successfully`);
      setConfirmDialog(null);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete card';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Bulk Generate
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkCount < 1 || bulkCount > 500) {
      toast.error('Count must be between 1 and 500');
      return;
    }

    setGeneratingBulk(true);
    try {
      const res = await fetch('/api/cards/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          count: bulkCount,
          prefix: bulkPrefix.trim().toUpperCase() || 'CARD',
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.error || `Bulk generation failed (${res.status})`);
      }

      const generated: BulkGenerateResult['cards'] =
        json.data?.cards || json.cards || (Array.isArray(json) ? json : []);

      if (generated && generated.length > 0) {
        setBulkResult(generated);
        toast.success(`Successfully generated ${generated.length} new cards!`);
        // Refresh cards list in background
        fetchCards();
      } else {
        toast.error('No cards returned by generator');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk generation error';
      toast.error(msg);
    } finally {
      setGeneratingBulk(false);
    }
  };

  // Download Bulk Result as CSV (client-side)
  const downloadBulkCsv = () => {
    if (!bulkResult || bulkResult.length === 0) return;

    const headers = ['Card Code', 'URL', 'Username', 'Password'];
    const rows = bulkResult.map((c) => [
      `"${c.card_code}"`,
      `"${c.full_url || getFullUrl(c.card_code)}"`,
      `"${c.username}"`,
      `"${c.password}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smartcard_bulk_${bulkPrefix}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Generated cards CSV downloaded');
  };

  // Export All Cards CSV (Try API first, fallback to client-side)
  const handleExportAllCards = async () => {
    try {
      toast.info('Preparing CSV export...');
      const res = await fetch('/api/cards/export', { credentials: 'include' });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `smartcards_all_${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('All cards exported successfully');
        return;
      }

      // Fallback: Generate directly from loaded cards
      if (cards.length === 0) {
        toast.error('No cards to export');
        return;
      }

      const headers = [
        'Card Code',
        'Shop Name',
        'Category',
        'Status',
        'Username',
        'Full URL',
        'Scans',
        'Review Clicks',
        'WhatsApp Clicks',
        'Instagram Clicks',
        'Google Review URL',
        'WhatsApp URL',
        'Instagram URL',
        'Created At',
      ];

      const rows = cards.map((c) => [
        `"${c.card_code || ''}"`,
        `"${(c.shop_name || '').replace(/"/g, '""')}"`,
        `"${(c.business_category || '').replace(/"/g, '""')}"`,
        `"${c.is_configured ? 'Active' : 'Unclaimed'}"`,
        `"${c.username || ''}"`,
        `"${getFullUrl(c.card_code)}"`,
        c.scan_count || 0,
        c.review_clicks || 0,
        c.whatsapp_clicks || 0,
        c.instagram_clicks || 0,
        `"${(c.google_review_url || '').replace(/"/g, '""')}"`,
        `"${(c.whatsapp_url || '').replace(/"/g, '""')}"`,
        `"${(c.instagram_url || '').replace(/"/g, '""')}"`,
        `"${new Date(c.created_at).toISOString()}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartcards_all_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('All cards exported as CSV');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      toast.error(msg);
    }
  };

  // Download all QR codes using a loop
  const handleDownloadAllQRs = async () => {
    if (cards.length === 0) {
      toast.error('No cards available to download QR codes');
      return;
    }

    setIsDownloadingAllQRs(true);
    setQrDownloadProgress({ current: 0, total: cards.length });
    toast.info(`Starting download of ${cards.length} QR code images...`);

    let successCount = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      setQrDownloadProgress({ current: i + 1, total: cards.length });

      try {
        const res = await fetch(`/api/cards/${encodeURIComponent(card.card_code)}/qr`);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${card.card_code}-qr.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          successCount++;
        }
      } catch (e) {
        console.error(`Failed to download QR for ${card.card_code}`, e);
      }

      // Small delay between downloads so the browser doesn't throttle downloads
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsDownloadingAllQRs(false);
    setQrDownloadProgress(null);
    toast.success(`Completed! Downloaded ${successCount} QR codes.`);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  SmartCard Admin
                </span>
                <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500">
                NFC & QR Card Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchCards(true)}
              disabled={refreshing || loadingCards}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
              title="Refresh card data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50/50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100/70"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Stat 1: Total Cards */}
          <div className="card flex items-center justify-between border-slate-200/80 p-5 transition-shadow hover:shadow-md">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Cards
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
                {loadingCards ? '—' : stats.totalCards}
              </h3>
              <p className="mt-1 text-xs text-slate-500">Provisioned in database</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>

          {/* Stat 2: Active Cards */}
          <div className="card flex items-center justify-between border-slate-200/80 p-5 transition-shadow hover:shadow-md">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Active Cards
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-emerald-600">
                {loadingCards ? '—' : stats.activeCards}
              </h3>
              <p className="mt-1 text-xs text-slate-500">Configured by shopkeepers</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>

          {/* Stat 3: Unclaimed Cards */}
          <div className="card flex items-center justify-between border-slate-200/80 p-5 transition-shadow hover:shadow-md">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Unclaimed Cards
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-amber-600">
                {loadingCards ? '—' : stats.unclaimedCards}
              </h3>
              <p className="mt-1 text-xs text-slate-500">Ready for distribution</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          {/* Stat 4: Total Scans */}
          <div className="card flex items-center justify-between border-slate-200/80 p-5 transition-shadow hover:shadow-md">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Scans
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-indigo-600">
                {loadingCards ? '—' : stats.totalScans}
              </h3>
              <p className="mt-1 text-xs text-slate-500">All customer interactions</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-slate-200">
          <nav className="flex space-x-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('cards')}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'cards'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>All Cards</span>
              <span
                className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  activeTab === 'cards' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {cards.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('bulk')}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'bulk'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Bulk Generator</span>
            </button>

            <button
              onClick={() => setActiveTab('export')}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'export'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export</span>
            </button>
          </nav>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: ALL CARDS                                         */}
        {/* ======================================================== */}
        {activeTab === 'cards' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by card code, shop name, username, or category..."
                  className="input-field pl-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({cards.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === 'active'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Active ({stats.activeCards})
                  </button>
                  <button
                    onClick={() => setStatusFilter('unclaimed')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === 'unclaimed'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Unclaimed ({stats.unclaimedCards})
                  </button>
                </div>

                {/* Sort Option */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="date">Sort: Date Created</option>
                  <option value="scans">Sort: Total Scans</option>
                  <option value="code">Sort: Card Code</option>
                  <option value="name">Sort: Shop Name</option>
                </select>

                <button
                  onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
                  title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Loading State */}
            {loadingCards && (
              <div className="card flex flex-col items-center justify-center p-12 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
                <p className="mt-3 text-sm font-medium text-slate-600">Loading cards from database...</p>
              </div>
            )}

            {/* Empty State */}
            {!loadingCards && filteredCards.length === 0 && (
              <div className="card flex flex-col items-center justify-center p-12 text-center">
                <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                  <CreditCard className="h-10 w-10" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">No cards found</h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No cards match your filter criteria. Try adjusting your search query.'
                    : 'Get started by creating cards with the Bulk Generator.'}
                </p>
                {searchQuery || statusFilter !== 'all' ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="btn-secondary mt-4 text-xs"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('bulk')}
                    className="btn-primary mt-4 text-xs"
                  >
                    Generate Cards Now
                  </button>
                )}
              </div>
            )}

            {/* Desktop Table View */}
            {!loadingCards && filteredCards.length > 0 && (
              <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3.5">Card Code</th>
                        <th className="px-4 py-3.5">URL</th>
                        <th className="px-4 py-3.5">Username</th>
                        <th className="px-4 py-3.5">Password</th>
                        <th className="px-4 py-3.5">Shop Name</th>
                        <th className="px-4 py-3.5">Category</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-3 py-3.5 text-center" title="Total Scans">Scans</th>
                        <th className="px-3 py-3.5 text-center" title="Review Clicks">Reviews</th>
                        <th className="px-3 py-3.5 text-center" title="WhatsApp Clicks">WA</th>
                        <th className="px-3 py-3.5 text-center" title="Instagram Clicks">IG</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredCards.map((card) => {
                        const fullUrl = getFullUrl(card.card_code);
                        const isRevealed = revealedPasswords[card.id] || false;
                        const displayPass = (card as any).password_plain || (card as any).password || `${card.username}2024`;

                        return (
                          <tr key={card.id} className="transition-colors hover:bg-slate-50/80">
                            {/* Card Code */}
                            <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                              <span className="rounded-lg bg-slate-100 px-2 py-1">
                                {card.card_code}
                              </span>
                            </td>

                            {/* URL */}
                            <td className="px-4 py-3.5 max-w-[140px]">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-mono text-slate-500" title={fullUrl}>
                                  /c/{card.card_code}
                                </span>
                                <button
                                  onClick={() => handleCopy(fullUrl, `url-${card.id}`)}
                                  className="text-slate-400 hover:text-slate-700"
                                  title="Copy URL"
                                >
                                  {copiedCode === `url-${card.id}` ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* Username */}
                            <td className="px-4 py-3.5 font-mono font-medium text-slate-700 whitespace-nowrap">
                              {card.username}
                            </td>

                            {/* Password */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs">
                                  {isRevealed ? displayPass : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordReveal(card.id)}
                                  className="text-slate-400 hover:text-slate-600"
                                  title={isRevealed ? 'Hide Password' : 'Show Password'}
                                >
                                  {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </td>

                            {/* Shop Name */}
                            <td className="px-4 py-3.5 font-medium text-slate-900 max-w-[160px] truncate">
                              {card.shop_name ? (
                                <span title={card.shop_name}>{card.shop_name}</span>
                              ) : (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </td>

                            {/* Category */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {card.business_category ? (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                  {card.business_category}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {card.is_configured ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  Unclaimed
                                </span>
                              )}
                            </td>

                            {/* Scans */}
                            <td className="px-3 py-3.5 text-center font-semibold text-indigo-600">
                              {card.scan_count || 0}
                            </td>

                            {/* Reviews */}
                            <td className="px-3 py-3.5 text-center text-slate-700">
                              {card.review_clicks || 0}
                            </td>

                            {/* WA */}
                            <td className="px-3 py-3.5 text-center text-emerald-600 font-medium">
                              {card.whatsapp_clicks || 0}
                            </td>

                            {/* IG */}
                            <td className="px-3 py-3.5 text-center text-pink-600 font-medium">
                              {card.instagram_clicks || 0}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setQrModalData({ cardCode: card.card_code, fullUrl })}
                                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                                  title="View QR Code"
                                >
                                  <QrIcon className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditModalCard(card)}
                                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                                  title="Edit Card"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setConfirmDialog({ type: 'reset', card })}
                                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                                  title="Reset Card Configuration"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setConfirmDialog({ type: 'delete', card })}
                                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                                  title="Delete Card"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mobile / Tablet Cards View */}
            {!loadingCards && filteredCards.length > 0 && (
              <div className="grid grid-cols-1 gap-4 lg:hidden">
                {filteredCards.map((card) => {
                  const fullUrl = getFullUrl(card.card_code);
                  const isRevealed = revealedPasswords[card.id] || false;
                  const displayPass = (card as any).password_plain || (card as any).password || `${card.username}2024`;

                  return (
                    <div
                      key={card.id}
                      className="card border-slate-200 p-4 transition-all hover:border-slate-300 hover:shadow-md"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-sm font-bold text-slate-900">
                              {card.card_code}
                            </span>
                            {card.is_configured ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                Unclaimed
                              </span>
                            )}
                          </div>
                          <h4 className="mt-1 text-base font-bold text-slate-900">
                            {card.shop_name || <span className="text-slate-400 font-normal italic">Unconfigured Shop</span>}
                          </h4>
                          {card.business_category && (
                            <span className="inline-block mt-0.5 text-xs text-slate-500">
                              {card.business_category}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setQrModalData({ cardCode: card.card_code, fullUrl })}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
                            title="View QR"
                          >
                            <QrIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditModalCard(card)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm"
                            title="Edit Card"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Credentials & URL */}
                      <div className="my-3 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Username:</span>
                          <span className="font-mono font-medium text-slate-800">{card.username}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Password:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-800">
                              {isRevealed ? displayPass : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordReveal(card.id)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">URL:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-brand-600 truncate max-w-[150px]">{fullUrl}</span>
                            <button
                              onClick={() => handleCopy(fullUrl, `mob-${card.id}`)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedCode === `mob-${card.id}` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mini Stats Bar */}
                      <div className="grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400">Scans</div>
                          <div className="font-bold text-indigo-600">{card.scan_count || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Reviews</div>
                          <div className="font-bold text-yellow-600">{card.review_clicks || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">WhatsApp</div>
                          <div className="font-bold text-emerald-600">{card.whatsapp_clicks || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Instagram</div>
                          <div className="font-bold text-pink-600">{card.instagram_clicks || 0}</div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
                        <button
                          type="button"
                          onClick={() => setConfirmDialog({ type: 'reset', card })}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Reset</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDialog({ type: 'delete', card })}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: BULK GENERATOR                                    */}
        {/* ======================================================== */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            {/* Bulk Generator Card */}
            <div className="card border-slate-200/80 p-6 sm:p-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <PlusCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Bulk Card Generator
                    </h2>
                    <p className="text-sm text-slate-500">
                      Generate new batch of smart NFC/QR cards with unique credentials
                    </p>
                  </div>
                </div>

                <form onSubmit={handleBulkGenerate} className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="bulk-count" className="label">
                        Number of Cards (1 – 500)
                      </label>
                      <input
                        id="bulk-count"
                        type="number"
                        min={1}
                        max={500}
                        required
                        value={bulkCount}
                        onChange={(e) => setBulkCount(parseInt(e.target.value, 10) || 1)}
                        className="input-field"
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        Default recommendation: 10 to 50 cards per print batch.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="bulk-prefix" className="label">
                        Card Code Prefix
                      </label>
                      <input
                        id="bulk-prefix"
                        type="text"
                        maxLength={10}
                        required
                        value={bulkPrefix}
                        onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
                        placeholder="e.g. CARD, SHOP, VIP"
                        className="input-field font-mono uppercase"
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        Codes will be formatted as {bulkPrefix || 'CARD'}1001, {bulkPrefix || 'CARD'}1002, etc.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={generatingBulk}
                      className="btn-primary py-3 text-sm shadow-md"
                    >
                      {generatingBulk ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Generating {bulkCount} Cards...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4" />
                          <span>Generate {bulkCount} Cards</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Generated Results Section */}
            {bulkResult && bulkResult.length > 0 && (
              <div className="card border-slate-200/80 p-6 space-y-4 animate-fade-in">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Batch Created Successfully
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {bulkResult.length} Cards Generated
                    </h3>
                    <p className="text-xs text-slate-500">
                      Save these credentials now or export to CSV. Password hashes are stored securely.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={downloadBulkCsv}
                    className="btn-primary py-2.5 text-xs shadow-sm self-start sm:self-auto"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download as CSV</span>
                  </button>
                </div>

                {/* Table of Generated Batch */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Card Code</th>
                        <th className="px-4 py-3">URL</th>
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3">Password</th>
                        <th className="px-4 py-3 text-right">QR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bulkResult.map((c, idx) => {
                        const cardUrl = c.full_url || getFullUrl(c.card_code);
                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5 font-mono font-bold text-slate-900">
                              <span className="rounded bg-brand-50 px-2 py-0.5 text-brand-700">
                                {c.card_code}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 max-w-[200px]">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate font-mono text-slate-600">{cardUrl}</span>
                                <button
                                  onClick={() => handleCopy(cardUrl, `bulk-${idx}`)}
                                  className="text-slate-400 hover:text-slate-700"
                                  title="Copy URL"
                                >
                                  {copiedCode === `bulk-${idx}` ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-slate-700">
                              {c.username}
                            </td>
                            <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">
                              {c.password}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <button
                                onClick={() => setQrModalData({ cardCode: c.card_code, fullUrl: cardUrl })}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100"
                                title="View QR"
                              >
                                <QrIcon className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: EXPORT                                            */}
        {/* ======================================================== */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* CSV Export Card */}
              <div className="card border-slate-200/80 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Export All Cards as CSV
                      </h3>
                      <p className="text-xs text-slate-500">
                        Download full inventory with metrics and shop configurations
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-600">
                    Includes all {cards.length} cards currently in the database. Contains shop profile details,
                    card codes, status, and click engagement analytics for reporting.
                  </p>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                    <div className="font-semibold text-slate-700 mb-1">Columns included:</div>
                    <p className="font-mono text-[11px] text-slate-500">
                      Card Code, Shop Name, Category, Status, Username, Full URL, Scans, Review Clicks, WhatsApp Clicks, Instagram Clicks, Social URLs, Created Date
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleExportAllCards}
                    disabled={cards.length === 0}
                    className="btn-primary w-full py-3 text-sm shadow-md"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export All Cards as CSV ({cards.length})</span>
                  </button>
                </div>
              </div>

              {/* Batch QR Download Card */}
              <div className="card border-slate-200/80 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                      <QrIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Download All QR Codes
                      </h3>
                      <p className="text-xs text-slate-500">
                        Batch download high-resolution PNG QR images for printing
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-600">
                    Downloads individual PNG files for all {cards.length} cards sequentially with progress feedback.
                    Ideal for sending to sticker and PVC card print vendors.
                  </p>

                  {/* Progress bar if downloading */}
                  {isDownloadingAllQRs && qrDownloadProgress && (
                    <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-brand-900 mb-1.5">
                        <span>Downloading QR Codes...</span>
                        <span>{qrDownloadProgress.current} / {qrDownloadProgress.total}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
                        <div
                          className="h-full bg-brand-600 transition-all duration-300"
                          style={{
                            width: `${(qrDownloadProgress.current / qrDownloadProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleDownloadAllQRs}
                    disabled={isDownloadingAllQRs || cards.length === 0}
                    className="btn-secondary w-full py-3 text-sm font-semibold text-slate-800"
                  >
                    {isDownloadingAllQRs ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                        <span>Processing Batch...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Download All QR Codes ({cards.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* CSV Data Preview */}
            <div className="card border-slate-200/80 p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <h3 className="text-base font-bold text-slate-900">
                    CSV Data Preview (Sample First 5 Rows)
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Showing {Math.min(5, cards.length)} of {cards.length} cards
                </span>
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Card Code</th>
                      <th className="px-3 py-2.5">Shop Name</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Username</th>
                      <th className="px-3 py-2.5">Scans</th>
                      <th className="px-3 py-2.5">Reviews</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {cards.slice(0, 5).map((c) => (
                      <tr key={c.id}>
                        <td className="px-3 py-2 font-mono font-bold">{c.card_code}</td>
                        <td className="px-3 py-2 font-medium">{c.shop_name || '—'}</td>
                        <td className="px-3 py-2">{c.business_category || '—'}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              c.is_configured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {c.is_configured ? 'Active' : 'Unclaimed'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono">{c.username}</td>
                        <td className="px-3 py-2 font-semibold text-indigo-600">{c.scan_count || 0}</td>
                        <td className="px-3 py-2 text-yellow-600 font-semibold">{c.review_clicks || 0}</td>
                      </tr>
                    ))}
                    {cards.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                          No cards in database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {qrModalData && (
        <QRModal
          cardCode={qrModalData.cardCode}
          fullUrl={qrModalData.fullUrl}
          onClose={() => setQrModalData(null)}
        />
      )}

      {/* Edit Card Modal */}
      {editModalCard && (
        <EditCardModal
          card={editModalCard}
          onClose={() => setEditModalCard(null)}
          onSaved={() => fetchCards(true)}
        />
      )}

      {/* Reset / Delete Confirmation Modal */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  confirmDialog.type === 'delete'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {confirmDialog.type === 'delete' ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : (
                  <RotateCcw className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {confirmDialog.type === 'delete' ? 'Delete Card' : 'Reset Card Configuration'}
                </h3>
                <p className="font-mono text-xs text-slate-500">
                  Target: {confirmDialog.card.card_code}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              {confirmDialog.type === 'delete'
                ? `Are you sure you want to permanently delete card "${confirmDialog.card.card_code}"? This will delete all associated events and analytics. This action cannot be undone.`
                : `Are you sure you want to reset card "${confirmDialog.card.card_code}"? This will clear shop name, links, keywords, and mark it as Unclaimed.`}
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={actionLoading}
                className="btn-secondary py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.type === 'delete' ? handleDeleteConfirm : handleResetConfirm}
                disabled={actionLoading}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all focus:outline-none disabled:opacity-50 ${
                  confirmDialog.type === 'delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {confirmDialog.type === 'delete' ? 'Yes, Delete Card' : 'Yes, Reset Card'}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
