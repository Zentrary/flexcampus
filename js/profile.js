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
    if (!box) return;
    let s = getSession();
    if (s && s.token) {
        try {
            const me = await fetch(`${location.origin.replace(/\/$/,'')}/api/auth/me`, {
                headers: {
                    Authorization: `Bearer ${s.token}`
                }
            }).then(r => r.json());
            if (me && me.role) {
                s.role = me.role;
                s.username = me.username;
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
    const adminBtn = el('a', 'logout-btn');
    adminBtn.textContent = 'แผงควบคุมแอดมิน';
    adminBtn.href = './admin.html';
    if (s.role === 'user') {
        box.append(pill, profileBtn, userDash, applyBtn, lo)
    } else if (s.role === 'admin') {
        box.append(pill, profileBtn, adminBtn, lo)
    } else {
        box.append(pill, profileBtn, postBtn, dashBtn, lo)
    }
}
async function loadProfile() {
    try {
        const s = getSession();
        const base = location.origin.replace(/\/$/, '');
        const me = await fetch(`${base}/api/user/profile`, {
            headers: {
                Authorization: `Bearer ${s.token}`
            }
        }).then(r => r.json());
        document.getElementById('firstName').value = me.firstName || '';
        document.getElementById('lastName').value = me.lastName || '';
        document.getElementById('role').value = me.role || '';
        document.getElementById('email').value = me.email || '';
        document.getElementById('phone').value = me.phone || '';
        document.getElementById('username').value = me.username || '';
    } catch {
        document.getElementById('err').textContent = 'โหลดโปรไฟล์ไม่สำเร็จ'
    }
}
async function saveProfile() {
    const err = document.getElementById('err');
    err.textContent = '';
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const username = document.getElementById('username').value.trim();
    try {
        const s = getSession();
        const base = location.origin.replace(/\/$/, '');
        const r = await fetch(`${base}/api/user/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${s.token}`
            },
            body: JSON.stringify({
                email,
                phone,
                username
            })
        })
        const data = await r.json();
        if (!r.ok) {
            err.textContent = data.error || 'บันทึกไม่สำเร็จ';
            return
        }
        const ns = getSession();
        ns.username = data.username;
        ns.email = data.email;
        localStorage.setItem('ptu_session', JSON.stringify(ns));
        showModal('success', 'บันทึกโปรไฟล์สำเร็จ', 'การเปลี่ยนแปลงถูกบันทึกแล้ว')
    } catch {
        err.textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ'
    }
}

function showModal(type, title, desc) {
    const wrap = el('div', 'modal-backdrop');
    const card = el('div', `modal-card modal-${type}`);
    const tt = el('h3', 'modal-title');
    tt.textContent = title;
    const dd = el('div', 'modal-desc');
    dd.textContent = desc || '';
    const act = el('div', 'modal-actions');
    const ok = el('button', 'modal-btn modal-primary');
    ok.textContent = 'ตกลง';
    ok.addEventListener('click', () => wrap.remove());
    act.append(ok);
    card.append(tt, dd, act);
    wrap.append(card);
    document.body.appendChild(wrap)
}
document.addEventListener('DOMContentLoaded', () => {
    applySessionHeader();
    loadProfile();
    document.getElementById('saveBtn').addEventListener('click', saveProfile)
})