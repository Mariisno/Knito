// Knito — screens (part 2): Yarn stash, Needles, Stats, Add Project, Recipe Viewer, Session, Settings

// ================= YARN STASH =================
function YarnScreen({ t, lang, data, tweaks, onTab, activeTab, onOpen }) {
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('all'); // all | inuse | spare

  const filtered = data.yarn.filter(y => {
    if (q && !y.name.toLowerCase().includes(q.toLowerCase()) && !y.color.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === 'inuse' && y.usedInIds.length === 0) return false;
    if (filter === 'spare' && y.usedInIds.length > 0) return false;
    return true;
  });

  const totalSkeins = data.yarn.reduce((s, y) => s + y.skeins, 0);
  const uniqueColors = new Set(data.yarn.map(y => y.colorHex)).size;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '6px 20px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>{lang === 'en' ? 'Stash' : 'Lager'}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{t.tabs.yarn}</div>
      </div>

      {/* summary */}
      <div style={{ padding: '12px 20px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Stat label={t.fields.skeins} value={totalSkeins}/>
        <Stat label={lang === 'en' ? 'Colors' : 'Farger'} value={uniqueColors}/>
        <Stat label={lang === 'en' ? 'In use' : 'I bruk'} value={data.yarn.filter(y => y.usedInIds.length).length}/>
      </div>

      {/* search */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40, padding: '0 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--muted-fg)' }}>
          <Icon.search s={16}/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={lang === 'en' ? 'Search yarn…' : 'Søk i garn…'} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--fg)', fontFamily: 'inherit' }}/>
        </div>
      </div>

      <div style={{ padding: '0 20px 8px', display: 'flex', gap: 8 }}>
        <Chip active={filter==='all'} onClick={() => setFilter('all')}>{t.filter.all}</Chip>
        <Chip active={filter==='inuse'} onClick={() => setFilter('inuse')}>{lang === 'en' ? 'In a project' : 'I prosjekt'}</Chip>
        <Chip active={filter==='spare'} onClick={() => setFilter('spare')}>{lang === 'en' ? 'Spare' : 'Ubrukt'}</Chip>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 140px' }}>
        {filtered.map(y => {
          const usedIn = y.usedInIds.map(pid => data.projects.find(p => p.id === pid)).filter(Boolean);
          return (
            <div key={y.id} style={{
              display: 'flex', alignItems: 'stretch', gap: 14,
              padding: 14, marginBottom: 10,
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
            }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: y.colorHex, border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)', flexShrink: 0, position: 'relative' }}>
                {y.skeins === 0 && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: 'color-mix(in oklab, var(--bg) 70%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--fg)', fontWeight: 600 }}>
                    {lang === 'en' ? 'Used' : 'Brukt'}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{y.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: y.skeins === 0 ? 'var(--muted-fg)' : 'var(--fg)', flexShrink: 0 }}>{y.skeins} <span style={{ fontWeight: 400, color: 'var(--muted-fg)' }}>{t.fields.skeins.toLowerCase()}</span></div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 2 }}>{y.color} · {y.weight} · {y.yardage}</div>
                {usedIn.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {usedIn.map(p => (
                      <button key={p.id} onClick={() => onOpen(p.id)} style={{
                        height: 22, padding: '0 8px', borderRadius: 999, border: '1px solid var(--border)',
                        background: 'transparent', color: 'var(--fg)', fontSize: 11, fontWeight: 500,
                        display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <Icon.link s={10}/> {lang === 'en' ? p.nameEn : p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button style={{
        position: 'absolute', right: 20, bottom: 110, zIndex: 25,
        height: 54, padding: '0 20px 0 18px', borderRadius: 999,
        background: 'var(--primary)', color: 'var(--primary-fg)', border: 'none',
        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600,
        boxShadow: '0 8px 24px -6px color-mix(in oklab, var(--primary) 45%, transparent)',
      }}><Icon.plus s={20}/> {t.actions.addYarn}</button>

      <TabBar active={activeTab} onChange={onTab} t={t}/>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
      <div style={{ fontSize: 10, color: 'var(--muted-fg)', letterSpacing: 1.3, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {hint && <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', marginTop: 1 }}>{hint}</div>}
    </div>
  );
}

// ================= NEEDLES =================
function NeedlesScreen({ t, lang, data, onTab, activeTab, onOpen }) {
  const byType = {};
  data.needles.forEach(n => {
    const tp = lang === 'en' ? n.typeEn : n.type;
    (byType[tp] ||= []).push(n);
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '6px 20px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>{lang === 'en' ? 'Tools' : 'Verktøy'}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{t.tabs.needles}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 140px' }}>
        {Object.entries(byType).map(([tp, items]) => (
          <div key={tp} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted-fg)', fontWeight: 500, padding: '6px 2px 10px' }}>{tp}</div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              {items.map((n, i) => {
                const usedIn = n.usedInIds.map(pid => data.projects.find(p => p.id === pid)).filter(Boolean);
                return (
                  <div key={n.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  }}>
                    <div style={{
                      minWidth: 52, height: 52, borderRadius: 10, background: 'var(--accent)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, letterSpacing: -0.3,
                    }}>
                      {n.size}
                      {n.length && <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.6, marginTop: 1 }}>{n.length}</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{lang === 'en' ? n.materialEn : n.material}</div>
                      {usedIn.length > 0 ? (
                        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {usedIn.map(p => (
                            <button key={p.id} onClick={() => onOpen(p.id)} style={{ height: 18, padding: '0 6px', borderRadius: 4, border: 'none', background: 'var(--accent)', color: 'var(--fg)', fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit' }}>
                              {lang === 'en' ? p.nameEn : p.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 2 }}>{lang === 'en' ? 'Free' : 'Ledig'}</div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>×{n.quantity}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button style={{
        position: 'absolute', right: 20, bottom: 110, zIndex: 25,
        height: 54, padding: '0 20px 0 18px', borderRadius: 999,
        background: 'var(--primary)', color: 'var(--primary-fg)', border: 'none',
        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600,
        boxShadow: '0 8px 24px -6px color-mix(in oklab, var(--primary) 45%, transparent)',
      }}><Icon.plus s={20}/> {t.actions.addNeedle}</button>

      <TabBar active={activeTab} onChange={onTab} t={t}/>
    </div>
  );
}

// ================= STATS =================
function StatsScreen({ t, lang, data, onTab, activeTab }) {
  const totalMinutes = data.projects.reduce((s, p) => s + (p.timeMinutes || 0), 0);
  const totalHrs = Math.floor(totalMinutes / 60);
  const finished = data.projects.filter(p => p.status === 'Fullført').length;
  const active = data.projects.filter(p => p.status === 'Aktiv').length;
  // fake weekly pattern (last 7 days)
  const week = [45, 30, 60, 20, 90, 55, 75];
  const max = Math.max(...week);
  const days = lang === 'en' ? ['M','T','W','T','F','S','S'] : ['M','T','O','T','F','L','S'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '6px 20px 8px' }}>
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>{lang === 'en' ? 'Overview' : 'Oversikt'}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>{t.tabs.stats}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 140px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <Stat label={t.session.total} value={`${totalHrs}${t.units.hours}`} hint={lang === 'en' ? 'knitting time' : 'strikket totalt'}/>
          <Stat label={lang === 'en' ? 'Active' : 'Aktive'} value={active} hint={lang === 'en' ? 'projects' : 'prosjekter'}/>
          <Stat label={t.status.Fullført} value={finished} hint={lang === 'en' ? 'all time' : 'så langt'}/>
          <Stat label={lang === 'en' ? 'Yarn' : 'Garn'} value={data.yarn.length} hint={lang === 'en' ? 'items' : 'oppføringer'}/>
        </div>

        {/* weekly chart */}
        <div style={{ padding: 18, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: 1.3, textTransform: 'uppercase', color: 'var(--muted-fg)' }}>{t.session.thisWeek}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, marginTop: 2 }}>
                {week.reduce((a,b) => a+b,0)} <span style={{ fontSize: 13, color: 'var(--muted-fg)', fontWeight: 400 }}>{t.units.minutes}</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted-fg)' }}>{lang === 'en' ? '+ 18% vs last week' : '+ 18% mot forrige'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100 }}>
            {week.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: '100%', height: `${(m / max) * 80}px`,
                  background: i === 6 ? 'var(--primary)' : 'var(--accent)',
                  borderRadius: 6,
                }}/>
                <div style={{ fontSize: 10, color: 'var(--muted-fg)' }}>{days[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* project time leaderboard */}
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted-fg)', fontWeight: 500, padding: '4px 2px 10px' }}>{lang === 'en' ? 'Most time invested' : 'Mest tid brukt'}</div>
        {[...data.projects].sort((a,b) => b.timeMinutes - a.timeMinutes).slice(0,4).map(p => {
          const hrs = Math.floor(p.timeMinutes/60), mins = p.timeMinutes % 60;
          const nm = lang === 'en' ? p.nameEn : p.name;
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden' }}>
                <KnitTexture variant={p.image}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nm}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 1 }}>{p.progress}% · {t.status[p.status]}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{hrs}{t.units.hours} {mins > 0 ? `${mins}${t.units.minutes}` : ''}</div>
            </div>
          );
        })}
      </div>

      <TabBar active={activeTab} onChange={onTab} t={t}/>
    </div>
  );
}

// ================= ADD PROJECT (sheet) =================
function AddProjectSheet({ t, lang, onClose, onCreate }) {
  const [name, setName] = React.useState(lang === 'en' ? 'New sweater' : 'Ny genser');
  const [cat, setCat] = React.useState(lang === 'en' ? 'Sweater' : 'Genser');
  const cats = lang === 'en' ? ['Sweater','Shawl','Socks','Cardigan','Blanket','Hat','Other'] : ['Genser','Sjal','Sokker','Kofte','Teppe','Lue','Annet'];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'color-mix(in oklab, #000 25%, transparent)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{
        width: '100%', background: 'var(--bg)', borderRadius: '24px 24px 0 0',
        padding: '12px 20px 30px', maxHeight: '82%', overflowY: 'auto',
        animation: 'sheetIn .3s cubic-bezier(.3,.8,.3,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 999, background: 'var(--border)', margin: '4px auto 14px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted-fg)', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>{t.nav.cancel}</button>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>{t.actions.newProject}</div>
          <button onClick={onCreate} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{t.nav.save}</button>
        </div>

        <SheetField label={lang === 'en' ? 'Project name' : 'Prosjektnavn'}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 16, color: 'var(--fg)', fontFamily: 'inherit' }}/>
        </SheetField>

        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 1.5, textTransform: 'uppercase', padding: '14px 2px 8px', fontWeight: 500 }}>{t.fields.category}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
        </div>

        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 1.5, textTransform: 'uppercase', padding: '22px 2px 10px', fontWeight: 500 }}>{lang === 'en' ? 'Attachments' : 'Vedlegg'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <AttachTile icon={<Icon.camera s={22}/>} label={t.actions.attachPhoto}/>
          <AttachTile icon={<Icon.doc s={22}/>} label={t.actions.attachRecipe}/>
        </div>

        <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 1.5, textTransform: 'uppercase', padding: '22px 2px 8px', fontWeight: 500 }}>{t.fields.yarn}</div>
        <div style={{ padding: 14, border: '1px dashed var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted-fg)', fontSize: 13 }}>
          <Icon.plus s={16}/> {lang === 'en' ? 'Pick from stash or add new' : 'Velg fra lager eller legg til nytt'}
        </div>
      </div>
    </div>
  );
}

function SheetField({ label, children }) {
  return (
    <div style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', letterSpacing: 1.3, textTransform: 'uppercase', marginBottom: 6, fontWeight: 500 }}>{label}</div>
      {children}
    </div>
  );
}

function AttachTile({ icon, label }) {
  return (
    <button style={{
      height: 90, background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: 12,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
      color: 'var(--muted-fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, textAlign: 'center', padding: 10,
    }}>{icon}<span>{label}</span></button>
  );
}

// ================= RECIPE VIEWER =================
function RecipeViewer({ project, lang, t, onClose }) {
  const [page, setPage] = React.useState(1);
  const total = project?.recipePages || 8;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, background: '#1a1512', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '50px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconBtn onClick={onClose} style={{ color: '#f5f1ed' }}><Icon.close s={22}/></IconBtn>
        <div style={{ flex: 1, color: '#f5f1ed', overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project?.recipeName}</div>
          <div style={{ fontSize: 11, color: 'rgba(245,241,237,0.6)', marginTop: 1 }}>{lang === 'en' ? 'Page' : 'Side'} {page} / {total}</div>
        </div>
        <IconBtn style={{ color: '#f5f1ed' }}><Icon.open s={18}/></IconBtn>
      </div>
      {/* fake pdf page */}
      <div style={{ flex: 1, padding: '10px 24px', overflow: 'auto' }}>
        <div style={{
          width: '100%', aspectRatio: '3 / 4', background: '#fbfaf6',
          borderRadius: 4, padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,.4)', color: '#2d2520',
          fontFamily: 'Georgia, serif',
        }}>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 14 }}>{project?.name}</div>
          <div style={{ fontSize: 11, lineHeight: 1.6, color: '#4a443f', columns: 1 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{lang === 'en' ? 'Materials' : 'Materialer'}</div>
            <ul style={{ paddingLeft: 16, marginBottom: 10 }}>
              <li>Sandnes Peer Gynt — 9 nøster</li>
              <li>Rundpinne 3.5mm, 80cm</li>
              <li>Rundpinne 4mm, 60cm</li>
            </ul>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{lang === 'en' ? 'Gauge' : 'Strikkefasthet'}</div>
            <p style={{ marginBottom: 10 }}>22 m × 30 omg over 10 × 10 cm i glattstrikk på pinne 4 mm.</p>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{lang === 'en' ? 'Body' : 'Bol'}</div>
            <p>Legg opp 220 m på rundpinne 3.5 mm med natur. Strikk vrangbord 2r 2vr i 6 cm. Bytt til pinne 4 mm og strikk glattstrikk i 38 cm. Del arbeidet jevnt fordelt for ermer — merk 55 m foran og 55 m bak. Fortsett til arbeidet måler 42 cm fra oppleggskant.</p>
            <div style={{ height: 80, margin: '14px 0', background: 'repeating-linear-gradient(45deg, #e8ddd4 0 4px, #d3c3a5 4px 8px)', borderRadius: 2 }}/>
            <p style={{ fontSize: 10, color: '#8b7355', textAlign: 'center' }}>Diagram A — raglanfelling</p>
          </div>
        </div>
      </div>
      {/* page nav */}
      <div style={{ padding: '14px 20px 34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <button onClick={() => setPage(Math.max(1, page-1))} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(245,241,237,0.1)', border: 'none', color: '#f5f1ed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon.back s={20}/></button>
        <div style={{ flex: 1, height: 6, background: 'rgba(245,241,237,0.12)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${(page/total)*100}%`, height: '100%', background: 'var(--primary)', borderRadius: 999, transition: 'width .3s' }}/>
        </div>
        <button onClick={() => setPage(Math.min(total, page+1))} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(245,241,237,0.1)', border: 'none', color: '#f5f1ed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ transform: 'rotate(180deg)' }}><Icon.back s={20}/></div></button>
      </div>
    </div>
  );
}

// ================= ACTIVE SESSION =================
// Controlled: state lives in App so the timer keeps running when minimized.
function SessionScreen({ project, session, lang, t, onMinimize, onEnd, onToggleRun, onIncRows, onDecRows, onOpenRecipe }) {
  if (!session || !project) return null;
  const mins = Math.floor(session.seconds/60), secs = session.seconds%60;
  const target = project?.counter?.target ?? 100;
  const rows = session.rows;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 150, background: 'var(--bg)', display: 'flex', flexDirection: 'column', padding: '46px 20px 30px', animation: 'sheetIn .3s cubic-bezier(.3,.8,.3,1)' }}>
      {/* Top bar: minimize (keeps running) + title + end */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <IconBtn onClick={onMinimize} title={lang === 'en' ? 'Minimize' : 'Minimer'}><Icon.chevDown s={22}/></IconBtn>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>{t.session.active}</div>
          <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'en' ? project.nameEn : project.name}</div>
        </div>
        <button onClick={onEnd} style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted-fg)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600 }}>
          {lang === 'en' ? 'End' : 'Avslutt'}
        </button>
      </div>

      {/* Timer + row counter */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 500, letterSpacing: -2.5, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {String(mins).padStart(2,'0')}<span style={{ opacity: 0.25 }}>:</span>{String(secs).padStart(2,'0')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 8, letterSpacing: 2, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: session.running ? 'var(--primary)' : 'var(--muted-fg)', animation: session.running ? 'pulse 1.4s ease-in-out infinite' : 'none' }}/>
          {session.running ? (lang === 'en' ? 'Recording' : 'Tar tid') : (lang === 'en' ? 'Paused' : 'Pause')}
        </div>

        {/* row counter card */}
        <div style={{ marginTop: 30, width: '100%', padding: 20, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, textAlign: 'center' }}>
          <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>{lang === 'en' ? 'Stitch counter' : 'Maskeantall'}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 500, letterSpacing: -1.5, lineHeight: 1, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
            {rows}<span style={{ fontSize: 20, color: 'var(--muted-fg)', fontWeight: 400 }}> / {target}</span>
          </div>
        </div>
      </div>

      {/* Big row tap */}
      <button onClick={onIncRows} style={{
        height: 76, borderRadius: 18, border: 'none',
        background: 'var(--primary)', color: 'var(--primary-fg)',
        fontFamily: 'inherit', fontSize: 16, fontWeight: 600, letterSpacing: -0.2,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10,
      }}>
        <Icon.plus s={22}/> {lang === 'en' ? 'Count row' : 'Tell omgang'}
      </button>

      {/* Secondary row: undo / pause / see recipe */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onDecRows} style={{ flex: 1, height: 48, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icon.minus s={14}/> {lang === 'en' ? 'Undo' : 'Angre'}
        </button>
        <button onClick={onToggleRun} style={{ flex: 1, height: 48, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {session.running ? <><Icon.pause s={14}/> {lang === 'en' ? 'Pause' : 'Pause'}</> : <><Icon.play s={14}/> {lang === 'en' ? 'Resume' : 'Start'}</>}
        </button>
        {project.hasAttachment && (
          <button onClick={onOpenRecipe} style={{ flex: 1.2, height: 48, borderRadius: 12, background: 'var(--fg)', border: 'none', color: 'var(--bg)', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Icon.doc s={14}/> {lang === 'en' ? 'Recipe' : 'Oppskrift'}
          </button>
        )}
      </div>
    </div>
  );
}

// Floating minimized-session pill — visible on any screen while session runs minimized
function SessionPill({ session, project, lang, t, onExpand, onEnd }) {
  if (!session || !project) return null;
  const mins = Math.floor(session.seconds/60), secs = session.seconds%60;
  return (
    <div style={{
      position: 'absolute', left: 14, right: 14, bottom: 92, zIndex: 90,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px 10px 14px',
      background: 'var(--fg)', color: 'var(--bg)', borderRadius: 14,
      boxShadow: '0 10px 26px -8px color-mix(in oklab, var(--fg) 50%, transparent)',
      animation: 'pillIn .3s cubic-bezier(.3,.8,.3,1)',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--primary)', animation: session.running ? 'pulse 1.4s ease-in-out infinite' : 'none', flexShrink: 0 }}/>
      <button onClick={onExpand} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
        <div style={{ fontSize: 11.5, opacity: 0.65, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>{t.session.active}</div>
        <div style={{ fontSize: 13, fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lang === 'en' ? project.nameEn : project.name} · <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.8 }}>{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</span>
        </div>
      </button>
      <button onClick={onEnd} style={{ width: 32, height: 32, borderRadius: 8, background: 'color-mix(in oklab, var(--bg) 15%, transparent)', border: 'none', color: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
        <Icon.close s={14}/>
      </button>
    </div>
  );
}

// ================= SETTINGS =================
function Settings({ t, lang, onClose, onSignOut }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <AppBar title={lang === 'en' ? 'Settings' : 'Innstillinger'} left={<IconBtn onClick={onClose}><Icon.close s={20}/></IconBtn>}/>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 40px' }}>
        <Section title={lang === 'en' ? 'Account' : 'Konto'}>
          <LinkRow title="maria@knito.no" subtitle={lang === 'en' ? 'Signed in' : 'Pålogget'} icon={<Icon.flower s={16}/>}/>
        </Section>
        <Section title={lang === 'en' ? 'Data' : 'Data'}>
          <LinkRow icon={<Icon.doc s={16}/>} title={lang === 'en' ? 'Download backup' : 'Last ned sikkerhetskopi'}/>
          <LinkRow icon={<Icon.attach s={16}/>} title={lang === 'en' ? 'Import projects' : 'Importer prosjekter'}/>
        </Section>
        <Section title={lang === 'en' ? 'About' : 'Om'}>
          <LinkRow title="Knito" subtitle="v1.1.0 · 19. apr 2026" icon={<KnitoMark s={24}/>}/>
        </Section>
        <div style={{ padding: '20px 0' }}>
          <button onClick={onSignOut} style={{ width: '100%', height: 46, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: '#c9432b', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            {lang === 'en' ? 'Sign out' : 'Logg ut'}
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  YarnScreen, NeedlesScreen, StatsScreen, AddProjectSheet, RecipeViewer, SessionScreen, SessionPill, Settings, Stat,
});
