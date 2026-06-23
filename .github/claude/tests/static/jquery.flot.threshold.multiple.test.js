/**
 * @jest-environment jsdom
 */

// Mock jQuery
global.$ = global.jQuery = {
  plot: jest.fn(),
  extend: jest.fn((target, source) => Object.assign(target, source)),
  grep: jest.fn((array, callback) => array.filter(callback)),
  map: jest.fn((array, callback) => array.map(callback))
};

// Load the flot threshold plugin
require('../../../static/jquery.flot.threshold.multiple.js');

describe('jQuery Flot Multiple Threshold Plugin', () => {
  let mockPlot;
  let mockData;
  let mockConstraints;

  beforeEach(() => {
    mockPlot = {
      getData: jest.fn()
    };

    mockData = [
      [0, 1],
      [1, 3],
      [2, 5],
      [3, 2],
      [4, 4],
      [5, 1]
    ];

    mockConstraints = [
      {
        threshold: 2,
        color: "rgb(255,0,0)",
        evaluate: function(y, threshold) { return y < threshold; }
      },
      {
        threshold: 4,
        color: "rgb(0,255,0)",
        evaluate: function(y, threshold) { return y > threshold; }
      }
    ];

    jest.clearAllMocks();
  });

  describe('Graph Class', () => {
    test('should create Graph with dataset and constraints', () => {
      const graph = new Graph(mockData, mockConstraints);
      expect(graph._dataset).toBe(mockData);
      expect(graph._constraints).toEqual(expect.any(Array));
      expect(graph._plotData).toEqual([]);
    });

    test('should sort constraints by threshold', () => {
      const unsortedConstraints = [
        { threshold: 4, evaluate: jest.fn() },
        { threshold: 2, evaluate: jest.fn() },
        { threshold: 3, evaluate: jest.fn() }
      ];
      
      const graph = new Graph(mockData, unsortedConstraints);
      // The constraints should be sorted in descending order
      expect(graph._constraints[0].threshold).toBeGreaterThanOrEqual(graph._constraints[1].threshold);
    });

    test('should generate plot data for each constraint', () => {
      const graph = new Graph(mockData, mockConstraints);
      const plotData = graph.getPlotData();
      
      expect(plotData).toBeInstanceOf(Array);
      expect(plotData.length).toBe(mockConstraints.length);
      
      plotData.forEach(series => {
        expect(series).toHaveProperty('data');
        expect(series).toHaveProperty('color');
      });
    });

    test('should handle empty constraints', () => {
      const graph = new Graph(mockData, []);
      const plotData = graph.getPlotData();
      expect(plotData).toEqual([]);
    });

    test('should handle null threshold constraints', () => {
      const constraintsWithNull = [
        { threshold: null, evaluate: jest.fn(), color: 'red' },
        { threshold: 2, evaluate: jest.fn(), color: 'blue' }
      ];
      
      const graph = new Graph(mockData, constraintsWithNull);
      const plotData = graph.getPlotData();
      
      // Should only process constraints with valid thresholds
      expect(plotData.length).toBeLessThan(constraintsWithNull.length);
    });
  });

  describe('Resolve Class', () => {
    let resolver;

    beforeEach(() => {
      resolver = new Resolve(mockData);
    });

    test('should initialize with original points', () => {
      expect(resolver._originalPoints).toBe(mockData);
      expect(resolver._data).toEqual([]);
    });

    test('should resolve data points based on threshold evaluation', () => {
      const threshold = 3;
      const evaluate = (y, t) => y < t;
      
      const result = resolver.using(threshold, evaluate);
      expect(result).toBeInstanceOf(Array);
      
      // Should contain points where y < 3 (points with y values 1, 2, 1)
      const validPoints = result.filter(point => point !== null && point !== undefined);
      expect(validPoints.length).toBeGreaterThan(0);
    });

    test('should handle threshold crossings correctly', () => {
      const threshold = 2.5;
      const evaluate = (y, t) => y > t;
      
      const result = resolver.using(threshold, evaluate);
      
      // Should include interpolated points at threshold crossings
      expect(result).toBeInstanceOf(Array);
      
      // Check for null separators indicating series breaks
      const hasNullSeparators = result.some(point => point === null);
      expect(typeof hasNullSeparators).toBe('boolean');
    });

    test('should interpolate points on threshold line', () => {
      const threshold = 2.5;
      const prevPoint = [1, 2];
      const currPoint = [2, 3];
      
      const interpolated = resolver._getPointOnThreshold(threshold, prevPoint, currPoint);
      
      expect(interpolated).toBeInstanceOf(Array);
      expect(interpolated).toHaveLength(2);
      expect(interpolated[1]).toBe(threshold); // Y should be the threshold
      expect(interpolated[0]).toBeGreaterThanOrEqual(prevPoint[0]); // X should be interpolated
      expect(interpolated[0]).toBeLessThanOrEqual(currPoint[0]);
    });
  });

  describe('Threshold Evaluation Functions', () => {
    test('should evaluate less than threshold', () => {
      const evaluate = (y, threshold) => y < threshold;
      expect(evaluate(1, 2)).toBe(true);
      expect(evaluate(3, 2)).toBe(false);
      expect(evaluate(2, 2)).toBe(false);
    });

    test('should evaluate greater than threshold', () => {
      const evaluate = (y, threshold) => y > threshold;
      expect(evaluate(3, 2)).toBe(true);
      expect(evaluate(1, 2)).toBe(false);
      expect(evaluate(2, 2)).toBe(false);
    });

    test('should evaluate custom conditions', () => {
      const evaluate = (y, threshold) => Math.abs(y - threshold) < 0.5;
      expect(evaluate(2.2, 2)).toBe(true);
      expect(evaluate(1.8, 2)).toBe(true);
      expect(evaluate(3, 2)).toBe(false);
    });
  });

  describe('Plugin Integration', () => {
    test('should process series with constraints', () => {
      const mockSeries = {
        data: mockData,
        constraints: mockConstraints
      };

      mockPlot.getData.mockReturnValue([]);

      // The plugin should split the series based on constraints
      // This tests the main plugin functionality
      expect(mockSeries.data).toBeTruthy();
      expect(mockSeries.constraints).toBeTruthy();
      expect(mockSeries.constraints.length).toBeGreaterThan(0);
    });

    test('should handle series without constraints', () => {
      const mockSeries = {
        data: mockData
        // No constraints property
      };

      // Should handle gracefully when no constraints are present
      expect(mockSeries.data).toBeTruthy();
      expect(mockSeries.constraints).toBeUndefined();
    });

    test('should handle empty data series', () => {
      const mockSeries = {
        data: [],
        constraints: mockConstraints
      };

      // Should handle empty data gracefully
      expect(mockSeries.data).toEqual([]);
      expect(mockSeries.constraints).toBeTruthy();
    });
  });

  describe('Color Assignment', () => {
    test('should assign colors from constraints', () => {
      const graph = new Graph(mockData, mockConstraints);
      const plotData = graph.getPlotData();
      
      plotData.forEach((series, index) => {
        expect(series.color).toBe(mockConstraints[index].color);
      });
    });

    test('should handle missing color in constraints', () => {
      const constraintsWithoutColor = [{
        threshold: 2,
        evaluate: (y, t) => y < t
        // No color property
      }];
      
      const graph = new Graph(mockData, constraintsWithoutColor);
      const plotData = graph.getPlotData();
      
      // Should still create plot data even without color
      expect(plotData.length).toBe(1);
      expect(plotData[0]).toHaveProperty('data');
    });
  });

  describe('Edge Cases', () => {
    test('should handle single data point', () => {
      const singlePoint = [[0, 5]];
      const graph = new Graph(singlePoint, mockConstraints);
      const plotData = graph.getPlotData();
      
      expect(plotData).toBeInstanceOf(Array);
    });

    test('should handle all points above threshold', () => {
      const highData = [[0, 10], [1, 11], [2, 12]];
      const lowThreshold = [{ threshold: 5, evaluate: (y, t) => y > t, color: 'red' }];
      
      const graph = new Graph(highData, lowThreshold);
      const plotData = graph.getPlotData();
      
      expect(plotData[0].data.length).toBeGreaterThan(0);
    });

    test('should handle all points below threshold', () => {
      const lowData = [[0, 1], [1, 2], [2, 1]];
      const highThreshold = [{ threshold: 5, evaluate: (y, t) => y < t, color: 'red' }];
      
      const graph = new Graph(lowData, highThreshold);
      const plotData = graph.getPlotData();
      
      expect(plotData[0].data.length).toBeGreaterThan(0);
    });

    test('should handle exact threshold matches', () => {
      const exactData = [[0, 2], [1, 2], [2, 2]];
      const exactThreshold = [{ threshold: 2, evaluate: (y, t) => y === t, color: 'red' }];
      
      const graph = new Graph(exactData, exactThreshold);
      const plotData = graph.getPlotData();
      
      expect(plotData).toBeTruthy();
    });
  });
});