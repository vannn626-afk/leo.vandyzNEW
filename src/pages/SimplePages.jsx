import React from 'react';import {Heart,Clock3,Settings,Trash2,Copy,Info,UserRound,Sparkles,MessageCircle,Code2,MapPin,GraduationCap,ArrowUpRight,Layers,Rocket,Target,Globe2,BookOpen,Workflow,ShieldCheck} from 'lucide-react';
export function Favorites({favorites,setSelected,setPage}){return <div className="page"><div className="page-title"><div><small>LOCAL</small><h1>Favorites</h1><p>Your saved tools live only in this browser.</p></div><Heart/></div><div className="tool-grid">{favorites.map(t=><button className="tool-card" key={t.id} onClick={()=>{setSelected(t);setPage('tool')}}><Heart size={17}/><div className="tool-main"><b>{t.name}</b><span>{t.description}</span></div></button>)}{!favorites.length&&<div className="empty"><Heart size={28}/>No favorites yet.</div>}</div></div>}
export function History({history,setSelected,setPage,clear}){return <div className="page"><div className="page-title"><div><small>LOCAL</small><h1>History</h1><p>Only tool names and timestamps are stored.</p></div><button className="icon-btn" onClick={clear}><Trash2/></button></div><div className="history-list">{history.map((h,i)=><button key={i} onClick={()=>{setSelected(h.tool);setPage('tool')}}><Clock3 size={16}/><span>{h.tool.name}</span><small>{new Date(h.time).toLocaleTimeString()}</small></button>)}{!history.length&&<div className="empty"><Clock3 size={28}/>No recent tools.</div>}</div></div>}
export function SettingsPage({profile,setProfile}){
 const [theme,setTheme]=React.useState(()=>{try{return localStorage.getItem('king-vandyz-theme-v2')||'brutal'}catch{return 'glass'}});
 const [reduced,setReduced]=React.useState(()=>{try{return localStorage.getItem('king-vandyz-reduced-motion')==='1'}catch{return false}});
 const applyTheme=v=>{setTheme(v);try{localStorage.setItem('king-vandyz-theme-v2',v)}catch{};document.documentElement.dataset.theme=v;window.dispatchEvent(new Event('kv-theme-change'))};
 const applyMotion=v=>{setReduced(v);try{localStorage.setItem('king-vandyz-reduced-motion',v?'1':'0')}catch{};document.documentElement.dataset.motion=v?'reduced':'full'};
 React.useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.motion=reduced?'reduced':'full';window.dispatchEvent(new Event('kv-theme-change'))},[theme,reduced]);
 return <div className="settings-page page">
  <div className="page-title"><div><small>KING VANDYZ</small><h1>Settings</h1><p>Atur tampilan dan performa aplikasi dari satu tempat.</p></div><Settings/></div>
  <section className="settings-theme glass-panel"><div><small>THEME SYSTEM</small><h2>Ganti tema</h2><p>Pilihan tema tersimpan di perangkat ini dan tidak mengubah database, akun, credits, atau tools.</p></div>
   <div className="theme-picker">{[['glass','Glassmorphism'],['brutal','Neo Brutalism'],['city','Modern City'],['comic','Comic Style']].map(([id,label])=><button type="button" className={theme===id?'active':''} key={id} onClick={()=>applyTheme(id)}><span className={`theme-preview ${id}`}/><b>{label}</b><small>{theme===id?'AKTIF':'PILIH'}</small></button>)}</div>
  </section>
  <section className="settings-grid">
   <button type="button" className={`setting-card ${reduced?'active':''}`} onClick={()=>applyMotion(!reduced)}><b>⚡ Reduce Motion</b><span>{reduced?'Aktif — animasi berat dikurangi.':'Nonaktif — animasi penuh.'}</span><strong>{reduced?'ON':'OFF'}</strong></button>
   <div className="setting-card"><b>API Base</b><span>api.zyvor.my.id</span></div>
   <div className="setting-card"><b>Favorites</b><span>Stored locally only.</span></div>
   <div className="setting-card"><b>Static Banner</b><span>16:9 · admin customizable</span></div>
  </section>
  <div className="info-box"><Info size={18}/><span>Kalau HP terasa berat, aktifkan Reduce Motion. Tools dan fungsi API tetap sama.</span></div>
 </div>
}

export function AboutPage(){return <div className="page about-page about-v2">
  <section className="about-modern-hero about-v2-hero">
    <div className="about-hero-top"><span className="about-chip"><Sparkles size={13}/> CREATOR / BUILDER PROFILE</span><span className="about-code">KV / ABOUT / 2026</span></div>
    <div className="about-v2-identity">
      <div className="about-avatar-xl"><span>LF</span></div>
      <div className="about-identity-copy"><small>LEONARDO FANDIZKIEL</small><h1>Curiosity into<br/><em>digital projects.</em></h1><p>Independent student builder behind the VANDYZ identity. Exploring web apps, API experiences, interface systems, and practical digital products through continuous building and iteration.</p></div>
    </div>
    <div className="about-metrics"><div><b>VANDYZ</b><span>Project identity</span></div><div><b>API HUB</b><span>Main direction</span></div><div><b>2026</b><span>Active build era</span></div></div>
  </section>

  <section className="about-v2-intro">
    <div><small>01 / THE IDEA</small><h2>What is KING VANDYZ?</h2></div>
    <p>KING VANDYZ is an app-style workspace that brings API-powered utilities, downloaders, makers, AI tools, and digital experiments into one interface. Instead of treating every endpoint as a separate page, the platform focuses on a consistent experience: discover a tool, understand what it does, run it, and inspect the result.</p>
  </section>

  <section className="about-interface-grid about-v2-grid">
    <article className="about-modern-panel about-v2-story"><div className="about-label"><Rocket size={14}/> BUILD PHILOSOPHY</div><h2>Build. Test. Learn. Iterate.</h2><p>VANDYZ is intentionally treated as a living project. Features are tested in real usage, UI ideas are refined, and technical problems are fixed instead of hidden behind a static demo.</p><p>The long-term direction is a cleaner toolbox where the interface feels like a real product while the underlying API integrations stay practical.</p><div className="about-status-line"><span className="live-dot"/> CURRENT STATUS <b>ACTIVE BUILD</b></div></article>
    <article className="about-modern-panel about-v2-values"><div className="about-label"><Target size={14}/> CORE PRINCIPLES</div><div className="about-value"><b>01</b><span>Useful over decorative</span></div><div className="about-value"><b>02</b><span>Real integrations over fake demos</span></div><div className="about-value"><b>03</b><span>Clear UI over unnecessary complexity</span></div><div className="about-value"><b>04</b><span>Keep learning through shipping</span></div></article>
  </section>

  <section className="about-v2-capabilities">
    <div className="about-section-heading"><small>02 / WHAT I BUILD</small><h2>Areas of exploration</h2><p>The platform grows around a few connected interests rather than a single narrow category.</p></div>
    <div className="about-cap-grid">
      <article><div><Code2/></div><small>WEB / FRONTEND</small><h3>App-like interfaces</h3><p>Responsive layouts, navigation systems, theme engines, dashboards, and mobile-first experiences.</p></article>
      <article><div><Workflow/></div><small>API / BACKEND</small><h3>Connected tools</h3><p>API catalogs, proxy flows, request handling, result rendering, and database-backed account systems.</p></article>
      <article><div><Sparkles/></div><small>AI / EXPERIMENTS</small><h3>Creative workflows</h3><p>Exploring AI-powered tools, media workflows, generators, and experimental digital concepts.</p></article>
      <article><div><Layers/></div><small>PRODUCT SYSTEMS</small><h3>One consistent workspace</h3><p>Combining tools, profiles, credits, orders, settings, themes, and admin controls into one product.</p></article>
    </div>
  </section>

  <section className="about-project-panel about-v2-project">
    <div><div className="about-label"><Globe2 size={14}/> PLATFORM MAP</div><h2>From request to result.</h2><p>Each tool follows a simple product flow: discover the capability, open the tool workspace, send a request through the configured API layer, and render the response in a format that makes sense for the output.</p></div>
    <div className="about-project-side"><span>01</span><b>DISCOVER</b><span>02</span><b>RUN</b><span>03</span><b>RESULT</b><span>04</span><b>ITERATE</b></div>
  </section>

  <section className="about-v2-timeline">
    <div className="about-section-heading"><small>03 / JOURNEY</small><h2>How the project evolves</h2></div>
    <div className="about-timeline-grid">
      <article><span>PHASE 01</span><b>Explore</b><p>Try ideas, APIs, layouts, and small utilities to understand what is worth building.</p></article>
      <article><span>PHASE 02</span><b>Assemble</b><p>Turn useful experiments into reusable screens, components, and connected workflows.</p></article>
      <article><span>PHASE 03</span><b>Refine</b><p>Improve reliability, mobile behavior, theme consistency, and the overall product experience.</p></article>
      <article><span>PHASE 04</span><b>Ship</b><p>Deploy working versions, observe real usage, fix issues, and continue from feedback.</p></article>
    </div>
  </section>

  <section className="about-modern-facts about-v2-facts">
    <div className="about-fact-modern"><MapPin/><small>BASED IN</small><b>Indonesia</b></div>
    <div className="about-fact-modern"><GraduationCap/><small>ROLE</small><b>Student · Builder</b></div>
    <div className="about-fact-modern"><BookOpen/><small>LEARNING</small><b>Web · APIs · Product UI</b></div>
  </section>

  <section className="about-v2-contact">
    <div><div className="about-label"><MessageCircle size={14}/> CONTACT / PREMIUM</div><h2>Want to talk about a project?</h2><p>Untuk pertanyaan, pembelian AM Premium, atau pembahasan project VANDYZ, hubungi melalui WhatsApp.</p></div>
    <a className="btn premium-btn" href="https://wa.me/6283818597706?text=Halo%20VANDYZ%2C%20saya%20ingin%20menghubungi%20tentang%20project." target="_blank" rel="noreferrer"><MessageCircle size={17}/> CONTACT VANDYZ <ArrowUpRight size={16}/></a>
  </section>

  <section className="premium-card about-v2-premium"><div className="premium-icon"><ShieldCheck/></div><div className="premium-copy"><small>VANDYZ PREMIUM</small><h2>AM Premium · Rp2.000</h2><p>Untuk pembelian AM Premium, hubungi VANDYZ melalui WhatsApp.</p></div><a className="btn premium-btn" href="https://wa.me/6283818597706?text=Halo%20VANDYZ%2C%20saya%20mau%20beli%20AM%20Premium%20Rp2.000." target="_blank" rel="noreferrer"><MessageCircle size={17}/> BUY / ASK</a></section>
  <section className="about-ending"><span>LEONARDO FANDIZKIEL · VANDYZ</span><p>Still learning. Still building. Still evolving.</p></section>
</div>}
