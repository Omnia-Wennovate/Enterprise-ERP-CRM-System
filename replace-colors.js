const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'components');
const appPath = path.join(__dirname, 'app');

const replacements = [
  { regex: /bg-\[\#F0F7FA\]/g, replacement: 'bg-background' },
  { regex: /bg-\[\#F8FAFC\]/g, replacement: 'bg-muted' },
  { regex: /bg-\[\#F1F5F9\]/g, replacement: 'bg-muted' },
  { regex: /text-\[\#0B1F33\]/g, replacement: 'text-foreground' },
  { regex: /bg-white/g, replacement: 'bg-card' },
  { regex: /bg-\[\#0B2A3D\]/g, replacement: 'bg-sidebar' },
  { regex: /bg-\[\#0A2D42\]/g, replacement: 'bg-sidebar-accent' },
  { regex: /bg-\[\#0A8FA8\]/g, replacement: 'bg-primary' },
  { regex: /text-\[\#0A8FA8\]/g, replacement: 'text-primary' },
  { regex: /hover:bg-\[\#0A8FA8\]/g, replacement: 'hover:bg-primary' },
  { regex: /border-\[\#0A8FA8\]/g, replacement: 'border-primary' },
  { regex: /hover:border-\[\#0A8FA8\]/g, replacement: 'hover:border-primary' },
  { regex: /border-\[\#BFDBFE\]/g, replacement: 'border-border' },
  { regex: /border-\[\#DBEAFE\]/g, replacement: 'border-border' },
  { regex: /border-\[\#E2E8F0\]/g, replacement: 'border-border' },
  { regex: /text-\[\#94A3B8\]/g, replacement: 'text-muted-foreground' },
  { regex: /text-\[\#4B6B7A\]/g, replacement: 'text-muted-foreground' },
  { regex: /text-\[\#64748B\]/g, replacement: 'text-muted-foreground' },
  { regex: /text-\[\#38BDF8\]/g, replacement: 'text-accent-foreground' },
  { regex: /hover:bg-\[\#0D3A52\]/g, replacement: 'hover:bg-sidebar-accent' },
  { regex: /border-\[\#0D3A52\]/g, replacement: 'border-sidebar-border' },
  { regex: /bg-\[\#0D3A52\]/g, replacement: 'bg-sidebar-accent' },
  { regex: /text-\[\#EF4444\]/g, replacement: 'text-destructive' },
  { regex: /bg-\[\#EF4444\]/g, replacement: 'bg-destructive' },
  { regex: /bg-\[\#FEF2F2\]/g, replacement: 'bg-destructive/10' },
  { regex: /border-\[\#FECACA\]/g, replacement: 'border-destructive/20' },
  { regex: /text-\[\#10B981\]/g, replacement: 'text-success' },
  { regex: /bg-\[\#ECFDF5\]/g, replacement: 'bg-success/10' },
  { regex: /text-\[\#F59E0B\]/g, replacement: 'text-warning' },
  { regex: /bg-\[\#FFFBEB\]/g, replacement: 'bg-warning/10' },
  { regex: /bg-\[\#E0EEF5\]/g, replacement: 'bg-primary/10' },
  { regex: /bg-\[\#E0F2F7\]/g, replacement: 'bg-primary/10' },
  { regex: /hover:bg-\[\#E0F2F7\]/g, replacement: 'hover:bg-primary/20' },
  { regex: /hover:bg-\[\#088096\]/g, replacement: 'hover:bg-primary/90' },
  { regex: /hover:bg-\[\#076B85\]/g, replacement: 'hover:bg-primary/90' },
  { regex: /bg-\[\#0A8FA8\]\/10/g, replacement: 'bg-primary/10' },
  { regex: /ring-\[\#0A8FA8\]\/20/g, replacement: 'ring-primary/20' },
  { regex: /bg-\[\#EFF6FF\]/g, replacement: 'bg-blue-500/10' },
  { regex: /text-\[\#3B82F6\]/g, replacement: 'text-blue-500' },
  { regex: /border-\[\#0A8FA8\]\/20/g, replacement: 'border-primary/20' },
  { regex: /text-white/g, replacement: 'text-primary-foreground' },
  { regex: /bg-slate-50/g, replacement: 'bg-muted/50' },
  { regex: /bg-slate-100/g, replacement: 'bg-muted' },
  { regex: /bg-slate-800/g, replacement: 'bg-sidebar' },
  { regex: /bg-slate-900/g, replacement: 'bg-sidebar' },
  { regex: /text-slate-500/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-400/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-600/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-900/g, replacement: 'text-foreground' },
  { regex: /text-slate-800/g, replacement: 'text-foreground' },
  { regex: /border-slate-200/g, replacement: 'border-border' },
  { regex: /border-slate-300/g, replacement: 'border-border' },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directoryPath);
if (fs.existsSync(appPath)) {
  processDirectory(appPath);
}

console.log('Color replacement complete.');
