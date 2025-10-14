import prisma from '../../../lib/db';
import { requireAuth } from '../../../../lib/auth';
import { OctoPrintClient, decryptApiKey } from '../../../../lib/octoprint-client';



async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Get printer
    const printer = await prisma.printer.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!printer) {
      return res.status(404).json({ error: 'Printer not found' });
    }

    // Decrypt API key
    const apiKey = decryptApiKey(printer.apiKey, process.env.JWT_SECRET);
    const client = new OctoPrintClient(printer.baseUrl, apiKey);

    // Get job status from OctoPrint
    const jobStatus = await client.getJobStatus();

    if (!jobStatus.success) {
      return res.status(500).json({ 
        error: 'Failed to get job status',
        details: jobStatus.error 
      });
    }

    // Update printer last seen
    await prisma.printer.update({
      where: { id },
      data: { lastSeen: new Date() }
    });

    return res.status(200).json({ 
      success: true,
      job: {
        state: jobStatus.state,
        progress: jobStatus.progress,
        file: jobStatus.file,
      }
    });
  } catch (error) {
    console.error('Get job status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);