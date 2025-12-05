// __mocks__/lucide-react-native.js
// Provide named component mocks for lucide-react-native so Jest's ESM/CJS interop
// and named imports work correctly in tests.
const React = require('react');

const createIconComponent = (iconName) => {
  const Icon = (props) => {
    return React.createElement('View', {
      testID: 'lucide-icon',
      ...props,
    });
  };
  Icon.displayName = iconName;
  return Icon;
};

const icons = {
  Clock: createIconComponent('Clock'),
  MapPin: createIconComponent('MapPin'),
  AlertCircle: createIconComponent('AlertCircle'),
  Bell: createIconComponent('Bell'),
  Train: createIconComponent('Train'),
  Bus: createIconComponent('Bus'),
  Navigation: createIconComponent('Navigation'),
  Bike: createIconComponent('Bike'),
  Car: createIconComponent('Car'),
  RefreshCw: createIconComponent('RefreshCw'),
  AlertTriangle: createIconComponent('AlertTriangle'),
  Info: createIconComponent('Info'),
  Star: createIconComponent('Star'),
  Accessibility: createIconComponent('Accessibility'),
  Search: createIconComponent('Search'),
  Filter: createIconComponent('Filter'),
  // fallback that returns an icon component for any other icon
};

// attach any additional property access to the fallback
module.exports = new Proxy(icons, {
  get(target, prop) {
    if (prop in target) return target[prop];
    return createIconComponent(prop);
  },
});

// also provide a default export for consumers using default import
module.exports.default = module.exports;
