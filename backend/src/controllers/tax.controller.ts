import { Response } from 'express';
import prisma from '../db';
import { AuthenticatedRequest } from '../middleware/auth';
import { compareRegimes } from 'shared-engine';

// 1. CALCULATE TAX (Ad-hoc calculation without saving)
export const calculateTax = async (req: AuthenticatedRequest, res: Response) => {
  const inputs = req.body;

  if (!inputs.assessmentYear || !inputs.dateOfBirth) {
    return res.status(400).json({ error: 'Assessment year and date of birth are required' });
  }

  try {
    const comparison = compareRegimes(inputs);
    return res.json(comparison);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Tax calculation failed' });
  }
};

// 2. SAVE TAX COMPUTATION
export const saveComputation = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const inputs = req.body;

  if (!inputs.assessmentYear || !inputs.dateOfBirth) {
    return res.status(400).json({ error: 'Assessment year and date of birth are required' });
  }

  try {
    // Check if a computation already exists for this user and assessment year
    const existingComp = await prisma.taxComputation.findFirst({
      where: {
        userId,
        assessmentYear: inputs.assessmentYear
      }
    });

    if (existingComp) {
      return res.status(400).json({ 
        error: `A tax computation has already been generated for Assessment Year ${inputs.assessmentYear}. Please edit or delete the existing computation.` 
      });
    }

    const outputs = compareRegimes(inputs);
    
    const recommendedRegime = outputs.recommendedRegime;
    const taxSaved = outputs.taxSaved;
    
    // Total payable is from the recommended regime
    const totalTaxPayable = recommendedRegime === 'New' 
      ? outputs.newRegime.totalTaxLiability 
      : outputs.oldRegime.totalTaxLiability;

    const savedComp = await prisma.taxComputation.create({
      data: {
        userId,
        assessmentYear: inputs.assessmentYear,
        inputsJson: JSON.stringify(inputs),
        outputsJson: JSON.stringify(outputs),
        recommendedRegime,
        taxSaved,
        totalTaxPayable
      }
    });

    return res.status(201).json({
      message: 'Computation saved successfully',
      computation: {
        id: savedComp.id,
        assessmentYear: savedComp.assessmentYear,
        recommendedRegime: savedComp.recommendedRegime,
        taxSaved: savedComp.taxSaved,
        totalTaxPayable: savedComp.totalTaxPayable,
        createdAt: savedComp.createdAt,
        outputs
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to save computation' });
  }
};

// 3. GET SAVED COMPUTATIONS
export const getComputations = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const list = await prisma.taxComputation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        assessmentYear: true,
        recommendedRegime: true,
        taxSaved: true,
        totalTaxPayable: true,
        createdAt: true
      }
    });
    return res.json(list);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch computation list' });
  }
};

// 4. GET SAVED COMPUTATION DETAILS BY ID
export const getComputationById = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const compId = req.params.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const comp = await prisma.taxComputation.findUnique({
      where: { id: compId }
    });

    if (!comp || comp.userId !== userId) {
      return res.status(404).json({ error: 'Computation record not found' });
    }

    const inputs = JSON.parse(comp.inputsJson);
    const outputs = JSON.parse(comp.outputsJson);

    return res.json({
      id: comp.id,
      assessmentYear: comp.assessmentYear,
      recommendedRegime: comp.recommendedRegime,
      taxSaved: comp.taxSaved,
      totalTaxPayable: comp.totalTaxPayable,
      createdAt: comp.createdAt,
      inputs,
      outputs
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to retrieve computation details' });
  }
};

// 5. DELETE SAVED COMPUTATION
export const deleteComputation = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const compId = req.params.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const comp = await prisma.taxComputation.findUnique({
      where: { id: compId }
    });

    if (!comp || comp.userId !== userId) {
      return res.status(404).json({ error: 'Computation record not found' });
    }

    await prisma.taxComputation.delete({
      where: { id: compId }
    });

    return res.json({ message: 'Computation record deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete computation' });
  }
};

// 6. UPDATE SAVED COMPUTATION
export const updateComputation = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const compId = req.params.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const inputs = req.body;

  if (!inputs.assessmentYear || !inputs.dateOfBirth) {
    return res.status(400).json({ error: 'Assessment year and date of birth are required' });
  }

  try {
    const comp = await prisma.taxComputation.findUnique({
      where: { id: compId }
    });

    if (!comp || comp.userId !== userId) {
      return res.status(404).json({ error: 'Computation record not found' });
    }

    // Check if changing the year results in a conflict with an existing computation for that year
    const existingComp = await prisma.taxComputation.findFirst({
      where: {
        userId,
        assessmentYear: inputs.assessmentYear,
        NOT: { id: compId }
      }
    });

    if (existingComp) {
      return res.status(400).json({
        error: `A tax computation has already been generated for Assessment Year ${inputs.assessmentYear}.`
      });
    }

    const outputs = compareRegimes(inputs);
    const recommendedRegime = outputs.recommendedRegime;
    const taxSaved = outputs.taxSaved;
    
    // Total payable is from the recommended regime
    const totalTaxPayable = recommendedRegime === 'New' 
      ? outputs.newRegime.totalTaxLiability 
      : outputs.oldRegime.totalTaxLiability;

    const updatedComp = await prisma.taxComputation.update({
      where: { id: compId },
      data: {
        assessmentYear: inputs.assessmentYear,
        inputsJson: JSON.stringify(inputs),
        outputsJson: JSON.stringify(outputs),
        recommendedRegime,
        taxSaved,
        totalTaxPayable
      }
    });

    return res.json({
      message: 'Computation updated successfully',
      computation: {
        id: updatedComp.id,
        assessmentYear: updatedComp.assessmentYear,
        recommendedRegime: updatedComp.recommendedRegime,
        taxSaved: updatedComp.taxSaved,
        totalTaxPayable: updatedComp.totalTaxPayable,
        createdAt: updatedComp.createdAt,
        outputs
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update computation' });
  }
};

