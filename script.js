/* CONFIG */
// WA number 081325144973 => 62...
const WA_NUMBER = '6281325144973';

/* HELPERS */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const escapeHtml = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

/* THEME + BUBBLES */
const themeToggle = $('#themeToggle'), themeLabel = $('#themeLabel'), body = document.body;
const savedTheme = localStorage.getItem('aufaa-theme') || 'strawberry';
if(savedTheme === 'matcha'){ body.classList.add('matcha'); themeToggle.checked = true; themeLabel.textContent='Matcha'; } else { themeLabel.textContent='Strawberry'; themeToggle.checked = false; }
themeToggle.addEventListener('change', ()=>{
  if(themeToggle.checked){ body.classList.add('matcha'); themeLabel.textContent='Matcha'; localStorage.setItem('aufaa-theme','matcha'); }
  else{ body.classList.remove('matcha'); themeLabel.textContent='Strawberry'; localStorage.setItem('aufaa-theme','strawberry'); }
});

function createBubbles(){
  const wrap = $('#bubbleWrap'); wrap.innerHTML = '';
  const colors = body.classList.contains('matcha') ? ['#dff6e6','#bff0c9','#e7fff0'] : ['#ffe6f0','#ffd0e0','#fff0f6'];
  for(let i=0;i<18;i++){
    const b = document.createElement('div'); b.className='bubble';
    const size = Math.round(18 + Math.random()*90);
    b.style.width = b.style.height = size+'px';
    b.style.left = Math.round(Math.random()*100)+'%';
    b.style.bottom = (-30 + Math.random()*60) + 'vh';
    b.style.background = colors[Math.floor(Math.random()*colors.length)];
    b.style.animationDuration = (8 + Math.random()*12).toFixed(1)+'s';
    b.style.opacity = (0.05 + Math.random()*0.14).toFixed(2);
    wrap.appendChild(b);
  }
}
createBubbles();
themeToggle.addEventListener('change', ()=> setTimeout(createBubbles,80));

/* LOADING & START */
window.addEventListener('load', ()=> setTimeout(()=> $('#loading').style.display='none',700));
$('#btnStart').addEventListener('click', ()=> {
  const w = $('#welcomeCard'); w.classList.add('bounce'); w.style.opacity='0'; w.style.transform='translateY(-8px) scale(.98)';
  setTimeout(()=>{ w.classList.add('hidden'); $('#choicesWrap').classList.remove('hidden'); $('#photoStripWrap').classList.remove('hidden'); }, 280);
});

/* CONFETTI CANVAS */
const confettiCanvas = $('#confettiCanvas'); const ctx = confettiCanvas.getContext('2d');
let confettiParts = [];
function resizeCanvas(){ confettiCanvas.width = innerWidth; confettiCanvas.height = innerHeight; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();
function spawnConfetti(x,y,amount=40){
  for(let i=0;i<amount;i++){
    confettiParts.push({
      x:x||Math.random()*innerWidth, y:y||Math.random()*innerHeight/3,
      vx:(Math.random()-0.5)*6, vy:(Math.random()*-7)-2, r:6+Math.random()*8,
      c:['#ff5c8a','#ffd27f','#ff85a1','#fff3b0','#d4f0d9'][Math.floor(Math.random()*5)],
      rot:Math.random()*360, vr:(Math.random()-0.5)*10, life:60+Math.random()*40
    });
  }
  setTimeout(()=>{ confettiParts = [] }, 2200);
}
function confettiLoop(){
  ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
  for(let i=confettiParts.length-1;i>=0;i--){
    const p = confettiParts[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.rot += p.vr; p.life -= 1;
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180); ctx.fillStyle = p.c; ctx.fillRect(-p.r/2,-p.r/2,p.r,p.r*0.7); ctx.restore();
    if(p.y > confettiCanvas.height+50 || p.life <= 0) confettiParts.splice(i,1);
  }
  requestAnimationFrame(confettiLoop);
}
confettiLoop();
function triggerConfetti(){ spawnConfetti(innerWidth/2, innerHeight/3, 60); }

/* MEALS (in-memory only) */
// initial in-memory state (resets on refresh)
let mealsState = {
  pagi: { done: false, what: '' },
  siang: { done: false, what: '' },
  malam: { done: false, what: '' }
};

function updateMealUI(){
  ['pagi','siang','malam'].forEach(k => {
    const card = document.querySelector(`.mini-card[data-meal="${k}"]`);
    const desc = $(`#${k}-desc`);
    if(mealsState[k].done){
      card.classList.add('done','active');
      desc.textContent = mealsState[k].what || 'Sudah dicatat';
      card.querySelector('.mc-toggle').textContent = 'Ubah';
    } else {
      card.classList.remove('done','active');
      desc.textContent = 'Belum dicatat';
      card.querySelector('.mc-toggle').textContent = 'Isi';
    }
  });
  const allDone = ['pagi','siang','malam'].every(k => mealsState[k].done);
  $('#uploadArea').style.display = allDone ? 'block' : 'none';
}
updateMealUI();

// click mini-card -> behaviour per spec: if not done -> popup "kenapa belum?" (user wanted popup whenever a checklist is not checked)
// But also there is toggle button to "Isi" which opens input for what eaten
$$('.mini-card').forEach(mc=>{
  mc.addEventListener('click', (e)=>{
    const meal = mc.dataset.meal;
    if(!mealsState[meal].done){
      // per request: popup appears every checklist belum di pencet -> ask reason, then open WA with reason
      openModalForm(`Kenapa belum makan (${meal})? 😢`, `<label>Tulis alasan kenapa belum:</label><textarea id="modal_input" rows="3" placeholder="Tulis alasannya..."></textarea>`, (val)=>{
        const message = `📋 *Laporan dari Aufaa*\n🍽️ ${meal.toUpperCase()} - BELUM makan\n📝 Alasan: ${val || '(tidak diisi)'}\n\nDikirim otomatis dari website sayang 💕`;
        triggerConfetti();
        window.location.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
        closeModal();
      }, 'Kirim ke Sayang 💌');
    } else {
      // allow edit what eaten
      openModalForm(`Ubah makanan (${meal})`, `<label>Isi makanan yang dimakan:</label><input id="modal_input" placeholder="Contoh: Nasi + telur" value="${escapeHtml(mealsState[meal].what||'')}" />`, (val)=>{
        mealsState[meal].what = val || mealsState[meal].what;
        updateMealUI(); closeModal();
      }, 'Simpan');
    }
  });
});

// small button click to "Isi" (prevent parent click duplication)
$$('.mc-toggle').forEach(btn=>{
  btn.addEventListener('click', (ev)=>{
    ev.stopPropagation();
    const meal = btn.dataset.meal || btn.closest('.mini-card').dataset.meal;
    // open input form for what eaten
    openModalForm(`Isi makanan (${meal})`, `<label>Udah makan apa ${meal}?</label><input id="modal_input" placeholder="Contoh: Nasi + telur" />`, (val)=>{
      mealsState[meal].done = true; mealsState[meal].what = val || 'Sudah makan';
      updateMealUI(); closeModal();
    }, 'Simpan');
  });
});

/* SAVE Laporan (in-memory) */
$('#saveMeal').addEventListener('click', ()=>{
  // if some missing -> open reason modal for first missing (per user request pop up per missing)
  const missing = ['pagi','siang','malam'].find(k => !mealsState[k].done);
  if(missing){
    openModalForm(`Kenapa belum makan (${missing})? 😢`, `<label>Tulis alasan kenapa belum:</label><textarea id="modal_input" rows="3" placeholder="Tulis alasannya..."></textarea>`, (val)=>{
      const message = `📋 *Laporan dari Aufaa*\n🍽️ ${missing.toUpperCase()} - BELUM makan\n📝 Alasan: ${val || '(tidak diisi)'}\n\nDikirim otomatis dari website sayang 💕`;
      triggerConfetti();
      window.location.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
      closeModal();
    }, 'Kirim ke Sayang 💌');
    return;
  }
  // all done -> temporary save (in-memory) and notify
  triggerConfetti();
  alert('Laporan makan dicatat sementara (akan hilang saat refresh).');
});

/* SHARE -> send full summary text via WA */
$('#shareMeal').addEventListener('click', ()=>{
  const missingAll = ['pagi','siang','malam'].filter(k => !mealsState[k].done);
  if(missingAll.length){
    const first = missingAll[0];
    openModalForm(`Kenapa belum makan (${first})? 😢`, `<label>Tulis alasan kenapa belum:</label><textarea id="modal_input" rows="3" placeholder="Tulis alasannya..."></textarea>`, (val)=>{
      const message = `📋 *Laporan dari Aufaa*\n🍽️ ${first.toUpperCase()} - BELUM makan\n📝 Alasan: ${val || '(tidak diisi)'}\n\nDikirim otomatis dari website sayang 💕`;
      triggerConfetti();
      window.location.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
      closeModal();
    }, 'Kirim ke Sayang 💌');
    return;
  }
  // all done -> make summary text
  let text = `📋 *Laporan Makan Aufaa*\n`;
  ['pagi','siang','malam'].forEach(k=>{
    const label = k==='pagi' ? 'Pagi' : k==='siang' ? 'Siang' : 'Malam';
    text += `\n🍽️ ${label}: ${mealsState[k].done ? ('Sudah - '+(mealsState[k].what||'(tidak diisi)')) : 'Belum'}\n`;
  });
  text += `\nDikirim otomatis dari website sayang 💕`;
  triggerConfetti();
  window.location.href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
});

/* MODAL helpers */
function openModalForm(title, innerHTML, onSubmit, submitLabel='Kirim'){
  const modal = $('#modal'); const mi = $('#modalInner');
  mi.innerHTML = `<h3 style="margin:0 0 8px">${title}</h3><div style="margin-bottom:10px">${innerHTML}</div><div style="display:flex;gap:8px;justify-content:flex-end"><button id="modalCancel" class="btn-ghost">Batal</button><button id="modalOk" class="btn">${submitLabel}</button></div>`;
  modal.classList.remove('hidden');
  $('#modalCancel').addEventListener('click', closeModalOnce);
  $('#modalOk').addEventListener('click', ()=>{
    const input = mi.querySelector('#modal_input');
    onSubmit(input ? input.value.trim() : '');
  }, {once:true});
}
function closeModal(){ $('#modal').classList.add('hidden'); $('#modalInner').innerHTML=''; }
function closeModalOnce(){ closeModal(); }

/* SCHEDULE: no checklist — cards already in HTML; optionally allow copy/save template */
$('#choicesSaveSchedule')?.addEventListener('click', ()=>{
  // optional: not required by user; left placeholder
});

/* NOTES (persisted) */
$('#addNote').addEventListener('click', ()=>{
  const t = ($('#note_title').value||'').trim(); const txt = ($('#note_text').value||'').trim();
  if(!txt) return alert('Tulis dulu catatannya ya sayang 😊');
  const arr = JSON.parse(localStorage.getItem('aufaa-notes')||'[]'); arr.unshift({title:t||'(Tanpa judul)', text:txt, time: new Date().toISOString()});
  localStorage.setItem('aufaa-notes', JSON.stringify(arr)); $('#note_title').value=''; $('#note_text').value=''; triggerConfetti(); renderNotes();
});
function renderNotes(){
  const list = JSON.parse(localStorage.getItem('aufaa-notes')||'[]'); const wrap = $('#notesList'); wrap.innerHTML='';
  list.forEach((n, idx)=>{ const el=document.createElement('div'); el.className='note-item'; el.innerHTML = `<small>${new Date(n.time).toLocaleString()}</small><strong>${escapeHtml(n.title)}</strong><p>${escapeHtml(n.text)}</p><div style="margin-top:8px"><button data-i="${idx}" class="del-note btn-ghost">Hapus</button></div>`; wrap.appendChild(el); });
  wrap.querySelectorAll('.del-note').forEach(b=>b.addEventListener('click', ()=>{
    if(!confirm('Hapus catatan ini?')) return; const i = parseInt(b.dataset.i,10); const arr = JSON.parse(localStorage.getItem('aufaa-notes')||'[]'); arr.splice(i,1); localStorage.setItem('aufaa-notes', JSON.stringify(arr)); renderNotes();
  }));
}
$('#exportNotes').addEventListener('click', ()=>{
  const arr = JSON.parse(localStorage.getItem('aufaa-notes')||'[]'); const txt = arr.map(n=>`--- ${n.title} (${n.time}) ---\n${n.text}\n\n`).join(''); const blob = new Blob([txt],{type:'text/plain'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='aufaa-notes.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

/* INIT on DOMContentLoaded */
window.addEventListener('DOMContentLoaded', ()=>{
  updateMealUI();
  renderNotes();
  // bind small toggles (they were assigned earlier)
  // allow pausing photo track on touch
  $('#photoTrack')?.addEventListener('touchstart', ()=> $('#photoTrack').style.animationPlayState='paused');
  $('#photoTrack')?.addEventListener('touchend', ()=> $('#photoTrack').style.animationPlayState='running');
});

/* modal close */
$('#modalClose').addEventListener('click', closeModal);

/* some accessibility: horizontal scroll index via keys (optional) */
const cardEls = $$('.card'); let currentIndex = 0;
function showCardAt(i){ currentIndex = Math.max(0, Math.min(i, cardEls.length-1)); cardEls[currentIndex].scrollIntoView({behavior:'smooth',inline:'center'}); }
document.addEventListener('keydown', e=>{ if(e.key==='ArrowRight') showCardAt(currentIndex+1); if(e.key==='ArrowLeft') showCardAt(currentIndex-1); });
