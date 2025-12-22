This folder contains Gabu's gallery images and a static manifest used by the site.

Important: GitHub Pages and other static hosts do not run server-side PHP. The gallery on the
static site therefore relies on a static file named `manifest.json` in this folder which lists
image filenames included in the gallery.

How to update the gallery
- Add or remove image files (e.g. `1.jpeg`, `2.jpeg`, ...).
- Update `manifest.json` to include the exact filenames (relative to this folder).

manifest.json example
[
  "1.jpeg",
  "2.jpeg",
  "3.jpeg"
]

If you want automation locally
- When developing locally you can use a small script to generate `manifest.json` by listing
  the directory contents. Do not commit any server-side scripts (PHP) to a repository intended
  for GitHub Pages.

Removing `list.php`
- If you prefer not to keep the legacy `list.php` file in the repository, remove it with:

  git rm images/gabu/list.php
  git commit -m "Remove legacy PHP file; use manifest.json for static gallery"

Then push to your remote as usual.

If you'd like, I can remove `list.php` for you (create a commit) — tell me whether you'd like
that or if you'd prefer to keep it as harmless documentation.
