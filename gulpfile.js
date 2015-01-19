'use strict';

var gulp = require('gulp');
var shell = require('gulp-shell');
var through = require('through2');
var gutil = require('gulp-util');
var jsdoc2md = require('jsdoc-to-markdown');
var mfs = require('more-fs');
var fs = require('fs');
var runSequence = require('run-sequence');

gulp.task('docs:bitcore', function() {
  gulp.src('./node_modules/bitcore/docs/guide/**/*.md', {
    base: './node_modules/bitcore/docs/guide/'
  }).pipe(gulp.dest('./source/guide/'));
});

gulp.task('docs:bitcore-p2p', function() {
  gulp.src('./node_modules/bitcore-p2p/docs/**/*.md', {
    base: './node_modules/bitcore-p2p/docs/'
  }).pipe(gulp.dest('./source/guide/module/p2p/'));
});

gulp.task('docs:bitcoind-rpc', function() {
  gulp.src('./node_modules/bitcoind-rpc/docs/**/*.md', {
    base: './node_modules/bitcoind-rpc/docs/'
  }).pipe(gulp.dest('./source/guide/module/bitcoind-rpc/'));
});

gulp.task('docs:bitcore-payment-protocol', function() {
  gulp.src('./node_modules/bitcore-payment-protocol/docs/**/*.md', {
    base: './node_modules/bitcore-payment-protocol/docs/'
  }).pipe(gulp.dest('./source/guide/module/payment-protocol/'));
});

gulp.task('docs:bitcore-ecies', function() {
  gulp.src('./node_modules/bitcore-ecies/docs/**/*.md', {
    base: './node_modules/bitcore-ecies/docs/'
  }).pipe(gulp.dest('./source/guide/module/ecies/'));
});

gulp.task('docs:bitcore-mnemonic', function() {
  gulp.src('./node_modules/bitcore-mnemonic/docs/**/*.md', {
    base: './node_modules/bitcore-mnemonic/docs/'
  }).pipe(gulp.dest('./source/guide/module/mnemonic/'));
});

gulp.task('docs:bitcore-channel', function() {
  gulp.src('./node_modules/bitcore-channel/docs/**/*.md', {
    base: './node_modules/bitcore-channel/docs/'
  }).pipe(gulp.dest('./source/guide/module/channel/'));
});

gulp.task('docs', function(callback) {
  runSequence(
    ['docs:bitcore'],
    ['docs:bitcore-p2p'],
    ['docs:bitcore-payment-protocol'],
    ['docs:bitcore-ecies'],
    ['docs:bitcore-mnemonic'],
    ['docs:bitcore-channel'],
    callback);
});

gulp.task('copy-api-index', function() {
  var indexExists = fs.existsSync('./api/index.md');
  if (indexExists) {
    gulp.src('./api/index.md', {base: './api/'})
      .pipe(gulp.dest('./source/api/'));
  } else {
    fs.writeFileSync('./source/api/index.md', '');
  }
});

gulp.task('copy-contributing', function() {
  var readme = fs.readFileSync('./node_modules/bitcore/CONTRIBUTING.md');
  fs.writeFileSync('source/guide/contributing.md', readme);
});

function jsdocForModule(moduleName, moduleSlug) {

  function jsdoc() {
    return through.obj(function(file, enc, cb) {

      if (file.isNull()){
        cb(null, file);
        return;
      }
      if (file.isStream()) {
        cb(new gutil.PluginError('gulp-jsdoc2md', 'Streaming not supported'));
        return;
      }

      var destination;
      if (moduleSlug) {
        destination = 'source/api/' + moduleSlug + '/';
      } else {
        destination = 'source/api/';
      }

      destination += file.path.replace(file.base, '').replace(/\.js$/, '.md');

      jsdoc2md.render(file.path, {})
        .on('error', function(err) {
          gutil.log(gutil.colors.red('jsdoc2md failed', err.message));
        })
        .pipe(mfs.writeStream(destination));
      cb(null, file);
    });
  }

  var files = ['./node_modules/' + moduleName + '/lib/**/*.js'];

  return gulp.src(files).pipe(jsdoc());

}

// jsdocs

gulp.task('api:bitcore', function(callback) {
  return jsdocForModule('bitcore');
});

gulp.task('api:bitcore-p2p', function(callback) {
  return jsdocForModule('bitcore-p2p', 'module/p2p');
});

gulp.task('api:bitcoind-rpc', function(callback) {
  return jsdocForModule('bitcoind-rpc', 'module/bitcoind-rpc');
});

gulp.task('api:bitcore-payment-protocol', function(callback) {
  return jsdocForModule('bitcore-payment-protocol', 'module/payment-protocol');
});

gulp.task('api:bitcore-ecies', function(callback) {
  return jsdocForModule('bitcore-ecies', 'module/ecies');
});

gulp.task('api:bitcore-mnemonic', function(callback) {
  return jsdocForModule('bitcore-mnemonic', 'module/mnemonic');
});

gulp.task('api:bitcore-channel', function(callback) {
  return jsdocForModule('bitcore-channel', 'module/channel');
});

gulp.task('api', function(callback) {
  runSequence(
    ['api:bitcore'],
    ['api:bitcore-p2p'],
    ['api:bitcoind-rpc'],
    ['api:bitcore-payment-protocol'],
    ['api:bitcore-ecies'],
    ['api:bitcore-mnemonic'],
    ['api:bitcore-channel'],
    callback);
});

// html covertion

gulp.task('generate-public', shell.task([
  './node_modules/.bin/hexo generate'
]));

// launch demo server

gulp.task('run-server', shell.task([
  './node_modules/.bin/hexo server'
]));

gulp.task('server', function(callback){
  runSequence(['generate'], ['run-server'], callback);
});

// generate everything

gulp.task('generate', function(callback){
  runSequence(['docs'],
              ['api'],
              ['copy-api-index'],
              ['copy-contributing'],
              ['generate-public'],
              callback);
});

// update the packages

gulp.task('npm-install', shell.task([
  'npm install'
]));


// deploy the website

gulp.task('hexo-deploy', shell.task([
  './node_modules/.bin/hexo deploy'
]));

gulp.task('release', function(callback){
  runSequence(['npm-install'], ['generate'], ['hexo-deploy'], callback);
});
