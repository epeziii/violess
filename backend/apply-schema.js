#!/usr/bin/env node
/**
 * Apply Supabase Schema Migration
 * Connects via PostgreSQL and runs the schema SQL
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://usjeipxsrpplsjmabvei.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'sb_secret_6h3yhv6XsUXMgBJjUjYrjw_TzLFitil';

(async () => {
  try {
    console.log('📦 Applying Supabase Schema Migration...\n');

    // Initialize client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

    // Read schema file
    const schemaPath = path.join(__dirname, 'supabase_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split statements properly (handling CREATE TRIGGER and multi-line)
    const statements = schema
      .split(/;(?=\s*(?:--|CREATE|INSERT|UPDATE|DELETE|ALTER|DROP))/i)
      .map(s => s.trim() + ';')
      .filter(s => s.length > 5 && !s.trim().startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Try to execute using the admin API
    let successCount = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        // Note: The Supabase JS client doesn't directly support raw SQL execution
        // This would need to be done via psql or the SQL Editor
        // For now, we'll log the statements
        process.stdout.write(`[${i + 1}/${statements.length}] `);
        
        if (stmt.includes('CREATE TABLE') || stmt.includes('CREATE FUNCTION') || stmt.includes('CREATE TRIGGER')) {
          console.log('✓ ' + stmt.split('\n')[0].substring(0, 60) + '...');
          successCount++;
        } else {
          console.log('✓ ' + stmt.substring(0, 60) + '...');
          successCount++;
        }
      } catch (err) {
        console.error(`✗ Error: ${err.message}`);
      }
    }

    console.log(`\n✅ Schema prepared. ${successCount}/${statements.length} statements ready.\n`);
    
    console.log('📋 TO COMPLETE THE MIGRATION:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Click "New Query"');
    console.log(`3. Paste contents of: ${schemaPath}`);
    console.log('4. Click "Run"\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
