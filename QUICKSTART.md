# FaceSynth.exe - Quick Start Guide

Get FaceSynth.exe running in under 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- 4GB RAM minimum
- Modern web browser (Chrome/Edge recommended)

## Installation

### Step 1: Get the Code

```bash
# Clone the repository
git clone <repository-url>
cd webfaceforge
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# The defaults work for local development
# No changes needed for quick start!
```

### Step 3: Start the Application

```bash
# Build and start all services
docker-compose up --build

# Wait for the message: "ready - started server on 0.0.0.0:3000"
```

### Step 4: Open in Browser

```
http://localhost:3000
```

## First Time Setup

### 1. Create an Account

- Click "Sign up"
- Enter your name, email, and password
- Click "Sign Up"

### 2. Complete Tutorial

- Follow the 3-step tutorial or skip it
- You can replay it anytime from the dashboard

### 3. Create Your First Mesh

**Option A: From Camera**
1. Click "Create New Mesh"
2. Allow camera access when prompted
3. Click "Start Camera"
4. Position your face in frame
5. Click "Capture Neutral Face"
6. Adjust sliders to modify features
7. Click "Save"

**Option B: From Preset**
1. Click "Check Out Presets"
2. Select a fun preset (Alien, Clown Mouth, etc.)
3. Click "Use This Preset"
4. Modify it with sliders
5. Click "Save"

## Key Features to Try

### Mesh Editing

**Character Controls:**
- Jaw Width: Make jaw wider/narrower
- Chin Height: Extend/shorten chin
- Mouth Width: Adjust smile width
- Nose Length: Make nose longer/shorter
- Eye Size: Enlarge/shrink eyes
- Eye Spacing: Move eyes closer/farther
- Cheek Puff: Inflate/deflate cheeks
- Face Scale: Overall size

**Tips:**
- All sliders have min/neutral/max ranges
- Changes are smooth and organic
- Use Reset button to start over
- Undo/Redo with Ctrl+Z / Ctrl+Y

### Export Your Mesh

1. Click "Export" in the editor
2. Choose format:
   - **STL**: Best for 3D printing
   - **OBJ**: For Blender/Maya
   - **PLY**: For MeshLab
3. Click "Export"
4. File downloads automatically

### 3D Printing Setup (Optional)

**Requirements:**
- OctoPrint installed on Raspberry Pi or computer
- 3D printer connected to OctoPrint

**Steps:**
1. Go to Print page
2. Click "+ Add Printer"
3. Enter:
   - Name: "My Printer"
   - URL: `http://192.168.1.100` (your OctoPrint IP)
   - API Key: From OctoPrint Settings → Application Keys
4. Select your printer
5. Select a mesh
6. Click "Start Print"

**Test First:**
- Use "Print Test Nose" button
- Sends a small test object
- Verifies connection works

## Troubleshooting

### Camera Not Working

**Problem:** "Camera access denied"

**Solutions:**
1. Grant camera permission in browser
2. Use HTTPS or localhost (not 192.168.x.x)
3. Try different browser (Chrome recommended)
4. Check if camera is used by another app

**Alternative:** Use "Create from Preset" instead

### Docker Issues

**Problem:** "Port 3000 already in use"

**Solution:**
```bash
# Stop other services on port 3000
docker-compose down
lsof -ti:3000 | xargs kill -9

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 instead
```

**Problem:** "Database connection failed"

**Solution:**
```bash
# Restart all services
docker-compose down -v
docker-compose up --build
```

### OctoPrint Connection Failed

**Problem:** "Failed to connect to OctoPrint"

**Checklist:**
- [ ] OctoPrint is running (access web interface)
- [ ] IP address is correct
- [ ] API key is valid
- [ ] Firewall allows connection
- [ ] Both on same network

**Test manually:**
```bash
curl http://YOUR_IP/api/version \
  -H "X-Api-Key: YOUR_KEY"

# Should return version info
```

## Common Questions

### Q: Can I use this without a camera?

Yes! Use the "Check Out Presets" option to start with pre-made meshes.

### Q: Where are my files stored?

- **Development:** `uploads/` folder
- **Production:** MinIO/S3 bucket
- **Exports:** Downloaded to your computer

### Q: Can I edit meshes offline?

No, the app requires server connection. However, exported STL files work offline in any 3D software.

### Q: How do I backup my meshes?

```bash
# Backup database
docker-compose exec db pg_dump -U postgres facesynth > backup.sql

# Backup uploads
tar -czf uploads-backup.tar.gz uploads/
```

### Q: Can multiple users access this?

Yes! Each user has their own account and private mesh library.

## Advanced Usage

### Custom Styling

Edit `public/assets/style.css` to customize the Y2K aesthetic:

```css
:root {
  --primary-blue: #0066cc;  /* Change main color */
  --bg-window: #ece9d8;     /* Change background */
}
```

### Add More Presets

Edit `scripts/seed-presets.js`:

```javascript
{
  name: 'My Custom Preset',
  description: 'Custom face configuration',
  jsonMetadata: JSON.stringify({
    controls: {
      jawWidth: 1.3,
      noseLength: 0.8,
      // ... other controls
    }
  })
}
```

Then run:
```bash
docker-compose exec web npm run seed
```

### Production Deployment

See `DEPLOYMENT.md` for full production setup with:
- SSL certificates
- NGINX reverse proxy
- Database backups
- Monitoring
- Scaling

## Development Mode

### Run Without Docker

```bash
# Install dependencies
npm install

# Setup database (requires PostgreSQL)
npx prisma generate
npx prisma migrate dev

# Seed presets
npm run seed

# Start dev server
npm run dev
```

### Make Changes

The app auto-reloads when you edit files:

- **Pages:** `pages/*.jsx`
- **Components:** `components/**/*.jsx`
- **API:** `pages/api/**/*.js`
- **Styles:** `public/assets/style.css`

### Run Tests

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# With coverage
npm test -- --coverage
```

## Performance Tips

### For Slower Computers

1. **Reduce mesh quality:**
   - Use wireframe mode
   - Lower camera resolution
   - Close other apps

2. **Disable animations:**
   ```javascript
   // In Controls.jsx, reduce update frequency
   smoothUpdate(0.5)  // Instead of 0.3
   ```

3. **Limit concurrent users:**
   - Use single-user mode
   - Reduce worker processes

### For Better Quality

1. **Increase camera resolution:**
   ```javascript
   // In FaceMeshViewer.jsx
   video: { width: 1280, height: 720 }
   ```

2. **Higher mesh detail:**
   - Import higher resolution models
   - Increase subdivision

## File Structure Quick Reference

```
Key files you'll edit:

📄 .env                    - Configuration
📄 public/assets/style.css - Styling
📁 pages/                  - Routes & pages
📁 components/             - UI components
📁 lib/                    - Utilities
📁 pages/api/              - Backend endpoints
📁 prisma/                 - Database
```

## Next Steps

1. **Explore Presets:** Try all 10 fun face configurations
2. **Export Test:** Export a mesh as STL and open in Blender
3. **Camera Capture:** Take a selfie and modify your own face
4. **3D Print:** Connect OctoPrint and print a mesh
5. **Customize:** Edit the Y2K styling to your taste

## Getting Help

- **Check logs:** `docker-compose logs web`
- **Database issues:** `docker-compose logs db`
- **Reset everything:** `docker-compose down -v && docker-compose up --build`

## Resources

- **OctoPrint Setup:** https://octoprint.org/download/
- **Blender (free 3D software):** https://www.blender.org/
- **Three.js Docs:** https://threejs.org/docs/
- **MediaPipe:** https://google.github.io/mediapipe/

## Summary

You now have a fully functional facial mesh editor! 

**What works:**
✅ User authentication
✅ Real-time face capture
✅ Character-style controls
✅ Mesh library
✅ 10 fun presets
✅ STL/OBJ/PLY export
✅ OctoPrint integration
✅ Undo/redo
✅ Y2K aesthetic

**Quick commands:**
```bash
# Start
docker-compose up

# Stop
docker-compose down

# Logs
docker-compose logs -f web

# Rebuild
docker-compose up --build

# Reset
docker-compose down -v
```

Enjoy creating and 3D printing custom faces! 🎭