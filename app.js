/* 上交448百科复习站 · 前端逻辑
   数据由 data/*.js 通过 KB.add({...}) 和 KB.meta 注入；本文件只负责渲染、链接、自测与进度。 */
(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var app=$('#app');
var E={},ORDER=[],BY_B={},CL={},NAME={},BACK={},LINK_RE=null;
var BOARDS=KB.boards.slice().sort(function(a,b){return a.board<b.board?-1:1});
var META=KB.meta||{};
var STOP=(META.stop||[]).reduce(function(m,x){m[x]=1;return m},{});

/* ---------- 数据索引 ---------- */
BOARDS.forEach(function(b){
  BY_B[b.board]=b; b.entries=b.entries||[]; b.clusters=b.clusters||[];
  var pos={}; b.clusters.forEach(function(c,i){pos[c.cid]=i;CL[c.cid]=c;c.board=b.board;c.items=[]});
  b.entries.sort(function(x,y){
    var a=(pos[x.cid]===undefined?99:pos[x.cid])-(pos[y.cid]===undefined?99:pos[y.cid]);
    return a||((x.p||3)-(y.p||3))||0;
  });
  b.entries.forEach(function(e){
    e.b=b.board; E[e.id]=e; ORDER.push(e.id);
    if(CL[e.cid])CL[e.cid].items.push(e.id);
  });
});
function reg(name,id){
  name=String(name||'').replace(/[《》“”]/g,'').trim();
  if(name.length<2||STOP[name])return;
  if(!NAME[name])NAME[name]=id;
}
ORDER.forEach(function(id){reg(E[id].t,id)});
ORDER.forEach(function(id){(E[id].alias||[]).forEach(function(a){reg(a,id)})});
(function(){
  var names=Object.keys(NAME).sort(function(a,b){return b.length-a.length});
  if(names.length)LINK_RE=new RegExp(names.map(function(n){return n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|'),'g');
})();
function findId(t){t=String(t||'').replace(/[《》“”]/g,'').trim();return NAME[t]||null}
ORDER.forEach(function(id){
  (E[id].rel||[]).forEach(function(r){
    var to=findId(r.t); if(to&&to!==id){(BACK[to]=BACK[to]||[]).push({id:id,n:r.n})}
  });
});

/* ---------- 文本处理 ---------- */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(s,self){
  var h=esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  h=h.replace(/〔(\d\d)〕/g,function(m,b){return BY_B[b]?'<a class="lk" href="#b'+b+'">〔'+b+'〕</a>':m});
  if(!LINK_RE)return h;
  var seen={};
  return h.split(/(<[^>]+>)/).map(function(seg){
    if(seg.charAt(0)==='<')return seg;
    return seg.replace(LINK_RE,function(m){
      var id=NAME[m]; if(!id||id===self||seen[id])return m; seen[id]=1;
      return '<a class="lk" href="#e-'+id+'">'+m+'</a>';
    });
  }).join('');
}

/* ---------- 进度 ---------- */
var LS='sjtu448.v1',S={e:{},cfg:{exam:META.exam||'2026-12-19',hide:true},u:0};
try{var raw=localStorage.getItem(LS);if(raw){var o=JSON.parse(raw);if(o&&o.e)S=o;S.cfg=S.cfg||{};if(!S.cfg.exam)S.cfg.exam=META.exam||'2026-12-19';if(S.cfg.hide===undefined)S.cfg.hide=true}}catch(e){}
function today(){var d=new Date();return Math.floor((d.getTime()-d.getTimezoneOffset()*60000)/86400000)}
/* 复习规则（v1.0）
   b = 不同日子里连续“会了”的次数。
   不会：b 归零，明天再测，本轮结束前再出现一次。模糊：b 归零，明天再测。
   会了：b+1（同一天重复点不加），间隔按 b 取 2、4、7、14 天。
   所有间隔都不超过“距考试天数 − 2”，保证考前两天内每条至少再见一次。
   标记：红＝上次不会；黄＝上次模糊，或只会过一次；绿（掌握）＝隔天再测仍然会（b≥2）。 */
var IV=[0,2,4,7,14];
function st(id){return S.e[id]}
(function(){Object.keys(S.e).forEach(function(id){var x=S.e[id];if(x&&!x.v){x.b=x.r===2?Math.max(1,(x.b||1)-1):0;x.v=2}})})();
function mark(id){var s=st(id);if(!s)return '';if(s.r===0)return 'r';return s.b>=2?'g':'y'}
function rate(id,r){
  var s=S.e[id]||{b:0},t=today(),dl=daysLeft(),iv;
  if(r===2){if(s.ld!==t){s.b=(s.b||0)+1;s.ld=t}iv=IV[Math.min(s.b,4)]||2}else{s.b=0;iv=1}
  if(dl!==null&&dl>2)iv=Math.min(iv,Math.max(1,dl-2));
  s.d=t+iv; s.r=r; s.v=2; s.u=Date.now(); S.e[id]=s; save();
}
var saveT=null;
function save(){S.u=Date.now();try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){} clearTimeout(saveT);saveT=setTimeout(push,4000)}
function due(){var t=today();return ORDER.filter(function(id){var s=st(id);return s&&s.d<=t}).sort(function(a,b){return (S.e[a].d-S.e[b].d)||(E[a].p-E[b].p)})}
function daysLeft(){var p=(S.cfg.exam||'').split('-');if(p.length<3)return null;var d=Date.UTC(+p[0],p[1]-1,+p[2])/86400000;return Math.round(d-today())}
function counts(ids){var c={n:ids.length,g:0,y:0,r:0};ids.forEach(function(id){var m=mark(id);if(m)c[m]++});return c}
function bar(c){if(!c.n)return '';function w(x){return (100*x/c.n).toFixed(1)+'%'}return '<div class="bar"><i class="g" style="width:'+w(c.g)+'"></i><i class="y" style="width:'+w(c.y)+'"></i><i class="r" style="width:'+w(c.r)+'"></i></div>'}

/* ---------- 云端同步（同一账号的手机和电脑共用进度；不可用时只存本机） ---------- */
var REF=null,SYNC='本机';
function merge(o){
  if(!o||!o.e)return false;var ch=false;
  Object.keys(o.e).forEach(function(id){var a=S.e[id],b=o.e[id];if(b&&(!a||(b.u||0)>(a.u||0))){S.e[id]=b;ch=true}});
  if(o.cfg&&(o.u||0)>(S.u||0)){S.cfg=o.cfg;ch=true}
  return ch;
}
var pushing=false;
function push(){
  if(!REF||pushing)return;pushing=true;
  REF.set({s:JSON.stringify(S),u:Date.now()}).then(function(){SYNC='已同步';pushing=false},function(){SYNC='同步失败，进度仍保存在本机';pushing=false});
}
function initSync(){
  if(!window.claude||!claude.use)return;
  Promise.all([claude.use('db'),claude.use('user')]).then(function(r){
    var db=r[0],user=r[1];if(!db||!user)return;
    return user.id().then(function(uid){
      if(!uid)return;
      REF=db.doc('data/users/'+uid+'/progress');
      return REF.get().then(function(snap){
        var ch=false;
        if(snap.exists){try{ch=merge(JSON.parse(snap.data().s))}catch(e){}}
        SYNC='已同步';
        if(ch){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){} route()}
        push();
      });
    });
  }).catch(function(){SYNC='本机'});
}

/* ---------- 组件 ---------- */
function ptag(p){return '<span class="tag pp'+p+'">'+['','必背','熟悉','了解'][p||3]+'</span>'}
function tags(e){
  var h=ptag(e.p||3)+(e.kind?'<span class="tag">'+esc(e.kind)+'</span>':'');
  (e.exam||[]).forEach(function(x){h+='<span class="tag ex">'+esc(x)+'</span>'});
  return h;
}
function item(e){
  var m=mark(e.id);
  return '<a class="it" href="#e-'+e.id+'"><span class="dot p'+(e.p||3)+'"></span><span class="it-m"><span class="it-t">'+esc(e.t)+'</span>'+
    (e.exam&&e.exam.length?'<span class="tag ex">考过</span>':'')+(S.cfg.hideOne?'':'<span class="it-o">'+esc(e.one||'')+'</span>')+'</span><span class="ms '+m+'">'+(m?'●':'')+'</span></a>';
}
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},1600)}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}

/* ---------- 视图：首页 ---------- */
function vHome(){
  var all=counts(ORDER),p1=ORDER.filter(function(id){return E[id].p===1}),c1=counts(p1),dl=daysLeft(),du=due().length;
  var learned=all.g+all.y+all.r,unl12=ORDER.filter(function(id){return !st(id)&&E[id].p<=2}).length;
  var perDay=dl&&dl>7?Math.ceil(unl12/(dl-7)):unl12;
  var h='<h1>上交 448 百科复习站</h1><p class="sub">'+(dl!==null?'距初试约 '+dl+' 天。':'')+'共 '+ORDER.length+' 个知识点，分 '+BOARDS.length+' 个板块。内容版本 '+esc(META.version||'')+'。</p>';
  h+='<div class="card stats"><div class="stat"><b>'+learned+'</b><span>已学过</span></div><div class="stat"><b>'+c1.g+' / '+p1.length+'</b><span>必背已掌握</span></div><div class="stat"><b>'+du+'</b><span>今天到期复习</span></div><div class="stat"><b>'+perDay+'</b><span>建议每天新学</span></div></div>';
  h+='<h2>今天做什么</h2><div class="row"><a class="btn pri" href="#learn">按体系学新条目</a><a class="btn" href="#review">复习到期（'+du+'）</a><a class="btn" href="#quiz">选择题 10 道</a><a class="btn" href="#recall">名解抽背 6 个</a></div>';
  h+='<p class="note">顺序：先学每个板块的必背，再学熟悉，最后扫了解。每条先回忆再看答案，然后点“不会、模糊、会了”，系统按间隔安排复习。建议每天新学数按“考前留 7 天总复习”计算。</p>';
  h+='<h2>板块</h2><div class="grid">';
  BOARDS.forEach(function(b){
    var ids=b.entries.map(function(e){return e.id}),c=counts(ids),n1=b.entries.filter(function(e){return e.p===1}).length;
    h+='<a class="card bd" href="#b'+b.board+'"><b>'+b.board+' '+esc(b.title)+'</b><span class="sub">'+ids.length+' 条，必背 '+n1+'</span>'+bar(c)+'</a>';
  });
  h+='</div><h2>专题</h2><div class="row"><a class="btn" href="#rules">出题规律</a><a class="btn" href="#combo">数字合称</a><a class="btn" href="#threads">串联线索</a><a class="btn" href="#me">设置与同步</a></div>';
  app.innerHTML=h;
}

/* ---------- 视图：板块 ---------- */
var FIL={p:0,ex:false,un:false};
function passes(e){
  if(FIL.p&&e.p!==FIL.p)return false;
  if(FIL.ex&&!(e.exam&&e.exam.length))return false;
  if(FIL.un&&mark(e.id)==='g')return false;
  return true;
}
function chips(){
  function c(k,v,l){var on=(k==='p'?FIL.p===v:FIL[k]);return '<button class="chip'+(on?' on':'')+'" data-f="'+k+'" data-v="'+v+'">'+l+'</button>'}
  return '<div class="chips">'+c('p',0,'全部')+c('p',1,'必背')+c('p',2,'熟悉')+c('p',3,'了解')+c('ex',1,'交大考过')+c('un',1,'未掌握')+'</div>';
}
function vBoard(bid){
  var b=BY_B[bid];if(!b)return vHome();
  var h='<p class="crumb"><a href="#home">首页</a> › 板块 '+b.board+'</p><h1>'+esc(b.title)+'</h1>';
  if(b.note)h+='<p class="sub">'+fmt(b.note)+'</p>';
  h+=chips();
  var used={};
  b.clusters.forEach(function(c){
    var es=c.items.map(function(id){used[id]=1;return E[id]}).filter(passes);
    if(!es.length)return;
    h+='<section class="cl" id="c-'+c.cid+'"><div class="cl-h"><h2>'+esc(c.name)+'</h2><span class="sub">'+es.length+' 条</span></div>';
    if(c.line)h+='<p class="cl-line">'+fmt(c.line)+'</p>';
    h+='<div class="list">'+es.map(item).join('')+'</div></section>';
  });
  var rest=b.entries.filter(function(e){return !used[e.id]}).filter(passes);
  if(rest.length)h+='<section class="cl"><h2>其他</h2><div class="list">'+rest.map(item).join('')+'</div></section>';
  (b.tables||[]).forEach(function(t){h+=tbl(t)});
  app.innerHTML=h;
}
function tbl(t){
  var h='<details><summary>对照表：'+esc(t.name)+'</summary><div class="tw"><table>';
  (t.rows||[]).forEach(function(r,i){h+='<tr>'+r.map(function(x){return i?'<td>'+fmt(x)+'</td>':'<th>'+esc(x)+'</th>'}).join('')+'</tr>'});
  h+='</table></div>'+(t.note?'<p class="note">'+fmt(t.note)+'</p>':'')+'</details>';
  return h;
}

/* ---------- 视图：条目 ---------- */
var FLOW=S.flow||null,SHOWN={};
function setFlow(f){FLOW=f;S.flow=f;save()}
function flowBar(){var old=document.getElementById('flowbar');if(old)old.remove();if(!FLOW)return;var cur=FLOW.q[FLOW.i];if(location.hash==='#e-'+cur)return;var d=document.createElement('div');d.id='flowbar';d.className='card';d.style.cssText='margin-bottom:12px;border-color:var(--accent)';d.innerHTML='正在进行“'+esc(FLOW.name)+'”，第 '+(FLOW.i+1)+' / '+FLOW.q.length+' 条。<a href="#e-'+cur+'"><b>回到当前条：'+esc(E[cur]?E[cur].t:'')+'</b></a> · <a href="#home" data-act="exit">结束本轮</a>';app.prepend(d)}
function vEntry(id){
  var e=E[id];if(!e)return vHome();
  var b=BY_B[e.b],c=CL[e.cid],h='';
  if(FLOW&&FLOW.q[FLOW.i]===id)h+='<p class="note">“'+esc(FLOW.name)+'”第 '+(FLOW.i+1)+' / '+FLOW.q.length+' 条。点关联词条去看也没关系，顶部会有“回到当前条”。<a href="#home" data-act="exit">结束本轮</a></p>';
  h+='<p class="crumb"><a href="#home">首页</a> › <a href="#b'+e.b+'">'+esc(b.title)+'</a>'+(c?' › '+esc(c.name):'')+'</p>';
  h+='<h1>'+esc(e.t)+'</h1><div>'+tags(e)+'</div>';
  var hide=S.cfg.hide&&!SHOWN[id];
  if(hide){
    h+='<button class="veil" data-act="show">只看标题，先独立回忆：'+(e.kind==='合称'?'全部成员是谁，各有什么代表作？':'是什么（时代、身份或性质）、有什么（代表作、内容、成员）、为什么重要？')+'<br>最好在纸上或心里说完整，再点这里看答案</button>';
  }else{
    if(e.one)h+='<p>'+fmt(e.one,id)+'</p>';
    if(c&&c.line)h+='<p class="cl-line">所在线索：'+fmt(c.line,id)+'</p>';
    if(e.members&&e.members.length){
      h+='<div class="sec"><h3>成员</h3><div class="tw"><table>'+e.members.map(function(m){return '<tr><td><b>'+fmt(m[0],id)+'</b></td><td>'+fmt(m[1]||'',id)+'</td></tr>'}).join('')+'</table></div></div>';
    }
    if(e.ans)h+='<div class="sec"><h3>名词解释参考答案</h3><div class="ans">'+fmt(e.ans,id)+'</div></div>';
    if(e.pts&&e.pts.length)h+='<div class="sec"><h3>得分点</h3><ol class="pts">'+e.pts.map(function(p){return '<li>'+fmt(p,id)+'</li>'}).join('')+'</ol></div>';
    if(e.mem)h+='<div class="sec"><h3>怎么记</h3><div class="mem">'+fmt(e.mem,id)+'</div></div>';
    if(e.mix)h+='<div class="sec"><h3>易混与干扰项</h3><div>'+fmt(e.mix,id)+'</div></div>';
    if(e.more)h+='<div class="sec"><h3>延伸</h3><div>'+fmt(e.more,id)+'</div></div>';
    if(e.mcq&&e.mcq.length)h+='<div class="sec"><h3>选择题练手</h3>'+e.mcq.map(function(q,i){return qHtml(q,id+'-'+i,id)}).join('')+'</div>';
    var rel=(e.rel||[]).map(function(r){var to=findId(r.t);return '<li>'+(to?'<a href="#e-'+to+'">'+esc(r.t)+'</a>':'<b>'+esc(r.t)+'</b>')+(r.n?'：'+fmt(r.n,id):'')+'</li>'});
    var seen={};(e.rel||[]).forEach(function(r){var to=findId(r.t);if(to)seen[to]=1});
    (BACK[id]||[]).forEach(function(x){if(seen[x.id])return;seen[x.id]=1;rel.push('<li><a href="#e-'+x.id+'">'+esc(E[x.id].t)+'</a>'+(x.n?'：'+fmt(x.n,id):'')+'</li>')});
    if(rel.length)h+='<div class="sec rel"><h3>关联与串联</h3><ul>'+rel.join('')+'</ul></div>';
  }
  var cur=mark(id),s=st(id);
  h+='<div class="rate"><button class="r'+(s&&s.r===0?' on':'')+'" data-rate="0">不会</button><button class="y'+(s&&s.r===1?' on':'')+'" data-rate="1">模糊</button><button class="g'+(s&&s.r===2?' on':'')+'" data-rate="2">会了</button></div><p class="note">不会：想不起来，或关键事实说错。模糊：只想起一部分，成员缺漏，或想了很久才出来。会了：不看答案就能说出定义和三个得分点（合称要说全成员），没有错。拿不准时选低一档。</p>';
  if(c){
    var k=c.items.indexOf(id),pv=c.items[k-1],nx=c.items[k+1];
    if(!nx){var bi=b.clusters.indexOf(c),nc=b.clusters[bi+1];if(nc&&nc.items.length)nx=nc.items[0]}
    h+='<div class="pn">'+(pv?'<a class="btn" href="#e-'+pv+'">‹ '+esc(E[pv].t)+'</a>':'<span></span>')+(nx?'<a class="btn" href="#e-'+nx+'">'+esc(E[nx].t)+' ›</a>':'<span></span>')+'</div>';
  }
  app.innerHTML=h;
}
function qHtml(q,key,eid){
  var idx=shuffle([0,1,2,3].slice(0,q.o.length));
  return '<div class="q" data-q="'+key+'" data-e="'+(eid||'')+'"><div>'+esc(q.q)+'</div>'+idx.map(function(i){return '<button class="opt" data-ok="'+(i===q.a?1:0)+'">'+esc(q.o[i])+'</button>'}).join('')+'<div class="why" hidden>'+esc(q.w||'')+(eid?' <a href="#e-'+eid+'">看词条</a>':'')+'</div></div>';
}

/* ---------- 视图：合称 ---------- */
var CN='零一二三四五六七八九十',CB='';
function numOf(t){var m=t.match(/[二两三四五六七八九十百]+|\d+/);if(!m)return 99;var x=m[0];if(/\d/.test(x))return +x;if(x==='两')return 2;if(x==='十')return 10;if(x.length===2&&x.charAt(0)==='十')return 10+CN.indexOf(x.charAt(1));if(x.length===2&&x.charAt(1)==='十')return CN.indexOf(x.charAt(0))*10;if(x==='百')return 100;var n=CN.indexOf(x.charAt(0));return n<0?99:n}
function vCombo(){
  var es=ORDER.map(function(id){return E[id]}).filter(function(e){return e.kind==='合称'||(e.members&&e.members.length)});
  if(CB)es=es.filter(function(e){return e.b===CB});
  var g={};es.forEach(function(e){var n=numOf(e.t);(g[n]=g[n]||[]).push(e)});
  var h='<h1>数字合称</h1><p class="sub">交大 2020 届以后约四分之一的题考数字合称，常见问法是“哪个不属于”。先看名字回忆成员，再点开核对。共 '+es.length+' 组。</p>';
  h+='<div class="chips"><button class="chip'+(CB?'':' on')+'" data-cb="">全部板块</button>'+BOARDS.map(function(b){return '<button class="chip'+(CB===b.board?' on':'')+'" data-cb="'+b.board+'">'+b.board+'</button>'}).join('')+'</div>';
  Object.keys(g).map(Number).sort(function(a,b){return a-b}).forEach(function(n){
    h+='<h2>'+(n===99?'其他并称':'“'+n+'”字头')+'</h2><div class="list">';
    g[n].forEach(function(e){
      var mem=(e.members||[]).map(function(m){return m[0]}).join('、')||e.one||'';
      h+='<div class="it"><span class="dot p'+(e.p||3)+'"></span><span class="it-m"><a class="it-t" href="#e-'+e.id+'">'+esc(e.t)+'</a><span class="it-o"><button class="chip" data-act="peek">看成员</button><span hidden> '+esc(mem)+'</span></span></span><span class="ms '+mark(e.id)+'">'+(mark(e.id)?'●':'')+'</span></div>';
    });
    h+='</div>';
  });
  app.innerHTML=h;
}

/* ---------- 视图：串联、规律 ---------- */
function vThreads(){
  var h='<h1>串联线索</h1><p class="sub">把分属不同板块的知识点连起来记：同年的人和事、中西对照、整数周年、之父与之最。点蓝色词可跳到词条。</p>';
  (META.threads||[]).forEach(function(t){
    h+='<h2 id="t-'+esc(t.id)+'">'+esc(t.name)+'</h2>'+(t.intro?'<p class="sub">'+fmt(t.intro)+'</p>':'')+'<div class="list">';
    (t.items||[]).forEach(function(x){h+='<div class="it"><span class="it-m"><span class="it-t">'+esc(x.h)+'</span><span class="it-o" style="font-size:15px;color:var(--ink)">'+fmt(x.text)+'</span></span></div>'});
    h+='</div>';
  });
  if(!(META.threads||[]).length)h+='<p class="sub">串联内容整理中。</p>';
  app.innerHTML=h;
}
function vRules(){
  var h='<h1>出题规律</h1>';
  (META.rules||[]).forEach(function(r){
    if(r.type==='p')h+='<p>'+fmt(r.text)+'</p>';
    else{h+='<h2>'+esc(r.name)+'</h2><div class="tw"><table>'+r.rows.map(function(row,i){return '<tr>'+row.map(function(x){return i?'<td>'+fmt(x)+'</td>':'<th>'+esc(x)+'</th>'}).join('')+'</tr>'}).join('')+'</table></div>'}
  });
  app.innerHTML=h;
}

/* ---------- 视图：学习流、自测 ---------- */
function startFlow(name,q){if(!q.length){toast('没有符合条件的条目');location.hash='#home';return}setFlow({name:name,q:q,i:0,again:[]});SHOWN={};location.hash='#e-'+q[0]}
function learnQueue(){
  var out=[];[1,2,3].forEach(function(p){if(out.length>=20)return;ORDER.forEach(function(id){if(out.length<20&&E[id].p===p&&!st(id))out.push(id)})});
  return out;
}
function vTest(){
  var h='<h1>自测</h1><div class="grid"><a class="card bd" href="#review"><b>复习到期</b><span class="sub">今天到期 '+due().length+' 条，按间隔重现</span></a><a class="card bd" href="#quiz"><b>选择题 10 道</b><span class="sub">从已学和必背条目里抽题</span></a><a class="card bd" href="#recall"><b>名解抽背 6 个</b><span class="sub">随机抽必背词条，仿真卷面数量</span></a><a class="card bd" href="#learn"><b>按体系学新条目</b><span class="sub">每轮 20 条，按板块线索顺序</span></a></div>';
  app.innerHTML=h;
}
function vQuiz(){
  var pool=ORDER.filter(function(id){return E[id].mcq&&E[id].mcq.length&&(st(id)||E[id].p===1)});
  if(pool.length<10)pool=ORDER.filter(function(id){return E[id].mcq&&E[id].mcq.length});
  var pick=shuffle(pool).slice(0,10);
  var h='<h1>选择题 10 道</h1><p class="sub">答错的词条会自动记为“不会”，进入明天的复习。</p>';
  pick.forEach(function(id,i){var qs=E[id].mcq,q=qs[Math.floor(Math.random()*qs.length)];h+='<div class="card q-wrap" style="margin:10px 0"><b>'+(i+1)+'.</b>'+qHtml(q,'quiz-'+i,id)+'</div>'});
  h+='<div class="row"><a class="btn pri" href="#quiz" data-act="again">再来 10 道</a><span id="score" class="sub"></span></div>';
  app.innerHTML=h;
}

/* ---------- 视图：搜索、设置 ---------- */
function vSearch(q){
  q=q.trim();var h='<h1>搜索：'+esc(q)+'</h1>';
  if(q){
    var a=[],b=[];ORDER.forEach(function(id){var e=E[id];if(e.t.indexOf(q)>=0||(e.alias||[]).join('|').indexOf(q)>=0)a.push(e);else if(((e.one||'')+(e.ans||'')+(e.mem||'')+JSON.stringify(e.members||'')).indexOf(q)>=0)b.push(e)});
    var r=a.concat(b).slice(0,80);
    h+=r.length?'<div class="list">'+r.map(item).join('')+'</div>':'<p class="sub">没有找到。换一个更短的词试试。</p>';
  }
  app.innerHTML=h;
}
function vMe(){
  var h='<h1>设置与同步</h1>';
  h+='<div class="card"><p><label for="exam">初试日期 </label><input id="exam" type="date" value="'+esc(S.cfg.exam)+'"></p><p><label><input id="hide" type="checkbox"'+(S.cfg.hide?' checked':'')+'> 打开词条时先遮住答案和简介（先回忆再看）</label></p><p><label><input id="hideOne" type="checkbox"'+(S.cfg.hideOne?' checked':'')+'> 板块和搜索列表里也不显示一句话简介</label></p><p class="note">进度同步状态：'+esc(SYNC)+'。在 Claude 里打开本页时，同一账号的手机和电脑自动合并进度；在独立网址或离线文件里打开时，进度只存在当前浏览器，换设备请用下面的“下载进度文件”和“从文件导入”。</p></div>';
  h+='<h2>手动转移进度</h2><p class="note">离线版或同步不可用时：在一台设备上复制下面的文字，到另一台设备粘贴后点“导入”。</p><textarea id="io">'+esc(JSON.stringify(S))+'</textarea><div class="row" style="margin-top:8px"><button class="btn" data-act="copy">复制</button><button class="btn" data-act="import">导入</button><button class="btn" data-act="dl">下载进度文件</button><label class="btn" for="upf">从文件导入</label><input id="upf" type="file" accept=".json,application/json,text/plain" hidden><button class="btn" data-act="reset">清空全部进度</button></div>';
  h+='<h2>图例</h2><p><span class="tag pp1">必背</span> 能写完整名解。<span class="tag pp2">熟悉</span> 能写三个要点，选择题能选对。<span class="tag pp3">了解</span> 认得出，能写一两句。<span class="tag ex">2024名解</span> 交大考过的届别与题型（X 届指 X−1 年 12 月的考试）。</p><h2>复习怎么排</h2><p>不会、模糊：明天再出现；本轮点了“不会”的，本轮最后还会再考一次。会了：连续会的次数越多，间隔越长，依次 2、4、7、14 天；同一天重复点“会了”只算一次。所有间隔都会压到考试前两天以内，所以考前每条都会再见一次。颜色：红＝上次不会；黄＝上次模糊，或只会过一次；绿＝掌握，即隔天再测仍然会。“复习到期”每轮最多 60 条，先排逾期最久的，同样逾期的先排必背。</p>';
  app.innerHTML=h;
}

/* ---------- 路由与事件 ---------- */
var NAV=[['home','首页'],['combo','合称'],['threads','串联'],['test','自测'],['rules','规律'],['me','设置']];
function nav(cur){
  var k=cur;if(/^(b\d|e-|search)/.test(cur)||cur==='learn')k='home';if(/^(quiz|recall|review)$/.test(cur))k='test';
  $('#nav').innerHTML=NAV.map(function(n){return '<a href="#'+n[0]+'"'+(k===n[0]?' class="on"':'')+'>'+n[1]+'</a>'}).join('');
  $('#tabbar').innerHTML=NAV.filter(function(n){return n[0]!=='rules'}).map(function(n){return '<a href="#'+n[0]+'"'+(k===n[0]?' class="on"':'')+'>'+n[1]+'</a>'}).join('');
}
var SQ='';
function route(){
  var hsh=(location.hash||'#home').slice(1)||'home';
  nav(hsh);
  if(hsh==='learn')return startFlow('学新条目',learnQueue());
  if(hsh==='review')return startFlow('复习',due().slice(0,60));
  if(hsh==='recall')return startFlow('名解抽背',shuffle(ORDER.filter(function(id){return E[id].p===1})).slice(0,6));
  if(hsh.indexOf('e-')===0)vEntry(hsh.slice(2));
  else if(/^b\d\d$/.test(hsh))vBoard(hsh.slice(1));
  else if(hsh==='combo')vCombo();
  else if(hsh==='threads')vThreads();
  else if(hsh==='rules')vRules();
  else if(hsh==='test')vTest();
  else if(hsh==='quiz')vQuiz();
  else if(hsh==='me')vMe();
  else if(hsh==='search')vSearch(SQ);
  else vHome();
  flowBar();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange',route);
$('#q').addEventListener('input',function(){SQ=this.value;if(location.hash!=='#search')location.hash='#search';else vSearch(SQ)});
document.addEventListener('click',function(ev){
  var t=ev.target.closest('[data-rate],[data-act],[data-f],[data-cb],.opt');if(!t)return;
  var hsh=location.hash.slice(1);
  if(t.dataset.rate!==undefined){
    var id=hsh.slice(2);rate(id,+t.dataset.rate);
    if(FLOW&&FLOW.q[FLOW.i]===id){
      FLOW.again=FLOW.again||[];
      if(+t.dataset.rate===0&&FLOW.again.indexOf(id)<0){FLOW.again.push(id);FLOW.q.push(id)}
      FLOW.i++;
      if(FLOW.i<FLOW.q.length){setFlow(FLOW);location.hash='#e-'+FLOW.q[FLOW.i]}else{var nm=FLOW.name;setFlow(null);toast(nm+'完成');location.hash='#home'}
    }else{toast('已记录（不影响正在进行的那一轮）');vEntry(id);flowBar()}
    return;
  }
  if(t.dataset.f){var k=t.dataset.f;if(k==='p')FIL.p=+t.dataset.v;else FIL[k]=!FIL[k];vBoard(hsh.slice(1));return}
  if(t.dataset.cb!==undefined){CB=t.dataset.cb;vCombo();return}
  if(t.classList.contains('opt')){
    var q=t.closest('.q');if(q.dataset.done)return;q.dataset.done=1;
    var ok=t.dataset.ok==='1';t.classList.add(ok?'ok':'no');
    q.querySelectorAll('.opt').forEach(function(o){if(o.dataset.ok==='1')o.classList.add('ok')});
    q.querySelector('.why').hidden=false;
    if(!ok&&q.dataset.e&&hsh==='quiz')rate(q.dataset.e,0);
    if(hsh==='quiz'){var all=document.querySelectorAll('.q'),dn=document.querySelectorAll('.q[data-done]'),rt=document.querySelectorAll('.q[data-done] .opt.ok:not(.no)');
      var right=0;dn.forEach(function(x){if(!x.querySelector('.opt.no'))right++});$('#score').textContent='已答 '+dn.length+' / '+all.length+'，答对 '+right}
    return;
  }
  var a=t.dataset.act;
  if(a==='show'){SHOWN[hsh.slice(2)]=1;vEntry(hsh.slice(2));window.scrollTo(0,0)}
  else if(a==='exit'){setFlow(null)}
  else if(a==='peek'){t.nextElementSibling.hidden=!t.nextElementSibling.hidden}
  else if(a==='again'){ev.preventDefault();vQuiz();window.scrollTo(0,0)}
  else if(a==='copy'){var io=$('#io');io.select();try{navigator.clipboard.writeText(io.value).then(function(){toast('已复制')},function(){toast('请手动长按复制')})}catch(e){toast('请手动长按复制')}}
  else if(a==='import'){try{var o=JSON.parse($('#io').value);if(merge(o)){save();toast('已导入并合并')}else toast('没有更新的记录')}catch(e){toast('文字格式不对，请完整粘贴')}}
  else if(a==='dl'){try{var bl=new Blob([JSON.stringify(S)],{type:'application/json'}),u=URL.createObjectURL(bl),k=document.createElement('a');k.href=u;k.download='448进度_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(k);k.click();k.remove();setTimeout(function(){URL.revokeObjectURL(u)},2000)}catch(e){toast('当前环境不能下载，请用“复制”')}}
  else if(a==='reset'){if(t.dataset.sure){S.e={};save();toast('已清空');vMe()}else{t.dataset.sure=1;t.textContent='再点一次确认清空'}}
});
document.addEventListener('change',function(ev){
  if(ev.target.id==='exam'){S.cfg.exam=ev.target.value;save()}
  if(ev.target.id==='hide'){S.cfg.hide=ev.target.checked;save()}
  if(ev.target.id==='hideOne'){S.cfg.hideOne=ev.target.checked;save()}
  if(ev.target.id==='upf'&&ev.target.files&&ev.target.files[0]){var fr=new FileReader();fr.onload=function(){try{var o=JSON.parse(fr.result);if(merge(o)){save();toast('已导入并合并')}else toast('没有更新的记录')}catch(e){toast('文件格式不对')}};fr.readAsText(ev.target.files[0])}
});
route();
initSync();
/* 独立网站上注册离线缓存（Claude 内和本地文件打开时自动跳过） */
try{if('serviceWorker' in navigator&&location.protocol==='https:'&&!/claude\.(ai|site)|claudeusercontent/.test(location.hostname)){navigator.serviceWorker.register('sw.js').catch(function(){})}}catch(e){}
})();
