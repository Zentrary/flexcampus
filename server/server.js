import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
    exec
} from 'child_process'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5174
const HOST = process.env.HOST || '0.0.0.0'
const MONGO_URI = process.env.MONGO_URI
const MONGO_DB = process.env.MONGO_DB || 'University'
const LOG_DIR = process.env.LOG_DIR || 'logs'
const WEB_PATH = process.env.WEB_PATH || path.join(process.cwd(), '..')
const JWT_SECRET = process.env.JWT_SECRET || Math.random().toString(36).slice(2)

const logDirPath = path.join(process.cwd(), LOG_DIR)
const logFilePath = path.join(logDirPath, 'app.log')
try {
    if (!fs.existsSync(logDirPath)) fs.mkdirSync(logDirPath, {
        recursive: true
    })
} catch {}

function ts() {
    return new Date().toISOString()
}

function writeLine(level, msg, meta) {
    const line = JSON.stringify({
        time: ts(),
        level,
        message: msg,
        meta
    }) + "\n"
    try {
        fs.appendFileSync(logFilePath, line)
    } catch {}
}

function info(msg, meta) {
    console.log(`[${ts()}] INFO ${msg}`);
    writeLine('INFO', msg, meta)
}

function warn(msg, meta) {
    console.warn(`[${ts()}] WARN ${msg}`);
    writeLine('WARN', msg, meta)
}

function error(msg, meta) {
    console.error(`[${ts()}] ERROR ${msg}`);
    writeLine('ERROR', msg, meta)
}

app.use(cors())
app.use(express.json())
// serve static site at root and /web for backward compatibility
app.use(express.static(WEB_PATH))
app.use('/web', express.static(WEB_PATH))
// request logging
app.use((req, res, next) => {
    const start = Date.now()
    const id = Math.random().toString(36).slice(2, 8)
    info(`Request start ${req.method} ${req.url}`, {
        id
    })
    res.on('finish', () => {
        const dur = Date.now() - start
        info(`Request end ${req.method} ${req.url} status=${res.statusCode} duration=${dur}ms`, {
            id
        })
    })
    next()
})

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'employer', 'admin']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
const User = mongoose.model('User', userSchema)
const appSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    username: {
        type: String
    },
    email: {
        type: String
    },
    orgName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    portfolioUrl: {
        type: String
    },
    contactPhone: {
        type: String
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected']
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
})
const EmployerApplication = mongoose.model('EmployerApplication', appSchema)
const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        default: 'popular'
    },
    rate: {
        type: Number,
        default: 0
    },
    unit: {
        type: String,
        default: 'บาท/ชม.'
    },
    type: {
        type: String,
        default: 'ยืดหยุ่น'
    },
    tags: {
        type: [String],
        default: []
    },
    description: {
        type: String,
        default: ''
    },
    positions: {
        type: Number,
        default: 1
    },
    hiredCount: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: {
        type: [String],
        default: []
    },
    full: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
const Job = mongoose.model('Job', jobSchema)
const jobAppSchema = new mongoose.Schema({
    jobId: {
        type: String,
        required: true
    },
    jobTitle: {
        type: String
    },
    employerId: {
        type: String
    },
    applicantUserId: {
        type: String
    },
    applicantName: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    phone: {
        type: String
    },
    age: {
        type: Number
    },
    about: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected']
    },
    messages: [{
        from: String,
        text: String,
        at: {
            type: Date,
            default: Date.now
        }
    }],
    accessCode: {
        type: String
    }
})
const JobApplication = mongoose.model('JobApplication', jobAppSchema)
const memory = {
    users: [],
    applications: [],
    jobs: [],
    jobApplications: []
}
mongoose.set('autoIndex', true)

mongoose.connection.on('connected', () => info(`MongoDB connected (db=${MONGO_DB})`))
mongoose.connection.on('error', (e) => error(`MongoDB error ${e.message}`))
mongoose.connection.on('disconnected', () => warn('MongoDB disconnected'))

app.post('/api/auth/register', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            username,
            email,
            phone,
            age,
            password
        } = req.body
        if (!firstName || !lastName || !username || !email || !phone || !age || !password) {
            return res.status(400).json({
                error: 'Missing required fields'
            })
        }
        if (mongoose.connection.readyState !== 1) {
            const exists = memory.users.find((u) => u.email === email || u.username === username)
            if (exists) return res.status(409).json({
                error: 'Email or username already taken'
            })
            const passwordHash = await bcrypt.hash(password, 10)
            const user = {
                id: String(Date.now()),
                firstName,
                lastName,
                username,
                email,
                phone,
                age,
                passwordHash,
                role: 'user'
            }
            memory.users.push(user)
            info(`User registered (memory): ${username}`)
            const token = jwt.sign({
                id: user.id,
                role: user.role,
                username: user.username
            }, JWT_SECRET, {
                expiresIn: '7d'
            })
            return res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
                token
            })
        } else {
            const exists = await User.findOne({
                $or: [{
                    email
                }, {
                    username
                }]
            })
            if (exists) return res.status(409).json({
                error: 'Email or username already taken'
            })
            const passwordHash = await bcrypt.hash(password, 10)
            const user = await User.create({
                firstName,
                lastName,
                username,
                email,
                phone,
                age,
                passwordHash
            })
            info(`User registered (mongo): ${username}`, {
                id: String(user._id)
            })
            writeLine('INFO', 'Mongo write user', {
                id: String(user._id),
                username
            })
            const token = jwt.sign({
                id: String(user._id),
                role: user.role,
                username: user.username
            }, JWT_SECRET, {
                expiresIn: '7d'
            })
            return res.json({
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
                token
            })
        }
    } catch (err) {
        error(`Register failed ${String(err)}`)
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.post('/api/auth/login', async (req, res) => {
    try {
        const {
            identity,
            password
        } = req.body
        if (mongoose.connection.readyState !== 1) {
            const ci = String(identity).toLowerCase()
            const user = memory.users.find((u) => String(u.email || '').toLowerCase() === ci || String(u.username || '').toLowerCase() === ci)
            if (!user) return res.status(400).json({
                error: 'User not found'
            })
            const ok = await bcrypt.compare(password, user.passwordHash)
            if (!ok) return res.status(400).json({
                error: 'Invalid password'
            })
            info(`User login (memory): ${user.username}`)
            const token = jwt.sign({
                id: user.id,
                role: user.role,
                username: user.username
            }, JWT_SECRET, {
                expiresIn: '7d'
            })
            return res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
                token
            })
        } else {
            const esc = String(identity).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const ci = new RegExp(`^${esc}$`, 'i')
            const user = await User.findOne({
                $or: [{
                    email: ci
                }, {
                    username: ci
                }]
            })
            if (!user) return res.status(400).json({
                error: 'User not found'
            })
            const ok = await bcrypt.compare(password, user.passwordHash)
            if (!ok) return res.status(400).json({
                error: 'Invalid password'
            })
            info(`User login (mongo): ${user.username}`)
            const token = jwt.sign({
                id: String(user._id),
                role: user.role,
                username: user.username
            }, JWT_SECRET, {
                expiresIn: '7d'
            })
            return res.json({
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                name: `${user.firstName} ${user.lastName}`,
                token
            })
        }
    } catch (err) {
        error(`Login failed ${String(err)}`)
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

function authFromHeader(req) {
    try {
        const h = req.headers.authorization || ''
        const t = h.startsWith('Bearer ') ? h.slice(7) : ''
        if (!t) return null
        return jwt.verify(t, JWT_SECRET)
    } catch {
        return null
    }
}

app.post('/api/employer/apply', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (u.role !== 'user') return res.status(400).json({
            error: 'Only user can apply'
        })
        const {
            orgName,
            description,
            reason,
            portfolioUrl,
            contactPhone
        } = req.body || {}
        if (!orgName || !description || !reason) return res.status(400).json({
            error: 'Missing required fields'
        })
        if (mongoose.connection.readyState !== 1) {
            const id = String(Date.now())
            memory.applications.push({
                id,
                userId: u.id,
                name: '',
                username: u.username,
                email: '',
                orgName,
                description,
                reason,
                portfolioUrl,
                contactPhone,
                status: 'pending',
                submittedAt: new Date()
            })
            info('Employer apply (memory)', {
                id
            })
            return res.json({
                ok: true,
                id
            })
        } else {
            const user = await User.findById(u.id)
            const appDoc = await EmployerApplication.create({
                userId: String(user._id),
                name: `${user.firstName} ${user.lastName}`,
                username: user.username,
                email: user.email,
                orgName,
                description,
                reason,
                portfolioUrl,
                contactPhone
            })
            info('Employer apply (mongo)', {
                id: String(appDoc._id)
            })
            return res.json({
                ok: true,
                id: String(appDoc._id)
            })
        }
    } catch (e) {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})
app.get('/api/employer/application/status', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (mongoose.connection.readyState !== 1) {
            const list = memory.applications.filter(a => String(a.userId) === String(u.id)).sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            const latest = list[0]
            if (!latest) return res.json({
                has: false
            })
            return res.json({
                has: true,
                status: latest.status,
                orgName: latest.orgName,
                id: latest.id
            })
        } else {
            const latest = await EmployerApplication.findOne({
                userId: String(u.id)
            }).sort({
                submittedAt: -1
            }).lean()
            if (!latest) return res.json({
                has: false
            })
            return res.json({
                has: true,
                status: latest.status,
                orgName: latest.orgName,
                id: String(latest._id)
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.get('/api/jobs', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json({
                jobs: memory.jobs
            })
        } else {
            const list = await Job.find().sort({
                createdAt: -1
            }).lean()
            return res.json({
                jobs: list
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// public job detail
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const id = req.params.id
        if (mongoose.connection.readyState !== 1) {
            const j = memory.jobs.find(x => String(x.id) === String(id))
            if (!j) return res.status(404).json({
                error: 'Not found'
            })
            return res.json(j)
        } else {
            const j = await Job.findById(id).lean()
            if (!j) return res.status(404).json({
                error: 'Not found'
            })
            return res.json(j)
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// employer job create
app.post('/api/employer/jobs', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (!['employer', 'admin'].includes(String(u.role))) return res.status(403).json({
            error: 'Only employer or admin can post job'
        })
        const {
            title,
            category,
            rate,
            unit,
            type,
            tags,
            description,
            positions
        } = req.body || {}
        if (!title) return res.status(400).json({
            error: 'Missing title'
        })
        const doc = {
            title: String(title),
            category: typeof category === 'string' ? category : 'popular',
            rate: typeof rate === 'number' ? rate : Number(rate) || 0,
            unit: typeof unit === 'string' ? unit : 'บาท/ชม.',
            type: typeof type === 'string' ? type : 'ยืดหยุ่น',
            tags: Array.isArray(tags) ? tags.map(x => String(x)).slice(0, 10) : [],
            description: typeof description === 'string' ? String(description).trim() : '',
            positions: typeof positions === 'number' ? Math.max(1, Math.floor(positions)) : 1,
            hiredCount: 0,
            likes: 0,
            likedBy: [],
            full: false,
            createdBy: String(u.id)
        }
        if (mongoose.connection.readyState !== 1) {
            const id = String(Date.now())
            const j = {
                id,
                ...doc,
                createdAt: new Date()
            }
            memory.jobs.unshift(j)
            return res.json({
                ok: true,
                id
            })
        } else {
            const j = await Job.create(doc)
            return res.json({
                ok: true,
                id: String(j._id)
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.post('/api/jobs/:id/like', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        const id = req.params.id
        if (mongoose.connection.readyState !== 1) {
            const j = memory.jobs.find(x => String(x.id) === String(id))
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            j.likedBy = Array.isArray(j.likedBy) ? j.likedBy : []
            const idx = j.likedBy.findIndex(x => String(x) === String(u.id))
            if (idx >= 0) j.likedBy.splice(idx, 1)
            else j.likedBy.push(String(u.id))
            j.likes = j.likedBy.length
            return res.json({
                liked: idx < 0,
                likes: j.likes
            })
        } else {
            const j = await Job.findById(id)
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            j.likedBy = Array.isArray(j.likedBy) ? j.likedBy : []
            const idx = j.likedBy.findIndex(x => String(x) === String(u.id))
            if (idx >= 0) j.likedBy.splice(idx, 1)
            else j.likedBy.push(String(u.id))
            j.likes = j.likedBy.length
            await j.save()
            return res.json({
                liked: idx < 0,
                likes: j.likes
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.get('/api/jobs/top-liked', async (req, res) => {
    try {
        const limit = Math.max(1, Number(req.query.limit || 6))
        if (mongoose.connection.readyState !== 1) {
            const list = memory.jobs.slice().sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0)).slice(0, limit)
            return res.json({ jobs: list })
        } else {
            const list = await Job.find().sort({ likes: -1, createdAt: -1 }).limit(limit).lean()
            return res.json({ jobs: list })
        }
    } catch (e) {
        error(`TopLiked error ${e.message}`)
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.get('/api/employers/top-liked', async (req, res) => {
    try {
        const limit = Math.max(1, Number(req.query.limit || 10))
        if (mongoose.connection.readyState !== 1) {
            const map = new Map()
            memory.jobs.forEach(j => {
                const emp = String(j.createdBy || '')
                const likes = Number(j.likes || 0)
                if (!emp) return
                const prev = map.get(emp) || 0
                map.set(emp, prev + likes)
            })
            const arr = Array.from(map.entries()).map(([employerId, likes]) => {
                const u = memory.users.find(x => String(x.id) === String(employerId))
                const name = u ? `${u.firstName} ${u.lastName}` : employerId
                const approved = memory.applications.filter(a => String(a.userId) === String(employerId) && String(a.status) === 'approved').sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))[0]
                const orgName = approved ? approved.orgName : name
                return { employerId, name, orgName, likes }
            }).sort((a, b) => Number(b.likes) - Number(a.likes)).slice(0, limit)
            return res.json({ list: arr })
        } else {
            const rows = await Job.aggregate([
                { $group: { _id: '$createdBy', likes: { $sum: { $ifNull: ['$likes', 0] } } } },
                { $sort: { likes: -1 } },
                { $limit: limit }
            ])
            const ids = rows.map(r => String(r._id)).filter(Boolean)
            const users = await User.find({ _id: { $in: ids } }, { firstName: 1, lastName: 1 }).lean()
            const orgs = await EmployerApplication.aggregate([
                { $match: { userId: { $in: ids }, status: 'approved' } },
                { $sort: { submittedAt: -1 } },
                { $group: { _id: '$userId', orgName: { $first: '$orgName' } } }
            ])
            const userMap = new Map(users.map(u => [String(u._id), `${u.firstName} ${u.lastName}`]))
            const orgMap = new Map(orgs.map(o => [String(o._id), o.orgName]))
            const list = rows.map(r => ({
                employerId: String(r._id),
                name: userMap.get(String(r._id)) || String(r._id),
                orgName: orgMap.get(String(r._id)) || userMap.get(String(r._id)) || String(r._id),
                likes: Number(r.likes || 0)
            }))
            return res.json({ list })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// employer my jobs
app.get('/api/employer/jobs/my', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (u.role !== 'employer') return res.status(403).json({
            error: 'Only employer allowed'
        })
        if (mongoose.connection.readyState !== 1) {
            const list = memory.jobs.filter(x => String(x.createdBy) === String(u.id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            return res.json({
                jobs: list
            })
        } else {
            const list = await Job.find({
                createdBy: String(u.id)
            }).sort({
                createdAt: -1
            }).lean()
            return res.json({
                jobs: list
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// employer update job
app.put('/api/employer/jobs/:id', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (u.role !== 'employer') return res.status(403).json({
            error: 'Only employer allowed'
        })
        const id = req.params.id
        const patch = req.body || {}
        const allowed = ['title', 'category', 'rate', 'unit', 'type', 'tags', 'description', 'positions']
        if (mongoose.connection.readyState !== 1) {
            const j = memory.jobs.find(x => String(x.id) === String(id))
            if (!j) return res.status(404).json({
                error: 'Not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            allowed.forEach(k => {
                if (k in patch) {
                    j[k] = patch[k]
                }
            })
            if (typeof j.positions === 'number' && typeof j.hiredCount === 'number') j.full = j.hiredCount >= Math.max(1, Math.floor(j.positions))
            return res.json({
                ok: true
            })
        } else {
            const j = await Job.findById(id)
            if (!j) return res.status(404).json({
                error: 'Not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            allowed.forEach(k => {
                if (k in patch) {
                    j[k] = patch[k]
                }
            })
            if (typeof j.positions === 'number' && typeof j.hiredCount === 'number') j.full = j.hiredCount >= Math.max(1, Math.floor(j.positions))
            await j.save()
            return res.json({
                ok: true
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// employer delete job
app.delete('/api/employer/jobs/:id', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (u.role !== 'employer') return res.status(403).json({
            error: 'Only employer allowed'
        })
        const id = req.params.id
        if (mongoose.connection.readyState !== 1) {
            const i = memory.jobs.findIndex(x => String(x.id) === String(id))
            if (i < 0) return res.status(404).json({
                error: 'Not found'
            })
            if (String(memory.jobs[i].createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            memory.jobs.splice(i, 1)
            return res.json({
                ok: true
            })
        } else {
            const j = await Job.findById(id)
            if (!j) return res.status(404).json({
                error: 'Not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            await Job.deleteOne({
                _id: id
            })
            return res.json({
                ok: true
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// user applies to a job (no login required)
app.post('/api/jobs/:id/apply', async (req, res) => {
    try {
        const id = req.params.id
        const {
            name,
            email,
            phone,
            age,
            about
        } = req.body || {}
        const u = authFromHeader(req)
        if (!name) {
            return res.status(400).json({
                error: 'Missing name'
            })
        }
        if (mongoose.connection.readyState !== 1) {
            const j = memory.jobs.find(x => String(x.id) === String(id))
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            const limit = Math.max(1, Number(j.positions || 1))
            const filled = Number(j.hiredCount || 0) >= limit || Boolean(j.full)
            if (filled) return res.status(400).json({
                error: 'Job is full'
            })
            const dup = memory.jobApplications.find(x => String(x.jobId) === String(j.id) && (
                (u && x.applicantUserId && String(x.applicantUserId) === String(u.id)) ||
                (!!email && x.email && String(x.email).toLowerCase() === String(email).toLowerCase()) ||
                (!!phone && x.phone && String(x.phone) === String(phone))
            ) && ['pending', 'approved'].includes(String(x.status || 'pending')))
            if (dup) return res.status(409).json({
                error: 'Already applied'
            })
            const appId = String(Date.now())
            const code = Math.random().toString(36).slice(2, 8)
            memory.jobApplications.push({
                id: appId,
                jobId: String(j.id),
                jobTitle: j.title,
                employerId: String(j.createdBy || ''),
                applicantUserId: u ? String(u.id) : null,
                applicantName: String(name),
                email: String(email || ''),
                phone: String(phone || ''),
                age: age ? Number(age) : undefined,
                about: String(about || ''),
                status: 'pending',
                messages: [],
                accessCode: code,
                createdAt: new Date()
            })
            return res.json({
                ok: true,
                applicationId: appId,
                code
            })
        } else {
            const j = await Job.findById(id)
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            const limit = Math.max(1, Number(j.positions || 1))
            const filled = Number(j.hiredCount || 0) >= limit || Boolean(j.full)
            if (filled) return res.status(400).json({
                error: 'Job is full'
            })
            const q = {
                jobId: String(j._id),
                status: {
                    $in: ['pending', 'approved']
                }
            }
            if (u && u.id) {
                q['applicantUserId'] = String(u.id)
            } else if (email || phone) {
                q['$or'] = [...(email ? [{
                    email: String(email)
                }] : []), ...(phone ? [{
                    phone: String(phone)
                }] : [])]
            }
            const dup = await JobApplication.findOne(q).lean()
            if (dup) return res.status(409).json({
                error: 'Already applied'
            })
            const code = Math.random().toString(36).slice(2, 8)
            const doc = await JobApplication.create({
                jobId: String(j._id),
                jobTitle: j.title,
                employerId: String(j.createdBy || ''),
                applicantUserId: u ? String(u.id) : undefined,
                applicantName: String(name),
                email: String(email || ''),
                phone: String(phone || ''),
                age: age ? Number(age) : undefined,
                about: String(about || ''),
                accessCode: code
            })
            return res.json({
                ok: true,
                applicationId: String(doc._id),
                code
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// get application detail (user or guest via code)
app.get('/api/applications/:id', async (req, res) => {
    try {
        const id = req.params.id
        const code = (req.query.code || '').toString()
        const u = authFromHeader(req)
        if (mongoose.connection.readyState !== 1) {
            const a = memory.jobApplications.find(x => String(x.id) === String(id))
            if (!a) return res.status(404).json({
                error: 'Not found'
            })
            const isOwner = (u && a.applicantUserId && String(a.applicantUserId) === String(u.id)) || (!!code && code === a.accessCode)
            if (!isOwner) return res.status(403).json({
                error: 'Forbidden'
            })
            return res.json(a)
        } else {
            const a = await JobApplication.findById(id).lean()
            if (!a) return res.status(404).json({
                error: 'Not found'
            })
            const isOwner = (u && a.applicantUserId && String(a.applicantUserId) === String(u.id)) || (!!code && code === a.accessCode)
            if (!isOwner) return res.status(403).json({
                error: 'Forbidden'
            })
            return res.json(a)
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// employer lists applications for a job
app.get('/api/employer/jobs/:id/applications', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (u.role !== 'employer') return res.status(403).json({
            error: 'Only employer allowed'
        })
        const id = req.params.id
        if (mongoose.connection.readyState !== 1) {
            const j = memory.jobs.find(x => String(x.id) === String(id))
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            const list = memory.jobApplications.filter(a => String(a.jobId) === String(j.id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            return res.json({
                applications: list
            })
        } else {
            const j = await Job.findById(id)
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            const list = await JobApplication.find({
                jobId: String(j._id)
            }).sort({
                createdAt: -1
            }).lean()
            return res.json({
                applications: list
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// employer approves an application
app.post('/api/employer/jobs/:jobId/applications/:appId/approve', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (u.role !== 'employer') return res.status(403).json({
            error: 'Only employer allowed'
        })
        const jobId = req.params.jobId
        const appId = req.params.appId
        if (mongoose.connection.readyState !== 1) {
            const j = memory.jobs.find(x => String(x.id) === String(jobId))
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            const limit = Math.max(1, Number(j.positions || 1))
            if (Number(j.hiredCount || 0) >= limit) {
                j.full = true;
                return res.status(400).json({
                    error: 'Positions filled'
                })
            }
            const a = memory.jobApplications.find(x => String(x.id) === String(appId) && String(x.jobId) === String(j.id))
            if (!a) return res.status(404).json({
                error: 'Application not found'
            })
            a.status = 'approved'
            a.messages.push({
                from: 'system',
                text: `คุณได้ทำงานกับ "${j.title}" แล้ว`,
                at: new Date()
            })
            j.hiredCount = Number(j.hiredCount || 0) + 1
            j.full = j.hiredCount >= limit
            return res.json({
                ok: true,
                full: j.full
            })
        } else {
            const j = await Job.findById(jobId)
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            const limit = Math.max(1, Number(j.positions || 1))
            if (Number(j.hiredCount || 0) >= limit) {
                j.full = true;
                await j.save();
                return res.status(400).json({
                    error: 'Positions filled'
                })
            }
            const a = await JobApplication.findOne({
                _id: appId,
                jobId: String(j._id)
            })
            if (!a) return res.status(404).json({
                error: 'Application not found'
            })
            a.status = 'approved'
            a.messages.push({
                from: 'system',
                text: `คุณได้ทำงานกับ "${j.title}" แล้ว`
            })
            await a.save()
            j.hiredCount = Number(j.hiredCount || 0) + 1
            j.full = j.hiredCount >= limit
            await j.save()
            return res.json({
                ok: true,
                full: j.full
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// employer rejects an application
app.post('/api/employer/jobs/:jobId/applications/:appId/reject', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (u.role !== 'employer') return res.status(403).json({
            error: 'Only employer allowed'
        })
        const jobId = req.params.jobId
        const appId = req.params.appId
        if (mongoose.connection.readyState !== 1) {
            const j = memory.jobs.find(x => String(x.id) === String(jobId))
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            const a = memory.jobApplications.find(x => String(x.id) === String(appId) && String(x.jobId) === String(j.id))
            if (!a) return res.status(404).json({
                error: 'Application not found'
            })
            a.status = 'rejected'
            a.messages.push({
                from: 'system',
                text: `คำขอทำงานกับ "${j.title}" ไม่ผ่าน`,
                at: new Date()
            })
            return res.json({
                ok: true
            })
        } else {
            const j = await Job.findById(jobId)
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            const a = await JobApplication.findOne({
                _id: appId,
                jobId: String(j._id)
            })
            if (!a) return res.status(404).json({
                error: 'Application not found'
            })
            a.status = 'rejected'
            a.messages.push({
                from: 'system',
                text: `คำขอทำงานกับ "${j.title}" ไม่ผ่าน`
            })
            await a.save()
            return res.json({
                ok: true
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// employer sends a message to applicant
app.post('/api/employer/jobs/:jobId/applications/:appId/message', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (u.role !== 'employer') return res.status(403).json({
            error: 'Only employer allowed'
        })
        const jobId = req.params.jobId
        const appId = req.params.appId
        const {
            text
        } = req.body || {}
        if (!text || !String(text).trim()) return res.status(400).json({
            error: 'Missing message'
        })
        if (mongoose.connection.readyState !== 1) {
            const j = memory.jobs.find(x => String(x.id) === String(jobId))
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            const a = memory.jobApplications.find(x => String(x.id) === String(appId) && String(x.jobId) === String(j.id))
            if (!a) return res.status(404).json({
                error: 'Application not found'
            })
            a.messages.push({
                from: 'employer',
                text: String(text),
                at: new Date()
            })
            return res.json({
                ok: true
            })
        } else {
            const j = await Job.findById(jobId)
            if (!j) return res.status(404).json({
                error: 'Job not found'
            })
            if (String(j.createdBy) !== String(u.id)) return res.status(403).json({
                error: 'Forbidden'
            })
            const a = await JobApplication.findOne({
                _id: appId,
                jobId: String(j._id)
            })
            if (!a) return res.status(404).json({
                error: 'Application not found'
            })
            a.messages.push({
                from: 'employer',
                text: String(text)
            })
            await a.save()
            return res.json({
                ok: true
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// delete a message from application (owner by auth or access code)
app.delete('/api/applications/:id/messages/:idx', async (req, res) => {
    try {
        const id = req.params.id
        const idx = Number(req.params.idx)
        const code = (req.query.code || '').toString()
        const u = authFromHeader(req)
        if (Number.isNaN(idx) || idx < 0) return res.status(400).json({
            error: 'Invalid index'
        })
        if (mongoose.connection.readyState !== 1) {
            const a = memory.jobApplications.find(x => String(x.id) === String(id))
            if (!a) return res.status(404).json({
                error: 'Application not found'
            })
            const isOwner = (u && a.applicantUserId && String(a.applicantUserId) === String(u.id)) || (!!code && code === a.accessCode)
            if (!isOwner) return res.status(403).json({
                error: 'Forbidden'
            })
            if (!Array.isArray(a.messages) || idx >= a.messages.length) return res.status(404).json({
                error: 'Message not found'
            })
            a.messages.splice(idx, 1)
            return res.json({
                ok: true
            })
        } else {
            const a = await JobApplication.findById(id)
            if (!a) return res.status(404).json({
                error: 'Application not found'
            })
            const isOwner = (u && a.applicantUserId && String(a.applicantUserId) === String(u.id)) || (!!code && code === a.accessCode)
            if (!isOwner) return res.status(403).json({
                error: 'Forbidden'
            })
            if (!Array.isArray(a.messages) || idx >= a.messages.length) return res.status(404).json({
                error: 'Message not found'
            })
            a.messages.splice(idx, 1)
            await a.save()
            return res.json({
                ok: true
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.get('/api/admin/stats', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u || u.role !== 'admin') return res.status(401).json({
            error: 'Unauthorized'
        })
        if (mongoose.connection.readyState !== 1) {
            const users = memory.users.filter(x => x.role === 'user').length
            const employers = memory.users.filter(x => x.role === 'employer').length
            const admins = memory.users.filter(x => x.role === 'admin').length
            return res.json({
                users,
                employers,
                admins
            })
        } else {
            const [users, employers, admins] = await Promise.all([
                User.countDocuments({
                    role: 'user'
                }),
                User.countDocuments({
                    role: 'employer'
                }),
                User.countDocuments({
                    role: 'admin'
                })
            ])
            return res.json({
                users,
                employers,
                admins
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.get('/api/admin/employer-applications', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u || u.role !== 'admin') return res.status(401).json({
            error: 'Unauthorized'
        })
        if (mongoose.connection.readyState !== 1) {
            return res.json(memory.applications.filter(a => a.status === 'pending'))
        } else {
            const list = await EmployerApplication.find({
                status: 'pending'
            }).sort({
                submittedAt: -1
            }).lean()
            return res.json(list)
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.get('/api/admin/jobs', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u || u.role !== 'admin') return res.status(401).json({
            error: 'Unauthorized'
        })
        if (mongoose.connection.readyState !== 1) {
            return res.json(memory.jobs)
        } else {
            const list = await Job.find().sort({
                createdAt: -1
            }).lean()
            return res.json(list)
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.delete('/api/admin/jobs/:id', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u || u.role !== 'admin') return res.status(401).json({
            error: 'Unauthorized'
        })
        const id = req.params.id
        if (mongoose.connection.readyState !== 1) {
            const i = memory.jobs.findIndex(j => String(j.id) === String(id))
            if (i < 0) return res.status(404).json({
                error: 'Not found'
            })
            memory.jobs.splice(i, 1)
            return res.json({
                ok: true
            })
        } else {
            const r = await Job.deleteOne({
                _id: id
            })
            if (r.deletedCount === 0) return res.status(404).json({
                error: 'Not found'
            })
            return res.json({
                ok: true
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.get('/api/user/profile', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (mongoose.connection.readyState !== 1) {
            const x = memory.users.find(m => String(m.id) === String(u.id))
            if (!x) return res.status(404).json({
                error: 'User not found'
            })
            return res.json({
                id: x.id,
                firstName: x.firstName,
                lastName: x.lastName,
                username: x.username,
                email: x.email,
                phone: x.phone,
                role: x.role
            })
        } else {
            const x = await User.findById(u.id)
            if (!x) return res.status(404).json({
                error: 'User not found'
            })
            return res.json({
                id: x._id,
                firstName: x.firstName,
                lastName: x.lastName,
                username: x.username,
                email: x.email,
                phone: x.phone,
                role: x.role
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

// list job applications of the logged-in user
app.get('/api/user/applications', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        if (mongoose.connection.readyState !== 1) {
            const list = memory.jobApplications.filter(a => String(a.applicantUserId || '') === String(u.id)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            return res.json({
                applications: list
            })
        } else {
            const list = await JobApplication.find({
                applicantUserId: String(u.id)
            }).sort({
                createdAt: -1
            }).lean()
            return res.json({
                applications: list
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})
app.put('/api/user/profile', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u) return res.status(401).json({
            error: 'Unauthorized'
        })
        const {
            phone,
            email,
            username
        } = req.body || {}
        if (mongoose.connection.readyState !== 1) {
            const ix = memory.users.findIndex(m => String(m.id) === String(u.id))
            if (ix < 0) return res.status(404).json({
                error: 'User not found'
            })
            if (typeof email === 'string' && memory.users.some(m => m.email === email && m.id !== u.id)) return res.status(409).json({
                error: 'Email already taken'
            })
            if (typeof username === 'string' && memory.users.some(m => m.username === username && m.id !== u.id)) return res.status(409).json({
                error: 'Username already taken'
            })
            if (typeof phone === 'string') memory.users[ix].phone = phone
            if (typeof email === 'string') memory.users[ix].email = email
            if (typeof username === 'string') memory.users[ix].username = username
            const x = memory.users[ix]
            return res.json({
                id: x.id,
                firstName: x.firstName,
                lastName: x.lastName,
                username: x.username,
                email: x.email,
                phone: x.phone,
                role: x.role
            })
        } else {
            try {
                const x = await User.findById(u.id)
                if (!x) return res.status(404).json({
                    error: 'User not found'
                })
                if (typeof phone === 'string') x.phone = phone
                if (typeof email === 'string') x.email = email
                if (typeof username === 'string') x.username = username
                await x.save()
                return res.json({
                    id: x._id,
                    firstName: x.firstName,
                    lastName: x.lastName,
                    username: x.username,
                    email: x.email,
                    phone: x.phone,
                    role: x.role
                })
            } catch (e) {
                const msg = String(e && e.message || '')
                if (/E11000/.test(msg)) return res.status(409).json({
                    error: 'Duplicate key'
                })
                return res.status(500).json({
                    error: 'Internal error'
                })
            }
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.post('/api/admin/employer-applications/:id/approve', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u || u.role !== 'admin') return res.status(401).json({
            error: 'Unauthorized'
        })
        const id = req.params.id
        if (mongoose.connection.readyState !== 1) {
            const a = memory.applications.find(x => String(x.id) === String(id))
            if (!a) return res.status(404).json({
                error: 'Not found'
            })
            a.status = 'approved'
            const usr = memory.users.find(x => String(x.id) === String(a.userId))
            if (usr) {
                usr.role = 'employer'
            }
            return res.json({
                ok: true
            })
        } else {
            const a = await EmployerApplication.findById(id)
            if (!a) return res.status(404).json({
                error: 'Not found'
            })
            a.status = 'approved'
            await a.save()
            await User.updateOne({
                _id: a.userId
            }, {
                $set: {
                    role: 'employer'
                }
            })
            return res.json({
                ok: true
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.post('/api/admin/employer-applications/:id/reject', async (req, res) => {
    try {
        const u = authFromHeader(req)
        if (!u || u.role !== 'admin') return res.status(401).json({
            error: 'Unauthorized'
        })
        const id = req.params.id
        if (mongoose.connection.readyState !== 1) {
            const a = memory.applications.find(x => String(x.id) === String(id))
            if (!a) return res.status(404).json({
                error: 'Not found'
            })
            a.status = 'rejected'
            return res.json({
                ok: true
            })
        } else {
            const a = await EmployerApplication.findById(id)
            if (!a) return res.status(404).json({
                error: 'Not found'
            })
            a.status = 'rejected'
            await a.save()
            return res.json({
                ok: true
            })
        }
    } catch {
        return res.status(500).json({
            error: 'Internal error'
        })
    }
})

app.get('/api/auth/me', async (req, res) => {
    try {
        const h = req.headers.authorization || ''
        const t = h.startsWith('Bearer ') ? h.slice(7) : ''
        if (!t) return res.status(401).json({
            error: 'Missing token'
        })
        const payload = jwt.verify(t, JWT_SECRET)
        if (mongoose.connection.readyState !== 1) {
            const u = memory.users.find(x => x.id === payload.id)
            if (!u) return res.status(404).json({
                error: 'User not found'
            })
            return res.json({
                id: u.id,
                username: u.username,
                email: u.email,
                role: u.role,
                name: `${u.firstName} ${u.lastName}`
            })
        } else {
            const u = await User.findById(payload.id)
            if (!u) return res.status(404).json({
                error: 'User not found'
            })
            return res.json({
                id: u._id,
                username: u.username,
                email: u.email,
                role: u.role,
                name: `${u.firstName} ${u.lastName}`
            })
        }
    } catch (e) {
        return res.status(401).json({
            error: 'Invalid token'
        })
    }
})

// client event logs
app.post('/api/log', (req, res) => {
    const {
        type,
        message,
        payload
    } = req.body || {}
    if (!type && !message) {
        return res.status(400).json({
            ok: false,
            error: 'Missing type or message'
        })
    }
    info(`ClientLog ${type||'event'} ${message||''}`, payload)
    res.json({
        ok: true
    })
})

async function start() {
    info('Server starting')
    try {
        if (!MONGO_URI) throw new Error('MONGO_URI is not set')
        info('Connecting to MongoDB')
        await mongoose.connect(MONGO_URI, {
            dbName: MONGO_DB
        })
        info(`Database status: connected (${MONGO_DB})`)
    } catch (err) {
        warn(`MongoDB unavailable: ${err.message}`)
        info('Using in-memory database')
    }
    try {
        const {
            ADMIN_EMAIL,
            ADMIN_USERNAME,
            ADMIN_PASSWORD
        } = process.env
        if (ADMIN_EMAIL && ADMIN_USERNAME && ADMIN_PASSWORD) {
            if (mongoose.connection.readyState === 1) {
                let admin = await User.findOne({
                    $or: [{
                        email: ADMIN_EMAIL
                    }, {
                        username: ADMIN_USERNAME
                    }]
                })
                const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
                if (!admin) {
                    await User.create({
                        firstName: 'Admin',
                        lastName: 'User',
                        username: ADMIN_USERNAME,
                        email: ADMIN_EMAIL,
                        phone: '',
                        age: 0,
                        passwordHash,
                        role: 'admin'
                    })
                    info('Admin seeded (create)')
                } else {
                    admin.username = ADMIN_USERNAME
                    admin.email = ADMIN_EMAIL
                    admin.passwordHash = passwordHash
                    admin.role = 'admin'
                    await admin.save()
                    info('Admin seeded (update)')
                }
            } else {
                warn('MongoDB not connected; admin will not be seeded to memory')
            }
        }
    } catch {}
    const webUrl = `http://localhost:${PORT}/`

    function getLocalIp() {
        try {
            const ifs = os.networkInterfaces()
            for (const k of Object.keys(ifs)) {
                for (const v of ifs[k] || []) {
                    if (v.family === 'IPv4' && !v.internal) return v.address
                }
            }
        } catch {}
        return null
    }
    const ip = getLocalIp()
    info(`Web available at ${webUrl}`)
    if (ip) {
        info(`LAN address: http://${ip}:${PORT}/`)
    }
    try {
        exec(`start "" ${webUrl}`)
    } catch {}
    // Root & health endpoints
    app.get('/', (req, res) => {
        res.setHeader('Cache-Control', 'no-store')
        res.json({
            ok: true,
            name: 'PartTimeU API',
            message: 'Welcome',
            docs: ['POST /api/auth/register', 'POST /api/auth/login', 'POST /api/log', 'GET /health']
        })
    })
    app.get('/health', (req, res) => {
        const dbReady = mongoose.connection.readyState === 1
        res.json({
            ok: true,
            db: dbReady ? 'connected' : 'memory',
            port: PORT
        })
    })
    app.get('/api/debug/users-count', async (req, res) => {
        try {
            if (mongoose.connection.readyState !== 1) return res.json({
                ok: true,
                mode: 'memory',
                count: memory.users.length
            })
            const count = await User.countDocuments()
            return res.json({
                ok: true,
                mode: 'mongo',
                count
            })
        } catch (e) {
            return res.status(500).json({
                ok: false,
                error: 'failed'
            })
        }
    })
    app.get('/api/debug/users', async (req, res) => {
        try {
            if (mongoose.connection.readyState !== 1) return res.json({
                ok: true,
                mode: 'memory',
                users: memory.users.map(u => ({
                    id: u.id,
                    username: u.username,
                    email: u.email,
                    role: u.role
                }))
            })
            const list = await User.find({}, {
                username: 1,
                email: 1,
                role: 1
            }).limit(50).lean()
            return res.json({
                ok: true,
                mode: 'mongo',
                users: list
            })
        } catch (e) {
            return res.status(500).json({
                ok: false,
                error: 'failed'
            })
        }
    })
    // 404 handler
    app.use((req, res) => {
        warn(`Route not found ${req.method} ${req.url}`)
        res.status(404).json({
            error: 'Not found'
        })
    })
    app.listen(PORT, HOST, () => info(`API listening on http://${HOST}:${PORT}`))
}

start()
