# Echoic Direct Outreach Kit

Goal: convert 3-5 of your first 30 outreaches into paying customers + testimonials.

At your stage, direct outreach beats paid ads. Authors with finished but un-audiobooked manuscripts are a tiny, identifiable, reachable audience.

---

## Phase 1: Build a target list (1-2 hours)

You want indie authors who:
1. Have a published ebook (proves they finished a manuscript)
2. Do NOT have an audiobook on Audible (proves they have the gap you fix)
3. Are *active* online (so you can DM them)

### Sources, ranked by signal density

| Source | What to search | Why it works |
|---|---|---|
| **Twitter/X** | `"audiobook coming soon" -is:retweet`, `"working on the audiobook" -is:retweet`, `"my audiobook is finally" -is:retweet` | Authors literally announcing the gap |
| **Reddit r/selfpublish** | New posts mentioning "audiobook", "ACX wait", "narrator cost" | Active authors actively discussing the pain |
| **Amazon KDP** | Browse genre top-100. Check each book for "Audiobook" tab. If missing → lead. | High-intent: they're already selling on Amazon |
| **Goodreads** | Author profiles with `<5` audiobooks but `>3` ebooks | Catalog gap |
| **Substack / Patreon** | Authors selling serial fiction or novellas | Tech-comfortable, already monetizing |

### What to record (one row per author)

```
| Name | Handle | Book title | Genre | Word count est. | Ebook URL | Why no audiobook (guess) |
```

Target: 30 leads before you send anything. Tiered list lets you A/B different DM angles.

---

## Phase 2: Build a custom 60-sec audio sample

This is your differentiator. Every DM includes a personalized audio file generated from their book's "Look Inside" excerpt.

Use `scripts/generate_outreach_sample.py` (see below) — it takes an author name + a text excerpt (paste from Amazon Look Inside) and produces a WAV file you can attach to the DM.

**Time per prospect: ~3 minutes** (copy excerpt → run script → wait for generation).

---

## Phase 3: DM templates

Pick ONE template per channel. Don't multi-template, don't sound automated. Send 5-10 per day, no more (rate-limit on most platforms).

### Template A — Twitter/X DM (warmer, ~3 sentences)

> Hey [Name] — saw your tweet about "[their tweet snippet]". I built echoic.studio, a tool that turns manuscripts into audiobooks with AI character voices for $9.99 instead of $2-5k. I made a 60-sec sample from the opening of [Book Title] — would you want to hear it? No catch, just curious if the narration matches what you'd want.

Why it works:
- References a specific tweet → not a blast
- States the offer in one line
- Lower-cost ask ("want to hear it?") before any conversion ask
- Specific book title proves you read it

### Template B — Reddit DM (after commenting helpfully on r/selfpublish)

> Just commented on your thread — also I noticed you mentioned not having an audiobook. I'm building echoic.studio (AI-narrated audiobooks, $9.99/book, you own the file). I generated a 60-sec sample from your published opening, happy to send if interested. Not trying to spam, you can ignore. Reply yes and I'll DM the file.

### Template C — Cold email (if you have it from their site/Substack)

> Subject: AI-narrated 60-second sample of [Book Title]
>
> Hi [Name],
>
> I built echoic.studio because indie authors keep telling me studio narration costs more than their book earns. Mine does it for $9.99/book and you own the MP3 outright (sell on Google Play Books, Apple Books, Kobo, your site).
>
> I generated a 60-second sample of the opening of [Book Title]. If it sounds wrong for your book, no harm — but if the voices fit, you can convert the full book today for $9.99.
>
> Sample attached. Reply with thoughts (positive or negative — I want to know).
>
> Boyuan
> echoic.studio

### What NOT to do

- Don't send the same DM to >5 people without iterating
- Don't open with the price (you'll be auto-classified as spam)
- Don't ask for testimonials in the first message
- Don't follow up more than once

---

## Phase 4: Convert + capture

Anyone who replies positively:
1. Send them a free Single Book credit (you have admin grant endpoint)
2. Walk them through their first conversion via DM/email
3. After they receive the audiobook, ask: "Mind if I quote your reaction on echoic.studio?"
4. Even a one-line "this is wild — sounded like a real narrator" is worth its weight on a cold-traffic landing page

Track in a spreadsheet:
```
| Date | Author | Channel | Reply? | Converted? | Quote captured? |
```

---

## Phase 5: Measure & iterate

After ~30 sends, calculate:
- Reply rate (target: 15-25%)
- Conversion rate of repliers (target: 10-20%)
- Time per conversion

If reply rate < 10%, the DM template is wrong (not the product).
If reply rate is OK but no conversion, the *sample* isn't impressive enough — try a longer excerpt or different voice casting.

Iterate the DM weekly. Stop after 100 sends and review.

---

## What I (Claude) can't do

I cannot send DMs from your accounts. You need to:
- Use your own Twitter/X account (Meta/Reddit have anti-bot protections)
- Manually copy the audio file into each DM
- Manually personalize the first sentence per prospect

I CAN help you:
- Write/iterate DM copy when you share what's working/failing
- Generate sample audio at scale via the script
- Triage replies and draft responses

Run the script as: `python scripts/generate_outreach_sample.py --name "Author Name" --book "Book Title" --text-file excerpt.txt`
