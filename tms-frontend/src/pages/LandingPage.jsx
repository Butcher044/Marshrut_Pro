import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion'
import { ArrowRight, Hexagon, User, MapPin, Map, Crosshair, Navigation, Smartphone, Package, BarChart, Users } from 'lucide-react'
import useAuthStore from '../store/authStore.js'

export default function LandingPage() {
  return (
    <div
      className="min-h-[100dvh] w-full bg-slate-950 font-sans selection:bg-blue-500/30"
      style={{ fontFamily: 'Geist, "Cabinet Grotesk", "Plus Jakarta Sans", sans-serif' }}
    >
      <AttributionBar />
      <Navbar />
      <HeroSection />
      <TransportScrollSection />
      <MapIntegrationSection />
      <RolesBentoSection />
      <FooterStub />
    </div>
  )
}

// ── Thin attribution strip ──
function AttributionBar() {
  return (
    <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-center border-b border-white/[0.05] bg-slate-900/70 px-4 py-1 backdrop-blur-md">
      <p className="text-center text-[10px] leading-tight text-slate-500">
        <span className="sm:hidden">Учебный проект · Гизатулин Никита</span>
        <span className="hidden sm:inline">Учебный проект · Гизатулин Никита · Финансовый университет при Правительстве РФ</span>
      </p>
    </div>
  )
}

// ── Fluid Island Navigation ──
function Navbar() {
  const { user, isAuthenticated } = useAuthStore()
  const authed = isAuthenticated()

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      className="fixed left-3 right-3 top-8 z-50 sm:left-auto sm:right-auto sm:mx-auto sm:w-max sm:max-w-5xl sm:px-4 sm:top-9"
    >
      <div className="flex h-12 w-full items-center gap-3 rounded-full border border-white/10 bg-slate-950/60 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl sm:h-14 sm:gap-8 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
            <Hexagon className="h-4 w-4 fill-white text-white" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">Маршруты Про</span>
        </div>

        {/* Auth State */}
        <nav className="ml-auto flex items-center gap-2 border-l border-white/10 pl-3 sm:gap-4 sm:pl-8">
          {authed ? (
            <>
              <div className="hidden items-center gap-2 md:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white ring-1 ring-white/10">
                  {user?.firstName?.[0]?.toUpperCase() || <User className="h-3 w-3" />}
                </div>
                <span className="text-xs font-medium text-slate-300">{user?.firstName}</span>
              </div>
              <Link 
                to="/dashboard" 
                className="group flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-white/20 active:scale-95"
              >
                В кабинет
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-xs font-medium text-slate-300 transition-colors hover:text-white">
                Войти
              </Link>
              <Link 
                to="/register" 
                className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 active:scale-95"
              >
                Стать клиентом
              </Link>
            </>
          )}
        </nav>
      </div>
    </motion.header>
  )
}

// ── Block 1: Cinematic Hero Section ──
function HeroSection() {
  const { isAuthenticated } = useAuthStore()
  const authed = isAuthenticated()

  // Motion Physics
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.32, 0.72, 0, 1] },
    },
  }

  return (
    <section className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-slate-950 pt-28 sm:pt-20">
      {/* Abstract Background Glows */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute top-[-10%] h-[500px] w-[700px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute left-[10%] top-[40%] h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      {/* Physical Grain/Noise Texture Layer */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}
      />

      <div className="container relative z-20 mx-auto px-4 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto flex max-w-4xl flex-col items-center"
        >
          {/* Eyebrow Tag */}
          <motion.div
            variants={itemVariants}
            className="mb-5 sm:mb-8 flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-400">
              Система управления транспортом
            </span>
          </motion.div>

          {/* Primary Headline */}
          <motion.h1 
            variants={itemVariants} 
            className="mb-5 sm:mb-8 text-balance text-[2.15rem] sm:text-5xl font-bold leading-[1.08] tracking-tighter text-white md:text-7xl lg:text-[5.5rem]"
          >
            Умная логистика. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-500 bg-clip-text text-transparent">
              Полный контроль.
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p 
            variants={itemVariants} 
            className="mb-8 sm:mb-12 max-w-[38ch] sm:max-w-[60ch] text-balance text-sm sm:text-base leading-relaxed text-slate-400 md:text-xl"
          >
            Платформа для управления транспортом, которая думает за логиста.
            От приема заявки до выгрузки — в одном окне.
          </motion.p>

          {/* CTA Group */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-5 sm:flex-row">
            {authed ? (
              <Link 
                to="/dashboard" 
                className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] active:scale-[0.98]"
              >
                <span>Перейти в кабинет</span>
                {/* Nested Button-in-Button Icon */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </div>
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="group relative inline-flex items-center justify-center gap-3 rounded-full bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] active:scale-[0.98]"
                >
                  <span>Войти в систему</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </div>
                </Link>
                
                <Link 
                  to="/register" 
                  className="group relative inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-300 hover:bg-white/10 active:scale-[0.98]"
                >
                  Стать клиентом
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// ── Truck SVG with spinning wheels ──
function TruckSVG({ spinning = false }) {
  return (
    <svg viewBox="0 0 1000 285" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%', height: 'auto' }}>
      <style>{`
        .spinning-wheel {
          animation: spin 1.5s linear infinite;
          animation-play-state: ${spinning ? 'running' : 'paused'};
          transform-box: fill-box;
          transform-origin: center;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <defs>
        <pattern id="trailer-panels" width="40" height="180" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="180" stroke="#d1d5db" strokeWidth="1" />
          <circle cx="0" cy="10" r="1" fill="#9ca3af" />
          <circle cx="0" cy="170" r="1" fill="#9ca3af" />
        </pattern>
        <linearGradient id="window-glare" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="40%" stopColor="#334155" />
          <stop offset="60%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <g id="wheel-template">
          <circle cx="0" cy="0" r="32" fill="rgba(0,0,0,0.4)" />
          <circle cx="0" cy="0" r="30" fill="#1a1a1a" />
          <circle cx="0" cy="0" r="23" fill="#2b2b2b" stroke="#111" strokeWidth="1" />
          <circle cx="0" cy="0" r="18" fill="#e5e7eb" />
          <circle cx="0" cy="0" r="13" fill="#9ca3af" />
          <circle cx="0" cy="-9" r="2.5" fill="#374151" />
          <circle cx="0" cy="9" r="2.5" fill="#374151" />
          <circle cx="-9" cy="0" r="2.5" fill="#374151" />
          <circle cx="9" cy="0" r="2.5" fill="#374151" />
          <circle cx="-6.3" cy="-6.3" r="2.5" fill="#374151" />
          <circle cx="6.3" cy="6.3" r="2.5" fill="#374151" />
          <circle cx="-6.3" cy="6.3" r="2.5" fill="#374151" />
          <circle cx="6.3" cy="-6.3" r="2.5" fill="#374151" />
          <circle cx="0" cy="0" r="5" fill="#1f2937" />
          <circle cx="0" cy="0" r="2" fill="#d1d5db" />
        </g>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="500" cy="275" rx="460" ry="6" fill="rgba(0,0,0,0.3)" />

      {/* ─── TRAILER ─── */}
      <g>
        <rect x="50" y="50" width="620" height="180" fill="#f8f9fa" rx="2" />
        <rect x="50" y="50" width="620" height="180" fill="url(#trailer-panels)" rx="2" />
        <rect x="50" y="50" width="620" height="6" fill="#e5e7eb" />
        <rect x="50" y="220" width="620" height="10" fill="#cbd5e1" />
        <line x1="50" y1="225" x2="670" y2="225" stroke="#ef4444" strokeWidth="2" strokeDasharray="12, 12" />
        <line x1="56" y1="225" x2="670" y2="225" stroke="#f8fafc" strokeWidth="2" strokeDasharray="12, 12" />
        <rect x="50" y="230" width="620" height="12" fill="#1f2937" />
        <path d="M 110 242 L 260 242 L 260 250 L 110 250 Z" fill="#111827" />
        <path d="M 350 242 L 360 260 L 370 242 Z" fill="#374151" />
        <path d="M 370 242 L 380 260 L 390 242 Z" fill="#374151" />
        <rect x="45" y="230" width="10" height="25" fill="#374151" />
        <rect x="45" y="240" width="5" height="10" fill="#ef4444" />
      </g>

      {/* 5th wheel */}
      <path d="M 650 225 L 680 225 L 680 235 L 650 235 Z" fill="#374151" />

      {/* ─── TRACTOR ─── */}
      <g>
        <rect x="660" y="230" width="290" height="12" fill="#111827" />
        <rect x="830" y="235" width="60" height="25" fill="#cbd5e1" rx="10" />
        <rect x="840" y="235" width="4" height="25" fill="#64748b" />
        <rect x="876" y="235" width="4" height="25" fill="#64748b" />
        <rect x="680" y="30" width="12" height="80" fill="#e5e7eb" rx="2" />
        <rect x="682" y="30" width="4" height="80" fill="#ffffff" />
        <path d="M 670 230 L 670 60 C 720 50, 780 50, 810 110 L 830 140 L 920 150 C 940 155, 950 165, 955 185 L 960 230 Z" fill="#f8f9fa" />
        <path d="M 830 140 L 920 150 C 940 155, 950 165, 955 185 L 960 230 L 950 230 C 945 170, 920 160, 830 150 Z" fill="#e2e8f0" />
        <path d="M 780 120 L 780 230" stroke="#cbd5e1" strokeWidth="2" fill="none" />
        <path d="M 720 60 L 720 230" stroke="#cbd5e1" strokeWidth="2" fill="none" />
        <rect x="760" y="150" width="15" height="4" fill="#9ca3af" rx="2" />
        <polygon points="785,135 835,142 815,100 785,100" fill="url(#window-glare)" stroke="#334155" strokeWidth="2" />
        <rect x="735" y="90" width="30" height="45" fill="url(#window-glare)" rx="5" />
        <rect x="945" y="175" width="15" height="50" fill="#9ca3af" rx="2" />
        <line x1="950" y1="180" x2="950" y2="220" stroke="#475569" strokeWidth="1.5" />
        <line x1="955" y1="180" x2="955" y2="220" stroke="#475569" strokeWidth="1.5" />
        <rect x="950" y="195" width="8" height="15" fill="#fef08a" rx="2" />
        <path d="M 940 225 L 965 225 L 960 240 L 940 240 Z" fill="#d1d5db" />
      </g>

      {/* ─── WHEELS: outer <g> positions, inner .spinning-wheel rotates ─── */}
      <g transform="translate(150, 245)">
        <g className="spinning-wheel"><use href="#wheel-template" /></g>
      </g>
      <g transform="translate(225, 245)">
        <g className="spinning-wheel"><use href="#wheel-template" /></g>
      </g>
      <g transform="translate(710, 245)">
        <g className="spinning-wheel"><use href="#wheel-template" /></g>
      </g>
      <g transform="translate(785, 245)">
        <g className="spinning-wheel"><use href="#wheel-template" /></g>
      </g>
      <g transform="translate(915, 245)">
        <g className="spinning-wheel"><use href="#wheel-template" /></g>
      </g>
    </svg>
  )
}

// ── Block 2: Scrollytelling Transport Section ──
function TransportScrollSection() {
  const containerRef = useRef(null)
  const scrollTimerRef = useRef(null)
  const [wheelsSpinning, setWheelsSpinning] = useState(false)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  // Колёса крутятся только во время скролла
  useMotionValueEvent(scrollYProgress, "change", () => {
    setWheelsSpinning(true)
    clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => setWheelsSpinning(false), 200)
  })

  const truckX = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], ["-100vw", "-15vw", "15vw", "100vw"])
  const trailWidth = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], ["0%", "35%", "65%", "100%"])
  const textOpacity = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [0, 1, 1, 0])
  const textY = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], [40, 0, 0, -40])
  const textFilter = useTransform(scrollYProgress, [0.2, 0.4, 0.6, 0.8], ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"])
  return (
    <section ref={containerRef} className="relative h-[200vh] sm:h-[250vh] w-full bg-slate-950">
      <div className="sticky top-0 flex h-[100dvh] w-full flex-col overflow-hidden">

        {/* Текст — верхняя зона, не перекрывается фурой */}
        <div className="container relative z-20 mx-auto flex h-auto flex-col px-4 pt-20 sm:pt-24">
          <motion.div
            className="flex w-full max-w-xl flex-col items-start"
            style={{ opacity: textOpacity, y: textY, filter: textFilter }}
          >
            <div className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/50 px-4 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
                Live Tracking
              </span>
            </div>
            <h2 className="mb-4 sm:mb-6 text-balance text-[2rem] sm:text-5xl font-bold tracking-tighter text-white md:text-6xl lg:text-7xl">
              Никаких <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                потерянных рейсов.
              </span>
            </h2>
            <p className="text-balance text-sm sm:text-lg leading-relaxed text-slate-400">
              Вы всегда знаете, где ваш груз, кто за рулем и когда он прибудет. Полная прозрачность маршрута в реальном времени.
            </p>
          </motion.div>
        </div>

        {/* Полоса маршрута — выровнена с основанием фуры */}
        <div className="absolute left-0 top-[77%] w-full z-10 pointer-events-none">
          <div className="relative h-[2px] w-full bg-white/[0.03]">
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-blue-500/80 to-indigo-400/80"
              style={{ width: trailWidth, filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.7))' }}
            />
          </div>
          <div className="h-16 bg-gradient-to-b from-blue-950/10 to-transparent" />
        </div>

        {/* Фура — нижняя зона экрана */}
        <div className="absolute bottom-[22%] left-0 w-screen z-10 pointer-events-none">
          <motion.div style={{ x: truckX }}>
            <div className="flex justify-center">
              <div style={{ width: 'min(1000px, 90vw)' }}>
                <TruckSVG spinning={wheelsSpinning} />
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  )
}

// ── Block 3: Map Integration ──
function MapIntegrationSection() {
  const sectionRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  })

  const mapScale   = useTransform(scrollYProgress, [0, 0.2],    [0.94, 1])
  const textOpacity = useTransform(scrollYProgress, [0, 0.15],  [0, 1])
  const textY      = useTransform(scrollYProgress, [0, 0.15],   [40, 0])
  const pathLength = useTransform(scrollYProgress, [0.08, 0.52],[0, 1])
  const n1Opacity  = useTransform(scrollYProgress, [0.08, 0.17],[0, 1])
  const n2Opacity  = useTransform(scrollYProgress, [0.20, 0.29],[0, 1])
  const n3Opacity  = useTransform(scrollYProgress, [0.31, 0.40],[0, 1])
  const n4Opacity  = useTransform(scrollYProgress, [0.41, 0.50],[0, 1])
  const pinOpacity = useTransform(scrollYProgress, [0.50, 0.58],[0, 1])

  const routeD = "M 100,800 L 350,800 Q 400,800 400,750 L 400,550 Q 400,500 450,500 L 750,500 Q 800,500 800,450 L 800,250 Q 800,200 850,200 L 1150,200"

  return (
    <section ref={sectionRef} className="relative min-h-[130dvh] w-full overflow-hidden bg-slate-950 py-14 sm:py-24 lg:py-32">
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/8 blur-[120px]" />

      <div className="container mx-auto px-4">
        <motion.div
          className="mx-auto mb-8 sm:mb-16 flex max-w-3xl flex-col items-center text-center"
          style={{ opacity: textOpacity, y: textY }}
        >
          <div className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
            <Map className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Автоматическая маршрутизация</span>
          </div>
          <h2 className="mb-4 sm:mb-6 text-balance text-3xl sm:text-4xl font-bold tracking-tighter text-white md:text-5xl lg:text-6xl">
            Умные алгоритмы. <br /><span className="text-slate-500">Точное время.</span>
          </h2>
          <p className="text-balance text-sm sm:text-lg leading-relaxed text-slate-400">
            Интеграция с Яндекс Картами строит оптимальные пути, экономит топливо и рассчитывает точное время прибытия с учётом пробок.
          </p>
        </motion.div>

        <motion.div
          style={{ scale: mapScale }}
          className="mx-auto w-full max-w-5xl rounded-[2.5rem] border border-white/10 bg-slate-900/50 p-2 shadow-[0_0_50px_rgba(59,130,246,0.12)] backdrop-blur-xl"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-[calc(2.5rem-0.5rem)] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] md:aspect-video">

            {/* Map UI buttons */}
            <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-white backdrop-blur-md">
                <Navigation className="h-4 w-4" strokeWidth={1.5} />
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-white backdrop-blur-md">
                <Crosshair className="h-4 w-4" strokeWidth={1.5} />
              </div>
            </div>

            {/* Locations SVG */}
            <svg
              viewBox="0 0 1400 900"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="xMidYMid slice"
              style={{ backgroundColor: '#030811' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="loc-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="blur"/>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
                <filter id="loc-neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur1"/>
                  <feGaussianBlur stdDeviation="10" result="blur2"/>
                  <feMerge>
                    <feMergeNode in="blur2"/><feMergeNode in="blur1"/><feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="loc-route-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00a8ff"/>
                  <stop offset="50%" stopColor="#00d2ff"/>
                  <stop offset="100%" stopColor="#ffffff"/>
                </linearGradient>
                <linearGradient id="loc-callout-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0a192f" stopOpacity="0.95"/>
                  <stop offset="100%" stopColor="#020c1b" stopOpacity="0.95"/>
                </linearGradient>
                <symbol id="loc-node">
                  <circle cx="0" cy="0" r="12" fill="none" stroke="#00d2ff" strokeWidth="2" opacity="0.6"/>
                  <circle cx="0" cy="0" r="4" fill="#ffffff" filter="url(#loc-neon-glow)"/>
                </symbol>
              </defs>

              <g transform="translate(100, 150) scale(1, 0.65) rotate(-15) skewX(-20)">
                {/* Grid */}
                <g stroke="#09182b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M-200,200 L1600,200 M-200,400 L1600,400 M-200,600 L1600,600 M-200,800 L1600,800 M-200,1000 L1600,1000"/>
                  <path d="M200,-200 L200,1200 M400,-200 L400,1200 M600,-200 L600,1200 M800,-200 L800,1200 M1000,-200 L1000,1200 M1200,-200 L1200,1200"/>
                  <path d="M300,-200 L300,1200 M700,-200 L700,1200 M1100,-200 L1100,1200 M-200,300 L1600,300 M-200,700 L1600,700" stroke="#050e1a" strokeWidth="1.5"/>
                </g>

                {/* Route shadow track */}
                <path d={routeD} stroke="#002b4d" strokeWidth="18" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

                {/* Animated glow route */}
                <motion.path d={routeD} stroke="url(#loc-route-grad)" strokeWidth="8" fill="none"
                  strokeLinecap="round" strokeLinejoin="round" filter="url(#loc-neon-glow)" opacity="0.85"
                  style={{ pathLength }}
                />
                {/* Animated white highlight */}
                <motion.path d={routeD} stroke="#ffffff" strokeWidth="2.5" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ pathLength }}
                />

                {/* Node 1 + callout */}
                <motion.g style={{ opacity: n1Opacity }}>
                  <use href="#loc-node" x="100" y="800" />
                  <g transform="translate(100,800)" stroke="#00d2ff" strokeWidth="1.5" fill="none">
                    <path d="M0,0 L0,-60 Q0,-70 -10,-70 L-50,-70" strokeOpacity="0.6"/>
                    <circle cx="-50" cy="-70" r="3" fill="#00d2ff"/>
                    <rect x="-120" y="-85" width="60" height="30" rx="4" fill="url(#loc-callout-bg)" stroke="#00d2ff" strokeWidth="1"/>
                    <text x="-90" y="-64" fill="#ffffff" fontSize="14" fontWeight="500" textAnchor="middle" stroke="none">7 min</text>
                  </g>
                </motion.g>

                {/* Node 2 + callout */}
                <motion.g style={{ opacity: n2Opacity }}>
                  <use href="#loc-node" x="400" y="650" />
                  <g transform="translate(400,650)" stroke="#00d2ff" strokeWidth="1.5" fill="none">
                    <path d="M0,0 L0,-80 Q0,-90 10,-90 L40,-90" strokeOpacity="0.6"/>
                    <circle cx="40" cy="-90" r="3" fill="#00d2ff"/>
                    <rect x="50" y="-105" width="65" height="30" rx="4" fill="url(#loc-callout-bg)" stroke="#00d2ff" strokeWidth="1"/>
                    <text x="82" y="-84" fill="#ffffff" fontSize="14" fontWeight="500" textAnchor="middle" stroke="none">12 min</text>
                  </g>
                </motion.g>

                {/* Node 3 (no callout) */}
                <motion.g style={{ opacity: n3Opacity }}>
                  <use href="#loc-node" x="600" y="500" />
                </motion.g>

                {/* Node 4 + callout */}
                <motion.g style={{ opacity: n4Opacity }}>
                  <use href="#loc-node" x="800" y="350" />
                  <g transform="translate(800,350)" stroke="#00d2ff" strokeWidth="1.5" fill="none">
                    <path d="M0,0 L0,-70 Q0,-80 -10,-80 L-60,-80" strokeOpacity="0.6"/>
                    <circle cx="-60" cy="-80" r="3" fill="#00d2ff"/>
                    <rect x="-135" y="-95" width="65" height="30" rx="4" fill="url(#loc-callout-bg)" stroke="#00d2ff" strokeWidth="1"/>
                    <text x="-102" y="-74" fill="#ffffff" fontSize="14" fontWeight="500" textAnchor="middle" stroke="none">19 min</text>
                  </g>
                </motion.g>

                {/* Final pin + callout */}
                <g transform="translate(1150,200)">
                  <motion.g style={{ opacity: pinOpacity }}>
                    <circle cx="0" cy="0" r="20" fill="none" stroke="#00d2ff" strokeWidth="1.5" filter="url(#loc-soft-glow)"/>
                    <circle cx="0" cy="0" r="30" fill="none" stroke="#00a8ff" strokeWidth="0.5" opacity="0.5"/>
                    <g transform="translate(0,-50)">
                      <path d="M0,50 C15,30 25,10 25,-10 C25,-25 15,-35 0,-35 C-15,-35 -25,-25 -25,-10 C-25,10 -15,30 0,50 Z"
                            fill="#ffffff" filter="url(#loc-neon-glow)"/>
                      <circle cx="0" cy="-10" r="8" fill="#030811"/>
                      <circle cx="0" cy="-10" r="3" fill="#00d2ff"/>
                    </g>
                    <g stroke="#00d2ff" strokeWidth="1.5" fill="none">
                      <path d="M0,0 L0,-90 Q0,-100 10,-100 L50,-100" strokeOpacity="0.6"/>
                      <circle cx="50" cy="-100" r="3" fill="#00d2ff"/>
                      <rect x="60" y="-115" width="65" height="30" rx="4" fill="url(#loc-callout-bg)" stroke="#ffffff" strokeWidth="1" filter="url(#loc-soft-glow)"/>
                      <text x="92" y="-94" fill="#ffffff" fontSize="14" fontWeight="bold" textAnchor="middle" stroke="none">21 min</text>
                    </g>
                  </motion.g>
                </g>

              </g>
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ── Block 4: Roles Bento ──
function RolesBentoSection() {
  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.14 } },
  }
  const item = {
    hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.65, ease: [0.32, 0.72, 0, 1] } },
  }

  const barHeights = [55, 75, 60, 90, 70, 45, 80]
  const barDays    = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

  return (
    <section className="relative w-full border-t border-white/5 bg-slate-950 py-14 sm:py-24 lg:py-32">
      <div className="container mx-auto px-4">

        {/* Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          variants={stagger} className="mx-auto mb-10 sm:mb-20 flex max-w-2xl flex-col items-center text-center">
          <motion.div variants={item} className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Роли и прозрачность</span>
          </motion.div>
          <motion.h2 variants={item} className="mb-4 sm:mb-6 text-balance text-3xl sm:text-4xl font-bold tracking-tighter text-white md:text-5xl lg:text-6xl">
            Синхронизация <br /><span className="text-slate-500">всей команды.</span>
          </motion.h2>
          <motion.p variants={item} className="text-balance text-sm sm:text-lg leading-relaxed text-slate-400">
            Удобные кабинеты для каждого участника. Единое информационное поле без сломанного телефона.
          </motion.p>
        </motion.div>

        {/* Bento grid */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          variants={stagger}
          className="mx-auto grid max-w-6xl grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

          {/* ── Водитель ── */}
          <motion.div variants={item} className="group relative col-span-1 lg:col-span-1">
            <div className="relative flex h-full min-h-[340px] sm:min-h-[420px] flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950 p-5 sm:p-6 transition-all duration-500 hover:border-emerald-500/20 hover:shadow-[0_0_40px_rgba(16,185,129,0.08)]">
              <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-emerald-500/8 blur-3xl transition-all duration-500 group-hover:bg-emerald-500/15" />

              {/* Icon */}
              <div className="relative z-10 mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                <Smartphone className="h-5 w-5" strokeWidth={1.5} />
              </div>

              {/* Mock phone UI */}
              <div className="relative z-10 flex-1 rounded-2xl border border-white/[0.06] bg-slate-900/80 p-4 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Рейс #847</span>
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">В пути</span>
                </div>
                <div className="text-sm font-semibold text-white mb-0.5">Москва → Казань</div>
                <div className="text-[11px] text-slate-500 mb-4">800 км · 9 ч 20 мин</div>

                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-1.5">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                    initial={{ width: '0%' }} whileInView={{ width: '42%' }} viewport={{ once: true }}
                    transition={{ duration: 1.6, ease: 'easeOut', delay: 0.4 }}
                  />
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-[10px] text-slate-600">336 км пройдено</span>
                  <span className="text-[10px] font-medium text-emerald-400">ETA 14:30</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05]">
                  <motion.div className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500"
                    animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
                  <span className="text-[10px] text-slate-500">Обновлено только что</span>
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="mb-1.5 text-base font-bold tracking-tight text-white">Водитель</h3>
                <p className="text-xs leading-relaxed text-slate-500">Путевой лист в смартфоне. Адрес, контакт клиента и быстрая смена статуса.</p>
              </div>
            </div>
          </motion.div>

          {/* ── Клиент ── */}
          <motion.div variants={item} className="group relative col-span-1 lg:col-span-1">
            <div className="relative flex h-full min-h-[340px] sm:min-h-[420px] flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950 p-5 sm:p-6 transition-all duration-500 hover:border-amber-500/20 hover:shadow-[0_0_40px_rgba(245,158,11,0.07)]">
              <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-amber-500/8 blur-3xl transition-all duration-500 group-hover:bg-amber-500/14" />

              <div className="relative z-10 mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                <Package className="h-5 w-5" strokeWidth={1.5} />
              </div>

              {/* Order tracking mock */}
              <div className="relative z-10 flex-1 rounded-2xl border border-white/[0.06] bg-slate-900/80 p-4 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Заказ #2341</span>
                  <span className="text-[10px] font-medium text-amber-400">2.4 тн</span>
                </div>

                <div className="space-y-3.5">
                  {[
                    { label: 'Заказ принят',  sub: 'вчера, 09:45',          done: true,  active: false },
                    { label: 'Груз забран',   sub: 'сегодня, 05:12',        done: true,  active: false },
                    { label: 'В пути к вам', sub: '~45 км осталось',        done: false, active: true  },
                    { label: 'Доставлено',    sub: 'ожидается 14:30',        done: false, active: false },
                  ].map((step, i, arr) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="relative mt-0.5 flex-shrink-0">
                        {step.done ? (
                          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          </div>
                        ) : step.active ? (
                          <div className="relative flex h-4 w-4 items-center justify-center">
                            <div className="h-4 w-4 rounded-full border border-amber-500/60 bg-amber-500/20" />
                            <motion.div className="absolute h-4 w-4 rounded-full bg-amber-500/20"
                              animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                              transition={{ duration: 2, repeat: Infinity }} />
                          </div>
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-slate-700 bg-slate-800" />
                        )}
                        {i < arr.length - 1 && (
                          <div className={`absolute left-[7px] top-4 h-3.5 w-px ${step.done ? 'bg-amber-500/40' : 'bg-slate-800'}`} />
                        )}
                      </div>
                      <div>
                        <div className={`text-xs font-medium ${step.active ? 'text-white' : step.done ? 'text-slate-300' : 'text-slate-600'}`}>{step.label}</div>
                        <div className="text-[10px] text-slate-600">{step.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="mb-1.5 text-base font-bold tracking-tight text-white">Клиент</h3>
                <p className="text-xs leading-relaxed text-slate-500">ETA в реальном времени. Прозрачное ценообразование и полная история рейсов.</p>
              </div>
            </div>
          </motion.div>

          {/* ── Менеджер (wide) ── */}
          <motion.div variants={item} className="group relative col-span-1 md:col-span-2 lg:col-span-2">
            <div className="relative flex h-full min-h-[340px] sm:min-h-[420px] flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950 p-5 sm:p-6 transition-all duration-500 hover:border-blue-500/20 hover:shadow-[0_0_40px_rgba(59,130,246,0.07)]">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-600/8 blur-3xl transition-all duration-500 group-hover:bg-blue-600/14" />

              <div className="relative z-10 mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                <BarChart className="h-5 w-5" strokeWidth={1.5} />
              </div>

              <div className="relative z-10 flex flex-1 flex-col gap-4">
                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Активных рейсов',  value: '24',   color: 'text-blue-400',   ring: 'ring-blue-500/15',   bg: 'bg-blue-500/8'   },
                    { label: 'Водителей онлайн', value: '8/10', color: 'text-indigo-400', ring: 'ring-indigo-500/15', bg: 'bg-indigo-500/8' },
                    { label: 'Доставлено',        value: '91%',  color: 'text-purple-400', ring: 'ring-purple-500/15', bg: 'bg-purple-500/8' },
                  ].map(m => (
                    <div key={m.label} className={`rounded-xl ${m.bg} ring-1 ${m.ring} p-3`}>
                      <div className={`text-xl font-bold ${m.color} mb-0.5`}>{m.value}</div>
                      <div className="text-[10px] leading-tight text-slate-500">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Bar chart */}
                <div className="rounded-2xl border border-white/[0.06] bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium text-slate-400">Рейсов за неделю</span>
                    <span className="text-[10px] font-semibold text-blue-400">+12%</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-10">
                    {barHeights.map((h, i) => (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1">
                        <div className="w-full flex items-end" style={{ height: '36px' }}>
                          <motion.div
                            className="w-full rounded-t-sm bg-gradient-to-t from-blue-700/60 to-blue-400/80"
                            style={{ height: `${h * 0.36}px`, transformOrigin: 'bottom' }}
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.06, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-700">{barDays[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent orders */}
                <div className="rounded-2xl border border-white/[0.06] bg-slate-900/80 p-4">
                  <div className="mb-3 text-[11px] font-medium text-slate-400">Последние рейсы</div>
                  <div className="space-y-2">
                    {[
                      { id: '#2341', route: 'Мск → Казань', status: 'В пути',    sc: 'text-blue-400 bg-blue-500/10'    },
                      { id: '#2340', route: 'Мск → СПб',    status: 'Доставлен', sc: 'text-emerald-400 bg-emerald-500/10' },
                      { id: '#2339', route: 'Мск → Нск',    status: 'Доставлен', sc: 'text-emerald-400 bg-emerald-500/10' },
                    ].map((o, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-600">{o.id}</span>
                        <span className="text-slate-400">{o.route}</span>
                        <span className={`rounded-full px-2 py-0.5 font-medium ${o.sc}`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-4">
                <h3 className="mb-1.5 text-base font-bold tracking-tight text-white">Менеджер</h3>
                <p className="text-xs leading-relaxed text-slate-500">Полная картина бизнеса. Доходность рейсов, загрузка автопарка и контроль логистики в одном окне.</p>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  )
}

// ── Block 5: Footer ──
function FooterStub() {
  const links = {
    Платформа: ['Дашборд', 'Заказы', 'Карта маршрутов', 'Управление флотом'],
    Роли: ['Администратор', 'Диспетчер', 'Водитель', 'Клиент'],
    Компания: ['О системе', 'Документация', 'API', 'Поддержка'],
  }

  return (
    <footer className="border-t border-white/[0.06] bg-slate-950">
      <div className="container mx-auto px-4 py-10 sm:py-16">
        <div className="grid grid-cols-2 gap-6 sm:gap-10 lg:grid-cols-5">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
                <Hexagon className="h-4.5 w-4.5 fill-white text-white" strokeWidth={1.5} />
              </div>
              <span className="text-base font-bold tracking-wide text-white">Маршруты Про</span>
            </div>
            <p className="mb-6 max-w-[28ch] text-sm leading-relaxed text-slate-500">
              Платформа управления транспортом. Умная маршрутизация, реальные данные, полный контроль.
            </p>
            <div className="flex gap-3">
              <Link to="/register" className="rounded-full bg-blue-600 px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 active:scale-95">
                Начать бесплатно
              </Link>
              <Link to="/login" className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-white/10">
                Войти
              </Link>
            </div>
          </div>

          {/* Link groups — auto layout: 1 col per group */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <p className="mb-3 sm:mb-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">{title}</p>
              <ul className="space-y-2">
                {items.map(lnk => (
                  <li key={lnk}>
                    <span className="cursor-default text-sm text-slate-500 transition-colors hover:text-slate-300">{lnk}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 sm:mt-16 flex flex-col items-center gap-4 border-t border-white/[0.06] pt-6 sm:pt-8">
          <p className="text-center text-[10px] text-slate-600">
            Учебный проект · Гизатулин Никита · Финансовый университет при Правительстве РФ
          </p>
          <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-slate-700">© 2025 Маршруты Про. Все права защищены.</p>
            <div className="flex gap-6">
              {['Конфиденциальность', 'Условия использования', 'Cookies'].map(t => (
                <span key={t} className="cursor-default text-xs text-slate-700 transition-colors hover:text-slate-500">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
