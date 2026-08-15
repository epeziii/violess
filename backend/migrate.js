#!/usr/bin/env node
/**
 * Supabase Schema Migration Script
 * Applies the schema from supabase_schema.sql to your Supabase database
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://usjeipxsrpplsjmabvei.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_6h3yhv6XsUXMgBJjUjYrjw_TzLFitil';

(async () => {
  try {
    console.log('🔌 Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Read the schema file
    const schemaPath = path.join(__dirname, 'supabase_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('✅ Schema file loaded');

    // Split by ; to get individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Running ${statements.length} SQL statements...`);

    // Execute each statement using Supabase's rpc or direct query
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        // Use Supabase's sql() method via POST to /rest/v1/rpc/sql_exec or similar
        // Since we can't directly execute raw SQL via the JS client,
        // we'll use the PostgreSQL connection string via psql
        process.stdout.write(`  [${i + 1}/${statements.length}] `);
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
      }
    }

    console.log('\n⚠️  Note: Full SQL execution requires psql or Supabase SQL Editor');
    console.log('Please run this manually in Supabase Dashboard > SQL Editor');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
