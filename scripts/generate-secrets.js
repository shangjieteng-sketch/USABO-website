#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
}

function createEnvFile() {
    const envPath = path.join(__dirname, '../.env');
    const envExamplePath = path.join(__dirname, '../.env.example');
    
    // Check if .env already exists
    if (fs.existsSync(envPath)) {
        console.log('.env file already exists. Please backup your current .env file if needed.');
        process.exit(1);
    }
    
    // Read .env.example
    if (!fs.existsSync(envExamplePath)) {
        console.error('.env.example file not found!');
        process.exit(1);
    }
    
    let envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    // Generate secure secrets
    const jwtSecret = generateSecret(64);
    const sessionSecret = generateSecret(64);
    
    // Replace placeholder values
    envContent = envContent.replace(/your_super_secret_jwt_key_change_this_in_production/g, jwtSecret);
    envContent = envContent.replace(/your_super_secret_session_key_change_this_in_production/g, sessionSecret);
    
    // Write new .env file
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Generated new .env file with secure secrets!');
    console.log('\n🔐 Generated secrets:');
    console.log(`JWT_SECRET: ${jwtSecret.substring(0, 20)}...`);
    console.log(`SESSION_SECRET: ${sessionSecret.substring(0, 20)}...`);
    console.log('\n📝 Next steps:');
    console.log('1. Review the .env file and configure OAuth providers if needed');
    console.log('2. Never commit the .env file to version control');
    console.log('3. Use different secrets for production environment');
}

if (require.main === module) {
    createEnvFile();
}

module.exports = { generateSecret, createEnvFile };