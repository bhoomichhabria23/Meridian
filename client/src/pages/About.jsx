import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Heart,
  Shield,
  Users,
  Brain,
  Zap,
  Award,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Database,
  Clock,
} from "lucide-react";

export default function About() {
  const location = useLocation();
  const values = [
    {
      icon: Brain,
      title: "Longitudinal Analysis",
      description:
        "Transforms fragmented patient records into a structured time-ordered clinical timeline for comprehensive historical insights.",
    },
    {
      icon: Shield,
      title: "Drug Safety Intelligence",
      description:
        "Evaluates prescription risks using medication history, laboratory trends, allergies, and comorbidities to prevent adverse interactions.",
    },
    {
      icon: Zap,
      title: "Real-Time Decision Support",
      description:
        "Delivers drug interaction alerts, duplicate test detection, and overdue test reminders at the point of care.",
    },
    {
      icon: Heart,
      title: "Chronic Disease Monitoring",
      description:
        "Continuous lab trend analysis and lab anomaly detection for early disease progression identification.",
    },
  ];

  const team = [
    {
      name: "Dr. Sarah Chen",
      role: "Chief Medical Officer",
      expertise: "Internal Medicine, Clinical Informatics",
      image: "👩‍⚕️",
    },
    {
      name: "Dr. Michael Rodriguez",
      role: "Chief Technology Officer",
      expertise: "Healthcare Technology, AI/ML",
      image: "👨‍💻",
    },
    {
      name: "Dr. Emily Watson",
      role: "Clinical Safety Lead",
      expertise: "Pharmacology, Drug Interactions",
      image: "👩‍⚕️",
    },
    {
      name: "Dr. James Park",
      role: "Data Science Director",
      expertise: "Medical Data Analytics, Research",
      image: "👨‍🔬",
    },
  ];

  const achievements = [
    {
      number: "7",
      label: "Core Safety Capabilities",
    },
    {
      number: "OCR",
      label: "PDF Report Processing",
    },
    {
      number: "Real-Time",
      label: "Risk Decision Engine",
    },
    {
      number: "Multi-Layer",
      label: "Clinical Analysis",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-green-100">
        <div className="w-full px-8 lg:px-16">
          <nav className="h-[76px] flex items-center justify-between">
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

            <div className="hidden md:flex items-center gap-9">
              <Link
                to="/"
                className={`text-sm font-semibold transition ${location.pathname === "/" ? "text-green-700 border-b-2 border-green-700 pb-1" : "text-slate-600 hover:text-green-700"}`}
              >
                Home
              </Link>
              <Link
                to="/features"
                className={`text-sm font-semibold transition ${location.pathname === "/features" ? "text-green-700 border-b-2 border-green-700 pb-1" : "text-slate-600 hover:text-green-700"}`}
              >
                Features
              </Link>
              <Link
                to="/how-it-works"
                className={`text-sm font-semibold transition ${location.pathname === "/how-it-works" ? "text-green-700 border-b-2 border-green-700 pb-1" : "text-slate-600 hover:text-green-700"}`}
              >
                How It Works
              </Link>
              <Link 
                to="/about" 
                className={`text-sm font-semibold transition ${location.pathname === "/about" ? "text-green-700 border-b-2 border-green-700 pb-1" : "text-slate-600 hover:text-green-700"}`}
              >
                About
              </Link>
              <Link
                to="/contact"
                className={`text-sm font-semibold transition ${location.pathname === "/contact" ? "text-green-700 border-b-2 border-green-700 pb-1" : "text-slate-600 hover:text-green-700"}`}
              >
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-lg border border-green-700 text-green-700 text-sm font-semibold hover:bg-green-50 transition"
              >
                Login
              </Link>
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold shadow-lg shadow-green-700/20 hover:bg-green-800 transition"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[60vh] pt-[76px] overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="absolute -left-40 top-20 w-[500px] h-[500px] bg-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -right-40 bottom-0 w-[600px] h-[600px] bg-emerald-200/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-16 py-20">
          <div className="max-w-[800px]">
            <p className="text-sm font-bold tracking-[0.18em] text-green-700 uppercase mb-5">
              About MERIDIAN
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] text-slate-950 mb-6">
              Clinical Decision Engine for Prescription Safety
            </h1>
            <p className="text-xl text-slate-600 leading-8">
              MERIDIAN is a longitudinal clinical decision engine designed to solve
              fragmented patient data challenges. In many healthcare settings, patient
              information scattered across paper files and multiple providers leads to
              unsafe prescriptions and poor continuity of care. We transform this chaos
              into actionable clinical intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION & VISION */}
      <section className="max-w-[1400px] mx-auto px-8 lg:px-16 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-4 py-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-600"></div>
              <span className="text-sm font-semibold text-green-700">
                Our Mission
              </span>
            </div>
            <h2 className="text-4xl font-bold text-slate-950 mb-6">
              Solving Healthcare's Data Fragmentation
            </h2>
            <p className="text-lg text-slate-600 leading-8 mb-6">
              We organize patient history into a structured longitudinal timeline
              and apply intelligent analysis that detects drug interactions, tracks
              lab trends, identifies duplicate tests, and flags risks before they
              impact patient safety.
            </p>
            <ul className="space-y-4">
              {[
                "Prevent drug-drug and drug-disease interactions",
                "Reduce unnecessary diagnostic testing costs",
                "Enable chronic disease monitoring with lab trends",
                "Provide predictive risk assessment at point of care",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 py-2 mb-6">
              <div className="w-2 h-2 rounded-full bg-teal-600"></div>
              <span className="text-sm font-semibold text-teal-700">
                Our Vision
              </span>
            </div>
            <h2 className="text-4xl font-bold text-slate-950 mb-6">
              Longitudinal Intelligence for Every Clinician
            </h2>
            <p className="text-lg text-slate-600 leading-8 mb-6">
              We envision healthcare systems where fragmented patient records are
              a problem of the past. Every clinician, everywhere, has access to
              intelligent analysis that reveals patterns, prevents errors, and
              enables safer prescribing.
            </p>
            <ul className="space-y-4">
              {[
                "Decision-aware longitudinal framework for all data",
                "Automated red-flag risk summaries for rapid assessment",
                "Scalable architecture supporting diverse healthcare settings",
                "Accessible intelligence that transforms point-of-care decisions",
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PROBLEM vs SOLUTION */}
      <section className="bg-white py-20">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-950 mb-4">
              The Challenge We Solve
            </h2>
            <p className="text-lg text-slate-600">
              Fragmented healthcare data creates preventable risks
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* PROBLEM */}
            <div className="bg-red-50 border border-red-100 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-red-900">Traditional Systems</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Patient data scattered across paper and multiple systems",
                  "No visibility into medication history and past allergies",
                  "Missing context for clinical decision-making",
                  "High risk of drug interactions and adverse events",
                  "Duplicate and unnecessary diagnostic testing",
                  "Delayed detection of disease progression",
                  "No predictive alerts for chronic disease management",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-red-700 text-xs font-bold">✕</span>
                    </div>
                    <span className="text-red-800 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SOLUTION */}
            <div className="bg-green-50 border border-green-100 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-900">MERIDIAN</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Unified longitudinal patient timeline across all records",
                  "Complete medication history and allergy tracking",
                  "Rich clinical context for every decision point",
                  "Intelligent drug interaction and contraindication checking",
                  "Automatic duplicate test identification and prevention",
                  "Lab trend analysis for early risk detection",
                  "Predictive alerts and red-flag risk summaries",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-green-700 text-xs font-bold">✓</span>
                    </div>
                    <span className="text-green-800 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNICAL APPROACH */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-950 mb-4">
              How MERIDIAN Works
            </h2>
            <p className="text-lg text-slate-600">
              Multi-layer clinical analysis architecture
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Database,
                step: "1",
                title: "Data Integration",
                desc: "Consolidated patient records from multiple sources into MongoDB with structured schemas",
              },
              {
                icon: Brain,
                step: "2",
                title: "OCR Processing",
                desc: "Tesseract OCR extracts lab results from PDF reports and images into machine-readable format",
              },
              {
                icon: TrendingUp,
                step: "3",
                title: "Longitudinal Timeline",
                desc: "Time-ordered organization of diagnoses, medications, and lab results for pattern analysis",
              },
              {
                icon: AlertCircle,
                step: "4",
                title: "Decision Engine",
                desc: "Python-based analysis evaluates drug interactions, lab trends, duplicate tests, and risks",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-green-100">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-green-700 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">
                      Step {item.step}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-6">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* KEY CAPABILITIES */}
      <section className="bg-white py-20">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-950 mb-4">
              Core Capabilities
            </h2>
            <p className="text-lg text-slate-600">
              Seven critical features for safer clinical practice
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                num: "01",
                title: "Longitudinal Timeline",
                desc: "Structured time-ordered clinical history of diagnoses, medications, and lab results",
              },
              {
                num: "02",
                title: "Risk Simulation",
                desc: "Evaluate prescription risks before they reach patients using historical context",
              },
              {
                num: "03",
                title: "Drug Interactions",
                desc: "Comprehensive checking for drug-drug and drug-disease contraindications",
              },
              {
                num: "04",
                title: "Lab Trend Analysis",
                desc: "Monitor trends over time to detect early disease progression and abnormalities",
              },
              {
                num: "05",
                title: "Duplicate Detection",
                desc: "Automatically identify repeated tests to reduce unnecessary diagnostic costs",
              },
              {
                num: "06",
                title: "Overdue Reminders",
                desc: "Proactive alerts for chronic disease management based on testing intervals",
              },
              {
                num: "07",
                title: "Red-Flag Summary",
                desc: "Rapid risk assessment dashboard for clinical decision support at point of care",
              },
            ].map((cap, idx) => (
              <div key={idx} className="flex gap-6 pb-8 border-b border-slate-100 last:border-0">
                <div className="text-3xl font-bold text-green-700 shrink-0">
                  {cap.num}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-slate-600">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-950 mb-4">
              Core Values Driving Our Work
            </h2>
            <p className="text-lg text-slate-600">
              Founded on principles of clinical excellence and patient safety
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-green-50 hover:shadow-xl hover:border-green-200 transition duration-300">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7 text-green-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-slate-600 leading-7 text-sm">{value.description}</p>
                </div>
              );
            })}
          </div>
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