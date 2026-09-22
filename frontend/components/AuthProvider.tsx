"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { Me } from "@/lib/types";

const Ctx = createContext<{user:User|null; me:Me|null; loading:boolean}>({user:null,me:null,loading:true});
export function AuthProvider({children}:{children:React.ReactNode}){
  const [user,setUser]=useState<User|null>(null); const [me,setMe]=useState<Me|null>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>onAuthStateChanged(auth, async u=>{
    setUser(u);
    if(u){ try{ setMe(await apiFetch<Me>("/api/me")); }catch{ setMe(null);} } else setMe(null);
    setLoading(false);
  }),[]);
  return <Ctx.Provider value={{user,me,loading}}>{children}</Ctx.Provider>
}
export const useAuth=()=>useContext(Ctx);
