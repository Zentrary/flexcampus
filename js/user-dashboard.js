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
    const displayName = (s.username || s.email || 'User');
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
    const applyBtn = el('a', 'logout-btn');
    applyBtn.textContent = 'สมัครเป็นผู้ประกอบการ';
    applyBtn.href = './employer-apply.html';
    const postBtn = el('a', 'logout-btn');
    postBtn.textContent = 'โพสต์งาน';
    postBtn.href = './post-job.html';
    const dashBtn = el('a', 'logout-btn');
    dashBtn.textContent = 'แดชบอร์ดผู้ประกอบการ';
    dashBtn.href = './employer-dashboard.html';
    const userDash = el('a', 'logout-btn');
    userDash.textContent = 'สถานะการสมัคร';
    userDash.href = './user-dashboard.html';
    if (s.role === 'user') {
        box.append(pill, profileBtn, userDash, applyBtn, lo)
    } else if (s.role === 'admin') {
        const adminBtn = el('a', 'logout-btn');
        adminBtn.textContent = 'แผงควบคุมแอดมิน';
        adminBtn.href = './admin.html';
        const postBtn = el('a', 'logout-btn');
        postBtn.textContent = 'โพสต์งาน';
        postBtn.href = './post-job.html';
        box.append(pill, profileBtn, adminBtn, postBtn, lo)
    } else {
        box.append(pill, profileBtn, postBtn, dashBtn, lo)
    }
}
async function ensureUser() {
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
            if (me && me.role) {
                s.role = me.role;
                localStorage.setItem('ptu_session', JSON.stringify(s))
            }
        }
        return s
    } catch {
        return s
    }
}

function appCard(app) {
    const card = el('div', 'card shadow');
    const h = el('h3');
    h.textContent = app.jobTitle || 'งาน';
    const meta = el('div', 'meta');
    meta.textContent = `สถานะ: ${app.status||'pending'}`;
    const more = el('div', 'meta');
    more.textContent = new Date(app.createdAt || Date.now()).toLocaleString('th-TH');
    const last = (Array.isArray(app.messages) ? app.messages[app.messages.length - 1] : null);
    if (last) {
        const preview = el('div', 'info-desc');
        preview.textContent = `ข้อความล่าสุดจาก${last.from==='employer'?'ผู้ประกอบการ':'ระบบ'}: ${(last.text||'').slice(0,80)}`;
        card.append(preview)
    }
    const actions = el('div', 'card-actions');
    const view = el('a', 'btn-secondary btn');
    view.textContent = 'ดูรายละเอียด';
    const code = (app.accessCode || '');
    if (code) {
        view.href = `./check-application.html?id=${encodeURIComponent(app._id||app.id)}&code=${encodeURIComponent(code)}`
    } else {
        view.href = `./check-application.html?id=${encodeURIComponent(app._id||app.id)}`
    }
    const job = el('a', 'btn');
    job.textContent = 'ดูงาน';
    job.href = `./job-detail.html?id=${encodeURIComponent(app.jobId||app._id||'')}`;
    actions.append(view, job);
    card.append(h, meta, more, actions);
    return card
}
async function loadApplications(s) {
    const grid = document.getElementById('appsGrid');
    const loader = document.getElementById('appsLoader');
    grid.innerHTML = '';
    loader.style.display = 'flex';
    let serverList = [];
    try {
        const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/user/applications`, {
            headers: {
                Authorization: `Bearer ${s.token}`
            }
        });
        const data = await resp.json();
        if (resp.ok) {
            serverList = (Array.isArray(data.applications) ? data.applications : data) || []
        }
    } catch {}
    let localList = [];
    try {
        localList = JSON.parse(localStorage.getItem('ptu_my_apps') || '[]') || []
    } catch {}
    const existsIds = new Set(serverList.map(a => String(a._id || a.id || '')));
    const fetchTasks = localList.filter(x => !existsIds.has(String(x.id || ''))).map(async (x) => {
        try {
            const r = await fetch(`${location.origin.replace(/\/$/,'')}/api/applications/${encodeURIComponent(x.id)}?code=${encodeURIComponent(x.code||'')}`);
            const d = await r.json();
            if (r.ok) {
                return d
            }
        } catch {}
        return null
    });
    let localDetails = [];
    try {
        localDetails = (await Promise.all(fetchTasks)).filter(Boolean)
    } catch {
        localDetails = []
    }
    // normalize server docs to include needed fields
    serverList = serverList.map(a => ({
        id: a._id || a.id,
        _id: a._id,
        jobId: a.jobId,
        jobTitle: a.jobTitle,
        status: a.status,
        createdAt: a.createdAt,
        accessCode: a.accessCode,
        messages: a.messages || []
    }))
    const all = serverList.concat(localDetails);
    const summary = document.getElementById('appsSummary');
    if (summary) {
        summary.innerHTML = '';
        const pending = all.filter(a => String(a.status || 'pending') === 'pending').length;
        const approved = all.filter(a => String(a.status || '') === 'approved').length;
        const rejected = all.filter(a => String(a.status || '') === 'rejected').length;
        const make = (label, value) => {
            const c = el('div', 'card');
            const h = el('h3');
            h.textContent = String(value || 0);
            const m = el('div', 'meta');
            m.textContent = label;
            c.append(h, m);
            return c
        };
        summary.append(make('รอดำเนินการ', pending), make('อนุมัติแล้ว', approved), make('ปฏิเสธแล้ว', rejected))
    }
    // messages aggregate
    const msgGrid = document.getElementById('msgGrid');
    if (msgGrid) {
        msgGrid.innerHTML = '';
        const messages = [];
        all.forEach(a => {
            (a.messages || []).forEach((m, i) => {
                messages.push({
                    text: m.text,
                    from: m.from,
                    at: new Date(m.at || a.createdAt || Date.now()),
                    jobTitle: a.jobTitle,
                    appId: a._id || a.id,
                    code: a.accessCode || '',
                    index: i
                })
            })
        });
        messages.sort((x, y) => y.at - x.at);
        const top = messages.slice(0, 10);
        if (!top.length) {
            const empty = el('div', 'card');
            const h = el('h3');
            h.textContent = 'ยังไม่มีข้อความ';
            const p = el('div', 'meta');
            p.textContent = 'เมื่อผู้ประกอบการส่งข้อความ ข้อความจะปรากฏที่นี่';
            empty.append(h, p);
            msgGrid.append(empty)
        } else {
            top.forEach(m => {
                const c = el('div', 'card');
                const t = el('h3');
                t.textContent = m.jobTitle || 'งาน';
                const meta = el('div', 'meta');
                meta.textContent = `จาก ${m.from==='employer'?'ผู้ประกอบการ':'ระบบ'} • ${m.at.toLocaleString('th-TH')}`;
                const d = el('div', 'info-desc');
                d.textContent = m.text;
                const view = el('a', 'btn-secondary btn');
                view.textContent = 'เปิดใบสมัคร';
                view.href = `./check-application.html?id=${encodeURIComponent(m.appId)}${m.code?`&code=${encodeURIComponent(m.code)}`:''}`;
                const del = el('button', 'btn-danger btn');
                del.textContent = 'ลบข้อความ';
                del.addEventListener('click', async () => {
                    try {
                        const url = `${location.origin.replace(/\/$/,'')}/api/applications/${encodeURIComponent(m.appId)}/messages/${encodeURIComponent(m.index)}${m.code?`?code=${encodeURIComponent(m.code)}`:''}`;
                        const r = await fetch(url, {
                            method: 'DELETE'
                        });
                        const d = await r.json();
                        if (r.ok) {
                            loadApplications(s)
                        }
                    } catch {}
                });
                const actions = el('div', 'card-actions');
                actions.append(view, del);
                c.append(t, meta, d, actions);
                msgGrid.append(c)
            })
        }
    }
    if (!all.length) {
        const empty = el('div', 'card');
        const h = el('h3');
        h.textContent = 'ยังไม่มีใบสมัคร';
        const p = el('div', 'meta');
        p.textContent = 'หลังสมัครงาน ใบสมัครจะปรากฏที่นี่หรือเข้าผ่านลิงก์สถานะด้วยรหัสติดตาม';
        empty.append(h, p);
        grid.append(empty)
    }
    all.forEach(app => grid.append(appCard(app)));
    loader.style.display = 'none'
}
document.addEventListener('DOMContentLoaded', async () => {
    applySessionHeader();
    const s = await ensureUser();
    if (!s) return;
    loadApplications(s)
})

async function loadEmployerApplicationStatus(s) {
    try {
        const r = await fetch(`${location.origin.replace(/\/$/,'')}/api/employer/application/status`, {
            headers: {
                Authorization: `Bearer ${s.token}`
            },
            cache: 'no-store'
        });
        const st = await r.json();
        if (r.ok && st && st.has) {
            const box = document.getElementById('empStatusBox');
            const step = document.getElementById('empStepper');
            box.style.display = 'block';
            step.innerHTML = '';
            const steps = [{
                k: 'submitted',
                t: 'ส่งคำขอสมัครแล้ว'
            }, {
                k: 'pending',
                t: 'รอการอนุมัติ'
            }, {
                k: 'approved',
                t: 'สำเร็จ'
            }];
            const stat = st.status === 'approved' ? 'approved' : (st.status === 'rejected' ? 'rejected' : 'pending');
            steps.forEach((s, i) => {
                const stEl = el('div', 'step');
                const dot = el('div', 'step-dot');
                const lb = el('div', 'step-label');
                lb.textContent = s.t;
                if (stat === 'approved') {
                    dot.classList.add('active')
                } else if (stat === 'pending' && i <= 1) {
                    dot.classList.add('active')
                }
                stEl.append(dot, lb);
                step.append(stEl);
                if (i < steps.length - 1) {
                    const line = el('div', 'step-line');
                    if (stat === 'approved' || (stat === 'pending' && i < 1)) line.classList.add('active');
                    step.append(line)
                }
            })
        }
    } catch {}
}
document.addEventListener('DOMContentLoaded', async () => {
    const s = await ensureUser();
    if (s) {
        loadEmployerApplicationStatus(s)
    }
})
