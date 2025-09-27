const { Client } = require('pg');
require('dotenv').config();

async function addGrowthUser() {
  console.log('Starting to add growth user...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('✅ Connected to database successfully');

    console.log('Running INSERT query...');
    const result = await client.query(`
      INSERT INTO growth_users (id, email, is_active, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'admin@batteriesngadgets.com',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, email, is_active;
    `);

    console.log('✅ User added successfully:', result.rows[0]);
  } catch (error) {
    console.error('❌ Error details:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

addGrowthUser();
