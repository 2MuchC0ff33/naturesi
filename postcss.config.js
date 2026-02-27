import autoprefixer from 'autoprefixer';
import importPlugin from 'postcss-import';

export default {
  /* disable maps by default; previous versions emitted inline
     source‑maps which ended up in `assets/css/output.css` and were
     committing that file added a huge blob to history.  Builds now
     generate no map, and the development artifact is gitignored. */
  map: false,
  plugins: [
    importPlugin(),
    autoprefixer()
  ]
};
