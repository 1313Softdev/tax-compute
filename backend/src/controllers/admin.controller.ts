import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db';

// 1. GET ALL USERS (with profile completeness check)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        profile: {
          select: {
            fullName: true,
            panNumber: true,
            phone: true,
            employmentType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(users);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to retrieve users list' });
  }
};

// 2. TOGGLE USER SUSPENSION
export const toggleSuspendUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isSuspended } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot suspend administrator accounts' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isSuspended: !!isSuspended }
    });

    return res.json({
      message: `User account has been ${updatedUser.isSuspended ? 'suspended' : 'activated'} successfully`,
      user: { id: updatedUser.id, email: updatedUser.email, isSuspended: updatedUser.isSuspended }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to toggle suspension' });
  }
};

// 3. ANALYTICS & STATS
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalComputations = await prisma.taxComputation.count();
    const activeProfiles = await prisma.profile.count({ where: { completed: true } });

    // Aggregate total tax saved u/s 115BAC
    const comps = await prisma.taxComputation.findMany({
      select: { taxSaved: true }
    });
    const totalTaxSaved = comps.reduce((acc: number, curr: { taxSaved: number }) => acc + curr.taxSaved, 0);

    // Distribution by Assessment Year
    const ayDistribution = await prisma.taxComputation.groupBy({
      by: ['assessmentYear'],
      _count: {
        id: true
      }
    });

    const ayStats = ayDistribution.map((item: { assessmentYear: string; _count: { id: number } }) => ({
      year: item.assessmentYear,
      count: item._count.id
    }));

    return res.json({
      totalUsers,
      totalComputations,
      activeProfiles,
      totalTaxSaved,
      ayStats
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to compute analytics' });
  }
};

// 4. TAX SLAB OVERRIDES
export const updateTaxSlabs = async (req: Request, res: Response) => {
  const { assessmentYear, regime, configJson } = req.body;

  if (!assessmentYear || !regime || !configJson) {
    return res.status(400).json({ error: 'Assessment year, regime, and configuration JSON are required' });
  }

  try {
    const config = await prisma.taxSlabConfig.upsert({
      where: {
        assessmentYear_regime: { assessmentYear, regime }
      },
      update: { configJson },
      create: { assessmentYear, regime, configJson }
    });

    return res.json({
      message: `Tax slabs updated for ${assessmentYear} - ${regime} regime`,
      config
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to save slab configurations' });
  }
};

export const getTaxSlabs = async (req: Request, res: Response) => {
  try {
    const configs = await prisma.taxSlabConfig.findMany();
    return res.json(configs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch tax slab overrides' });
  }
};

// 5. CMS: BLOGS AND FAQS
export const createBlog = async (req: Request, res: Response) => {
  const { title, slug, content, published } = req.body;
  if (!title || !slug || !content) {
    return res.status(400).json({ error: 'Title, slug, and content are required' });
  }

  try {
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (existing) return res.status(400).json({ error: 'Slug must be unique' });

    const blog = await prisma.blog.create({
      data: { title, slug, content, published: published !== undefined ? published : true }
    });
    return res.status(201).json(blog);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create blog' });
  }
};

export const getBlogs = async (req: Request, res: Response) => {
  try {
    const list = await prisma.blog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    await prisma.blog.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Blog deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createFAQ = async (req: Request, res: Response) => {
  const { question, answer, category } = req.body;
  if (!question || !answer || !category) {
    return res.status(400).json({ error: 'Question, answer, and category are required' });
  }

  try {
    const faq = await prisma.fAQ.create({
      data: { question, answer, category }
    });
    return res.status(201).json(faq);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create FAQ' });
  }
};

export const getFAQs = async (req: Request, res: Response) => {
  try {
    const list = await prisma.fAQ.findMany({
      orderBy: { category: 'asc' }
    });
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteFAQ = async (req: Request, res: Response) => {
  try {
    await prisma.fAQ.delete({ where: { id: req.params.id } });
    return res.json({ message: 'FAQ deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getVisitorCount = async (req: Request, res: Response) => {
  try {
    let counter = await prisma.visitorCounter.findFirst();
    if (!counter) {
      counter = await prisma.visitorCounter.create({ data: { count: 0 } });
    }
    return res.json({ count: counter.count });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const incrementVisitorCount = async (req: Request, res: Response) => {
  try {
    let counter = await prisma.visitorCounter.findFirst();
    if (!counter) {
      counter = await prisma.visitorCounter.create({ data: { count: 1 } });
    } else {
      counter = await prisma.visitorCounter.update({
        where: { id: counter.id },
        data: { count: { increment: 1 } }
      });
    }
    return res.json({ count: counter.count });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const impersonateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod-12345';
  
  try {
    const userToImpersonate = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToImpersonate) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToImpersonate.role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot impersonate administrator accounts' });
    }

    const token = jwt.sign(
      { id: userToImpersonate.id, email: userToImpersonate.email, role: userToImpersonate.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: userToImpersonate.id,
        email: userToImpersonate.email,
        role: userToImpersonate.role
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Impersonation failed' });
  }
};
