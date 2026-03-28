const { Client } = require('pg');

async function checkUserPermissions() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/safeline_1"
  });

  try {
    await client.connect();
    
    // Check EMP002 permissions
    const res = await client.query(`
      SELECT u.username, u.role, up.permission 
      FROM users u
      LEFT JOIN user_committee_permissions up ON u.id = up.user_id
      WHERE u.username = 'EMP002'
    `);
    
    console.log('--- USER PERMISSIONS ---');
    console.table(res.rows);

    // Check Case Type for specific cases
    const compRes = await client.query(`
      SELECT id, tracking_id, type, status FROM complaints LIMIT 10
    `);
    console.log('\n--- COMPLAINTS ---');
    console.table(compRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkUserPermissions();
