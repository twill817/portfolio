# Review mode

Private, pin-style feedback on the live portfolio. Invited reviewers open a personal link, turn on **Comment**, click anything on the page, and leave a note. Normal visitors never load any of it.

## How it works

- `index.html` has a small loader. A link with `?review=<code>` saves the code in that browser and loads `assets/js/review.js` and `assets/css/review.css`. Without a code, nothing extra loads. `?review=off` turns it off again.
- Comments are stored in a free Supabase project. The browser can only call the `review_*` functions in `supabase-setup.sql`, and each one checks the reviewer's code first. The tables themselves are closed to the public API.
- Reviewer visits are left out of GoatCounter page views.
- Each reviewer gets their own named link, so comments are attributed and any link can be switched off later.
- Feedback is private: each reviewer sees only the threads they started, plus your replies. You see and can reply to everything.

## One-time setup

1. Create a free account at [supabase.com](https://supabase.com) and a new project (any name, e.g. `portfolio-review`; pick a US region; save the database password somewhere safe, though you won't need it here).
2. In the project, open **SQL Editor**, start a new query, paste the whole of `supabase-setup.sql`, and press **Run**. The result shows `your_owner_code`. Keep that private; it's your admin key.
3. Open **Project Settings → API Keys** (or **Data API**) and copy the **Project URL** and the **publishable** key (`sb_publishable_…`; the legacy `anon` key also works).
4. Put those two values in `SUPABASE_URL` and `SUPABASE_KEY` at the top of `assets/js/review.js` and push. Both are safe to publish.
5. Visit `https://tuckerwilliams.info/?review=<your_owner_code>`.

## Day to day

- **Invite someone:** Comments → Reviewers → type their name → Create link. The link is copied for you.
- **Switch someone off:** Reviewers → Switch off. Their comments stay.
- **Work through feedback:** open a pin or a list item, reply, then Resolve. Export downloads everything as Markdown.
- **Leave review mode on a device:** Comments → Leave review mode, or visit `?review=off`.

## Good to know

Free Supabase projects pause after about a week with little or no activity. You get an email first, the data is kept, and **Resume project** in the dashboard brings it back. Opening the site in review mode now and then is enough to keep it awake.
