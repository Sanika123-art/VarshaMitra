# Project Overview

## The problem

District-level weather bulletins tell you it will rain "over Pune district."
They do not tell a farmer in Maval, growing soybean, currently sowing, what
to do about it this week. That gap — between a forecast and a decision — is
where crop losses actually happen: a sowing decision made on a single
misleading rain event, an irrigation cycle wasted right before heavy rain, a
dry spell that isn't noticed until the crop is already stressed.

## Who this is for

- **Farmers**, who need one clear answer — risk level, recommendation, reason
  — in their own language, without needing to interpret a weather report.
- **Agricultural officers / administrators**, who need a regional view: which
  blocks are at elevated risk right now, which crops are exposed, and where
  to focus outreach.

## Product philosophy

**PREDICT → VISUALIZE → DECIDE → ACT**

VarshaMitra does not stop at showing weather information. Every screen is
built to answer a decision-oriented question:

- What is likely to happen? *(Hyperlocal Monsoon Intelligence)*
- What does that mean for this location? *(Hyperlocal Climate Risk Map)*
- What does that mean for my crop? *(Crop-Specific Advisory)*
- What should I do now? *(the recommendation itself, in plain language)*

## Why hyperlocal matters

Monsoon onset, dry spells and heavy rainfall vary sharply within a single
district — sometimes within a single block. A generic, district-level
forecast averages this variation away. VarshaMitra's block-level, crop-aware
view is what turns a generic forecast into a decision a farmer can trust.

## What this prototype is (and isn't)

**Is:** A fully interactive, end-to-end frontend prototype with realistic,
internally-consistent mock data, built on an architecture that a real
prediction backend can be dropped into without a UI rewrite.

**Isn't:** A production system. There is no live model, no live IMD/ENSO/IOD/
MJO ingestion, and no real administrative boundary data in this build. See
[`DATA_SOURCES.md`](./DATA_SOURCES.md), [`AI_ML_PLAN.md`](./AI_ML_PLAN.md) and
[`FUTURE_BACKEND.md`](./FUTURE_BACKEND.md) for what the real version would
connect to.

## Expected impact (future, trained system)

- Fewer failed or badly-timed sowings from acting on a single misleading rain
  event.
- Better-timed supplemental irrigation during dry spells.
- Administrators who can see regional risk building before it becomes crop
  loss, instead of after.
