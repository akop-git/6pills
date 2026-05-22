import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sunrise, Moon, BookOpen, ChevronRight, Check,
  Calendar as CalendarIcon, BarChart3, ArrowLeft,
  Pencil, Repeat
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
  morning: '#B8842E',
  night: '#4E4E80',
  review: '#356868',
};

// ───────────────────────── Prompt rotations ─────────────────────────

const POSTURE_PROMPTS = [
  'How does the operator I want to be walk into today?',
  "What would I do today if I weren't trying to manage anyone's perception?",
  "Where am I likely to over-explain today, and how will I stay short?",
  "What's one place I'll catch myself being defensive today?",
  "Where will I likely seek validation today — and what's a cleaner move?",
  'If today were a calm day, what would I refuse to react to?',
  "Whose opinion am I going to deprioritize today, deliberately?",
  "What's one moment today where I'll hold my position without escalating?",
  "What's one rep of self-trust I can build today by following through?",
  "What does the version of me I'm building need from me today?",
];

const TRUTH_PROMPTS = [
  'What did I avoid today and why?',
  'Where was I dishonest with myself today, even slightly?',
  "What did I say I'd do this week and haven't done?",
  'What am I pretending not to know?',
  'Who did I judge today, and what does that judgment say about me?',
  'What am I afraid people will find out about me?',
  'Where did I prioritize looking good over being honest today?',
  "What did I procrastinate on today, and what's the real reason?",
  'What feedback have I dismissed too quickly recently?',
  "What would the person I want to be have done differently today?",
];

const STATE_OPTIONS = ['Grounded', 'Wired', 'Foggy', 'Heavy'];

// ───────────────────────── Storage ─────────────────────────

function loadAll() {
  try {
    const configStr = localStorage.getItem('config_v2');
    const entriesStr = localStorage.getItem('entries_v2');
    return {
      config: configStr ? JSON.parse(configStr) : null,
      entries: entriesStr ? JSON.parse(entriesStr) : [],
    };
  } catch (e) {
    return { config: null, entries: [] };
  }
}
function saveConfig(c) { try { localStorage.setItem('config_v2', JSON.stringify(c)); } catch (e) {} }
function saveEntries(e) { try { localStorage.setItem('entries_v2', JSON.stringify(e)); } catch (e2) {} }

// ───────────────────────── Date helpers ─────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function dayNumberFromStart(startISO, refISO = todayISO()) {
  if (!startISO) return 1;
  const start = new Date(startISO + 'T00:00:00');
  const ref = new Date(refISO + 'T00:00:00');
  const diff = Math.floor((ref - start) / 86400000);
  return diff + 1; // Day 1 = start day
}
function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });
}
function formatDateShort(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  });
}
function promptForDay(dayN, list) {
  // dayN cycles through 1..10 within a 10-day block, repeating
  const idx = ((dayN - 1) % 10 + 10) % 10;
  return list[idx];
}
function startOfWeekISO(refISO = todayISO()) {
  // Monday-based week
  const d = new Date(refISO + 'T00:00:00');
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const offsetToMon = (day + 6) % 7;
  d.setDate(d.getDate() - offsetToMon);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function isoDaysFrom(startISO, count) {
  const out = [];
  const d = new Date(startISO + 'T00:00:00');
  for (let i = 0; i < count; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}
function calcStreak(entries) {
  if (!entries.length) return 0;
  const dates = new Set(entries.map(e => e.date));
  let streak = 0;
  const d = new Date(); d.setHours(0,0,0,0);
  for (let i = 0; i < 365; i++) {
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (dates.has(iso)) { streak++; d.setDate(d.getDate() - 1); }
    else { if (i === 0) { d.setDate(d.getDate() - 1); continue; } break; }
  }
  return streak;
}

// ───────────────────────── App ─────────────────────────

export default function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('today');
  const [config, setConfig] = useState(null);
  const [entries, setEntries] = useState([]);
  const [activeForm, setActiveForm] = useState(null); // 'morning' | 'night' | 'weekly' | null
  const [editingEntryId, setEditingEntryId] = useState(null);

  // Load Google Fonts once
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,0..100;1,9..144,300..700,0..100&family=Geist:wght@300..700&family=Geist+Mono:wght@300..600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Initial load
  useEffect(() => {
    const data = loadAll();
    if (!data.config) {
      const newConfig = { startDate: todayISO(), name: '' };
      saveConfig(newConfig);
      setConfig(newConfig);
    } else {
      setConfig(data.config);
    }
    setEntries(data.entries);
    setLoading(false);
  }, []);

  const dayN = useMemo(() => dayNumberFromStart(config?.startDate), [config]);
  const streak = useMemo(() => calcStreak(entries), [entries]);

  const todayEntries = useMemo(
    () => entries.filter(e => e.date === todayISO()),
    [entries]
  );
  const morningToday = todayEntries.find(e => e.type === 'morning');
  const nightToday = todayEntries.find(e => e.type === 'night');

  const saveEntry = (entry) => {
    const exists = entries.find(e => e.id === entry.id);
    let updated;
    if (exists) {
      updated = entries.map(e => e.id === entry.id ? entry : e);
    } else {
      updated = [entry, ...entries];
    }
    setEntries(updated);
    saveEntries(updated);
  };

  const deleteEntry = (id) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  };

  const resetStartDate = (iso) => {
    const newConfig = { ...config, startDate: iso };
    setConfig(newConfig);
    saveConfig(newConfig);
  };

  if (loading) {
    return (
      <div style={{minHeight:'100vh',background:COLORS.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui',color:COLORS.inkFaint,fontSize:12,letterSpacing:'0.15em',textTransform:'uppercase'}}>
        Loading
      </div>
    );
  }

  // Form views take over the whole screen
  if (activeForm === 'morning') {
    return (
      <Shell>
        <MorningForm
          dayN={dayN}
          existing={editingEntryId ? entries.find(e => e.id === editingEntryId) : morningToday}
          onClose={() => { setActiveForm(null); setEditingEntryId(null); }}
          onSave={(data) => {
            const id = editingEntryId || morningToday?.id || `${todayISO()}-morning-${Date.now()}`;
            const baseDate = editingEntryId ? entries.find(e => e.id === editingEntryId)?.date : todayISO();
            saveEntry({
              id,
              type: 'morning',
              date: baseDate || todayISO(),
              dayN: editingEntryId ? entries.find(e => e.id === editingEntryId)?.dayN : dayN,
              createdAt: editingEntryId ? entries.find(e => e.id === editingEntryId)?.createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...data,
            });
            setActiveForm(null);
            setEditingEntryId(null);
          }}
        />
      </Shell>
    );
  }

  if (activeForm === 'night') {
    return (
      <Shell>
        <NightForm
          dayN={dayN}
          existing={editingEntryId ? entries.find(e => e.id === editingEntryId) : nightToday}
          onClose={() => { setActiveForm(null); setEditingEntryId(null); }}
          onSave={(data) => {
            const id = editingEntryId || nightToday?.id || `${todayISO()}-night-${Date.now()}`;
            const baseDate = editingEntryId ? entries.find(e => e.id === editingEntryId)?.date : todayISO();
            saveEntry({
              id,
              type: 'night',
              date: baseDate || todayISO(),
              dayN: editingEntryId ? entries.find(e => e.id === editingEntryId)?.dayN : dayN,
              createdAt: editingEntryId ? entries.find(e => e.id === editingEntryId)?.createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...data,
            });
            setActiveForm(null);
            setEditingEntryId(null);
          }}
        />
      </Shell>
    );
  }

  if (activeForm === 'weekly') {
    return (
      <Shell>
        <WeeklyForm
          entries={entries}
          existing={editingEntryId ? entries.find(e => e.id === editingEntryId) : null}
          onClose={() => { setActiveForm(null); setEditingEntryId(null); }}
          onSave={(data) => {
            const weekStart = data.weekStart;
            const id = editingEntryId || `weekly-${weekStart}-${Date.now()}`;
            saveEntry({
              id,
              type: 'weekly',
              date: weekStart,
              createdAt: editingEntryId ? entries.find(e => e.id === editingEntryId)?.createdAt : new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...data,
            });
            setActiveForm(null);
            setEditingEntryId(null);
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Nav view={view} setView={setView} />
      <main style={{maxWidth:720,margin:'0 auto',padding:'0 22px 100px'}}>
        {view === 'today' && (
          <TodayView
            dayN={dayN}
            streak={streak}
            entries={entries}
            morningToday={morningToday}
            nightToday={nightToday}
            onOpenMorning={() => setActiveForm('morning')}
            onOpenNight={() => setActiveForm('night')}
          />
        )}
        {view === 'history' && (
          <HistoryView
            entries={entries}
            onEdit={(id) => {
              const e = entries.find(x => x.id === id);
              if (!e) return;
              setEditingEntryId(id);
              setActiveForm(e.type);
            }}
            onDelete={deleteEntry}
          />
        )}
        {view === 'weekly' && (
          <WeeklyHomeView
            entries={entries}
            onOpenNew={() => setActiveForm('weekly')}
            onEdit={(id) => {
              setEditingEntryId(id);
              setActiveForm('weekly');
            }}
            onDelete={deleteEntry}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            config={config}
            entries={entries}
            dayN={dayN}
            onSetStartDate={resetStartDate}
            onWipe={() => {
              if (confirm('Wipe all entries? This cannot be undone.')) {
                setEntries([]);
                saveEntries([]);
              }
            }}
          />
        )}
      </main>
    </Shell>
  );
}

// ───────────────────────── Shell + Nav ─────────────────────────

function Shell({ children }) {
  return (
    <div style={{minHeight:'100vh',background:COLORS.bg,color:COLORS.ink,fontFamily:'Geist, system-ui, sans-serif',WebkitFontSmoothing:'antialiased'}}>
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        .stem-font { font-family: 'Fraunces', Georgia, serif; font-variation-settings: 'opsz' 144, 'SOFT' 30; }
        .stem-italic { font-family: 'Fraunces', Georgia, serif; font-style: italic; font-variation-settings: 'opsz' 144, 'SOFT' 50; }
        .mono { font-family: 'Geist Mono', ui-monospace, monospace; }
        .meta { font-family: 'Geist Mono', monospace; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${COLORS.inkFaint}; }
        textarea, input { resize: none; outline: none; }
        button { font-family: inherit; cursor: pointer; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .fade-in { animation: fadeIn 0.5s cubic-bezier(.2,.7,.3,1) both; }
      `}</style>
      {children}
    </div>
  );
}

function Nav({ view, setView }) {
  const tabs = [
    { id: 'today', label: 'Today' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ];
  return (
    <header style={{borderBottom:`1px solid ${COLORS.hairlineSoft}`,marginBottom:32,background:COLORS.bg,position:'sticky',top:0,zIndex:10}}>
      <div style={{maxWidth:720,margin:'0 auto',padding:'22px 22px 0'}}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',marginBottom:18}}>
          <div className="stem-italic" style={{fontSize:22,fontWeight:400,letterSpacing:'-0.02em'}}>6pills</div>
          <div className="meta">Operator Practice</div>
        </div>
        <nav style={{display:'flex',gap:26,paddingBottom:12}}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              style={{
                background:'none',border:'none',padding:'4px 0',fontSize:13.5,
                color:view===t.id?COLORS.ink:COLORS.inkFaint,
                fontWeight:view===t.id?500:400,
                borderBottom:view===t.id?`1.5px solid ${COLORS.ink}`:'1.5px solid transparent',
                marginBottom:-13,transition:'color 0.2s'
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

// ───────────────────────── Today view ─────────────────────────

function TodayView({ dayN, streak, entries, morningToday, nightToday, onOpenMorning, onOpenNight }) {
  const today = todayISO();
  const totalEntries = entries.length;
  const dayLabel = dayN < 1 ? 'Pre-launch' : dayN > 90 ? `Day ${dayN}` : `Day ${dayN} / 90`;

  return (
    <div className="fade-in">
      <div style={{marginBottom:36}}>
        <div className="meta" style={{marginBottom:12}}>{formatDate(today)}</div>
        <h1 className="stem-font" style={{fontSize:48,lineHeight:1.0,fontWeight:400,letterSpacing:'-0.03em',margin:'0 0 6px'}}>
          {dayLabel.split(' / ')[0]}
          {dayN >= 1 && dayN <= 90 && (
            <span className="stem-italic" style={{color:COLORS.inkFaint,fontStyle:'italic'}}> / 90</span>
          )}
        </h1>
        <p style={{color:COLORS.inkSubtle,fontSize:15,lineHeight:1.6,margin:'8px 0 0',maxWidth:480}}>
          Two sheets today. Morning to set the posture. Night to audit it.
        </p>
      </div>

      <div style={{display:'flex',gap:32,marginBottom:40,padding:'20px 0',borderTop:`1px solid ${COLORS.hairlineSoft}`,borderBottom:`1px solid ${COLORS.hairlineSoft}`}}>
        <Stat label="Streak" value={streak} />
        <Stat label="Today" value={(morningToday?1:0) + (nightToday?1:0)} suffix="/ 2" />
        <Stat label="All time" value={totalEntries} />
      </div>

      <SheetCard
        kind="morning"
        title="Morning Prime"
        subtitle="Set the posture before the day starts."
        accent={COLORS.morning}
        icon={<Sunrise size={16} strokeWidth={1.5} />}
        done={!!morningToday}
        onOpen={onOpenMorning}
      />

      <div style={{height:14}} />

      <SheetCard
        kind="night"
        title="Night Audit"
        subtitle="Tell the truth about how today actually went."
        accent={COLORS.night}
        icon={<Moon size={16} strokeWidth={1.5} />}
        done={!!nightToday}
        onOpen={onOpenNight}
      />
    </div>
  );
}

function SheetCard({ title, subtitle, accent, icon, done, onOpen }) {
  return (
    <button
      onClick={onOpen}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.hairlineSoft}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 3,
        padding: '22px 22px',
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{color:accent}}>{icon}</div>
      <div style={{flex:1}}>
        <div className="stem-font" style={{fontSize:22,lineHeight:1.2,color:COLORS.ink,marginBottom:4}}>
          {title}
        </div>
        <div style={{fontSize:13.5,color:COLORS.inkSubtle,lineHeight:1.5}}>{subtitle}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,color: done ? accent : COLORS.inkFaint}}>
        {done ? (
          <span className="meta" style={{display:'flex',alignItems:'center',gap:6,color:accent}}>
            <Check size={13} strokeWidth={2} /> Done
          </span>
        ) : (
          <ChevronRight size={18} strokeWidth={1.5} />
        )}
      </div>
    </button>
  );
}

// ───────────────────────── Shared form pieces ─────────────────────────

function Stat({ label, value, suffix }) {
  return (
    <div>
      <div className="meta" style={{marginBottom:6}}>{label}</div>
      <div style={{fontSize:22,fontWeight:500,color:COLORS.ink,fontFamily:'Fraunces, Georgia, serif',fontVariationSettings:"'opsz' 144"}}>
        {value}{suffix && <span style={{color:COLORS.inkFaint,fontSize:14,marginLeft:4}}>{suffix}</span>}
      </div>
    </div>
  );
}

function FormHeader({ onClose, accent, eyebrow, title, sub }) {
  return (
    <>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28,paddingTop:22}}>
        <button onClick={onClose} style={{background:'none',border:'none',padding:'6px 0',display:'flex',alignItems:'center',gap:5,color:COLORS.inkSubtle,fontSize:13}}>
          <ArrowLeft size={14} strokeWidth={1.5} /> Back
        </button>
        <div className="meta" style={{color:accent}}>{eyebrow}</div>
      </div>
      <div style={{marginBottom:32}}>
        <h1 className="stem-font" style={{fontSize:36,lineHeight:1.05,fontWeight:400,letterSpacing:'-0.025em',margin:'0 0 8px'}}>
          {title}
        </h1>
        {sub && <p style={{color:COLORS.inkSubtle,fontSize:14,lineHeight:1.6,margin:0}}>{sub}</p>}
      </div>
    </>
  );
}

function FieldLabel({ num, label, hint }) {
  return (
    <div style={{marginBottom:10,display:'flex',gap:10,alignItems:'baseline'}}>
      <span className="mono" style={{color:COLORS.inkFaint,fontSize:10.5,letterSpacing:'0.05em'}}>{String(num).padStart(2,'0')}</span>
      <div>
        <div style={{fontSize:14,fontWeight:500,color:COLORS.ink,letterSpacing:'0.01em'}}>{label}</div>
        {hint && <div style={{fontSize:12.5,color:COLORS.inkFaint,marginTop:3,lineHeight:1.5,fontStyle:'italic'}}>{hint}</div>}
      </div>
    </div>
  );
}

function MultilineInput({ value, onChange, placeholder, minRows=2 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={minRows}
      style={{
        width:'100%',
        background:COLORS.surface,
        border:`1px solid ${COLORS.hairlineSoft}`,
        borderRadius:3,
        padding:'12px 14px',
        fontSize:15.5,
        lineHeight:1.55,
        color:COLORS.ink,
        fontFamily:'Fraunces, Georgia, serif',
        fontVariationSettings:"'opsz' 144, 'SOFT' 30",
        minHeight: minRows * 26,
        overflow:'hidden',
      }}
    />
  );
}

function PromptBox({ accent, prompt }) {
  return (
    <div style={{
      padding:'14px 16px',
      background:`${accent}11`,
      border:`1px solid ${accent}33`,
      borderLeft:`2px solid ${accent}`,
      borderRadius:3,
      marginBottom:12,
    }}>
      <div className="meta" style={{color:accent,marginBottom:6}}>Today's prompt</div>
      <div className="stem-italic" style={{fontSize:17,lineHeight:1.4,color:COLORS.ink}}>{prompt}</div>
    </div>
  );
}

function SaveBar({ onSave, accent, label='Save' }) {
  return (
    <div style={{position:'sticky',bottom:0,background:`linear-gradient(to top, ${COLORS.bg} 75%, transparent)`,padding:'20px 0 8px',marginTop:24}}>
      <button onClick={onSave} style={{
        width:'100%',
        background:COLORS.ink,
        color:COLORS.surface,
        border:'none',borderRadius:3,
        padding:'16px 24px',
        fontSize:12.5,letterSpacing:'0.14em',textTransform:'uppercase',
        fontWeight:500,fontFamily:'Geist Mono, monospace',
        display:'flex',alignItems:'center',justifyContent:'center',gap:8,
      }}>
        <Check size={14} strokeWidth={2} /> {label}
      </button>
      <div className="meta" style={{textAlign:'center',marginTop:12,color:COLORS.inkFaint}}>
        Close the file. Move on.
      </div>
    </div>
  );
}

// ───────────────────────── Morning Form ─────────────────────────

function MorningForm({ dayN, existing, onClose, onSave }) {
  const accent = COLORS.morning;
  const posturePrompt = promptForDay(existing?.dayN ?? dayN, POSTURE_PROMPTS);

  const [state, setState] = useState(existing?.state || '');
  const [oneThing, setOneThing] = useState(existing?.oneThing || '');
  const [juniMove, setJuniMove] = useState(existing?.juniMove || '');
  const [postureAnswer, setPostureAnswer] = useState(existing?.postureAnswer || '');
  const [postureCarry, setPostureCarry] = useState(existing?.postureCarry || '');
  const [inputBoundary, setInputBoundary] = useState(existing?.inputBoundary || '');

  const handleSave = () => {
    onSave({
      state, oneThing, juniMove, posturePrompt, postureAnswer, postureCarry, inputBoundary,
    });
  };

  return (
    <main style={{maxWidth:720,margin:'0 auto',padding:'0 22px 100px'}}>
      <div className="fade-in">
        <FormHeader
          onClose={onClose}
          accent={accent}
          eyebrow={`Day ${existing?.dayN ?? dayN} · Morning`}
          title="Morning Prime"
          sub="Five questions. Set the posture before the day starts."
        />

        {/* 1. STATE CHECK */}
        <div style={{marginBottom:26}}>
          <FieldLabel num={1} label="State check" hint="How am I walking into today?" />
          <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:8}}>
            {STATE_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setState(opt === state ? '' : opt)}
                style={{
                  background: state === opt ? COLORS.ink : COLORS.surface,
                  color: state === opt ? COLORS.surface : COLORS.ink,
                  border: `1px solid ${state === opt ? COLORS.ink : COLORS.hairlineSoft}`,
                  borderRadius: 3,
                  padding: '13px 12px',
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: '0.02em',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* 2. ONE THING */}
        <div style={{marginBottom:26}}>
          <FieldLabel num={2} label="The one thing" hint="If I do this today, today is worth it." />
          <MultilineInput value={oneThing} onChange={setOneThing} placeholder="The single thing that matters most…" minRows={2} />
        </div>

        {/* 3. JUNI MOVE */}
        <div style={{marginBottom:26}}>
          <FieldLabel num={3} label="Juni move" hint='One concrete thing for Juni today. If "nothing today" — write that. Honesty over aspiration.' />
          <MultilineInput value={juniMove} onChange={setJuniMove} placeholder="A concrete step, or nothing today." minRows={2} />
        </div>

        {/* 4. POSTURE */}
        <div style={{marginBottom:26}}>
          <FieldLabel num={4} label="Posture for today" />
          <PromptBox accent={accent} prompt={posturePrompt} />
          <div style={{marginBottom:8}}>
            <div className="meta" style={{marginBottom:6}}>Answer</div>
            <MultilineInput value={postureAnswer} onChange={setPostureAnswer} placeholder="…" minRows={2} />
          </div>
          <div>
            <div className="meta" style={{marginBottom:6}}>How I'll carry it (1 line)</div>
            <MultilineInput value={postureCarry} onChange={setPostureCarry} placeholder="One line." minRows={1} />
          </div>
        </div>

        {/* 5. INPUT BOUNDARY */}
        <div style={{marginBottom:8}}>
          <FieldLabel num={5} label="Input boundary" hint="One input I'll protect myself from today — a person, meeting, content, thought loop." />
          <MultilineInput value={inputBoundary} onChange={setInputBoundary} placeholder="What I'll keep out." minRows={2} />
        </div>

        <SaveBar onSave={handleSave} accent={accent} label={existing ? 'Update' : 'Save & go'} />
      </div>
    </main>
  );
}

// ───────────────────────── Night Form ─────────────────────────

function NightForm({ dayN, existing, onClose, onSave }) {
  const accent = COLORS.night;
  const truthPrompt = promptForDay(existing?.dayN ?? dayN, TRUTH_PROMPTS);

  const [defensive, setDefensive] = useState(existing?.defensive ?? null); // true/false
  const [defensiveDetail, setDefensiveDetail] = useState(existing?.defensiveDetail || '');
  const [truthAnswer, setTruthAnswer] = useState(existing?.truthAnswer || '');
  const [juniMoved, setJuniMoved] = useState(existing?.juniMoved ?? null);
  const [juniWhat, setJuniWhat] = useState(existing?.juniWhat || '');
  const [juniBlocker, setJuniBlocker] = useState(existing?.juniBlocker || '');
  const [win, setWin] = useState(existing?.win || '');
  const [hadCharged, setHadCharged] = useState(existing?.hadCharged ?? !!(existing?.ampSaid || existing?.ampMeaning));
  const [ampSaid, setAmpSaid] = useState(existing?.ampSaid || '');
  const [ampMeaning, setAmpMeaning] = useState(existing?.ampMeaning || '');

  const handleSave = () => {
    onSave({
      defensive,
      defensiveDetail: defensive ? defensiveDetail : '',
      truthPrompt, truthAnswer,
      juniMoved,
      juniWhat: juniMoved === true ? juniWhat : '',
      juniBlocker: juniMoved === false ? juniBlocker : '',
      win,
      hadCharged,
      ampSaid: hadCharged ? ampSaid : '',
      ampMeaning: hadCharged ? ampMeaning : '',
    });
  };

  return (
    <main style={{maxWidth:720,margin:'0 auto',padding:'0 22px 100px'}}>
      <div className="fade-in">
        <FormHeader
          onClose={onClose}
          accent={accent}
          eyebrow={`Day ${existing?.dayN ?? dayN} · Night`}
          title="Night Audit"
          sub="No spin. Just what actually happened."
        />

        {/* 1. DEFENSIVE */}
        <div style={{marginBottom:26}}>
          <FieldLabel num={1} label="No-defense check" hint="Was I defensive today?" />
          <YesNoToggle value={defensive} onChange={setDefensive} accent={accent} />
          {defensive === true && (
            <div style={{marginTop:12}}>
              <div className="meta" style={{marginBottom:6}}>What was said and how I reacted</div>
              <MultilineInput value={defensiveDetail} onChange={setDefensiveDetail} placeholder="One line." minRows={2} />
            </div>
          )}
        </div>

        {/* 2. UNCOMFORTABLE TRUTH */}
        <div style={{marginBottom:26}}>
          <FieldLabel num={2} label="Uncomfortable truth" />
          <PromptBox accent={accent} prompt={truthPrompt} />
          <MultilineInput value={truthAnswer} onChange={setTruthAnswer} placeholder="1–2 honest lines." minRows={3} />
        </div>

        {/* 3. JUNI REP */}
        <div style={{marginBottom:26}}>
          <FieldLabel num={3} label="Juni rep" hint="Did I move Juni forward today?" />
          <YesNoToggle value={juniMoved} onChange={setJuniMoved} accent={accent} />
          {juniMoved === true && (
            <div style={{marginTop:12}}>
              <div className="meta" style={{marginBottom:6}}>What I did</div>
              <MultilineInput value={juniWhat} onChange={setJuniWhat} placeholder="…" minRows={2} />
            </div>
          )}
          {juniMoved === false && (
            <div style={{marginTop:12}}>
              <div className="meta" style={{marginBottom:6}}>What blocked me</div>
              <MultilineInput value={juniBlocker} onChange={setJuniBlocker} placeholder="The real reason." minRows={2} />
            </div>
          )}
        </div>

        {/* 4. ONE-LINE WIN */}
        <div style={{marginBottom:26}}>
          <FieldLabel num={4} label="One-line win" hint="One thing I did today I respect myself for." />
          <MultilineInput value={win} onChange={setWin} placeholder="One line." minRows={2} />
        </div>

        {/* 5. AMPLIFICATION CHECK */}
        <div style={{marginBottom:8}}>
          <FieldLabel num={5} label="Amplification check" hint="Only if there was a charged interaction today." />
          <YesNoToggle value={hadCharged} onChange={setHadCharged} accent={accent} labels={['Yes — charged','No — skip']} />
          {hadCharged && (
            <>
              <div style={{marginTop:12}}>
                <div className="meta" style={{marginBottom:6}}>What was actually said</div>
                <MultilineInput value={ampSaid} onChange={setAmpSaid} placeholder="Quote it as close as you can." minRows={2} />
              </div>
              <div style={{marginTop:12}}>
                <div className="meta" style={{marginBottom:6}}>What I made it mean</div>
                <MultilineInput value={ampMeaning} onChange={setAmpMeaning} placeholder="The story I built around it." minRows={2} />
              </div>
            </>
          )}
        </div>

        <SaveBar onSave={handleSave} accent={accent} label={existing ? 'Update' : 'Close the file'} />
      </div>
    </main>
  );
}

function YesNoToggle({ value, onChange, accent, labels=['Yes','No'] }) {
  const opts = [
    { v: true, label: labels[0] },
    { v: false, label: labels[1] },
  ];
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
      {opts.map(o => {
        const active = value === o.v;
        return (
          <button
            key={String(o.v)}
            onClick={() => onChange(active ? null : o.v)}
            style={{
              background: active ? accent : COLORS.surface,
              color: active ? COLORS.surface : COLORS.ink,
              border: `1px solid ${active ? accent : COLORS.hairlineSoft}`,
              borderRadius: 3,
              padding: '12px 12px',
              fontSize: 13.5,
              fontWeight: 500,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ───────────────────────── Weekly Review ─────────────────────────

function WeeklyHomeView({ entries, onOpenNew, onEdit, onDelete }) {
  const weeklyEntries = useMemo(
    () => entries.filter(e => e.type === 'weekly').sort((a,b) => b.date.localeCompare(a.date)),
    [entries]
  );
  return (
    <div className="fade-in">
      <h1 className="stem-font" style={{fontSize:36,lineHeight:1.05,fontWeight:400,letterSpacing:'-0.025em',margin:'0 0 12px'}}>Weekly Review</h1>
      <p style={{color:COLORS.inkSubtle,fontSize:14.5,lineHeight:1.6,margin:'0 0 32px',maxWidth:480}}>
        Read all 7 morning + 7 night sheets from the week before answering. Don't rush.
      </p>
      <button
        onClick={onOpenNew}
        style={{
          width:'100%',
          background:COLORS.ink,color:COLORS.surface,
          border:'none',borderRadius:3,
          padding:'16px 22px',
          fontSize:12.5,letterSpacing:'0.14em',textTransform:'uppercase',
          fontWeight:500,fontFamily:'Geist Mono, monospace',
          display:'flex',alignItems:'center',justifyContent:'center',gap:8,
          marginBottom:32,
        }}
      >
        <Pencil size={13} strokeWidth={1.5} /> Start a review
      </button>

      <div className="meta" style={{marginBottom:14}}>Past reviews · {weeklyEntries.length}</div>
      {weeklyEntries.length === 0 ? (
        <div style={{padding:'40px 30px',textAlign:'center',color:COLORS.inkFaint,fontSize:14,fontStyle:'italic',border:`1px dashed ${COLORS.hairline}`,borderRadius:4}}>
          Your weekly reviews will collect here.
        </div>
      ) : (
        weeklyEntries.map(w => (
          <WeeklyEntryCard key={w.id} entry={w} onEdit={() => onEdit(w.id)} onDelete={() => { if (confirm('Delete this review?')) onDelete(w.id); }} />
        ))
      )}
    </div>
  );
}

function WeeklyEntryCard({ entry, onEdit, onDelete }) {
  const weekStart = entry.weekStart || entry.date;
  const weekEnd = isoDaysFrom(weekStart, 7)[6];
  return (
    <div style={{background:COLORS.surface,border:`1px solid ${COLORS.hairlineSoft}`,borderLeft:`3px solid ${COLORS.review}`,borderRadius:3,padding:'20px 22px',marginBottom:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
        <div>
          <div className="meta" style={{color:COLORS.review,marginBottom:4}}>Week of</div>
          <div className="stem-font" style={{fontSize:19,color:COLORS.ink}}>
            {formatDateShort(weekStart)} – {formatDateShort(weekEnd)}
          </div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={onEdit} className="meta" style={{background:'none',border:'none',color:COLORS.inkSubtle}}>Edit</button>
          <button onClick={onDelete} className="meta" style={{background:'none',border:'none',color:COLORS.inkFaint}}>Delete</button>
        </div>
      </div>
      {entry.pattern && <ReviewRow label="Pattern" value={entry.pattern} />}
      {entry.juniCommit && <ReviewRow label="Next week commit" value={entry.juniCommit} />}
      {(entry.juniY !== undefined || entry.juniN !== undefined) && (
        <ReviewRow label="Juni" value={`Y ${entry.juniY ?? 0} / N ${entry.juniN ?? 0}`} />
      )}
      {entry.oneThing && <ReviewRow label="One thing forward" value={entry.oneThing} />}
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${COLORS.hairlineSoft}`}}>
      <div className="meta" style={{marginBottom:4}}>{label}</div>
      <div className="stem-font" style={{fontSize:14.5,lineHeight:1.5,color:COLORS.ink}}>{value}</div>
    </div>
  );
}

function WeeklyForm({ entries, existing, onClose, onSave }) {
  const accent = COLORS.review;

  // Default to current week (Mon)
  const [weekStart, setWeekStart] = useState(existing?.weekStart || startOfWeekISO());
  const weekDates = useMemo(() => isoDaysFrom(weekStart, 7), [weekStart]);

  // Auto-compute Juni scoreboard from night audits in this week
  const weeklyNights = useMemo(
    () => entries.filter(e => e.type === 'night' && weekDates.includes(e.date)),
    [entries, weekDates]
  );
  const autoJuniY = weeklyNights.filter(e => e.juniMoved === true).length;
  const autoJuniN = weeklyNights.filter(e => e.juniMoved === false).length;
  const autoAmp = weeklyNights.filter(e => e.hadCharged).length;

  const [pattern, setPattern] = useState(existing?.pattern || '');
  const [juniY, setJuniY] = useState(existing?.juniY ?? autoJuniY);
  const [juniN, setJuniN] = useState(existing?.juniN ?? autoJuniN);
  const [juniBlockerDom, setJuniBlockerDom] = useState(existing?.juniBlockerDom || '');
  const [juniCommit, setJuniCommit] = useState(existing?.juniCommit || '');
  const [ampCount, setAmpCount] = useState(existing?.ampCount ?? autoAmp);
  const [ampExample, setAmpExample] = useState(existing?.ampExample || '');
  const [winsPattern, setWinsPattern] = useState(existing?.winsPattern || '');
  const [depleting, setDepleting] = useState(existing?.depleting || '');
  const [grounding, setGrounding] = useState(existing?.grounding || '');
  const [oneThing, setOneThing] = useState(existing?.oneThing || '');

  // If the week changes (only when creating), refresh auto-counts
  useEffect(() => {
    if (existing) return;
    setJuniY(autoJuniY);
    setJuniN(autoJuniN);
    setAmpCount(autoAmp);
  }, [weekStart, autoJuniY, autoJuniN, autoAmp, existing]);

  const handleSave = () => {
    onSave({
      weekStart,
      pattern,
      juniY, juniN, juniBlockerDom, juniCommit,
      ampCount, ampExample,
      winsPattern, depleting, grounding, oneThing,
    });
  };

  return (
    <main style={{maxWidth:720,margin:'0 auto',padding:'0 22px 100px'}}>
      <div className="fade-in">
        <FormHeader
          onClose={onClose}
          accent={accent}
          eyebrow="Weekly Review"
          title="Weekly Review"
          sub="Read all 7 morning + 7 night sheets before answering. Don't rush."
        />

        <div style={{marginBottom:26}}>
          <div className="meta" style={{marginBottom:8}}>Week starting (Monday)</div>
          <input
            type="date"
            value={weekStart}
            onChange={e => setWeekStart(e.target.value)}
            style={{background:COLORS.surface,border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3,padding:'10px 12px',fontSize:14,fontFamily:'Geist Mono, monospace',color:COLORS.ink,width:'100%',maxWidth:240}}
          />
          {!existing && (
            <div style={{fontSize:12.5,color:COLORS.inkFaint,marginTop:6,fontStyle:'italic'}}>
              {weeklyNights.length} night audit{weeklyNights.length === 1 ? '' : 's'} found in this week — Juni counts pre-filled.
            </div>
          )}
        </div>

        <div style={{marginBottom:26}}>
          <FieldLabel num={1} label="Pattern" hint="Defensiveness, over-explaining, blame, seeking validation, etc." />
          <MultilineInput value={pattern} onChange={setPattern} placeholder="The pattern I see most often this week." minRows={3} />
        </div>

        <div style={{marginBottom:26}}>
          <FieldLabel num={2} label="Juni scoreboard" />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            <CounterField label="Y days" value={juniY} onChange={setJuniY} max={7} accent={accent} />
            <CounterField label="N days" value={juniN} onChange={setJuniN} max={7} accent={accent} />
          </div>
          <div className="meta" style={{marginBottom:6}}>Dominant blocker on N days</div>
          <MultilineInput value={juniBlockerDom} onChange={setJuniBlockerDom} placeholder="…" minRows={2} />
          <div style={{height:10}} />
          <div className="meta" style={{marginBottom:6}}>What I'll commit to next week</div>
          <MultilineInput value={juniCommit} onChange={setJuniCommit} placeholder="A concrete commitment." minRows={2} />
        </div>

        <div style={{marginBottom:26}}>
          <FieldLabel num={3} label="Amplification tally" hint="Times I made a small input into a big meaning." />
          <CounterField label="This week" value={ampCount} onChange={setAmpCount} max={20} accent={accent} />
          <div style={{height:10}} />
          <div className="meta" style={{marginBottom:6}}>Most extreme example</div>
          <MultilineInput value={ampExample} onChange={setAmpExample} placeholder="…" minRows={2} />
        </div>

        <div style={{marginBottom:26}}>
          <FieldLabel num={4} label="Wins pattern" hint="What the One-Line Win column reveals about what I actually value vs. what I claim to value." />
          <MultilineInput value={winsPattern} onChange={setWinsPattern} placeholder="…" minRows={3} />
        </div>

        <div style={{marginBottom:26}}>
          <FieldLabel num={5} label="Input diet" />
          <div className="meta" style={{marginBottom:6}}>Inputs that depleted me</div>
          <MultilineInput value={depleting} onChange={setDepleting} placeholder="…" minRows={2} />
          <div style={{height:10}} />
          <div className="meta" style={{marginBottom:6}}>Inputs that grounded me</div>
          <MultilineInput value={grounding} onChange={setGrounding} placeholder="…" minRows={2} />
        </div>

        <div style={{marginBottom:8}}>
          <FieldLabel num={6} label="One thing for next week" hint="Single behavior change I'm carrying forward." />
          <MultilineInput value={oneThing} onChange={setOneThing} placeholder="The single behavior change." minRows={2} />
        </div>

        <SaveBar onSave={handleSave} accent={accent} label={existing ? 'Update review' : 'Save review'} />
      </div>
    </main>
  );
}

function CounterField({ label, value, onChange, max=99, accent }) {
  const v = Number.isFinite(value) ? value : 0;
  return (
    <div>
      <div className="meta" style={{marginBottom:6}}>{label}</div>
      <div style={{display:'flex',alignItems:'center',gap:0,background:COLORS.surface,border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3,overflow:'hidden'}}>
        <button
          onClick={() => onChange(Math.max(0, v - 1))}
          style={{background:'transparent',border:'none',padding:'10px 14px',color:COLORS.ink,fontSize:18,fontWeight:500}}
        >−</button>
        <div style={{flex:1,textAlign:'center',fontSize:18,fontFamily:'Fraunces, Georgia, serif',color:accent,fontWeight:500}}>
          {v}
        </div>
        <button
          onClick={() => onChange(Math.min(max, v + 1))}
          style={{background:'transparent',border:'none',padding:'10px 14px',color:COLORS.ink,fontSize:18,fontWeight:500}}
        >+</button>
      </div>
    </div>
  );
}

// ───────────────────────── History ─────────────────────────

function HistoryView({ entries, onEdit, onDelete }) {
  const sorted = useMemo(
    () => entries
      .filter(e => e.type === 'morning' || e.type === 'night')
      .sort((a,b) => (b.date+b.createdAt).localeCompare(a.date+a.createdAt)),
    [entries]
  );

  const grouped = useMemo(() => {
    const m = {};
    sorted.forEach(e => { (m[e.date] = m[e.date] || []).push(e); });
    return Object.entries(m).sort((a,b) => b[0].localeCompare(a[0]));
  }, [sorted]);

  const [openId, setOpenId] = useState(null);

  return (
    <div className="fade-in">
      <h1 className="stem-font" style={{fontSize:36,lineHeight:1.05,fontWeight:400,letterSpacing:'-0.025em',margin:'0 0 12px'}}>History</h1>
      <p style={{color:COLORS.inkSubtle,fontSize:14.5,lineHeight:1.6,margin:'0 0 36px'}}>
        Every morning and night sheet, by date.
      </p>
      {grouped.length === 0 ? (
        <div style={{padding:'60px 30px',textAlign:'center',color:COLORS.inkFaint,fontSize:14,fontStyle:'italic',border:`1px dashed ${COLORS.hairline}`,borderRadius:4}}>
          Your entries will collect here as you write.
        </div>
      ) : (
        grouped.map(([date, dayEntries]) => (
          <div key={date} style={{marginBottom:28}}>
            <div className="meta" style={{marginBottom:12,color:COLORS.ink}}>{formatDate(date)}</div>
            {dayEntries.map(e => (
              <EntryRow
                key={e.id}
                entry={e}
                open={openId === e.id}
                onToggle={() => setOpenId(openId === e.id ? null : e.id)}
                onEdit={() => onEdit(e.id)}
                onDelete={() => { if (confirm('Delete this entry?')) onDelete(e.id); }}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
}

function EntryRow({ entry, open, onToggle, onEdit, onDelete }) {
  const isMorning = entry.type === 'morning';
  const accent = isMorning ? COLORS.morning : COLORS.night;
  const title = isMorning ? 'Morning Prime' : 'Night Audit';
  const Icon = isMorning ? Sunrise : Moon;

  const preview = isMorning
    ? (entry.oneThing || entry.postureAnswer || '')
    : (entry.win || entry.truthAnswer || '');

  return (
    <div style={{background:COLORS.surface,border:`1px solid ${COLORS.hairlineSoft}`,borderLeft:`3px solid ${accent}`,borderRadius:3,marginBottom:8,overflow:'hidden'}}>
      <button
        onClick={onToggle}
        style={{background:'none',border:'none',padding:'16px 18px',width:'100%',textAlign:'left',display:'flex',gap:14,alignItems:'flex-start'}}
      >
        <div style={{color:accent,marginTop:2}}><Icon size={15} strokeWidth={1.5} /></div>
        <div style={{flex:1}}>
          <div style={{display:'flex',gap:10,alignItems:'baseline',marginBottom:4}}>
            <span className="stem-font" style={{fontSize:16,color:COLORS.ink}}>{title}</span>
            {entry.dayN !== undefined && <span className="meta" style={{color:accent}}>Day {entry.dayN}</span>}
          </div>
          {preview && (
            <div className="stem-font" style={{fontSize:14,lineHeight:1.5,color:COLORS.inkSubtle}}>
              {preview.length > 110 ? preview.slice(0, 110) + '…' : preview}
            </div>
          )}
        </div>
        <ChevronRight size={14} strokeWidth={1.5} style={{color:COLORS.inkFaint,marginTop:4,transform: open ? 'rotate(90deg)' : 'none',transition:'transform 0.2s'}} />
      </button>
      {open && (
        <div style={{padding:'4px 22px 18px',borderTop:`1px solid ${COLORS.hairlineSoft}`}}>
          {isMorning ? <MorningDetail e={entry} /> : <NightDetail e={entry} />}
          <div style={{display:'flex',gap:14,marginTop:14}}>
            <button onClick={onEdit} className="meta" style={{background:'none',border:'none',color:accent,padding:0}}>Edit</button>
            <button onClick={onDelete} className="meta" style={{background:'none',border:'none',color:COLORS.inkFaint,padding:0}}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, italic=true }) {
  if (!value) return null;
  return (
    <div style={{marginTop:12}}>
      <div className="meta" style={{marginBottom:4}}>{label}</div>
      <div className={italic ? 'stem-font' : ''} style={{fontSize:14.5,lineHeight:1.55,color:COLORS.ink,whiteSpace:'pre-wrap'}}>
        {value}
      </div>
    </div>
  );
}

function MorningDetail({ e }) {
  return (
    <>
      {e.state && <DetailRow label="State" value={e.state} />}
      <DetailRow label="The one thing" value={e.oneThing} />
      <DetailRow label="Juni move" value={e.juniMove} />
      {e.postureAnswer && (
        <>
          <div style={{marginTop:14,padding:'10px 12px',background:`${COLORS.morning}11`,borderLeft:`2px solid ${COLORS.morning}`,borderRadius:2}}>
            <div className="meta" style={{color:COLORS.morning,marginBottom:4}}>Posture prompt</div>
            <div className="stem-italic" style={{fontSize:14.5,color:COLORS.ink}}>{e.posturePrompt}</div>
          </div>
          <DetailRow label="Answer" value={e.postureAnswer} />
          <DetailRow label="How I'll carry it" value={e.postureCarry} />
        </>
      )}
      <DetailRow label="Input boundary" value={e.inputBoundary} />
    </>
  );
}

function NightDetail({ e }) {
  return (
    <>
      {e.defensive !== null && e.defensive !== undefined && (
        <DetailRow label="Defensive today" value={e.defensive ? 'Yes' : 'No'} italic={false} />
      )}
      {e.defensive && <DetailRow label="What happened" value={e.defensiveDetail} />}
      {e.truthAnswer && (
        <>
          <div style={{marginTop:14,padding:'10px 12px',background:`${COLORS.night}11`,borderLeft:`2px solid ${COLORS.night}`,borderRadius:2}}>
            <div className="meta" style={{color:COLORS.night,marginBottom:4}}>Truth prompt</div>
            <div className="stem-italic" style={{fontSize:14.5,color:COLORS.ink}}>{e.truthPrompt}</div>
          </div>
          <DetailRow label="Answer" value={e.truthAnswer} />
        </>
      )}
      {e.juniMoved !== null && e.juniMoved !== undefined && (
        <DetailRow label="Juni moved" value={e.juniMoved ? 'Yes' : 'No'} italic={false} />
      )}
      {e.juniMoved && <DetailRow label="What I did" value={e.juniWhat} />}
      {e.juniMoved === false && <DetailRow label="What blocked me" value={e.juniBlocker} />}
      <DetailRow label="Win" value={e.win} />
      {e.hadCharged && (
        <>
          <DetailRow label="Charged: actually said" value={e.ampSaid} />
          <DetailRow label="Charged: what I made it mean" value={e.ampMeaning} />
        </>
      )}
    </>
  );
}

// ───────────────────────── Settings ─────────────────────────

function SettingsView({ config, entries, dayN, onSetStartDate, onWipe }) {
  const [date, setDate] = useState(config?.startDate || todayISO());
  const total = entries.length;
  const counts = {
    morning: entries.filter(e => e.type === 'morning').length,
    night: entries.filter(e => e.type === 'night').length,
    weekly: entries.filter(e => e.type === 'weekly').length,
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ config, entries }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `6pills-export-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <h1 className="stem-font" style={{fontSize:36,lineHeight:1.05,fontWeight:400,letterSpacing:'-0.025em',margin:'0 0 40px'}}>Settings</h1>

      <Section title="Program" icon={<CalendarIcon size={14} strokeWidth={1.5} />}>
        <div style={{background:COLORS.surface,padding:24,border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3}}>
          <div style={{marginBottom:22}}>
            <div className="meta" style={{marginBottom:6}}>Currently on</div>
            <div className="stem-italic" style={{fontSize:22,color:COLORS.accent}}>
              Day {dayN} {dayN >= 1 && dayN <= 90 ? '/ 90' : ''}
            </div>
          </div>
          <label style={{display:'block'}}>
            <div className="meta" style={{marginBottom:8}}>Program start date (Day 1)</div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{background:COLORS.bg,border:`1px solid ${COLORS.hairline}`,borderRadius:3,padding:'10px 12px',fontSize:14,fontFamily:'Geist Mono, monospace',color:COLORS.ink,width:'100%',maxWidth:240}}
            />
          </label>
          <button
            onClick={() => onSetStartDate(date)}
            disabled={date === config?.startDate}
            style={{
              marginTop:14,
              background: date === config?.startDate ? COLORS.surfaceAlt : COLORS.ink,
              color: date === config?.startDate ? COLORS.inkFaint : COLORS.surface,
              border:'none',borderRadius:3,padding:'10px 18px',
              fontSize:11.5,letterSpacing:'0.14em',textTransform:'uppercase',
              fontWeight:500,cursor:date===config?.startDate?'default':'pointer',
              fontFamily:'Geist Mono, monospace',
            }}
          >
            Update start
          </button>
        </div>
      </Section>

      <Section title="Practice stats" icon={<BarChart3 size={14} strokeWidth={1.5} />}>
        <div style={{background:COLORS.surface,padding:24,border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:24}}>
            <Stat label="Total entries" value={total} />
            <Stat label="Morning sheets" value={counts.morning} />
            <Stat label="Night sheets" value={counts.night} />
            <Stat label="Weekly reviews" value={counts.weekly} />
          </div>
        </div>
      </Section>

      <Section title="Prompt rotation" icon={<Repeat size={14} strokeWidth={1.5} />}>
        <div style={{background:COLORS.surface,padding:'18px 22px',border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3,fontSize:13.5,lineHeight:1.6,color:COLORS.inkSubtle}}>
          Posture and Truth prompts cycle on a 10-day rotation. Today is Day {dayN}, which means:
          <div style={{marginTop:12,padding:'10px 12px',background:`${COLORS.morning}11`,borderLeft:`2px solid ${COLORS.morning}`,borderRadius:2}}>
            <div className="meta" style={{color:COLORS.morning,marginBottom:4}}>Posture</div>
            <div className="stem-italic" style={{fontSize:14,color:COLORS.ink}}>{promptForDay(dayN, POSTURE_PROMPTS)}</div>
          </div>
          <div style={{marginTop:8,padding:'10px 12px',background:`${COLORS.night}11`,borderLeft:`2px solid ${COLORS.night}`,borderRadius:2}}>
            <div className="meta" style={{color:COLORS.night,marginBottom:4}}>Truth</div>
            <div className="stem-italic" style={{fontSize:14,color:COLORS.ink}}>{promptForDay(dayN, TRUTH_PROMPTS)}</div>
          </div>
        </div>
      </Section>

      <Section title="Data" icon={<BookOpen size={14} strokeWidth={1.5} />}>
        <div style={{background:COLORS.surface,padding:'18px 22px',border:`1px solid ${COLORS.hairlineSoft}`,borderRadius:3,display:'flex',gap:10,flexWrap:'wrap'}}>
          <button
            onClick={exportData}
            className="meta"
            style={{background:COLORS.ink,color:COLORS.surface,border:'none',borderRadius:3,padding:'10px 14px',letterSpacing:'0.14em'}}
          >
            Export JSON
          </button>
          <button
            onClick={onWipe}
            className="meta"
            style={{background:'transparent',color:'#A86568',border:`1px solid #A8656855`,borderRadius:3,padding:'10px 14px',letterSpacing:'0.14em'}}
          >
            Wipe all entries
          </button>
        </div>
      </Section>

      <Section title="About" icon={<BookOpen size={14} strokeWidth={1.5} />}>
        <p style={{fontSize:14,lineHeight:1.65,color:COLORS.inkSubtle,margin:0}}>
          A 90-day operator practice. Two sheets a day — Morning Prime to set the posture, Night Audit to tell the truth — plus a Weekly Review to see the pattern.
          Honesty over aspiration. Close the file. Move on.
        </p>
      </Section>
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
