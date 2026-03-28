
const axios = require('axios');

async function checkUsers() {
  try {
    const resp = await axios.get('http://localhost:8085/api/admin/users/investigators', {
      headers: {
        'X-Tenant-Id': 'default',
        // We'll need a token, but let's see if we can get a list without one if the security is loose for debug,
        // or just check the DataInitializer again.
      }
    });
    console.log(resp.data);
  } catch (err) {
    console.error('Failed to fetch:', err.message);
  }
}

// Actually, I'll just check the DB directly if I can, but I don't have direct DB access tools other than run_command on sqlite if it's using one.
// Let's check application.properties to see the DB.
