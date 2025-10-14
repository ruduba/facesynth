//pages/api/printers/[id]/print.js

import prisma from '../../../lib/db';
import { requireAuth } from '../../../../lib/auth';
import { OctoPrintClient, decryptApiKey } from '../../../../lib/octoprint-client';
import fs from 'fs';
import path from 'path';



async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { meshId, options } = req.body;

    // Get printer
    const printer = await prisma.printer.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    // Get mesh
    const mesh = await prisma.mesh.findFirst({
      where: { 
        id: meshId,
        OR: [
          { userId: req.user.userId },
          { isPreset: true }
        ]
      }
    });

    if (!mesh) {
      return res.status(404).json({ error: 'Mesh not found' });
    }

    // Decrypt API key
    const apiKey = decryptApiKey(printer.apiKey, process.env.JWT_SECRET);
    const client = new OctoPrintClient(printer.baseUrl, apiKey);

    // Read mesh file
    const filePath = path.join(process.cwd(), 'uploads', mesh.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Mesh file not found' });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `${mesh.name.replace(/[^a-z0-9]/gi, '_')}.stl`;

    // Upload to OctoPrint
    const uploadResult = await client.uploadFile(fileBuffer, fileName);
    
    if (!uploadResult.success) {
      return res.status(500).json({ 
        error: 'Failed to upload to printer',
        details: uploadResult.error 
      });
    }

    // Start print
    const printResult = await client.startPrint(fileName);
    
    if (!printResult.success) {
      return res.status(500).json({ 
        error: 'Failed to start print',
        details: printResult.error 
      });
    }

    // Create print job record
    const printJob = await prisma.printJob.create({
      data: {
        userId: req.user.userId,
        meshId,
        printerId: id,
        status: 'printing',
        options: JSON.stringify(options || {}),
      }
    });

    // Update printer last seen
    await prisma.printer.update({
      where: { id },
      data: { lastSeen: new Date() }
    });

    return res.status(200).json({ 
      success: true,
      printJob: {
        id: printJob.id,
        status: printJob.status,
        startedAt: printJob.startedAt,
      }
    });
  } catch (error) {
    console.error('Print error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);