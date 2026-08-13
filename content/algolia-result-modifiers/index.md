---
title: "Algolia Result Modifiers"
description: "Post-processing scripts that reshape Algolia-injected result cards."
source: algolia-result-modifiers
---

Source: `algolia-result-modifiers/`

Small post-processing scripts that clean up or toggle content inside Algolia-injected
result cards (the expert cards rendered by the WfAlgolia integration). They don't talk
to Algolia themselves; they watch the results container and reshape what the injection
already put in the DOM, re-running automatically as results refresh, paginate, or load more.

- **[Companies](./companies.md).** Normalizes the comma-separated `also-worked-with` company list into a tidy, comma-and-space separated line.
- **[Learn Categories](./learn-categories.md).** Splits a learn card's comma-separated category slugs into one pill per category, mapped to official display names.
- **[Price Label](./price-label.md).** Shows the "consult" or "hire" price label on each expert card based on the card's expert type.
- **[Roles](./roles.md).** Splits a comma-separated `roles` value into one paragraph per role (or cleans a single role in place).
- **[Subcategories](./subcategories.md).** Splits a hit's `categories.lvl1` hierarchical paths into one Subcategory tag per leaf.

Each script is standalone: add only the ones the page needs, after the Algolia
integration itself. See the individual pages for the exact markup each one expects.
