#!/usr/bin/env node
/**
 * Night Coder Script
 * Runs at 10:30pm EST to code nightly projects
 * 
 * Usage: node night-coder.js
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const WORKSPACE = __dirname;

// Helper to read projects
function readProjects() {
    try {
        const data = fs.readFileSync(PROJECTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return { projects: [] };
    }
}

// Helper to write projects
function writeProjects(data) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2));
}

// Find the project marked for tonight
function getTonightProject() {
    const data = readProjects();
    return data.projects.find(p => p.status === 'tonight');
}

// Create a new project based on type
function createProject(project) {
    const projectDir = path.join(WORKSPACE, 'apps', project.name.toLowerCase().replace(/\s+/g, '-'));
    
    if (fs.existsSync(projectDir)) {
        console.log(`Project directory already exists: ${projectDir}`);
        return projectDir;
    }
    
    fs.mkdirSync(projectDir, { recursive: true });
    
    // Create basic project structure based on project type
    const tags = project.tags || [];
    
    if (tags.includes('security')) {
        createSecurityProject(projectDir, project);
    } else if (tags.includes('cli')) {
        createCLIProject(projectDir, project);
    } else {
        createBasicProject(projectDir, project);
    }
    
    return projectDir;
}

function createSecurityProject(dir, project) {
    // Security project template
    fs.writeFileSync(path.join(dir, 'index.js'), `/**
 * ${project.name}
 * ${project.description}
 * 
 * Run: node index.js
 */

const fs = require('fs');
const readline = require('readline');

async function main() {
    console.log('🔒 ${project.name}');
    console.log('='.repeat(40));
    console.log('${project.description}');
    console.log('');
    
    // TODO: Implement the actual functionality
    
    console.log('Ready to scan. Enter path or press Enter to exit:');
}

main().catch(console.error);
`);
    
    fs.writeFileSync(path.join(dir, 'README.md'), `# ${project.name}

${project.description}

## Usage

\`\`\`bash
cd ${path.basename(dir)}
node index.js
\`\`\`

## Features

- Feature 1
- Feature 2

## Setup

No dependencies required. Just Node.js.

## Author

Built by Brian with AI assistance (Data)
`);
    
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        name: path.basename(dir),
        version: '1.0.0',
        description: project.description,
        main: 'index.js',
        scripts: { start: 'node index.js' },
        keywords: project.tags || []
    }, null, 2));
}

function createCLIProject(dir, project) {
    // CLI project template
    fs.writeFileSync(path.join(dir, 'index.js'), `#!/usr/bin/env node
/**
 * ${project.name}
 * ${project.description}
 */

const args = process.argv.slice(2);

function main() {
    console.log('${project.name}');
    console.log('='.repeat(40));
    
    if (args.length === 0) {
        console.log('Usage: node index.js <input>');
        console.log('');
        console.log('Example: node index.js hello');
        return;
    }
    
    const input = args.join(' ');
    console.log('Input:', input);
    
    // TODO: Implement functionality
}

main();
`);
    
    fs.writeFileSync(path.join(dir, 'README.md'), `# ${project.name}

${project.description}

## Usage

\`\`\`bash
cd ${path.basename(dir)}
node index.js <input>
\`\`\`

## Example

\`\`\`bash
$ node index.js example
Output here
\`\`\`
`);
}

function createBasicProject(dir, project) {
    // Basic project template
    fs.writeFileSync(path.join(dir, 'index.js'), `/**
 * ${project.name}
 * ${project.description}
 */

console.log('${project.name}');
console.log('='.repeat(40));
console.log('${project.description}');
console.log('');
console.log('TODO: Implement functionality');
`);
    
    fs.writeFileSync(path.join(dir, 'README.md'), `# ${project.name}

${project.description}

## Usage

\`\`\`bash
cd ${path.basename(dir)}
node index.js
\`\`\`
`);
}

// Main execution
async function runNightCoder() {
    console.log('🌙 Night Coder Starting...');
    console.log('');
    
    const project = getTonightProject();
    
    if (!project) {
        console.log('No project marked for tonight. Checking for overdue projects...');
        const data = readProjects();
        const overdue = data.projects.filter(p => p.status === 'overdue');
        if (overdue.length > 0) {
            console.log(`Found ${overdue.length} overdue projects. Skipping for now.`);
        } else {
            console.log('All projects are up to date!');
        }
        return;
    }
    
    console.log(`📦 Tonight's Project: ${project.name}`);
    console.log(`   ${project.description}`);
    console.log('');
    
    // Create the project
    console.log('🔧 Creating project structure...');
    const projectDir = createProject(project);
    console.log(`   Created: ${projectDir}`);
    console.log('');
    
    // Update project status
    console.log('📝 Updating project tracker...');
    const data = readProjects();
    const idx = data.projects.findIndex(p => p.id === project.id);
    if (idx !== -1) {
        data.projects[idx].status = 'building';
        data.projects[idx].updatedAt = new Date().toISOString();
        writeProjects(data);
    }
    console.log('   Status updated to "building"');
    console.log('');
    
    // Git operations
    console.log('📤 Committing to git...');
    try {
        execSync('git add -A', { cwd: WORKSPACE });
        const date = new Date().toISOString().split('T')[0];
        execSync(`git commit -m "Nightly: ${project.name} (${date})"`, { cwd: WORKSPACE });
        console.log('   Committed!');
    } catch (e) {
        console.log('   Git commit skipped (no changes or error)');
    }
    console.log('');
    
    console.log('✅ Night Coder complete!');
    console.log(`   Project ready at: ${projectDir}`);
    console.log('');
    console.log('Brian will find it when he wakes up at 7am! 🌙');
}

// Run if called directly
if (require.main === module) {
    runNightCoder().catch(console.error);
}

module.exports = { runNightCoder, createProject, getTonightProject };
