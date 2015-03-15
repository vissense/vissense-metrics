/*global VisSense,$,jasmine,describe,it,expect,beforeEach,afterEach*/
/**
 * @license
 * VisSense <http://twyn.com/>
 * Copyright 2014 twyn group IT solutions & marketing services AG <vissense@twyn.com>
 * Available under MIT license <http://opensource.org/licenses/MIT>
 */
describe('VisSenseClient', function(undefined) {
    'use strict';


  describe('VisMetric', function() {
    var element, visobj;

    beforeEach(function () {
      jasmine.getFixtures().set(
        '<div id="element" style="height: 10px; width: 10px; display: block;"></div>'
      );
      element = $('#element')[0];
      visobj = new VisSense(element);

      jasmine.clock().install();

      jasmine.clock().mockDate();
    });

    afterEach(function () {
      jasmine.clock().uninstall();
    });

    it('should start and stop measurement', function () {

      var metricsMonitor = visobj.monitor({
        strategy: new VisSense.VisMon.Strategy.MetricsStrategy()
      });

      expect(metricsMonitor).toBeDefined();
      expect(metricsMonitor.metrics).toBeDefined();
      expect(metricsMonitor.metrics()).toBeDefined();
      expect(metricsMonitor.metrics().running()).toBe(false);

      metricsMonitor.metrics().start();
      expect(metricsMonitor.metrics().running()).toBe(true);

      metricsMonitor.metrics().stop();
      expect(metricsMonitor.metrics().running()).toBe(false);
    });

    it('should count visibility time statistics (siimple)', function () {
      var metricsMonitor = visobj.monitor({
        strategy: [
          new VisSense.VisMon.Strategy.PollingStrategy({ interval: 100 }),
          new VisSense.VisMon.Strategy.MetricsStrategy()
        ]
      }).start();

      jasmine.clock().tick(100);

      expect(metricsMonitor.metrics().getMetric('time.hidden').get()).toBe(0);

      expect(metricsMonitor.metrics().getMetric('time.fullyvisible').get()).toBe(100);
      expect(metricsMonitor.metrics().getMetric('time.visible').get()).toBe(100);
      expect(metricsMonitor.metrics().getMetric('time.relativeVisible').get()).toBe(100);
      expect(metricsMonitor.metrics().getMetric('time.duration').get()).toBe(100);

      expect(metricsMonitor.metrics().getMetric('percentage').get()).toBe(1);
      expect(metricsMonitor.metrics().getMetric('percentage.min').get()).toBe(1);
      expect(metricsMonitor.metrics().getMetric('percentage.max').get()).toBe(1);

      metricsMonitor.stop();
    });

    it('should count visibility time statistics', function () {

      element.style.display = 'none'; // set hidden

      var metricsMonitor = visobj.monitor({
        strategy: [
          new VisSense.VisMon.Strategy.PollingStrategy({ interval: 100 }),
          new VisSense.VisMon.Strategy.MetricsStrategy()
        ]
      }).start();

      jasmine.clock().tick(100);

      expect(metricsMonitor.metrics().getMetric('time.hidden').get()).toBe(100);
      expect(metricsMonitor.metrics().getMetric('time.visible').get()).toBe(0);
      expect(metricsMonitor.metrics().getMetric('time.duration').get()).toBe(100);

      expect(metricsMonitor.metrics().getMetric('percentage').get()).toBe(0);
      expect(metricsMonitor.metrics().getMetric('percentage.min').get()).toBe(0);
      expect(metricsMonitor.metrics().getMetric('percentage.max').get()).toBe(0);

      element.style.display = 'block'; // set visible

      // these 100 will be counted as hidden
      jasmine.clock().tick(100);

      jasmine.clock().tick(500);

      expect(metricsMonitor.metrics().getMetric('time.hidden').get()).toBe(200);
      expect(metricsMonitor.metrics().getMetric('time.visible').get()).toBe(500);

      expect(metricsMonitor.metrics().getMetric('time.duration').get()).toBe(700);

      expect(metricsMonitor.metrics().getMetric('percentage').get()).toBe(1);
      expect(metricsMonitor.metrics().getMetric('percentage.min').get()).toBe(0);
      expect(metricsMonitor.metrics().getMetric('percentage.max').get()).toBe(1);

      element.style.display = 'none'; // set hidden

      metricsMonitor.metrics().stop();
    });

  });
});
