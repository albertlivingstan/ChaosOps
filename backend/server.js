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

const models = {
    ChaosExperiment: mongoose.model('ChaosExperiment', ChaosExperimentSchema),
    ExperimentTemplate: mongoose.model('ExperimentTemplate', ExperimentTemplateSchema),
    Microservice: mongoose.model('Microservice', MicroserviceSchema),
    ScheduledExperiment: mongoose.model('ScheduledExperiment', ScheduledExperimentSchema),
    SystemAlert: mongoose.model('SystemAlert', SystemAlertSchema),
    Setting: mongoose.model('Setting', SettingSchema)
};

// API Routes
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
