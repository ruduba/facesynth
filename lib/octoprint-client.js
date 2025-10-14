//lib/octoprint-client.js


// Server-side OctoPrint client
const FormData = (await import('form-data')).default;

// Server-side OctoPrint client

export class OctoPrintClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  // Test connection
  async testConnection() {
    try {
      const response = await this.request('/api/version');
      return { success: true, version: response.server };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Upload file to OctoPrint
  async uploadFile(fileBuffer, filename) {
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fileBuffer, { filename });
    
    try {
      const response = await fetch(`${this.baseUrl}/api/files/local`, {
        method: 'POST',
        headers: {
          'X-Api-Key': this.apiKey,
          ...form.getHeaders()
        },
        body: form
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, file: data.files.local };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Start print job
  async startPrint(filename) {
    try {
      const response = await this.request('/api/files/local/' + filename, {
        method: 'POST',
        body: JSON.stringify({ command: 'select', print: true })
      });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get job status
  async getJobStatus() {
    try {
      const response = await this.request('/api/job');
      return {
        success: true,
        state: response.state,
        progress: response.progress,
        file: response.job.file
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get printer state
  async getPrinterState() {
    try {
      const response = await this.request('/api/printer');
      return {
        success: true,
        state: response.state,
        temperature: response.temperature
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cancel job
  async cancelJob() {
    try {
      await this.request('/api/job', {
        method: 'POST',
        body: JSON.stringify({ command: 'cancel' })
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Pause job
  async pauseJob() {
    try {
      await this.request('/api/job', {
        method: 'POST',
        body: JSON.stringify({ command: 'pause', action: 'pause' })
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Resume job
  async resumeJob() {
    try {
      await this.request('/api/job', {
        method: 'POST',
        body: JSON.stringify({ command: 'pause', action: 'resume' })
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generic request helper
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-Api-Key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`OctoPrint request failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Encrypt API key for storage
export function encryptApiKey(apiKey, secret) {
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt API key from storage
export function decryptApiKey(encryptedKey, secret) {
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(secret, 'salt', 32);
  
  const parts = encryptedKey.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}