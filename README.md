# Indian Railways CADAT Psycho Speed Test Simulator (RDSO)

A responsive, high-performance web simulation of the **Indian Railways CADAT (Computer Aided Driver Aptitude Test)** / **RDSO Psychotechnical Test Battery** conducted for:
- **Assistant Loco Pilot (ALP)**
- **Station Master (SM)**
- **Train Operator / Metro Motorman / High-Speed Train Drivers**

Designed specifically for railway employees and candidates to practice anytime, anywhere on **smartphones, tablets, and computers**.

**Live:** https://cadat-railway-psycho-test.vercel.app — open it on a phone from any network, no install and no account needed unless you add Supabase keys (see the deployment guide).

---

## 📸 5 Sub-Tests Included (Exact CADAT Exam Match)

This simulator implements all 5 tests from the official Indian Railways CADAT examination:

| Test # | Sub-Test Name | Keypad Inputs | Exam Objective |
|---|---|---|---|
| **Test 1** | **Complex Reaction Time Test** | `L` (Arm/Stop), `Y` (Yellow), `R` (Red), `G` (Green) | Measure visual psychomotor response speed upon signal stimulus. |
| **Test 2** | **Form Perception Test** | `1`, `2`, `3`, `4`, `5` | Rapid visual discrimination: identify the odd figure out of 5 shapes. |
| **Test 3** | **Test of Concentration (4-Dots)** | `↑` (Mark 4), `↓` (Unmark), `→` (Next), `←` (Prev) / Tap | Rapid scanning matrix to locate and mark only 4-dot groups. |
| **Test 4** | **Speed Perception Test (Loco & Tunnel)** | `H` (Start Loco), `L` (Stop Loco at Tunnel Exit) | Gauge moving train velocity & anticipate tunnel exit arrival time. |
| **Test 5** | **Same Colour & Sequence Test** | `L` (5 Same Lights), `H` (Sequence: Yellow → Red → Green) | Dual-vigilance divided attention and sequence pattern tracking. |

---

## 📱 Mobile-First Phone Experience

- **Thumb-Optimized Keypads**: Specially designed virtual keypads docked at the bottom of the screen with large touch zones for instant thumb reactions.
- **Direct Touch Scanning**: In Test 3 (4-Dots Concentration), you can tap directly on any box on touchscreens.
- **Web Audio Sound Effects**: Zero-latency synthesized audio cues (beeps, train whistle, correct chime, error buzz).
- **Mobile Haptic Feedback**: Integrates with the browser `Vibration API` to provide physical tactile sensation on phone button taps.
- **Add to Home Screen**: `manifest.json` gives the site an icon and a standalone window on Android or iOS. There is no service worker, so the page itself still needs a connection — once a test is running it is fully in-memory, but you cannot open it offline.
- **Fullscreen Mode**: Toggle button to hide browser navigation bars and prevent accidental gestures.

---

## 📊 RDSO T-Score Engine & Cutoff Assessment

Indian Railways RDSO evaluates aptitude using standardized **T-Scores**:

$$T = 50 \pm 10 \times \left(\frac{X - \mu}{\sigma}\right)$$

- **Statutory Cutoff**: A candidate must achieve a T-score of **$\ge 42.0$ in each sub-test independently** to be deemed psychotechnically qualified.
- The simulator provides instant T-score calculations, raw score metrics, error breakdowns, and a unified 5-test Battery Scorecard!

**About the means and standard deviations.** The $\mu$ and $\sigma$ in `src/utils/scoring.ts` are calibrated to *this* on-screen instrument, not published RDSO statistics — the board's real norms come from its own candidate population on paper-and-pencil apparatus. They are chosen so the score each sub-test can physically produce spans the cutoff: Test 3, for example, is one 80-cell page holding roughly 30 four-dot groups, so its net score cannot exceed ~30 and a mean of 65 would have made passing impossible no matter how carefully a candidate scanned. Treat the pass/fail line as practice guidance, not a prediction of your board result.

---

## 🚀 Live Deployment Guide

The web application is built with Vite + React + TypeScript + Tailwind CSS and is compiled into static files inside the `dist/` directory.

### Before you deploy: accounts, sync and the login log (optional)

Signed-in candidates get their history on any device, and every sign-in is written to a
`cadat_logins` table you can read in the Supabase dashboard. Without these two variables
the app skips the sign-in screen entirely and stores everything in that browser only, so
a plain static deploy still works exactly as it did before.

1. Create a Supabase project (any project works — the tables are prefixed `cadat_`, so this
   app can share a project with your other apps and a candidate then signs into all of them
   with one account).
2. Run `supabase/schema.sql` in the SQL editor. It creates `cadat_results`, `cadat_batteries`
   and `cadat_logins` with row-level security, so a candidate can only ever read their own rows.
3. Copy the **Project URL** and the **anon public key** — never the `service_role` key, which
   would bypass that security and is worthless in a browser bundle anyway.
4. Add them in Vercel as **Config** (not Secret — `VITE_` variables are inlined into the
   bundle at build time, so a redeploy is required after changing them):
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   vercel deploy --prod
   ```
5. New sign-ups get a confirmation email from Supabase; the candidate must confirm it before
   the first sign-in. Turn that requirement off only if you want instant accounts for a demo.

### Option 1: Deploy to Vercel (1-Click)
1. Push this folder to a GitHub repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/cadat-psycho-test.git
   git branch -M main
   git push -u origin main
   ```
2. Open [vercel.com](https://vercel.com) and click **"Add New" → "Project"**.
3. Select your GitHub repository. Vercel automatically detects the Vite configuration and deploys it live with a free HTTPS URL!

Or via terminal:
```bash
npx vercel
```

### Option 2: Deploy to Netlify (Drag & Drop or CLI)
1. Run build:
   ```bash
   npm run build
   ```
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the `dist` folder into the browser window.
3. Your live link is generated immediately!

Or via CLI:
```bash
npx netlify deploy --prod --dir=dist
```

### Option 3: Deploy to GitHub Pages (Automated Workflow Included)
This repository includes a pre-configured GitHub Actions workflow in `.github/workflows/deploy.yml`.
1. Push code to GitHub.
2. In your GitHub repository, navigate to **Settings → Pages**.
3. Under **Build and deployment**, set Source to **GitHub Actions**.
4. Every push to `main` will automatically build and publish to `https://<username>.github.io/<repo>/`.

---

## 💻 Local Practice & Development

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build locally
npm run preview
```

---

## ⌨️ Desktop Physical Keyboard Controls
When practicing on a PC / laptop:
- `L`: Arm test (Test 1), Stop loco at tunnel exit (Test 4), Five same color (Test 5)
- `H`: Start loco (Test 4), Sequence match (Test 5)
- `Y`: Yellow stimulus
- `R`: Red stimulus
- `G`: Green stimulus
- `1` - `5`: Form selection numbers (Test 2)
- `↑`, `↓`, `←`, `→`: Arrow keys for 4-dots grid navigation (Test 3)

---

## 👨‍💻 Credits & Author
- **Designed & Developed by:** **Ale Sathwik**
- **Major:** Computer Science and Engineering (CSE) Student
- **Institute:** Vignana Bharathi Institute of Technology (VBIT)

