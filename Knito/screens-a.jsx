// Knito — screens (part 1): Projects list, Project detail, Onboarding, Auth

// ================= PROJECTS LIST =================
function ProjectsScreen({ t, lang, data, tweaks, onOpen, onNew, onProgress, onTab, activeTab, onSettings }) {
  const [q, setQ] = React.useState('');
  const [filter, setFilter] = React.useState('Aktiv');
  const [view, setView] = React.useState('list'); // list | grid

  const filters = [
    { id: 'Alle', label: t.filter.all },
    { id: 'Aktiv', label: t.filter.active },
    { id: 'På vent', label: t.filter.paused },
    { id: 'Planlagt', label: t.filter.planned },
    { id: 'Fullført', label: t.filter.done },
  ];

  const matched = data.projects.filter(p => {
    const nm = lang === 'en' ? p.nameEn : p.name;
    if (q && !nm.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter !== 'Alle' && p.status !== filter) return false;
    return true;
  });

  const active = matched.filter(p => p.status === 'Aktiv');
  const other  = matched.filter(p => p.status !== 'Aktiv');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* header */}
      <div style={{ padding: '6px 20px 8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>{t.appName}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1, lineHeight: 1 }}>
            {t.tabs.projects}
          </div>
        </div>
        <IconBtn onClick={onSettings} title="Settings" style={{ border: '1px solid var(--border)' }}>
          <Icon.settings s={18}/>
        </IconBtn>
      </div>

      {/* search */}
      <div style={{ padding: '10px 20px 8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          height: 40, padding: '0 14px',
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
          color: 'var(--muted-fg)',
        }}>
          <Icon.search s={16}/>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder={lang === 'en' ? 'Search projects…' : 'Søk i prosjekter…'}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: 'var(--fg)', fontFamily: 'inherit' }}
          />
          {q && <IconBtn onClick={() => setQ('')} style={{ width: 24, height: 24, color: 'var(--muted-fg)' }}><Icon.close s={14}/></IconBtn>}
        </div>
      </div>

      {/* filters */}
      <div style={{ padding: '4px 20px 10px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {filters.map(f => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Chip>
        ))}
        <div style={{ flex: 1 }}/>
        <IconBtn onClick={() => setView(view === 'list' ? 'grid' : 'list')} style={{ color: 'var(--muted-fg)', width: 30, height: 30 }}>
          {view === 'list' ? <Icon.grid s={16}/> : <Icon.list s={16}/>}
        </IconBtn>
      </div>

      {/* list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 150 }}>
        {matched.length === 0 ? (
          <EmptyState icon={<Icon.project s={36}/>} title={t.empty.noProjects} hint={t.empty.noProjectsHint} cta={t.actions.newProject} onCta={onNew} />
        ) : view === 'grid' ? (
          <div style={{ padding: '4px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {matched.map(p => <ProjectGridCard key={p.id} p={p} lang={lang} t={t} tweaks={tweaks} onOpen={() => onOpen(p.id)}/>)}
          </div>
        ) : (
          <div style={{ padding: '0 20px' }}>
            {active.length > 0 && (
              <>
                <SectionHeader label={t.filter.active}/>
                {active.map(p => <ProjectRow key={p.id} p={p} lang={lang} t={t} tweaks={tweaks} onOpen={() => onOpen(p.id)} onProgress={onProgress}/>)}
              </>
            )}
            {other.length > 0 && (
              <>
                <SectionHeader label={lang === 'en' ? 'Others' : 'Andre'}/>
                {other.map(p => <ProjectRow key={p.id} p={p} lang={lang} t={t} tweaks={tweaks} onOpen={() => onOpen(p.id)} onProgress={onProgress}/>)}
              </>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={onNew} style={{
        position: 'absolute', right: 20, bottom: 110, zIndex: 25,
        height: 54, padding: '0 20px 0 18px', borderRadius: 999,
        background: 'var(--primary)', color: 'var(--primary-fg)', border: 'none',
        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 14.5, fontWeight: 600, letterSpacing: -0.2,
        boxShadow: '0 8px 24px -6px color-mix(in oklab, var(--primary) 45%, transparent), 0 2px 6px rgba(0,0,0,.08)',
      }}>
        <Icon.plus s={20}/> {t.actions.newProject}
      </button>

      <TabBar active={activeTab} onChange={onTab} t={t}/>
    </div>
  );
}

function SectionHeader({ label }) {
  return <div style={{ fontSize: 11, color: 'var(--muted-fg)', letterSpacing: 2, textTransform: 'uppercase', padding: '16px 2px 10px', fontWeight: 500 }}>{label}</div>;
}

function ProjectRow({ p, lang, t, tweaks, onOpen, onProgress }) {
  const density = tweaks.density; // compact | roomy
  const h = density === 'compact' ? 76 : 96;
  const pad = density === 'compact' ? 10 : 14;
  const nm = lang === 'en' ? p.nameEn : p.name;
  const cat = lang === 'en' ? p.categoryEn : p.category;
  return (
    <button onClick={onOpen} style={{
      display: 'flex', alignItems: 'stretch', gap: 14, width: '100%',
      padding: pad, marginBottom: 10,
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
      cursor: 'pointer', textAlign: 'left', color: 'var(--fg)',
    }}>
      <div style={{ width: h - pad*2, height: h - pad*2, borderRadius: 10, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
        <KnitTexture variant={p.image}/>
        {p.hasAttachment && (
          <div style={{
            position: 'absolute', top: 4, right: 4,
            width: 20, height: 20, borderRadius: 6,
            background: 'color-mix(in oklab, var(--bg) 85%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--fg)',
          }}><Icon.doc s={12}/></div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusDot status={p.status}/>
            <span style={{ fontSize: 10.5, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: 1.2 }}>{cat}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, letterSpacing: -0.2, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nm}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <div style={{ flex: 1 }}>
            {tweaks.progressStyle === 'stitch'
              ? <StitchProgress value={p.progress} total={18}/>
              : <ProgressBar value={p.progress} height={5}/>}
          </div>
          <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12.5, fontWeight: 600, color: 'var(--fg)', minWidth: 34, textAlign: 'right' }}>{p.progress}%</div>
        </div>
      </div>
    </button>
  );
}

function ProjectGridCard({ p, lang, t, tweaks, onOpen }) {
  const nm = lang === 'en' ? p.nameEn : p.name;
  const cat = lang === 'en' ? p.categoryEn : p.category;
  return (
    <button onClick={onOpen} style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
      overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0,
      display: 'flex', flexDirection: 'column', color: 'var(--fg)',
    }}>
      <div style={{ aspectRatio: '1 / 1', width: '100%', position: 'relative' }}>
        <KnitTexture variant={p.image}/>
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <ProgressRing value={p.progress} size={40} stroke={3} showLabel={false}/>
        </div>
        {p.hasAttachment && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8,
            height: 22, padding: '0 8px', borderRadius: 999,
            background: 'color-mix(in oklab, var(--bg) 88%, transparent)',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10.5, fontWeight: 500, color: 'var(--fg)',
          }}><Icon.doc s={11}/> PDF</div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot status={p.status}/>
          <span style={{ fontSize: 10, color: 'var(--muted-fg)', textTransform: 'uppercase', letterSpacing: 1 }}>{cat}</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 500, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nm}</div>
        <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 11, color: 'var(--muted-fg)', marginTop: 3 }}>{p.progress}%</div>
      </div>
    </button>
  );
}

function EmptyState({ icon, title, hint, cta, onCta }) {
  return (
    <div style={{ padding: '60px 30px', textAlign: 'center', color: 'var(--muted-fg)' }}>
      <div style={{
        width: 72, height: 72, borderRadius: 999, margin: '0 auto 16px',
        background: 'var(--accent)', color: 'var(--fg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--fg)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5, maxWidth: 240, margin: '0 auto 18px' }}>{hint}</div>
      {cta && (
        <button onClick={onCta} style={{
          height: 40, padding: '0 18px', borderRadius: 999,
          background: 'var(--primary)', color: 'var(--primary-fg)', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
        }}>{cta}</button>
      )}
    </div>
  );
}

// ================= PROJECT DETAIL =================
function ProjectDetail({ id, data, t, lang, tweaks, onBack, onOpenRecipe, onOpenSession, session, onSetStatus, onSetProgress }) {
  const p = data.projects.find(x => x.id === id) || data.projects[0];
  const nm = lang === 'en' ? p.nameEn : p.name;
  const cat = lang === 'en' ? p.categoryEn : p.category;
  const notes = lang === 'en' ? p.notesEn : p.notes;

  const yarns = p.yarnIds.map(id => data.yarn.find(y => y.id === id)).filter(Boolean);
  const needles = p.needleIds.map(id => data.needles.find(n => n.id === id)).filter(Boolean);

  const hrs = Math.floor(p.timeMinutes / 60);
  const mins = p.timeMinutes % 60;
  const [statusOpen, setStatusOpen] = React.useState(false);
  const statusOptions = ['Aktiv', 'Planlagt', 'Pause', 'Fullført'];
  const sessionActiveHere = session && session.projectId === p.id;
  const sessMins = session ? Math.floor(session.seconds/60) : 0;
  const sessSecs = session ? session.seconds % 60 : 0;

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)' }}>
      {/* HERO */}
      <div style={{ position: 'relative', height: 300, background: 'var(--accent)' }}>
        <KnitTexture variant={p.image} style={{ position: 'absolute', inset: 0 }}/>
        {/* top bar overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px',
        }}>
          <IconBtn onClick={onBack} style={{ background: 'color-mix(in oklab, var(--bg) 85%, transparent)', backdropFilter: 'blur(12px)' }}>
            <Icon.back s={20}/>
          </IconBtn>
          <IconBtn style={{ background: 'color-mix(in oklab, var(--bg) 85%, transparent)', backdropFilter: 'blur(12px)' }}>
            <Icon.more s={20}/>
          </IconBtn>
        </div>
        {/* status chip on image — tappable */}
        <div style={{ position: 'absolute', top: 60, left: 20, display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setStatusOpen(v => !v)} style={{
              height: 28, padding: '0 12px 0 10px', borderRadius: 999, border: 'none',
              background: 'color-mix(in oklab, var(--bg) 92%, transparent)',
              color: 'var(--fg)', fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'inherit',
              backdropFilter: 'blur(12px)',
            }}>
              <StatusDot status={p.status}/>{t.status[p.status]}
              <Icon.chevDown s={11}/>
            </button>
            {statusOpen && (
              <>
                <div onClick={() => setStatusOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }}/>
                <div style={{
                  position: 'absolute', top: 34, left: 0, zIndex: 51,
                  minWidth: 160, padding: 6,
                  background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12,
                  boxShadow: '0 12px 28px -8px color-mix(in oklab, var(--fg) 30%, transparent)',
                }}>
                  {statusOptions.map(s => (
                    <button key={s} onClick={() => { onSetStatus && onSetStatus(p.id, s); setStatusOpen(false); }} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 10px', borderRadius: 8, border: 'none',
                      background: p.status === s ? 'var(--accent)' : 'transparent',
                      color: 'var(--fg)', fontSize: 12.5, fontWeight: p.status === s ? 600 : 500,
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    }}>
                      <StatusDot status={s}/> {t.status[s]}
                      {p.status === s && <span style={{ marginLeft: 'auto', opacity: 0.6 }}>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div style={{
            height: 26, padding: '0 10px', borderRadius: 999,
            background: 'color-mix(in oklab, var(--bg) 88%, transparent)',
            color: 'var(--muted-fg)', fontSize: 11, fontWeight: 500, letterSpacing: 0.2,
            display: 'flex', alignItems: 'center',
          }}>{cat}</div>
        </div>
      </div>

      {/* HEADLINE */}
      <div style={{ padding: '18px 20px 12px', background: 'var(--bg)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, letterSpacing: -0.6, lineHeight: 1.1 }}>{nm}</div>
        {p.startDate && (
          <div style={{ fontSize: 12.5, color: 'var(--muted-fg)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.calendar s={13}/> {fmtDate(p.startDate, lang, t)}{p.endDate ? ' → ' + fmtDate(p.endDate, lang, t) : ''}
          </div>
        )}
      </div>

      {/* RECIPE — the hero affordance, comes FIRST */}
      <div style={{ padding: '4px 20px 10px' }}>
        {p.hasAttachment ? (
          <button onClick={onOpenRecipe} style={{
            display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
            padding: 16, borderRadius: 18, border: '1px solid var(--fg)',
            background: 'var(--fg)', color: 'var(--bg)', cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            <div style={{
              width: 54, height: 66, borderRadius: 6,
              background: 'color-mix(in oklab, var(--bg) 15%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', flexShrink: 0,
            }}>
              <Icon.doc s={26}/>
              <div style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 8, fontWeight: 700, background: 'var(--primary)', color: 'var(--primary-fg)', borderRadius: 4, padding: '2px 4px' }}>PDF</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.6 }}>{t.fields.recipe}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 500, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.recipeName}</div>
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>{p.recipePages} {lang === 'en' ? 'pages' : 'sider'} · {p.recipeSize}</div>
            </div>
            <Icon.open s={22}/>
          </button>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 14,
            border: '1px dashed var(--border)', borderRadius: 16, background: 'transparent',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-fg)' }}>
              <Icon.attach s={18}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.empty.noAttachment}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-fg)' }}>{t.actions.attachRecipe}</div>
            </div>
            <button style={{
              height: 32, padding: '0 12px', borderRadius: 8, border: 'none',
              background: 'var(--fg)', color: 'var(--bg)', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
            }}>+ PDF</button>
          </div>
        )}
      </div>

      {/* PROGRESS — simple % stepper */}
      <div style={{ padding: '4px 20px 8px' }}>
        <div style={{
          padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', letterSpacing: 1.3, textTransform: 'uppercase', fontWeight: 500 }}>{lang === 'en' ? 'Progress' : 'Progresjon'}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 500, letterSpacing: -1.2, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{p.progress}<span style={{ fontSize: 18, opacity: 0.5, marginLeft: 2 }}>%</span></div>
              <div style={{ fontSize: 12, color: 'var(--muted-fg)' }}>· <Icon.clock s={11}/> {hrs}{t.units.hours} {mins}{t.units.minutes}</div>
            </div>
            <div style={{ marginTop: 10, height: 4, background: 'var(--accent)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: p.progress + '%', height: '100%', background: 'var(--primary)', transition: 'width .3s' }}/>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => onSetProgress && onSetProgress(p.id, Math.min(100, p.progress + 5))} style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon.plus s={14}/></button>
            <button onClick={() => onSetProgress && onSetProgress(p.id, Math.max(0, p.progress - 5))} style={{
              width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg)', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><Icon.minus s={14}/></button>
          </div>
        </div>
      </div>

      {/* SESSION BUTTON — secondary to recipe */}
      <div style={{ padding: '4px 20px 8px' }}>
        <button onClick={onOpenSession} style={{
          width: '100%', height: 48, borderRadius: 14, border: '1px solid var(--border)',
          background: sessionActiveHere ? 'var(--primary)' : 'var(--card)',
          color: sessionActiveHere ? 'var(--primary-fg)' : 'var(--fg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
        }}>
          {sessionActiveHere ? (
            <>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--primary-fg)', animation: 'pulse 1.4s ease-in-out infinite' }}/>
              {lang === 'en' ? 'Resume session' : 'Fortsett økt'} · <span style={{ fontVariantNumeric: 'tabular-nums' }}>{String(sessMins).padStart(2,'0')}:{String(sessSecs).padStart(2,'0')}</span>
            </>
          ) : (
            <><Icon.play s={15}/> {t.actions.startSession}</>
          )}
        </button>
      </div>

      {/* YARN */}
      {yarns.length > 0 && (
        <Section title={t.fields.yarn} count={yarns.length}>
          {yarns.map(y => (
            <LinkRow key={y.id} swatch={y.colorHex}
              title={y.name}
              subtitle={`${y.color} · ${y.weight}`}
              rightTop={`${y.skeins} ${t.fields.skeins.toLowerCase()}`}
              rightBottom={y.dyeLot !== '—' ? `${lang === 'en' ? 'Lot' : 'Parti'} ${y.dyeLot}` : ''}/>
          ))}
        </Section>
      )}

      {/* NEEDLES */}
      {needles.length > 0 && (
        <Section title={t.fields.needles} count={needles.length}>
          {needles.map(n => (
            <LinkRow key={n.id} icon={<Icon.needle s={16}/>}
              title={`${n.size} · ${lang === 'en' ? n.typeEn : n.type}`}
              subtitle={`${lang === 'en' ? n.materialEn : n.material}${n.length ? ' · ' + n.length : ''}`}
              rightTop={`${n.quantity} ${lang === 'en' ? 'owned' : 'stk.'}`}/>
          ))}
        </Section>
      )}

      {/* GAUGE */}
      {p.gauge && (
        <Section title={t.fields.gauge}>
          <div style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, letterSpacing: -0.2 }}>{p.gauge}</div>
          </div>
        </Section>
      )}

      {/* NOTES */}
      {notes && (
        <Section title={t.fields.notes}>
          <div style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.55, color: 'var(--fg)' }}>
            {notes}
          </div>
        </Section>
      )}

      <div style={{ height: 48 }}/>
    </div>
  );
}

function Section({ title, count, children }) {
  return (
    <div style={{ padding: '14px 20px 2px' }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        padding: '0 2px 10px',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted-fg)', fontWeight: 500 }}>{title}</div>
        {count != null && <div style={{ fontSize: 11, color: 'var(--muted-fg)', fontVariantNumeric: 'tabular-nums' }}>{count}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function LinkRow({ swatch, icon, title, subtitle, rightTop, rightBottom }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px',
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
    }}>
      {swatch && <div style={{ width: 28, height: 28, borderRadius: 999, background: swatch, border: '1px solid color-mix(in oklab, var(--fg) 10%, transparent)', flexShrink: 0 }}/>}
      {icon && <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: 'var(--fg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: 'var(--muted-fg)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {(rightTop || rightBottom) && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          {rightTop && <div style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{rightTop}</div>}
          {rightBottom && <div style={{ fontSize: 10.5, color: 'var(--muted-fg)', marginTop: 1 }}>{rightBottom}</div>}
        </div>
      )}
    </div>
  );
}

function fmtDate(iso, lang, t) {
  const d = new Date(iso);
  return `${d.getDate()}. ${t.months[d.getMonth()]} ${d.getFullYear()}`;
}

// ================= ONBOARDING =================
function Onboarding({ t, lang, onDone }) {
  const [i, setI] = React.useState(0);
  const slide = t.onboarding[i];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px 30px', textAlign: 'center' }}>
        <div style={{
          width: 220, height: 220, borderRadius: 24, overflow: 'hidden',
          marginBottom: 40, boxShadow: '0 20px 40px -20px rgba(60,40,30,.18)',
          position: 'relative',
        }}>
          <KnitTexture variant={['wool-cream','wool-rose','wool-oat'][i]} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'color-mix(in oklab, var(--fg) 30%, transparent)',
          }}>
            {[<Icon.project s={64}/>, <Icon.doc s={64}/>, <Icon.yarn s={64}/>][i]}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500, letterSpacing: -0.6, marginBottom: 12, textWrap: 'pretty' }}>{slide.title}</div>
        <div style={{ fontSize: 15, color: 'var(--muted-fg)', lineHeight: 1.5, maxWidth: 280 }}>{slide.body}</div>
      </div>
      <div style={{ padding: '20px 30px 40px' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 22 }}>
          {t.onboarding.map((_, idx) => (
            <div key={idx} style={{
              width: idx === i ? 20 : 6, height: 6, borderRadius: 999,
              background: idx === i ? 'var(--fg)' : 'var(--border)',
              transition: 'width .3s',
            }}/>
          ))}
        </div>
        <button onClick={() => i < 2 ? setI(i+1) : onDone()} style={{
          width: '100%', height: 52, borderRadius: 14, border: 'none',
          background: 'var(--fg)', color: 'var(--bg)', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
        }}>{i < 2 ? (lang === 'en' ? 'Next' : 'Neste') : t.actions.getStarted}</button>
        {i < 2 && (
          <button onClick={onDone} style={{
            width: '100%', height: 40, marginTop: 4, background: 'transparent', border: 'none',
            color: 'var(--muted-fg)', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer',
          }}>{lang === 'en' ? 'Skip' : 'Hopp over'}</button>
        )}
      </div>
    </div>
  );
}

// ================= AUTH =================
function Auth({ t, lang, onSignIn }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ padding: '50px 30px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
          <KnitoMark s={32}/>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, letterSpacing: -0.3 }}>{t.appName}</div>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1.1, marginBottom: 8 }}>{t.auth.welcomeBack}</div>
        <div style={{ fontSize: 14.5, color: 'var(--muted-fg)', lineHeight: 1.5 }}>{t.auth.signInSub}</div>
      </div>
      <div style={{ padding: '0 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label={t.auth.email} value="maria@knito.no"/>
        <Field label={t.auth.password} value="••••••••" />
        <div style={{ textAlign: 'right', margin: '-4px 2px 4px' }}>
          <a style={{ fontSize: 12.5, color: 'var(--muted-fg)', textDecoration: 'none', cursor: 'pointer' }}>{t.auth.forgot}</a>
        </div>
        <button onClick={onSignIn} style={{
          height: 52, borderRadius: 14, border: 'none',
          background: 'var(--fg)', color: 'var(--bg)', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 15, fontWeight: 600,
        }}>{t.actions.signIn}</button>
      </div>
      <div style={{ flex: 1 }}/>
      <div style={{ padding: '20px 30px 40px', textAlign: 'center', fontSize: 13, color: 'var(--muted-fg)' }}>
        {t.auth.noAccount} <a style={{ color: 'var(--fg)', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>{t.actions.signUp}</a>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 14, top: 10, fontSize: 10.5, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted-fg)', fontWeight: 500 }}>{label}</div>
      <div style={{
        height: 64, padding: '26px 14px 8px', background: 'var(--card)',
        border: '1px solid var(--border)', borderRadius: 12,
        fontSize: 15, color: 'var(--fg)',
      }}>{value}</div>
    </div>
  );
}

function KnitoMark({ s = 28 }) {
  return (
    <div style={{ width: s, height: s, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-fg)' }}>
      <svg width={s*0.6} height={s*0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M5 4c-.8 3-.8 5 0 8s.8 5 0 8M12 4c-.8 3-.8 5 0 8s.8 5 0 8M19 4c-.8 3-.8 5 0 8s.8 5 0 8"/>
      </svg>
    </div>
  );
}

Object.assign(window, {
  ProjectsScreen, ProjectDetail, Onboarding, Auth, Section, LinkRow, EmptyState, KnitoMark, fmtDate,
});
