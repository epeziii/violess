const admin = require('firebase-admin');
const path = require('path');
const fetch = require('node-fetch');

const serviceAccountPath = path.join(__dirname,'violess-4e542-firebase-adminsdk-fbsvc-78fd8f52d9.json');
admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });

const uid = '38ZTp81pKcRho69KTCOdXEnIf113';
(async () => {
  try {
    const user = await admin.auth().getUser(uid);
    console.log('firebase_email:', user.email);
    const email = user.email || `${'AD001'.toLowerCase()}_${Date.now()}@staff.local`;

    const supabaseUrl = 'https://usjeipxsrpplsjmabvei.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_6h3yhv6XsUXMgBJjUjYrjw_TzLFitil';
    const body = {
      id: uid,
      username: 'AD001',
      email,
      first_name: 'Jhef',
      last_name: 'Alte',
      role: 'admin',
      avatar: null,
      profile: { cases: 0, color: 'blue', last_login: null, status: 'active' }
    };

    const resp = await fetch(supabaseUrl + '/rest/v1/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    });
    const text = await resp.text();
    console.log('supabase_response:', text);
  } catch (err) {
    console.error('err', err);
    process.exit(1);
  }
})();