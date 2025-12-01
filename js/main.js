const categories = [{
        id: 'popular',
        name: 'งานยอดนิยม',
        icon: 'images/job/งานยอดนิยม.svg'
    },
    {
        id: 'graphic',
        name: 'ออกแบบกราฟิก',
        icon: 'images/job/ออกแบบกราฟิก.svg'
    },
    {
        id: 'tech',
        name: 'เว็บไซต์และเทคโนโลยี',
        icon: 'images/job/เว็บไซต์และเทคโนโลยี.svg'
    },
    {
        id: 'edu',
        name: 'เรียนพิเศษ',
        icon: 'images/job/เรียนพิเศษ.svg'
    },
    {
        id: 'media',
        name: 'ภาพและเสียง',
        icon: 'images/job/ภาพและเสียง.svg'
    },
    {
        id: 'marketing',
        name: 'การตลาดและโฆษณา',
        icon: 'images/job/การตลาดและโฆษณา.svg'
    },
    {
        id: 'writing',
        name: 'เขียนและแปลภาษา',
        icon: 'images/job/เขียนและแปลภาษา.svg'
    },
    {
        id: 'engineer',
        name: 'สถาปัตย์และวิศวกรรม',
        icon: 'images/job/สถาปัตย์และวิศวกรรม.svg'
    },
    {
        id: 'lifestyle',
        name: 'ไลฟ์สไตล์',
        icon: 'images/job/ไลฟ์สไตล์.svg'
    },
    {
        id: 'business',
        name: 'ธุรกิจและที่ปรึกษา',
        icon: 'images/job/ธุรกิจและที่ปรึกษา.svg'
    }
]
const jobs = [{
        id: 1,
        title: 'อัดคลิปสั้นบนโซเชียล',
        category: 'media',
        rate: 80,
        unit: 'บาท/ชม.',
        type: 'รีโมท',
        badge: ['รีโมท', 'ยืดหยุ่น'],
        popular: true
    },
    {
        id: 2,
        title: 'พนักงานร้านกาแฟ-อาทิตย์',
        category: 'popular',
        rate: 65,
        unit: 'บาท/ชม.',
        type: 'กะเช้า',
        badge: ['กะ', 'บริการ'],
        popular: true
    },
    {
        id: 3,
        title: 'ออกแบบโพสต์โซเชียล',
        category: 'graphic',
        rate: 800,
        unit: 'บาท/งาน',
        type: 'รีโมท',
        badge: ['กราฟิก', 'รีโมท'],
        popular: true
    },
    {
        id: 4,
        title: 'ติวคณิต ม.ปลาย',
        category: 'edu',
        rate: 300,
        unit: 'บาท/ชม.',
        type: 'นัดหมาย',
        badge: ['สอนพิเศษ'],
        popular: false
    },
    {
        id: 5,
        title: 'ผู้ช่วย QA เว็บไซต์',
        category: 'tech',
        rate: 120,
        unit: 'บาท/ชม.',
        type: 'รีโมท',
        badge: ['เทคโนโลยี', 'รายชั่วโมง'],
        popular: false
    },
    {
        id: 6,
        title: 'คอนเทนต์มาร์เก็ตติ้ง',
        category: 'marketing',
        rate: 100,
        unit: 'บาท/ชม.',
        type: 'รีโมท',
        badge: ['การตลาด', 'รีโมท'],
        popular: true
    },
    {
        id: 7,
        title: 'ล่ามภาษาอังกฤษออนไลน์',
        category: 'writing',
        rate: 350,
        unit: 'บาท/ชม.',
        type: 'รีโมท',
        badge: ['แปลภาษา'],
        popular: false
    },
    {
        id: 8,
        title: 'ผู้ช่วยขายออนไลน์',
        category: 'business',
        rate: 90,
        unit: 'บาท/ชม.',
        type: 'ยืดหยุ่น',
        badge: ['อีคอมเมิร์ซ'],
        popular: true
    },
    {
        id: 9,
        title: 'ช่างตัดต่อวิดีโอ',
        category: 'media',
        rate: 900,
        unit: 'บาท/งาน',
        type: 'รีโมท',
        badge: ['ตัดต่อ'],
        popular: false
    },
    {
        id: 10,
        title: 'นักออกแบบ UI Mini Project',
        category: 'tech',
        rate: 150,
        unit: 'บาท/ชม.',
        type: 'รีโมท',
        badge: ['UI', 'รายชั่วโมง'],
        popular: true
    },
    {
        id: 11,
        title: 'ติววิทย์ ม.ต้น',
        category: 'edu',
        rate: 250,
        unit: 'บาท/ชม.',
        type: 'นัดหมาย',
        badge: ['สอนพิเศษ'],
        popular: false
    },
    {
        id: 12,
        title: 'จัดทำสไลด์นำเสนอ',
        category: 'writing',
        rate: 600,
        unit: 'บาท/งาน',
        type: 'รีโมท',
        badge: ['พรีเซนเทชัน'],
        popular: false
    }
]
const bannerImages = [
    'images/banners/banner1.png',
    'images/banners/banner2.png',
    'images/banners/banner3.png',
    'images/banners/banner4.png'
]
const state = {
    keyword: '',
    category: null,
    jobsTopLiked: []
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
            /* refresh role from server */
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
            }).catch(() => renderHeader(s, box))
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
    pill.href = 'html/profile.html';
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
        location.href = 'html/login.html'
    })
    const profileBtn = el('a', 'logout-btn');
    profileBtn.textContent = 'โปรไฟล์';
    profileBtn.href = 'html/profile.html';
    const applyBtn = el('a', 'logout-btn');
    applyBtn.textContent = 'สมัครเป็นผู้ประกอบการ';
    applyBtn.href = 'html/employer-apply.html';
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
                location.href = 'html/employer-apply.html'
            }
        }).catch(() => location.href = 'html/employer-apply.html')
    })
    const adminBtn = el('a', 'logout-btn');
    adminBtn.textContent = 'แผงควบคุมแอดมิน';
    adminBtn.href = 'html/admin.html';
    const postBtn = el('a', 'logout-btn');
    postBtn.textContent = 'โพสต์งาน';
    postBtn.href = 'html/post-job.html';
    const dashBtn = el('a', 'logout-btn');
    dashBtn.textContent = 'แดชบอร์ดผู้ประกอบการ';
    dashBtn.href = 'html/employer-dashboard.html';
    const userDash = el('a', 'logout-btn');
    userDash.textContent = 'สถานะการสมัคร';
    userDash.href = 'html/user-dashboard.html';
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
    (j.badge||[]).forEach(t => {
        const b = el('span', 'tag');
        b.textContent = t;
        tags.append(b)
    });
    const actions = el('div', 'card-actions');
    const a = el('a', 'btn-secondary btn');
    a.href = `html/job-detail.html?id=${encodeURIComponent(j.id)}`;
    a.textContent = 'รายละเอียด';
    const b = el('a', 'btn');
    b.href = `html/apply-job.html?id=${encodeURIComponent(j.id)}`;
    b.textContent = 'สมัครเลย';
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
            ok.href = 'html/login.html';
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
    card.append(h, meta, tags, actions);
    return card
}

function renderJobs() {
    const grid = document.getElementById('jobGrid');
    const loader = document.getElementById('jobsLoader');
    grid.innerHTML = '';
    loader.style.display = 'flex';
    const kw = state.keyword.trim().toLowerCase();
    setTimeout(() => {
        const list = (state.jobsTopLiked.length ? state.jobsTopLiked : jobs);
        list.filter(j => !state.category || j.category === state.category).filter(j => !kw || j.title.toLowerCase().includes(kw)).forEach(j => grid.append(jobCard(j)));
        if (!grid.children.length) {
            const empty = el('div', 'card');
            const h = el('h3');
            h.textContent = 'ยังไม่มีงานที่ถูกใจกันมากในตอนนี้';
            const p = el('div', 'meta');
            p.textContent = 'งานอื่นๆ ดูได้ที่หน้า งานทั้งหมด';
            empty.append(h, p);
            grid.append(empty)
        }
        loader.style.display = 'none'
    }, 500)
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

function buildBanner() {
    const track = document.getElementById('bannerTrack');
    const dots = document.getElementById('bannerDots');
    track.innerHTML = '';
    dots.innerHTML = '';
    bannerImages.forEach((src, i) => {
        const slide = el('div', 'banner-slide');
        const img = document.createElement('img');
        img.src = src;
        img.alt = 'banner';
        slide.append(img);
        track.append(slide);
        const d = el('div', 'banner-dot');
        if (i === 0) d.classList.add('active');
        dots.append(d)
    });
    let idx = 0;
    setInterval(() => {
        idx = (idx + 1) % bannerImages.length;
        track.style.transform = `translateX(-${idx*100}%)`;
        dots.querySelectorAll('.banner-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === idx)
        })
    }, 4000)
}
async function loadTopLiked() {
    try {
        const base = location.origin.replace(/\/$/, '');
        const r = await fetch(`${base}/api/jobs/top-liked?limit=6`, { cache:'no-store' });
        if (r.ok) {
            const d = await r.json();
            const list = Array.isArray(d.jobs) ? d.jobs : d;
            state.jobsTopLiked = list.map(x => ({
                id: x.id || x._id || Math.random().toString(36).slice(2),
                title: x.title || 'งาน',
                category: x.category || 'popular',
                rate: x.rate || 0,
                unit: x.unit || 'บาท/ชม.',
                type: x.type || 'ยืดหยุ่น',
                badge: x.tags || x.badge || [],
                likes: Number(x.likes || 0)
            }));
            return
        }
    } catch {
        /* ignore */
    }
    try {
        const base = location.origin.replace(/\/$/, '');
        const r2 = await fetch(`${base}/api/jobs`, { cache:'no-store' });
        if (r2.ok) {
            const d2 = await r2.json();
            const all = (Array.isArray(d2.jobs) ? d2.jobs : d2).map(x => ({
                id: x.id || x._id || Math.random().toString(36).slice(2),
                title: x.title || 'งาน',
                category: x.category || 'popular',
                rate: x.rate || 0,
                unit: x.unit || 'บาท/ชม.',
                type: x.type || 'ยืดหยุ่น',
                badge: x.tags || x.badge || [],
                likes: Number(x.likes || 0)
            }));
            state.jobsTopLiked = all.sort((a,b)=>Number(b.likes||0)-Number(a.likes||0)).slice(0,6);
            return
        }
    } catch {}
    state.jobsTopLiked = []
}
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    loadTopLiked().then(renderJobs);
    bindSearch();
    bindCarousel();
    animate();
    buildBanner();
    applySessionHeader()
    ;(function(){
        let s=null;try{s=JSON.parse(localStorage.getItem('ptu_session')||'null')}catch{}
        if(!s||!s.token){
            document.querySelectorAll('a[href$="ranking.html"]').forEach(a=>a.style.display='none')
        }
    })()
})
