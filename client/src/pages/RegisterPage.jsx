import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Stethoscope,
  UserRound,
  ShieldCheck,
  Activity,
  Sparkles,
  User,
  Phone,
  BriefcaseMedical,
} from "lucide-react";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";
import { exchangeFirebaseSession } from "../services/authSessionService";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState("patient");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    specialization: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // =====================================================
  // HANDLE INPUT
  // =====================================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  // =====================================================
  // FIREBASE REGISTER
  // =====================================================

  const handleRegister = async () => {
    setError("");

    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (
      role === "doctor" &&
      !formData.specialization
    ) {
      setError("Please select specialization.");
      return;
    }

    try {
      setLoading(true);

      // =================================================
      // CREATE FIREBASE ACCOUNT
      // =================================================

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          formData.email.trim(),
          formData.password
        );

      const user = userCredential.user;

      console.log(
        "Firebase registration successful:",
        user
      );

      // =================================================
      // SAVE DISPLAY NAME IN FIREBASE
      // =================================================

      await updateProfile(user, {
        displayName: formData.name.trim(),
      });

      const serverUser = await exchangeFirebaseSession(user, {
        role,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        specialization: formData.specialization,
      });

      // =================================================
      // APPLICATION USER DATA
      // =================================================

      const userData = {
        id: serverUser.id,
        uid: user.uid,
        name: formData.name.trim(),
        displayName: formData.name.trim(),
        email: user.email,
        phone: formData.phone.trim(),
        role: role,
        specialization:
          role === "doctor"
            ? formData.specialization
            : null,
      };

      // Save application information locally
      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      localStorage.setItem("role", role);

      // =================================================
      // IMPORTANT
      // =================================================
      //
      // Firebase automatically signs the newly-created
      // user in.
      //
      // We DO NOT want the user to go directly to the
      // dashboard after registration.
      //
      // Therefore sign them out first.
      // =================================================

      await signOut(auth);

      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("patientId");
      toast.success("Registration successful. Please sign in to continue.");

      // Firebase remains the identity provider; the exchanged JWT is the
      // short-lived Meridian API session for MongoDB-backed data.

      // =================================================
      // SHOW SUCCESS POPUP
      // =================================================

      setShowSuccess(true);
    } catch (err) {
      console.error(
        "Firebase registration error:",
        err
      );

      // =================================================
      // FIREBASE ERROR HANDLING
      // =================================================

      switch (err.code) {
        case "auth/email-already-in-use":
          setError(
            "An account already exists with this email."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/weak-password":
          setError(
            "Password is too weak. Please use a stronger password."
          );
          break;

        case "auth/operation-not-allowed":
          setError(
            "Email/password authentication is not enabled in Firebase."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError(
            err.message ||
              "Registration failed. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CONTINUE TO LOGIN
  // =====================================================

  const handleContinueToLogin = () => {
    setShowSuccess(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#e8f5f1]">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100">

        <div className="w-full px-8 lg:px-16">

          <nav className="h-[76px] flex items-center justify-between">

            {/* LOGO */}

            <Link
              to="/"
              className="flex items-center gap-3"
            >

              <div className="w-11 h-11 rounded-xl bg-green-700 flex items-center justify-center shadow-lg shadow-green-700/20">

                <span className="text-white text-2xl font-bold">
                  +
                </span>

              </div>

              <div>

                <h1 className="text-[22px] font-bold tracking-tight text-green-900 leading-none">
                  MERIDIAN
                </h1>

                <p className="text-[10px] text-slate-500 mt-1">
                  Clinical Intelligence for Safer Care
                </p>

              </div>

            </Link>

            {/* NAVIGATION */}

            <div className="hidden md:flex items-center gap-9">

              <Link
                to="/"
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                Home
              </Link>

              <a
                href="/#features"
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                Features
              </a>

              <a
                href="/#how-it-works"
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                How It Works
              </a>

              <a
                href="/#about"
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                About
              </a>

              <a
                href="/#contact"
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                Contact
              </a>

            </div>

            {/* ACTION BUTTONS */}

            <div className="flex items-center gap-3">

              <Link
                to="/login"
                className="px-6 py-2.5 rounded-lg border border-green-700 text-green-700 text-sm font-semibold hover:bg-green-50 transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="px-6 py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold shadow-lg shadow-green-700/20 hover:bg-green-800 transition"
              >
                Get Started
              </Link>

            </div>

          </nav>

        </div>

      </header>


      {/* =====================================================
          REGISTER PAGE
      ===================================================== */}

      <div className="min-h-[calc(100vh-76px)] flex items-center justify-center p-4 lg:p-6">

        <div className="relative w-full max-w-[1450px] min-h-[680px] lg:min-h-[calc(100vh-100px)] overflow-hidden rounded-[34px] border border-white/80 bg-[#f8fcfb] shadow-[0_30px_90px_rgba(22,82,70,0.16)]">

          {/* BACKGROUND GLOW */}

          <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-emerald-200/30 blur-[100px]" />

          <div className="pointer-events-none absolute -bottom-40 right-0 h-[500px] w-[500px] rounded-full bg-teal-200/25 blur-[100px]" />


          <div className="relative z-10 grid h-full lg:grid-cols-[1.08fr_0.92fr]">


            {/* =================================================
                LEFT SECTION
            ================================================= */}

            <section className="relative hidden overflow-hidden lg:flex flex-col bg-gradient-to-br from-[#d5f3eb] via-[#e7f8f4] to-[#f1fbf8]">

              <div className="absolute -left-24 top-20 h-[360px] w-[360px] rounded-full bg-emerald-200/25 blur-[70px]" />

              <div className="absolute right-[-100px] bottom-[-100px] h-[360px] w-[360px] rounded-full border border-emerald-200/50" />

              <div className="absolute right-20 top-16 h-24 w-24 rounded-full border border-emerald-300/30" />

              <div className="absolute right-[115px] top-[110px] h-2.5 w-2.5 rounded-full bg-emerald-400" />


              {/* BRAND */}

              <div className="relative z-20 px-12 pt-9">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-[0_12px_25px_rgba(16,185,129,0.25)]">

                    <Activity
                      size={24}
                      strokeWidth={2.2}
                    />

                  </div>

                  <div>

                    <h2 className="text-[21px] font-bold tracking-tight text-slate-800">

                      MedRemind{" "}

                      <span className="text-emerald-500">
                        AI
                      </span>

                    </h2>

                    <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Intelligent Healthcare
                    </p>

                  </div>

                </div>

              </div>


              {/* IMAGE */}

              <div className="relative flex flex-1 items-center justify-center px-14">

                <div className="absolute h-[440px] w-[440px] rounded-full bg-gradient-to-br from-emerald-200/50 to-teal-100/20 blur-[8px]" />

                <div className="relative z-10 w-[370px]">

                  <div className="absolute -inset-5 rounded-[40px] bg-emerald-300/20 blur-2xl" />

                  <div className="relative overflow-hidden rounded-[30px] border-[8px] border-white/70 bg-white/50 shadow-[0_25px_60px_rgba(28,100,82,0.18)]">

                    <div className="relative aspect-[4/5] overflow-hidden rounded-[22px]">

                      <img
                        src="/images/medical-login.png"
                        alt="Healthcare professionals"
                        className="h-full w-full object-cover object-center"
                      />

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-900/10 via-transparent to-white/10" />

                    </div>

                  </div>


                  {/* HEALTH JOURNEY */}

                  <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2.5 shadow-[0_12px_30px_rgba(30,100,85,0.15)] backdrop-blur-md">

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">

                      <Sparkles size={14} />

                    </div>

                    <span className="whitespace-nowrap text-[11px] font-semibold text-slate-700">
                      Your health journey starts here
                    </span>

                  </div>

                </div>


                {/* PERSONALIZED CARE */}

                <div className="absolute left-8 top-[41%] z-20 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_15px_35px_rgba(30,100,85,0.12)] backdrop-blur-lg">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">

                    <UserRound size={18} />

                  </div>

                  <div>

                    <p className="text-xs font-bold text-slate-800">
                      Personalized Care
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Built around your needs
                    </p>

                  </div>

                </div>


                {/* SAFE & SECURE */}

                <div className="absolute right-8 top-[25%] z-20 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_15px_35px_rgba(30,100,85,0.12)] backdrop-blur-lg">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-500">

                    <ShieldCheck size={18} />

                  </div>

                  <div>

                    <p className="text-xs font-bold text-slate-800">
                      Safe & Secure
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Your data stays protected
                    </p>

                  </div>

                </div>

              </div>


              {/* BOTTOM TEXT */}

              <div className="relative z-20 px-12 pb-9">

                <h1 className="max-w-[560px] text-[36px] font-bold leading-[1.12] tracking-tight text-slate-800">

                  Start your{" "}

                  <span className="text-emerald-500">
                    healthier journey.
                  </span>

                </h1>

                <p className="mt-3 max-w-[540px] text-[13px] leading-6 text-slate-500">

                  Create your account and stay connected with smarter tools,
                  personalized care, and meaningful health insights.

                </p>

                <div className="mt-4 flex items-center gap-6">

                  <div className="flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-emerald-400" />

                    <span className="text-[11px] font-medium text-slate-500">
                      Personalized Experience
                    </span>

                  </div>

                  <div className="flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-teal-400" />

                    <span className="text-[11px] font-medium text-slate-500">
                      Secure Healthcare
                    </span>

                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                RIGHT SECTION
            ================================================= */}

            <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#f9fdfc] via-[#f4fbf9] to-[#edf8f5] px-6 py-8 sm:px-10 lg:px-14">

              <div className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-emerald-100/50 blur-[80px]" />

              <div className="pointer-events-none absolute -bottom-40 -left-32 h-[400px] w-[400px] rounded-full bg-teal-100/40 blur-[80px]" />


              <div className="relative z-10 w-full max-w-[470px]">


                {/* MOBILE LOGO */}

                <div className="mb-6 flex items-center gap-3 lg:hidden">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">

                    <Activity size={21} />

                  </div>

                  <h2 className="text-lg font-bold text-slate-800">

                    MedRemind{" "}

                    <span className="text-emerald-500">
                      AI
                    </span>

                  </h2>

                </div>


                {/* HEADING */}

                <div className="mb-5">

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/70 px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm">

                    <Sparkles size={13} />

                    Create your account

                  </div>

                  <h1 className="text-[31px] font-bold tracking-tight text-slate-900">
                    Join MedRemind AI
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Set up your account to access smarter healthcare.
                  </p>

                </div>


                {/* ROLE SELECTOR */}

                <div className="mb-4">

                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    I am registering as
                  </p>

                  <div className="grid grid-cols-2 gap-3">


                    {/* PATIENT */}

                    <button
                      type="button"
                      onClick={() => setRole("patient")}
                      className={`group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
                        role === "patient"
                          ? "border-emerald-400 bg-emerald-50/80 shadow-[0_8px_25px_rgba(16,185,129,0.10)]"
                          : "border-slate-200/80 bg-white/70 hover:border-emerald-200 hover:bg-white"
                      }`}
                    >

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          role === "patient"
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >

                        <UserRound size={18} />

                      </div>

                      <div>

                        <p className="text-sm font-bold text-slate-800">
                          Patient
                        </p>

                        <p className="text-[10px] text-slate-400">
                          Personal healthcare
                        </p>

                      </div>

                      {role === "patient" && (
                        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-emerald-500" />
                      )}

                    </button>


                    {/* DOCTOR */}

                    <button
                      type="button"
                      onClick={() => setRole("doctor")}
                      className={`group relative flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
                        role === "doctor"
                          ? "border-teal-400 bg-teal-50/80 shadow-[0_8px_25px_rgba(20,184,166,0.10)]"
                          : "border-slate-200/80 bg-white/70 hover:border-teal-200 hover:bg-white"
                      }`}
                    >

                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          role === "doctor"
                            ? "bg-teal-500 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >

                        <Stethoscope size={18} />

                      </div>

                      <div>

                        <p className="text-sm font-bold text-slate-800">
                          Doctor
                        </p>

                        <p className="text-[10px] text-slate-400">
                          Professional account
                        </p>

                      </div>

                      {role === "doctor" && (
                        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-teal-500" />
                      )}

                    </button>

                  </div>

                </div>


                {/* FORM */}

                <div className="rounded-[25px] border border-white/80 bg-white/75 p-5 shadow-[0_20px_55px_rgba(20,80,70,0.10)] backdrop-blur-xl sm:p-5">

                  {/* ERROR */}

                  {error && (
                    <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-500">
                      {error}
                    </div>
                  )}


                  {/* NAME + PHONE */}

                  <div className="grid grid-cols-2 gap-3">

                    {/* NAME */}

                    <div>

                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Full name
                      </label>

                      <div className="group flex h-[48px] items-center rounded-xl border border-slate-200 bg-[#f9fcfb] px-3 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100/60">

                        <User
                          size={16}
                          className="mr-2.5 shrink-0 text-slate-400 group-focus-within:text-emerald-500"
                        />

                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          autoComplete="name"
                          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />

                      </div>

                    </div>


                    {/* PHONE */}

                    <div>

                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Phone number
                      </label>

                      <div className="group flex h-[48px] items-center rounded-xl border border-slate-200 bg-[#f9fcfb] px-3 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100/60">

                        <Phone
                          size={16}
                          className="mr-2.5 shrink-0 text-slate-400 group-focus-within:text-emerald-500"
                        />

                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Phone number"
                          autoComplete="tel"
                          className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />

                      </div>

                    </div>

                  </div>


                  {/* DOCTOR SPECIALIZATION */}

                  {role === "doctor" && (
                    <div className="mt-4">

                      <label className="mb-2 block text-xs font-bold text-slate-600">
                        Medical specialization
                      </label>

                      <div className="group flex h-[48px] items-center rounded-xl border border-slate-200 bg-[#f9fcfb] px-3 transition-all focus-within:border-teal-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-teal-100/60">

                        <BriefcaseMedical
                          size={16}
                          className="mr-2.5 shrink-0 text-slate-400 group-focus-within:text-teal-500"
                        />

                        <select
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleChange}
                          className="w-full bg-transparent text-sm text-slate-600 outline-none"
                        >

                          <option value="">
                            Select specialization
                          </option>

                          <option>
                            General Physician
                          </option>

                          <option>
                            Cardiologist
                          </option>

                          <option>
                            Dermatologist
                          </option>

                          <option>
                            Neurologist
                          </option>

                          <option>
                            Pediatrician
                          </option>

                          <option>
                            Orthopedic
                          </option>

                          <option>
                            Psychiatrist
                          </option>

                          <option>
                            Other
                          </option>

                        </select>

                      </div>

                    </div>
                  )}


                  {/* EMAIL */}

                  <div className="mt-4">

                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      Email address
                    </label>

                    <div className="group flex h-[48px] items-center rounded-xl border border-slate-200 bg-[#f9fcfb] px-3 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100/60">

                      <Mail
                        size={16}
                        className="mr-2.5 shrink-0 text-slate-400 group-focus-within:text-emerald-500"
                      />

                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      />

                    </div>

                  </div>


                  {/* PASSWORD */}

                  <div className="mt-4">

                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      Password
                    </label>

                    <div className="group flex h-[48px] items-center rounded-xl border border-slate-200 bg-[#f9fcfb] px-3 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100/60">

                      <Lock
                        size={16}
                        className="mr-2.5 shrink-0 text-slate-400 group-focus-within:text-emerald-500"
                      />

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        autoComplete="new-password"
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                        className="ml-2 text-slate-400 hover:text-emerald-500"
                      >

                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}

                      </button>

                    </div>

                  </div>


                  {/* CONFIRM PASSWORD */}

                  <div className="mt-4">

                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      Confirm password
                    </label>

                    <div className="group flex h-[48px] items-center rounded-xl border border-slate-200 bg-[#f9fcfb] px-3 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100/60">

                      <Lock
                        size={16}
                        className="mr-2.5 shrink-0 text-slate-400 group-focus-within:text-emerald-500"
                      />

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        className="ml-2 text-slate-400 hover:text-emerald-500"
                      >

                        {showConfirmPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}

                      </button>

                    </div>

                  </div>


                  {/* CREATE ACCOUNT */}

                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={loading}
                    className="group mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-[0_12px_25px_rgba(16,185,129,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(16,185,129,0.30)] disabled:cursor-not-allowed disabled:opacity-70"
                  >

                    {loading
                      ? "Creating Account..."
                      : `Create ${
                          role === "patient"
                            ? "Patient"
                            : "Doctor"
                        } Account`}

                    {!loading && (
                      <ArrowRight
                        size={18}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    )}

                  </button>

                </div>


                {/* LOGIN */}

                <p className="mt-4 text-center text-sm text-slate-500">

                  Already have an account?{" "}

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/login")
                    }
                    className="font-bold text-emerald-600 transition hover:text-emerald-700"
                  >
                    Sign in
                  </button>

                </p>


                {/* SECURITY */}

                <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-400">

                  <ShieldCheck
                    size={14}
                    className="text-emerald-500"
                  />

                  Your information is securely protected

                </div>

              </div>

            </section>

          </div>

        </div>

      </div>


      {/* =====================================================
          SUCCESS POPUP
      ===================================================== */}

      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">

          <div className="w-full max-w-[380px] rounded-[26px] border border-white/80 bg-white p-7 text-center shadow-[0_25px_80px_rgba(15,60,50,0.20)]">

            {/* SUCCESS ICON */}

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">

                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >

                  <path d="M20 6L9 17l-5-5" />

                </svg>

              </div>

            </div>

            <h2 className="mt-4 text-[21px] font-bold text-slate-800">
              Registration Successful
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Account created successfully.
            </p>

            <button
              type="button"
              onClick={handleContinueToLogin}
              className="mt-5 flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-[0_12px_25px_rgba(16,185,129,0.22)] transition-all hover:-translate-y-0.5"
            >

              Continue to Sign In

              <ArrowRight size={17} />

            </button>

          </div>

        </div>
      )}

    </div>
  );
}