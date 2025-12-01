function el(t, c) { const e = document.createElement(t); if (c) e.className = c; return e }

function getSession() { try { return JSON.parse(localStorage.getItem('ptu_session')||'null') } catch { return null } }

async function applySessionHeader() {
  const box = document.getElementById('userArea'); if (!box) return;
  let s = getSession();
  if (s && s.token) {
    try {
      const me = await fetch(`${location.origin.replace(/\/$/,'')}/api/auth/me`, { headers: { Authorization: `Bearer ${s.token}` } }).then(r=>r.json());
      if (me && me.role) { s.role = me.role; localStorage.setItem('ptu_session', JSON.stringify(s)) }
    } catch {}
  }
  box.innerHTML = '';
  if (!s) { box.innerHTML = '<a class="btn" href="./login.html">เข้าสู่ระบบ</a>'; return }
  const pill = el('a','user-pill'); pill.href='./profile.html';
  const av = el('div','avatar'); const nm = el('span','name'); const rb = el('span','role-badge');
  const displayName = (s.username||s.email||'User'); av.textContent = displayName.trim().charAt(0).toUpperCase(); nm.textContent=displayName;
  rb.textContent = s.role==='admin'?'แอดมิน':(s.role==='employer'?'ผู้ประกอบการ':'ผู้ใช้'); rb.classList.add(s.role==='admin'?'role-admin':(s.role==='employer'?'role-employer':'role-user'));
  pill.append(av,nm,rb);
  const profileBtn = el('a','logout-btn'); profileBtn.textContent='โปรไฟล์'; profileBtn.href='./profile.html';
  const adminBtn = el('a','logout-btn'); adminBtn.textContent='แผงควบคุมแอดมิน'; adminBtn.href='./admin.html';
  const postBtn = el('a','logout-btn'); postBtn.textContent='โพสต์งาน'; postBtn.href='./post-job.html';
  const dashBtn = el('a','logout-btn'); dashBtn.textContent='แดชบอร์ดผู้ประกอบการ'; dashBtn.href='./employer-dashboard.html';
  const lo = el('button','logout-btn'); lo.textContent='ออกจากระบบ'; lo.addEventListener('click',()=>{ localStorage.removeItem('ptu_session'); location.href='./login.html' });
  if (s.role==='user') { box.append(pill, profileBtn, dashBtn, lo) }
  else if (s.role==='admin') { box.append(pill, profileBtn, adminBtn, postBtn, lo) }
  else { box.append(pill, profileBtn, postBtn, dashBtn, lo) }
}

async function loadRanking() {
  const base = location.origin.replace(/\/$/,'');
  let list = [];
  try {
    const r = await fetch(`${base}/api/employers/top-liked?limit=10`, { cache:'no-store' });
    if (r.ok) { const d = await r.json(); list = Array.isArray(d.list)?d.list:[] }
  } catch {}
  renderRanking(list)
}

function renderRanking(list) {
  const top = list.slice(0,3); const rest = list.slice(3); const topBox = document.getElementById('rankTop'); const listBox = document.getElementById('rankList');
  topBox.innerHTML=''; listBox.innerHTML='';
  top.forEach((it, i)=> topBox.append(topCard(it, i+1)));
  rest.forEach((it, i)=> listBox.append(listItem(it, i+4)));
}

function topCard(it, rank) {
  const card = el('div','rank-card rank-large shadow');
  const badge = el('div','rank-badge'); badge.textContent = `อันดับ ${rank}`;
  const name = el('h3'); name.textContent = it.orgName || it.name || '-';
  const meta = el('div','meta'); meta.textContent = `ถูกใจรวม ${Number(it.likes||0)} ครั้ง`;
  card.append(badge, name, meta);
  card.style.cursor = 'pointer';
  card.addEventListener('click', ()=>{
    const org = encodeURIComponent(it.orgName || it.name || '-');
    const id = encodeURIComponent(String(it.employerId||''));
    if (id) location.href = `./jobs.html?employerId=${id}&orgName=${org}`;
  });
  return card
}

function listItem(it, rank) {
  const row = el('div','rank-item');
  const left = el('div','rank-left'); left.textContent = `#${rank}`;
  const mid = el('div','rank-mid'); mid.textContent = it.orgName || it.name || '-';
  const right = el('div','rank-right'); right.textContent = `${Number(it.likes||0)} ถูกใจ`;
  row.append(left, mid, right);
  row.style.cursor = 'pointer';
  row.addEventListener('click', ()=>{
    const org = encodeURIComponent(it.orgName || it.name || '-');
    const id = encodeURIComponent(String(it.employerId||''));
    if (id) location.href = `./jobs.html?employerId=${id}&orgName=${org}`;
  });
  return row
}

document.addEventListener('DOMContentLoaded', ()=>{ applySessionHeader(); loadRanking() })
