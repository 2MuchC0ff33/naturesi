import autoprefixer from 'autoprefixer';
import importPlugin from 'postcss-import';
import jitProps from 'postcss-jit-props';

export default {
  /*
     disable maps by default; previous versions emitted inline
     source‑maps which ended up in `assets/css/output.css` and were
     committing that file added a huge blob to history.  Builds now
     generate no map, and the development artifact is gitignored.

     Note: the current pipeline begins with Sass compiling
     `assets/css/main.scss` to `assets/css/output.css` (temporary).
     PostCSS reads that file, processes imports and prefixes, then
     writes the final bundle to `public_html/assets/css/main.css`.
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
    // just-in-time custom properties: scans compiled CSS for `var()`
    // usages and emits only the referenced tokens. the build now relies on
    // this plugin exclusively for Open Props values; the static import in
    // `partials/vendors/_open-props.scss` was removed to avoid duplicating
    // declarations. the `files` array still points at the upstream package
    // so the extractor knows which props are available.
    jitProps({
      files: ['node_modules/open-props/open-props.min.css']
      // additional props may be added here if the project defines its own
    }),
    // Ensure any @charset rule is the very first thing in the output. the
    // JIT token injector may add a `:root` block early; this plugin moves
    // the charset back to the front, preserving compliance with the CSS spec.
    {
      postcssPlugin: 'ensure-charset-first',
      OnceExit(root) {
        // run after all other plugins (jitProps etc.) have finished adding
        // rules; move any charset rule to the front before output.
        let charsetRule;
        root.walkAtRules('charset', atRule => {
          charsetRule = atRule.clone();
          atRule.remove();
        });
        if (charsetRule) {
          root.prepend(charsetRule);
        }
      }
    },
    autoprefixer()        // add vendor prefixes afterwards
  ]
};
