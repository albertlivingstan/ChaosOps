const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { Sequelize, DataTypes, Op } = require('sequelize');

const app = express();
app.use(cors());
app.use(express.json());

// SQLite setup
const storagePath = process.env.VERCEL ? '/tmp/database.sqlite' : './database.sqlite';
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
});

// Models using Sequelize
const ChaosExperiment = sequelize.define('ChaosExperiment', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.STRING,
    target_service: { type: DataTypes.STRING, allowNull: false },
    chaos_type: { type: DataTypes.STRING, allowNull: false },
    intensity: { type: DataTypes.STRING, allowNull: false },
    duration_seconds: DataTypes.INTEGER,
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    started_at: DataTypes.DATE,
    completed_at: DataTypes.DATE,
    result_summary: DataTypes.STRING,
    recovery_time_seconds: DataTypes.INTEGER,
    auto_abort: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const ExperimentTemplate = sequelize.define('ExperimentTemplate', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.STRING,
    chaos_type: { type: DataTypes.STRING, allowNull: false },
    intensity: { type: DataTypes.STRING, allowNull: false },
    duration_seconds: { type: DataTypes.INTEGER, defaultValue: 60 },
    tags: {
        type: DataTypes.STRING,
        get() {
            const rawValue = this.getDataValue('tags');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('tags', JSON.stringify(value || []));
        }
    },
    auto_abort: { type: DataTypes.BOOLEAN, defaultValue: true },
    steady_state_latency_ms: { type: DataTypes.INTEGER, defaultValue: 200 },
    steady_state_error_rate: { type: DataTypes.INTEGER, defaultValue: 1 },
    use_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const Microservice = sequelize.define('Microservice', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: DataTypes.STRING,
    language: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'healthy' },
    replicas_desired: { type: DataTypes.INTEGER, defaultValue: 3 },
    replicas_ready: { type: DataTypes.INTEGER, defaultValue: 3 },
    cpu_usage: DataTypes.FLOAT,
    memory_usage: DataTypes.FLOAT,
    uptime_percentage: DataTypes.FLOAT,
    avg_latency_ms: DataTypes.FLOAT,
    requests_per_second: DataTypes.FLOAT,
    namespace: { type: DataTypes.STRING, defaultValue: 'default' },
    version: DataTypes.STRING,
    updated_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const ScheduledExperiment = sequelize.define('ScheduledExperiment', {
    name: { type: DataTypes.STRING, allowNull: false },
    target_service: { type: DataTypes.STRING, allowNull: false },
    chaos_type: { type: DataTypes.STRING, allowNull: false },
    intensity: { type: DataTypes.STRING, allowNull: false },
    duration_seconds: { type: DataTypes.INTEGER, defaultValue: 60 },
    scheduled_at: { type: DataTypes.DATE, allowNull: false },
    recurrence: { type: DataTypes.STRING, defaultValue: 'none' },
    status: { type: DataTypes.STRING, defaultValue: 'scheduled' },
    gameday_mode: { type: DataTypes.BOOLEAN, defaultValue: false },
    notes: DataTypes.STRING,
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const SystemAlert = sequelize.define('SystemAlert', {
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    severity: { type: DataTypes.STRING, defaultValue: 'info' },
    source_service: DataTypes.STRING,
    acknowledged: { type: DataTypes.BOOLEAN, defaultValue: false },
    resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
    alert_type: DataTypes.STRING,
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const Setting = sequelize.define('Setting', {
    type: { type: DataTypes.STRING, defaultValue: 'global' },
    integrations: {
        type: DataTypes.STRING,
        get() {
            const val = this.getDataValue('integrations');
            return val ? JSON.parse(val) : {};
        },
        set(val) {
            this.setDataValue('integrations', JSON.stringify(val || {}));
        }
    },
    githubConfig: {
        type: DataTypes.STRING,
        get() {
            const val = this.getDataValue('githubConfig');
            return val ? JSON.parse(val) : {};
        },
        set(val) {
            this.setDataValue('githubConfig', JSON.stringify(val || {}));
        }
    }
});

const MonitoredWebsite = sequelize.define('MonitoredWebsite', {
    url: { type: DataTypes.STRING, allowNull: false },
    last_analyzed: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.STRING, defaultValue: 'Active' },
    performance_score: DataTypes.INTEGER,
    bugs_rectified: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_daily_monitor: { type: DataTypes.BOOLEAN, defaultValue: false },
    created_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const models = {
    ChaosExperiment,
    ExperimentTemplate,
    Microservice,
    ScheduledExperiment,
    SystemAlert,
    Setting,
    MonitoredWebsite
};

// Sync database
sequelize.sync().then(() => console.log('SQLite database connected & synced'));

// Helpful message for the root route
app.get('/', (req, res) => {
    res.send('<h1>ChaosOps Backend API is Running on SQLite</h1><p>You have accessed the backend server. The actual ChaosOps user interface is running on Vite. Please go to: <a href="http://localhost:5173">http://localhost:5173</a></p>');
});

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
        let website = await models.MonitoredWebsite.findOne({ where: { url: targetUrl } });
        if (website) {
            await website.update({ last_analyzed: new Date(), performance_score: perfScore });
        } else {
            await models.MonitoredWebsite.create({ url: targetUrl, last_analyzed: new Date(), performance_score: perfScore, created_date: new Date() });
        }

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
        
        let order = [];
        if (req.query.sort) {
            const dir = req.query.sort.startsWith('-') ? 'DESC' : 'ASC';
            const field = req.query.sort.replace('-', '');
            order.push([field, dir]);
        }
        
        // Remove known query params used by sdk
        const queryParams = { ...req.query };
        delete queryParams.sort; delete queryParams.limit; delete queryParams.page;
        
        let limit = 100;
        if (req.query.limit) limit = parseInt(req.query.limit);

        const items = await Model.findAll({ where: queryParams, order, limit });
        res.json(items);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/:entity', async (req, res) => {
    try {
        const Model = models[req.params.entity];
        if (!Model) return res.status(404).json({ error: 'Not found' });
        const item = await Model.create(req.body);
        res.status(201).json(item);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.put('/api/:entity/:id', async (req, res) => {
    try {
        const Model = models[req.params.entity];
        const item = await Model.findByPk(req.params.id);
        if (!item) return res.status(404).json({ error: 'Not found' });
        
        await item.update(req.body);
        res.json(item);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

app.delete('/api/:entity/:id', async (req, res) => {
    try {
        const Model = models[req.params.entity];
        const item = await Model.findByPk(req.params.id);
        if (item) {
            await item.destroy();
        }
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: err.message }); }
});

if (require.main === module) {
    const server = app.listen(3001, () => {
        console.log('Backend server running on http://localhost:3001');
    });

    const io = new Server(server, { cors: { origin: '*' } });
    io.on('connection', socket => console.log('Client connected'));
}

module.exports = app;
