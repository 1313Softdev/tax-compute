import { Response } from 'express';
import PDFDocument from 'pdfkit';
import prisma from '../db';
import { AuthenticatedRequest } from '../middleware/auth';
import { maskPAN } from '../utils/masking';
import { getOldRegimeConfig, getNewRegimeConfig, calculateAge } from 'shared-engine';

// HELPER TO CONVERT RS TO INDIAN CURRENCY FORMAT (e.g. 1,00,000)
const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};

// HELPER TO CONVERT RS FOR PDF (no currency symbol to prevent font corruption in PDFKit)
const formatPDFCurrency = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(val);
};

// 1. GENERATE PDF
export const exportPDF = async (req: AuthenticatedRequest, res: Response) => {
  const formatCurrency = formatPDFCurrency;
  const compId = req.params.id;
  const userId = req.user?.id;
  const regime = (req.query.regime as string || 'both').toLowerCase();
  const isBoth = regime === 'both';

  try {
    const comp = await prisma.taxComputation.findUnique({
      where: { id: compId }
    });

    if (!comp || comp.userId !== userId) {
      return res.status(404).json({ error: 'Computation not found' });
    }

    const inputs = JSON.parse(comp.inputsJson);
    const outputs = JSON.parse(comp.outputsJson);
    
    // Fetch profile for header details
    const profile = await prisma.profile.findUnique({ where: { userId } });

    const filename = `tax_computation_${comp.assessmentYear}_${regime}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${filename}`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    if (!isBoth) {
      generateSingleRegimeComputation(doc, comp, inputs, outputs, regime, profile);
      doc.end();
      return;
    }

    // Styling helpers
    const primaryColor = '#1e3a8a'; // Premium Blue
    const secondaryColor = '#0284c7';
    const textColor = '#334155';
    const lightBg = '#f8fafc';
    const gridLineColor = '#e2e8f0';

    // HEADER
    const titleText = 'INCOME TAX COMPUTATION SHEET';
    doc.fillColor(primaryColor).fontSize(18).text(titleText, { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fillColor(textColor).fontSize(10).text(`Assessment Year: ${comp.assessmentYear} | Generated on: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown(1.5);

    // PERSONAL PROFILE BOX (Grid-like layout)
    doc.fillColor(primaryColor).fontSize(12).text('Taxpayer Details', { underline: true });
    doc.moveDown(0.2);
    
    const startY = doc.y;
    doc.rect(50, startY, 495, 80).fill(lightBg);
    doc.fillColor(textColor).fontSize(9);

    // Left Column
    doc.text(`Name: ${profile?.fullName || inputs.fullName || 'N/A'}`, 60, startY + 10);
    doc.text(`Father's Name: ${profile?.fatherName || 'N/A'}`, 60, startY + 25);
    doc.text(`PAN: ${maskPAN(profile?.panNumber || inputs.panNumber)}`, 60, startY + 40);
    doc.text(`DOB: ${profile?.dateOfBirth || inputs.dateOfBirth || 'N/A'}`, 60, startY + 55);

    // Right Column
    doc.text(`Employment Type: ${profile?.employmentType || 'Salaried'}`, 300, startY + 10);
    doc.text(`Residential Status: ${inputs.residentialStatus || 'Resident'}`, 300, startY + 25);
    doc.text(`City: ${profile?.city || 'N/A'}, State: ${profile?.state || 'N/A'}`, 300, startY + 40);
    doc.text(`Aadhaar: ${profile?.aadhaarNumber ? 'XXXXXXXX' + profile.aadhaarNumber.slice(-4) : 'N/A'}`, 300, startY + 55);

    doc.y = startY + 95;

    // TAX SUMMARY CARD
    doc.fillColor(primaryColor).fontSize(12).text('Tax Computation Summary', { underline: true });
    doc.moveDown(0.2);
    const summaryY = doc.y;
    doc.rect(50, summaryY, 495, 55).fill('#e0f2fe'); // Light Blue Accent
    doc.fillColor(primaryColor).fontSize(10).text('Recommended Regime:', 60, summaryY + 10);
    doc.fontSize(12).text(comp.recommendedRegime === 'New' ? 'NEW TAX REGIME (u/s 115BAC)' : 'OLD TAX REGIME', 180, summaryY + 8);
    
    doc.fontSize(10).text('Final Tax Payable:', 60, summaryY + 25);
    doc.fontSize(12).text(formatCurrency(comp.totalTaxPayable), 180, summaryY + 23);
    
    doc.fontSize(10).text('Regime Tax Savings:', 60, summaryY + 40);
    doc.fontSize(10).text(formatCurrency(comp.taxSaved), 180, summaryY + 39);

    doc.y = summaryY + 70;

    // DETAILED TAX TABLE
    doc.fillColor(primaryColor).fontSize(12).text('Itemized Income & Deductions Breakdown', { underline: true });
    doc.moveDown(0.4);

    const oldReg = outputs.oldRegime;
    const newReg = outputs.newRegime;

    // Table Header
    const particularsWidth = isBoth ? 230 : 340;
    const tableHeaderY = doc.y;
    doc.rect(50, tableHeaderY, 495, 20).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(9);
    doc.text('Income Head / Deductions', 55, tableHeaderY + 6, { width: particularsWidth });
    if (isBoth) {
      doc.text('Old Regime', 300, tableHeaderY + 6, { width: 110, align: 'right' });
      doc.text('New Regime', 420, tableHeaderY + 6, { width: 110, align: 'right' });
    } else {
      const colHeader = regime === 'old' ? 'Old Regime' : 'New Regime';
      doc.text(colHeader, 420, tableHeaderY + 6, { width: 110, align: 'right' });
    }

    let currentY = tableHeaderY + 20;

    const addRow = (label: string, oldVal: number, newVal: number, isTotal: boolean = false) => {
      // Check if we need to wrap pages
      if (currentY > 730) {
        doc.addPage();
        currentY = 50;
        // Reprint header
        doc.rect(50, currentY, 495, 20).fill(primaryColor);
        doc.fillColor('#ffffff').fontSize(9);
        doc.text('Income Head / Deductions (Continued)', 55, currentY + 6, { width: particularsWidth });
        if (isBoth) {
          doc.text('Old Regime', 300, currentY + 6, { width: 110, align: 'right' });
          doc.text('New Regime', 420, currentY + 6, { width: 110, align: 'right' });
        } else {
          const colHeader = regime === 'old' ? 'Old Regime' : 'New Regime';
          doc.text(colHeader, 420, currentY + 6, { width: 110, align: 'right' });
        }
        currentY += 20;
      }

      if (isTotal) {
        doc.rect(50, currentY, 495, 18).fill('#f1f5f9');
        doc.fillColor(primaryColor).fontSize(9);
      } else {
        doc.fillColor(textColor).fontSize(8.5);
      }

      doc.text(label, 55, currentY + 4, { width: particularsWidth });
      if (isBoth) {
        doc.text(formatCurrency(oldVal), 300, currentY + 4, { width: 110, align: 'right' });
        doc.text(formatCurrency(newVal), 420, currentY + 4, { width: 110, align: 'right' });
      } else {
        const activeVal = regime === 'old' ? oldVal : newVal;
        doc.text(formatCurrency(activeVal), 420, currentY + 4, { width: 110, align: 'right' });
      }

      // Draw thin bottom border
      doc.strokeColor(gridLineColor).lineWidth(0.5).moveTo(50, currentY + 18).lineTo(545, currentY + 18).stroke();
      currentY += 18;
    };

    addRow('1. Income from Salary (Gross)', oldReg.grossSalary, newReg.grossSalary);
    addRow('   Less: Exemptions (HRA, LTA, etc.)', oldReg.exemptionsApplied, newReg.exemptionsApplied);
    addRow('   Less: Professional Tax', oldReg.regime === 'Old' ? inputs.salary.professionalTax : 0, 0);
    addRow('   Less: Standard Deduction u/s 16(ia)', oldReg.standardDeductionApplied, newReg.standardDeductionApplied);
    addRow('Salary Income (Net)', oldReg.grossSalary - oldReg.exemptionsApplied - (oldReg.regime === 'Old' ? inputs.salary.professionalTax : 0) - oldReg.standardDeductionApplied, newReg.grossSalary - newReg.exemptionsApplied - newReg.standardDeductionApplied, true);

    addRow('2. Income from House Property', oldReg.grossHouseProperty, newReg.grossHouseProperty);
    addRow('3. Profits & Gains of Business / Profession', oldReg.grossBusiness + (oldReg.grossProfessional || 0), newReg.grossBusiness + (newReg.grossProfessional || 0));
    addRow('4. Capital Gains (Short + Long Term)', oldReg.grossCapitalGains, newReg.grossCapitalGains);
    addRow('5. Income from Other Sources (Interest, etc.)', oldReg.grossOtherSources, newReg.grossOtherSources);
    
    addRow('Gross Total Income (GTI)', oldReg.totalGrossIncome, newReg.totalGrossIncome, true);
    
    addRow('   Less: Chapter VI-A Deductions (80C, 80D, etc.)', oldReg.deductionsApplied, newReg.deductionsApplied);
    
    addRow('Net Taxable Income', oldReg.netTaxableIncome, newReg.netTaxableIncome, true);
    
    addRow('Basic Slab Tax + Special Income Tax', oldReg.taxBeforeRebate, newReg.taxBeforeRebate);
    addRow('   Less: Rebate u/s 87A', oldReg.rebate87A, newReg.rebate87A);
    addRow('Tax After Rebate', oldReg.taxAfterRebate, newReg.taxAfterRebate, true);
    
    addRow('   Add: Surcharge', oldReg.surcharge, newReg.surcharge);
    addRow('   Add: Health & Education Cess (4%)', oldReg.cess, newReg.cess);
    
    addRow('Total Tax Liability', oldReg.totalTaxLiability, newReg.totalTaxLiability, true);

    doc.end();
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'PDF Generation failed' });
  }
};



// Helper to draw a grid or box of taxpayer details
const drawMetadataGrid = (
  doc: PDFKit.PDFDocument,
  startX: number,
  startY: number,
  profile: any,
  inputs: any,
  regime: string
): number => {
  const rowHeight = 16;
  const fontSize = 8;
  const colWidths = [100, 147, 100, 148];

  const pan = profile?.panNumber || inputs.panNumber || 'N/A';
  const dob = profile?.dateOfBirth || inputs.dateOfBirth || 'N/A';
  const fatherName = profile?.fatherName || inputs.fatherName || 'N/A';
  const bankAc = profile?.accountNumber || inputs.business?.accountNumber || 'N/A';
  const ifsc = profile?.ifscCode || inputs.business?.ifscCode || 'N/A';
  const aadhaar = profile?.aadhaarNumber || inputs.aadhaarNumber || 'N/A';
  const status = 'Individual';
  const resStatus = inputs.residentialStatus || 'Resident';
  const gender = profile?.gender || inputs.gender || 'Male';
  const eFiling = 'Not E-Filed';
  const selectedRegimeText = regime === 'new' ? 'New Regime' : 'Old Regime';

  const rows = [
    [
      { label: 'PAN:', val: pan },
      { label: 'Status:', val: status }
    ],
    [
      { label: 'Date of Birth:', val: dob },
      { label: 'Residential Status:', val: resStatus }
    ],
    [
      { label: "Father's Name:", val: fatherName },
      { label: 'Gender:', val: gender }
    ],
    [
      { label: 'Bank A/C no.:', val: bankAc },
      { label: 'IFSC code:', val: ifsc }
    ],
    [
      { label: 'E-Filing Status:', val: eFiling },
      { label: 'Aadhaar Card Number:', val: aadhaar }
    ],
    [
      { label: 'Selected tax regime:', val: selectedRegimeText },
      { label: '', val: '' }
    ]
  ];

  let currentY = startY;
  rows.forEach(row => {
    let cx = startX;

    // Draw horizontal line for row top
    doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(startX, currentY).lineTo(startX + 495, currentY).stroke();

    // Col 1 label
    doc.font('Helvetica-Bold').fontSize(fontSize).fillColor('#000000');
    doc.text(row[0].label, cx + 4, currentY + 4, { width: colWidths[0] - 8, align: 'left' });
    cx += colWidths[0];

    // Col 1 val
    doc.font('Helvetica').fontSize(fontSize).fillColor('#333333');
    doc.text(row[0].val, cx + 4, currentY + 4, { width: colWidths[1] - 8, align: 'left' });
    cx += colWidths[1];

    // Col 2 label
    doc.font('Helvetica-Bold').fontSize(fontSize).fillColor('#000000');
    doc.text(row[1].label, cx + 4, currentY + 4, { width: colWidths[2] - 8, align: 'left' });
    cx += colWidths[2];

    // Col 2 val
    doc.font('Helvetica').fontSize(fontSize).fillColor('#333333');
    doc.text(row[1].val, cx + 4, currentY + 4, { width: colWidths[3] - 8, align: 'left' });

    currentY += rowHeight;
  });

  // Draw bottom horizontal line
  doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(startX, currentY).lineTo(startX + 495, currentY).stroke();

  // Draw vertical dividers
  doc.moveTo(startX, startY).lineTo(startX, currentY).stroke(); // left outer border
  doc.moveTo(startX + colWidths[0], startY).lineTo(startX + colWidths[0], currentY).stroke();
  doc.moveTo(startX + colWidths[0] + colWidths[1], startY).lineTo(startX + colWidths[0] + colWidths[1], currentY).stroke();
  doc.moveTo(startX + colWidths[0] + colWidths[1] + colWidths[2], startY).lineTo(startX + colWidths[0] + colWidths[1] + colWidths[2], currentY).stroke();
  doc.moveTo(startX + 495, startY).lineTo(startX + 495, currentY).stroke(); // right outer border

  doc.x = startX;
  return currentY;
};

// Generic table helper
const drawTable = (
  doc: PDFKit.PDFDocument,
  startX: number,
  startY: number,
  cols: { header: string; width: number; align?: 'left' | 'center' | 'right'; field: string }[],
  rows: any[],
  options?: {
    drawVerticalLines?: boolean;
    drawHorizontalLines?: boolean;
    headerBg?: boolean;
    rowHeight?: number;
    fontSize?: number;
  }
): number => {
  const rowHeight = options?.rowHeight || 16;
  const fontSize = options?.fontSize || 8;
  const drawVerticalLines = options?.drawVerticalLines !== false;
  const drawHorizontalLines = options?.drawHorizontalLines !== false;

  let currentY = startY;
  const totalWidth = cols.reduce((sum, c) => sum + c.width, 0);

  // Draw Header Line Top
  if (drawHorizontalLines) {
    doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(startX, currentY).lineTo(startX + totalWidth, currentY).stroke();
  }

  // Calculate dynamic header height
  doc.font('Helvetica-Bold').fontSize(fontSize);
  let maxHeaderHeight = rowHeight;
  cols.forEach(col => {
    const textHeight = doc.heightOfString(col.header, { width: col.width - 8 }) + 8; // 4px top + 4px bottom padding
    if (textHeight > maxHeaderHeight) {
      maxHeaderHeight = textHeight;
    }
  });

  // Draw Header Background if enabled
  if (options?.headerBg) {
    doc.rect(startX, currentY, totalWidth, maxHeaderHeight).fill('#f3f4f6');
  }

  // Write Headers
  doc.fillColor('#000000');
  let cx = startX;
  cols.forEach(col => {
    const textHeight = doc.heightOfString(col.header, { width: col.width - 8 });
    const paddingY = (maxHeaderHeight - textHeight) / 2;
    doc.text(col.header, cx + 4, currentY + paddingY, {
      width: col.width - 8,
      align: col.align || 'left'
    });
    cx += col.width;
  });

  currentY += maxHeaderHeight;

  // Draw Header Line Bottom
  if (drawHorizontalLines) {
    doc.strokeColor('#999999').lineWidth(0.75).moveTo(startX, currentY).lineTo(startX + totalWidth, currentY).stroke();
  }

  // Write Row Data
  rows.forEach(row => {
    if (row.isTotal) {
      doc.font('Helvetica-Bold');
      // Draw a line before total
      doc.strokeColor('#cccccc').lineWidth(0.5).moveTo(startX, currentY).lineTo(startX + totalWidth, currentY).stroke();
    } else if (row.isHeader) {
      doc.font('Helvetica-Bold');
    } else {
      doc.font('Helvetica');
    }

    doc.fillColor('#000000').fontSize(fontSize);

    // Calculate dynamic row height
    let maxRowHeight = rowHeight;
    cols.forEach(col => {
      const val = row[col.field] !== undefined ? String(row[col.field]) : '';
      const textHeight = doc.heightOfString(val, { width: col.width - 8 }) + 8; // 4px top/bottom padding
      if (textHeight > maxRowHeight) {
        maxRowHeight = textHeight;
      }
    });

    let rowCx = startX;
    cols.forEach(col => {
      const val = row[col.field] !== undefined ? String(row[col.field]) : '';
      const textHeight = doc.heightOfString(val, { width: col.width - 8 });
      const paddingY = (maxRowHeight - textHeight) / 2;
      doc.text(val, rowCx + 4, currentY + paddingY, {
        width: col.width - 8,
        align: col.align || 'left'
      });
      rowCx += col.width;
    });

    currentY += maxRowHeight;

    if (drawHorizontalLines && !row.isTotal) {
      doc.strokeColor('#eeeeee').lineWidth(0.5).moveTo(startX, currentY).lineTo(startX + totalWidth, currentY).stroke();
    }
  });

  // Draw Outer Borders / Vertical lines
  if (drawVerticalLines) {
    doc.strokeColor('#cccccc').lineWidth(0.5);
    // Left outer border
    doc.moveTo(startX, startY).lineTo(startX, currentY).stroke();
    // Right outer border
    doc.moveTo(startX + totalWidth, startY).lineTo(startX + totalWidth, currentY).stroke();
    // Column dividers
    let dividerX = startX;
    cols.slice(0, -1).forEach(col => {
      dividerX += col.width;
      doc.moveTo(dividerX, startY).lineTo(dividerX, currentY).stroke();
    });
  }

  // Draw Final Bottom Line
  if (drawHorizontalLines) {
    doc.strokeColor('#999999').lineWidth(0.75).moveTo(startX, currentY).lineTo(startX + totalWidth, currentY).stroke();
  }

  doc.x = startX;
  return currentY;
};


// Main Single Regime Computation PDF Generator
const generateSingleRegimeComputation = (
  doc: PDFKit.PDFDocument,
  comp: any,
  inputs: any,
  outputs: any,
  regime: string,
  profile: any
) => {
  const formatCurrency = formatPDFCurrency;
  const activeReg = regime === 'new' ? outputs.newRegime : outputs.oldRegime;
  const oldReg = outputs.oldRegime;
  const newReg = outputs.newRegime;
  const businessInputs = inputs.business || {};
  const profInputs = inputs.professional || {};
  const fee234F = businessInputs.fee234F || 0;
  const selfAssessmentTax = businessInputs.selfAssessmentTax || 0;
  const age = calculateAge(profile?.dateOfBirth || inputs.dateOfBirth || '1990-01-01', comp.assessmentYear);

  // Helper for basic exemption limit based on regime and AY
  const getBasicExemption = (reg: string, ay: string, userAge: number): number => {
    if (reg === 'new') {
      return ay === '2024-25' ? 250000 : 300000;
    } else {
      if (userAge >= 80) return 500000;
      if (userAge >= 60) return 300000;
      return 250000;
    }
  };

  // ==================== PAGE 1 ====================
  const taxpayerName = profile?.fullName || inputs.fullName || 'Assessee';
  const ayYear = comp.assessmentYear;
  const parts = ayYear.split('-');
  const formattedAY = parts.length === 2 ? `AY ${parts[0]}-20${parts[1]}` : `AY ${ayYear}`;

  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(14);
  doc.text(taxpayerName, 50, 50);
  doc.text(formattedAY, 450, 50, { align: 'right' });
  
  const addrParts = [];
  if (profile?.address) addrParts.push(profile.address);
  if (profile?.city) addrParts.push(profile.city);
  if (profile?.state) {
    let statePart = profile.state;
    if (profile?.pinCode) statePart += ` - ${profile.pinCode}`;
    addrParts.push(statePart);
  }
  const addressText = addrParts.join(', ') || inputs.address || 'Address Not Provided';
  const mobileText = profile?.phone || inputs.phone || 'N/A';
  const emailText = profile?.email || inputs.email || 'N/A';

  doc.font('Helvetica').fontSize(8).fillColor('#333333');
  doc.text(`Address: ${addressText}`, 50, doc.y + 4);
  doc.text(`Mobile: ${mobileText}`, 50, doc.y + 2);
  doc.text(`E-Mail: ${emailText}`, 50, doc.y + 2);
  
  doc.strokeColor('#000000').lineWidth(1).moveTo(50, doc.y + 6).lineTo(545, doc.y + 6).stroke();
  doc.y = doc.y + 12;

  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text('Computation of Income (ITR4)', { align: 'center' });
  doc.y = doc.y + 8;

  // Metadata grid
  let currentY = drawMetadataGrid(doc, 50, doc.y, profile, inputs, regime);
  doc.y = currentY + 12;

  // Section: Tax Summary
  doc.x = 50;
  doc.font('Helvetica-Bold').fontSize(9).text("Tax Summary (Amount in 'Rs')", { align: 'center' });
  doc.y = doc.y + 4;

  const summaryCols = [
    { header: 'Particulars', width: 375, align: 'left' as const, field: 'particulars' },
    { header: 'Amount', width: 120, align: 'right' as const, field: 'amount' }
  ];

  const summaryRows: any[] = [];
  const netSalary = activeReg.grossSalary - activeReg.exemptionsApplied - (regime === 'old' ? (inputs.salary?.professionalTax || 0) : 0) - activeReg.standardDeductionApplied;
  if (netSalary > 0) {
    summaryRows.push({ particulars: 'Salary Income (Net)', amount: formatCurrency(netSalary) });
  }
  if (activeReg.grossHouseProperty !== 0) {
    summaryRows.push({ particulars: 'Income from House Property', amount: formatCurrency(activeReg.grossHouseProperty) });
  }
  const grossBizProf = (activeReg.grossBusiness || 0) + (activeReg.grossProfessional || 0);
  if (grossBizProf !== 0) {
    summaryRows.push({ particulars: 'Business and Profession', amount: formatCurrency(grossBizProf) });
  }
  if (activeReg.grossCapitalGains > 0) {
    summaryRows.push({ particulars: 'Capital Gains', amount: formatCurrency(activeReg.grossCapitalGains) });
  }
  if (activeReg.grossOtherSources > 0) {
    summaryRows.push({ particulars: 'Other Sources', amount: formatCurrency(activeReg.grossOtherSources) });
  }

  summaryRows.push({ particulars: 'Gross Total Income', amount: formatCurrency(activeReg.totalGrossIncome), isTotal: true });
  summaryRows.push({ particulars: '  Less: Total Deductions', amount: formatCurrency(activeReg.deductionsApplied) });
  
  const gtiDeductDiff = Math.max(0, activeReg.totalGrossIncome - activeReg.deductionsApplied);
  summaryRows.push({ 
    particulars: `Total Income (Taxable)    Rounded off from ${formatCurrency(gtiDeductDiff)} as per Section 288A`, 
    amount: formatCurrency(activeReg.netTaxableIncome), 
    isTotal: true 
  });

  if (fee234F > 0) {
    summaryRows.push({ particulars: 'Interest & Fees', amount: `+ ${formatCurrency(fee234F)}` });
  }

  const totalTaxPayableVal = activeReg.totalTaxLiability + fee234F;
  summaryRows.push({ particulars: 'Total Tax Payable', amount: formatCurrency(totalTaxPayableVal), isTotal: true });

  const totalTaxesPaid = activeReg.totalTaxesPaid || 0;
  if (totalTaxesPaid > 0) {
    summaryRows.push({ particulars: '  Less: Total Taxes Paid / Deposited', amount: `- ${formatCurrency(totalTaxesPaid)}`, isTotal: false });
    if ((activeReg.totalSelfAssessment || 0) > 0) {
      summaryRows.push({ particulars: '    - Self-Assessment Tax', amount: formatCurrency(activeReg.totalSelfAssessment) });
    }
    if ((activeReg.totalAdvanceTax || 0) > 0) {
      summaryRows.push({ particulars: '    - Advance Tax', amount: formatCurrency(activeReg.totalAdvanceTax) });
    }
    if ((activeReg.totalTDS || 0) > 0) {
      summaryRows.push({ particulars: '    - TDS Deducted', amount: formatCurrency(activeReg.totalTDS) });
    }
  }

  const netPayableVal = activeReg.netTaxPayableOrRefund !== undefined ? activeReg.netTaxPayableOrRefund : (totalTaxPayableVal - totalTaxesPaid);
  summaryRows.push({ 
    particulars: netPayableVal >= 0 ? 'Net Tax Payable' : 'Refund Due', 
    amount: formatCurrency(Math.abs(netPayableVal)), 
    isTotal: true 
  });

  currentY = drawTable(doc, 50, doc.y, summaryCols, summaryRows, { drawVerticalLines: false });
  doc.y = currentY + 12;


  // ==================== INCOME ANNEXURE ====================
  // Helper: draw a dark blue section heading band
  const drawSectionHeading = (title: string) => {
    if (doc.y > 700) { doc.addPage(); }
    const y = doc.y;
    doc.rect(50, y, 495, 16).fill('#1e3a8a');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
       .text(title, 58, y + 4, { width: 480 });
    doc.fillColor('#000000');
    doc.y = y + 20;
  };

  const detailCols = [
    { header: 'Particulars', width: 375, align: 'left' as const, field: 'particulars' },
    { header: 'Amount (Rs)', width: 120, align: 'right' as const, field: 'amount' }
  ];

  const salaryInputs = inputs.salary || {};
  const salaryExemptions = inputs.exemptions || {};
  const housePropertyInputs = inputs.houseProperty || {};
  const capitalGainsInputs = inputs.capitalGains || {};
  const otherSourcesInputs = inputs.otherSources || {};
  const deductionsInputs = inputs.deductions || {};

  // ---- HEAD I: SALARY INCOME ----
  if (activeReg.grossSalary > 0) {
    drawSectionHeading('ANNEXURE - Head I: Income from Salary');
    const salaryRows: any[] = [];
    if (salaryInputs.basicSalary > 0)
      salaryRows.push({ particulars: '  Basic Salary', amount: formatCurrency(salaryInputs.basicSalary) });
    if (salaryInputs.hra > 0)
      salaryRows.push({ particulars: '  House Rent Allowance (HRA)', amount: formatCurrency(salaryInputs.hra) });
    if (salaryInputs.da > 0)
      salaryRows.push({ particulars: '  Dearness Allowance (DA)', amount: formatCurrency(salaryInputs.da) });
    if (salaryInputs.bonus > 0)
      salaryRows.push({ particulars: '  Bonus', amount: formatCurrency(salaryInputs.bonus) });
    if (salaryInputs.commission > 0)
      salaryRows.push({ particulars: '  Commission', amount: formatCurrency(salaryInputs.commission) });
    if (salaryInputs.otherAllowances > 0)
      salaryRows.push({ particulars: '  Other Allowances', amount: formatCurrency(salaryInputs.otherAllowances) });
    if (salaryInputs.perquisites > 0)
      salaryRows.push({ particulars: '  Perquisites & Profits in lieu of Salary', amount: formatCurrency(salaryInputs.perquisites) });
    salaryRows.push({ particulars: 'Gross Salary', amount: formatCurrency(activeReg.grossSalary), isTotal: true });

    const exemptAmt = activeReg.exemptionsApplied || 0;
    if (exemptAmt > 0) {
      salaryRows.push({ particulars: '  Less: Exemptions u/s 10', amount: '' });
      if (salaryExemptions.hraExemption > 0)
        salaryRows.push({ particulars: '    - HRA Exemption u/s 10(13A)', amount: formatCurrency(salaryExemptions.hraExemption) });
      if (salaryExemptions.ltaExemption > 0)
        salaryRows.push({ particulars: '    - LTA Exemption u/s 10(5)', amount: formatCurrency(salaryExemptions.ltaExemption) });
      if (salaryExemptions.gratuity > 0)
        salaryRows.push({ particulars: '    - Gratuity u/s 10(10)', amount: formatCurrency(salaryExemptions.gratuity) });
      if (salaryExemptions.leaveEncashment > 0)
        salaryRows.push({ particulars: '    - Leave Encashment u/s 10(10AA)', amount: formatCurrency(salaryExemptions.leaveEncashment) });
      if (salaryExemptions.vrsBenefits > 0)
        salaryRows.push({ particulars: '    - VRS Benefits u/s 10(10C)', amount: formatCurrency(salaryExemptions.vrsBenefits) });
      if (salaryExemptions.otherExemptions > 0)
        salaryRows.push({ particulars: '    - Other Exemptions', amount: formatCurrency(salaryExemptions.otherExemptions) });
      salaryRows.push({ particulars: '  Total Exemptions', amount: `(${formatCurrency(exemptAmt)})` });
    }
    const profTaxAmt = regime === 'old' ? (salaryInputs.professionalTax || 0) : 0;
    if (profTaxAmt > 0)
      salaryRows.push({ particulars: '  Less: Professional Tax u/s 16(iii)', amount: `(${formatCurrency(profTaxAmt)})` });
    if (activeReg.standardDeductionApplied > 0)
      salaryRows.push({ particulars: '  Less: Standard Deduction u/s 16(ia)', amount: `(${formatCurrency(activeReg.standardDeductionApplied)})` });
    const netSalaryAmt = Math.max(0, activeReg.grossSalary - exemptAmt - profTaxAmt - (activeReg.standardDeductionApplied || 0));
    salaryRows.push({ particulars: 'Net Income from Salary', amount: formatCurrency(netSalaryAmt), isTotal: true });
    currentY = drawTable(doc, 50, doc.y, detailCols, salaryRows, { drawVerticalLines: false });
    doc.y = currentY + 10;
  }

  // ---- HEAD II: HOUSE PROPERTY ----
  if (activeReg.grossHouseProperty !== 0) {
    drawSectionHeading('ANNEXURE - Head II: Income from House Property');
    const hpRows: any[] = [];
    if (housePropertyInputs.isSelfOccupied) {
      hpRows.push({ particulars: '  Type of Property: Self-Occupied', amount: '' });
      hpRows.push({ particulars: '  Annual Value (Self-Occupied Property) u/s 23(2)', amount: formatCurrency(0) });
      if (housePropertyInputs.housingLoanInterest > 0) {
        const intCap = Math.min(200000, housePropertyInputs.housingLoanInterest);
        hpRows.push({ particulars: '  Less: Interest on Housing Loan u/s 24(b)', amount: '' });
        if (housePropertyInputs.housingLoanInterest > 200000) {
          hpRows.push({ particulars: `    - Actual Interest Paid: ${formatCurrency(housePropertyInputs.housingLoanInterest)}`, amount: '' });
          hpRows.push({ particulars: '    - Capped at Rs 2,00,000 as per Section 24(b)', amount: `(${formatCurrency(intCap)})` });
        } else {
          hpRows.push({ particulars: `    - Interest Paid (Deduction Allowed)`, amount: `(${formatCurrency(intCap)})` });
        }
      }
    } else {
      // rentalIncome is already Gross Annual Value (entered as annual in wizard)
      const grossAnnualValue = housePropertyInputs.rentalIncome;
      const municipalTax = housePropertyInputs.municipalTaxes || 0;
      const nav = Math.max(0, grossAnnualValue - municipalTax);
      const stdDed = Math.round(nav * 0.30);
      const interestHP = housePropertyInputs.housingLoanInterest || 0;
      const netHP = nav - stdDed - interestHP; // matches engine formula exactly

      hpRows.push({ particulars: '  Type of Property: Let-Out', amount: '' });
      hpRows.push({ particulars: '  Gross Annual Value (Annual Rent Received)', amount: formatCurrency(grossAnnualValue) });
      if (municipalTax > 0)
        hpRows.push({ particulars: '  Less: Municipal Taxes Paid', amount: `(${formatCurrency(municipalTax)})` });
      hpRows.push({ particulars: '  Net Annual Value (NAV)', amount: formatCurrency(nav), isTotal: true });
      hpRows.push({ particulars: '  Less: Standard Deduction u/s 24(a) @ 30% of NAV', amount: `(${formatCurrency(stdDed)})` });
      if (interestHP > 0)
        hpRows.push({ particulars: '  Less: Interest on Housing Loan u/s 24(b)', amount: `(${formatCurrency(interestHP)})` });
    }
    hpRows.push({ particulars: 'Net Income / (Loss) from House Property', amount: formatCurrency(activeReg.grossHouseProperty), isTotal: true });
    currentY = drawTable(doc, 50, doc.y, detailCols, hpRows, { drawVerticalLines: false });
    doc.y = currentY + 10;
  }

  // ---- HEAD III: BUSINESS & PROFESSION (with inline 44AD / 44ADA grids) ----
  const hasBiz = (activeReg.grossBusiness || 0) !== 0;
  const hasProf = (activeReg.grossProfessional || 0) !== 0;
  if (hasBiz || hasProf) {
    drawSectionHeading('ANNEXURE - Head III: Profits & Gains of Business / Profession');

    // ---- 44AD business grid (inline, inside Head III) ----
    if (hasBiz && businessInputs.isPresumptive44AD) {
      // Meta line: nature | code | trade name
      const bizNature = businessInputs.businessNature || 'Business';
      const bizCode   = businessInputs.businessCode   || '06002';
      const bizTrade  = businessInputs.tradeName      || taxpayerName;

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
         .text('Section 44AD', 50, doc.y, { align: 'left' });
      doc.y = doc.y + 2;
      doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
         .text(`Business nature: ${bizNature}  |  Business code: ${bizCode}  |  Trade Name: ${bizTrade}`, 50, doc.y, { align: 'left' });
      doc.y = doc.y + 6;

      const cashR  = businessInputs.receiptsCash    || 0;
      const bankR  = businessInputs.receiptsBanking || 0;
      const othR   = businessInputs.receiptsOther   || 0;
      const totalR = cashR + bankR + othR;

      const cashInc  = Math.round(cashR * 0.08);
      const bankInc  = Math.round(bankR * 0.06);
      const othInc   = Math.round(othR  * 0.08);
      const totalInc = cashInc + bankInc + othInc;

      const sec44ADCols = [
        { header: 'Particulars',              width: 105, align: 'left'  as const, field: 'particulars' },
        { header: 'Cash Transactions (8%)',   width: 98,  align: 'right' as const, field: 'cash'        },
        { header: 'Any Other Mode (8%)',      width: 98,  align: 'right' as const, field: 'other'       },
        { header: 'Banking Mode (6%)',        width: 98,  align: 'right' as const, field: 'banking'     },
        { header: 'Total',                    width: 96,  align: 'right' as const, field: 'total'       }
      ];
      const sec44ADRows = [
        {
          particulars: 'Gross Receipt',
          cash:    formatCurrency(cashR),
          other:   formatCurrency(othR),
          banking: formatCurrency(bankR),
          total:   formatCurrency(totalR)
        },
        {
          particulars: 'Income u/s 44AD',
          cash:    formatCurrency(cashInc),
          other:   formatCurrency(othInc),
          banking: formatCurrency(bankInc),
          total:   formatCurrency(totalInc),
          isTotal: true
        }
      ];
      currentY = drawTable(doc, 50, doc.y, sec44ADCols, sec44ADRows, { drawVerticalLines: true, headerBg: true });
      doc.y = currentY + 8;
    }

    // ---- Normal (non-presumptive) business summary ----
    if (hasBiz && !businessInputs.isPresumptive44AD) {
      const bizSumCols = [
        { header: 'Particulars', width: 375, align: 'left' as const, field: 'particulars' },
        { header: 'Amount', width: 120, align: 'right' as const, field: 'amount' }
      ];
      const bizSumRows: any[] = [];
      const gR  = businessInputs.grossReceipts || 0;
      const exp = businessInputs.expenses       || 0;
      const dep = businessInputs.depreciation   || 0;
      bizSumRows.push({ particulars: '  Gross Receipts / Turnover', amount: formatCurrency(gR) });
      if (exp > 0) bizSumRows.push({ particulars: '  Less: Business Expenses', amount: `(${formatCurrency(exp)})` });
      if (dep > 0) bizSumRows.push({ particulars: '  Less: Depreciation u/s 32', amount: `(${formatCurrency(dep)})` });
      bizSumRows.push({ particulars: '  Net Profit from Business', amount: formatCurrency(activeReg.grossBusiness), isTotal: true });
      currentY = drawTable(doc, 50, doc.y, bizSumCols, bizSumRows, { drawVerticalLines: false });
      doc.y = currentY + 8;
    }

    // ---- 44ADA professional grid (inline, inside Head III) ----
    if (hasProf && profInputs.isPresumptive44ADA) {
      const profNature = profInputs.professionNature || 'Profession';
      const profCode   = profInputs.professionCode   || '16013';
      const profTrade  = profInputs.tradeName        || taxpayerName;

      doc.font('Helvetica-Bold').fontSize(8).fillColor('#000000')
         .text('Section 44ADA', 50, doc.y, { align: 'left' });
      doc.y = doc.y + 2;
      doc.font('Helvetica').fontSize(7.5).fillColor('#333333')
         .text(`Profession nature: ${profNature}  |  Profession code: ${profCode}  |  Trade Name: ${profTrade}`, 50, doc.y, { align: 'left' });
      doc.y = doc.y + 6;

      const cashP  = profInputs.receiptsCash    || 0;
      const bankP  = profInputs.receiptsBanking || 0;
      const totalP = cashP + bankP;

      const cashIncP  = Math.round(cashP * 0.5);
      const bankIncP  = Math.round(bankP * 0.5);
      const totalIncP = Math.round(totalP * 0.5);

      const sec44ADACols = [
        { header: 'Particulars',    width: 155, align: 'left'  as const, field: 'particulars' },
        { header: 'Cash (50%)',     width: 110, align: 'right' as const, field: 'cash'        },
        { header: 'Banking (50%)', width: 110, align: 'right' as const, field: 'banking'     },
        { header: 'Total',          width: 120, align: 'right' as const, field: 'total'       }
      ];
      const sec44ADARows = [
        {
          particulars: 'Gross Receipt',
          cash:    formatCurrency(cashP),
          banking: formatCurrency(bankP),
          total:   formatCurrency(totalP)
        },
        {
          particulars: 'Income u/s 44ADA',
          cash:    formatCurrency(cashIncP),
          banking: formatCurrency(bankIncP),
          total:   formatCurrency(totalIncP),
          isTotal: true
        }
      ];
      currentY = drawTable(doc, 50, doc.y, sec44ADACols, sec44ADARows, { drawVerticalLines: true, headerBg: true });
      doc.y = currentY + 8;
    }

    // ---- Normal (non-presumptive) professional summary ----
    if (hasProf && !profInputs.isPresumptive44ADA) {
      const profSumCols = [
        { header: 'Particulars', width: 375, align: 'left' as const, field: 'particulars' },
        { header: 'Amount', width: 120, align: 'right' as const, field: 'amount' }
      ];
      const profSumRows: any[] = [];
      const gR  = profInputs.grossReceipts || 0;
      const exp = profInputs.expenses       || 0;
      const dep = profInputs.depreciation   || 0;
      profSumRows.push({ particulars: '  Gross Professional Receipts', amount: formatCurrency(gR) });
      if (exp > 0) profSumRows.push({ particulars: '  Less: Professional Expenses', amount: `(${formatCurrency(exp)})` });
      if (dep > 0) profSumRows.push({ particulars: '  Less: Depreciation u/s 32', amount: `(${formatCurrency(dep)})` });
      profSumRows.push({ particulars: '  Net Profit from Profession', amount: formatCurrency(activeReg.grossProfessional), isTotal: true });
      currentY = drawTable(doc, 50, doc.y, profSumCols, profSumRows, { drawVerticalLines: false });
      doc.y = currentY + 8;
    }

    // ---- Net total for Head III ----
    const totalBizProf = (activeReg.grossBusiness || 0) + (activeReg.grossProfessional || 0);
    const netBizCols = [
      { header: 'Particulars', width: 375, align: 'left' as const, field: 'particulars' },
      { header: 'Amount', width: 120, align: 'right' as const, field: 'amount' }
    ];
    currentY = drawTable(doc, 50, doc.y, netBizCols,
      [{ particulars: 'Net Income under Head "Business & Profession"', amount: formatCurrency(totalBizProf), isTotal: true }],
      { drawVerticalLines: false }
    );
    doc.y = currentY + 10;
  }


  // ---- HEAD IV: CAPITAL GAINS ----
  if (activeReg.grossCapitalGains > 0) {
    drawSectionHeading('ANNEXURE - Head IV: Capital Gains');

    const cgRows: any[] = [];
    const stcgGen = capitalGainsInputs.shortTermStcg || 0;
    const stcgEq = capitalGainsInputs.shareMarketGains || 0;
    const ltcgEq = capitalGainsInputs.longTermLtcg || 0;
    const ltcgProp = capitalGainsInputs.propertySaleGains || 0;

    if (stcgGen > 0 || stcgEq > 0) {
      cgRows.push({ particulars: '  Short Term Capital Gains (STCG)', amount: '' });
      if (stcgGen > 0)
        cgRows.push({ particulars: '    STCG @ Normal Slab Rates [Sec 111A excluded assets]', amount: formatCurrency(stcgGen) });
      if (stcgEq > 0)
        cgRows.push({ particulars: '    STCG on Equity Shares / MFs u/s 111A @ 15%', amount: formatCurrency(stcgEq) });
      cgRows.push({ particulars: '  Sub-total STCG', amount: formatCurrency(stcgGen + stcgEq) });
    }

    if (ltcgEq > 0 || ltcgProp > 0) {
      cgRows.push({ particulars: '  Long Term Capital Gains (LTCG)', amount: '' });
      if (ltcgEq > 0)
        cgRows.push({ particulars: '    LTCG on Equity / MFs u/s 112A @ 10% (above Rs 1 lakh)', amount: formatCurrency(ltcgEq) });
      if (ltcgProp > 0)
        cgRows.push({ particulars: '    LTCG on Property / Other Assets u/s 112 @ 20%', amount: formatCurrency(ltcgProp) });
      cgRows.push({ particulars: '  Sub-total LTCG', amount: formatCurrency(ltcgEq + ltcgProp) });
    }

    cgRows.push({ particulars: 'Total Capital Gains', amount: formatCurrency(activeReg.grossCapitalGains), isTotal: true });

    currentY = drawTable(doc, 50, doc.y, detailCols, cgRows, { drawVerticalLines: false });
    doc.y = currentY + 10;
  }

  // ---- HEAD 5: OTHER SOURCES ----
  if (activeReg.grossOtherSources > 0) {
    drawSectionHeading('ANNEXURE - Head V: Income from Other Sources');

    const otherIncomeRows: any[] = [];
    if (otherSourcesInputs.interestSavings > 0)
      otherIncomeRows.push({ particulars: '  Interest from Savings Account u/s 56(2)(id)', amount: formatCurrency(otherSourcesInputs.interestSavings) });
    if (otherSourcesInputs.interestFD > 0)
      otherIncomeRows.push({ particulars: '  Interest from Fixed Deposits / Others', amount: formatCurrency(otherSourcesInputs.interestFD) });
    if (otherSourcesInputs.dividends > 0)
      otherIncomeRows.push({ particulars: '  Dividend Income u/s 56(2)(i)', amount: formatCurrency(otherSourcesInputs.dividends) });
    if (otherSourcesInputs.pension > 0)
      otherIncomeRows.push({ particulars: '  Pension Income', amount: formatCurrency(otherSourcesInputs.pension) });
    if (otherSourcesInputs.familyPension > 0)
      otherIncomeRows.push({ particulars: '  Family Pension (Less: 1/3rd or Rs 15,000 exemption)', amount: formatCurrency(otherSourcesInputs.familyPension) });
    if (otherSourcesInputs.lotteryIncome > 0)
      otherIncomeRows.push({ particulars: '  Winnings from Lottery / Races u/s 115BB @ 30%', amount: formatCurrency(otherSourcesInputs.lotteryIncome) });
    otherIncomeRows.push({ particulars: 'Total Income from Other Sources', amount: formatCurrency(activeReg.grossOtherSources), isTotal: true });

    currentY = drawTable(doc, 50, doc.y, detailCols, otherIncomeRows, { drawVerticalLines: false });
    doc.y = currentY + 10;
  }

  // ---- DEDUCTIONS ANNEXURE (Chapter VI-A) ----
  if (activeReg.deductionsApplied > 0) {
    drawSectionHeading('ANNEXURE - Chapter VI-A Deductions');

    const dedRows: any[] = [];
    if (deductionsInputs.sec80C > 0)
      dedRows.push({ particulars: '  80C - LIC, PPF, ELSS, EPF, Home Loan Principal, etc.', amount: formatCurrency(Math.min(deductionsInputs.sec80C, 150000)) });
    if (deductionsInputs.sec80CCD_1B > 0)
      dedRows.push({ particulars: '  80CCD(1B) - NPS additional contribution (max Rs 50,000)', amount: formatCurrency(Math.min(deductionsInputs.sec80CCD_1B, 50000)) });
    if (deductionsInputs.sec80D > 0)
      dedRows.push({ particulars: '  80D - Medical Insurance Premium', amount: formatCurrency(deductionsInputs.sec80D) });
    if (deductionsInputs.sec80E > 0)
      dedRows.push({ particulars: '  80E - Interest on Education Loan', amount: formatCurrency(deductionsInputs.sec80E) });
    if (deductionsInputs.sec80G > 0)
      dedRows.push({ particulars: '  80G - Donations to Charitable Institutions', amount: formatCurrency(deductionsInputs.sec80G) });
    if (deductionsInputs.sec80TTA > 0)
      dedRows.push({ particulars: '  80TTA - Interest from Savings Account (max Rs 10,000)', amount: formatCurrency(Math.min(deductionsInputs.sec80TTA, 10000)) });
    if (deductionsInputs.sec80TTB > 0)
      dedRows.push({ particulars: '  80TTB - Interest (Senior Citizen, max Rs 50,000)', amount: formatCurrency(Math.min(deductionsInputs.sec80TTB, 50000)) });
    if (deductionsInputs.otherDeductions > 0)
      dedRows.push({ particulars: '  Other Deductions', amount: formatCurrency(deductionsInputs.otherDeductions) });
    dedRows.push({ particulars: 'Total Deductions (Chapter VI-A)', amount: formatCurrency(activeReg.deductionsApplied), isTotal: true });

    currentY = drawTable(doc, 50, doc.y, detailCols, dedRows, { drawVerticalLines: false });
    doc.y = currentY + 10;
  }



  // ==================== PAGE 2 ====================
  doc.addPage();

  doc.x = 50;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text('Income Tax', { align: 'center' });
  doc.y = doc.y + 4;

  const basicExemp = getBasicExemption(regime, comp.assessmentYear, age);
  const incomeTaxRows = [
    { particulars: 'Total Income', amount: formatCurrency(activeReg.netTaxableIncome) },
    { particulars: 'Basic Exemption', amount: formatCurrency(basicExemp) },
    { particulars: 'Income Tax', amount: formatCurrency(activeReg.taxBeforeRebate) },
    { particulars: 'Rebate u/s 87A', amount: formatCurrency(activeReg.rebate87A) },
    { particulars: 'Tax after rebate', amount: formatCurrency(activeReg.taxAfterRebate), isTotal: true }
  ];

  if (activeReg.surcharge > 0) {
    incomeTaxRows.push({ particulars: 'Surcharge', amount: formatCurrency(activeReg.surcharge) });
  }
  if (activeReg.cess > 0) {
    incomeTaxRows.push({ particulars: 'Health & Education Cess (4%)', amount: formatCurrency(activeReg.cess) });
  }
  if (fee234F > 0) {
    incomeTaxRows.push({ particulars: 'Interest Due', amount: formatCurrency(fee234F) });
    incomeTaxRows.push({ particulars: '  234F', amount: formatCurrency(fee234F) });
  }
  if (totalTaxesPaid > 0) {
    incomeTaxRows.push({ particulars: 'Tax Paid / Deposited', amount: `-${formatCurrency(totalTaxesPaid)}` });
    if ((activeReg.totalSelfAssessment || 0) > 0) {
      incomeTaxRows.push({ particulars: '  Self Assessment Tax', amount: formatCurrency(activeReg.totalSelfAssessment) });
    }
    if ((activeReg.totalAdvanceTax || 0) > 0) {
      incomeTaxRows.push({ particulars: '  Advance Tax', amount: formatCurrency(activeReg.totalAdvanceTax) });
    }
    if ((activeReg.totalTDS || 0) > 0) {
      incomeTaxRows.push({ particulars: '  TDS Deducted', amount: formatCurrency(activeReg.totalTDS) });
    }
  }

  incomeTaxRows.push({ 
    particulars: netPayableVal >= 0 ? 'Payable' : 'Refund Due', 
    amount: formatCurrency(Math.abs(netPayableVal)), 
    isTotal: true 
  });

  const itCols = [
    { header: 'Particulars', width: 375, align: 'left' as const, field: 'particulars' },
    { header: 'Amount', width: 120, align: 'right' as const, field: 'amount' }
  ];

  currentY = drawTable(doc, 50, 50, itCols, incomeTaxRows, { drawVerticalLines: false });
  doc.y = currentY + 12;

  // Normal Tax Breakup
  doc.x = 50;
  doc.font('Helvetica-Bold').fontSize(10).text('Normal Tax Breakup', { align: 'center' });
  doc.y = doc.y + 4;

  const slabConfig = regime === 'new' 
    ? getNewRegimeConfig(comp.assessmentYear) 
    : getOldRegimeConfig(age);

  const otherSources = inputs.otherSources || {};
  const normalIncome = Math.max(0, activeReg.netTaxableIncome - (otherSources.lotteryIncome || 0) - (inputs.capitalGains?.shareMarketGains || 0) - (inputs.capitalGains?.longTermLtcg || 0) - ((inputs.capitalGains?.shortTermStcg || 0) + (inputs.capitalGains?.propertySaleGains || 0)));
  
  let remainingSlabIncome = normalIncome;
  const breakupRows: any[] = [];
  let totalSlabTax = 0;

  slabConfig.slabs.forEach(slab => {
    const min = slab.minLimit;
    const max = slab.maxLimit;
    const rate = slab.rate;
    
    let taxable = 0;
    if (remainingSlabIncome > min) {
      taxable = max === null ? remainingSlabIncome - min : Math.min(remainingSlabIncome - min, max - min);
    }
    const tax = taxable * (rate / 100);
    totalSlabTax += tax;
    
    let slabText = '';
    if (max === null) {
      slabText = `${min / 100000} lakh above`;
    } else {
      slabText = `${min / 100000} lakh to ${max / 100000} lakh`;
    }
    
    breakupRows.push({
      slab: slabText,
      rate: `${rate}%`,
      amount: formatCurrency(Math.round(tax))
    });
  });

  breakupRows.push({
    slab: 'Total',
    rate: '',
    amount: formatCurrency(Math.round(totalSlabTax)),
    isTotal: true
  });

  const slabCols = [
    { header: 'Income Slab', width: 175, align: 'left' as const, field: 'slab' },
    { header: 'Rate', width: 100, align: 'center' as const, field: 'rate' },
    { header: 'Tax Amount', width: 220, align: 'right' as const, field: 'amount' }
  ];

  currentY = drawTable(doc, 50, doc.y, slabCols, breakupRows, { drawVerticalLines: true, headerBg: true });
  doc.y = currentY + 12;

  // Taxes Paid Table
  doc.x = 50;
  doc.font('Helvetica-Bold').fontSize(10).text('Tax Deposits Ledger', { align: 'center' });
  doc.y = doc.y + 4;

  const challanRows: any[] = [];
  const taxDeposits = inputs.taxDeposits || [];
  
  if (taxDeposits.length > 0) {
    taxDeposits.forEach((dep: any) => {
      if (dep.type === 'TDS') {
        challanRows.push({
          type: 'TDS',
          source: dep.deductorName || 'Deductor',
          identifier: dep.deductorTAN || 'N/A',
          date: dep.date || 'N/A',
          amount: formatCurrency(dep.amount)
        });
      } else {
        challanRows.push({
          type: dep.type === 'SelfAssessment' ? 'Self-Ass.' : 'Advance',
          source: dep.bankName || 'BRB Bank',
          identifier: `BSR: ${dep.bsrCode || 'N/A'}\nChallan: ${dep.challanNo || 'N/A'}`,
          date: dep.date || 'N/A',
          amount: formatCurrency(dep.amount)
        });
      }
    });
  } else if (selfAssessmentTax > 0) {
    // Legacy fallback
    challanRows.push({
      type: 'Self-Ass.',
      source: 'BRB Bank',
      identifier: `BSR: ${businessInputs.bsrCode || 'N/A'}\nChallan: ${businessInputs.challanNo || 'N/A'}`,
      date: businessInputs.challanDate || 'N/A',
      amount: formatCurrency(selfAssessmentTax)
    });
  } else {
    challanRows.push({
      type: 'N/A',
      source: 'No payments',
      identifier: 'N/A',
      date: 'N/A',
      amount: formatCurrency(0)
    });
  }

  const taxPaidCols = [
    { header: 'Type', width: 75, align: 'center' as const, field: 'type' },
    { header: 'Source / Bank', width: 125, align: 'left' as const, field: 'source' },
    { header: 'BSR / TAN / Challan', width: 140, align: 'left' as const, field: 'identifier' },
    { header: 'Date', width: 80, align: 'center' as const, field: 'date' },
    { header: 'Amount', width: 75, align: 'right' as const, field: 'amount' }
  ];

  currentY = drawTable(doc, 50, doc.y, taxPaidCols, challanRows, { drawVerticalLines: true, headerBg: true });
  doc.y = currentY + 12;

  // Bank account details table
  doc.x = 50;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000').text('Bank Account Details', { align: 'center' });
  doc.y = doc.y + 4;

  const bankRows = [
    {
      siNo: '1',
      ifsc: profile?.ifscCode || businessInputs.ifscCode || 'N/A',
      bankName: profile?.bankName || businessInputs.bankName || 'N/A',
      accNo: profile?.accountNumber || businessInputs.accountNumber || 'N/A'
    }
  ];

  const bankCols = [
    { header: 'SI No.', width: 45, align: 'center' as const, field: 'siNo' },
    { header: 'IFSC Code', width: 130, align: 'center' as const, field: 'ifsc' },
    { header: 'Name of the Bank', width: 170, align: 'left' as const, field: 'bankName' },
    { header: 'Account No.', width: 150, align: 'left' as const, field: 'accNo' }
  ];

  currentY = drawTable(doc, 50, doc.y, bankCols, bankRows, { drawVerticalLines: true, headerBg: true });
  doc.y = currentY + 12;

  // Financial Particulars Section
  doc.x = 50;
  doc.font('Helvetica-Bold').fontSize(9).text('Financial Particulars', { align: 'center' });
  doc.x = 50;
  doc.font('Helvetica-Oblique').fontSize(7.5).text('In case of presumptive income', { align: 'center' });
  doc.y = doc.y + 4;

  const fyYearStart = comp.assessmentYear.split('-')[0];
  const particularsHeader = `Financial particulars as on 31/03/${fyYearStart}`;

  const finCols = [
    { header: particularsHeader, width: 345, align: 'left' as const, field: 'particulars' },
    { header: 'Amount', width: 150, align: 'right' as const, field: 'amount' }
  ];

  const financialRows = [
    { particulars: 'Sundry Debtors', amount: formatCurrency(businessInputs.sundryDebtors || 0) },
    { particulars: 'Sundry Creditors', amount: formatCurrency(businessInputs.sundryCreditors || 0) },
    { particulars: 'Stock-in-trade', amount: formatCurrency(businessInputs.stockInTrade || 0) },
    { particulars: 'Cash Balance', amount: formatCurrency(businessInputs.cashBalance || 0) }
  ];

  currentY = drawTable(doc, 50, doc.y, finCols, financialRows, { drawVerticalLines: true, headerBg: true });

  // Signatures Section
  doc.y = currentY + 30;
  doc.font('Helvetica').fontSize(8.5).fillColor('#000000');
  
  doc.text('Signature', 50, doc.y);
  
  doc.y = doc.y + 24;
  doc.font('Helvetica-Bold');
  doc.text(`For ${profile?.fullName || inputs.fullName || 'Mohit Kumar'}`, 50, doc.y);
};
