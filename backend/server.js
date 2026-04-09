import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/stylesync';
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('Connected to local MongoDB');
  } catch (err) {
    console.log('Local MongoDB not found, starting in-memory MongoDB server...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log(`Connected to in-memory MongoDB at ${uri}`);
  }
};
await connectDB();


// Project Schema
const tokenSchema = new mongoose.Schema({
  colors: { type: mongoose.Schema.Types.Mixed, default: {} },
  typography: { type: mongoose.Schema.Types.Mixed, default: {} },
  spacing: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const projectSchema = new mongoose.Schema({
  url: { type: String, required: true },
  tokens: { type: tokenSchema, default: () => ({}) },
  history: [
    {
      timestamp: { type: Date, default: Date.now },
      tokens: { type: tokenSchema }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', projectSchema);

// Routes
// 1. Ingest/Extract (Mocking the extraction for now)
app.post('/api/projects/extract', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Mock extraction logic based on the user requirement "intelligent scraping"
    const mockTokens = {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        background: '#FFFFFF',
        text: '#1F2937'
      },
      typography: {
        headingFont: 'Inter, sans-serif',
        bodyFont: 'Roboto, sans-serif',
        baseSize: '16px'
      },
      spacing: {
        base: '8px',
        large: '16px'
      }
    };

    const newProject = new Project({
      url,
      tokens: mockTokens,
      history: [{ tokens: mockTokens }]
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Extraction error:", error);
    res.status(500).json({ error: 'Failed to extract tokens' });
  }
});

// 2. Get specific project
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Update project tokens (for "Lock & Version")
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { tokens } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Save previous state to history
    project.history.push({ tokens: project.tokens });
    
    // Update active tokens
    project.tokens = tokens;

    await project.save();
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
