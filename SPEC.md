# CubeMaster - Rubik's Cube Learning Platform

## 1. Project Overview

**Project Name:** CubeMaster
**Type:** Educational Single-Page Website
**Core Functionality:** An interactive platform teaching multiple Rubik's cube solving methods (CFOP, ZBLL) across different cube sizes (2x2, 3x3, 4x4, 5x5)
**Target Users:** Beginners to intermediate cubers wanting to learn solving methods

---

## 2. UI/UX Specification

### Layout Structure

**Navigation (Fixed)**
- Logo on left: "CubeMaster" with cube icon
- Nav links: Home, 2x2, 3x3, 4x4, 5x5, Methods, Resources
- Mobile: Hamburger menu with slide-out drawer

**Hero Section**
- Full-width section with animated 3D cube visualization
- Main headline + subheadline
- CTA buttons: "Start Learning" and "Choose Cube"

**Cube Selection Section**
- 4 large cards for each cube size
- Each card: cube image, name, difficulty badge, "Learn" button
- Hover effects with lift and glow

**Methods Section**
- Split into CFOP and ZBLL
- Method cards showing stages/progression
- Visual timeline/steps display

**Learning Content Sections (per cube)**
- Accordion-style lesson modules
- Algorithm notation helper
- Progress tracker

**Footer**
- Quick links, algorithm reference, contact
- Social icons

### Visual Design

**Color Palette**
- Background: `#0a0a0f` (deep charcoal black)
- Surface: `#14141f` (card backgrounds)
- Surface Light: `#1e1e2e` (hover states)
- Primary: `#ff6b35` (vibrant orange - main accent)
- Secondary: `#00d4aa` (teal/mint - success states)
- Tertiary: `#7c5cff` (purple - ZBLL accent)
- Text Primary: `#ffffff`
- Text Secondary: `#a0a0b0`
- Border: `#2a2a3a`

**Typography**
- Headings: "Outfit", sans-serif (700 weight)
- Body: "DM Sans", sans-serif (400, 500 weight)
- Code/Algorithms: "JetBrains Mono", monospace
- H1: 56px, H2: 40px, H3: 28px, H4: 20px
- Body: 16px, Small: 14px

**Spacing System**
- Section padding: 100px vertical
- Container max-width: 1200px
- Card padding: 32px
- Gap between cards: 24px
- Border radius: 16px (cards), 8px (buttons), 4px (small elements)

**Visual Effects**
- Cards: subtle border glow on hover (primary color)
- Buttons: scale(1.02) on hover with shadow
- Section transitions: fade-in on scroll
- Cube animations: CSS 3D rotating cube in hero
- Gradient overlays on hero

### Components

**Cube Card**
- States: default, hover (lift + glow), active
- Contains: cube illustration, title, difficulty badge, description

**Method Stage Card**
- Shows step number, name, description
- Icon representation
- Status: locked/unlocked/completed

**Algorithm Display**
- Standard notation (R, L, U, D, F, B, etc.)
- Move counter
- Copy button
- Animation playback controls

**Accordion Module**
- Expandable lesson sections
- Progress indicator
- Checkmark when complete

**Progress Bar**
- Horizontal bar showing completion
- Animated fill with gradient

**Button Variants**
- Primary: filled with primary color
- Secondary: outlined
- Ghost: text only with hover background

---

## 3. Functionality Specification

### Core Features

**1. Cube Size Selection**
- 4 cube options: 2x2, 3x3, 4x4, 5x5
- Click navigates to relevant section
- Difficulty indicator (2x2=Beginner, 3x3=All Levels, 4x4=Intermediate, 5x5=Advanced)

**2. Method Navigation**
- CFOP: Cross → F2L → OLL → PLL
- ZBLL: Full ZBLL with subsets
- Clicking method shows detailed breakdown

**3. Lesson Content (Accordion)**
- For 3x3: Cross, First Two Layers (F2L), OLL, PLL, ZBLL
- For 2x2: Ortega Method basics
- For 4x4/5x5: Reduction method basics

**4. Algorithm Reference**
- Standard notation display
- Visual cube state (can be static images)

**5. Progress Tracking (Local Storage)**
- Track completed lessons per cube
- Visual progress bar per section
- Persists in browser

**6. Interactive Elements**
- Smooth scroll navigation
- Scroll-triggered animations
- Mobile-responsive hamburger menu

### User Interactions

- Click cube card → smooth scroll to that cube's section
- Click method → expand method details
- Click lesson accordion → expand/collapse content
- Hover effects on all interactive elements
- Mobile menu toggle

### Edge Cases

- Ensure all external fonts load
- Fallback fonts if CDN fails
- Graceful degradation if JS disabled (content still visible)

---

## 4. Content Structure

### 2x2 Section
- Method: Ortega (beginner-friendly)
- Stages: First Face → Orient Last Layer → Permute Last Layer

### 3x3 Section
- Method: CFOP (primary)
  - Cross (white cross)
  - F2L (First Two Layers)
  - OLL (Orient Last Layer) - 57 cases
  - PLL (Permute Last Layer) - 21 cases
- Method: ZBLL (advanced)
  - 493 cases for full ZBLL
  - Broken into subsets: H, Z, T, etc.

### 4x4 Section
- Method: Reduction
  - Centers → Edges → 3x3 solve → Parity fix

### 5x5 Section
- Method: Reduction
  - Centers → Edges → 3x3 solve → Parity fixes

---

## 5. Acceptance Criteria

- [ ] Hero section displays with animated 3D cube
- [ ] All 4 cube cards render with correct styling
- [ ] Navigation works (smooth scroll to sections)
- [ ] Mobile menu opens/closes correctly
- [ ] CFOP accordion expands/collapses
- [ ] ZBLL section displays with purple accent
- [ ] Progress tracking saves to localStorage
- [ ] All hover effects work as specified
- [ ] Color scheme matches specification exactly
- [ ] Typography matches specification
- [ ] Responsive on mobile (320px), tablet (768px), desktop (1200px+)
