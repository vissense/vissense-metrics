module.exports = function (config) {
  'use strict';

  var configuration = {

    // base path, that will be used to resolve files and exclude
    basePath: './',

    frameworks: ['jasmine'],

    files: [
      'bower_components/jquery/dist/jquery.min.js',
      'bower_components/lodash/dist/lodash.min.js',
      'bower_components/jasmine-jquery/lib/jasmine-jquery.js',

      'bower_components/countonmejs/dist/countonmejs.min.js',
      'bower_components/vissense/dist/vissense.min.js',

      'src/main/metrics/vissense.metrics.js',

      'spec/**/*.js',
      // fixtures
      {pattern: 'spec/**/*.html', watched: true, served: true, included: false}
    ],

    exclude: [],

    reporters: ['progress', 'coverage'],

    port: 3000,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: true,

    preprocessors: {
      'src/main/**/*.js': ['coverage']
    },

    browsers: ['PhantomJS', 'Chrome', 'Firefox'],
    //browsers: ['PhantomJS'],

    customLaunchers: {
      Chrome_without_security: {
        base: 'Chrome',
        flags: ['--disable-web-security']
      },
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },

    coverageReporter: {
      reporters: [
        {type: 'lcov', dir: 'bin/coverage/'}
      ]
    },

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // if true, it capture browsers, run tests and exit
    singleRun: true
  };

  if (process.env.TRAVIS) {
    configuration.browsers = ['PhantomJS', 'Firefox', 'Chrome_travis_ci'];
  }

  if (process.platform === 'win32') {
    // @link https://github.com/karma-runner/karma-phantomjs-launcher/issues/27
    // @link https://github.com/karma-runner/karma/issues/931
    configuration.browsers.splice(configuration.browsers.indexOf('PhantomJS'), 1);
    configuration.browsers.push('IE');
  }

  config.set(configuration);
};
