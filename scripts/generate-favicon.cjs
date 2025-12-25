const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/favicon.svg');
const publicDir = path.join(__dirname, '../public');

async function generateFavicons() {
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate 32x32 PNG for favicon.ico replacement
    await sharp(svgBuffer)
        .resize(32, 32)
        .png()
        .toFile(path.join(publicDir, 'favicon-32x32.png'));
    console.log('✓ Generated favicon-32x32.png');

    // Generate 16x16 PNG
    await sharp(svgBuffer)
        .resize(16, 16)
        .png()
        .toFile(path.join(publicDir, 'favicon-16x16.png'));
    console.log('✓ Generated favicon-16x16.png');

    // Generate 180x180 for Apple Touch Icon
    await sharp(svgBuffer)
        .resize(180, 180)
        .png()
        .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon.png');

    // Generate 192x192 for Android
    await sharp(svgBuffer)
        .resize(192, 192)
        .png()
        .toFile(path.join(publicDir, 'android-chrome-192x192.png'));
    console.log('✓ Generated android-chrome-192x192.png');

    // Generate favicon.ico (using PNG as ICO equivalent - will be served correctly)
    // Most modern browsers accept PNG for favicon.ico
    await sharp(svgBuffer)
        .resize(32, 32)
        .png()
        .toFile(path.join(publicDir, 'favicon.ico'));
    console.log('✓ Generated favicon.ico (PNG format)');

    console.log('\n✅ All favicons generated successfully!');
}

generateFavicons().catch(console.error);
