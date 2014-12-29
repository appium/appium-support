"use strict";

var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    Q = require('q'),
    spawnWatcher = require('appium-gulp-plugins').spawnWatcher.use(gulp),
    runSequence = Q.denodeify(require('run-sequence')),
    jshint = require('gulp-jshint'),
    jscs = require('gulp-jscs');

gulp.task('jscs', function () {
  return gulp
   .src(['*.js', 'lib/**/*.js', 'test/**/*.js'])
   .pipe(jscs())
   .on('error', spawnWatcher.handleError);
});

gulp.task('jshint', function () {
  return gulp
   .src(['*.js', 'lib/**/*.js', 'test/**/*.js'])
   .pipe(jshint())
   .pipe(jshint.reporter('jshint-stylish'))
   .pipe(jshint.reporter('fail'))
   .on('error', spawnWatcher.handleError);
});

gulp.task('lint',['jshint','jscs']);

gulp.task('test',  function () {
  return gulp
   .src('test/**/*-specs.js', {read: false})
   .pipe(mocha({reporter: 'nyan'}))
   .on('error', spawnWatcher.handleError);
});

process.env.APPIUM_NOTIF_BUILD_NAME = 'appium-support';

spawnWatcher.configure('watch', ['index.js', 'lib/**/*.js','test/**/*.js'], function () {
  return runSequence('lint', 'test');
});

gulp.task('once', function () {
  return runSequence('lint', 'test');
});

gulp.task('default', ['watch']);

