/**
 * @license
 * Available under MIT license <http://opensource.org/licenses/MIT>
 */
;(function(window, VisSense, VisSenseUtils, CountOnMe, undefined) {
  'use strict';

    function fireIfPositive(value, callback) {
        if(value > 0) {
            callback(value);
        }
    }

    /*--------------------------------------------------------------------------*/
    function Report() {
      this.metrics = {};

      this.addMetric = function(key, value) {
        this.metrics[key] = value;
      };

      this.getMetric = function(key) {
        return this.metrics[key];
      };
    }

    function VisMetrics(vismon) {
        var me = this;
        var running = false;
        var report = new Report();


        var watchVisible = CountOnMe.stopwatch();
        var watchFullyVisible = CountOnMe.stopwatch();
        var watchHidden = CountOnMe.stopwatch();
        var watchDuration = CountOnMe.stopwatch().start();

        /* Counter */
        report.addMetric('time.visible', new CountOnMe.counter());
        report.addMetric('time.fullyvisible', new CountOnMe.counter());
        report.addMetric('time.hidden', new CountOnMe.counter());
        report.addMetric('time.relativeVisible', new CountOnMe.counter());
        report.addMetric('time.duration', new CountOnMe.counter());
        report.addMetric('percentage', new CountOnMe.counter());
        report.addMetric('percentage.max', new CountOnMe.counter(0));
        report.addMetric('percentage.min', new CountOnMe.counter(1));

        var update = function() {
            stopAndUpdateTimers(vismon);
            updatePercentage(vismon);
        };

        vismon.onUpdate(function() {
          update();
        });

        me.getMetric = function(name) {
            return report.getMetric(name);
        };

        me.running = function() {
            return running;
        };

        me.start = function() {
          if(!running) {
            vismon.start();
            update();

            running = true;
          }
          return this;
        };

        me.stop = function() {
          if(running) {
            update();

            vismon.stop();
            running = false;
          }
            return this;
        };

        function updatePercentage(vismon) {
          var status = vismon.state();
          var percentage = status.percentage;
          report.getMetric('percentage').set(percentage);

          if(percentage < report.getMetric('percentage.min').get()) {
            report.getMetric('percentage.min').set(percentage);
          }
          if(percentage > report.getMetric('percentage.max').get()) {
            report.getMetric('percentage.max').set(percentage);
          }
        }

        function stopAndUpdateTimers(vismon) {
          var status = vismon.state();

          fireIfPositive(watchDuration.get(), function(value) {
              report.getMetric('time.duration').set(value);
          });

          fireIfPositive(watchHidden.running() ? watchHidden.stop().get() : -1, function(value) {
              report.getMetric('time.hidden').inc(value);
          });
          fireIfPositive(watchVisible.running() ? watchVisible.stop().get() : -1, function(value) {
              report.getMetric('time.visible').inc(value);
              report.getMetric('time.relativeVisible').inc(value * status.percentage);
          });
          fireIfPositive(watchFullyVisible.running() ? watchFullyVisible.stop().get() : -1, function(value) {
              report.getMetric('time.fullyvisible').inc(value);
          });

          watchVisible.startIf(status.visible);
          watchFullyVisible.startIf(status.fullyvisible);
          watchHidden.startIf(status.hidden);
        }
    }

    VisSense.fn.metrics = function(incomingConfig) {

        if(this._metrics) {
          return this._metrics;
        }

        var config = incomingConfig || {};

        this._metrics = new VisMetrics(this.monitor(config));

        return this._metrics;
    };

}.call(this, window, window.VisSense, window.VisSense.Utils, window.CountOnMe));

