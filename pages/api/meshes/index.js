import prisma from '../../../lib/db';

import { requireAuth } from '../../../lib/auth';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';



export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const { page = '1', limit = '20', folder, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      userId: req.user.userId,
      isPreset: false,
    };

    if (folder) {
      where.folderId = folder;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [meshes, total] = await Promise.all([
      prisma.mesh.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          thumbnailPath: true,
          createdAt: true,
          updatedAt: true,
          folderId: true,
        }
      }),
      prisma.mesh.count({ where })
    ]);

    return res.status(200).json({
      meshes,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get meshes error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req, res) {
  try {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'uploads'),
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const thumbnail = Array.isArray(files.thumbnail) ? files.thumbnail[0] : files.thumbnail;
    
    const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
    const jsonMetadata = Array.isArray(fields.jsonMetadata) ? fields.jsonMetadata[0] : fields.jsonMetadata;
    const baselinePositions = Array.isArray(fields.baselinePositions) ? fields.baselinePositions[0] : fields.baselinePositions;
    const folderId = Array.isArray(fields.folderId) ? fields.folderId[0] : fields.folderId;

    if (!file || !name) {
      return res.status(400).json({ error: 'File and name are required' });
    }

    // Store file paths (relative to uploads directory)
    const filePath = path.relative(path.join(process.cwd(), 'uploads'), file.filepath);
    const thumbnailPath = thumbnail ? path.relative(path.join(process.cwd(), 'uploads'), thumbnail.filepath) : null;

    const mesh = await prisma.mesh.create({
      data: {
        userId: req.user.userId,
        name,
        description: description || null,
        filePath,
        thumbnailPath,
        jsonMetadata: jsonMetadata || '{}',
        baselinePositions: baselinePositions || null,
        folderId: folderId || null,
        isPreset: false,
      }
    });

    return res.status(201).json({ success: true, mesh });
  } catch (error) {
    console.error('Create mesh error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default requireAuth(handler);