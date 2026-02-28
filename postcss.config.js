import autoprefixer from 'autoprefixer';
import importPlugin from 'postcss-import';

export default {
  /*
     disable maps by default; previous versions emitted inline
     source‑maps which ended up in `assets/css/output.css` and were
     committing that file added a huge blob to history.  Builds now
     generate no map, and the development artifact is gitignored.

     Note: the current pipeline begins with Sass compiling
     `assets/css/main.scss` to `assets/css/output.css` (temporary).
     PostCSS reads that file, processes imports and prefixes, then
     writes the final bundle to `public/assets/css/main.css`.
  */
  map: false,

  /*
     The build pipeline must bundle all partials into a single stylesheet
     before autoprefixer runs.  `postcss-import` resolves each `@import`
     and inlines the referenced file; without it autoprefixer would see
     only the top‑level file and leave the partials untouched.  Order is
     significant: the import plugin MUST appear before autoprefixer.
     (Sass itself simply outputs whatever `@import` directives were
     present, so PostCSS is responsible for collapsing them.)
  */
  plugins: [
    importPlugin(),       // inline @import statements from partials
    autoprefixer()        // add vendor prefixes afterwards
  ]
};
