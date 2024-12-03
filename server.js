import express from 'express';
import cors from 'cors';
import axios from 'axios';
import compression from 'compression';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const DEBUG = process.env.NODE_ENV !== 'production';

if (DEBUG) {
  console.log('Server running in debug mode');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Port:', process.env.PORT);
}

const log = (message, data) => {
  if (DEBUG) {
    console.log(`[Server Debug] ${new Date().toISOString()} ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Basic middleware
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());

// Health check endpoint
app.get('/health', (req, res) => {
  log('Health check request from:', req.ip);
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Add request logging middleware
app.use((req, res, next) => {
  log('Incoming request:', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? 'Api-Key ***' : 'missing'
    },
    body: req.body
  });
  next();
});

// API routes go here
// YandexGPT completion endpoint
app.post('/api/yandex/v1/completion', async (req, res) => {
  try {
    log('Completion endpoint called');

    if (!req.headers.authorization) {
      log('Missing Authorization header');
      return res.status(400).json({
        error: {
          message: 'Missing Authorization header',
          type: 'validation_error'
        }
      });
    }

    if (!req.headers['x-folder-id']) {
      log('Missing x-folder-id header');
      return res.status(400).json({
        error: {
          message: 'Missing x-folder-id header',
          type: 'validation_error'
        }
      });
    }

    const url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
    
    log('Request body:', req.body);

    // Transform request body to match YandexGPT API format
    const transformedBody = {
      modelUri: req.body.modelUri,
      completionOptions: {
        stream: false,
        temperature: req.body.completionOptions?.temperature || req.body.temperature || 0.7,
        maxTokens: String(req.body.completionOptions?.maxTokens || req.body.maxTokens || 2000)
      },
      messages: req.body.messages
    };

    log('Making request to YandexGPT API:', {
      url,
      method: 'POST',
      headers: {
        'Authorization': 'Api-Key ***',
        'x-folder-id': req.headers['x-folder-id']
      },
      body: JSON.stringify(transformedBody, null, 2)
    });

    const response = await axios({
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'x-folder-id': req.headers['x-folder-id']
      },
      data: transformedBody,
      timeout: 60000,
      validateStatus: null
    });

    log('YandexGPT API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: JSON.stringify(response.data, null, 2)
    });

    if (response.status !== 200) {
      log('YandexGPT API Error Response:', response.data);
      return res.status(response.status).json({
        error: {
          message: response.data.message || 'YandexGPT API error',
          type: 'api_error',
          details: response.data
        }
      });
    }

    if (!response.data || !response.data.result) {
      log('Invalid YandexGPT Response Format:', response.data);
      return res.status(500).json({
        error: {
          message: 'Invalid response format from YandexGPT API',
          type: 'api_error',
          details: response.data
        }
      });
    }

    // Return the raw YandexGPT response
    return res.json(response.data);
  } catch (error) {
    log('Completion endpoint error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });

    return res.status(500).json({
      error: {
        message: error.message || 'Failed to communicate with YandexGPT API',
        type: 'api_error',
        details: error.response?.data
      }
    });
  }
});

// YandexART image generation endpoint
app.post('/api/yandex/v1/images/generations', async (req, res) => {
  try {
    log('Incoming YandexART request', {
      method: req.method,
      path: req.path,
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '***' : undefined
      },
      body: req.body
    });

    const apiKey = req.headers.authorization?.replace('Api-Key ', '');
    const folderId = req.headers['x-folder-id'];

    if (!apiKey || !folderId) {
      log('Missing credentials', { hasApiKey: !!apiKey, hasFolderId: !!folderId });
      return res.status(400).json({ error: { message: 'API key and Folder ID are required' } });
    }

    log('Making request to YandexART API', {
      url: 'https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': '***',
        'x-folder-id': folderId
      },
      body: req.body
    });

    const response = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/imageGenerationAsync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${apiKey}`,
        'x-folder-id': folderId
      },
      body: JSON.stringify(req.body)
    });

    log('YandexART API initial response status:', response.status);

    const data = await response.json();
    log('YandexART API initial response data:', data);

    if (!response.ok) {
      log('YandexART API error response:', data);
      return res.status(response.status).json(data);
    }

    // Wait for the operation to complete
    const operationId = data.id;
    if (!operationId) {
      log('Missing operation ID in response:', data);
      return res.status(500).json({ error: { message: 'Invalid response: missing operation ID' } });
    }

    log('Starting operation polling', { operationId });

    let operationResult;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout
    
    while (attempts < maxAttempts) {
      log(`Checking operation status (attempt ${attempts + 1}/${maxAttempts})`, { operationId });
      
      const operationResponse = await fetch(`https://llm.api.cloud.yandex.net/operations/${operationId}`, {
        headers: {
          'Authorization': `Api-Key ${apiKey}`,
          'x-folder-id': folderId
        }
      });

      if (!operationResponse.ok) {
        log('Operation status check failed:', {
          status: operationResponse.status,
          operationId
        });
        continue;
      }

      operationResult = await operationResponse.json();
      log('Operation status check result:', operationResult);

      if (operationResult.done) {
        log('Operation completed', { operationId, success: !operationResult.error });
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before next check
      attempts++;
    }

    if (!operationResult?.done) {
      log('Operation timed out:', { operationId, attempts, operationResult });
      return res.status(408).json({ error: { message: 'Operation timed out' } });
    }

    if (operationResult.error) {
      log('Operation failed:', { operationId, error: operationResult.error });
      return res.status(400).json({ error: operationResult.error });
    }

    log('Operation completed successfully', {
      operationId,
      hasImage: !!operationResult.response?.image
    });
    
    res.json(operationResult);
  } catch (error) {
    log('Server error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: { message: error.message || 'Internal server error' } });
  }
});

// Test endpoint for YandexGPT API
app.post('/api/yandex/v1/test', async (req, res) => {
  try {
    log('Test endpoint called');

    if (!req.headers.authorization) {
      log('Missing Authorization header');
      return res.status(400).json({
        error: {
          message: 'Missing Authorization header',
          type: 'validation_error'
        }
      });
    }

    if (!req.headers['x-folder-id']) {
      log('Missing x-folder-id header');
      return res.status(400).json({
        error: {
          message: 'Missing x-folder-id header',
          type: 'validation_error'
        }
      });
    }

    const url = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';
    const testBody = {
      modelUri: `gpt://${req.headers['x-folder-id']}/yandexgpt/rc`,
      completionOptions: {
        stream: false,
        temperature: 0.7,
        maxTokens: "100"
      },
      messages: [
        {
          role: "user",
          text: "Say 'Hello, World!'"
        }
      ]
    };

    log('Making test request to Yandex API:', {
      url,
      method: 'POST',
      headers: {
        'Authorization': 'Api-Key ***',
        'x-folder-id': req.headers['x-folder-id']
      },
      body: testBody
    });

    const response = await axios({
      method: 'POST',
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'x-folder-id': req.headers['x-folder-id']
      },
      data: testBody,
      timeout: 30000,
      validateStatus: null
    });

    log('YandexGPT API Test Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });

    return res.json(response.data);
  } catch (error) {
    log('Test endpoint error:', {
      name: error.name,
      message: error.message,
      code: error.code,
      response: error.response?.data,
      stack: error.stack
    });

    return res.status(500).json({
      error: {
        message: error.message || 'Failed to test YandexGPT API',
        type: 'api_error',
        details: error.response?.data
      }
    });
  }
});

// Serve static files from the dist directory with proper MIME types
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1y',
  etag: true,
  index: false // Disable directory indexing
}));

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Log the request for debugging
  log('Serving index.html for path:', req.path);
  
  res.sendFile(join(__dirname, 'dist', 'index.html'), err => {
    if (err) {
      log('Error serving index.html:', err);
      next(err);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  log('Error:', err);
  res.status(500).json({
    error: {
      message: DEBUG ? err.message : 'Internal Server Error',
      ...(DEBUG && { stack: err.stack })
    }
  });
});

const port = process.env.PORT || 5000;
const host = '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
  log('Server configuration:', {
    nodeEnv: process.env.NODE_ENV,
    port: port,
    host: host,
    debug: DEBUG,
    staticPath: join(__dirname, 'dist')
  });
});