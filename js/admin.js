function el(t, c) {
    const e = document.createElement(t);
    if (c) e.className = c;
    return e
}

function getSession() {
    try {
        return JSON.parse(localStorage.getItem('ptu_session') || 'null')
    } catch {
        return null
    }
}
async function applySessionHeader() {
    const box = document.getElementById('userArea');
    let s = getSession();
    if (s && s.token) {
        try {
            const me = await fetchJSON(`${location.origin.replace(/\/$/,'')}/api/auth/me`);
            if (me && me.role) {
                s.role = me.role;
                localStorage.setItem('ptu_session', JSON.stringify(s))
            }
        } catch {}
    }
    s = getSession();
    if (!s) {
        box.innerHTML = '<a class="btn" href="./login.html">เข้าสู่ระบบ</a>';
        return
    }
    box.innerHTML = '';
    const pill = el('a', 'user-pill');
    pill.href = './profile.html';
    const av = el('div', 'avatar');
    av.textContent = (s.username || 'U').charAt(0).toUpperCase();
    const nm = el('span', 'name');
    nm.textContent = (s.username || s.email || 'User');
    const rb = el('span', 'role-badge');
    rb.textContent = s.role === 'admin' ? 'แอดมิน' : (s.role === 'employer' ? 'ผู้ประกอบการ' : 'ผู้ใช้');
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
    const adminBtn = el('a', 'logout-btn');
    adminBtn.textContent = 'แผงควบคุมแอดมิน';
    adminBtn.href = './admin.html';
    if (s.role === 'user') {
        box.append(pill, profileBtn, userDash, applyBtn, lo)
    } else if (s.role === 'admin') {
        box.append(pill, profileBtn, adminBtn, postBtn, lo)
    } else {
        box.append(pill, profileBtn, postBtn, dashBtn, lo)
    }
}
async function fetchJSON(url) {
    const s = getSession();
    const h = {};
    if (s && s.token) h['Authorization'] = `Bearer ${s.token}`;
    const r = await fetch(url, {
        headers: h
    });
    if (!r.ok) throw new Error('bad');
    return r.json()
}

function showModal(type, title, desc) {
    const wrap = el('div', 'modal-backdrop');
    const card = el('div', `modal-card modal-${type}`);
    const icon = el('div', 'modal-icon');
    icon.textContent = type === 'success' ? '✓' : 'ℹ';
    const tt = el('h3', 'modal-title');
    tt.textContent = title;
    const dd = el('div', 'modal-desc');
    dd.textContent = desc || '';
    const act = el('div', 'modal-actions');
    const ok = el('button', 'modal-btn modal-primary');
    ok.textContent = 'ตกลง';
    ok.addEventListener('click', () => wrap.remove());
    act.append(ok);
    card.append(icon, tt, dd, act);
    wrap.append(card);
    document.body.appendChild(wrap);
}

function showConfirm(title, desc, onConfirm) {
    const wrap = el('div', 'modal-backdrop');
    const card = el('div', 'modal-card');
    const tt = el('h3', 'modal-title');
    tt.textContent = title;
    const dd = el('div', 'modal-desc');
    dd.textContent = desc || '';
    const act = el('div', 'modal-actions');
    const cancel = el('button', 'modal-btn modal-secondary');
    cancel.textContent = 'ยกเลิก';
    cancel.addEventListener('click', () => wrap.remove());
    const ok = el('button', 'modal-btn modal-primary');
    ok.textContent = 'ยืนยัน';
    ok.addEventListener('click', () => {
        wrap.remove();
        try {
            onConfirm && onConfirm()
        } catch {}
    });
    act.append(cancel, ok);
    card.append(tt, dd, act);
    wrap.append(card);
    document.body.appendChild(wrap);
}
async function loadStats() {
    try {
        const base = location.origin.replace(/\/$/, '');
        const data = await fetchJSON(`${base}/api/admin/stats`);
        document.getElementById('statUsers').textContent = data.users || 0;
        document.getElementById('statEmployers').textContent = data.employers || 0;
        document.getElementById('statAdmins').textContent = data.admins || 0;
    } catch {
        document.getElementById('statUsers').textContent = '-';
        document.getElementById('statEmployers').textContent = '-';
        document.getElementById('statAdmins').textContent = '-';
    }
}

function appCard(a) {
    const card = el('div', 'card shadow');
    const h = el('h3');
    h.textContent = a.orgName || '-';
    const meta = el('div', 'meta');
    meta.textContent = `ผู้ขอ: ${a.name||a.username||a.email||'-'} • สถานะ: ${a.status}`;
    const detail = el('div', 'meta');
    detail.textContent = (a.description || '') + (a.reason ? ` • ${a.reason}` : '');
    const actions = el('div', 'card-actions');
    const view = el('button', 'btn-secondary btn');
    view.textContent = 'ตรวจสอบ';
    view.addEventListener('click', () => {
        showModal('success', 'รายละเอียด', `องค์กร: ${a.orgName||'-'}\nโทร: ${a.contactPhone||'-'}\nลิงก์: ${a.portfolioUrl||'-'}\nคำอธิบาย: ${a.description||'-'}\nเหตุผล: ${a.reason||'-'}`)
    })
    const approve = el('button', 'btn btn-approve');
    approve.textContent = 'ยืนยัน';
    approve.addEventListener('click', () => showConfirm('ยืนยันคำขอ', 'ต้องการอนุมัติผู้ประกอบการรายนี้หรือไม่?', () => actApp(a.id || a._id, 'approve')))
    const reject = el('button', 'btn btn-reject');
    reject.textContent = 'ยกเลิก';
    reject.addEventListener('click', () => showConfirm('ยกเลิกคำขอ', 'ต้องการปฏิเสธคำขอนี้หรือไม่?', () => actApp(a.id || a._id, 'reject')))
    actions.append(view, reject, approve);
    card.append(h, meta, detail, actions);
    return card
}
async function loadApps() {
    const base = location.origin.replace(/\/$/, '');
    try {
        const list = await fetchJSON(`${base}/api/admin/employer-applications`);
        const box = document.getElementById('appsList');
        box.innerHTML = '';
        if (!list.length) {
            document.getElementById('appsEmpty').style.display = 'block';
            return
        }
        document.getElementById('appsEmpty').style.display = 'none';
        list.forEach(a => box.append(appCard(a)))
    } catch {
        document.getElementById('appsEmpty').style.display = 'block'
    }
}

function jobCard(j) {
    const card = el('div', 'card shadow');
    const h = el('h3');
    h.textContent = j.title || '-';
    const meta = el('div', 'meta');
    meta.textContent = `${j.rate||0} ${j.unit||''} • ${j.type||''}`;
    const owner = el('div', 'meta');
    owner.textContent = `ผู้โพสต์: ${j.createdBy||'-'}`;
    const actions = el('div', 'card-actions');
    const del = el('button', 'btn btn-reject');
    del.textContent = 'ลบ';
    del.addEventListener('click', () => showConfirm('ยืนยันการลบ', 'ต้องการลบงานนี้หรือไม่?', () => deleteJob(j._id || j.id)))
    actions.append(del);
    card.append(h, meta, owner, actions);
    return card
}
async function loadAdminJobs() {
    const base = location.origin.replace(/\/$/, '');
    try {
        const list = await fetchJSON(`${base}/api/admin/jobs`);
        const box = document.getElementById('jobsList');
        box.innerHTML = '';
        if (!list.length) {
            document.getElementById('jobsEmpty').style.display = 'block';
            return
        }
        document.getElementById('jobsEmpty').style.display = 'none';
        list.forEach(j => box.append(jobCard(j)))
    } catch {
        document.getElementById('jobsEmpty').style.display = 'block'
    }
}
async function deleteJob(id) {
    try {
        const base = location.origin.replace(/\/$/, '');
        const s = getSession();
        const r = await fetch(`${base}/api/admin/jobs/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${s.token}`
            }
        })
        if (!r.ok) {
            showModal('error', 'ลบงานไม่สำเร็จ', 'โปรดลองอีกครั้ง');
            return
        }
        await loadAdminJobs();
    } catch {
        showModal('error', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'โปรดตรวจสอบการเชื่อมต่อ')
    }
}
async function actApp(id, action) {
    try {
        const base = location.origin.replace(/\/$/, '');
        const s = getSession();
        const r = await fetch(`${base}/api/admin/employer-applications/${id}/${action}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${s.token}`
            }
        })
        if (!r.ok) {
            alert('ดำเนินการไม่สำเร็จ');
            return
        }
        await loadStats();
        await loadApps();
    } catch {
        alert('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')
    }
}

function ensureAdmin() {
    const s = getSession();
    if (!s || s.role !== 'admin') {
        alert('ต้องเป็นแอดมิน');
        location.href = './login.html';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    applySessionHeader().then(() => {
        ensureAdmin();
        loadStats();
        loadApps();
        bindTabs()
    })
})

function bindTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(b => b.addEventListener('click', () => {
        btns.forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const tab = b.getAttribute('data-tab');
        document.getElementById('tab-apps').style.display = tab === 'apps' ? 'block' : 'none'
        document.getElementById('tab-jobs').style.display = tab === 'jobs' ? 'block' : 'none'
        if (tab === 'jobs') loadAdminJobs();
        else loadApps();
    }))
}
