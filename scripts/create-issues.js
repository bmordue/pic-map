#!/usr/bin/env node

/**
 * Script to create GitHub issues from the issues-to-create.json file
 * 
 * Usage:
 *   node scripts/create-issues.js
 * 
 * Prerequisites:
 *   - Set GITHUB_TOKEN environment variable with a GitHub personal access token
 *   - Token needs 'repo' scope for creating issues
 * 
 * The script will:
 *   1. Read the issues-to-create.json file
 *   2. Create each issue in the repository
 *   3. Apply labels to each issue
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'bmordue';
const REPO_NAME = 'pic-map';
const ISSUES_FILE = path.join(__dirname, '..', 'docs', 'issues-to-create.json');

// Validate prerequisites
if (!GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is not set');
  console.error('Please set it with: export GITHUB_TOKEN=your_token_here');
  process.exit(1);
}

if (!fs.existsSync(ISSUES_FILE)) {
  console.error(`Error: Issues file not found at ${ISSUES_FILE}`);
  process.exit(1);
}

// Read issues from file
let issues;
try {
  const issuesData = fs.readFileSync(ISSUES_FILE, 'utf8');
  issues = JSON.parse(issuesData);
  console.log(`Loaded ${issues.length} issues to create`);
} catch (error) {
  console.error('Error reading or parsing issues file:', error.message);
  process.exit(1);
}

/**
 * Make a GitHub API request
 */
function githubRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'User-Agent': 'pic-map-issue-creator',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Create a single issue
 */
async function createIssue(issueData) {
  const { title, body, labels } = issueData;
  
  console.log(`\nCreating issue: "${title}"`);
  
  try {
    const result = await githubRequest(
      'POST',
      `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      {
        title,
        body,
        labels
      }
    );
    
    console.log(`✓ Created issue #${result.number}: ${result.html_url}`);
    return result;
  } catch (error) {
    console.error(`✗ Failed to create issue "${title}":`, error.message);
    throw error;
  }
}

/**
 * Create all issues with a delay between each to avoid rate limiting
 */
async function createAllIssues() {
  console.log(`\nStarting to create ${issues.length} issues...\n`);
  console.log('═'.repeat(60));
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < issues.length; i++) {
    try {
      const result = await createIssue(issues[i]);
      results.push(result);
      
      // Add a small delay to avoid rate limiting
      if (i < issues.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      errors.push({
        issue: issues[i].title,
        error: error.message
      });
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\nSummary:');
  console.log(`  ✓ Successfully created: ${results.length} issues`);
  
  if (errors.length > 0) {
    console.log(`  ✗ Failed: ${errors.length} issues`);
    console.log('\nFailed issues:');
    errors.forEach(({ issue, error }) => {
      console.log(`  - ${issue}: ${error}`);
    });
  }
  
  console.log('\nDone!');
}

// Run the script
createAllIssues().catch((error) => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
