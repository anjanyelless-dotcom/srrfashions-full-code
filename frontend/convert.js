import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath = path.join(__dirname, 'indexdata.html');
const indexPath = path.join(__dirname, 'index.html');
const appPath = path.join(__dirname, 'App.jsx');

const html = fs.readFileSync(sourcePath, 'utf8');

// Clean up the malformed original head so it can be parsed by Vite
let cleaned = html
  // Remove the old commented-out head block
  .replace(/<!--\s*<head>[\s\S]*?<\/head>\s*-->/, '')
  // Remove the stray meta before <head>
  .replace(/<meta http-equiv="content-type" content="text\/html;charset=UTF-8" \/>\s*<!-- \/Added by HTTrack -->\s*/i, '')
  // Remove the nested <head> that exists inside the real <head>
  .replace(/(<head>[\s\S]*?)<head>/, '$1')
  // Remove the duplicate closing head tag
  .replace(/<\/head>\s*<\/head>/, '</head>');

// Extract the head and body
const headMatch = cleaned.match(/(<!DOCTYPE html>[\s\S]*?<\/head>)/i);
if (!headMatch) throw new Error('Could not find <head> in source');
const head = headMatch[1];

const bodyMatch = cleaned.match(/(<body([^>]*)>)([\s\S]*?)(<\/body>)/i);
if (!bodyMatch) throw new Error('Could not find <body> in source');
const openingBodyTag = bodyMatch[1];
const bodyAttrs = bodyMatch[2].trim();
const bodyContent = bodyMatch[3];
const closingBodyTag = bodyMatch[4];

// Escape the body HTML for embedding inside a JS template literal
const bodyHtml = bodyContent
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

// Build the App component that injects the original body HTML exactly
// and re-dispatches DOMContentLoaded so original plugin initializers
// (e.g. th-store-one shoppable video slider) run after the markup exists.
const appContent = `import React, { useEffect } from 'react';\n\nconst bodyHtml = \`${bodyHtml}\`;\n\nfunction App() {\n  useEffect(() => {\n    document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: false }));\n  }, []);\n\n  return (\n    <div\n      dangerouslySetInnerHTML={{ __html: bodyHtml }}\n    />\n  );\n}\n\nexport default App;\n`;

fs.writeFileSync(appPath, appContent, 'utf8');

// Keep the bottom <script> tags in the HTML so external plugins can still load
const bottomScriptsMatch = bodyContent.match(/<script[\s\S]*$/i);
const bottomScripts = bottomScriptsMatch ? bottomScriptsMatch[0].trim() : '';

// global.css is loaded by the main.jsx import so Vite can bundle it correctly;
// keep the original <head> but remove the raw global.css link to avoid Vite
// serving the CSS as a JavaScript module.
const headWithoutGlobal = head.replace(/<link[^>]*href="global\.css"[^>]*>\s*/i, '');

const newHtml = `${headWithoutGlobal}\n${openingBodyTag}\n  <div id="root"></div>\n  <script type="module" src="/main.jsx"></script>\n  ${bottomScripts}\n${closingBodyTag}\n`;

fs.writeFileSync(indexPath, newHtml, 'utf8');

console.log('Generated App.jsx and index.html with original body preserved.');
