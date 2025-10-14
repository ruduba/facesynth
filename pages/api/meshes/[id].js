//pages/api/meshes/[id].js
import { requireAuth } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';

import prisma from '../../../lib/db';


async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return handleGet(req, res, id);
  } else if (req.method === 'PUT') {
    return handlePut(req, res, id);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res, id);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res, id) {
  try {
    const mesh = await prisma.mesh.findFirst({
      where: {
        id,
        OR: [
          { userId: req.user.userId },
          { isPreset: true }
        ]
      },
      include: {
        folder: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!mesh) {
      return res.status(404).json({ error: 'Mesh not found' });
    }

    // Generate download URL
    const downloadUrl = `/api/meshes/${id}/download`;

    return res.status(200).json({
      mesh: {
        ...mesh,
        downloadUrl
      }
    });
  } catch (error) {
    console.error('Get mesh error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePut(req, res, id) {
  try {
    const { name, description, folderId, jsonMetadata } = req.body;

    // Verify ownership
    const existing = await prisma.mesh.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Mesh not found' });
    }

    const mesh = await prisma.mesh.update({
      where: { id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        folderId: folderId !== undefined ? folderId : existing.folderId,
        jsonMetadata: jsonMetadata || existing.jsonMetadata,
      }
    });

    return res.status(200).json({ success: true, mesh });
  } catch (error) {
    console.error('Update mesh error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(req, res, id) {
  try {
    // Verify ownership
    const mesh = await prisma.mesh.findFirst({
      where: { id, userId: req.user.userId }
    });

    if (!mesh) {
      return res.status(404).json({ error: 'Mesh not found' });
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'uploads', mesh.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete thumbnail
    if (mesh.thumbnailPath) {
      const thumbPath = path.join(process.cwd(), 'uploads', mesh.thumbnailPath);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    // Delete from database
    await prisma.mesh.delete({ where: { id } });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete mesh error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);