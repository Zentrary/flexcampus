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
    const header = el('div', 'modal-header');
    const icon = el('div', 'modal-icon info');
    icon.textContent = 'i';
    const tt = el('h3', 'modal-title');
    tt.textContent = 'สถานะการสมัครผู้ประกอบการ';
    header.append(icon, tt);
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
    card.append(header, box, act);
    wrap.append(card);
    document.body.appendChild(wrap)
}

function confirmDelete(onOk) {
    const wrap = el('div', 'modal-backdrop');
    const card = el('div', 'modal-card modal-danger');
    const header = el('div', 'modal-header');
    const icon = el('div', 'modal-icon danger');
    icon.textContent = '✕';
    const tt = el('h3', 'modal-title');
    tt.textContent = 'ยืนยันการลบงาน';
    header.append(icon, tt);
    const dd = el('div', 'modal-desc');
    dd.textContent = 'เมื่อลบแล้วจะไม่สามารถกู้คืนได้';
    const act = el('div', 'modal-actions');
    const cancel = el('button', 'modal-btn modal-secondary');
    cancel.textContent = 'ยกเลิก';
    cancel.addEventListener('click', () => wrap.remove());
    const ok = el('button', 'modal-btn modal-danger-btn');
    ok.textContent = 'ลบ';
    ok.addEventListener('click', () => {
        wrap.remove();
        onOk()
    });
    act.append(cancel, ok);
    card.append(header, dd, act);
    wrap.append(card);
    document.body.appendChild(wrap)
}
async function fetchJob(id) {
    try {
        const r = await fetch(`${location.origin.replace(/\/$/,'')}/api/jobs/${encodeURIComponent(id)}`)
        if (!r.ok) return null
        return await r.json()
    } catch {
        return null
    }
}
async function me() {
    let s = null;
    try {
        s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
    } catch {}
    if (!s || !s.token) return null
    try {
        return await fetch(`${location.origin.replace(/\/$/,'')}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${s.token}`
            }
        }).then(r => r.json())
    } catch {
        return null
    }
}
async function render() {
    const id = q('id');
    const job = await fetchJob(id);
    const title = document.getElementById('title');
    const meta = document.getElementById('meta');
    const tags = document.getElementById('tags');
    const err = document.getElementById('err');
    if (!job) {
        title.textContent = 'ไม่พบงาน';
        err.textContent = 'งานนี้อาจถูกลบหรือไม่มีอยู่';
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
    const desc = document.getElementById('desc');
    desc.textContent = (job.description && job.description.trim()) ? job.description : 'ยังไม่มีคำอธิบาย';
    const kv1 = document.getElementById('kv_category');
    const kv2 = document.getElementById('kv_rate');
    const kv3 = document.getElementById('kv_type');
    if (kv1) kv1.textContent = job.category || 'popular';
    if (kv2) kv2.textContent = `${job.rate||0} ${job.unit||'บาท/ชม.'}`;
    if (kv3) kv3.textContent = job.type || 'ยืดหยุ่น'
    const reqList = document.getElementById('reqList');
    if (reqList) {
        reqList.innerHTML = '';
        const baseReq = [`มีความรับผิดชอบและตรงเวลา`, `สื่อสารได้ดี`, `พร้อมเรียนรู้งานใหม่`];
        baseReq.concat((job.tags || []).map(x => `เกี่ยวข้องกับ: ${x}`)).forEach(txt => {
            const li = document.createElement('li');
            li.textContent = txt;
            reqList.append(li)
        })
    }
    const session = await me();
    const actions = document.getElementById('actions');
    actions.innerHTML = '';
    const limit = Math.max(1, Number(job.positions || 1));
    const filled = Number(job.hiredCount || 0) >= limit || Boolean(job.full);
    const apply = el('a', 'btn');
    apply.textContent = filled ? 'พนักงานเต็มจำนวนแล้ว' : 'สมัครเลย';
    apply.href = '#';
    if (filled) {
        apply.classList.add('btn-secondary');
        apply.style.pointerEvents = 'none'
    } else {
        apply.addEventListener('click', (e) => {
            e.preventDefault();
            preventDuplicateAndGo(id)
        })
    }
    const share = el('button', 'btn-outline btn');
    share.textContent = 'แชร์งาน';
    share.addEventListener('click', () => {
        const url = location.href;
        if (navigator.share) {
            navigator.share({
                title: job.title || 'งาน',
                url
            })
        } else {
            try {
                navigator.clipboard.writeText(url).then(() => {
                    const wrap = el('div', 'modal-backdrop');
                    const card = el('div', 'modal-card modal-success');
                    const header = el('div', 'modal-header');
                    const icon = el('div', 'modal-icon success');
                    icon.textContent = '✓';
                    const tt = el('h3', 'modal-title');
                    tt.textContent = 'คัดลอกลิงก์แล้ว';
                    header.append(icon, tt);
                    const act = el('div', 'modal-actions');
                    const ok = el('button', 'modal-btn modal-success-btn');
                    ok.textContent = 'ปิด';
                    ok.addEventListener('click', () => wrap.remove());
                    act.append(ok);
                    card.append(header, act);
                    wrap.append(card);
                    document.body.appendChild(wrap)
                })
            } catch {}
        }
    });
    const like = el('button', 'btn-outline btn');
    like.textContent = `ถูกใจ (${Number(job.likes||0)})`;
    like.addEventListener('click', async () => {
        let s = null;
        try { s = JSON.parse(localStorage.getItem('ptu_session')||'null') } catch {}
        if (!s || !s.token) {
            const wrap = el('div', 'modal-backdrop');
            const card = el('div', 'modal-card modal-error');
            const header = el('div', 'modal-header');
            const icon = el('div', 'modal-icon error');
            icon.textContent = '✕';
            const tt = el('h3', 'modal-title');
            tt.textContent = 'โปรดเข้าสู่ระบบ';
            header.append(icon, tt);
            const act = el('div', 'modal-actions');
            const ok = el('a', 'modal-btn modal-primary');
            ok.textContent = 'ไปหน้าเข้าสู่ระบบ';
            ok.href = './login.html';
            act.append(ok);
            card.append(header, act);
            wrap.append(card);
            document.body.appendChild(wrap);
            return
        }
        try {
            const r = await fetch(`${location.origin.replace(/\/$/,'')}/api/jobs/${encodeURIComponent(id)}/like`, { method:'POST', headers:{ Authorization:`Bearer ${s.token}` } });
            if (r.ok) {
                const d = await r.json();
                like.textContent = `ถูกใจ (${Number(d.likes||0)})`;
            }
        } catch {}
    });
    actions.append(apply, share, like)
    if (session && session.role === 'employer' && String(job.createdBy || '') === String(session.id || '')) {
        const edit = el('button', 'btn-secondary btn');
        edit.textContent = 'แก้ไข';
        const del = el('button', 'btn-danger btn');
        del.textContent = 'ลบ';
        actions.append(edit, del)
        const form = document.getElementById('editForm');
        const ft = document.getElementById('f_title');
        const fc = document.getElementById('f_category');
        const fr = document.getElementById('f_rate');
        const fu = document.getElementById('f_unit');
        const fty = document.getElementById('f_type');
        const ftag = document.getElementById('f_tags');
        const saveBtn = el('button', 'btn');
        saveBtn.textContent = 'บันทึก';
        saveBtn.style.display = 'none';
        actions.append(saveBtn)
        const fd = document.getElementById('f_desc');
        edit.addEventListener('click', () => {
            form.style.display = 'grid';
            ft.value = job.title || '';
            fc.value = job.category || '';
            fr.value = job.rate || 0;
            fu.value = job.unit || '';
            fty.value = job.type || '';
            ftag.value = (job.tags || []).join(', ');
            fd.value = (job.description || '');
            saveBtn.style.display = 'inline-block'
        })
        saveBtn.addEventListener('click', async () => {
            err.textContent = '';
            let s = null;
            try {
                s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
            } catch {}
            if (!s || !s.token) {
                err.textContent = 'โปรดเข้าสู่ระบบ';
                return
            }
            const payload = {
                title: ft.value.trim(),
                category: fc.value.trim(),
                rate: Number(fr.value || '0'),
                unit: fu.value.trim(),
                type: fty.value.trim(),
                tags: ftag.value.split(',').map(x => x.trim()).filter(Boolean),
                description: (fd.value || '').trim()
            }
            try {
                const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/employer/jobs/${encodeURIComponent(id)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${s.token}`
                    },
                    body: JSON.stringify(payload)
                })
                const data = await resp.json();
                if (!resp.ok) {
                    err.textContent = data.error || 'แก้ไขงานไม่สำเร็จ';
                    return
                }
                const wrap = el('div', 'modal-backdrop');
                const card = el('div', 'modal-card modal-success');
                const header = el('div', 'modal-header');
                const icon = el('div', 'modal-icon success');
                icon.textContent = '✓';
                const tt = el('h3', 'modal-title');
                tt.textContent = 'บันทึกสำเร็จ';
                header.append(icon, tt);
                const act = el('div', 'modal-actions');
                const ok = el('button', 'modal-btn modal-success-btn');
                ok.textContent = 'ปิด';
                ok.addEventListener('click', () => {
                    wrap.remove();
                    location.reload()
                });
                act.append(ok);
                card.append(header, act);
                wrap.append(card);
                document.body.appendChild(wrap)
            } catch {
                err.textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
            }
        })
        del.addEventListener('click', () => {
            confirmDelete(async () => {
                err.textContent = '';
                let s = null;
                try {
                    s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
                } catch {}
                if (!s || !s.token) {
                    err.textContent = 'โปรดเข้าสู่ระบบ';
                    return
                }
                try {
                    const resp = await fetch(`${location.origin.replace(/\/$/,'')}/api/employer/jobs/${encodeURIComponent(id)}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${s.token}`
                        }
                    })
                    const data = await resp.json();
                    if (!resp.ok) {
                        err.textContent = data.error || 'ลบงานไม่สำเร็จ';
                        return
                    }
                    const wrap = el('div', 'modal-backdrop');
                    const card = el('div', 'modal-card modal-success');
                    const header = el('div', 'modal-header');
                    const icon = el('div', 'modal-icon success');
                    icon.textContent = '✓';
                    const tt = el('h3', 'modal-title');
                    tt.textContent = 'ลบงานสำเร็จ';
                    header.append(icon, tt);
                    const act = el('div', 'modal-actions');
                    const ok = el('button', 'modal-btn modal-primary');
                    ok.textContent = 'กลับไปหน้างานทั้งหมด';
                    ok.addEventListener('click', () => {
                        wrap.remove();
                        location.href = './jobs.html'
                    });
                    act.append(ok);
                    card.append(header, act);
                    wrap.append(card);
                    document.body.appendChild(wrap)
                } catch {
                    err.textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'
                }
            })
        })
    }
}
async function preventDuplicateAndGo(jobId) {
    let s = null;
    try {
        s = JSON.parse(localStorage.getItem('ptu_session') || 'null')
    } catch {}
    const localApps = (() => {
        try {
            return (JSON.parse(localStorage.getItem('ptu_my_apps') || '[]') || []).filter(x => String(x.jobId) === String(jobId))
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
                serverApps = (Array.isArray(d.applications) ? d.applications : d).filter(a => String(a.jobId) === String(jobId))
            }
        } catch {}
    }
    const hasPending = s && s.token ? serverApps.some(a => ['pending', 'approved'].includes(String(a.status || 'pending'))) : localApps.length > 0;
    if (hasPending) {
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
        view.textContent = 'ดูสถานะใบสมัคร';
        if (s && s.token && serverApps[0]) {
            view.href = `./check-application.html?id=${encodeURIComponent(serverApps[0]._id||serverApps[0].id||'')}`
        } else if (localApps[0]) {
            view.href = `./check-application.html?id=${encodeURIComponent(localApps[0].id)}&code=${encodeURIComponent(localApps[0].code||'')}`
        } else {
            view.href = `./user-dashboard.html`
        }
        act.append(view, ok);
        card.append(header, dd, act);
        wrap.append(card);
        document.body.appendChild(wrap);
        return
    }
    location.href = `./apply-job.html?id=${encodeURIComponent(jobId)}`
}

function bindTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = {
        desc: document.getElementById('tab-desc'),
        req: document.getElementById('tab-req'),
        how: document.getElementById('tab-how')
    };
    tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const k = btn.getAttribute('data-tab');
            Object.values(panes).forEach(p => p.style.display = 'none');
            const m = document.getElementById(k);
            if (m) m.style.display = 'block'
        })
    })
}
async function renderRelated(currentId, category) {
    const box = document.getElementById('related');
    if (!box) return;
    box.innerHTML = '';
    try {
        const base = location.origin.replace(/\/$/, '');
        const resp = await fetch(`${base}/api/jobs`);
        const data = await resp.json();
        const list = (Array.isArray(data.jobs) ? data.jobs : data).filter(x => String(x.id || x._id) !== String(currentId)).filter(x => String(x.category || '') === String(category || '')).slice(0, 3);
        list.forEach(x => {
            const c = el('div', 'mini-card');
            const h = el('h4');
            h.textContent = x.title || 'งาน';
            const m = el('div', 'meta');
            m.textContent = `${x.rate||0} ${x.unit||'บาท/ชม.'} • ${x.type||'ยืดหยุ่น'}`;
            const go = el('a', 'btn-secondary btn');
            go.href = `./job-detail.html?id=${encodeURIComponent(x.id||x._id)}`;
            go.textContent = 'ดูงาน';
            c.append(h, m, go);
            box.append(c)
        })
    } catch {}
}
document.addEventListener('DOMContentLoaded', () => {
    applySessionHeader();
    bindTabs();
    render().then(() => {
        const id = q('id');
        const cat = document.getElementById('kv_category')?.textContent || '';
        renderRelated(id, cat)
    })
})
