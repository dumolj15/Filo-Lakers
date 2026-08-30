const D=window.FILO_DATA;
const P=Object.keys(D.players);
Object.entries(window.FILO_DETAILS||{}).forEach(([p,x])=>{if(D.players[p])Object.assign(D.players[p],x)});
D.games=window.FILO_GAMES||[];
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
let tab='home',leaderSort={key:'pts',dir:-1},openRun=null,openGamesRun=null;
const pct=x=>x==null?'—':(x*100).toFixed(1)+'%';
const n=(x,d=2)=>Number(x??0).toFixed(d);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const perGame=(x,k)=>x.gp?x[k]/x.gp:0;
const statValue=(x,k)=>({gp:x.gp,win_pct:x.win_pct??x.wins/x.gp,pts:x.pts,ppg:x.ppg,fg_pct:x.fg_pct,tp_pct:x.tp_pct,rpg:x.rpg,apg:x.apg,spg:x.spg??perGame(x,'stl'),bpg:x.bpg??perGame(x,'blk'),topg:x.topg??perGame(x,'tov'),pps:x.pps,wins:x.wins,reb:x.reb,ast:x.ast,stl:x.stl,blk:x.blk,tov:x.tov,tpm:x.tpm??0}[k]??0);
const statFmt=(x,k)=>['win_pct','fg_pct','tp_pct'].includes(k)?pct(statValue(x,k)):['ppg','rpg','apg','spg','bpg','topg'].includes(k)?n(statValue(x,k)):k==='pps'?n(statValue(x,k),3):statValue(x,k);
const tableCols=[['gp','GP'],['win_pct','W%'],['pts','PTS'],['ppg','PPG'],['fg_pct','FG%'],['tp_pct','3P%'],['rpg','RPG'],['apg','APG'],['spg','SPG'],['bpg','BPG'],['topg','TOPG'],['pps','PPS']];
function sortPlayers(key=leaderSort.key,dir=leaderSort.dir){return [...P].sort((a,b)=>dir*(statValue(D.players[a],key)-statValue(D.players[b],key))||a.localeCompare(b))}
function rankBy(key){return [...P].sort((a,b)=>statValue(D.players[b],key)-statValue(D.players[a],key))}
function playerLink(p){return P.includes(p)?`<span class="pl" data-profile="${esc(p)}">${esc(p)}</span>`:`<span>${esc(p)}</span>`}
function rows(ps,{sortable=false}={}){return `<div class="tbl"><table><thead><tr><th>Player</th>${tableCols.map(([k,l])=>sortable?`<th><button class="sorthead ${leaderSort.key===k?'active':''}" data-sort="${k}">${l}${leaderSort.key===k?(leaderSort.dir===-1?' ↓':' ↑'):''}</button></th>`:`<th>${l}</th>`).join('')}</tr></thead><tbody>${ps.map(p=>{const x=D.players[p];return `<tr><td>${playerLink(p)}</td>${tableCols.map(([k])=>`<td>${statFmt(x,k)}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`}
function featureCard(title,copy,target){return `<div class="card click" data-tabjump="${target}"><div class="kicker">Interactive</div><div class="pn">${title}</div><p>${copy}</p></div>`}
function home(){const s=rankBy('pts')[0],r=rankBy('reb')[0],a=rankBy('ast')[0],w=rankBy('win_pct')[0];return `<section class="hero"><div class="eye">Stats through Run ${D.through_run}</div><h1>Pickup basketball,<br>treated like a league.</h1><p>Career stats, shooting profiles, real lineup chemistry, fair-team generators and full run history for the Filo Lakers.</p></section><div class="grid g4"><div class="card"><div class="big">${s}</div><div class="lab">Scoring leader · ${D.players[s].pts}</div></div><div class="card"><div class="big">${r}</div><div class="lab">Rebound leader · ${D.players[r].reb}</div></div><div class="card"><div class="big">${a}</div><div class="lab">Assist leader · ${D.players[a].ast}</div></div><div class="card"><div class="big">${w}</div><div class="lab">Win% leader · ${pct(D.players[w].win_pct)}</div></div></div><div class="sec"><div><h2>Current leaderboard</h2><p>Official career totals.</p></div></div>${rows(rankBy('pts').slice(0,8))}<div class="sec"><div><h2>Latest run</h2><p>Most recent recorded session.</p></div></div>${runSummary(D.runs.at(-1))}<div class="sec"><div><h2>Explore the league</h2></div></div><div class="grid g3">${featureCard('Chemistry Lab','Real duo and trio records from shared games.','chemistry')}${featureCard('Lineup Lab','Build a five or split ten players into fair teams.','lineup')}${featureCard('Player Profiles','Shot-zone scoring and efficiency breakdowns.','players')}</div>`}
function leaders(){const ps=sortPlayers();return `<section class="hero"><div class="eye">All-time</div><h1>Leaderboards</h1><p>Click any column heading to rank the league by that statistic. Click it again to reverse the order.</p></section><div class="note" style="margin-bottom:14px">Currently sorted by <b>${tableCols.find(x=>x[0]===leaderSort.key)?.[1]||leaderSort.key}</b> ${leaderSort.dir===-1?'high to low':'low to high'}.</div>${rows(ps,{sortable:true})}`}
