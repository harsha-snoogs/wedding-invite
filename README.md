# 🪷 Ashwin & Snegha — Wedding Invitation

> _A cinematic, scroll-driven digital wedding invitation crafted with love, inspired by South Indian heritage and timeless storytelling._

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vanilla JS](https://img.shields.io/badge/Runtime-Zero--Dependency%20Vanilla%20JS-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Format](https://img.shields.io/badge/Formats-AVIF%20%7C%20WebP%20%7C%20CSS-blue)](#)
[![License](https://img.shields.io/badge/Made%20with-Love%20%26%20Tradition-maroon)](#)

---

## ✨ The Experience

This digital invitation bridges traditional South Indian ceremony with cutting-edge web craftsmanship:

1. **The Silk Cover (Temple Doors)**
   - Wrapped in deep maroon Kanchipuram silk with hand-woven gold _Zari_ temple (_Gopuram_) borders.
   - Gold calligraphy writes itself across the screen before inviting guests with _"Open invitation"_.
   - A single tap opens the double temple doors with gentle perspective easing while starting background music.

2. **Continuous Camera Film (Scroll Zoom)**
   - Instead of jarring slideshow cuts, photos are linked spatially: the camera smoothly zooms _through_ the first portrait into the couple's joined hands, then gracefully pulls back into their face-to-face scene.
   - Built with a custom Canvas engine featuring motion blur, edge-feathering, and sub-pixel camera easing.

3. **Auto-Glide for Effortless Viewing**
   - Designed with older guests and hands-free phone viewing in mind.
   - If a guest doesn't scroll immediately, an intelligent auto-glide gently guides them through the photographic journey, pauses comfortably at story notes, and lands at the couple's finale before smoothly gliding to event details.

4. **Luxury Celebration Cards (Slow 3D Perspective Reveal)**
   - Translucent glassmorphic ceremony cards with authentic South Indian motifs (Diya, Rings, Chandelier, Sacred Thread, and Sacred Thali/Kalasam).
   - **Mild Occasion Backgrounds**: Each card is layered with a subtle, occasion-themed atmospheric background image (marigold & jasmine entrance, betrothal filigree, evening reception chandelier bokeh, Vedic homam sacred fire, and traditional temple mandap) blended softly with a dark radial vignette for optimal text legibility.
   - Slow, silky scroll-triggered perspective transition (`rotateX`, `translateY`, and staggered delays) referencing modern luxury invitations.
   - Special regal golden highlight for the **Subha Muhurtham** ceremony.

5. **"Postcards from Coimbatore" (Interactive City Guide)**
   - Horizontally scrollable postcard gallery showcasing scenic landmarks & sacred destinations around Coimbatore: *Perur Pateeswarar Temple (3.5 km away), Adiyogi Shiva & Isha Yoga, Marudhamalai Hill Temple, Valparai Tea Hills, Siruvani Waterfalls, and Aliyar Dam*.
   - Vintage postal stamp styling with interactive tap discovery modals featuring rich history, distance from venue, and direct Google Maps navigation.

6. **The Sacred Invitation & Family Blessings**
   - **Dual-Day Clarity**: Prominently separates **Sunday, Nov 15** *(Welcome, Nitchayathartham & Grand Reception)* and **Monday, Nov 16** *(Auspicious Subha Muhurtham: 06:35 AM – 07:15 AM)*.
   - **Family Blessings**: Arched portraits honoring both the bride's and groom's families.
   - **Guest Utility**: One-tap *"Add to Calendar"* and Google Maps venue navigation for seamless arrival.

---

## 🎨 Visual & Technical Architecture

```
wedding-invite-3/
├── public/
│   ├── assets/
│   │   ├── audio/          # Background soundtrack ("Love Bug Has Bitten")
│   │   ├── coimbatore/     # Scenic postcard photography for Coimbatore destinations
│   │   ├── couple/         # Bride & Groom portraits
│   │   ├── family/         # Arched family portraits (bride & groom)
│   │   ├── film/           # High-fidelity AVIF & JPG responsive film frames
│   │   ├── logo/           # Handcrafted couple calligraphy (WebP)
│   │   └── occasions/      # Atmospheric backdrop imagery for each ceremony card
│   ├── preview.jpg         # WhatsApp / iMessage Open Graph social card
│   └── assets/save-the-date-preview.jpg
├── src/
│   ├── BrowserTint.js      # Dynamic mobile browser address bar color sync
│   ├── CinemaEngine.js     # High-performance Canvas rendering & motion blur
│   ├── DetailsSection.js   # Wedding details, schedule, family cards, calendar link
│   ├── FrameLoader.js      # Progressive background asset loader with progress bar
│   ├── Music.js            # Audio player with state memory and tap permissions
│   ├── ScrollController.js # Momentum-preserving native scroll listener & idle loop
│   ├── Storyboard.js       # Camera math, spatial linking (nest/unnest), and shot timing
│   ├── main.js             # Orchestrator, auto-glide controller, and lifecycle
│   ├── styles.css          # Silk textures, luxury typography, layout, and animations
│   └── weddingData.js      # Single source of truth for all wedding details & text
├── index.html              # Clean semantic entry point with rich SEO / OG tags
└── package.json            # Lightning-fast Vite setup with 0 runtime dependencies
```

---

## ⚡ Performance Engineering

- **Zero Runtime Dependencies**: Powered entirely by native Canvas 2D and modern browser APIs.
- **Microscopic Bundle Size**:
  - JavaScript: `~31 KB` (only `~13 KB` gzipped)
  - Stylesheet: `~19 KB` (only `~5 KB` gzipped)
- **Adaptive Image Delivery**: Dual AVIF and JPEG formats with responsive resolution scaling to preserve mobile data for guests on 4G/5G connections.
- **Hardware-Accelerated Fluidity**: `requestAnimationFrame` render loop idles immediately whenever the camera is static, ensuring cool battery temperatures on mobile devices.
- **Dynamic Mobile Tint**: Phone browser UI bars dynamically sample edge colors from the active photo frame, turning the entire browser window into a unified canvas.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `pnpm`

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the local Vite dev server:**

   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

### Production Build

To build the static production distribution:

```bash
npm run build
```

This compiles optimized bundles into the [`dist/`](./dist) directory in under 100 milliseconds.

---

## 🌐 Deployment (Edge CDN)

For guests opening the invite in India, fast edge data centers are key:

### Cloudflare Pages (Recommended)

1. Go to [Cloudflare Pages](https://dash.cloudflare.com/) &rarr; **Create application** &rarr; **Pages**.
2. Connect your Git repository (or use **Direct Upload** with the `dist/` folder).
3. Set Build command to `npm run build` and Output directory to `dist`.
4. _Result_: Instant global loading with local edge nodes in Mumbai, Chennai, Bengaluru, and Hyderabad.

### Vercel

Run directly in your terminal:

```bash
npx vercel
```

---

## 💍 Wedding Details

- **Groom**: Ashwin S
- **Bride**: Snegha S
- **Reception**: Sunday, November 15, 2026 · from 06:30 PM
- **Subha Muhurtham**: Monday, November 16, 2026 · 06:35 AM – 07:15 AM
- **Venue**: Athithi Mahal A/C, Pollachi Main Road, Kinathukadavu, Coimbatore

---

<p align="center">
  <i>Created with care for Ashwin & Snegha · November 2026</i>
</p>
