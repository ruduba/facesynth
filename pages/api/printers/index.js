import prisma from '../../../lib/db';
import { requireAuth } from '../../../lib/auth';
import { OctoPrintClient, encryptApiKey } from '../../../lib/octoprint-client';



async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res) {
  try {
    const printers = await prisma.printer.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        baseUrl: true,
        enabled: true,
        lastSeen: true,
        createdAt: true,
      }
    });

    return res.status(200).json({ printers });
  } catch (error) {
    console.error('Get printers error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req, res) {
  try {
    const { name, baseUrl, apiKey } = req.body;

    if (!name || !baseUrl || !apiKey) {
      return res.status(400).json({ error: 'Name, baseUrl, and apiKey are required' });
    }

    // Test connection
    const client = new OctoPrintClient(baseUrl, apiKey);
    const testResult = await client.testConnection();

    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Failed to connect to OctoPrint',
        details: testResult.error 
      });
    }

    // Encrypt API key
    const encryptedKey = encryptApiKey(apiKey, process.env.JWT_SECRET);

    // Create printer record
    const printer = await prisma.printer.create({
      data: {
        userId: req.user.userId,
        name,
        baseUrl: baseUrl.replace(/\/$/, ''),
        apiKey: encryptedKey,
        lastSeen: new Date(),
        enabled: true,
      }
    });

    return res.status(201).json({ 
      success: true, 
      printer: {
        id: printer.id,
        name: printer.name,
        baseUrl: printer.baseUrl,
        enabled: printer.enabled,
      }
    });
  } catch (error) {
    console.error('Create printer error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);