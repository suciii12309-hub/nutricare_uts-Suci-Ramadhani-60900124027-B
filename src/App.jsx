import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "nutricare_data_v1";

const defaultData = {
  currentUser: null,
  users: [],
  patients: [],
  nutritionists: [],
  assessments: [],
  diagnoses: [],
  interventions: [],
  monitoringLogs: [],
  foodLogs: [],
  notifications: [],
  messages: [],
  testimonials: [],
  referrals: [],
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData, ...JSON.parse(raw) };
  } catch {}
  return { ...defaultData };
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

const BMI_CATEGORIES = [
  { max: 18.5, label: "Kurus", color: "#3B8BD4" },
  { max: 25, label: "Normal", color: "#1D9E75" },
  { max: 30, label: "Gemuk", color: "#EF9F27" },
  { max: Infinity, label: "Obesitas", color: "#D85A30" },
];

function calcBMI(w, h) {
  const hm = h / 100;
  return (w / (hm * hm)).toFixed(1);
}

function getBMICategory(bmi) {
  return BMI_CATEGORIES.find((c) => bmi < c.max) || BMI_CATEGORIES[3];
}

function calcIdealBW(h, gender) {
  const hcm = parseFloat(h);
  if (gender === "male") return ((hcm - 100) * 0.9).toFixed(1);
  return ((hcm - 100) * 0.85).toFixed(1);
}

function calcEnergyNeeds(w, h, age, gender, activity) {
  let bmr;
  if (gender === "male") bmr = 10 * w + 6.25 * h - 5 * age + 5;
  else bmr = 10 * w + 6.25 * h - 5 * age - 161;
  const factors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 };
  return Math.round(bmr * (factors[activity] || 1.2));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const COLORS = {
  primary: "#68827b",
  primaryLight: "#c9ded7",
  primaryDark: "rgb(23, 113, 74)",
  accent: "#EF9F27",
  accentLight: "#FAC775",
  bg: "#a2c1b3f2",
  card: "#FFFFFF",
  text: "#1a2e25",
  textMuted: "#5a7a6e",
  border: "#d0e8de",
  danger: "#D85A30",
  info: "#3B8BD4",
  purple: "#7F77DD",
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: ${COLORS.bg}; color: ${COLORS.text}; }
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
  
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 10px 20px; border-radius: 10px; border: none; cursor: pointer;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 600;
    transition: all 0.2s; text-decoration: none;
  }
  .btn-primary { background: ${COLORS.primary}; color: #fff; }
  .btn-primary:hover { background: ${COLORS.primaryDark}; transform: translateY(-1px); box-shadow: 0 4px 15px rgba(15,110,86,0.35); }
  .btn-secondary { background: ${COLORS.bg}; color: ${COLORS.primary}; border: 1.5px solid ${COLORS.border}; }
  .btn-secondary:hover { background: #e8f5ef; }
  .btn-accent { background: ${COLORS.accent}; color: #fff; }
  .btn-accent:hover { background: #d48f1a; }
  .btn-danger { background: #fff0ec; color: ${COLORS.danger}; border: 1.5px solid #f8c9b8; }
  .btn-danger:hover { background: #ffe0d5; }
  .btn-sm { padding: 6px 14px; font-size: 13px; }
  .btn-xs { padding: 4px 10px; font-size: 12px; border-radius: 6px; }
  
  .card {
    background: ${COLORS.card}; border-radius: 16px;
    border: 1px solid ${COLORS.border}; padding: 24px;
  }
  .card-sm { padding: 16px; border-radius: 12px; }
  
  input, select, textarea {
    width: 100%; padding: 10px 14px; border: 1.5px solid ${COLORS.border};
    border-radius: 10px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px;
    background: #fff; color: ${COLORS.text}; transition: border-color 0.2s;
    outline: none;
  }
  input:focus, select:focus, textarea:focus { border-color: ${COLORS.primaryLight}; box-shadow: 0 0 0 3px rgba(29,158,117,0.12); }
  
  label { font-size: 13px; font-weight: 600; color: ${COLORS.textMuted}; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  
  .form-group { margin-bottom: 18px; }
  
  .badge {
    display: inline-flex; align-items: center; padding: 3px 10px;
    border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .badge-success { background: #e1f5ee; color: #085041; }
  .badge-warning { background: #faeeda; color: #633806; }
  .badge-danger { background: #faece7; color: #711a00; }
  .badge-info { background: #e6f1fb; color: #042c53; }
  .badge-purple { background: #eeedfe; color: #26215c; }
  .badge-gray { background: #f1efe8; color: #2c2c2a; }
  
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
  
  @media (max-width: 768px) {
    .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    .hide-mobile { display: none !important; }
  }
  
  .stat-card {
    background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%);
    color: #fff; border-radius: 16px; padding: 20px;
  }
  .stat-card.amber { background: linear-gradient(135deg, #B47818 0%, ${COLORS.accent} 100%); }
  .stat-card.blue { background: linear-gradient(135deg, #185fa5 0%, ${COLORS.info} 100%); }
  .stat-card.purple { background: linear-gradient(135deg, #534AB7 0%, #7F77DD 100%); }
  
  .sidebar-item {
    display: flex; align-items: center; gap: 12px; padding: 12px 16px;
    border-radius: 12px; cursor: pointer; transition: all 0.2s;
    font-size: 14px; font-weight: 500; color: ${COLORS.textMuted};
    text-decoration: none; margin-bottom: 4px;
  }
  .sidebar-item:hover { background: #e8f5ef; color: ${COLORS.primary}; }
  .sidebar-item.active { background: #e8f5ef; color: ${COLORS.primary}; font-weight: 700; }
  .sidebar-item .icon { font-size: 18px; width: 22px; text-align: center; }
  
  .avatar {
    width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0;
  }
  
  .progress-bar { height: 8px; background: ${COLORS.border}; border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }
  
  .table-container { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { background: #f0f9f5; color: ${COLORS.textMuted}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 16px; text-align: left; border-bottom: 1px solid ${COLORS.border}; }
  td { padding: 12px 16px; border-bottom: 1px solid #f0f5f2; color: ${COLORS.text}; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8fdf9; }
  
  .tab-bar { display: flex; gap: 4px; background: #f0f9f5; border-radius: 12px; padding: 4px; margin-bottom: 24px; flex-wrap: wrap; }
  .tab { padding: 8px 16px; border-radius: 9px; cursor: pointer; font-size: 13px; font-weight: 600; color: ${COLORS.textMuted}; transition: all 0.2s; white-space: nowrap; }
  .tab.active { background: #fff; color: ${COLORS.primary}; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  
  .msg-bubble { padding: 10px 14px; border-radius: 14px; max-width: 80%; font-size: 14px; line-height: 1.5; }
  .msg-bubble.sent { background: ${COLORS.primary}; color: #fff; border-bottom-right-radius: 4px; }
  .msg-bubble.received { background: #f0f9f5; color: ${COLORS.text}; border-bottom-left-radius: 4px; border: 1px solid ${COLORS.border}; }
  
  .notif-item { display: flex; gap: 12px; padding: 14px; border-radius: 12px; background: #f8fdf9; border: 1px solid ${COLORS.border}; margin-bottom: 10px; }
  
  .cover-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  
  .animate-in { animation: slideIn 0.3s ease; }
  @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  
  .floating-leaf {
    position: absolute; opacity: 0.06; font-size: 60px;
    animation: float 8s ease-in-out infinite;
  }
  @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(15deg); } }
  
  .pulse-ring {
    position: absolute; border-radius: 50%;
    animation: pulse 2.5s ease-out infinite;
  }
  @keyframes pulse { 0% { transform: scale(0.8); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
`;

// ─── Cover Screen ─────────────────────────────────────────────────────────────
function CoverScreen({ onEnter }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="cover-overlay" style={{ background: "linear-gradient(135deg, #328d637a 0%, #3f9468a5 40%, #157e5485 70%, #17916a93 100%)" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {["🥦", "🥑", "🍎", "🥕", "🫐", "🍊", "🥗", "🌿"].map((e, i) => (
          <div key={i} className="floating-leaf" style={{ left: `${(i * 13) % 90}%`, top: `${(i * 17) % 80}%`, animationDelay: `${i * 0.8}s`, fontSize: `${50 + (i % 3) * 20}px` }}>{e}</div>
        ))}
        <div className="pulse-ring" style={{ width: 300, height: 300, border: "2px solid rgba(255,255,255,0.15)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div className="pulse-ring" style={{ width: 500, height: 500, border: "1px solid rgba(255,255,255,0.08)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", animationDelay: "0.8s" }} />
      </div>

      <div style={{ position: "relative", textAlign: "center", color: "#000000", padding: "0 20px", maxWidth: 480 }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px", fontSize: 42 }}>
        🥗

        </div>

        <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", opacity: 0.7, marginBottom: 12, fontWeight: 600 }}>Sistem Informasi</div>
        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 48, fontWeight: 600, lineHeight: 1.1, marginBottom: 8 }}>
          NutriCare
        </h1>
        <div style={{ fontFamily: "'Lora', serif", fontSize: 18, fontStyle: "italic", opacity: 0.8, marginBottom: 24 }}>
          Platform Asuhan Gizi Digital
        </div>

        <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.7, marginBottom: 36 }}>
          Solusi terintegrasi untuk ahli gizi dan pasien dalam manajemen asuhan gizi komprehensif berbasis digital
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          {["Assessment Gizi", "Intervensi", "Monitoring", "Chat Real-time"].map((f) => (
            <span key={f} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 600 }}>{f}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0.8, fontSize: 14 }}>
            <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Memuat aplikasi...
          </div>
        ) : (
          <button className="btn" onClick={onEnter} style={{ background: "#fff", color: COLORS.primaryDark, fontSize: 15, padding: "14px 36px", boxShadow: "0 8px 30px rgba(0,0,0,0.3)", borderRadius: 14 }}>
            Masuk ke Aplikasi →
          </button>
        )}

        <div style={{ marginTop: 32, fontSize: 12, opacity: 0.5 }}>
          Mendukung penyakit: Ginjal · Hipertensi · Asam Urat · DM · dan lainnya
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ data, setData }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("patient");
  const [form, setForm] = useState({ name: "", email: "", password: "", gender: "female", age: "", phone: "", specialization: "" });
  const [error, setError] = useState("");

  function handleLogin() {
    const user = data.users.find((u) => u.email === form.email && u.password === form.password);
    if (!user) return setError("Email atau password salah.");
    setData((d) => { const nd = { ...d, currentUser: user }; saveData(nd); return nd; });
  }

  function handleRegister() {
    if (!form.name || !form.email || !form.password) return setError("Semua field wajib diisi.");
    if (data.users.find((u) => u.email === form.email)) return setError("Email sudah terdaftar.");
    const newUser = { id: uid(), ...form, role, createdAt: new Date().toISOString() };
    setData((d) => {
      const nd = { ...d, users: [...d.users, newUser], currentUser: newUser };
      if (role === "patient") nd.patients = [...d.patients, { ...newUser, diagnoses: [], conditions: [] }];
      if (role === "nutritionist") nd.nutritionists = [...d.nutritionists, newUser];
      saveData(nd); return nd;
    });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 100%)`, padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32, color: "#fff" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}></div>
          <h2 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600 }}>NutriCare</h2>
          <p style={{ opacity: 0.7, fontSize: 14, marginTop: 4 }}>Platform Asuhan Gizi Digital</p>
        </div>

        <div className="card" style={{ borderRadius: 20 }}>
          <div style={{ display: "flex", gap: 4, background: "#16583b4a", borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {["login", "register"].map((m) => (
              <div key={m} className={`tab ${mode === m ? "active" : ""}`} style={{ flex: 1, textAlign: "center" }} onClick={() => { setMode(m); setError(""); }}>
                {m === "login" ? "Masuk" : "Daftar"}
              </div>
            ))}
          </div>

          {mode === "register" && (
            <div className="form-group">
              <label>Saya adalah</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["patient", "nutritionist"].map((r) => (
                  <div key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: `2px solid ${role === r ? COLORS.primary : COLORS.border}`, cursor: "pointer", textAlign: "center", fontSize: 13, fontWeight: 600, background: role === r ? "#e8f5ef" : "#fff", color: role === r ? COLORS.primaryDark : COLORS.textMuted, transition: "all 0.2s" }}>
                    {r === "patient" ? "👤 Pasien" : "🩺 Ahli Gizi"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === "register" && (
            <div className="grid-2">
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input placeholder="Nama Anda" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>No. HP</label>
                <input placeholder="08xx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
          )}

          {mode === "register" && role === "patient" && (
            <div className="grid-2">
              <div className="form-group">
                <label>Jenis Kelamin</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="female">Perempuan</option>
                  <option value="male">Laki-laki</option>
                </select>
              </div>
              <div className="form-group">
                <label>Usia</label>
                <input type="number" placeholder="Tahun" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
            </div>
          )}

          {mode === "register" && role === "nutritionist" && (
            <div className="form-group">
              <label>Spesialisasi</label>
              <input placeholder="Gizi Klinik, Gizi Anak, dll." value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="email@anda.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {error && <div style={{ background: "#faece7", color: COLORS.danger, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16, fontWeight: 600 }}>⚠️ {error}</div>}

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: 15, borderRadius: 12 }} onClick={mode === "login" ? handleLogin : handleRegister}>
            {mode === "login" ? "Masuk Sekarang" : "Daftar Sekarang"}
          </button>

          {mode === "login" && (
            <div style={{ marginTop: 16, padding: "12px 14px", background: "#f0f9f5", borderRadius: 10, fontSize: 12, color: COLORS.textMuted }}>
              <strong style={{ color: COLORS.primary }}>Demo:</strong> Daftar akun baru untuk mulai menggunakan aplikasi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, onLogout, unreadCount }) {
  const isAG = user?.role === "nutritionist";
  const isAdmin = user?.role === "admin";

  const patientMenu = [
    { id: "dashboard", icon: "🏠", label: "Beranda" },
    { id: "profile", icon: "👤", label: "Profil & Data" },
    { id: "assessment", icon: "📋", label: "Assessment Gizi" },
    { id: "foodlog", icon: "🍽️", label: "Catatan Makan" },
    { id: "monitoring", icon: "📈", label: "Monitoring" },
    { id: "notifications", icon: "🔔", label: "Notifikasi", badge: unreadCount },
    { id: "chat", icon: "💬", label: "Chat" },
  ];

  const agMenu = [
    { id: "dashboard", icon: "🏠", label: "Beranda" },
    { id: "patients", icon: "👥", label: "Data Pasien" },
    { id: "assessment", icon: "📋", label: "Assessment" },
    { id: "diagnosis", icon: "🩺", label: "Diagnosis Gizi" },
    { id: "intervention", icon: "💊", label: "Intervensi Gizi" },
    { id: "monitoring", icon: "📈", label: "Monitoring" },
    { id: "reports", icon: "📊", label: "Laporan & Log" },
    { id: "referral", icon: "🔄", label: "Rujukan Pasien" },
    { id: "chat", icon: "💬", label: "Chat" },
    { id: "analytics", icon: "📉", label: "Analisis Pengguna" },
    { id: "standalone", icon: "🧮", label: "Kalkulator Gizi" },
  ];

  const menu = isAG || isAdmin ? agMenu : patientMenu;

  return (
    <div style={{ width: 240, background: "#fff", borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "100vh", position: "sticky", top: 0, flexShrink: 0 }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 28 }}></div>
          <div>
            <div style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 18, color: COLORS.primaryDark }}>NutriCare</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {isAG ? "Panel Ahli Gizi" : "Portal Pasien"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {menu.map((item) => (
          <div key={item.id} className={`sidebar-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
            <span className="icon">{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge > 0 && <span style={{ background: COLORS.danger, color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "2px 6px" }}>{item.badge}</span>}
          </div>
        ))}

        <div style={{ margin: "8px 0", borderTop: `1px solid ${COLORS.border}` }} />
        <div className="sidebar-item" onClick={() => setPage("testimonials")}>
          <span className="icon">⭐</span>
          <span>Testimoni</span>
        </div>
      </div>

      <div style={{ padding: "12px 10px", borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", align: "center", gap: 10, padding: "10px 12px", background: "#f0f9f5", borderRadius: 12, marginBottom: 8 }}>
          <div className="avatar" style={{ background: isAG ? "#e6f1fb" : "#e1f5ee", color: isAG ? "#042c53" : "#04342c" }}>
            {(user?.name || "U").slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>{isAG ? "Ahli Gizi" : "Pasien"}</div>
          </div>
        </div>
        <div className="sidebar-item" onClick={onLogout} style={{ color: COLORS.danger }}>
          <span className="icon">🚪</span>
          <span>Keluar</span>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Pages ──────────────────────────────────────────────────────────
function PatientDashboard({ data, user }) {
  const myAssessments = data.assessments.filter((a) => a.patientId === user.id);
  const lastAssessment = myAssessments[myAssessments.length - 1];
  const myLogs = data.foodLogs.filter((f) => f.userId === user.id);
  const myNotifs = data.notifications.filter((n) => n.userId === user.id && !n.read);

  const bmi = lastAssessment ? calcBMI(lastAssessment.weight, lastAssessment.height) : null;
  const bmiCat = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 26, color: COLORS.primaryDark }}>Selamat datang, {user.name?.split(" ")[0]}! 👋</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{bmi || "-"}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Indeks Massa Tubuh</div>
          {bmiCat && <span style={{ marginTop: 6, display: "inline-block", background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{bmiCat.label}</span>}
        </div>
        <div className="stat-card amber">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{myLogs.length}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Catatan Makan</div>
        </div>
        <div className="stat-card blue">
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{myAssessments.length}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Assessment</div>
        </div>
        <div className="stat-card purple">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{myNotifs.length}</div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Notifikasi Baru</div>
        </div>
      </div>

      {lastAssessment && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>📊 Status Gizi Terakhir</h3>
          <div className="grid-3">
            <div style={{ textAlign: "center", padding: 16, background: "#f0f9f5", borderRadius: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: bmiCat?.color }}>{bmi}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>BMI</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: bmiCat?.color, marginTop: 2 }}>{bmiCat?.label}</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, background: "#f0f9f5", borderRadius: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.primary }}>{lastAssessment.weight}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>Berat Badan (kg)</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, marginTop: 2 }}>BB Ideal: {calcIdealBW(lastAssessment.height, user.gender)} kg</div>
            </div>
            <div style={{ textAlign: "center", padding: 16, background: "#f0f9f5", borderRadius: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.info }}>{lastAssessment.height}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>Tinggi Badan (cm)</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textMuted, marginTop: 2 }}>{fmtDate(lastAssessment.date)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: COLORS.primaryDark }}>🔔 Pengingat Hari Ini</h3>
          {[
            { time: "07:00", label: "Sarapan pagi", icon: "🌅" },
            { time: "10:00", label: "Catat asupan makan", icon: "📝" },
            { time: "12:00", label: "Makan siang", icon: "☀️" },
            { time: "19:00", label: "Makan malam", icon: "🌙" },
          ].map((r) => (
            <div key={r.time} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 20 }}>{r.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.label}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{r.time}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: COLORS.primaryDark }}>💡 Tips Gizi Sehat</h3>
          {[
            "Minum air minimal 8 gelas per hari",
            "Konsumsi sayuran 5 porsi sehari",
            "Batasi gula tambahan < 50g/hari",
            "Makan dengan piring T setiap makan",
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 3 ? `1px solid ${COLORS.border}` : "none" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e1f5ee", color: COLORS.primaryDark, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AGDashboard({ data, user }) {
  const myPatients = data.patients.filter((p) => p.assignedAG === user.id || !p.assignedAG);
  const totalAssessments = data.assessments.length;
  const todayLogs = data.foodLogs.filter((f) => new Date(f.date).toDateString() === new Date().toDateString());

  const bmiStats = { kurus: 0, normal: 0, gemuk: 0, obesitas: 0 };
  data.assessments.forEach((a) => {
    const bmi = parseFloat(calcBMI(a.weight, a.height));
    if (bmi < 18.5) bmiStats.kurus++;
    else if (bmi < 25) bmiStats.normal++;
    else if (bmi < 30) bmiStats.gemuk++;
    else bmiStats.obesitas++;
  });

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 26, color: COLORS.primaryDark }}>Selamat datang, {user.name?.split(" ")[0]}! 🩺</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{myPatients.length}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Total Pasien</div>
        </div>
        <div className="stat-card amber">
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{totalAssessments}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Assessment</div>
        </div>
        <div className="stat-card blue">
          <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{todayLogs.length}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Log Makan Hari Ini</div>
        </div>
        <div className="stat-card purple">
          <div style={{ fontSize: 28, marginBottom: 8 }}>👨‍⚕️</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{data.nutritionists.length}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Ahli Gizi</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ marginBottom: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>📊 Distribusi Status Gizi Pasien</h3>
          {Object.entries({ kurus: { label: "Kurus", color: COLORS.info }, normal: { label: "Normal", color: COLORS.primaryLight }, gemuk: { label: "Gemuk", color: COLORS.accent }, obesitas: { label: "Obesitas", color: COLORS.danger } }).map(([key, cfg]) => {
            const total = Object.values(bmiStats).reduce((a, b) => a + b, 0) || 1;
            const pct = Math.round((bmiStats[key] / total) * 100);
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{cfg.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{bmiStats[key]} ({pct}%)</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: COLORS.primaryDark }}>📅 Aktivitas Terkini</h3>
          {data.assessments.slice(-5).reverse().map((a) => {
            const pat = data.patients.find((p) => p.id === a.patientId);
            return (
              <div key={a.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, alignItems: "center" }}>
                <div className="avatar" style={{ width: 32, height: 32, background: "#e1f5ee", color: COLORS.primaryDark, fontSize: 11 }}>
                  {(pat?.name || "P").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Assessment - {pat?.name || "Pasien"}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{fmtDate(a.date)}</div>
                </div>
              </div>
            );
          })}
          {data.assessments.length === 0 && <div style={{ color: COLORS.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>Belum ada aktivitas</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Assessment Module ────────────────────────────────────────────────────────
function AssessmentModule({ data, setData, user }) {
  const isAG = user?.role === "nutritionist";
  const [tab, setTab] = useState("anthropometry");
  const [selectedPatient, setSelectedPatient] = useState(isAG ? "" : user.id);
  const [form, setForm] = useState({ weight: "", height: "", age: "", gender: user?.gender || "female", muac: "", lila: "", recall: "", foodFreq: "", foodHabits: "", allergies: "", favorites: "", hb: "", albumin: "", glucose: "", ureum: "", creatinine: "", bp: "", medDiagnosis: "", labNotes: "", diseaseHistory: "", familyHistory: "" });
  const [saved, setSaved] = useState(false);

  const bmi = form.weight && form.height ? calcBMI(parseFloat(form.weight), parseFloat(form.height)) : null;
  const bmiCat = bmi ? getBMICategory(parseFloat(bmi)) : null;
  const idealBW = form.height && form.gender ? calcIdealBW(form.height, form.gender) : null;

  function handleSave() {
    const patId = isAG ? selectedPatient : user.id;
    if (!patId) return;
    const a = { id: uid(), patientId: patId, agId: isAG ? user.id : null, ...form, bmi, date: new Date().toISOString() };
    setData((d) => { const nd = { ...d, assessments: [...d.assessments, a] }; saveData(nd); return nd; });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs = [
    { id: "anthropometry", label: "🏋️ Antropometri" },
    { id: "biochemistry", label: "🧪 Biokimia" },
    { id: "clinical", label: "🩺 Fisik Klinis" },
    { id: "dietary", label: "🍽️ Asupan Makan" },
    { id: "history", label: "📜 Riwayat Penyakit" },
  ];

  const myAssessments = data.assessments.filter((a) => isAG ? true : a.patientId === user.id);

  return (
    <div className="animate-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>📋 Assessment Gizi</h2>
          <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Analisis data pasien secara komprehensif</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={!selectedPatient}>
          {saved ? "✅ Tersimpan!" : "💾 Simpan Assessment"}
        </button>
      </div>

      {isAG && (
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>Pilih Pasien</label>
          <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
            <option value="">-- Pilih Pasien --</option>
            {data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      <div className="tab-bar">
        {tabs.map((t) => <div key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</div>)}
      </div>

      {tab === "anthropometry" && (
        <div className="grid-2">
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>Data Antropometri</h3>
            <div className="grid-2">
              <div className="form-group">
                <label>Berat Badan (kg)</label>
                <input type="number" placeholder="65" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tinggi Badan (cm)</label>
                <input type="number" placeholder="165" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Usia (tahun)</label>
                <input type="number" placeholder="30" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Jenis Kelamin</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="female">Perempuan</option>
                  <option value="male">Laki-laki</option>
                </select>
              </div>
              <div className="form-group">
                <label>LILA (cm)</label>
                <input type="number" placeholder="25" value={form.lila} onChange={(e) => setForm({ ...form, lila: e.target.value })} />
              </div>
              <div className="form-group">
                <label>MUAC (cm)</label>
                <input type="number" placeholder="23" value={form.muac} onChange={(e) => setForm({ ...form, muac: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>🔍 Hasil Analisis Otomatis</h3>
            {bmi ? (
              <>
                <div style={{ textAlign: "center", padding: "24px 16px", background: "#f0f9f5", borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 52, fontWeight: 800, color: bmiCat?.color }}>{bmi}</div>
                  <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 4 }}>Indeks Massa Tubuh</div>
                  <div style={{ marginTop: 8 }}>
                    <span className="badge" style={{ background: bmiCat?.color + "22", color: bmiCat?.color, fontSize: 13, padding: "5px 16px" }}>{bmiCat?.label}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "BB Ideal", value: `${idealBW} kg`, icon: "⚖️" },
                    { label: "BB Estimasi", value: form.weight ? `${form.weight} kg` : "-", icon: "📏" },
                    { label: "Selisih dari Ideal", value: form.weight && idealBW ? `${(parseFloat(form.weight) - parseFloat(idealBW)).toFixed(1)} kg` : "-", icon: "📊" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fdf9", borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
                      <span style={{ fontSize: 13, color: COLORS.textMuted }}>{item.icon} {item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.primaryDark }}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8, fontWeight: 700 }}>Rentang IMT</div>
                  <div className="progress-bar" style={{ height: 12, position: "relative" }}>
                    {BMI_CATEGORIES.map((cat, i) => (
                      <div key={i} style={{ position: "absolute", left: `${[0, 30, 60, 80][i]}%`, width: `${[30, 30, 20, 20][i]}%`, height: "100%", background: cat.color, opacity: 0.3 }} />
                    ))}
                    <div style={{ position: "absolute", left: `${Math.min(Math.max((parseFloat(bmi) - 10) / 30 * 100, 0), 98)}%`, top: -2, width: 4, height: "calc(100% + 4px)", background: bmiCat?.color, borderRadius: 2 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    {["Kurus", "Normal", "Gemuk", "Obesitas"].map((l) => <span key={l} style={{ fontSize: 10, color: COLORS.textMuted }}>{l}</span>)}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <div>Masukkan data BB dan TB untuk melihat analisis otomatis</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "biochemistry" && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>🧪 Data Biokimia & Lab</h3>
          <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>Data diisi oleh Ahli Gizi berdasarkan hasil pemeriksaan laboratorium</p>
          <div className="grid-3">
            {[
              { key: "hb", label: "Hemoglobin (g/dL)", placeholder: "13.5", normal: "11.5-16.5" },
              { key: "albumin", label: "Albumin (g/dL)", placeholder: "4.0", normal: "3.5-5.0" },
              { key: "glucose", label: "Glukosa Darah (mg/dL)", placeholder: "100", normal: "<126 (puasa)" },
              { key: "ureum", label: "Ureum (mg/dL)", placeholder: "25", normal: "7-25" },
              { key: "creatinine", label: "Kreatinin (mg/dL)", placeholder: "1.0", normal: "0.6-1.2" },
            ].map((f) => (
              <div key={f.key} className="form-group">
                <label>{f.label}</label>
                <input type="number" step="0.1" placeholder={f.placeholder} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>Normal: {f.normal}</div>
                {form[f.key] && (
                  <div style={{ marginTop: 6 }}>
                    <span className="badge badge-success">✓ Data tercatat</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="form-group">
            <label>Catatan Hasil Lab Bermasalah</label>
            <textarea rows={3} placeholder="Catatan analisis data lab yang perlu diperhatikan..." value={form.labNotes} onChange={(e) => setForm({ ...form, labNotes: e.target.value })} />
          </div>
        </div>
      )}

      {tab === "clinical" && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>🩺 Data Fisik Klinis</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Tekanan Darah (mmHg)</label>
              <input placeholder="120/80" value={form.bp} onChange={(e) => setForm({ ...form, bp: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Diagnosis Medis</label>
              <input placeholder="Hipertensi, CKD, DM Tipe 2..." value={form.medDiagnosis} onChange={(e) => setForm({ ...form, medDiagnosis: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Pemeriksaan Penunjang Lainnya</label>
            <textarea rows={4} placeholder="Hasil EKG, USG, Rontgen, dll..." value={form.clinicalNotes} onChange={(e) => setForm({ ...form, clinicalNotes: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Penyakit yang Ditangani</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              {["Ginjal (CKD)", "Hipertensi", "Asam Urat", "Diabetes Melitus", "Jantung", "Stroke", "Kanker"].map((d) => (
                <label key={d} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", border: `1.5px solid ${COLORS.border}`, borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 600, background: (form.conditions || []).includes(d) ? "#e1f5ee" : "#fff", color: (form.conditions || []).includes(d) ? COLORS.primaryDark : COLORS.textMuted, transition: "all 0.2s" }}>
                  <input type="checkbox" checked={(form.conditions || []).includes(d)} onChange={(e) => { const c = form.conditions || []; setForm({ ...form, conditions: e.target.checked ? [...c, d] : c.filter((x) => x !== d) }); }} style={{ width: "auto", margin: 0 }} />
                  {d}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "dietary" && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>🍽️ Data Kebiasaan & Asupan Makan</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Makanan Favorit</label>
              <input placeholder="Nasi, ayam goreng, sayur bayam..." value={form.favorites} onChange={(e) => setForm({ ...form, favorites: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Alergi / Pantangan</label>
              <input placeholder="Seafood, susu, kacang..." value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Kebiasaan Makan</label>
            <textarea rows={3} placeholder="Frekuensi makan, waktu makan, kebiasaan khusus..." value={form.foodHabits} onChange={(e) => setForm({ ...form, foodHabits: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Recall 24 Jam (Makanan yang dikonsumsi kemarin)</label>
            <textarea rows={5} placeholder="Pagi: Nasi + telur goreng + teh manis&#10;Siang: Nasi + ayam + sayur bayam&#10;Malam: Nasi + ikan + tempe..." value={form.recall} onChange={(e) => setForm({ ...form, recall: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Frekuensi Makan per Hari</label>
            <select value={form.foodFreq} onChange={(e) => setForm({ ...form, foodFreq: e.target.value })}>
              <option value="">Pilih frekuensi</option>
              {["1x sehari", "2x sehari", "3x sehari", "4x sehari", ">4x sehari (termasuk snack)"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>📜 Riwayat Penyakit</h3>
          <div className="form-group">
            <label>Riwayat Penyakit Dahulu</label>
            <textarea rows={4} placeholder="Penyakit yang pernah diderita sebelumnya, operasi, rawat inap..." value={form.diseaseHistory} onChange={(e) => setForm({ ...form, diseaseHistory: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Riwayat Penyakit Keluarga</label>
            <textarea rows={3} placeholder="Penyakit yang dimiliki orang tua, saudara kandung..." value={form.familyHistory} onChange={(e) => setForm({ ...form, familyHistory: e.target.value })} />
          </div>
        </div>
      )}

      {myAssessments.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>📁 Riwayat Assessment</h3>
          <div className="table-container">
            <table>
              <thead><tr><th>Tanggal</th><th>BB (kg)</th><th>TB (cm)</th><th>BMI</th><th>Status</th></tr></thead>
              <tbody>
                {myAssessments.slice().reverse().map((a) => {
                  const b = calcBMI(a.weight, a.height);
                  const cat = getBMICategory(parseFloat(b));
                  return (
                    <tr key={a.id}>
                      <td>{fmtDate(a.date)}</td>
                      <td>{a.weight}</td>
                      <td>{a.height}</td>
                      <td style={{ fontWeight: 700, color: cat?.color }}>{b}</td>
                      <td><span className="badge" style={{ background: cat?.color + "22", color: cat?.color }}>{cat?.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Food Log ─────────────────────────────────────────────────────────────────
function FoodLogModule({ data, setData, user }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], mealType: "sarapan", foods: "", calories: "", notes: "" });
  const [saved, setSaved] = useState(false);
  const myLogs = data.foodLogs.filter((f) => f.userId === user.id).sort((a, b) => new Date(b.date) - new Date(a.date));

  function handleSave() {
    if (!form.foods) return;
    const log = { id: uid(), userId: user.id, ...form, createdAt: new Date().toISOString() };
    setData((d) => { const nd = { ...d, foodLogs: [...d.foodLogs, log] }; saveData(nd); return nd; });
    setForm({ date: new Date().toISOString().split("T")[0], mealType: "sarapan", foods: "", calories: "", notes: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete(id) {
    setData((d) => { const nd = { ...d, foodLogs: d.foodLogs.filter((f) => f.id !== id) }; saveData(nd); return nd; });
  }

  const mealIcons = { sarapan: "🌅", makan_siang: "☀️", makan_malam: "🌙", snack: "🍎" };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>🍽️ Laporan Makan Harian</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Catat semua makanan yang Anda konsumsi setiap hari</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>➕ Tambah Catatan Makan</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Tanggal</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Waktu Makan</label>
              <select value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value })}>
                <option value="sarapan">🌅 Sarapan</option>
                <option value="makan_siang">☀️ Makan Siang</option>
                <option value="makan_malam">🌙 Makan Malam</option>
                <option value="snack">🍎 Snack</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Makanan yang Dikonsumsi</label>
            <textarea rows={3} placeholder="Contoh: Nasi putih 1 centong, ayam goreng 1 potong, sayur bayam 1 mangkok..." value={form.foods} onChange={(e) => setForm({ ...form, foods: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Estimasi Kalori (opsional)</label>
            <input type="number" placeholder="kcal" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Catatan Tambahan</label>
            <input placeholder="Porsi, kondisi, dll..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleSave}>
            {saved ? "✅ Tersimpan!" : "💾 Simpan Catatan Makan"}
          </button>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>📊 Ringkasan Hari Ini</h3>
          {(() => {
            const today = new Date().toISOString().split("T")[0];
            const todayLogs = myLogs.filter((l) => l.date === today);
            const totalCal = todayLogs.reduce((s, l) => s + (parseFloat(l.calories) || 0), 0);
            const targetCal = 2000;
            const pct = Math.min((totalCal / targetCal) * 100, 100);
            return (
              <>
                <div style={{ textAlign: "center", padding: 20, background: "#f0f9f5", borderRadius: 12, marginBottom: 16 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: COLORS.primary }}>{totalCal.toFixed(0)}</div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted }}>kcal dikonsumsi hari ini</div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>Target: {targetCal} kcal</div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>
                    <span>Konsumsi Kalori</span><span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 12 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: pct > 90 ? COLORS.danger : COLORS.primaryLight }} />
                  </div>
                </div>
                {["sarapan", "makan_siang", "makan_malam", "snack"].map((meal) => {
                  const mLog = todayLogs.find((l) => l.mealType === meal);
                  return (
                    <div key={meal} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, alignItems: "center" }}>
                      <span style={{ fontSize: 20 }}>{mealIcons[meal]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{meal.replace("_", " ")}</div>
                        {mLog ? <div style={{ fontSize: 12, color: COLORS.textMuted }}>{mLog.foods.slice(0, 40)}...</div> : <div style={{ fontSize: 12, color: COLORS.textMuted }}>Belum dicatat</div>}
                      </div>
                      {mLog ? <span className="badge badge-success">✓</span> : <span className="badge badge-gray">-</span>}
                    </div>
                  );
                })}
              </>
            );
          })()}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: COLORS.primaryDark }}>📅 Riwayat Catatan Makan</h3>
        {myLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <div>Belum ada catatan makan. Mulai catat sekarang!</div>
          </div>
        ) : (
          <div>
            {myLogs.slice(0, 10).map((log) => (
              <div key={log.id} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: `1px solid ${COLORS.border}`, alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0f9f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {mealIcons[log.mealType]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, textTransform: "capitalize" }}>{log.mealType.replace("_", " ")} — {fmtDate(log.date)}</div>
                      <div style={{ fontSize: 13, color: COLORS.text, marginTop: 4, lineHeight: 1.5 }}>{log.foods}</div>
                      {log.notes && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>📝 {log.notes}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 12 }}>
                      {log.calories && <span className="badge badge-warning">🔥 {log.calories} kcal</span>}
                      <button className="btn btn-danger btn-xs" onClick={() => handleDelete(log.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Diagnosis Module ─────────────────────────────────────────────────────────
function DiagnosisModule({ data, setData, user }) {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [form, setForm] = useState({ problem: "", etiology: "", signs: "", date: new Date().toISOString().split("T")[0] });
  const [saved, setSaved] = useState(false);

  const PROBLEMS = ["Asupan energi tidak adekuat", "Asupan protein tidak adekuat", "Asupan lemak berlebih", "Asupan natrium berlebih", "Kelebihan berat badan", "Underweight/malnutrisi", "Gangguan fungsi menelan", "Gangguan saluran cerna", "Asupan serat tidak adekuat", "Defisiensi vitamin/mineral"];
  const ETIOLOGIES = ["Kurang nafsu makan", "Penyakit penyerta", "Kurang pengetahuan gizi", "Kebiasaan makan buruk", "Keterbatasan ekonomi", "Efek samping obat", "Kondisi psikologis"];

  function handleSave() {
    if (!selectedPatient || !form.problem) return;
    const d = { id: uid(), patientId: selectedPatient, agId: user.id, ...form, createdAt: new Date().toISOString() };
    setData((prev) => { const nd = { ...prev, diagnoses: [...prev.diagnoses, d] }; saveData(nd); return nd; });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>🩺 Diagnosis Masalah Gizi</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Kumpulan masalah dari hasil assessment (NCP - Nutrition Care Process)</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Buat Diagnosis Gizi Baru</h3>
        <div className="form-group">
          <label>Pilih Pasien</label>
          <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
            <option value="">-- Pilih Pasien --</option>
            {data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Masalah (Problem)</label>
          <select value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })}>
            <option value="">-- Pilih Masalah --</option>
            {PROBLEMS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Penyebab (Etiology)</label>
          <select value={form.etiology} onChange={(e) => setForm({ ...form, etiology: e.target.value })}>
            <option value="">-- Pilih Penyebab --</option>
            {ETIOLOGIES.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Tanda & Gejala (Signs/Symptoms)</label>
          <textarea rows={3} placeholder="Data objektif dan subjektif yang mendukung diagnosis..." value={form.signs} onChange={(e) => setForm({ ...form, signs: e.target.value })} />
        </div>
        <button className="btn btn-primary" onClick={handleSave}>{saved ? "✅ Tersimpan!" : "💾 Simpan Diagnosis"}</button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Daftar Diagnosis</h3>
        {data.diagnoses.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>Belum ada diagnosis</div>
        ) : (
          data.diagnoses.map((d) => {
            const pat = data.patients.find((p) => p.id === d.patientId);
            return (
              <div key={d.id} style={{ padding: "14px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontWeight: 700 }}>{pat?.name}</div>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{fmtDate(d.date)}</span>
                </div>
                <div style={{ fontSize: 14, marginBottom: 4 }}><strong style={{ color: COLORS.danger }}>P:</strong> {d.problem}</div>
                {d.etiology && <div style={{ fontSize: 14, marginBottom: 4 }}><strong style={{ color: COLORS.accent }}>E:</strong> {d.etiology}</div>}
                {d.signs && <div style={{ fontSize: 13, color: COLORS.textMuted }}><strong>S:</strong> {d.signs}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Intervention Module ──────────────────────────────────────────────────────
function InterventionModule({ data, setData, user }) {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [form, setForm] = useState({ activity: "sedentary", mealPlan: "", allowedFoods: "", prohibitedFoods: "", supplements: "", notes: "" });
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState(null);

  function calcNeeds() {
    const pat = data.patients.find((p) => p.id === selectedPatient);
    const lastA = data.assessments.filter((a) => a.patientId === selectedPatient).slice(-1)[0];
    if (!lastA || !pat) return;
    const w = parseFloat(lastA.weight), h = parseFloat(lastA.height), age = parseFloat(lastA.age || pat.age || 30);
    const gender = lastA.gender || pat.gender || "female";
    const energy = calcEnergyNeeds(w, h, age, gender, form.activity);
    const protein = Math.round(w * 1.2);
    const fat = Math.round((energy * 0.25) / 9);
    const carbs = Math.round((energy * 0.55) / 4);
    const sodium = lastA.conditions?.includes("Hipertensi") ? 1500 : 2000;
    const potassium = lastA.conditions?.includes("Ginjal (CKD)") ? 2000 : 4700;
    setResult({ energy, protein, fat, carbs, sodium, potassium, fluid: Math.round(w * 35) });
  }

  function handleSave() {
    if (!selectedPatient) return;
    const intv = { id: uid(), patientId: selectedPatient, agId: user.id, ...form, result, createdAt: new Date().toISOString() };
    setData((d) => { const nd = { ...d, interventions: [...d.interventions, intv] }; saveData(nd); return nd; });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>💊 Intervensi Gizi</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Kalkulasi kebutuhan gizi otomatis dan rencana intervensi</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🧮 Kalkulator Kebutuhan Gizi</h3>
        <div className="grid-2">
          <div className="form-group">
            <label>Pilih Pasien</label>
            <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
              <option value="">-- Pilih Pasien --</option>
              {data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Tingkat Aktivitas</label>
            <select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}>
              <option value="sedentary">Sedentary (tidak aktif)</option>
              <option value="light">Ringan (olahraga 1-3x/minggu)</option>
              <option value="moderate">Sedang (olahraga 3-5x/minggu)</option>
              <option value="active">Aktif (olahraga 6-7x/minggu)</option>
              <option value="veryActive">Sangat Aktif</option>
            </select>
          </div>
        </div>
        <button className="btn btn-accent" onClick={calcNeeds}>⚡ Hitung Kebutuhan Otomatis</button>

        {result && (
          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: COLORS.primaryDark }}>✅ Hasil Kalkulasi Kebutuhan Gizi Harian</h4>
            <div className="grid-4">
              {[
                { label: "Energi", value: `${result.energy} kkal`, icon: "⚡", color: COLORS.accent },
                { label: "Protein", value: `${result.protein} g`, icon: "🥩", color: COLORS.primary },
                { label: "Lemak", value: `${result.fat} g`, icon: "🫒", color: COLORS.info },
                { label: "Karbohidrat", value: `${result.carbs} g`, icon: "🍚", color: COLORS.purple },
                { label: "Natrium", value: `${result.sodium} mg`, icon: "🧂", color: COLORS.danger },
                { label: "Kalium", value: `${result.potassium} mg`, icon: "🍌", color: "#1D9E75" },
                { label: "Cairan", value: `${result.fluid} ml`, icon: "💧", color: COLORS.info },
              ].map((item) => (
                <div key={item.label} style={{ padding: "14px", background: item.color + "15", borderRadius: 12, border: `1.5px solid ${item.color}30`, textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Rencana Intervensi</h3>
        <div className="form-group">
          <label>Pembagian Makan Sehari</label>
          <textarea rows={4} placeholder="Sarapan: 25% kebutuhan&#10;Snack Pagi: 10%&#10;Makan Siang: 30%&#10;Snack Sore: 10%&#10;Makan Malam: 25%" value={form.mealPlan} onChange={(e) => setForm({ ...form, mealPlan: e.target.value })} />
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>✅ Makanan yang Dianjurkan</label>
            <textarea rows={4} placeholder="Sayuran hijau, buah rendah gula, protein hewani tanpa lemak..." value={form.allowedFoods} onChange={(e) => setForm({ ...form, allowedFoods: e.target.value })} />
          </div>
          <div className="form-group">
            <label>❌ Makanan yang Dibatasi/Dihindari</label>
            <textarea rows={4} placeholder="Garam berlebih, jeroan, makanan bersantan, minuman manis..." value={form.prohibitedFoods} onChange={(e) => setForm({ ...form, prohibitedFoods: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label>Suplemen / Vitamin yang Direkomendasikan</label>
          <input placeholder="Vit D 1000 IU, Zat Besi 50mg, dll." value={form.supplements} onChange={(e) => setForm({ ...form, supplements: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Catatan & Rekomendasi Tambahan</label>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button className="btn btn-primary" onClick={handleSave}>{saved ? "✅ Tersimpan!" : "💾 Simpan Intervensi"}</button>
      </div>

      {data.interventions.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📁 Riwayat Intervensi</h3>
          {data.interventions.slice().reverse().map((intv) => {
            const pat = data.patients.find((p) => p.id === intv.patientId);
            return (
              <div key={intv.id} style={{ padding: "12px 14px", background: "#f8fdf9", borderRadius: 10, marginBottom: 10, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{pat?.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted }}>{fmtDate(intv.createdAt)}</div>
                {intv.result && <div style={{ fontSize: 13, marginTop: 6, color: COLORS.primary }}>⚡ {intv.result.energy} kkal/hari · 🥩 {intv.result.protein}g protein</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Monitoring Module ────────────────────────────────────────────────────────
function MonitoringModule({ data, setData, user }) {
  const isAG = user?.role === "nutritionist";
  const [selectedPatient, setSelectedPatient] = useState(isAG ? "" : user.id);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const patId = isAG ? selectedPatient : user.id;
  const assessments = data.assessments.filter((a) => a.patientId === patId).sort((a, b) => new Date(a.date) - new Date(b.date));
  const foodLogs = data.foodLogs.filter((f) => f.userId === patId);
  const myNotes = data.monitoringLogs.filter((m) => m.patientId === patId);

  function addNote() {
    if (!note || !patId) return;
    const log = { id: uid(), patientId: patId, agId: user.id, note, date: new Date().toISOString() };
    setData((d) => { const nd = { ...d, monitoringLogs: [...d.monitoringLogs, log] }; saveData(nd); return nd; });
    setNote("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>📈 Monitoring & Evaluasi</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Pantau perkembangan berat badan, lab, dan kepatuhan makan</p>
      </div>

      {isAG && (
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label>Pilih Pasien</label>
          <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)}>
            <option value="">-- Pilih Pasien --</option>
            {data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {patId && (
        <>
          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div className="card card-sm" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.primary }}>{assessments.length}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>Assessment Tercatat</div>
            </div>
            <div className="card card-sm" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.accent }}>{foodLogs.length}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>Catatan Makan</div>
            </div>
            <div className="card card-sm" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.info }}>{myNotes.length}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>Catatan AG</div>
            </div>
          </div>

          {assessments.length > 1 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📊 Tren Berat Badan</h3>
              <div style={{ overflowX: "auto" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", padding: "10px 0", minWidth: assessments.length * 60 + 40 }}>
                  {assessments.map((a, i) => {
                    const maxW = Math.max(...assessments.map((x) => parseFloat(x.weight)));
                    const minW = Math.min(...assessments.map((x) => parseFloat(x.weight)));
                    const h = ((parseFloat(a.weight) - minW) / (maxW - minW + 1)) * 120 + 40;
                    const bmi = parseFloat(calcBMI(a.weight, a.height));
                    const cat = getBMICategory(bmi);
                    return (
                      <div key={a.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>{a.weight}kg</div>
                        <div style={{ width: 44, height: h, background: cat.color, borderRadius: "6px 6px 0 0", opacity: 0.85 }} />
                        <div style={{ fontSize: 10, color: COLORS.textMuted, textAlign: "center" }}>{fmtDate(a.date).split(" ").slice(0, 2).join(" ")}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {isAG && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>💬 Catatan & Rekomendasi AG</h3>
              <div style={{ display: "flex", gap: 10 }}>
                <textarea rows={2} style={{ flex: 1 }} placeholder="Tulis catatan atau rekomendasi untuk pasien..." value={note} onChange={(e) => setNote(e.target.value)} />
                <button className="btn btn-primary" style={{ alignSelf: "flex-end", whiteSpace: "nowrap" }} onClick={addNote}>{saved ? "✅" : "Kirim"}</button>
              </div>
            </div>
          )}

          {myNotes.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📝 Riwayat Catatan</h3>
              {myNotes.slice().reverse().map((n) => (
                <div key={n.id} style={{ padding: "12px 14px", background: "#f0f9f5", borderRadius: 10, marginBottom: 10, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{n.note}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>{fmtDate(n.date)}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Patients Module ──────────────────────────────────────────────────────────
function PatientsModule({ data, setData, user }) {
  const [search, setSearch] = useState("");
  const filtered = data.patients.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>👥 Data Pasien</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Manajemen data seluruh pasien</p>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <input placeholder="🔍 Cari pasien..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 400 }} />
      </div>
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
          <div>Belum ada pasien terdaftar</div>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((p) => {
            const lastA = data.assessments.filter((a) => a.patientId === p.id).slice(-1)[0];
            const bmi = lastA ? calcBMI(lastA.weight, lastA.height) : null;
            const bmiCat = bmi ? getBMICategory(parseFloat(bmi)) : null;
            const logs = data.foodLogs.filter((f) => f.userId === p.id).length;
            return (
              <div key={p.id} className="card">
                <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                  <div className="avatar" style={{ background: "#e1f5ee", color: COLORS.primaryDark, width: 48, height: 48, fontSize: 16 }}>
                    {(p.name || "P").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{p.email}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{p.phone || "—"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {bmiCat && <span className="badge" style={{ background: bmiCat.color + "22", color: bmiCat.color }}>BMI {bmi} • {bmiCat.label}</span>}
                  <span className="badge badge-info">🍽️ {logs} log</span>
                  {p.gender && <span className="badge badge-gray">{p.gender === "female" ? "♀ Perempuan" : "♂ Laki-laki"}</span>}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Terdaftar: {fmtDate(p.createdAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Reports Module ───────────────────────────────────────────────────────────
function ReportsModule({ data, user }) {
  const [period, setPeriod] = useState("week");
  const cutoff = new Date();
  if (period === "week") cutoff.setDate(cutoff.getDate() - 7);
  else if (period === "month") cutoff.setMonth(cutoff.getMonth() - 1);
  else cutoff.setFullYear(cutoff.getFullYear() - 1);

  const recentLogs = data.foodLogs.filter((f) => new Date(f.createdAt) >= cutoff);
  const recentAssessments = data.assessments.filter((a) => new Date(a.date) >= cutoff);

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>📊 Laporan & Log</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Pencatatan harian dan laporan periodik</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["week", "month", "year"].map((p) => (
          <button key={p} className={`btn ${period === p ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setPeriod(p)}>
            {p === "week" ? "Minggu Ini" : p === "month" ? "Bulan Ini" : "Tahun Ini"}
          </button>
        ))}
      </div>

      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { label: "Catatan Makan", value: recentLogs.length, icon: "🍽️", color: COLORS.primary },
          { label: "Assessment", value: recentAssessments.length, icon: "📋", color: COLORS.info },
          { label: "Total Pasien", value: data.patients.length, icon: "👥", color: COLORS.accent },
        ].map((s) => (
          <div key={s.label} className="card card-sm" style={{ textAlign: "center", borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🍽️ Log Makan Terbaru</h3>
          {recentLogs.length === 0 ? <div style={{ color: COLORS.textMuted, textAlign: "center", padding: 20 }}>Tidak ada log</div> : (
            recentLogs.slice(-10).reverse().map((log) => {
              const pat = data.users.find((u) => u.id === log.userId);
              return (
                <div key={log.id} style={{ padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{pat?.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>{log.mealType} • {fmtDate(log.date)} • {log.calories ? `${log.calories} kcal` : "—"}</div>
                </div>
              );
            })
          )}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Assessment Terbaru</h3>
          {recentAssessments.length === 0 ? <div style={{ color: COLORS.textMuted, textAlign: "center", padding: 20 }}>Tidak ada assessment</div> : (
            recentAssessments.slice().reverse().map((a) => {
              const pat = data.patients.find((p) => p.id === a.patientId);
              const bmi = calcBMI(a.weight, a.height);
              const cat = getBMICategory(parseFloat(bmi));
              return (
                <div key={a.id} style={{ padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{pat?.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>BMI {bmi} • {cat.label} • {fmtDate(a.date)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Referral Module ──────────────────────────────────────────────────────────
function ReferralModule({ data, setData, user }) {
  const [form, setForm] = useState({ patientId: "", fromAG: user.id, toAG: "", facility: "", notes: "", date: new Date().toISOString().split("T")[0] });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!form.patientId) return;
    const ref = { id: uid(), ...form, status: "pending", createdAt: new Date().toISOString() };
    setData((d) => { const nd = { ...d, referrals: [...d.referrals, ref] }; saveData(nd); return nd; });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>🔄 Rujukan Pasien</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Pemindahan asuhan gizi antar ahli gizi / fasilitas</p>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Buat Rujukan Baru</h3>
        <div className="grid-2">
          <div className="form-group">
            <label>Pilih Pasien</label>
            <select value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })}>
              <option value="">-- Pilih Pasien --</option>
              {data.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Tujuan Fasilitas</label>
            <select value={form.facility} onChange={(e) => setForm({ ...form, facility: e.target.value })}>
              <option value="">-- Pilih Fasilitas --</option>
              <option>RS → Puskesmas</option>
              <option>Puskesmas → RS</option>
              <option>RS → Praktik Mandiri</option>
              <option>Praktik Mandiri → RS</option>
              <option>Antar RS</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Nama AG Tujuan</label>
          <input placeholder="Nama Ahli Gizi yang dituju" value={form.toAG} onChange={(e) => setForm({ ...form, toAG: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Alasan Rujukan</label>
          <textarea rows={3} placeholder="Alasan merujuk pasien..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <button className="btn btn-primary" onClick={handleSave}>{saved ? "✅ Tersimpan!" : "📤 Buat Rujukan"}</button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Daftar Rujukan</h3>
        {data.referrals.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
            <div>Belum ada rujukan</div>
          </div>
        ) : (
          data.referrals.map((r) => {
            const pat = data.patients.find((p) => p.id === r.patientId);
            return (
              <div key={r.id} style={{ padding: "12px 14px", background: "#f8fdf9", borderRadius: 10, marginBottom: 10, border: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 700 }}>{pat?.name}</div>
                  <span className="badge badge-warning">⏳ Pending</span>
                </div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>{r.facility} → {r.toAG}</div>
                {r.notes && <div style={{ fontSize: 13, marginTop: 4 }}>{r.notes}</div>}
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6 }}>{fmtDate(r.date)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Chat Module ──────────────────────────────────────────────────────────────
function ChatModule({ data, setData, user }) {
  const [selectedContact, setSelectedContact] = useState(null);
  const [msg, setMsg] = useState("");
  const isAG = user?.role === "nutritionist";

  const contacts = isAG ? data.patients : data.nutritionists;
  const convo = selectedContact ? data.messages.filter((m) => (m.from === user.id && m.to === selectedContact.id) || (m.from === selectedContact.id && m.to === user.id)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : [];

  function sendMsg() {
    if (!msg.trim() || !selectedContact) return;
    const m = { id: uid(), from: user.id, to: selectedContact.id, text: msg, createdAt: new Date().toISOString() };
    setData((d) => { const nd = { ...d, messages: [...d.messages, m] }; saveData(nd); return nd; });
    setMsg("");
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>💬 Chat</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Komunikasi langsung antara pasien dan ahli gizi</p>
      </div>

      <div style={{ display: "flex", gap: 20, height: 520 }}>
        <div className="card" style={{ width: 240, flexShrink: 0, padding: 0, overflowY: "auto" }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${COLORS.border}`, fontWeight: 700, fontSize: 14 }}>
            {isAG ? "Pasien" : "Ahli Gizi"}
          </div>
          {contacts.length === 0 ? (
            <div style={{ padding: 20, color: COLORS.textMuted, fontSize: 13, textAlign: "center" }}>Belum ada kontak</div>
          ) : (
            contacts.map((c) => (
              <div key={c.id} onClick={() => setSelectedContact(c)} style={{ display: "flex", gap: 10, padding: "12px 16px", cursor: "pointer", background: selectedContact?.id === c.id ? "#e8f5ef" : "transparent", borderBottom: `1px solid ${COLORS.border}`, transition: "background 0.15s" }}>
                <div className="avatar" style={{ background: "#e1f5ee", color: COLORS.primaryDark, fontSize: 12, width: 36, height: 36 }}>
                  {(c.name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{isAG ? "Pasien" : "Ahli Gizi"}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
          {selectedContact ? (
            <>
              <div style={{ padding: "14px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 12, alignItems: "center" }}>
                <div className="avatar" style={{ background: "#e1f5ee", color: COLORS.primaryDark, fontSize: 14 }}>{(selectedContact.name || "U").slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedContact.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>🟢 Online</div>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                {convo.length === 0 && <div style={{ textAlign: "center", color: COLORS.textMuted, fontSize: 13, marginTop: 60 }}>Mulai percakapan dengan {selectedContact.name}</div>}
                {convo.map((m) => {
                  const isMine = m.from === user.id;
                  return (
                    <div key={m.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                      <div>
                        <div className={`msg-bubble ${isMine ? "sent" : "received"}`}>{m.text}</div>
                        <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3, textAlign: isMine ? "right" : "left" }}>
                          {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: "12px 16px", borderTop: `1px solid ${COLORS.border}`, display: "flex", gap: 10 }}>
                <input placeholder="Ketik pesan..." value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()} style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" onClick={sendMsg}>Kirim →</button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: COLORS.textMuted }}>
              <div style={{ fontSize: 48 }}>💬</div>
              <div>Pilih kontak untuk memulai chat</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Module ─────────────────────────────────────────────────────
function NotificationsModule({ data, setData, user }) {
  const [form, setForm] = useState({ type: "meal", message: "", time: "07:00" });
  const myNotifs = data.notifications.filter((n) => n.userId === user.id);

  function addNotif() {
    if (!form.message) return;
    const n = { id: uid(), userId: user.id, ...form, read: false, createdAt: new Date().toISOString() };
    setData((d) => { const nd = { ...d, notifications: [...d.notifications, n] }; saveData(nd); return nd; });
    setForm({ type: "meal", message: "", time: "07:00" });
  }

  function markRead(id) {
    setData((d) => { const nd = { ...d, notifications: d.notifications.map((n) => n.id === id ? { ...n, read: true } : n) }; saveData(nd); return nd; });
  }

  const ICONS = { meal: "🍽️", medication: "💊", checkup: "🩺", reminder: "🔔" };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>🔔 Notifikasi & Pengingat</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Atur pengingat waktu makan, obat, dan kontrol rutin</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>➕ Tambah Pengingat Baru</h3>
        <div className="grid-3">
          <div className="form-group">
            <label>Jenis Pengingat</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="meal">🍽️ Waktu Makan</option>
              <option value="medication">💊 Minum Obat</option>
              <option value="checkup">🩺 Kontrol Rutin</option>
              <option value="reminder">🔔 Pengingat Umum</option>
            </select>
          </div>
          <div className="form-group">
            <label>Waktu</label>
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Pesan</label>
            <input placeholder="Contoh: Minum obat Amlodipin..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={addNotif}>+ Tambah Pengingat</button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📋 Daftar Pengingat</h3>
        {myNotifs.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: COLORS.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            <div>Belum ada pengingat</div>
          </div>
        ) : (
          myNotifs.map((n) => (
            <div key={n.id} className="notif-item" style={{ opacity: n.read ? 0.6 : 1 }}>
              <div style={{ fontSize: 24 }}>{ICONS[n.type] || "🔔"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.message}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>⏰ {n.time} • {fmtDate(n.createdAt)}</div>
              </div>
              {!n.read && <button className="btn btn-secondary btn-xs" onClick={() => markRead(n.id)}>✓ Baca</button>}
              {n.read && <span className="badge badge-success">✓</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Analytics Module ─────────────────────────────────────────────────────────
function AnalyticsModule({ data }) {
  const totalAG = data.nutritionists.length;
  const totalPatients = data.patients.length;
  const bmiStats = { kurus: 0, normal: 0, gemuk: 0, obesitas: 0 };
  data.assessments.forEach((a) => {
    const bmi = parseFloat(calcBMI(a.weight, a.height));
    if (bmi < 18.5) bmiStats.kurus++;
    else if (bmi < 25) bmiStats.normal++;
    else if (bmi < 30) bmiStats.gemuk++;
    else bmiStats.obesitas++;
  });

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>📉 Analisis Pengguna Aplikasi</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Statistik dan analisis penggunaan aplikasi NutriCare</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Ahli Gizi", value: totalAG, icon: "🩺", color: COLORS.primary },
          { label: "Total Pasien", value: totalPatients, icon: "👥", color: COLORS.info },
          { label: "Total Assessment", value: data.assessments.length, icon: "📋", color: COLORS.accent },
          { label: "Total Log Makan", value: data.foodLogs.length, icon: "🍽️", color: COLORS.purple },
        ].map((s) => (
          <div key={s.label} className="card" style={{ textAlign: "center", borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>📊 Status Gizi Semua Pasien</h3>
          {Object.entries(bmiStats).map(([key, val]) => {
            const colors = { kurus: COLORS.info, normal: COLORS.primary, gemuk: COLORS.accent, obesitas: COLORS.danger };
            const labels = { kurus: "Kurus (<18.5)", normal: "Normal (18.5-24.9)", gemuk: "Gemuk (25-29.9)", obesitas: "Obesitas (≥30)" };
            const total = Object.values(bmiStats).reduce((a, b) => a + b, 0) || 1;
            const pct = Math.round((val / total) * 100);
            return (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{labels[key]}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors[key] }}>{val} ({pct}%)</span>
                </div>
                <div className="progress-bar" style={{ height: 10 }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: colors[key] }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>🏥 Distribusi Penyakit</h3>
          {(() => {
            const conds = {};
            data.assessments.forEach((a) => (a.conditions || []).forEach((c) => { conds[c] = (conds[c] || 0) + 1; }));
            const sorted = Object.entries(conds).sort((a, b) => b[1] - a[1]);
            const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
            return sorted.length === 0 ? (
              <div style={{ color: COLORS.textMuted, textAlign: "center", padding: 30 }}>Data belum tersedia</div>
            ) : sorted.map(([c, v]) => (
              <div key={c} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{c}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{v}</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${(v / total) * 100}%`, background: COLORS.purple }} />
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Standalone Calculator ────────────────────────────────────────────────────
function StandaloneModule() {
  const [form, setForm] = useState({ weight: "", height: "", age: "30", gender: "female", activity: "sedentary", condition: "sehat" });
  const [result, setResult] = useState(null);

  function calc() {
    const w = parseFloat(form.weight), h = parseFloat(form.height), age = parseFloat(form.age);
    if (!w || !h) return;
    const bmi = parseFloat(calcBMI(w, h));
    const bmiCat = getBMICategory(bmi);
    const idealBW = parseFloat(calcIdealBW(h, form.gender));
    const energy = calcEnergyNeeds(w, h, age, form.gender, form.activity);
    setResult({ bmi: bmi.toFixed(1), bmiCat, idealBW, energy, protein: Math.round(w * 1.2), fat: Math.round((energy * 0.25) / 9), carbs: Math.round((energy * 0.55) / 4) });
  }

  const tips = {
    sehat: ["Terapkan pola makan gizi seimbang (piring T)", "Olahraga 150 menit/minggu", "Minum 8 gelas air/hari"],
    hipertensi: ["Batasi garam < 1500mg/hari", "Perbanyak sayur dan buah", "Hindari alkohol dan rokok"],
    ginjal: ["Batasi protein jika GFR menurun", "Batasi kalium dan fosfor", "Kontrol cairan sesuai output urin"],
    asam_urat: ["Hindari jeroan, seafood, daging merah", "Perbanyak minum air", "Hindari minuman berpemanis"],
    dm: ["Batasi karbohidrat sederhana", "Makan teratur 3x sehari", "Pilih karbohidrat kompleks"],
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>🧮 Kalkulator Gizi Mandiri</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Hitung status gizi dan kebutuhan gizi Anda secara mandiri</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Data Diri</h3>
          <div className="grid-2">
            <div className="form-group"><label>Berat (kg)</label><input type="number" placeholder="65" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} /></div>
            <div className="form-group"><label>Tinggi (cm)</label><input type="number" placeholder="165" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} /></div>
            <div className="form-group"><label>Usia</label><input type="number" placeholder="30" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
            <div className="form-group"><label>Jenis Kelamin</label><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="female">Perempuan</option><option value="male">Laki-laki</option></select></div>
          </div>
          <div className="form-group"><label>Aktivitas Fisik</label><select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}><option value="sedentary">Tidak aktif</option><option value="light">Ringan</option><option value="moderate">Sedang</option><option value="active">Aktif</option><option value="veryActive">Sangat Aktif</option></select></div>
          <div className="form-group"><label>Kondisi Kesehatan</label><select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}><option value="sehat">Sehat</option><option value="hipertensi">Hipertensi</option><option value="ginjal">Penyakit Ginjal</option><option value="asam_urat">Asam Urat</option><option value="dm">Diabetes Melitus</option></select></div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={calc}>⚡ Hitung Sekarang</button>
        </div>

        {result ? (
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>✅ Hasil Analisis</h3>
            <div style={{ textAlign: "center", padding: "20px 0", marginBottom: 16 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: result.bmiCat.color }}>{result.bmi}</div>
              <div style={{ fontSize: 13, color: COLORS.textMuted }}>Indeks Massa Tubuh</div>
              <span className="badge" style={{ background: result.bmiCat.color + "22", color: result.bmiCat.color, marginTop: 8, display: "inline-block", fontSize: 14, padding: "6px 18px" }}>{result.bmiCat.label}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[
                { label: "BB Ideal", value: `${result.idealBW} kg` },
                { label: "Kebutuhan Energi", value: `${result.energy} kkal/hari` },
                { label: "Protein", value: `${result.protein} g/hari` },
                { label: "Lemak", value: `${result.fat} g/hari` },
                { label: "Karbohidrat", value: `${result.carbs} g/hari` },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f0f9f5", borderRadius: 8 }}>
                  <span style={{ fontSize: 13, color: COLORS.textMuted }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.primaryDark }}>{item.value}</span>
                </div>
              ))}
            </div>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: COLORS.primaryDark }}>💡 Anjuran Gizi ({form.condition})</h4>
            {(tips[form.condition] || tips.sehat).map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 13 }}>
                <span style={{ color: COLORS.primary, fontWeight: 700 }}>→</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: COLORS.textMuted }}>
            <div style={{ fontSize: 60 }}>🧮</div>
            <div style={{ textAlign: "center" }}>Isi data di sebelah kiri dan klik "Hitung Sekarang"</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Testimonials Module ──────────────────────────────────────────────────────
function TestimonialsModule({ data, setData, user }) {
  const [form, setForm] = useState({ rating: 5, text: "" });
  const [saved, setSaved] = useState(false);

  function handleAdd() {
    if (!form.text) return;
    const t = { id: uid(), userId: user.id, userName: user.name, role: user.role, ...form, createdAt: new Date().toISOString() };
    setData((d) => { const nd = { ...d, testimonials: [...d.testimonials, t] }; saveData(nd); return nd; });
    setForm({ rating: 5, text: "" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>⭐ Testimoni Pengguna</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Bagikan pengalaman Anda menggunakan NutriCare</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Tulis Testimoni</h3>
        <div className="form-group">
          <label>Rating</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((r) => (
              <div key={r} onClick={() => setForm({ ...form, rating: r })} style={{ fontSize: 30, cursor: "pointer", transition: "transform 0.15s", transform: form.rating >= r ? "scale(1.1)" : "scale(1)", filter: form.rating >= r ? "none" : "grayscale(1)" }}>⭐</div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Testimoni Anda</label>
          <textarea rows={4} placeholder="Ceritakan pengalaman Anda menggunakan NutriCare..." value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        </div>
        <button className="btn btn-accent" onClick={handleAdd}>{saved ? "✅ Terima Kasih!" : "📤 Kirim Testimoni"}</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {data.testimonials.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
            <div>Jadilah yang pertama memberikan testimoni!</div>
          </div>
        ) : (
          data.testimonials.slice().reverse().map((t) => (
            <div key={t.id} className="card">
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div className="avatar" style={{ background: "#e1f5ee", color: COLORS.primaryDark }}>{(t.userName || "U").slice(0, 2).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{t.userName}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>{t.role === "nutritionist" ? "Ahli Gizi" : "Pasien"} • {fmtDate(t.createdAt)}</div>
                    </div>
                    <div style={{ fontSize: 18 }}>{"⭐".repeat(t.rating)}</div>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10, color: COLORS.text }}>{t.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Profile Module ───────────────────────────────────────────────────────────
function ProfileModule({ data, setData, user }) {
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", age: user?.age || "", gender: user?.gender || "female", specialization: user?.specialization || "" });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setData((d) => {
      const updatedUsers = d.users.map((u) => u.id === user.id ? { ...u, ...form } : u);
      const updatedPatients = d.patients.map((p) => p.id === user.id ? { ...p, ...form } : p);
      const nd = { ...d, users: updatedUsers, patients: updatedPatients, currentUser: { ...d.currentUser, ...form } };
      saveData(nd); return nd;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="animate-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 24, color: COLORS.primaryDark }}>👤 Profil Saya</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>Kelola informasi profil Anda</p>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 20, alignItems: "center", marginBottom: 28, padding: "20px", background: "linear-gradient(135deg, #e1f5ee, #f0f9f5)", borderRadius: 14 }}>
          <div className="avatar" style={{ width: 72, height: 72, background: COLORS.primary, color: "#fff", fontSize: 24 }}>
            {(user?.name || "U").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 600, color: COLORS.primaryDark }}>{user?.name}</div>
            <div style={{ fontSize: 14, color: COLORS.textMuted, marginTop: 2 }}>{user?.email}</div>
            <span className="badge badge-success" style={{ marginTop: 8 }}>{user?.role === "nutritionist" ? "🩺 Ahli Gizi" : "👤 Pasien"}</span>
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group"><label>Nama Lengkap</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label>No. HP</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          {user?.role !== "nutritionist" && (
            <>
              <div className="form-group"><label>Usia</label><input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
              <div className="form-group"><label>Jenis Kelamin</label><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="female">Perempuan</option><option value="male">Laki-laki</option></select></div>
            </>
          )}
          {user?.role === "nutritionist" && (
            <div className="form-group"><label>Spesialisasi</label><input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
          )}
        </div>

        <button className="btn btn-primary" onClick={handleSave}>{saved ? "✅ Profil Tersimpan!" : "💾 Simpan Perubahan"}</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [showCover, setShowCover] = useState(true);
  const [data, setData] = useState(loadData);
  const [page, setPage] = useState("dashboard");

  const user = data.currentUser;
  const isAG = user?.role === "nutritionist";

  const unread = data.notifications.filter((n) => n.userId === user?.id && !n.read).length;

  function handleLogout() {
    setData((d) => { const nd = { ...d, currentUser: null }; saveData(nd); return nd; });
    setPage("dashboard");
  }

  if (showCover) return (
    <>
      <style>{styles}</style>
      <CoverScreen onEnter={() => setShowCover(false)} />
    </>
  );

  if (!user) return (
    <>
      <style>{styles}</style>
      <AuthScreen data={data} setData={setData} />
    </>
  );

  const props = { data, setData, user };

  const pages = {
    dashboard: isAG ? <AGDashboard {...props} /> : <PatientDashboard {...props} />,
    profile: <ProfileModule {...props} />,
    assessment: <AssessmentModule {...props} />,
    foodlog: <FoodLogModule {...props} />,
    diagnosis: <DiagnosisModule {...props} />,
    intervention: <InterventionModule {...props} />,
    monitoring: <MonitoringModule {...props} />,
    reports: <ReportsModule {...props} />,
    referral: <ReferralModule {...props} />,
    chat: <ChatModule {...props} />,
    notifications: <NotificationsModule {...props} />,
    analytics: <AnalyticsModule {...props} />,
    standalone: <StandaloneModule />,
    testimonials: <TestimonialsModule {...props} />,
    patients: <PatientsModule {...props} />,
  };

  return (
    <>
      <style>{styles}</style>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar page={page} setPage={setPage} user={user} onLogout={handleLogout} unreadCount={unread} />
        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px", minWidth: 0 }}>
          {pages[page] || pages.dashboard}
        </main>
      </div>
    </>
  );
}
