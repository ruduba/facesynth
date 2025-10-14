# FaceSynth Deployment Guide

This guide covers deploying FaceSynth to production environments.

## Prerequisites

- Docker and Docker Compose
- Domain name (optional for production)
- SSL certificate (for HTTPS - required for camera access)
- OctoPrint instance (optional, for 3D printing features)

## Production Deployment

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd webfaceforge
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env.production
   ```

   Edit `.env.production`:
   ```env
   # Database
   DATABASE_URL=postgresql://postgres:STRONG_PASSWORD_HERE@db:5432/facesynth

   # Authentication
   NEXTAUTH_SECRET=generate-a-secure-random-string-here
   NEXTAUTH_URL=https://yourdomain.com
   JWT_SECRET=another-secure-random-string-here

   # Storage
   S3_ENDPOINT=http://minio:9000
   S3_ACCESS_KEY=your-access-key
   S3_SECRET_KEY=your-secret-key
   S3_BUCKET=facesynth

   # Node
   NODE_ENV=production
   ```

3. **Generate secure secrets**
   ```bash
   openssl rand -base64 32  # For NEXTAUTH_SECRET
   openssl rand -base64 32  # For JWT_SECRET
   ```

4. **Update docker-compose.yml for production**
   ```yaml
   version: '3.8'

   services:
     web:
       build:
         context: .
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
       env_file:
         - .env.production
       depends_on:
         - db
         - minio
       restart: unless-stopped
       command: npm start

     db:
       image: postgres:15-alpine
       env_file:
         - .env.production
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped

     minio:
       image: minio/minio:latest
       env_file:
         - .env.production
       volumes:
         - minio_data:/data
       restart: unless-stopped
       command: server /data --console-address ":9001"

     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf:ro
         - ./ssl:/etc/nginx/ssl:ro
       depends_on:
         - web
       restart: unless-stopped

   volumes:
     postgres_data:
     minio_data:
   ```

5. **Setup NGINX reverse proxy**
   Create `nginx.conf`:
   ```nginx
   events {
     worker_connections 1024;
   }

   http {
     upstream facesynth {
       server web:3000;
     }

     server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
     }

     server {
       listen 443 ssl http2;
       server_name yourdomain.com;

       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;

       client_max_body_size 50M;

       location / {
         proxy_pass http://facesynth;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection 'upgrade';
         proxy_set_header Host $host;
         proxy_cache_bypass $http_upgrade;
       }
     }
   }
   ```

6. **Place SSL certificates**
   ```bash
   mkdir ssl
   # Copy your SSL certificate and key
   cp /path/to/cert.pem ssl/cert.pem
   cp /path/to/key.pem ssl/key.pem
   ```

7. **Build and start**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

8. **Run migrations and seed**
   ```bash
   docker-compose exec web npx prisma migrate deploy
   docker-compose exec web npm run seed
   ```

### Option 2: Manual Deployment

1. **Setup PostgreSQL**
   ```bash
   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib

   # Create database
   sudo -u postgres createdb facesynth
   sudo -u postgres psql -c "CREATE USER facesynthuser WITH PASSWORD 'yourpassword';"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE facesynth TO facesynthuser;"
   ```

2. **Install Node.js and dependencies**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Build application**
   ```bash
   npm run build
   ```

5. **Run migrations**
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

6. **Start with PM2**
   ```bash
   sudo npm install -g pm2
   pm2 start npm --name "facesynth" -- start
   pm2 save
   pm2 startup
   ```

## SSL/HTTPS Setup (Critical for Camera Access)

Camera access requires HTTPS or localhost. For production:

### Using Let's Encrypt (Free)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Using Self-Signed Certificate (Development)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem
```

## Database Backups

### Automated Backups

Create `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
docker-compose exec -T db pg_dump -U postgres facesynth > "$BACKUP_DIR/facesynth_$DATE.sql"
find $BACKUP_DIR -name "facesynth_*.sql" -mtime +7 -delete
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh
```

## Monitoring

### Health Check Endpoint

```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
```

### Logging

Configure logging in production:
```javascript
// next.config.js
module.exports = {
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
};
```

## Performance Optimization

1. **Enable caching**
   ```nginx
   # In nginx.conf
   location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
     expires 1y;
     add_header Cache-Control "public, immutable";
   }
   ```

2. **Enable compression**
   ```nginx
   gzip on;
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   gzip_min_length 256;
   ```

3. **Database connection pooling**
   ```javascript
   // lib/db.js
   import { PrismaClient } from '@prisma/client';

   const globalForPrisma = global;

   export const prisma = globalForPrisma.prisma || new PrismaClient({
     log: process.env.NODE_ENV === 'development' ? ['query'] : [],
   });

   if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
   ```

## Scaling

### Horizontal Scaling

Use a load balancer (e.g., NGINX, HAProxy) to distribute traffic:

```nginx
upstream facesynth_cluster {
    least_conn;
    server web1:3000;
    server web2:3000;
    server web3:3000;
}

server {
    location / {
        proxy_pass http://facesynth_cluster;
    }
}
```

### Database Scaling

Consider read replicas for heavy traffic:
```env
DATABASE_URL=postgresql://user:pass@primary:5432/facesynth
DATABASE_REPLICA_URL=postgresql://user:pass@replica:5432/facesynth
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong, unique secrets for JWT and session
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (ufw, iptables)
- [ ] Limit database access to localhost/private network
- [ ] Enable rate limiting
- [ ] Set up security headers
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Monitor logs for suspicious activity

### Security Headers (NGINX)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline';" always;
```

## Troubleshooting Production Issues

### Application won't start

1. Check logs:
   ```bash
   docker-compose logs web
   # or
   pm2 logs facesynth
   ```

2. Verify environment variables:
   ```bash
   docker-compose exec web env | grep DATABASE_URL
   ```

3. Check database connection:
   ```bash
   docker-compose exec web npx prisma db push --skip-generate
   ```

### Camera not working

1. Ensure HTTPS is enabled
2. Check browser console for permission errors
3. Verify CSP headers allow camera access

### OctoPrint connection fails

1. Verify firewall allows connection to OctoPrint
2. Test connection manually:
   ```bash
   curl http://PRINTER_IP/api/version -H "X-Api-Key: YOUR_KEY"
   ```
3. Check OctoPrint API is enabled in settings

### High CPU usage

1. Check for memory leaks:
   ```bash
   docker stats
   ```

2. Optimize Three.js rendering:
   - Reduce mesh complexity
   - Lower render quality
   - Enable hardware acceleration

## Maintenance

### Updating the application

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose down
docker-compose up -d --build

# Run migrations
docker-compose exec web npx prisma migrate deploy
```

### Database maintenance

```bash
# Vacuum database (PostgreSQL)
docker-compose exec db psql -U postgres -d facesynth -c "VACUUM ANALYZE;"

# Check database size
docker-compose exec db psql -U postgres -c "\l+"
```

## Cost Optimization

1. **Use object storage**: Move to AWS S3, DigitalOcean Spaces, or Backblaze B2 for file storage
2. **CDN**: Use Cloudflare for static assets
3. **Database**: Use managed PostgreSQL (AWS RDS, DigitalOcean)
4. **Compute**: Start with 2GB RAM, scale as needed

## Support and Updates

- Check GitHub issues for known problems
- Subscribe to security advisories
- Keep dependencies updated:
  ```bash
  npm audit
  npm update
  ```

## Rollback Procedure

If an update causes issues:

```bash
# Restore previous version
git checkout <previous-commit>

# Rebuild
docker-compose down
docker-compose up -d --build

# Restore database backup
docker-compose exec -T db psql -U postgres facesynth < /backups/facesynth_YYYYMMDD.sql
```