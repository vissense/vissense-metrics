/*! { "name": "vissense-metrics", "version": "0.0.1-rc1", "copyright": "(c) 2015 tbk" } */
!function(window){"use strict";!function(window){Date.now||(Date.now=function(){return(new Date).getTime()}),window.performance||(window.performance=window.performance||{},window.performance.now=window.performance.now||window.performance.mozNow||window.performance.msNow||window.performance.oNow||window.performance.webkitNow||Date.now)}(window);var Counter=function(){function Counter(val){return this instanceof Counter?((+val!==val||0>val)&&(val=0),void(this._$={i:val})):new Counter(val)}var MAX_VALUE=Math.pow(2,32),check=function(val){return+val!==val?1:+val};return Counter.MAX_VALUE=MAX_VALUE,Counter.prototype.inc=function(val){return this.set(this.get()+check(val)),this.get()},Counter.prototype.dec=function(val){return this.inc(-1*check(val))},Counter.prototype.clear=function(){var val=this._$.i;return this._$.i=0,val},Counter.prototype.get=function(){return this._$.i},Counter.prototype.set=function(val){return this._$.i=check(val),this._$.i<0?this._$.i=0:this._$.i>MAX_VALUE&&(this._$.i-=MAX_VALUE),this.get()},Counter}(),StopWatch=function(){function StopWatch(config){return this instanceof StopWatch?(this._config=config||{},this._config.performance=this._config.performance===!0,void(this._$={ts:0,te:0,r:!1})):new StopWatch(config)}var now=function(performance){return performance?window.performance.now():Date.now()},asNumberOr=function(optNumber,fallback){return+optNumber===optNumber?+optNumber:fallback};return StopWatch.prototype._orNow=function(optNow){return asNumberOr(optNow,now(this._config.performance))},StopWatch.prototype.startIf=function(condition,optNow){return condition&&(this._$.r=!0,this._$.ts=this._orNow(optNow),this._$.te=null),this},StopWatch.prototype.start=function(optNow){return this.startIf(!this._$.r,optNow)},StopWatch.prototype.restart=function(optNow){return this.startIf(!0,optNow)},StopWatch.prototype.stop=function(optNow){return this.stopIf(!0,optNow)},StopWatch.prototype.stopIf=function(condition,optNow){return this._$.r&&condition&&(this._$.te=this._orNow(optNow),this._$.r=!1),this},StopWatch.prototype.interim=function(optNow){return this._$.r?this._orNow(optNow)-this._$.ts:0},StopWatch.prototype.get=function(optNow){return this._$.te?this._$.te-this._$.ts:this.time(optNow)},StopWatch.prototype.running=function(){return this._$.r},StopWatch.prototype.getAndRestartIf=function(condition,optNow){var time=this.get(optNow);return condition&&this.restart(optNow),time},StopWatch.prototype.forceStart=StopWatch.prototype.restart,StopWatch.prototype.time=StopWatch.prototype.interim,StopWatch}();window.CountOnMe={counter:Counter,stopwatch:StopWatch}}(window);
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
          watchDuration.startIf(!watchDuration.running());
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

