/**
 * CCA DocTrack - Development-Only Demo Seeding Script
 * 
 * CAUTION: For local development / demo evaluation only.
 * Will NOT run in production (NODE_ENV=production).
 * Explicitly invoked via: node seed_demo_data.js
 */

const { getSupabaseClient } = require('./supabase');
require('dotenv').config();

async function seedDemoData() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to seed demo data in production environment.');
    process.exit(1);
  }

  console.log('🌱 Seeding development demo requests in Supabase...');
  const client = getSupabaseClient();

  const demoRequests = [
    {
      student_name: 'Jaynellan Almary O. Magpantay',
      student_id: '23-67895',
      document_type: 'Transcript of Records',
      purpose: 'Scholarship Application Requirement',
      date_submitted: '2026-11-20',
      status: 'Processing',
      course: 'BS Information Technology',
      email: 'jaynellan@cca.edu.ph',
      request_number: 'CCA-REQ-0001'
    },
    {
      student_name: 'Jaynellan Almary O. Magpantay',
      student_id: '23-67895',
      document_type: 'Certificate of Enrollment',
      purpose: 'CHED Tertiary Education Subsidy',
      date_submitted: '2026-11-18',
      status: 'Completed',
      course: 'BS Information Technology',
      email: 'jaynellan@cca.edu.ph',
      request_number: 'CCA-REQ-0002'
    }
  ];

  for (const req of demoRequests) {
    const { data: existing } = await client
      .from('document_requests')
      .select('id')
      .eq('request_number', req.request_number)
      .limit(1);

    if (!existing || existing.length === 0) {
      await client.from('document_requests').insert([req]);
      console.log(`  ✅ Inserted demo request: ${req.request_number} (${req.document_type})`);
    } else {
      console.log(`  ℹ️ Demo request already exists: ${req.request_number}`);
    }
  }

  console.log('✅ Demo seeding completed.');
}

seedDemoData().catch(err => {
  console.error('Demo seeding failed:', err.message);
  process.exit(1);
});
