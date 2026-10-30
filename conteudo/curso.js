/* Código comum a todos os módulos: navegação entre telas, menu lateral,
   player de vídeo narrado, confete e registro de módulo concluído.
   Cada página chama iniciaCurso({...}) no fim do seu próprio script. */

let steps = [], feitos = new Set(), atual = 0, alcancado = 0, cfg = {};

function iniciaCurso(opcoes){
  cfg = Object.assign({dicas:{}, aoEntrar:{}}, opcoes);
  steps = [...document.querySelectorAll('.step')];
  document.getElementById('prox').onclick = ()=>ir(atual+1);
  document.getElementById('ant').onclick = ()=>ir(atual-1);
  document.getElementById('btnMenu').onclick = ()=>document.body.classList.toggle('menu-aberto');
  document.getElementById('veu').onclick = ()=>document.body.classList.remove('menu-aberto');
  document.addEventListener('keydown', e=>{
    if (e.target.closest('input,textarea')) return;
    if (e.key==='ArrowRight' && !document.getElementById('prox').disabled) ir(atual+1);
    if (e.key==='ArrowLeft' && atual>0) ir(atual-1);
  });
  ir(0);
}

function ir(i){
  atual = Math.max(0, Math.min(steps.length-1, i));
  steps.forEach((s,k)=>s.classList.toggle('ativo', k===atual));
  document.getElementById('contador').textContent = `${atual+1} / ${steps.length}`;
  document.getElementById('barra').style.width = (atual/(steps.length-1)*100)+'%';
  window.scrollTo({top:0, behavior:'smooth'});
  pausaFilme(); // não deixa a narração tocando ao trocar de tela
  atualizaNav();
  const f = cfg.aoEntrar[steps[atual].dataset.titulo];
  if (f) f();
}

function concluido(k){
  const t = steps[k].dataset.trava;
  return k < alcancado && (!t || feitos.has(t));
}

function desenhaSumario(){
  const box = document.getElementById('sumLista'); box.innerHTML = '';
  steps.forEach((s,k)=>{
    const b = document.createElement('button');
    const ok = concluido(k) || (k===steps.length-1 && atual===k);
    const tag = s.dataset.tag ? `<span class="tag">${s.dataset.tag}</span>` : '';
    b.className = 'sum-item' + (ok?' feito':'') + (k===atual?' atual':'');
    b.disabled = k > alcancado;
    b.innerHTML = `<span class="marca">${ok?'✓':k+1}</span><span>${s.dataset.titulo}</span>${tag}`;
    b.onclick = ()=>{ document.body.classList.remove('menu-aberto'); ir(k); };
    box.appendChild(b);
  });
  const n = steps.filter((_,k)=>concluido(k)).length + (atual===steps.length-1?1:0);
  const pct = Math.round(n/steps.length*100);
  document.getElementById('sumPct').textContent = `${pct}% concluído`;
  document.getElementById('sumBarra').style.width = pct+'%';
}

function atualizaNav(){
  alcancado = Math.max(alcancado, atual);
  desenhaSumario();
  const trava = steps[atual].dataset.trava;
  const bloqueado = trava && !feitos.has(trava);
  const prox = document.getElementById('prox');
  prox.disabled = bloqueado || atual===steps.length-1;
  prox.style.visibility = (atual===0 || atual===steps.length-1) ? 'hidden':'visible';
  document.getElementById('ant').style.visibility = atual===0 ? 'hidden':'visible';
  document.getElementById('dica').textContent = bloqueado ? (cfg.dicas[trava]||'Conclua a atividade para continuar') : '';
}

function libera(t){ feitos.add(t); atualizaNav(); }

/* ---------- Vídeo narrado ----------
   Uma página tem no máximo um vídeo. Cada cena é um <g class="cena"> no SVG #filme;
   cada cena tem uma legenda e um áudio <prefixo>-<n>.mp3. A cena avança quando o áudio termina. */
let filme = null;
function criaFilme(legendas, prefixoAudio){
  const cenas = [...document.querySelectorAll('#filme .cena')];
  const audios = legendas.map((_,i)=>{ const a=new Audio(`${prefixoAudio}-${i+1}.mp3`); a.preload='auto'; return a; });
  const playBtn = document.getElementById('playBtn');
  const f = filme = {cena:0, tocando:false, iniciado:false, terminou:false, mudo:false, avanco:null};

  function mostra(i){
    cenas.forEach((c,k)=>{
      c.classList.toggle('on', k===i);
      if (k===i){ // reinicia as animações internas da cena
        c.querySelectorAll('[data-anima]').forEach(el=>{
          const cls = el.dataset.anima; el.classList.remove(cls); void el.getBBox(); el.classList.add(cls);
        });
      }
    });
    document.getElementById('legenda').textContent = legendas[i];
  }
  function toca(i){
    clearTimeout(f.avanco); f.cena=i; mostra(i);
    const a=audios[i]; a.currentTime=0; a.muted=f.mudo;
    a.onended=()=>{ f.avanco=setTimeout(prox, 700); };
    a.play().catch(()=>{ f.avanco=setTimeout(prox, 5000); }); // sem áudio: 5 s por cena
  }
  function prox(){
    if (f.cena < cenas.length-1) return toca(f.cena+1);
    f.tocando=false; f.terminou=true; playBtn.textContent='↻ Rever';
  }
  f.play = function(){
    document.getElementById('playGrande').classList.add('some');
    const a=audios[f.cena];
    if (f.tocando){ a.pause(); clearTimeout(f.avanco); f.tocando=false; playBtn.textContent='▶ Continuar'; return; }
    f.tocando=true; playBtn.textContent='❚❚ Pausar';
    if (!f.iniciado || f.terminou){ f.iniciado=true; f.terminou=false; return toca(0); }
    if (a.ended) prox(); else a.play().catch(()=>{ f.avanco=setTimeout(prox, 3000); });
  };
  setInterval(()=>{
    if (!f.iniciado) return;
    const a=audios[f.cena], frac = f.terminou ? 1 : (a.duration ? a.currentTime/a.duration : 0);
    document.getElementById('filmeBarra').style.width = ((f.terminou?cenas.length:f.cena+frac)/cenas.length*100)+'%';
  }, 100);
  playBtn.onclick = f.play;
  document.getElementById('playGrande').onclick = f.play;
  document.getElementById('somBtn').onclick = e=>{
    f.mudo=!f.mudo; audios.forEach(a=>a.muted=f.mudo);
    e.currentTarget.textContent = f.mudo ? '🔇 Som desligado' : '🔊 Som ligado';
  };
  mostra(0); document.getElementById('legenda').textContent='Clique para assistir';
}
function pausaFilme(){ if (filme && filme.tocando) filme.play(); }

/* ---------- Confete ---------- */
function confete(){
  const cores=['#13a89e','#7ff0dd','#ef5b4c','#f5a524','#fff'];
  for(let i=0;i<70;i++){
    const c=document.createElement('div'); c.className='confete';
    c.style.left=Math.random()*100+'vw'; c.style.background=cores[i%cores.length];
    c.style.animationDuration=(2.5+Math.random()*2)+'s'; c.style.animationDelay=Math.random()*.8+'s';
    document.body.appendChild(c); setTimeout(()=>c.remove(),5500);
  }
}

/* ---------- Quiz + tela final padrão ----------
   criaQuiz({id, proximo:{titulo, url}, revisar})
   As perguntas e a correção ficam no servidor (/api/quiz): a página nunca sabe
   a resposta certa antes de responder, e a nota é calculada lá.
   Exige na página: <div class="card" id="quiz"> (trava "quiz") e <div class="fim" id="fim">. */
let quizCfg=null, qi=0, acertos=0, quizTentativa=null, quizPerguntas=[], quizNota=0;
function esc(t){ return String(t).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]); }
async function apiQuiz(corpo){
  const r = await fetch('/api/quiz', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(corpo)});
  if (r.status===401){ location.href='/entrar'; throw new Error('sessão'); }
  if (!r.ok) throw new Error('falha');
  return r.json();
}
function criaQuiz(c){
  quizCfg=c;
  document.getElementById('quiz').innerHTML=`<span class="eyebrow">Quiz</span>
    <h2>Hora de testar o que você aprendeu</h2>
    <p class="muted">5 perguntas rápidas. Você precisa de 70% para concluir o módulo e pode refazer quantas vezes quiser.</p>
    <button class="btn btn-pri" onclick="iniciaQuiz()">Começar o quiz →</button>`;
}
async function iniciaQuiz(){
  const box=document.getElementById('quiz');
  box.innerHTML='<p class="muted">Carregando perguntas…</p>';
  try {
    const d = await apiQuiz({acao:'iniciar', modulo:quizCfg.id});
    quizTentativa=d.tentativa; quizPerguntas=d.perguntas; qi=0; acertos=0; quizNota=0;
    desenhaQuizPadrao();
  } catch(e){ box.innerHTML='<div class="feedback show ruim">Não foi possível carregar o quiz. Confira sua conexão e recarregue a página.</div>'; }
}
function desenhaQuizPadrao(){
  const P=quizPerguntas, box=document.getElementById('quiz'), p=P[qi];
  box.innerHTML=`<span class="eyebrow">Quiz · pergunta ${qi+1} de ${P.length}</span>
    <div class="pontos">${P.map((_,i)=>`<i class="${i<qi?'on':''}"></i>`).join('')}</div>
    <div class="quiz-q">${esc(p.q)}</div>
    ${p.o.map((t,i)=>`<button class="quiz-opt" data-i="${i}">${esc(t)}</button>`).join('')}
    <div class="feedback" id="fbQuiz"></div>
    <button class="btn btn-pri" id="qProx" style="display:none;margin-top:14px">${qi<P.length-1?'Próxima pergunta →':'Ver resultado →'}</button>`;
  box.querySelectorAll('.quiz-opt').forEach(b=>b.onclick=async ()=>{
    box.querySelectorAll('.quiz-opt').forEach(x=>x.disabled=true);
    let r;
    try { r = await apiQuiz({acao:'responder', tentativa:quizTentativa, indice:qi, opcao:+b.dataset.i}); }
    catch(e){ box.querySelectorAll('.quiz-opt').forEach(x=>x.disabled=false); return; }
    if (r.correta) acertos++;
    box.querySelectorAll('.quiz-opt').forEach(x=>{ if(+x.dataset.i===r.certa) x.classList.add('certa'); });
    if (!r.correta) box.querySelector(`.quiz-opt[data-i="${r.escolhida}"]`).classList.add('errada');
    const fb=document.getElementById('fbQuiz'); fb.className='feedback show '+(r.correta?'bom':'ruim');
    fb.innerHTML=(r.correta?'<b>Correto!</b> ':'<b>Não foi dessa vez.</b> ')+r.explicacao;
    if (r.fim) quizNota=r.nota;
    const n=document.getElementById('qProx'); n.style.display='inline-block';
    n.onclick=()=>{ if(qi<P.length-1){qi++;desenhaQuizPadrao();} else {libera('quiz'); ir(atual+1);} };
  });
}
function refazQuiz(){ ir(steps.length-2); iniciaQuiz(); }
function mostraFim(){
  const P=quizPerguntas, pct=quizNota, aprovado=pct>=70, px=quizCfg.proximo;
  document.getElementById('fim').innerHTML=`
    <svg class="medalha" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="${aprovado?'#13a89e':'#f5a524'}"/><circle cx="60" cy="60" r="42" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="4 6"/><path d="${aprovado?'m40 62 13 13 28 -30':'M60 38v30M60 80v2'}" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <h1 style="margin-top:16px">${aprovado?'Módulo concluído!':'Quase lá!'}</h1>
    <div class="nota">${pct}%</div>
    <p>Você acertou ${acertos} de ${P.length} perguntas do quiz.</p>
    <p>${aprovado?(px?`Próximo módulo: <b>${px.titulo}</b>.`:'Você concluiu todos os módulos! Agora falta só a prova final.'):(quizCfg.revisar||'A nota mínima é 70%. Revise o conteúdo e tente o quiz de novo.')}</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:22px">
      <button class="btn btn-sec" onclick="refazQuiz()">Refazer o quiz</button>
      ${aprovado?(px&&px.url?`<a class="btn btn-pri" href="${px.url}">Ir para o próximo módulo →</a>`:'<a class="btn btn-pri" href="/">Voltar ao curso e fazer a prova final →</a>'):''}
    </div>`;
  document.getElementById('barra').style.width='100%';
  if (aprovado) confete();
}
