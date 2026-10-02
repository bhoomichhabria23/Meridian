import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldAlert, LineChart, BellRing, FileSearch, TrendingUp, AlertTriangle, Eye, Zap, Database, Clock, ArrowRight, Brain, Shield, Heart, Award, CheckCircle, AlertCircle, Users } from "lucide-react";

export default function Home() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  return (
    <div className="min-h-screen bg-white text-slate-900">

      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100">
        <div className="w-full px-8 lg:px-16">
          <nav className="h-[76px] flex items-center justify-between">

            {/* LOGO */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-700 flex items-center justify-center shadow-lg shadow-green-700/20">
                <span className="text-white text-2xl font-bold">+</span>
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

            {/* NAV LINKS */}
            <div className="hidden md:flex items-center gap-9">
              <Link
                to="/"
                className={`text-sm ${isAuthPage ? "font-bold" : "font-semibold"} transition ${location.pathname === "/" ? "text-green-700 border-b-2 border-green-600 pb-1" : "text-slate-600 hover:text-green-700"}`}
              >
                Home
              </Link>

              <Link
                to="/features"
                className={`text-sm ${isAuthPage ? "font-bold" : "font-semibold"} transition ${location.pathname === "/features" ? "text-green-700 border-b-2 border-green-600 pb-1" : "text-slate-600 hover:text-green-700"}`}
              >
                Features
              </Link>

              <Link
                to="/how-it-works"
                className={`text-sm ${isAuthPage ? "font-bold" : "font-semibold"} transition ${location.pathname === "/how-it-works" ? "text-green-700 border-b-2 border-green-600 pb-1" : "text-slate-600 hover:text-green-700"}`}
              >
                How It Works
              </Link>

              <Link
                to="/about"
                className={`text-sm ${isAuthPage ? "font-bold" : "font-semibold"} transition ${location.pathname === "/about" ? "text-green-700 border-b-2 border-green-600 pb-1" : "text-slate-600 hover:text-green-700"}`}
              >
                About
              </Link>

              <Link
                to="/contact"
                className={`text-sm ${isAuthPage ? "font-bold" : "font-semibold"} transition ${location.pathname === "/contact" ? "text-green-700 border-b-2 border-green-600 pb-1" : "text-slate-600 hover:text-green-700"}`}
              >
                Contact
              </Link>
            </div>

            {/* BUTTONS */}
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


      {/* HERO */}
      <main
        id="home"
        className="relative min-h-screen pt-[76px] overflow-hidden"
      >

        {/* BACKGROUND */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50"></div>

        {/* SUBTLE GRID */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(22,163,74,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(22,163,74,0.08) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        ></div>

        {/* GREEN GLOW */}
        <div className="absolute -left-40 top-1/3 w-[500px] h-[500px] bg-green-200/30 rounded-full blur-3xl"></div>

        <div className="absolute -right-40 bottom-0 w-[600px] h-[600px] bg-emerald-200/30 rounded-full blur-3xl"></div>


        {/* HERO CONTENT */}
        <div className="relative z-10 min-h-[calc(100vh-76px)] w-full px-8 lg:px-16 xl:px-24">

          <div className="max-w-[1500px] mx-auto min-h-[calc(100vh-76px)] grid lg:grid-cols-2 items-center gap-10 xl:gap-20">

            {/* LEFT */}
            <section className="max-w-[650px]">

              <p className="text-sm font-bold tracking-[0.18em] text-green-700 uppercase mb-5">
                Clinical Intelligence Platform
              </p>

              <h2 className="text-[46px] sm:text-[54px] xl:text-[62px] leading-[1.05] font-bold tracking-[-0.035em] text-slate-950">
                Turning Patient History
                <span className="block text-green-700">
                  Into Clinical Intelligence
                </span>
              </h2>

              <p className="mt-7 text-[17px] leading-8 text-slate-600 max-w-[600px]">
                MERIDIAN transforms fragmented medical records into meaningful
                clinical intelligence, helping doctors identify prescription
                risks, understand laboratory trends, and make safer
                evidence-based decisions.
              </p>


              {/* BUTTONS */}
              <div className="flex flex-wrap gap-4 mt-9">

                <Link
                  to="/register"
                  className="px-7 py-3.5 rounded-xl bg-green-700 text-white font-semibold shadow-xl shadow-green-700/20 hover:bg-green-800 hover:-translate-y-0.5 transition"
                >
                  Get Started
                  <span className="ml-3">→</span>
                </Link>

                <a
                  href="#features"
                  className="px-7 py-3.5 rounded-xl border border-green-600 text-green-700 font-semibold bg-white/70 backdrop-blur-sm hover:bg-green-50 transition"
                >
                  Explore MERIDIAN
                  <span className="ml-3">↓</span>
                </a>

              </div>


              {/* FEATURE HIGHLIGHTS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-10">

                <div>
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold mb-2">
                    +
                  </div>
                  <p className="font-semibold text-sm">
                    Prescription
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Safety alerts
                  </p>
                </div>

                <div>
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold mb-2">
                    ↗
                  </div>
                  <p className="font-semibold text-sm">
                    Lab Analysis
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Trend detection
                  </p>
                </div>

                <div>
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold mb-2">
                    ◷
                  </div>
                  <p className="font-semibold text-sm">
                    Preventive Care
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Timely reminders
                  </p>
                </div>

                <div>
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-green-700 font-bold mb-2">
                    ✓
                  </div>
                  <p className="font-semibold text-sm">
                    Better Care
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Clinical insights
                  </p>
                </div>

              </div>

            </section>


            {/* RIGHT IMAGE */}
            <section className="relative h-[560px] lg:h-[650px] flex items-center justify-center">

              {/* SOFT CIRCLE BEHIND IMAGE */}
              <div className="absolute w-[520px] h-[520px] xl:w-[620px] xl:h-[620px] rounded-full bg-green-100/70"></div>

              <div className="absolute w-[430px] h-[430px] xl:w-[520px] xl:h-[520px] rounded-full border border-green-200"></div>


              {/* IMAGE CONTAINER */}
              <div className="relative z-10 w-[420px] h-[520px] xl:w-[490px] xl:h-[600px] overflow-hidden rounded-[36px] border border-white shadow-[0_25px_70px_rgba(0,100,50,0.18)]">

                <img
                  src="/images/doctor.png"
                  alt="Doctor using MERIDIAN clinical intelligence platform"
                  className="w-full h-full object-cover object-center"
                />

              </div>

            </section>

          </div>

        </div>

      </main>


      {/* FEATURES SECTION */}
      <section id="features" className="bg-white py-24 px-8 lg:px-16 border-t border-green-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-sm font-bold tracking-widest text-green-700 uppercase mb-4">
              Powerful Features
            </p>
            <h2 className="text-5xl font-bold text-slate-950 mb-6">
              Clinical Intelligence for <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 bg-clip-text text-transparent">Safer Care</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Everything Meridian does is designed to transform fragmented patient records into actionable clinical context. Make safer prescribing decisions with longitudinal insights powered by advanced analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              [ShieldAlert, "Prescription Safety", "Check proposed medication against allergies, comorbidities, previous prescriptions, and known interactions to prevent adverse drug events."],
              [LineChart, "Laboratory Intelligence", "See how key markers move over time instead of relying on a single isolated result. Detect trends and early disease progression."],
              [BellRing, "Preventive Reminders", "Keep overdue investigations and chronic disease monitoring visible at the right time with intelligent scheduling."],
              [FileSearch, "Duplicate Test Detection", "Reduce repeated diagnostics by making recent investigations easy to find and review, cutting unnecessary costs."],
              [TrendingUp, "Lab Trend Analysis", "Visualize historical lab value trends to identify abnormalities and disease progression patterns at a glance."],
              [AlertTriangle, "Red-Flag Risk Summary", "Get real-time alerts for high-risk prescriptions with clear clinical reasoning and actionable recommendations."],
              [Eye, "Longitudinal Timeline", "View complete patient history in chronological order - diagnoses, medications, lab results, and encounters at a glance."],
              [Zap, "Real-Time Decision Support", "Get instant clinical intelligence at the point of care with AI-powered prescription recommendations."]
            ].map(([Icon, title, text], idx) => (
              <div key={title} className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/50 backdrop-blur-sm p-8 transition-all duration-300 hover:border-green-300/50 hover:bg-white hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 text-green-700 group-hover:from-green-200 group-hover:to-green-100 transition-colors duration-300">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
                <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-green-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-gradient-to-br from-slate-50 to-green-50/30 py-24 px-8 lg:px-16 border-t border-green-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-sm font-bold tracking-widest text-green-700 uppercase mb-4">
              The Clinical Pipeline
            </p>
            <h2 className="text-5xl font-bold text-slate-950 mb-6">
              One connected workflow, from intake to insight.
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl">
              Each stage removes a layer of uncertainty while keeping the clinician in control of the final decision.
            </p>
          </div>

          <div className="relative grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { Icon: Database, number: "01", title: "Connect the record", text: "Demographics, diagnoses, medications, encounters, and laboratory results are stored as one patient record." },
              { Icon: FileSearch, number: "02", title: "Read every report", text: "PDFs and images are processed with OCR, then normalized into structured, usable clinical data." },
              { Icon: LineChart, number: "03", title: "Build the timeline", text: "Every event is organized chronologically so trends and changes are visible across visits." },
              { Icon: Brain, number: "04", title: "Evaluate the context", text: "The decision engine checks interactions, contraindications, duplicate tests, and overdue monitoring." },
              { Icon: CheckCircle, number: "05", title: "Review the next step", text: "Doctors receive prioritized signals and the supporting history needed for informed clinical review." }
            ].map(({ Icon, number, title, text }) => (
              <div key={number} className="relative rounded-2xl border border-slate-200/50 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-white bg-green-100 text-green-700 shadow-sm">
                  <Icon size={20} />
                </div>
                <p className="mt-5 text-xs font-bold tracking-widest text-green-700">{number}</p>
                <h3 className="mt-3 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ABOUT SECTION */}
      <section id="about" className="bg-white py-24 px-8 lg:px-16 border-t border-green-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16 text-center">
            <p className="text-sm font-bold tracking-widest text-green-700 uppercase mb-4">
              About MERIDIAN
            </p>
            <h2 className="text-5xl font-bold text-slate-950 mb-6">
              A longitudinal approach to safer healthcare
            </h2>
            <p className="text-xl text-slate-600 leading-8 max-w-3xl mx-auto">
              MERIDIAN is designed to transform fragmented patient records into actionable clinical intelligence. Instead of viewing medical information as isolated records, the platform connects diagnoses, medications, laboratory results and encounters into a longitudinal view of the patient.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              { Icon: Brain, title: "Longitudinal Analysis", description: "Transforms fragmented patient records into a structured time-ordered clinical timeline for comprehensive historical insights." },
              { Icon: Shield, title: "Drug Safety Intelligence", description: "Evaluates prescription risks using medication history, laboratory trends, allergies, and comorbidities to prevent adverse interactions." },
              { Icon: Zap, title: "Real-Time Decision Support", description: "Delivers drug interaction alerts, duplicate test detection, and overdue test reminders at the point of care." },
              { Icon: Heart, title: "Chronic Disease Monitoring", description: "Continuous lab trend analysis and lab anomaly detection for early disease progression identification." }
            ].map(({ Icon, title, description }) => (
              <div key={title} className="rounded-xl border border-slate-200/50 bg-white/50 backdrop-blur-sm p-8 hover:border-green-300/50 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100/60 text-green-700 mb-4">
                  <Icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>


        </div>
      </section>


      {/* CTA SECTION */}
      <section className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-24 border-t border-green-100">
        <div className="max-w-6xl mx-auto px-8 lg:px-16 text-center">
          <h2 className="text-3xl font-bold text-slate-950 mb-4">
            Ready to Transform Patient Care?
          </h2>
          <p className="text-base text-slate-600 mb-10 max-w-2xl mx-auto">
            Join healthcare organizations using MERIDIAN to make safer clinical decisions with longitudinal patient intelligence.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-green-700 text-white font-bold shadow-lg shadow-green-700/30 hover:bg-green-800 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Get Started Today <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>




      {/* FOOTER */}
      <section
        id="contact"
        className="bg-green-800 text-white py-20 px-8 lg:px-16 border-t border-green-700"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* COMPANY INFO */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-lg">
                  <span className="text-green-800 text-lg font-bold">+</span>
                </div>
                <h3 className="text-2xl font-bold">MERIDIAN</h3>
              </div>
              <p className="text-green-100 text-sm leading-6">
                Clinical intelligence for safer, more informed healthcare decisions.
              </p>
            </div>

            {/* PRODUCT */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2 text-green-100 text-sm">
                <li><Link to="/features" className="hover:text-white transition">Features</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white transition">How It Works</Link></li>
                <li><Link to="/about" className="hover:text-white transition">About</Link></li>
              </ul>
            </div>

            {/* COMPANY */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2 text-green-100 text-sm">
                <li><Link to="/contact" className="hover:text-white transition">Contact Us</Link></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>

            {/* LEGAL */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2 text-green-100 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
          </div>

          {/* DIVIDER */}
          <div className="border-t border-green-700 pt-8 text-center">
            <p className="text-green-200 text-sm">
              &copy; 2024 MERIDIAN. All rights reserved.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}