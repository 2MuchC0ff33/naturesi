import autoprefixer from 'autoprefixer';
import importPlugin from 'postcss-import';

export default {
  plugins: [
    importPlugin(),
    autoprefixer()
  ]
};
