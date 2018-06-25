//const VERSION = '0.0.1';

// Require our dependencies
const autoprefixer = require('autoprefixer');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const cssnano = require('gulp-cssnano');
const del = require('del');
const eslint = require('gulp-eslint');
const gulp = require('gulp');
const gutil = require('gulp-util');
const mqpacker = require('css-mqpacker');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;

// Set assets paths.
// const paths = {
//    'css': ['app/css/**/*.css'],
//    'scripts': ['app/js/**/*.js'],
//    'html': ['app/**/*.html'],
// };

// Set assets paths.
const paths = {
   'css': ['app/css/**/*.css'],
   'html': ['app/**/*.html'],
   'js': ['app/js/**/*.js'],
   'scss': ['app/scss/**/*.scss'],
   'tests': ['tests/spec/**/*.js'],
};

const dist = {
   'css': ['./dist/css/'],
   'html': ['./dist/'],
   'js': ['./dist/js/'],
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


/**
 * Delete style.css and style.min.css before we minify and optimize
 */
gulp.task('clean:style', () =>
   del(['style.css', 'style.min.css']),
   gutil.log(
      gutil.colors.inverse('Styles are now clean....[clean:style]'))
);

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
      .pipe(gulp.dest(dist.css))
);

// gulp.task('styles', function(done) {
//    gulp.src(paths.scss)
//       .pipe(sass())
//       .pipe(sass().on('error', sass.logError))
//       .pipe(autoprefixer({
//          browsers: ['last 2 versions'],
//       }))
//       .pipe(gulp.dest(dist.css));
//    done();
// });


/**
 * Compile Sass and run styleheet through PostCSS.
 *
 * https://www.npmjs.com/package/gulp-sass
 * https://www.npmjs.com/package/gulp-postcss
 * https://www.npmjs.com/package/gulp-autoprefixer
 * https://www.npmjs.com/package/css-mqpacker
 */
gulp.task( 'postcss', function(done) {
   gulp.src(paths.scss)

   // Deal with errors.
      .pipe(plumber({'errorHandler': handleErrors}))

      // Wrap tasks in a sourceemap.
      .pipe(sourcemaps.init())

      // Compile Sass using LibSass.
      .pipe(sass({
         'errLogToConsole': true,
         'outputStyle': 'expanded',
      }))

      // Parse with PostCSS plugins.
      .pipe(postcss([
         autoprefixer({
            'browsers': ['last 2 version'],
         }),
         mqpacker({
            'sort': true,
         }),
      ]))

      // Create sourcemap.
      .pipe(sourcemaps.write())

      // Create style.css.
      .pipe(gulp.dest(dist.css))
   done();
});

/**
 * Minify and optimize style.css.
 *
 * https://www.npmjs.com/package/gulp-cssnano
 */
gulp.task( 'cssnano', gulp.series('postcss'), function(done) {
   gulp.src(dist.css)
      //.pipe(plumber({'errorHandler': handleErrors}))
      .pipe(cssnano({
         'safe': true, // Use safe optimizations.
      }))
      .pipe(rename('style.min.css'))
      .pipe(gulp.dest(dist.css));
      // .pipe(browserSync.stream());
   gutil.log(
      gutil.colors.inverse('cssnano....'))
   done();
});

// /**
//  * Minify and optimize style.css.
//  *
//  * https://www.npmjs.com/package/gulp-cssnano
//  */
// gulp.task('cssnano', gulp.series('postcss'), function() {
//    gulp.src(dist.css + 'style.css')
//       .pipe(plumber({'errorHandler': handleErrors}))
//       .pipe(cssnano({
//          'safe': true, // Use safe optimizations.
//       }))
//       .pipe(rename('style.min.css'))
//       .pipe(gulp.dest(dist.css));
// });

/**
 * Concatenate and transform JavaScript.
 *
 * https://www.npmjs.com/package/gulp-concat
 * https://github.com/babel/gulp-babel
 */
gulp.task('concat', () =>
   gulp.src(paths.js)

   // Deal with errors.
      .pipe(plumber(
         {'errorHandler': handleErrors}
      ))

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
 */
gulp.task('uglify', gulp.series('concat'), () =>
   gulp.src(destFolder + 'app.js')
      .pipe(plumber({'errorHandler': handleErrors}))
      .pipe(rename({'suffix': '.min'}))

      // Convert ES6+ to ES2015.
      .pipe(babel({
         presets: ['ES2015'],
      }))
      .pipe(uglify({
         'mangle': false,
      }))
      .pipe(gulp.dest(dist.js))
);

/**
 * JavaScript linting.
 *
 * https://www.npmjs.com/package/gulp-eslint
 */
gulp.task('js:lint', () =>
   gulp.src(['paths.js'])
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
   gulp.watch(paths.css, ['styles']);
   gulp.watch(paths.js, ['scripts']);
});

/**
 * Create individual tasks.
 */
gulp.task('scripts', gulp.series('uglify'));
gulp.task('styles', gulp.series('cssnano'));
gulp.task('lint', gulp.series('js:lint'));
gulp.task('default', gulp.series('styles', 'scripts'));
