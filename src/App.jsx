
import React, { useEffect, useState } from "react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { configured, supabase } from "./supabase";

const ADMIN = "klarethsolarte@gmail.com";
const LOGO = "/adeco-energia.jpg.jpg";
const TOTAL_MINERS = 1280;

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

const reportStyles = {
  container: {
    background: "#ffffff",
    color: "#182923",
    border: "1px solid #cbd8ce",
    borderRadius: "12px",
    padding: "18px",
    width: "100%",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    borderBottom: "3px solid #1c6040",
    paddingBottom: "14px",
    marginBottom: "14px",
    textAlign: "center",
    flexWrap: "wrap"
  },
  logo: {
    width: "95px",
    height: "75px",
    objectFit: "contain"
  },
  brand: {
    color: "#164d35",
    fontSize: "19px",
    fontWeight: "bold",
    margin: "0 0 5px"
  },
  subtitle: {
    color: "#607268",
    fontSize: "11px",
    letterSpacing: "1px",
    margin: 0
  },
  sectionTitle: {
    background: "#164d35",
    color: "#ffffff",
    padding: "9px 12px",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: "bold",
    margin: "16px 0 9px",
    letterSpacing: "0.4px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "9px"
  },
  cell: {
    border: "1px solid #b9cbbd",
    borderRadius: "6px",
    padding: "10px",
    minWidth: 0,
    background: "#fbfdfb",
    boxSizing: "border-box"
  },
  cellLabel: {
    display: "block",
    color: "#26704b",
    fontSize: "10px",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: "7px"
  },
  cellValue: {
    display: "block",
    color: "#182923",
    fontSize: "14px",
    fontWeight: "600",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
    minHeight: "18px"
  },
  footer: {
    borderTop: "1px solid #cbd8ce",
    marginTop: "16px",
    paddingTop: "10px",
    color: "#718078",
    fontSize: "10px",
    textAlign: "center"
  }
};

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

  // Disponibilidad automática sobre el total de 1280 equipos.
  const availability = form.miners_online === ""
    ? "0.00"
    : (
        (Number(form.miners_online) / TOTAL_MINERS) * 100
      ).toFixed(2);

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

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setNotice(error.message);
        return;
      }
      setSession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
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
      await loadReports();

      if (isAdmin) {
        await loadUsers();
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
        redirectTo: window.location.origin
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

    if (online + offline > TOTAL_MINERS) {
      setNotice(
        "Error: las mineradoras operativas y offline no pueden superar las 1280 unidades."
      );
      return;
    }

    if (online < 0 || offline < 0) {
      setNotice("Los valores de mineradoras no pueden ser negativos.");
      return;
    }

    if (Number(form.generators_online) < 0 ||
        Number(form.generators_online) > 3) {
      setNotice("El número de generadores debe estar entre 0 y 3.");
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
      await loadReports();
    }
  }

  function num(value) {
    return value === "" || value === null ? null : Number(value);
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

  function restText(value) {
    if (!value || value === "No") return "Sin descanso";

    if (value.includes("|")) {
      const parts = value.split("|");
      return `${parts[0]} — ${parts.slice(1).join("|")}`;
    }

    return value;
  }

  function reportCell(label, value) {
    return (
      <div style={reportStyles.cell}>
        <span style={reportStyles.cellLabel}>{label}</span>
        <span style={reportStyles.cellValue}>
          {value === null || value === undefined || value === ""
            ? "-"
            : String(value)}
        </span>
      </div>
    );
  }

  function renderReport(r) {
    const metrics = [
      ["OPERADORES", r.operators],
      ["DESCANSO", restText(r.day_off)],
      ["HASHRATE (PH/s)", r.hashrate_ph],
      ["DISPONIBILIDAD (%)", r.availability_pct],
      ["MINERADORAS ONLINE", r.miners_online],
      ["MINERADORAS OFFLINE", r.miners_offline],
      ["CONSUMO (MW)", r.power_mw],
      ["CONSUMO MENSUAL (kWh)", r.month_consumption_kwh],
      ["GENERADORES EN OPERACIÓN", `${r.generators_running ?? "-"}/3`]
    ];

    const details = [
      ["INCIDENCIAS", r.occurrences],
      ["MANTENIMIENTOS REALIZADOS", r.maintenance],
      ["PENDIENTES DEL PRÓXIMO TURNO", r.next_shift_pending],
      ["ORIENTACIONES DE SUPERVISIÓN", r.supervisor_instructions]
    ];

    return (
      <div
        id={`report-${r.id}`}
        key={r.id}
        style={reportStyles.container}
      >
        <div style={reportStyles.header}>
          <img
            src={LOGO}
            alt="ADECOAGRO"
            style={reportStyles.logo}
            crossOrigin="anonymous"
          />

          <div>
            <h2 style={reportStyles.brand}>
              ADECOAGRO MINING CLOUD
            </h2>
            <p style={reportStyles.subtitle}>
              INFORME DIARIO OPERACIONAL
            </p>
            <p style={{
              color: "#344d3e",
              fontSize: "12px",
              fontWeight: "bold",
              margin: "8px 0 0"
            }}>
              FECHA: {r.report_date || "-"}
            </p>
          </div>
        </div>

        <div style={reportStyles.sectionTitle}>
          INFORMACIÓN OPERACIONAL
        </div>

        <div style={reportStyles.grid}>
          {metrics.map(([label, value]) => (
            <React.Fragment key={label}>
              {reportCell(label, value)}
            </React.Fragment>
          ))}
        </div>

        <div style={reportStyles.sectionTitle}>
          DETALLES DEL TURNO
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "9px"
        }}>
          {details.map(([label, value]) => (
            <React.Fragment key={label}>
              {reportCell(label, value)}
            </React.Fragment>
          ))}
        </div>

        <div style={reportStyles.footer}>
          ADECOAGRO · ENERGIA EM CRESCIMENTO
        </div>
      </div>
    );
  }

  async function generateQR(r) {
    try {
      const url = `${window.location.origin}/?report=${encodeURIComponent(r.id)}`;

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
    const url = `${window.location.origin}/?report=${encodeURIComponent(r.id)}`;

    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        "ADECOAGRO MINING CLOUD - Informe operacional: " + url
      )}`,
      "_blank"
    );
  }

  async function exportPdf(r) {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const gap = 6;
      const cardWidth = (pageWidth - margin * 2 - gap) / 2;
      const fullWidth = pageWidth - margin * 2;

      let y = 48;

      async function getLogo() {
        return new Promise(resolve => {
          const image = new Image();
          image.crossOrigin = "anonymous";

          image.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = image.naturalWidth;
              canvas.height = image.naturalHeight;

              const context = canvas.getContext("2d");
              context.drawImage(image, 0, 0);

              resolve(canvas.toDataURL("image/png"));
            } catch {
              resolve(null);
            }
          };

          image.onerror = () => resolve(null);
          image.src = LOGO;
        });
      }

      const logoData = await getLogo();

      function header() {
        doc.setFillColor(22, 77, 53);
        doc.rect(0, 0, pageWidth, 36, "F");

        if (logoData) {
          doc.addImage(logoData, "PNG", margin, 5, 25, 25);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text("ADECOAGRO MINING CLOUD", logoData ? 44 : margin, 15);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("INFORME DIARIO OPERACIONAL", logoData ? 44 : margin, 23);

        doc.setTextColor(35, 65, 49);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`FECHA: ${r.report_date || "-"}`, margin, 44);
      }

      function newPage() {
        doc.addPage();
        header();
        y = 51;
      }

      function drawSection(title) {
        if (y + 11 > pageHeight - 15) newPage();

        doc.setFillColor(22, 77, 53);
        doc.roundedRect(margin, y, fullWidth, 8, 1.5, 1.5, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(title, margin + 4, y + 5.5);

        y += 12;
      }

      function drawCard(label, value, x, width) {
        const text = String(value ?? "-").trim() || "-";
        const lines = doc.splitTextToSize(text, width - 8);
        const height = Math.max(19, 13 + lines.length * 4.5);

        if (y + height > pageHeight - 15) {
          newPage();
        }

        doc.setFillColor(251, 253, 251);
        doc.setDrawColor(185, 203, 189);
        doc.roundedRect(x, y, width, height, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(38, 112, 75);
        doc.text(label, x + 4, y + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(24, 41, 35);
        doc.text(lines, x + 4, y + 12);

        return height;
      }

      header();

      drawSection("INFORMACIÓN OPERACIONAL");

      const metrics = [
        ["OPERADORES", r.operators],
        ["DESCANSO", restText(r.day_off)],
        ["HASHRATE (PH/s)", r.hashrate_ph],
        ["DISPONIBILIDAD (%)", r.availability_pct],
        ["MINERADORAS ONLINE", r.miners_online],
        ["MINERADORAS OFFLINE", r.miners_offline],
        ["CONSUMO (MW)", r.power_mw],
        ["CONSUMO MENSUAL (kWh)", r.month_consumption_kwh],
        ["GENERADORES EN OPERACIÓN", `${r.generators_running ?? "-"}/3`]
      ];

      for (let i = 0; i < metrics.length; i += 2) {
        const leftHeight = drawCard(
          metrics[i][0],
          metrics[i][1],
          margin,
          cardWidth
        );

        const rightHeight = metrics[i + 1]
          ? drawCard(
              metrics[i + 1][0],
              metrics[i + 1][1],
              margin + cardWidth + gap,
              cardWidth
            )
          : 0;

        y += Math.max(leftHeight, rightHeight) + 5;
      }

      drawSection("DETALLES DEL TURNO");

      const details = [
        ["INCIDENCIAS", r.occurrences],
        ["MANTENIMIENTOS REALIZADOS", r.maintenance],
        ["PENDIENTES DEL PRÓXIMO TURNO", r.next_shift_pending],
        ["ORIENTACIONES DE SUPERVISIÓN", r.supervisor_instructions]
      ];

      details.forEach(([label, value]) => {
        const height = drawCard(label, value, margin, fullWidth);
        y += height + 5;
      });

      const pages = doc.internal.getNumberOfPages();

      for (let page = 1; page <= pages; page++) {
        doc.setPage(page);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(110, 125, 115);
        doc.text(
          `ADECOAGRO · Energia em crescimento · ${page}/${pages}`,
          pageWidth / 2,
          pageHeight - 7,
          { align: "center" }
        );
      }

      doc.save(`adecoagro-${r.report_date}.pdf`);
    } catch (error) {
      setNotice("No se pudo generar el PDF: " + error.message);
    }
  }

  async function exportJpg(r) {
    try {
      const node = document.getElementById(`report-${r.id}`);

      if (!node) {
        setNotice("No se encontró el informe para exportar.");
        return;
      }

      const data = await toJpeg(node, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        cacheBust: true
      });

      const a = document.createElement("a");
      a.href = data;
      a.download = `adecoagro-${r.report_date}.jpg`;
      a.click();
    } catch (error) {
      setNotice("No se pudo generar el JPG: " + error.message);
    }
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
    <main className={`app-layout ${session ? "authenticated" : "unauthenticated"}`}>
      <header>
        <div className="brand-area">
          <img
            src={LOGO}
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
                className={activeSection === "home" ? "menu-active" : "menu-button"}
                onClick={() => setActiveSection("home")}
              >
                🏠 Inicio
              </button>

              <button
                className={activeSection === "history" ? "menu-active" : "menu-button"}
                onClick={() => setActiveSection("history")}
              >
                📁 Histórico general
              </button>

              {isAdmin && (
                <button
                  className={activeSection === "users" ? "menu-active" : "menu-button"}
                  onClick={() => setActiveSection("users")}
                >
                  👥 Administración de usuarios
                </button>
              )}

              <button
                className={activeSection === "profile" ? "menu-active" : "menu-button"}
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
                      className={[
                        "incidents",
                        "maintenance",
                        "next_shift_pending",
                        "supervisor_guidance"
                      ].includes(k) ? "wide" : ""}
                    >
                      {label(k)}

                      {k === "rest_type" ? (
                        <select
                          value={form.rest_type}
                          onChange={e => setForm({
                            ...form,
                            rest_type: e.target.value
                          })}
                        >
                          <option value="none">
                            {lang === "pt-BR"
                              ? "Sem descanso"
                              : lang === "es-419"
                                ? "Sin descanso"
                                : "No absence"}
                          </option>
                          <option value="folga">
                            {lang === "pt-BR" ? "Folga" : lang === "es-419" ? "Descanso" : "Day off"}
                          </option>
                          <option value="atestado">
                            {lang === "pt-BR" ? "Atestado" : lang === "es-419" ? "Certificado médico" : "Medical leave"}
                          </option>
                          <option value="banco de horas">Banco de horas</option>
                          <option value="falta">
                            {lang === "pt-BR" ? "Falta" : lang === "es-419" ? "Ausencia" : "Absence"}
                          </option>
                        </select>
                      ) : k === "rest_person" ? (
                        <input
                          type="text"
                          lang={lang}
                          spellCheck={true}
                          value={form.rest_person}
                          onChange={e => setForm({
                            ...form,
                            rest_person: e.target.value
                          })}
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
                          onChange={e => setForm({
                            ...form,
                            [k]: e.target.value
                          })}
                        />
                      ) : k === "availability" ? (
                        <input
                          type="number"
                          value={availability}
                          readOnly
                          placeholder="0.00"
                        />
                      ) : k === "generators_online" ? (
                        <select
                          value={form.generators_online}
                          onChange={e => setForm({
                            ...form,
                            generators_online: e.target.value
                          })}
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
                              ? TOTAL_MINERS
                              : undefined
                          }
                          step={
                            ["miners_online", "miners_offline"].includes(k)
                              ? 1
                              : "any"
                          }
                          value={form[k]}
                          onChange={e => setForm({
                            ...form,
                            [k]: e.target.value
                          })}
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
                    Cancelar edición
                  </button>
                )}
              </form>
            </section>
          )}

          {activeSection === "history" && (
            <section className="panel">
              <h2>{t.history}</h2>

              {reports.length === 0 ? (
                <p>{t.noReports}</p>
              ) : (
                reports.map(r => (
                  <article className="report" key={r.id}>
                    <div className="reporthead">
                      <h3>
                        {r.report_date} · {r.operators}
                      </h3>

                      <div className="report-actions">
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

                    {renderReport(r)}
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
                        <button onClick={() => statusChange(u.id, "approved")}>
                          Aprobar
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
                  <div className="profile-photo-placeholder">👤</div>
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
                  {savingProfile ? "Guardando..." : "Guardar cambios"}
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
