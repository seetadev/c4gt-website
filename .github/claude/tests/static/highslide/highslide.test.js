/**
 * @jest-environment jsdom
 */

// Mock DOM elements and global objects
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost'
  },
  writable: true
});

// Mock navigator for browser detection
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (compatible test browser)',
  writable: true
});

// Create basic DOM structure
document.body.innerHTML = `
  <div id="test-container">
    <a href="#" class="highslide" onclick="return hs.expand(this)">Test Link</a>
    <img id="test-image" src="test.jpg" alt="Test Image" />
  </div>
`;

// Load Highslide (using the simpler packed version for testing)
require('../../../static/highslide/highslide/highslide.packed.js');

describe('Highslide JS Library', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="test-container">
        <a href="test.jpg" class="highslide" onclick="return hs.expand(this)">Test Link</a>
        <img id="test-image" src="test.jpg" alt="Test Image" />
      </div>
    `;
    
    // Clear any existing expanders
    if (window.hs && window.hs.expanders) {
      window.hs.expanders.length = 0;
    }

    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize hs global object', () => {
      expect(window.hs).toBeDefined();
      expect(typeof window.hs).toBe('object');
    });

    test('should have default configuration', () => {
      expect(hs.graphicsDir).toBeDefined();
      expect(hs.expandDuration).toBeDefined();
      expect(hs.restoreDuration).toBeDefined();
      expect(hs.zIndexCounter).toBeDefined();
    });

    test('should have language strings', () => {
      expect(hs.lang).toBeDefined();
      expect(hs.lang.loadingText).toBeDefined();
      expect(hs.lang.closeText).toBeDefined();
      expect(hs.lang.restoreTitle).toBeDefined();
    });

    test('should detect browser capabilities', () => {
      expect(hs.ie).toBeDefined();
      expect(typeof hs.ie).toBe('boolean');
      expect(hs.uaVersion).toBeDefined();
      expect(typeof hs.uaVersion).toBe('number');
    });
  });

  describe('Core Functions', () => {
    test('should provide $ function for element selection', () => {
      expect(typeof hs.$).toBe('function');
      
      // Test element selection
      const element = hs.$('test-image');
      expect(element).toBeTruthy();
    });

    test('should provide createElement function', () => {
      expect(typeof hs.createElement).toBe('function');
      
      const div = hs.createElement('div', { className: 'test-class' });
      expect(div.tagName).toBe('DIV');
      expect(div.className).toBe('test-class');
    });

    test('should provide setStyles function', () => {
      expect(typeof hs.setStyles).toBe('function');
      
      const div = document.createElement('div');
      hs.setStyles(div, { width: '100px', height: '50px' });
      expect(div.style.width).toBe('100px');
      expect(div.style.height).toBe('50px');
    });

    test('should provide extend function', () => {
      expect(typeof hs.extend).toBe('function');
      
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const result = hs.extend(obj1, obj2);
      
      expect(result.a).toBe(1);
      expect(result.b).toBe(3);
      expect(result.c).toBe(4);
    });
  });

  describe('Page Size and Position', () => {
    test('should calculate page size', () => {
      expect(typeof hs.getPageSize).toBe('function');
      
      const pageSize = hs.getPageSize();
      expect(pageSize).toHaveProperty('width');
      expect(pageSize).toHaveProperty('height');
      expect(typeof pageSize.width).toBe('number');
      expect(typeof pageSize.height).toBe('number');
    });

    test('should get element position', () => {
      expect(typeof hs.getPosition).toBe('function');
      
      const element = document.getElementById('test-image');
      if (element) {
        const position = hs.getPosition(element);
        expect(position).toHaveProperty('x');
        expect(position).toHaveProperty('y');
        expect(typeof position.x).toBe('number');
        expect(typeof position.y).toBe('number');
      }
    });
  });

  describe('Animation System', () => {
    test('should have fx animation system', () => {
      expect(hs.fx).toBeDefined();
      expect(typeof hs.fx).toBe('function');
    });

    test('should provide animate function', () => {
      expect(typeof hs.animate).toBe('function');
      
      const element = document.createElement('div');
      document.body.appendChild(element);
      
      // Test animation call doesn't throw
      expect(() => {
        hs.animate(element, { opacity: 0.5 });
      }).not.toThrow();
      
      document.body.removeChild(element);
    });

    test('should have easing functions', () => {
      expect(Math.easeInQuad).toBeDefined();
      expect(typeof Math.easeInQuad).toBe('function');
      
      // Test easing function
      const result = Math.easeInQuad(0.5, 0, 1, 1);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('Expansion System', () => {
    test('should have expand function', () => {
      expect(typeof hs.expand).toBe('function');
    });

    test('should have Expander constructor', () => {
      expect(hs.Expander).toBeDefined();
      expect(typeof hs.Expander).toBe('function');
    });

    test('should maintain expanders array', () => {
      expect(hs.expanders).toBeDefined();
      expect(Array.isArray(hs.expanders)).toBe(true);
    });

    test('should have getExpander function', () => {
      expect(typeof hs.getExpander).toBe('function');
    });
  });

  describe('Event Handling', () => {
    test('should provide event listener functions', () => {
      expect(typeof hs.addEventListener).toBe('function');
      expect(typeof hs.removeEventListener).toBe('function');
    });

    test('should handle key events', () => {
      expect(typeof hs.keyHandler).toBe('function');
    });

    test('should handle mouse events', () => {
      expect(typeof hs.mouseClickHandler).toBe('function');
    });
  });

  describe('Outline System', () => {
    test('should have Outline constructor', () => {
      expect(hs.Outline).toBeDefined();
      expect(typeof hs.Outline).toBe('function');
    });

    test('should support different outline types', () => {
      expect(hs.outlineType).toBeDefined();
      expect(hs.pendingOutlines).toBeDefined();
      expect(typeof hs.pendingOutlines).toBe('object');
    });
  });

  describe('Dimension System', () => {
    test('should have Dimension constructor', () => {
      expect(hs.Dimension).toBeDefined();
      expect(typeof hs.Dimension).toBe('function');
    });

    test('should handle positioning calculations', () => {
      expect(hs.oPos).toBeDefined();
      expect(hs.oPos.x).toBeDefined();
      expect(hs.oPos.y).toBeDefined();
      expect(Array.isArray(hs.oPos.x)).toBe(true);
      expect(Array.isArray(hs.oPos.y)).toBe(true);
    });
  });

  describe('Configuration Options', () => {
    test('should have margin settings', () => {
      expect(typeof hs.marginLeft).toBe('number');
      expect(typeof hs.marginRight).toBe('number');
      expect(typeof hs.marginTop).toBe('number');
      expect(typeof hs.marginBottom).toBe('number');
    });

    test('should have timing settings', () => {
      expect(typeof hs.expandDuration).toBe('number');
      expect(typeof hs.restoreDuration).toBe('number');
      expect(hs.expandDuration).toBeGreaterThan(0);
      expect(hs.restoreDuration).toBeGreaterThan(0);
    });

    test('should have z-index management', () => {
      expect(typeof hs.zIndexCounter).toBe('number');
      expect(hs.zIndexCounter).toBeGreaterThan(0);
    });

    test('should have opacity settings', () => {
      expect(typeof hs.loadingOpacity).toBe('number');
      expect(hs.loadingOpacity).toBeGreaterThan(0);
      expect(hs.loadingOpacity).toBeLessThanOrEqual(1);
    });
  });

  describe('Utility Functions', () => {
    test('should provide getSrc function', () => {
      expect(typeof hs.getSrc).toBe('function');
      
      const link = document.querySelector('a.highslide');
      if (link) {
        const src = hs.getSrc(link);
        expect(typeof src).toBe('string');
      }
    });

    test('should provide getParam function', () => {
      expect(typeof hs.getParam).toBe('function');
    });

    test('should provide close function', () => {
      expect(typeof hs.close).toBe('function');
    });

    test('should provide previous and next functions', () => {
      expect(typeof hs.previous).toBe('function');
      expect(typeof hs.next).toBe('function');
    });
  });

  describe('Browser Compatibility', () => {
    test('should detect IE versions', () => {
      expect(hs.ieLt7).toBeDefined();
      expect(hs.ieLt9).toBeDefined();
      expect(typeof hs.ieLt7).toBe('boolean');
      expect(typeof hs.ieLt9).toBe('boolean');
    });

    test('should handle different browsers', () => {
      expect(hs.safari).toBeDefined();
      expect(hs.geckoMac).toBeDefined();
      expect(typeof hs.safari).toBe('boolean');
      expect(typeof hs.geckoMac).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing elements gracefully', () => {
      const nonExistentElement = hs.$('non-existent');
      expect(nonExistentElement).toBeFalsy();
    });

    test('should handle invalid parameters', () => {
      expect(() => {
        hs.setStyles(null, { width: '100px' });
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    test('should have garbage collection utilities', () => {
      expect(hs.discardElement).toBeDefined();
      expect(typeof hs.discardElement).toBe('function');
    });

    test('should manage clones', () => {
      expect(hs.clones).toBeDefined();
      expect(typeof hs.clones).toBe('object');
    });
  });

  describe('Ready State', () => {
    test('should have ready function', () => {
      expect(typeof hs.ready).toBe('function');
    });

    test('should track ready state', () => {
      expect(hs.isReady).toBeDefined();
      expect(typeof hs.isReady).toBe('boolean');
    });

    test('should have onReady array', () => {
      expect(hs.onReady).toBeDefined();
      expect(Array.isArray(hs.onReady)).toBe(true);
    });
  });
});