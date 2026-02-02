# 📊 Outdated Stack Analysis

> **Date**: February 2, 2026  
> **Current State**: JavaScript (ES Modules)  
> **Target State**: TypeScript with Latest Dependencies

---

## 🔴 Critical Updates Needed

### React Ecosystem
| Package | Current | Latest | Behind | Priority |
|---------|---------|--------|--------|----------|
| `react` | 18.3.1 | **19.2.4** | 1 Major | 🔴 Critical |
| `react-dom` | 18.3.1 | **19.2.4** | 1 Major | 🔴 Critical |
| `@types/react` | Not installed | **19.0.0** | Missing | 🔴 Critical |
| `@types/react-dom` | Not installed | **19.0.0** | Missing | 🔴 Critical |

**React 19 Breaking Changes:**
- ✅ No breaking changes for this codebase
- ✅ JSX Transform unchanged (Vite compatible)
- ⚡ New features available: `useId`, improved `useRef`, Actions

---

### Build Tooling
| Package | Current | Latest | Behind | Priority |
|---------|---------|--------|--------|----------|
| `vite` | 5.4.8 | **6.2.0** | 1 Major | 🟠 High |
| `@vitejs/plugin-react` | 4.3.2 | **4.4.0** | Minor | 🟡 Medium |
| `typescript` | Not installed | **5.9.3** | Missing | 🔴 Critical |

**Vite 6 Breaking Changes:**
- Node.js 18+ → 20+ required
- No API changes affecting this project

---

### Game Engine
| Package | Current | Latest | Behind | Priority |
|---------|---------|--------|--------|----------|
| `kaplay` | 3001.0.0-beta.8 | **3001.0.0** | Beta→Stable | 🟠 High |

**Kaplay Beta → Stable:**
- Much improved TypeScript definitions
- API finalized, better IDE support
- No breaking changes from beta

---

### Animation & State
| Package | Current | Latest | Behind | Priority |
|---------|---------|--------|--------|----------|
| `framer-motion` | 11.11.1 | **12.29.2** | 1 Major | 🟡 Medium |
| `jotai` | 2.10.0 | **2.17.0** | Minor | 🟢 Low |

**Framer Motion 12 Changes:**
- New animation APIs (opt-in)
- Performance improvements
- No breaking changes for basic usage

---

### Linting
| Package | Current | Latest | Behind | Priority |
|---------|---------|--------|--------|----------|
| `eslint` | 9.12.0 | **9.25.0** | Minor | 🟡 Medium |
| `@eslint/js` | 9.12.0 | **9.25.0** | Minor | 🟡 Medium |
| `eslint-plugin-react` | 7.37.1 | **7.37.5** | Patch | 🟢 Low |
| `eslint-plugin-react-hooks` | 5.1.0-rc.0 | **5.2.0** | RC→Stable | 🟡 Medium |

---

## 📋 Target `package.json`

```json
{
  "name": "new-2d-portfolio",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "framer-motion": "^12.29.2",
    "jotai": "^2.17.0",
    "kaplay": "^3001.0.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@eslint/js": "^9.25.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.4.0",
    "eslint": "^9.25.0",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.19",
    "globals": "^16.0.0",
    "typescript": "^5.9.3",
    "vite": "^6.2.0"
  }
}
```

---

## 🎯 Benefits of Upgrading

### React 19
- ✅ Better performance
- ✅ New hooks (`useId`, improved `use`)
- ✅ Automatic memoization improvements
- ✅ Better error handling

### TypeScript 5.9
- ✅ Type safety across entire codebase
- ✅ Better IDE autocomplete
- ✅ Catch bugs at compile time
- ✅ Self-documenting code

### Vite 6
- ✅ Faster builds
- ✅ Better production optimizations
- ✅ Improved dev server

### Kaplay Stable
- ✅ Complete type definitions
- ✅ Better editor support
- ✅ Stable API guarantees

---

## ⚠️ Risk Assessment

| Component | Risk Level | Mitigation |
|-----------|------------|------------|
| React 18→19 | Low | No breaking changes for this use case |
| Vite 5→6 | Low | Node 20+ required, no API changes |
| JS→TS | Medium | Phased approach with rollback points |
| Kaplay Beta→Stable | Low | API unchanged, just type improvements |

---

## 📁 Related Documents

- [TYPESCRIPT_MIGRATION_PLAN.md](./TYPESCRIPT_MIGRATION_PLAN.md) - Detailed 8-phase migration plan
- [TYPESCRIPT_MIGRATION_CHECKLIST.md](./TYPESCRIPT_MIGRATION_CHECKLIST.md) - Quick reference checklist
