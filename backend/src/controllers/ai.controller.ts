import { Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../db';
import { AuthenticatedRequest } from '../middleware/auth';

// RULE-BASED TAX ADVISOR FALLBACK
function getRuleBasedResponse(query: string, inputs: any, outputs: any): string {
  const q = query.toLowerCase();
  let advice = "";

  if (q.includes('80c') || q.includes('deduction') || q.includes('save tax')) {
    advice += "• **Section 80C Optimization**: You have claimed ₹" + (inputs?.deductions?.sec80C || 0) + " under 80C. The statutory limit is ₹1,50,000. ";
    if ((inputs?.deductions?.sec80C || 0) < 150000) {
      const diff = 150000 - (inputs?.deductions?.sec80C || 0);
      advice += `You can save more tax by investing an additional ₹${diff} in ELSS Mutual Funds, PPF, or National Savings Certificates (NSC).\n`;
    } else {
      advice += "Great job! You have fully exhausted the Section 80C tax-saving limit.\n";
    }
  }

  if (q.includes('medical') || q.includes('health') || q.includes('80d')) {
    advice += "• **Section 80D (Health Insurance)**: You have claimed ₹" + (inputs?.deductions?.sec80D || 0) + ". ";
    if ((inputs?.deductions?.sec80D || 0) === 0) {
      advice += "We recommend purchasing health insurance for yourself and your family to claim deductions up to ₹25,000 (₹50,000 if senior citizen). An additional ₹25,000/₹50,000 deduction is available for parents' health insurance.\n";
    } else {
      advice += "Section 80D deduction reduces tax liability while securing health cover.\n";
    }
  }

  if (q.includes('regime') || q.includes('old vs new') || q.includes('which is better')) {
    if (outputs) {
      advice += `• **Regime Comparison**: Our calculation engine suggests that the **${outputs.recommendedRegime.toUpperCase()} Tax Regime** is more beneficial for you. By adopting this regime, you save ₹${outputs.taxSaved} in taxes. Old Regime Tax: ₹${outputs.oldRegime.totalTaxLiability} vs New Regime Tax: ₹${outputs.newRegime.totalTaxLiability}.\n`;
    } else {
      advice += "• **Regime Select**: Generally, the New Tax Regime is beneficial if you do not have significant tax deductions (80C, 80D, HRA). If you have housing interest and high VI-A deductions, the Old Regime could save more. Complete the computation form to view a side-by-side comparison!\n";
    }
  }

  if (q.includes('hra') || q.includes('rent')) {
    advice += "• **House Rent Allowance (HRA)**: HRA exemption u/s 10(13A) is only allowed in the Old Tax Regime. It is calculated as the minimum of: Actual HRA received, Rent Paid minus 10% of salary, or 40%/50% of Basic Salary + DA.\n";
  }

  if (q.includes('nps') || q.includes('pension') || q.includes('80ccd')) {
    advice += "• **National Pension System (NPS)**: Under Section 80CCD(1B), you can invest up to ₹50,000 in NPS Tier-1 account to claim deductions over and above the ₹1,50,000 limit of Section 80C. This is available only in the Old Tax Regime.\n";
  }

  if (!advice) {
    advice = "I am your AI Tax Assistant. I can help you find tax-saving avenues, compare the Old vs New regime, and analyze your current filings. Try asking me:\n" +
             "1. 'How can I save more tax?'\n" +
             "2. 'Should I choose Old or New Regime?'\n" +
             "3. 'What are the benefits of Section 80C and 80D?'";
  }

  return `[System Notice: Showing offline tax advice because Gemini credentials are not active]\n\nBased on your profile, here are some tax planning recommendations:\n\n${advice}`;
}

export const askAssistant = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { query, computationId } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // 1. Fetch user computation context if ID provided, or use latest saved computation
    let comp = null;
    if (computationId) {
      comp = await prisma.taxComputation.findFirst({
        where: { id: computationId, userId }
      });
    } else {
      comp = await prisma.taxComputation.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    }

    let inputs: any = null;
    let outputs: any = null;
    if (comp) {
      inputs = JSON.parse(comp.inputsJson);
      outputs = JSON.parse(comp.outputsJson);
    }

    // 2. Check if GEMINI_API_KEY is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return helpful rule-based answers
      const response = getRuleBasedResponse(query, inputs, outputs);
      return res.json({ response });
    }

    // 3. Connect to Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prepare system instructions and context
    let contextStr = "You are a professional Indian Chartered Accountant (CA) Tax Assistant. Keep answers concise, accurate, and formatted using clean markdown list points.\n";
    if (inputs && outputs) {
      contextStr += `User Computation Context:\n` +
                    `- Assessment Year: ${comp?.assessmentYear}\n` +
                    `- Gross Salary: ₹${outputs.oldRegime.grossSalary}\n` +
                    `- Net Taxable Income (Old): ₹${outputs.oldRegime.netTaxableIncome}\n` +
                    `- Net Taxable Income (New): ₹${outputs.newRegime.netTaxableIncome}\n` +
                    `- Recommended Regime: ${comp?.recommendedRegime} (Savings: ₹${comp?.taxSaved})\n` +
                    `- Claims: 80C: ₹${inputs.deductions.sec80C}, 80D: ₹${inputs.deductions.sec80D}, NPS: ₹${inputs.deductions.sec80CCD_1B}\n`;
    } else {
      contextStr += "User has not entered any computation details yet. Invite them to input their details to get personalized recommendations.\n";
    }

    const prompt = `${contextStr}\nUser Query: ${query}\nAssistant Answer:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.json({ response: responseText });
  } catch (error: any) {
    // If Gemini fails, fallback to local rule engine
    console.error("Gemini API Error, falling back to local advisor:", error);
    try {
      let comp = null;
      if (computationId) {
        comp = await prisma.taxComputation.findFirst({ where: { id: computationId, userId } });
      } else {
        comp = await prisma.taxComputation.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
      }
      const inputs = comp ? JSON.parse(comp.inputsJson) : null;
      const outputs = comp ? JSON.parse(comp.outputsJson) : null;
      const response = getRuleBasedResponse(query, inputs, outputs);
      return res.json({ response });
    } catch (innerError) {
      return res.status(500).json({ error: 'Failed to process assistant query' });
    }
  }
};
