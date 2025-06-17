# ART's Interactive WebGL Portfolio

A high-performance, immersive 3D portfolio experience built with Three.js and WebGL.

## 🚀 Production Features

- **Adaptive Performance**: Automatically adjusts quality based on device capabilities and FPS
- **Progressive Loading**: Smart asset loading with progress indicators
- **Error Handling**: Graceful fallbacks for unsupported devices
- **Mobile Optimized**: Responsive design with touch gesture support
- **SEO Ready**: Proper meta tags and structured data
- **Bundle Optimization**: Code splitting and tree shaking for optimal load times

## 📦 Build & Deploy

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview  # Test production build locally
```

### Deployment to Webflow

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Upload assets**:
   - Upload all files from `dist/` to your Webflow hosting
   - Ensure GLB files are served with proper MIME types
   - Enable gzip compression for better performance

3. **Webflow Integration**:
   - Add the HTML content to a Webflow embed element
   - Include the CSS in the page head
   - Load the JavaScript bundle as an external script

## 🎯 Performance Optimizations

### Bundle Size Reduction
- **Before**: 760KB minified
- **After**: ~400KB with code splitting
- Separate chunks for Three.js, postprocessing, and vendor libraries

### Runtime Optimizations
- Adaptive DPR based on device performance
- FPS monitoring with automatic quality adjustment
- Efficient render loop with selective updates
- Memory leak prevention with proper cleanup

### Asset Optimization
- **GLB Models**: 27MB total (consider compression)
- **Textures**: Optimized for web delivery
- **Fonts**: Preloaded critical assets

## 🔧 Browser Support

- **Chrome**: 60+ ✅
- **Firefox**: 55+ ✅
- **Safari**: 12+ ✅
- **Edge**: 79+ ✅
- **Mobile**: iOS 12+, Android 7+ ✅

## 📱 Mobile Performance

- Automatic quality reduction on low-end devices
- Touch gesture optimization
- Reduced motion support for accessibility
- Battery-conscious rendering

## 🐛 Troubleshooting

### Common Issues

1. **Black screen on mobile**:
   - Check WebGL support
   - Verify device memory (requires 2GB+ RAM)
   - Try refreshing the page

2. **Slow loading**:
   - Enable gzip compression on server
   - Use CDN for GLB assets
   - Check network connection

3. **High memory usage**:
   - Automatic cleanup is implemented
   - Refresh page if issues persist

### Performance Monitoring

The app includes built-in FPS monitoring and will automatically:
- Reduce pixel ratio on low-end devices
- Disable antialiasing when needed
- Throttle expensive operations

## 🔒 Production Checklist

- [x] Debug mode disabled
- [x] Console logs removed in production
- [x] Error boundaries implemented
- [x] Loading states added
- [x] Mobile optimization
- [x] Bundle size optimized
- [x] Asset preloading
- [x] SEO meta tags
- [x] Accessibility features
- [x] Memory leak prevention

## 📊 Asset Sizes

| Asset | Size | Optimization |
|-------|------|-------------|
| Main Bundle | ~400KB | Code splitting applied |
| Three.js | ~150KB | Separate chunk |
| GLB Models | 27MB | Consider Draco compression |
| Textures | ~250KB | Optimized |

## 🚀 Next Steps for Production

1. **Asset Compression**: Implement Draco compression for GLB files
2. **CDN Setup**: Use CDN for large assets
3. **Analytics**: Add performance monitoring
4. **A/B Testing**: Test different quality settings
5. **Caching**: Implement proper cache headers

---

## Original Development Notes

### Concept and Decisions
- **Shadows**: Disabled for performance optimization
- **Camera Movement**: Subtle orbit movements for dynamic feel
- **Model Optimization**: Reduced vertex count in Blender for better performance
- **Character Creation**: Ready Player Me + MoveONE AI animations (fallback to MIXAMO)
- **Dragging Logic**: Intuitive drag vs click detection

Built with ❤️ by ART - Ready to send! 🧗‍♂️