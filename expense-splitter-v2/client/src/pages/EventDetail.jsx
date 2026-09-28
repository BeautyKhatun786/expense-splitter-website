import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";
import ParticipantsTab from "../components/ParticipantsTab";
import ExpensesTab from "../components/ExpensesTab";
import SummaryTab from "../components/SummaryTab";

const TABS = ["Participants", "Expenses", "Summary", "Settlements"];

export default function EventDetail() {
  const { id } = useParams(); const navigate = useNavigate();
  const [event, setEvent] = useState(null); const [participants, setParticipants] = useState([]); const [expenses, setExpenses] = useState([]); const [summary, setSummary] = useState(null); const [tab, setTab] = useState("Participants"); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [editingEvent, setEditingEvent] = useState(false); const [editForm, setEditForm] = useState({ title: "", description: "", date: "", location: "" });
  const loadAll = useCallback(async () => { try { const [evRes, partRes, expRes, sumRes] = await Promise.all([api.get(`/events/${id}`), api.get(`/events/${id}/participants`), api.get(`/events/${id}/expenses`), api.get(`/events/${id}/summary`)]); setEvent(evRes.data); setEditForm({ title: evRes.data.title, description: evRes.data.description || "", date: evRes.data.date ? evRes.data.date.slice(0,10) : "", location: evRes.data.location || "" }); setParticipants(partRes.data); setExpenses(expRes.data); setSummary(sumRes.data); } catch (err) { setError(err.response?.data?.message || "Could not load group"); } finally { setLoading(false); } }, [id]);
  useEffect(() => { loadAll(); }, [loadAll]);
  const refreshData = () => Promise.all([api.get(`/events/${id}/participants`), api.get(`/events/${id}/expenses`), api.get(`/events/${id}/summary`)]).then(([p,e,s]) => { setParticipants(p.data); setExpenses(e.data); setSummary(s.data); });
  const handleUpdateEvent = async (e) => { e.preventDefault(); try { const { data } = await api.put(`/events/${id}`, editForm); setEvent(data); setEditingEvent(false); } catch (err) { setError(err.response?.data?.message || "Could not update group"); } };
  const handleDeleteEvent = async () => { if (!window.confirm("Delete this group and all its expenses? This can't be undone.")) return; try { await api.delete(`/events/${id}`); navigate("/events"); } catch (err) { setError(err.response?.data?.message || "Could not delete group"); } };
  if (loading) return <p className="loading-text">Loading…</p>; if (error && !event) return <div className="error-banner">{error}</div>;
  return <div>
    <div className="page-head"><div>{!editingEvent ? <><h1>{event.title}</h1><p>{event.date ? new Date(event.date).toLocaleDateString() : "No date set"}{event.location ? ` · ${event.location}` : ""}</p>{event.description && <p>{event.description}</p>}</> : <form onSubmit={handleUpdateEvent} className="card" style={{maxWidth:420}}><div className="field"><label>Title</label><input required value={editForm.title} onChange={e=>setEditForm({...editForm,title:e.target.value})}/></div><div className="field-row"><div className="field"><label>Date</label><input type="date" value={editForm.date} onChange={e=>setEditForm({...editForm,date:e.target.value})}/></div><div className="field"><label>Location</label><input value={editForm.location} onChange={e=>setEditForm({...editForm,location:e.target.value})}/></div></div><div className="field"><label>Description</label><textarea rows={2} value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})}/></div><div style={{display:"flex",gap:8}}><button className="btn">Save</button><button className="btn secondary" type="button" onClick={()=>setEditingEvent(false)}>Cancel</button></div></form>}</div>{!editingEvent && <div style={{display:"flex",gap:8}}><button className="btn secondary" onClick={()=>setEditingEvent(true)}>Edit group</button><button className="btn danger" onClick={handleDeleteEvent}>Delete group</button></div>}</div>
    {error && <div className="error-banner">{error}</div>}
    <div className="tab-row">{TABS.map(t=><button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={()=>setTab(t)}>{t}</button>)}</div>
    {tab==="Participants" && <ParticipantsTab eventId={id} participants={participants} onChange={refreshData}/>} 
    {tab==="Expenses" && <ExpensesTab eventId={id} participants={participants} expenses={expenses} onChange={refreshData}/>} 
    {tab==="Summary" && <SummaryTab eventId={id} summary={summary} onChange={refreshData}/>} 
    {tab==="Settlements" && <SettlementHistory eventId={id} summary={summary} onChange={refreshData}/>} 
  </div>;
}

function SettlementHistory({ eventId, summary, onChange }) {
  const [recorded, setRecorded] = useState([]); const [form, setForm] = useState({from:"",to:"",amount:"",note:""}); const [error,setError]=useState("");
  const load=useCallback(()=>api.get(`/events/${eventId}/settlements`).then(r=>setRecorded(r.data)).catch(e=>setError(e.response?.data?.message||"Could not load settlements")),[eventId]);
  useEffect(()=>{load()},[load]);
  const submit=async e=>{e.preventDefault();setError("");try{await api.post(`/events/${eventId}/settlements`,form);setForm({from:"",to:"",amount:"",note:""});await load();onChange()}catch(err){setError(err.response?.data?.message||"Could not record settlement")}};
  const remove=async id=>{try{await api.delete(`/events/${eventId}/settlements/${id}`);await load();onChange()}catch(err){setError(err.response?.data?.message||"Could not remove settlement")}};
  return <div><div className="card" style={{marginBottom:20}}><div className="section-title">Record a payment</div>{error&&<div className="error-banner">{error}</div>}<form onSubmit={submit}><div className="field-row"><div className="field"><label>Paid by</label><select required value={form.from} onChange={e=>setForm({...form,from:e.target.value})}><option value="">Select person…</option>{summary?.balances.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="field"><label>Paid to</label><select required value={form.to} onChange={e=>setForm({...form,to:e.target.value})}><option value="">Select person…</option>{summary?.balances.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div><div className="field"><label>Amount</label><input type="number" min="0.01" step="0.01" required value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div></div><div className="field"><label>Note</label><input value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Optional"/></div><button className="btn">Mark as settled</button></form></div><div className="card"><div className="section-title">Recorded settlements ({recorded.length})</div>{recorded.length===0?<p className="loading-text">No payments recorded yet.</p>:recorded.map(s=><div className="ledger-row" key={s._id}><div><div className="ledger-name">{s.from?.name} → {s.to?.name}</div><div className="ledger-sub">{new Date(s.date).toLocaleDateString()}{s.note?` · ${s.note}`:""}</div></div><div style={{display:"flex",gap:8,alignItems:"center"}}><span className="ledger-amount">₹{Number(s.amount).toFixed(2)}</span><button className="btn danger small" onClick={()=>remove(s._id)}>Undo</button></div></div>)}</div></div>;
}
