"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlarmClock, ArrowLeft, ArrowRight, ArrowUpRight, BookOpenText, Calculator,
  CalendarDays, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Code2, FileImage,
  FilePlus2, FileText, Files, Flame, Focus, Heart, Home, Image as ImageIcon, ListChecks,
  Menu, Moon, NotebookPen, PanelLeftClose, Plus, QrCode, Search, Settings2, ShieldCheck,
  Sparkles, Sun, Trash2, Upload, X, Download, RotateCcw, Play, Pause, Square, Star,
  Ruler, Zap, Scale, CalendarClock, Timer, CheckSquare2, Circle, Copy, Save, SlidersHorizontal
} from "lucide-react";
import { evaluate, format as mathFormat } from "mathjs";
import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import { getClientId } from "../lib/client-id";

const TOOLS = [
  { id:"standard", title:"Standard Calculator", desc:"Quick everyday calculations", category:"Calculators", icon:Calculator, tint:"#eeeaff", color:"#6754d8" },
  { id:"scientific", title:"Scientific Calculator", desc:"Advanced maths and functions", category:"Calculators", icon:Activity, tint:"#e6f5ff", color:"#2080b9" },
  { id:"notes", title:"Online Notepad", desc:"Write and save quick notes", category:"Productivity", icon:NotebookPen, tint:"#fff1db", color:"#b87517" },
  { id:"todo", title:"To-Do List", desc:"Organize tasks and priorities", category:"Productivity", icon:ListChecks, tint:"#e2f8ee", color:"#21845b" },
  { id:"age", title:"Age Calculator", desc:"Calculate age from birth date", category:"Calculators", icon:CalendarDays, tint:"#ffe9ef", color:"#c34f75" },
  { id:"units", title:"Unit Converter", desc:"Convert common measurements", category:"Calculators", icon:Ruler, tint:"#e8efff", color:"#456dc7" },
  { id:"pomodoro", title:"Pomodoro Timer", desc:"Focus with timed sessions", category:"Productivity", icon:Timer, tint:"#ffe9e1", color:"#c45d39" },
  { id:"merge", title:"PDF Merge", desc:"Combine PDFs in your browser", category:"PDF Tools", icon:Files, tint:"#ffe8e8", color:"#c94b4b" },
  { id:"imagepdf", title:"Image to PDF", desc:"Turn images into a PDF", category:"PDF Tools", icon:FileImage, tint:"#e8f7f6", color:"#268780" },
  { id:"qr", title:"QR Code Generator", desc:"Create a QR from text or a link", category:"Image Tools", icon:QrCode, tint:"#f0eaff", color:"#7a53c6" },
  { id:"compress", title:"Image Compressor", desc:"Reduce image file size", category:"Image Tools", icon:ImageIcon, tint:"#e9f4ff", color:"#367bb9" },
];
const CATEGORIES = ["All Tools","Calculators","Productivity","PDF Tools","Image Tools"];
const fmtBytes = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(2)} MB`;

function usePersisted(key, initial) {
  const [value,setValue] = useState(initial);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw !== null) setValue(JSON.parse(raw)); } catch {}
  }, [key]);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key,value]);
  return [value,setValue];
}

export default function DailyKit() {
  const [activeCategory,setActiveCategory] = useState("All Tools");
  const [activeTool,setActiveTool] = useState("");
  const [query,setQuery] = useState("");
  const [dark,setDark] = usePersisted("dailykit-dark",false);
  const [favorites,setFavorites] = usePersisted("dailykit-favorites",[]);
  const [recent,setRecent] = usePersisted("dailykit-recent",[]);
  const [mobileNav,setMobileNav] = useState(false);
  const [clientId,setClientId] = useState("");
  const [toast,setToast] = useState("");
  const [notes,setNotes] = usePersisted("dailykit-notes-local",[]);
  const [tasks,setTasks] = usePersisted("dailykit-tasks-local",[]);

  useEffect(() => { setClientId(getClientId()); }, []);
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    async function load() {
      try {
        const [nr,tr] = await Promise.all([
          fetch(`/api/notes?clientId=${encodeURIComponent(clientId)}`),
          fetch(`/api/tasks?clientId=${encodeURIComponent(clientId)}`)
        ]);
        const nd = await nr.json(), td = await tr.json();
        if (cancelled) return;
        if (nr.ok && tr.ok) {
          setNotes(nd.notes || []);
          setTasks(td.tasks || []);
        }
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]); // initial fetch only; local state remains usable offline

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => TOOLS.filter(t =>
    (activeCategory === "All Tools" || t.category === activeCategory) &&
    `${t.title} ${t.desc} ${t.category}`.toLowerCase().includes(query.toLowerCase())
  ), [activeCategory,query]);
  const current = TOOLS.find(t => t.id === activeTool);
  const openTool = useCallback((id) => {
    setActiveTool(id); setRecent(prev => [id,...prev.filter(x=>x!==id)].slice(0,5));
    setMobileNav(false); window.scrollTo({top:0,behavior:"smooth"});
  },[setRecent]);
  const closeTool = () => setActiveTool("");
  const toggleFavorite = id => setFavorites(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]);
  const rootClass = dark ? "min-h-screen bg-[#151522] text-white" : "min-h-screen bg-canvas text-ink";
  const surface = dark ? "bg-[#202032] border-[#34344a] text-white" : "bg-white border-[#e9eaf2] text-ink";

  return (
    <div className={rootClass}>
      <div className="shell flex">
        <aside className={`sidebar sticky top-0 h-screen border-r p-5 ${dark?"border-[#303044] bg-[#1b1b2a]":"border-[#e8e9f1] bg-white"} hidden md:flex md:flex-col`}>
          <button className="flex items-center gap-3 px-2 py-2 text-left" onClick={()=>{closeTool();setActiveCategory("All Tools");}}>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet text-white"><Zap size={22}/></span>
            <span><span className="block text-lg font-extrabold tracking-tight">DailyKit</span><span className="block text-[11px] text-slate-400">Everyday made easier</span></span>
          </button>
          <div className="mt-9">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
            <button className={`nav-item ${!activeTool&&activeCategory==="All Tools"?"active":""}`} onClick={()=>{closeTool();setActiveCategory("All Tools");}}><Home size={18}/> Dashboard</button>
            {CATEGORIES.slice(1).map((cat,i)=><button key={cat} className={`nav-item ${!activeTool&&activeCategory===cat?"active":""}`} onClick={()=>{closeTool();setActiveCategory(cat);}}>{[<Calculator size={18}/>,<CheckSquare2 size={18}/>,<Files size={18}/>,<ImageIcon size={18}/>][i]} {cat}</button>)}
          </div>
          <div className="mt-8">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Your space</p>
            <button className="nav-item" onClick={()=>openTool("notes")}><NotebookPen size={18}/> My Notes</button>
            <button className="nav-item" onClick={()=>openTool("todo")}><ListChecks size={18}/> My Tasks</button>
            <button className="nav-item" onClick={()=>{setActiveTool("");setActiveCategory("All Tools");setToast("Settings are saved automatically.");}}><Settings2 size={18}/> Preferences</button>
          </div>
          <div className={`mt-auto rounded-2xl border p-4 ${dark?"border-[#38384f] bg-[#24243a]":"border-[#e8e4ff] bg-[#f6f4ff]"}`}>
            <div className="mb-2 flex items-center gap-2 text-violet"><ShieldCheck size={18}/><span className="text-xs font-bold">Privacy-first tools</span></div>
            <p className="text-xs leading-5 text-slate-500">PDF and image tools process files in your browser.</p>
          </div>
        </aside>

        <main className="main-area">
          <header className={`sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-4 sm:px-7 ${dark?"border-[#303044] bg-[#151522]/95":"border-[#e8e9f1] bg-[#f6f7fb]/95"} backdrop-blur`}>
            <button className="btn btn-plain md:hidden" onClick={()=>setMobileNav(!mobileNav)} aria-label="Open navigation"><Menu size={19}/></button>
            <div className="relative max-w-xl flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input className="field !rounded-xl !border-transparent !bg-white pl-10 shadow-sm" value={query} onChange={e=>{setQuery(e.target.value);if(activeTool)closeTool();}} placeholder="Search tools..." aria-label="Search tools"/>
              {query && <button onClick={()=>setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={16}/></button>}
            </div>
            <button className={`btn ${dark?"bg-[#29293d] text-amber-200":"bg-white text-slate-600"} border border-transparent shadow-sm`} onClick={()=>setDark(!dark)} aria-label="Toggle theme">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
          </header>

          {mobileNav && <div className={`border-b p-3 md:hidden ${surface}`}><div className="grid grid-cols-2 gap-2">{CATEGORIES.map(c=><button key={c} className="btn btn-plain justify-start" onClick={()=>{setActiveCategory(c);closeTool();setMobileNav(false);}}>{c}</button>)}</div></div>}

          <div className="mx-auto max-w-[1440px] p-4 sm:p-7 lg:p-9">
            {activeTool ? (
              <ToolView key={activeTool} id={activeTool} dark={dark} clientId={clientId} notes={notes} setNotes={setNotes} tasks={tasks} setTasks={setTasks} toast={setToast} onBack={closeTool} />
            ) : (
              <>
                <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                  <div><p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-violet"><Sparkles size={15}/> YOUR DAILY WORKSPACE</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">What do you need <span className="text-violet">today?</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Small tools for everyday tasks. Everything you need, in one calm and simple workspace.</p></div>
                  <div className={`flex items-center gap-3 rounded-2xl border p-4 ${surface}`}><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e2f8ee] text-[#21845b]"><CheckCircle2 size={22}/></div><div><p className="text-sm font-bold">{tasks.filter(t=>t.done).length} tasks completed</p><p className="mt-1 text-xs text-slate-400">{tasks.filter(t=>!t.done).length} tasks remaining</p></div></div>
                </div>

                <section className="mb-9">
                  <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-extrabold">Quick access</h2><span className="text-xs text-slate-400">Your everyday essentials</span></div>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {["standard","notes","todo","pomodoro"].map(id=>{const t=TOOLS.find(x=>x.id===id);const Icon=t.icon;return <button key={id} onClick={()=>openTool(id)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${surface}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{background:t.tint,color:t.color}}><Icon size={21}/></span><span className="min-w-0"><span className="block text-sm font-bold">{t.title}</span><span className="mt-1 block text-[11px] text-slate-400">{id==="standard"?"Calculate quickly":id==="notes"?"Capture an idea":id==="todo"?"Plan your day":"Focus better"}</span></span></button>})}
                  </div>
                </section>

                {favorites.length>0 && <section className="mb-9"><div className="mb-4 flex items-center gap-2"><Star size={17} className="text-amber-500"/><h2 className="text-lg font-extrabold">Favourites</h2></div><div className="tool-grid">{TOOLS.filter(t=>favorites.includes(t.id)).map(t=><ToolCard key={t.id} tool={t} openTool={openTool} favorite={true} toggleFavorite={toggleFavorite} dark={dark}/>)}</div></section>}

                {recent.length>0 && <section className="mb-9"><div className="mb-4 flex items-center gap-2"><Clock3 size={17} className="text-violet"/><h2 className="text-lg font-extrabold">Recently used</h2></div><div className="flex flex-wrap gap-2">{recent.map(id=>{const t=TOOLS.find(x=>x.id===id);return t?<button key={id} className={`btn ${dark?"bg-[#24243a] text-white":"bg-white text-slate-600"} border border-slate-100 text-xs`} onClick={()=>openTool(id)}>{t.title}<ArrowUpRight size={14}/></button>:null})}</div></section>}

                <section>
                  <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-extrabold">{query?"Search results":activeCategory==="All Tools"?"All tools":activeCategory}</h2><p className="mt-1 text-xs text-slate-400">{filtered.length} helpful tools, ready when you are</p></div><div className="flex flex-wrap gap-2">{CATEGORIES.map(c=><button key={c} onClick={()=>setActiveCategory(c)} className={`rounded-full px-3 py-2 text-xs font-bold transition ${activeCategory===c? "bg-violet text-white":dark?"bg-[#24243a] text-slate-300":"bg-white text-slate-500 hover:bg-violet/10"}`}>{c}</button>)}</div></div>
                  {filtered.length ? <div className="tool-grid">{filtered.map(t=><ToolCard key={t.id} tool={t} openTool={openTool} favorite={favorites.includes(t.id)} toggleFavorite={toggleFavorite} dark={dark}/>)}</div> : <div className={`card p-12 text-center ${dark?"!bg-[#202032] !border-[#34344a]":""}`}><Search className="mx-auto mb-3 text-slate-300" size={30}/><p className="font-bold">No tools found</p><p className="mt-1 text-sm text-slate-400">Try another search term.</p></div>}
                </section>
                <footer className="mt-12 flex flex-col justify-between gap-3 border-t border-slate-200/70 py-6 text-xs text-slate-400 sm:flex-row"><span>© {new Date().getFullYear()} DailyKit. Built for everyday simplicity.</span><span className="flex items-center gap-2"><Heart size={13}/> Your tools, one calm workspace.</span></footer>
              </>
            )}
          </div>
        </main>
      </div>
      {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#202032] px-5 py-3 text-sm font-semibold text-white shadow-xl">{toast}</div>}
    </div>
  );
}

function ToolCard({tool,openTool,favorite,toggleFavorite,dark}) {
  const Icon=tool.icon;
  return <div className={`tool-card ${dark?"!bg-[#202032] !border-[#34344a]":""}`} role="group">
    <div className="flex w-full items-start justify-between"><button onClick={()=>openTool(tool.id)} className="tool-icon" style={{background:tool.tint,color:tool.color}} aria-label={`Open ${tool.title}`}><Icon size={22}/></button><button onClick={()=>toggleFavorite(tool.id)} className={`rounded-lg p-2 ${favorite?"text-amber-500":"text-slate-300 hover:text-amber-500"}`} aria-label={favorite?"Remove from favourites":"Add to favourites"}><Star size={17} fill={favorite?"currentColor":"none"}/></button></div>
    <button className="w-full text-left" onClick={()=>openTool(tool.id)}><span className={`tool-title block ${dark?"!text-white":""}`}>{tool.title}</span><span className="tool-desc mt-1 block">{tool.desc}</span></button>
    <button className="mt-auto flex items-center gap-1 text-xs font-bold text-violet" onClick={()=>openTool(tool.id)}>Open tool <ArrowUpRight size={14}/></button>
  </div>;
}

function ToolView({id,dark,clientId,notes,setNotes,tasks,setTasks,toast,onBack}) {
  const tool=TOOLS.find(t=>t.id===id);
  const Icon=tool.icon;
  const [apiError,setApiError]=useState("");
  const cls=dark?"card !bg-[#202032] !border-[#34344a] !text-white":"card";
  return <div className="mx-auto max-w-4xl">
    <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-violet"><ArrowLeft size={17}/> Back to all tools</button>
    <div className="mb-7 flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{background:tool.tint,color:tool.color}}><Icon size={26}/></div><div><p className="text-xs font-bold uppercase tracking-widest text-violet">{tool.category}</p><h1 className="mt-1 text-2xl font-extrabold">{tool.title}</h1><p className="mt-1 text-sm text-slate-400">{tool.desc}</p></div></div>
    <div className={cls+" p-5 sm:p-7"}>
      {id==="standard"&&<CalculatorTool scientific={false}/>}
      {id==="scientific"&&<CalculatorTool scientific/>}
      {id==="notes"&&<NotesTool clientId={clientId} notes={notes} setNotes={setNotes} toast={toast} setApiError={setApiError}/>}
      {id==="todo"&&<TodoTool clientId={clientId} tasks={tasks} setTasks={setTasks} toast={toast} setApiError={setApiError}/>}
      {id==="age"&&<AgeTool/>}
      {id==="units"&&<UnitTool/>}
      {id==="pomodoro"&&<PomodoroTool/>}
      {id==="merge"&&<PdfMergeTool toast={toast}/>}
      {id==="imagepdf"&&<ImagePdfTool toast={toast}/>}
      {id==="qr"&&<QrTool/>}
      {id==="compress"&&<CompressTool toast={toast}/>}
      {apiError&&<p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{apiError}</p>}
    </div>
  </div>;
}

function CalculatorTool({scientific}) {
  const [expr,setExpr]=useState("");
  const [result,setResult]=useState("");
  const [angle,setAngle]=useState("DEG");
  const [history,setHistory]=useState([]);
  const buttons=scientific?["sin","cos","tan","log","ln","(",")","√","x²","^","7","8","9","÷","AC","4","5","6","×","⌫","1","2","3","−","%","0",".","π","+","="]:["AC","⌫","%","÷","7","8","9","×","4","5","6","−","1","2","3","+","(",")","0",".","="];
  const calc=()=>{
    try {
      let e=expr.replace(/×/g,"*").replace(/÷/g,"/").replace(/−/g,"-").replace(/π/g,"pi").replace(/√/g,"sqrt");
      if (scientific) {
        e=e.replace(/\bsin\(/g,`sin(${angle==="DEG"?"(pi/180)*":" "}`).replace(/\bcos\(/g,`cos(${angle==="DEG"?"(pi/180)*":" "}`).replace(/\btan\(/g,`tan(${angle==="DEG"?"(pi/180)*":" "}`);
        e=e.replace(/log\(/g,"log10(").replace(/ln\(/g,"log(").replace(/√/g,"sqrt");
      }
      const v=evaluate(e);
      const out=typeof v==="number"?Number(v.toPrecision(12)).toString():String(v);
      setResult(out);setHistory(h=>[`${expr} = ${out}`,...h].slice(0,6));
    } catch { setResult("Check expression"); }
  };
  const press=b=>{
    if(b==="AC"){setExpr("");setResult("");return;}
    if(b==="⌫"){setExpr(x=>x.slice(0,-1));setResult("");return;}
    if(b==="="){calc();return;}
    if(b==="%"){setExpr(x=>x+"%");return;}
    const value=({"×":"*","÷":"/","−":"-","√":"sqrt(","x²":"^2","sin":"sin(","cos":"cos(","tan":"tan(","log":"log(","ln":"ln(","π":"pi"})[b]||b;
    setExpr(x=>x+value);setResult("");
  };
  return <div className="mx-auto max-w-lg">
    <div className="mb-3 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-slate-400">{scientific?"Scientific mode":"Standard mode"}</span>{scientific&&<select className="field !w-auto !py-2 text-sm" value={angle} onChange={e=>setAngle(e.target.value)}><option>DEG</option><option>RAD</option></select>}</div>
    <div className="rounded-2xl bg-[#202032] p-5 text-right text-white"><p className="min-h-7 break-all text-sm text-slate-400">{expr||"0"}</p><p className="mt-2 min-h-10 break-all text-3xl font-bold">{result||" "}</p></div>
    <div className={`mt-3 grid gap-2 ${scientific?"grid-cols-5":"grid-cols-4"}`}>{buttons.map((b,i)=><button key={`${b}-${i}`} onClick={()=>press(b)} className={`min-h-12 rounded-xl text-sm font-bold transition hover:brightness-95 ${b==="="?"bg-violet text-white":b==="AC"?"bg-rose-50 text-rose-600":["÷","×","−","+","^","%"].includes(b)?"bg-violet/10 text-violet":"bg-slate-50 text-slate-700"}`}>{b}</button>)}</div>
    {history.length>0&&<div className="mt-5"><p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Recent calculations</p>{history.map((h,i)=><button key={i} className="block w-full border-b border-slate-100 py-2 text-left text-sm text-slate-500" onClick={()=>setExpr(h.split(" = ")[0])}>{h}</button>)}</div>}
    <p className="mt-4 text-xs text-slate-400">Keyboard: type an expression and press Enter. Advanced expressions are evaluated with mathjs.</p>
    <input className="field mt-3" value={expr} onChange={e=>setExpr(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")calc();}} placeholder="Or type an expression, e.g. (12 + 8) / 2" aria-label="Calculator expression"/>
  </div>;
}

function NotesTool({clientId,notes,setNotes,toast,setApiError}) {
  const [selected,setSelected]=useState("");
  const [title,setTitle]=useState("");
  const [content,setContent]=useState("");
  const [busy,setBusy]=useState(false);
  const timer=useRef(null);
  const save=async()=>{
    if(!title.trim()&&!content.trim()){toast("Write something first.");return;}
    setBusy(true);setApiError("");
    const existing=notes.find(n=>n.id===selected);
    const local={id:selected||`local-${Date.now()}`,title:title.trim()||"Untitled note",content,updatedAt:new Date().toISOString()};
    setNotes(prev=>existing?prev.map(n=>n.id===selected?{...n,...local}:n):[local,...prev]);
    try {
      if(clientId && existing && !String(selected).startsWith("local-")) {
        const res=await fetch("/api/notes",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId,id:selected,title:local.title,content})});
        if(res.ok){setNotes(prev=>prev.map(n=>n.id===selected?{...n,...local}:n));toast("Note updated in MongoDB.");}
        else {setApiError("MongoDB is not connected; this note is saved in this browser.");toast("Saved locally.");}
      } else if(clientId && !String(selected).startsWith("local-")) {
        const res=await fetch("/api/notes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId,title:local.title,content})});
        const data=await res.json();
        if(res.ok){setNotes(prev=>[data.note,...prev.filter(n=>n.id!==local.id)]);setSelected(data.note.id);toast("Note saved to MongoDB.");}
        else {setApiError("MongoDB is not connected; this note is saved in this browser.");toast("Saved locally.");}
      } else toast("Saved in this browser.");
    } catch {setApiError("MongoDB unavailable; this note is saved in this browser.");}
    setBusy(false);
  };
  const openNote=n=>{setSelected(n.id);setTitle(n.title);setContent(n.content);};
  const remove=async n=>{
    setNotes(prev=>prev.filter(x=>x.id!==n.id));
    if(clientId&&!String(n.id).startsWith("local-")) fetch("/api/notes",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId,id:n.id})}).catch(()=>{});
    if(selected===n.id){setSelected("");setTitle("");setContent("");}toast("Note deleted.");
  };
  return <div className="grid gap-5 md:grid-cols-[220px_1fr]">
    <div><button className="btn btn-primary mb-3 w-full" onClick={()=>{setSelected("");setTitle("");setContent("");}}><Plus size={17}/> New note</button><div className="space-y-2">{notes.map(n=><div key={n.id} className={`flex items-start gap-2 rounded-xl border p-3 ${selected===n.id?"border-violet bg-violet/5":"border-slate-100"}`}><button className="min-w-0 flex-1 text-left" onClick={()=>openNote(n)}><span className="block truncate text-sm font-bold">{n.title||"Untitled note"}</span><span className="mt-1 block truncate text-xs text-slate-400">{n.content||"Empty note"}</span></button><button className="text-slate-300 hover:text-rose-500" onClick={()=>remove(n)} aria-label="Delete note"><Trash2 size={15}/></button></div>)}{!notes.length&&<p className="py-5 text-center text-xs text-slate-400">Your notes will appear here.</p>}</div></div>
    <div><input className="field mb-3 text-lg font-bold" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Note title"/><textarea className="field min-h-[300px] resize-y leading-7" value={content} onChange={e=>setContent(e.target.value)} placeholder="Start writing your ideas..." /><div className="mt-3 flex flex-wrap gap-2"><button className="btn btn-primary" disabled={busy} onClick={save}><Save size={16}/>{busy?"Saving…":"Save note"}</button><button className="btn btn-plain" onClick={()=>{const blob=new Blob([`${title}\n\n${content}`],{type:"text/plain"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${(title||"note").replace(/[^a-z0-9-_]/gi,"-")}.txt`;a.click();URL.revokeObjectURL(a.href);}}><Download size={16}/> Download TXT</button></div><p className="mt-3 text-xs text-slate-400">Local browser save is automatic. Use “Save note” to attempt MongoDB sync.</p></div>
  </div>;
}

function TodoTool({clientId,tasks,setTasks,toast,setApiError}) {
  const [text,setText]=useState("");
  const [priority,setPriority]=useState("normal");
  const [dueDate,setDueDate]=useState("");
  const [filter,setFilter]=useState("all");
  const add=async e=>{
    e.preventDefault();if(!text.trim())return;
    const local={id:`local-${Date.now()}`,text:text.trim(),done:false,priority,dueDate,createdAt:new Date().toISOString()};
    setTasks(prev=>[local,...prev]);setText("");setApiError("");
    try { if(clientId) {const r=await fetch("/api/tasks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId,text:local.text,priority,dueDate})});const d=await r.json();if(r.ok)setTasks(prev=>prev.map(t=>t.id===local.id?d.task:t));else setApiError("Task saved locally; MongoDB is not configured.");} }catch{setApiError("Task saved locally; MongoDB unavailable.");}
  };
  const toggle=async t=>{
    setTasks(prev=>prev.map(x=>x.id===t.id?{...x,done:!x.done}:x));
    if(clientId&&!String(t.id).startsWith("local-"))fetch("/api/tasks",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId,id:t.id,done:!t.done})}).catch(()=>{});
  };
  const remove=async t=>{setTasks(prev=>prev.filter(x=>x.id!==t.id));if(clientId&&!String(t.id).startsWith("local-"))fetch("/api/tasks",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientId,id:t.id})}).catch(()=>{});toast("Task deleted.");};
  const shown=tasks.filter(t=>filter==="all"||(filter==="done"?t.done:!t.done));
  const completed=tasks.filter(t=>t.done).length;
  return <div className="mx-auto max-w-2xl">
    <div className="mb-5 rounded-2xl bg-violet p-5 text-white"><p className="text-sm text-white/80">Your progress</p><div className="mt-1 flex items-end justify-between"><h3 className="text-3xl font-extrabold">{completed}<span className="text-lg text-white/60"> / {tasks.length}</span></h3><span className="text-sm">{tasks.length?Math.round(completed/tasks.length*100):0}% complete</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white transition-all" style={{width:`${tasks.length?completed/tasks.length*100:0}%`}}/></div></div>
    <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_auto]"><input className="field" value={text} onChange={e=>setText(e.target.value)} placeholder="What do you need to do?" maxLength={300}/><button className="btn btn-primary"><Plus size={17}/> Add task</button><div className="flex gap-2"><select className="field !w-auto flex-1" value={priority} onChange={e=>setPriority(e.target.value)}><option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">High priority</option></select><input aria-label="Due date" type="date" className="field flex-1" value={dueDate} onChange={e=>setDueDate(e.target.value)}/></div></form>
    <div className="my-5 flex gap-2">{[["all","All"],["pending","Pending"],["done","Completed"]].map(([v,l])=><button key={v} className={`rounded-full px-4 py-2 text-xs font-bold ${filter===v?"bg-violet text-white":"bg-slate-100 text-slate-500"}`} onClick={()=>setFilter(v)}>{l}</button>)}</div>
    <div className="space-y-2">{shown.map(t=><div key={t.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><button onClick={()=>toggle(t)} className={t.done?"text-emerald-500":"text-slate-300"} aria-label="Toggle task">{t.done?<CheckCircle2 size={21}/>:<Circle size={21}/>}</button><div className="min-w-0 flex-1"><p className={`break-words text-sm font-semibold ${t.done?"text-slate-400 line-through":""}`}>{t.text}</p><div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">{t.dueDate&&<span>Due {t.dueDate}</span>}<span className={t.priority==="high"?"text-rose-500":t.priority==="low"?"text-sky-500":"text-slate-400"}>{t.priority} priority</span></div></div><button className="text-slate-300 hover:text-rose-500" onClick={()=>remove(t)} aria-label="Delete task"><Trash2 size={16}/></button></div>)}{!shown.length&&<div className="py-12 text-center text-sm text-slate-400">No tasks in this list yet.</div>}</div>
  </div>;
}

function AgeTool() {
  const [dob,setDob]=useState("");
  const [asOf,setAsOf]=useState(new Date().toISOString().slice(0,10));
  let result=null;
  if(dob&&asOf&&dob<=asOf){
    const start=new Date(`${dob}T00:00:00`),end=new Date(`${asOf}T00:00:00`);
    let years=end.getFullYear()-start.getFullYear(),months=end.getMonth()-start.getMonth(),days=end.getDate()-start.getDate();
    if(days<0){months--;days+=new Date(end.getFullYear(),end.getMonth(),0).getDate();}
    if(months<0){years--;months+=12;}
    result={years,months,days};
  }
  return <div className="mx-auto max-w-xl"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Date of birth<input type="date" max={asOf} value={dob} onChange={e=>setDob(e.target.value)} className="field mt-2"/></label><label className="text-sm font-semibold">Calculate age on<input type="date" min={dob||undefined} value={asOf} onChange={e=>setAsOf(e.target.value)} className="field mt-2"/></label></div>{result?<div className="mt-6 rounded-2xl bg-violet p-6 text-white"><p className="text-sm text-white/75">Your age is</p><div className="mt-3 grid grid-cols-3 gap-3">{Object.entries(result).map(([k,v])=><div key={k} className="rounded-xl bg-white/10 p-4 text-center"><p className="text-3xl font-extrabold">{v}</p><p className="mt-1 text-xs capitalize text-white/70">{k}</p></div>)}</div></div>:<p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Choose a valid date of birth to calculate your age.</p>}</div>;
}

function UnitTool() {
  const [category,setCategory]=useState("Length");
  const [from,setFrom]=useState("Meters");const [to,setTo]=useState("Kilometers");const [value,setValue]=useState("1");
  const units={
    Length:{Meters:1,Kilometers:1000,Centimeters:.01,Millimeters:.001,Miles:1609.344,Feet:.3048,Inches:.0254},
    Weight:{Kilograms:1,Grams:.001,Milligrams:.000001,Pounds:.45359237,Ounces:.0283495},
    Volume:{Liters:1,Milliliters:.001,"US gallons":3.785411784,Cups:.2365882365},
    Speed:{"Meters/second":1,"Kilometers/hour":1/3.6,"Miles/hour":.44704},
    Area:{"Square meters":1,"Square kilometers":1e6,"Square feet":.09290304,Acres:4046.8564224},
    Temperature:{Celsius:1,Fahrenheit:1,Kelvin:1}
  };
  const list=Object.keys(units[category]);
  useEffect(()=>{setFrom(list[0]);setTo(list[1]||list[0]);},[category]);
  const convert=(v)=>{
    const n=Number(v);if(!Number.isFinite(n))return "";
    if(category==="Temperature"){let c=from==="Celsius"?n:from==="Fahrenheit"?(n-32)*5/9:n-273.15;return (to==="Celsius"?c:to==="Fahrenheit"?c*9/5+32:c+273.15).toLocaleString(undefined,{maximumFractionDigits:8});}
    return (n*units[category][from]/units[category][to]).toLocaleString(undefined,{maximumFractionDigits:8});
  };
  return <div className="mx-auto max-w-2xl"><label className="text-sm font-semibold">Category<select className="field mt-2" value={category} onChange={e=>setCategory(e.target.value)}>{Object.keys(units).map(c=><option key={c}>{c}</option>)}</select></label><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end"><label className="text-sm font-semibold">From<input className="field mt-2" type="number" value={value} onChange={e=>setValue(e.target.value)}/><select className="field mt-2" value={from} onChange={e=>setFrom(e.target.value)}>{list.map(u=><option key={u}>{u}</option>)}</select></label><button className="btn btn-soft" onClick={()=>{setFrom(to);setTo(from);}}><RotateCcw size={17}/> Swap</button><label className="text-sm font-semibold">To<div className="field mt-2 min-h-[44px] bg-slate-50 text-lg font-bold">{convert(value)||"—"}</div><select className="field mt-2" value={to} onChange={e=>setTo(e.target.value)}>{list.map(u=><option key={u}>{u}</option>)}</select></label></div><p className="mt-4 text-xs text-slate-400">Conversions are calculated locally. Currency conversion is not included.</p></div>;
}

function PomodoroTool() {
  const [focus,setFocus]=useState(25);const [short,setShort]=useState(5);const [long,setLong]=useState(15);
  const [mode,setMode]=useState("Focus");const [seconds,setSeconds]=useState(25*60);const [running,setRunning]=useState(false);const [sessions,setSessions]=useState(0);
  useEffect(()=>{setSeconds((mode==="Focus"?focus:mode==="Short break"?short:long)*60);setRunning(false);},[mode,focus,short,long]);
  useEffect(()=>{if(!running)return;const t=setInterval(()=>setSeconds(s=>{if(s<=1){setRunning(false);if(mode==="Focus")setSessions(n=>n+1);return 0;}return s-1;}),1000);return()=>clearInterval(t);},[running,mode]);
  const total=(mode==="Focus"?focus:mode==="Short break"?short:long)*60;
  const display=`${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
  const pct=total?Math.max(0,Math.min(100,(total-seconds)/total*100)):0;
  return <div className="mx-auto max-w-xl text-center"><div className="mb-6 flex justify-center gap-2">{["Focus","Short break","Long break"].map(m=><button key={m} onClick={()=>setMode(m)} className={`rounded-full px-4 py-2 text-xs font-bold ${mode===m?"bg-violet text-white":"bg-slate-100 text-slate-500"}`}>{m}</button>)}</div><div className="relative mx-auto flex h-64 w-64 items-center justify-center rounded-full" style={{background:`conic-gradient(#6d5ce8 ${pct}%, #eeedf6 ${pct}%)`}}><div className="flex h-56 w-56 flex-col items-center justify-center rounded-full bg-white"><span className="text-5xl font-extrabold tracking-tight text-ink">{display}</span><span className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{mode}</span></div></div><div className="mt-7 flex justify-center gap-3"><button className="btn btn-primary min-w-28" onClick={()=>setRunning(!running)}>{running?<Pause size={17}/>:<Play size={17}/>} {running?"Pause":"Start"}</button><button className="btn btn-plain" onClick={()=>{setRunning(false);setSeconds(total);}}><RotateCcw size={17}/> Reset</button></div><div className="mt-7 grid grid-cols-3 gap-3"><label className="text-xs font-semibold text-slate-500">Focus (min)<input className="field mt-2 text-center" type="number" min="1" max="180" value={focus} onChange={e=>setFocus(Math.max(1,Math.min(180,Number(e.target.value)||1)))}/></label><label className="text-xs font-semibold text-slate-500">Short break<input className="field mt-2 text-center" type="number" min="1" max="60" value={short} onChange={e=>setShort(Math.max(1,Math.min(60,Number(e.target.value)||1)))}/></label><label className="text-xs font-semibold text-slate-500">Long break<input className="field mt-2 text-center" type="number" min="1" max="90" value={long} onChange={e=>setLong(Math.max(1,Math.min(90,Number(e.target.value)||1)))}/></label></div><p className="mt-5 text-sm text-slate-400">Focus sessions completed: <b>{sessions}</b></p>{seconds===0&&<p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Session complete — take a moment to reset.</p>}</div>;
}

function useFileInput(accept,multiple=false) {
  const ref=useRef(null);
  const [files,setFiles]=useState([]);
  const [error,setError]=useState("");
  const onChange=e=>{const selected=Array.from(e.target.files||[]);setError("");if(selected.some(f=>f.size>25*1024*1024)){setError("Each file must be 25 MB or smaller.");setFiles([]);}else setFiles(selected);};
  return {ref,files,setFiles,error,setError,onChange,accept,multiple};
}

function PdfMergeTool({toast}) {
  const input=useFileInput("application/pdf",true);const [busy,setBusy]=useState(false);
  const merge=async()=>{
    if(input.files.length<2){input.setError("Choose at least two PDF files.");return;}
    setBusy(true);input.setError("");
    try{const out=await PDFDocument.create();for(const file of input.files){const doc=await PDFDocument.load(await file.arrayBuffer());const pages=await out.copyPages(doc,doc.getPageIndices());pages.forEach(p=>out.addPage(p));}const bytes=await out.save();downloadBlob(new Blob([bytes],{type:"application/pdf"}),"dailykit-merged.pdf");toast("PDF merged and downloaded.");}
    catch{input.setError("Could not merge these PDFs. Try valid, unencrypted PDF files.");}finally{setBusy(false);}
  };
  return <div><p className="mb-4 text-sm text-slate-500">Select at least two PDF files. They are processed locally in your browser.</p><input ref={input.ref} type="file" accept={input.accept} multiple onChange={input.onChange} className="hidden"/><button className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center hover:border-violet" onClick={()=>input.ref.current?.click()}><Upload size={27} className="mb-3 text-violet"/><b>Choose PDF files</b><span className="mt-1 text-xs text-slate-400">Up to 25 MB per file</span></button>{input.files.length>0&&<div className="my-4 space-y-2">{input.files.map((f,i)=><div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><FileText size={19} className="text-rose-500"/><span className="min-w-0 flex-1 truncate text-sm font-semibold">{f.name}</span><span className="text-xs text-slate-400">{fmtBytes(f.size)}</span><button className="text-slate-400" onClick={()=>input.setFiles(p=>p.filter((_,j)=>j!==i))}><X size={16}/></button></div>)}</div>}{input.error&&<p className="my-3 text-sm text-rose-600">{input.error}</p>}<button className="btn btn-primary mt-4" disabled={busy||input.files.length<2} onClick={merge}><Files size={17}/>{busy?"Merging…":"Merge & download"}</button></div>;
}

function ImagePdfTool({toast}) {
  const input=useFileInput("image/jpeg,image/png,image/webp",true);const [paper,setPaper]=useState("A4");const [busy,setBusy]=useState(false);
  const build=async()=>{
    if(!input.files.length){input.setError("Choose at least one image.");return;}
    setBusy(true);input.setError("");
    try{const pdf=await PDFDocument.create();const sizes={A4:[595.28,841.89],Letter:[612,792]};for(const file of input.files){const bytes=await file.arrayBuffer();let image;if(file.type==="image/png")image=await pdf.embedPng(bytes);else if(file.type==="image/jpeg")image=await pdf.embedJpg(bytes);else{const bitmap=await createImageBitmap(file);const canvas=document.createElement("canvas");canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext("2d").drawImage(bitmap,0,0);const blob=await new Promise(r=>canvas.toBlob(r,"image/jpeg",.92));image=await pdf.embedJpg(await blob.arrayBuffer());bitmap.close();}const [w,h]=sizes[paper];const page=pdf.addPage([w,h]);const margin=24;const scale=Math.min((w-margin*2)/image.width,(h-margin*2)/image.height);const iw=image.width*scale,ih=image.height*scale;page.drawImage(image,{x:(w-iw)/2,y:(h-ih)/2,width:iw,height:ih});}const bytes=await pdf.save();downloadBlob(new Blob([bytes],{type:"application/pdf"}),"dailykit-images.pdf");toast("PDF created.");}
    catch{input.setError("One or more images could not be converted. Try JPG or PNG.");}finally{setBusy(false);}
  };
  return <div><p className="mb-4 text-sm text-slate-500">Create a PDF from JPG, PNG or WebP images. Images are processed in this browser.</p><div className="mb-4 flex items-center gap-3"><label className="text-sm font-semibold">Page size</label><select className="field !w-auto" value={paper} onChange={e=>setPaper(e.target.value)}><option>A4</option><option>Letter</option></select></div><input ref={input.ref} type="file" accept={input.accept} multiple onChange={input.onChange} className="hidden"/><button className="flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5" onClick={()=>input.ref.current?.click()}><Upload size={26} className="mb-2 text-violet"/><b>Choose images</b><span className="mt-1 text-xs text-slate-400">JPG, PNG or WebP</span></button>{input.files.length>0&&<div className="my-4 space-y-2">{input.files.map((f,i)=><div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><ImageIcon size={18} className="text-emerald-600"/><span className="min-w-0 flex-1 truncate text-sm">{f.name}</span><button onClick={()=>input.setFiles(p=>p.filter((_,j)=>j!==i))}><X size={16}/></button></div>)}</div>}{input.error&&<p className="my-3 text-sm text-rose-600">{input.error}</p>}<button className="btn btn-primary mt-4" disabled={busy||!input.files.length} onClick={build}><FilePlus2 size={17}/>{busy?"Creating…":"Create PDF"}</button></div>;
}

function QrTool() {
  const [value,setValue]=useState("https://example.com");const [size,setSize]=useState(320);const [data,setData]=useState("");const [error,setError]=useState("");
  const generate=async()=>{try{setError("");setData(await QRCode.toDataURL(value,{width:size,margin:2,errorCorrectionLevel:"M",color:{dark:"#17172b",light:"#ffffff"}}));}catch{setError("Enter some text or a valid URL.");}};
  useEffect(()=>{generate();},[]);
  return <div className="mx-auto grid max-w-2xl gap-6 md:grid-cols-[1fr_240px]"><div><label className="text-sm font-semibold">Text or URL<textarea className="field mt-2 min-h-28" value={value} onChange={e=>setValue(e.target.value)} placeholder="https://example.com"/></label><label className="mt-4 block text-sm font-semibold">QR image size<select className="field mt-2" value={size} onChange={e=>setSize(Number(e.target.value))}><option value={240}>240 × 240</option><option value={320}>320 × 320</option><option value={480}>480 × 480</option><option value={640}>640 × 640</option></select></label><button className="btn btn-primary mt-4" onClick={generate}><QrCode size={17}/> Generate QR code</button>{error&&<p className="mt-3 text-sm text-rose-600">{error}</p>}</div><div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-5">{data?<><img src={data} alt="Generated QR code" className="w-full max-w-[210px] rounded-xl bg-white p-2"/><a href={data} download="dailykit-qr.png" className="btn btn-soft mt-4 w-full"><Download size={16}/> Download PNG</a></>:<p className="text-sm text-slate-400">Your QR code appears here.</p>}</div></div>;
}

function downloadBlob(blob,name) {const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

function CompressTool({toast}) {
  const input=useFileInput("image/jpeg,image/png,image/webp");
  const [quality,setQuality]=useState(75);const [format,setFormat]=useState("image/webp");const [originalUrl,setOriginalUrl]=useState("");const [result,setResult]=useState(null);const [busy,setBusy]=useState(false);
  useEffect(()=>{if(!input.files[0]){setOriginalUrl("");setResult(null);return;}const url=URL.createObjectURL(input.files[0]);setOriginalUrl(url);return()=>URL.revokeObjectURL(url);},[input.files]);
  const compress=async()=>{
    const file=input.files[0];if(!file){input.setError("Choose an image first.");return;}
    setBusy(true);setResult(null);input.setError("");
    try{const bitmap=await createImageBitmap(file);const canvas=document.createElement("canvas");canvas.width=bitmap.width;canvas.height=bitmap.height;canvas.getContext("2d").drawImage(bitmap,0,0);bitmap.close();const mime=format==="image/jpeg"&&file.type==="image/png"?"image/jpeg":format;const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Compression failed")),mime,quality/100));const url=URL.createObjectURL(blob);setResult({blob,url,size:blob.size,type:blob.type,width:canvas.width,height:canvas.height,name:file.name.replace(/\.[^.]+$/,"")});}
    catch{input.setError("Could not compress this image format.");}finally{setBusy(false);}
  };
  return <div><p className="mb-4 text-sm text-slate-500">Choose an image and adjust quality. Processing stays in your browser.</p><input ref={input.ref} type="file" accept={input.accept} onChange={input.onChange} className="hidden"/><button className="flex min-h-32 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5" onClick={()=>input.ref.current?.click()}><Upload size={25} className="mb-2 text-violet"/><b>{input.files[0]?.name||"Choose image"}</b><span className="mt-1 text-xs text-slate-400">JPG, PNG, WebP · max 25 MB</span></button>{input.files[0]&&<div className="mt-4 grid gap-5 md:grid-cols-2"><div><label className="text-sm font-semibold">Quality: {quality}%<input type="range" min="10" max="100" value={quality} onChange={e=>setQuality(Number(e.target.value))} className="mt-3 w-full accent-violet"/></label><label className="mt-4 block text-sm font-semibold">Output format<select className="field mt-2" value={format} onChange={e=>setFormat(e.target.value)}><option value="image/webp">WebP (smaller files)</option><option value="image/jpeg">JPEG</option><option value="image/png">PNG (quality setting may not apply)</option></select></label><button className="btn btn-primary mt-4" disabled={busy} onClick={compress}><Zap size={16}/>{busy?"Compressing…":"Compress image"}</button><p className="mt-3 text-xs text-slate-400">PNG output may not shrink much because it is lossless.</p></div><div className="grid grid-cols-2 gap-3"><div><p className="mb-2 text-xs font-bold text-slate-400">ORIGINAL</p>{originalUrl&&<img src={originalUrl} alt="Original" className="h-36 w-full rounded-xl border border-slate-100 object-contain"/>}<p className="mt-2 text-xs text-slate-500">{fmtBytes(input.files[0].size)}</p></div><div><p className="mb-2 text-xs font-bold text-slate-400">COMPRESSED</p>{result?<img src={result.url} alt="Compressed result" className="h-36 w-full rounded-xl border border-slate-100 object-contain"/>:<div className="flex h-36 items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-300">Preview</div>}{result&&<p className="mt-2 text-xs text-slate-500">{fmtBytes(result.size)}</p>}</div></div></div>}{result&&<div className="mt-5 rounded-xl bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-800">{result.size<input.files?.[0]?.size?"":" "} {result.size<input.files[0].size?`Saved ${Math.round((1-result.size/input.files[0].size)*100)}% of file size`:"Image converted; output may be larger than original."}</p><button className="btn btn-primary mt-3" onClick={()=>{downloadBlob(result.blob,`${result.name}-compressed.${result.type==="image/jpeg"?"jpg":result.type==="image/png"?"png":"webp"}`);toast("Compressed image downloaded.");}}><Download size={16}/> Download image</button></div>}{input.error&&<p className="mt-3 text-sm text-rose-600">{input.error}</p>}</div>;
}