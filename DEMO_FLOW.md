# Demo Flow (3–5 minutes)

A suggested walkthrough for judges, matching what is actually built and
clickable in this prototype.

1. **Landing page** (`/`) — read the hero: "Know the climate. Know the risk.
   Know what to do next." Point out the prototype tag and the
   signal → prediction → risk → advisory flow diagram.

2. Click **"Explore climate intelligence"** → lands on `/login`.

3. Click **"Continue as demo farmer."** No real credentials are needed — this
   is explicitly a prototype/demo login.

4. You're on `/farmer/dashboard`, defaulted to **Maval, Pune** with
   **Soybean — Sowing**. Point out:
   - The overall risk badge (High).
   - The one-line monsoon/rain/crop summary.
   - The main recommendation, and the **"Why this recommendation?"**
     disclosure.

5. Change location: click the location pill in the navbar → `/location` →
   select **Pune → Baramati** → confirm. Note the dashboard now shows a
   different risk level and a different recommendation (Baramati is
   dry-spell dominant, so the advisory shifts to a moisture-stress
   recommendation).

6. Open **Climate** (`/farmer/climate`):
   - Show the 7 / 14 / 30-day tabs.
   - Show onset probability, dry-spell risk, heavy-rain risk and the stated
     confidence level.
   - Show the rainfall trend and temperature trend charts.
   - Point out the climate signal indicators list.

7. Open **Risk Map** (`/farmer/risk-map`):
   - Switch between the five layers (Overall / Rainfall / Dry-Spell /
     Heavy-Rain / Monsoon Onset) and note the markers recolour.
   - Click **Baramati** (or **Panhala**, which is heavy-rain dominant, for
     contrast) to open the side panel.
   - Read the **"Why is this area at risk?"** factors.
   - Click **"Open crop advisory for this block."**

8. On **Advisory** (`/farmer/advisory`):
   - Walk through the 4 steps: location → crop → crop stage → generate.
   - Show the recommendation, the "why," the numbered "what to do" steps,
     the water-action and watch-for callouts, and the causal-flow visual at
     the bottom (climate signal → agricultural impact → recommended action).

9. **Switch language**: click **मराठी** in the navbar. Show that the entire
   interface — navigation, dashboard, the advisory you just generated —
   switches to Marathi immediately, including the recommendation text
   itself (not just static labels).

10. Switch role: go back to `/login` (or use the browser back button) and
    click **"Continue as demo officer."**

11. On `/officer/dashboard`, show:
    - The high/critical/moderate/low block counts.
    - The high-risk locations list — click a different block to update the
      inspect panel (probabilities, risk drivers, recommended action).
    - Crop exposure and climate alerts.
    - The data/model status panel, explicitly labelled prototype/pending
      training.

12. Optionally open **Insights** (`/insights`) to show the historical
    rainfall-anomaly and dry-spell charts, and **About** (`/about`) for the
    problem statement and roadmap, if time allows.

## Talking points to close with

- Every number shown is simulated, but internally consistent — the map
  colour, the dashboard headline, and the advisory always agree, because
  they're all derived from the same block-level mock data.
- The three killer features (monsoon intelligence, risk map, crop advisory)
  are the product; everything else (dashboards, insights, about) exists to
  support them.
- The architecture is designed so a trained model and real IMD/ENSO/IOD/MJO
  data slot in without a UI rewrite — see `ARCHITECTURE.md` and
  `FUTURE_BACKEND.md`.
