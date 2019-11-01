define('app',['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var App = exports.App = function App() {
    _classCallCheck(this, App);

    this.message = 'Hello World!';
  };
});
define('environment',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    debug: true,
    testing: true
  };
});
define('main',['exports', './environment'], function (exports, _environment) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.configure = configure;

  var _environment2 = _interopRequireDefault(_environment);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  Promise.config({
    longStackTraces: _environment2.default.debug,
    warnings: {
      wForgottenReturn: false
    }
  });

  function configure(aurelia) {
    aurelia.use.standardConfiguration().feature('resources');

    if (_environment2.default.debug) {
      aurelia.use.developmentLogging();
    }

    if (_environment2.default.testing) {
      aurelia.use.plugin('aurelia-testing');
    }

    aurelia.start().then(function () {
      return aurelia.setRoot();
    });
  }
});
define('resources/index',["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.configure = configure;
  function configure(config) {}
});
define('resources/elements/grid',["exports"], function (exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var GridCustomElement = exports.GridCustomElement = function () {
        function GridCustomElement() {
            _classCallCheck(this, GridCustomElement);

            this.grid = [];
            this.possibles = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        }

        GridCustomElement.prototype.attached = function attached() {
            for (var y = 0; y < 9; y++) {
                var row = [];
                for (var x = 0; x < 9; x++) {
                    row.push({ possibles: this.possibles.slice(), value: 0 });
                }
                this.grid.push(row);
            }
        };

        GridCustomElement.prototype.applyGridNumber = function applyGridNumber(row, cell, number) {
            this.grid[row][cell].value = number;
        };

        GridCustomElement.prototype.selectNumber = function selectNumber(row, cell, number) {
            var _console;

            this.applyGridNumber(row, cell, number);
            (_console = console).log.apply(_console, arguments);
        };

        return GridCustomElement;
    }();
});
define('text!app.html', ['module'], function(module) { module.exports = "<template>\n    <require from=\"resources/elements/grid\"></require>\n    <grid></grid>\n</template>"; });
define('text!resources/elements/grid.html', ['module'], function(module) { module.exports = "<template>\n    <div class=\"sudokuGrid\">\n        <template class=\"row\"\n                  repeat.for=\"row of grid\">\n            <div class=\"cell \n                        row${$parent.$index}__cell${$index}\n                        ${cell.value == 0 ? 'cell--unset' : 'cell--isSet'}\"\n                 repeat.for=\"cell of row\">\n                <p class=\"possible\"\n                   repeat.for=\"possible of cell.possibles\"\n                   click.delegate=\"selectNumber($parent.$parent.$index,$parent.$index,possible)\">${cell.value == 0 ? possible : cell.value}</p>\n            </div>\n        </template>\n    </div>\n</template>"; });
//# sourceMappingURL=app-bundle.js.map