const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backendDir = path.join(__dirname, 'backend');
if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir);

const run = (cmd) => execSync(cmd, { cwd: backendDir, stdio: 'inherit' });

if (!fs.existsSync(path.join(backendDir, 'package.json'))) {
    run('npm init -y');
    run('npm install express mongoose cors dotenv socket.io');
}

const schemas = {
  ChaosExperiment: `{
    name: { type: String, required: true },
    description: String,
    target_service: { type: String, required: true },
    chaos_type: { type: String, required: true, enum: ['pod_kill', 'network_latency', 'cpu_stress', 'memory_stress', 'disk_fill', 'service_crash', 'network_loss'] },
    intensity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
    duration_seconds: Number,
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'aborted'], default: 'pending' },
    started_at: Date,
    completed_at: Date,
    result_summary: String,
    recovery_time_seconds: Number,
    auto_abort: { type: Boolean, default: true },
    created_date: { type: Date, default: Date.now }
  }`,
  ExperimentTemplate: `{
    name: { type: String, required: true },
    description: String,
    chaos_type: { type: String, required: true, enum: ['pod_kill', 'network_latency', 'cpu_stress', 'memory_stress', 'disk_fill', 'service_crash', 'network_loss'] },
    intensity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
    duration_seconds: { type: Number, default: 60 },
    tags: [String],
    auto_abort: { type: Boolean, default: true },
    steady_state_latency_ms: { type: Number, default: 200 },
    steady_state_error_rate: { type: Number, default: 1 },
    use_count: { type: Number, default: 0 },
    created_date: { type: Date, default: Date.now }
  }`,
  Microservice: `{
    name: { type: String, required: true },
    description: String,
    language: { type: String, required: true, enum: ['nodejs', 'python', 'java', 'go', 'rust', 'terraform'] },
    status: { type: String, enum: ['healthy', 'degraded', 'down', 'recovering'], default: 'healthy' },
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
  }`,
  ScheduledExperiment: `{
    name: { type: String, required: true },
    target_service: { type: String, required: true },
    chaos_type: { type: String, required: true, enum: ['pod_kill', 'network_latency', 'cpu_stress', 'memory_stress', 'disk_fill', 'service_crash', 'network_loss'] },
    intensity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
    duration_seconds: { type: Number, default: 60 },
    scheduled_at: { type: Date, required: true },
    recurrence: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
    status: { type: String, enum: ['scheduled', 'running', 'completed', 'cancelled'], default: 'scheduled' },
    gameday_mode: { type: Boolean, default: false },
    notes: String,
    created_date: { type: Date, default: Date.now }
  }`,
  SystemAlert: `{
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, required: true, enum: ['info', 'warning', 'critical'], default: 'info' },
    source_service: String,
    acknowledged: { type: Boolean, default: false },
    resolved: { type: Boolean, default: false },
    alert_type: { type: String, enum: ['health_check', 'performance', 'chaos_event', 'deployment', 'scaling'] },
    created_date: { type: Date, default: Date.now }
  }`,
  Setting: `{
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed
  }`
};

const modelsDir = path.join(backendDir, 'models');
if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir);

for (const [name, schema] of Object.entries(schemas)) {
    fs.writeFileSync(path.join(modelsDir, \`\${name}.js\`), \`const mongoose = require('mongoose');

const schema = new mongoose.Schema(\${schema});
schema.set('toJSON', { virtuals: true, transform: (doc, ret) => { ret.id = ret._id; delete ret._id; delete ret.__v; } });

module.exports = mongoose.model('\${name}', schema);
\`);
}

const serverCode = \`const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/ChaosOpsStats').then(() => console.log('MongoDB connected'));

const models = {
    Microservice: require('./models/Microservice'),
    ChaosExperiment: require('./models/ChaosExperiment'),
    SystemAlert: require('./models/SystemAlert'),
    ExperimentTemplate: require('./models/ExperimentTemplate'),
    ScheduledExperiment: require('./models/ScheduledExperiment'),
    Setting: require('./models/Setting'),
};

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
        
        let limit = 100;
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
            delete req.query.limit;
        }

        const items = await Model.find(req.query).sort(sort).limit(limit);
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/:entity', async (req, res) => {
    try {
        const Model = models[req.params.entity];
        const item = new Model(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/:entity/:id', async (req, res) => {
    try {
        const Model = models[req.params.entity];
        const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/:entity/:id', async (req, res) => {
    try {
        const Model = models[req.params.entity];
        await Model.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

const server = app.listen(3001, () => {
    console.log('Backend server running on http://localhost:3001');
});

const io = new Server(server, { cors: { origin: '*' } });
io.on('connection', socket => console.log('Client connected'));
\`;
fs.writeFileSync(path.join(backendDir, 'server.js'), serverCode);

console.log('Backend generated.');
