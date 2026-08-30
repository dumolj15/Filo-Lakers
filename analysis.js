let analysisMessages=[];
let analysisPlayer=null;
let analysisBusy=false;
const ANALYSIS_MAX_MESSAGES=15;

function analysisStatPick(x){
  const keys=['gp','wins','pts','reb','ast','stl','blk','tov','fgm','fga','tpm','tpa','ppg','rpg','apg','spg','bpg','topg','fg_pct','tp_pct','pps','win_pct','avg_margin'];
  const out={};
  keys.forEach(k=>{if(x&&x[k]!=null&&Number.isFinite(Number(x[k])))out[k]=Number(x[k])});
  return out;
}

function buildAnalysisStats(p){
  const x=D.players[p]||{};
  const runByRun={};
  Object.entries(x.runs||{}).forEach(([rn,s])=>{runByRun[rn]=analysisStatPick(s)});
  const gameByGame=[];
  Object.entries(D.boxscores||{}).forEach(([key,rows])=>{
    const row=(rows||[]).find(r=>r[0]===p);
    if(!row)return;
    const [,team,pts,fgm,fga,tpm,tpa,reb,ast,stl,blk,tov]=row;
    gameByGame.push({game:key,team,pts,fgm,fga,tpm,tpa,reb,ast,stl,blk,tov});
  });
  return {
    through_run:D.through_run||window.FILO_DATA?.through_run||null,
    selected_player:p,
    career:analysisStatPick(x),
    run_by_run:runByRun,
    game_by_game:gameByGame,
    league_career:P.map(name=>({name,...analysisStatPick(D.players[name])})),
    scope:'Recorded counting stats and simple rates derived from those counting stats only.',
    unavailable_data:['Shot-selection metadata is saved as a future project but is incomplete/unreleased and must not be used or inferred.']
  };
}

function analysisEscape(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function analysisMessageHTML(m){return `<div class="analysis-msg ${m.role}"><div class="analysis-msg-label">${m.role==='user'?'You':'Filo AI'}</div><div class="analysis-bubble">${analysisEscape(m.text).replace(/\n/g,'<br>')}</div></div>`}
function analysisUserCount(){return analysisMessages.filter(m=>m.role==='user').length}

function analysis(){
  if(!analysisPlayer||!P.includes(analysisPlayer))analysisPlayer=P[0];
  const options=P.map(p=>`<option value="${p}" ${p===analysisPlayer?'selected':''}>${p}</option>`).join('');
  return `<section class="hero analysis-hero"><div class="eye">Experimental feature</div><h1>AI Analysis <span class="analysis-wip">Work in Progress</span></h1><p>Have a conversation about your Filo Lakers numbers and look for useful statistical patterns, strengths, trends and areas to explore.</p></section>
  <div class="analysis-warning card"><div class="analysis-warning-icon">!</div><div><h3>Stats only — not film analysis</h3><p>This assistant only sees recorded counting stats and simple rates calculated from them. It cannot see film, shot quality, defensive assignments, positioning, effort, injuries, matchup difficulty, decision-making or anything else we did not record.</p><p><b>Interpret its advice as statistical evidence, not a complete evaluation of your basketball game.</b></p></div></div>
  <div class="analysis-layout">
    <aside class="card analysis-guide"><div class="kicker">What it can do</div><h3>Good questions to ask</h3><div class="analysis-examples"><span>How has my production changed recently?</span><span>What are my strongest stats relative to the group?</span><span>Where do my numbers suggest room to improve?</span><span>How does my profile compare with another player?</span><span>What changed between two runs?</span><span>Give me three statistical focuses for next run.</span></div><div class="analysis-limit"><b>What it cannot know</b><p>It cannot decide whether a shot was good or bad, whether a defensive rotation was correct, or why a play happened unless the recorded numbers directly support that conclusion.</p></div><div class="analysis-limit"><b>Planned data</b><p><strong>Shot-selection metadata</strong> is a saved future project. Some of it exists, but coverage is incomplete and tedious to backfill, so those fields are intentionally treated as unreleased/blank for now and are not used by this AI.</p></div></aside>
    <section class="card analysis-chat-card">
      <div class="analysis-chat-head"><div><div class="kicker">Ask Filo AI</div><h3>Statistical player analysis</h3></div><div class="analysis-player-select"><label for="analysisPlayer">Analyze</label><select id="analysisPlayer">${options}</select></div></div>
      <div class="analysis-session-note"><span>Session-only chat</span> This conversation clears when you leave the Analysis tab.</div>
      <div class="analysis-starters">
        <button data-analysis-prompt="Analyze my statistical profile. What stands out most?">Analyze my game</button>
        <button data-analysis-prompt="Based only on my recorded stats, what are the clearest areas I could improve?">What should I improve?</button>
        <button data-analysis-prompt="How have I been playing over my most recent runs compared with my overall numbers?">Recent form</button>
        <button data-analysis-prompt="What are my biggest statistical strengths relative to the rest of the group?">My strengths</button>
        <button data-analysis-prompt="Which current player has the closest statistical profile to me, and where do we differ?">Find a similar player</button>
      </div>
      <div id="analysisMessages" class="analysis-messages">${analysisMessages.length?analysisMessages.map(analysisMessageHTML).join(''):`<div class="analysis-empty"><b>Start with a question about ${analysisPlayer}.</b><span>The AI will stay grounded in the Filo Lakers stats available through Run ${D.through_run||window.FILO_DATA?.through_run||'—'}.</span></div>`}</div>
      <form id="analysisForm" class="analysis-compose"><textarea id="analysisInput" maxlength="600" rows="2" placeholder="Ask something about ${analysisPlayer}'s stats…"></textarea><div class="analysis-compose-bottom"><span id="analysisCount">${analysisUserCount()} / ${ANALYSIS_MAX_MESSAGES} messages</span><div><button type="button" class="analysis-clear" id="analysisClear">Clear</button><button type="submit" class="action" id="analysisSend">Send →</button></div></div></form>
    </section>
  </div>`;
}

function renderAnalysisMessages(){
  const box=document.getElementById('analysisMessages');
  if(!box)return;
  box.innerHTML=analysisMessages.length?analysisMessages.map(analysisMessageHTML).join(''):`<div class="analysis-empty"><b>Start with a question about ${analysisPlayer}.</b><span>The AI will stay grounded in the recorded Filo Lakers stats.</span></div>`;
  const count=document.getElementById('analysisCount');if(count)count.textContent=`${analysisUserCount()} / ${ANALYSIS_MAX_MESSAGES} messages`;
  const send=document.getElementById('analysisSend');if(send){send.disabled=analysisBusy||analysisUserCount()>=ANALYSIS_MAX_MESSAGES;send.textContent=analysisBusy?'Analyzing…':'Send →'}
  const input=document.getElementById('analysisInput');if(input)input.disabled=analysisBusy||analysisUserCount()>=ANALYSIS_MAX_MESSAGES;
  box.scrollTop=box.scrollHeight;
}

function resetAnalysisChat(){analysisMessages=[];analysisBusy=false}

async function submitAnalysisPrompt(text){
  const prompt=String(text||'').trim();
  if(!prompt||analysisBusy||analysisUserCount()>=ANALYSIS_MAX_MESSAGES)return;
  analysisMessages.push({role:'user',text:prompt});
  analysisBusy=true;renderAnalysisMessages();
  try{
    const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({player:analysisPlayer,messages:analysisMessages.slice(-12),stats:buildAnalysisStats(analysisPlayer)})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||'Analysis is unavailable right now.');
    analysisMessages.push({role:'assistant',text:data.reply||'I could not produce an analysis from the available stats.'});
  }catch(err){analysisMessages.push({role:'assistant',text:`${err.message||'Analysis is unavailable right now.'} This feature is still a work in progress.`})}
  analysisBusy=false;renderAnalysisMessages();
}

function bindAnalysis(){
  const player=document.getElementById('analysisPlayer');
  if(player)player.onchange=()=>{analysisPlayer=player.value;resetAnalysisChat();render()};
  document.querySelectorAll('[data-analysis-prompt]').forEach(b=>b.onclick=()=>submitAnalysisPrompt(b.dataset.analysisPrompt));
  const form=document.getElementById('analysisForm'),input=document.getElementById('analysisInput');
  if(form)form.onsubmit=e=>{e.preventDefault();const q=input?.value||'';if(input)input.value='';submitAnalysisPrompt(q)};
  if(input)input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form?.requestSubmit()}};
  const clear=document.getElementById('analysisClear');if(clear)clear.onclick=()=>{resetAnalysisChat();renderAnalysisMessages()};
  renderAnalysisMessages();
}
