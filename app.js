/* ============================================================
   IT PM → AI 岗位 学习路径 · 交互层
   ============================================================ */
const KEY = 'ai-pm-path-v1';

/* ---------- 状态 ---------- */
function load(){
  try{ const r = JSON.parse(localStorage.getItem(KEY)); if(r && r.track) return r; }catch(e){}
  return { track:'dual', hours:'h10', done:{}, crit:{}, startedAt:null };
}
let S = load();
function save(){ localStorage.setItem(KEY, JSON.stringify(S)); }

let view = 'path';
let openStage = 0;

/* ---------- 工具 ---------- */
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function resById(id){ return RES.find(r=>r.id===id); }
function today(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

function hoursPerWeek(){
  const h = HOURS.find(x=>x.k===S.hours);
  return h ? h.per : 10;
}
function trackTotal(){
  return STAGES[S.track].reduce((a,s)=>a+s.h, 0);
}
function trackWeeks(){
  return Math.ceil(trackTotal() / hoursPerWeek());
}
function stageStat(si){
  const st = STAGES[S.track][si];
  let critDone = 0;
  st.crit.forEach((_,i)=>{ if(S.crit[S.track+'-'+si+'-'+i]) critDone++; });
  let resDone = 0;
  st.res.forEach(id=>{ if(S.done[id]) resDone++; });
  return {crit:st.crit.length, critDone:critDone, res:st.res.length, resDone:resDone,
          ok: critDone>=st.crit.length && resDone>=st.res.length};
}
function overallPct(){
  let tot=0, done=0;
  STAGES[S.track].forEach((st,si)=>{
    const s = stageStat(si);
    tot += s.crit + s.res; done += s.critDone + s.resDone;
  });
  return tot ? Math.round(done/tot*100) : 0;
}

/* ---------- 路由 ---------- */
function setView(v){ view=v; render(); window.scrollTo(0,0); }

function render(){
  const app = document.getElementById('app');
  const nav = document.getElementById('nav');
  nav.innerHTML = ['path','res','advice','me'].map(v=>
    '<button data-v="'+v+'" class="'+(view===v?'on':'')+'" onclick="setView(\''+v+'\')">'+({path:'路径',res:'资源库',advice:'直给建议',me:'我的进度'}[v])+'</button>'
  ).join('');
  if(view==='path')        app.innerHTML = renderPath();
  else if(view==='res')    app.innerHTML = renderRes();
  else if(view==='advice') app.innerHTML = renderAdvice();
  else                     app.innerHTML = renderMe();
  const w = document.getElementById('weekBadge');
  if(w) w.textContent = '约 '+trackWeeks()+' 周';
}

/* ---------- 顶部：轨道 + 时间 ---------- */
function renderHead(){
  const T = TRACKS[S.track];
  let h = '<div class="head" style="border-left:4px solid '+T.color+'">'
    + '<div class="hdrow"><div class="hdt">'+T.name+'</div><span class="tag" style="background:'+T.tint+';color:'+T.color+'">'+T.tag+'</span></div>'
    + '<div class="hdd">'+esc(T.desc)+'</div>'
    + '<div class="hdmeta"><span class="ok">✓ '+esc(T.fit)+'</span></div>'
    + '<div class="hdmeta"><span class="wn">⚠ '+esc(T.warn)+'</span></div>'
    + '</div>';

  h += '<div class="sec">选择轨道</div><div class="tracks">';
  Object.keys(TRACKS).forEach(k=>{
    const X = TRACKS[k];
    h += '<div class="trk'+(S.track===k?' on':'')+'" onclick="setTrack(\''+k+'\')" style="'+(S.track===k?('border-color:'+X.color+';background:'+X.tint):'')+'">'
      + '<div class="trkn" style="color:'+X.color+'">'+X.name+'</div>'
      + '<div class="trkd">'+X.tag+' · '+X.desc.slice(0,42)+'…</div></div>';
  });
  h += '</div>';

  h += '<div class="sec">每周能投入多少小时</div><div class="hours">';
  HOURS.forEach(x=>{
    h += '<button class="hb'+(S.hours===x.k?' on':'')+'" onclick="setHours(\''+x.k+'\')">'
      + '<b>'+x.n+'</b><span>'+esc(x.d)+'</span></button>';
  });
  h += '</div>';

  const per = hoursPerWeek(), th = trackTotal(), wk = trackWeeks();
  h += '<div class="calc"><div class="ci"><div class="cv">'+th+' 小时</div><div class="ck">总学习量</div></div>'
    + '<div class="ci"><div class="cv">'+per+' 小时/周</div><div class="ck">你的节奏</div></div>'
    + '<div class="ci hi"><div class="cv">'+wk+' 周</div><div class="ck">预计完成</div></div></div>'
    + '<div class="tiny" style="margin-top:8px">换算口径：按轨道总学习量 ÷ 每周投入小时。实际会更快——因为你有工程底子，S0 阶段大概率能压缩。</div>';
  return h;
}

/* ---------- 路径页 ---------- */
function renderPath(){
  let h = renderHead();
  h += '<div class="sec">五个阶段 · 点开看细节</div>';
  STAGES[S.track].forEach((st,si)=>{
    const s = stageStat(si);
    const T = TRACKS[S.track];
    h += '<div class="stage'+(openStage===si?' open':'')+'">'
      + '<div class="stop" onclick="toggleStage('+si+')">'
      + '<div class="snum" style="background:'+T.tint+';color:'+T.color+'">'+st.n+'</div>'
      + '<div class="sbody"><div class="stitle">'+esc(st.title)+'</div>'
      + '<div class="smeta">'+st.wks+' 周（基准） · '+st.h+' 小时 · 验收 '+s.critDone+'/'+s.crit+' · 资源 '+s.resDone+'/'+s.res+'</div>'
      + '<div class="pbar"><i style="width:'+Math.round((s.critDone+s.resDone)/(s.crit+s.res)*100)+'%"></i></div></div>'
      + '<div class="sflag">'+(s.ok?'<span class="done">已达标</span>':'<span class="chev">'+(openStage===si?'收起':'展开')+'</span>')+'</div>'
      + '</div>';
    if(openStage===si){
      h += '<div class="sinner">'
        + '<div class="blk"><div class="blkh">目标</div><div class="blkv">'+esc(st.goal)+'</div></div>'
        + '<div class="blk pm"><div class="blkh">你作为项目经理的优势</div><div class="blkv">'+esc(st.pmEdge)+'</div></div>'
        + '<div class="blk"><div class="blkh">验收标准（全部勾完才算过）</div>';
      st.crit.forEach((c,i)=>{
        const k = S.track+'-'+si+'-'+i, on = !!S.crit[k];
        h += '<label class="ck'+(on?' on':'')+'"><input type="checkbox" '+(on?'checked':'')+' onchange="setCrit(\''+k+'\',this.checked)"><span>'+esc(c)+'</span></label>';
      });
      h += '</div><div class="blk"><div class="blkh">学习资源（点标题直达，看完回来打卡）</div>';
      st.res.forEach(id=>h += resCard(id));
      h += '</div></div>';
    }
    h += '</div>';
  });
  return h;
}

function resCard(id){
  const r = resById(id); if(!r) return '';
  const T = RTYPE[r.t], C = COST[r.cost], on = !!S.done[id];
  return '<div class="rc'+(on?' on':'')+'">'
    + '<div class="rctop">'
    + '<span class="rty" style="color:'+T.c+';background:'+T.bg+'">'+T.n+'</span>'
    + '<a class="rn" href="'+esc(r.u)+'" target="_blank" rel="noopener">'+esc(r.n)+'</a>'
    + (r.zh?'<span class="rzh">中文</span>':'')
    + '<span class="rcost" style="color:'+C.c+'">'+C.n+'</span>'
    + '<span class="rh">'+r.h+'h</span>'
    + '<span class="rlv">'+'★'.repeat(r.lv)+'</span>'
    + '</div>'
    + '<div class="rwhy">'+esc(r.why)+'</div>'
    + '<div class="rhow"><b>怎么学 · </b>'+esc(r.how)+'</div>'
    + '<div class="rcfoot">'
    + '<a class="btn sm" href="'+esc(r.u)+'" target="_blank" rel="noopener">打开</a>'
    + '<button class="btn ghost sm" onclick="toggleRes(\''+id+'\')">'+(on?'✓ 已学完（点击撤销）':'标记学完')+'</button>'
    + '</div></div>';
}

/* ---------- 资源库页 ---------- */
let RF = { t:'all', q:'', zh:false, free:false };
function setF(k,v){ RF[k]=v; render(); }
function renderRes(){
  let h = '<div class="sec">资源库 · '+RES.length+' 条（链接均已验真）</div>';
  h += '<div class="filters">';
  const tabs = [['all','全部']].concat(Object.keys(RTYPE).map(k=>[k,RTYPE[k].n]));
  h += '<div class="ftabs">' + tabs.map(t=>'<button class="ft'+(RF.t===t[0]?' on':'')+'" onclick="setF(\'t\',\''+t[0]+'\')">'+t[1]+'</button>').join('') + '</div>';
  h += '<div class="frow">'
    + '<input id="q" class="qin" placeholder="搜索资源名或关键词…" value="'+esc(RF.q)+'" oninput="setF(\'q\',this.value)">'
    + '<label class="chk2"><input type="checkbox" '+(RF.zh?'checked':'')+' onchange="setF(\'zh\',this.checked)">只看中文</label>'
    + '<label class="chk2"><input type="checkbox" '+(RF.free?'checked':'')+' onchange="setF(\'free\',this.checked)">只看免费</label>'
    + '</div></div>';

  const q = RF.q.trim().toLowerCase();
  const list = RES.filter(r=>{
    if(RF.t!=='all' && r.t!==RF.t) return false;
    if(RF.zh && !r.zh) return false;
    if(RF.free && r.cost!=='free') return false;
    if(q && (r.n+' '+r.why+' '+r.how).toLowerCase().indexOf(q)<0) return false;
    return true;
  });
  h += '<div class="tiny" style="margin-bottom:10px">筛选出 '+list.length+' 条 · 已学完 '+RES.filter(r=>S.done[r.id]).length+' 条</div>';
  if(!list.length) h += '<div class="empty">没有匹配的资源，换个关键词试试。</div>';
  list.forEach(r=>h += resCard(r.id));
  return h;
}

/* ---------- 建议页 ---------- */
function renderAdvice(){
  let h = '<div class="sec">给 IT 项目经理的 8 条直给建议</div>'
    + '<div class="note">这些不是通用学习建议，是针对「项目经理转 AI」这个具体场景的判断。每一条都对应一个真实的失败原因。</div>';
  ADVICE.forEach((a,i)=>{
    h += '<div class="adv"><div class="advn">'+(i+1)+'</div><div><div class="advt">'+esc(a.t)+'</div><div class="advd">'+esc(a.d)+'</div></div></div>';
  });
  h += '<div class="sec">转岗的三个现实提醒</div>'
    + '<div class="card"><div class="blkh">1. 你的竞争对手不是应届生</div><div class="blkv">是其他也在转的人，以及已经做了 1-2 年 AI 产品的人。你赢不了"谁学得早"，只能赢"谁更懂业务 + 谁更能交付"。</div></div>'
    + '<div class="card"><div class="blkh">2. 不要等"学完了"再投简历</div><div class="blkv">学到 S2 结束（约 8-10 周）就可以开始投了。市场看重的是你能不能干活，不是你学没学完。边投边学，面试本身就是最好的学习反馈。</div></div>'
    + '<div class="card"><div class="blkh">3. 内部转岗优于外部跳槽</div><div class="blkv">如果你现在的公司有 AI 相关项目，优先争取内部转。你已经有的业务理解和信任关系，是外部候选人花半年也建立不起来的。</div></div>';
  return h;
}

/* ---------- 我的进度 ---------- */
function renderMe(){
  const pct = overallPct();
  let h = '<div class="sec">我的进度</div>';
  h += '<div class="big"><div class="bignum">'+pct+'%</div><div class="biglab">'+TRACKS[S.track].name+' · 总体完成度</div>'
    + '<div class="bigbar"><i style="width:'+pct+'%"></i></div></div>';

  h += '<div class="sec">各阶段</div>';
  STAGES[S.track].forEach((st,si)=>{
    const s = stageStat(si);
    h += '<div class="kv"><span>'+st.n+' · '+esc(st.title)+'</span>'
      + '<b>'+(s.ok?'<span class="done">已达标</span>':(s.critDone+s.resDone)+' / '+(s.crit+s.res))+'</b></div>';
  });

  const doneRes = RES.filter(r=>S.done[r.id]);
  h += '<div class="sec">已学完的资源 · '+doneRes.length+' 条</div>';
  if(!doneRes.length) h += '<div class="empty">还没有打卡。去路径页或资源库点「标记学完」。</div>';
  doneRes.forEach(r=>{
    h += '<div class="kv"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(r.n)+'</span><b>'+r.h+'h</b></div>';
  });
  const hrs = doneRes.reduce((a,r)=>a+r.h,0);
  h += '<div class="kv tot"><span>累计投入</span><b>'+hrs+' 小时</b></div>';

  h += '<div class="sec">数据管理</div>'
    + '<div class="row"><button class="btn ghost" onclick="exportData()">导出进度（JSON）</button>'
    + '<button class="btn ghost danger" onclick="clearData()">清空全部进度</button></div>'
    + '<div class="tiny" style="margin-top:10px">进度存在浏览器本地，不上传服务器。换设备或清浏览器数据会丢失，重要进度建议导出一份。</div>';
  return h;
}

/* ---------- 动作 ---------- */
function setTrack(k){
  if(S.track===k) return;
  S.track=k; openStage=0;
  if(!S.startedAt) S.startedAt=today();
  save(); render();
}
function setHours(k){ S.hours=k; save(); render(); }
function toggleStage(i){ openStage = (openStage===i ? -1 : i); render(); }
function setCrit(k,v){ S.crit[k]=v; if(!S.startedAt){S.startedAt=today();} save(); render(); }
function toggleRes(id){
  if(S.done[id]) delete S.done[id]; else { S.done[id]=1; if(!S.startedAt) S.startedAt=today(); }
  save(); render();
}
function exportData(){
  const blob = new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ai学习进度-'+today()+'.json';
  a.click();
}
function clearData(){
  if(!confirm('确定清空全部学习进度？此操作不可恢复。')) return;
  S = { track:S.track, hours:S.hours, done:{}, crit:{}, startedAt:null };
  save(); render();
}

/* ---------- 启动 ---------- */
render();
