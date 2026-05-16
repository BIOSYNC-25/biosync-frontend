import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Fingerprint, ArrowRight, Shield, BarChart3, Users, 
  Clock, Activity, Map, PieChart, TrendingUp, CheckCircle, Smartphone,
  Server, Database, Wifi, AlertTriangle, FileText, UploadCloud, Calendar,
  MessageSquare, LayoutGrid, Sliders, Briefcase, GraduationCap, Building,
  Bell, FileCheck, CheckCheck, Mail, Phone
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  const handleScrollToSection = (e, id) => {
    e.preventDefault();
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030303',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
      overflowX: 'auto'
    }}>
      <div style={{ minWidth: '1024px', width: '100%' }}>
      <style>
        {`
          * { box-sizing: border-box; }
          body, html { width: 100%; margin: 0; padding: 0; overflow-x: hidden; }
          .nav-links { display: none; gap: 2.5rem; }
          @media (min-width: 850px) { .nav-links { display: flex; } }
          
          .grid-8-modules { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1.5rem; }
          @media (min-width: 768px) { .grid-8-modules { grid-template-columns: repeat(2, 1fr); } }
          @media (min-width: 1200px) { .grid-8-modules { grid-template-columns: repeat(4, 1fr); } }

          .grid-auto-fit { display: grid; grid-template-columns: repeat(1, 1fr); gap: 2rem; }
          @media (min-width: 900px) { .grid-auto-fit { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); } }

          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: #111; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }

          .hover-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .hover-card:hover { transform: translateY(-5px); border-color: #444 !important; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5); background-color: #161616 !important; }

          .section-title { font-size: clamp(1.75rem, 5vw, 3rem); font-weight: 800; line-height: 1.2; margin: 0 0 1rem 0; color: #fff; }
          .hero-title { font-size: clamp(2rem, 6vw, 5rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; max-width: 1000px; margin: 0 0 1.5rem 0; color: #fff; position: relative; }
          .sub-title { font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 800; line-height: 1.2; margin-bottom: 1.5rem; letter-spacing: -0.02em; color: #fff; }
          
          .section-padding { padding: 4rem 1rem; }
          @media (min-width: 768px) { .section-padding { padding: 6rem 2rem; } }
          @media (min-width: 1024px) { .section-padding { padding: 8rem 2rem; } }
          
          .hero-padding { padding: 8rem 1rem 5rem; }
          @media (min-width: 768px) { .hero-padding { padding: 9rem 2rem 6rem; } }
          @media (min-width: 1024px) { .hero-padding { padding: 10rem 2rem 8rem; } }

          .responsive-grid-2 { display: grid; grid-template-columns: 1fr; gap: 3rem; }
          @media (min-width: 900px) { .responsive-grid-2 { grid-template-columns: repeat(2, 1fr); gap: 4rem; } }
          
          .responsive-grid-auto-large { display: grid; grid-template-columns: 1fr; gap: 3rem; }
          @media (min-width: 768px) { .responsive-grid-auto-large { grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); } }
          @media (min-width: 1024px) { .responsive-grid-auto-large { grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); } }
          
          .responsive-grid-auto-medium { display: grid; grid-template-columns: 1fr; gap: 2rem; }
          @media (min-width: 768px) { .responsive-grid-auto-medium { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); } }

          .nav-padding { padding: 1rem 1rem; }
          @media (min-width: 768px) { .nav-padding { padding: 1.25rem 2rem; } }

          .btn-responsive { padding: 0.8rem 1.5rem; font-size: 0.8rem; width: 100%; justify-content: center; }
          @media (min-width: 480px) { .btn-responsive { width: auto; } }
          @media (min-width: 768px) { .btn-responsive { padding: 1.1rem 2.5rem; font-size: 0.85rem; } }
          
          .btn-login { padding: 0.6rem 1rem; font-size: 0.75rem; }
          @media (min-width: 480px) { .btn-login { padding: 0.65rem 1.5rem; font-size: 0.8rem; } }
          
          .hero-btn-container { display: flex; flex-direction: column; gap: 1rem; width: 100%; }
          @media (min-width: 480px) { .hero-btn-container { flex-direction: row; justify-content: center; } }
          
          .table-container { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }

          @media (max-width: 400px) {
            .btn-login-text { display: none; }
          }
          
          .bot-mockup { width: 100%; overflow: hidden; display: flex; flex-direction: column; }
          
          .stat-card-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
          @media (min-width: 600px) { .stat-card-grid { grid-template-columns: repeat(2, 1fr); } }
        `}
      </style>

      {/* 1. STICKY TOP NAVBAR */}
      <nav className="nav-padding" style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(3, 3, 3, 0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth'})}>
          <Fingerprint size={28} color="#fff" />
          <span style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)', fontWeight: '800', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            BIOSYNC
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(1rem, 3vw, 3rem)' }}>
          <div className="nav-links">
            <a href="#oversight" onClick={(e) => handleScrollToSection(e, 'oversight')} style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#aaa'}>Platform Intelligence</a>
            <a href="#modules" onClick={(e) => handleScrollToSection(e, 'modules')} style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#aaa'}>Core Modules</a>
            <a href="#bot" onClick={(e) => handleScrollToSection(e, 'bot')} style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#aaa'}>WhatsApp Bot</a>
            <a href="#architectures" onClick={(e) => handleScrollToSection(e, 'architectures')} style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = '#fff'} onMouseOut={(e) => e.target.style.color = '#aaa'}>Action Architectures</a>
          </div>
          
          <button 
            className="btn-login"
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '4px',
              fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eaeaea'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <span className="btn-login-text">Terminal Login</span> <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="hero-padding" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        position: 'relative', background: 'radial-gradient(circle at 50% 10%, #111 0%, #030303 60%)'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50px', marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ccc',
          textAlign: 'left'
        }}>
          <Activity size={12} color="#4ade80" style={{ flexShrink: 0 }} /> <span>Institution-Grade Attendance Intelligence</span>
        </div>
        
        <h1 className="hero-title">
          Centralized Attendance Operations &amp; Intelligence Layer.
        </h1>
        
        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.2rem)', color: '#888', maxWidth: '800px', lineHeight: '1.7', margin: '0 0 clamp(2rem, 5vw, 3.5rem) 0', fontWeight: '400', padding: '0 1rem'
        }}>
          BIOSYNC connects physical biometric endpoints to an enterprise intelligence engine. Execute definitive centralized terminal control, dive into department-level analytical dashboards, invoke range reporting algorithms, and distribute output securely via the Conversational WhatsApp interface.
        </p>

        <div className="hero-btn-container">
          <button 
            className="btn-responsive"
            onClick={(e) => handleScrollToSection(e, 'modules')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '4px', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s', gap: '0.75rem'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >
            <LayoutGrid size={16} /> Explore Systems
          </button>
          
          <button 
            className="btn-responsive"
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: '#fff', color: '#000', border: '1px solid #fff', borderRadius: '4px',
              fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em',
              cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s', gap: '0.75rem'
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#eaeaea'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Enter Platform <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* 3. BUILT FOR INSTITUTIONAL OVERSIGHT */}
      <section id="oversight" className="section-padding" style={{ background: '#080808', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(2rem, 5vw, 4rem)' }}>
          
          <div className="responsive-grid-2" style={{ alignItems: 'center' }}>
            <div>
              <div style={{ color: '#60a5fa', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>Executive-Level Visibility</div>
              <h2 className="sub-title">
                Engineered for Complete Institutional Oversight.
              </h2>
              <p style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', color: '#999', lineHeight: '1.7', marginBottom: '1.5rem' }}>
                BIOSYNC definitively eliminates institutional blind spots by fully centralizing biometric operations. We equip leadership, management bodies, and academic HODs with real-time operational truth. 
              </p>
              <p style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', color: '#777', lineHeight: '1.7' }}>
                Execute manual SDK terminal synchronizations perfectly, intercept and identify offline endpoint failures via continuous background telemetry, and deploy deep historical date-range algorithms across precise academic cohorts.
              </p>
            </div>

            <div className="stat-card-grid">
              {[
                { icon: <Server size={20} color="#fff" />, title: "Terminal Sync Control", desc: "Centralized execution over remote biometric gateways." },
                { icon: <AlertTriangle size={20} color="#fff" />, title: "Offline Detection", desc: "Isolate terminal failures natively without manual auditing." },
                { icon: <TrendingUp size={20} color="#fff" />, title: "Course-Level Intel", desc: "Filter absolute compliance directly by assigned academic class." },
                { icon: <FileText size={20} color="#fff" />, title: "Range Reporting", desc: "Historical export logic defining performance across date arrays." }
              ].map((ft, idx) => (
                <div key={idx} style={{ background: '#111', padding: '2rem', border: '1px solid #222', borderRadius: '4px' }}>
                  <div style={{ background: '#222', width: '40px', height: '40px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    {ft.icon}
                  </div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#fff', marginBottom: '0.75rem' }}>{ft.title}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#777', lineHeight: '1.5', margin: 0 }}>{ft.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. BIOSYNC BOT - WHATSAPP INTEGRATION SECTION */}
      <section id="bot" className="section-padding" style={{ background: '#030303', borderBottom: '1px solid #1a1a1a', overflow: 'hidden' }}>
         <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem, 6vw, 5rem)' }}>
               <h2 className="section-title">Conversational Attendance Access.</h2>
               <p style={{ color: '#888', fontSize: 'clamp(1rem, 3vw, 1.2rem)', maxWidth: '800px', margin: '0 auto' }}>
                  BIOSYNC isn't solely restricted to complex dashboards. The <strong>BIOSYNC BOT</strong> serves as an intelligent, instant WhatsApp Reporting Layer delivering formatted attendance packets directly matching allowed query strings.
               </p>
            </div>

            <div className="responsive-grid-2" style={{ alignItems: 'stretch' }}>
               
               {/* Left: Allowed Query Formats */}
               <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '4px', padding: 'clamp(1.5rem, 4vw, 3rem)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                     <MessageSquare size={28} color="#25D366" style={{ flexShrink: 0 }} />
                     <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '800', margin: 0 }}>Authorized Query Formats</h3>
                  </div>
                  <p style={{ color: '#888', fontSize: 'clamp(0.9rem, 2vw, 1rem)', lineHeight: '1.6', marginBottom: '2rem' }}>
                    The BIOSYNC BOT strictly processes specific linguistic patterns and provides error handling for incorrect date geometries. Dates heavily rely on dashed standard structures.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {[
                      { type: "Specific Class Report", cmd: "Report for II CSE A on 29-09-2025" },
                      { type: "Relative Class Report", cmd: "Report for II CSE A today" },
                      { type: "Complete Department Extraction", cmd: "Report for all CSE on 29-09-2025" },
                      { type: "Campus-Wide Generation", cmd: "Report for all departments on 29-09-2025" },
                      { type: "Weekly Batch Processing", cmd: "Weekly report for II CSE A" },
                      { type: "Monthly Target Aggregation", cmd: "Monthly report for CSE on September" }
                    ].map((q, i) => (
                      <div key={i} style={{ borderLeft: '2px solid #333', paddingLeft: '1rem', overflowX: 'hidden' }}>
                        <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase' }}>{q.type}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 'clamp(0.75rem, 2vw, 0.9rem)', color: '#60a5fa', background: '#112', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #1a2333', display: 'inline-block', wordBreak: 'break-word', maxWidth: '100%' }}>
                          {q.cmd}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '3rem' }}>
                    <div style={{ background: '#111', padding: '1rem', borderRadius: '4px', border: '1px solid #222', fontSize: '0.85rem', color: '#777', lineHeight: '1.5' }}>
                      <strong>Protocol Notes:</strong> Massive data requests, including Weekly/Monthly variants encompassing entire departments, are compiled and securely dispatched as robust single `.txt` attachments ensuring rapid reliability over WhatsApp. Supports core domains such as <em>AIDS, AIML, BIOTECH, BME, CCE, CIVIL, CSE, ECE, EEE, INFOTECH, MECH.</em>
                    </div>
                  </div>
               </div>

               {/* Right: WhatsApp UI Mockup */}
               <div className="bot-mockup" style={{ background: '#0a0b0d', border: '1px solid #222', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                 {/* WA Header */}
                 <div style={{ background: '#1f2c34', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #333' }}>
                   <div style={{ width: '40px', height: '40px', background: '#25D366', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <Fingerprint size={20} color="#fff" />
                   </div>
                   <div>
                     <div style={{ fontSize: '1rem', fontWeight: '700', color: '#e9edef' }}>BIOSYNC Reporting Bot</div>
                     <div style={{ fontSize: '0.75rem', color: '#8696a0' }}>Online</div>
                   </div>
                 </div>

                 {/* WA Chat Body */}
                 <div className="custom-scrollbar" style={{ padding: '1.5rem', background: '#0b141a', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
                    
                    {/* User Msg */}
                    <div className="chat-bubble" style={{ alignSelf: 'flex-end', background: '#005c4b', color: '#e9edef', padding: '0.5rem 1rem', borderRadius: '8px 8px 0 8px', fontSize: '0.9rem', position: 'relative' }}>
                      Report for all CSE on 29-09-2025
                      <div style={{ fontSize: '0.65rem', color: '#8696a0', textAlign: 'right', marginTop: '0.25rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.25rem' }}>
                        10:04 AM <CheckCheck size={14} color="#53bdeb" />
                      </div>
                    </div>

                    {/* Bot Msg */}
                    <div className="chat-bubble" style={{ alignSelf: 'flex-start', background: '#202c33', color: '#e9edef', padding: '1rem', borderRadius: '0 8px 8px 8px', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: '1.5', wordBreak: 'break-word' }}>
                      <strong style={{ color: '#25D366' }}>BIOSYNC ATTENDANCE REPORT</strong>
                      <br/><br/>
                      <strong>Date:</strong> 29-09-2025<br/>
                      <strong>Department:</strong> CSE (Computer Science &amp; Engg.)
                      <br/><br/>
                      --- DEPARTMENT SUMMARY ---<br/>
                      <strong>TOTAL PRESENT:</strong> 342<br/>
                      <strong>TOTAL NOT PRESENT:</strong> 18<br/>
                      <br/>
                      --- CLASS BREAKDOWNS ---<br/>
                      <strong>II CSE A:</strong> P: 58 | A: 2<br/>
                      <strong>II CSE B:</strong> P: 55 | A: 5<br/>
                      <strong>III CSE C:</strong> P: 60 | A: 0
                      <br/><br/>
                      <span style={{ color: '#f87171' }}>[!] OFFLINE ALERT: Main Block Device #02</span>
                      <div style={{ fontSize: '0.65rem', color: '#8696a0', textAlign: 'right', marginTop: '0.5rem' }}>
                        10:04 AM
                      </div>
                    </div>
                    
                    {/* User Msg 2 */}
                    <div className="chat-bubble" style={{ alignSelf: 'flex-end', background: '#005c4b', color: '#e9edef', padding: '0.5rem 1rem', borderRadius: '8px 8px 0 8px', fontSize: '0.9rem', position: 'relative' }}>
                      Weekly report for II CSE A
                      <div style={{ fontSize: '0.65rem', color: '#8696a0', textAlign: 'right', marginTop: '0.25rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.25rem' }}>
                        10:06 AM <CheckCheck size={14} color="#53bdeb" />
                      </div>
                    </div>

                    {/* Bot Msg 2 */}
                    <div className="chat-bubble" style={{ alignSelf: 'flex-start', background: '#202c33', color: '#e9edef', padding: '1rem', borderRadius: '0 8px 8px 8px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#111b21', padding: '1rem', borderRadius: '4px', border: '1px solid #333', flexWrap: 'wrap' }}>
                        <FileText size={32} color="#fff" style={{ flexShrink: 0 }} />
                        <div style={{ wordBreak: 'break-all' }}>
                          <div style={{ fontWeight: '700' }}>weekly_CSE_A_Wk4.txt</div>
                          <div style={{ fontSize: '0.75rem', color: '#8696a0' }}>12 KB • txt Document</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#8696a0', textAlign: 'right', marginTop: '0.5rem' }}>
                        10:06 AM
                      </div>
                    </div>

                 </div>

                 {/* WA Footer */}
                 <div style={{ background: '#1f2c34', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, background: '#2a3942', padding: '0.75rem 1.5rem', borderRadius: '20px', color: '#8696a0', fontSize: '0.9rem' }}>
                      Type an allowed format query...
                    </div>
                 </div>
               </div>
            </div>
         </div>
      </section>

      {/* 5. CORE PLATFORM MODULES GRID */}
      <section id="modules" className="section-padding" style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)', textAlign: 'center' }}>
            <div style={{ color: '#60a5fa', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>Architectural Segments</div>
            <h2 className="section-title">Core Platform Modules.</h2>
            <p style={{ color: '#888', fontSize: 'clamp(1rem, 3vw, 1.1rem)', maxWidth: '800px', margin: '0 auto' }}>
              BIOSYNC consists of 8 distinctive operational pillars bridging hardware execution with administrative reporting software natively.
            </p>
          </div>

          <div className="grid-8-modules">
            {[
              { icon: <BarChart3 size={24} />, title: "Department Dashboard", bullets: ["Campus-wide present/absent visibility.", "Department-level attendance metrics.", "Comparative department analytics."] },
              { icon: <TrendingUp size={24} />, title: "Range Attendance Analytics", bullets: ["Date-range attendance trend analysis.", "Class-wise attendance performance.", "Historical attendance review."] },
              { icon: <Users size={24} />, title: "Student-wise Tracking", bullets: ["Per-student total/present/absent metrics.", "Absolute percentage visibility.", "Class-based student review workflow."] },
              { icon: <Server size={24} />, title: "Admin SDK Pull Control", bullets: ["Target biometric device configuration.", "Remote core SDK pull execution.", "Post-run hardware issue visibility."] },
              { icon: <FileText size={24} />, title: "Admin Range Report Engine", bullets: ["Department, class & employee generation.", "Strict date-based algorithmic creation.", "Immediate administrative report workflows."] },
              { icon: <AlertTriangle size={24} />, title: "Device Issue Intelligence", bullets: ["Offline gateway terminal identification.", "No-log and failed-log visibility logs.", "Continuous error device monitoring."] },
              { icon: <MessageSquare size={24} />, title: "BIOSYNC BOT Interface", bullets: ["WhatsApp-based strict attendance access.", "Configured query pattern formats.", "Extremely fast institutional delivery."] },
              { icon: <Bell size={24} />, title: "Automated Communication", bullets: ["Batch Weekly/Monthly report dispatch.", "Text-based reliable report routing.", "Complete operational communication layer."] }
            ].map((module, index) => (
              <div key={index} className="hover-card" style={{ background: '#0e0e0e', border: '1px solid #222', padding: '2rem', borderRadius: '8px' }}>
                <div style={{ marginBottom: '1.5rem', color: '#fff' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', display: 'inline-flex', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {module.icon}
                  </div>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '1.25rem', color: '#fff' }}>{module.title}</h3>
                <ul style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.6', margin: 0, paddingLeft: '1.25rem' }}>
                  {module.bullets.map((bullet, idx) => (
                    <li key={idx} style={{ marginBottom: '0.5rem' }}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. STATIC PRODUCT SHOWCASE DEMO AREA */}
      <section className="section-padding" style={{ background: '#030303', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)', textAlign: 'center' }}>
            <h2 className="section-title">Internal Environment Mocks.</h2>
            <p style={{ color: '#888', fontSize: 'clamp(1rem, 3vw, 1.1rem)', maxWidth: '800px', margin: '0 auto' }}>
              We've replicated internal BIOSYNC operational panels perfectly to showcase genuine platform capability logic.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {/* DEMO ROW 1 */}
            <div className="responsive-grid-auto-large">
              
              {/* Dashboard Layout Mock */}
              <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 1.5rem', background: '#111', borderBottom: '1px solid #222', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PieChart size={14} color="#60a5fa" style={{ flexShrink: 0 }} /> <span>DEPARTMENT DASHBOARD (MOCK)</span>
                </div>
                <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '2rem', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ flex: 1, background: '#141414', border: '1px solid #2a2a2a', padding: '1.5rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '800', marginBottom: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>INSTITUTION AGGREGATE</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        <span style={{ color: '#aaa' }}>Total Present</span><span style={{ color: '#4ade80', fontWeight: '700' }}>3,921</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ color: '#aaa' }}>Total Absent</span><span style={{ color: '#f87171', fontWeight: '700' }}>419</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: '#141414', border: '1px solid #2a2a2a', padding: '1.5rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666', fontWeight: '800', marginBottom: '1.5rem' }}>SUB-DEPARTMENT PERFORMANCE COMPARISONS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {['Computer Science', 'Electrical', 'Mechanical'].map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ width: '150px', fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', flexShrink: 0 }}>{d}</div>
                          <div style={{ flex: 1, background: '#222', height: '10px', borderRadius: '5px', overflow: 'hidden', minWidth: '100px' }}>
                            <div style={{ width: `${88 - i*6}%`, height: '100%', background: '#60a5fa' }}></div>
                          </div>
                          <div style={{ width: '40px', textAlign: 'right', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0 }}>{88 - i*6}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

               {/* SDK Pull Mock */}
               <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 1.5rem', background: '#111', borderBottom: '1px solid #222', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Server size={14} color="#60a5fa" style={{ flexShrink: 0 }} /> <span>ADMIN SDK PULL CONTROL (MOCK)</span>
                </div>
                <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                   <div style={{ background: '#141414', border: '1px solid #333', padding: '1.5rem', borderRadius: '4px' }}>
                     <div style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem' }}>Terminal Pull Gateway</div>
                     <div style={{ marginBottom: '1rem' }}>
                       <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Configured Target Device Scope</div>
                       <div style={{ padding: '0.5rem 1rem', background: '#000', border: '1px solid #222', fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', color: '#888', wordBreak: 'break-word' }}>ALL REGISTERED CAMPUS NODES</div>
                     </div>
                     <button style={{ padding: '0.75rem 1.5rem', background: '#fff', color: '#000', border: 'none', fontWeight: '800', fontSize: '0.75rem', borderRadius: '2px', width: '100%' }}>EXECUTE BIOSYNC SYNC</button>
                   </div>
                   <div style={{ borderLeft: '3px solid #f87171', paddingLeft: '1rem', background: '#141414', padding: '1rem', borderRadius: '0 4px 4px 0' }}>
                     <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#f87171', marginBottom: '0.5rem' }}>HARDWARE OFFLINE EXCEPTION</div>
                     <div style={{ fontSize: '0.8rem', color: '#ccc' }}><strong>IP 10.0.12.54</strong> (Library Biometric West) is not responding.</div>
                   </div>
                </div>
              </div>
            </div>

            {/* DEMO ROW 2: Student Table */}
            <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', overflow: 'hidden' }}>
               <div style={{ padding: '1rem 1.5rem', background: '#111', borderBottom: '1px solid #222', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={14} color="#60a5fa" style={{ flexShrink: 0 }} /> <span>STUDENT-WISE ATTENDANCE ANALYTICS (MOCK)</span>
               </div>
               <div style={{ padding: 'clamp(1rem, 3vw, 2rem)' }}>
                  <div style={{ border: '1px solid #222', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', background: '#141414', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ padding: '0.5rem 1rem', background: '#000', border: '1px solid #333', fontSize: '0.8rem', color: '#aaa', borderRadius: '2px' }}>SELECTOR: CLASS II CSE A</div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ fontSize: '0.7rem', color: '#666', border: '1px solid #333', padding: '0.25rem 0.75rem', borderRadius: '2px', display: 'flex', alignItems: 'center' }}>Total: 60</div>
                      </div>
                    </div>
                    <div className="table-container custom-scrollbar">
                      <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#0d0d0d', borderBottom: '1px solid #222' }}>
                          <tr>
                            <th style={{ padding: '1rem', color: '#666', fontWeight: '600' }}>REG NO</th>
                            <th style={{ padding: '1rem', color: '#666', fontWeight: '600' }}>STUDENT NAME</th>
                            <th style={{ padding: '1rem', color: '#666', fontWeight: '600' }}>TOTAL</th>
                            <th style={{ padding: '1rem', color: '#666', fontWeight: '600' }}>PRESENT</th>
                            <th style={{ padding: '1rem', color: '#666', fontWeight: '600' }}>ABSENT</th>
                            <th style={{ padding: '1rem', color: '#666', fontWeight: '600' }}>%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { r: '21CS001', n: 'Arjun Mehta', t: 45, p: 40, a: 5, pct: '88.8' },
                            { r: '21CS002', n: 'Priya Sharma', t: 45, p: 43, a: 2, pct: '95.5' },
                            { r: '21CS003', n: 'Rahul Verma', t: 45, p: 20, a: 25, pct: '44.4' },
                            { r: '21CS004', n: 'Neha Gupta', t: 45, p: 41, a: 4, pct: '91.1' },
                          ].map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #1a1a1a', background: i%2===0 ? '#0a0a0a' : '#111' }}>
                              <td style={{ padding: '1rem', fontWeight: '700', color: '#ccc' }}>{row.r}</td>
                              <td style={{ padding: '1rem', color: '#999' }}>{row.n}</td>
                              <td style={{ padding: '1rem', color: '#777' }}>{row.t}</td>
                              <td style={{ padding: '1rem', color: '#4ade80' }}>{row.p}</td>
                              <td style={{ padding: '1rem', color: row.a > 10 ? '#f87171' : '#777' }}>{row.a}</td>
                              <td style={{ padding: '1rem', color: parseFloat(row.pct) < 75 ? '#f87171' : '#fff', fontWeight: '800' }}>{row.pct}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. INSTITUTIONAL ACTION ARCHITECTURES GRID */}
      <section id="architectures" className="section-padding" style={{ backgroundColor: '#080808' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ marginBottom: 'clamp(3rem, 6vw, 5rem)', textAlign: 'center' }}>
            <div style={{ color: '#60a5fa', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>User Context Definition</div>
            <h2 className="section-title">Institutional Action Architectures.</h2>
            <p style={{ color: '#888', fontSize: 'clamp(1rem, 3vw, 1.1rem)', maxWidth: '800px', margin: '0 auto' }}>
              BIOSYNC inherently scales capability delivery specifically aligned to the precise operational tier requested by the institutional stakeholder.
            </p>
          </div>

          <div className="responsive-grid-auto-medium">
            {[
              { role: "Institution Management", val: "Management aggressively reviews institution-wide attendance intelligence to map campus aggregation and overarching compliance." },
              { role: "Heads of Department (HODs)", val: "HODs exclusively authenticate into department dashboards focusing on precise class-wise averages." },
              { role: "Department Coordinators", val: "Coordinators heavily leverage range analytics combined with student-wise interfaces for rapid review workflows." },
              { role: "Administrative Teams", val: "Core admin teams execute biometric SDK pull operations remotely while simultaneously deploying batch generated reports." },
              { role: "Monitoring Teams", val: "Operational teams immediately track hardware synchronization errors through dedicated offline/device-issue intelligence modules." },
              { role: "Faculty / Class Incharge", val: "Direct class authorities extract daily metrics per student executing precise localized retention capabilities securely." },
              { role: "HR / Compliance Audit", val: "Audit frameworks extract massive batch documents utilizing the Report Engine bounded securely by date parameters." },
              { role: "Stakeholders / Recipients", val: "Key recipients process direct summary knowledge seamlessly delivered sequentially via the automated BIOSYNC BOT service." }
            ].map((uc, i) => (
              <div key={i} style={{ padding: '2rem', background: '#0e0e0e', border: '1px solid #1a1a1a', borderTop: '3px solid #333', borderRadius: '4px' }}>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', marginBottom: '1rem' }}>{uc.role}</h4>
                <p style={{ fontSize: '0.9rem', color: '#888', lineHeight: '1.6', margin: 0 }}>{uc.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA & CONTACT */}
      <section className="section-padding" style={{ background: '#111', borderTop: '1px solid #222' }}>
        <div className="responsive-grid-auto-large" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Left: Contact / Demo */}
          <div style={{ background: '#0a0a0a', padding: 'clamp(2rem, 5vw, 3rem)', borderRadius: '8px', border: '1px solid #222' }}>
            <h2 className="sub-title">Book a Demo.</h2>
            <p style={{ color: '#888', fontSize: 'clamp(0.95rem, 3vw, 1rem)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              We provide guided live walkthroughs scaling from small departments to massive campus aggregation. Reach out for deployment and onboarding discussions.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#ccc', fontSize: '0.9rem', fontWeight: '600', flexWrap: 'wrap' }}>
                <Mail size={18} color="#60a5fa" style={{ flexShrink: 0 }} /> <span style={{ wordBreak: 'break-all' }}>biosyncbot@gmail.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#ccc', fontSize: '0.9rem', fontWeight: '600' }}>
                <Phone size={18} color="#60a5fa" style={{ flexShrink: 0 }} /> <span>+91 6380231313</span>
              </div>
            </div>
          </div>

          {/* Right: Portal Access */}
          <div style={{ padding: 'clamp(1rem, 4vw, 3rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ color: '#60a5fa', fontSize: 'clamp(0.75rem, 2vw, 0.8rem)', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1rem' }}>Secure Endpoint</div>
            <h2 className="sub-title">Deploy Complete Visibility.</h2>
            <p style={{ color: '#888', fontSize: 'clamp(0.95rem, 3vw, 1.05rem)', marginBottom: '3rem', lineHeight: '1.6' }}>
              Execute safe authentication protocols protecting isolated biometric reporting and SDK operations.
            </p>
            <div>
              <button 
                className="btn-responsive"
                onClick={() => navigate('/login')}
                style={{
                  backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '4px',
                  fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em',
                  cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(255,255,255,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Authenticate Portal Access <ArrowRight size={18} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="section-padding" style={{ background: '#030303', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Fingerprint size={24} color="#555" />
            <span style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '0.25em', color: '#555' }}>
              BIOSYNC
            </span>
          </div>
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
            {['Platform Intelligence', 'Core Modules', 'WhatsApp Bot', 'Action Architectures'].map((link, i) => (
              <span key={i} style={{ color: '#555', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {link}
              </span>
            ))}
          </div>
          <div style={{ color: '#333', fontSize: '0.75rem', marginTop: '3rem', textAlign: 'center', padding: '0 1rem' }}>
            &copy; {new Date().getFullYear()} BIOSYNC Infrastructure. Engineered specifically for institutional environment protocols.
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
