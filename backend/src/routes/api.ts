import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { register, login, googleLogin, sendOTP, verifyOTP, forgotPassword, verifyEmail } from '../controllers/auth.controller';
import { getProfile, updateProfile, uploadDocument, getDocuments, deleteDocument } from '../controllers/profile.controller';
import { calculateTax, saveComputation, getComputations, getComputationById, deleteComputation, updateComputation } from '../controllers/tax.controller';
import { exportPDF } from '../controllers/report.controller';
import { askAssistant } from '../controllers/ai.controller';
import { 
  getUsers, 
  toggleSuspendUser, 
  getAnalytics, 
  updateTaxSlabs, 
  getTaxSlabs,
  createBlog,
  getBlogs,
  deleteBlog,
  createFAQ,
  getFAQs,
  deleteFAQ,
  getVisitorCount,
  incrementVisitorCount
} from '../controllers/admin.controller';
import { authenticateJWT, requireAdmin } from '../middleware/auth';

const router = Router();

// Configure Multer for File Uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// ==========================================
// 1. PUBLIC AUTH ROUTES
// ==========================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google-login', googleLogin);
router.post('/auth/verify-email', verifyEmail);
router.post('/auth/send-otp', sendOTP);
router.post('/auth/verify-otp', verifyOTP);
router.post('/auth/forgot-password', forgotPassword);

// ==========================================
// 2. USER PROFILE & DOCUMENT ROUTES (Protected)
// ==========================================
router.get('/profile', authenticateJWT, getProfile);
router.put('/profile', authenticateJWT, updateProfile);
router.post('/documents/upload', authenticateJWT, upload.single('file'), uploadDocument);
router.get('/documents', authenticateJWT, getDocuments);
router.delete('/documents/:id', authenticateJWT, deleteDocument);

// ==========================================
// 3. TAX COMPUTATION ROUTES (Protected)
// ==========================================
router.post('/tax/calculate-adhoc', calculateTax); // Publicly-usable ad-hoc calculator
router.post('/tax/calculate', authenticateJWT, calculateTax);
router.post('/tax/computation', authenticateJWT, saveComputation);
router.put('/tax/computation/:id', authenticateJWT, updateComputation);
router.get('/tax/computation', authenticateJWT, getComputations);
router.get('/tax/computation/:id', authenticateJWT, getComputationById);
router.delete('/tax/computation/:id', authenticateJWT, deleteComputation);

// ==========================================
// 4. REPORT EXPORT ROUTES (Protected)
// ==========================================
router.get('/reports/:id/pdf', authenticateJWT, exportPDF);

// ==========================================
// 5. AI ASSISTANT ROUTES (Protected)
// ==========================================
router.post('/ai/chat', authenticateJWT, askAssistant);

// ==========================================
// 6. ADMIN SYSTEM MANAGEMENT (Admin Only)
// ==========================================
router.get('/admin/users', authenticateJWT, requireAdmin, getUsers);
router.put('/admin/users/:id/suspend', authenticateJWT, requireAdmin, toggleSuspendUser);
router.get('/admin/analytics', authenticateJWT, requireAdmin, getAnalytics);
router.post('/admin/slabs', authenticateJWT, requireAdmin, updateTaxSlabs);
router.get('/admin/slabs', authenticateJWT, getTaxSlabs); // accessible to verify configurations

// ==========================================
// 7. CMS CONTENT MANAGEMENT (Admin Write, Public Read)
// ==========================================
router.post('/cms/blogs', authenticateJWT, requireAdmin, createBlog);
router.get('/cms/blogs', getBlogs);
router.delete('/cms/blogs/:id', authenticateJWT, requireAdmin, deleteBlog);

router.post('/cms/faqs', authenticateJWT, requireAdmin, createFAQ);
router.get('/cms/faqs', getFAQs);
router.delete('/cms/faqs/:id', authenticateJWT, requireAdmin, deleteFAQ);

// Visitor Counter
router.get('/cms/visitor-count', getVisitorCount);
router.post('/cms/visitor-count/increment', incrementVisitorCount);

export default router;
