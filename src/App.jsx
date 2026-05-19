import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sunrise, Moon, BookOpen, ChevronRight, Plus, Check,
  Calendar as CalendarIcon, BarChart3, Sparkles, ArrowLeft, Pencil
} from 'lucide-react';

const COLORS = {
  bg: '#F2EDE3',
  surface: '#FAF6EC',
  surfaceAlt: '#EDE6D5',
  ink: '#1C1815',
  inkSubtle: '#5A5248',
  inkFaint: '#9C9484',
  hairline: '#D9D0BD',
  hairlineSoft: '#E8E0CE',
  accent: '#0E5145',
};

const PILLARS = {
  'awareness': { name: 'Awareness', color: '#B8842E', description: 'The practice of seeing what is.' },
  'self-acceptance': { name: 'Self-Acceptance', color: '#A86568', description: 'The refusal to be in an adversarial relationship with yourself.' },
  'self-responsibility': { name: 'Self-Responsibility', color: '#6E8462', description: 'You are the cause of your own life.' },
  'self-assertiveness': { name: 'Self-Assertiveness', color: '#B85B37', description: 'Living and acting from your convictions.' },
  'living-purposefully': { name: 'Living Purposefully', color: '#356868', description: 'Choosing intention over drift.' },
  'integrity': { name: 'Personal Integrity', color: '#4E4E80', description: 'Alignment of values, conviction, and behavior.' },
};

const PILLAR_ORDER = ['awareness','self-acceptance','self-responsibility','self-assertiveness','living-purposefully','integrity'];

function pillarForWeek(week) {
  const idx = Math.floor((week - 1) / 2) % PILLAR_ORDER.length;
  return PILLAR_ORDER[idx];
}

const STEMS = [
  { id: 'aw-m1', text: 'If I bring 5% more awareness to my life today...', pillar: 'awareness', time: 'morning' },
  { id: 'aw-m2', text: 'If I bring 5% more awareness to my important relationships today...', pillar: 'awareness', time: 'morning' },
  { id: 'aw-m3', text: 'If I bring 5% more awareness to my deepest needs and wants today...', pillar: 'awareness', time: 'morning' },
  { id: 'aw-m4', text: 'If I bring 5% more awareness to my emotions today...', pillar: 'awareness', time: 'morning' },
  { id: 'aw-e1', text: 'If any of what I wrote today is true, it might be helpful if I...', pillar: 'awareness', time: 'evening' },
  { id: 'aw-w1', text: 'If any of what I have been writing this week is true...', pillar: 'awareness', time: 'weekend' },
  { id: 'sa-m1', text: 'If I bring 5% more self-acceptance to my life today...', pillar: 'self-acceptance', time: 'morning' },
  { id: 'sa-m2', text: 'If I am 5% more accepting of my body...', pillar: 'self-acceptance', time: 'morning' },
  { id: 'sa-m3', text: 'If I am 5% more accepting of my emotions...', pillar: 'self-acceptance', time: 'morning' },
  { id: 'sa-m4', text: 'If I am 5% more accepting of my thoughts...', pillar: 'self-acceptance', time: 'morning' },
  { id: 'sa-m5', text: 'If I am 5% more accepting of my fears...', pillar: 'self-acceptance', time: 'morning' },
  { id: 'sa-m6', text: 'If I am 5% more accepting of my conflicts...', pillar: 'self-acceptance', time: 'morning' },
  { id: 'sa-e1', text: 'If any of what I wrote today is true, it might be helpful if I...', pillar: 'self-acceptance', time: 'evening' },
  { id: 'sa-w1', text: 'If any of what I have been writing this week is true...', pillar: 'self-acceptance', time: 'weekend' },
  { id: 'sr-m1', text: 'If I take 5% more responsibility for my life and well-being today...', pillar: 'self-responsibility', time: 'morning' },
  { id: 'sr-m2', text: 'If I take 5% more responsibility for the attainment of my goals...', pillar: 'self-responsibility', time: 'morning' },
  { id: 'sr-m3', text: 'If I take 5% more responsibility for the success of my relationships...', pillar: 'self-responsibility', time: 'morning' },
  { id: 'sr-m4', text: 'If I take 5% more responsibility for my personal happiness...', pillar: 'self-responsibility', time: 'morning' },
  { id: 'sr-m5', text: 'If I take 5% more responsibility for my choice of companions...', pillar: 'self-responsibility', time: 'morning' },
  { id: 'sr-e1', text: 'If any of what I wrote today is true, it might be helpful if I...', pillar: 'self-responsibility', time: 'evening' },
  { id: 'sr-w1', text: 'If any of what I have been writing this week is true...', pillar: 'self-responsibility', time: 'weekend' },
  { id: 'sas-m1', text: 'If I am 5% more self-assertive today...', pillar: 'self-assertiveness', time: 'morning' },
  { id: 'sas-m2', text: 'If I treat my thoughts and feelings with more respect today...', pillar: 'self-assertiveness', time: 'morning' },
  { id: 'sas-m3', text: 'If I express my wants more freely today...', pillar: 'self-assertiveness', time: 'morning' },
  { id: 'sas-m4', text: 'If I stand up for my values more confidently...', pillar: 'self-assertiveness', time: 'morning' },
  { id: 'sas-e1', text: 'If any of what I wrote today is true, it might be helpful if I...', pillar: 'self-assertiveness', time: 'evening' },
  { id: 'sas-w1', text: 'If any of what I have been writing this week is true...', pillar: 'self-assertiveness', time: 'weekend' },
  { id: 'lp-m1', text: 'If I bring 5% more purposefulness to my life today...', pillar: 'living-purposefully', time: 'morning' },
  { id: 'lp-m2', text: 'If I take more responsibility for fulfilling my wants...', pillar: 'living-purposefully', time: 'morning' },
  { id: 'lp-m3', text: 'If I operate 5% more purposefully at work today...', pillar: 'living-purposefully', time: 'morning' },
  { id: 'lp-m4', text: 'If I am 5% more purposeful in my relationships...', pillar: 'living-purposefully', time: 'morning' },
  { id: 'lp-e1', text: 'If any of what I wrote today is true, it might be helpful if I...', pillar: 'living-purposefully', time: 'evening' },
  { id: 'lp-w1', text: 'If any of what I have been writing this week is true...', pillar: 'living-purposefully', time: 'weekend' },
  { id: 'pi-m1', text: 'If I bring 5% more integrity to my life today...', pillar: 'integrity', time: 'morning' },
  { id: 'pi-m2', text: 'If I remain loyal to the values I truly believe are right...', pillar: 'integrity', time: 'morning' },
  { id: 'pi-m3', text: 'If I bring more integrity to my work...', pillar: 'integrity', time: 'morning' },
  { id: 'pi-m4', text: 'When I avoid the issue of integrity...', pillar: 'integrity', time: 'evening' },
  { id: 'pi-e1', text: 'If any of what I wrote today is true, it might be helpful if I...', pillar: 'integrity', time: 'evening' },
  { id: 'pi-w1', text: 'If any of what I have been writing this week is true...', pillar: 'integrity', time: 'weekend' },
];

// Storage: localStorage (works in WebView on Android via Capacitor)
function loadAll() {
  try {
    const configStr = localStorage.getItem('config');
    const entriesStr = localStorage.getItem('entries');
    return {
      config: configStr ? JSON.parse(configStr) : null,
      entries: entriesStr ? JSON.parse(entriesStr) : [],
    };
  } catch (e) {
    return { config: null, entries: [] };
  }
}
function saveConfig(config) { try { localStorage.setItem('config', JSON.stringify(config)); } catch (e) {} }
function saveEntries(entries) { try { localStorage.setItem('entries', JSON.stringify(entries)); } catch (e) {} }

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function weekFromStartDate(startISO) {
  if (!startISO) return 1;
  const start = new Date(startISO + 'T00:00:00');
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.floor((now - start) / 86400000);
  return Math.max(1, Math.floor(diff / 7) + 1);
}
function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
function isWeekend() { const d = new Date().getDay(); return d === 0 || d === 6; }
function todayISOFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function calcStreak(entries) {
  if (!entries.length) return 0;
  const dates = new Set(entries.map(e => e.date));
  let streak = 0;
  const d = new Date(); d.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const iso = todayISOFromDate(d);
    if (dates.has(iso)) { streak++; d.setDate(d.getDate() - 1); }
    else { if (i === 0) { d.setDate(d.getDate() - 1); continue; } break; }
  }
  return streak;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('today');
  const [config, setConfig] = useState(null);
  const [entries, setEntries] = useState([]);
  const [activeStemId, setActiveStemId] = useState(null);
  const [viewStemId, setViewStemId] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Geist:wght@300..700&family=Geist+Mono:wght@300..600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const data = loadAll();
    if (!data.config) {
      const newConfig = { startDate: todayISO() };
      saveConfig(newConfig);
      setConfig(newConfig);
    } else {
      setConfig(data.config);
    }
    setEntries(data.entries);
    setLoading(false);
  }, []);

  const currentWeek = useMemo(() => weekFromStartDate(config?.startDate), [config]);
  const currentPillar = useMemo(() => pillarForWeek(currentWeek), [currentWeek]);
  const streak = useMemo(() => calcStreak(entries), [entries]);

  const saveEntry = (stemId, completions, session) => {
    const newEntry = { id: `${todayISO()}-${stemId}-${Date.now()}`, stemId, date: todayISO(), session, completions, createdAt: new Date().toISOString() };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    saveEntries(updated);
  };

  const resetStartDate = (iso) => {
    const newConfig = { ...config, startDate: iso };
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  const activeStem = activeStemId ? STEMS.find(s => s.id === activeStemId) : null;
  const viewStem = viewStemId ? STEMS.find(s => s.id === viewStemId) : null;

  if (loading) {
    return <div style={{minHeight:'100vh',background:COLORS.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:COLORS.inkFaint,fontSize:12,letterSpacing:'0.15em',textTransform:'uppercase'}}>Loading</div>;
  }

  return (
    <div style={{minHeight:'100vh',background:COLORS.bg,color:COLORS.ink,fontFamily:'Geist, system-ui, sans-serif',WebkitFontSmoothing:'antialiased'}}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        .stem-font { font-family: 'Fraunces', Georgia, serif; font-variation-settings: 'opsz' 144, 'SOFT' 30; }
        .stem-italic { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-variation-settings: 'opsz' 144, 'SOFT' 50; }
        .mono { font-family: 'Geist Mono', ui-monospace, monospace; }
        .meta { font-family: 'Geist Mono', monospace; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${COLORS.inkFaint}; }
        textarea { resize: none; outline: none; }
        button { font-family: inherit; cursor: pointer; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .fade-in { animation: fadeIn 0.5s cubic-bezier(.2,.7,.3,1) both; }
        .stem-card:active { background: #FFFAEE !important; }
      `}</style>
      {view !== 'practice' && (
        <Nav view={view} setView={(v) => { setView(v); setActiveStemId(null); setViewStemId(null); }} />
      )}
      <main style={{maxWidth:720,margin:'0 auto',padding:'0 22px 100px'}}>
        {view === 'today' && <TodayView entries={entries} currentWeek={currentWeek} currentPillar={currentPillar} streak={streak} onPickStem={(id) => { setActiveStemId(id); setView('practice'); }} />}
        {view === 'library' && !viewStemId && <LibraryView entries={entries} onPickStem={(id) => { setActiveStemId(id); setView('practice'); }} onViewStem={(id) => setViewStemId(id)} />}
        {view === 'library' && viewStem && <StemDetailView stem={viewStem} entries={entries.filter(e => e.stemId === viewStem.id)} onBack={() => setViewStemId(null)} onPractice={() => { setActiveStemId(viewStem.id); setView('practice'); }} />}
        {view === 'history' && <HistoryView entries={entries} onClickStem={(id) => { setViewStemId(id); setView('library'); }} />}
        {view === 'settings' && <SettingsView config={config} entries={entries} onSetStartDate={resetStartDate} currentWeek={currentWeek} currentPillar={currentPillar} />}
        {view === 'practice' && activeStem && <PracticeView stem={activeStem} onClose={() => { setActiveStemId(null); setView('today'); }} onSave={(completions, session) => saveEntry(activeStem.id, completions, session)} />}
      </main>
    </div>
  );
}

function Nav({ view, setView }) {
  const tabs = [{id:'today',label:'Today'},{id:'library',label:'Library'},{id:'history',label:'History'},{id:'settings',label:'Settings'}];
  return (
    <header style={{borderBottom:`1px solid ${COLORS.hairlineSoft}`,marginBottom:32,background:COLORS.bg,position:'sticky',top:0,zIndex:10}}>
      <div style={{maxWidth:720,margin:'0 auto',padding:'22px 22px 0'}}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:18}}>
          <div className="stem-italic" style={{fontSize:22,fontWeight:400,letterSpacing:'-0.02em'}}>6pills</div>
          <div className="meta">Daily Practice</div>
        </div>
        <nav style={{display:'flex',gap:26,paddingBottom:12}}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{background:'none',border:'none',padding:'4px 0',fontSize:13.5,color:view===t.id?COLORS.ink:COLORS.inkFaint,fontWeight:view===t.id?500:400,borderBottom:view===t.id?`1.5px solid ${COLORS.ink}`:'1.5px solid transparent',marginBottom:-13,transition:'color 0.2s'}}>{t.label}</button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="meta" style={{marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontWeight:500,color:COLORS.ink,fontFamily:'Fraunces, Georgia, serif',fontVariationSettings:"'opsz' 144"}}>{value}</div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <section style={{marginBottom:36}}>
      <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:14,color:COLORS.inkSubtle}}>
        {icon}<span className="meta" style={{color:COLORS.inkSubtle}}>{title}</span>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>{children}</div>
    </section>
  );
}

function StemCard({ stem, done, onPractice }) {
  const pillar = PILLARS[stem.pillar];
  return (
    <button onClick={onPractice} className="stem-card" style={{background:COLORS.surface,border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3,padding:'20px 22px',textAlign:'left',width:'100%',display:'flex',alignItems:'flex-start',gap:16,transition:'background 0.2s',position:'relative'}}>
      <div style={{width:3,alignSelf:'stretch',background:pillar.color,borderRadius:2,marginLeft:-8,marginRight:4,opacity:0.7}} />
      <div style={{flex:1}}>
        <div className="stem-font" style={{fontSize:17,lineHeight:1.45,color:COLORS.ink,fontWeight:400}}>{stem.text}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,color:done?pillar.color:COLORS.inkFaint,marginTop:2}}>
        {done && <Check size={15} strokeWidth={2} />}
        <ChevronRight size={15} strokeWidth={1.5} />
      </div>
    </button>
  );
}

function TodayView({ entries, currentWeek, currentPillar, streak, onPickStem }) {
  const pillarMeta = PILLARS[currentPillar];
  const today = todayISO();
  const todaysEntries = entries.filter(e => e.date === today);
  const completedStemIds = new Set(todaysEntries.map(e => e.stemId));
  const isWknd = isWeekend();
  const morningStems = STEMS.filter(s => s.pillar === currentPillar && s.time === 'morning');
  const eveningStems = STEMS.filter(s => s.pillar === currentPillar && s.time === 'evening');
  const weekendStems = STEMS.filter(s => s.pillar === currentPillar && s.time === 'weekend');
  return (
    <div className="fade-in">
      <div style={{marginBottom:36}}>
        <div className="meta" style={{marginBottom:12}}>{formatDate(today)}</div>
        <h1 className="stem-font" style={{fontSize:40,lineHeight:1.05,fontWeight:400,letterSpacing:'-0.025em',margin:'0 0 16px'}}>
          Week {currentWeek}.<br />
          <span className="stem-italic" style={{color:pillarMeta.color,fontStyle:'italic'}}>{pillarMeta.name}</span>
        </h1>
        <p style={{color:COLORS.inkSubtle,fontSize:15,lineHeight:1.6,margin:0,maxWidth:480}}>{pillarMeta.description}</p>
      </div>
      <div style={{display:'flex',gap:32,marginBottom:40,padding:'20px 0',borderTop:`1px solid ${COLORS.hairlineSoft}`,borderBottom:`1px solid ${COLORS.hairlineSoft}`}}>
        <Stat label="Streak" value={streak} />
        <Stat label="Today" value={todaysEntries.length} />
        <Stat label="All time" value={entries.length} />
      </div>
      <Section title="Morning practice" icon={<Sunrise size={14} strokeWidth={1.5} />}>
        {morningStems.map(s => <StemCard key={s.id} stem={s} done={completedStemIds.has(s.id)} onPractice={() => onPickStem(s.id)} />)}
      </Section>
      <Section title="Evening reflection" icon={<Moon size={14} strokeWidth={1.5} />}>
        {eveningStems.map(s => <StemCard key={s.id} stem={s} done={completedStemIds.has(s.id)} onPractice={() => onPickStem(s.id)} />)}
      </Section>
      {isWknd && weekendStems.length > 0 && (
        <Section title="Weekend review" icon={<Sparkles size={14} strokeWidth={1.5} />}>
          {weekendStems.map(s => <StemCard key={s.id} stem={s} done={completedStemIds.has(s.id)} onPractice={() => onPickStem(s.id)} />)}
        </Section>
      )}
    </div>
  );
}

function PracticeView({ stem, onClose, onSave }) {
  const pillar = PILLARS[stem.pillar];
  const [completions, setCompletions] = useState(['']);
  const [showSaved, setShowSaved] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const autosize = (el) => { if (!el) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
  const addCompletion = () => {
    setCompletions(prev => [...prev, '']);
    setTimeout(() => { const next = inputRefs.current[completions.length]; next?.focus(); autosize(next); }, 50);
  };
  const updateCompletion = (i, val) => setCompletions(prev => prev.map((c, idx) => idx === i ? val : c));
  const removeCompletion = (i) => { if (completions.length === 1) { setCompletions(['']); return; } setCompletions(prev => prev.filter((_, idx) => idx !== i)); };
  const handleKeyDown = (e, i) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (i === completions.length - 1) addCompletion(); else inputRefs.current[i + 1]?.focus(); }
    else if (e.key === 'Backspace' && completions[i] === '' && completions.length > 1) { e.preventDefault(); removeCompletion(i); setTimeout(() => inputRefs.current[Math.max(0, i - 1)]?.focus(), 50); }
  };
  const handleSave = () => {
    const filled = completions.map(c => c.trim()).filter(Boolean);
    if (filled.length === 0) { onClose(); return; }
    onSave(filled, stem.time);
    setShowSaved(true);
    setTimeout(() => onClose(), 950);
  };
  const filledCount = completions.filter(c => c.trim()).length;

  return (
    <div className="fade-in" style={{paddingTop:24,minHeight:'calc(100vh - 100px)',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
        <button onClick={onClose} style={{background:'none',border:'none',padding:'6px 0',display:'flex',alignItems:'center',gap:5,color:COLORS.inkSubtle,fontSize:13}}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Back
        </button>
        <div className="meta" style={{color:pillar.color}}>{pillar.name} · {stem.time}</div>
      </div>
      <div style={{marginBottom:32,padding:'24px 0',borderTop:`1px solid ${pillar.color}40`,borderBottom:`1px solid ${pillar.color}40`}}>
        <div className="stem-italic" style={{fontSize:26,lineHeight:1.3,fontWeight:400,color:COLORS.ink,letterSpacing:'-0.01em'}}>{stem.text}</div>
      </div>
      <div style={{marginBottom:32,flex:1}}>
        <div className="meta" style={{marginBottom:18,display:'flex',justifyContent:'space-between'}}>
          <span>Your completions</span>
          <span style={{color:filledCount>=6?pillar.color:COLORS.inkFaint}}>{filledCount} of 6–10</span>
        </div>
        {completions.map((c, i) => (
          <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 0',borderBottom:`1px solid ${COLORS.hairlineSoft}`}}>
            <div className="mono" style={{color:COLORS.inkFaint,fontSize:11,minWidth:18,paddingTop:8,letterSpacing:'0.05em'}}>{String(i + 1).padStart(2, '0')}</div>
            <textarea ref={el => { inputRefs.current[i] = el; if (el) autosize(el); }} value={c} onChange={e => { updateCompletion(i, e.target.value); autosize(e.target); }} onKeyDown={e => handleKeyDown(e, i)} placeholder="…" rows={1} style={{flex:1,background:'transparent',border:'none',fontSize:17,lineHeight:1.55,color:COLORS.ink,fontFamily:'Fraunces, Georgia, serif',fontVariationSettings:"'opsz' 144, 'SOFT' 30",padding:0,minHeight:26,overflow:'hidden'}} />
          </div>
        ))}
        <button onClick={addCompletion} style={{background:'none',border:'none',padding:'14px 0 14px 30px',color:COLORS.inkFaint,fontSize:13,display:'flex',alignItems:'center',gap:6}}>
          <Plus size={14} strokeWidth={1.5} /> Add another
        </button>
      </div>
      <div style={{position:'sticky',bottom:0,background:`linear-gradient(to top, ${COLORS.bg} 75%, transparent)`,padding:'20px 0 4px'}}>
        <button onClick={handleSave} disabled={showSaved} style={{width:'100%',background:showSaved?pillar.color:COLORS.ink,color:COLORS.surface,border:'none',borderRadius:3,padding:'16px 24px',fontSize:12.5,letterSpacing:'0.14em',textTransform:'uppercase',fontWeight:500,transition:'background 0.3s',display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'Geist Mono, monospace'}}>
          {showSaved ? (<><Check size={15} strokeWidth={2} /> Saved</>) : 'Finish & save'}
        </button>
        <div className="meta" style={{textAlign:'center',marginTop:12,color:COLORS.inkFaint}}>Write fast. Don't edit. There are no wrong answers.</div>
      </div>
    </div>
  );
}

function LibraryView({ entries, onPickStem, onViewStem }) {
  const entriesByStem = useMemo(() => { const map = {}; entries.forEach(e => { map[e.stemId] = (map[e.stemId] || 0) + 1; }); return map; }, [entries]);
  return (
    <div className="fade-in">
      <h1 className="stem-font" style={{fontSize:36,lineHeight:1.05,fontWeight:400,letterSpacing:'-0.025em',margin:'0 0 12px'}}>Library</h1>
      <p style={{color:COLORS.inkSubtle,fontSize:14.5,lineHeight:1.6,margin:'0 0 40px',maxWidth:480}}>All sentence stems, organized by pillar. Tap any stem to practice or revisit past completions.</p>
      {PILLAR_ORDER.map(pillarId => {
        const pillar = PILLARS[pillarId];
        const stems = STEMS.filter(s => s.pillar === pillarId);
        return (
          <section key={pillarId} style={{marginBottom:44}}>
            <div style={{marginBottom:18,paddingBottom:10,borderBottom:`1px solid ${pillar.color}55`}}>
              <div className="stem-italic" style={{fontSize:24,color:pillar.color,fontWeight:400,letterSpacing:'-0.01em'}}>{pillar.name}</div>
              <div style={{fontSize:13,color:COLORS.inkSubtle,marginTop:4}}>{pillar.description}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column'}}>
              {stems.map(s => {
                const count = entriesByStem[s.id] || 0;
                return (
                  <button key={s.id} onClick={() => count > 0 ? onViewStem(s.id) : onPickStem(s.id)} style={{background:'none',border:'none',borderBottom:`1px solid ${COLORS.hairlineSoft}`,padding:'16px 4px',textAlign:'left',display:'flex',alignItems:'flex-start',gap:14}}>
                    <div className="meta" style={{minWidth:58,color:COLORS.inkFaint,paddingTop:2}}>{s.time}</div>
                    <div className="stem-font" style={{flex:1,fontSize:15.5,lineHeight:1.45,color:COLORS.ink}}>{s.text}</div>
                    <div style={{display:'flex',alignItems:'center',gap:8,color:COLORS.inkFaint,paddingTop:2}}>
                      {count > 0 && <span className="mono" style={{fontSize:10.5,padding:'2px 7px',background:pillar.color+'20',color:pillar.color,borderRadius:2,letterSpacing:'0.05em'}}>{count}</span>}
                      <ChevronRight size={14} strokeWidth={1.5} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function StemDetailView({ stem, entries, onBack, onPractice }) {
  const pillar = PILLARS[stem.pillar];
  const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="fade-in">
      <button onClick={onBack} style={{background:'none',border:'none',padding:'4px 0 22px',color:COLORS.inkSubtle,fontSize:13,display:'flex',alignItems:'center',gap:5}}>
        <ArrowLeft size={14} strokeWidth={1.5} /> Back to library
      </button>
      <div className="meta" style={{color:pillar.color,marginBottom:14}}>{pillar.name} · {stem.time}</div>
      <h1 className="stem-italic" style={{fontSize:28,lineHeight:1.25,fontWeight:400,letterSpacing:'-0.01em',margin:'0 0 32px'}}>{stem.text}</h1>
      <button onClick={onPractice} style={{background:COLORS.ink,color:COLORS.surface,border:'none',borderRadius:3,padding:'13px 22px',fontSize:12,letterSpacing:'0.14em',textTransform:'uppercase',fontWeight:500,marginBottom:44,display:'inline-flex',alignItems:'center',gap:8,fontFamily:'Geist Mono, monospace'}}>
        <Pencil size={13} strokeWidth={1.5} /> Practice this stem
      </button>
      {sorted.length === 0 ? (
        <div style={{padding:'40px 30px',textAlign:'center',color:COLORS.inkFaint,fontSize:14,fontStyle:'italic',border:`1px dashed ${COLORS.hairline}`,borderRadius:4}}>No past entries yet. Start your first one.</div>
      ) : (
        <div>
          <div className="meta" style={{marginBottom:18}}>Past entries · {sorted.length}</div>
          {sorted.map(entry => (
            <div key={entry.id} style={{marginBottom:24,padding:'22px 24px',background:COLORS.surface,border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3}}>
              <div className="meta" style={{marginBottom:14}}>{formatDate(entry.date)}</div>
              {entry.completions.map((c, i) => (
                <div key={i} style={{display:'flex',gap:12,padding:'5px 0'}}>
                  <span className="mono" style={{color:COLORS.inkFaint,fontSize:10.5,paddingTop:6,minWidth:18,letterSpacing:'0.05em'}}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="stem-font" style={{flex:1,fontSize:15,lineHeight:1.55,color:COLORS.ink}}>{c}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryView({ entries, onClickStem }) {
  const grouped = useMemo(() => { const map = {}; entries.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); }); return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])); }, [entries]);
  return (
    <div className="fade-in">
      <h1 className="stem-font" style={{fontSize:36,lineHeight:1.05,fontWeight:400,letterSpacing:'-0.025em',margin:'0 0 12px'}}>History</h1>
      <p style={{color:COLORS.inkSubtle,fontSize:14.5,lineHeight:1.6,margin:'0 0 40px'}}>Every entry you've written, by date. Tap to see all past work on that stem.</p>
      {grouped.length === 0 ? (
        <div style={{padding:'60px 30px',textAlign:'center',color:COLORS.inkFaint,fontSize:14,fontStyle:'italic',border:`1px dashed ${COLORS.hairline}`,borderRadius:4}}>Your entries will collect here as you write.</div>
      ) : (
        <div>
          {grouped.map(([date, dayEntries]) => (
            <div key={date} style={{marginBottom:30}}>
              <div className="meta" style={{marginBottom:12,color:COLORS.ink}}>{formatDate(date)}</div>
              {dayEntries.map(entry => {
                const stem = STEMS.find(s => s.id === entry.stemId);
                if (!stem) return null;
                const pillar = PILLARS[stem.pillar];
                return (
                  <button key={entry.id} onClick={() => onClickStem(stem.id)} style={{background:COLORS.surface,border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3,padding:'16px 20px',marginBottom:8,width:'100%',textAlign:'left',display:'flex',gap:14,alignItems:'flex-start'}}>
                    <div style={{width:2,alignSelf:'stretch',background:pillar.color,opacity:0.6,borderRadius:1,marginLeft:-6,marginRight:4}} />
                    <div style={{flex:1}}>
                      <div className="stem-font" style={{fontSize:15,lineHeight:1.45,color:COLORS.ink,marginBottom:6}}>{stem.text}</div>
                      <div className="meta" style={{color:pillar.color}}>{pillar.name} · {entry.completions.length} completions</div>
                    </div>
                    <ChevronRight size={14} strokeWidth={1.5} style={{color:COLORS.inkFaint,marginTop:2}} />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsView({ config, entries, onSetStartDate, currentWeek, currentPillar }) {
  const [date, setDate] = useState(config?.startDate || todayISO());
  const pillar = PILLARS[currentPillar];
  return (
    <div className="fade-in">
      <h1 className="stem-font" style={{fontSize:36,lineHeight:1.05,fontWeight:400,letterSpacing:'-0.025em',margin:'0 0 40px'}}>Settings</h1>
      <Section title="Program" icon={<CalendarIcon size={14} strokeWidth={1.5} />}>
        <div style={{background:COLORS.surface,padding:24,border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3}}>
          <div style={{marginBottom:22}}>
            <div className="meta" style={{marginBottom:6}}>Currently on</div>
            <div className="stem-italic" style={{fontSize:22,color:pillar.color}}>Week {currentWeek} · {pillar.name}</div>
          </div>
          <label style={{display:'block'}}>
            <div className="meta" style={{marginBottom:8}}>Program start date</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{background:COLORS.bg,border:`1px solid ${COLORS.hairline}`,borderRadius:3,padding:'10px 12px',fontSize:14,fontFamily:'Geist Mono, monospace',color:COLORS.ink,width:'100%',maxWidth:220}} />
          </label>
          <button onClick={() => onSetStartDate(date)} disabled={date === config?.startDate} style={{marginTop:14,background:date===config?.startDate?COLORS.surfaceAlt:COLORS.ink,color:date===config?.startDate?COLORS.inkFaint:COLORS.surface,border:'none',borderRadius:3,padding:'10px 18px',fontSize:11.5,letterSpacing:'0.14em',textTransform:'uppercase',fontWeight:500,cursor:date===config?.startDate?'default':'pointer',fontFamily:'Geist Mono, monospace'}}>Update</button>
        </div>
      </Section>
      <Section title="Practice stats" icon={<BarChart3 size={14} strokeWidth={1.5} />}>
        <div style={{background:COLORS.surface,padding:24,border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:24}}>
            <Stat label="Total entries" value={entries.length} />
            <Stat label="Completions written" value={entries.reduce((sum, e) => sum + e.completions.length, 0)} />
          </div>
        </div>
      </Section>
      <Section title="About" icon={<BookOpen size={14} strokeWidth={1.5} />}>
        <p style={{fontSize:14,lineHeight:1.65,color:COLORS.inkSubtle,margin:0}}>A daily sentence-completion practice based on the work of Nathaniel Branden in <em>The Six Pillars of Self-Esteem</em>. Write 6–10 endings to each stem quickly, without editing.</p>
      </Section>
    </div>
  );
}
