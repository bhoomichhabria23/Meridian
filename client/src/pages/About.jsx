import React from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Shield,
  Users,
  Brain,
  Zap,
  Award,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Heart,
      title: "Patient Safety First",
      description:
        "Every decision prioritizes patient safety and clinical outcomes through evidence-based insights.",
    },
    {
      icon: Shield,
      title: "Data Security",
      description:
        "HIPAA-compliant infrastructure with end-to-end encryption protecting sensitive healthcare data.",
    },
    {
      icon: Brain,
      title: "Clinical Intelligence",
      description:
        "Intelligent algorithms that learn from patterns to support better clinical decision-making.",
    },
    {
      icon: Zap,
      title: "Real-Time Insights",
      description:
        "Instant alerts and recommendations when it matters most, during patient care delivery.",
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
      number: "500K+",
      label: "Prescription Safety Checks",
    },
    {
      number: "50+",
      label: "Healthcare Institutions",
    },
    {
      number: "99.9%",
      label: "System Uptime",
    },
    {
      number: "10M+",
      label: "Patient Records Analyzed",
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
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                Home
              </Link>
              <Link
                to="/features"
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                Features
              </Link>
              <Link
                to="/how-it-works"
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                How It Works
              </Link>
              <Link to="/about" className="text-sm font-semibold text-green-700">
                About
              </Link>
              <Link
                to="/contact"
                className="text-sm text-slate-600 hover:text-green-700 transition"
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
              Transforming Healthcare with Clinical Intelligence
            </h1>
            <p className="text-xl text-slate-600 leading-8">
              MERIDIAN was founded on a simple belief: clinicians should have
              intelligent systems that help them make safer, evidence-based
              decisions every single day. We're building the future of clinical
              decision support.
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
              Safety Through Intelligence
            </h2>
            <p className="text-lg text-slate-600 leading-8 mb-6">
              We empower healthcare providers with real-time clinical
              intelligence that prevents medication errors, identifies risks
              before they become problems, and supports evidence-based
              decision-making.
            </p>
            <ul className="space-y-4">
              {[
                "Prevent prescription-related adverse events",
                "Reduce clinical decision-making time",
                "Improve patient outcomes and safety",
                "Support evidence-based medicine",
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
              Every Clinician Has a Guardian
            </h2>
            <p className="text-lg text-slate-600 leading-8 mb-6">
              We envision a world where every healthcare provider has access to
              intelligent, real-time clinical support that catches risks early,
              supports better decisions, and ultimately saves lives.
            </p>
            <ul className="space-y-4">
              {[
                "Accessible to all healthcare settings",
                "Trusted by clinicians worldwide",
                "Constantly learning and improving",
                "Setting the standard for clinical safety",
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

      {/* VALUES SECTION */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-950 mb-4">
              Core Values Driving Our Work
            </h2>
            <p className="text-lg text-slate-600">
              These principles guide every decision we make
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition">
                  <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-green-700" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {value.title}
                  </h3>
                  <p className="text-slate-600 leading-7">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ACHIEVEMENTS */}
      <section className="max-w-[1400px] mx-auto px-8 lg:px-16 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-950 mb-4">
            Trusted by Healthcare Leaders
          </h2>
          <p className="text-lg text-slate-600">
            Making a measurable impact on patient safety
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {achievements.map((achievement, idx) => (
            <div
              key={idx}
              className="text-center p-8 rounded-2xl border border-green-100 hover:bg-green-50 transition"
            >
              <div className="text-4xl font-bold text-green-700 mb-2">
                {achievement.number}
              </div>
              <div className="text-slate-600 font-medium">
                {achievement.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TEAM SECTION */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-950 mb-4">
              Meet Our Leadership Team
            </h2>
            <p className="text-lg text-slate-600">
              Experts dedicated to advancing clinical intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition">
                <div className="text-6xl mb-4">{member.image}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-sm font-semibold text-green-700 mb-3">
                  {member.role}
                </p>
                <p className="text-sm text-slate-600">{member.expertise}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 py-20">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          ></div>
        </div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-16 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Clinical Practice?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Join healthcare leaders who are already using MERIDIAN to make
            safer, smarter clinical decisions every day.
          </p>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-green-700 font-bold shadow-2xl hover:bg-green-50 transition group"
          >
            Get Started with MERIDIAN
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                  <span className="text-lg font-bold">+</span>
                </div>
                <span className="font-bold text-lg">MERIDIAN</span>
              </div>
              <p className="text-slate-400">
                Clinical Intelligence for Safer Care
              </p>
            </div>
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Security"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers"],
              },
              {
                title: "Support",
                links: ["Documentation", "Contact", "Status"],
              },
            ].map((section, idx) => (
              <div key={idx}>
                <h3 className="font-bold mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <a
                        href="#"
                        className="text-slate-400 hover:text-white transition"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2024 MERIDIAN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}