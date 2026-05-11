# Note Mastery

Note Mastery is an Obsidian companion plugin for the community plugin
[Spaced Repetition](https://github.com/st3v3nmw/obsidian-spaced-repetition).
It shows note-level mastery by aggregating the scheduling data from flashcards in
each Markdown file.

## Requirements

- Obsidian 1.2.8 or newer.
- The Spaced Repetition community plugin installed and used for flashcard review.
- Spaced Repetition must store card scheduling data in notes (`dataStore: NOTES`).
- Cards need review history comments such as `<!--SR:!2026-05-12,3,250-->`.

Note Mastery does not review cards and does not create scheduling data. It only
reads existing Markdown files and its own plugin settings.

## What It Shows

The sidebar dashboard lists every note that contains `#flashcards` or SR
scheduling comments and shows:

- note mastery percentage
- total estimated cards
- reviewed cards
- due cards
- average interval
- average ease
- next due date

The first version supports Spaced Repetition's Markdown comment format:

```md
Question::Answer
<!--SR:!2026-05-12,3,250-->
```

Multiple schedule segments in one comment are also supported:

```md
Question:::Answer
<!--SR:!2026-05-12,3,250!2026-05-13,4,260-->
```

## Mastery Formula

For each reviewed card:

```txt
cardMastery = 0.5 * intervalScore + 0.3 * easeScore + 0.2 * dueScore
```

The note score is the average reviewed-card mastery multiplied by review
coverage:

```txt
noteMastery = average(cardMastery) * (reviewedCards / totalCards)
```

Unreviewed cards therefore lower the note score instead of being treated as
known.

## Development

```bash
npm install
npm test
npm run build
npm run install:dev-vault
```

The development vault path is:

```txt
/Users/tella/Development/note-mastery-dev-vault
```

To install the built plugin into the main vault:

```bash
npm run install:vault
```

Only `manifest.json`, `main.js`, and `styles.css` are copied into the vault.

## Release Files

An Obsidian install needs only:

- `manifest.json`
- `main.js`
- `styles.css`

## License

MIT
