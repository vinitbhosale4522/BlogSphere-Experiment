# Experiment 10 — BlogSphere Mini Blog Web Application

## Aim
To develop a mini blog application that lets users publish, view, and delete blog posts.

## Requirements
- Node.js 18 or newer
- VS Code (recommended)
- Web browser
- Internet connection for Bootstrap CDN

## Project structure
```text
BlogSphere_Experiment_10/
├── server.js
├── package.json
├── data/posts.json
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

## Run locally
1. Install Node.js from https://nodejs.org if needed.
2. Extract this ZIP and open its folder in VS Code.
3. Choose Terminal → New Terminal.
4. Run `npm start`.
5. Open http://localhost:3000 in your browser.
6. Enter a title, author, and story, then click **Publish post**.
7. Verify the post appears under **Latest stories**. Use **Delete post** to remove it.

No database installation or `npm install` is needed; this uses Node.js built-in modules and stores posts in `data/posts.json`.

## Deploy on Render
1. Upload all files to a GitHub repository.
2. In https://render.com, create a Web Service connected to the repository.
3. Runtime: Node. Build command: `npm install`. Start command: `npm start`.
4. Deploy and open the generated URL.

Note: the JSON file is local storage. Cloud filesystems may be ephemeral; for durable production storage, use a persistent disk or hosted database.

## API routes
- `GET /api/posts` — list posts
- `POST /api/posts` — create a post
- `DELETE /api/posts/:id` — delete a post
