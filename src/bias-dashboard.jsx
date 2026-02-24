import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, Legend, ReferenceLine
} from "recharts";

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg: "#FDF6EE",
  surface: "#FFFAF4",
  surfaceAlt: "#F7EDE0",
  border: "#E2CAB0",
  borderLight: "#EDD9C4",
  terracotta: "#C4622D",
  terracottaLight: "#E8896A",
  sage: "#6B8F5E",
  sageLight: "#A3C494",
  amber: "#C98B3A",
  amberLight: "#E8B872",
  textPrimary: "#2C1810",
  textSecondary: "#7A5C4A",
  textMuted: "#A88B78",
  cream: "#F5E6D3",
};

const biasColor = (di) => {
  if (!di) return C.textMuted;
  if (di >= 0.8 && di <= 1.25) return C.sage;
  if ((di >= 0.65 && di < 0.8) || (di > 1.25 && di <= 1.5)) return C.amber;
  return C.terracotta;
};

const COLORS_CHART = [C.terracotta, C.sage, C.amber, "#8B6BAE", "#5B8FA8", "#B85C7A"];
const RACES = ["White", "Black", "Hispanic", "Asian", "Other"];
const GENDERS = ["Male", "Female", "Non-binary"];
const AGE_GROUPS = ["18-25", "26-35", "36-50", "51-65", "65+"];

function gaussianRandom(mean = 0, std = 1) {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

function generateDataset(n = 500) {
  const rBase = { White: 45, Black: 63, Hispanic: 59, Asian: 40, Other: 55 };
  const gBase = { Male: 50, Female: 48, "Non-binary": 57 };
  const aBase = { "18-25": 66, "26-35": 52, "36-50": 44, "51-65": 48, "65+": 55 };
  return Array.from({ length: n }, (_, id) => {
    const race = RACES[Math.floor(Math.random() * RACES.length)];
    const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    const ageGroup = AGE_GROUPS[Math.floor(Math.random() * AGE_GROUPS.length)];
    const base = (rBase[race] + gBase[gender] + aBase[ageGroup]) / 3;
    const riskScore = clamp(Math.round(base + gaussianRandom(0, 8)));
    return { id, race, gender, ageGroup, riskScore, highRisk: riskScore >= 65, actualBad: Math.random() < base / 200 + 0.15 };
  });
}

function groupMetrics(data, key, groups) {
  return groups.map(group => {
    const s = data.filter(d => d[key] === group);
    if (!s.length) return null;
    const avg = s.reduce((a, d) => a + d.riskScore, 0) / s.length;
    const hrr = s.filter(d => d.highRisk).length / s.length;
    const tp = s.filter(d => d.highRisk && d.actualBad).length;
    const fp = s.filter(d => d.highRisk && !d.actualBad).length;
    const fn = s.filter(d => !d.highRisk && d.actualBad).length;
    const tn = s.filter(d => !d.highRisk && !d.actualBad).length;
    return {
      group,
      avgScore: +avg.toFixed(1),
      highRiskRate: +(hrr * 100).toFixed(1),
      fpr: +((fp + tn) > 0 ? fp / (fp + tn) * 100 : 0).toFixed(1),
      fnr: +((tp + fn) > 0 ? fn / (tp + fn) * 100 : 0).toFixed(1),
      count: s.length,
    };
  }).filter(Boolean);
}

function withDI(metrics, refGroup) {
  const ref = metrics.find(m => m.group === refGroup);
  return metrics.map(m => ({ ...m, di: ref?.highRiskRate > 0 ? +(m.highRiskRate / ref.highRiskRate).toFixed(2) : null }));
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", boxShadow: "0 4px 20px rgba(44,24,16,0.12)" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: C.terracotta, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.textSecondary }}>
          {p.name}: <b style={{ color: C.textPrimary }}>{p.value}</b>
        </div>
      ))}
    </div>
  );
};

const KPICard = ({ label, value, unit = "", color = C.terracotta, note }) => (
  <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 12, padding: "20px 22px", boxShadow: "0 2px 12px rgba(44,24,16,0.06)", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 70, height: 70, background: color, opacity: 0.08, borderRadius: "0 12px 0 70px" }} />
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>{label}</div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color, fontWeight: 700, lineHeight: 1 }}>
      {value}<span style={{ fontSize: 14, color: C.textMuted, marginLeft: 4, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>{unit}</span>
    </div>
    {note && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.textMuted, marginTop: 8 }}>{note}</div>}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 }}>{children}</div>
);

const SectionTitle = ({ title, sub }) => (
  <div style={{ marginBottom: 18 }}>
    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: C.textPrimary, fontWeight: 700, margin: 0 }}>{title}</h2>
    {sub && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.textMuted, margin: "4px 0 0" }}>{sub}</p>}
  </div>
);

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: "7px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 12,
    background: active ? C.terracotta : "transparent",
    color: active ? "#fff" : C.textSecondary,
    border: `1.5px solid ${active ? C.terracotta : C.border}`,
    borderRadius: 100, cursor: "pointer", transition: "all 0.18s",
    fontWeight: active ? 600 : 400,
  }}>{label}</button>
);

const DIBadge = ({ di }) => {
  const color = biasColor(di);
  const label = !di ? "—" : di >= 0.8 && di <= 1.25 ? "Fair" : di > 1.25 && di <= 1.5 ? "Borderline" : "Biased";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: color + "18", border: `1px solid ${color}40`, borderRadius: 100, padding: "2px 10px" }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color, fontWeight: 600 }}>{di ?? "—"}</span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color }}>· {label}</span>
    </span>
  );
};

export default function BiasAuditDashboard() {
  const [data, setData] = useState([]);
  const [n, setN] = useState(500);
  const [tab, setTab] = useState("race");
  const [uploadedData, setUploadedData] = useState(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { setData(generateDataset(n)); }, [n]);

  const active = uploadedData || data;
  const raceMx = withDI(groupMetrics(active, "race", RACES), "White");
  const genderMx = withDI(groupMetrics(active, "gender", GENDERS), "Male");
  const ageMx = withDI(groupMetrics(active, "ageGroup", AGE_GROUPS), "26-35");
  const currentMx = { race: raceMx, gender: genderMx, ageGroup: ageMx }[tab];

  const allMx = [...raceMx, ...genderMx, ...ageMx];
  const maxDI = +Math.max(...allMx.map(m => m.di || 1)).toFixed(2);
  const topBias = [...allMx].sort((a, b) => (b.di || 1) - (a.di || 1))[0];
  const avgScore = active.length ? (active.reduce((s, d) => s + d.riskScore, 0) / active.length).toFixed(1) : "—";
  const hrPct = active.length ? ((active.filter(d => d.highRisk).length / active.length) * 100).toFixed(1) : "—";

  const handleCSV = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const lines = ev.target.result.trim().split("\n");
        const headers = lines[0].split(",").map(h => h.trim());
        const rows = lines.slice(1).map(line => {
          const vals = line.split(","); const row = {};
          headers.forEach((h, i) => { row[h] = isNaN(vals[i]) ? vals[i]?.trim() : +vals[i]; });
          row.highRisk = row.riskScore >= 65; row.actualBad = Math.random() < 0.25;
          return row;
        });
        setUploadedData(rows);
      } catch { alert("CSV needs columns: race, gender, ageGroup, riskScore"); }
    };
    r.readAsText(file);
  };

  const runAI = useCallback(async () => {
    setAiLoading(true); setAiText("");
    const fmt = (mx) => mx.map(m => `${m.group}: avgScore=${m.avgScore}, highRiskRate=${m.highRiskRate}%, DI=${m.di}`).join("; ");
    const prompt = `You are a fairness auditor for AI risk scoring models.

Bias metrics summary:
RACE (ref: White): ${fmt(raceMx)}
GENDER (ref: Male): ${fmt(genderMx)}
AGE (ref: 26-35): ${fmt(ageMx)}

Disparate Impact (DI) < 0.8 or > 1.25 = discriminatory (4/5ths rule).

Provide:
1. A 2-sentence executive summary of findings.
2. Top 3 most concerning disparities with brief explanation.
3. 3 concrete mitigation strategies.

Use **bold** for key terms. Be direct and concise.`;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
  },
  body: JSON.stringify({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  })
});
const j = await res.json();
const text = j?.choices?.[0]?.message?.content || j?.error?.message || "No response.";
setAiText(text);
    } catch (err) { setAiText("Error fetching analysis. Please try again."); }
    setAiLoading(false);
  }, [raceMx, genderMx, ageMx]);

  const renderText = (txt) => txt.split("\n").map((line, i) => {
    const html = line.replace(/\*\*(.*?)\*\*/g, `<strong style="color:${C.terracotta}">$1</strong>`);
    return <p key={i} style={{ margin: "4px 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.textSecondary, lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: html }} />;
  });

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: C.bg, color: C.textPrimary, fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />

      {/* Warm dot texture */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: `radial-gradient(${C.border}60 1px, transparent 1px)`, backgroundSize: "28px 28px", pointerEvents: "none", opacity: 0.6 }} />

      {/* ── Header ── */}
      <header style={{ position: "relative", width: "100%", background: C.surface, borderBottom: `1.5px solid ${C.border}`, padding: isMobile ? "12px 16px" : "0 40px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, minHeight: isMobile ? "auto" : 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${C.terracotta}, ${C.amber})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${C.terracotta}40` }}>
              <span style={{ fontSize: 20 }}>⚖️</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 17 : 21, fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>Bias Auditor</div>
              <div style={{ fontSize: 11, color: C.textMuted, letterSpacing: "0.07em", marginTop: 2 }}>Risk Score Fairness Dashboard</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            {!uploadedData && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>N =</span>
                <select value={n} onChange={e => setN(+e.target.value)} style={{ background: C.bg, border: `1.5px solid ${C.border}`, color: C.textPrimary, padding: "5px 10px", fontSize: 12, borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", outline: "none" }}>
                  {[100, 250, 500, 1000, 2000].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            )}
            <label style={{ cursor: "pointer" }}>
              <div style={{ padding: "6px 14px", background: C.cream, border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>📁 Upload CSV</div>
              <input type="file" accept=".csv" onChange={handleCSV} style={{ display: "none" }} />
            </label>
            {uploadedData && (
              <button onClick={() => setUploadedData(null)} style={{ padding: "6px 12px", background: "#FEF2F2", border: "1.5px solid #FCA5A5", borderRadius: 8, fontSize: 12, color: C.terracotta, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>✕ Clear</button>
            )}
            <div style={{ fontSize: 12, color: C.textMuted, background: C.cream, padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.borderLight}` }}>
              {active.length.toLocaleString()} records
            </div>
          </div>
        </div>
      </header>

      <main style={{ position: "relative", width: "100%", padding: isMobile ? "18px 14px" : "32px 40px", maxWidth: "100%", flex: 1 }}>

        {/* ── Hero Banner ── */}
        <div style={{ background: `linear-gradient(120deg, ${C.terracotta}10 0%, ${C.amber}08 50%, ${C.sage}10 100%)`, border: `1.5px solid ${C.borderLight}`, borderRadius: 16, padding: isMobile ? "18px 16px" : "28px 36px", marginBottom: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div>
            <SectionLabel>Analysis Overview</SectionLabel>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 22 : 28, fontWeight: 900, margin: "4px 0 8px", color: C.textPrimary }}>Model Fairness Report</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.textSecondary, margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
              Auditing risk scores across race, gender, and age using disparate impact analysis and error rate parity.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <div style={{ padding: "9px 18px", background: biasColor(maxDI) + "16", border: `1.5px solid ${biasColor(maxDI)}50`, borderRadius: 100, fontFamily: "'Playfair Display', serif", fontSize: 14, color: biasColor(maxDI), fontWeight: 700 }}>
              Max DI: {maxDI}×
            </div>
            {topBias && (
              <div style={{ padding: "9px 18px", background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 100, fontSize: 13, color: C.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>
                Most biased: <b style={{ color: C.textPrimary }}>{topBias.group}</b>
              </div>
            )}
          </div>
        </div>

        {/* ── KPIs ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          <KPICard label="Max Disparate Impact" value={maxDI} unit="×" color={biasColor(maxDI)} note="4/5ths rule: 0.8–1.25 = fair" />
          <KPICard label="Most Biased Group" value={topBias?.group || "—"} color="#8B6BAE" note={`DI: ${topBias?.di}`} />
          <KPICard label="Avg Risk Score" value={avgScore} unit="/100" color={C.amber} />
          <KPICard label="High-Risk Flagged" value={hrPct} unit="%" color={C.terracotta} note="Threshold ≥ 65" />
        </div>

        {/* ── Main Charts ── */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap: 18, marginBottom: 18 }}>

          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <SectionTitle title="Group Disparity Analysis" sub="High-risk flagging rates and disparate impact ratios by demographic" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {[{ key: "race", label: "Race & Ethnicity" }, { key: "gender", label: "Gender" }, { key: "ageGroup", label: "Age Group" }].map(t => (
                  <Tab key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
                ))}
              </div>

              {/* High-risk bar */}
              <div style={{ background: C.surface, border: `1.5px solid ${C.borderLight}`, borderRadius: 12, padding: "20px 16px 16px", marginBottom: 14, boxShadow: "0 2px 10px rgba(44,24,16,0.05)" }}>
                <SectionLabel>High-Risk Flagging Rate (%)</SectionLabel>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={currentMx} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke={C.borderLight} vertical={false} />
                    <XAxis dataKey="group" tick={{ fill: C.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: C.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="highRiskRate" name="High Risk %" radius={[6, 6, 0, 0]} maxBarSize={56}>
                      {currentMx.map((m, i) => <Cell key={i} fill={biasColor(m.di)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* DI bar */}
              <div style={{ background: C.surface, border: `1.5px solid ${C.borderLight}`, borderRadius: 12, padding: "20px 16px 16px", boxShadow: "0 2px 10px rgba(44,24,16,0.05)" }}>
                <SectionLabel>Disparate Impact Ratio — fair zone: 0.8–1.25</SectionLabel>
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={currentMx} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 6" stroke={C.borderLight} horizontal={false} />
                    <XAxis type="number" domain={[0, Math.max(2, maxDI + 0.3)]} tick={{ fill: C.textMuted, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="group" type="category" tick={{ fill: C.textSecondary, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} width={78} />
                    <Tooltip content={<Tip />} />
                    <ReferenceLine x={1} stroke={C.textMuted} strokeWidth={1.5} />
                    <ReferenceLine x={0.8} stroke={C.terracotta} strokeDasharray="4 3" strokeOpacity={0.45} />
                    <ReferenceLine x={1.25} stroke={C.terracotta} strokeDasharray="4 3" strokeOpacity={0.45} />
                    <Bar dataKey="di" name="Disparate Impact" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {currentMx.map((m, i) => <Cell key={i} fill={biasColor(m.di)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
                  {[{ c: C.sage, l: "Fair (0.8–1.25)" }, { c: C.amber, l: "Borderline" }, { c: C.terracotta, l: "Discriminatory" }].map(x => (
                    <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: x.c, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: C.textMuted }}>{x.l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Error table */}
            <div style={{ background: C.surface, border: `1.5px solid ${C.borderLight}`, borderRadius: 12, padding: "20px", boxShadow: "0 2px 10px rgba(44,24,16,0.05)" }}>
              <SectionTitle title="Error Rate Disparity" sub="False positive & negative rates by group" />
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 280 }}>
                  <thead>
                    <tr style={{ borderBottom: `1.5px solid ${C.border}` }}>
                      {["Group", "FPR%", "FNR%", "DI"].map(h => (
                        <th key={h} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, textAlign: "left", paddingBottom: 10, paddingRight: 6 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentMx.map((m, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.cream}` }}>
                        <td style={{ padding: "10px 6px 10px 0", fontSize: 13, color: C.textPrimary, fontWeight: 500 }}>{m.group}</td>
                        <td style={{ fontSize: 13, color: m.fpr > 30 ? C.terracotta : C.textSecondary, padding: "10px 6px" }}>{m.fpr}%</td>
                        <td style={{ fontSize: 13, color: m.fnr > 30 ? C.terracotta : C.textSecondary, padding: "10px 6px" }}>{m.fnr}%</td>
                        <td style={{ padding: "10px 0" }}><DIBadge di={m.di} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Radar */}
            <div style={{ background: C.surface, border: `1.5px solid ${C.borderLight}`, borderRadius: 12, padding: "20px", boxShadow: "0 2px 10px rgba(44,24,16,0.05)" }}>
              <SectionTitle title="Fairness Radar" sub="Multi-metric group comparison" />
              <ResponsiveContainer width="100%" height={210}>
                <RadarChart data={[
                  { metric: "Avg Score", ...Object.fromEntries(currentMx.map(m => [m.group, m.avgScore])) },
                  { metric: "High Risk%", ...Object.fromEntries(currentMx.map(m => [m.group, m.highRiskRate])) },
                  { metric: "FPR%", ...Object.fromEntries(currentMx.map(m => [m.group, m.fpr])) },
                  { metric: "FNR%", ...Object.fromEntries(currentMx.map(m => [m.group, m.fnr])) },
                ]}>
                  <PolarGrid stroke={C.borderLight} />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: C.textMuted, fontSize: 10, fontFamily: "'DM Sans', sans-serif" }} />
                  <PolarRadiusAxis tick={{ fill: C.borderLight, fontSize: 8 }} axisLine={false} />
                  {currentMx.map((m, i) => (
                    <Radar key={m.group} name={m.group} dataKey={m.group} stroke={COLORS_CHART[i % COLORS_CHART.length]} fill={COLORS_CHART[i % COLORS_CHART.length]} fillOpacity={0.1} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: C.textMuted }} />
                  <Tooltip content={<Tip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Score Heatmap ── */}
        <div style={{ background: C.surface, border: `1.5px solid ${C.borderLight}`, borderRadius: 12, padding: "22px", marginBottom: 18, boxShadow: "0 2px 10px rgba(44,24,16,0.05)" }}>
          <SectionTitle title="Score Heatmap" sub="Average risk score at Race × Gender intersection" />
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: `100px repeat(${GENDERS.length}, 1fr)`, gap: 4, minWidth: 320 }}>
              <div />
              {GENDERS.map(g => (
                <div key={g} style={{ fontSize: 11, color: C.textMuted, textAlign: "center", paddingBottom: 8, fontWeight: 500, letterSpacing: "0.06em" }}>{g}</div>
              ))}
              {RACES.map(race => {
                const rData = active.filter(d => d.race === race);
                return [
                  <div key={`l-${race}`} style={{ display: "flex", alignItems: "center", fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>{race}</div>,
                  ...GENDERS.map(gender => {
                    const sub = rData.filter(d => d.gender === gender);
                    const avg = sub.length ? sub.reduce((s, d) => s + d.riskScore, 0) / sub.length : 50;
                    const t = clamp((avg - 35) / 40, 0, 1);
                    const r = Math.round(t * 196 + (1 - t) * 107);
                    const g2 = Math.round(t * 98 + (1 - t) * 143);
                    const b = Math.round(t * 45 + (1 - t) * 94);
                    return (
                      <div key={`${race}-${gender}`} title={`${race} × ${gender}: ${avg.toFixed(1)}`}
                        style={{ background: `rgba(${r},${g2},${b},0.78)`, borderRadius: 8, padding: "13px 6px", textAlign: "center", fontSize: 13, color: "#fff", fontWeight: 600, fontFamily: "'Playfair Display', serif", cursor: "default", transition: "opacity 0.2s" }}>
                        {avg.toFixed(0)}
                      </div>
                    );
                  })
                ];
              })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
            <span style={{ fontSize: 11, color: C.textMuted }}>Low Risk</span>
            <div style={{ width: 120, height: 8, background: `linear-gradient(to right, rgba(107,143,94,0.78), rgba(196,98,45,0.78))`, borderRadius: 4 }} />
            <span style={{ fontSize: 11, color: C.textMuted }}>High Risk</span>
          </div>
        </div>

        {/* ── AI Analysis ── */}
        <div style={{ background: C.surface, border: `1.5px solid ${C.borderLight}`, borderRadius: 12, padding: isMobile ? "18px 16px" : "28px", boxShadow: "0 2px 10px rgba(44,24,16,0.05)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 20 }}>
            <SectionTitle title="AI Bias Analysis" sub="Claude interprets your model's fairness metrics in plain language" />
            <button onClick={runAI} disabled={aiLoading} style={{ flexShrink: 0, padding: "10px 24px", background: aiLoading ? C.cream : `linear-gradient(135deg, ${C.terracotta}, ${C.amber})`, color: aiLoading ? C.textMuted : "#fff", border: "none", borderRadius: 100, fontSize: 13, cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, boxShadow: aiLoading ? "none" : `0 4px 16px ${C.terracotta}38`, transition: "all 0.2s", letterSpacing: "0.02em" }}>
              {aiLoading ? "Analysing…" : "▶  Run AI Audit"}
            </button>
          </div>

          {aiLoading && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 0.15, 0.3].map((d, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: C.terracotta, animationDelay: `${d}s`, animation: "bop 1s infinite" }} />
                ))}
              </div>
              <span style={{ fontSize: 13, color: C.textMuted, fontStyle: "italic" }}>Claude is reviewing bias patterns…</span>
            </div>
          )}

          {aiText && !aiLoading && (
            <div style={{ borderLeft: `3px solid ${C.terracotta}45`, paddingLeft: 20 }}>
              {renderText(aiText)}
            </div>
          )}

          {!aiText && !aiLoading && (
            <div style={{ textAlign: "center", padding: "28px 0", color: C.textMuted, fontSize: 14 }}>
              Click <b style={{ color: C.terracotta }}>Run AI Audit</b> to get Claude's plain-language interpretation of the bias metrics above.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: "center", fontSize: 12, color: C.textMuted, fontFamily: "'DM Sans', sans-serif" }}>
          Bias Auditor · Powered by Claude · {active.length.toLocaleString()} records · race, gender & age analysis
        </div>
      </main>

      <style>{`
        @keyframes bop {
          0%, 100% { transform: translateY(0); opacity: 0.35; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
        * { box-sizing: border-box; }
        select { outline: none; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${C.cream}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
