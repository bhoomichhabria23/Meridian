import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Stethoscope, UserPlus, UserRound } from 'lucide-react';
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

export default function DoctorPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/doctors/patients');
        const items = Array.isArray(res.data) ? res.data : res.data?.patients || res.data?.data || [];
        setPatients(items);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((patient) => {
      const fullText = [
        patient.name,
        patient.userId?.name,
        patient.email,
        patient.userId?.email,
        patient.phone,
        patient.userId?.phone,
        patient.patientCode,
        patient.gender,
        patient.bloodGroup,
        patient.address,
      ].join(' ').toLowerCase();
      return fullText.includes(query);
    });
  }, [patients, search]);

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>;

  return (
    <Layout links={LINKS}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 rounded-[28px] border border-[#d7efe0] bg-gradient-to-r from-[#0f5132] via-[#1a7a4a] to-[#19b36d] p-6 text-white shadow-[0_18px_45px_rgba(26,122,74,0.2)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Patient list</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Assigned care team</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => navigate('/doctor/patients/new')} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#176b3d] shadow-lg"><UserPlus size={16} /> Add patient</button>
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-emerald-50">
              {patients.length} active patients
            </div>
          </div>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

        <section className="rounded-3xl border border-[#dfeee3] bg-white p-5 shadow-[0_10px_30px_rgba(17,95,57,0.05)] md:p-6">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a7d71]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient by name, email, phone, or code..." className="h-12 w-full rounded-2xl border border-[#dfeee3] bg-[#f9fcfa] pl-10 pr-4 text-sm text-[#183a28] outline-none transition focus:border-[#1aa65c]" />
          </div>
        </section>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#dfeee3] bg-white p-8 text-center shadow-[0_10px_30px_rgba(17,95,57,0.05)]">
            <UserRound className="mx-auto h-12 w-12 text-[#7aa087]" />
            <p className="mt-3 text-xl font-black text-[#183a28]">No patients found</p>
            <p className="mt-2 text-sm text-[#6a7d71]">Try adjusting your search or check if the patient record exists.</p>
          </div>
        ) : (
          <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((patient) => (
              <div key={patient._id} className="rounded-3xl border border-[#dfeee3] bg-white p-5 shadow-[0_10px_30px_rgba(17,95,57,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(24,58,40,0.08)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf7ed] text-[#159447]">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[#183a28]">{patient.userId?.name || patient.name || 'Registered patient'}</h2>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6a7d71]">{patient.patientCode || 'Patient record'}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#eaf7ed] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#159447]">Active</span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-[#64756b]">
                  <p><span className="font-bold text-[#183a28]">Email:</span> {patient.userId?.email || patient.email || 'Not provided'}</p>
                  <p><span className="font-bold text-[#183a28]">Phone:</span> {patient.userId?.phone || patient.phone || 'Not provided'}</p>
                  <p><span className="font-bold text-[#183a28]">Age:</span> {patient.age ?? 'N/A'}</p>
                  <p><span className="font-bold text-[#183a28]">Blood:</span> {patient.bloodGroup || 'N/A'}</p>
                </div>

                <div className="mt-5 space-y-3 border-t border-[#edf3ef] pt-4">
                  <div className="inline-flex items-center gap-2 text-sm font-bold text-[#159447]">
                    <FileText className="h-4 w-4" />
                    {patient.conditions?.length || 0} conditions
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/doctor/prescription/new?patientId=${patient._id}`)} className="flex-1 rounded-xl bg-[#159447] px-3 py-2 text-xs font-bold text-white">Create prescription</button>
                    <button onClick={() => navigate(`/doctor/patients/${patient._id}`)} className="rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 py-2 text-xs font-bold text-[#183a28]">Open profile</button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </Layout>
  );
}
