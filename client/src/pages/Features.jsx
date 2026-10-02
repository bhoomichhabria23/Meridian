import { BellRing, FileSearch, LineChart, ShieldAlert, Clock, AlertTriangle, TrendingUp, Eye, Zap, Database } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navLinks = [["Home", "/"], ["Features", "/features"], ["How It Works", "/how-it-works"], ["About", "/about"], ["Contact", "/contact"]];
const capabilities = [
  [ShieldAlert, "Prescription Safety", "Check proposed medication against allergies, comorbidities, previous prescriptions, and known interactions to prevent adverse drug events."],
  [LineChart, "Laboratory Intelligence", "See how key markers move over time instead of relying on a single isolated result. Detect trends and early disease progression."],
  [BellRing, "Preventive Reminders", "Keep overdue investigations and chronic disease monitoring visible at the right time with intelligent scheduling."],
  [FileSearch, "Duplicate Test Detection", "Reduce repeated diagnostics by making recent investigations easy to find and review, cutting unnecessary costs."],
  [TrendingUp, "Lab Trend Analysis", "Visualize historical lab value trends to identify abnormalities and disease progression patterns at a glance."],
  [AlertTriangle, "Red-Flag Risk Summary", "Get real-time alerts for high-risk prescriptions with clear clinical reasoning and actionable recommendations."],
  [Eye, "Longitudinal Timeline", "View complete patient history in chronological order - diagnoses, medications, lab results, and encounters at a glance."],
  [Zap, "Real-Time Decision Support", "Get instant clinical intelligence at the point of care with AI-powered prescription recommendations."]
];

function PublicNav() {
  return <header className="fixed left-0 right-0 top-0 z-50 border-b border-green-100 bg-white/90 backdrop-blur-md"><div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between px-6 lg:px-16"><Link to="/" className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-700 text-2xl font-bold text-white shadow-lg shadow-green-700/20">+</span><span><strong className="block text-[22px] leading-none tracking-tight text-green-900">MERIDIAN</strong><small className="mt-1 block text-[10px] text-slate-500">Clinical Intelligence for Safer Care</small></span></Link><nav className="hidden items-center gap-8 md:flex" aria-label="Public navigation">{navLinks.map(([label, path]) => <NavLink key={label} to={path} end={label === "Home"} className={({ isActive }) => `border-b-2 pb-1 text-sm font-semibold transition ${isActive ? "border-green-600 text-green-700" : "border-transparent text-slate-600 hover:border-green-300 hover:text-green-700"}`}>{label}</NavLink>)}</nav><div className="flex items-center gap-3"><Link to="/login" className="rounded-lg border border-green-700 px-5 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50">Login</Link><Link to="/register" className="hidden rounded-lg bg-green-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-700/20 transition hover:bg-green-800 sm:block">Get Started</Link></div></div></header>;
}

export default function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50/40 to-blue-50/20 text-slate-900">
      <PublicNav />
      
      {/* Hero Section */}
      <main className="px-6 pt-[150px] lg:px-16 pb-12">
        <section className="mx-auto max-w-6xl">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100/60 px-4 py-2 border border-green-200/50 mb-8">
              <span className="flex h-2 w-2 rounded-full bg-green-600"></span>
              <span className="text-xs font-semibold uppercase tracking-wide text-green-700">Powerful Features</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.2] tracking-tight text-slate-950 mb-6">
              Clinical Intelligence for <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 bg-clip-text text-transparent">Safer Care</span>
            </h1>
            
            <p className="max-w-3xl text-lg sm:text-xl text-slate-600 leading-relaxed mb-2">
              Everything Meridian does is designed to transform fragmented patient records into actionable clinical context. Make safer prescribing decisions with longitudinal insights powered by advanced analytics.
            </p>
          </div>
        </section>
      </main>

      {/* Main Features Grid - 8 Features */}
      <section className="px-6 py-16 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(([Icon, title, text], idx) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/50 backdrop-blur-sm p-8 transition-all duration-300 hover:border-green-300/50 hover:bg-white hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1"
              >
                {/* Top accent line */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-100 to-emerald-50 text-green-700 group-hover:from-green-200 group-hover:to-green-100 transition-colors duration-300">
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                
                {/* Content */}
                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  {title}
                </h3>
                
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {text}
                </p>
                
                {/* Corner accent */}
                <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-green-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Capabilities Section */}
      <section className="px-6 py-20 lg:px-16 bg-gradient-to-b from-slate-50/30 to-transparent">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-950 mb-4">
              Built for Modern Healthcare
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Meridian combines cutting-edge technology with clinical expertise to deliver intelligent decision support at the point of care.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Database,
                title: "Structured Data Integration",
                description: "Seamlessly aggregate patient data from multiple sources into a unified, structured format."
              },
              {
                icon: Zap,
                title: "AI-Powered Analytics",
                description: "Leverages machine learning to identify patterns, trends, and risks from longitudinal patient data."
              },
              {
                icon: Clock,
                title: "Real-Time Alerts",
                description: "Instant notifications for critical prescription risks and overdue preventive care at the moment of decision."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200/50 bg-white/50 backdrop-blur-sm p-8 hover:border-green-300/50 hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100/60 text-green-700 mb-4">
                  <item.icon size={22} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-6 py-20 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-950 mb-4">
              Clinical Impact & Benefits
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Proven outcomes for healthcare providers and their patients.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Safer Prescribing", items: ["Prevent drug-drug interactions", "Avoid allergic reactions", "Detect contraindications", "Reduce adverse events"] },
              { title: "Better Patient Outcomes", items: ["Early disease detection", "Optimized medication therapy", "Continuity of care", "Chronic disease monitoring"] },
              { title: "Operational Efficiency", items: ["Eliminate duplicate tests", "Reduce diagnostic costs", "Streamlined workflows", "Time savings per patient"] },
              { title: "Clinical Confidence", items: ["Evidence-based recommendations", "Historical context available", "Complete medication history", "Lab trend visualization"] }
            ].map((benefit) => (
              <div key={benefit.title} className="rounded-xl border border-slate-200/50 bg-white/50 backdrop-blur-sm p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-green-600" />
                  {benefit.title}
                </h3>
                <ul className="space-y-3">
                  {benefit.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-600">
                      <svg className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
