"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Bell, Bot, Boxes, LayoutDashboard, LogOut, Settings, ShieldCheck, Users } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";

const nav=[
  ["/dashboard","Overview",LayoutDashboard],
  ["/assets","Assets",Boxes],
  ["/alerts","Alerts",Bell],
  ["/copilot","AI Copilot",Bot],
  ["/users","Users",Users],
  ["/settings","Settings",Settings],
] as const;

export default function AppShell({children}:{children:React.ReactNode}){
  const path=usePathname(); const router=useRouter(); const {me}=useAuth();
  const visible=nav.filter(([href])=> href!=="/users" || me?.role!=="standard");
  return <div className="page-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Activity size={19}/></div><div><div className="brand-name">Zero Downtime</div><div className="brand-sub">Industrial Intelligence</div></div></div>
      <div className="nav-section">Workspace</div>
      {visible.map(([href,label,Icon])=><Link key={href} href={href} className={`nav-link ${path===href?"active":""}`}><Icon size={17}/>{label}</Link>)}
      <div className="nav-section">Session</div>
      <button className="nav-link" style={{width:"100%",border:0,background:"transparent"}} onClick={async()=>{await signOut(auth);router.push('/login')}}><LogOut size={17}/>Sign out</button>
    </aside>
    <main className="main">
      <header className="topbar"><div className="top-title"><strong>{me?.role==="super_admin"?"Platform Command Center":me?.client_id?.toUpperCase()}</strong><br/>Secure multi-tenant operations</div><div className="user-pill"><ShieldCheck size={16}/><div><div style={{fontSize:12,fontWeight:700}}>{me?.email}</div><div style={{fontSize:11,color:"var(--muted)"}}>{me?.role?.replaceAll('_',' ')}</div></div><div className="avatar">{me?.email?.slice(0,2).toUpperCase()}</div></div></header>
      <motion.div className="content" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.35,ease:"easeOut"}}>{children}</motion.div>
    </main>
  </div>
}
