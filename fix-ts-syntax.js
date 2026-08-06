const fs = require('fs');
let c = fs.readFileSync('lib/services/hr-dashboard.ts', 'utf8');
c = c.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync('lib/services/hr-dashboard.ts', c);
