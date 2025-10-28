# 🚀 Quick Start Guide

## One Command to Start Everything

```bash
docker compose up --build
```

**That's it!** Open http://localhost:3000

---

## What You Get

✅ **MySQL Database** - Running on port 3307
✅ **Next.js Frontend** - Running on port 3000
✅ **Hot Reload** - Edit files, save, see changes instantly!
✅ **8 Demo Posts** - Pre-loaded content to get started

---

## Daily Workflow

```bash
# Day 1: First time setup
docker compose up --build

# Every other day: Just start it
docker compose up

# Edit code → Save → See changes instantly! ⚡

# When done
docker compose down
```

---

## Common Commands

```bash
# Start
docker compose up

# Start and rebuild
docker compose up --build

# Stop
docker compose down

# View logs
docker compose logs -f

# Reset database (delete all posts)
docker compose down -v
docker compose up --build
```

---

## Using npm Scripts

```bash
npm run docker:up        # Start
npm run docker:build     # Build and start
npm run docker:down      # Stop
npm run docker:logs      # View logs  
npm run docker:reset     # Reset everything
```

---

## File Structure

```
📁 Your Code (Edit these!)
├── app/
│   ├── page.js              ← Edit this!
│   ├── components/
│   │   ├── PostModal.jsx    ← Edit this!
│   │   ├── PostList.jsx     ← Edit this!
│   │   └── PostsPage.jsx    ← Edit this!
│   └── api/
│       └── posts/           ← API routes
└── lib/
    ├── db.js                ← Database connection
    └── initDb.js            ← Database setup

📁 Docker Config (Don't touch)
├── docker-compose.yml       ← Services config
├── Dockerfile               ← Docker image
└── docker-entrypoint-dev.sh ← Startup script
```

---

## Test Hot Reload

1. **Start Docker:**
   ```bash
   docker compose up
   ```

2. **Open browser:** http://localhost:3000

3. **Edit file:** Open `app/components/PostModal.jsx`

4. **Change line 81:**
   ```jsx
   // From:
   <h2>Create a Post</h2>
   
   // To:
   <h2>What's on your mind? 🚀</h2>
   ```

5. **Save** → Browser updates **instantly**! ⚡

---

## Troubleshooting

### Port already in use?
```bash
docker compose down
lsof -i :3000  # See what's using port 3000
```

### Changes not showing?
```bash
# Hard refresh
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R
```

### Need fresh start?
```bash
docker compose down -v
docker compose up --build
```

---

## What's Next?

- **Create posts** using the + button
- **Edit components** in `app/components/`
- **Add API routes** in `app/api/`
- **Modify database** in `lib/initDb.js`

---

## Remember

**One command:**
```bash
docker compose up
```

**Edit code → Save → See changes!** ✨

That's it! Simple. 🎉

