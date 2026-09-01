import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  MessageCircle,
  Share2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
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
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Here you would normally send to your backend
      console.log("Form submitted:", formData);

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        organization: "",
        message: "",
      });

      // Reset success message after 5 seconds
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
              <Link
                to="/about"
                className="text-sm text-slate-600 hover:text-green-700 transition"
              >
                About
              </Link>
              <Link to="/contact" className="text-sm font-semibold text-green-700">
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
      <section className="relative min-h-[50vh] pt-[76px] overflow-hidden bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="absolute -left-40 top-20 w-[500px] h-[500px] bg-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -right-40 bottom-0 w-[600px] h-[600px] bg-emerald-200/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-[1400px] mx-auto px-8 lg:px-16 py-16">
          <div className="max-w-[700px]">
            <p className="text-sm font-bold tracking-[0.18em] text-green-700 uppercase mb-5">
              Get in Touch
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold leading-[1.1] text-slate-950 mb-6">
              Let's Talk About MERIDIAN
            </h1>
            <p className="text-xl text-slate-600 leading-8">
              Have questions? Want to schedule a demo? Looking for partnership opportunities?
              We'd love to hear from you. Reach out to our team today.
            </p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-[1400px] mx-auto px-8 lg:px-16 py-20">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* CONTACT FORM */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-green-100 p-8 shadow-sm">
              <h2 className="text-3xl font-bold text-slate-950 mb-6">
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
                      Thank you for reaching out. We'll get back to you within 24 hours.
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

                {/* ORGANIZATION */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    placeholder="Hospital Name or Organization"
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
                    placeholder="Tell us how MERIDIAN can help your organization..."
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
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
              <h3 className="text-xl font-bold text-slate-950 mb-6">
                Direct Contact
              </h3>

              <div className="space-y-5">
                {/* EMAIL */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email</p>
                    <a
                      href="mailto:hello@meridian.health"
                      className="text-green-700 hover:text-green-800 transition"
                    >
                      hello@meridian.health
                    </a>
                  </div>
                </div>

                {/* PHONE */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Phone</p>
                    <a
                      href="tel:+18005551234"
                      className="text-green-700 hover:text-green-800 transition"
                    >
                      +1 (800) 555-1234
                    </a>
                  </div>
                </div>

                {/* ADDRESS */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Address</p>
                    <p className="text-slate-600 text-sm">
                      123 Healthcare Plaza
                      <br />
                      San Francisco, CA 94107
                      <br />
                      United States
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BUSINESS HOURS */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-950 mb-6">
                Business Hours
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Monday - Friday</span>
                  <span className="font-semibold text-slate-900">9 AM - 6 PM PT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Saturday</span>
                  <span className="font-semibold text-slate-900">10 AM - 4 PM PT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sunday</span>
                  <span className="font-semibold text-slate-900">Closed</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-200">
                For urgent inquiries, please call our emergency line during business hours.
              </p>
            </div>

            {/* SOCIAL LINKS */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-950 mb-6">Follow Us</h3>
              <div className="flex gap-3">
                {[
                  { Icon: Globe, href: "#", label: "Website" },
                  { Icon: MessageCircle, href: "#", label: "Chat" },
                  { Icon: Share2, href: "#", label: "Share" },
                ].map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-green-100 hover:text-green-700 transition"
                    title={label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-[1400px] mx-auto px-8 lg:px-16">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-950 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Can't find what you're looking for? Check our FAQ section
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              {
                q: "How long does implementation typically take?",
                a: "Our standard implementation takes 2-4 weeks depending on your organization's size and existing systems. We provide a dedicated implementation team throughout the process.",
              },
              {
                q: "Is MERIDIAN HIPAA compliant?",
                a: "Yes, MERIDIAN is fully HIPAA compliant with enterprise-grade security, end-to-end encryption, and regular security audits to protect patient data.",
              },
              {
                q: "Can MERIDIAN integrate with our existing EHR?",
                a: "MERIDIAN integrates seamlessly with most major EHR systems including Epic, Cerner, and others. Contact our team for specific integration details.",
              },
              {
                q: "What kind of training is provided?",
                a: "We provide comprehensive onboarding training, ongoing support, and access to our knowledge base. Our support team is available during business hours.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="font-bold text-slate-950 mb-3">{faq.q}</h3>
                <p className="text-slate-600 text-sm leading-7">{faq.a}</p>
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
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Our team is ready to help you transform your clinical practice with MERIDIAN.
          </p>

          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-green-700 font-bold shadow-2xl hover:bg-green-50 transition group"
          >
            Start Your Free Trial
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
