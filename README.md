# Earth Link

A minimal MVP social posting web app built with Next.js 15 and MySQL.

## 🚀 Quick Start

**Start everything with one command:**

```bash
docker compose up --build
```

**That's it!** Open http://localhost:3000

- ✅ MySQL database runs in Docker
- ✅ Next.js frontend runs in Docker
- ✅ **Hot reload enabled** - edit any file → save → see changes instantly! 🔥

---

## Features

- 📝 Create, read, update, and delete posts
- 👤 Stub authentication (always logged in as Demo User)
- 🗄️ MySQL database with connection pooling
- 🎨 Modern UI with Tailwind CSS
- 🐳 Docker with hot reload for development
- 🚀 Server-side rendering
- 🔥 Fast refresh and instant code updates

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MySQL 8.0 via `mysql2`
- **Styling**: Tailwind CSS v4
- **Deployment**: Docker Compose

---

## Commands

```bash
# Start everything (first time)
docker compose up --build

# Start (after first time)
docker compose up

# Stop
docker compose down

# View logs
docker compose logs -f

# Reset database (delete all data)
docker compose down -v
docker compose up --build
```

### npm Scripts

```bash
npm run docker:up        # Start Docker
npm run docker:build     # Build and start
npm run docker:down      # Stop Docker
npm run docker:logs      # View logs
npm run docker:reset     # Reset everything

# Local development (without Docker)
npm run dev              # Requires MySQL running locally
```

---

## What's Running?

When you run `docker compose up`:

**MySQL (Backend)**
- Port: 3307 (external), 3306 (internal)
- Database: `earthlink_db`
- User: `earthlink`
- Password: `earthlink_password`

**Next.js (Frontend)**
- Port: 3000
- Hot reload: ✅ Enabled
- Environment: Development

---

## Project Structure

```
/app
  ├── layout.js          # Root layout
  ├── page.js            # Home page
  ├── /api               # API routes
  │   ├── /health        # Health check
  │   └── /posts         # Posts CRUD
  └── /components        # React components
      ├── PostModal.jsx  # Create post popup
      ├── PostList.jsx   # Display posts
      └── PostsPage.jsx  # Main feed

/lib
  ├── db.js              # MySQL connection
  └── initDb.js          # DB initialization

Dockerfile               # Docker image
docker-compose.yml       # Services configuration
```

---

## API Endpoints

### Health Check
- `GET /api/health` - Check API and database status

### Posts
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/[id]` - Get a single post
- `PATCH /api/posts/[id]` - Update a post
- `DELETE /api/posts/[id]` - Delete a post

---

## Database Schema

### users
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  handle VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  createdAt DATETIME NOT NULL,
  INDEX idx_handle (handle)
)
```

### posts
```sql
CREATE TABLE posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  authorId INT NOT NULL,
  body TEXT NOT NULL,
  createdAt DATETIME NOT NULL,
  FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_author (authorId),
  INDEX idx_created (createdAt)
)
```

---

## Development

### Hot Reload

The Docker setup includes **hot reload**:

1. Edit any file in `app/` or `lib/`
2. Save
3. Changes appear **instantly** in browser! ⚡

No rebuild needed!

### Environment Variables

Configuration is in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=development
  - DB_HOST=mysql
  - DB_PORT=3306
  - DB_USER=earthlink
  - DB_PASSWORD=earthlink_password
  - DB_NAME=earthlink_db
```

### Data Persistence

Database data is stored in Docker volume `mysql_data`:
- Survives container restarts
- Persists after `docker compose down`
- To reset: `docker compose down -v`

---

## Troubleshooting

### Port already in use?

```bash
# Stop containers
docker compose down

# Check what's using the port
lsof -i :3000
lsof -i :3307

# Kill process or change port in docker-compose.yml
```

### Changes not appearing?

```bash
# Hard refresh browser
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R

# Or restart web container
docker compose restart web
```

### Database connection error?

```bash
# Check MySQL is running
docker compose ps

# View logs
docker compose logs mysql

# Restart MySQL
docker compose restart mysql
```

### Need fresh start?

```bash
# Remove everything and start over
docker compose down -v
docker system prune -f
docker compose up --build
```

---

## Local Development (Without Docker)

If you prefer to run without Docker:

**1. Install MySQL locally**

**2. Create database:**
```sql
CREATE DATABASE earthlink_db;
CREATE USER 'earthlink'@'localhost' IDENTIFIED BY 'earthlink_password';
GRANT ALL PRIVILEGES ON earthlink_db.* TO 'earthlink'@'localhost';
```

**3. Create `.env.local`:**
```bash
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=earthlink
DB_PASSWORD=earthlink_password
DB_NAME=earthlink_db
```

**4. Run:**
```bash
npm install
npm run dev
```

---

## Deployment

The Docker setup is ready for deployment:

1. Update passwords in `docker-compose.yml`
2. Set `NODE_ENV=production`
3. Deploy to your preferred platform

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `docker compose up --build`
5. Submit a pull request

---

## License

MIT

---

## Quick Reference

```bash
# Start
docker compose up --build

# Stop
docker compose down

# Logs
docker compose logs -f web

# Reset
docker compose down -v && docker compose up --build
```

**Open:** http://localhost:3000

**Edit any file → Save → See changes instantly!** ✨
