const categories = [{
        id: 'popular',
        name: 'งานยอดนิยม',
        icon: '../images/job/งานยอดนิยม.svg'
    },
    {
        id: 'graphic',
        name: 'ออกแบบกราฟิก',
        icon: '../images/job/ออกแบบกราฟิก.svg'
    },
    {
        id: 'tech',
        name: 'เว็บไซต์และเทคโนโลยี',
        icon: '../images/job/เว็บไซต์และเทคโนโลยี.svg'
    },
    {
        id: 'edu',
        name: 'เรียนพิเศษ',
        icon: '../images/job/เรียนพิเศษ.svg'
    },
    {
        id: 'media',
        name: 'ภาพและเสียง',
        icon: '../images/job/ภาพและเสียง.svg'
    },
    {
        id: 'marketing',
        name: 'การตลาดและโฆษณา',
        icon: '../images/job/การตลาดและโฆษณา.svg'
    },
    {
        id: 'writing',
        name: 'เขียนและแปลภาษา',
        icon: '../images/job/เขียนและแปลภาษา.svg'
    },
    {
        id: 'engineer',
        name: 'สถาปัตย์และวิศวกรรม',
        icon: '../images/job/สถาปัตย์และวิศวกรรม.svg'
    },
    {
        id: 'lifestyle',
        name: 'ไลฟ์สไตล์',
        icon: '../images/job/ไลฟ์สไตล์.svg'
    },
    {
        id: 'business',
        name: 'ธุรกิจและที่ปรึกษา',
        icon: '../images/job/ธุรกิจและที่ปรึกษา.svg'
    }
]
const sampleJobs = [{
        id: 1,
        title: 'ผู้ช่วยขายออนไลน์',
        category: 'business',
        rate: 90,
        unit: 'บาท/ชม.',
        type: 'ยืดหยุ่น',
        badge: ['อีคอมเมิร์ซ']
    },
    {
        id: 2,
        title: 'ติวคณิต ม.ปลาย',
        category: 'edu',
        rate: 300,
        unit: 'บาท/ชม.',
        type: 'นัดหมาย',
        badge: ['สอนพิเศษ']
    },
    {
        id: 3,
        title: 'ออกแบบโพสต์โซเชียล',
        category: 'graphic',
        rate: 800,
        unit: 'บาท/งาน',
        type: 'รีโมท',
        badge: ['กราฟิก']
    },
    {
        id: 4,
        title: 'ผู้ช่วย QA เว็บไซต์',
        category: 'tech',
        rate: 120,
        unit: 'บาท/ชม.',
        type: 'รีโมท',
        badge: ['เทคโนโลยี']
    },
    {
        id: 5,
        title: 'คอนเทนต์มาร์เก็ตติ้ง',
        category: 'marketing',
        rate: 100,
        unit: 'บาท/ชม.',
        type: 'รีโมท',
        badge: ['การตลาด']
    },
    {
        id: 6,
        title: 'ช่างตัดต่อวิดีโอ',
        category: 'media',
        rate: 900,
        unit: 'บาท/งาน',
        type: 'รีโมท',
        badge: ['ตัดต่อ']
    }
]
const state = {
    keyword: '',
    category: null,
    employerId: null,
    orgName: '',
    jobs: []
}

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
    const adminBtn = el('a', 'logout-btn');
    adminBtn.textContent = 'แผงควบคุมแอดมิน';
    adminBtn.href = './admin.html';
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
        box.append(pill, profileBtn, adminBtn, postBtn, lo)
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
async function loadJobs() {
    const grid = document.getElementById('jobGrid');
    const loader = document.getElementById('jobsLoader');
    loader.style.display = 'flex';
    try {
        const base = location.origin.replace(/\/$/, '');
        const url = `${base}/api/jobs`;
        const resp = await fetch(url);
        if (resp.ok) {
            const data = await resp.json();
            state.jobs = (Array.isArray(data.jobs) ? data.jobs : data).map(x => ({
                id: x.id || x._id || x.uid || Math.random().toString(36).slice(2),
                title: x.title || x.name || 'งาน',
                category: x.category || 'popular',
                rate: x.rate || x.wage || 0,
                unit: x.unit || x.wageUnit || 'บาท/ชม.',
                type: x.type || 'ยืดหยุ่น',
                badge: x.badge || x.tags || [],
                positions: x.positions || 1,
                hiredCount: x.hiredCount || 0,
                full: Boolean(x.full),
                likes: Number(x.likes || 0),
                createdBy: String(x.createdBy || '')
            }));
        } else {
            state.jobs = sampleJobs;
        }
    } catch {
        state.jobs = sampleJobs
    }
    loader.style.display = 'none';
    renderJobs();
}

function renderCategories() {
    const box = document.getElementById('catScroll');
    box.innerHTML = '';
    categories.forEach(c => {
        const card = el('button', 'cat-card');
        card.setAttribute('data-id', c.id);
        const img = el('img');
        img.src = c.icon;
        img.alt = c.name;
        const name = el('div');
        name.textContent = c.name;
        card.append(img, name);
        card.addEventListener('click', () => {
            state.category = state.category === c.id ? null : c.id;
            document.querySelectorAll('.cat-card').forEach(x => x.style.borderColor = '#e2e8f0');
            if (state.category) {
                card.style.borderColor = 'var(--primary)'
            }
            renderJobs()
        });
        box.append(card)
    })
}

function jobCard(j) {
    const card = el('div', 'card shadow');
    const h = el('h3');
    h.textContent = j.title;
    const meta = el('div', 'meta');
    meta.textContent = `${j.rate} ${j.unit} • ${j.type}`;
    const tags = el('div', 'tags');
    (j.badge || []).forEach(t => {
        const b = el('span', 'tag');
        b.textContent = t;
        tags.append(b)
    });
    const limit = Math.max(1, Number(j.positions || 1));
    const stats = el('div', 'meta');
    stats.textContent = `รับ ${limit} ตำแหน่ง • รับแล้ว ${Number(j.hiredCount||0)}`;
    const actions = el('div', 'card-actions');
    const a = el('a', 'btn-secondary btn');
    a.href = `../html/job-detail.html?id=${encodeURIComponent(j.id)}`;
    a.textContent = 'รายละเอียด';
    const filled = (Number(j.hiredCount || 0) >= limit) || Boolean(j.full);
    const b = el('a', 'btn');
    b.href = '#';
    b.textContent = filled ? 'พนักงานเต็มจำนวนแล้ว' : 'สมัครเลย';
    if (filled) {
        b.classList.add('btn-secondary');
        b.style.pointerEvents = 'none'
    } else {
        b.addEventListener('click', (e) => {
            e.preventDefault();
            preventDuplicateAndGo(j.id)
        })
    }
    const like = el('button', 'btn-outline btn');
    like.textContent = `ถูกใจ (${Number(j.likes||0)})`;
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
            ok.href = '../html/login.html';
            act.append(ok);
            card.append(header, act);
            wrap.append(card);
            document.body.appendChild(wrap);
            return
        }
        try {
            const r = await fetch(`${location.origin.replace(/\/$/,'')}/api/jobs/${encodeURIComponent(j.id)}/like`, { method:'POST', headers:{ Authorization:`Bearer ${s.token}` } });
            if (r.ok) {
                const d = await r.json();
                like.textContent = `ถูกใจ (${Number(d.likes||0)})`;
            }
        } catch {}
    });
    actions.append(a, b, like);
    card.append(h, meta, tags, stats, actions);
    return card
}

function renderJobs() {
    const grid = document.getElementById('jobGrid');
    grid.innerHTML = '';
    const kw = state.keyword.trim().toLowerCase();
    state.jobs
        .filter(j => !state.category || j.category === state.category)
        .filter(j => !state.employerId || String(j.createdBy) === String(state.employerId))
        .filter(j => !kw || j.title.toLowerCase().includes(kw))
        .forEach(j => grid.append(jobCard(j)));
    if (!grid.children.length) {
        const empty = el('div', 'card');
        const h = el('h3');
        h.textContent = state.employerId ? 'ผู้ประกอบการนี้ยังไม่มีงาน' : 'ยังไม่มีงานในหน้ารวม';
        const p = el('div', 'meta');
        p.textContent = state.employerId ? 'ลองกลับไปดูงานทั้งหมด หรือเลือกผู้ประกอบการอื่น' : 'เมื่อมีผู้ประกอบการโพสต์ งานจะปรากฏที่นี่';
        empty.append(h, p);
        grid.append(empty)
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
    const hasPending = s && s.token ?
        serverApps.some(a => ['pending', 'approved'].includes(String(a.status || 'pending'))) :
        localApps.length > 0;
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
            view.href = `../html/check-application.html?id=${encodeURIComponent(serverApps[0]._id||serverApps[0].id||'')}`
        } else if (localApps[0]) {
            view.href = `../html/check-application.html?id=${encodeURIComponent(localApps[0].id)}&code=${encodeURIComponent(localApps[0].code||'')}`
        } else {
            view.href = `../html/user-dashboard.html`
        }
        act.append(view, ok);
        card.append(header, dd, act);
        wrap.append(card);
        document.body.appendChild(wrap);
        return
    }
    location.href = `../html/apply-job.html?id=${encodeURIComponent(jobId)}`
}

function bindSearch() {
    const q = document.getElementById('q');
    document.getElementById('searchBtn').addEventListener('click', () => {
        state.keyword = q.value;
        renderJobs()
    });
    q.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            state.keyword = q.value;
            renderJobs()
        }
    })
}

function bindCarousel() {
    const s = document.getElementById('catScroll');
    document.getElementById('leftCat').addEventListener('click', () => s.scrollBy({
        left: -s.clientWidth,
        behavior: 'smooth'
    }));
    document.getElementById('rightCat').addEventListener('click', () => s.scrollBy({
        left: s.clientWidth,
        behavior: 'smooth'
    }));
    s.addEventListener('wheel', e => {
        e.preventDefault();
        s.scrollBy({
            left: e.deltaY,
            behavior: 'auto'
        })
    }, {
        passive: false
    })
}

function animate() {
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) {
                en.target.classList.add('show');
                io.unobserve(en.target)
            }
        })
    }, {
        threshold: .2
    });
    document.querySelectorAll('[data-animate]').forEach(n => io.observe(n))
}
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    const usp = new URLSearchParams(location.search);
    const eid = usp.get('employerId');
    const org = usp.get('orgName');
    if (eid) {
        state.employerId = eid;
        state.orgName = org || '';
        const heroH1 = document.querySelector('.hero-inner h1');
        if (heroH1) heroH1.textContent = state.orgName ? `งานทั้งหมดจาก ${state.orgName}` : 'งานจากผู้ประกอบการ';
    }
    bindSearch();
    bindCarousel();
    animate();
    applySessionHeader();
    loadJobs()
})
