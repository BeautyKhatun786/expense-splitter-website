import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function Dashboard() {
  const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
  useEffect(()=>{api.get("/dashboard").then(r=>setData(r.data)).catch(e=>setError(e.response?.data?.message||"Could not load dashboard")).finally(()=>setLoading(false))},[]);
  return <div><div className="page-head"><div><h1>Dashboard</h1><p>Your group expenses at a glance.</p></div><Link to="/events" className="btn">+ New group</Link></div>{error&&<div className="error-banner">{error}</div>}{loading&&<p className="loading-text">Loading…</p>}{data&&<><div className="stat-grid"><div className="stat-card"><div className="stat-label">Total groups</div><div className="stat-value">{data.totalEvents}</div></div><div className="stat-card"><div className="stat-label">You owe</div><div className="stat-value">₹{Number(data.youOwe).toFixed(2)}</div></div><div className="stat-card"><div className="stat-label">You get</div><div className="stat-value">₹{Number(data.youGet).toFixed(2)}</div></div><div className="stat-card"><div className="stat-label">Total expenses</div><div className="stat-value">₹{Number(data.totalExpenses).toFixed(2)}</div></div></div><div className="section-title">Recent activity</div><div className="card">{!data.recentActivities.length?<p className="loading-text">No activity yet. Create a group and add an expense to get started.</p>:<ul className="activity-list">{data.recentActivities.map(a=><li key={a.id}><span>{a.description}</span><span className="activity-date">{new Date(a.date).toLocaleDateString()}</span></li>)}</ul>}</div></>}</div>;
}
