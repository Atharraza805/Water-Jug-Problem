# 💧 AquaSolve — Water Jug Problem Interactive Visualizer

A beautiful, interactive web application that solves and visualizes the classic **Water Jug Problem** step-by-step using the **Breadth-First Search (BFS)** algorithm. Built with pure HTML, CSS, and JavaScript — no frameworks, no build tools, no setup required.

---

## 🚀 Quick Start

1. Download or clone the project folder
2. Make sure all three files are in the **same directory**:
   ```
   project/
   ├── index.html
   ├── styles.css
   └── script.js
   ```
3. Open `index.html` in any modern browser
4. That's it — no installation, no server needed!

---

## 🧩 What is the Water Jug Problem?

You are given two jugs with fixed capacities and an unlimited water source. The goal is to measure an exact target amount of water using only these operations:

| Operation | Description |
|-----------|-------------|
| **Fill A** | Fill Jug A completely from the tap |
| **Fill B** | Fill Jug B completely from the tap |
| **Empty A** | Pour all water out of Jug A |
| **Empty B** | Pour all water out of Jug B |
| **Pour A → B** | Pour from Jug A into Jug B until B is full or A is empty |
| **Pour B → A** | Pour from Jug B into Jug A until A is full or B is empty |

**Classic example:** With a 4L jug and a 3L jug, measure exactly 2L.

---

## ✨ Features

### 🎨 Visual Design
- **Glassmorphism UI** — frosted glass panels with `backdrop-filter: blur`
- **Animated ambient orbs** — floating cyan, indigo, emerald and gold light blobs in the background
- **Grid overlay** — subtle blueprint-style dot grid
- **Dark / Light mode toggle** — full theme switch with smooth transitions
- **Responsive layout** — works on desktop, tablet, and mobile

### 🪣 Jug Simulation
- **3D-style glass jugs** with inner shine reflections and depth shadows
- **Animated blue water** — vivid gradient fill that rises and falls smoothly
- **Rocking wave surface** — SVG wave animates side to side on the water top
- **Bubble physics** — bubbles spawn and float upward whenever water level rises
- **Splash effect** — ripple ring appears when water lands in a jug
- **Pour stream animation** — liquid tube with flowing highlight between jugs during pour steps
- **Drip droplets** — three animated drops fall during any pour operation
- **Ruler tick marks** — etched measurement lines inside each jug
- **Gold glow pulse** — the winning jug glows gold when the target is reached
- **Cyan highlight glow** — active jug glows blue on every step
- **Mini progress bars** — compact fill indicators below each jug

### 🧠 Algorithm
- **BFS (Breadth-First Search)** guarantees the **shortest possible solution path**
- Explores all reachable states level by level
- Detects impossible problems instantly using the **GCD rule**: a solution exists only if `GCD(capA, capB)` divides the target
- Handles all 6 operations per state systematically

### 📖 Step Explanations
Each step provides three layers of explanation:
- **Action title** — what was done (e.g. "Pour Jug A → Jug B — 3L transferred")
- **Detail sentence** — full description of what happened and the resulting state
- **Why (BFS reasoning)** — why this operation was chosen and what constraint it satisfies
- **Before → After chips** — visual state transition showing `(A, B)` values

### 🕹️ Controls
| Control | Function |
|---------|----------|
| **Solve & Simulate** | Run BFS and load all steps |
| **Prev / Next** | Navigate one step at a time |
| **Auto Play** | Play through all steps automatically |
| **Pause** | Stop autoplay mid-sequence |
| **Reset** | Clear everything and start fresh |
| **Speed slider** | Control autoplay from fast (0.2s) to slow (2.5s) per step |
| **Theme toggle** | Switch dark ↔ light mode |

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `→` or `N` | Next step |
| `←` or `P` | Previous step |
| `Space` | Play / Pause autoplay |
| `R` | Reset everything |

### 📋 Step History Panel
- Full scrollable list of every step in the solution
- Click any step to jump directly to it
- Active step is highlighted
- Goal step is marked with a gold accent

### 🔬 BFS Trace Panel
- Live display of **current state** and **next state**
- **Queue preview** — shows upcoming states the BFS has queued
- Updates in real time as you navigate steps

### 🎉 Victory Effects
- **Confetti burst** — 80 multi-colored particles explode on goal reached
- **Victory banner** — animated success message with step count
- **Gold jug glow** — the jug holding the target amount pulses gold

---

## 📐 How the BFS Algorithm Works

```
Start: (0, 0)  — both jugs empty

For each state (a, b), generate up to 6 new states:
  1. (capA, b)          ← Fill A
  2. (a, capB)          ← Fill B
  3. (0, b)             ← Empty A
  4. (a, 0)             ← Empty B
  5. (a - x, b + x)     ← Pour A→B  where x = min(a, capB - b)
  6. (a + y, b - y)     ← Pour B→A  where y = min(b, capA - a)

Stop when: a == target OR b == target
```

BFS explores states in order of fewest steps, so the first solution found is always the **optimal (shortest) path**.

### Solvability Check
A solution exists if and only if:
```
target % GCD(capA, capB) == 0
```
If this condition fails, AquaSolve shows a clear error message before running BFS.

---

## 📁 File Structure

```
project/
│
├── index.html     — Semantic HTML structure
│                    Jug containers, input fields, panels,
│                    history list, BFS trace strip, header, footer
│
├── styles.css     — All visual styling
│                    CSS variables, glassmorphism, animations,
│                    jug 3D effects, water gradient, wave/bubble
│                    keyframes, responsive breakpoints
│
└── script.js      — All logic and interactivity
                     BFS solver, step renderer, explanation
                     builder, pour/splash/bubble animators,
                     history builder, autoplay, keyboard nav,
                     confetti, theme toggle
```

---

## 🎓 Academic Use

This project is designed for **academic presentation and viva**. It clearly demonstrates:

- How BFS explores a state space graph
- Why the GCD theorem determines solvability
- The exact sequence of operations the algorithm selects
- The state `(A, B)` at every point in the solution
- Why each individual step was taken (shown in the explanation panel)

It is suitable for use in:
- AI / Algorithm courses
- Data Structures demonstrations
- Computer Science lab vivas
- Academic project exhibitions

---

## 🌐 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome 88+ | ✅ Full |
| Firefox 87+ | ✅ Full |
| Edge 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Mobile Chrome | ✅ Full |
| Mobile Safari | ✅ Full |

> **Note:** `backdrop-filter` (glassmorphism blur) requires a modern browser. The app functions fully without it on older browsers — only the frosted glass effect won't appear.

---

## 🛠️ Customization

All colors are defined as CSS variables at the top of `styles.css`:

```css
:root {
  --accent:      #38bdf8;   /* primary blue accent */
  --water-a:     #38bdf8;   /* Jug A water color */
  --water-b:     #1e9eeb;   /* Jug B water color */
  --success:     #34d399;   /* goal/victory green */
  --gold:        #fbbf24;   /* goal jug glow */
  --bg-deep:     #050d1a;   /* page background */
  --glass-bg:    rgba(10, 25, 50, 0.55);  /* panel glass */
}
```

Change any of these to retheme the entire app instantly.

---

## 👨‍💻 Tech Stack

| Technology | Usage |
|------------|-------|
| **HTML5** | Semantic structure, SVG jug water wave |
| **CSS3** | Glassmorphism, keyframe animations, CSS variables, grid/flex layout |
| **Vanilla JavaScript** | BFS algorithm, DOM manipulation, animation control |
| **Google Fonts** | Outfit (display) + JetBrains Mono (code/numbers) |

No external libraries. No npm. No build step.

---

## 📄 License

Free to use for educational and academic purposes.
