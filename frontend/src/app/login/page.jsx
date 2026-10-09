"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form,setForm]=useState({email:"",password:""});
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  const submit=async(e)=>{e.preventDefault();setBusy(true);setError("");try{const r=await apiRequest("/auth/login",{method:"POST",body:JSON.stringify(form)});const requestedPath=new URLSearchParams(window.location.search).get("next");router.push(requestedPath||(r.data?.user?.role==="admin"?"/admin":"/dashboard"));}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <><MainHeader /><main className="auth-page auth-page-with-header auth-page-single"><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><div className="eyebrow">Sign in</div><h1>Welcome back</h1><p className="auth-description">Enter your credentials to continue.</p>{error&&<div className="form-error">{error}</div>}<div className="form-group"><label htmlFor="login-email">Email address</label><input id="login-email" className="input" type="email" autoComplete="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Enter your email"/></div><div className="form-group"><label htmlFor="login-password">Password</label><input id="login-password" className="input" type="password" autoComplete="current-password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Enter your password"/></div><button className="btn btn-primary" style={{width:"100%"}} disabled={busy}>{busy?"Signing in...":"Sign in"}</button><p className="auth-signup">New to SkillCert? <Link href="/register">Create an account</Link></p></form></section></main><Footer /></>;
}