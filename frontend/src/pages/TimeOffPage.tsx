import React, { useEffect, useRef, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Paperclip,
  Plus,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaveType {
  id: string;
  name: string;
  requiresProof: boolean;
}

interface Balance {
  typeId: string;
  name: string;
  requiresProof: boolean;
  daysAllocated: number;
  daysUsed: number;
  remaining: number;
}

interface TimeOffRequest {
  id: string;
  typeId: string;
  type: { name: string };
  startDate: string;
  endDate: string;
  daysCount: number;
  remarks: string | null;
  attachmentUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  employee?: { firstName: string; lastName: string };
  employeeId?: string;
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TimeOffRequest['status'] }) {
  const cls =
    status === 'APPROVED'
      ? 'badge-approved'
      : status === 'REJECTED'
      ? 'badge-rejected'
      : 'badge-pending';
  return <span className={cls}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── New Request Modal ─────────────────────────────────────────────────────────

interface NewRequestModalProps {
  types: LeaveType[];
  balances: Balance[];
  onClose: () => void;
  onSuccess: () => void;
}

function NewRequestModal({ types, balances, onClose, onSuccess }: NewRequestModalProps) {
  const [typeId, setTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedType = types.find((t) => t.id === typeId);
  const requiresProof = selectedType?.requiresProof ?? false;

  // inclusive days
  const daysCount =
    startDate && endDate
      ? Math.max(
          0,
          Math.round(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 0;

  const balance = balances.find((b) => b.typeId === typeId);

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('typeId', typeId);
      fd.append('startDate', new Date(startDate).toISOString());
      fd.append('endDate', new Date(endDate).toISOString());
      if (remarks) fd.append('remarks', remarks);
      if (file) fd.append('attachment', file);

      const res = await api.post('/timeoff/requests', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Something went wrong';
      setError(msg);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!typeId) return setError('Please select a leave type.');
    if (!startDate || !endDate) return setError('Please select start and end dates.');
    if (new Date(endDate) < new Date(startDate))
      return setError('End date must be on or after start date.');
    if (requiresProof && !file) return setError('Attachment is required for Sick Leave.');

    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-grey/20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-brand/10 text-slate-brand flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-heading font-semibold text-text-primary">
              New Time-Off Request
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary hover:bg-cream rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Leave type */}
          <div>
            <label className="label">Leave Type</label>
            <select
              className="input"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              <option value="">Select a leave type…</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.requiresProof ? ' (attachment required)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Balance info */}
          {balance && (
            <div className="flex items-center space-x-2 bg-cream rounded-xl px-4 py-2.5 text-sm text-text-muted border border-blue-grey/20">
              <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
              <span>
                Balance:{' '}
                <strong className="text-text-primary">
                  {balance.remaining} / {balance.daysAllocated} days remaining
                </strong>
              </span>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>

          {/* Day count badge */}
          {daysCount > 0 && (
            <div className="text-sm text-text-muted">
              Duration:{' '}
              <strong className="text-slate-brand">
                {daysCount} day{daysCount !== 1 ? 's' : ''}
              </strong>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="label">Remarks (optional)</label>
            <textarea
              className="input resize-none h-20"
              placeholder="Add a note for your manager…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="label">
              Attachment{requiresProof ? ' (required)' : ' (optional)'}
            </label>
            <div
              className={`flex items-center justify-between border rounded-xl px-4 py-2.5 cursor-pointer transition-colors
                ${requiresProof && !file ? 'border-terracotta/50' : 'border-blue-grey'}
                hover:border-slate-brand bg-white`}
              onClick={() => fileRef.current?.click()}
            >
              <div className="flex items-center space-x-2 text-sm text-text-muted">
                <Paperclip className="w-4 h-4" />
                <span>{file ? file.name : 'Choose file…'}</span>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className="text-terracotta hover:opacity-80"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {requiresProof && !file && (
              <p className="error-text">Sick Leave requires an attachment.</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 bg-terracotta/10 border border-terracotta/30 rounded-xl px-4 py-3 text-sm text-terracotta">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary text-sm flex items-center space-x-2"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{mutation.isPending ? 'Submitting…' : 'Submit Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Employee View ─────────────────────────────────────────────────────────────

function EmployeeView() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: balances = [], isLoading: balancesLoading } = useQuery<Balance[]>({
    queryKey: ['timeoff', 'balances'],
    queryFn: async () => (await api.get('/timeoff/balances')).data,
  });

  const { data: types = [] } = useQuery<LeaveType[]>({
    queryKey: ['timeoff', 'types'],
    queryFn: async () => (await api.get('/timeoff/types')).data,
  });

  const {
    data: requests = [],
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useQuery<TimeOffRequest[]>({
    queryKey: ['timeoff', 'mine'],
    queryFn: async () => (await api.get('/timeoff/requests/mine')).data,
  });

  // Live update: when admin acts on a request, update it in place
  useEffect(() => {
    const socket = getSocket();
    const handler = (data: { requestId: string; status: string }) => {
      qc.setQueryData<TimeOffRequest[]>(['timeoff', 'mine'], (prev) =>
        prev
          ? prev.map((r) =>
              r.id === data.requestId
                ? { ...r, status: data.status as TimeOffRequest['status'] }
                : r
            )
          : prev
      );
    };
    socket.on('timeoff:statusChanged', handler);
    return () => { socket.off('timeoff:statusChanged', handler); };
  }, [qc]);

  function balanceBarColor(name: string) {
    if (name.toLowerCase().includes('sick')) return 'bg-terracotta';
    if (name.toLowerCase().includes('unpaid')) return 'bg-blue-grey';
    return 'bg-sage-light';
  }

  return (
    <div className="space-y-8">
      {/* Balance Cards */}
      <section>
        <h2 className="text-lg font-heading font-semibold text-text-primary mb-4">
          Leave Balances
        </h2>
        {balancesLoading ? (
          <div className="flex items-center space-x-2 text-sm text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-slate-brand" />
            <span>Loading balances…</span>
          </div>
        ) : balances.length === 0 ? (
          <p className="text-sm text-text-muted">No active allocations found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {balances.map((b) => {
              const pct = b.daysAllocated > 0 ? (b.daysUsed / b.daysAllocated) * 100 : 0;
              return (
                <div
                  key={b.typeId}
                  className="card border border-blue-grey/20 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-text-muted font-medium uppercase tracking-wide">
                        {b.name}
                      </p>
                      <p className="text-3xl font-heading font-bold text-text-primary mt-0.5">
                        {b.remaining}
                        <span className="text-sm font-normal text-text-muted ml-1">days left</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">Used</p>
                      <p className="text-sm font-semibold text-text-primary">
                        {b.daysUsed} / {b.daysAllocated}
                      </p>
                    </div>
                  </div>
                  {/* usage bar */}
                  <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${balanceBarColor(b.name)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {b.requiresProof && (
                    <p className="text-[11px] text-text-muted flex items-center space-x-1">
                      <Paperclip className="w-3 h-3" />
                      <span>Attachment required on request</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Request List */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-text-primary">
            My Requests
          </h2>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary flex items-center space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Request</span>
          </button>
        </div>

        {requestsLoading ? (
          <div className="flex items-center space-x-2 text-sm text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin text-slate-brand" />
            <span>Loading requests…</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="card border border-blue-grey/20 p-10 text-center space-y-3">
            <CalendarDays className="w-10 h-10 text-blue-grey mx-auto" />
            <p className="text-sm text-text-muted">No requests yet. Submit your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="card border border-blue-grey/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-brand/10 text-slate-brand flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {req.type.name}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {fmtDate(req.startDate)} → {fmtDate(req.endDate)}
                      {' · '}
                      <span className="font-medium text-text-primary">
                        {req.daysCount} day{req.daysCount !== 1 ? 's' : ''}
                      </span>
                    </p>
                    {req.remarks && (
                      <p className="text-xs text-text-muted mt-1 italic">"{req.remarks}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3 sm:flex-shrink-0">
                  <StatusBadge status={req.status} />
                  <span className="text-[11px] text-text-muted font-mono">
                    {fmtDate(req.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New Request Modal */}
      {modalOpen && (
        <NewRequestModal
          types={types}
          balances={balances}
          onClose={() => setModalOpen(false)}
          onSuccess={() => refetchRequests()}
        />
      )}
    </div>
  );
}

// ─── Admin / HR View ───────────────────────────────────────────────────────────

function AdminView() {
  const qc = useQueryClient();
  const [liveToast, setLiveToast] = useState<string | null>(null);

  const {
    data: requests = [],
    isLoading,
    refetch,
  } = useQuery<TimeOffRequest[]>({
    queryKey: ['timeoff', 'all'],
    queryFn: async () => (await api.get('/timeoff/requests')).data,
  });

  // Live: new employee request arrives → show toast and invalidate
  useEffect(() => {
    const socket = getSocket();

    const handleRequested = (data: { employeeId: string; typeId: string }) => {
      void data;
      setLiveToast('A new time-off request just arrived.');
      setTimeout(() => setLiveToast(null), 4000);
      refetch();
    };

    socket.on('timeoff:requested', handleRequested);
    return () => { socket.off('timeoff:requested', handleRequested); };
  }, [refetch]);

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'APPROVE' | 'REJECT' }) => {
      const res = await api.patch(`/timeoff/requests/${id}`, { action });
      return res.data;
    },
    onSuccess: (updated: TimeOffRequest) => {
      qc.setQueryData<TimeOffRequest[]>(['timeoff', 'all'], (prev) =>
        prev
          ? prev.map((r) => (r.id === updated.id ? { ...r, status: updated.status } : r))
          : prev
      );
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Action failed';
      alert(msg);
    },
  });

  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('pending');

  const displayed =
    activeTab === 'pending'
      ? requests.filter((r) => r.status === 'PENDING')
      : requests;

  return (
    <div className="space-y-6">
      {/* Live toast */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-slate-brand text-white text-sm px-5 py-3.5 rounded-2xl shadow-xl animate-fadeIn">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{liveToast}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-cream rounded-xl p-1 w-fit border border-blue-grey/20">
        {(['pending', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? 'bg-white text-slate-brand shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab === 'pending' ? 'Pending' : 'All Requests'}
            {tab === 'pending' && (
              <span className="ml-2 bg-slate-brand/10 text-slate-brand text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {requests.filter((r) => r.status === 'PENDING').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-slate-brand" />
          <span>Loading requests…</span>
        </div>
      ) : displayed.length === 0 ? (
        <div className="card border border-blue-grey/20 p-10 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-sage-light mx-auto" />
          <p className="text-sm text-text-muted">
            {activeTab === 'pending' ? 'No pending requests — all caught up!' : 'No requests found.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block card border border-blue-grey/20 p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 border-b border-blue-grey/20">
                <tr>
                  {['Employee', 'Type', 'Period', 'Days', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-grey/10">
                {displayed.map((req) => (
                  <tr key={req.id} className="hover:bg-cream/30 transition-colors group">
                    <td className="px-5 py-4 font-medium text-text-primary">
                      {req.employee?.firstName} {req.employee?.lastName}
                    </td>
                    <td className="px-5 py-4 text-text-muted">{req.type.name}</td>
                    <td className="px-5 py-4 text-text-muted font-mono text-xs">
                      {fmtDate(req.startDate)} → {fmtDate(req.endDate)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-text-primary">
                      {req.daysCount}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-4">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              reviewMutation.mutate({ id: req.id, action: 'APPROVE' })
                            }
                            disabled={reviewMutation.isPending}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-sage-light/30 text-sage-deep border border-sage-light/60 rounded-lg hover:bg-sage-light/50 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() =>
                              reviewMutation.mutate({ id: req.id, action: 'REJECT' })
                            }
                            disabled={reviewMutation.isPending}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-terracotta/10 text-terracotta border border-terracotta/30 rounded-lg hover:bg-terracotta/20 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-3">
            {displayed.map((req) => (
              <div key={req.id} className="card border border-blue-grey/20 space-y-3 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {req.employee?.firstName} {req.employee?.lastName}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">{req.type.name}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="text-xs text-text-muted space-y-0.5">
                  <p>
                    {fmtDate(req.startDate)} → {fmtDate(req.endDate)}
                  </p>
                  <p>
                    <strong className="text-text-primary">{req.daysCount}</strong> day
                    {req.daysCount !== 1 ? 's' : ''}
                  </p>
                </div>
                {req.status === 'PENDING' && (
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => reviewMutation.mutate({ id: req.id, action: 'APPROVE' })}
                      disabled={reviewMutation.isPending}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 text-xs font-semibold bg-sage-light/30 text-sage-deep border border-sage-light/60 rounded-lg disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => reviewMutation.mutate({ id: req.id, action: 'REJECT' })}
                      disabled={reviewMutation.isPending}
                      className="flex-1 flex items-center justify-center space-x-1 py-2 text-xs font-semibold bg-terracotta/10 text-terracotta border border-terracotta/30 rounded-lg disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page root ─────────────────────────────────────────────────────────────────

export const TimeOffPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-text-primary">
            Time Off &amp; Leave
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {isAdmin
              ? 'Review and manage leave requests across the company.'
              : 'View your balances and submit leave requests.'}
          </p>
        </div>
        {isAdmin && (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-brand/10 text-slate-brand text-xs font-semibold border border-slate-brand/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{user?.role === 'ADMIN' ? 'Admin' : 'HR Officer'} view</span>
          </span>
        )}
      </div>

      {/* Role-based content */}
      {isAdmin ? <AdminView /> : <EmployeeView />}
    </div>
  );
};
