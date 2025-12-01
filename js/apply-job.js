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
async function fetchJob(id) {
    try {
        const r = await fetch(`${location.origin.replace(/\/$/,'')}/api/jobs/${encodeURIComponent(id)}`);
        if (!r.ok) return null;
        return await r.json()
    } catch {
        return null
    }
}

function showModalSuccess(code, jobId, appId) {
    const wrap = el('div', 'modal-backdrop');
    const card = el('div', 'modal-card modal-success');
    const header = el('div', 'modal-header');
    const icon = el('div', 'modal-icon success');
    icon.textContent = '✓';
    const tt = el('h3', 'modal-title');
    tt.textContent = 'ส่งใบสมัครสำเร็จ';
    header.append(icon, tt);
    const dd = el('div', 'modal-desc');
    dd.textContent = 'เก็บรหัสติดตามใบสมัครของคุณ';
    const sub = el('div', 'modal-sub');
    sub.textContent = `รหัสติดตาม: ${code}`;
    const act = el('div', 'modal-actions');
    const ok = el('button', 'modal-btn modal-primary');
    ok.textContent = 'ไปหน้ารายละเอียดงาน';
    ok.addEventListener('click', () => {
        wrap.remove();
        location.href = `./job-detail.html?id=${encodeURIComponent(jobId)}`
    });
    const view = el('button', 'modal-btn modal-secondary');
    view.textContent = 'ดูสถานะใบสมัคร';
    view.addEventListener('click', () => {
        wrap.remove();
        location.href = `./check-application.html?id=${encodeURIComponent(appId)}&code=${encodeURIComponent(code)}`
    });
    act.append(view, ok);
    card.append(header, dd, sub, act);
    wrap.append(card);
    document.body.appendChild(wrap)
}
async function render() {
    const id = q('id');
    const job = await fetchJob(id);
    const title = document.getElementById('jobTitle');
    const meta = document.getElementById('jobMeta');
    const tags = document.getElementById('jobTags');
    const cat = document.getElementById('jobCat');
    const rate = document.getElementById('jobRate');
    const type = document.getElementById('jobType');
    const notice = document.getElementById('fullNotice');
    const form = document.getElementById('applyForm');
    const btn = document.getElementById('submitBtn');
    const err = document.getElementById('err');
    if (!job) {
        title.textContent = 'ไม่พบงาน';
        err.textContent = 'งานนี้อาจถูกลบหรือไม่มีอยู่';
        form.style.display = 'none';
        btn.style.display = 'none';
        return
    }
    title.textContent = job.title || 'งาน';
    meta.textContent = `${job.rate||0} ${job.unit||'บาท/ชม.'} • ${job.type||'ยืดหยุ่น'}`;
    tags.innerHTML = '';
    (job.tags || job.badge || []).forEach(t => {
        const b = el('span', 'tag');
        b.textContent = t;
        tags.append(b)
    });
    cat.textContent = job.category || 'popular';
    rate.textContent = `${job.rate||0} ${job.unit||'บาท/ชม.'}`;
    type.textContent = job.type || 'ยืดหยุ่น';
    const limit = Math.max(1, Number(job.positions || 1));
    const filled = Number(job.hiredCount || 0) >= limit || Boolean(job.full);
    if (filled) {
        notice.style.display = 'block';
        form.style.display = 'none';
        btn.style.display = 'none';
        return
    }
    // prevent duplicate apply
    try {
        let s = null;
        try {
            s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
        } catch {}
        const localApps = (() => {
            try {
                return (JSON.parse(localStorage.getItem('ptu_my_apps') || '[]') || []).filter(x => String(x.jobId) === String(id))
            } catch {
                return []
            }
        })();
        let serverApps = [];
        if (s && s.token) {
            try {
                const r = await fetch(`${location.origin.replace(/\/$/,'')}/api/user/applications`, {
                    headers: {
                        Authorization: `Bearer ${s.token}`
                    },
                    cache: 'no-store'
                });
                if (r.ok) {
                    const d = await r.json();
                    serverApps = (Array.isArray(d.applications) ? d.applications : d).filter(a => String(a.jobId) === String(id))
                }
            } catch {}
        }
        const hasPending = s && s.token ? serverApps.some(a => ['pending', 'approved'].includes(String(a.status || 'pending'))) : localApps.length > 0;
        if (hasPending) {
            notice.style.display = 'block';
            notice.textContent = 'คุณสมัครงานนี้ไปแล้ว โปรดรอการดำเนินการก่อน';
            form.style.display = 'none';
            btn.style.display = 'none';
            return
        }
    } catch {}
    btn.addEventListener('click', async () => {
        err.textContent = '';
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const age = Number(document.getElementById('age').value || '0');
        const about = (document.getElementById('about').value || '').trim();
        if (!name) {
            err.textContent = 'กรุณากรอกชื่อ-นามสกุล';
            return
        }
        let s = null;
        try {
            s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
        } catch {}
        const headers = {
            'Content-Type': 'application/json'
        };
        if (s && s.token) {
            headers.Authorization = `Bearer ${s.token}`
        }
        try {
            const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/jobs/${encodeURIComponent(id)}/apply`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    age,
                    about
                })
            })
            const data = await resp.json();
            if (!resp.ok) {
                if (resp.status === 409) {
                    const wrap = el('div', 'modal-backdrop');
                    const card = el('div', 'modal-card modal-error');
                    const header = el('div', 'modal-header');
                    const icon = el('div', 'modal-icon error');
                    icon.textContent = '✕';
                    const tt = el('h3', 'modal-title');
                    tt.textContent = 'คุณสมัครงานนี้ไปแล้ว';
                    header.append(icon, tt);
                    const dd = el('div', 'modal-desc');
                    dd.textContent = 'โปรดรอการดำเนินการก่อน';
                    const act = el('div', 'modal-actions');
                    const ok = el('button', 'modal-btn modal-primary');
                    ok.textContent = 'ปิด';
                    ok.addEventListener('click', () => wrap.remove());
                    const view = el('a', 'modal-btn modal-secondary');
                    view.textContent = 'ไปแดชบอร์ด';
                    view.href = './user-dashboard.html';
                    act.append(view, ok);
                    card.append(header, dd, act);
                    wrap.append(card);
                    document.body.appendChild(wrap);
                } else {
                    err.textContent = data.error || 'สมัครงานไม่สำเร็จ'
                }
                return
            }
            try {
                const key = 'ptu_my_apps';
                const item = {
                    id: data.applicationId,
                    code: data.code,
                    jobId: id,
                    jobTitle: job.title || 'งาน'
                };
                let arr = [];
                try {
                    arr = JSON.parse(localStorage.getItem(key) || '[]') || []
                } catch {}
                arr = [item].concat(arr.filter(x => String(x.id) !== String(item.id)));
                localStorage.setItem(key, JSON.stringify(arr.slice(0, 50)));
            } catch {}
            showModalSuccess(data.code, id, data.applicationId)
        } catch {
            err.textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
        }
    })
}
document.addEventListener('DOMContentLoaded', () => {
    applySessionHeader();
    render()
})
