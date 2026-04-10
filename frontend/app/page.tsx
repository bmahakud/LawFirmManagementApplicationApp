"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useScroll, useMotionValueEvent } from "framer-motion";
import {
  Scale, ArrowRight, Play, Menu, X, Users, Brain, Calendar,
  CreditCard, Upload, FileSignature, Clock, Shield, Zap,
  CheckCircle, Star, ChevronRight, Building2, Briefcase,
  UserCheck, FileText, Gavel, Headphones, Lock,
  TrendingUp, Mail, MapPin,
} from "lucide-react";

/* ─────────────────────────────────────────
   DESIGN SYSTEM
   Primary:   #0e2340  (deep navy)
   Mid:       #1a3a5c
   Accent:    #c9a96e  (gold)
   Surface:   #f7f8fa
   ───────────────────────────────────────── */

// ── Sticky Scroll Visuals ─────────────────

function Visual1() {
  return (
    <motion.div
      key="v1"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-0 rounded-2xl overflow-hidden border border-[#0e2340]/10 bg-[#f7f8fa] p-7 shadow-xl shadow-[#0e2340]/5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#0e2340] flex items-center justify-center shadow-md">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-[#0e2340]">Team Overview</p>
          <p className="text-xs text-gray-400">Real-time visibility</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {/* Team rows */}
      {[
        { role: "Lawyers", count: 12, Icon: Briefcase, names: ["Sarah Chen", "Michael Torres", "Emily Davis", "+9"] },
        { role: "Paralegals", count: 6, Icon: UserCheck, names: ["Lisa Park", "David Kim", "Rachel Green"] },
      ].map(({ role, count, Icon, names }) => (
        <div key={role} className="bg-white rounded-xl border border-gray-100 p-4 mb-3 shadow-sm">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-[#0e2340]" />
              <span className="text-xs font-semibold text-gray-700">{role}</span>
            </div>
            <span className="text-xs font-bold text-[#0e2340] bg-[#0e2340]/8 px-2 py-0.5 rounded-full">{count}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {names.map((n) => (
              <span key={n} className="text-[11px] px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-full text-gray-600">{n}</span>
            ))}
          </div>
        </div>
      ))}

      {/* Utilization */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 mb-3">Workload Distribution</p>
        {[
          { dept: "Corporate", pct: 78, color: "#0e2340" },
          { dept: "Family Law", pct: 55, color: "#c9a96e" },
          { dept: "Litigation", pct: 92, color: "#1a3a5c" },
        ].map(({ dept, pct, color }) => (
          <div key={dept} className="flex items-center gap-3 mb-2">
            <span className="text-[11px] text-gray-500 w-20 shrink-0">{dept}</span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              />
            </div>
            <span className="text-[11px] font-semibold text-gray-600 w-7 text-right">{pct}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Visual2() {
  const lines = [
    { label: "Party A:", value: "Jennifer M. Alvarez" },
    { label: "Party B:", value: "Carlos R. Alvarez" },
    { label: "Filing:", value: "Petition for Dissolution" },
    { label: "Court:", value: "Superior Court, Dist. 4" },
  ];
  return (
    <motion.div
      key="v2"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-0 rounded-2xl overflow-hidden bg-gradient-to-br from-[#0a1a2e] via-[#0e2340] to-[#1a3a5c] p-7 shadow-2xl"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
          <Brain className="w-5 h-5 text-[#c9a96e]" />
        </div>
        <div>
          <p className="font-bold text-sm text-white">AI Draft Engine</p>
          <p className="text-xs text-white/40">OCR → Extract → Generate</p>
        </div>
      </div>

      {/* Step flow */}
      <div className="space-y-2.5 mb-4">
        {[
          { step: "01", label: "Document Uploaded", file: "complaint_scan.pdf", done: true },
          { step: "02", label: "OCR Extraction", progress: 100, done: true },
          { step: "03", label: "AI Drafting", progress: 68, done: false },
        ].map(({ step, label, file, progress, done }, i) => (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 * i }}
            className="bg-white/8 border border-white/10 rounded-xl p-3"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#c9a96e]">{step}</span>
                <span className="text-xs font-medium text-white/80">{label}</span>
                {file && <span className="text-[10px] text-white/40">{file}</span>}
              </div>
              {done && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            {progress !== undefined && (
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#c9a96e] to-[#e8c989]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Extracted fields */}
      <div className="bg-white/8 border border-white/10 rounded-xl p-3">
        <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2.5">Extracted Fields</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {lines.map(({ label, value }, i) => (
            <motion.div key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }}>
              <p className="text-[10px] text-white/40">{label}</p>
              <p className="text-xs font-medium text-white/90">{value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Visual3() {
  const events = [
    { day: 5, label: "Alvarez Hearing", type: "hearing" },
    { day: 12, label: "Miller Filing", type: "deadline" },
    { day: 18, label: "Torres Depo", type: "deposition" },
    { day: 24, label: "Johnson Trial", type: "trial" },
    { day: 28, label: "Payment Due", type: "payment" },
  ];
  const typeColors: Record<string, string> = {
    hearing: "bg-blue-500",
    deadline: "bg-red-500",
    deposition: "bg-purple-500",
    trial: "bg-[#0e2340]",
    payment: "bg-[#c9a96e]",
  };
  const allDays = Array.from({ length: 35 }, (_, i) => {
    const d = i - 3;
    return d < 1 || d > 31 ? null : d;
  });
  const today = 26;
  return (
    <motion.div
      key="v3"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-0 rounded-2xl overflow-hidden bg-white border border-gray-100 p-7 shadow-xl shadow-[#0e2340]/5"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-bold text-sm text-[#0e2340]">March 2025</p>
          <p className="text-xs text-gray-400">Hearings & Deadlines</p>
        </div>
        <Calendar className="w-4.5 h-4.5 text-[#0e2340]" />
      </div>

      {/* Cal grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center mb-4">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-[10px] text-gray-300 py-1">{d}</div>
        ))}
        {allDays.map((day, i) => {
          const evt = day ? events.find((e) => e.day === day) : null;
          return day === null ? (
            <div key={`e${i}`} />
          ) : (
            <div
              key={`d${day}`}
              className={`relative py-1 rounded-lg text-[11px] font-medium transition-all ${day === today
                  ? "bg-[#0e2340] text-white"
                  : evt
                    ? "bg-[#0e2340]/6 text-[#0e2340]"
                    : "text-gray-400 hover:bg-gray-50"
                }`}
            >
              {day}
              {evt && day !== today && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${typeColors[evt.type]}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming */}
      <div className="space-y-2">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Upcoming</p>
        {events.slice(0, 3).map(({ day, label, type }) => (
          <div key={day} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${typeColors[type]}`} />
            <span className="text-xs text-gray-700 flex-1">{label}</span>
            <span className="text-[11px] font-semibold text-[#0e2340]">Mar {day}</span>
          </div>
        ))}
      </div>

      {/* Pending payments */}
      <div className="mt-3 bg-[#0e2340]/5 rounded-xl p-3 border border-[#0e2340]/8">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[#0e2340]">Pending Payments</p>
          <CreditCard className="w-3.5 h-3.5 text-[#c9a96e]" />
        </div>
        <div className="space-y-1">
          {[
            { name: "Johnson — Retainer", amt: "$2,500" },
            { name: "Miller — Consultation", amt: "$450" },
          ].map(({ name, amt }) => (
            <div key={name} className="flex justify-between text-xs">
              <span className="text-gray-500">{name}</span>
              <span className="font-bold text-[#0e2340]">{amt}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeVisual, setActiveVisual] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // ── Scroll & Mouse Motion Values ──────────────────────────────────────────
  const featureSectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress: featureScrollY } = useScroll({
    target: featureSectionRef,
    offset: ["start start", "end end"]
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 80, damping: 20, mass: 0.8 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 80, damping: 20, mass: 0.8 });

  const rotateX = useTransform(smoothMouseY, [-200, 200], [5, -5]);
  const rotateY = useTransform(smoothMouseX, [-200, 200], [-5, 5]);
  const translateX = useTransform(smoothMouseX, [-200, 200], [-10, 10]);
  const translateY = useTransform(smoothMouseY, [-200, 200], [-10, 10]);

  // ── Sticky scroll: one ref per text section ──────────────────────────────
  const section1Ref = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const stickyRefs = [section1Ref, section2Ref, section3Ref];

  const { scrollY } = useScroll();
  const activeVisualRef = useRef(0);
  
  useMotionValueEvent(scrollY, "change", () => {
    let closestIndex = 0;
    let minDistance = Infinity;
    const center = window.innerHeight / 2;

    stickyRefs.forEach((ref, index) => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - center);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = index;
        }
      }
    });

    if (closestIndex !== activeVisualRef.current) {
      activeVisualRef.current = closestIndex;
      setActiveVisual(closestIndex);
    }
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visuals = [Visual1, Visual2, Visual3];
  const ActiveVisual = visuals[activeVisual];

  const features = [
    {
      icon: Users,
      label: "Firm Management",
      title: "Complete Firm Management",
      body: "Manage lawyers, paralegals, and clients from a single command center. Assign cases, balance workloads in real time, and ensure every client receives the focus they deserve.",
    },
    {
      icon: Brain,
      label: "AI Automation",
      title: "AI-Powered Document Automation",
      body: "Upload scanned documents — our AI extracts data via OCR and auto-generates petitions, motions, and filings. Lawyers review and finalize in minutes, not hours.",
    },
    {
      icon: Calendar,
      label: "Calendar & Billing",
      title: "Integrated Calendar & Payments",
      body: "Never miss a hearing. Built-in calendar syncs all court dates automatically. Clients pay invoices online, and every payment reconciles instantly with case files.",
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        :root {
          --navy: #0e2340;
          --navy-mid: #1a3a5c;
          --gold: #c9a96e;
          --gold-light: #e8c989;
          --surface: #f7f8fa;
        }

        body { font-family: 'DM Sans', sans-serif; }

        .font-serif { font-family: 'DM Serif Display', serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-22px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .animate-float { animation: float 7s ease-in-out infinite; }
        .animate-glow { animation: glow-pulse 4s ease-in-out infinite; }
        .animate-marquee { animation: marquee 28s linear infinite; }

        .card-hover {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px -12px rgba(14, 35, 64, 0.14);
        }

        .gold-underline {
          position: relative;
          display: inline-block;
        }
        .gold-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--gold), var(--gold-light));
          border-radius: 2px;
        }

        .noise-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
        }
      `}</style>

      {/* ── NAV ───────────────────────────────── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-400 ${scrolled
          ? "bg-white/96 backdrop-blur-2xl shadow-[0_1px_0_0_rgba(14,35,64,0.08)]"
          : "bg-transparent"
        }`}>
        <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ rotate: -5, scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-9 h-9 bg-[var(--navy)] rounded-xl flex items-center justify-center shadow-lg"
            >
              <Scale className="w-4.5 h-4.5 text-white" />
            </motion.div>
            <span className="font-bold text-xl tracking-tight text-[var(--navy)]">
              Ant<span className="text-[var(--gold)]">Legal</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <div className="flex gap-7 text-sm font-medium">
              {["Platform", "Features", "AI Capabilities", "Pricing"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="text-gray-500 hover:text-[var(--navy)] transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-[var(--gold)] group-hover:w-full transition-all duration-300 rounded-full" />
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-gray-100">

              <Link
                href="/login"
                className="bg-[var(--navy)] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[var(--navy-mid)] hover:shadow-lg hover:shadow-[var(--navy)]/20 transition-all"
              >
                Log In
              </Link>
            </div>
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-600">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100 px-6 py-5 space-y-4"
            >
              {["Platform", "Features", "AI Capabilities", "Pricing"].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="block text-sm font-medium text-gray-600 hover:text-[var(--navy)] py-1"
                  onClick={() => setMobileMenuOpen(false)}>{item}</a>
              ))}
              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                <Link href="/login" className="text-sm font-medium text-gray-600 text-center py-2">Log In</Link>
                <Link href="/register"
                  className="bg-[var(--navy)] text-white rounded-full text-center text-sm font-semibold py-3"
                  onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ──────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-28 pb-16 overflow-hidden noise-bg">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[var(--navy)]/6 to-transparent blur-3xl animate-float" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[var(--gold)]/8 to-transparent blur-3xl animate-float" style={{ animationDelay: "-3.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--navy)]/3 blur-3xl animate-glow" />
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.09]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0e2340" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 mb-8"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gold)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--gold)]" />
                </span>
                <span className="text-sm font-medium text-[var(--navy)]">AI-Powered Legal Management</span>
              </motion.div>

              <h1 className="font-serif text-5xl md:text-6xl lg:text-[64px] font-normal text-[var(--navy)] mb-6 leading-[1.08] tracking-[-0.5px]">
                Modern Law Firm
                <br />
                <span className="italic text-[var(--gold)]">Management</span>{" "}
                Suite
              </h1>

              <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-[480px]">
                The complete operating system for law firms. Manage clients, automate document drafting, track hearings, and streamline payments — all powered by advanced AI.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/register"
                  className="group bg-[var(--navy)] text-white px-8 py-4 rounded-full font-semibold text-base hover:bg-[var(--navy-mid)] hover:shadow-xl hover:shadow-[var(--navy)]/20 transition-all flex items-center justify-center gap-2.5"
                >
                  Contact Us
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="group border border-gray-200 bg-white text-gray-700 px-8 py-4 rounded-full font-semibold text-base hover:border-gray-300 hover:shadow-md transition-all flex items-center justify-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--navy)] flex items-center justify-center">
                    <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                  </div>
                  Watch Demo
                </button>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex -space-x-3">
                  {["A", "B", "C", "D"].map((l, i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--navy)] to-[var(--navy-mid)] border-2 border-white flex items-center justify-center text-[11px] font-bold text-white">
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[var(--gold)] text-[var(--gold)]" />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 font-medium">Trusted by 500+ law firms</p>
                </div>
              </div>
            </motion.div>

            {/* Right — Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 60, rotateY: -5 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Glow behind card */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--navy)]/15 to-[var(--gold)]/10 rounded-3xl blur-2xl -z-10" />

              <div className="rounded-2xl shadow-2xl overflow-hidden border border-gray-200 bg-white">
                {/* Browser chrome */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white rounded-md px-3 py-1 flex items-center gap-2">
                    <Lock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">dashboard.antlegal.com</span>
                  </div>
                </div>

                <div className="p-5 bg-[var(--surface)]">
                  {/* Top stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Active Cases", val: "23", delta: "+4" },
                      { label: "Pending Drafts", val: "8", delta: "-2" },
                      { label: "This Month", val: "$42k", delta: "+12%" },
                    ].map(({ label, val, delta }) => (
                      <div key={label} className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                        <p className="text-xl font-bold text-[var(--navy)]">{val}</p>
                        <p className={`text-[10px] font-semibold mt-0.5 ${delta.startsWith("+") ? "text-emerald-500" : "text-red-500"}`}>{delta}</p>
                      </div>
                    ))}
                  </div>

                  {/* Hearings */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-700">Upcoming Hearings</p>
                      <span className="text-[10px] text-[var(--navy)] font-semibold bg-[var(--navy)]/8 px-2 py-0.5 rounded-full">3 this week</span>
                    </div>
                    {[
                      { name: "Johnson v. State", date: "Mar 28", tag: "Trial", color: "bg-[var(--navy)] text-white" },
                      { name: "Estate of Miller", date: "Apr 5", tag: "Hearing", color: "bg-blue-50 text-blue-700" },
                      { name: "Alvarez v. Alvarez", date: "Apr 9", tag: "Depo", color: "bg-purple-50 text-purple-700" },
                    ].map(({ name, date, tag, color }) => (
                      <div key={name} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${color}`}>{tag}</span>
                          <span className="text-xs text-gray-600">{name}</span>
                        </div>
                        <span className="text-xs font-semibold text-[var(--navy)]">{date}</span>
                      </div>
                    ))}
                  </div>

                  {/* Revenue mini chart */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-700">Revenue</p>
                      <span className="text-[10px] text-emerald-600 font-semibold">↑ 18% vs last month</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-12">
                      {[30, 55, 40, 70, 50, 85, 65, 90, 72, 95, 80, 100].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.4 }}
                          style={{ height: `${h}%` }}
                          className={`flex-1 rounded-sm origin-bottom ${i === 11 ? "bg-[var(--gold)]" : "bg-[var(--navy)]/10"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── LOGO MARQUEE ─────────────────────── */}
      <div className="py-10 border-y border-gray-100 bg-white overflow-hidden">
        <div className="flex animate-marquee gap-16 whitespace-nowrap">
          {[...Array(2)].map((_, pass) =>
            ["Morrison & Co.", "Chen Legal Group", "Torres Law", "Davis & Associates", "Wright Partners", "Summit Legal", "Pacific Counsel", "Apex Law Group"].map((firm) => (
              <span key={`${pass}-${firm}`} className="text-sm font-semibold text-gray-300 tracking-wide uppercase">{firm}</span>
            ))
          )}
        </div>
      </div>

      {/* ── STATS ─────────────────────────────── */}
      <section className="py-20 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Law Firms", icon: Building2, sub: "Across 12 countries" },
              { value: "10k+", label: "Cases Managed", icon: Gavel, sub: "Monthly active" },
              { value: "99.9%", label: "Uptime SLA", icon: Shield, sub: "Guaranteed" },
              { value: "4.9★", label: "Customer Rating", icon: Star, sub: "From 2,400 reviews" },
            ].map(({ value, label, icon: Icon, sub }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-[var(--navy)]/8 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-[var(--navy)]" />
                </div>
                <p className="font-serif text-3xl font-normal text-[var(--navy)] mb-0.5">{value}</p>
                <p className="text-sm font-semibold text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STICKY SCROLL FEATURES ────────────── */}
      <section ref={featureSectionRef} className="bg-white" id="features">
        <div className="max-w-7xl mx-auto px-6 py-24">
          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)] mb-3">Core Platform</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[var(--navy)] mb-4 font-normal leading-tight">
              Everything You Need to{" "}
              <span className="italic">Run Your Firm</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              A complete suite of tools designed specifically for modern law practices
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-20 lg:gap-28">

            {/* LEFT — sticky visual */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                {/* Indicator dots */}
                <div className="flex gap-2 mb-5">
                  {features.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => stickyRefs[i].current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                      className={`h-1.5 rounded-full transition-all duration-400 ${activeVisual === i ? "w-8 bg-[var(--gold)]" : "w-3 bg-gray-200 hover:bg-gray-300"}`}
                    />
                  ))}
                </div>

                {/* Visual card container */}
                <div className="relative h-[500px]">
                  <div className="w-full h-full">
                    <motion.div
                      style={{ rotateX, rotateY, translateX, translateY }}
                      className="w-full h-full"
                      onMouseMove={(e) => {
                        if (window.innerWidth < 1024) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        mouseX.set(e.clientX - centerX);
                        mouseY.set(e.clientY - centerY);
                      }}
                      onMouseLeave={() => {
                        if (window.innerWidth < 1024) return;
                        mouseX.set(0);
                        mouseY.set(0);
                      }}
                    >
                      <AnimatePresence mode="wait">
                        <ActiveVisual key={activeVisual} />
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT — scrolling text */}
            {/* pb-[50vh] ensures the last section can scroll to the viewport
                midpoint so the IntersectionObserver stripe can catch it */}
            <div className="pb-[50vh]">
              {features.map((feat, i) => {
                const Icon = feat.icon;
                const isActive = activeVisual === i;
                return (
                  <div
                    key={feat.label}
                    ref={stickyRefs[i]}
                    className={`transition-all duration-600 ${i < features.length - 1 ? "mb-40" : ""}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 32 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className={`transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-25"}`}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold)] mb-3">
                        {String(i + 1).padStart(2, "0")} — {feat.label}
                      </p>

                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${isActive ? "bg-[var(--navy)] shadow-xl shadow-[var(--navy)]/20" : "bg-gray-100"}`}>
                        <Icon className={`w-5.5 h-5.5 transition-colors duration-300 ${isActive ? "text-white" : "text-gray-400"}`} />
                      </div>

                      <h3 className="font-serif text-3xl md:text-4xl text-[var(--navy)] mb-4 font-normal leading-snug">
                        {feat.title}
                      </h3>
                      <p className="text-lg text-gray-500 leading-relaxed">{feat.body}</p>

                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="mt-6"
                        >
                          <Link
                            href="#"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--navy)] group"
                          >
                            Learn more
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </motion.div>
                      )}

                      {/* Mobile visual */}
                      <div className="lg:hidden mt-8 relative h-72 rounded-2xl overflow-hidden border border-gray-100 shadow-md bg-[var(--surface)]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Icon className="w-12 h-12 text-[var(--navy)]/20" />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI CAPABILITIES ──────────────────── */}
      <section className="py-24 bg-[var(--navy)] relative overflow-hidden" id="ai-capabilities">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--navy-mid)]/60 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--gold)]/5 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid2)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)] mb-3">Intelligence Layer</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 font-normal">
              Intelligent Legal AI
            </h2>
            <p className="text-lg text-white/50 max-w-xl mx-auto">
              Automate the tedious. Focus on what matters — winning cases.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Upload,
                num: "01",
                title: "OCR Data Extraction",
                body: "Upload scanned petitions, affidavits, or evidence. Our AI reads handwritten and printed text, extracts key parameters, and populates your case files automatically.",
              },
              {
                icon: FileSignature,
                num: "02",
                title: "Smart Draft Generation",
                body: "AI drafts petitions, motions, and legal briefs based on case details. Lawyers review, edit, and finalize with version control and collaboration tools.",
              },
              {
                icon: Clock,
                num: "03",
                title: "Automated Population",
                body: "Automatically fill court forms, client intake sheets, and legal templates with extracted data. Reduce manual entry errors and save hours of admin work.",
              },
            ].map(({ icon: Icon, num, title, body }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="group relative bg-white/5 border border-white/8 rounded-2xl p-8 hover:bg-white/8 hover:border-white/15 transition-all duration-300 card-hover"
              >
                <p className="font-serif text-5xl font-normal text-white/8 mb-4 select-none">{num}</p>
                <div className="w-11 h-11 rounded-xl bg-[var(--gold)]/15 border border-[var(--gold)]/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-[var(--gold)]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO PLATFORM GRID ──────────────── */}
      <section className="py-24 bg-white" id="platform">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)] mb-3">Full Suite</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[var(--navy)] mb-4 font-normal">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              From case management to client billing — all in one secure platform
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-5">
            {/* Client Portal — wide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 bg-[var(--surface)] rounded-2xl p-8 border border-gray-100 card-hover group"
            >
              <div className="w-11 h-11 bg-[var(--navy)]/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-[var(--navy)]" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--navy)] mb-2">Client Portal</h3>
              <p className="text-gray-500 mb-5 max-w-md">
                Give clients 24/7 access to case status, documents, invoices, and secure messaging. Reduce admin calls and increase transparency.
              </p>
              <Link href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--navy)] group-hover:gap-3 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Payments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--navy)] rounded-2xl p-8 text-white card-hover relative overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-[var(--gold)]/10" />
              <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center mb-4 relative z-10">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold mb-2 relative z-10">Integrated Payments</h3>
              <p className="text-white/60 text-sm mb-4 relative z-10">Accept cards, eChecks, and trust transfers. Automated invoicing & reconciliation.</p>
              <div className="flex items-center gap-2 text-xs text-[var(--gold)] font-semibold relative z-10">
                <Lock className="w-3 h-3" /> PCI Compliant
              </div>
            </motion.div>

            {/* Documents */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="bg-[var(--surface)] rounded-2xl p-8 border border-gray-100 card-hover"
            >
              <div className="w-11 h-11 bg-[var(--navy)]/10 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-[var(--navy)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--navy)] mb-2">Centralized Documents</h3>
              <p className="text-gray-500 text-sm mb-4">Secure cloud storage with version history, e-signatures, and role-based access controls.</p>
              <div className="flex flex-wrap gap-2">
                {["Version Control", "E-Signatures", "Role Access"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-100 rounded-full px-3 py-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" /> {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Analytics — wide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-gray-900 rounded-2xl p-8 text-white card-hover overflow-hidden relative"
            >
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                <div className="flex-1">
                  <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="w-5 h-5 text-[var(--gold)]" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Predictive Analytics</h3>
                  <p className="text-gray-400 mb-4 text-sm leading-relaxed">AI analyzes case outcomes, judge tendencies, and settlement patterns to help you build stronger legal strategies.</p>
                  <Link href="#" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--gold)] hover:gap-3 transition-all">
                    Explore Insights <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="flex-1 bg-black/30 border border-white/10 rounded-xl p-5 font-mono text-xs">
                  <div className="flex gap-1.5 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <div className="space-y-1.5 text-gray-300">
                    <p><span className="text-purple-400">const</span> result = <span className="text-[var(--gold)]">predictOutcome</span>{"({"}</p>
                    <p className="pl-4">caseType: <span className="text-emerald-400">"Civil Litigation"</span>,</p>
                    <p className="pl-4">judge: <span className="text-emerald-400">"Hon. Morrison"</span>,</p>
                    <p className="pl-4">priorCases: <span className="text-blue-400">142</span></p>
                    <p>{"});"}</p>
                    <p className="mt-2 text-emerald-400">{"// → Success Rate: 78%"}</p>
                    <p className="text-emerald-400">{"// → Recommended: Settle"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────── */}
      <section className="py-24 bg-[var(--surface)]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)] mb-3">Client Stories</p>
            <h2 className="font-serif text-4xl md:text-5xl text-[var(--navy)] mb-4 font-normal">
              Trusted by Leading Law Firms
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Chen, Esq.",
                role: "Managing Partner, Chen & Associates",
                content: "AntLegal transformed how we run our practice. Everything is streamlined — our productivity has increased by 40% since we switched.",
                rating: 5,
                highlight: "40% productivity increase",
              },
              {
                name: "Michael Torres",
                role: "Partner, Torres Law Group",
                content: "The AI document drafting is a game-changer. What used to take hours now takes minutes. Our clients love the portal access to their case files.",
                rating: 5,
                highlight: "Hours reduced to minutes",
              },
              {
                name: "Emily Davis",
                role: "Senior Associate, Davis Legal",
                content: "The calendar and hearing tracking ensures we never miss a deadline. The payment integration has reduced our A/R by 60%.",
                rating: 5,
                highlight: "60% reduction in A/R",
              },
            ].map(({ name, role, content, rating, highlight }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-7 border border-gray-100 card-hover flex flex-col"
              >
                <div className="flex gap-0.5 mb-5">
                  {[...Array(rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[var(--gold)] text-[var(--gold)]" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed mb-5 flex-1 text-sm">"{content}"</p>
                <div className="border-t border-gray-50 pt-4">
                  <p className="text-xs font-bold text-[var(--gold)] mb-3">{highlight}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--navy)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--navy)]">{name}</p>
                      <p className="text-xs text-gray-400">{role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-[var(--navy)] rounded-3xl p-12 md:p-16 text-white relative overflow-hidden"
          >
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--navy-mid)] rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--gold)]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid3" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid3)" />
            </svg>

            <div className="relative z-10 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)] mb-4">Get Started Today</p>
              <h2 className="font-serif text-3xl md:text-5xl font-normal mb-5 leading-tight">
                Ready to Modernize<br />Your Law Firm?
              </h2>
              <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
                Join hundreds of law firms that have transformed their practice with AntLegal
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Link
                  href="/register"
                  className="group bg-white text-[var(--navy)] px-9 py-4 rounded-full font-bold text-base hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                >
                  Contact Us
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="border-2 border-white/20 text-white px-9 py-4 rounded-full font-bold text-base hover:bg-white/8 hover:border-white/30 transition-all">
                  Schedule Demo
                </button>
              </div>
              <p className="text-xs text-white/30">No credit card required · 14-day free trial · Cancel anytime</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────── */}
      <footer className="bg-gray-950 text-gray-500">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-white/8 rounded-lg flex items-center justify-center">
                  <Scale className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-white">Ant<span className="text-[var(--gold)]">Legal</span></span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-5">
                The complete practice management platform for modern law firms. AI-powered, secure, and built for efficiency.
              </p>
              <div className="flex gap-3">
                {[
                  { label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                  { label: "Li", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.204 0 22.225 0z" },
                ].map(({ label, path }) => (
                  <a key={label} href="#" className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/8 rounded-lg flex items-center justify-center transition-colors group">
                    <svg className="w-3.5 h-3.5 fill-gray-500 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                      <path d={path} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "AI Capabilities", "Security", "Pricing", "Changelog"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Press", "Contact"],
              },
              {
                title: "Legal",
                links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"],
              },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 mb-4">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6">
              <p className="text-xs text-gray-600">© 2026 AntLegal Inc. All rights reserved.</p>
              <p className="text-xs text-gray-600">
                Powered by{' '}
                <a
                  href="http://anthemgt.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Anthem
                </a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-gray-600">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}