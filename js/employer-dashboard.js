function el(t, c) {
    const e = document.createElement(t);
    if (c) e.className = c;
    return e
}

function applySessionHeader() {
    const box = document.getElementById('userArea');
    if (!box) return;
    let s = null;
    try {
        s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
    } catch {}
    if (s && s.token) {
        try {
            fetch(`${location.origin.replace(/\/$/,'')}/api/auth/me`, {
                headers: {
                    Authorization: `Bearer ${s.token}`
                },
                cache: 'no-store'
            }).then(r => r.ok ? r.json() : null).then(me => {
                if (me && me.role) {
                    s.role = me.role;
                    localStorage.setItem('ptu_session', JSON.stringify(s))
                }
                renderHeader(s, box)
            }).catch(() => renderHeader(s, box));
            return
        } catch {}
    }
    renderHeader(s, box)
}

function renderHeader(s, box) {
    if (!s) {
        box.innerHTML = '<a class="btn" href="./login.html">เข้าสู่ระบบ</a>';
        return
    }
    box.innerHTML = '';
    const pill = el('a', 'user-pill');
    pill.href = './profile.html';
    const displayName = (s.username || s.email || 'User')
    const av = el('div', 'avatar');
    av.textContent = displayName.trim().charAt(0).toUpperCase();
    const nm = el('span', 'name');
    nm.textContent = displayName;
    const rb = el('span', 'role-badge');
    const roleTxt = s.role === 'admin' ? 'แอดมิน' : (s.role === 'employer' ? 'ผู้ประกอบการ' : 'ผู้ใช้');
    rb.textContent = roleTxt;
    rb.classList.add(s.role === 'admin' ? 'role-admin' : (s.role === 'employer' ? 'role-employer' : 'role-user'));
    pill.append(av, nm, rb);
    const lo = el('button', 'logout-btn');
    lo.textContent = 'ออกจากระบบ';
    lo.addEventListener('click', () => {
        localStorage.removeItem('ptu_session');
        location.href = './login.html'
    })
    const profileBtn = el('a', 'logout-btn');
    profileBtn.textContent = 'โปรไฟล์';
    profileBtn.href = './profile.html';
    const postBtn = el('a', 'logout-btn');
    postBtn.textContent = 'โพสต์งาน';
    postBtn.href = './post-job.html';
    const dashBtn = el('a', 'logout-btn');
    dashBtn.textContent = 'แดชบอร์ดผู้ประกอบการ';
    dashBtn.href = './employer-dashboard.html';
    if (s.role === 'user') {
        box.append(pill, profileBtn, lo)
    } else if (s.role === 'admin') {
        const adminBtn = el('a', 'logout-btn');
        adminBtn.textContent = 'แผงควบคุมแอดมิน';
        adminBtn.href = './admin.html';
        box.append(pill, profileBtn, adminBtn, lo)
    } else {
        box.append(pill, profileBtn, postBtn, dashBtn, lo)
    }
}
async function ensureEmployer() {
    let s = null;
    try {
        s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
    } catch {}
    const err = document.getElementById('err');
    if (!s || !s.token) {
        err.textContent = 'โปรดเข้าสู่ระบบ';
        return null
    }
    try {
        const r = await fetch(`${location.origin.replace(/\/$/,'')}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${s.token}`
            },
            cache: 'no-store'
        });
        if (r.ok) {
            const me = await r.json();
            if (me && me.role === 'employer') {
                return s
            }
        }
        err.textContent = 'หน้าสำหรับผู้ประกอบการเท่านั้น';
        return null
    } catch {
        err.textContent = 'ตรวจสอบสิทธิ์ไม่สำเร็จ';
        return null
    }
}

function jobCard(job, onViewApps) {
    const card = el('div', 'card shadow');
    const h = el('h3');
    h.textContent = job.title;
    const meta = el('div', 'meta');
    const limit = Math.max(1, Number(job.positions || 1));
    const filled = Number(job.hiredCount || 0) >= limit || Boolean(job.full);
    meta.textContent = `${job.rate} ${job.unit} • ${job.type}`;
    const tags = el('div', 'tags');
    (job.tags || []).forEach(t => {
        const b = el('span', 'tag');
        b.textContent = t;
        tags.append(b)
    });
    const stats = el('div', 'meta');
    stats.textContent = `รับ ${limit} ตำแหน่ง • รับแล้ว ${job.hiredCount||0}`;
    const actions = el('div', 'card-actions');
    const open = el('button', 'btn-secondary btn');
    open.textContent = 'ดูใบสมัคร';
    open.addEventListener('click', () => onViewApps(job));
    actions.append(open);
    if (filled) {
        const fullBadge = el('span', 'tag');
        fullBadge.textContent = 'พนักงานเต็มจำนวนแล้ว';
        actions.append(fullBadge)
    }
    card.append(h, meta, tags, stats, actions);
    return card
}

function applicationCard(app, job, s) {
    const card = el('div', 'card shadow');
    const h = el('h3');
    h.textContent = app.applicantName || 'ผู้สมัคร';
    const meta = el('div', 'meta');
    meta.textContent = `อีเมล: ${app.email||'-'} • โทร: ${app.phone||'-'}`;
    const about = el('div', 'info-desc');
    about.textContent = (app.about || '').trim() || 'ไม่ได้ระบุ';
    const status = el('div', 'meta');
    status.textContent = `สถานะ: ${app.status||'pending'}`;
    const actions = el('div', 'card-actions');
    const msg = el('button', 'btn-outline btn');
    msg.textContent = 'ส่งข้อความ';
    msg.addEventListener('click', () => handleMessage(app, job, s));
    const reject = el('button', 'btn-reject btn');
    reject.textContent = 'ปฏิเสธการทำงาน';
    reject.addEventListener('click', () => handleReject(app, job, s));
    const approve = el('button', 'btn-approve btn');
    approve.textContent = 'อนุมัติการทำงาน';
    approve.addEventListener('click', () => handleApprove(app, job, s));
    actions.append(msg, reject, approve);
    card.append(h, meta, about, status, actions);
    return card
}
async function loadMyJobs(s) {
    const grid = document.getElementById('jobGrid');
    const loader = document.getElementById('jobsLoader');
    grid.innerHTML = '';
    loader.style.display = 'flex';
    try {
        const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/employer/jobs/my`, {
            headers: {
                Authorization: `Bearer ${s.token}`
            }
        });
        const data = await resp.json();
        if (!resp.ok) {
            document.getElementById('err').textContent = data.error || 'โหลดงานไม่สำเร็จ';
            loader.style.display = 'none';
            return
        }
        const list = Array.isArray(data.jobs) ? data.jobs : data;
        list.forEach(job => grid.append(jobCard(job, j => loadApplications(j, s))));
    } catch {
        document.getElementById('err').textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
    }
    loader.style.display = 'none'
}
async function loadApplications(job, s) {
    const area = document.getElementById('appsArea');
    const loader = document.getElementById('appsLoader');
    area.innerHTML = '';
    loader.style.display = 'flex';
    try {
        const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/employer/jobs/${encodeURIComponent(job._id||job.id)}/applications`, {
            headers: {
                Authorization: `Bearer ${s.token}`
            }
        });
        const data = await resp.json();
        if (!resp.ok) {
            document.getElementById('err').textContent = data.error || 'โหลดใบสมัครไม่สำเร็จ';
            loader.style.display = 'none';
            return
        }
        let list = (Array.isArray(data.applications) ? data.applications : data);
        list = list.filter(a => String(a.status || 'pending') === 'pending');
        if (!list.length) {
            const empty = el('div', 'card');
            const h = el('h3');
            h.textContent = 'ยังไม่มีใบสมัคร';
            const p = el('div', 'meta');
            p.textContent = 'ไม่มีใบสมัครที่รอดำเนินการ';
            empty.append(h, p);
            area.append(empty)
        }
        list.forEach(app => area.append(applicationCard(app, job, s)));
    } catch {
        document.getElementById('err').textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
    }
    loader.style.display = 'none'
}

function showToast(title, type) {
    const wrap = el('div', 'modal-backdrop');
    const card = el('div', `modal-card modal-${type}`);
    const header = el('div', 'modal-header');
    const icon = el('div', `modal-icon ${type==='success'?'success':'error'}`);
    icon.textContent = type === 'success' ? '✓' : '✕';
    const tt = el('h3', 'modal-title');
    tt.textContent = title;
    header.append(icon, tt);
    const act = el('div', 'modal-actions');
    const ok = el('button', 'modal-btn modal-primary');
    ok.textContent = 'ปิด';
    ok.addEventListener('click', () => wrap.remove());
    act.append(ok);
    card.append(header, act);
    wrap.append(card);
    document.body.appendChild(wrap)
}
async function handleApprove(app, job, s) {
    try {
        const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/employer/jobs/${encodeURIComponent(job._id||job.id)}/applications/${encodeURIComponent(app._id||app.id)}/approve`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${s.token}`
            }
        });
        const data = await resp.json();
        if (!resp.ok) {
            showToast(data.error || 'อนุมัติไม่สำเร็จ', 'error');
            return
        }
        showToast('อนุมัติสำเร็จ', 'success');
        loadApplications(job, s);
        loadMyJobs(s)
    } catch {
        showToast('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error')
    }
}
async function handleReject(app, job, s) {
    try {
        const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/employer/jobs/${encodeURIComponent(job._id||job.id)}/applications/${encodeURIComponent(app._id||app.id)}/reject`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${s.token}`
            }
        });
        const data = await resp.json();
        if (!resp.ok) {
            showToast(data.error || 'ปฏิเสธไม่สำเร็จ', 'error');
            return
        }
        showToast('ปฏิเสธสำเร็จ', 'success');
        loadApplications(job, s)
    } catch {
        showToast('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error')
    }
}

function handleMessage(app, job, s) {
    const wrap = el('div', 'modal-backdrop');
    const card = el('div', 'modal-card modal-success');
    const header = el('div', 'modal-header');
    const icon = el('div', 'modal-icon info');
    icon.textContent = 'i';
    const tt = el('h3', 'modal-title');
    tt.textContent = 'ส่งข้อความถึงผู้สมัคร';
    header.append(icon, tt);
    const ta = el('textarea', 'textarea');
    ta.rows = 4;
    ta.placeholder = 'พิมพ์ข้อความถึงผู้สมัคร';
    const act = el('div', 'modal-actions');
    const cancel = el('button', 'modal-btn modal-secondary');
    cancel.textContent = 'ยกเลิก';
    cancel.addEventListener('click', () => wrap.remove());
    const ok = el('button', 'modal-btn modal-primary');
    ok.textContent = 'ส่ง';
    ok.addEventListener('click', async () => {
        const txt = (ta.value || '').trim();
        if (!txt) {
            return
        }
        try {
            const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/employer/jobs/${encodeURIComponent(job._id||job.id)}/applications/${encodeURIComponent(app._id||app.id)}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${s.token}`
                },
                body: JSON.stringify({
                    text: txt
                })
            });
            const data = await resp.json();
            if (!resp.ok) {
                showToast(data.error || 'ส่งข้อความไม่สำเร็จ', 'error')
            } else {
                showToast('ส่งข้อความแล้ว', 'success');
                wrap.remove()
            }
        } catch {
            showToast('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'error')
        }
    });
    act.append(cancel, ok);
    card.append(header, ta, act);
    wrap.append(card);
    document.body.appendChild(wrap)
}
document.addEventListener('DOMContentLoaded', async () => {
    applySessionHeader();
    const s = await ensureEmployer();
    if (!s) return;
    loadMyJobs(s)
})