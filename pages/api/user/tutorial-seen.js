
import { requireAuth } from '../../../lib/auth';

import prisma from '../../../lib/db';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { tutorialSeen: true }
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tutorial update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);