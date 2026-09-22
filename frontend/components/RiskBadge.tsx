export default function RiskBadge({risk}:{risk:string}){
  const c=risk.toLowerCase(); return <span className={`badge badge-${c}`}>{risk}</span>
}
