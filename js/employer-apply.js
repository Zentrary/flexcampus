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
                }
            }).then(r => r.json()).then(me => {
                if (me && me.role) {
                    s.role = me.role;
                    localStorage.setItem('ptu_session', JSON.stringify(s));
                    renderHeader(s, box)
                } else {
                    renderHeader(s, box)
                }
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
    const userDash = el('a', 'logout-btn');
    userDash.textContent = 'สถานะการสมัคร';
    userDash.href = './user-dashboard.html';
    if (s.role === 'employer') {
        box.append(pill, profileBtn, postBtn, dashBtn, lo)
    } else {
        box.append(pill, profileBtn, userDash, lo)
    }
}

function showModal(type, title, desc, action) {
    const wrap = el('div', 'modal-backdrop');
    const card = el('div', `modal-card modal-${type}`);
    const header = el('div', 'modal-header');
    const icon = el('div', `modal-icon ${type==='success'?'success':'error'}`);
    icon.textContent = type === 'success' ? '✓' : '✕';
    const tt = el('h3', 'modal-title');
    tt.textContent = title;
    header.append(icon, tt);
    const dd = el('div', 'modal-desc');
    dd.textContent = desc || '';
    const act = el('div', 'modal-actions');
    const btn = el('button', `modal-btn ${type==='success'?'modal-success-btn':'modal-primary'}`);
    btn.textContent = action || 'ดำเนินการต่อ';
    btn.addEventListener('click', () => wrap.remove());
    act.append(btn);
    card.append(header, dd, act);
    wrap.append(card);
    document.body.appendChild(wrap);
}
async function submitApply() {
    const orgName = document.getElementById('orgName').value.trim();
    const contactPhone = document.getElementById('contactPhone').value.trim();
    const portfolioUrl = document.getElementById('portfolioUrl').value.trim();
    const description = document.getElementById('description').value.trim();
    const reason = document.getElementById('reason').value.trim();
    const err = document.getElementById('err');
    err.textContent = '';
    if (!orgName || !description || !reason) {
        err.textContent = 'กรอกข้อมูลให้ครบถ้วน';
        return
    }
    let s = null;
    try {
        s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
    } catch {}
    if (!s || !s.token) {
        err.textContent = 'โปรดเข้าสู่ระบบ';
        return
    }
    try {
        const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/employer/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${s.token}`
            },
            body: JSON.stringify({
                orgName,
                contactPhone,
                portfolioUrl,
                description,
                reason
            })
        })
        const data = await resp.json();
        if (!resp.ok) {
            err.textContent = data.error || 'ส่งคำขอไม่สำเร็จ';
            return
        }
        showModal('success', 'ส่งคำขอสำเร็จ', 'รอแอดมินดำเนินการตรวจสอบ', 'ตกลง');
        setTimeout(() => {
            location.href = '../index.html'
        }, 800)
    } catch {
        err.textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
    }
}
document.addEventListener('DOMContentLoaded', () => {
    applySessionHeader();
    document.getElementById('applyBtn').addEventListener('click', (e) => {
        e.preventDefault();
        submitApply()
    })
})