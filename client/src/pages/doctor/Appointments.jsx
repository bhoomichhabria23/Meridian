import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Clock3, Search, UserRound, XCircle } from 'lucide-react';
import Layout from '../../components/common/Layout';
import api from '../../api/axios';
import { PageLoader } from '../../components/common/UI';

const LINKS = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/doctor/patients', label: 'Patients', icon: '👥' },
  { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
  { to: '/doctor/safety-alerts', label: 'Safety Alerts', icon: '⚠️' },
  { to: '/doctor/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { to: '/doctor/profile', label: 'Profile', icon: '👤' },
];

const statusColors = {
  confirmed: 'bg-[#eaf7ed] text-[#159447]',
  pending: 'bg-[#fff7db] text-[#b57d00]',
  completed: 'bg-[#eaf3ff] text-[#2a72d8]',
  cancelled: 'bg-[#fff0f0] text-[#c14f45]',
};

const displayDate = (value) => {
  if (!value) return 'Date not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not set' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [updating, setUpdating] = useState(false);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/appointments');
      setAppointments(Array.isArray(res.data) ? res.data : res.data?.appointments || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filtered = useMemo(() => {
    return appointments
      .filter((appointment) => selectedStatus !== 'all' || (appointment.status || '').toLowerCase() !== 'pending')
      .filter((appointment) => {
        const matchesStatus = selectedStatus === 'all' ? (appointment.status || '').toLowerCase() === 'confirmed' : (appointment.status || '').toLowerCase() === selectedStatus;
        const query = search.trim().toLowerCase();
        const matchesSearch = !query || [
          appointment.patientId?.userId?.name,
          appointment.patientId?.name,
          appointment.chiefComplaint,
          appointment.timeSlot,
          appointment.doctorId?.userId?.name,
        ].some((value) => String(value || '').toLowerCase().includes(query));
        return matchesStatus && matchesSearch;
      });
  }, [appointments, search, selectedStatus]);

  const handleStatusChange = async (id, nextStatus) => {
    try {
      setUpdating(true);
      await api.put(`/api/appointments/${id}`, { status: nextStatus });
      setAppointments((current) => current.map((item) => item._id === id ? { ...item, status: nextStatus } : item));
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to update appointment status.');
    } finally {
      setUpdating(false);
    }
  };

  const getPatientName = (appointment) => {
    const patient = appointment?.patientId || {};
    return patient.userId?.name || patient.name || patient.fullName || 'Patient';
  };

  const getPatientId = (appointment) => {
    const patient = appointment?.patientId || {};
    if (typeof patient === 'string') return patient;
    return patient._id || patient.id || patient.userId?._id || patient.userId || null;
  };

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>;

  return (
    <Layout links={LINKS}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-[28px] border border-[#d7efe0] bg-gradient-to-r from-[#0f5132] via-[#1a7a4a] to-[#19b36d] p-6 text-white shadow-[0_18px_45px_rgba(26,122,74,0.2)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Appointments</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Clinic schedule</h1>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-emerald-50">
            {appointments.filter((item) => (item.status || '').toLowerCase() === 'confirmed').length} approved appointments
          </div>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

        <section className="rounded-3xl border border-[#dfeee3] bg-white p-5 shadow-[0_10px_30px_rgba(17,95,57,0.05)] md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative xl:w-[460px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a7d71]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient, complaint, or time..." className="h-12 w-full rounded-2xl border border-[#dfeee3] bg-[#f9fcfa] pl-10 pr-4 text-sm text-[#183a28] outline-none transition focus:border-[#1aa65c]" />
            </div>

            <div className="flex flex-wrap gap-2">
              {['all', 'completed', 'cancelled'].map((filter) => (
                <button key={filter} onClick={() => setSelectedStatus(filter)} className={`rounded-xl px-3 py-2 text-sm font-bold transition ${selectedStatus === filter ? 'bg-[#159447] text-white' : 'border border-[#dfeee3] bg-[#f9fcfa] text-[#183a28]'}`}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#dfeee3] bg-white p-8 text-center shadow-[0_10px_30px_rgba(17,95,57,0.05)]">
              <CalendarDays className="mx-auto h-12 w-12 text-[#7aa087]" />
              <p className="mt-3 text-xl font-black text-[#183a28]">No appointments match this view</p>
              <p className="mt-2 text-sm text-[#6a7d71]">Try another status or search term.</p>
            </div>
          ) : (
            filtered.map((appointment) => (
              <div key={appointment._id} className="rounded-3xl border border-[#dfeee3] bg-white p-5 shadow-[0_10px_30px_rgba(17,95,57,0.05)] md:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#159447]">
                      <UserRound className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-[#183a28]">{getPatientName(appointment)}</h2>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusColors[(appointment.status || '').toLowerCase()] || 'bg-[#eef5ff] text-[#395fb0]'}`}>
                          {appointment.status || 'pending'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-5 text-sm text-[#62776d]">
                        <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#159447]" />{displayDate(appointment.date)}</span>
                        <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#159447]" />{appointment.timeSlot || 'Time not scheduled'}</span>
                      </div>
                      <p className="mt-2 text-sm text-[#667b6e]">Reason: {appointment.chiefComplaint || 'Consultation'} </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => navigate(`/doctor/patients/${getPatientId(appointment)}`)} className="rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 py-2 text-xs font-bold text-[#183a28]">View patient</button>
                    {appointment.status === 'confirmed' && (
                      <button disabled={updating} onClick={() => handleStatusChange(appointment._id, 'completed')} className="rounded-xl border border-[#dfeee3] bg-white px-3 py-2 text-xs font-bold text-[#183a28] disabled:cursor-not-allowed disabled:opacity-60">Complete</button>
                    )}
                    <button disabled={updating || appointment.status === 'cancelled'} onClick={() => handleStatusChange(appointment._id, 'cancelled')} className="rounded-xl border border-[#fdd6d1] bg-[#fff5f4] px-3 py-2 text-xs font-bold text-[#c14f45] disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </Layout>
  );
}
