const D=window.FILO_DATA;
const P=Object.keys(D.players);
Object.entries(window.FILO_DETAILS||{}).forEach(([p,x])=>{if(D.players[p])Object.assign(D.players[p],x)});
D.games=window.FILO_GAMES||[];
D.physicals=window.FILO_PHYSICALS||{};
function combinations(arr,k){const out=[];function rec(start,cur){if(cur.length===k){out.push([...cur]);return}for(let i=start;i<arr.length;i++)rec(i+1,[...cur,arr[i]])}rec(0,[]);return out}
function buildChemistry(){
  const pairs=new Map(),trios=new Map();
  const add=(map,players,win,margin)=>{const key=[...players].sort().join('|'),x=map.get(key)||{players:[...players].sort(),gp:0,wins:0,margin:0};x.gp++;x.wins+=win?1:0;x.margin+=margin;map.set(key,x)};
  D.games.forEach(g=>{
    [[g.team1,g.score1>g.score2,g.score1-g.score2],[g.team2,g.score2>g.score1,g.score2-g.score1]].forEach(([team,win,margin])=>{
      const current=team.filter(p=>P.includes(p));
      combinations(current,2).forEach(c=>add(pairs,c,win,margin));
      combinations(current,3).forEach(c=>add(trios,c,win,margin));
    });
  });
  const finish=map=>[...map.values()].map(x=>({...x,win_pct:x.wins/x.gp,avg_margin:x.margin/x.gp}));
  return {pairs:finish(pairs),trios:finish(trios)};
}
let CHEM=null;
const app=document.getElementById('app');
let tab='home',leaderSort={totals:{key:'pts',dir:-1},rates:{key:'ppg',dir:-1}},openRun=null,openGamesRun=null;
const pct=x=>x==null?'—':(x*100).toFixed(1)+'%';
const n=(x,d=2)=>Number(x??0).toFixed(d);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const perGame=(x,k)=>x.gp?x[k]/x.gp:0;
const statValue=(x,k)=>({
  gp:x.gp,wins:x.wins,losses:x.gp-x.wins,win_pct:x.win_pct??x.wins/x.gp,
  pts:x.pts,ppg:x.ppg,reb:x.reb,rpg:x.rpg,ast:x.ast,apg:x.apg,stl:x.stl,spg:x.spg??perGame(x,'stl'),
  blk:x.blk,bpg:x.bpg??perGame(x,'blk'),tov:x.tov,topg:x.topg??perGame(x,'tov'),
  fgm:x.fgm??0,fga:x.fga??0,fg_pct:x.fg_pct,tpm:x.tpm??0,tpa:x.tpa??0,tp_pct:x.tp_pct,pps:x.pps
}[k]??0);
const statFmt=(x,k)=>['win_pct','fg_pct','tp_pct'].includes(k)?pct(statValue(x,k)):['ppg','rpg','apg','spg','bpg','topg'].includes(k)?n(statValue(x,k)):k==='pps'?n(statValue(x,k),3):statValue(x,k);
const totalCols=[['gp','GP'],['wins','W'],['losses','L'],['pts','PTS'],['reb','REB'],['ast','AST'],['stl','STL'],['blk','BLK'],['tov','TOV'],['fgm','FGM'],['fga','FGA'],['tpm','3PM'],['tpa','3PA']];
const rateCols=[['win_pct','W%'],['ppg','PPG'],['rpg','RPG'],['apg','APG'],['spg','SPG'],['bpg','BPG'],['topg','TOPG'],['fg_pct','FG%'],['tp_pct','3P%'],['pps','PPS']];
const tableCols=[['gp','GP'],['win_pct','W%'],['pts','PTS'],['ppg','PPG'],['fg_pct','FG%'],['tp_pct','3P%'],['rpg','RPG'],['apg','APG'],['spg','SPG'],['bpg','BPG'],['topg','TOPG'],['pps','PPS']];
function sortPlayers(key,dir=-1){return [...P].sort((a,b)=>dir*(statValue(D.players[a],key)-statValue(D.players[b],key))||a.localeCompare(b))}
function rankBy(key){return sortPlayers(key,-1)}
function playerLink(p){return P.includes(p)?`<span class="pl" data-profile="${esc(p)}">${esc(p)} <span class="inline-arrow" aria-hidden="true">›</span></span>`:`<span>${esc(p)}</span>`}
function rows(ps,{sortable=false,cols=tableCols,board='rates'}={}){const state=leaderSort[board]||{key:'pts',dir:-1};return `<div class="tbl"><table><thead><tr><th>Player</th>${cols.map(([k,l])=>sortable?`<th><button class="sorthead ${state.key===k?'active':''}" data-sort="${k}" data-sort-board="${board}">${l}${state.key===k?(state.dir===-1?' ↓':' ↑'):''}</button></th>`:`<th>${l}</th>`).join('')}</tr></thead><tbody>${ps.map(p=>{const x=D.players[p];return `<tr><td>${playerLink(p)}</td>${cols.map(([k])=>`<td>${statFmt(x,k)}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`}
function featureCard(title,copy,target){return `<div class="card click clickcard" data-tabjump="${target}"><div class="clickcue" aria-hidden="true">›</div><div class="kicker">Interactive</div><div class="pn">${title}</div><p>${copy}</p><div class="taplabel">Open <span>→</span></div></div>`}
function aggregateScoringMix(){const mix={Close:0,Midrange:0,Three:0};P.forEach(p=>Object.entries(D.players[p].ranges||{}).forEach(([k,z])=>{if(mix[k]!=null)mix[k]+=z.pts||0}));return mix}
function donut(values,labels){const total=values.reduce((a,b)=>a+b,0)||1;let cursor=0;const segs=values.map((v,i)=>{const a=cursor,b=cursor+v/total*360;cursor=b;return `var(--chart-${i+1}) ${a}deg ${b}deg`}).join(',');return `<div class="donutwrap"><div class="donut" style="background:conic-gradient(${segs})"><div><b>${total}</b><span>points</span></div></div><div class="legend">${labels.map((l,i)=>`<span><i class="swatch s${i+1}"></i>${l} <b>${values[i]}</b></span>`).join('')}</div></div>`}
function home(){const s=rankBy('pts')[0],r=rankBy('reb')[0],a=rankBy('ast')[0],w=rankBy('win_pct')[0];return `<section class="hero"><div class="eye">Stats through Run ${D.through_run}</div><h1>Pickup basketball,<br>treated like a league.</h1><p>Career stats, shooting profiles, real lineup chemistry, fair-team generators and full run history for the Filo Lakers.</p></section><div class="grid g4"><div class="card"><div class="big">${s}</div><div class="lab">Scoring leader · ${D.players[s].pts}</div></div><div class="card"><div class="big">${r}</div><div class="lab">Rebound leader · ${D.players[r].reb}</div></div><div class="card"><div class="big">${a}</div><div class="lab">Assist leader · ${D.players[a].ast}</div></div><div class="card"><div class="big">${w}</div><div class="lab">Win% leader · ${pct(D.players[w].win_pct)}</div></div></div><div class="sec"><div><h2>Current leaderboard</h2><p>Official career totals.</p></div></div>${rows(rankBy('pts').slice(0,8))}<div class="sec"><div><h2>Latest run</h2><p>Most recent recorded session.</p></div></div>${runSummary(D.runs.at(-1))}<div class="sec"><div><h2>Explore the league</h2></div></div><div class="grid g3">${featureCard('Chemistry Lab','Real duo and trio records from shared games.','chemistry')}${featureCard('Lineup Lab','Build a five or split ten players into fair teams.','lineup')}${featureCard('Player Profiles','Shot-zone scoring and efficiency breakdowns.','players')}</div>`}
function leaders(){const ts=leaderSort.totals,rs=leaderSort.rates;const mix=aggregateScoringMix();return `<section class="hero"><div class="eye">All-time</div><h1>Leaderboards</h1><p>Every major career total plus per-game and efficiency rates. Click any column heading to rank the league by that statistic.</p></section><div class="grid g2 visualgrid"><div class="card"><div class="kicker">League scoring mix</div><h3>Where all recorded points come from</h3>${donut([mix.Close,mix.Midrange,mix.Three],['Close','Midrange','Three'])}</div><div class="card"><div class="kicker">Current leaders</div><h3>All-time category leaders</h3>${[['pts','PTS'],['reb','REB'],['ast','AST'],['stl','STL'],['blk','BLK'],['tpm','3PM']].map(([k,l])=>{const p=rankBy(k)[0];return `<div class="leaderbar"><span>${l}</span><b>${playerLink(p)}</b><i>${statValue(D.players[p],k)}</i></div>`}).join('')}</div></div><div class="sec"><div><h2>Career totals</h2><p>Counting stats accumulated across every recorded game.</p></div><span class="sortnote">Sorted by ${totalCols.find(x=>x[0]===ts.key)?.[1]} ${ts.dir===-1?'↓':'↑'}</span></div>${rows(sortPlayers(ts.key,ts.dir),{sortable:true,cols:totalCols,board:'totals'})}<div class="sec"><div><h2>Per-game & efficiency</h2><p>Rate stats and shooting efficiency.</p></div><span class="sortnote">Sorted by ${rateCols.find(x=>x[0]===rs.key)?.[1]} ${rs.dir===-1?'↓':'↑'}</span></div>${rows(sortPlayers(rs.key,rs.dir),{sortable:true,cols:rateCols,board:'rates'})}`}
