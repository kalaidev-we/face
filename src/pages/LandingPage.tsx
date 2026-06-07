import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Shield, Users, BarChart3, ArrowRight, CheckCircle2, Globe, Cpu, Moon, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function LandingPage() {
  const { isDark, toggleTheme, session } = useStore();
  const [demoScanning, setDemoScanning] = useState(false);
  const [demoMatched, setDemoMatched] = useState<string | null>(null);

  const startDemoScan = () => {
    setDemoScanning(true);
    setDemoMatched(null);
    setTimeout(() => {
      setDemoScanning(false);
      setDemoMatched('Emily Watson (FT-2023-002)');
    }, 2200);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? 'bg-dark-bg text-gray-100' : 'bg-light-bg text-gray-800'}`}>
      {/* Glow effects for dark mode */}
      {isDark && (
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      )}
      {isDark && (
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-opacity-10 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-tr from-primary to-secondary rounded-xl text-white shadow-lg shadow-primary/20">
            <Camera className="w-6 h-6 animate-pulse-slow" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            FaceTrack AI
          </span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#demo" className="hover:text-primary transition-colors">Interactive Demo</a>
          <a href="#metrics" className="hover:text-primary transition-colors">Impact</a>
        </nav>

        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>

          {session ? (
            <Link 
              to="/dashboard/overview" 
              className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg shadow-primary/20 transition-all duration-300"
            >
              Enter Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="hidden sm:inline-block text-sm font-semibold hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/login?register=true" 
                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-300"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 md:px-12 pt-20 pb-16 text-center max-w-6xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary mb-6 animate-pulse-slow">
          <Cpu className="w-4 h-4" />
          <span>Powered by local TensorFlow.js & pgvector</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Next-Generation{' '}
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            AI Facial Recognition
          </span>
          <br />
          Attendance Management
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          FaceTrack AI replaces manuals, badges, and QR codes with seamless, server-side vector-matched facial verification. Beautiful SaaS UI meets enterprise security.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-16">
          <Link 
            to="/login"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <span>Launch Console</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a 
            href="#demo"
            className="w-full sm:w-auto px-8 py-4 glass-panel rounded-xl font-semibold border border-opacity-10 hover:border-primary/30 transition-all duration-300 flex items-center justify-center"
          >
            Try Live Demo
          </a>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="relative glass-panel rounded-2xl border border-opacity-10 p-2 md:p-4 max-w-5xl mx-auto shadow-2xl overflow-hidden premium-border">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-slate-900/40 rounded-t-xl">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <div className="text-xs text-gray-500 font-mono">dashboard.facetrack.ai/overview</div>
            <div className="w-8" />
          </div>
          
          <div className="bg-slate-950/60 p-4 md:p-8 rounded-b-xl grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Left Sidebar Mock */}
            <div className="hidden md:block space-y-4 pr-6 border-r border-white/5">
              <div className="h-6 w-32 bg-white/10 rounded" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`h-8 rounded flex items-center px-3 ${i === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-transparent'}`}>
                    <div className="w-4 h-4 bg-white/20 rounded mr-2" />
                    <div className="h-3 w-16 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Main Mock Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Counters */}
              <div className="grid grid-cols-3 gap-4">
                {['Present Rate', 'Success Rate', 'Total Registered'].map((lbl, idx) => (
                  <div key={idx} className="glass-panel p-4 rounded-xl border border-white/5">
                    <span className="text-xs text-gray-500">{lbl}</span>
                    <div className="text-lg md:text-xl font-bold font-display mt-1 text-primary">
                      {idx === 0 ? '94.2%' : idx === 1 ? '99.8%' : '1,240'}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Simulated Chart */}
              <div className="glass-panel p-4 rounded-xl border border-white/5 h-48 flex flex-col justify-between">
                <span className="text-xs text-gray-400 font-semibold">Weekly Enrollment Analysis</span>
                <div className="flex items-end space-x-2 h-32 pt-4 justify-between">
                  {[40, 60, 45, 80, 75, 95, 88].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-primary to-secondary rounded-t"
                        style={{ height: `${h}%` }}
                      />
                      <span className="text-[10px] text-gray-600 mt-1 font-mono">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-6 md:px-12 py-20 max-w-6xl mx-auto border-t border-opacity-5 border-white">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-display text-3xl font-bold mb-4">Enterprise Architecture at Core</h2>
          <p className="text-gray-400">Everything needed to run automated facial recognition attendance across campuses, departments, and corporate offices.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Cpu className="text-primary w-6 h-6" />, title: 'Vector Matching Engine', desc: 'Converts facial details into a 128-dimensional floating vector stored in Supabase pgvector. Matches in under 50ms.' },
            { icon: <Shield className="text-secondary w-6 h-6" />, title: 'Liveness & Anti-Spoofing', desc: 'Validates lighting, facial tilt, alignment, and uses motion variance checks to filter out printed or digital photo spoofs.' },
            { icon: <Globe className="text-accent w-6 h-6" />, title: 'Geofencing Boundaries', desc: 'Utilizes GPS tracking validation to ensure student device sign-ins (via backup QR scanning) occur inside campus limits.' },
            { icon: <Users className="text-primary w-6 h-6" />, title: 'Role-Based Control', desc: 'Strict security separation: Super Admin controls branches/classes; Staff holds scanning cameras; Students view trends.' },
            { icon: <BarChart3 className="text-secondary w-6 h-6" />, title: 'ML Attendance Projections', desc: 'Features built-in prediction algorithms forecasting absenteeism, dropout risk warnings, and peak campus arrival times.' },
            { icon: <CheckCircle2 className="text-accent w-6 h-6" />, title: 'Offline-First Storage', desc: 'Sync state using IndexDB. Queue scans locally when network connections drop, and automatically upload when re-established.' }
          ].map((feat, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-2xl glass-panel-interactive border border-opacity-5 hover:border-primary/20">
              <div className="p-3 bg-white/5 w-fit rounded-xl mb-6 border border-white/5">
                {feat.icon}
              </div>
              <h3 className="font-display text-lg font-bold mb-3">{feat.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Mock Scanning Demo */}
      <section id="demo" className="px-6 md:px-12 py-20 bg-slate-950/20 border-t border-opacity-5 border-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-semibold text-accent tracking-widest uppercase">Live Verification Demo</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mt-4 mb-6 leading-tight">
              Experience the Scanning Speed Instantly
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              When students walk in front of a FaceTrack camera terminal, their face is detected, verified for alignment, and transformed into an embedding. Click scan to simulate a 128-dimensional similarity evaluation against our database.
            </p>
            
            <div className="space-y-4">
              {[
                'Face alignment & center check',
                'Lighting & clarity score calculation',
                '128-D embedding extraction via CNN model',
                'pgvector cosine-similarity table scanning',
                'Real-time automated check-in logging'
              ].map((step, idx) => (
                <div key={idx} className="flex items-center space-x-3 text-sm">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">✓</div>
                  <span className="text-gray-300">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Screen Simulator */}
          <div className="glass-panel rounded-2xl p-6 border border-opacity-10 shadow-2xl relative overflow-hidden flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-4 border-b border-white/5 mb-6">
              <span className="text-xs font-mono text-gray-500">Live Camera Terminal #1</span>
              <span className="flex items-center text-xs text-emerald-400 font-semibold gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                Operational
              </span>
            </div>

            {/* Webcam viewport box */}
            <div className="w-full aspect-video rounded-xl bg-slate-950 relative overflow-hidden flex flex-col items-center justify-center border border-white/5 scanner-container">
              {demoScanning ? (
                <>
                  <div className="scanner-line" />
                  <div className="w-24 h-24 border-2 border-dashed border-primary rounded-full animate-pulse-slow flex items-center justify-center">
                    <Cpu className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <span className="text-xs font-mono text-primary mt-4 tracking-wider animate-pulse">EXTRACTING EMBEDDING...</span>
                </>
              ) : demoMatched ? (
                <div className="text-center p-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <span className="text-sm font-semibold text-emerald-400">Marked Present (98.6% match)</span>
                  <div className="text-xs text-gray-400 mt-1">{demoMatched}</div>
                </div>
              ) : (
                <>
                  <Camera className="w-12 h-12 text-gray-600 mb-2" />
                  <span className="text-xs text-gray-500">Simulated Camera View</span>
                </>
              )}
            </div>

            <button 
              onClick={startDemoScan}
              disabled={demoScanning}
              className="mt-6 w-full py-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              {demoScanning ? 'Processing Face...' : 'Simulate Attendance Scan'}
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section id="metrics" className="px-6 md:px-12 py-20 max-w-6xl mx-auto border-t border-opacity-5 border-white text-center">
        <h2 className="font-display text-3xl font-bold mb-16">Metrics that Matter</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { val: '< 50ms', label: 'Recognition Speed' },
            { val: '99.85%', label: 'Precision Accuracy' },
            { val: '92%', label: 'Admin Overhead Saved' },
            { val: '0%', label: 'Buddy Punching Fraud' }
          ].map((metric, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-white/5">
              <div className="text-2xl sm:text-4xl font-extrabold font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{metric.val}</div>
              <div className="text-xs sm:text-sm text-gray-400 mt-2">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="glass-panel border-t border-opacity-10 py-12 px-6 md:px-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-4">Ready to Automate Attendance?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto text-sm">
            Deploy FaceTrack AI locally or host it with your enterprise Supabase database. Try mock mode instantly.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/login"
              className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              Sign In Now
            </Link>
          </div>
          <div className="text-xs text-gray-600 mt-12 font-mono">
            &copy; {new Date().getFullYear()} FaceTrack AI. Open-source MIT License.
          </div>
        </div>
      </footer>
    </div>
  );
}
