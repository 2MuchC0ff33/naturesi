import autoprefixer from 'autoprefixer';
import importPlugin from 'postcss-import';

export default {
  /*
   * disable maps by default; previous versions emitted inline
   * source‑maps which ended up in `assets/css/output.css` and were
   * committing that file added a huge blob to history.  Builds now
   * generate no map, and the development artifact is gitignored.
   *
   * IMPORTANT: autoprefixer only touches rules that PostCSS has
   * actually parsed. Since our architecture splits the stylesheet
   * into many `@import`ed partials, we inline them before prefixing.
   * `postcss-import` is responsible for bundling; it **must** run
   * before autoprefixer in the plugin list, otherwise the output will
   * still contain unprocessed `@import` lines and prefixes will be
   * missing from the partials.  The accompanying test file checks that
   * no partial imports remain (see `tests/check_css_build.cjs`).
   */
  map: false,
  plugins: [
    importPlugin(), // inlines `@import`s so autoprefixer sees all rules
    autoprefixer()
  ]
};
