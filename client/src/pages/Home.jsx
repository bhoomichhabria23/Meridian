import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
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
              <a
                href="#home"
                className="text-sm font-semibold text-green-700 border-b-2 border-green-600 pb-1"
              >
                Home
              </a>

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

              <a
                href="#about"
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                About
              </a>

              <a
                href="#contact"
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                Contact
              </a>
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
                to="/login"
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
                  to="/login"
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
      <section
        id="features"
        className="min-h-screen bg-white py-24 px-8 lg:px-16"
      >
        <div className="max-w-6xl mx-auto">

          <p className="text-sm font-bold tracking-widest text-green-700 uppercase text-center">
            What MERIDIAN Provides
          </p>

          <h2 className="text-4xl font-bold text-center mt-3 text-slate-900">
            Clinical intelligence built around the patient
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-14">

            <div className="p-8 rounded-2xl border border-green-100 bg-green-50/50">
              <h3 className="text-xl font-bold text-green-800">
                Prescription Safety
              </h3>
              <p className="text-slate-600 mt-3 leading-7">
                Evaluate prescriptions against medication history,
                allergies, laboratory abnormalities and potential
                interactions.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-green-100 bg-green-50/50">
              <h3 className="text-xl font-bold text-green-800">
                Laboratory Trends
              </h3>
              <p className="text-slate-600 mt-3 leading-7">
                Organize laboratory results chronologically and identify
                abnormal patterns across multiple visits.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-green-100 bg-green-50/50">
              <h3 className="text-xl font-bold text-green-800">
                Preventive Monitoring
              </h3>
              <p className="text-slate-600 mt-3 leading-7">
                Detect overdue investigations and provide reminders for
                ongoing chronic disease monitoring.
              </p>
            </div>

          </div>

        </div>
      </section>


      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="min-h-screen bg-green-50 py-24 px-8 lg:px-16"
      >
        <div className="max-w-6xl mx-auto">

          <p className="text-sm font-bold tracking-widest text-green-700 uppercase text-center">
            How It Works
          </p>

          <h2 className="text-4xl font-bold text-center mt-3">
            From medical records to clinical insight
          </h2>

          <div className="grid md:grid-cols-4 gap-6 mt-14">

            {[
              ["01", "Collect", "Patient records, medications and laboratory reports."],
              ["02", "Organize", "Build a chronological longitudinal patient timeline."],
              ["03", "Analyze", "Evaluate trends, interactions and prescription risks."],
              ["04", "Alert", "Present meaningful clinical insights to doctors."]
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="bg-white rounded-2xl p-7 border border-green-100"
              >
                <span className="text-green-600 font-bold text-sm">
                  {number}
                </span>

                <h3 className="text-xl font-bold mt-4">
                  {title}
                </h3>

                <p className="text-slate-600 leading-7 mt-3">
                  {text}
                </p>
              </div>
            ))}

          </div>

        </div>
      </section>


      {/* ABOUT */}
      <section
        id="about"
        className="min-h-[70vh] bg-white flex items-center px-8 lg:px-16 py-24"
      >
        <div className="max-w-5xl mx-auto text-center">

          <p className="text-sm font-bold tracking-widest text-green-700 uppercase">
            About MERIDIAN
          </p>

          <h2 className="text-4xl font-bold mt-3">
            A longitudinal approach to safer healthcare
          </h2>

          <p className="max-w-3xl mx-auto text-slate-600 leading-8 mt-7">
            MERIDIAN is designed to transform fragmented patient records
            into actionable clinical intelligence. Instead of viewing
            medical information as isolated records, the platform connects
            diagnoses, medications, laboratory results and encounters into
            a longitudinal view of the patient.
          </p>

        </div>
      </section>


      {/* CONTACT */}
      <section
        id="contact"
        className="bg-green-800 text-white py-20 px-8 lg:px-16"
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">

          <div>
            <h2 className="text-3xl font-bold">
              MERIDIAN
            </h2>

            <p className="text-green-100 mt-3 max-w-md">
              Clinical intelligence for safer, more informed healthcare
              decisions.
            </p>
          </div>

          <div>
            <p className="text-green-200 text-sm">
              Clinical Intelligence Platform
            </p>

            <p className="mt-2">
              Prescription Safety · Lab Analysis · Preventive Care
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}