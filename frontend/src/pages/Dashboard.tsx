import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../lib/socket';
import { 
  Users, 
  Clock, 
  CalendarDays, 
  CheckCircle2, 
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AttendanceControl } from '../components/AttendanceControl';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [liveStatus, setLiveStatus] = useState<string>(user?.status || 'PRESENT');
  const [realtimeAlerts, setRealtimeAlerts] = useState<Array<{ id: string; text: string; time: string }>>([]);

  useEffect(() => {
    if (user?.status) {
      setLiveStatus(user.status);
    }
  }, [user]);

  // Real-time socket event listeners for presence & attendance updates
  useEffect(() => {
    const socket = getSocket();

    const handlePresenceUpdate = (data: { employeeId: string; status: string; name?: string }) => {
      console.log('⚡ Received presence:update', data);
      if (data.employeeId === user?.id) {
        setLiveStatus(data.status);
      }
      setRealtimeAlerts((prev) => [
        {
          id: Math.random().toString(),
          text: `${data.name || 'An employee'} changed presence to ${data.status}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 4),
      ]);
    };

    const handleAttendanceCheckin = (data: { employeeId: string; name?: string; time?: string }) => {
      setRealtimeAlerts((prev) => [
        {
          id: Math.random().toString(),
          text: `🟢 ${data.name || 'Employee'} checked in for the day`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 4),
      ]);
    };

    const handleTimeoffStatus = (data: { employeeId: string; status: string; type?: string }) => {
      setRealtimeAlerts((prev) => [
        {
          id: Math.random().toString(),
          text: `📋 Time off request ${data.status.toLowerCase()}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.slice(0, 4),
      ]);
    };

    socket.on('presence:update', handlePresenceUpdate);
    socket.on('attendance:checkin', handleAttendanceCheckin);
    socket.on('timeoff:statusChanged', handleTimeoffStatus);

    return () => {
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('attendance:checkin', handleAttendanceCheckin);
      socket.off('timeoff:statusChanged', handleTimeoffStatus);
    };
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sage-light text-navy-dark border border-sage-deep/30 font-mono">
            <span className="w-2 h-2 rounded-full bg-sage-deep" />
            <span>Present</span>
          </span>
        );
      case 'ON_LEAVE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-copper-muted text-copper-dark border border-copper/30 font-mono">
            <span className="w-2 h-2 rounded-full bg-copper" />
            <span>On Leave</span>
          </span>
        );
      case 'ABSENT':
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-terracotta-light text-terracotta border border-terracotta/30 font-mono">
            <span className="w-2 h-2 rounded-full bg-terracotta" />
            <span>Absent</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="card bg-white border border-navy/10 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-elevated rounded-3xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-heading font-bold text-navy-dark">
              Welcome back, {user?.firstName}!
            </h1>
            {user?.status && getStatusBadge(liveStatus)}
          </div>
          <p className="text-sm text-text-muted font-medium">
            {user?.jobTitle || 'Team Member'} &bull; {user?.department || 'Dayflow x NMIT'} &bull; Login ID:{' '}
            <span className="font-mono text-navy font-bold">{user?.loginId}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <AttendanceControl compact />
          <Link to="/timeoff" className="btn-secondary flex items-center space-x-2 text-xs font-bold py-2.5 px-5">
            <CalendarDays className="w-4 h-4 text-copper" />
            <span>Request Time Off</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Directory */}
        <Link to="/employees" className="card bg-white hover:shadow-modal transition-all border border-navy/10 group p-7 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-cream text-navy flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Users className="w-6 h-6 text-navy" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-navy/40 group-hover:text-copper transition-colors" />
          </div>
          <h3 className="text-lg font-heading font-bold text-navy-dark mb-1">
            Employee Directory
          </h3>
          <p className="text-xs text-text-muted font-medium">
            Browse company personnel, live presence status dots, and view role profiles.
          </p>
        </Link>

        {/* Card 2: Attendance */}
        <Link to="/attendance" className="card bg-white hover:shadow-modal transition-all border border-navy/10 group p-7 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-sage-light/30 text-sage-deep flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-navy/40 group-hover:text-copper transition-colors" />
          </div>
          <h3 className="text-lg font-heading font-bold text-navy-dark mb-1">
            Attendance Tracking
          </h3>
          <p className="text-xs text-text-muted font-medium">
            Live check-in/out tracking with automatic work hour & extra hour computation.
          </p>
        </Link>

        {/* Card 3: Time Off */}
        <Link to="/timeoff" className="card bg-white hover:shadow-modal transition-all border border-navy/10 group p-7 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-copper-muted text-copper flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <CalendarDays className="w-6 h-6" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-navy/40 group-hover:text-copper transition-colors" />
          </div>
          <h3 className="text-lg font-heading font-bold text-navy-dark mb-1">
            Time Off & Leave
          </h3>
          <p className="text-xs text-text-muted font-medium">
            Submit leave requests, check live allocation balances, and manager approvals.
          </p>
        </Link>
      </div>

      {/* Real-time Socket Live Stream Card */}
      <div className="card bg-white border border-navy/10 shadow-elevated p-7 rounded-3xl">
        <div className="flex items-center justify-between pb-4 border-b border-navy/10">
          <div className="flex items-center space-x-2.5">
            <div className="relative">
              <Activity className="w-5 h-5 text-copper" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-copper animate-ping" />
            </div>
            <h2 className="text-base font-heading font-bold text-navy-dark">
              Live Company Activity (Socket.IO Real-Time Stream)
            </h2>
          </div>
          <span className="text-xs font-mono bg-cream px-3 py-1 rounded-xl text-navy font-bold border border-navy/10">
            Room: company:{user?.companyId?.slice(0, 8) || 'dx'}
          </span>
        </div>

        <div className="pt-4 space-y-2.5">
          {realtimeAlerts.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-muted flex flex-col items-center justify-center space-y-1">
              <Activity className="w-6 h-6 text-navy/30 mb-1" />
              <span>Real-time presence socket is active and listening for company events.</span>
              <span className="text-[11px] text-copper font-bold">
                (Check in or update presence from another tab to see instant sync!)
              </span>
            </div>
          ) : (
            realtimeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-cream-light border border-navy/10 text-xs animate-fadeIn"
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sage-deep flex-shrink-0" />
                  <span className="font-medium text-navy-dark">{alert.text}</span>
                </div>
                <span className="text-text-muted font-mono text-[11px]">{alert.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
