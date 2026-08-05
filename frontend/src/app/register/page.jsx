"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/AppShell";
import { apiRequest } from "@/lib/api";
export default function RegisterPage(){
 const router=useRouter();const [form,setForm]=useState({name:"",email:"",password:""});const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 const submit=async(e)=>{e.preventDefault();setBusy(true);setError("");try{await apiRequest("/auth/register",{method:"POST",body:JSON.stringify(form)});router.push("/dashboard");}catch(err){setError(err.message);}finally{setBusy(false);}};
 return <main className="auth-page"><section className="auth-visual"><Brand dark/><div className="auth-quote"><div className="eyebrow" style={{color:"var(--lime)"}}>Start your journey</div><h2>Skills become powerful when you can prove them.</h2><p style={{color:"#c9dbd1",lineHeight:1.7}}>Learn at your pace, take focused assessments and build a portfolio of verifiable achievement.</p></div><small>Free student account · No card required</small></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><div className="eyebrow">Create account</div><h1>Start learning</h1><p style={{color:"var(--muted)",marginBottom:25}}>Join SkillCert AI in less than a minute.</p>{error&&<div className="form-error">{error}</div>}{[["name","Full name","Your name","text"],["email","Email address","you@example.com","email"],["password","Password","Minimum 6 characters","password"]].map(([key,label,ph,type])=><div className="form-group" key={key}><label>{label}</label><input className="input" type={type} minLength={key==="password"?6:undefined} required value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={ph}/></div>)}<button className="btn btn-primary" style={{width:"100%"}} disabled={busy}>{busy?"Creating account...":"Create student account"}</button><p style={{textAlign:"center",marginTop:20,color:"var(--muted)"}}>Already registered? <Link href="/login" style={{color:"var(--green)",fontWeight:800}}>Sign in</Link></p></form></section></main>;
}
