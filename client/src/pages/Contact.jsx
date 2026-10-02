import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mail, Phone, MapPin, ArrowRight, CheckCircle, Clock, MessageCircle } from "lucide-react";

export default function Contact() {
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log("Form submitted:", formData);
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

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
                to="/register"
                className="px-6 py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold shadow-lg shadow-green-700/20 hover:bg-green-800 transition"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[45vh] pt-[76px] overflow-hidden bg-gradient-to-br from-green-100 via-green-50 to-emerald-100">
        <div className="absolute -left-40 top-20 w-[500px] h-[500px] bg-green-200/40 rounded-full blur-3xl"></div>
        <div className="absolute -right-40 bottom-0 w-[600px] h-[600px] bg-emerald-200/40 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-16 py-16">
          <div className="text-center">
            <p className="text-sm font-bold tracking-[0.18em] text-green-700 uppercase mb-5">
              Get in Touch
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] text-slate-950 mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-slate-600 leading-8 max-w-2xl mx-auto">
              Have questions about MERIDIAN? Our team is here to help. Reach out with any inquiries.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-[1400px] mx-auto px-8 lg:px-16 py-20">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* CONTACT FORM */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-3xl font-bold text-slate-950 mb-8">
                Send us a Message
              </h2>

              {submitted && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-sm text-green-800">
                      Thank you for reaching out. We'll get back to you shortly.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* NAME */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="John Doe"
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="john@example.com"
                  />
                </div>

                {/* SUBJECT */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="How can we help?"
                  />
                </div>

                {/* MESSAGE */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                    placeholder="Please tell us more about your inquiry..."
                  />
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 rounded-lg bg-green-700 text-white font-semibold shadow-lg shadow-green-700/20 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading ? "Sending..." : "Send Message"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              <p className="text-xs text-slate-500 text-center mt-6">
                We respect your privacy. Your information will be kept confidential.
              </p>
            </div>
          </div>

          {/* CONTACT INFO */}
          <div className="space-y-6">
            {/* DIRECT CONTACT */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl font-bold text-slate-950 mb-6">
                Contact Information
              </h3>

              <div className="space-y-6">
                {/* EMAIL */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Email</p>
                    <a href="mailto:support@meridian.health" className="text-green-700 hover:text-green-800 transition text-sm">
                      support@meridian.health
                    </a>
                  </div>
                </div>

                {/* PHONE */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Phone</p>
                    <a href="tel:+18005551234" className="text-green-700 hover:text-green-800 transition text-sm">
                      +1 (800) 555-1234
                    </a>
                  </div>
                </div>

                {/* ADDRESS */}
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-1">Address</p>
                    <p className="text-slate-600 text-sm">
                      Plot No. 1, MIDC Industrial Area
                      <br />
                      Pune, Maharashtra 411013, India
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BUSINESS HOURS */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-5 h-5 text-green-700" />
                <h3 className="text-xl font-bold text-slate-950">
                  Business Hours
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Mon - Fri</span>
                  <span className="font-semibold text-slate-900">9 AM - 6 PM IST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Saturday</span>
                  <span className="font-semibold text-slate-900">10 AM - 2 PM IST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sunday</span>
                  <span className="font-semibold text-slate-900">Closed</span>
                </div>
              </div>
            </div>

            {/* RESPONSE TIME */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-3">
                <MessageCircle className="w-5 h-5 text-green-700" />
                <h3 className="font-semibold text-slate-900">
                  Response Time
                </h3>
              </div>
              <p className="text-sm text-slate-600">
                We aim to respond to all inquiries within 24 business hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-20 border-t border-slate-200">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16 text-center">
          <h2 className="text-3xl font-bold text-slate-950 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto">
            Join healthcare organizations transforming patient care with MERIDIAN.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-green-700 text-white font-bold shadow-lg shadow-green-700/30 hover:bg-green-800 hover:shadow-xl hover:shadow-green-700/40 transition-all duration-300 transform hover:scale-105"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <section
        id="footer"
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
