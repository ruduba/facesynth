
import { requireAuth } from '../../../lib/auth';

import prisma from '../../../lib/db';


async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res) {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.userId },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { meshes: true }
        }
      }
    });

    return res.status(200).json({ folders });
  } catch (error) {
    console.error('Get folders error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const folder = await prisma.folder.create({
      data: {
        userId: req.user.userId,
        name
      }
    });

    return res.status(201).json({ success: true, folder });
  } catch (error) {
    console.error('Create folder error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Folder ID is required' });
    }

    // Verify ownership
    const folder = await prisma.folder.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Delete folder (meshes will have folderId set to null due to onDelete: SetNull)
    await prisma.folder.delete({ where: { id } });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete folder error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);