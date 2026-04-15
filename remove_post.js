const fs = require('fs');

const file = '/root/.openclaw/workspace/github_deploy/posts.js';
const dataStr = fs.readFileSync(file, 'utf8');

const prefix = "window.POSTS_DATA = ";
let jsonStr = dataStr.trim();
if (jsonStr.startsWith(prefix)) {
    jsonStr = jsonStr.slice(prefix.length);
}
if (jsonStr.endsWith(";")) {
    jsonStr = jsonStr.slice(0, -1);
}

const posts = JSON.parse(jsonStr);

// Filter out the Custom Orchestrator vs Salebot post
const filteredPosts = posts.filter(p => !p.html_content.includes("УБИЙСТВО КОСТЫЛЕЙ — ПЕРЕЕЗД С SALEBOT НА КАСТОМНЫЙ ОРКЕСТРАТОР"));

const newContent = prefix + JSON.stringify(filteredPosts, null, 2) + ";";

fs.writeFileSync(file, newContent);
console.log(`Filtered out ${posts.length - filteredPosts.length} post(s).`);