// Require our dependencies
const babel       = require('gulp-babel');
const concat      = require('gulp-concat');
const cssnano     = require('gulp-cssnano');
const eslint      = require('gulp-eslint');
const gulp        = require('gulp');
const gutil       = require('gulp-util');
const notify      = require('gulp-notify');
const plumber     = require('gulp-plumber');
const rename      = require('gulp-rename');
const uglify      = require('gulp-uglify');
const browserSync = require('browser-sync').create();
const reload      = browserSync.reload;

// Set assets paths.
const paths = {
   'css': ['app/css/*.css'],
   'scripts': [
      'app/js/*.js',
      'app/js/**/*.js'
   ]
};

const htmlWatch = 'app/*.html';

const destFolder = 'dist/';

/**
 * Handle errors and alert the user.
 */
function handleErrors() {
   const args = Array.prototype.slice.call(arguments);

   notify.onError({
      'title': 'Task Failed [<%= error.message %>',
      'message': 'See console.',
      'sound': 'Sosumi' // See: https://github.com/mikaelbr/node-notifier#all-notification-options-with-their-defaults
   }).apply(this, args);

   gutil.beep(); // Beep 'sosumi' again.

   // Prevent the 'watch' task from stopping.
   this.emit('end');
}

/**
 * Concatenate and transform JavaScript.
 *
 * https://www.npmjs.com/package/gulp-concat
 * https://github.com/babel/gulp-babel
 */
gulp.task('css:concat', () =>
gulp.src(paths.css)

// Deal with errors.
   .pipe(plumber(
      {'errorHandler': handleErrors}
   ))

   // Concatenate partials into a single script.
   .pipe(concat('style.css'))

   // Save the file.
   .pipe(gulp.dest(destFolder))
   .pipe(browserSync.stream())
);

/**
 * Minify and optimize style.css.
 *
 * https://www.npmjs.com/package/gulp-cssnano
 */
gulp.task('cssnano', ['css:concat'], () =>
gulp.src(destFolder + 'style.css')
   .pipe(plumber({'errorHandler': handleErrors}))
   .pipe(cssnano({
      'safe': true // Use safe optimizations.
   }))
   .pipe(rename('style.min.css'))
   .pipe(gulp.dest(destFolder))
   .pipe(browserSync.stream())
);

/**
 * Concatenate and transform JavaScript.
 *
 * https://www.npmjs.com/package/gulp-concat
 * https://github.com/babel/gulp-babel
 */
gulp.task('concat', () =>
gulp.src(paths.scripts)

// Deal with errors.
   .pipe(plumber(
      {'errorHandler': handleErrors}
   ))

   // Convert ES6+ to ES2015.
   .pipe(babel({
      presets: ['ES2015']
   }))

   // Concatenate partials into a single script.
   .pipe(concat('app.js'))

   // Save the file.
   .pipe(gulp.dest(destFolder))
   .pipe(browserSync.stream())
);

/**
 * Minify compiled JavaScript.
 *
 * https://www.npmjs.com/package/gulp-uglify
 */
gulp.task('uglify', ['concat'], () =>
gulp.src(destFolder + 'app.js')
   .pipe(plumber({'errorHandler': handleErrors}))
   .pipe(rename({'suffix': '.min'}))

   // Convert ES6+ to ES2015.
   .pipe(babel({
      presets: ['ES2015']
   }))
   .pipe(uglify({
      'mangle': false
   }))
   .pipe(gulp.dest(destFolder))
   .pipe(browserSync.stream())
);

/**
 * JavaScript linting.
 *
 * https://www.npmjs.com/package/gulp-eslint
 */
gulp.task('js:lint', () =>
gulp.src(['app/js/*.js'])
   .pipe(eslint())
   .pipe(eslint.format())
   .pipe(eslint.failAfterError())
   .pipe(browserSync.stream())
);

/**
 * Process tasks and reload browsers on file changes.
 *
 * https://www.npmjs.com/package/browser-sync
 */
gulp.task('browser-sync', function () {
   browserSync.init({
      server: {
         baseDir: 'app/',
      }
   });
});


gulp.task('watch', function () {
   browserSync.init({
      server: {
         serveStaticOptions: {
            extensions: ['html']
         },
         baseDir: 'app/',
         index: 'index.html'
      }
   });

   // Run tasks when files change.
   gulp.watch(paths.css, ['styles']);
   gulp.watch(htmlWatch, reload);
   gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('reload', function () {
   browserSync.reload;
});

/**
 * Create individual tasks.
 */
gulp.task('scripts', ['uglify']);
gulp.task('styles',  ['cssnano']);
gulp.task('lint',    ['js:lint']);
gulp.task('default', ['styles', 'scripts', 'watch', 'reload']);
