# Upload PowerPoint Files to GitHub Releases

Since the PPT files (353MB) exceed Vercel's 250MB limit, we need to host them externally.

## Option 1: GitHub Releases (Free & Easy)

1. **Create a release on GitHub**:
   ```bash
   gh release create v1.0 --title "Campbell Biology PPT Files" --notes "Complete set of Campbell Biology PowerPoint presentations"
   ```

2. **Upload files to the release**:
   ```bash
   # Upload all PPT files to the release
   gh release upload v1.0 public/ppt/*.ppt
   ```

3. **Update the JSON file** with real download URLs from the release

## Option 2: Google Drive (Alternative)

1. Upload files to a public Google Drive folder
2. Get shareable links for each file
3. Update the JSON file with the Google Drive links

## Option 3: AWS S3 / CloudFront (Professional)

1. Create an S3 bucket
2. Upload files with public read access
3. Use CloudFront for faster downloads
4. Update JSON with S3/CloudFront URLs

## Current Status

- ✅ Added `.vercelignore` to exclude PPT files from deployment
- ✅ Modified API to use external links in production
- ✅ Kept local files working for development
- ⏳ Need to upload files and update JSON with real URLs

Choose one of the options above to complete the setup!