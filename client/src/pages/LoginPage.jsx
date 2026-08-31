import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
} from "lucide-react";

import {
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../firebase";
import { exchangeFirebaseSession } from "../services/authSessionService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [role, setRole] = useState("patient");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
  // GET DASHBOARD PATH
  // =====================================================

  const getDashboardPath = (selectedRole) => {
    if (selectedRole === "patient") {
      return "/patient/dashboard";
    }

    if (selectedRole === "doctor") {
      return "/doctor/dashboard";
    }

    if (selectedRole === "receptionist") {
      return "/reception/dashboard";
    }

    return "/";
  };

  // =====================================================
  // FIREBASE LOGIN
  // =====================================================

  const handleLogin = async () => {
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      // =====================================================
      // FIREBASE AUTHENTICATION
      // =====================================================

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          formData.email.trim(),
          formData.password
        );

      const user = userCredential.user;

      const serverUser = await exchangeFirebaseSession(user, { role });
      const authenticatedRole = serverUser.role;

      console.log(
        "Firebase login successful:",
        user
      );

      // =====================================================
      // USERNAME
      // =====================================================

      const username =
        user.displayName ||
        formData.email.split("@")[0];

      // =====================================================
      // STORE USER INFORMATION
      // =====================================================

      const storedUser = {
        id: serverUser.id,
        uid: user.uid,
        email: serverUser.email || user.email,
        name: serverUser.name || username,
        displayName: username,
        role: authenticatedRole,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(storedUser)
      );

      localStorage.setItem("role", authenticatedRole);
      setUser({
        ...storedUser,
        token:
          localStorage.getItem("token") ||
          localStorage.getItem("auth_token"),
      });
      toast.success("Login successful. Welcome back!");

      // =====================================================
      // FIREBASE ID TOKEN
      // =====================================================

      // =====================================================
      // SHOW SUCCESS POPUP
      // =====================================================

      setShowSuccess(true);

      // =====================================================
      // REDIRECT AFTER SUCCESS MESSAGE
      // =====================================================

      setTimeout(() => {
        navigate(getDashboardPath(authenticatedRole), {
          replace: true,
        });
      }, 1800);

    } catch (err) {
      console.error(
        "Firebase login error:",
        err
      );

      switch (err.code) {
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/user-disabled":
          setError(
            "This account has been disabled."
          );
          break;

        case "auth/user-not-found":
          setError(
            "No account found with this email."
          );
          break;

        case "auth/wrong-password":
          setError("Incorrect password.");
          break;

        case "auth/too-many-requests":
          setError(
            "Too many login attempts. Please try again later."
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
              "Unable to sign in. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOGIN ON ENTER
  // =====================================================

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#e8f5f1]">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-green-100 bg-white/90 backdrop-blur-md">

        <div className="w-full px-8 lg:px-16">

          <nav className="flex h-[76px] items-center justify-between">

            {/* LOGO */}

            <Link to="/" className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-700 shadow-lg shadow-green-700/20">

                <span className="text-2xl font-bold text-white">
                  +
                </span>

              </div>

              <div>

                <h1 className="text-[22px] font-bold leading-none tracking-tight text-green-900">
                  MERIDIAN
                </h1>

                <p className="mt-1 text-[10px] text-slate-500">
                  Clinical Intelligence for Safer Care
                </p>

              </div>

            </Link>

            {/* NAVIGATION */}

            <div className="hidden items-center gap-9 md:flex">

              <Link
                to="/"
                className="text-sm text-slate-600 transition hover:text-green-700"
              >
                Home
              </Link>

              <a
                href="/#features"
                className="text-sm text-slate-600 transition hover:text-green-700"
              >
                Features
              </a>

              <a
                href="/#how-it-works"
                className="text-sm text-slate-600 transition hover:text-green-700"
              >
                How It Works
              </a>

              <a
                href="/#about"
                className="text-sm text-slate-600 transition hover:text-green-700"
              >
                About
              </a>

              <a
                href="/#contact"
                className="text-sm text-slate-600 transition hover:text-green-700"
              >
                Contact
              </a>

            </div>

            {/* ACTION BUTTONS */}

            <div className="flex items-center gap-3">

              <Link
                to="/login"
                className="rounded-lg border border-green-700 px-6 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-green-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-700/20 transition hover:bg-green-800"
              >
                Get Started
              </Link>

            </div>

          </nav>

        </div>

      </header>


      {/* =====================================================
          LOGIN PAGE
      ===================================================== */}

      <div className="flex min-h-[calc(100vh-76px)] items-center justify-center p-4 lg:p-6">

        <div className="relative min-h-[680px] w-full max-w-[1450px] overflow-hidden rounded-[34px] border border-white/80 bg-[#f8fcfb] shadow-[0_30px_90px_rgba(22,82,70,0.16)] lg:min-h-[calc(100vh-100px)]">

          {/* BACKGROUND GLOW */}

          <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-emerald-200/30 blur-[100px]" />

          <div className="pointer-events-none absolute -bottom-40 right-0 h-[500px] w-[500px] rounded-full bg-teal-200/25 blur-[100px]" />

          <div className="relative z-10 grid h-full lg:grid-cols-[1.08fr_0.92fr]">

            {/* =====================================================
                LEFT SIDE
            ===================================================== */}

            <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#d5f3eb] via-[#e7f8f4] to-[#f1fbf8] lg:flex lg:flex-col">

              <div className="absolute -left-24 top-20 h-[360px] w-[360px] rounded-full bg-emerald-200/25 blur-[70px]" />

              <div className="absolute -bottom-24 -right-24 h-[360px] w-[360px] rounded-full border border-emerald-200/50" />

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

              {/* IMAGE AREA */}

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

                  <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2.5 shadow-[0_12px_30px_rgba(30,100,85,0.15)] backdrop-blur-md">

                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">

                      <Sparkles size={14} />

                    </div>

                    <span className="whitespace-nowrap text-[11px] font-semibold text-slate-700">
                      Smarter healthcare, connected
                    </span>

                  </div>

                </div>

                {/* LEFT FLOATING CARD */}

                <div className="absolute left-8 top-[43%] z-20 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_15px_35px_rgba(30,100,85,0.12)] backdrop-blur-lg">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">

                    <Sparkles size={18} />

                  </div>

                  <div>

                    <p className="text-xs font-bold text-slate-800">
                      AI Health Insights
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Personalized for you
                    </p>

                  </div>

                </div>

                {/* RIGHT FLOATING CARD */}

                <div className="absolute right-8 top-[25%] z-20 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_15px_35px_rgba(30,100,85,0.12)] backdrop-blur-lg">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-500">

                    <ShieldCheck size={18} />

                  </div>

                  <div>

                    <p className="text-xs font-bold text-slate-800">
                      Secure & Private
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Your data stays protected
                    </p>

                  </div>

                </div>

              </div>

              {/* BOTTOM CONTENT */}

              <div className="relative z-20 px-12 pb-9">

                <h1 className="max-w-[560px] text-[36px] font-bold leading-[1.12] tracking-tight text-slate-800">

                  Healthcare that{" "}

                  <span className="text-emerald-500">
                    understands you.
                  </span>

                </h1>

                <p className="mt-3 max-w-[540px] text-[13px] leading-6 text-slate-500">

                  Stay connected with your health, manage your care,
                  and receive intelligent insights designed around
                  your healthcare journey.

                </p>

                <div className="mt-4 flex items-center gap-6">

                  <div className="flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-emerald-400" />

                    <span className="text-[11px] font-medium text-slate-500">
                      Smart Health Monitoring
                    </span>

                  </div>

                  <div className="flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-teal-400" />

                    <span className="text-[11px] font-medium text-slate-500">
                      AI-Powered Assistance
                    </span>

                  </div>

                </div>

              </div>

            </section>


            {/* =====================================================
                RIGHT SIDE
            ===================================================== */}

            <section className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#f9fdfc] via-[#f4fbf9] to-[#edf8f5] px-6 py-8 sm:px-10 lg:px-14">

              <div className="pointer-events-none absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-emerald-100/50 blur-[80px]" />

              <div className="pointer-events-none absolute -bottom-40 -left-32 h-[400px] w-[400px] rounded-full bg-teal-100/40 blur-[80px]" />

              <div className="relative z-10 w-full max-w-[460px]">

                {/* MOBILE LOGO */}

                <div className="mb-7 flex items-center gap-3 lg:hidden">

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

                <div className="mb-6">

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/70 px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm">

                    <Sparkles size={13} />

                    Welcome back

                  </div>

                  <h1 className="text-[32px] font-bold tracking-tight text-slate-900">
                    Sign in to continue
                  </h1>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Access your personalized healthcare experience.
                  </p>

                </div>

                {/* ROLE */}

                <div className="mb-5">

                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Continue as
                  </p>

                  <div className="grid grid-cols-2 gap-3">

                    {/* PATIENT */}

                    <button
                      type="button"
                      onClick={() => setRole("patient")}
                      className={`group relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
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

                        <UserRound size={19} />

                      </div>

                      <div>

                        <p className="text-sm font-bold text-slate-800">
                          Patient
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Manage your health
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
                      className={`group relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200 ${
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

                        <Stethoscope size={19} />

                      </div>

                      <div>

                        <p className="text-sm font-bold text-slate-800">
                          Doctor
                        </p>

                        <p className="mt-0.5 text-[10px] text-slate-400">
                          Manage your patients
                        </p>

                      </div>

                      {role === "doctor" && (
                        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-teal-500" />
                      )}

                    </button>

                  </div>

                </div>

                {/* FORM CARD */}

                <div className="rounded-[26px] border border-white/80 bg-white/75 p-5 shadow-[0_20px_55px_rgba(20,80,70,0.10)] backdrop-blur-xl sm:p-6">

                  {/* ERROR */}

                  {error && (
                    <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-center text-xs font-semibold text-red-500">
                      {error}
                    </div>
                  )}

                  {/* EMAIL */}

                  <div className="mb-4">

                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      Email address
                    </label>

                    <div className="group flex h-[51px] items-center rounded-xl border border-slate-200 bg-[#f9fcfb] px-4 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100/60">

                      <Mail
                        size={17}
                        className="mr-3 shrink-0 text-slate-400 group-focus-within:text-emerald-500"
                      />

                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      />

                    </div>

                  </div>

                  {/* PASSWORD */}

                  <div>

                    <label className="mb-2 block text-xs font-bold text-slate-600">
                      Password
                    </label>

                    <div className="group flex h-[51px] items-center rounded-xl border border-slate-200 bg-[#f9fcfb] px-4 transition-all focus-within:border-emerald-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-100/60">

                      <Lock
                        size={17}
                        className="mr-3 shrink-0 text-slate-400 group-focus-within:text-emerald-500"
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
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="ml-2 text-slate-400 transition hover:text-emerald-500"
                      >

                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}

                      </button>

                    </div>

                  </div>

                  {/* LOGIN BUTTON */}

                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                    className="group mt-5 flex h-[53px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-[0_12px_25px_rgba(16,185,129,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(16,185,129,0.30)] disabled:cursor-not-allowed disabled:opacity-70"
                  >

                    {loading
                      ? "Signing in..."
                      : `Sign in as ${
                          role === "patient"
                            ? "Patient"
                            : "Doctor"
                        }`}

                    {!loading && (
                      <ArrowRight
                        size={18}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    )}

                  </button>

                </div>

                {/* REGISTER */}

                <p className="mt-5 text-center text-sm text-slate-500">

                  Don't have an account?{" "}

                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="font-bold text-emerald-600 transition hover:text-emerald-700"
                  >
                    Create an account
                  </button>

                </p>

                {/* SECURITY */}

                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-400">

                  <ShieldCheck
                    size={14}
                    className="text-emerald-500"
                  />

                  Your healthcare information is securely protected

                </div>

              </div>

            </section>

          </div>

        </div>

      </div>


      {/* =====================================================
          LOGIN SUCCESS POPUP
      ===================================================== */}

      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/25 px-4 backdrop-blur-sm">

          <div className="w-full max-w-[360px] rounded-[24px] border border-white/80 bg-white p-6 text-center shadow-[0_25px_80px_rgba(15,60,50,0.20)]">

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

            {/* SUCCESS TITLE */}

            <h2 className="mt-4 text-[20px] font-bold text-slate-800">
              Login Successful
            </h2>

            {/* USERNAME */}

            <p className="mt-1.5 text-sm font-medium text-emerald-600">
              Welcome back,{" "}
              {auth.currentUser?.displayName ||
                formData.email.split("@")[0]}
              !
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Redirecting you to your dashboard...
            </p>

          </div>

        </div>
      )}

    </div>
  );
}