import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Paperclip,
  Plus,
  ShieldAlert,
  XCircle,
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

// ─── Employee View ─────────────────────────────────────────────────────────────

function EmployeeView() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: balances = [], isLoading: balancesLoading } = useQuery<Balance[]>({
    queryKey: ['timeoff', 'balances'],
    queryFn: async () => (await api.get('/timeoff/balances')).data,
  });

  const {
    data: requests = [],
    isLoading: requestsLoading,
  } = useQuery<TimeOffRequest[]>({
    queryKey: ['timeoff', 'mine'],
    queryFn: async () => (await api.get('/timeoff/requests/mine')).data,
  });

  // Live: admin acts on a request → update status badge without full refetch
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
                <div key={b.typeId} className="card border border-blue-grey/20 space-y-3">
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
          <h2 className="text-lg font-heading font-semibold text-text-primary">My Requests</h2>
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
                    <p className="text-sm font-semibold text-text-primary">{req.type.name}</p>
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

      {/* New Request Modal (extracted component) */}
      <NewRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

// ─── Admin Allocation Tab ──────────────────────────────────────────────────────

interface AllocationRow {
  employeeName: string;
  leaveType: string;
  allocatedDays: number | null;
  usedDays: number;
  remaining: number | null;
}

function AllocationTab({ requests }: { requests: TimeOffRequest[] }) {
  // Fetch current admin's allocations
  const { data: myBalances = [] } = useQuery<Balance[]>({
    queryKey: ['timeoff', 'balances'],
    queryFn: async () => (await api.get('/timeoff/balances')).data,
  });

  // Map of leave type name -> standard allocated days (from balance config)
  const allocMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    myBalances.forEach((b) => {
      map[b.name] = b.daysAllocated;
    });
    return map;
  }, [myBalances]);

  // Derive per-employee, per-type used days from requests
  const rows = React.useMemo<AllocationRow[]>(() => {
    const map = new Map<string, { employeeName: string; leaveType: string; usedDays: number }>();
    
    requests.forEach((r) => {
      const name = `${r.employee?.firstName ?? ''} ${r.employee?.lastName ?? ''}`.trim() || 'Unknown Employee';
      const key = `${name}__${r.type.name}`;
      const existing = map.get(key);
      const daysToAdd = r.status === 'APPROVED' ? r.daysCount : 0;
      
      if (existing) {
        existing.usedDays += daysToAdd;
      } else {
        map.set(key, {
          employeeName: name,
          leaveType: r.type.name,
          usedDays: daysToAdd,
        });
      }
    });

    return Array.from(map.values())
      .map((item) => {
        const allocated = allocMap[item.leaveType] ?? null;
        const remaining = allocated !== null ? allocated - item.usedDays : null;
        return {
          employeeName: item.employeeName,
          leaveType: item.leaveType,
          allocatedDays: allocated,
          usedDays: item.usedDays,
          remaining,
        };
      })
      .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [requests, allocMap]);

  return (
    <div className="space-y-6">
      {/* Logged-in admin's personal allocation */}
      {myBalances.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-heading font-semibold text-text-primary">
              Your Allocation
            </h3>
            <span className="text-xs text-text-muted">Personal leave quota</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myBalances.map((b) => (
              <div key={b.typeId} className="card border border-blue-grey/20 py-4 px-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
                    {b.name}
                  </span>
                  <span className="text-xs text-text-muted">
                    {b.daysUsed} / {b.daysAllocated} used
                  </span>
                </div>
                <p className="text-2xl font-heading font-bold text-text-primary">
                  {b.remaining}{' '}
                  <span className="text-xs font-normal text-text-muted">days remaining</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Company Employee Allocations Table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-heading font-semibold text-text-primary">
            Employee Leave Usage &amp; Allocations
          </h3>
          <span className="text-xs text-text-muted">
            Derived from approved leave records
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="card border border-blue-grey/20 p-10 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-sage-light mx-auto" />
            <p className="text-sm text-text-muted">No employee leave records found.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block card border border-blue-grey/20 p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-cream/60 border-b border-blue-grey/20">
                  <tr>
                    {['Employee Name', 'Leave Type', 'Allocated Days', 'Used Days', 'Remaining'].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3.5 text-xs font-semibold text-text-muted uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-grey/10">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-cream/30 transition-colors">
                      <td className="px-5 py-4 font-medium text-text-primary">
                        {row.employeeName}
                      </td>
                      <td className="px-5 py-4 text-text-muted">{row.leaveType}</td>
                      <td className="px-5 py-4 text-text-muted">
                        {row.allocatedDays !== null ? `${row.allocatedDays} days` : '—'}
                      </td>
                      <td className="px-5 py-4 font-semibold text-text-primary">
                        {row.usedDays}{' '}
                        <span className="text-text-muted font-normal text-xs">
                          day{row.usedDays !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {row.remaining !== null ? (
                          <span
                            className={
                              row.remaining <= 2 ? 'text-terracotta' : 'text-sage-deep'
                            }
                          >
                            {row.remaining}{' '}
                            <span className="text-text-muted font-normal text-xs">
                              days left
                            </span>
                          </span>
                        ) : (
                          <span className="text-text-muted font-normal">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="card border border-blue-grey/20 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text-primary">
                      {row.employeeName}
                    </p>
                    <span className="text-xs font-medium text-slate-brand bg-slate-brand/10 px-2.5 py-0.5 rounded-full">
                      {row.leaveType}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-grey/10 text-xs">
                    <div>
                      <p className="text-text-muted">Allocated</p>
                      <p className="font-semibold text-text-primary">
                        {row.allocatedDays !== null ? `${row.allocatedDays}d` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-muted">Used</p>
                      <p className="font-semibold text-text-primary">{row.usedDays}d</p>
                    </div>
                    <div>
                      <p className="text-text-muted">Remaining</p>
                      <p
                        className={`font-semibold ${
                          row.remaining !== null && row.remaining <= 2
                            ? 'text-terracotta'
                            : 'text-sage-deep'
                        }`}
                      >
                        {row.remaining !== null ? `${row.remaining}d` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ─── Admin View ────────────────────────────────────────────────────────────────

function AdminView() {
  const qc = useQueryClient();
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeoff' | 'allocation'>('timeoff');

  const {
    data: requests = [],
    isLoading,
    refetch,
  } = useQuery<TimeOffRequest[]>({
    queryKey: ['timeoff', 'all'],
    queryFn: async () => (await api.get('/timeoff/requests')).data,
  });

  // Live: new employee request arrives → toast + refetch
  useEffect(() => {
    const socket = getSocket();
    const handleRequested = () => {
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

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Live toast */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-slate-brand text-white text-sm px-5 py-3.5 rounded-2xl shadow-xl animate-fadeIn">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{liveToast}</span>
        </div>
      )}

      {/* Tabs — "Time Off" | "Allocation" */}
      <div className="flex items-center space-x-1 bg-cream rounded-xl p-1 w-fit border border-blue-grey/20">
        {(['timeoff', 'allocation'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-white text-slate-brand shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab === 'timeoff' ? 'Time Off' : 'Allocation'}
            {tab === 'timeoff' && pendingCount > 0 && (
              <span className="ml-2 bg-slate-brand/10 text-slate-brand text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'allocation' ? (
        <AllocationTab requests={requests} />
      ) : isLoading ? (
        <div className="flex items-center space-x-2 text-sm text-text-muted">
          <Loader2 className="w-4 h-4 animate-spin text-slate-brand" />
          <span>Loading requests…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="card border border-blue-grey/20 p-10 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-sage-light mx-auto" />
          <p className="text-sm text-text-muted">No requests found.</p>
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
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-cream/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-text-primary">
                      {req.employee?.firstName} {req.employee?.lastName}
                    </td>
                    <td className="px-5 py-4 text-text-muted">{req.type.name}</td>
                    <td className="px-5 py-4 text-text-muted font-mono text-xs">
                      {fmtDate(req.startDate)} → {fmtDate(req.endDate)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-text-primary">{req.daysCount}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-4">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => reviewMutation.mutate({ id: req.id, action: 'APPROVE' })}
                            disabled={reviewMutation.isPending}
                            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold bg-sage-light/30 text-sage-deep border border-sage-light/60 rounded-lg hover:bg-sage-light/50 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => reviewMutation.mutate({ id: req.id, action: 'REJECT' })}
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
            {requests.map((req) => (
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
                  <p>{fmtDate(req.startDate)} → {fmtDate(req.endDate)}</p>
                  <p>
                    <strong className="text-text-primary">{req.daysCount}</strong>{' '}
                    day{req.daysCount !== 1 ? 's' : ''}
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

      {isAdmin ? <AdminView /> : <EmployeeView />}
    </div>
  );
};
