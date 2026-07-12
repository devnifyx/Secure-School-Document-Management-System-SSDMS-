const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function initDatabase() {
  try {
    console.log('Reading schema file...');
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Remove CREATE DATABASE and USE statements since we're already connected to ssdms
    schema = schema.replace(/CREATE DATABASE IF NOT EXISTS ssdms;?/gi, '');
    schema = schema.replace(/USE ssdms;?/gi, '');
    
    console.log('Executing schema...');
    await db.query(schema);
    
    console.log('Database schema imported successfully!');
    
    // Create default admin user (username: admin, password: admin123)
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await db.query(
      'INSERT IGNORE INTO users (username, password, role) VALUES (?, ?, ?)',
      ['admin', hashedPassword, 'Admin']
    );
    
    console.log('Default admin user created!');
    console.log('Username: admin');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
