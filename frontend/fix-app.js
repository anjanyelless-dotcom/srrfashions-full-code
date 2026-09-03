import fs from 'fs';

const appPath = 'App.jsx';
let app = fs.readFileSync(appPath, 'utf8');

// Remove inline style entries whose keys start with a leading dash (CSS custom properties
// mangled by htmltojsx).  These are not valid as JSX object keys, and the design is covered
// by the linked global.css.  We keep the remaining, valid style entries.
app = app.replace(/-[A-Za-z0-9_$]+\s*:\s*[^,{}]*(?:,\s*)?/g, (match) => {
  // Drop the entry along with its trailing comma (if any)
  return '';
});

// Clean up leftover leading/trailing/double commas in style={{...}} blocks
app = app.replace(/style=\{\{\s*,+/g, 'style={{');
app = app.replace(/,+\s*\}\}/g, '}}');

fs.writeFileSync(appPath, app);
console.log('Fixed invalid CSS custom property style keys in App.jsx');
