import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding database...');

  // 1. Create Default Admin User
  const adminEmail = 'admin@taxcompute.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('AdminPassword123', 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN'
      }
    });

    await prisma.profile.create({
      data: {
        userId: admin.id,
        fullName: 'System Administrator',
        fatherName: 'Root Admin',
        dateOfBirth: '1985-01-01',
        gender: 'Male',
        panNumber: 'ABCDE1234F',
        aadhaarNumber: '123456789012',
        phone: '9999999999',
        address: 'CA Portal Admin HQ',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110001',
        bankName: 'State Bank of India',
        accountNumber: '10000000000',
        ifscCode: 'SBIN0000001',
        branchName: 'Main Branch',
        employmentType: 'Professional',
        completed: true
      }
    });
    console.log(`Created default admin user: ${adminEmail} / AdminPassword123`);
  } else {
    console.log('Admin user already exists.');
  }

  // 2. Seed FAQs
  const faqCount = await prisma.fAQ.count();
  if (faqCount === 0) {
    const faqs = [
      {
        question: 'Which tax regime is better: Old or New?',
        answer: 'The answer depends on your deductions. The New Regime offers lower tax rates but disallows most exemptions and deductions (e.g. 80C, 80D, HRA). The Old Regime is beneficial if you claim deductions like home loan interest, HRA, and premium investments exceeding ₹2.5-3 Lakhs in total.',
        category: 'General'
      },
      {
        question: 'What is Section 87A rebate and does it apply to both regimes?',
        answer: 'Section 87A rebate is a tax rebate that reduces tax liability to zero for low-to-medium income earners. In the Old Regime, it applies up to a taxable income of ₹5,00,000 (max rebate ₹12,500). In the New Regime, it applies up to a taxable income of ₹7,00,000 (max rebate ₹20,000/25,000 based on the assessment year), with marginal tax relief if the income slightly exceeds ₹7 Lakhs.',
        category: 'Slabs'
      },
      {
        question: 'Is standard deduction available under the New Tax Regime?',
        answer: 'Yes! For salaried individuals and pensioners, a Standard Deduction is allowed under the New Tax Regime. For Assessment Year 2024-25, it is ₹50,000. Under Budget 2024 (Assessment Year 2025-26 onwards), it is raised to ₹75,000 in the New Regime.',
        category: 'Deductions'
      },
      {
        question: 'What qualifies for Section 80C deductions?',
        answer: 'Section 80C includes payments towards Life Insurance Premium, Public Provident Fund (PPF), Employee Provident Fund (EPF), Equity Linked Savings Schemes (ELSS), National Savings Certificate (NSC), school tuition fees, and Home Loan Principal repayment up to an aggregate cap of ₹1,50,000. This is only available in the Old Tax Regime.',
        category: 'Deductions'
      }
    ];

    for (const faq of faqs) {
      await prisma.fAQ.create({ data: faq });
    }
    console.log('Seeded FAQs successfully.');
  }

  // 3. Seed Blogs
  const blogCount = await prisma.blog.count();
  if (blogCount === 0) {
    const blogs = [
      {
        title: 'Mastering Tax Planning under Budget 2024',
        slug: 'tax-planning-budget-2024',
        content: `Budget 2024 brought significant changes to the New Tax Regime. The slabs were revised to shift the tax rates and allow a larger standard deduction of ₹75,000 for salaried employees. 

### Key Highlights of New slabs:
1. Up to ₹3 Lakhs: Nil
2. ₹3 Lakhs to ₹7 Lakhs: 5%
3. ₹7 Lakhs to ₹10 Lakhs: 10%
4. ₹10 Lakhs to ₹12 Lakhs: 15%
5. ₹12 Lakhs to ₹15 Lakhs: 20%
6. Above ₹15 Lakhs: 30%

Under the revised structure, a salaried individual earning up to ₹7.75 Lakhs will pay ZERO tax under the New Regime (₹7,75,000 - ₹75,000 standard deduction = ₹7,00,000, which is fully rebate-eligible under Section 87A). This makes the New Regime highly lucrative for middle-income professionals.`,
        published: true
      },
      {
        title: 'Top 5 Tax Saving Investment Avenues u/s 80C',
        slug: 'top-5-tax-saving-avenues-80c',
        content: `If you are choosing the Old Tax Regime, Section 80C is your main tool to reduce taxable income by up to ₹1.5 Lakhs. Here are the top tax-saving investments:

1. **Equity Linked Savings Scheme (ELSS)**: Equity mutual funds with a 3-year lock-in period. Offers inflation-beating potential.
2. **Public Provident Fund (PPF)**: Backed by the Government of India, offering risk-free interest and tax-free withdrawals (EEE status).
3. **National Pension System (NPS)**: Helps build retirement corpuses. Contributions u/s 80CCD(1B) offer an extra ₹50,000 deduction.
4. **Tax Saver Fixed Deposits**: 5-year lock-in period deposits with banks. Safe and steady.
5. **Employee Provident Fund (EPF)**: Automatic retirement savings deduction from basic salary.`,
        published: true
      }
    ];

    for (const blog of blogs) {
      await prisma.blog.create({ data: blog });
    }
    console.log('Seeded Blog Posts successfully.');
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
