# FaceSynth

A responsive web application for end-to-end real-time facial mesh editing with Y2K/2000s Windows aesthetic. Create, edit, and 3D print custom facial meshes with camera tracking, sculpting tools, and OctoPrint integration.

## Features

- **Real-time Face Capture**: MediaPipe face mesh tracking with 468 landmarks
- **Character-Creator Style Controls**: Sliders for jaw, chin, mouth, nose, eyes, cheeks, and face scale
- **Sculpting Tools**: Brush-based sculpting with inflate/deflate, smooth, and custom transforms
- **Undo/Redo**: Full action history with 50-step stack
- **Export Formats**: STL, OBJ, PLY for 3D printing and modeling
- **3D Print Integration**: OctoPrint API integration with job status tracking
- **Mesh Library**: Save, organize, and version your creations
- **Presets**: Fun predefined meshes (long chin, alien, clown mouth, etc.)
- **User Authentication**: Secure login with bcrypt and JWT
- **Y2K Aesthetic**: Classic Windows 2000s styling

## Tech Stack

- **Frontend**: Next.js (Pages Router), React 18, JavaScript
- **3D Graphics**: Three.js (r159), MediaPipe Face Mesh
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: MinIO (S3-compatible) or local uploads
- **Authentication**: JWT with HttpOnly cookies
- **Containerization**: Docker Compose

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- OctoPrint instance (optional, for 3D printing features)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd webfaceforge
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your settings:

```env
DATABASE_URL=postgresql://postgres:password@db:5432/facesynth
NEXTAUTH_SECRET=your-super-secret-key-change-this
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=another-secret-key-for-jwt
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=facesynth
NODE_ENV=development
```

### 3. Start with Docker Compose

```bash
docker-compose up --build
```

This will:
- Build the Next.js application
- Start PostgreSQL database
- Start MinIO for file storage
- Run database migrations
- Seed preset meshes
- Start the app on http://localhost:3000

### 4. Access the Application

Open http://localhost:3000 in your browser.

**Important**: Camera access requires HTTPS or localhost. Use localhost for development.

## Local Development (without Docker)

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed presets
npm run seed

# Start development server
npm run dev
```

## OctoPrint Integration

### Setting Up OctoPrint

1. Install OctoPrint on a Raspberry Pi or computer: https://octoprint.org/download/
2. Enable API access in OctoPrint settings
3. Generate an API key in OctoPrint: Settings → Application Keys

### Registering a Printer in FaceSynth

1. Navigate to the Print page after login
2. Click "Add Printer"
3. Enter:
   - Printer name (e.g., "My Ender 3")
   - OctoPrint URL (e.g., `http://192.168.1.100`)
   - API Key (from OctoPrint)
4. Click "Test Connection" to verify
5. Save the printer

### Testing Print Functionality

Use the "Print Test Nose" feature to send a small test model to your printer:

1. Select your registered printer
2. Click "Print Test Nose"
3. Monitor print progress in real-time

### Print Settings

Configure print parameters:
- **Scale**: Resize model (50-200%)
- **Infill**: Density percentage (10-100%)
- **Supports**: Enable/disable support structures
- **Material**: PLA, ABS, PETG (for reference)

## API Endpoints

### Authentication

```
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/logout
GET  /api/user/me
POST /api/user/tutorial-seen
```

### Meshes

```
GET    /api/meshes              # List user meshes
GET    /api/meshes/:id          # Get mesh details
POST   /api/meshes              # Create/save mesh
PUT    /api/meshes/:id          # Update mesh
DELETE /api/meshes/:id          # Delete mesh
POST   /api/meshes/:id/version  # Save version
GET    /api/meshes/:id/download # Download STL/OBJ/PLY
```

### Presets

```
GET /api/presets                # List all presets
GET /api/presets/:id            # Get preset details
```

### Folders

```
GET    /api/library/folders     # List folders
POST   /api/library/folders     # Create folder
DELETE /api/library/folders/:id # Delete folder
PUT    /api/meshes/:id/folder   # Move mesh to folder
```

### Printers (OctoPrint)

```
GET    /api/printers             # List user printers
POST   /api/printers             # Register printer
DELETE /api/printers/:id         # Remove printer
POST   /api/printers/:id/upload  # Upload STL to printer
POST   /api/printers/:id/print   # Start print job
GET    /api/printers/:id/job     # Get job status
POST   /api/printers/:id/cancel  # Cancel print
POST   /api/printers/:id/pause   # Pause print
POST   /api/printers/:id/resume  # Resume print
```

## Testing

### Run Unit Tests

```bash
npm test
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

Tests cover:
- Authentication flows (signup, login, logout)
- Mesh CRUD operations
- Export functionality
- Undo/redo operations
- Printer registration and status

## Project Structure

```
facesynth/
├── components/          # React components
│   ├── Auth/           # Login, signup, tutorial
│   ├── Editor/         # Mesh editor components
│   ├── Library/        # Library grid and management
│   ├── Presets/        # Preset browser
│   └── UI/             # Shared UI components
├── lib/                # Utilities and helpers
│   ├── auth.js         # Authentication utilities
│   ├── facemesh-triangles.js  # MediaPipe triangulation
│   ├── mesh-utils.js   # Mesh deformation and sculpting
│   ├── stlExport.js    # Export utilities
│   └── octoprint-client.js    # OctoPrint API client
├── pages/              # Next.js pages
│   ├── api/            # API routes
│   ├── auth/           # Auth pages
│   ├── editor/         # Mesh editor
│   ├── library.jsx     # Mesh library
│   ├── presets.jsx     # Presets browser
│   └── index.jsx       # Dashboard
├── prisma/             # Database schema
├── public/             # Static assets
│   └── assets/
│       └── style.css   # Y2K styling
└── scripts/            # Utility scripts
    └── seed-presets.js # Preset seeding
```

## Keyboard Shortcuts

### Editor

- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Ctrl/Cmd + S`: Save mesh
- `Space`: Toggle camera feed
- `W`: Toggle wireframe
- `R`: Reset to baseline

## Security Checklist

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with HttpOnly cookies
- ✅ OctoPrint API keys encrypted at rest
- ✅ Input validation on all endpoints
- ✅ CORS configured for production
- ✅ File upload size limits enforced
- ✅ SQL injection protection via Prisma
- ✅ XSS protection via React escaping

## Troubleshooting

### Camera Not Working

- Ensure you're using HTTPS or localhost
- Check browser permissions for camera access
- Try a different browser (Chrome/Edge recommended)

### OctoPrint Connection Failed

- Verify OctoPrint is running and accessible
- Check firewall settings
- Ensure API key is correct
- Test connection manually: `curl http://<ip>/api/version -H "X-Api-Key: <key>"`

### Database Connection Issues

- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in `.env`
- Run migrations: `npx prisma migrate deploy`

### Build Errors

- Clear node_modules: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`
- Rebuild Docker containers: `docker-compose up --build --force-recreate`

## Performance Tips

- Use Chrome/Edge for best Three.js performance
- Reduce mesh complexity for slower devices
- Enable hardware acceleration in browser
- Close other tabs when editing large meshes
- Use wireframe mode for faster interaction

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Credits

- MediaPipe Face Mesh by Google
- Three.js 3D library
- Y2K CSS inspiration from classic Windows design

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: <repository-url>/wiki