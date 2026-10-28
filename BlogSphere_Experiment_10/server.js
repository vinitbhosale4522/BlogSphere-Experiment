const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'posts.json');
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.json':'application/json; charset=utf-8' };

async function ensureData() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { await fs.access(DATA_FILE); } catch { await fs.writeFile(DATA_FILE, '[]', 'utf8'); }
}
async function readPosts() {
  await ensureData();
  try { const posts = JSON.parse(await fs.readFile(DATA_FILE, 'utf8')); return Array.isArray(posts) ? posts : []; }
  catch { return []; }
}
async function writePosts(posts) {
  await ensureData();
  await fs.writeFile(DATA_FILE, JSON.stringify(posts, null, 2), 'utf8');
}
function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) { reject(new Error('Request body too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}
async function serveStatic(res, pathname) {
  const requested = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const filePath = path.resolve(PUBLIC_DIR, '.' + path.normalize(requested));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(content);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' }); res.end('File not found'); }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/api/posts') {
      const posts = (await readPosts()).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
      return json(res, 200, posts);
    }
    if (req.method === 'POST' && url.pathname === '/api/posts') {
      let body;
      try { body = await readBody(req); }
      catch (err) { return json(res, 400, { error: err.message }); }
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const author = typeof body.author === 'string' ? body.author.trim() : '';
      const content = typeof body.content === 'string' ? body.content.trim() : '';
      if (!title || !author || !content) return json(res, 400, { error: 'Please enter title, author name, and content.' });
      if (title.length > 120 || author.length > 60 || content.length > 5000) return json(res, 400, { error: 'Please shorten the title, author name, or content.' });
      const posts = await readPosts();
      const post = { id: crypto.randomUUID(), title, author, content, createdAt: new Date().toISOString() };
      posts.push(post);
      await writePosts(posts);
      return json(res, 201, post);
    }
    const match = url.pathname.match(/^\/api\/posts\/([a-f0-9-]+)$/i);
    if (req.method === 'DELETE' && match) {
      const posts = await readPosts();
      const remaining = posts.filter(post => post.id !== match[1]);
      if (remaining.length === posts.length) return json(res, 404, { error: 'Post not found.' });
      await writePosts(remaining);
      return json(res, 200, { message: 'Post deleted.' });
    }
    if (req.method === 'GET' && !url.pathname.startsWith('/api/')) return serveStatic(res, url.pathname);
    return json(res, 404, { error: 'Route not found.' });
  } catch (error) {
    console.error(error);
    return json(res, 500, { error: 'Internal server error.' });
  }
});
server.listen(PORT, '0.0.0.0', () => console.log(`BlogSphere running at http://localhost:${PORT}`));
