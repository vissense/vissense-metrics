/**
 * @license
 * Available under MIT license <http://opensource.org/licenses/MIT>
 */
(function (window, VisSense, VisSenseUtils, CountOnMe, undefined) {
  'use strict';

  function fireIfPositive(value, callback) {
    if (value > 0) {
      callback(value);
    }
  }

  /*--------------------------------------------------------------------------*/
  function Report() {
    this.metrics = {};

    this.addMetric = function (key, value) {
      this.metrics[key] = value;
    };

    this.getMetric = function (key) {
      return this.metrics[key];
    };
  }

  function VisMetrics(vismon) {
    var running = false;
    var report = new Report();

    var watchVisible = CountOnMe.stopwatch();
    var watchFullyVisible = CountOnMe.stopwatch();
    var watchHidden = CountOnMe.stopwatch();
    var watchDuration = CountOnMe.stopwatch();

    /* Counter */
    report.addMetric('time.visible', new CountOnMe.counter());
    report.addMetric('time.fullyvisible', new CountOnMe.counter());
    report.addMetric('time.hidden', new CountOnMe.counter());
    report.addMetric('time.relativeVisible', new CountOnMe.counter());
    report.addMetric('time.duration', new CountOnMe.counter());
    report.addMetric('percentage', new CountOnMe.counter());
    report.addMetric('percentage.max', new CountOnMe.counter(0));
    report.addMetric('percentage.min', new CountOnMe.counter(1));

    var me = this;

    this.update = function () {
      stopAndUpdateTimers(vismon);
      updatePercentage(vismon);
    };

    this.getMetric = function (name) {
      return report.getMetric(name);
    };

    this.running = function () {
      return running;
    };

    var cancelOnUpdate = null;
    this.start = function () {
      if (!running) {
        cancelOnUpdate = vismon.on('update', function() {
          me.update();
        });

        this.update();

        running = true;
      }
      return this;
    };

    this.stop = function () {
      if (running) {
        this.update();

        cancelOnUpdate();
        cancelOnUpdate = null;

        running = false;
      }
      return this;
    };

    function updatePercentage(vismon) {
      var status = vismon.state();
      var percentage = status.percentage;
      report.getMetric('percentage').set(percentage);

      if (percentage < report.getMetric('percentage.min').get()) {
        report.getMetric('percentage.min').set(percentage);
      }
      if (percentage > report.getMetric('percentage.max').get()) {
        report.getMetric('percentage.max').set(percentage);
      }
    }

    function stopAndUpdateTimers(vismon) {
      var status = vismon.state();

      fireIfPositive(watchDuration.get(), function (value) {
        report.getMetric('time.duration').set(value);
      });

      fireIfPositive(watchHidden.running() ? watchHidden.stop().get() : -1, function (value) {
        report.getMetric('time.hidden').inc(value);
      });
      fireIfPositive(watchVisible.running() ? watchVisible.stop().get() : -1, function (value) {
        report.getMetric('time.visible').inc(value);
        report.getMetric('time.relativeVisible').inc(value * status.percentage);
      });
      fireIfPositive(watchFullyVisible.running() ? watchFullyVisible.stop().get() : -1, function (value) {
        report.getMetric('time.fullyvisible').inc(value);
      });

      watchVisible.startIf(status.visible);
      watchFullyVisible.startIf(status.fullyvisible);
      watchHidden.startIf(status.hidden);
      watchDuration.startIf(!watchDuration.running());
    }
  }

  var Strategy = VisSense.VisMon.Strategy;

  Strategy.MetricsStrategy = function() {};

  Strategy.MetricsStrategy.prototype = Object.create(
    Strategy.prototype
  );

  /**
   * @method
   * @name init
   *
   * @param {VisSense.VisMon} monitor
   *
   * @memberof VisSense.VisMon.Strategy.MetricsStrategy#
   */
  Strategy.MetricsStrategy.prototype.init = function (monitor) {
    var metrics = new VisMetrics(monitor);
    monitor.metrics = function() {
      return metrics;
    };
  };

  /**
   * @method
   * @name start
   *
   * @param {VisSense.VisMon} monitor
   *
   * @memberof VisSense.VisMon.Strategy.MetricsStrategy#
   */
  Strategy.MetricsStrategy.prototype.start = function (monitor) {
    monitor.metrics().start();
    return true;
  };
  /**
   * @method
   * @name stop
   *
   * @param {VisSense.VisMon} monitor
   *
   * @memberof VisSense.VisMon.Strategy.MetricsStrategy#
   */
  Strategy.MetricsStrategy.prototype.stop = function (monitor) {
    monitor.metrics().stop();
    return true;
  };

}.call(this, window, window.VisSense, window.VisSense.Utils, window.CountOnMe));

