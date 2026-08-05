"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/AppShell";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form,setForm]=useState({email:"",password:""});
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const submit=async(e)=>{e.preventDefault();setBusy(true);setError("");try{const r=await apiRequest("/auth/login",{method:"POST",body:JSON.stringify(form)});const requestedPath=new URLSearchParams(window.location.search).get("next");router.push(requestedPath||(r.data?.user?.role==="admin"?"/admin":"/dashboard"));}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <main className="auth-page">
    <section className="auth-visual"><Brand dark/><div className="auth-quote"><div className="eyebrow" style={{color:"var(--lime)"}}>Welcome back</div><h2>Continue building skills that deserve to be seen.</h2><p style={{color:"#c9dbd1",lineHeight:1.7}}>Your courses, progress, assessments and verified credentials are waiting.</p></div><small>Secure learning workspace · SkillCert AI</small></section>
    <section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><div className="eyebrow">Sign in</div><h1>Welcome back</h1><p style={{color:"var(--muted)",marginBottom:28}}>Enter your credentials to continue.</p>{error&&<div className="form-error">{error}</div>}<div className="form-group"><label>Email address</label><input className="input" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></div><div className="form-group"><label>Password</label><input className="input" type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="••••••••"/></div><button className="btn btn-primary" style={{width:"100%"}} disabled={busy}>{busy?"Signing in...":"Sign in"}</button><p style={{textAlign:"center",marginTop:22,color:"var(--muted)"}}>New to SkillCert? <Link href="/register" style={{color:"var(--green)",fontWeight:800}}>Create an account</Link></p></form></section>
  </main>;
}
