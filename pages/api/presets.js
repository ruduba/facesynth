import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../lib/auth';

const prisma = new PrismaClient();

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const presets = await prisma.mesh.findMany({
      where: { isPreset: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnailPath: true,
        jsonMetadata: true,
        createdAt: true,
      }
    });

    return res.status(200).json({ presets });
  } catch (error) {
    console.error('Get presets error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);