function el(t, c) {
    const e = document.createElement(t);
    if (c) e.className = c;
    return e
}

function q(k) {
    return new URLSearchParams(location.search).get(k)
}

function applySessionHeader() {
    const box = document.getElementById('userArea');
    if (!box) return;
    let s = null;
    try {
        s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
    } catch {};
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
                    localStorage.setItem('ptu_session', JSON.stringify(s));
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
    });
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
async function load() {
    const id = q('id');
    const code = q('code') || '';
    const err = document.getElementById('err');
    const info = document.getElementById('jobInfo');
    const stS = document.getElementById('stStatus');
    const stW = document.getElementById('stWhen');
    const stC = document.getElementById('stCode');
    const msgs = document.getElementById('msgList');
    msgs.innerHTML = '';
    if (!id) {
        err.textContent = 'ลิงก์ไม่ถูกต้อง';
        return
    }
    let s = null;
    try {
        s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
    } catch {}
    const headers = {};
    if (s && s.token) headers['Authorization'] = `Bearer ${s.token}`;
    try {
        const url = `${location.origin.replace(/\/$/,'')}/api/applications/${encodeURIComponent(id)}` + (code ? `?code=${encodeURIComponent(code)}` : '');
        const resp = await fetch(url, {
            headers
        });
        const data = await resp.json();
        if (!resp.ok) {
            err.textContent = data.error || 'โหลดข้อมูลไม่สำเร็จ';
            return
        }
        info.textContent = `งาน: ${data.jobTitle||'-'}`;
        stS.textContent = data.status || '-';
        stW.textContent = new Date(data.createdAt || Date.now()).toLocaleString('th-TH');
        stC.textContent = data.accessCode || code || '-';
        if (Array.isArray(data.messages) && data.messages.length) {
            data.messages.forEach((m, i) => {
                const card = el('div', 'info-card');
                const head = el('div', 'info-title');
                head.textContent = m.from === 'system' ? 'ระบบ' : (m.from === 'employer' ? 'ผู้ประกอบการ' : 'ผู้ใช้');
                const body = el('div', 'info-desc');
                body.textContent = m.text || '';
                const time = el('div', 'meta');
                time.textContent = new Date(m.at || Date.now()).toLocaleString('th-TH');
                const actions = el('div', 'card-actions');
                const del = el('button', 'btn-danger btn');
                del.textContent = 'ลบข้อความ';
                del.addEventListener('click', async () => {
                    try {
                        const delUrl = `${location.origin.replace(/\/$/,'')}/api/applications/${encodeURIComponent(id)}/messages/${encodeURIComponent(i)}` + (code ? `?code=${encodeURIComponent(code)}` : '');
                        const r = await fetch(delUrl, {
                            method: 'DELETE',
                            headers
                        });
                        const d = await r.json();
                        if (r.ok) {
                            load()
                        }
                    } catch {}
                });
                actions.append(del);
                card.append(head, body, time, actions);
                msgs.append(card)
            })
        } else {
            const empty = el('div', 'info-desc');
            empty.textContent = 'ยังไม่มีข้อความ';
            msgs.append(empty)
        }
    } catch {
        err.textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
    }
}
document.addEventListener('DOMContentLoaded', () => {
    applySessionHeader();
    load()
})
