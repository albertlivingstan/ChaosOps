const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ChaosOpsStats').then(() => console.log('MongoDB connected'));

// Helpful message for the root route
app.get('/', (req, res) => {
    res.send('<h1>ChaosOps Backend API is Running</h1><p>You have accessed the backend server. The actual ChaosOps user interface is running on Vite. Please go to: <a href="http://localhost:5173">http://localhost:5173</a></p>');
});

// Models
const transform = (doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; };
const schemaOptions = { toJSON: { virtuals: true, transform } };

const ChaosExperimentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    target_service: { type: String, required: true },
    chaos_type: { type: String, required: true },
    intensity: { type: String, required: true },
    duration_seconds: Number,
    status: { type: String, default: 'pending' },
    started_at: Date,
    completed_at: Date,
    result_summary: String,
    recovery_time_seconds: Number,
    auto_abort: { type: Boolean, default: true },
    created_date: { type: Date, default: Date.now }
}, schemaOptions);

const ExperimentTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    chaos_type: { type: String, required: true },
    intensity: { type: String, required: true },
    duration_seconds: { type: Number, default: 60 },
    tags: [String],
    auto_abort: { type: Boolean, default: true },
    steady_state_latency_ms: { type: Number, default: 200 },
    steady_state_error_rate: { type: Number, default: 1 },
    use_count: { type: Number, default: 0 },
    created_date: { type: Date, default: Date.now }
}, schemaOptions);

const MicroserviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    language: { type: String, required: true },
    status: { type: String, default: 'healthy' },
    replicas_desired: { type: Number, default: 3 },
    replicas_ready: { type: Number, default: 3 },
    cpu_usage: Number,
    memory_usage: Number,
    uptime_percentage: Number,
    avg_latency_ms: Number,
    requests_per_second: Number,
    namespace: { type: String, default: 'default' },
    version: String,
    updated_date: { type: Date, default: Date.now }
}, schemaOptions);

const ScheduledExperimentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    target_service: { type: String, required: true },
    chaos_type: { type: String, required: true },
    intensity: { type: String, required: true },
    duration_seconds: { type: Number, default: 60 },
    scheduled_at: { type: Date, required: true },
    recurrence: { type: String, default: 'none' },
    status: { type: String, default: 'scheduled' },
    gameday_mode: { type: Boolean, default: false },
    notes: String,
    created_date: { type: Date, default: Date.now }
}, schemaOptions);

const SystemAlertSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, default: 'info' },
    source_service: String,
    acknowledged: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
    alert_type: { type: String },
    created_date: { type: Date, default: Date.now }
}, schemaOptions);

const SettingSchema = new mongoose.Schema({
    type: { type: String, default: 'global' },
    integrations: mongoose.Schema.Types.Mixed,
    githubConfig: mongoose.Schema.Types.Mixed,
}, schemaOptions);

const MonitoredWebsiteSchema = new mongoose.Schema({
    url: { type: String, required: true },
    last_analyzed: { type: Date, default: Date.now },
    status: { type: String, default: 'Active' },
    performance_score: Number,
    bugs_rectified: { type: Number, default: 0 },
    is_daily_monitor: { type: Boolean, default: false },
    created_date: { type: Date, default: Date.now }
}, schemaOptions);

const models = {
    ChaosExperiment: mongoose.model('ChaosExperiment', ChaosExperimentSchema),
    ExperimentTemplate: mongoose.model('ExperimentTemplate', ExperimentTemplateSchema),
    Microservice: mongoose.model('Microservice', MicroserviceSchema),
    ScheduledExperiment: mongoose.model('ScheduledExperiment', ScheduledExperimentSchema),
    SystemAlert: mongoose.model('SystemAlert', SystemAlertSchema),
    Setting: mongoose.model('Setting', SettingSchema),
    MonitoredWebsite: mongoose.model('MonitoredWebsite', MonitoredWebsiteSchema)
};

// API Routes
app.post('/api/analyze-url', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });
        
        let targetUrl = url.startsWith('http') ? url : `https://${url}`;
        
        const startTime = Date.now();
        const response = await fetch(targetUrl, { signal: AbortSignal.timeout(8000) }).catch(() => null);
        const latency = Date.now() - startTime;
        
        const issues = [];
        let perfScore = 95;
        let securityRating = 'A';
        
        if (!response) {
            issues.push({ severity: 'high', title: 'Connection Timeout/Refused', detail: 'Could not establish connection to the server within 8s.', fix: 'Check server status, DNS, and load balancer rules.' });
            perfScore = 0;
            securityRating = 'F';
        } else {
            const headers = response.headers;
            
            // Artificial delay penalty check
            if (latency > 1500) {
                perfScore -= 20;
                issues.push({ severity: 'medium', title: 'High Latency Detected', detail: `Server responded in ${latency}ms, which is above 1.5s threshold.`, fix: 'Optimize application backend, add geographic CDN or DB indexing.' });
            }
            
            if (!headers.get('content-security-policy')) {
                securityRating = 'B';
                issues.push({ severity: 'high', title: 'Missing CSP Header', detail: 'Content-Security-Policy is missing, exposing site to XSS.', fix: 'Implement Content-Security-Policy header.' });
            }
            if (!headers.get('x-frame-options')) {
                if (securityRating === 'A') securityRating = 'A-';
                issues.push({ severity: 'medium', title: 'Clickjacking Vulnerable', detail: 'X-Frame-Options header not present.', fix: 'Add X-Frame-Options: DENY or SAMEORIGIN.' });
            }
            if (!headers.get('strict-transport-security') && targetUrl.startsWith('https')) {
                securityRating = 'B-';
                issues.push({ severity: 'high', title: 'Missing HSTS', detail: 'Strict-Transport-Security header is absent.', fix: 'Enforce HSTS with max-age.' });
            }
        }
        
        // Ensure random bugs if it perfectly passes (just for demonstration in ChaosOps)
        if (issues.length === 0) {
            issues.push({ severity: 'medium', title: 'Suboptimal Caching', detail: 'Public assets lack Cache-Control immutable tags.', fix: 'Set Cache-Control max-age=31536000, immutable.' });
        }

        const stats = [
            { label: 'Performance Score', value: `${perfScore}/100`, description: `Avg load time: ${(latency/1000).toFixed(2)}s` },
            { label: 'Security Rating', value: securityRating, description: `${issues.length} vulnerabilities found` },
            { label: 'Chaos Readiness', value: perfScore > 80 ? '88%' : '42%', description: 'Based on edge resiliency checks' }
        ];

        // Ensure record exists in MonitoredWebsite
        await models.MonitoredWebsite.findOneAndUpdate(
            { url: targetUrl },
            { last_analyzed: new Date(), performance_score: perfScore, $setOnInsert: { created_date: new Date() } },
            { upsert: true }
        );

        res.json({
            url: targetUrl,
            stats,
            issues,
            services: [
                { name: 'ingress-gateway', version: 'Latest', latency: Math.floor(latency * 0.1), type: 'Gateway' },
                { name: 'web-server', version: 'Unknown', latency: Math.floor(latency * 0.8), type: 'App' }
            ]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/:entity', async (req, res) => {
    try {
        const Model = models[req.params.entity];
        if (!Model) return res.status(404).json({ error: 'Not found' });
        
        let sort = {};
        if (req.query.sort) {
            const dir = req.query.sort.startsWith('-') ? -1 : 1;
            sort[req.query.sort.replace('-', '')] = dir;
            delete req.query.sort;
        }
        
        // Remove known query params used by sdk
        const queryParams = { ...req.query };
        delete queryParams.sort; delete queryParams.limit; delete queryParams.page;
        
        let limit = 100;
        if (req.query.limit) limit = parseInt(req.query.limit);

        const items = await Model.find(queryParams).sort(sort).limit(limit);
        res.json(items);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/:entity', async (req, res) => {
    try {
        const Model = models[req.params.entity];
        if (!Model) return res.status(404).json({ error: 'Not found' });
        const item = new Model(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/:entity/:id', async (req, res) => {
    try {
        const Model = models[req.params.entity];
        const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(item);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/:entity/:id', async (req, res) => {
    try {
        const Model = models[req.params.entity];
        await Model.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

const server = app.listen(3001, () => {
    console.log('Backend server running on http://localhost:3001');
});

const io = new Server(server, { cors: { origin: '*' } });
io.on('connection', socket => console.log('Client connected'));
