
const { Client } = require('pg');

async function checkComplaints() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/safeline"
  });

  try {
    await client.connect();
    
    // 1. Find EMP002 user ID
    const userRes = await client.query("SELECT id, username FROM users WHERE username = 'EMP002'");
    const user = userRes.rows[0];
    console.log('--- USER INFO ---');
    console.log(user);

    if (!user) {
      console.log('User EMP002 not found');
      return;
    }

    // 2. Find all complaints
    const complaintsRes = await client.query(`
      SELECT id, tracking_id, title, reporter_id, anonymous, is_sensitive, type, status 
      FROM complaints 
      ORDER BY created_at DESC
    `);
    
    console.log('\n--- ALL COMPLAINTS ---');
    console.table(complaintsRes.rows);

    // 3. Find complaints specifically linked to EMP002
    const myComplaintsRes = await client.query(`
      SELECT id, tracking_id, title, reporter_id 
      FROM complaints 
      WHERE reporter_id = $1
    `, [user.id]);
    
    console.log('\n--- COMPLAINTS LINKED TO REPORTER ID ' + user.id + ' ---');
    console.table(myComplaintsRes.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkComplaints();
