# Frontend Responsive Refactoring Design Document

## Overview

This document outlines the comprehensive refactoring plan to transform the LLM Server frontend into a fully responsive single-page application. The app currently uses Vue 3 with Composition API and Pinia for state management but lacks responsive design patterns and mobile navigation.

## Current State Analysis

### Architecture
- **Framework**: Vue 3.5.30 with Composition API (`<script setup>`)
- **State Management**: Pinia 2.3.1 (8 stores)
- **Routing**: Vue Router 4.6.4 with lazy-loaded routes
- **UI Components**: PrimeVue 4.5.4 with Aura theme
- **Styling**: Tailwind CSS 4.2.2
- **Build Tool**: Vite 8.0.1

### Identified Issues

1. **Fixed Sidebar Layout**: All views use `margin-left: 250px` causing horizontal overflow on mobile
2. **No Mobile Navigation**: Missing hamburger menu or mobile-friendly navigation pattern
3. **Non-Responsive Grids**: Card grids use fixed `minmax(350px, 1fr)` breaking on smaller screens
4. **Fixed Header Layout**: Navigation links overflow on mobile devices
5. **Inconsistent API URLs**: Some stores use hardcoded `http://localhost:8080/api` instead of `/api`
6. **No Media Queries**: Zero responsive breakpoints defined
7. **Table Overflow**: Logs table doesn't adapt to mobile screens

---

## Refactoring Goals

### Primary Objectives
1. Implement hamburger menu for mobile navigation
2. Convert fixed sidebar to responsive slide-out menu
3. Make all views fully responsive across mobile, tablet, and desktop
4. Standardize API URLs across all stores
5. Maintain existing functionality while improving UX

### Target Breakpoints
| Breakpoint | Width | Description |
|------------|-------|-------------|
| Mobile | < 768px | Phone devices |
| Tablet | 768px - 1024px | Tablet devices |
| Desktop | > 1024px | Desktop/laptop |

---

## Phase 1: Core Layout Components

### 1.1 Header.vue Refactoring

**File**: `src/components/layout/Header.vue`

**Changes Required**:
- Add hamburger menu button (visible only on mobile)
- Add mobile menu overlay with full navigation
- Make nav links responsive (horizontal on desktop, vertical on mobile)
- Add responsive user info display
- Add close button for mobile menu
- Add click-outside handler to close mobile menu

**New Features**:
```vue
<!-- Mobile hamburger button -->
<button class="hamburger" @click="toggleMobileMenu" v-if="isMobile">
  <i class="pi pi-bars"></i>
</button>

<!-- Mobile menu overlay -->
<div v-if="mobileMenuOpen" class="mobile-menu-overlay" @click="closeMobileMenu">
  <div class="mobile-menu" @click.stop>
    <!-- Navigation links -->
  </div>
</div>
```

**Styles to Add**:
```css
.hamburger {
  display: none;
  font-size: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
}

@media (max-width: 768px) {
  .hamburger {
    display: block;
  }
  
  .nav-links {
    display: none;
  }
  
  .mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
}
```

**Dependencies**:
- `@vueuse/core` for `useMediaQuery` composable
- PrimeIcons for hamburger icon

---

### 1.2 Sidebar.vue Refactoring

**File**: `src/components/layout/Sidebar.vue`

**Changes Required**:
- Convert from fixed position to responsive slide-out
- Add transition animations for slide-in/out
- Add close button for mobile view
- Change from `position: fixed` to overlay on mobile
- Add backdrop on mobile
- Maintain fixed position on desktop

**New Features**:
```vue
<aside :class="['sidebar', { 'sidebar-mobile': isMobile, 'sidebar-open': sidebarOpen }]">
  <button v-if="isMobile" class="sidebar-close" @click="closeSidebar">
    <i class="pi pi-times"></i>
  </button>
  <!-- Existing content -->
</aside>
```

**Styles to Add**:
```css
.sidebar {
  /* Desktop: fixed position */
  width: 250px;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    z-index: 1001;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
  }
  
  .sidebar.sidebar-open {
    transform: translateX(0);
  }
  
  .sidebar-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
  }
}
```

**State Management**:
- Add `sidebarOpen` ref to control mobile sidebar state
- Expose `toggleSidebar` function for Header to call

---

## Phase 2: View Components

### 2.1 ChatView.vue

**File**: `src/views/ChatView.vue`

**Changes Required**:
- Remove `margin-left: 250px` from `.chat-main`
- Add responsive margin based on sidebar state
- Make message container full-width on mobile
- Adjust message avatars and content width on mobile
- Make input container stack vertically on very small screens

**Styles to Update**:
```css
.chat-main {
  flex: 1;
  margin-left: 250px;
  /* Add media query */
}

@media (max-width: 768px) {
  .chat-main {
    margin-left: 0;
    padding: 0.5rem;
  }
  
  .message {
    padding: 0.75rem;
  }
  
  .message-content {
    max-width: 100%;
  }
  
  .chat-input-container {
    padding: 0.75rem;
  }
}
```

---

### 2.2 ChatHistoryView.vue

**File**: `src/views/ChatHistoryView.vue`

**Changes Required**:
- Remove `margin-left: 250px` from `.history-main`
- Make chat cards full-width on mobile
- Stack chat info and meta vertically on mobile

**Styles to Update**:
```css
.history-main {
  flex: 1;
  margin-left: 250px;
}

@media (max-width: 768px) {
  .history-main {
    margin-left: 0;
    padding: 1rem;
  }
  
  .chat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .chat-meta {
    width: 100%;
    justify-content: space-between;
  }
}
```

---

### 2.3 ToolsView.vue

**File**: `src/views/ToolsView.vue`

**Changes Required**:
- Remove `margin-left: 250px` from `.tools-main`
- Make grid responsive with smaller min-width on mobile
- Adjust dialog width for mobile screens
- Stack form elements vertically on mobile

**Styles to Update**:
```css
.tools-main {
  flex: 1;
  margin-left: 250px;
}

.tools-grid {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

@media (max-width: 768px) {
  .tools-main {
    margin-left: 0;
    padding: 1rem;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
  
  .tools-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
```

---

### 2.4 PromptsView.vue

**File**: `src/views/PromptsView.vue`

**Changes Required**:
- Remove `margin-left: 250px` from `.prompts-main`
- Make grid responsive
- Adjust dialog width for mobile

**Styles to Update**:
```css
.prompts-main {
  flex: 1;
  margin-left: 250px;
}

.prompts-grid {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

@media (max-width: 768px) {
  .prompts-main {
    margin-left: 0;
    padding: 1rem;
  }
  
  .prompts-grid {
    grid-template-columns: 1fr;
  }
  
  .prompts-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
```

---

### 2.5 RAGDocumentsView.vue

**File**: `src/views/RAGDocumentsView.vue`

**Changes Required**:
- Remove `margin-left: 250px` from `.documents-main`
- Stack document cards vertically on mobile
- Adjust card layout for smaller screens

**Styles to Update**:
```css
.documents-main {
  flex: 1;
  margin-left: 250px;
}

.documents-grid {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

@media (max-width: 768px) {
  .documents-main {
    margin-left: 0;
    padding: 1rem;
  }
  
  .documents-grid {
    grid-template-columns: 1fr;
  }
  
  .document-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .documents-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
```

---

### 2.6 RAGQueriesView.vue

**File**: `src/views/RAGQueriesView.vue`

**Changes Required**:
- Remove `margin-left: 250px` from `.queries-main`
- Make search box stack vertically on mobile
- Adjust result items for mobile

**Styles to Update**:
```css
.queries-main {
  flex: 1;
  margin-left: 250px;
}

@media (max-width: 768px) {
  .queries-main {
    margin-left: 0;
    padding: 1rem;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .result-item {
    flex-direction: column;
  }
  
  .result-rank {
    align-self: flex-start;
  }
}
```

---

### 2.7 LogsView.vue

**File**: `src/views/LogsView.vue`

**Changes Required**:
- Remove `margin-left: 250px` from `.logs-main`
- Add horizontal scroll for table on mobile
- Or implement card view for mobile

**Styles to Update**:
```css
.logs-main {
  flex: 1;
  margin-left: 250px;
}

.logs-table-container {
  overflow-x: auto;
}

@media (max-width: 768px) {
  .logs-main {
    margin-left: 0;
    padding: 1rem;
  }
  
  .logs-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .filter-actions {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
  
  /* Alternative: Card view for mobile */
  .logs-table {
    display: block;
  }
  
  .logs-table thead {
    display: none;
  }
  
  .logs-table tr {
    display: block;
    margin-bottom: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 8px;
  }
  
  .logs-table td {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: none;
  }
}
```

---

### 2.8 SystemMonitorView.vue

**File**: `src/views/SystemMonitorView.vue`

**Changes Required**:
- Remove `margin-left: 250px` from `.monitor-main`
- Make metric cards single column on mobile
- Adjust metric values for smaller screens

**Styles to Update**:
```css
.monitor-main {
  flex: 1;
  margin-left: 250px;
}

.metrics-grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

@media (max-width: 768px) {
  .monitor-main {
    margin-left: 0;
    padding: 1rem;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .monitor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .metric-value {
    font-size: 2rem;
  }
}
```

---

### 2.9 HomeView.vue

**File**: `src/views/HomeView.vue`

**Changes Required**:
- Remove `margin-left: 250px` from `.main-content`
- Make main content full-width on mobile

**Styles to Update**:
```css
.main-content {
  flex: 1;
  margin-left: 250px;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
}
```

---

## Phase 3: Shared Components

### 3.1 LoginKeypad.vue

**File**: `src/components/auth/LoginKeypad.vue`

**Changes Required**:
- Ensure form works on all screen sizes
- Add responsive padding for small screens
- Adjust card max-width on mobile

**Styles to Update**:
```css
@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
    margin: 1rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
}
```

---

## Phase 4: Global Styles

### 4.1 style.css

**File**: `src/style.css`

**Changes Required**:
- Remove fixed `#app` max-width constraint
- Add responsive breakpoints
- Add mobile-specific base styles

**New Styles**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  margin: 0 auto;
}

/* Responsive utilities */
@media (max-width: 768px) {
  .sidebar-hidden {
    margin-left: 0 !important;
  }
}

/* Mobile-specific adjustments */
@media (max-width: 480px) {
  body {
    font-size: 14px;
  }
}
```

---

## Phase 5: Store API URL Fixes

### 5.1 Fix Inconsistent API URLs

**Files to Update**:
- `src/stores/llama.js`
- `src/stores/log.js`
- `src/stores/matrix.js`
- `src/stores/user.js`

**Current Issue**:
```javascript
// Current (inconsistent)
const API_URL = 'http://localhost:8080/api'
```

**Fix**:
```javascript
// New (consistent with other stores)
const API_URL = import.meta.env.VITE_API_URL || '/api'
```

**Files**:
| Store | Current URL | New URL |
|-------|-------------|---------|
| `llama.js` | `http://localhost:8080/api` | `/api` |
| `log.js` | `http://localhost:8080/api` | `/api` |
| `matrix.js` | `http://localhost:8080/api` | `/api` |
| `user.js` | `http://localhost:8080/api` | `/api` |

---

## Implementation Checklist

### Phase 1: Core Layout Components

- [x] **Header.vue**
  - [x] Add `isMobile` computed using `useMediaQuery`
  - [x] Add `mobileMenuOpen` ref
  - [x] Add hamburger button with PrimeIcons
  - [x] Create mobile menu overlay component
  - [x] Add `toggleMobileMenu()` function
  - [x] Add `closeMobileMenu()` function
  - [x] Add click-outside handler
  - [x] Add responsive CSS for nav links
  - [ ] Test on mobile devices

- [x] **Sidebar.vue**
  - [x] Add `isMobile` computed
  - [x] Add `sidebarOpen` ref
  - [x] Add close button for mobile
  - [x] Add `closeSidebar()` function
  - [x] Add `toggleSidebar()` function
  - [x] Add slide-in/out transitions
  - [x] Add mobile overlay backdrop
  - [x] Update CSS for responsive behavior
  - [ ] Test on mobile devices

- [x] **useSidebar composable**
  - [x] Create `/src/composables/useSidebar.js`
  - [x] Export `isMobile`, `sidebarOpen`, `toggleSidebar`, `openSidebar`, `closeSidebar`

### Phase 2: View Components

- [x] **ChatView.vue**
  - [x] Remove fixed `margin-left: 250px`
  - [x] Add responsive margin logic
  - [x] Update message container for mobile
  - [x] Adjust input container for mobile
  - [x] Add media queries
  - [ ] Test on mobile devices

- [x] **ChatHistoryView.vue**
  - [x] Remove fixed `margin-left: 250px`
  - [x] Make chat cards stack on mobile
  - [x] Add responsive header
  - [x] Add media queries
  - [ ] Test on mobile devices

- [x] **ToolsView.vue**
  - [x] Remove fixed `margin-left: 250px`
  - [x] Make grid single column on mobile
  - [x] Adjust dialog widths for mobile
  - [x] Add responsive header
  - [x] Add media queries
  - [ ] Test on mobile devices

- [x] **PromptsView.vue**
  - [x] Remove fixed `margin-left: 250px`
  - [x] Make grid single column on mobile
  - [x] Adjust dialog widths for mobile
  - [x] Add responsive header
  - [x] Add media queries
  - [ ] Test on mobile devices

- [x] **RAGDocumentsView.vue**
  - [x] Remove fixed `margin-left: 250px`
  - [x] Make grid single column on mobile
  - [x] Stack card content on mobile
  - [x] Add responsive header
  - [x] Add media queries
  - [ ] Test on mobile devices

- [x] **RAGQueriesView.vue**
  - [x] Remove fixed `margin-left: 250px`
  - [x] Stack search box on mobile
  - [x] Adjust result items for mobile
  - [x] Add media queries
  - [ ] Test on mobile devices

- [x] **LogsView.vue**
  - [x] Remove fixed `margin-left: 250px`
  - [x] Add horizontal scroll for table
  - [x] Add responsive header
  - [x] Add media queries
  - [ ] Test on mobile devices

- [x] **SystemMonitorView.vue**
  - [x] Remove fixed `margin-left: 250px`
  - [x] Make grid single column on mobile
  - [x] Adjust metric card sizes
  - [x] Add responsive header
  - [x] Add media queries
  - [ ] Test on mobile devices

- [x] **HomeView.vue**
  - [x] Remove fixed `margin-left: 250px`
  - [x] Add responsive padding
  - [x] Add media queries
  - [ ] Test on mobile devices

### Phase 3: Shared Components

- [ ] **LoginKeypad.vue**
  - [ ] Add responsive padding for small screens
  - [ ] Adjust card max-width
  - [ ] Test on mobile devices

### Phase 4: Global Styles

- [x] **style.css**
  - [x] Remove `#app` max-width constraint
  - [x] Add responsive breakpoints
  - [x] Add mobile-specific base styles
  - [ ] Test across all screen sizes

### Phase 5: Store Fixes

- [x] **llama.js**
  - [x] Update API_URL to use `/api`
  - [ ] Test API calls

- [x] **log.js**
  - [x] Update API_URL to use `/api`
  - [ ] Test API calls

- [x] **matrix.js**
  - [x] Update API_URL to use `/api`
  - [ ] Test API calls

- [x] **user.js**
  - [x] Update API_URL to use `/api`
  - [ ] Test API calls

---

## Testing Plan

### Desktop Testing (> 1024px)
- [ ] Sidebar remains fixed on left
- [ ] Header nav links display horizontally
- [ ] All grids show multiple columns
- [ ] Hamburger menu hidden
- [ ] All functionality works as before

### Tablet Testing (768px - 1024px)
- [ ] Sidebar remains fixed or slide-out
- [ ] Header nav links may wrap
- [ ] Grids show 2 columns
- [ ] Hamburger menu visible
- [ ] Mobile menu works

### Mobile Testing (< 768px)
- [ ] Sidebar slide-out from left
- [ ] Hamburger menu visible and functional
- [ ] All grids show single column
- [ ] All cards full-width
- [ ] Tables scrollable or card-based
- [ ] Forms stack vertically
- [ ] Touch targets adequate size

### Functional Testing
- [ ] Login/Logout works on all sizes
- [ ] Navigation works on all sizes
- [ ] Chat messaging works on mobile
- [ ] File upload works on mobile
- [ ] Dialogs are accessible on mobile
- [ ] All API calls work correctly

---

## Dependencies

### Required Packages (Already Installed)
- `@vueuse/core` - for `useMediaQuery` composable
- `primeicons` - for hamburger and close icons
- `primevue` - for existing UI components

### Optional Additions
- None required - all dependencies already present

---

## Migration Notes

### Breaking Changes
- None - all changes are additive or style modifications

### Backward Compatibility
- Desktop experience remains unchanged
- All existing routes and functionality preserved
- API URL changes may affect local testing if using custom ports

### Rollback Plan
- All changes are non-breaking
- Can revert individual files if issues arise
- No database migrations required

---

## Success Criteria

1. **Mobile-First Design**: App fully usable on mobile devices (320px+)
2. **No Horizontal Scroll**: No content overflow on any screen size
3. **Touch-Friendly**: All interactive elements have adequate touch targets (44px minimum)
4. **Performance**: No layout shifts or performance degradation
5. **Accessibility**: Mobile menu accessible via keyboard and screen readers
6. **Consistency**: All views follow same responsive patterns

---

## Appendix

### CSS Media Query Reference
```css
/* Mobile First Approach */
/* Base styles for mobile */

/* Tablet */
@media (min-width: 768px) {
  /* Tablet styles */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Desktop styles */
}

/* Large Desktop */
@media (min-width: 1280px) {
  /* Large desktop styles */
}
```

### VueUse Media Query Example
```javascript
import { useMediaQuery } from '@vueuse/core'

const isMobile = useMediaQuery('(max-width: 768px)')
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)')
const isDesktop = useMediaQuery('(min-width: 1024px)')
```

---

## Implementation Summary

### Completed (2026-04-09)

**Phase 1: Core Layout Components** ✅
- Header.vue: Added hamburger menu, mobile overlay, responsive navigation
- Sidebar.vue: Converted to slide-out menu on mobile with transitions
- Created useSidebar.js composable for shared state management

**Phase 2: View Components** ✅
- All 9 view components updated with responsive media queries
- ChatView, ChatHistoryView, ToolsView, PromptsView, RAGDocumentsView, RAGQueriesView, LogsView, SystemMonitorView, HomeView
- Removed fixed 250px margin-left, added responsive transitions
- Grids now collapse to single column on mobile
- Headers stack vertically on mobile devices

**Phase 4: Global Styles** ✅
- Removed `#app` max-width constraint
- Added responsive base font sizes for mobile
- Added media query breakpoints at 768px and 480px

**Phase 5: Store API URL Fixes** ✅
- llama.js, log.js, matrix.js, user.js all updated to use `/api`
- Consistent API URL pattern across all stores

### Remaining Tasks

- [ ] Mobile device testing
- [ ] LoginKeypad.vue responsive adjustments (optional)
- [ ] API call testing for updated stores

### Build Status

✅ Build successful - `npm run build` completes without errors

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-09 | Frontend Team | Initial design document |
| 1.1 | 2026-04-09 | Frontend Team | Implementation complete, updated checklist |
