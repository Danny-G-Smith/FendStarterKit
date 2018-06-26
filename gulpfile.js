// Require our dependencies
const autoprefixer = require('autoprefixer');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const del = require('del');
const eslint = require('gulp-eslint');
const gulp = require('gulp');
const gutil = require('gulp-util');
const notify = require('gulp-notify');
const pleeease = require('gulp-pleeease');
const plumber = require('gulp-plumber');
const preprocess = require('gulp-preprocess');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const stripDebug = require('gulp-strip-debug');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
const pkg = require('./package.json');
const devBuild = ((process.env.NODE_ENV || 'development')
   .trim().toLocaleLowerCase() !== 'production');

// Set assets paths.
const paths = {
   'css': ['app/css/**/*.css'],
   'js': ['app/js/**/*.js'],
   'scss': ['app/scss/**/*.scss'],
   'tests': ['tests/spec/**/*.js'],
};

const dist = {
   'css': ['./dist/css/'],
   'js': ['./dist/js/'],
};

const html = {
   in: ['app/**/*.html'],
   out: ['./dist/'],
   context: {
      devBuild: devBuild,
      author: pkg.author,
      version: pkg.version,
   },
};

const pleeeaseOpts = {
   'in': 'app/scss/style.scss',
   'out': 'app/css/style.css',
   'autoprefixer': {'browsers': ['last 2 versions', '> 2%']},
   'rem': ['18px'],
   'pseudoElements': true,
   'mqpacker': true,
   'minifier': !devBuild,
};

const destFolder = 'dist/';

/**
 * Handle errors and alert the user.
 */
function handleErrors() {
   const args = Array.prototype.slice.call(arguments);

   notify.onError({
      'title': 'Task Failed [<%= error.message %>',
      'message': 'See console.',
      'sound': 'Sosumi', // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
   }).apply(this, args);

   gutil.beep(); // Beep 'sosumi' again.

   // Prevent the 'watch' task from stopping.
   this.emit('end');
}

// build HTML files
gulp.task('html', function() {
   return gulp.src(html.in)
   // Deal with errors.
      .pipe(plumber({'errorHandler': handleErrors}))
      .pipe(preprocess({context: html.context})) // pass object with temp vars
      .pipe(gulp.dest(html.out));
});

// compile Sass
gulp.task('styles', function(done) {
   del([dist.css + 'style.css', dist.css + 'style.min.css']);
   gulp.src(paths.scss)
   // Deal with errors.
      .pipe(plumber(
         {'errorHandler': handleErrors}
      ))
      .pipe(pleeease())
      .pipe(rename({
         extname: '.css',
      }))
      .pipe(gulp.dest(dist.css))
      .pipe(rename({
         suffix: '.min',
         extname: '.css',
      }))
      .pipe(gulp.dest(dist.css))
      .pipe(browserSync.stream());
   done();
});

gulp.task('maps', function(done) {
   gulp.src(paths.scss, {base: '.'})
   // Deal with errors.
      .pipe(plumber({'errorHandler': handleErrors}))
      .pipe(sourcemaps.init())
      .pipe(pleeease())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('./dist'));
   done();
});

/**
 * Concatenate and transform JavaScript.
 *
 * https://www.npmjs.com/package/gulp-concat
 * https://github.com/babel/gulp-babel
 */
gulp.task('concat', () =>
   gulp.src(paths.js)

   // Deal with errors.
      .pipe(plumber({'errorHandler': handleErrors}))

      // Convert ES6+ to ES2015.
      .pipe(babel({
         presets: ['ES2015'],
      }))

      // Concatenate partials into a single script.
      .pipe(concat('app.js'))

      // Save the file.
      .pipe(gulp.dest(destFolder))
);

/**
 * Minify compiled JavaScript.
 *
 * https://www.npmjs.com/package/gulp-uglify
 */ // gulp.series('concat'),
gulp.task('uglify', function(done) {
   if (devBuild) {
      gulp.src(paths.js)
         .pipe(plumber({'errorHandler': handleErrors}))

         // Convert ES6+ to ES2015.
         .pipe(babel({
            presets: ['ES2015'],
         }))
         .pipe(gulp.dest(dist.js));
   } else {
      gulp.src(paths.js)
         .pipe(concat('app.js'))
         .pipe(plumber({'errorHandler': handleErrors}))

         // Convert ES6+ to ES2015.
         .pipe(babel({
            presets: ['ES2015'],
         }))
         .pipe(stripDebug())
         .pipe(uglify())
         .pipe(rename({'suffix': '.min'}))
         .pipe(gulp.dest(dist.js));
   }
   done();
});

/**
 * JavaScript linting.
 *
 * https://www.npmjs.com/package/gulp-eslint
 */
gulp.task('js:lint', () =>
   gulp.src(paths.js)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError())
);
/**
 * Process tasks and reload browsers on file changes.
 *
 * https://www.npmjs.com/package/browser-sync
 */
gulp.task('watch', function() {
   // Run tasks when files change.
   gulp.watch(html.in, gulp.series('html'));
   gulp.watch(paths.css, gulp.series('styles'));
   gulp.watch(paths.js, gulp.series('scripts'));
   gulp.watch(paths.js, gulp.series('js:lint'));
});

/**
 * Create individual tasks.
 */
gulp.task('html', gulp.series('html'));
gulp.task('scripts', gulp.series('uglify'));
gulp.task('styles', gulp.series('styles'));
gulp.task('maps', gulp.series('maps'));
gulp.task('lint', gulp.series('js:lint'));
gulp.task('default', gulp.series('styles', 'scripts'));
