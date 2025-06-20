# Azure CDN Setup Guide

## 🚨 Critical Issue: 52-second Time-to-First-Byte

Your current setup serves files directly from Azure Static Web Apps origin, causing massive delays. CDN will fix this.

## Step 1: Create Azure CDN Profile

1. Go to Azure Portal → Create Resource
2. Search "CDN" → Select "Front Door and CDN profiles"
3. Choose **Azure CDN Standard from Microsoft**
4. Resource Group: Same as your Static Web App
5. Name: `laurens-portfolio-cdn`
6. Pricing Tier: **Standard Microsoft**

## Step 2: Add CDN Endpoint

1. After CDN Profile is created, click **+ Endpoint**
2. Name: `laurens-portfolio` (becomes laurens-portfolio.azureedge.net)
3. Origin Type: **Custom Origin**
4. Origin hostname: `artoflaurens.com` (your current domain)
5. Origin path: `/` (empty)
6. Protocol: **HTTPS**

## Step 3: Configure Caching Rules

Go to your CDN endpoint → Caching rules:

```
# Rule 1: Cache static assets forever
Path pattern: /assets/*
Caching behavior: Override
Cache expiration: 1 year
Query string caching: Ignore query strings

# Rule 2: Cache models/GLB files
Path pattern: /optimized_models/*
Caching behavior: Override  
Cache expiration: 1 month
Query string caching: Ignore query strings

# Rule 3: Cache Draco decoder
Path pattern: /draco/*
Caching behavior: Override
Cache expiration: 1 year
Query string caching: Ignore query strings
```

## Step 4: Enable Compression

1. Go to CDN endpoint → Compression
2. Enable compression: **Yes**
3. File types to compress:
   - application/javascript
   - text/css
   - application/json
   - text/plain
   - model/gltf-binary
   - application/wasm

## Step 5: Update Your Domain

1. Go to CDN endpoint → Custom domains
2. Add custom domain: `artoflaurens.com`
3. Enable HTTPS: **Yes**
4. Certificate management: **CDN managed**

## Step 6: Test Performance

After setup (takes 10-15 minutes):
- TTFB should drop from 52s → 200-500ms
- Assets will be cached globally
- Automatic compression enabled

## Expected Results:
- **Before**: 52s TTFB, 35s character load
- **After**: <1s TTFB, <5s character load

## Cost: ~$10-20/month for your traffic volume 