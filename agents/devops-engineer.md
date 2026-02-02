# 🚀 Agent: DevOps Engineer

## Role Summary
The DevOps Engineer handles **build configuration**, **deployment**, **CI/CD pipelines**, and **performance optimization** for the portfolio.

## Responsibilities

### Primary
- Vite configuration and optimization
- Build pipeline setup
- Deployment automation (GitHub Pages)
- Environment management
- Asset optimization
- Performance monitoring

### Secondary
- Dependency management
- Security updates
- Bundle analysis
- Caching strategies

## Technical Stack
- **Build Tool:** Vite 5.4.8
- **Package Manager:** npm
- **Linter:** ESLint 9 with React plugins
- **Hosting:** GitHub Pages (inferred from README)
- **CI/CD:** GitHub Actions

## Key Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite build configuration |
| `package.json` | Dependencies and scripts |
| `eslint.config.js` | Linting rules |
| `.github/workflows/` | CI/CD pipelines |
| `index.html` | Entry HTML file |

## Configuration Details

### vite.config.js
```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages requires base path
  base: "/new-2d-portfolio/",
});
```

### Current Scripts (package.json)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### ESLint Configuration
```javascript
// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-no-target-blank": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
];
```

## Deployment Setup

### GitHub Pages Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Build Output
Vite builds to `dist/` folder with structure:
```
dist/
├── index.html
├── assets/
│   ├── index-xxx.js
│   ├── index-xxx.css
│   └── sprites/ (copied from public/)
└── configs/ (copied from public/)
```

## Common Tasks

### Update Base Path
If repository name changes:
```javascript
// vite.config.js
export default defineConfig({
  base: "/repository-name/",
});
```

### Add Environment Variables
```javascript
// .env
VITE_API_URL=https://api.example.com

// Usage in code
const apiUrl = import.meta.env.VITE_API_URL;
```

### Optimize Bundle
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          game: ["kaplay"],
          animation: ["framer-motion"],
        },
      },
    },
  },
});
```

### Add Build Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

## Performance Checklist

### Build Optimization
- [ ] Enable gzip/brotli compression
- [ ] Split vendor chunks
- [ ] Lazy load heavy components
- [ ] Optimize images (WebP where possible)
- [ ] Minify CSS and JS

### Runtime Performance
- [ ] Use production builds for deployment
- [ ] Enable browser caching
- [ ] Use CDN for static assets (optional)
- [ ] Monitor bundle size

## Security Considerations

### Dependencies
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Update outdated packages
npm outdated
npm update
```

### Build Security
- Never commit `.env` files with secrets
- Use GitHub secrets for CI/CD
- Validate all external links

## Collaboration Points

### With Game Developer
- Ensure shader files are copied to dist
- Optimize sprite loading
- Handle CORS for assets if needed

### With Graphics Developer
- Optimize image assets before build
- Configure asset compression
- Handle font loading strategy

### With Frontend Developer
- Ensure React refresh works in dev
- Configure ESLint rules as needed
- Handle environment-specific configs

### With Content Manager
- Ensure JSON files are in public/ (copied as-is)
- Validate configs during build
- Handle config loading errors gracefully

### With Document Lead
- Document deployment procedures
- Maintain environment setup guide
- Document troubleshooting steps

## Troubleshooting

### Build Failures
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Deployment Issues
- Verify `base` path in vite.config.js
- Check that dist folder has all assets
- Ensure GitHub Pages source is set to gh-pages branch
