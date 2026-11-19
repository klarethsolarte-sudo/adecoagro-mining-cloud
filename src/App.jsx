import React, { useEffect, useState } from "react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { configured, supabase } from "./supabase";

const ADMIN = "klarethsolarte@gmail.com";
const translations = {
  "pt-BR": {login:"Entrar com Google", title:"Relatório diário operacional", date:"Data", operator:"Operador(es)", rest:"Folga / Descanso", hash:"Hashrate (PH/s)", online:"Mineradoras em operação (Un.)", offline:"Mineradoras offline (Un.)", availability:"Disponibilidade (%)", power:"Consumo (MW)", month:"Consumo do mês (kWh)", generators:"Geradores em operação (de 3)", events:"Ocorrências", maintenance:"Manutenções realizadas", pending:"Pendências próximo turno", guidance:"Orientações / determinações da supervisão", save:"Salvar relatório", history:"Histórico compartilhado", admin:"Administração de usuários", logout:"Sair", pendingStatus:"Aguardando aprovação", blocked:"Conta bloqueada", waiting:"Sua conta foi registrada e aguarda aprovação do administrador.", noReports:"Nenhum relatório encontrado."},
  "es-419": {login:"Entrar con Google", title:"Informe diario operacional", date:"Fecha", operator:"Operador(es)", rest:"Descanso", hash:"Hashrate (PH/s)", online:"Mineradoras en operación (Un.)", offline:"Mineradoras fuera de línea (Un.)", availability:"Disponibilidad (%)", power:"Consumo (MW)", month:"Consumo del mes (kWh)", generators:"Generadores en operación (de 3)", events:"Incidencias", maintenance:"Mantenimientos realizados", pending:"Pendientes del próximo turno", guidance:"Orientaciones / determinaciones de supervisión", save:"Guardar informe", history:"Historial compartido", admin:"Administración de usuarios", logout:"Salir", pendingStatus:"Pendiente de aprobación", blocked:"Cuenta bloqueada", waiting:"Tu cuenta fue registrada y espera la aprobación del administrador.", noReports:"No hay informes."},
  "en-US": {login:"Sign in with Google", title:"Daily operational report", date:"Date", operator:"Operator(s)", rest:"Off duty / Rest", hash:"Hashrate (PH/s)", online:"Miners operating (Units)", offline:"Miners offline (Units)", availability:"Availability (%)", power:"Power consumption (MW)", month:"Monthly consumption (kWh)", generators:"Generators operating (of 3)", events:"Incidents", maintenance:"Maintenance performed", pending:"Next shift pending items", guidance:"Supervisor instructions / decisions", save:"Save report", history:"Shared history", admin:"User administration", logout:"Sign out", pendingStatus:"Awaiting approval", blocked:"Account blocked", waiting:"Your account is registered and awaits administrator approval.", noReports:"No reports found."}
};
const today = new Date().toISOString().slice(0,10);
const blank = {
  report_date:today,
  operator_names:"",
  rest_type:"none",
  rest_person:"",
  hashrate:"",
  miners_online:"",
  miners_offline:"",
  availability:"",
  power_mw:"",
  monthly_kwh:"",
  generators_online:"",
  incidents:"",
  maintenance:"",
  next_shift_pending:"",
  supervisor_guidance:""
};
const fields = ["report_date","operator_names","rest_type","rest_person","hashrate","miners_online","miners_offline","availability","power_mw","monthly_kwh","generators_online","incidents","maintenance","next_shift_pending","supervisor_guidance"];
export default function App(){
 const [session,setSession]=useState(null), [profile,setProfile]=useState(null), [lang,setLang]=useState(localStorage.getItem("amc-lang")||"pt-BR");
 const [form,setForm]=useState(blank), [reports,setReports]=useState([]), [users,setUsers]=useState([]), [editing,setEditing]=useState(null), [notice,setNotice]=useState("");
  const [qrReport,setQrReport]=useState(null);
const [qrImage,setQrImage]=useState("");
 const t=translations[lang];
 const isAdmin = session?.user?.email?.toLowerCase()===ADMIN;
 useEffect(()=>{ if(!configured)return; supabase.auth.getSession().then(({data})=>setSession(data.session)); const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s)); return ()=>subscription.unsubscribe(); },[]);
 useEffect(()=>{ if(session) loadProfile(); else {setProfile(null);setReports([]);} },[session]);
 async function loadProfile(){ const {data,error}=await supabase.from("profiles").select("*").eq("id",session.user.id).maybeSingle(); if(error){setNotice(error.message);return;} setProfile(data); if(data?.status==="approved" || isAdmin){loadReports(); if(isAdmin)loadUsers();} }
async function loadReports(){
  const sharedId = new URLSearchParams(window.location.search).get("report");

  let query = supabase.from("daily_reports").select("*");

  if(sharedId){
    query = query.eq("id",sharedId);
  }

  const {data,error} = await query.order("report_date",{ascending:false});

  if(error)setNotice(error.message);
  else setReports(data||[]);
}
 async function loadUsers(){const {data,error}=await supabase.from("profiles").select("id,email,full_name,role,status,created_at").order("created_at"); if(error)setNotice(error.message); else setUsers(data||[]);}
async function signIn(){
  const {error}=await supabase.auth.signInWithOAuth({
    provider:"google",
    options:{redirectTo:window.location.href}
  });
  if(error)setNotice(error.message);
}
 async function save(e){
  e.preventDefault();

  if(form.rest_type!=="none" && !form.rest_person.trim()){
    setNotice("Informe o nome da pessoa.");
    return;
  }
 

  const payload={
    report_date:form.report_date,
    created_by:session.user.id,
    operators:form.operator_names,
    day_off:form.rest_type==="none"?"No":`${form.rest_type}|${form.rest_person.trim()}`,
    hashrate_ph:num(form.hashrate),
    miners_online:num(form.miners_online),
    miners_offline:num(form.miners_offline),
    availability_pct:num(form.availability),
    power_mw:num(form.power_mw),
    month_consumption_kwh:num(form.monthly_kwh),
    generators_running:num(form.generators_online),
    occurrences:form.incidents,
    maintenance:form.maintenance,
    next_shift_pending:form.next_shift_pending,
    supervisor_instructions:form.supervisor_guidance
  };

 
let result;

if(editing){
  const {created_by,...updatePayload}=payload;
  result=await supabase
    .from("daily_reports")
    .update(updatePayload)
    .eq("id",editing)
    .select()
    .single();
}else{
  result=await supabase
    .from("daily_reports")
    .insert(payload)
    .select()
    .single();
}

  if(result.error)setNotice(result.error.message);
  else{
    setNotice("Relatório salvo.");
    setForm(blank);
    setEditing(null);
    loadReports();
  }
 }
 function num(v){return v===""||v===null?null:Number(v);}
 async function statusChange(id,status){const {error}=await supabase.rpc("set_operator_status",{target_user_id:id,new_status:status}); if(error)setNotice(error.message);else {setNotice("Status atualizado.");loadUsers();}}
 function edit(r){
  setEditing(r.id);
  const dayOff = r.day_off || "";
  const oldType = dayOff.toLowerCase();

  setForm({
    report_date:r.report_date,
    operator_names:r.operators||"",
    rest_type:dayOff.includes("|")
      ? dayOff.split("|")[0]
      : (["folga","atestado","banco de horas","falta"].includes(oldType)
          ? oldType
          : (["sí","sim"].includes(oldType) ? "folga" : "none")),
    rest_person:dayOff.includes("|")
      ? dayOff.split("|").slice(1).join("|")
      : "",
    hashrate:r.hashrate_ph??"",
    miners_online:r.miners_online??"",
    miners_offline:r.miners_offline??"",
    availability:r.availability_pct??"",
    power_mw:r.power_mw??"",
    monthly_kwh:r.month_consumption_kwh??"",
    generators_online:r.generators_running??"",
    incidents:r.occurrences||"",
    maintenance:r.maintenance||"",
    next_shift_pending:r.next_shift_pending||"",
    supervisor_guidance:r.supervisor_instructions||""
  });

  window.scrollTo({top:0,behavior:"smooth"});
}
  async function generateQR(r){
  try{
    const url = `${window.location.origin}/?report=${r.id}`;
    const image = await QRCode.toDataURL(url,{
      width:300,
      margin:2,
      errorCorrectionLevel:"H"
    });
    setQrImage(image);
    setQrReport(r);
  }catch(error){
    setNotice("Error al generar el código QR: "+error.message);
  }
}

function shareWhatsApp(r){
  const url = `${window.location.origin}/?report=${r.id}`;
  window.open(
    `https://wa.me/?text=${encodeURIComponent("ADECOAGRO MINING CLOUD - Informe operacional: "+url)}`,
    "_blank"
  );
}
async function exportPdf(r){
  const doc=new jsPDF();
  doc.setFontSize(16);
  doc.text("ADECOAGRO MINING CLOUD",14,18);
  doc.setFontSize(12);
  doc.text(`Relatório diário - ${r.report_date}`,14,29);
  let y=42;
  const rows=[
    ["Operador(es)",r.operators],
    ["Folga / Descanso",r.day_off==="No"?"Sem descanso":r.day_off?.includes("|")?`${r.day_off.split("|")[0]} — ${r.day_off.split("|").slice(1).join("|")}`:r.day_off||"-"],
    ["Hashrate (PH/s)",r.hashrate_ph],
    ["Mineradoras em operação",r.miners_online],
    ["Mineradoras offline",r.miners_offline],
    ["Disponibilidade (%)",r.availability_pct],
    ["Consumo (MW)",r.power_mw],
    ["Consumo do mês (kWh)",r.month_consumption_kwh],
    ["Geradores em operação",r.generators_running],
    ["Ocorrências",r.occurrences],
    ["Manutenções",r.maintenance],
    ["Pendências próximo turno",r.next_shift_pending],
    ["Orientações da supervisão",r.supervisor_instructions]
  ];
  rows.forEach(([a,b])=>{
    let lines=doc.splitTextToSize(`${a}: ${b??"-"}`,180);
    if(y+lines.length*6>280){
      doc.addPage();
      y=18;
    }
    doc.text(lines,14,y);
    y+=lines.length*7;
  });
  doc.save(`adecoagro-${r.report_date}.pdf`);
}

 async function exportJpg(r){const node=document.getElementById(`report-${r.id}`);if(!node)return;const data=await toJpeg(node,{quality:.92,backgroundColor:"#ffffff"});const a=document.createElement("a");a.href=data;a.download=`adecoagro-${r.report_date}.jpg`;a.click();}
 function label(k){
  return ({
    report_date:t.date,
    operator_names:t.operator,
    rest_type:t.rest,
    rest_person:lang==="pt-BR"?"Nome da pessoa":lang==="es-419"?"Nombre de la persona":"Person's name",
    hashrate:t.hash,
    miners_online:t.online,
    miners_offline:t.offline,
    availability:t.availability,
    power_mw:t.power,
    monthly_kwh:t.month,
    generators_online:t.generators,
    incidents:t.events,
    maintenance:t.maintenance,
    next_shift_pending:t.pending,
    supervisor_guidance:t.guidance
  })[k];
}
 if(!configured)return <main className="center"><section className="panel"><h1>ADECOAGRO MINING CLOUD</h1><p>O código está pronto para configurar, mas ainda faltam as credenciais do projeto Supabase.</p><p>Crie um arquivo <code>.env</code> com base em <code>.env.example</code>, preenchendo a URL e a chave publicável do Supabase. Nunca coloque a chave service_role no navegador.</p></section></main>;
 return <main>
 <header>
  <div className="brand-area">
    <img
      src="/adeco-energia.jpg.jpg"
      alt="ADECO ENERGIA"
      className="adeco-logo"
    />
    <div>
      <div className="brand">ADECOAGRO <span>MINING CLOUD</span></div>
      <small>Energia em crescimento</small>
    </div>
  </div><div className="tools"><select value={lang} onChange={e=>{setLang(e.target.value);localStorage.setItem("amc-lang",e.target.value)}}><option value="pt-BR">Português</option><option value="es-419">Español</option><option value="en-US">English</option></select>{session&&<button className="secondary" onClick={()=>supabase.auth.signOut()}>{t.logout}</button>}</div></header>
 {!session?<section className="panel login"><h1>ADECOAGRO MINING CLOUD</h1><p>Plataforma de relatórios operacionais</p><button onClick={signIn}>{t.login}</button></section>:!profile?<section className="panel"><p>Carregando perfil...</p></section>:profile.status!=="approved"&&!isAdmin?<section className="panel"><h2>{profile.status==="blocked"?t.blocked:t.pendingStatus}</h2><p>{profile.status==="blocked"?"Entre em contato com o administrador.":t.waiting}</p></section>:<>
 <section className="panel"><h2>{t.title}</h2><form onSubmit={save}><div className="fields">
{fields.map(k=><label key={k} className={["incidents","maintenance","next_shift_pending","supervisor_guidance"].includes(k)?"wide":""}>
  {label(k)}
  {k==="rest_type"?
    <select value={form.rest_type} onChange={e=>setForm({...form,rest_type:e.target.value})}>
      <option value="none">{lang==="pt-BR"?"Sem descanso":lang==="es-419"?"Sin descanso":"No absence"}</option>
      <option value="folga">{lang==="pt-BR"?"Folga":lang==="es-419"?"Descanso":"Day off"}</option>
      <option value="atestado">{lang==="pt-BR"?"Atestado":lang==="es-419"?"Certificado médico":"Medical leave"}</option>
      <option value="banco de horas">Banco de horas</option>
      <option value="falta">{lang==="pt-BR"?"Falta":lang==="es-419"?"Ausencia":"Absence"}</option>
    </select>
  :k==="rest_person"?
    <input type="text" value={form.rest_person} onChange={e=>setForm({...form,rest_person:e.target.value})} placeholder={lang==="pt-BR"?"Nome da pessoa":lang==="es-419"?"Nombre de la persona":"Person's name"} required={form.rest_type!=="none"}/>
  :["incidents","maintenance","next_shift_pending","supervisor_guidance"].includes(k)?
    <textarea rows="3" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>
  :<input required={k==="report_date"||k==="operator_names"} type={k==="report_date"?"date":k==="operator_names"?"text":"number"} step="any" value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>
  }
</label>)}
 </div><button type="submit">{t.save}</button>{editing&&<button type="button" className="secondary" onClick={()=>{setEditing(null);setForm(blank)}}>Cancelar edição</button>}</form></section>
 
<section className="panel">
  <h2>{t.history}</h2>
  {reports.length===0?<p>{t.noReports}</p>:reports.map(r=>
    <article className="report" id={`report-${r.id}`} key={r.id}>
      <div className="reporthead">
        <h3>{r.report_date} · {r.operators}</h3>
        <div>
          <button className="secondary" onClick={()=>exportPdf(r)}>PDF</button>
          <button className="secondary" onClick={()=>exportJpg(r)}>JPG</button>
          <button className="secondary" onClick={()=>generateQR(r)}>QR</button>
<button className="secondary" onClick={()=>shareWhatsApp(r)}>WhatsApp</button>
          {(r.created_by===session.user.id||isAdmin)&&
            <button className="secondary" onClick={()=>edit(r)}>Editar</button>}
        </div>
      </div>
      <p><b>Hashrate:</b> {r.hashrate_ph??"-"} PH/s · <b>Disponibilidade:</b> {r.availability_pct??"-"}%</p>
      <p><b>Mineradoras:</b> {r.miners_online??"-"} online / {r.miners_offline??"-"} offline · <b>Geradores:</b> {r.generators_running??"-"}/3</p>
      <p><b>Consumo:</b> {r.power_mw??"-"} MW · <b>Mês:</b> {r.month_consumption_kwh??"-"} kWh</p>
      <p><b>Descanso:</b> {r.day_off==="No"?"Sin descanso":r.day_off?.includes("|")?`${r.day_off.split("|")[0]} — ${r.day_off.split("|").slice(1).join("|")}`:r.day_off||"-"}</p>
      {[["Ocorrências",r.occurrences],["Manutenções",r.maintenance],["Pendências",r.next_shift_pending],["Orientações",r.supervisor_instructions]].map(([a,b])=>
        <p key={a}><b>{a}:</b> {b||"-"}</p>
      )}
    </article>
  )}
</section>

 {isAdmin&&<section className="panel"><h2>{t.admin}</h2><p>Administrador principal: {ADMIN}. Limite planejado: 1 administrador + 9 operadores.</p>{users.map(u=><div className="userrow" key={u.id}><span><b>{u.full_name||u.email}</b><small>{u.email} · {u.status} · {u.role}</small></span><span>{u.role!=="admin"&&<><button onClick={()=>statusChange(u.id,"approved")}>Aprovar</button> <button className="danger" onClick={()=>statusChange(u.id,"blocked")}>Bloquear</button></>}</span></div>)}</section>}
 </>}
    {qrReport&&qrImage&&
  <div className="qr-overlay">
    <section className="panel qr-modal">
      <h2>Compartir informe</h2>
      <p>{qrReport.report_date} · {qrReport.operators}</p>
      <img src={qrImage} alt="Código QR del informe" />
      <p>Escanea para abrir este informe.</p>
      <button onClick={()=>shareWhatsApp(qrReport)}>Compartir por WhatsApp</button>
      <button className="secondary" onClick={()=>{setQrReport(null);setQrImage("");}}>Cerrar</button>
    </section>
  </div>
}
 {notice&&<div className="notice" onClick={()=>setNotice("")}>{notice} ×</div>}
<footer>ADECOAGRO · Energia em crescimento</footer>
</main>;
}
