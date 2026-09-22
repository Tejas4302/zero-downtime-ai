"use client";
import { useEffect,useState } from "react";
import Protected from "@/components/Protected";
import RiskBadge from "@/components/RiskBadge";
import { apiFetch } from "@/lib/api";
import { Asset } from "@/lib/types";
const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export default function Alerts(){const [data,setData]=useState<Asset[]>([]);useEffect(()=>{apiFetch<Asset[]>('/api/alerts').then(setData)},[]);return <Protected><div className="hero"><div><h1><span className="gradient-text">Active alerts</span></h1><p>Prioritised maintenance conditions ranked by operational urgency.</p></div></div><div className="grid grid-3">{data.slice(0,12).map(a=><div className="card" key={`${a.client_name}-${a.asset_id}`}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><div><strong>{a.asset_id}</strong><div className="metric-label">{a.equipment_type} · {a.plant_name}</div></div><RiskBadge risk={a.risk_level}/></div><div className="metric-value" style={{fontSize:24,marginTop:18}}>{a.health_score}<span style={{fontSize:13,color:'var(--muted)'}}> / 100</span></div><p style={{fontSize:13,color:'var(--muted)',lineHeight:1.55}}>{a.recommended_action}</p><div className="metric-foot">Potential exposure: {money(a.estimated_downtime_cost_inr)}</div></div>)}</div>{data.length===0&&<div className="empty">No active alerts.</div>}</Protected>}
