# Earth Link

A minimal MVP social posting web app built with Next.js 14+ and MySQL.

## Features

- 📝 Create, read, update, and delete posts
- 👤 Stub authentication (always logged in as Demo User)
- 🗄️ MySQL database with connection pooling
- 🎨 Modern UI with Tailwind CSS
- 🐳 Docker support with MySQL service
- 🚀 Server-side rendering for initial page load

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: MySQL 8.0 via `mysql2`
- **Styling**: Tailwind CSS v4
- **Deployment**: Docker Compose with multi-stage build

## Project Structure

```
/app
  ├── layout.js
  ├── page.js
  ├── /api
  │   ├── /health
  │   │   └── route.js
  │   └── /posts
  │       ├── route.js
  │       └── /[id]
  │           └── route.js
  └── /components
      ├── PostForm.jsx
      ├── PostList.jsx
      └── PostsPage.jsx
/lib
  ├── db.js
  └── initDb.js
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API and database status

### Posts
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create a new post
- `GET /api/posts/[id]` - Get a single post
- `PATCH /api/posts/[id]` - Update a post
- `DELETE /api/posts/[id]` - Delete a post

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

## Running with Docker (Recommended)

### Prerequisites
- Docker
- Docker Compose

### Setup

1. **Build and start the services**
   ```bash
   docker compose up --build
   ```

   This will start:
   - MySQL 8.0 database on port 3307
   - Next.js web app on port 3000
   - Display welcome message with access URLs

2. **Access the application**
   ```
   http://localhost:3000
   ```

3. **Stop the services**
   ```bash
   docker compose down
   ```

### Data Persistence

Data is persisted in a Docker volume named `mysql_data`. This means:
- Your posts and database survive container restarts
- Data persists even after `docker compose down`
- To completely reset: `docker compose down -v` (removes volumes)

## Running Locally

### Prerequisites
- Node.js 20+
- MySQL 8.0+ installed and running locally
- npm

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up MySQL database**
   ```bash
   mysql -u root -p
   ```

   Then run:
   ```sql
   CREATE DATABASE earthlink_db;
   CREATE USER 'earthlink'@'localhost' IDENTIFIED BY 'earthlink_password';
   GRANT ALL PRIVILEGES ON earthlink_db.* TO 'earthlink'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` if needed to match your MySQL configuration.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

The database will be automatically initialized with:
- Tables created if they don't exist
- Demo user (id=1) created automatically

## Environment Variables

Create a `.env.local` file for local development:

```bash
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3307
DB_USER=earthlink
DB_PASSWORD=earthlink_password
DB_NAME=earthlink_db
```

For Docker, these are configured in `docker-compose.yml`.

## Development Notes

### Stub Authentication
The app uses stub authentication where all requests are treated as coming from the demo user (userId=1). This is for MVP purposes only.

### Database Initialization
The database automatically initializes on first run:
- Creates tables if they don't exist
- Creates demo user with id=1
- Tables use foreign key constraints and indexes

### Error Handling
- `400 Bad Request` - Invalid post data (empty body)
- `404 Not Found` - Post doesn't exist
- `403 Forbidden` - Trying to modify someone else's post
- `500 Internal Server Error` - Database or server errors

## Docker Services

### MySQL Service
- **Image**: mysql:8.0
- **Port**: 3306
- **Volume**: mysql_data (persists database)
- **Healthcheck**: Ensures MySQL is ready before starting web service

### Web Service
- **Build**: Multi-stage Dockerfile with standalone output
- **Port**: 3000
- **Dependencies**: Waits for MySQL to be healthy
- **Environment**: Configured to connect to MySQL service

## Production Build

To build for production:

```bash
npm run build
npm start
```

Or with Docker:

```bash
docker compose up --build
```

## API Testing

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Create a Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"body":"Hello, World!"}'
```

### Get All Posts
```bash
curl http://localhost:3000/api/posts
```

### Delete a Post
```bash
curl -X DELETE http://localhost:3000/api/posts/1
```

## Troubleshooting

### MySQL Connection Issues
- Check if MySQL is running: `docker compose ps`
- Check logs: `docker compose logs mysql`
- Verify environment variables in `.env.local` or `docker-compose.yml`

### Port Already in Use
- MySQL (3307): Change external port mapping in `docker-compose.yml`
- Web (3000): Change port mapping in `docker-compose.yml`

### Viewing Startup Messages
When you run `docker compose up`, you'll see:
- MySQL health check status
- Web application startup message with access URLs
- Database connection confirmation

## Future Enhancements

- Real user authentication and authorization
- User registration and profiles
- Post editing interface
- Like/comment functionality
- Pagination for post lists
- Search functionality
- Image uploads
- Real-time updates with WebSockets

## License

MIT
