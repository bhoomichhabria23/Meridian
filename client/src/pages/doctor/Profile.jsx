import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, Edit3, GraduationCap, Mail, MapPin, Phone, Save, Stethoscope, X } from 'lucide-react';
import Layout from '../../components/common/Layout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/common/UI';
import toast from 'react-hot-toast';

const LINKS = [
  { to: '/doctor/dashboard', label: 'Dashboard', icon: '🏥' },
  { to: '/doctor/patients', label: 'Patients', icon: '👥' },
  { to: '/doctor/appointments', label: 'Appointments', icon: '📅' },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: '💊' },
  { to: '/doctor/safety-alerts', label: 'Safety Alerts', icon: '⚠️' },
  { to: '/doctor/ai-assistant', label: 'AI Assistant', icon: '🤖' },
  { to: '/doctor/profile', label: 'Profile', icon: '👤' },
];

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    specialization: 'General Physician',
    licenseNo: '',
    department: '',
    hospital: '',
    workingHours: { start: '09:00', end: '17:00' },
    bio: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/doctors/me/profile');
      const data = res.data?.data || res.data || {};
      setProfile({
        name: data.userId?.name || user?.name || '',
        email: data.userId?.email || user?.email || '',
        phone: data.userId?.phone || '',
        specialization: data.specialty || data.specialization || data.userId?.specialization || user?.specialization || 'General Physician',
        licenseNo: data.licenseNo || '',
        department: data.department || '',
        hospital: data.hospital || '',
        workingHours: data.workingHours || { start: '09:00', end: '17:00' },
        bio: data.bio || '',
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load doctor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleHoursChange = (field, value) => {
    setProfile((current) => ({
      ...current,
      workingHours: {
        ...current.workingHours,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await api.post('/api/doctors/setup-profile', {
        specialty: profile.specialization,
        licenseNo: profile.licenseNo,
        hospital: profile.hospital,
        department: profile.department,
        workingHours: profile.workingHours,
        bio: profile.bio,
      });
      toast.success('Profile updated successfully');
      setEditing(false);
      await loadProfile();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save doctor profile.');
      toast.error('Profile update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/login');
    }
  };

  if (loading) return <Layout links={LINKS}><PageLoader /></Layout>;

  return (
    <Layout links={LINKS}>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-[28px] border border-[#d7efe0] bg-gradient-to-r from-[#0f5132] via-[#1a7a4a] to-[#19b36d] p-6 text-white shadow-[0_18px_45px_rgba(26,122,74,0.2)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">Doctor profile</p>
              <h1 className="mt-2 text-3xl font-black md:text-4xl">{profile.name || 'Doctor profile'}</h1>
            </div>
            <button onClick={() => setEditing((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-bold text-white">
              {editing ? <><X className="h-4 w-4" /> Close</> : <><Edit3 className="h-4 w-4" /> Edit profile</>}
            </button>
          </div>
        </section>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

        <section className="rounded-3xl border border-[#dfeee3] bg-white p-5 shadow-[0_10px_30px_rgba(17,95,57,0.05)] md:p-6">
          {editing ? (
            <div className="grid gap-5 md:grid-cols-2">
              <label className="text-sm font-bold text-[#183a28]">Full name
                <input name="name" value={profile.name} onChange={handleChange} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" />
              </label>

              <label className="text-sm font-bold text-[#183a28]">Email
                <input name="email" value={profile.email} onChange={handleChange} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" />
              </label>

              <label className="text-sm font-bold text-[#183a28]">Phone
                <input name="phone" value={profile.phone} onChange={handleChange} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" />
              </label>

              <label className="text-sm font-bold text-[#183a28]">Specialization
                <input name="specialization" value={profile.specialization} onChange={handleChange} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" />
              </label>

              <label className="text-sm font-bold text-[#183a28]">License number
                <input name="licenseNo" value={profile.licenseNo} onChange={handleChange} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" />
              </label>

              <label className="text-sm font-bold text-[#183a28]">Department
                <input name="department" value={profile.department} onChange={handleChange} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" />
              </label>

              <label className="text-sm font-bold text-[#183a28] md:col-span-2">Hospital / clinic
                <input name="hospital" value={profile.hospital} onChange={handleChange} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" />
              </label>

              <label className="text-sm font-bold text-[#183a28]">Start time
                <input type="time" value={profile.workingHours?.start || '09:00'} onChange={(event) => handleHoursChange('start', event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" />
              </label>

              <label className="text-sm font-bold text-[#183a28]">End time
                <input type="time" value={profile.workingHours?.end || '17:00'} onChange={(event) => handleHoursChange('end', event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" />
              </label>

              <label className="text-sm font-bold text-[#183a28] md:col-span-2">Professional bio
                <textarea name="bio" value={profile.bio} onChange={handleChange} rows={4} className="mt-2 w-full rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-3 py-3 text-sm text-[#183a28] outline-none focus:border-[#1aa65c]" />
              </label>

              <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                <button disabled={saving} onClick={handleSave} className="inline-flex items-center gap-2 rounded-xl bg-[#159447] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save changes'}
                </button>
                <button onClick={() => setEditing(false)} className="rounded-xl border border-[#dfeee3] bg-[#f9fcfa] px-4 py-3 text-sm font-bold text-[#183a28]">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-[#edf3ef] bg-[#f9fcfa] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[#5c7868]"><Mail className="h-4 w-4 text-[#159447]" /> Email</div>
                  <p className="text-base font-bold text-[#183a28]">{profile.email || 'Not provided'}</p>
                </div>

                <div className="rounded-2xl border border-[#edf3ef] bg-[#f9fcfa] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[#5c7868]"><Phone className="h-4 w-4 text-[#159447]" /> Phone</div>
                  <p className="text-base font-bold text-[#183a28]">{profile.phone || 'Not provided'}</p>
                </div>

                <div className="rounded-2xl border border-[#edf3ef] bg-[#f9fcfa] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[#5c7868]"><Stethoscope className="h-4 w-4 text-[#159447]" /> Specialization</div>
                  <p className="text-base font-bold text-[#183a28]">{profile.specialization || 'General Physician'}</p>
                </div>

                <div className="rounded-2xl border border-[#edf3ef] bg-[#f9fcfa] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[#5c7868]"><GraduationCap className="h-4 w-4 text-[#159447]" /> License</div>
                  <p className="text-base font-bold text-[#183a28]">{profile.licenseNo || 'Not provided'}</p>
                </div>

                <div className="rounded-2xl border border-[#edf3ef] bg-[#f9fcfa] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[#5c7868]"><BriefcaseBusiness className="h-4 w-4 text-[#159447]" /> Department</div>
                  <p className="text-base font-bold text-[#183a28]">{profile.department || 'Not provided'}</p>
                </div>

                <div className="rounded-2xl border border-[#edf3ef] bg-[#f9fcfa] p-4">
                  <div className="mb-3 flex items-center gap-2 text-[#5c7868]"><MapPin className="h-4 w-4 text-[#159447]" /> Hospital</div>
                  <p className="text-base font-bold text-[#183a28]">{profile.hospital || 'Not provided'}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#edf3ef] bg-[#f9fcfa] p-4">
                <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#5c7868]">Availability</p>
                <p className="text-base font-bold text-[#183a28]">{profile.workingHours?.start || '09:00'} – {profile.workingHours?.end || '17:00'}</p>
              </div>

              {profile.bio && (
                <div className="rounded-2xl border border-[#edf3ef] bg-[#f9fcfa] p-4">
                  <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#5c7868]">Professional bio</p>
                  <p className="text-base leading-7 text-[#183a28]">{profile.bio}</p>
                </div>
              )}

              <button onClick={handleLogout} className="w-full rounded-xl bg-[#d93b36] px-4 py-3 text-sm font-bold text-white">Logout</button>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
