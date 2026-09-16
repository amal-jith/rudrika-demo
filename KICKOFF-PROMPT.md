# Paste this into Claude Code as the first message

You are continuing the Rudrika by Tara e-commerce build for Ryzenforge. This folder is the complete handoff from the planning chat.

Read, in this order, before doing anything: CLAUDE.md, RUDRIKA-BUILD-PLAN.md, assets/ASSETS.md, then the ecommerce-client-build skill if it is installed on this machine (otherwise ask me for it).

Then start Phase 0 of RUDRIKA-BUILD-PLAN.md and work through the phases in order without stopping between them. Only stop at the points marked DECISION, and ask those questions in one batch when you reach them, not one at a time. Do not ask me for anything that is already answered in the three files.

Rules for this project, in addition to CLAUDE.md:
- The Quppayam template is the starting point for the real build. Never write a storefront or admin from scratch.
- Every schema change is additive and comes after a pg_dump once there is real data.
- Never print .env values, keys or tokens in this session. Read key names only with `cut -d= -f1 .env`.
- Write the word Ryzenforge exactly like that. No em dashes, no icons, no emojis in any content you write. Never write the word SEO in client-facing text.
- Keep a running log in docs/BUILD-LOG.md: date, what changed, what is next. Update it at the end of every phase.
- At the end of Phase 0 give me the rebuilt prototype file path so I can send it to Tara. At the end of every later phase give me the local URL, what to click to check the phase, and the open decisions.

Start now with Phase 0.
