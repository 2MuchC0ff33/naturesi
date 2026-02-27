import autoprefixer from 'autoprefixer';
import importPlugin from 'postcss-import';

export default {
  /*
     disable maps by default; previous versions emitted inline
     source‑maps which ended up in `assets/css/output.css` and were
     committing that file added a huge blob to history.  Builds now
     generate no map, and the development artifact is gitignored.
  */
  map: false,

  /*
     The build pipeline must bundle all partials into a single stylesheet
     before autoprefixer runs.  `postcss-import` resolves each `@import`
     and inlines the referenced file; without it autoprefixer would see
     only the top‑level file and leave the partials untouched.  Order is
     significant: the import plugin MUST appear before autoprefixer.
  */
  plugins: [
    importPlugin(),       // inline @import statements from partials
    autoprefixer()        // add vendor prefixes afterwards
  ]
};
