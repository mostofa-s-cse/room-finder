# Git Configuration and File Management

## Overview
This document explains the git configuration for the Room Finder project, including what files are ignored and how uploads are handled.

## .gitignore Configuration

### User Uploads and Generated Files
```gitignore
public/uploads/
!public/uploads/.gitkeep
public/temp/
uploads/
temp/
```

**Why these are ignored:**
- User-uploaded images should not be committed to version control
- Upload files can be large and change frequently
- Different environments may have different uploaded content
- Keeps repository size manageable

**Exception:** `.gitkeep` files are preserved to maintain directory structure.

### File Structure
```
public/
├── uploads/
│   ├── .gitkeep         # ✅ Tracked (keeps directory in git)
│   └── listings/
│       ├── .gitkeep     # ✅ Tracked (keeps directory structure)
│       ├── listing_*.png # ❌ Ignored (user uploads)
│       ├── listing_*.jpg # ❌ Ignored (user uploads)
│       └── listing_*.webp# ❌ Ignored (user uploads)
└── images/              # ✅ Tracked (static assets)
```

## Current Upload Status

### Uploaded Images (Ignored by Git)
The following images have been uploaded and are properly ignored:
- `listing_1763527948392_pl90judh23.png` (670KB)
- `listing_1763528224422_lshnljz8rwp.png` (805KB)
- `listing_1763528631559_cbdnds66tpm.png` (26KB)
- `listing_1763528659316_v2c20hmiw5.png` (361KB)
- `listing_1763529611723_fbdapcg0z7f.png` (805KB)
- `listing_1763530895406_61xsfoxhlqw.png` (805KB)

**Total Size:** ~3.3MB of uploads (properly excluded from git)

## Environment Variables

### .env Files
```gitignore
.env*
!.env.example
```

- **Ignored:** All `.env*` files (contain sensitive data)
- **Tracked:** `.env.example` (template for setup)

### Current Environment Configuration
The `.env.example` includes:
- Database configuration (PostgreSQL)
- Authentication secrets (NextAuth.js)
- Google Maps API keys (optional)
- Payment gateway (SSLCommerz)
- AWS S3 configuration (optional)
- Redis caching (optional)
- Email service configuration

## Development Files

### IDE and Editor Files
```gitignore
.vscode/
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea/
```

- Personal IDE settings are ignored
- Shared project configurations are preserved

### Build and Cache Files
```gitignore
/.next/
/out/
/build
/dist
.cache/
.eslintcache
```

- Build outputs are regenerated automatically
- Cache files improve performance but shouldn't be committed

## Database and Logs

### Database Files
```gitignore
*.db
*.sqlite
*.sqlite3
database.db
```

- Local database files are ignored
- Prevents accidental commits of development data

### Logs
```gitignore
logs
*.log
npm-debug.log*
yarn-debug.log*
```

- Runtime logs are ignored
- Prevents cluttering repository with debug information

## Best Practices

### For Uploads
1. **Never commit user uploads** - Always use `.gitignore`
2. **Use cloud storage** - Consider AWS S3, Cloudinary, etc. for production
3. **Keep directory structure** - Use `.gitkeep` files for empty directories
4. **Size limits** - Current limit is 5MB per file (configurable)

### For Environment Variables
1. **Use .env.example** - Document all required variables
2. **Never commit secrets** - Keep actual values in local `.env` files
3. **Use different configs** - Separate development/staging/production

### For Development Files
1. **Share useful configs** - VS Code settings, launch configurations
2. **Ignore personal preferences** - Themes, personal extensions
3. **Include build instructions** - Document setup in README

## File Management Commands

### Check git status (should show no uploads)
```bash
git status
```

### Add all changes except uploads
```bash
git add .
```

### Force add a specific upload (not recommended)
```bash
git add -f public/uploads/specific-file.png
```

### Clean untracked files (careful with uploads)
```bash
git clean -fd --dry-run  # Preview what would be deleted
git clean -fd            # Actually delete (use carefully)
```

## Deployment Considerations

### Production Setup
- Upload directories need to exist on server
- Consider using CDN for uploaded images
- Backup uploads separately from code repository
- Set proper file permissions on upload directories

### Staging Environment
- Uploads should be isolated between environments
- Use different S3 buckets or directory prefixes
- Consider copying production uploads to staging for testing

## Monitoring and Maintenance

### Regular Cleanup
- Monitor upload directory size
- Implement automatic cleanup of old/unused uploads
- Archive old uploads to long-term storage

### Security
- Validate file types and sizes
- Scan uploads for malware
- Use secure file naming conventions (already implemented)

## Troubleshooting

### If uploads are being committed
1. Check `.gitignore` syntax
2. Verify file paths match patterns
3. Use `git rm --cached` to untrack files
4. Add proper ignore patterns

### If directories are missing in production
1. Ensure `.gitkeep` files exist
2. Create directories in deployment scripts
3. Check directory permissions

This configuration ensures a clean repository while maintaining proper file structure for development and production deployments.