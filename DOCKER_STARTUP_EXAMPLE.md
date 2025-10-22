# Docker Startup Example

When you run `docker compose up --build`, you'll see output like this:

## Initial Build

```bash
$ docker compose up --build

[+] Building 45.2s (18/18) FINISHED
 => [web internal] load build definition from Dockerfile
 => => transferring dockerfile: 1.25kB
 => [web internal] load .dockerignore
 => [web] building...
 => [mysql] pulling image mysql:8.0
...
```

## Services Starting

```bash
[+] Running 2/2
 ✔ Container earthlink_mysql  Started
 ✔ Container earthlink_web    Started

Attaching to earthlink_mysql, earthlink_web
```

## MySQL Initialization

```bash
earthlink_mysql  | 2024-10-22 12:00:00+00:00 [Note] [Entrypoint]: Entrypoint script for MySQL Server 8.0.35-1.el8 started.
earthlink_mysql  | 2024-10-22 12:00:01+00:00 [Note] [Entrypoint]: Initializing database files
earthlink_mysql  | 2024-10-22 12:00:05+00:00 [Note] [Server]: mysqld (mysqld 8.0.35) starting as process 1
earthlink_mysql  | 2024-10-22 12:00:05+00:00 [Note] [Server]: Ready for connections.
```

## Application Startup Message

```bash
earthlink_web    | 
earthlink_web    | ╔════════════════════════════════════════════════════════════╗
earthlink_web    | ║                                                            ║
earthlink_web    | ║         🌍 Earth Link - Social Posts Application         ║
earthlink_web    | ║                                                            ║
earthlink_web    | ╚════════════════════════════════════════════════════════════╝
earthlink_web    | 
earthlink_web    | ✅ Application is starting...
earthlink_web    | ✅ Database: MySQL (connected to mysql:3306)
earthlink_web    | 
earthlink_web    | 🌐 Access the application at:
earthlink_web    | 
earthlink_web    |    👉  http://localhost:3000
earthlink_web    | 
earthlink_web    | 📊 API Health Check:
earthlink_web    |    http://localhost:3000/api/health
earthlink_web    | 
earthlink_web    | ════════════════════════════════════════════════════════════
earthlink_web    | 
earthlink_web    | ✅ MySQL connection established
earthlink_web    | ✅ Demo user created with id=1
earthlink_web    | ✅ Database initialized successfully
```

## Ready to Use!

At this point:
- ✅ MySQL is running on `localhost:3307`
- ✅ Web app is running on `localhost:3000`
- ✅ Database tables are created
- ✅ Demo user exists

Just open your browser to **http://localhost:3000** and start posting! 🎉

## Stopping Services

```bash
# Press Ctrl+C to stop
^CGracefully stopping... (press Ctrl+C again to force)

# Or in another terminal
docker compose down
```

## Viewing Logs

```bash
# All services
docker compose logs -f

# Only web app
docker compose logs -f web

# Only MySQL
docker compose logs -f mysql
```

