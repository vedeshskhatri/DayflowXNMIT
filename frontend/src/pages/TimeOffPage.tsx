import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  Loader2,
  Plus,
  Search,
  Check,
  X,
  Calendar as CalendarIcon,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { NewRequestModal } from '../components/timeoff/NewRequestModal';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  employee?: { firstName: string; lastName: string; profilePicUrl?: string | null };
  employeeId?: string;
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TimeOffRequest['status'] }) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sage-light text-text-primary border border-sage-deep/20">
        Approved
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-terracotta/15 text-terracotta border border-terracotta/20">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cream text-slate-brand border border-blue-grey/25">
      Pending
    </span>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ─── Balance Cards Bar (Wireframe: Paid time Off 24 Days | Sick time off 07 Days) ──

function BalanceCardsBar({ balances }: { balances: Balance[] }) {
  const paid = balances.find((b) => b.name.toLowerCase().includes('paid')) || {
    name: 'Paid time Off',
    remaining: 24,
    daysAllocated: 24,
  };
  const sick = balances.find((b) => b.name.toLowerCase().includes('sick')) || {
    name: 'Sick time off',
    remaining: 7,
    daysAllocated: 7,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Paid Time Off Card */}
      <div className="p-5 rounded-2xl bg-white border border-blue-grey/20 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {paid.name}
          </span>
          <p className="text-2xl font-heading font-bold text-slate-brand mt-1 font-mono">
            {String(paid.remaining).padStart(2, '0')} <span className="text-sm font-normal text-text-muted">Days Available</span>
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-slate-brand/10 text-slate-brand flex items-center justify-center border border-slate-brand/20">
          <CalendarDays className="w-6 h-6" />
        </div>
      </div>

      {/* Sick Time Off Card */}
      <div className="p-5 rounded-2xl bg-white border border-blue-grey/20 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            {sick.name}
          </span>
          <p className="text-2xl font-heading font-bold text-terracotta mt-1 font-mono">
            {String(sick.remaining).padStart(2, '0')} <span className="text-sm font-normal text-text-muted">Days Available</span>
          </p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-terracotta/15 text-terracotta flex items-center justify-center border border-terracotta/20">
          <Clock className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// ─── Annual Calendar Grid (Wireframe Employee View) ───────────────────────────

function YearCalendarGrid({ requests }: { requests: TimeOffRequest[] }) {
  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => i);

  // Set of leave dates in YYYY-MM-DD
  const leaveMap = useMemo(() => {
    const map = new Map<string, { status: string; type: string }>();
    requests.forEach((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const cur = new Date(start);
      while (cur <= end) {
        map.set(cur.toISOString().split('T')[0], { status: r.status, type: r.type?.name || 'Leave' });
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [requests]);

  return (
    <div className="p-5 rounded-2xl bg-white border border-blue-grey/20 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-blue-grey/15">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-slate-brand" />
          <h3 className="font-heading font-semibold text-sm text-text-primary">
            Leave Calendar Overview ({currentYear})
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sage-deep" />
            <span>Approved</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-terracotta" />
            <span>Pending</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
        {months.map((m) => {
          const firstDay = new Date(currentYear, m, 1).getDay(); // 0 is Sun
          const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
          const monthName = new Date(currentYear, m, 1).toLocaleDateString('en-US', { month: 'short' });

          return (
            <div key={m} className="p-2.5 rounded-xl bg-cream/30 border border-blue-grey/15">
              <span className="font-heading font-bold text-xs text-text-primary block text-center mb-1.5">
                {monthName}
              </span>
              <div className="grid grid-cols-7 gap-0.5 text-[9px] text-center font-mono">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
                  <span key={idx} className="text-text-muted font-bold">
                    {d}
                  </span>
                ))}
                {Array.from({ length: firstDay }, (_, i) => (
                  <span key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${currentYear}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const leave = leaveMap.get(dateStr);

                  return (
                    <span
                      key={dayNum}
                      className={`h-5 w-5 flex items-center justify-center rounded-md font-medium ${
                        leave?.status === 'APPROVED'
                          ? 'bg-sage-deep text-white font-bold'
                          : leave?.status === 'PENDING'
                          ? 'bg-terracotta text-white font-bold'
                          : 'text-text-primary hover:bg-cream'
                      }`}
                      title={leave ? `${leave.type} (${leave.status})` : undefined}
                    >
                      {dayNum}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Employee View ─────────────────────────────────────────────────────────────

function EmployeeView() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: balances = [] } = useQuery<Balance[]>({
    queryKey: ['timeoff', 'balances'],
    queryFn: async () => (await api.get('/timeoff/balances')).data,
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<TimeOffRequest[]>({
    queryKey: ['timeoff', 'mine'],
    queryFn: async () => (await api.get('/timeoff/requests/mine')).data,
  });

  // Socket listener for approval updates
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
      qc.invalidateQueries({ queryKey: ['timeoff', 'balances'] });
    };
    socket.on('timeoff:statusChanged', handler);
    return () => {
      socket.off('timeoff:statusChanged', handler);
    };
  }, [qc]);

  return (
    <div className="space-y-6">
      {/* Top Action Row with NEW Button (Wireframe: Time Off [NEW]) */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-text-primary">Time Off</h2>
          <p className="text-xs text-text-muted">Manage and track your leave applications</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center space-x-2 text-xs font-semibold py-2.5 px-5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>NEW</span>
        </button>
      </div>

      {/* Balance Cards Bar */}
      <BalanceCardsBar balances={balances} />

      {/* Annual Calendar Grid */}
      <YearCalendarGrid requests={requests} />

      {/* Personal Requests Table */}
      <div className="p-5 rounded-2xl bg-white border border-blue-grey/20 shadow-sm space-y-4">
        <h3 className="font-heading font-semibold text-sm text-text-primary">
          My Leave History
        </h3>

        {requestsLoading ? (
          <div className="py-8 text-center text-xs text-text-muted">Loading leave history…</div>
        ) : requests.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted italic">
            No time off requests filed yet. Click NEW to apply.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream/70 border-b border-blue-grey/15 uppercase font-bold text-text-muted">
                <tr>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">End Date</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Applied On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-grey/10 font-mono">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-text-primary">
                      {r.type.name}
                    </td>
                    <td className="py-3 px-4">{fmtDate(r.startDate)}</td>
                    <td className="py-3 px-4">{fmtDate(r.endDate)}</td>
                    <td className="py-3 px-4 font-bold text-slate-brand">{r.daysCount}</td>
                    <td className="py-3 px-4 font-sans">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-text-muted">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

// ─── Admin View (Wireframe: For Admin & HR Officer) ────────────────────────────

function AdminView() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeoff' | 'allocation'>('timeoff');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: balances = [] } = useQuery<Balance[]>({
    queryKey: ['timeoff', 'balances'],
    queryFn: async () => (await api.get('/timeoff/balances')).data,
  });

  const { data: requests = [], isLoading, refetch } = useQuery<TimeOffRequest[]>({
    queryKey: ['timeoff', 'all'],
    queryFn: async () => (await api.get('/timeoff/requests')).data,
  });

  // Socket listener for new incoming requests
  useEffect(() => {
    const socket = getSocket();
    const handleRequested = () => {
      refetch();
    };
    socket.on('timeoff:requested', handleRequested);
    return () => {
      socket.off('timeoff:requested', handleRequested);
    };
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
      qc.invalidateQueries({ queryKey: ['timeoff', 'balances'] });
    },
  });

  // Filter requests by search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter((r) => {
      const name = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
      const type = (r.type?.name || '').toLowerCase();
      const status = r.status.toLowerCase();
      return name.includes(q) || type.includes(q) || status.includes(q);
    });
  }, [requests, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── Sub-navigation Tabs (Wireframe: [Time Off] [Allocation]) ──── */}
      <div className="flex items-center space-x-1.5 bg-cream p-1 rounded-xl w-fit border border-blue-grey/20">
        <button
          onClick={() => setActiveTab('timeoff')}
          className={`px-4 py-2 rounded-lg text-xs font-heading font-semibold transition-all ${
            activeTab === 'timeoff'
              ? 'bg-slate-brand text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary hover:bg-white'
          }`}
        >
          Time Off
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`px-4 py-2 rounded-lg text-xs font-heading font-semibold transition-all ${
            activeTab === 'allocation'
              ? 'bg-slate-brand text-white shadow-sm'
              : 'text-text-muted hover:text-text-primary hover:bg-white'
          }`}
        >
          Allocation
        </button>
      </div>

      {/* ── Action & Search Row (Wireframe: [NEW]  [Searchbar]) ─────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center space-x-2 text-xs font-semibold py-2.5 px-6 shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>NEW</span>
        </button>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-blue-grey absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, leave type, or status…"
            className="input pl-10 py-2 text-xs bg-white w-full"
          />
        </div>
      </div>

      {/* ── Balance Cards Bar (Wireframe: Paid time Off 24 Days | Sick time off 07 Days) ── */}
      <BalanceCardsBar balances={balances} />

      {/* ── Tab Content ───────────────────────────────────────────────── */}
      {activeTab === 'timeoff' ? (
        /* Requests Table matching Wireframe Columns: Name | Start Date | End Date | Time off Type | Status | Actions (Reject & Approve) */
        <div className="card border border-blue-grey/20 overflow-hidden p-0 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream/80 border-b border-blue-grey/20 uppercase font-bold text-text-muted">
              <tr>
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Start Date</th>
                <th className="py-3.5 px-6">End Date</th>
                <th className="py-3.5 px-6">Time off Type</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-grey/15">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-brand mb-1" />
                    Loading time-off queue…
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted italic">
                    No time off requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const empName = req.employee
                    ? `${req.employee.firstName} ${req.employee.lastName}`
                    : 'Employee';
                  const isPending = req.status === 'PENDING';

                  return (
                    <tr key={req.id} className="hover:bg-cream/40 transition-colors">
                      {/* Name */}
                      <td className="py-4 px-6 font-semibold text-text-primary">
                        {empName}
                      </td>

                      {/* Start Date */}
                      <td className="py-4 px-6 font-mono text-text-muted">
                        {fmtDate(req.startDate)}
                      </td>

                      {/* End Date */}
                      <td className="py-4 px-6 font-mono text-text-muted">
                        {fmtDate(req.endDate)}
                      </td>

                      {/* Time off Type */}
                      <td className="py-4 px-6 font-semibold text-slate-brand">
                        {req.type.name}
                        {req.attachmentUrl && (
                          <a
                            href={req.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-2 text-xs text-slate-brand hover:underline inline-flex items-center"
                            title="View Attachment"
                          >
                            <FileText className="w-3.5 h-3.5 inline mr-0.5" />
                          </a>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <StatusBadge status={req.status} />
                      </td>

                      {/* Actions: Reject (Red) & Approve (Green) Buttons */}
                      <td className="py-4 px-6 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center space-x-2">
                            {/* Reject Button (Red) */}
                            <button
                              type="button"
                              onClick={() => reviewMutation.mutate({ id: req.id, action: 'REJECT' })}
                              disabled={reviewMutation.isPending}
                              className="p-1.5 rounded-lg bg-terracotta text-white hover:bg-terracotta/90 transition-colors shadow-sm"
                              title="Reject Request"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            {/* Approve Button (Green) */}
                            <button
                              type="button"
                              onClick={() => reviewMutation.mutate({ id: req.id, action: 'APPROVE' })}
                              disabled={reviewMutation.isPending}
                              className="p-1.5 rounded-lg bg-sage-deep text-white hover:bg-sage-deep/90 transition-colors shadow-sm"
                              title="Approve Request"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-text-muted font-mono">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Allocation Overview Tab */
        <div className="card p-6 border border-blue-grey/20 bg-white shadow-sm space-y-4">
          <h3 className="font-heading font-semibold text-sm text-text-primary">
            Company Leave Allocations Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {balances.map((b) => (
              <div key={b.typeId} className="p-4 rounded-xl bg-cream/40 border border-blue-grey/20 space-y-2">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wide">
                  {b.name}
                </span>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-text-muted">Quota: {b.daysAllocated}d</span>
                  <span className="text-slate-brand font-bold">Remaining: {b.remaining}d</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NewRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const TimeOffPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-blue-grey/20">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-heading font-bold text-text-primary">
              Time Off Management
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-brand/10 text-slate-brand border border-slate-brand/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin / Approver View</span>
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1">
            Leave balance tracking, requests submission, and multi-user live approvals.
          </p>
        </div>
      </div>

      {isAdmin ? <AdminView /> : <EmployeeView />}
    </div>
  );
};
