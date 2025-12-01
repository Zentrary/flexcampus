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
    const applyBtn = el('a', 'logout-btn');
    applyBtn.textContent = 'สมัครเป็นผู้ประกอบการ';
    applyBtn.href = './employer-apply.html';
    applyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const base = location.origin.replace(/\/$/, '');
        fetch(`${base}/api/employer/application/status`, {
            headers: {
                Authorization: `Bearer ${s.token}`
            }
        }).then(r => r.json()).then(st => {
            if (st && st.has) {
                showStepper(st.status)
            } else {
                location.href = './employer-apply.html'
            }
        }).catch(() => location.href = './employer-apply.html')
    })
    const userDash = el('a', 'logout-btn');
    userDash.textContent = 'สถานะการสมัคร';
    userDash.href = './user-dashboard.html';
    if (s.role === 'user') {
        box.append(pill, profileBtn, userDash, applyBtn, lo)
    } else if (s.role === 'admin') {
        const adminBtn = el('a', 'logout-btn');
        adminBtn.textContent = 'แผงควบคุมแอดมิน';
        adminBtn.href = './admin.html';
        box.append(pill, profileBtn, adminBtn, lo)
    } else {
        box.append(pill, profileBtn, postBtn, dashBtn, lo)
    }
}

function showStepper(status) {
    const wrap = el('div', 'modal-backdrop');
    const card = el('div', 'modal-card modal-success');
    const tt = el('h3', 'modal-title');
    tt.textContent = 'สถานะการสมัครผู้ประกอบการ';
    const box = el('div', 'stepper');
    const steps = [{
        k: 'submitted',
        t: 'ส่งคำขอสมัครแล้ว'
    }, {
        k: 'pending',
        t: 'รอการอนุมัติ'
    }, {
        k: 'approved',
        t: 'สำเร็จ'
    }]
    const stat = status === 'approved' ? 'approved' : (status === 'rejected' ? 'rejected' : 'pending')
    steps.forEach((s, i) => {
        const st = el('div', 'step');
        const dot = el('div', 'step-dot');
        const lb = el('div', 'step-label');
        lb.textContent = s.t;
        if (stat === 'approved') {
            dot.classList.add('active')
        } else if (stat === 'pending' && i <= 1) {
            dot.classList.add('active')
        }
        st.append(dot, lb);
        box.append(st);
        if (i < steps.length - 1) {
            const line = el('div', 'step-line');
            if (stat === 'approved' || (stat === 'pending' && i < 1)) line.classList.add('active');
            box.append(line)
        }
    })
    const act = el('div', 'modal-actions');
    const ok = el('button', 'modal-btn modal-primary');
    ok.textContent = 'ปิด';
    ok.addEventListener('click', () => wrap.remove());
    act.append(ok)
    card.append(tt, box, act);
    wrap.append(card);
    document.body.appendChild(wrap)
}
async function ensureEmployer() {
    let s = null;
    try {
        s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
    } catch {}
    const err = document.getElementById('err');
    if (!s || !s.token) {
        err.textContent = 'โปรดเข้าสู่ระบบ';
        return false
    }
    try {
        const me = await fetch(`${location.origin.replace(/\/$/,'')}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${s.token}`
            }
        }).then(r => r.json())
        if (me && (me.role === 'employer' || me.role === 'admin')) {
            return true
        }
        err.textContent = 'หน้านี้สำหรับผู้ประกอบการหรือแอดมินเท่านั้น';
        return false
    } catch {
        err.textContent = 'ตรวจสอบสิทธิ์ไม่สำเร็จ';
        return false
    }
}
async function submitJob() {
    const err = document.getElementById('err');
    err.textContent = '';
    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const rate = Number(document.getElementById('rate').value || '0');
    const unit = document.getElementById('unit').value.trim() || 'บาท/ชม.';
    const type = document.getElementById('type').value.trim() || 'ยืดหยุ่น';
    const positions = Math.max(1, Math.floor(Number(document.getElementById('positions').value || '1')));
    const tags = (document.getElementById('tags').value || '').split(',').map(x => x.trim()).filter(Boolean);
    const description = (document.getElementById('desc').value || '').trim();
    if (!title) {
        err.textContent = 'กรุณากรอกชื่องาน';
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
        const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/employer/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${s.token}`
            },
            body: JSON.stringify({
                title,
                category,
                rate,
                unit,
                type,
                tags,
                description,
                positions
            })
        })
        const data = await resp.json();
        if (!resp.ok) {
            err.textContent = data.error || 'โพสต์งานไม่สำเร็จ';
            return
        }
        const wrap = el('div', 'modal-backdrop');
        const card = el('div', 'modal-card modal-success');
        const header = el('div', 'modal-header');
        const icon = el('div', 'modal-icon success');
        icon.textContent = '✓';
        const tt = el('h3', 'modal-title');
        tt.textContent = 'โพสต์งานสำเร็จ';
        header.append(icon, tt);
        const dd = el('div', 'modal-desc');
        dd.textContent = 'ไปดูงานของคุณในหน้ารายละเอียด';
        const act = el('div', 'modal-actions');
        const ok = el('button', 'modal-btn modal-primary');
        ok.textContent = 'ไปยังหน้ารายละเอียด';
        ok.addEventListener('click', () => {
            wrap.remove();
            location.href = `./job-detail.html?id=${encodeURIComponent(data.id)}`
        });
        act.append(ok);
        card.append(header, dd, act);
        wrap.append(card);
        document.body.appendChild(wrap)
    } catch {
        err.textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    applySessionHeader();
    const ok = await ensureEmployer();
    if (!ok) {
        return
    }
    document.getElementById('postBtn').addEventListener('click', (e) => {
        e.preventDefault();
        submitJob()
    })

    function updatePreview() {
        const t = document.getElementById('title').value.trim() || 'ตัวอย่างชื่องาน'
        const r = Number(document.getElementById('rate').value || '0')
        const u = document.getElementById('unit').value.trim() || 'บาท/ชม.'
        const ty = document.getElementById('type').value.trim() || 'ยืดหยุ่น'
        const tagStr = (document.getElementById('tags').value || '').split(',').map(x => x.trim()).filter(Boolean)
        const pt = document.getElementById('pv_title');
        const pm = document.getElementById('pv_meta');
        const pg = document.getElementById('pv_tags')
        pt.textContent = t
        pm.textContent = `${isNaN(r)?0:r} ${u} • ${ty}`
        pg.innerHTML = ''
        tagStr.forEach(s => {
            const b = el('span', 'tag');
            b.textContent = s;
            pg.append(b)
        })
        const d = (document.getElementById('desc').value || '').trim()
        const pvd = document.getElementById('pv_desc');
        if (pvd) {
            pvd.textContent = d ? (d.length > 140 ? d.slice(0, 140) + '…' : d) : 'คำอธิบายงานจะปรากฏที่นี่'
        }
    }
    ['title', 'rate', 'unit', 'type', 'tags', 'desc'].forEach(id => {
        const n = document.getElementById(id);
        if (n) {
            n.addEventListener('input', updatePreview);
            n.addEventListener('change', updatePreview)
        }
    })
    updatePreview()
})
