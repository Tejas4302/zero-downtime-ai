"use client";
import Protected from "@/components/Protected";
import { useAuth } from "@/components/AuthProvider";
export default function Users(){const {me}=useAuth();return <Protected><div className="hero"><div><h1><span className="gradient-text">User management</span></h1><p>Role-aware access controls for platform and client administrators.</p></div></div><div className="card">{me?.role==='standard'?<div className="empty">You do not have permission to manage users.</div>:<div><h3>Ready for admin workflows</h3><p style={{color:'var(--muted)',lineHeight:1.6}}>The identity model is already live in Firebase Authentication and Firestore. The next API extension can expose tenant-safe user listing, invitation and status-management actions here.</p></div>}</div></Protected>}
