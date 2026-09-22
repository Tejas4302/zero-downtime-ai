"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Activity, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function Login(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{await signInWithEmailAndPassword(auth,email,password);router.push('/dashboard')}catch{setError('Unable to sign in. Check your email and password.')}finally{setBusy(false)}}
 return <div className="login-page">
   <section className="login-art"><div className="brand" style={{position:'relative',zIndex:2}}><div className="brand-mark"><Activity size={19}/></div><div><div className="brand-name">Zero Downtime</div><div className="brand-sub">Predict. Prevent. Perform.</div></div></div><div className="orb one"/><div className="orb two"/><motion.div className="big-copy" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.65}}><div className="badge badge-low" style={{marginBottom:18}}><Sparkles size={12}/> Gemini-powered industrial intelligence</div><h2><span className="gradient-text">See risk before</span><br/>production sees downtime.</h2><p>One secure command center for asset health, failure intelligence, maintenance prioritisation and operational decision support.</p></motion.div><div style={{position:'relative',zIndex:2,color:'#6f849b',fontSize:12}}>AI Builder Cup 2026 · Manufacturing Intelligence</div></section>
   <section className="login-panel"><motion.form className="login-card" onSubmit={submit} initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}}><div className="badge badge-medium" style={{marginBottom:18}}><ShieldCheck size={12}/> Secure tenant access</div><h1>Welcome back</h1><p>Sign in to your Zero Downtime workspace.</p><div className="field"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.demo" required/></div><div className="field"><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></div><button className="login-btn" disabled={busy}>{busy?'Signing in…':<>Sign in <ArrowRight size={16} style={{verticalAlign:'middle'}}/></>}</button>{error&&<div className="error">{error}</div>}<div className="hint">Access is isolated by client and role. Your session is verified through Firebase Authentication and the Zero Downtime Cloud Run API.</div></motion.form></section>
 </div>
}
