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

      var vismetrics = visobj.metrics({
        strategy: new VisSense.VisMon.Strategy.PollingStrategy({interval: 100})
      });

      expect(vismetrics).toBeDefined();
      expect(vismetrics.running()).toBe(false);

      vismetrics.start();
      expect(vismetrics.running()).toBe(true);

      vismetrics.stop();
      expect(vismetrics.running()).toBe(false);
    });

    it('should count visibility time statistics (siimple)', function () {

      var vismetrics = visobj.metrics({
        strategy: new VisSense.VisMon.Strategy.PollingStrategy({ interval: 100 })
      }).start();

      jasmine.clock().tick(100);

      expect(vismetrics.getMetric('time.hidden').get()).toBe(0);

      expect(vismetrics.getMetric('time.fullyvisible').get()).toBe(100);
      expect(vismetrics.getMetric('time.visible').get()).toBe(100);
      expect(vismetrics.getMetric('time.relativeVisible').get()).toBe(100);
      expect(vismetrics.getMetric('time.duration').get()).toBe(100);

      expect(vismetrics.getMetric('percentage').get()).toBe(1);
      expect(vismetrics.getMetric('percentage.min').get()).toBe(1);
      expect(vismetrics.getMetric('percentage.max').get()).toBe(1);

      vismetrics.stop();
    });

    it('should count visibility time statistics', function () {

      element.style.display = 'none'; // set hidden

      var vismetrics = visobj.metrics({
        strategy: new VisSense.VisMon.Strategy.PollingStrategy({ interval: 100 })
      }).start();

      jasmine.clock().tick(100);

      expect(vismetrics.getMetric('time.hidden').get()).toBe(100);
      expect(vismetrics.getMetric('time.visible').get()).toBe(0);
      expect(vismetrics.getMetric('time.duration').get()).toBe(100);

      expect(vismetrics.getMetric('percentage').get()).toBe(0);
      expect(vismetrics.getMetric('percentage.min').get()).toBe(0);
      expect(vismetrics.getMetric('percentage.max').get()).toBe(0);

      element.style.display = 'block'; // set visible

      // these 100 will be counted as hidden
      jasmine.clock().tick(100);

      jasmine.clock().tick(500);

      expect(vismetrics.getMetric('time.hidden').get()).toBe(200);
      expect(vismetrics.getMetric('time.visible').get()).toBe(500);

      expect(vismetrics.getMetric('time.duration').get()).toBe(700);

      expect(vismetrics.getMetric('percentage').get()).toBe(1);
      expect(vismetrics.getMetric('percentage.min').get()).toBe(0);
      expect(vismetrics.getMetric('percentage.max').get()).toBe(1);

      element.style.display = 'none'; // set hidden

      vismetrics.stop();
    });

  });
});
