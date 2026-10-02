import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, BellRing, CalendarDays, CheckCircle2, Clock3, FileText, Pill, ShieldCheck, Sparkles, Stethoscope, Target, UserRound, Users } from 'lucide-react';
import Layout from '../../components/common/Layout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
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

const formatDisplayDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Get the current doctor's profile directly
        const doctorRes = await api.get('/api/doctors/me/profile');
        const doctor = doctorRes.data;
        
        console.log('DoctorDashboard - Loaded doctor:', doctor);
        setDoctor(doctor);

        const [appointmentsRes, patientsRes] = await Promise.all([
          api.get(`/api/doctors/${doctor._id}/appointments`),
          api.get('/api/patients'),
        ]);

        setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : appointmentsRes.data?.appointments || []);
        setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : patientsRes.data?.patients || []);
      } catch (err) {
        console.error('DoctorDashboard - Load error:', err);
        if (err?.response?.status === 404) {
          setError('Doctor profile not found. Please contact administration for onboarding.');
        } else if (err?.response?.status === 403) {
          setError('You are not authorized to access the doctor dashboard.');
        } else {
          setError(err?.response?.data?.message || 'Could not load dashboard data.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      load();
    }
  }, [user]);

  const approvedAppointments = useMemo(() => {
    return appointments.filter((item) => (item.status || '').toLowerCase() === 'confirmed');
  }, [appointments]);

  const today = useMemo(() => {
    const todayString = new Date().toDateString();
    return approvedAppointments.filter((item) => new Date(item.date).toDateString() === todayString);
  }, [approvedAppointments]);

  const upcoming = useMemo(() => {
    return approvedAppointments
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 4);
  }, [approvedAppointments]);

  const stats = useMemo(() => ({
    totalPatients: patients.length,
    todayAppointments: today.length,
    approvedConsults: approvedAppointments.length,
    completed: appointments.filter((item) => (item.status || '').toLowerCase() === 'completed').length,
  }), [appointments, approvedAppointments, patients, today]);

  const doctorName = user?.name || doctor?.name || 'Doctor';

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>;

  return (
    <Layout links={LINKS}>
      <div className="min-h-screen bg-[#edf9f1] px-3 py-4 sm:px-4 lg:px-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="relative overflow-hidden rounded-[32px] border border-[#d6f2df] bg-gradient-to-br from-[#0a3d2b] via-[#105d3b] to-[#20a564] px-6 py-7 shadow-[0_30px_70px_rgba(18,95,66,0.28)] sm:px-8 lg:px-10">
            <div className="absolute -right-12 -top-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[#7ef0b0]/10 blur-3xl" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  Meridian Clinical Suite
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Welcome back, <span className="text-emerald-100">{doctorName}</span>
                </h1>
                <p className="mt-4 max-w-xl text-sm text-emerald-50 md:text-base">
                  {doctor?.specialty || doctor?.specialization || 'General Physician'} • {doctor?.hospital || 'Meridian Clinic'}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                <button
                  onClick={() => navigate('/doctor/appointments')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#0d3d2d] shadow-lg shadow-black/10 transition hover:-translate-y-0.5"
                >
                  View schedule
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/doctor/patients')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  Review patients
                </button>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>
          )}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Patients', value: stats.totalPatients, icon: Users, text: 'Active care list', tone: 'bg-[#eafaf0]' },
              { label: 'Today', value: stats.todayAppointments, icon: CalendarDays, text: 'Appointments booked', tone: 'bg-[#ecf9ff]' },
              { label: 'Confirmed', value: stats.approvedConsults, icon: Clock3, text: 'Consultations ready', tone: 'bg-[#fff7e8]' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle2, text: 'Closed visits', tone: 'bg-[#f1efff]' },
            ].map(({ label, value, icon: Icon, text, tone }) => (
              <div key={label} className="rounded-[26px] border border-[#dfeee3] bg-white p-5 shadow-[0_16px_40px_rgba(17,95,57,0.06)]">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6c7d74]">{label}</span>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon className="h-5 w-5 text-[#137f4b]" />
                  </div>
                </div>
                <div className="text-3xl font-black tracking-[-0.05em] text-[#143c2b]">{value}</div>
                <p className="mt-2 text-sm text-[#6d7d74]">{text}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
            <div className="rounded-[30px] border border-[#dfeee3] bg-white p-5 shadow-[0_16px_40px_rgba(17,95,57,0.06)] md:p-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6c7d74]">Today</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#173b2a]">Appointments</h2>
                </div>
                <button onClick={() => navigate('/doctor/appointments')} className="inline-flex items-center gap-2 rounded-xl border border-[#dfeee3] bg-[#f6fbf8] px-3 py-2 text-sm font-bold text-[#136d49]">
                  Open schedule
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {today.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[#d9eddf] bg-[#f7fbf8] p-8 text-center">
                  <CalendarDays className="mx-auto h-10 w-10 text-[#5ca87b]" />
                  <p className="mt-3 text-xl font-black text-[#153e2d]">No appointments today</p>
                  <p className="mt-2 text-sm text-[#6b7d73]">Your schedule is clear for follow-ups and walk-in consultations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {today.map((item) => (
                    <div key={item._id} className="flex flex-col gap-3 rounded-[22px] border border-[#edf3ef] bg-[#f9fcfa] p-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf7ee] text-[#177f4c]">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-[#173b2a]">{item.patientId?.userId?.name || item.patientId?.name || 'Patient'}</p>
                          <p className="text-sm text-[#61766d]">{item.chiefComplaint || 'General consultation'} • {item.timeSlot || 'Time TBD'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${item.status === 'confirmed' ? 'bg-[#eaf7ee] text-[#177f4c]' : item.status === 'cancelled' ? 'bg-[#fff0f0] text-[#b85048]' : 'bg-[#fff7dc] text-[#b98205]'}`}>
                          {item.status || 'pending'}
                        </span>
                        <button onClick={() => navigate(`/doctor/patients/${item.patientId?._id || item.patientId}`)} className="rounded-xl border border-[#dceee1] bg-white px-3 py-2 text-xs font-bold text-[#173b2a]">
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-[30px] border border-[#dfeee3] bg-white p-5 shadow-[0_16px_40px_rgba(17,95,57,0.06)] md:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-[#177f4c]" />
                  <h3 className="text-xl font-black text-[#173b2a]">Upcoming</h3>
                </div>
                <div className="space-y-3">
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-[#6e7d75]">No upcoming consultations.</p>
                  ) : (
                    upcoming.map((item) => (
                      <div key={item._id} className="rounded-[20px] border border-[#edf3ef] bg-[#f9fcfa] p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-[#173b2a]">{item.patientId?.userId?.name || item.patientId?.name || 'Patient'}</p>
                          <span className="rounded-full bg-[#eaf7ee] px-2 py-1 text-[10px] font-bold uppercase text-[#177f4c]">{item.status}</span>
                        </div>
                        <p className="mt-2 text-sm text-[#64766d]">{formatDisplayDate(item.date)} • {item.timeSlot || 'Time TBD'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[30px] border border-[#dfeee3] bg-white p-5 shadow-[0_16px_40px_rgba(17,95,57,0.06)] md:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#177f4c]" />
                  <h3 className="text-xl font-black text-[#173b2a]">Clinical focus</h3>
                </div>

                <div className="space-y-3 text-sm text-[#5d736b]">
                  <div className="flex items-start gap-3 rounded-[18px] bg-[#f6fbf8] p-3">
                    <Target className="mt-0.5 h-4 w-4 text-[#177f4c]" />
                    <div>
                      <p className="font-bold text-[#173b2a]">Safety review</p>
                      <p>{approvedAppointments.length} approved prescriptions or consults are awaiting your review.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-[18px] bg-[#f6fbf8] p-3">
                    <Stethoscope className="mt-0.5 h-4 w-4 text-[#177f4c]" />
                    <div>
                      <p className="font-bold text-[#173b2a]">Patient load</p>
                      <p>{patients.length} patients are currently in your active care workflow.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-[18px] bg-[#f6fbf8] p-3">
                    <Pill className="mt-0.5 h-4 w-4 text-[#177f4c]" />
                    <div>
                      <p className="font-bold text-[#173b2a]">Medication check</p>
                      <p>Prescription safety alerts and AI assistance remain available in your workflow.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#dfeee3] bg-white p-5 shadow-[0_16px_40px_rgba(17,95,57,0.06)] md:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6c7d74]">Agenda</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#173b2a]">Care timeline</h2>
              </div>
              <button onClick={() => navigate('/doctor/appointments')} className="rounded-xl border border-[#dfeee3] bg-[#f8fbf9] px-3 py-2 text-sm font-bold text-[#173b2a]">
                Manage agenda
              </button>
            </div>

            <div className="space-y-3">
              {appointments.slice(0, 6).map((item) => (
                <div key={item._id} className="grid gap-3 rounded-[20px] border border-[#edf3ef] bg-[#fafdfb] p-4 md:grid-cols-[110px_1fr_auto] md:items-center">
                  <div className="font-black text-[#177f4c]">{item.timeSlot || 'TBD'}</div>
                  <div>
                    <p className="font-bold text-[#173b2a]">{item.patientId?.userId?.name || item.patientId?.name || 'Patient'}</p>
                    <p className="text-sm text-[#64766d]">{item.chiefComplaint || 'Consultation'} • {formatDisplayDate(item.date)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${item.status === 'confirmed' ? 'bg-[#eaf7ee] text-[#177f4c]' : item.status === 'cancelled' ? 'bg-[#fff0f0] text-[#b85048]' : 'bg-[#fff7dc] text-[#b98205]'}`}>
                    {item.status || 'pending'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}