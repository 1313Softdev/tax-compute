import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../db';
import { AuthenticatedRequest } from '../middleware/auth';
import { maskPAN, maskAadhaar } from '../utils/masking';

// Verhoeff algorithm multiplication table
const verhoeffD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

// Verhoeff algorithm permutation table
const verhoeffP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

function validateVerhoeff(value: string): boolean {
  const cleaned = value.replace(/[-\s]/g, '');
  if (!/^\d+$/.test(cleaned)) {
    return false;
  }
  const digits = [...cleaned].reverse().map(d => parseInt(d, 10));
  const checksum = digits.reduce((prev, current, index) => {
    return verhoeffD[prev][verhoeffP[index % 8][current]];
  }, 0);
  return checksum === 0;
}

function validateAadhaar(aadhaar: string): boolean {
  const cleaned = aadhaar.replace(/[-\s]/g, '');
  if (!/^[2-9]\d{11}$/.test(cleaned)) {
    return false;
  }
  return validateVerhoeff(cleaned);
}

function validatePAN(pan: string): boolean {
  const cleaned = pan.trim().toUpperCase();
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned);
}

// 1. GET PROFILE
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let profile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile) {
      // Create a default empty profile
      profile = await prisma.profile.create({
        data: {
          userId,
          fullName: '',
          fatherName: '',
          dateOfBirth: '',
          gender: 'Other',
          panNumber: '',
          aadhaarNumber: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pinCode: '',
          bankName: '',
          accountNumber: '',
          ifscCode: '',
          branchName: '',
          employmentType: 'Salaried'
        }
      });
    }

    // Return real details so frontend can do toggled unmasking
    const maskedProfile = {
      ...profile,
      panNumber: profile.panNumber,
      aadhaarNumber: profile.aadhaarNumber,
      // Keep flags to let frontend know if they are filled
      hasPAN: !!profile.panNumber,
      hasAadhaar: !!profile.aadhaarNumber
    };

    return res.json(maskedProfile);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to retrieve profile' });
  }
};

// 2. UPDATE PROFILE
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const data = req.body;

  try {
    // If the input has masked values (e.g., "XXXXX1234X"), we do not overwrite the existing real values in the database.
    const existing = await prisma.profile.findUnique({ where: { userId } });
    
    let updatedData = { ...data };
    
    // Resolve PAN masking conflict
    if (data.panNumber && data.panNumber.includes('XX')) {
      if (existing) {
        updatedData.panNumber = existing.panNumber;
      } else {
        updatedData.panNumber = '';
      }
    }

    // Resolve Aadhaar masking conflict
    if (data.aadhaarNumber && data.aadhaarNumber.includes('XX')) {
      if (existing) {
        updatedData.aadhaarNumber = existing.aadhaarNumber;
      } else {
        updatedData.aadhaarNumber = '';
      }
    }

    // Validate PAN
    if (updatedData.panNumber) {
      if (!validatePAN(updatedData.panNumber)) {
        return res.status(400).json({ error: 'Invalid PAN number format' });
      }
    }

    // Validate Aadhaar
    if (updatedData.aadhaarNumber) {
      if (!validateAadhaar(updatedData.aadhaarNumber)) {
        return res.status(400).json({ error: 'Invalid Aadhaar number or checksum failed' });
      }
    }

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        ...updatedData,
        completed: true
      },
      create: {
        userId,
        ...updatedData,
        completed: true
      }
    });

    const maskedProfile = {
      ...profile,
      panNumber: profile.panNumber,
      aadhaarNumber: profile.aadhaarNumber,
      hasPAN: !!profile.panNumber,
      hasAadhaar: !!profile.aadhaarNumber
    };

    return res.json({
      message: 'Profile updated successfully',
      profile: maskedProfile
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};

// 3. UPLOAD DOCUMENT
export const uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const file = req.file;
  const { fileType } = req.body;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!fileType) {
    return res.status(400).json({ error: 'File type is required' });
  }

  try {
    const fileUrl = `/uploads/${file.filename}`;

    const doc = await prisma.document.create({
      data: {
        userId,
        fileName: file.originalname,
        fileType,
        fileUrl
      }
    });

    return res.status(201).json({
      message: 'Document uploaded successfully',
      document: doc
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to register document' });
  }
};

// 4. GET ALL DOCUMENTS
export const getDocuments = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const docs = await prisma.document.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' }
    });
    return res.json(docs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch documents' });
  }
};

// 5. DELETE DOCUMENT
export const deleteDocument = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const docId = req.params.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const doc = await prisma.document.findUnique({
      where: { id: docId }
    });

    if (!doc || doc.userId !== userId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Attempt to delete physical file
    const filePath = path.join(__dirname, '../../uploads', path.basename(doc.fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record from DB
    await prisma.document.delete({
      where: { id: docId }
    });

    return res.json({ message: 'Document deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete document' });
  }
};
