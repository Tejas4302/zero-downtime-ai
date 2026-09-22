"use client";
import { useEffect, useMemo, useState } from "react";
import Protected from "@/components/Protected";
import { apiFetch } from "@/lib/api";
import { Summary } from "@/lib/types";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, Gauge, IndianRupee, TimerReset } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export default function Dashboard(){
 const [data,setData]=useState<Summary[]>([]); const [error,setError]=useState('');
 useEffect(()=>{apiFetch<Summary[]>('/api/summary').then(setData).catch(e=>setError(e.message))},[]);
 const totals=useMemo(()=>data.reduce((a,d)=>({assets:a.assets+d.total_assets,critical:a.critical+d.critical_assets,risk:a.risk+d.downtime_risk_inr,hours:a.hours+d.estimated_downtime_hours,health:a.health+d.avg_health_score}),{assets:0,critical:0,risk:0,hours:0,health:0}),[data]);
 const avg=data.length?totals.health/data.length:0;
 return <Protected><div className="hero"><div><div className="badge badge-low"><span className="status-dot"/> Live operational view</div><h1><span className="gradient-text">Operations intelligence,</span> without the noise.</h1><p>Monitor current asset health, downtime exposure and maintenance urgency across the environments you are authorised to access.</p></div></div>
 {error&&<div className="card error">{error}</div>}
 <div className="grid grid-4">
  {[['Assets',totals.assets,Activity],['Critical assets',totals.critical,AlertTriangle],['Avg health',avg.toFixed(1),Gauge],['Downtime exposure',money(totals.risk),IndianRupee]].map(([label,value,Icon],i)=><motion.div className="card" key={String(label)} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}><div className="metric-label">{label as string}</div><div className="metric-value">{value as any}</div><div className="metric-foot"><Icon size={14} style={{verticalAlign:'middle',marginRight:6}}/>Current authorised scope</div></motion.div>)}
 </div>
 <div className="grid grid-2" style={{marginTop:16}}>
  <div className="card"><div className="section-title" style={{marginTop:0}}><h2>Downtime risk by client</h2><span>INR exposure</span></div><div style={{height:300}}><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)"/><XAxis dataKey="client_name" tick={{fill:'#8fa4ba',fontSize:11}} axisLine={false}/><YAxis tick={{fill:'#8fa4ba',fontSize:11}} axisLine={false}/><Tooltip contentStyle={{background:'#0d1b2e',border:'1px solid rgba(255,255,255,.1)',borderRadius:12}}/><Bar dataKey="downtime_risk_inr" radius={[8,8,0,0]} fill="#5aa7ff"/></BarChart></ResponsiveContainer></div></div>
  <div className="card"><div className="section-title" style={{marginTop:0}}><h2>Client health</h2><span>Current state</span></div><div className="table-wrap"><table><thead><tr><th>Client</th><th>Health</th><th>Critical</th><th>Risk</th></tr></thead><tbody>{data.map(d=><tr key={d.client_name}><td>{d.client_name}</td><td>{d.avg_health_score}</td><td>{d.critical_assets}</td><td>{money(d.downtime_risk_inr)}</td></tr>)}</tbody></table></div><div className="metric-foot" style={{marginTop:14}}><TimerReset size={14} style={{verticalAlign:'middle',marginRight:6}}/>Estimated downtime: {totals.hours} hours</div></div>
 </div></Protected>
}
