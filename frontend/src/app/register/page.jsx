"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MainHeader from "@/components/MainHeader";
import Footer from "@/components/Footer";
import { apiRequest, saveSessionToken } from "@/lib/api";
export default function RegisterPage(){
 const router=useRouter();const [form,setForm]=useState({name:"",email:"",password:""});const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 const submit=async(e)=>{e.preventDefault();setBusy(true);setError("");try{const response=await apiRequest("/auth/register",{method:"POST",body:JSON.stringify(form)});saveSessionToken(response.data?.token);router.push("/dashboard");}catch(err){setError(err.message);}finally{setBusy(false);}};
 return <><MainHeader/><main className="auth-page auth-page-with-header auth-page-single"><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><div className="eyebrow">Create account</div><h1>Start learning</h1><p className="auth-description" style={{marginBottom:25}}>Join SkillCert AI in less than a minute.</p>{error&&<div className="form-error">{error}</div>}{[["name","Full name","Your name","text"],["email","Email address","Enter your email","email"],["password","Password","Enter your password","password"]].map(([key,label,ph,type])=><div className="form-group" key={key}><label htmlFor={`register-${key}`}>{label}</label><input id={`register-${key}`} className="input" type={type} autoComplete={key==="name"?"name":key==="email"?"email":"new-password"} minLength={key==="password"?6:undefined} required value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={ph}/></div>)}<button className="btn btn-primary" style={{width:"100%"}} disabled={busy}>{busy?"Creating account...":"Create student account"}</button><p className="auth-signup" style={{marginTop:20}}>Already registered? <Link href="/login">Sign in</Link></p></form></section></main><Footer/></>;
}
