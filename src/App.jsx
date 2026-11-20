
import React, { useEffect, useState } from "react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { configured, supabase } from "./supabase";

const ADMIN = "klarethsolarte@gmail.com";

const translations = {
  "pt-BR": {
    login: "Entrar com Google",
    title: "Relatório diário operacional",
    date: "Data",
    operator: "Operador(es)",
    rest: "Folga / Descanso",
    hash: "Hashrate (PH/s)",
    online: "Mineradoras em operação (Un.)",
    offline: "Mineradoras offline (Un.)",
    availability: "Disponibilidade (%)",
    power: "Consumo (MW)",
    month: "Consumo do mês (kWh)",
    generators: "Geradores em operação (de 3)",
    events: "Ocorrências",
    maintenance: "Manutenções realizadas",
    pending: "Pendências próximo turno",
    guidance: "Orientações / determinações da supervisão",
    save: "Salvar relatório",
    history: "Histórico compartilhado",
    admin: "Administração de usuários",
    logout: "Sair",
    pendingStatus: "Aguardando aprovação",
    blocked: "Conta bloqueada",
    waiting: "Sua conta foi registrada e aguarda aprovação do administrador.",
    noReports: "Nenhum relatório encontrado."
  },

  "es-419": {
    login: "Entrar con Google",
    title: "Informe diario operacional",
    date: "Fecha",
    operator: "Operador(es)",
    rest: "Descanso",
    hash: "Hashrate (PH/s)",
    online: "Mineradoras en operación (Un.)",
    offline: "Mineradoras fuera de línea (Un.)",
    availability: "Disponibilidad (%)",
    power: "Consumo (MW)",
    month: "Consumo del mes (kWh)",
    generators: "Generadores en operación (de 3)",
    events: "Incidencias",
    maintenance: "Mantenimientos realizados",
    pending: "Pendientes del próximo turno",
    guidance: "Orientaciones / determinaciones de supervisión",
    save: "Guardar informe",
    history: "Historial compartido",
    admin: "Administración de usuarios",
    logout: "Salir",
    pendingStatus: "Pendiente de aprobación",
    blocked: "Cuenta bloqueada",
    waiting: "Tu cuenta fue registrada y espera la aprobación del administrador.",
    noReports: "No hay informes."
  },

  "en-US": {
    login: "Sign in with Google",
    title: "Daily operational report",
    date: "Date",
    operator: "Operator(s)",
    rest: "Off duty / Rest",
    hash: "Hashrate (PH/s)",
    online: "Miners operating (Units)",
    offline: "Miners offline (Units)",
    availability: "Availability (%)",
    power: "Power consumption (MW)",
    month: "Monthly consumption (kWh)",
    generators: "Generators operating (of 3)",
    events: "Incidents",
    maintenance: "Maintenance performed",
    pending: "Next shift pending items",
    guidance: "Supervisor instructions / decisions",
    save: "Save report",
    history: "Shared history",
    admin: "User administration",
    logout: "Sign out",
    pendingStatus: "Awaiting approval",
    blocked: "Account blocked",
    waiting: "Your account is registered and awaits administrator approval.",
    noReports: "No reports found."
  }
};

// Fecha local: evita el desfase UTC en Brasil.
function getLocalDate() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

const blank = {
  report_date: getLocalDate(),
  operator_names: "",
  rest_type: "none",
  rest_person: "",
  hashrate: "",
  miners_online: "",
  miners_offline: "",
  availability: "",
  power_mw: "",
  monthly_kwh: "",
  generators_online: "",
  incidents: "",
  maintenance: "",
  next_shift_pending: "",
  supervisor_guidance: ""
};

const fields = [
  "report_date",
  "operator_names",
  "rest_type",
  "rest_person",
  "hashrate",
  "miners_online",
  "miners_offline",
  "availability",
  "power_mw",
  "monthly_kwh",
  "generators_online",
  "incidents",
  "maintenance",
  "next_shift_pending",
  "supervisor_guidance"
];

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [lang, setLang] = useState(
    localStorage.getItem("amc-lang") || "pt-BR"
  );

  const [form, setForm] = useState(blank);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");

  const [qrReport, setQrReport] = useState(null);
  const [qrImage, setQrImage] = useState("");

  const [activeSection, setActiveSection] = useState("home");
  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const t = translations[lang] || translations["pt-BR"];

  const availability = form.miners_online === ""
    ? ""
    : ((Number(form.miners_online) / 1280) * 100).toFixed(2);

  const isAdmin =
    session?.user?.email?.toLowerCase() === ADMIN;

  const userName =
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email ||
    "Usuario";

  useEffect(() => {
    if (!configured) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadProfile();
    } else {
      setProfile(null);
      setReports([]);
      setUsers([]);
    }
  }, [session]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("report")) {
      setActiveSection("history");
    }
  }, []);

  async function loadProfile() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      setNotice(error.message);
      return;
    }

    setProfile(data);

    setProfileName(
      data?.full_name ||
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      ""
    );

    if (data?.status === "approved" || isAdmin) {
      loadReports();

      if (isAdmin) {
        loadUsers();
      }
    }
  }

  async function saveProfile() {
    const name = profileName.trim();

    if (!name) {
      setNotice("El nombre no puede estar vacío.");
      return;
    }

    setSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", session.user.id);

    setSavingProfile(false);

    if (error) {
      setNotice("No se pudo guardar el nombre: " + error.message);
      return;
    }

    setProfile({ ...profile, full_name: name });
    setNotice("Nombre del perfil actualizado correctamente.");
  }

  async function loadReports() {
    const sharedId = new URLSearchParams(window.location.search).get("report");

    let query = supabase.from("daily_reports").select("*");

    if (sharedId) {
      query = query.eq("id", sharedId);
    }

    const { data, error } = await query.order(
      "report_date",
      { ascending: false }
    );

    if (error) {
      setNotice(error.message);
    } else {
      setReports(data || []);
    }
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name,role,status,created_at")
      .order("created_at");

    if (error) {
      setNotice(error.message);
    } else {
      setUsers(data || []);
    }
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href
      }
    });

    if (error) {
      setNotice(error.message);
    }
  }

  async function save(e) {
    e.preventDefault();

    const online = Number(form.miners_online || 0);
    const offline = Number(form.miners_offline || 0);

    if (online + offline > 1280) {
      setNotice(
        "Error: las mineradoras operativas y offline no pueden superar las 1280 unidades."
      );
      return;
    }

    if (form.rest_type !== "none" && !form.rest_person.trim()) {
      setNotice("Informe o nome da pessoa.");
      return;
    }

    const payload = {
      report_date: form.report_date,
      created_by: session.user.id,
      operators: form.operator_names,
      day_off: form.rest_type === "none"
        ? "No"
        : `${form.rest_type}|${form.rest_person.trim()}`,
      hashrate_ph: num(form.hashrate),
      miners_online: num(form.miners_online),
      miners_offline: num(form.miners_offline),
      availability_pct: num(availability),
      power_mw: num(form.power_mw),
      month_consumption_kwh: num(form.monthly_kwh),
      generators_running: num(form.generators_online),
      occurrences: form.incidents,
      maintenance: form.maintenance,
      next_shift_pending: form.next_shift_pending,
      supervisor_instructions: form.supervisor_guidance
    };

    let result;

    if (editing) {
      const { created_by, ...updatePayload } = payload;

      result = await supabase
        .from("daily_reports")
        .update(updatePayload)
        .eq("id", editing)
        .select()
        .single();
    } else {
      result = await supabase
        .from("daily_reports")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      setNotice(result.error.message);
    } else {
      setNotice("Relatório salvo.");
      setForm({
        ...blank,
        report_date: getLocalDate()
      });
      setEditing(null);
      loadReports();
    }
  }

  function num(v) {
    return v === "" || v === null ? null : Number(v);
  }

  async function statusChange(id, status) {
    const { error } = await supabase.rpc(
      "set_operator_status",
      {
        target_user_id: id,
        new_status: status
      }
    );

    if (error) {
      setNotice(error.message);
    } else {
      setNotice("Status atualizado.");
      loadUsers();
    }
  }

  function edit(r) {
    setEditing(r.id);

    const dayOff = r.day_off || "";
    const oldType = dayOff.toLowerCase();

    setForm({
      report_date: r.report_date,
      operator_names: r.operators || "",

      rest_type: dayOff.includes("|")
        ? dayOff.split("|")[0]
        : (
          ["folga", "atestado", "banco de horas", "falta"].includes(oldType)
            ? oldType
            : (["sí", "sim"].includes(oldType) ? "folga" : "none")
        ),

      rest_person: dayOff.includes("|")
        ? dayOff.split("|").slice(1).join("|")
        : "",

      hashrate: r.hashrate_ph ?? "",
      miners_online: r.miners_online ?? "",
      miners_offline: r.miners_offline ?? "",
      availability: r.availability_pct ?? "",
      power_mw: r.power_mw ?? "",
      monthly_kwh: r.month_consumption_kwh ?? "",
      generators_online: r.generators_running ?? "",
      incidents: r.occurrences || "",
      maintenance: r.maintenance || "",
      next_shift_pending: r.next_shift_pending || "",
      supervisor_guidance: r.supervisor_instructions || ""
    });

    setActiveSection("home");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function generateQR(r) {
    try {
      const url = `${window.location.origin}/?report=${r.id}`;

      const image = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "H"
      });

      setQrImage(image);
      setQrReport(r);
    } catch (error) {
      setNotice("Error al generar el código QR: " + error.message);
    }
  }

  function shareWhatsApp(r) {
    const url = `${window.location.origin}/?report=${r.id}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        "ADECOAGRO MINING CLOUD - Informe operacional: " + url
      )}`,
      "_blank"
    );
  }

  async function exportPdf(r) {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const margin = 14;
    const cardGap = 7;
    const cardWidth = (pageWidth - margin * 2 - cardGap) / 2;
    const fullWidth = pageWidth - margin * 2;

    let y = 48;

    function header() {
      doc.setFillColor(16, 42, 36);
      doc.rect(0, 0, pageWidth, 37, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("ADECOAGRO MINING CLOUD", margin, 16);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("RELATORIO DIARIO OPERACIONAL", margin, 25);

      doc.setTextColor(35, 65, 49);
      doc.setFontSize(11);
      doc.text(`Fecha: ${r.report_date || "-"}`, margin, 44);
    }

    function newPage() {
      doc.addPage();
      header();
      y = 53;
    }

    function drawCard(label, value, x, width) {
      const text = String(value ?? "-").trim() || "-";
      const lines = doc.splitTextToSize(text, width - 12);
      const height = Math.max(20, 17 + lines.length * 5);

      if (y + height > pageHeight - 16) {
        newPage();
      }

      doc.setFillColor(246, 249, 246);
      doc.setDrawColor(215, 228, 218);
      doc.roundedRect(x, y, width, height, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(25, 91, 60);
      doc.text(label, x + 6, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(35, 48, 40);
      doc.text(lines, x + 6, y + 15);

      return height;
    }

    header();

    const rest = r.day_off === "No"
      ? "Sin descanso"
      : r.day_off?.includes("|")
        ? `${r.day_off.split("|")[0]} — ${r.day_off.split("|").slice(1).join("|")}`
        : r.day_off || "-";

    const metrics = [
      ["Operadores", r.operators],
      ["Descanso", rest],
      ["Hashrate (PH/s)", r.hashrate_ph],
      ["Disponibilidad (%)", r.availability_pct],
      ["Mineradoras online", r.miners_online],
      ["Mineradoras offline", r.miners_offline],
      ["Consumo (MW)", r.power_mw],
      ["Consumo mensual (kWh)", r.month_consumption_kwh],
      ["Generadores en operación", `${r.generators_running ?? "-"}/3`]
    ];

    for (let i = 0; i < metrics.length; i += 2) {
      const leftHeight = drawCard(
        metrics[i][0],
        metrics[i][1],
        margin,
        cardWidth
      );

      let rightHeight = 0;

      if (metrics[i + 1]) {
        rightHeight = drawCard(
          metrics[i + 1][0],
          metrics[i + 1][1],
          margin + cardWidth + cardGap,
          cardWidth
        );
      }

      y += Math.max(leftHeight, rightHeight) + 5;
    }

    const details = [
      ["OCORRÊNCIAS", r.occurrences],
      ["MANUTENÇÕES REALIZADAS", r.maintenance],
      ["PENDÊNCIAS DO PRÓXIMO TURNO", r.next_shift_pending],
      ["ORIENTAÇÕES DA SUPERVISÃO", r.supervisor_instructions]
    ];

    details.forEach(([label, value]) => {
      const text = String(value ?? "-").trim() || "-";
      const lines = doc.splitTextToSize(text, fullWidth - 12);
      const height = Math.max(23, 18 + lines.length * 5);

      if (y + height > pageHeight - 16) {
        newPage();
      }

      doc.setFillColor(246, 249, 246);
      doc.setDrawColor(215, 228, 218);
      doc.roundedRect(margin, y, fullWidth, height, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(25, 91, 60);
      doc.text(label, margin + 6, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(35, 48, 40);
      doc.text(lines, margin + 6, y + 16);

      y += height + 6;
    });

    doc.setFontSize(8);
    doc.setTextColor(110, 125, 115);

    doc.text(
      "ADECOAGRO - Energia em crescimento",
      pageWidth / 2,
      pageHeight - 7,
      { align: "center" }
    );

    doc.save(`adecoagro-${r.report_date}.pdf`);
  }

  async function exportJpg(r) {
    const node = document.getElementById(`report-${r.id}`);

    if (!node) return;

    const data = await toJpeg(node, {
      quality: 0.92,
      backgroundColor: "#ffffff"
    });

    const a = document.createElement("a");
    a.href = data;
    a.download = `adecoagro-${r.report_date}.jpg`;
    a.click();
  }

  function label(k) {
    return ({
      report_date: t.date,
      operator_names: t.operator,
      rest_type: t.rest,
      rest_person:
        lang === "pt-BR"
          ? "Nome da pessoa"
          : lang === "es-419"
            ? "Nombre de la persona"
            : "Person's name",
      hashrate: t.hash,
      miners_online: t.online,
      miners_offline: t.offline,
      availability: t.availability,
      power_mw: t.power,
      monthly_kwh: t.month,
      generators_online: t.generators,
      incidents: t.events,
      maintenance: t.maintenance,
      next_shift_pending: t.pending,
      supervisor_guidance: t.guidance
    })[k];
  }

  if (!configured) {
    return (
      <main className="center">
        <section className="panel">
          <h1>ADECOAGRO MINING CLOUD</h1>
          <p>
            O código está pronto para configurar, mas ainda faltam as
            credenciais do projeto Supabase.
          </p>
          <p>
            Crie um arquivo <code>.env</code> com base em{" "}
            <code>.env.example</code>, preenchendo a URL e a chave
            publicável do Supabase. Nunca coloque a chave service_role
            no navegador.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-layout">

      <header>
        <div className="brand-area">
          <img
            src="/adeco-energia.jpg.jpg"
            alt="ADECO ENERGIA"
            className="adeco-logo"
          />

          <div>
            <div className="brand">
              ADECOAGRO <span>MINING CLOUD</span>
            </div>
            <small>Energia em crescimento</small>
          </div>
        </div>

        <div className="tools">
          <select
            value={lang}
            onChange={e => {
              setLang(e.target.value);
              localStorage.setItem("amc-lang", e.target.value);
            }}
          >
            <option value="pt-BR">Português</option>
            <option value="es-419">Español</option>
            <option value="en-US">English</option>
          </select>
        </div>
      </header>

      {!session ? (
        <section className="panel login">
          <h1>ADECOAGRO MINING CLOUD</h1>
          <p>Plataforma de relatórios operacionais</p>
          <button onClick={signIn}>{t.login}</button>
        </section>
      ) : !profile ? (
        <section className="panel">
          <p>Carregando perfil...</p>
        </section>
      ) : profile.status !== "approved" && !isAdmin ? (
        <section className="panel">
          <h2>
            {profile.status === "blocked" ? t.blocked : t.pendingStatus}
          </h2>
          <p>
            {profile.status === "blocked"
              ? "Entre em contato com o administrador."
              : t.waiting}
          </p>
        </section>
      ) : (
        <>
          <aside className="sidebar">
            <div className="sidebar-user">
              <div className="user-avatar">👤</div>
              <strong>{userName}</strong>
              <small>{session?.user?.email}</small>
            </div>

            <nav className="sidebar-menu">
              <button
                className={
                  activeSection === "home"
                    ? "menu-active"
                    : "menu-button"
                }
                onClick={() => setActiveSection("home")}
              >
                🏠 Inicio
              </button>

              <button
                className={
                  activeSection === "history"
                    ? "menu-active"
                    : "menu-button"
                }
                onClick={() => setActiveSection("history")}
              >
                📁 Histórico general
              </button>

              {isAdmin && (
                <button
                  className={
                    activeSection === "users"
                      ? "menu-active"
                      : "menu-button"
                  }
                  onClick={() => setActiveSection("users")}
                >
                  👥 Administración de usuarios
                </button>
              )}

              <button
                className={
                  activeSection === "profile"
                    ? "menu-active"
                    : "menu-button"
                }
                onClick={() => setActiveSection("profile")}
              >
                👤 Mi perfil
              </button>

              <button
                className="menu-button"
                onClick={() => supabase.auth.signOut()}
              >
                🚪 Salir
              </button>
            </nav>
          </aside>

          {activeSection === "home" && (
            <section className="panel">
              <h2>{t.title}</h2>

              <form onSubmit={save} lang={lang} spellCheck={true}>
                <div className="fields">
                  {fields.map(k => (
                    <label
                      key={k}
                      className={
                        [
                          "incidents",
                          "maintenance",
                          "next_shift_pending",
                          "supervisor_guidance"
                        ].includes(k)
                          ? "wide"
                          : ""
                      }
                    >
                      {label(k)}

                      {k === "rest_type" ? (
                        <select
                          value={form.rest_type}
                          onChange={e =>
                            setForm({
                              ...form,
                              rest_type: e.target.value
                            })
                          }
                        >
                          <option value="none">
                            {lang === "pt-BR"
                              ? "Sem descanso"
                              : lang === "es-419"
                                ? "Sin descanso"
                                : "No absence"}
                          </option>

                          <option value="folga">
                            {lang === "pt-BR"
                              ? "Folga"
                              : lang === "es-419"
                                ? "Descanso"
                                : "Day off"}
                          </option>

                          <option value="atestado">
                            {lang === "pt-BR"
                              ? "Atestado"
                              : lang === "es-419"
                                ? "Certificado médico"
                                : "Medical leave"}
                          </option>

                          <option value="banco de horas">
                            Banco de horas
                          </option>

                          <option value="falta">
                            {lang === "pt-BR"
                              ? "Falta"
                              : lang === "es-419"
                                ? "Ausencia"
                                : "Absence"}
                          </option>
                        </select>
                      ) : k === "rest_person" ? (
                        <input
                          type="text"
                          lang={lang}
                          spellCheck={true}
                          value={form.rest_person}
                          onChange={e =>
                            setForm({
                              ...form,
                              rest_person: e.target.value
                            })
                          }
                          placeholder={
                            lang === "pt-BR"
                              ? "Nome da pessoa"
                              : lang === "es-419"
                                ? "Nombre de la persona"
                                : "Person's name"
                          }
                          required={form.rest_type !== "none"}
                        />
                      ) : [
                        "incidents",
                        "maintenance",
                        "next_shift_pending",
                        "supervisor_guidance"
                      ].includes(k) ? (
                        <textarea
                          rows="3"
                          lang={lang}
                          spellCheck={true}
                          value={form[k]}
                          onChange={e =>
                            setForm({
                              ...form,
                              [k]: e.target.value
                            })
                          }
                        />
                      ) : k === "availability" ? (
                        <input
                          type="number"
                          value={availability}
                          readOnly
                          placeholder="Calculado automáticamente"
                        />
                      ) : k === "generators_online" ? (
                        <select
                          value={form.generators_online}
                          onChange={e =>
                            setForm({
                              ...form,
                              generators_online: e.target.value
                            })
                          }
                          required
                        >
                          <option value="">Seleccionar</option>
                          <option value="0">0/3</option>
                          <option value="1">1/3</option>
                          <option value="2">2/3</option>
                          <option value="3">3/3</option>
                        </select>
                      ) : (
                        <input
                          required={
                            k === "report_date" ||
                            k === "operator_names"
                          }
                          type={
                            k === "report_date"
                              ? "date"
                              : k === "operator_names"
                                ? "text"
                                : "number"
                          }
                          min={
                            ["miners_online", "miners_offline"].includes(k)
                              ? 0
                              : undefined
                          }
                          max={
                            ["miners_online", "miners_offline"].includes(k)
                              ? 1280
                              : undefined
                          }
                          step={
                            ["miners_online", "miners_offline"].includes(k)
                              ? 1
                              : "any"
                          }
                          value={form[k]}
                          onChange={e =>
                            setForm({
                              ...form,
                              [k]: e.target.value
                            })
                          }
                        />
                      )}
                    </label>
                  ))}
                </div>

                <button type="submit">{t.save}</button>

                {editing && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditing(null);
                      setForm({
                        ...blank,
                        report_date: getLocalDate()
                      });
                    }}
                  >
                    Cancelar edição
                  </button>
                )}
              </form>
            </section>
          )}

          {activeSection === "history" && (
            <section className="panel">
              <h2>Histórico general</h2>

              {reports.length === 0 ? (
                <p>{t.noReports}</p>
              ) : (
                reports.map(r => (
                  <article
                    className="report"
                    id={`report-${r.id}`}
                    key={r.id}
                  >
                    <div className="reporthead">
                      <h3>
                        {r.report_date} · {r.operators}
                      </h3>

                      <div>
                        <button
                          className="secondary"
                          onClick={() => exportPdf(r)}
                        >
                          PDF
                        </button>

                        <button
                          className="secondary"
                          onClick={() => exportJpg(r)}
                        >
                          JPG
                        </button>

                        <button
                          className="secondary"
                          onClick={() => generateQR(r)}
                        >
                          QR
                        </button>

                        <button
                          className="secondary"
                          onClick={() => shareWhatsApp(r)}
                        >
                          WhatsApp
                        </button>

                        {(r.created_by === session.user.id || isAdmin) && (
                          <button
                            className="secondary"
                            onClick={() => edit(r)}
                          >
                            Editar
                          </button>
                        )}
                      </div>
                    </div>

                    <p>
                      <b>Hashrate:</b> {r.hashrate_ph ?? "-"} PH/s ·{" "}
                      <b>Disponibilidade:</b> {r.availability_pct ?? "-"}%
                    </p>

                    <p>
                      <b>Mineradoras:</b> {r.miners_online ?? "-"} online /{" "}
                      {r.miners_offline ?? "-"} offline ·{" "}
                      <b>Geradores:</b> {r.generators_running ?? "-"}/3
                    </p>

                    <p>
                      <b>Consumo:</b> {r.power_mw ?? "-"} MW ·{" "}
                      <b>Mês:</b> {r.month_consumption_kwh ?? "-"} kWh
                    </p>

                    <p>
                      <b>Descanso:</b>{" "}
                      {r.day_off === "No"
                        ? "Sin descanso"
                        : r.day_off?.includes("|")
                          ? `${r.day_off.split("|")[0]} — ${r.day_off.split("|").slice(1).join("|")}`
                          : r.day_off || "-"}
                    </p>

                    {[
                      ["Ocorrências", r.occurrences],
                      ["Manutenções", r.maintenance],
                      ["Pendências", r.next_shift_pending],
                      ["Orientações", r.supervisor_instructions]
                    ].map(([a, b]) => (
                      <p key={a}>
                        <b>{a}:</b> {b || "-"}
                      </p>
                    ))}
                  </article>
                ))
              )}
            </section>
          )}

          {activeSection === "users" && isAdmin && (
            <section className="panel">
              <h2>{t.admin}</h2>

              <p>
                Administrador principal: {ADMIN}. Limite planejado:
                1 administrador + 9 operadores.
              </p>

              {users.map(u => (
                <div className="userrow" key={u.id}>
                  <span>
                    <b>{u.full_name || u.email}</b>
                    <small>
                      {u.email} · {u.status} · {u.role}
                    </small>
                  </span>

                  <span>
                    {u.role !== "admin" && (
                      <>
                        <button
                          onClick={() => statusChange(u.id, "approved")}
                        >
                          Aprovar
                        </button>

                        <button
                          className="danger"
                          onClick={() => statusChange(u.id, "blocked")}
                        >
                          Bloquear
                        </button>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </section>
          )}

          {activeSection === "profile" && (
            <section className="panel">
              <h2>Mi perfil</h2>

              <div className="profile-card">
                {session?.user?.user_metadata?.avatar_url ||
                session?.user?.user_metadata?.picture ? (
                  <img
                    src={
                      session.user.user_metadata.avatar_url ||
                      session.user.user_metadata.picture
                    }
                    alt="Foto de perfil"
                    className="profile-photo"
                  />
                ) : (
                  <div className="profile-photo-placeholder">
                    👤
                  </div>
                )}

                <label>
                  Nombre del perfil
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="Escribe tu nombre"
                  />
                </label>

                <label>
                  Correo electrónico
                  <input
                    type="email"
                    value={session?.user?.email || ""}
                    readOnly
                  />
                </label>

                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile
                    ? "Guardando..."
                    : "Guardar cambios"}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {qrReport && qrImage && (
        <div className="qr-overlay">
          <section className="panel qr-modal">
            <h2>Compartir informe</h2>

            <p>
              {qrReport.report_date} · {qrReport.operators}
            </p>

            <img
              src={qrImage}
              alt="Código QR del informe"
            />

            <p>Escanea para abrir este informe.</p>

            <button onClick={() => shareWhatsApp(qrReport)}>
              Compartir por WhatsApp
            </button>

            <button
              className="secondary"
              onClick={() => {
                setQrReport(null);
                setQrImage("");
              }}
            >
              Cerrar
            </button>
          </section>
        </div>
      )}

      {notice && (
        <div
          className="notice"
          onClick={() => setNotice("")}
        >
          {notice} ×
        </div>
      )}

      <footer>
        ADECOAGRO · Energia em crescimento
      </footer>
    </main>
  );
}

}
```
