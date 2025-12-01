function showErr(t) {
    const e = document.getElementById('err')
    e.textContent = t
    e.style.display = 'block'
}

function showModal(type, title, desc, action) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    const card = document.createElement('div');
    card.className = `modal-card modal-${type}`;
    const icon = document.createElement('div');
    icon.className = 'modal-icon';
    icon.textContent = type === 'success' ? '✓' : '✕';
    const tt = document.createElement('h3');
    tt.className = 'modal-title';
    tt.textContent = title;
    const dd = document.createElement('div');
    dd.className = 'modal-desc';
    dd.textContent = desc || '';
    const act = document.createElement('div');
    act.className = 'modal-actions';
    const btn = document.createElement('button');
    btn.className = 'modal-btn modal-primary';
    btn.textContent = action || 'ดำเนินการต่อ';
    btn.addEventListener('click', () => wrap.remove());
    act.append(btn);
    card.append(icon, tt, dd, act);
    wrap.append(card);
    document.body.appendChild(wrap);
}
async function handleLogin() {
    const id = document.getElementById('identity').value.trim()
    const password = document.getElementById('password').value
    if (!id || !password) {
        showErr('กรุณากรอกข้อมูลให้ครบถ้วน');
        return
    }
    try {
        const base = location.origin.replace(/\/$/, '')
        const resp = await fetch(`${base}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                identity: id,
                password
            })
        })
        const data = await resp.json()
        if (!resp.ok) {
            showErr(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
            showModal('error', 'เข้าสู่ระบบไม่สำเร็จ', data.error || '', 'ลองอีกครั้ง');
            return
        }
        localStorage.setItem('ptu_session', JSON.stringify({
            email: data.email,
            username: data.username,
            name: data.name,
            role: data.role,
            token: data.token,
            time: Date.now()
        }))
        showModal('success', 'เข้าสู่ระบบสำเร็จ', '', 'ดำเนินการต่อ')
        setTimeout(() => {
            location.href = '../index.html'
        }, 700)
    } catch (e) {
        showErr('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้')
        showModal('error', 'เข้าสู่ระบบไม่สำเร็จ', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'ลองอีกครั้ง')
    }
}
document.addEventListener('DOMContentLoaded', () => {
    applySessionHeader();
    document.getElementById('loginBtn').addEventListener('click', handleLogin)
    const t = document.getElementById('toggleLoginPass')
    if (t) {
        t.addEventListener('click', () => {
            const ip = document.getElementById('password');
            const is = ip.type === 'password';
            ip.type = is ? 'text' : 'password';
            t.textContent = is ? 'ซ่อน' : 'แสดง'
        })
    }
})

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
    } catch {};
    box.innerHTML = '';
    if (!s) {
        const toLogin = el('a', 'btn');
        toLogin.textContent = 'เข้าสู่ระบบ';
        toLogin.href = './login.html';
        const toRegister = el('a', 'btn btn-outline');
        toRegister.textContent = 'สมัครสมาชิก';
        toRegister.href = './register.html';
        box.append(toRegister, toLogin);
        return
    }
    const pill = el('a', 'user-pill');
    pill.href = './profile.html';
    const av = el('div', 'avatar');
    av.textContent = (s.username || s.email || 'U').charAt(0).toUpperCase();
    const nm = el('span', 'name');
    nm.textContent = s.username || s.email || 'User';
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
