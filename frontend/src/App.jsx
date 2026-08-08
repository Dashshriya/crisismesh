import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Radio, ShieldAlert, Users, Wifi, Zap } from 'lucide-react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from 'react-leaflet';

const API='http://localhost:8000';
const fallbackIncidents=[
 {id:'INC-1042',type:'Structural collapse',severity:'CRITICAL',lat:22.2437,lng:84.8050,people:7,status:'RESCUE_REQUIRED'},
 {id:'INC-1041',type:'Medical emergency',severity:'HIGH',lat:22.2520,lng:84.8180,people:2,status:'TEAM_ASSIGNED'},
 {id:'INC-1040',type:'Flooded road',severity:'MEDIUM',lat:22.2300,lng:84.7900,people:0,status:'MONITORING'}
];
const nodes=[
 {id:'NODE-01',kind:'COMMAND',lat:22.248,lng:84.807},
 {id:'NODE-17',kind:'RELAY',lat:22.245,lng:84.801},
 {id:'NODE-23',kind:'VOLUNTEER',lat:22.250,lng:84.813},
 {id:'NODE-31',kind:'RESCUE',lat:22.241,lng:84.817}
];
const severityClass=s=>s==='CRITICAL'?'critical':s==='HIGH'?'high':'medium';

export default function App(){
 const [incidents,setIncidents]=useState(fallbackIncidents),[live,setLive]=useState(false),[toast,setToast]=useState('');
 useEffect(()=>{
  fetch(`${API}/api/incidents`).then(r=>r.json()).then(setIncidents).catch(()=>{});
  const ws=new WebSocket('ws://localhost:8000/ws');
  ws.onopen=()=>setLive(true); ws.onclose=()=>setLive(false);
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.event==='sos_created'){setIncidents(x=>[m.incident,...x]);setToast('New SOS received — triage queue updated');setTimeout(()=>setToast(''),4000)}};
  return()=>ws.close();
 },[]);
 const critical=incidents.filter(x=>x.severity==='CRITICAL').length,center=[22.2448,84.8075];
 const links=useMemo(()=>nodes.slice(1).map(n=>[center,[n.lat,n.lng]]),[]);
 const simulate=async()=>{const payload={emergency_type:'Medical emergency',people:2,message:'Demo SOS — immediate assistance requested',lat:22.248,lng:84.812};try{await fetch(`${API}/api/sos`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})}catch{const x={id:`SOS-${Date.now().toString().slice(-4)}`,...payload,severity:'HIGH',status:'TRIAGE_PENDING'};setIncidents(v=>[x,...v]);setToast('Demo SOS created — triage queue updated');setTimeout(()=>setToast(''),4000)}};
 return <div className="app">
  <header><div className="brand"><div className="logo"><ShieldAlert size={22}/></div><div><h1>CRISIS<span>MESH</span></h1><p>EMERGENCY OPERATIONS NETWORK</p></div></div><div className="header-meta"><span><i className={`dot ${live?'online':''}`}/>{live?'REALTIME LINK':'SIMULATION MODE'}</span><b>COMMAND CENTER</b></div></header>
  {toast&&<div className="toast"><Zap size={16}/>{toast}</div>}
  <main>
   <section className="stats">{[['ACTIVE INCIDENTS',incidents.length,Activity],['CRITICAL SOS',critical,ShieldAlert],['CONNECTED NODES','247',Wifi],['RESCUE TEAMS','18',Users],['PEOPLE ASSISTED','83',Users],['NETWORK HEALTH','94%',Radio]].map(([label,value,Icon])=><div className="stat" key={label}><div><span>{label}</span><Icon size={15}/></div><strong>{value}</strong></div>)}</section>
   <div className="primary-grid">
    <section className="panel map-panel"><div className="panel-head"><div><p>LIVE SITUATION MAP</p><h2>Rourkela Response Grid</h2></div><span className="live">● LIVE</span></div><div className="map-wrap"><MapContainer center={center} zoom={13} scrollWheelZoom className="map"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{links.map((p,i)=><Polyline key={i} positions={p} pathOptions={{color:'#38bdf8',weight:1.5,dashArray:'5 8',opacity:.55}}/>)}{nodes.map(n=><CircleMarker key={n.id} center={[n.lat,n.lng]} radius={7} pathOptions={{color:'#38bdf8',fillOpacity:.8}}><Tooltip>{n.id} · {n.kind}</Tooltip></CircleMarker>)}{incidents.map(i=><CircleMarker key={i.id} center={[i.lat,i.lng]} radius={i.severity==='CRITICAL'?12:9} pathOptions={{color:i.severity==='CRITICAL'?'#fb7185':i.severity==='HIGH'?'#fb923c':'#facc15',fillOpacity:.78,weight:2}}><Tooltip><b>{i.id}</b><br/>{i.type}<br/>{i.people} affected</Tooltip></CircleMarker>)}</MapContainer><div className="legend"><span><i className="critical"/>Critical</span><span><i className="high"/>High</span><span><i className="medium"/>Medium</span><span><i className="node"/>Mesh node</span></div></div></section>
    <aside className="panel"><div className="panel-head"><div><p>PRIORITY QUEUE</p><h2>Active Incidents</h2></div><AlertTriangle size={18}/></div><div className="incident-list">{incidents.map(i=><article className="incident" key={i.id}><div><div className="tags"><span className={`severity ${severityClass(i.severity)}`}>{i.severity}</span><span className="id">{i.id}</span></div><h3>{i.type}</h3><p>{i.people} people affected · {i.status.replaceAll('_',' ')}</p></div><span className="chev">›</span></article>)}</div><button className="sos" onClick={simulate}><ShieldAlert size={18}/> SIMULATE SOS</button></aside>
   </div>
   <section className="bottom-grid"><div className="panel card"><p>MESH NETWORK</p><h2>Resilient relay fabric</h2><div className="network"><div className="core"><Radio size={20}/><small>COMMAND</small></div>{nodes.slice(1).map((n,i)=><div className="relay" style={{left:`${20+i*28}%`,top:`${60-(i%2)*28}%`}} key={n.id}><span/><small>{n.kind}</small></div>)}</div><em>4 active nodes · 3 relay paths · simulated failover ready</em></div><div className="panel card"><p>AI TRIAGE</p><h2>Decision support</h2><div className="ai-box"><div className="ai-icon">✦</div><div><b>Priority: CRITICAL</b><span>Structural collapse with 7 affected people. Recommend immediate rescue + medical dispatch.</span></div></div><div className="confidence"><span>Model confidence</span><strong>92%</strong></div></div><div className="panel card"><p>RESPONSE PULSE</p><h2>Operational health</h2><div className="bars">{[55,72,48,86,68,91,77,94].map((h,i)=><i key={i} style={{height:`${h}%`}}/>)}</div><div className="metric"><span>Median response time</span><b>04:18</b></div></div></section>
  </main>
 </div>
}
