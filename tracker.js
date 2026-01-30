// Project Tracker - Simple CRUD operations
// Data is stored in projects.json

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'projects.json');

// Helper to read projects
function readProjects() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { projects: [] };
  }
}

// Helper to write projects
function writeProjects(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Add a project
function addProject(name, description = '', status = 'ideas', tags = []) {
  const data = readProjects();
  const project = {
    id: Date.now().toString(),
    name,
    description,
    status,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  data.projects.push(project);
  writeProjects(data);
  return project;
}

// List all projects
function listProjects(filter = null) {
  const data = readProjects();
  if (!filter) return data.projects;
  
  // Simple status filter
  return data.projects.filter(p => 
    p.status === filter || 
    p.name.toLowerCase().includes(filter.toLowerCase())
  );
}

// Get a single project
function getProject(nameOrId) {
  const data = readProjects();
  return data.projects.find(p => 
    p.id === nameOrId || 
    p.name.toLowerCase() === nameOrId.toLowerCase()
  );
}

// Update a project
function updateProject(nameOrId, updates) {
  const data = readProjects();
  const project = data.projects.find(p => 
    p.id === nameOrId || 
    p.name.toLowerCase() === nameOrId.toLowerCase()
  );
  
  if (!project) return null;
  
  // Apply updates
  Object.assign(project, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
  
  writeProjects(data);
  return project;
}

// Delete a project
function deleteProject(nameOrId) {
  const data = readProjects();
  const index = data.projects.findIndex(p => 
    p.id === nameOrId || 
    p.name.toLowerCase() === nameOrId.toLowerCase()
  );
  
  if (index === -1) return false;
  
  data.projects.splice(index, 1);
  writeProjects(data);
  return true;
}

// Export functions
module.exports = {
  addProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  readProjects
};

// CLI for testing
if (require.main === module) {
  const command = process.argv[2];
  
  switch(command) {
    case 'add':
      const name = process.argv[3];
      const desc = process.argv[4] || '';
      const proj = addProject(name, desc);
      console.log('Added:', proj.name);
      break;
    case 'list':
      const projects = listProjects();
      console.log('Projects:', projects.length);
      projects.forEach(p => console.log('-', p.name, '[' + p.status + ']'));
      break;
    default:
      console.log('Usage: node tracker.js <add|list> [args]');
  }
}
