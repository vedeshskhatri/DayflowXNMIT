import React, { useEffect, useState, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  Loader2,
  Plus,
  Search,
  Check,
  X,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { NewRequestModal } from '../components/timeoff/NewRequestModal';
import { TimeOffCalendar } from '../components/timeoff/TimeOffCalendar';

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

function StatusBadge({ status }: { status: TimeOffRequest['status'] }) {
  if (status === 'APPROVED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sage-light text-navy-dark border border-sage-deep/30 font-mono">
        Approved
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-terracotta-light text-terracotta border border-terracotta/30 font-mono">
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-copper-muted text-copper-dark border border-copper/30 font-mono">
      Pending
    </span>
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function BalanceCardsBar({ balances }: { balances: Balance[] }) {
  const paid = balances.find((b) => b.name.toLowerCase().includes('paid')) || {
    name: 'Paid Time Off',
    remaining: 24,
    daysAllocated: 24,
  };
  const sick = balances.find((b) => b.name.toLowerCase().includes('sick')) || {
    name: 'Sick Leave',
    remaining: 7,
    daysAllocated: 7,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {/* Paid Time Off Card */}
      <div className="p-6 rounded-3xl bg-white border border-navy/10 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-navy-dark uppercase tracking-wider font-mono">
            {paid.name}
          </span>
          <p className="text-3xl font-heading font-bold text-navy mt-1 font-mono">
            {String(paid.remaining).padStart(2, '0')} <span className="text-xs font-bold text-text-muted font-sans uppercase">Days Available</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center shadow-sm">
          <CalendarDays className="w-6 h-6 text-copper-bright" />
        </div>
      </div>

      {/* Sick Time Off Card */}
      <div className="p-6 rounded-3xl bg-white border border-navy/10 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-copper uppercase tracking-wider font-mono">
            {sick.name}
          </span>
          <p className="text-3xl font-heading font-bold text-copper mt-1 font-mono">
            {String(sick.remaining).padStart(2, '0')} <span className="text-xs font-bold text-text-muted font-sans uppercase">Days Available</span>
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-copper-muted text-copper-dark flex items-center justify-center border border-copper/30 shadow-sm">
          <Clock className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function EmployeeView() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  const { data: balances = [] } = useQuery<Balance[]>({
    queryKey: ['timeoff', 'balances'],
    queryFn: async () => (await api.get('/timeoff/balances')).data,
  });

  const { data: requests = [], isLoading: requestsLoading } = useQuery<TimeOffRequest[]>({
    queryKey: ['timeoff', 'mine'],
    queryFn: async () => (await api.get('/timeoff/requests/mine')).data,
  });

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
    <div className="space-y-6 animate-fadeIn">
      {/* Subheader & Action Bar */}
      <div className="flex items-center justify-between">
        <div className="inline-block px-4 py-1.5 rounded-xl bg-navy text-white font-heading font-bold text-xs tracking-wide shadow-sm font-mono uppercase">
          Time Off Matrix
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedDate(undefined);
            setModalOpen(true);
          }}
          className="btn-navy flex items-center space-x-2 py-2.5 px-6 text-xs font-bold shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4 text-copper-bright" />
          <span>Apply Time Off</span>
        </button>
      </div>

      <BalanceCardsBar balances={balances} />

      <TimeOffCalendar
        requests={requests}
        onDateClick={(dateStr) => {
          setSelectedDate(dateStr);
          setModalOpen(true);
        }}
      />

      {/* Leave History Table */}
      <div className="p-8 rounded-3xl bg-white border border-navy/10 shadow-elevated space-y-4">
        <h3 className="font-heading font-bold text-base text-navy-dark">
          My Leave History
        </h3>

        {requestsLoading ? (
          <div className="py-8 text-center text-xs text-text-muted">Loading leave history…</div>
        ) : requests.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted italic">
            No time off requests filed yet. Click Apply Time Off to submit.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream/80 border-b border-navy/10 uppercase font-bold text-navy-dark font-mono">
                <tr>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Start Date</th>
                  <th className="py-3.5 px-5">End Date</th>
                  <th className="py-3.5 px-5">Days</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Applied On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10 font-mono">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3.5 px-5 font-sans font-bold text-navy-dark">
                      {r.type.name}
                    </td>
                    <td className="py-3.5 px-5 text-text-primary">{fmtDate(r.startDate)}</td>
                    <td className="py-3.5 px-5 text-text-primary">{fmtDate(r.endDate)}</td>
                    <td className="py-3.5 px-5 font-bold text-navy">{r.daysCount}</td>
                    <td className="py-3.5 px-5 font-sans">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-5 text-text-muted">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewRequestModal
        isOpen={modalOpen}
        defaultStartDate={selectedDate}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function AdminView() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeoff' | 'calendar' | 'allocation'>('timeoff');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: balances = [] } = useQuery<Balance[]>({
    queryKey: ['timeoff', 'balances'],
    queryFn: async () => (await api.get('/timeoff/balances')).data,
  });

  const { data: requests = [], isLoading, refetch } = useQuery<TimeOffRequest[]>({
    queryKey: ['timeoff', 'all'],
    queryFn: async () => (await api.get('/timeoff/requests')).data,
  });

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
      {/* Sub-navigation Tabs */}
      <div className="flex items-center space-x-1.5 bg-white p-1.5 rounded-2xl w-fit border border-navy/10 shadow-sm">
        <button
          onClick={() => setActiveTab('timeoff')}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
            activeTab === 'timeoff'
              ? 'bg-navy text-white shadow-sm'
              : 'text-text-muted hover:text-navy-dark hover:bg-cream'
          }`}
        >
          Time Off Requests
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-navy text-white shadow-sm'
              : 'text-text-muted hover:text-navy-dark hover:bg-cream'
          }`}
        >
          Calendar Overview
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
            activeTab === 'allocation'
              ? 'bg-navy text-white shadow-sm'
              : 'text-text-muted hover:text-navy-dark hover:bg-cream'
          }`}
        >
          Allocations
        </button>
      </div>

      {/* Action & Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-navy flex items-center space-x-2 text-xs font-bold py-2.5 px-6 shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-copper-bright" />
          <span>New Time Off</span>
        </button>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-navy/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee, leave type, or status…"
            className="input pl-10 py-2 text-xs bg-white w-full"
          />
        </div>
      </div>

      <BalanceCardsBar balances={balances} />

      {/* Tab Content */}
      {activeTab === 'calendar' ? (
        <TimeOffCalendar requests={requests} />
      ) : activeTab === 'timeoff' ? (
        <div className="space-y-6">
          <div className="card border border-navy/10 overflow-hidden p-0 bg-white shadow-elevated rounded-3xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream/80 border-b border-navy/10 uppercase font-bold text-navy-dark font-mono">
                <tr>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Start Date</th>
                  <th className="py-4 px-6">End Date</th>
                  <th className="py-4 px-6">Leave Type</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-text-muted">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-navy mb-1" />
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
                        <td className="py-4 px-6 font-bold text-navy-dark">
                          {empName}
                        </td>

                        <td className="py-4 px-6 font-mono text-text-muted">
                          {fmtDate(req.startDate)}
                        </td>

                        <td className="py-4 px-6 font-mono text-text-muted">
                          {fmtDate(req.endDate)}
                        </td>

                        <td className="py-4 px-6 font-bold text-navy">
                          {req.type.name}
                          {req.attachmentUrl && (
                            <a
                              href={req.attachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ml-2 text-xs text-copper hover:underline inline-flex items-center"
                              title="View Attachment"
                            >
                              <FileText className="w-3.5 h-3.5 inline mr-0.5" />
                            </a>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          <StatusBadge status={req.status} />
                        </td>

                        <td className="py-4 px-6 text-center">
                          {isPending ? (
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                type="button"
                                onClick={() => reviewMutation.mutate({ id: req.id, action: 'REJECT' })}
                                disabled={reviewMutation.isPending}
                                className="p-1.5 rounded-xl bg-terracotta text-white hover:bg-terracotta/90 transition-colors shadow-sm cursor-pointer"
                                title="Reject Request"
                              >
                                <X className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => reviewMutation.mutate({ id: req.id, action: 'APPROVE' })}
                                disabled={reviewMutation.isPending}
                                className="p-1.5 rounded-xl bg-sage-deep text-white hover:bg-sage-deep/90 transition-colors shadow-sm cursor-pointer"
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
        </div>
      ) : (
        <div className="card p-8 border border-navy/10 bg-white shadow-elevated rounded-3xl space-y-4">
          <h3 className="font-heading font-bold text-base text-navy-dark">
            Company Leave Allocations Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {balances.map((b) => (
              <div key={b.typeId} className="p-5 rounded-2xl bg-cream-light border border-navy/10 space-y-2">
                <span className="text-xs font-bold text-navy-dark uppercase tracking-wider font-mono block">
                  {b.name}
                </span>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-text-muted">Quota: {b.daysAllocated}d</span>
                  <span className="text-copper font-bold">Available: {b.remaining}d</span>
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

export const TimeOffPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'HR_OFFICER';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-navy/10">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-heading font-bold text-navy-dark">
              Time Off Management
            </h1>
            {isAdmin && (
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-copper-muted text-copper-dark border border-copper/30 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin / Approver</span>
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1 font-medium">
            Leave balance tracking, requests submission, and multi-user live approvals.
          </p>
        </div>
      </div>

      {isAdmin ? <AdminView /> : <EmployeeView />}
    </div>
  );
};
