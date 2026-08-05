"use client";
import Link from "next/link";
import {useParams} from "next/navigation";
import {useEffect,useState} from "react";
import AppShell,{Loading,StatusBadge} from "@/components/AppShell";
import {apiRequest} from "@/lib/api";
export default function ResultPage(){
 const {testId}=useParams();const [data,setData]=useState(null),[loading,setLoading]=useState(true);
 useEffect(()=>{apiRequest(`/tests/${testId}/result`).then(r=>setData(r.data)).finally(()=>setLoading(false));},[testId]);
 const t=data?.test;return <AppShell>{loading?<Loading/>:<><div className="result-hero"><div><div className="eyebrow" style={{color:"var(--lime)"}}>Assessment complete</div><h1 style={{fontSize:38,margin:"10px 0"}}>{t?.passed?"You passed with confidence.":"Keep going—you’re building mastery."}</h1><p style={{color:"#d6e5dd"}}>{t?.correctAnswers} correct · {t?.wrongAnswers} incorrect · Attempt {t?.attemptNumber}</p>{data?.certificate&&<Link className="btn btn-outline" href={`/certificate/${data.certificate.certificateId}`}>View certificate</Link>}</div><div className="score-ring">{t?.score}%</div></div><div className="page-head"><div><h2 style={{fontSize:24}}>Answer review</h2><p>Understand every answer and improve your next attempt.</p></div><StatusBadge value={t?.status}/></div><div style={{display:"grid",gap:14}}>{t?.questions?.map((q,i)=><div className="card" key={q._id}><div style={{display:"flex",justifyContent:"space-between",gap:20}}><div><small style={{color:"var(--muted)"}}>Question {i+1} · {q.type.replace("_"," ")}</small><h3 style={{margin:"8px 0 12px"}}>{q.question}</h3></div><span className={`badge badge-${q.isCorrect?"success":"danger"}`}>{q.isCorrect?"Correct":"Incorrect"}</span></div><p><strong>Your answer:</strong> {q.userAnswer||"No answer"}</p><p><strong>Feedback:</strong> {q.aiFeedback||q.explanation}</p></div>)}</div></>}</AppShell>
}
