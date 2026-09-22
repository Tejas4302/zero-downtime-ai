"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import AppShell from "./AppShell";
export default function Protected({children}:{children:React.ReactNode}){
  const {user,loading}=useAuth(); const router=useRouter();
  useEffect(()=>{if(!loading&&!user) router.replace('/login')},[loading,user,router]);
  if(loading||!user) return <div className="loading"><div><div className="pulse"/>Loading secure workspace…</div></div>;
  return <AppShell>{children}</AppShell>
}
