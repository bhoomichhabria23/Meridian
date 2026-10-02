import { ArrowRight, BrainCircuit, Check, CheckCircle2, Database, FileScan, LineChart, ShieldAlert, Stethoscope } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navLinks = [
  ["Home", "/"],
  ["Features", "/features"],
  ["How It Works", "/how-it-works"],
  ["About", "/about"],
  ["Contact", "/contact"],
];

const stages = [
  { Icon: Database, number: "01", title: "Connect the record", text: "Demographics, diagnoses, medications, encounters, and laboratory results are stored as one patient record." },
  { Icon: FileScan, number: "02", title: "Read every report", text: "PDFs and images are processed with OCR, then normalized into structured, usable clinical data." },
  { Icon: LineChart, number: "03", title: "Build the timeline", text: "Every event is organized chronologically so trends and changes are visible across visits." },
  { Icon: BrainCircuit, number: "04", title: "Evaluate the context", text: "The decision engine checks interactions, contraindications, duplicate tests, and overdue monitoring." },
  { Icon: Stethoscope, number: "05", title: "Review the next step", text: "Doctors receive prioritized signals and the supporting history needed for informed clinical review." },
];

function PublicNav() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[#dcebe1] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#147a43] text-2xl font-bold text-white shadow-lg shadow-[#147a43]/20">+</span>
          <span><strong className="block text-[19px] tracking-[0.14em] text-[#123e2a]">MERIDIAN</strong><small className="block text-[9px] uppercase tracking-wider text-[#789187]">Clinical intelligence</small></span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Public navigation">
          {navLinks.map(([label, path]) => <NavLink key={label} to={path} end={label === "Home"} className={({ isActive }) => `border-b-2 pb-1 text-sm font-semibold transition ${isActive ? "border-[#147a43] text-[#147a43]" : "border-transparent text-[#63766c] hover:text-[#147a43]"}`}>{label}</NavLink>)}
        </nav>
        <Link to="/login" className="rounded-lg border border-[#147a43] px-4 py-2.5 text-sm font-bold text-[#147a43] transition hover:bg-[#edf7ef]">Log in</Link>
      </div>
    </header>
  );
}

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#fbfdfb] text-[#17352a]">
      <PublicNav />
      <main className="pt-[76px]">
        <section className="overflow-hidden bg-[#123e2a] text-white">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-28">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a5d8b3]">How Meridian works</p>
              <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">From scattered records to a clearer next step.</h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#c3dfca]">Meridian turns disconnected medical information into a structured patient story, then brings the most important signals forward for clinical review.</p>
              <Link to="/features" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#147a43] transition hover:bg-[#edf7ef]">Explore the platform <ArrowRight size={16} /></Link>
            </div>
            <div className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between border-b border-white/15 pb-4"><span className="text-xs font-bold uppercase tracking-wider text-[#b5d5c0]">Meridian engine</span><span className="rounded-full bg-[#a5d8b3]/15 px-2.5 py-1 text-[10px] font-bold text-[#b9e7c4]">PROCESSING</span></div>
              <div className="space-y-3 py-5">
                {["Patient history connected", "Laboratory trend detected", "Prescription context checked"].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm"><CheckCircle2 size={17} className="text-[#a5d8b3]" /><span>{item}</span></div>)}
              </div>
              <div className="border-t border-white/15 pt-4"><div className="flex items-center justify-between text-xs text-[#b5d5c0]"><span>Clinical picture</span><span className="font-bold text-white">Ready for review</span></div><div className="mt-3 h-2 rounded-full bg-white/15"><div className="h-full w-[82%] rounded-full bg-[#a5d8b3]" /></div></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#147a43]">The clinical pipeline</p><h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-[#123e2a] sm:text-5xl">One connected workflow, from intake to insight.</h2><p className="mt-5 text-base leading-8 text-[#63766c]">Each stage removes a layer of uncertainty while keeping the clinician in control of the final decision.</p></div>
          <div className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            <div className="absolute left-10 right-10 top-10 hidden h-px bg-[#cfe5d5] lg:block" />
            {stages.map(({ Icon, number, title, text }) => <article key={number} className="relative rounded-2xl border border-[#dcebe1] bg-white p-6 shadow-[0_8px_24px_rgba(33,90,51,.04)] lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none"><div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-[#fbfdfb] bg-[#e4f4e7] text-[#147a43] shadow-sm"><Icon size={20} /></div><p className="mt-5 text-xs font-bold tracking-[0.18em] text-[#42a968]">{number}</p><h3 className="mt-2 text-lg font-bold text-[#17352a]">{title}</h3><p className="mt-3 text-sm leading-7 text-[#63766c]">{text}</p></article>)}
          </div>
        </section>

        <section className="border-y border-[#dcebe1] bg-[#f1f8f2]">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-24">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#147a43]">At the point of care</p><h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-[#123e2a]">The engine finds the signal. The clinician makes the call.</h2><p className="mt-5 leading-8 text-[#63766c]">Meridian is designed to support expertise, not replace it. Every alert is paired with the history and evidence needed for thoughtful review.</p></div>
            <div className="rounded-2xl border border-[#cfe5d5] bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between border-b border-[#e3eee6] pb-5"><div className="flex items-center gap-3"><ShieldAlert className="text-[#b07b2e]" size={22} /><span className="font-bold text-[#17352a]">Review recommended</span></div><span className="rounded-full bg-[#fff4df] px-2.5 py-1 text-[10px] font-bold text-[#9a6d2c]">1 SIGNAL</span></div><p className="mt-5 text-sm leading-7 text-[#63766c]">A current prescription may require renal function review based on a changing laboratory trend.</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-[#f4faf5] p-3"><p className="text-[10px] uppercase tracking-wider text-[#789187]">Evidence</p><p className="mt-2 text-sm font-bold">3 reports</p></div><div className="rounded-xl bg-[#f4faf5] p-3"><p className="text-[10px] uppercase tracking-wider text-[#789187]">Trend</p><p className="mt-2 text-sm font-bold">Changing</p></div><div className="rounded-xl bg-[#f4faf5] p-3"><p className="text-[10px] uppercase tracking-wider text-[#789187]">Action</p><p className="mt-2 text-sm font-bold text-[#147a43]">Review</p></div></div></div>
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
      </main>
    </div>
  );
}
