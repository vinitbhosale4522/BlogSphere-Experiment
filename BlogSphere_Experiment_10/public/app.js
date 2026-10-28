const postForm = document.getElementById('postForm');
const postList = document.getElementById('postList');
const loading = document.getElementById('loading');
const emptyState = document.getElementById('emptyState');
const postCount = document.getElementById('postCount');
const formMessage = document.getElementById('formMessage');
const errorMessage = document.getElementById('errorMessage');
const publishBtn = document.getElementById('publishBtn');

function showError(message) { errorMessage.textContent = message; errorMessage.classList.remove('d-none'); }
function clearError() { errorMessage.textContent = ''; errorMessage.classList.add('d-none'); }
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently published' : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
function textElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}
function renderPosts(posts) {
  postList.replaceChildren();
  loading.classList.add('d-none');
  emptyState.classList.toggle('d-none', posts.length > 0);
  postCount.textContent = `${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`;
  posts.forEach(post => {
    const col = document.createElement('div'); col.className = 'col-12 col-md-6';
    const card = document.createElement('article'); card.className = 'post-card';
    const meta = textElement('p', 'post-meta mb-2', `By ${post.author} · ${formatDate(post.createdAt)}`);
    const title = textElement('h3', 'post-title mb-3', post.title);
    const content = textElement('p', 'post-content mb-4', post.content);
    const footer = document.createElement('div'); footer.className = 'd-flex justify-content-end border-top pt-3';
    const del = textElement('button', 'delete-btn', 'Delete post'); del.type = 'button';
    del.addEventListener('click', () => deletePost(post.id, del));
    footer.appendChild(del); card.append(meta, title, content, footer); col.appendChild(card); postList.appendChild(col);
  });
}
async function loadPosts() {
  clearError(); loading.classList.remove('d-none');
  try {
    const response = await fetch('/api/posts');
    if (!response.ok) throw new Error('Could not load blog posts.');
    renderPosts(await response.json());
  } catch (error) {
    loading.classList.add('d-none'); showError(`${error.message} Make sure the Node.js server is running.`);
  }
}
postForm.addEventListener('submit', async event => {
  event.preventDefault(); clearError(); formMessage.textContent = '';
  publishBtn.disabled = true; publishBtn.textContent = 'Publishing...';
  const data = new FormData(postForm);
  const post = { title: data.get('title').trim(), author: data.get('author').trim(), content: data.get('content').trim() };
  try {
    const response = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to publish post.');
    postForm.reset(); formMessage.textContent = 'Your story has been published successfully.'; await loadPosts();
  } catch (error) { showError(error.message); }
  finally { publishBtn.disabled = false; publishBtn.textContent = 'Publish post'; }
});
async function deletePost(id, button) {
  if (!confirm('Are you sure you want to delete this blog post?')) return;
  button.disabled = true; button.textContent = 'Deleting...'; clearError();
  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to delete post.');
    await loadPosts();
  } catch (error) { showError(error.message); button.disabled = false; button.textContent = 'Delete post'; }
}
loadPosts();
