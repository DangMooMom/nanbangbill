# Heatwise product specification

## Product goal

Heatwise shows **what current electric heating usage would cost over 30 days**, **which heater costs the most to run**, and **how the estimate changes when hours or days of use change**.

- It estimates the running cost of registered electric resistance radiators and heaters. One entry is one physical heater.
- Out of scope: whole-home bills, standing charges, Direct Debit amounts, other appliances, tariff lookup, photo or CSV import, accounts, persistent storage, heater controls, a save feature, and goals or suggestions.
- UK English. Costs in £ (labelled as 30-day estimates), unit rate in p/kWh, energy in kWh, power in W.
- The implemented app is the design reference for layout, typography, colour and interaction across all four screens.

## Screens

The header steps are **My Heaters › Heating patterns › Cost analysis › Revised routine**. Heating patterns opens once a heater exists. The last two open once a baseline has been calculated.

### 1. My Heaters

- Starts empty. Users add a heater with a location and rated input power (W), and can edit or delete it.
- Location must contain more than whitespace; locations may repeat. Power must be a finite positive number, or the user explicitly ticks the **1,000 W assumption**. Assumed power is labelled "(assumed)" wherever it appears.
- "Try with sample data" loads three example heaters. Deleting a heater, or replacing existing heaters with the sample, asks for confirmation first.
- Continue to Heating patterns is enabled once at least one heater exists.

### 2. Heating patterns

- For each heater: **hours a day** (total on a day it is used, 0–24, any number) and **days a week** (whole number 0–7). Missing values are distinct from 0 and block calculation.
- One unit rate for all heaters. **The 25p/kWh example rate is selected by default** for sample and manual heaters, labelled as an example rather than the user's tariff. "My unit rate" is selected only by its radio button, its title or typing a rate; clicking the rate box just focuses it. The rate choice is independent of heater power, including the 1,000 W assumption, and loading sample data does not change it.
- **See my heating cost** calculates the baseline and opens Cost analysis. Errors are explained beside the relevant input.

### 3. Cost analysis

Read-only view of the baseline. Changes tried on Revised routine never alter it.

- **Totals:** 30-day cost, total kWh and average a day, with a caption giving the heater count and rate.
- **Where the money goes:** a cost-by-heater stacked bar with shares, a "costs the most" callout, a plain (non-selectable) colour key, and weekly use by heater.
- **How much does each heater cost to run?** A line chart of each heater's cost for the same running time, 0–24 hours, at the **selected unit rate**: cost = W ÷ 1,000 × hours × p/kWh ÷ 100. This is a single run, not a 30-day figure.
  - Hovering, tapping or using ←/→ (0.5 h steps) shows every heater's cost at that time, and how much more each costs than the cheapest. Equal costs read "cheapest" (or "same" when all are equal).
  - Heaters with the same power share a line label. The key lists each heater's power and cost an hour.
- **Usage and cost table:** always open, with plain heater names, power, hours a day, days a week, kWh, 30-day cost and share, plus a total row.
- **Try a different routine card:** invites users to see how different hours or days would change their 30-day cost, quoting the current cost. Its heading and button read “Try a different routine”, and the button opens Revised routine.

### 4. Revised routine

- **Revised plan:** original vs revised totals with stacked bars. Hatching marks only the empty space where one total is shorter than the other. A slim copy is pinned to the top while editing further down. One Reset restores all baseline usage.
- **Change usage by heater:** every heater is listed, ranked by original cost, with hours (− / number / +) and days (0–7). Each row shows original vs revised cost, the £ and % difference, and the new plan total beside the controls. Each heater can be reset on its own. Users adjust only the heaters they want; there is no separate selection step.
- Changes to several heaters add up in the revised total.
- **← Cost analysis** returns to the baseline view.

### All results screens

- **Zero baseline:** cost shares, % changes and the £ figure in the Try a different routine card are omitted, and manual changes still work.
- There are no "saved" or "trial" labels, because nothing is saved.

## Calculations and state

- **Energy (kWh)** = W ÷ 1,000 × hours a day × days a week × 30 ÷ 7. **Cost (£)** = kWh × p/kWh ÷ 100. The rate includes VAT. Values are rounded for display only.
- The estimate assumes rated power for the entered hours. It ignores weather, insulation, thermostats and comfort.
- **Navigation** keeps all inputs, the rate choice and trial changes.
- **A real change** to a heater, usage or the rate clears the baseline and trial, and returns from Cost analysis or Revised routine to Heating patterns. Retyping the same value is not a change.
- **Refreshing the page or opening a new tab** starts with an empty state.

## Acceptance criteria

Sample at the 25p/kWh example rate: Living room 1,000 W · 3 h · 7 days; Bedroom 500 W · 8 h · 7 days; Study room 500 W · 1 h · 3 days.

1. All four screens can be completed with sample data or manually registered heaters. The baseline is **£54.11 / 216.43 kWh**, and **Bedroom (£30.00)** costs the most.
2. On Revised routine, at desktop width and at 390 px, changing Living room from **3 to 2 hours** shows **£46.61** and a **£7.50 saving** where the change is made. Also changing Bedroom from **8 to 6 hours** shows **£39.11** and a **£15.00 saving**. Reset restores **£54.11** and the original usage.
3. Trial changes never alter Cost analysis or Heating patterns, which still show the original usage.
4. After registering a heater manually, with or without the 1,000 W assumption, Heating patterns opens with the example rate selected. An explicit own-rate choice survives navigation.
5. The run-cost chart uses the selected rate. At 25p, 4 h shows Living room **£1.00 (+£0.50 more)** and Bedroom and Study room **£0.50 (cheapest)**. At an own rate of 30p, Living room costs **£7.20 for 24 h**.

## Open decisions

- **Goals removed:** the original brief and spec required optional goals with hours-vs-days suggestions. They were removed before the first deployment. Revisit if they're wanted later.
- **Draft fields:** a half-typed "Add a heater" form is not kept when leaving the screen. Only registered data and choices are kept.
- **More than eight heaters:** heater colours repeat after eight, and colours 5–8 haven't been through the colour-blindness check.
- **Chart comparison reference:** the chart compares each heater with the cheapest to run. It was chosen as a default during the design pass and can be revisited.
