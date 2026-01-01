var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/@babel/runtime/helpers/interopRequireDefault.js
var require_interopRequireDefault = __commonJS({
  "../../node_modules/@babel/runtime/helpers/interopRequireDefault.js"(exports2, module2) {
    function _interopRequireDefault(e) {
      return e && e.__esModule ? e : {
        "default": e
      };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    module2.exports = _interopRequireDefault, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/AccessibilityUtil/isDisabled.js
var require_isDisabled = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/AccessibilityUtil/isDisabled.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var isDisabled = /* @__PURE__ */ __name((props) => props.disabled || Array.isArray(props.accessibilityStates) && props.accessibilityStates.indexOf("disabled") > -1, "isDisabled");
    var _default = exports2.default = isDisabled;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/AccessibilityUtil/propsToAriaRole.js
var require_propsToAriaRole = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/AccessibilityUtil/propsToAriaRole.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var accessibilityRoleToWebRole = {
      adjustable: "slider",
      button: "button",
      header: "heading",
      image: "img",
      imagebutton: null,
      keyboardkey: null,
      label: null,
      link: "link",
      none: "presentation",
      search: "search",
      summary: "region",
      text: null
    };
    var propsToAriaRole = /* @__PURE__ */ __name((_ref) => {
      var accessibilityRole = _ref.accessibilityRole, role = _ref.role;
      var _role = role || accessibilityRole;
      if (_role) {
        var inferredRole = accessibilityRoleToWebRole[_role];
        if (inferredRole !== null) {
          return inferredRole || _role;
        }
      }
    }, "propsToAriaRole");
    var _default = exports2.default = propsToAriaRole;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/AccessibilityUtil/propsToAccessibilityComponent.js
var require_propsToAccessibilityComponent = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/AccessibilityUtil/propsToAccessibilityComponent.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _propsToAriaRole = _interopRequireDefault(require_propsToAriaRole());
    var roleComponents = {
      article: "article",
      banner: "header",
      blockquote: "blockquote",
      button: "button",
      code: "code",
      complementary: "aside",
      contentinfo: "footer",
      deletion: "del",
      emphasis: "em",
      figure: "figure",
      insertion: "ins",
      form: "form",
      list: "ul",
      listitem: "li",
      main: "main",
      navigation: "nav",
      paragraph: "p",
      region: "section",
      strong: "strong"
    };
    var emptyObject = {};
    var propsToAccessibilityComponent = /* @__PURE__ */ __name(function propsToAccessibilityComponent2(props) {
      if (props === void 0) {
        props = emptyObject;
      }
      var roleProp = props.role || props.accessibilityRole;
      if (roleProp === "label") {
        return "label";
      }
      var role = (0, _propsToAriaRole.default)(props);
      if (role) {
        if (role === "heading") {
          var level = props.accessibilityLevel || props["aria-level"];
          if (level != null) {
            return "h" + level;
          }
          return "h1";
        }
        return roleComponents[role];
      }
    }, "propsToAccessibilityComponent");
    var _default = exports2.default = propsToAccessibilityComponent;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/AccessibilityUtil/index.js
var require_AccessibilityUtil = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/AccessibilityUtil/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _isDisabled = _interopRequireDefault(require_isDisabled());
    var _propsToAccessibilityComponent = _interopRequireDefault(require_propsToAccessibilityComponent());
    var _propsToAriaRole = _interopRequireDefault(require_propsToAriaRole());
    var AccessibilityUtil = {
      isDisabled: _isDisabled.default,
      propsToAccessibilityComponent: _propsToAccessibilityComponent.default,
      propsToAriaRole: _propsToAriaRole.default
    };
    var _default = exports2.default = AccessibilityUtil;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/@babel/runtime/helpers/typeof.js
var require_typeof = __commonJS({
  "../../node_modules/@babel/runtime/helpers/typeof.js"(exports2, module2) {
    function _typeof(o) {
      "@babel/helpers - typeof";
      return module2.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
        return typeof o2;
      } : function(o2) {
        return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
      }, module2.exports.__esModule = true, module2.exports["default"] = module2.exports, _typeof(o);
    }
    __name(_typeof, "_typeof");
    module2.exports = _typeof, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/@babel/runtime/helpers/toPrimitive.js
var require_toPrimitive = __commonJS({
  "../../node_modules/@babel/runtime/helpers/toPrimitive.js"(exports2, module2) {
    var _typeof = require_typeof()["default"];
    function toPrimitive(t, r) {
      if ("object" != _typeof(t) || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != _typeof(i)) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    __name(toPrimitive, "toPrimitive");
    module2.exports = toPrimitive, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/@babel/runtime/helpers/toPropertyKey.js
var require_toPropertyKey = __commonJS({
  "../../node_modules/@babel/runtime/helpers/toPropertyKey.js"(exports2, module2) {
    var _typeof = require_typeof()["default"];
    var toPrimitive = require_toPrimitive();
    function toPropertyKey(t) {
      var i = toPrimitive(t, "string");
      return "symbol" == _typeof(i) ? i : i + "";
    }
    __name(toPropertyKey, "toPropertyKey");
    module2.exports = toPropertyKey, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/@babel/runtime/helpers/defineProperty.js
var require_defineProperty = __commonJS({
  "../../node_modules/@babel/runtime/helpers/defineProperty.js"(exports2, module2) {
    var toPropertyKey = require_toPropertyKey();
    function _defineProperty(e, r, t) {
      return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: true,
        configurable: true,
        writable: true
      }) : e[r] = t, e;
    }
    __name(_defineProperty, "_defineProperty");
    module2.exports = _defineProperty, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/@babel/runtime/helpers/objectSpread2.js
var require_objectSpread2 = __commonJS({
  "../../node_modules/@babel/runtime/helpers/objectSpread2.js"(exports2, module2) {
    var defineProperty = require_defineProperty();
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function(r2) {
          return Object.getOwnPropertyDescriptor(e, r2).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    __name(ownKeys, "ownKeys");
    function _objectSpread2(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
          defineProperty(e, r2, t[r2]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
          Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
        });
      }
      return e;
    }
    __name(_objectSpread2, "_objectSpread2");
    module2.exports = _objectSpread2, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/@babel/runtime/helpers/objectWithoutPropertiesLoose.js
var require_objectWithoutPropertiesLoose = __commonJS({
  "../../node_modules/@babel/runtime/helpers/objectWithoutPropertiesLoose.js"(exports2, module2) {
    function _objectWithoutPropertiesLoose(r, e) {
      if (null == r) return {};
      var t = {};
      for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
        if (-1 !== e.indexOf(n)) continue;
        t[n] = r[n];
      }
      return t;
    }
    __name(_objectWithoutPropertiesLoose, "_objectWithoutPropertiesLoose");
    module2.exports = _objectWithoutPropertiesLoose, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/unitlessNumbers.js
var require_unitlessNumbers = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/unitlessNumbers.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var unitlessNumbers = {
      animationIterationCount: true,
      aspectRatio: true,
      borderImageOutset: true,
      borderImageSlice: true,
      borderImageWidth: true,
      boxFlex: true,
      boxFlexGroup: true,
      boxOrdinalGroup: true,
      columnCount: true,
      flex: true,
      flexGrow: true,
      flexOrder: true,
      flexPositive: true,
      flexShrink: true,
      flexNegative: true,
      fontWeight: true,
      gridRow: true,
      gridRowEnd: true,
      gridRowGap: true,
      gridRowStart: true,
      gridColumn: true,
      gridColumnEnd: true,
      gridColumnGap: true,
      gridColumnStart: true,
      lineClamp: true,
      opacity: true,
      order: true,
      orphans: true,
      tabSize: true,
      widows: true,
      zIndex: true,
      zoom: true,
      // SVG-related
      fillOpacity: true,
      floodOpacity: true,
      stopOpacity: true,
      strokeDasharray: true,
      strokeDashoffset: true,
      strokeMiterlimit: true,
      strokeOpacity: true,
      strokeWidth: true,
      // transform types
      scale: true,
      scaleX: true,
      scaleY: true,
      scaleZ: true,
      // RN properties
      shadowOpacity: true
    };
    var prefixes = ["ms", "Moz", "O", "Webkit"];
    var prefixKey = /* @__PURE__ */ __name((prefix, key) => {
      return prefix + key.charAt(0).toUpperCase() + key.substring(1);
    }, "prefixKey");
    Object.keys(unitlessNumbers).forEach((prop) => {
      prefixes.forEach((prefix) => {
        unitlessNumbers[prefixKey(prefix, prop)] = unitlessNumbers[prop];
      });
    });
    var _default = exports2.default = unitlessNumbers;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/isWebColor/index.js
var require_isWebColor = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/isWebColor/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var isWebColor = /* @__PURE__ */ __name((color) => color === "currentcolor" || color === "currentColor" || color === "inherit" || color.indexOf("var(") === 0, "isWebColor");
    var _default = exports2.default = isWebColor;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/node_modules/@react-native/normalize-colors/index.js
var require_normalize_colors = __commonJS({
  "../../node_modules/react-native-web/node_modules/@react-native/normalize-colors/index.js"(exports2, module2) {
    "use strict";
    function normalizeColor(color) {
      if (typeof color === "number") {
        if (color >>> 0 === color && color >= 0 && color <= 4294967295) {
          return color;
        }
        return null;
      }
      if (typeof color !== "string") {
        return null;
      }
      const matchers = getMatchers();
      let match;
      if (match = matchers.hex6.exec(color)) {
        return parseInt(match[1] + "ff", 16) >>> 0;
      }
      const colorFromKeyword = normalizeKeyword(color);
      if (colorFromKeyword != null) {
        return colorFromKeyword;
      }
      if (match = matchers.rgb.exec(color)) {
        return (parse255(match[1]) << 24 | // r
        parse255(match[2]) << 16 | // g
        parse255(match[3]) << 8 | // b
        255) >>> // a
        0;
      }
      if (match = matchers.rgba.exec(color)) {
        if (match[6] !== void 0) {
          return (parse255(match[6]) << 24 | // r
          parse255(match[7]) << 16 | // g
          parse255(match[8]) << 8 | // b
          parse1(match[9])) >>> // a
          0;
        }
        return (parse255(match[2]) << 24 | // r
        parse255(match[3]) << 16 | // g
        parse255(match[4]) << 8 | // b
        parse1(match[5])) >>> // a
        0;
      }
      if (match = matchers.hex3.exec(color)) {
        return parseInt(
          match[1] + match[1] + // r
          match[2] + match[2] + // g
          match[3] + match[3] + // b
          "ff",
          // a
          16
        ) >>> 0;
      }
      if (match = matchers.hex8.exec(color)) {
        return parseInt(match[1], 16) >>> 0;
      }
      if (match = matchers.hex4.exec(color)) {
        return parseInt(
          match[1] + match[1] + // r
          match[2] + match[2] + // g
          match[3] + match[3] + // b
          match[4] + match[4],
          // a
          16
        ) >>> 0;
      }
      if (match = matchers.hsl.exec(color)) {
        return (hslToRgb(
          parse360(match[1]),
          // h
          parsePercentage(match[2]),
          // s
          parsePercentage(match[3])
          // l
        ) | 255) >>> // a
        0;
      }
      if (match = matchers.hsla.exec(color)) {
        if (match[6] !== void 0) {
          return (hslToRgb(
            parse360(match[6]),
            // h
            parsePercentage(match[7]),
            // s
            parsePercentage(match[8])
            // l
          ) | parse1(match[9])) >>> // a
          0;
        }
        return (hslToRgb(
          parse360(match[2]),
          // h
          parsePercentage(match[3]),
          // s
          parsePercentage(match[4])
          // l
        ) | parse1(match[5])) >>> // a
        0;
      }
      if (match = matchers.hwb.exec(color)) {
        return (hwbToRgb(
          parse360(match[1]),
          // h
          parsePercentage(match[2]),
          // w
          parsePercentage(match[3])
          // b
        ) | 255) >>> // a
        0;
      }
      return null;
    }
    __name(normalizeColor, "normalizeColor");
    function hue2rgb(p, q, t) {
      if (t < 0) {
        t += 1;
      }
      if (t > 1) {
        t -= 1;
      }
      if (t < 1 / 6) {
        return p + (q - p) * 6 * t;
      }
      if (t < 1 / 2) {
        return q;
      }
      if (t < 2 / 3) {
        return p + (q - p) * (2 / 3 - t) * 6;
      }
      return p;
    }
    __name(hue2rgb, "hue2rgb");
    function hslToRgb(h, s, l) {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const r = hue2rgb(p, q, h + 1 / 3);
      const g = hue2rgb(p, q, h);
      const b = hue2rgb(p, q, h - 1 / 3);
      return Math.round(r * 255) << 24 | Math.round(g * 255) << 16 | Math.round(b * 255) << 8;
    }
    __name(hslToRgb, "hslToRgb");
    function hwbToRgb(h, w, b) {
      if (w + b >= 1) {
        const gray = Math.round(w * 255 / (w + b));
        return gray << 24 | gray << 16 | gray << 8;
      }
      const red = hue2rgb(0, 1, h + 1 / 3) * (1 - w - b) + w;
      const green = hue2rgb(0, 1, h) * (1 - w - b) + w;
      const blue = hue2rgb(0, 1, h - 1 / 3) * (1 - w - b) + w;
      return Math.round(red * 255) << 24 | Math.round(green * 255) << 16 | Math.round(blue * 255) << 8;
    }
    __name(hwbToRgb, "hwbToRgb");
    var NUMBER = "[-+]?\\d*\\.?\\d+";
    var PERCENTAGE = NUMBER + "%";
    function call(...args) {
      return "\\(\\s*(" + args.join(")\\s*,?\\s*(") + ")\\s*\\)";
    }
    __name(call, "call");
    function callWithSlashSeparator(...args) {
      return "\\(\\s*(" + args.slice(0, args.length - 1).join(")\\s*,?\\s*(") + ")\\s*/\\s*(" + args[args.length - 1] + ")\\s*\\)";
    }
    __name(callWithSlashSeparator, "callWithSlashSeparator");
    function commaSeparatedCall(...args) {
      return "\\(\\s*(" + args.join(")\\s*,\\s*(") + ")\\s*\\)";
    }
    __name(commaSeparatedCall, "commaSeparatedCall");
    var cachedMatchers;
    function getMatchers() {
      if (cachedMatchers === void 0) {
        cachedMatchers = {
          rgb: new RegExp("rgb" + call(NUMBER, NUMBER, NUMBER)),
          rgba: new RegExp(
            "rgba(" + commaSeparatedCall(NUMBER, NUMBER, NUMBER, NUMBER) + "|" + callWithSlashSeparator(NUMBER, NUMBER, NUMBER, NUMBER) + ")"
          ),
          hsl: new RegExp("hsl" + call(NUMBER, PERCENTAGE, PERCENTAGE)),
          hsla: new RegExp(
            "hsla(" + commaSeparatedCall(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER) + "|" + callWithSlashSeparator(NUMBER, PERCENTAGE, PERCENTAGE, NUMBER) + ")"
          ),
          hwb: new RegExp("hwb" + call(NUMBER, PERCENTAGE, PERCENTAGE)),
          hex3: /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
          hex4: /^#([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
          hex6: /^#([0-9a-fA-F]{6})$/,
          hex8: /^#([0-9a-fA-F]{8})$/
        };
      }
      return cachedMatchers;
    }
    __name(getMatchers, "getMatchers");
    function parse255(str) {
      const int = parseInt(str, 10);
      if (int < 0) {
        return 0;
      }
      if (int > 255) {
        return 255;
      }
      return int;
    }
    __name(parse255, "parse255");
    function parse360(str) {
      const int = parseFloat(str);
      return (int % 360 + 360) % 360 / 360;
    }
    __name(parse360, "parse360");
    function parse1(str) {
      const num = parseFloat(str);
      if (num < 0) {
        return 0;
      }
      if (num > 1) {
        return 255;
      }
      return Math.round(num * 255);
    }
    __name(parse1, "parse1");
    function parsePercentage(str) {
      const int = parseFloat(str);
      if (int < 0) {
        return 0;
      }
      if (int > 100) {
        return 1;
      }
      return int / 100;
    }
    __name(parsePercentage, "parsePercentage");
    function normalizeKeyword(name) {
      switch (name) {
        case "transparent":
          return 0;
        // http://www.w3.org/TR/css3-color/#svg-color
        case "aliceblue":
          return 4042850303;
        case "antiquewhite":
          return 4209760255;
        case "aqua":
          return 16777215;
        case "aquamarine":
          return 2147472639;
        case "azure":
          return 4043309055;
        case "beige":
          return 4126530815;
        case "bisque":
          return 4293182719;
        case "black":
          return 255;
        case "blanchedalmond":
          return 4293643775;
        case "blue":
          return 65535;
        case "blueviolet":
          return 2318131967;
        case "brown":
          return 2771004159;
        case "burlywood":
          return 3736635391;
        case "burntsienna":
          return 3934150143;
        case "cadetblue":
          return 1604231423;
        case "chartreuse":
          return 2147418367;
        case "chocolate":
          return 3530104575;
        case "coral":
          return 4286533887;
        case "cornflowerblue":
          return 1687547391;
        case "cornsilk":
          return 4294499583;
        case "crimson":
          return 3692313855;
        case "cyan":
          return 16777215;
        case "darkblue":
          return 35839;
        case "darkcyan":
          return 9145343;
        case "darkgoldenrod":
          return 3095792639;
        case "darkgray":
          return 2846468607;
        case "darkgreen":
          return 6553855;
        case "darkgrey":
          return 2846468607;
        case "darkkhaki":
          return 3182914559;
        case "darkmagenta":
          return 2332068863;
        case "darkolivegreen":
          return 1433087999;
        case "darkorange":
          return 4287365375;
        case "darkorchid":
          return 2570243327;
        case "darkred":
          return 2332033279;
        case "darksalmon":
          return 3918953215;
        case "darkseagreen":
          return 2411499519;
        case "darkslateblue":
          return 1211993087;
        case "darkslategray":
          return 793726975;
        case "darkslategrey":
          return 793726975;
        case "darkturquoise":
          return 13554175;
        case "darkviolet":
          return 2483082239;
        case "deeppink":
          return 4279538687;
        case "deepskyblue":
          return 12582911;
        case "dimgray":
          return 1768516095;
        case "dimgrey":
          return 1768516095;
        case "dodgerblue":
          return 512819199;
        case "firebrick":
          return 2988581631;
        case "floralwhite":
          return 4294635775;
        case "forestgreen":
          return 579543807;
        case "fuchsia":
          return 4278255615;
        case "gainsboro":
          return 3705462015;
        case "ghostwhite":
          return 4177068031;
        case "gold":
          return 4292280575;
        case "goldenrod":
          return 3668254975;
        case "gray":
          return 2155905279;
        case "green":
          return 8388863;
        case "greenyellow":
          return 2919182335;
        case "grey":
          return 2155905279;
        case "honeydew":
          return 4043305215;
        case "hotpink":
          return 4285117695;
        case "indianred":
          return 3445382399;
        case "indigo":
          return 1258324735;
        case "ivory":
          return 4294963455;
        case "khaki":
          return 4041641215;
        case "lavender":
          return 3873897215;
        case "lavenderblush":
          return 4293981695;
        case "lawngreen":
          return 2096890111;
        case "lemonchiffon":
          return 4294626815;
        case "lightblue":
          return 2916673279;
        case "lightcoral":
          return 4034953471;
        case "lightcyan":
          return 3774873599;
        case "lightgoldenrodyellow":
          return 4210742015;
        case "lightgray":
          return 3553874943;
        case "lightgreen":
          return 2431553791;
        case "lightgrey":
          return 3553874943;
        case "lightpink":
          return 4290167295;
        case "lightsalmon":
          return 4288707327;
        case "lightseagreen":
          return 548580095;
        case "lightskyblue":
          return 2278488831;
        case "lightslategray":
          return 2005441023;
        case "lightslategrey":
          return 2005441023;
        case "lightsteelblue":
          return 2965692159;
        case "lightyellow":
          return 4294959359;
        case "lime":
          return 16711935;
        case "limegreen":
          return 852308735;
        case "linen":
          return 4210091775;
        case "magenta":
          return 4278255615;
        case "maroon":
          return 2147483903;
        case "mediumaquamarine":
          return 1724754687;
        case "mediumblue":
          return 52735;
        case "mediumorchid":
          return 3126187007;
        case "mediumpurple":
          return 2473647103;
        case "mediumseagreen":
          return 1018393087;
        case "mediumslateblue":
          return 2070474495;
        case "mediumspringgreen":
          return 16423679;
        case "mediumturquoise":
          return 1221709055;
        case "mediumvioletred":
          return 3340076543;
        case "midnightblue":
          return 421097727;
        case "mintcream":
          return 4127193855;
        case "mistyrose":
          return 4293190143;
        case "moccasin":
          return 4293178879;
        case "navajowhite":
          return 4292783615;
        case "navy":
          return 33023;
        case "oldlace":
          return 4260751103;
        case "olive":
          return 2155872511;
        case "olivedrab":
          return 1804477439;
        case "orange":
          return 4289003775;
        case "orangered":
          return 4282712319;
        case "orchid":
          return 3664828159;
        case "palegoldenrod":
          return 4008225535;
        case "palegreen":
          return 2566625535;
        case "paleturquoise":
          return 2951671551;
        case "palevioletred":
          return 3681588223;
        case "papayawhip":
          return 4293907967;
        case "peachpuff":
          return 4292524543;
        case "peru":
          return 3448061951;
        case "pink":
          return 4290825215;
        case "plum":
          return 3718307327;
        case "powderblue":
          return 2967529215;
        case "purple":
          return 2147516671;
        case "rebeccapurple":
          return 1714657791;
        case "red":
          return 4278190335;
        case "rosybrown":
          return 3163525119;
        case "royalblue":
          return 1097458175;
        case "saddlebrown":
          return 2336560127;
        case "salmon":
          return 4202722047;
        case "sandybrown":
          return 4104413439;
        case "seagreen":
          return 780883967;
        case "seashell":
          return 4294307583;
        case "sienna":
          return 2689740287;
        case "silver":
          return 3233857791;
        case "skyblue":
          return 2278484991;
        case "slateblue":
          return 1784335871;
        case "slategray":
          return 1887473919;
        case "slategrey":
          return 1887473919;
        case "snow":
          return 4294638335;
        case "springgreen":
          return 16744447;
        case "steelblue":
          return 1182971135;
        case "tan":
          return 3535047935;
        case "teal":
          return 8421631;
        case "thistle":
          return 3636451583;
        case "tomato":
          return 4284696575;
        case "turquoise":
          return 1088475391;
        case "violet":
          return 4001558271;
        case "wheat":
          return 4125012991;
        case "white":
          return 4294967295;
        case "whitesmoke":
          return 4126537215;
        case "yellow":
          return 4294902015;
        case "yellowgreen":
          return 2597139199;
      }
      return null;
    }
    __name(normalizeKeyword, "normalizeKeyword");
    module2.exports = normalizeColor;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/processColor/index.js
var require_processColor = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/processColor/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _normalizeColors = _interopRequireDefault(require_normalize_colors());
    var processColor = /* @__PURE__ */ __name((color) => {
      if (color === void 0 || color === null) {
        return color;
      }
      var int32Color = (0, _normalizeColors.default)(color);
      if (int32Color === void 0 || int32Color === null) {
        return void 0;
      }
      int32Color = (int32Color << 24 | int32Color >>> 8) >>> 0;
      return int32Color;
    }, "processColor");
    var _default = exports2.default = processColor;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/normalizeColor.js
var require_normalizeColor = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/normalizeColor.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _isWebColor = _interopRequireDefault(require_isWebColor());
    var _processColor = _interopRequireDefault(require_processColor());
    var normalizeColor = /* @__PURE__ */ __name(function normalizeColor2(color, opacity) {
      if (opacity === void 0) {
        opacity = 1;
      }
      if (color == null) return;
      if (typeof color === "string" && (0, _isWebColor.default)(color)) {
        return color;
      }
      var colorInt = (0, _processColor.default)(color);
      if (colorInt != null) {
        var r = colorInt >> 16 & 255;
        var g = colorInt >> 8 & 255;
        var b = colorInt & 255;
        var a = (colorInt >> 24 & 255) / 255;
        var alpha = (a * opacity).toFixed(2);
        return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
      }
    }, "normalizeColor");
    var _default = exports2.default = normalizeColor;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/normalizeValueWithProperty.js
var require_normalizeValueWithProperty = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/normalizeValueWithProperty.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = normalizeValueWithProperty;
    var _unitlessNumbers = _interopRequireDefault(require_unitlessNumbers());
    var _normalizeColor = _interopRequireDefault(require_normalizeColor());
    var colorProps = {
      backgroundColor: true,
      borderColor: true,
      borderTopColor: true,
      borderRightColor: true,
      borderBottomColor: true,
      borderLeftColor: true,
      color: true,
      shadowColor: true,
      textDecorationColor: true,
      textShadowColor: true
    };
    function normalizeValueWithProperty(value, property) {
      var returnValue = value;
      if ((property == null || !_unitlessNumbers.default[property]) && typeof value === "number") {
        returnValue = value + "px";
      } else if (property != null && colorProps[property]) {
        returnValue = (0, _normalizeColor.default)(value);
      }
      return returnValue;
    }
    __name(normalizeValueWithProperty, "normalizeValueWithProperty");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/canUseDom/index.js
var require_canUseDom = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/canUseDom/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var canUseDOM = !!(typeof window !== "undefined" && window.document && window.document.createElement);
    var _default = exports2.default = canUseDOM;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/createReactDOMStyle.js
var require_createReactDOMStyle = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/createReactDOMStyle.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _normalizeValueWithProperty = _interopRequireDefault(require_normalizeValueWithProperty());
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var emptyObject = {};
    var supportsCSS3TextDecoration = !_canUseDom.default || window.CSS != null && window.CSS.supports != null && (window.CSS.supports("text-decoration-line", "none") || window.CSS.supports("-webkit-text-decoration-line", "none"));
    var MONOSPACE_FONT_STACK = "monospace,monospace";
    var SYSTEM_FONT_STACK = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
    var STYLE_SHORT_FORM_EXPANSIONS = {
      borderColor: ["borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor"],
      borderBlockColor: ["borderTopColor", "borderBottomColor"],
      borderInlineColor: ["borderRightColor", "borderLeftColor"],
      borderRadius: ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"],
      borderStyle: ["borderTopStyle", "borderRightStyle", "borderBottomStyle", "borderLeftStyle"],
      borderBlockStyle: ["borderTopStyle", "borderBottomStyle"],
      borderInlineStyle: ["borderRightStyle", "borderLeftStyle"],
      borderWidth: ["borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"],
      borderBlockWidth: ["borderTopWidth", "borderBottomWidth"],
      borderInlineWidth: ["borderRightWidth", "borderLeftWidth"],
      insetBlock: ["top", "bottom"],
      insetInline: ["left", "right"],
      marginBlock: ["marginTop", "marginBottom"],
      marginInline: ["marginRight", "marginLeft"],
      paddingBlock: ["paddingTop", "paddingBottom"],
      paddingInline: ["paddingRight", "paddingLeft"],
      overflow: ["overflowX", "overflowY"],
      overscrollBehavior: ["overscrollBehaviorX", "overscrollBehaviorY"],
      borderBlockStartColor: ["borderTopColor"],
      borderBlockStartStyle: ["borderTopStyle"],
      borderBlockStartWidth: ["borderTopWidth"],
      borderBlockEndColor: ["borderBottomColor"],
      borderBlockEndStyle: ["borderBottomStyle"],
      borderBlockEndWidth: ["borderBottomWidth"],
      //borderInlineStartColor: ['borderLeftColor'],
      //borderInlineStartStyle: ['borderLeftStyle'],
      //borderInlineStartWidth: ['borderLeftWidth'],
      //borderInlineEndColor: ['borderRightColor'],
      //borderInlineEndStyle: ['borderRightStyle'],
      //borderInlineEndWidth: ['borderRightWidth'],
      borderEndStartRadius: ["borderBottomLeftRadius"],
      borderEndEndRadius: ["borderBottomRightRadius"],
      borderStartStartRadius: ["borderTopLeftRadius"],
      borderStartEndRadius: ["borderTopRightRadius"],
      insetBlockEnd: ["bottom"],
      insetBlockStart: ["top"],
      //insetInlineEnd: ['right'],
      //insetInlineStart: ['left'],
      marginBlockStart: ["marginTop"],
      marginBlockEnd: ["marginBottom"],
      //marginInlineStart: ['marginLeft'],
      //marginInlineEnd: ['marginRight'],
      paddingBlockStart: ["paddingTop"],
      paddingBlockEnd: ["paddingBottom"]
      //paddingInlineStart: ['marginLeft'],
      //paddingInlineEnd: ['marginRight'],
    };
    var createReactDOMStyle = /* @__PURE__ */ __name((style, isInline) => {
      if (!style) {
        return emptyObject;
      }
      var resolvedStyle = {};
      var _loop = /* @__PURE__ */ __name(function _loop2() {
        var value = style[prop];
        if (
          // Ignore everything with a null value
          value == null
        ) {
          return "continue";
        }
        if (prop === "backgroundClip") {
          if (value === "text") {
            resolvedStyle.backgroundClip = value;
            resolvedStyle.WebkitBackgroundClip = value;
          }
        } else if (prop === "flex") {
          if (value === -1) {
            resolvedStyle.flexGrow = 0;
            resolvedStyle.flexShrink = 1;
            resolvedStyle.flexBasis = "auto";
          } else {
            resolvedStyle.flex = value;
          }
        } else if (prop === "font") {
          resolvedStyle[prop] = value.replace("System", SYSTEM_FONT_STACK);
        } else if (prop === "fontFamily") {
          if (value.indexOf("System") > -1) {
            var stack = value.split(/,\s*/);
            stack[stack.indexOf("System")] = SYSTEM_FONT_STACK;
            resolvedStyle[prop] = stack.join(",");
          } else if (value === "monospace") {
            resolvedStyle[prop] = MONOSPACE_FONT_STACK;
          } else {
            resolvedStyle[prop] = value;
          }
        } else if (prop === "textDecorationLine") {
          if (!supportsCSS3TextDecoration) {
            resolvedStyle.textDecoration = value;
          } else {
            resolvedStyle.textDecorationLine = value;
          }
        } else if (prop === "writingDirection") {
          resolvedStyle.direction = value;
        } else {
          var _value = (0, _normalizeValueWithProperty.default)(style[prop], prop);
          var longFormProperties = STYLE_SHORT_FORM_EXPANSIONS[prop];
          if (isInline && prop === "inset") {
            if (style.insetInline == null) {
              resolvedStyle.left = _value;
              resolvedStyle.right = _value;
            }
            if (style.insetBlock == null) {
              resolvedStyle.top = _value;
              resolvedStyle.bottom = _value;
            }
          } else if (isInline && prop === "margin") {
            if (style.marginInline == null) {
              resolvedStyle.marginLeft = _value;
              resolvedStyle.marginRight = _value;
            }
            if (style.marginBlock == null) {
              resolvedStyle.marginTop = _value;
              resolvedStyle.marginBottom = _value;
            }
          } else if (isInline && prop === "padding") {
            if (style.paddingInline == null) {
              resolvedStyle.paddingLeft = _value;
              resolvedStyle.paddingRight = _value;
            }
            if (style.paddingBlock == null) {
              resolvedStyle.paddingTop = _value;
              resolvedStyle.paddingBottom = _value;
            }
          } else if (longFormProperties) {
            longFormProperties.forEach((longForm, i) => {
              if (style[longForm] == null) {
                resolvedStyle[longForm] = _value;
              }
            });
          } else {
            resolvedStyle[prop] = _value;
          }
        }
      }, "_loop");
      for (var prop in style) {
        var _ret = _loop();
        if (_ret === "continue") continue;
      }
      return resolvedStyle;
    }, "createReactDOMStyle");
    var _default = exports2.default = createReactDOMStyle;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/hash.js
var require_hash = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/hash.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    function murmurhash2_32_gc(str, seed) {
      var l = str.length, h = seed ^ l, i = 0, k;
      while (l >= 4) {
        k = str.charCodeAt(i) & 255 | (str.charCodeAt(++i) & 255) << 8 | (str.charCodeAt(++i) & 255) << 16 | (str.charCodeAt(++i) & 255) << 24;
        k = (k & 65535) * 1540483477 + (((k >>> 16) * 1540483477 & 65535) << 16);
        k ^= k >>> 24;
        k = (k & 65535) * 1540483477 + (((k >>> 16) * 1540483477 & 65535) << 16);
        h = (h & 65535) * 1540483477 + (((h >>> 16) * 1540483477 & 65535) << 16) ^ k;
        l -= 4;
        ++i;
      }
      switch (l) {
        case 3:
          h ^= (str.charCodeAt(i + 2) & 255) << 16;
        case 2:
          h ^= (str.charCodeAt(i + 1) & 255) << 8;
        case 1:
          h ^= str.charCodeAt(i) & 255;
          h = (h & 65535) * 1540483477 + (((h >>> 16) * 1540483477 & 65535) << 16);
      }
      h ^= h >>> 13;
      h = (h & 65535) * 1540483477 + (((h >>> 16) * 1540483477 & 65535) << 16);
      h ^= h >>> 15;
      return h >>> 0;
    }
    __name(murmurhash2_32_gc, "murmurhash2_32_gc");
    var hash = /* @__PURE__ */ __name((str) => murmurhash2_32_gc(str, 1).toString(36), "hash");
    var _default = exports2.default = hash;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/hyphenateStyleName.js
var require_hyphenateStyleName = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/hyphenateStyleName.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var uppercasePattern = /[A-Z]/g;
    var msPattern = /^ms-/;
    var cache2 = {};
    function toHyphenLower(match) {
      return "-" + match.toLowerCase();
    }
    __name(toHyphenLower, "toHyphenLower");
    function hyphenateStyleName(name) {
      if (name in cache2) {
        return cache2[name];
      }
      var hName = name.replace(uppercasePattern, toHyphenLower);
      return cache2[name] = msPattern.test(hName) ? "-" + hName : hName;
    }
    __name(hyphenateStyleName, "hyphenateStyleName");
    var _default = exports2.default = hyphenateStyleName;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/inline-style-prefixer/lib/utils/capitalizeString.js
var require_capitalizeString = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/utils/capitalizeString.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = capitalizeString;
    function capitalizeString(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    __name(capitalizeString, "capitalizeString");
  }
});

// ../../node_modules/inline-style-prefixer/lib/utils/prefixProperty.js
var require_prefixProperty = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/utils/prefixProperty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = prefixProperty;
    var _capitalizeString = require_capitalizeString();
    var _capitalizeString2 = _interopRequireDefault(_capitalizeString);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function prefixProperty(prefixProperties, property, style) {
      var requiredPrefixes = prefixProperties[property];
      if (requiredPrefixes && style.hasOwnProperty(property)) {
        var capitalizedProperty = (0, _capitalizeString2.default)(property);
        for (var i = 0; i < requiredPrefixes.length; ++i) {
          var prefixedProperty = requiredPrefixes[i] + capitalizedProperty;
          if (!style[prefixedProperty]) {
            style[prefixedProperty] = style[property];
          }
        }
      }
      return style;
    }
    __name(prefixProperty, "prefixProperty");
  }
});

// ../../node_modules/inline-style-prefixer/lib/utils/prefixValue.js
var require_prefixValue = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/utils/prefixValue.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = prefixValue;
    function prefixValue(plugins, property, value, style, metaData) {
      for (var i = 0, len = plugins.length; i < len; ++i) {
        var processedValue = plugins[i](property, value, style, metaData);
        if (processedValue) {
          return processedValue;
        }
      }
    }
    __name(prefixValue, "prefixValue");
  }
});

// ../../node_modules/inline-style-prefixer/lib/utils/addNewValuesOnly.js
var require_addNewValuesOnly = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/utils/addNewValuesOnly.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = addNewValuesOnly;
    function addIfNew(list, value) {
      if (list.indexOf(value) === -1) {
        list.push(value);
      }
    }
    __name(addIfNew, "addIfNew");
    function addNewValuesOnly(list, values) {
      if (Array.isArray(values)) {
        for (var i = 0, len = values.length; i < len; ++i) {
          addIfNew(list, values[i]);
        }
      } else {
        addIfNew(list, values);
      }
    }
    __name(addNewValuesOnly, "addNewValuesOnly");
  }
});

// ../../node_modules/inline-style-prefixer/lib/utils/isObject.js
var require_isObject = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/utils/isObject.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = isObject;
    function isObject(value) {
      return value instanceof Object && !Array.isArray(value);
    }
    __name(isObject, "isObject");
  }
});

// ../../node_modules/inline-style-prefixer/lib/createPrefixer.js
var require_createPrefixer = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/createPrefixer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = createPrefixer;
    var _prefixProperty = require_prefixProperty();
    var _prefixProperty2 = _interopRequireDefault(_prefixProperty);
    var _prefixValue = require_prefixValue();
    var _prefixValue2 = _interopRequireDefault(_prefixValue);
    var _addNewValuesOnly = require_addNewValuesOnly();
    var _addNewValuesOnly2 = _interopRequireDefault(_addNewValuesOnly);
    var _isObject = require_isObject();
    var _isObject2 = _interopRequireDefault(_isObject);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function createPrefixer(_ref) {
      var prefixMap = _ref.prefixMap, plugins = _ref.plugins;
      return /* @__PURE__ */ __name(function prefix(style) {
        for (var property in style) {
          var value = style[property];
          if ((0, _isObject2.default)(value)) {
            style[property] = prefix(value);
          } else if (Array.isArray(value)) {
            var combinedValue = [];
            for (var i = 0, len = value.length; i < len; ++i) {
              var processedValue = (0, _prefixValue2.default)(plugins, property, value[i], style, prefixMap);
              (0, _addNewValuesOnly2.default)(combinedValue, processedValue || value[i]);
            }
            if (combinedValue.length > 0) {
              style[property] = combinedValue;
            }
          } else {
            var _processedValue = (0, _prefixValue2.default)(plugins, property, value, style, prefixMap);
            if (_processedValue) {
              style[property] = _processedValue;
            }
            style = (0, _prefixProperty2.default)(prefixMap, property, style);
          }
        }
        return style;
      }, "prefix");
    }
    __name(createPrefixer, "createPrefixer");
  }
});

// ../../node_modules/css-in-js-utils/lib/assignStyle.js
var require_assignStyle = __commonJS({
  "../../node_modules/css-in-js-utils/lib/assignStyle.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = assignStyle;
    function _typeof(obj) {
      "@babel/helpers - typeof";
      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = /* @__PURE__ */ __name(function _typeof2(obj2) {
          return typeof obj2;
        }, "_typeof");
      } else {
        _typeof = /* @__PURE__ */ __name(function _typeof2(obj2) {
          return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
        }, "_typeof");
      }
      return _typeof(obj);
    }
    __name(_typeof, "_typeof");
    function _toConsumableArray(arr) {
      return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
    }
    __name(_toConsumableArray, "_toConsumableArray");
    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    __name(_nonIterableSpread, "_nonIterableSpread");
    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(n);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }
    __name(_unsupportedIterableToArray, "_unsupportedIterableToArray");
    function _iterableToArray(iter) {
      if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
    }
    __name(_iterableToArray, "_iterableToArray");
    function _arrayWithoutHoles(arr) {
      if (Array.isArray(arr)) return _arrayLikeToArray(arr);
    }
    __name(_arrayWithoutHoles, "_arrayWithoutHoles");
    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;
      for (var i = 0, arr2 = new Array(len); i < len; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    }
    __name(_arrayLikeToArray, "_arrayLikeToArray");
    function filterUniqueArray(arr) {
      return arr.filter(function(val, index) {
        return arr.lastIndexOf(val) === index;
      });
    }
    __name(filterUniqueArray, "filterUniqueArray");
    function assignStyle(base) {
      for (var i = 0, len = arguments.length <= 1 ? 0 : arguments.length - 1; i < len; ++i) {
        var style = i + 1 < 1 || arguments.length <= i + 1 ? void 0 : arguments[i + 1];
        for (var property in style) {
          var value = style[property];
          var baseValue = base[property];
          if (baseValue && value) {
            if (Array.isArray(baseValue)) {
              base[property] = filterUniqueArray(baseValue.concat(value));
              continue;
            }
            if (Array.isArray(value)) {
              base[property] = filterUniqueArray([baseValue].concat(_toConsumableArray(value)));
              continue;
            }
            if (_typeof(value) === "object") {
              base[property] = assignStyle({}, baseValue, value);
              continue;
            }
          }
          base[property] = value;
        }
      }
      return base;
    }
    __name(assignStyle, "assignStyle");
  }
});

// ../../node_modules/css-in-js-utils/lib/camelCaseProperty.js
var require_camelCaseProperty = __commonJS({
  "../../node_modules/css-in-js-utils/lib/camelCaseProperty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = camelCaseProperty;
    var DASH = /-([a-z])/g;
    var MS = /^Ms/g;
    var cache2 = {};
    function toUpper(match) {
      return match[1].toUpperCase();
    }
    __name(toUpper, "toUpper");
    function camelCaseProperty(property) {
      if (cache2.hasOwnProperty(property)) {
        return cache2[property];
      }
      var camelProp = property.replace(DASH, toUpper).replace(MS, "ms");
      cache2[property] = camelProp;
      return camelProp;
    }
    __name(camelCaseProperty, "camelCaseProperty");
  }
});

// ../../node_modules/hyphenate-style-name/index.cjs.js
var require_index_cjs = __commonJS({
  "../../node_modules/hyphenate-style-name/index.cjs.js"(exports2, module2) {
    "use strict";
    var uppercasePattern = /[A-Z]/g;
    var msPattern = /^ms-/;
    var cache2 = {};
    function toHyphenLower(match) {
      return "-" + match.toLowerCase();
    }
    __name(toHyphenLower, "toHyphenLower");
    function hyphenateStyleName(name) {
      if (cache2.hasOwnProperty(name)) {
        return cache2[name];
      }
      var hName = name.replace(uppercasePattern, toHyphenLower);
      return cache2[name] = msPattern.test(hName) ? "-" + hName : hName;
    }
    __name(hyphenateStyleName, "hyphenateStyleName");
    module2.exports = hyphenateStyleName;
  }
});

// ../../node_modules/css-in-js-utils/lib/hyphenateProperty.js
var require_hyphenateProperty = __commonJS({
  "../../node_modules/css-in-js-utils/lib/hyphenateProperty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = hyphenateProperty;
    var _hyphenateStyleName = require_index_cjs();
    var _hyphenateStyleName2 = _interopRequireDefault(_hyphenateStyleName);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function hyphenateProperty(property) {
      return (0, _hyphenateStyleName2["default"])(property);
    }
    __name(hyphenateProperty, "hyphenateProperty");
  }
});

// ../../node_modules/css-in-js-utils/lib/cssifyDeclaration.js
var require_cssifyDeclaration = __commonJS({
  "../../node_modules/css-in-js-utils/lib/cssifyDeclaration.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = cssifyDeclaration;
    var _hyphenateProperty = require_hyphenateProperty();
    var _hyphenateProperty2 = _interopRequireDefault(_hyphenateProperty);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function cssifyDeclaration(property, value) {
      return (0, _hyphenateProperty2["default"])(property) + ":" + value;
    }
    __name(cssifyDeclaration, "cssifyDeclaration");
  }
});

// ../../node_modules/css-in-js-utils/lib/cssifyObject.js
var require_cssifyObject = __commonJS({
  "../../node_modules/css-in-js-utils/lib/cssifyObject.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = cssifyObject;
    var _cssifyDeclaration = require_cssifyDeclaration();
    var _cssifyDeclaration2 = _interopRequireDefault(_cssifyDeclaration);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function cssifyObject(style) {
      var css = "";
      for (var property in style) {
        var value = style[property];
        if (typeof value !== "string" && typeof value !== "number") {
          continue;
        }
        if (css) {
          css += ";";
        }
        css += (0, _cssifyDeclaration2["default"])(property, value);
      }
      return css;
    }
    __name(cssifyObject, "cssifyObject");
  }
});

// ../../node_modules/css-in-js-utils/lib/isPrefixedProperty.js
var require_isPrefixedProperty = __commonJS({
  "../../node_modules/css-in-js-utils/lib/isPrefixedProperty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = isPrefixedProperty;
    var RE = /^(Webkit|Moz|O|ms)/;
    function isPrefixedProperty(property) {
      return RE.test(property);
    }
    __name(isPrefixedProperty, "isPrefixedProperty");
  }
});

// ../../node_modules/css-in-js-utils/lib/isPrefixedValue.js
var require_isPrefixedValue = __commonJS({
  "../../node_modules/css-in-js-utils/lib/isPrefixedValue.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = isPrefixedValue;
    var RE = /-webkit-|-moz-|-ms-/;
    function isPrefixedValue(value) {
      return typeof value === "string" && RE.test(value);
    }
    __name(isPrefixedValue, "isPrefixedValue");
  }
});

// ../../node_modules/css-in-js-utils/lib/isUnitlessProperty.js
var require_isUnitlessProperty = __commonJS({
  "../../node_modules/css-in-js-utils/lib/isUnitlessProperty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = isUnitlessProperty;
    var _hyphenateProperty = require_hyphenateProperty();
    var _hyphenateProperty2 = _interopRequireDefault(_hyphenateProperty);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    var unitlessProperties = {
      borderImageOutset: true,
      borderImageSlice: true,
      borderImageWidth: true,
      fontWeight: true,
      lineHeight: true,
      opacity: true,
      orphans: true,
      tabSize: true,
      widows: true,
      zIndex: true,
      zoom: true,
      // SVG-related properties
      fillOpacity: true,
      floodOpacity: true,
      stopOpacity: true,
      strokeDasharray: true,
      strokeDashoffset: true,
      strokeMiterlimit: true,
      strokeOpacity: true,
      strokeWidth: true
    };
    var prefixedUnitlessProperties = ["animationIterationCount", "boxFlex", "boxFlexGroup", "boxOrdinalGroup", "columnCount", "flex", "flexGrow", "flexPositive", "flexShrink", "flexNegative", "flexOrder", "gridColumn", "gridColumnEnd", "gridColumnStart", "gridRow", "gridRowEnd", "gridRowStart", "lineClamp", "order"];
    var prefixes = ["Webkit", "ms", "Moz", "O"];
    function getPrefixedProperty(prefix, property2) {
      return prefix + property2.charAt(0).toUpperCase() + property2.slice(1);
    }
    __name(getPrefixedProperty, "getPrefixedProperty");
    for (i = 0, len = prefixedUnitlessProperties.length; i < len; ++i) {
      property = prefixedUnitlessProperties[i];
      unitlessProperties[property] = true;
      for (j = 0, jLen = prefixes.length; j < jLen; ++j) {
        unitlessProperties[getPrefixedProperty(prefixes[j], property)] = true;
      }
    }
    var property;
    var j;
    var jLen;
    var i;
    var len;
    for (_property in unitlessProperties) {
      unitlessProperties[(0, _hyphenateProperty2["default"])(_property)] = true;
    }
    var _property;
    function isUnitlessProperty(property2) {
      return unitlessProperties.hasOwnProperty(property2);
    }
    __name(isUnitlessProperty, "isUnitlessProperty");
  }
});

// ../../node_modules/css-in-js-utils/lib/unprefixProperty.js
var require_unprefixProperty = __commonJS({
  "../../node_modules/css-in-js-utils/lib/unprefixProperty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = unprefixProperty;
    var RE = /^(ms|Webkit|Moz|O)/;
    function unprefixProperty(property) {
      var propertyWithoutPrefix = property.replace(RE, "");
      return propertyWithoutPrefix.charAt(0).toLowerCase() + propertyWithoutPrefix.slice(1);
    }
    __name(unprefixProperty, "unprefixProperty");
  }
});

// ../../node_modules/css-in-js-utils/lib/normalizeProperty.js
var require_normalizeProperty = __commonJS({
  "../../node_modules/css-in-js-utils/lib/normalizeProperty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = normalizeProperty;
    var _camelCaseProperty = require_camelCaseProperty();
    var _camelCaseProperty2 = _interopRequireDefault(_camelCaseProperty);
    var _unprefixProperty = require_unprefixProperty();
    var _unprefixProperty2 = _interopRequireDefault(_unprefixProperty);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function normalizeProperty(property) {
      return (0, _unprefixProperty2["default"])((0, _camelCaseProperty2["default"])(property));
    }
    __name(normalizeProperty, "normalizeProperty");
  }
});

// ../../node_modules/css-in-js-utils/lib/resolveArrayValue.js
var require_resolveArrayValue = __commonJS({
  "../../node_modules/css-in-js-utils/lib/resolveArrayValue.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = resolveArrayValue;
    var _hyphenateProperty = require_hyphenateProperty();
    var _hyphenateProperty2 = _interopRequireDefault(_hyphenateProperty);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    function resolveArrayValue(property, value) {
      return value.join(";" + (0, _hyphenateProperty2["default"])(property) + ":");
    }
    __name(resolveArrayValue, "resolveArrayValue");
  }
});

// ../../node_modules/css-in-js-utils/lib/unprefixValue.js
var require_unprefixValue = __commonJS({
  "../../node_modules/css-in-js-utils/lib/unprefixValue.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2["default"] = unprefixValue;
    var RE = /(-ms-|-webkit-|-moz-|-o-)/g;
    function unprefixValue(value) {
      if (typeof value === "string") {
        return value.replace(RE, "");
      }
      return value;
    }
    __name(unprefixValue, "unprefixValue");
  }
});

// ../../node_modules/css-in-js-utils/lib/index.js
var require_lib = __commonJS({
  "../../node_modules/css-in-js-utils/lib/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.unprefixValue = exports2.unprefixProperty = exports2.resolveArrayValue = exports2.normalizeProperty = exports2.isUnitlessProperty = exports2.isPrefixedValue = exports2.isPrefixedProperty = exports2.hyphenateProperty = exports2.cssifyObject = exports2.cssifyDeclaration = exports2.camelCaseProperty = exports2.assignStyle = void 0;
    var _assignStyle = require_assignStyle();
    var _assignStyle2 = _interopRequireDefault(_assignStyle);
    var _camelCaseProperty = require_camelCaseProperty();
    var _camelCaseProperty2 = _interopRequireDefault(_camelCaseProperty);
    var _cssifyDeclaration = require_cssifyDeclaration();
    var _cssifyDeclaration2 = _interopRequireDefault(_cssifyDeclaration);
    var _cssifyObject = require_cssifyObject();
    var _cssifyObject2 = _interopRequireDefault(_cssifyObject);
    var _hyphenateProperty = require_hyphenateProperty();
    var _hyphenateProperty2 = _interopRequireDefault(_hyphenateProperty);
    var _isPrefixedProperty = require_isPrefixedProperty();
    var _isPrefixedProperty2 = _interopRequireDefault(_isPrefixedProperty);
    var _isPrefixedValue = require_isPrefixedValue();
    var _isPrefixedValue2 = _interopRequireDefault(_isPrefixedValue);
    var _isUnitlessProperty = require_isUnitlessProperty();
    var _isUnitlessProperty2 = _interopRequireDefault(_isUnitlessProperty);
    var _normalizeProperty = require_normalizeProperty();
    var _normalizeProperty2 = _interopRequireDefault(_normalizeProperty);
    var _resolveArrayValue = require_resolveArrayValue();
    var _resolveArrayValue2 = _interopRequireDefault(_resolveArrayValue);
    var _unprefixProperty = require_unprefixProperty();
    var _unprefixProperty2 = _interopRequireDefault(_unprefixProperty);
    var _unprefixValue = require_unprefixValue();
    var _unprefixValue2 = _interopRequireDefault(_unprefixValue);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { "default": obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    exports2.assignStyle = _assignStyle2["default"];
    exports2.camelCaseProperty = _camelCaseProperty2["default"];
    exports2.cssifyDeclaration = _cssifyDeclaration2["default"];
    exports2.cssifyObject = _cssifyObject2["default"];
    exports2.hyphenateProperty = _hyphenateProperty2["default"];
    exports2.isPrefixedProperty = _isPrefixedProperty2["default"];
    exports2.isPrefixedValue = _isPrefixedValue2["default"];
    exports2.isUnitlessProperty = _isUnitlessProperty2["default"];
    exports2.normalizeProperty = _normalizeProperty2["default"];
    exports2.resolveArrayValue = _resolveArrayValue2["default"];
    exports2.unprefixProperty = _unprefixProperty2["default"];
    exports2.unprefixValue = _unprefixValue2["default"];
  }
});

// ../../node_modules/inline-style-prefixer/lib/plugins/crossFade.js
var require_crossFade = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/plugins/crossFade.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = crossFade;
    var _cssInJsUtils = require_lib();
    var CROSS_FADE_REGEX = /cross-fade\(/g;
    var prefixes = ["-webkit-", ""];
    function crossFade(property, value) {
      if (typeof value === "string" && !(0, _cssInJsUtils.isPrefixedValue)(value) && value.indexOf("cross-fade(") !== -1) {
        return prefixes.map(function(prefix) {
          return value.replace(CROSS_FADE_REGEX, prefix + "cross-fade(");
        });
      }
    }
    __name(crossFade, "crossFade");
  }
});

// ../../node_modules/inline-style-prefixer/lib/plugins/imageSet.js
var require_imageSet = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/plugins/imageSet.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = imageSet;
    var _isPrefixedValue = require_isPrefixedValue();
    var _isPrefixedValue2 = _interopRequireDefault(_isPrefixedValue);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    var prefixes = ["-webkit-", ""];
    function imageSet(property, value) {
      if (typeof value === "string" && !(0, _isPrefixedValue2.default)(value) && value.indexOf("image-set(") > -1) {
        return prefixes.map(function(prefix) {
          return value.replace(/image-set\(/g, prefix + "image-set(");
        });
      }
    }
    __name(imageSet, "imageSet");
  }
});

// ../../node_modules/inline-style-prefixer/lib/plugins/logical.js
var require_logical = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/plugins/logical.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = logical;
    var alternativeProps = {
      marginBlockStart: ["WebkitMarginBefore"],
      marginBlockEnd: ["WebkitMarginAfter"],
      marginInlineStart: ["WebkitMarginStart", "MozMarginStart"],
      marginInlineEnd: ["WebkitMarginEnd", "MozMarginEnd"],
      paddingBlockStart: ["WebkitPaddingBefore"],
      paddingBlockEnd: ["WebkitPaddingAfter"],
      paddingInlineStart: ["WebkitPaddingStart", "MozPaddingStart"],
      paddingInlineEnd: ["WebkitPaddingEnd", "MozPaddingEnd"],
      borderBlockStart: ["WebkitBorderBefore"],
      borderBlockStartColor: ["WebkitBorderBeforeColor"],
      borderBlockStartStyle: ["WebkitBorderBeforeStyle"],
      borderBlockStartWidth: ["WebkitBorderBeforeWidth"],
      borderBlockEnd: ["WebkitBorderAfter"],
      borderBlockEndColor: ["WebkitBorderAfterColor"],
      borderBlockEndStyle: ["WebkitBorderAfterStyle"],
      borderBlockEndWidth: ["WebkitBorderAfterWidth"],
      borderInlineStart: ["WebkitBorderStart", "MozBorderStart"],
      borderInlineStartColor: ["WebkitBorderStartColor", "MozBorderStartColor"],
      borderInlineStartStyle: ["WebkitBorderStartStyle", "MozBorderStartStyle"],
      borderInlineStartWidth: ["WebkitBorderStartWidth", "MozBorderStartWidth"],
      borderInlineEnd: ["WebkitBorderEnd", "MozBorderEnd"],
      borderInlineEndColor: ["WebkitBorderEndColor", "MozBorderEndColor"],
      borderInlineEndStyle: ["WebkitBorderEndStyle", "MozBorderEndStyle"],
      borderInlineEndWidth: ["WebkitBorderEndWidth", "MozBorderEndWidth"]
    };
    function logical(property, value, style) {
      if (Object.prototype.hasOwnProperty.call(alternativeProps, property)) {
        var alternativePropList = alternativeProps[property];
        for (var i = 0, len = alternativePropList.length; i < len; ++i) {
          style[alternativePropList[i]] = value;
        }
      }
    }
    __name(logical, "logical");
  }
});

// ../../node_modules/inline-style-prefixer/lib/plugins/position.js
var require_position = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/plugins/position.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = position;
    function position(property, value) {
      if (property === "position" && value === "sticky") {
        return ["-webkit-sticky", "sticky"];
      }
    }
    __name(position, "position");
  }
});

// ../../node_modules/inline-style-prefixer/lib/plugins/sizing.js
var require_sizing = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/plugins/sizing.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = sizing;
    var prefixes = ["-webkit-", "-moz-", ""];
    var properties = {
      maxHeight: true,
      maxWidth: true,
      width: true,
      height: true,
      columnWidth: true,
      minWidth: true,
      minHeight: true
    };
    var values = {
      "min-content": true,
      "max-content": true,
      "fill-available": true,
      "fit-content": true,
      "contain-floats": true
    };
    function sizing(property, value) {
      if (properties.hasOwnProperty(property) && values.hasOwnProperty(value)) {
        return prefixes.map(function(prefix) {
          return prefix + value;
        });
      }
    }
    __name(sizing, "sizing");
  }
});

// ../../node_modules/inline-style-prefixer/lib/plugins/transition.js
var require_transition = __commonJS({
  "../../node_modules/inline-style-prefixer/lib/plugins/transition.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.default = transition;
    var _hyphenateProperty = require_hyphenateProperty();
    var _hyphenateProperty2 = _interopRequireDefault(_hyphenateProperty);
    var _isPrefixedValue = require_isPrefixedValue();
    var _isPrefixedValue2 = _interopRequireDefault(_isPrefixedValue);
    var _capitalizeString = require_capitalizeString();
    var _capitalizeString2 = _interopRequireDefault(_capitalizeString);
    function _interopRequireDefault(obj) {
      return obj && obj.__esModule ? obj : { default: obj };
    }
    __name(_interopRequireDefault, "_interopRequireDefault");
    var properties = {
      transition: true,
      transitionProperty: true,
      WebkitTransition: true,
      WebkitTransitionProperty: true,
      MozTransition: true,
      MozTransitionProperty: true
    };
    var prefixMapping = {
      Webkit: "-webkit-",
      Moz: "-moz-",
      ms: "-ms-"
    };
    function prefixValue(value, propertyPrefixMap) {
      if ((0, _isPrefixedValue2.default)(value)) {
        return value;
      }
      var multipleValues = value.split(/,(?![^()]*(?:\([^()]*\))?\))/g);
      for (var i = 0, len = multipleValues.length; i < len; ++i) {
        var singleValue = multipleValues[i];
        var values = [singleValue];
        for (var property in propertyPrefixMap) {
          var dashCaseProperty = (0, _hyphenateProperty2.default)(property);
          if (singleValue.indexOf(dashCaseProperty) > -1 && dashCaseProperty !== "order") {
            var prefixes = propertyPrefixMap[property];
            for (var j = 0, pLen = prefixes.length; j < pLen; ++j) {
              values.unshift(singleValue.replace(dashCaseProperty, prefixMapping[prefixes[j]] + dashCaseProperty));
            }
          }
        }
        multipleValues[i] = values.join(",");
      }
      return multipleValues.join(",");
    }
    __name(prefixValue, "prefixValue");
    function transition(property, value, style, propertyPrefixMap) {
      if (typeof value === "string" && properties.hasOwnProperty(property)) {
        var outputValue = prefixValue(value, propertyPrefixMap);
        var webkitOutput = outputValue.split(/,(?![^()]*(?:\([^()]*\))?\))/g).filter(function(val) {
          return !/-moz-|-ms-/.test(val);
        }).join(",");
        if (property.indexOf("Webkit") > -1) {
          return webkitOutput;
        }
        var mozOutput = outputValue.split(/,(?![^()]*(?:\([^()]*\))?\))/g).filter(function(val) {
          return !/-webkit-|-ms-/.test(val);
        }).join(",");
        if (property.indexOf("Moz") > -1) {
          return mozOutput;
        }
        style["Webkit" + (0, _capitalizeString2.default)(property)] = webkitOutput;
        style["Moz" + (0, _capitalizeString2.default)(property)] = mozOutput;
        return outputValue;
      }
    }
    __name(transition, "transition");
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/prefixStyles/static.js
var require_static = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/prefixStyles/static.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _crossFade = _interopRequireDefault(require_crossFade());
    var _imageSet = _interopRequireDefault(require_imageSet());
    var _logical = _interopRequireDefault(require_logical());
    var _position = _interopRequireDefault(require_position());
    var _sizing = _interopRequireDefault(require_sizing());
    var _transition = _interopRequireDefault(require_transition());
    var w = ["Webkit"];
    var m = ["Moz"];
    var wm = ["Webkit", "Moz"];
    var wms = ["Webkit", "ms"];
    var wmms = ["Webkit", "Moz", "ms"];
    var _default = exports2.default = {
      plugins: [_crossFade.default, _imageSet.default, _logical.default, _position.default, _sizing.default, _transition.default],
      prefixMap: {
        appearance: wmms,
        userSelect: wm,
        textEmphasisPosition: wms,
        textEmphasis: wms,
        textEmphasisStyle: wms,
        textEmphasisColor: wms,
        boxDecorationBreak: wms,
        clipPath: w,
        maskImage: wms,
        maskMode: wms,
        maskRepeat: wms,
        maskPosition: wms,
        maskClip: wms,
        maskOrigin: wms,
        maskSize: wms,
        maskComposite: wms,
        mask: wms,
        maskBorderSource: wms,
        maskBorderMode: wms,
        maskBorderSlice: wms,
        maskBorderWidth: wms,
        maskBorderOutset: wms,
        maskBorderRepeat: wms,
        maskBorder: wms,
        maskType: wms,
        textDecorationStyle: w,
        textDecorationSkip: w,
        textDecorationLine: w,
        textDecorationColor: w,
        filter: w,
        breakAfter: w,
        breakBefore: w,
        breakInside: w,
        columnCount: w,
        columnFill: w,
        columnGap: w,
        columnRule: w,
        columnRuleColor: w,
        columnRuleStyle: w,
        columnRuleWidth: w,
        columns: w,
        columnSpan: w,
        columnWidth: w,
        backdropFilter: w,
        hyphens: w,
        flowInto: w,
        flowFrom: w,
        regionFragment: w,
        textOrientation: w,
        tabSize: m,
        fontKerning: w,
        textSizeAdjust: w
      }
    };
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/prefixStyles/index.js
var require_prefixStyles = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/prefixStyles/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _createPrefixer = _interopRequireDefault(require_createPrefixer());
    var _static = _interopRequireDefault(require_static());
    var prefixAll = (0, _createPrefixer.default)(_static.default);
    var _default = exports2.default = prefixAll;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/index.js
var require_compiler = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/compiler/index.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.atomic = atomic;
    exports2.classic = classic;
    exports2.inline = inline;
    exports2.stringifyValueWithProperty = stringifyValueWithProperty;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _createReactDOMStyle = _interopRequireDefault(require_createReactDOMStyle());
    var _hash = _interopRequireDefault(require_hash());
    var _hyphenateStyleName = _interopRequireDefault(require_hyphenateStyleName());
    var _normalizeValueWithProperty = _interopRequireDefault(require_normalizeValueWithProperty());
    var _prefixStyles = _interopRequireDefault(require_prefixStyles());
    var _excluded = ["animationKeyframes"];
    var cache2 = /* @__PURE__ */ new Map();
    var emptyObject = {};
    var classicGroup = 1;
    var atomicGroup = 3;
    var customGroup = {
      borderColor: 2,
      borderRadius: 2,
      borderStyle: 2,
      borderWidth: 2,
      display: 2,
      flex: 2,
      inset: 2,
      margin: 2,
      overflow: 2,
      overscrollBehavior: 2,
      padding: 2,
      insetBlock: 2.1,
      insetInline: 2.1,
      marginInline: 2.1,
      marginBlock: 2.1,
      paddingInline: 2.1,
      paddingBlock: 2.1,
      borderBlockStartColor: 2.2,
      borderBlockStartStyle: 2.2,
      borderBlockStartWidth: 2.2,
      borderBlockEndColor: 2.2,
      borderBlockEndStyle: 2.2,
      borderBlockEndWidth: 2.2,
      borderInlineStartColor: 2.2,
      borderInlineStartStyle: 2.2,
      borderInlineStartWidth: 2.2,
      borderInlineEndColor: 2.2,
      borderInlineEndStyle: 2.2,
      borderInlineEndWidth: 2.2,
      borderEndStartRadius: 2.2,
      borderEndEndRadius: 2.2,
      borderStartStartRadius: 2.2,
      borderStartEndRadius: 2.2,
      insetBlockEnd: 2.2,
      insetBlockStart: 2.2,
      insetInlineEnd: 2.2,
      insetInlineStart: 2.2,
      marginBlockStart: 2.2,
      marginBlockEnd: 2.2,
      marginInlineStart: 2.2,
      marginInlineEnd: 2.2,
      paddingBlockStart: 2.2,
      paddingBlockEnd: 2.2,
      paddingInlineStart: 2.2,
      paddingInlineEnd: 2.2
    };
    var borderTopLeftRadius = "borderTopLeftRadius";
    var borderTopRightRadius = "borderTopRightRadius";
    var borderBottomLeftRadius = "borderBottomLeftRadius";
    var borderBottomRightRadius = "borderBottomRightRadius";
    var borderLeftColor = "borderLeftColor";
    var borderLeftStyle = "borderLeftStyle";
    var borderLeftWidth = "borderLeftWidth";
    var borderRightColor = "borderRightColor";
    var borderRightStyle = "borderRightStyle";
    var borderRightWidth = "borderRightWidth";
    var right = "right";
    var marginLeft = "marginLeft";
    var marginRight = "marginRight";
    var paddingLeft = "paddingLeft";
    var paddingRight = "paddingRight";
    var left = "left";
    var PROPERTIES_FLIP = {
      [borderTopLeftRadius]: borderTopRightRadius,
      [borderTopRightRadius]: borderTopLeftRadius,
      [borderBottomLeftRadius]: borderBottomRightRadius,
      [borderBottomRightRadius]: borderBottomLeftRadius,
      [borderLeftColor]: borderRightColor,
      [borderLeftStyle]: borderRightStyle,
      [borderLeftWidth]: borderRightWidth,
      [borderRightColor]: borderLeftColor,
      [borderRightStyle]: borderLeftStyle,
      [borderRightWidth]: borderLeftWidth,
      [left]: right,
      [marginLeft]: marginRight,
      [marginRight]: marginLeft,
      [paddingLeft]: paddingRight,
      [paddingRight]: paddingLeft,
      [right]: left
    };
    var PROPERTIES_I18N = {
      borderStartStartRadius: borderTopLeftRadius,
      borderStartEndRadius: borderTopRightRadius,
      borderEndStartRadius: borderBottomLeftRadius,
      borderEndEndRadius: borderBottomRightRadius,
      borderInlineStartColor: borderLeftColor,
      borderInlineStartStyle: borderLeftStyle,
      borderInlineStartWidth: borderLeftWidth,
      borderInlineEndColor: borderRightColor,
      borderInlineEndStyle: borderRightStyle,
      borderInlineEndWidth: borderRightWidth,
      insetInlineEnd: right,
      insetInlineStart: left,
      marginInlineStart: marginLeft,
      marginInlineEnd: marginRight,
      paddingInlineStart: paddingLeft,
      paddingInlineEnd: paddingRight
    };
    var PROPERTIES_VALUE = ["clear", "float", "textAlign"];
    function atomic(style) {
      var compiledStyle = {
        $$css: true
      };
      var compiledRules = [];
      function atomicCompile(srcProp, prop, value) {
        var valueString = stringifyValueWithProperty(value, prop);
        var cacheKey = prop + valueString;
        var cachedResult = cache2.get(cacheKey);
        var identifier;
        if (cachedResult != null) {
          identifier = cachedResult[0];
          compiledRules.push(cachedResult[1]);
        } else {
          var v = srcProp !== prop ? cacheKey : valueString;
          identifier = createIdentifier("r", srcProp, v);
          var order = customGroup[srcProp] || atomicGroup;
          var rules = createAtomicRules(identifier, prop, value);
          var orderedRules = [rules, order];
          compiledRules.push(orderedRules);
          cache2.set(cacheKey, [identifier, orderedRules]);
        }
        return identifier;
      }
      __name(atomicCompile, "atomicCompile");
      Object.keys(style).sort().forEach((srcProp) => {
        var value = style[srcProp];
        if (value != null) {
          var localizeableValue;
          if (PROPERTIES_VALUE.indexOf(srcProp) > -1) {
            var _left = atomicCompile(srcProp, srcProp, "left");
            var _right = atomicCompile(srcProp, srcProp, "right");
            if (value === "start") {
              localizeableValue = [_left, _right];
            } else if (value === "end") {
              localizeableValue = [_right, _left];
            }
          }
          var propPolyfill = PROPERTIES_I18N[srcProp];
          if (propPolyfill != null) {
            var ltr = atomicCompile(srcProp, propPolyfill, value);
            var rtl = atomicCompile(srcProp, PROPERTIES_FLIP[propPolyfill], value);
            localizeableValue = [ltr, rtl];
          }
          if (srcProp === "transitionProperty") {
            var values = Array.isArray(value) ? value : [value];
            var polyfillIndices = [];
            for (var i = 0; i < values.length; i++) {
              var val = values[i];
              if (typeof val === "string" && PROPERTIES_I18N[val] != null) {
                polyfillIndices.push(i);
              }
            }
            if (polyfillIndices.length > 0) {
              var ltrPolyfillValues = [...values];
              var rtlPolyfillValues = [...values];
              polyfillIndices.forEach((i2) => {
                var ltrVal = ltrPolyfillValues[i2];
                if (typeof ltrVal === "string") {
                  var ltrPolyfill = PROPERTIES_I18N[ltrVal];
                  var rtlPolyfill = PROPERTIES_FLIP[ltrPolyfill];
                  ltrPolyfillValues[i2] = ltrPolyfill;
                  rtlPolyfillValues[i2] = rtlPolyfill;
                  var _ltr = atomicCompile(srcProp, srcProp, ltrPolyfillValues);
                  var _rtl = atomicCompile(srcProp, srcProp, rtlPolyfillValues);
                  localizeableValue = [_ltr, _rtl];
                }
              });
            }
          }
          if (localizeableValue == null) {
            localizeableValue = atomicCompile(srcProp, srcProp, value);
          } else {
            compiledStyle["$$css$localize"] = true;
          }
          compiledStyle[srcProp] = localizeableValue;
        }
      });
      return [compiledStyle, compiledRules];
    }
    __name(atomic, "atomic");
    function classic(style, name) {
      var compiledStyle = {
        $$css: true
      };
      var compiledRules = [];
      var animationKeyframes = style.animationKeyframes, rest = (0, _objectWithoutPropertiesLoose2.default)(style, _excluded);
      var identifier = createIdentifier("css", name, JSON.stringify(style));
      var selector = "." + identifier;
      var animationName;
      if (animationKeyframes != null) {
        var _processKeyframesValu = processKeyframesValue(animationKeyframes), animationNames = _processKeyframesValu[0], keyframesRules = _processKeyframesValu[1];
        animationName = animationNames.join(",");
        compiledRules.push(...keyframesRules);
      }
      var block = createDeclarationBlock((0, _objectSpread2.default)((0, _objectSpread2.default)({}, rest), {}, {
        animationName
      }));
      compiledRules.push("" + selector + block);
      compiledStyle[identifier] = identifier;
      return [compiledStyle, [[compiledRules, classicGroup]]];
    }
    __name(classic, "classic");
    function inline(originalStyle, isRTL) {
      var style = originalStyle || emptyObject;
      var frozenProps = {};
      var nextStyle = {};
      var _loop = /* @__PURE__ */ __name(function _loop2() {
        var originalValue = style[originalProp];
        var prop = originalProp;
        var value = originalValue;
        if (!Object.prototype.hasOwnProperty.call(style, originalProp) || originalValue == null) {
          return "continue";
        }
        if (PROPERTIES_VALUE.indexOf(originalProp) > -1) {
          if (originalValue === "start") {
            value = isRTL ? "right" : "left";
          } else if (originalValue === "end") {
            value = isRTL ? "left" : "right";
          }
        }
        var propPolyfill = PROPERTIES_I18N[originalProp];
        if (propPolyfill != null) {
          prop = isRTL ? PROPERTIES_FLIP[propPolyfill] : propPolyfill;
        }
        if (originalProp === "transitionProperty") {
          var originalValues = Array.isArray(originalValue) ? originalValue : [originalValue];
          originalValues.forEach((val, i) => {
            if (typeof val === "string") {
              var valuePolyfill = PROPERTIES_I18N[val];
              if (valuePolyfill != null) {
                originalValues[i] = isRTL ? PROPERTIES_FLIP[valuePolyfill] : valuePolyfill;
                value = originalValues.join(" ");
              }
            }
          });
        }
        if (!frozenProps[prop]) {
          nextStyle[prop] = value;
        }
        if (prop === originalProp) {
          frozenProps[prop] = true;
        }
      }, "_loop");
      for (var originalProp in style) {
        var _ret = _loop();
        if (_ret === "continue") continue;
      }
      return (0, _createReactDOMStyle.default)(nextStyle, true);
    }
    __name(inline, "inline");
    function stringifyValueWithProperty(value, property) {
      var normalizedValue = (0, _normalizeValueWithProperty.default)(value, property);
      return typeof normalizedValue !== "string" ? JSON.stringify(normalizedValue || "") : normalizedValue;
    }
    __name(stringifyValueWithProperty, "stringifyValueWithProperty");
    function createAtomicRules(identifier, property, value) {
      var rules = [];
      var selector = "." + identifier;
      switch (property) {
        case "animationKeyframes": {
          var _processKeyframesValu2 = processKeyframesValue(value), animationNames = _processKeyframesValu2[0], keyframesRules = _processKeyframesValu2[1];
          var block = createDeclarationBlock({
            animationName: animationNames.join(",")
          });
          rules.push("" + selector + block, ...keyframesRules);
          break;
        }
        // Equivalent to using '::placeholder'
        case "placeholderTextColor": {
          var _block = createDeclarationBlock({
            color: value,
            opacity: 1
          });
          rules.push(selector + "::-webkit-input-placeholder" + _block, selector + "::-moz-placeholder" + _block, selector + ":-ms-input-placeholder" + _block, selector + "::placeholder" + _block);
          break;
        }
        // Polyfill for additional 'pointer-events' values
        // See d13f78622b233a0afc0c7a200c0a0792c8ca9e58
        // See https://reactnative.dev/docs/view#pointerevents
        case "pointerEvents": {
          var finalValue = value;
          if (value === "auto") {
            finalValue = "auto!important";
          } else if (value === "none") {
            finalValue = "none!important";
            var _block2 = createDeclarationBlock({
              pointerEvents: "none"
            });
            rules.push(selector + ">* " + _block2);
          } else if (value === "box-none") {
            finalValue = "none!important";
            var _block3 = createDeclarationBlock({
              pointerEvents: "auto"
            });
            rules.push(selector + ">* " + _block3);
          } else if (value === "box-only") {
            finalValue = "auto!important";
            var _block4 = createDeclarationBlock({
              pointerEvents: "none"
            });
            rules.push(selector + ">* " + _block4);
          }
          var _block5 = createDeclarationBlock({
            pointerEvents: finalValue
          });
          rules.push("" + selector + _block5);
          break;
        }
        // Polyfill for draft spec
        // https://drafts.csswg.org/css-scrollbars-1/
        case "scrollbarWidth": {
          if (value === "none") {
            rules.push(selector + "::-webkit-scrollbar{display:none}");
          }
          var _block6 = createDeclarationBlock({
            scrollbarWidth: value
          });
          rules.push("" + selector + _block6);
          break;
        }
        default: {
          var _block7 = createDeclarationBlock({
            [property]: value
          });
          rules.push("" + selector + _block7);
          break;
        }
      }
      return rules;
    }
    __name(createAtomicRules, "createAtomicRules");
    function createDeclarationBlock(style) {
      var domStyle = (0, _prefixStyles.default)((0, _createReactDOMStyle.default)(style));
      var declarationsString = Object.keys(domStyle).map((property) => {
        var value = domStyle[property];
        var prop = (0, _hyphenateStyleName.default)(property);
        if (Array.isArray(value)) {
          return value.map((v) => prop + ":" + v).join(";");
        } else {
          return prop + ":" + value;
        }
      }).sort().join(";");
      return "{" + declarationsString + ";}";
    }
    __name(createDeclarationBlock, "createDeclarationBlock");
    function createIdentifier(prefix, name, key) {
      var hashedString = (0, _hash.default)(name + key);
      return process.env.NODE_ENV !== "production" ? prefix + "-" + name + "-" + hashedString : prefix + "-" + hashedString;
    }
    __name(createIdentifier, "createIdentifier");
    function createKeyframes(keyframes) {
      var prefixes = ["-webkit-", ""];
      var identifier = createIdentifier("r", "animation", JSON.stringify(keyframes));
      var steps = "{" + Object.keys(keyframes).map((stepName) => {
        var rule = keyframes[stepName];
        var block = createDeclarationBlock(rule);
        return "" + stepName + block;
      }).join("") + "}";
      var rules = prefixes.map((prefix) => {
        return "@" + prefix + "keyframes " + identifier + steps;
      });
      return [identifier, rules];
    }
    __name(createKeyframes, "createKeyframes");
    function processKeyframesValue(keyframesValue) {
      if (typeof keyframesValue === "number") {
        throw new Error("Invalid CSS keyframes type: " + typeof keyframesValue);
      }
      var animationNames = [];
      var rules = [];
      var value = Array.isArray(keyframesValue) ? keyframesValue : [keyframesValue];
      value.forEach((keyframes) => {
        if (typeof keyframes === "string") {
          animationNames.push(keyframes);
        } else {
          var _createKeyframes = createKeyframes(keyframes), identifier = _createKeyframes[0], keyframesRules = _createKeyframes[1];
          animationNames.push(identifier);
          rules.push(...keyframesRules);
        }
      });
      return [animationNames, rules];
    }
    __name(processKeyframesValue, "processKeyframesValue");
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/dom/createCSSStyleSheet.js
var require_createCSSStyleSheet = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/dom/createCSSStyleSheet.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = createCSSStyleSheet;
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    function createCSSStyleSheet(id, rootNode, textContent) {
      if (_canUseDom.default) {
        var root = rootNode != null ? rootNode : document;
        var element = root.getElementById(id);
        if (element == null) {
          element = document.createElement("style");
          element.setAttribute("id", id);
          if (typeof textContent === "string") {
            element.appendChild(document.createTextNode(textContent));
          }
          if (root instanceof ShadowRoot) {
            root.insertBefore(element, root.firstChild);
          } else {
            var head = root.head;
            if (head) {
              head.insertBefore(element, head.firstChild);
            }
          }
        }
        return element.sheet;
      } else {
        return null;
      }
    }
    __name(createCSSStyleSheet, "createCSSStyleSheet");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/dom/createOrderedCSSStyleSheet.js
var require_createOrderedCSSStyleSheet = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/dom/createOrderedCSSStyleSheet.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = createOrderedCSSStyleSheet;
    var slice = Array.prototype.slice;
    function createOrderedCSSStyleSheet(sheet) {
      var groups = {};
      var selectors = {};
      if (sheet != null) {
        var group;
        slice.call(sheet.cssRules).forEach((cssRule, i) => {
          var cssText = cssRule.cssText;
          if (cssText.indexOf("stylesheet-group") > -1) {
            group = decodeGroupRule(cssRule);
            groups[group] = {
              start: i,
              rules: [cssText]
            };
          } else {
            var selectorText = getSelectorText(cssText);
            if (selectorText != null) {
              selectors[selectorText] = true;
              groups[group].rules.push(cssText);
            }
          }
        });
      }
      function sheetInsert(sheet2, group2, text) {
        var orderedGroups = getOrderedGroups(groups);
        var groupIndex = orderedGroups.indexOf(group2);
        var nextGroupIndex = groupIndex + 1;
        var nextGroup = orderedGroups[nextGroupIndex];
        var position = nextGroup != null && groups[nextGroup].start != null ? groups[nextGroup].start : sheet2.cssRules.length;
        var isInserted = insertRuleAt(sheet2, text, position);
        if (isInserted) {
          if (groups[group2].start == null) {
            groups[group2].start = position;
          }
          for (var i = nextGroupIndex; i < orderedGroups.length; i += 1) {
            var groupNumber = orderedGroups[i];
            var previousStart = groups[groupNumber].start || 0;
            groups[groupNumber].start = previousStart + 1;
          }
        }
        return isInserted;
      }
      __name(sheetInsert, "sheetInsert");
      var OrderedCSSStyleSheet = {
        /**
         * The textContent of the style sheet.
         */
        getTextContent() {
          return getOrderedGroups(groups).map((group2) => {
            var rules = groups[group2].rules;
            var marker = rules.shift();
            rules.sort();
            rules.unshift(marker);
            return rules.join("\n");
          }).join("\n");
        },
        /**
         * Insert a rule into the style sheet
         */
        insert(cssText, groupValue) {
          var group2 = Number(groupValue);
          if (groups[group2] == null) {
            var markerRule = encodeGroupRule(group2);
            groups[group2] = {
              start: null,
              rules: [markerRule]
            };
            if (sheet != null) {
              sheetInsert(sheet, group2, markerRule);
            }
          }
          var selectorText = getSelectorText(cssText);
          if (selectorText != null && selectors[selectorText] == null) {
            selectors[selectorText] = true;
            groups[group2].rules.push(cssText);
            if (sheet != null) {
              var isInserted = sheetInsert(sheet, group2, cssText);
              if (!isInserted) {
                groups[group2].rules.pop();
              }
            }
          }
        }
      };
      return OrderedCSSStyleSheet;
    }
    __name(createOrderedCSSStyleSheet, "createOrderedCSSStyleSheet");
    function encodeGroupRule(group) {
      return '[stylesheet-group="' + group + '"]{}';
    }
    __name(encodeGroupRule, "encodeGroupRule");
    var groupPattern = /["']/g;
    function decodeGroupRule(cssRule) {
      return Number(cssRule.selectorText.split(groupPattern)[1]);
    }
    __name(decodeGroupRule, "decodeGroupRule");
    function getOrderedGroups(obj) {
      return Object.keys(obj).map(Number).sort((a, b) => a > b ? 1 : -1);
    }
    __name(getOrderedGroups, "getOrderedGroups");
    var selectorPattern = /\s*([,])\s*/g;
    function getSelectorText(cssText) {
      var selector = cssText.split("{")[0].trim();
      return selector !== "" ? selector.replace(selectorPattern, "$1") : null;
    }
    __name(getSelectorText, "getSelectorText");
    function insertRuleAt(root, cssText, position) {
      try {
        root.insertRule(cssText, position);
        return true;
      } catch (e) {
        return false;
      }
    }
    __name(insertRuleAt, "insertRuleAt");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/dom/index.js
var require_dom = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/dom/index.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.createSheet = createSheet;
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var _createCSSStyleSheet = _interopRequireDefault(require_createCSSStyleSheet());
    var _createOrderedCSSStyleSheet = _interopRequireDefault(require_createOrderedCSSStyleSheet());
    var defaultId = "react-native-stylesheet";
    var roots = /* @__PURE__ */ new WeakMap();
    var sheets = [];
    var initialRules = [
      // minimal top-level reset
      "html{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:rgba(0,0,0,0);}",
      "body{margin:0;}",
      // minimal form pseudo-element reset
      "button::-moz-focus-inner,input::-moz-focus-inner{border:0;padding:0;}",
      "input::-webkit-search-cancel-button,input::-webkit-search-decoration,input::-webkit-search-results-button,input::-webkit-search-results-decoration{display:none;}"
    ];
    function createSheet(root, id) {
      if (id === void 0) {
        id = defaultId;
      }
      var sheet;
      if (_canUseDom.default) {
        var rootNode = root != null ? root.getRootNode() : document;
        if (sheets.length === 0) {
          sheet = (0, _createOrderedCSSStyleSheet.default)((0, _createCSSStyleSheet.default)(id));
          initialRules.forEach((rule) => {
            sheet.insert(rule, 0);
          });
          roots.set(rootNode, sheets.length);
          sheets.push(sheet);
        } else {
          var index = roots.get(rootNode);
          if (index == null) {
            var initialSheet = sheets[0];
            var textContent = initialSheet != null ? initialSheet.getTextContent() : "";
            sheet = (0, _createOrderedCSSStyleSheet.default)((0, _createCSSStyleSheet.default)(id, rootNode, textContent));
            roots.set(rootNode, sheets.length);
            sheets.push(sheet);
          } else {
            sheet = sheets[index];
          }
        }
      } else {
        if (sheets.length === 0) {
          sheet = (0, _createOrderedCSSStyleSheet.default)((0, _createCSSStyleSheet.default)(id));
          initialRules.forEach((rule) => {
            sheet.insert(rule, 0);
          });
          sheets.push(sheet);
        } else {
          sheet = sheets[0];
        }
      }
      return {
        getTextContent() {
          return sheet.getTextContent();
        },
        id,
        insert(cssText, groupValue) {
          sheets.forEach((s) => {
            s.insert(cssText, groupValue);
          });
        }
      };
    }
    __name(createSheet, "createSheet");
  }
});

// ../../node_modules/styleq/dist/transform-localize-style.js
var require_transform_localize_style = __commonJS({
  "../../node_modules/styleq/dist/transform-localize-style.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.localizeStyle = localizeStyle;
    var cache2 = /* @__PURE__ */ new WeakMap();
    var markerProp = "$$css$localize";
    function compileStyle(style, isRTL) {
      var compiledStyle = {};
      for (var prop in style) {
        if (prop !== markerProp) {
          var value = style[prop];
          if (Array.isArray(value)) {
            compiledStyle[prop] = isRTL ? value[1] : value[0];
          } else {
            compiledStyle[prop] = value;
          }
        }
      }
      return compiledStyle;
    }
    __name(compileStyle, "compileStyle");
    function localizeStyle(style, isRTL) {
      if (style[markerProp] != null) {
        var compiledStyleIndex = isRTL ? 1 : 0;
        if (cache2.has(style)) {
          var _cachedStyles = cache2.get(style);
          var _compiledStyle = _cachedStyles[compiledStyleIndex];
          if (_compiledStyle == null) {
            _compiledStyle = compileStyle(style, isRTL);
            _cachedStyles[compiledStyleIndex] = _compiledStyle;
            cache2.set(style, _cachedStyles);
          }
          return _compiledStyle;
        }
        var compiledStyle = compileStyle(style, isRTL);
        var cachedStyles = new Array(2);
        cachedStyles[compiledStyleIndex] = compiledStyle;
        cache2.set(style, cachedStyles);
        return compiledStyle;
      }
      return style;
    }
    __name(localizeStyle, "localizeStyle");
  }
});

// ../../node_modules/styleq/transform-localize-style.js
var require_transform_localize_style2 = __commonJS({
  "../../node_modules/styleq/transform-localize-style.js"(exports2, module2) {
    module2.exports = require_transform_localize_style();
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/warnOnce/index.js
var require_warnOnce = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/warnOnce/index.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.warnOnce = warnOnce;
    var warnedKeys = {};
    function warnOnce(key, message) {
      if (process.env.NODE_ENV !== "production") {
        if (warnedKeys[key]) {
          return;
        }
        console.warn(message);
        warnedKeys[key] = true;
      }
    }
    __name(warnOnce, "warnOnce");
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/preprocess.js
var require_preprocess = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/preprocess.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.preprocess = exports2.default = exports2.createTransformValue = exports2.createTransformOriginValue = exports2.createTextShadowValue = exports2.createBoxShadowValue = exports2.createBoxShadowArrayValue = void 0;
    var _normalizeColor = _interopRequireDefault(require_normalizeColor());
    var _normalizeValueWithProperty = _interopRequireDefault(require_normalizeValueWithProperty());
    var _warnOnce = require_warnOnce();
    var emptyObject = {};
    var defaultOffset = {
      height: 0,
      width: 0
    };
    var createBoxShadowValue = /* @__PURE__ */ __name((style) => {
      var shadowColor = style.shadowColor, shadowOffset = style.shadowOffset, shadowOpacity = style.shadowOpacity, shadowRadius = style.shadowRadius;
      var _ref = shadowOffset || defaultOffset, height = _ref.height, width = _ref.width;
      var offsetX = (0, _normalizeValueWithProperty.default)(width);
      var offsetY = (0, _normalizeValueWithProperty.default)(height);
      var blurRadius = (0, _normalizeValueWithProperty.default)(shadowRadius || 0);
      var color = (0, _normalizeColor.default)(shadowColor || "black", shadowOpacity);
      if (color != null && offsetX != null && offsetY != null && blurRadius != null) {
        return offsetX + " " + offsetY + " " + blurRadius + " " + color;
      }
    }, "createBoxShadowValue");
    exports2.createBoxShadowValue = createBoxShadowValue;
    var createTextShadowValue = /* @__PURE__ */ __name((style) => {
      var textShadowColor = style.textShadowColor, textShadowOffset = style.textShadowOffset, textShadowRadius = style.textShadowRadius;
      var _ref2 = textShadowOffset || defaultOffset, height = _ref2.height, width = _ref2.width;
      var radius = textShadowRadius || 0;
      var offsetX = (0, _normalizeValueWithProperty.default)(width);
      var offsetY = (0, _normalizeValueWithProperty.default)(height);
      var blurRadius = (0, _normalizeValueWithProperty.default)(radius);
      var color = (0, _normalizeValueWithProperty.default)(textShadowColor, "textShadowColor");
      if (color && (height !== 0 || width !== 0 || radius !== 0) && offsetX != null && offsetY != null && blurRadius != null) {
        return offsetX + " " + offsetY + " " + blurRadius + " " + color;
      }
    }, "createTextShadowValue");
    exports2.createTextShadowValue = createTextShadowValue;
    var mapBoxShadow = /* @__PURE__ */ __name((boxShadow) => {
      if (typeof boxShadow === "string") {
        return boxShadow;
      }
      var offsetX = (0, _normalizeValueWithProperty.default)(boxShadow.offsetX) || 0;
      var offsetY = (0, _normalizeValueWithProperty.default)(boxShadow.offsetY) || 0;
      var blurRadius = (0, _normalizeValueWithProperty.default)(boxShadow.blurRadius) || 0;
      var spreadDistance = (0, _normalizeValueWithProperty.default)(boxShadow.spreadDistance) || 0;
      var color = (0, _normalizeColor.default)(boxShadow.color) || "black";
      var position = boxShadow.inset ? "inset " : "";
      return "" + position + offsetX + " " + offsetY + " " + blurRadius + " " + spreadDistance + " " + color;
    }, "mapBoxShadow");
    var createBoxShadowArrayValue = /* @__PURE__ */ __name((value) => {
      return value.map(mapBoxShadow).join(", ");
    }, "createBoxShadowArrayValue");
    exports2.createBoxShadowArrayValue = createBoxShadowArrayValue;
    var mapTransform = /* @__PURE__ */ __name((transform) => {
      var type = Object.keys(transform)[0];
      var value = transform[type];
      if (type === "matrix" || type === "matrix3d") {
        return type + "(" + value.join(",") + ")";
      } else {
        var normalizedValue = (0, _normalizeValueWithProperty.default)(value, type);
        return type + "(" + normalizedValue + ")";
      }
    }, "mapTransform");
    var createTransformValue = /* @__PURE__ */ __name((value) => {
      return value.map(mapTransform).join(" ");
    }, "createTransformValue");
    exports2.createTransformValue = createTransformValue;
    var createTransformOriginValue = /* @__PURE__ */ __name((value) => {
      return value.map((v) => (0, _normalizeValueWithProperty.default)(v)).join(" ");
    }, "createTransformOriginValue");
    exports2.createTransformOriginValue = createTransformOriginValue;
    var PROPERTIES_STANDARD = {
      borderBottomEndRadius: "borderEndEndRadius",
      borderBottomStartRadius: "borderEndStartRadius",
      borderTopEndRadius: "borderStartEndRadius",
      borderTopStartRadius: "borderStartStartRadius",
      borderEndColor: "borderInlineEndColor",
      borderEndStyle: "borderInlineEndStyle",
      borderEndWidth: "borderInlineEndWidth",
      borderStartColor: "borderInlineStartColor",
      borderStartStyle: "borderInlineStartStyle",
      borderStartWidth: "borderInlineStartWidth",
      end: "insetInlineEnd",
      marginEnd: "marginInlineEnd",
      marginHorizontal: "marginInline",
      marginStart: "marginInlineStart",
      marginVertical: "marginBlock",
      paddingEnd: "paddingInlineEnd",
      paddingHorizontal: "paddingInline",
      paddingStart: "paddingInlineStart",
      paddingVertical: "paddingBlock",
      start: "insetInlineStart"
    };
    var ignoredProps = {
      elevation: true,
      overlayColor: true,
      resizeMode: true,
      tintColor: true
    };
    var preprocess = exports2.preprocess = /* @__PURE__ */ __name(function preprocess2(originalStyle, options) {
      if (options === void 0) {
        options = {};
      }
      var style = originalStyle || emptyObject;
      var nextStyle = {};
      if (options.shadow === true, style.shadowColor != null || style.shadowOffset != null || style.shadowOpacity != null || style.shadowRadius != null) {
        (0, _warnOnce.warnOnce)("shadowStyles", '"shadow*" style props are deprecated. Use "boxShadow".');
        var boxShadowValue = createBoxShadowValue(style);
        if (boxShadowValue != null) {
          nextStyle.boxShadow = boxShadowValue;
        }
      }
      if (options.textShadow === true, style.textShadowColor != null || style.textShadowOffset != null || style.textShadowRadius != null) {
        (0, _warnOnce.warnOnce)("textShadowStyles", '"textShadow*" style props are deprecated. Use "textShadow".');
        var textShadowValue = createTextShadowValue(style);
        if (textShadowValue != null && nextStyle.textShadow == null) {
          var textShadow = style.textShadow;
          var value = textShadow ? textShadow + ", " + textShadowValue : textShadowValue;
          nextStyle.textShadow = value;
        }
      }
      for (var originalProp in style) {
        if (
          // Ignore some React Native styles
          ignoredProps[originalProp] != null || originalProp === "shadowColor" || originalProp === "shadowOffset" || originalProp === "shadowOpacity" || originalProp === "shadowRadius" || originalProp === "textShadowColor" || originalProp === "textShadowOffset" || originalProp === "textShadowRadius"
        ) {
          continue;
        }
        var originalValue = style[originalProp];
        var prop = PROPERTIES_STANDARD[originalProp] || originalProp;
        var _value = originalValue;
        if (!Object.prototype.hasOwnProperty.call(style, originalProp) || prop !== originalProp && style[prop] != null) {
          continue;
        }
        if (prop === "aspectRatio" && typeof _value === "number") {
          nextStyle[prop] = _value.toString();
        } else if (prop === "boxShadow") {
          if (Array.isArray(_value)) {
            _value = createBoxShadowArrayValue(_value);
          }
          var boxShadow = nextStyle.boxShadow;
          nextStyle.boxShadow = boxShadow ? _value + ", " + boxShadow : _value;
        } else if (prop === "fontVariant") {
          if (Array.isArray(_value) && _value.length > 0) {
            _value = _value.join(" ");
          }
          nextStyle[prop] = _value;
        } else if (prop === "textAlignVertical") {
          if (style.verticalAlign == null) {
            nextStyle.verticalAlign = _value === "center" ? "middle" : _value;
          }
        } else if (prop === "transform") {
          if (Array.isArray(_value)) {
            _value = createTransformValue(_value);
          }
          nextStyle.transform = _value;
        } else if (prop === "transformOrigin") {
          if (Array.isArray(_value)) {
            _value = createTransformOriginValue(_value);
          }
          nextStyle.transformOrigin = _value;
        } else {
          nextStyle[prop] = _value;
        }
      }
      return nextStyle;
    }, "preprocess");
    var _default = exports2.default = preprocess;
  }
});

// ../../node_modules/styleq/dist/styleq.js
var require_styleq = __commonJS({
  "../../node_modules/styleq/dist/styleq.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", {
      value: true
    });
    exports2.styleq = void 0;
    var cache2 = /* @__PURE__ */ new WeakMap();
    var compiledKey = "$$css";
    function createStyleq(options) {
      var disableCache;
      var disableMix;
      var transform;
      if (options != null) {
        disableCache = options.disableCache === true;
        disableMix = options.disableMix === true;
        transform = options.transform;
      }
      return /* @__PURE__ */ __name(function styleq2() {
        var definedProperties = [];
        var className = "";
        var inlineStyle = null;
        var nextCache = disableCache ? null : cache2;
        var styles = new Array(arguments.length);
        for (var i = 0; i < arguments.length; i++) {
          styles[i] = arguments[i];
        }
        while (styles.length > 0) {
          var possibleStyle = styles.pop();
          if (possibleStyle == null || possibleStyle === false) {
            continue;
          }
          if (Array.isArray(possibleStyle)) {
            for (var _i = 0; _i < possibleStyle.length; _i++) {
              styles.push(possibleStyle[_i]);
            }
            continue;
          }
          var style = transform != null ? transform(possibleStyle) : possibleStyle;
          if (style.$$css) {
            var classNameChunk = "";
            if (nextCache != null && nextCache.has(style)) {
              var cacheEntry = nextCache.get(style);
              if (cacheEntry != null) {
                classNameChunk = cacheEntry[0];
                definedProperties.push.apply(definedProperties, cacheEntry[1]);
                nextCache = cacheEntry[2];
              }
            } else {
              var definedPropertiesChunk = [];
              for (var prop in style) {
                var value = style[prop];
                if (prop === compiledKey) continue;
                if (typeof value === "string" || value === null) {
                  if (!definedProperties.includes(prop)) {
                    definedProperties.push(prop);
                    if (nextCache != null) {
                      definedPropertiesChunk.push(prop);
                    }
                    if (typeof value === "string") {
                      classNameChunk += classNameChunk ? " " + value : value;
                    }
                  }
                } else {
                  console.error("styleq: ".concat(prop, " typeof ").concat(String(value), ' is not "string" or "null".'));
                }
              }
              if (nextCache != null) {
                var weakMap = /* @__PURE__ */ new WeakMap();
                nextCache.set(style, [classNameChunk, definedPropertiesChunk, weakMap]);
                nextCache = weakMap;
              }
            }
            if (classNameChunk) {
              className = className ? classNameChunk + " " + className : classNameChunk;
            }
          } else {
            if (disableMix) {
              if (inlineStyle == null) {
                inlineStyle = {};
              }
              inlineStyle = Object.assign({}, style, inlineStyle);
            } else {
              var subStyle = null;
              for (var _prop in style) {
                var _value = style[_prop];
                if (_value !== void 0) {
                  if (!definedProperties.includes(_prop)) {
                    if (_value != null) {
                      if (inlineStyle == null) {
                        inlineStyle = {};
                      }
                      if (subStyle == null) {
                        subStyle = {};
                      }
                      subStyle[_prop] = _value;
                    }
                    definedProperties.push(_prop);
                    nextCache = null;
                  }
                }
              }
              if (subStyle != null) {
                inlineStyle = Object.assign(subStyle, inlineStyle);
              }
            }
          }
        }
        var styleProps = [className, inlineStyle];
        return styleProps;
      }, "styleq");
    }
    __name(createStyleq, "createStyleq");
    var styleq = createStyleq();
    exports2.styleq = styleq;
    styleq.factory = createStyleq;
  }
});

// ../../node_modules/styleq/styleq.js
var require_styleq2 = __commonJS({
  "../../node_modules/styleq/styleq.js"(exports2, module2) {
    module2.exports = require_styleq();
  }
});

// ../../node_modules/postcss-value-parser/lib/parse.js
var require_parse = __commonJS({
  "../../node_modules/postcss-value-parser/lib/parse.js"(exports2, module2) {
    var openParentheses = "(".charCodeAt(0);
    var closeParentheses = ")".charCodeAt(0);
    var singleQuote = "'".charCodeAt(0);
    var doubleQuote = '"'.charCodeAt(0);
    var backslash = "\\".charCodeAt(0);
    var slash = "/".charCodeAt(0);
    var comma = ",".charCodeAt(0);
    var colon = ":".charCodeAt(0);
    var star = "*".charCodeAt(0);
    var uLower = "u".charCodeAt(0);
    var uUpper = "U".charCodeAt(0);
    var plus = "+".charCodeAt(0);
    var isUnicodeRange = /^[a-f0-9?-]+$/i;
    module2.exports = function(input) {
      var tokens = [];
      var value = input;
      var next, quote, prev, token, escape, escapePos, whitespacePos, parenthesesOpenPos;
      var pos = 0;
      var code = value.charCodeAt(pos);
      var max = value.length;
      var stack = [{ nodes: tokens }];
      var balanced = 0;
      var parent;
      var name = "";
      var before = "";
      var after = "";
      while (pos < max) {
        if (code <= 32) {
          next = pos;
          do {
            next += 1;
            code = value.charCodeAt(next);
          } while (code <= 32);
          token = value.slice(pos, next);
          prev = tokens[tokens.length - 1];
          if (code === closeParentheses && balanced) {
            after = token;
          } else if (prev && prev.type === "div") {
            prev.after = token;
            prev.sourceEndIndex += token.length;
          } else if (code === comma || code === colon || code === slash && value.charCodeAt(next + 1) !== star && (!parent || parent && parent.type === "function" && parent.value !== "calc")) {
            before = token;
          } else {
            tokens.push({
              type: "space",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          }
          pos = next;
        } else if (code === singleQuote || code === doubleQuote) {
          next = pos;
          quote = code === singleQuote ? "'" : '"';
          token = {
            type: "string",
            sourceIndex: pos,
            quote
          };
          do {
            escape = false;
            next = value.indexOf(quote, next + 1);
            if (~next) {
              escapePos = next;
              while (value.charCodeAt(escapePos - 1) === backslash) {
                escapePos -= 1;
                escape = !escape;
              }
            } else {
              value += quote;
              next = value.length - 1;
              token.unclosed = true;
            }
          } while (escape);
          token.value = value.slice(pos + 1, next);
          token.sourceEndIndex = token.unclosed ? next : next + 1;
          tokens.push(token);
          pos = next + 1;
          code = value.charCodeAt(pos);
        } else if (code === slash && value.charCodeAt(pos + 1) === star) {
          next = value.indexOf("*/", pos);
          token = {
            type: "comment",
            sourceIndex: pos,
            sourceEndIndex: next + 2
          };
          if (next === -1) {
            token.unclosed = true;
            next = value.length;
            token.sourceEndIndex = next;
          }
          token.value = value.slice(pos + 2, next);
          tokens.push(token);
          pos = next + 2;
          code = value.charCodeAt(pos);
        } else if ((code === slash || code === star) && parent && parent.type === "function" && parent.value === "calc") {
          token = value[pos];
          tokens.push({
            type: "word",
            sourceIndex: pos - before.length,
            sourceEndIndex: pos + token.length,
            value: token
          });
          pos += 1;
          code = value.charCodeAt(pos);
        } else if (code === slash || code === comma || code === colon) {
          token = value[pos];
          tokens.push({
            type: "div",
            sourceIndex: pos - before.length,
            sourceEndIndex: pos + token.length,
            value: token,
            before,
            after: ""
          });
          before = "";
          pos += 1;
          code = value.charCodeAt(pos);
        } else if (openParentheses === code) {
          next = pos;
          do {
            next += 1;
            code = value.charCodeAt(next);
          } while (code <= 32);
          parenthesesOpenPos = pos;
          token = {
            type: "function",
            sourceIndex: pos - name.length,
            value: name,
            before: value.slice(parenthesesOpenPos + 1, next)
          };
          pos = next;
          if (name === "url" && code !== singleQuote && code !== doubleQuote) {
            next -= 1;
            do {
              escape = false;
              next = value.indexOf(")", next + 1);
              if (~next) {
                escapePos = next;
                while (value.charCodeAt(escapePos - 1) === backslash) {
                  escapePos -= 1;
                  escape = !escape;
                }
              } else {
                value += ")";
                next = value.length - 1;
                token.unclosed = true;
              }
            } while (escape);
            whitespacePos = next;
            do {
              whitespacePos -= 1;
              code = value.charCodeAt(whitespacePos);
            } while (code <= 32);
            if (parenthesesOpenPos < whitespacePos) {
              if (pos !== whitespacePos + 1) {
                token.nodes = [
                  {
                    type: "word",
                    sourceIndex: pos,
                    sourceEndIndex: whitespacePos + 1,
                    value: value.slice(pos, whitespacePos + 1)
                  }
                ];
              } else {
                token.nodes = [];
              }
              if (token.unclosed && whitespacePos + 1 !== next) {
                token.after = "";
                token.nodes.push({
                  type: "space",
                  sourceIndex: whitespacePos + 1,
                  sourceEndIndex: next,
                  value: value.slice(whitespacePos + 1, next)
                });
              } else {
                token.after = value.slice(whitespacePos + 1, next);
                token.sourceEndIndex = next;
              }
            } else {
              token.after = "";
              token.nodes = [];
            }
            pos = next + 1;
            token.sourceEndIndex = token.unclosed ? next : pos;
            code = value.charCodeAt(pos);
            tokens.push(token);
          } else {
            balanced += 1;
            token.after = "";
            token.sourceEndIndex = pos + 1;
            tokens.push(token);
            stack.push(token);
            tokens = token.nodes = [];
            parent = token;
          }
          name = "";
        } else if (closeParentheses === code && balanced) {
          pos += 1;
          code = value.charCodeAt(pos);
          parent.after = after;
          parent.sourceEndIndex += after.length;
          after = "";
          balanced -= 1;
          stack[stack.length - 1].sourceEndIndex = pos;
          stack.pop();
          parent = stack[balanced];
          tokens = parent.nodes;
        } else {
          next = pos;
          do {
            if (code === backslash) {
              next += 1;
            }
            next += 1;
            code = value.charCodeAt(next);
          } while (next < max && !(code <= 32 || code === singleQuote || code === doubleQuote || code === comma || code === colon || code === slash || code === openParentheses || code === star && parent && parent.type === "function" && parent.value === "calc" || code === slash && parent.type === "function" && parent.value === "calc" || code === closeParentheses && balanced));
          token = value.slice(pos, next);
          if (openParentheses === code) {
            name = token;
          } else if ((uLower === token.charCodeAt(0) || uUpper === token.charCodeAt(0)) && plus === token.charCodeAt(1) && isUnicodeRange.test(token.slice(2))) {
            tokens.push({
              type: "unicode-range",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          } else {
            tokens.push({
              type: "word",
              sourceIndex: pos,
              sourceEndIndex: next,
              value: token
            });
          }
          pos = next;
        }
      }
      for (pos = stack.length - 1; pos; pos -= 1) {
        stack[pos].unclosed = true;
        stack[pos].sourceEndIndex = value.length;
      }
      return stack[0].nodes;
    };
  }
});

// ../../node_modules/postcss-value-parser/lib/walk.js
var require_walk = __commonJS({
  "../../node_modules/postcss-value-parser/lib/walk.js"(exports2, module2) {
    module2.exports = /* @__PURE__ */ __name(function walk(nodes, cb, bubble) {
      var i, max, node, result;
      for (i = 0, max = nodes.length; i < max; i += 1) {
        node = nodes[i];
        if (!bubble) {
          result = cb(node, i, nodes);
        }
        if (result !== false && node.type === "function" && Array.isArray(node.nodes)) {
          walk(node.nodes, cb, bubble);
        }
        if (bubble) {
          cb(node, i, nodes);
        }
      }
    }, "walk");
  }
});

// ../../node_modules/postcss-value-parser/lib/stringify.js
var require_stringify = __commonJS({
  "../../node_modules/postcss-value-parser/lib/stringify.js"(exports2, module2) {
    function stringifyNode(node, custom) {
      var type = node.type;
      var value = node.value;
      var buf;
      var customResult;
      if (custom && (customResult = custom(node)) !== void 0) {
        return customResult;
      } else if (type === "word" || type === "space") {
        return value;
      } else if (type === "string") {
        buf = node.quote || "";
        return buf + value + (node.unclosed ? "" : buf);
      } else if (type === "comment") {
        return "/*" + value + (node.unclosed ? "" : "*/");
      } else if (type === "div") {
        return (node.before || "") + value + (node.after || "");
      } else if (Array.isArray(node.nodes)) {
        buf = stringify(node.nodes, custom);
        if (type !== "function") {
          return buf;
        }
        return value + "(" + (node.before || "") + buf + (node.after || "") + (node.unclosed ? "" : ")");
      }
      return value;
    }
    __name(stringifyNode, "stringifyNode");
    function stringify(nodes, custom) {
      var result, i;
      if (Array.isArray(nodes)) {
        result = "";
        for (i = nodes.length - 1; ~i; i -= 1) {
          result = stringifyNode(nodes[i], custom) + result;
        }
        return result;
      }
      return stringifyNode(nodes, custom);
    }
    __name(stringify, "stringify");
    module2.exports = stringify;
  }
});

// ../../node_modules/postcss-value-parser/lib/unit.js
var require_unit = __commonJS({
  "../../node_modules/postcss-value-parser/lib/unit.js"(exports2, module2) {
    var minus = "-".charCodeAt(0);
    var plus = "+".charCodeAt(0);
    var dot = ".".charCodeAt(0);
    var exp = "e".charCodeAt(0);
    var EXP = "E".charCodeAt(0);
    function likeNumber(value) {
      var code = value.charCodeAt(0);
      var nextCode;
      if (code === plus || code === minus) {
        nextCode = value.charCodeAt(1);
        if (nextCode >= 48 && nextCode <= 57) {
          return true;
        }
        var nextNextCode = value.charCodeAt(2);
        if (nextCode === dot && nextNextCode >= 48 && nextNextCode <= 57) {
          return true;
        }
        return false;
      }
      if (code === dot) {
        nextCode = value.charCodeAt(1);
        if (nextCode >= 48 && nextCode <= 57) {
          return true;
        }
        return false;
      }
      if (code >= 48 && code <= 57) {
        return true;
      }
      return false;
    }
    __name(likeNumber, "likeNumber");
    module2.exports = function(value) {
      var pos = 0;
      var length = value.length;
      var code;
      var nextCode;
      var nextNextCode;
      if (length === 0 || !likeNumber(value)) {
        return false;
      }
      code = value.charCodeAt(pos);
      if (code === plus || code === minus) {
        pos++;
      }
      while (pos < length) {
        code = value.charCodeAt(pos);
        if (code < 48 || code > 57) {
          break;
        }
        pos += 1;
      }
      code = value.charCodeAt(pos);
      nextCode = value.charCodeAt(pos + 1);
      if (code === dot && nextCode >= 48 && nextCode <= 57) {
        pos += 2;
        while (pos < length) {
          code = value.charCodeAt(pos);
          if (code < 48 || code > 57) {
            break;
          }
          pos += 1;
        }
      }
      code = value.charCodeAt(pos);
      nextCode = value.charCodeAt(pos + 1);
      nextNextCode = value.charCodeAt(pos + 2);
      if ((code === exp || code === EXP) && (nextCode >= 48 && nextCode <= 57 || (nextCode === plus || nextCode === minus) && nextNextCode >= 48 && nextNextCode <= 57)) {
        pos += nextCode === plus || nextCode === minus ? 3 : 2;
        while (pos < length) {
          code = value.charCodeAt(pos);
          if (code < 48 || code > 57) {
            break;
          }
          pos += 1;
        }
      }
      return {
        number: value.slice(0, pos),
        unit: value.slice(pos)
      };
    };
  }
});

// ../../node_modules/postcss-value-parser/lib/index.js
var require_lib2 = __commonJS({
  "../../node_modules/postcss-value-parser/lib/index.js"(exports2, module2) {
    var parse = require_parse();
    var walk = require_walk();
    var stringify = require_stringify();
    function ValueParser(value) {
      if (this instanceof ValueParser) {
        this.nodes = parse(value);
        return this;
      }
      return new ValueParser(value);
    }
    __name(ValueParser, "ValueParser");
    ValueParser.prototype.toString = function() {
      return Array.isArray(this.nodes) ? stringify(this.nodes) : "";
    };
    ValueParser.prototype.walk = function(cb, bubble) {
      walk(this.nodes, cb, bubble);
      return this;
    };
    ValueParser.unit = require_unit();
    ValueParser.walk = walk;
    ValueParser.stringify = stringify;
    module2.exports = ValueParser;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/validate.js
var require_validate = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/validate.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.validate = validate;
    var _postcssValueParser = _interopRequireDefault(require_lib2());
    var invalidShortforms = {
      background: true,
      borderBottom: true,
      borderLeft: true,
      borderRight: true,
      borderTop: true,
      font: true,
      grid: true,
      outline: true,
      textDecoration: true
    };
    var invalidMultiValueShortforms = {
      flex: true,
      margin: true,
      padding: true,
      borderColor: true,
      borderRadius: true,
      borderStyle: true,
      borderWidth: true,
      inset: true,
      insetBlock: true,
      insetInline: true,
      marginBlock: true,
      marginInline: true,
      marginHorizontal: true,
      marginVertical: true,
      paddingBlock: true,
      paddingInline: true,
      paddingHorizontal: true,
      paddingVertical: true,
      overflow: true,
      overscrollBehavior: true,
      backgroundPosition: true
    };
    function error(message) {
      console.error(message);
    }
    __name(error, "error");
    function validate(obj) {
      for (var k in obj) {
        var prop = k.trim();
        var value = obj[prop];
        var isInvalid = false;
        if (value === null) {
          continue;
        }
        if (typeof value === "string" && value.indexOf("!important") > -1) {
          error('Invalid style declaration "' + prop + ":" + value + '". Values cannot include "!important"');
          isInvalid = true;
        } else {
          var suggestion = "";
          if (prop === "animation" || prop === "animationName") {
            suggestion = 'Did you mean "animationKeyframes"?';
            isInvalid = true;
          } else if (prop === "direction") {
            suggestion = 'Did you mean "writingDirection"?';
            isInvalid = true;
          } else if (invalidShortforms[prop]) {
            suggestion = "Please use long-form properties.";
            isInvalid = true;
          } else if (invalidMultiValueShortforms[prop]) {
            if (typeof value === "string" && (0, _postcssValueParser.default)(value).nodes.length > 1) {
              suggestion = 'Value is "' + value + '" but only single values are supported.';
              isInvalid = true;
            }
          }
          if (suggestion !== "") {
            error('Invalid style property of "' + prop + '". ' + suggestion);
          }
        }
        if (isInvalid) {
          delete obj[k];
        }
      }
    }
    __name(validate, "validate");
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/index.js
var require_StyleSheet = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StyleSheet/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _compiler = require_compiler();
    var _dom = require_dom();
    var _transformLocalizeStyle = require_transform_localize_style2();
    var _preprocess = require_preprocess();
    var _styleq = require_styleq2();
    var _validate = require_validate();
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var _excluded = ["writingDirection"];
    var staticStyleMap = /* @__PURE__ */ new WeakMap();
    var sheet = (0, _dom.createSheet)();
    var defaultPreprocessOptions = {
      shadow: true,
      textShadow: true
    };
    function customStyleq(styles, options) {
      if (options === void 0) {
        options = {};
      }
      var _options = options, writingDirection = _options.writingDirection, preprocessOptions = (0, _objectWithoutPropertiesLoose2.default)(_options, _excluded);
      var isRTL = writingDirection === "rtl";
      return _styleq.styleq.factory({
        transform(style) {
          var compiledStyle = staticStyleMap.get(style);
          if (compiledStyle != null) {
            return (0, _transformLocalizeStyle.localizeStyle)(compiledStyle, isRTL);
          }
          return (0, _preprocess.preprocess)(style, (0, _objectSpread2.default)((0, _objectSpread2.default)({}, defaultPreprocessOptions), preprocessOptions));
        }
      })(styles);
    }
    __name(customStyleq, "customStyleq");
    function insertRules(compiledOrderedRules) {
      compiledOrderedRules.forEach((_ref) => {
        var rules = _ref[0], order = _ref[1];
        if (sheet != null) {
          rules.forEach((rule) => {
            sheet.insert(rule, order);
          });
        }
      });
    }
    __name(insertRules, "insertRules");
    function compileAndInsertAtomic(style) {
      var _atomic = (0, _compiler.atomic)((0, _preprocess.preprocess)(style, defaultPreprocessOptions)), compiledStyle = _atomic[0], compiledOrderedRules = _atomic[1];
      insertRules(compiledOrderedRules);
      return compiledStyle;
    }
    __name(compileAndInsertAtomic, "compileAndInsertAtomic");
    function compileAndInsertReset(style, key) {
      var _classic = (0, _compiler.classic)(style, key), compiledStyle = _classic[0], compiledOrderedRules = _classic[1];
      insertRules(compiledOrderedRules);
      return compiledStyle;
    }
    __name(compileAndInsertReset, "compileAndInsertReset");
    var absoluteFillObject = {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
    var absoluteFill = create({
      x: (0, _objectSpread2.default)({}, absoluteFillObject)
    }).x;
    function create(styles) {
      Object.keys(styles).forEach((key) => {
        var styleObj = styles[key];
        if (styleObj != null && styleObj.$$css !== true) {
          var compiledStyles;
          if (key.indexOf("$raw") > -1) {
            compiledStyles = compileAndInsertReset(styleObj, key.split("$raw")[0]);
          } else {
            if (process.env.NODE_ENV !== "production") {
              (0, _validate.validate)(styleObj);
              styles[key] = Object.freeze(styleObj);
            }
            compiledStyles = compileAndInsertAtomic(styleObj);
          }
          staticStyleMap.set(styleObj, compiledStyles);
        }
      });
      return styles;
    }
    __name(create, "create");
    function compose(style1, style2) {
      if (process.env.NODE_ENV !== "production") {
        var len = arguments.length;
        if (len > 2) {
          var readableStyles = [...arguments].map((a) => flatten(a));
          throw new Error("StyleSheet.compose() only accepts 2 arguments, received " + len + ": " + JSON.stringify(readableStyles));
        }
      }
      return [style1, style2];
    }
    __name(compose, "compose");
    function flatten() {
      for (var _len = arguments.length, styles = new Array(_len), _key = 0; _key < _len; _key++) {
        styles[_key] = arguments[_key];
      }
      var flatArray = styles.flat(Infinity);
      var result = {};
      for (var i = 0; i < flatArray.length; i++) {
        var style = flatArray[i];
        if (style != null && typeof style === "object") {
          Object.assign(result, style);
        }
      }
      return result;
    }
    __name(flatten, "flatten");
    function getSheet() {
      return {
        id: sheet.id,
        textContent: sheet.getTextContent()
      };
    }
    __name(getSheet, "getSheet");
    function StyleSheet(styles, options) {
      if (options === void 0) {
        options = {};
      }
      var isRTL = options.writingDirection === "rtl";
      var styleProps = customStyleq(styles, options);
      if (Array.isArray(styleProps) && styleProps[1] != null) {
        styleProps[1] = (0, _compiler.inline)(styleProps[1], isRTL);
      }
      return styleProps;
    }
    __name(StyleSheet, "StyleSheet");
    StyleSheet.absoluteFill = absoluteFill;
    StyleSheet.absoluteFillObject = absoluteFillObject;
    StyleSheet.create = create;
    StyleSheet.compose = compose;
    StyleSheet.flatten = flatten;
    StyleSheet.getSheet = getSheet;
    StyleSheet.hairlineWidth = 1;
    if (_canUseDom.default && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.resolveRNStyle = StyleSheet.flatten;
    }
    var stylesheet = StyleSheet;
    var _default = exports2.default = stylesheet;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/createDOMProps/index.js
var require_createDOMProps = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/createDOMProps/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _AccessibilityUtil = _interopRequireDefault(require_AccessibilityUtil());
    var _StyleSheet2 = _interopRequireDefault(require_StyleSheet());
    var _warnOnce = require_warnOnce();
    var _excluded = ["aria-activedescendant", "accessibilityActiveDescendant", "aria-atomic", "accessibilityAtomic", "aria-autocomplete", "accessibilityAutoComplete", "aria-busy", "accessibilityBusy", "aria-checked", "accessibilityChecked", "aria-colcount", "accessibilityColumnCount", "aria-colindex", "accessibilityColumnIndex", "aria-colspan", "accessibilityColumnSpan", "aria-controls", "accessibilityControls", "aria-current", "accessibilityCurrent", "aria-describedby", "accessibilityDescribedBy", "aria-details", "accessibilityDetails", "aria-disabled", "accessibilityDisabled", "aria-errormessage", "accessibilityErrorMessage", "aria-expanded", "accessibilityExpanded", "aria-flowto", "accessibilityFlowTo", "aria-haspopup", "accessibilityHasPopup", "aria-hidden", "accessibilityHidden", "aria-invalid", "accessibilityInvalid", "aria-keyshortcuts", "accessibilityKeyShortcuts", "aria-label", "accessibilityLabel", "aria-labelledby", "accessibilityLabelledBy", "aria-level", "accessibilityLevel", "aria-live", "accessibilityLiveRegion", "aria-modal", "accessibilityModal", "aria-multiline", "accessibilityMultiline", "aria-multiselectable", "accessibilityMultiSelectable", "aria-orientation", "accessibilityOrientation", "aria-owns", "accessibilityOwns", "aria-placeholder", "accessibilityPlaceholder", "aria-posinset", "accessibilityPosInSet", "aria-pressed", "accessibilityPressed", "aria-readonly", "accessibilityReadOnly", "aria-required", "accessibilityRequired", "role", "accessibilityRole", "aria-roledescription", "accessibilityRoleDescription", "aria-rowcount", "accessibilityRowCount", "aria-rowindex", "accessibilityRowIndex", "aria-rowspan", "accessibilityRowSpan", "aria-selected", "accessibilitySelected", "aria-setsize", "accessibilitySetSize", "aria-sort", "accessibilitySort", "aria-valuemax", "accessibilityValueMax", "aria-valuemin", "accessibilityValueMin", "aria-valuenow", "accessibilityValueNow", "aria-valuetext", "accessibilityValueText", "dataSet", "focusable", "id", "nativeID", "pointerEvents", "style", "tabIndex", "testID"];
    var emptyObject = {};
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var isArray = Array.isArray;
    var uppercasePattern = /[A-Z]/g;
    function toHyphenLower(match) {
      return "-" + match.toLowerCase();
    }
    __name(toHyphenLower, "toHyphenLower");
    function hyphenateString(str) {
      return str.replace(uppercasePattern, toHyphenLower);
    }
    __name(hyphenateString, "hyphenateString");
    function processIDRefList(idRefList) {
      return isArray(idRefList) ? idRefList.join(" ") : idRefList;
    }
    __name(processIDRefList, "processIDRefList");
    var pointerEventsStyles = _StyleSheet2.default.create({
      auto: {
        pointerEvents: "auto"
      },
      "box-none": {
        pointerEvents: "box-none"
      },
      "box-only": {
        pointerEvents: "box-only"
      },
      none: {
        pointerEvents: "none"
      }
    });
    var createDOMProps = /* @__PURE__ */ __name((elementType, props, options) => {
      if (!props) {
        props = emptyObject;
      }
      var _props = props, ariaActiveDescendant = _props["aria-activedescendant"], accessibilityActiveDescendant = _props.accessibilityActiveDescendant, ariaAtomic = _props["aria-atomic"], accessibilityAtomic = _props.accessibilityAtomic, ariaAutoComplete = _props["aria-autocomplete"], accessibilityAutoComplete = _props.accessibilityAutoComplete, ariaBusy = _props["aria-busy"], accessibilityBusy = _props.accessibilityBusy, ariaChecked = _props["aria-checked"], accessibilityChecked = _props.accessibilityChecked, ariaColumnCount = _props["aria-colcount"], accessibilityColumnCount = _props.accessibilityColumnCount, ariaColumnIndex = _props["aria-colindex"], accessibilityColumnIndex = _props.accessibilityColumnIndex, ariaColumnSpan = _props["aria-colspan"], accessibilityColumnSpan = _props.accessibilityColumnSpan, ariaControls = _props["aria-controls"], accessibilityControls = _props.accessibilityControls, ariaCurrent = _props["aria-current"], accessibilityCurrent = _props.accessibilityCurrent, ariaDescribedBy = _props["aria-describedby"], accessibilityDescribedBy = _props.accessibilityDescribedBy, ariaDetails = _props["aria-details"], accessibilityDetails = _props.accessibilityDetails, ariaDisabled = _props["aria-disabled"], accessibilityDisabled = _props.accessibilityDisabled, ariaErrorMessage = _props["aria-errormessage"], accessibilityErrorMessage = _props.accessibilityErrorMessage, ariaExpanded = _props["aria-expanded"], accessibilityExpanded = _props.accessibilityExpanded, ariaFlowTo = _props["aria-flowto"], accessibilityFlowTo = _props.accessibilityFlowTo, ariaHasPopup = _props["aria-haspopup"], accessibilityHasPopup = _props.accessibilityHasPopup, ariaHidden = _props["aria-hidden"], accessibilityHidden = _props.accessibilityHidden, ariaInvalid = _props["aria-invalid"], accessibilityInvalid = _props.accessibilityInvalid, ariaKeyShortcuts = _props["aria-keyshortcuts"], accessibilityKeyShortcuts = _props.accessibilityKeyShortcuts, ariaLabel = _props["aria-label"], accessibilityLabel = _props.accessibilityLabel, ariaLabelledBy = _props["aria-labelledby"], accessibilityLabelledBy = _props.accessibilityLabelledBy, ariaLevel = _props["aria-level"], accessibilityLevel = _props.accessibilityLevel, ariaLive = _props["aria-live"], accessibilityLiveRegion = _props.accessibilityLiveRegion, ariaModal = _props["aria-modal"], accessibilityModal = _props.accessibilityModal, ariaMultiline = _props["aria-multiline"], accessibilityMultiline = _props.accessibilityMultiline, ariaMultiSelectable = _props["aria-multiselectable"], accessibilityMultiSelectable = _props.accessibilityMultiSelectable, ariaOrientation = _props["aria-orientation"], accessibilityOrientation = _props.accessibilityOrientation, ariaOwns = _props["aria-owns"], accessibilityOwns = _props.accessibilityOwns, ariaPlaceholder = _props["aria-placeholder"], accessibilityPlaceholder = _props.accessibilityPlaceholder, ariaPosInSet = _props["aria-posinset"], accessibilityPosInSet = _props.accessibilityPosInSet, ariaPressed = _props["aria-pressed"], accessibilityPressed = _props.accessibilityPressed, ariaReadOnly = _props["aria-readonly"], accessibilityReadOnly = _props.accessibilityReadOnly, ariaRequired = _props["aria-required"], accessibilityRequired = _props.accessibilityRequired, ariaRole = _props.role, accessibilityRole = _props.accessibilityRole, ariaRoleDescription = _props["aria-roledescription"], accessibilityRoleDescription = _props.accessibilityRoleDescription, ariaRowCount = _props["aria-rowcount"], accessibilityRowCount = _props.accessibilityRowCount, ariaRowIndex = _props["aria-rowindex"], accessibilityRowIndex = _props.accessibilityRowIndex, ariaRowSpan = _props["aria-rowspan"], accessibilityRowSpan = _props.accessibilityRowSpan, ariaSelected = _props["aria-selected"], accessibilitySelected = _props.accessibilitySelected, ariaSetSize = _props["aria-setsize"], accessibilitySetSize = _props.accessibilitySetSize, ariaSort = _props["aria-sort"], accessibilitySort = _props.accessibilitySort, ariaValueMax = _props["aria-valuemax"], accessibilityValueMax = _props.accessibilityValueMax, ariaValueMin = _props["aria-valuemin"], accessibilityValueMin = _props.accessibilityValueMin, ariaValueNow = _props["aria-valuenow"], accessibilityValueNow = _props.accessibilityValueNow, ariaValueText = _props["aria-valuetext"], accessibilityValueText = _props.accessibilityValueText, dataSet = _props.dataSet, focusable = _props.focusable, id = _props.id, nativeID = _props.nativeID, pointerEvents = _props.pointerEvents, style = _props.style, tabIndex = _props.tabIndex, testID = _props.testID, domProps = (0, _objectWithoutPropertiesLoose2.default)(_props, _excluded);
      var disabled = ariaDisabled || accessibilityDisabled;
      var role = _AccessibilityUtil.default.propsToAriaRole(props);
      var _ariaActiveDescendant = ariaActiveDescendant != null ? ariaActiveDescendant : accessibilityActiveDescendant;
      if (_ariaActiveDescendant != null) {
        domProps["aria-activedescendant"] = _ariaActiveDescendant;
      }
      var _ariaAtomic = ariaAtomic != null ? ariaActiveDescendant : accessibilityAtomic;
      if (_ariaAtomic != null) {
        domProps["aria-atomic"] = _ariaAtomic;
      }
      var _ariaAutoComplete = ariaAutoComplete != null ? ariaAutoComplete : accessibilityAutoComplete;
      if (_ariaAutoComplete != null) {
        domProps["aria-autocomplete"] = _ariaAutoComplete;
      }
      var _ariaBusy = ariaBusy != null ? ariaBusy : accessibilityBusy;
      if (_ariaBusy != null) {
        domProps["aria-busy"] = _ariaBusy;
      }
      var _ariaChecked = ariaChecked != null ? ariaChecked : accessibilityChecked;
      if (_ariaChecked != null) {
        domProps["aria-checked"] = _ariaChecked;
      }
      var _ariaColumnCount = ariaColumnCount != null ? ariaColumnCount : accessibilityColumnCount;
      if (_ariaColumnCount != null) {
        domProps["aria-colcount"] = _ariaColumnCount;
      }
      var _ariaColumnIndex = ariaColumnIndex != null ? ariaColumnIndex : accessibilityColumnIndex;
      if (_ariaColumnIndex != null) {
        domProps["aria-colindex"] = _ariaColumnIndex;
      }
      var _ariaColumnSpan = ariaColumnSpan != null ? ariaColumnSpan : accessibilityColumnSpan;
      if (_ariaColumnSpan != null) {
        domProps["aria-colspan"] = _ariaColumnSpan;
      }
      var _ariaControls = ariaControls != null ? ariaControls : accessibilityControls;
      if (_ariaControls != null) {
        domProps["aria-controls"] = processIDRefList(_ariaControls);
      }
      var _ariaCurrent = ariaCurrent != null ? ariaCurrent : accessibilityCurrent;
      if (_ariaCurrent != null) {
        domProps["aria-current"] = _ariaCurrent;
      }
      var _ariaDescribedBy = ariaDescribedBy != null ? ariaDescribedBy : accessibilityDescribedBy;
      if (_ariaDescribedBy != null) {
        domProps["aria-describedby"] = processIDRefList(_ariaDescribedBy);
      }
      var _ariaDetails = ariaDetails != null ? ariaDetails : accessibilityDetails;
      if (_ariaDetails != null) {
        domProps["aria-details"] = _ariaDetails;
      }
      if (disabled === true) {
        domProps["aria-disabled"] = true;
        if (elementType === "button" || elementType === "form" || elementType === "input" || elementType === "select" || elementType === "textarea") {
          domProps.disabled = true;
        }
      }
      var _ariaErrorMessage = ariaErrorMessage != null ? ariaErrorMessage : accessibilityErrorMessage;
      if (_ariaErrorMessage != null) {
        domProps["aria-errormessage"] = _ariaErrorMessage;
      }
      var _ariaExpanded = ariaExpanded != null ? ariaExpanded : accessibilityExpanded;
      if (_ariaExpanded != null) {
        domProps["aria-expanded"] = _ariaExpanded;
      }
      var _ariaFlowTo = ariaFlowTo != null ? ariaFlowTo : accessibilityFlowTo;
      if (_ariaFlowTo != null) {
        domProps["aria-flowto"] = processIDRefList(_ariaFlowTo);
      }
      var _ariaHasPopup = ariaHasPopup != null ? ariaHasPopup : accessibilityHasPopup;
      if (_ariaHasPopup != null) {
        domProps["aria-haspopup"] = _ariaHasPopup;
      }
      var _ariaHidden = ariaHidden != null ? ariaHidden : accessibilityHidden;
      if (_ariaHidden === true) {
        domProps["aria-hidden"] = _ariaHidden;
      }
      var _ariaInvalid = ariaInvalid != null ? ariaInvalid : accessibilityInvalid;
      if (_ariaInvalid != null) {
        domProps["aria-invalid"] = _ariaInvalid;
      }
      var _ariaKeyShortcuts = ariaKeyShortcuts != null ? ariaKeyShortcuts : accessibilityKeyShortcuts;
      if (_ariaKeyShortcuts != null) {
        domProps["aria-keyshortcuts"] = processIDRefList(_ariaKeyShortcuts);
      }
      var _ariaLabel = ariaLabel != null ? ariaLabel : accessibilityLabel;
      if (_ariaLabel != null) {
        domProps["aria-label"] = _ariaLabel;
      }
      var _ariaLabelledBy = ariaLabelledBy != null ? ariaLabelledBy : accessibilityLabelledBy;
      if (_ariaLabelledBy != null) {
        domProps["aria-labelledby"] = processIDRefList(_ariaLabelledBy);
      }
      var _ariaLevel = ariaLevel != null ? ariaLevel : accessibilityLevel;
      if (_ariaLevel != null) {
        domProps["aria-level"] = _ariaLevel;
      }
      var _ariaLive = ariaLive != null ? ariaLive : accessibilityLiveRegion;
      if (_ariaLive != null) {
        domProps["aria-live"] = _ariaLive === "none" ? "off" : _ariaLive;
      }
      var _ariaModal = ariaModal != null ? ariaModal : accessibilityModal;
      if (_ariaModal != null) {
        domProps["aria-modal"] = _ariaModal;
      }
      var _ariaMultiline = ariaMultiline != null ? ariaMultiline : accessibilityMultiline;
      if (_ariaMultiline != null) {
        domProps["aria-multiline"] = _ariaMultiline;
      }
      var _ariaMultiSelectable = ariaMultiSelectable != null ? ariaMultiSelectable : accessibilityMultiSelectable;
      if (_ariaMultiSelectable != null) {
        domProps["aria-multiselectable"] = _ariaMultiSelectable;
      }
      var _ariaOrientation = ariaOrientation != null ? ariaOrientation : accessibilityOrientation;
      if (_ariaOrientation != null) {
        domProps["aria-orientation"] = _ariaOrientation;
      }
      var _ariaOwns = ariaOwns != null ? ariaOwns : accessibilityOwns;
      if (_ariaOwns != null) {
        domProps["aria-owns"] = processIDRefList(_ariaOwns);
      }
      var _ariaPlaceholder = ariaPlaceholder != null ? ariaPlaceholder : accessibilityPlaceholder;
      if (_ariaPlaceholder != null) {
        domProps["aria-placeholder"] = _ariaPlaceholder;
      }
      var _ariaPosInSet = ariaPosInSet != null ? ariaPosInSet : accessibilityPosInSet;
      if (_ariaPosInSet != null) {
        domProps["aria-posinset"] = _ariaPosInSet;
      }
      var _ariaPressed = ariaPressed != null ? ariaPressed : accessibilityPressed;
      if (_ariaPressed != null) {
        domProps["aria-pressed"] = _ariaPressed;
      }
      var _ariaReadOnly = ariaReadOnly != null ? ariaReadOnly : accessibilityReadOnly;
      if (_ariaReadOnly != null) {
        domProps["aria-readonly"] = _ariaReadOnly;
        if (elementType === "input" || elementType === "select" || elementType === "textarea") {
          domProps.readOnly = true;
        }
      }
      var _ariaRequired = ariaRequired != null ? ariaRequired : accessibilityRequired;
      if (_ariaRequired != null) {
        domProps["aria-required"] = _ariaRequired;
        if (elementType === "input" || elementType === "select" || elementType === "textarea") {
          domProps.required = accessibilityRequired;
        }
      }
      if (role != null) {
        domProps["role"] = role === "none" ? "presentation" : role;
      }
      var _ariaRoleDescription = ariaRoleDescription != null ? ariaRoleDescription : accessibilityRoleDescription;
      if (_ariaRoleDescription != null) {
        domProps["aria-roledescription"] = _ariaRoleDescription;
      }
      var _ariaRowCount = ariaRowCount != null ? ariaRowCount : accessibilityRowCount;
      if (_ariaRowCount != null) {
        domProps["aria-rowcount"] = _ariaRowCount;
      }
      var _ariaRowIndex = ariaRowIndex != null ? ariaRowIndex : accessibilityRowIndex;
      if (_ariaRowIndex != null) {
        domProps["aria-rowindex"] = _ariaRowIndex;
      }
      var _ariaRowSpan = ariaRowSpan != null ? ariaRowSpan : accessibilityRowSpan;
      if (_ariaRowSpan != null) {
        domProps["aria-rowspan"] = _ariaRowSpan;
      }
      var _ariaSelected = ariaSelected != null ? ariaSelected : accessibilitySelected;
      if (_ariaSelected != null) {
        domProps["aria-selected"] = _ariaSelected;
      }
      var _ariaSetSize = ariaSetSize != null ? ariaSetSize : accessibilitySetSize;
      if (_ariaSetSize != null) {
        domProps["aria-setsize"] = _ariaSetSize;
      }
      var _ariaSort = ariaSort != null ? ariaSort : accessibilitySort;
      if (_ariaSort != null) {
        domProps["aria-sort"] = _ariaSort;
      }
      var _ariaValueMax = ariaValueMax != null ? ariaValueMax : accessibilityValueMax;
      if (_ariaValueMax != null) {
        domProps["aria-valuemax"] = _ariaValueMax;
      }
      var _ariaValueMin = ariaValueMin != null ? ariaValueMin : accessibilityValueMin;
      if (_ariaValueMin != null) {
        domProps["aria-valuemin"] = _ariaValueMin;
      }
      var _ariaValueNow = ariaValueNow != null ? ariaValueNow : accessibilityValueNow;
      if (_ariaValueNow != null) {
        domProps["aria-valuenow"] = _ariaValueNow;
      }
      var _ariaValueText = ariaValueText != null ? ariaValueText : accessibilityValueText;
      if (_ariaValueText != null) {
        domProps["aria-valuetext"] = _ariaValueText;
      }
      if (dataSet != null) {
        for (var dataProp in dataSet) {
          if (hasOwnProperty.call(dataSet, dataProp)) {
            var dataName = hyphenateString(dataProp);
            var dataValue = dataSet[dataProp];
            if (dataValue != null) {
              domProps["data-" + dataName] = dataValue;
            }
          }
        }
      }
      if (tabIndex === 0 || tabIndex === "0" || tabIndex === -1 || tabIndex === "-1") {
        domProps.tabIndex = tabIndex;
      } else {
        if (focusable === false) {
          domProps.tabIndex = "-1";
        }
        if (
          // These native elements are keyboard focusable by default
          elementType === "a" || elementType === "button" || elementType === "input" || elementType === "select" || elementType === "textarea"
        ) {
          if (focusable === false || accessibilityDisabled === true) {
            domProps.tabIndex = "-1";
          }
        } else if (
          // These roles are made keyboard focusable by default
          role === "button" || role === "checkbox" || role === "link" || role === "radio" || role === "textbox" || role === "switch"
        ) {
          if (focusable !== false) {
            domProps.tabIndex = "0";
          }
        } else {
          if (focusable === true) {
            domProps.tabIndex = "0";
          }
        }
      }
      if (pointerEvents != null) {
        (0, _warnOnce.warnOnce)("pointerEvents", "props.pointerEvents is deprecated. Use style.pointerEvents");
      }
      var _StyleSheet = (0, _StyleSheet2.default)([style, pointerEvents && pointerEventsStyles[pointerEvents]], (0, _objectSpread2.default)({
        writingDirection: "ltr"
      }, options)), className = _StyleSheet[0], inlineStyle = _StyleSheet[1];
      if (className) {
        domProps.className = className;
      }
      if (inlineStyle) {
        domProps.style = inlineStyle;
      }
      var _id = id != null ? id : nativeID;
      if (_id != null) {
        domProps.id = _id;
      }
      if (testID != null) {
        domProps["data-testid"] = testID;
      }
      if (domProps.type == null && elementType === "button") {
        domProps.type = "button";
      }
      return domProps;
    }, "createDOMProps");
    var _default = exports2.default = createDOMProps;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/@babel/runtime/helpers/interopRequireWildcard.js
var require_interopRequireWildcard = __commonJS({
  "../../node_modules/@babel/runtime/helpers/interopRequireWildcard.js"(exports2, module2) {
    var _typeof = require_typeof()["default"];
    function _interopRequireWildcard(e, t) {
      if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
      return (module2.exports = _interopRequireWildcard = /* @__PURE__ */ __name(function _interopRequireWildcard2(e2, t2) {
        if (!t2 && e2 && e2.__esModule) return e2;
        var o, i, f = {
          __proto__: null,
          "default": e2
        };
        if (null === e2 || "object" != _typeof(e2) && "function" != typeof e2) return f;
        if (o = t2 ? n : r) {
          if (o.has(e2)) return o.get(e2);
          o.set(e2, f);
        }
        for (var _t in e2) "default" !== _t && {}.hasOwnProperty.call(e2, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e2, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e2[_t]);
        return f;
      }, "_interopRequireWildcard"), module2.exports.__esModule = true, module2.exports["default"] = module2.exports)(e, t);
    }
    __name(_interopRequireWildcard, "_interopRequireWildcard");
    module2.exports = _interopRequireWildcard, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useLocale/isLocaleRTL.js
var require_isLocaleRTL = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useLocale/isLocaleRTL.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.isLocaleRTL = isLocaleRTL;
    var rtlScripts = /* @__PURE__ */ new Set(["Arab", "Syrc", "Samr", "Mand", "Thaa", "Mend", "Nkoo", "Adlm", "Rohg", "Hebr"]);
    var rtlLangs = /* @__PURE__ */ new Set([
      "ae",
      // Avestan
      "ar",
      // Arabic
      "arc",
      // Aramaic
      "bcc",
      // Southern Balochi
      "bqi",
      // Bakthiari
      "ckb",
      // Sorani
      "dv",
      // Dhivehi
      "fa",
      "far",
      // Persian
      "glk",
      // Gilaki
      "he",
      "iw",
      // Hebrew
      "khw",
      // Khowar
      "ks",
      // Kashmiri
      "ku",
      // Kurdish
      "mzn",
      // Mazanderani
      "nqo",
      // N'Ko
      "pnb",
      // Western Punjabi
      "ps",
      // Pashto
      "sd",
      // Sindhi
      "ug",
      // Uyghur
      "ur",
      // Urdu
      "yi"
      // Yiddish
    ]);
    var cache2 = /* @__PURE__ */ new Map();
    function isLocaleRTL(locale) {
      var cachedRTL = cache2.get(locale);
      if (cachedRTL) {
        return cachedRTL;
      }
      var isRTL = false;
      if (Intl.Locale) {
        try {
          var script = new Intl.Locale(locale).maximize().script;
          isRTL = rtlScripts.has(script);
        } catch (_unused) {
          var lang = locale.split("-")[0];
          isRTL = rtlLangs.has(lang);
        }
      } else {
        var _lang = locale.split("-")[0];
        isRTL = rtlLangs.has(_lang);
      }
      cache2.set(locale, isRTL);
      return isRTL;
    }
    __name(isLocaleRTL, "isLocaleRTL");
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useLocale/index.js
var require_useLocale = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useLocale/index.js"(exports2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.LocaleProvider = LocaleProvider;
    exports2.getLocaleDirection = getLocaleDirection;
    exports2.useLocaleContext = useLocaleContext;
    var _react = _interopRequireWildcard(require("react"));
    var _isLocaleRTL = require_isLocaleRTL();
    var defaultLocale = {
      direction: "ltr",
      locale: "en-US"
    };
    var LocaleContext = /* @__PURE__ */ (0, _react.createContext)(defaultLocale);
    function getLocaleDirection(locale) {
      return (0, _isLocaleRTL.isLocaleRTL)(locale) ? "rtl" : "ltr";
    }
    __name(getLocaleDirection, "getLocaleDirection");
    function LocaleProvider(props) {
      var direction = props.direction, locale = props.locale, children = props.children;
      var needsContext = direction || locale;
      return needsContext ? /* @__PURE__ */ _react.default.createElement(LocaleContext.Provider, {
        children,
        value: {
          direction: locale ? getLocaleDirection(locale) : direction,
          locale
        }
      }) : children;
    }
    __name(LocaleProvider, "LocaleProvider");
    function useLocaleContext() {
      return (0, _react.useContext)(LocaleContext);
    }
    __name(useLocaleContext, "useLocaleContext");
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/createElement/index.js
var require_createElement = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/createElement/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AccessibilityUtil = _interopRequireDefault(require_AccessibilityUtil());
    var _createDOMProps = _interopRequireDefault(require_createDOMProps());
    var _react = _interopRequireDefault(require("react"));
    var _useLocale = require_useLocale();
    var createElement = /* @__PURE__ */ __name((component, props, options) => {
      var accessibilityComponent;
      if (component && component.constructor === String) {
        accessibilityComponent = _AccessibilityUtil.default.propsToAccessibilityComponent(props);
      }
      var Component = accessibilityComponent || component;
      var domProps = (0, _createDOMProps.default)(Component, props, options);
      var element = /* @__PURE__ */ _react.default.createElement(Component, domProps);
      var elementWithLocaleProvider = domProps.dir ? /* @__PURE__ */ _react.default.createElement(_useLocale.LocaleProvider, {
        children: element,
        direction: domProps.dir,
        locale: domProps.lang
      }) : element;
      return elementWithLocaleProvider;
    }, "createElement");
    var _default = exports2.default = createElement;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/findNodeHandle/index.js
var require_findNodeHandle = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/findNodeHandle/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var findNodeHandle = /* @__PURE__ */ __name((component) => {
      throw new Error("findNodeHandle is not supported on web. Use the ref property on the component instead.");
    }, "findNodeHandle");
    var _default = exports2.default = findNodeHandle;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/render/index.js
var require_render = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/render/index.js"(exports2) {
    "use strict";
    "use client";
    exports2.__esModule = true;
    exports2.default = render;
    exports2.hydrate = hydrate;
    var _client = require("react-dom/client");
    var _dom = require_dom();
    function hydrate(element, root) {
      (0, _dom.createSheet)(root);
      return (0, _client.hydrateRoot)(root, element);
    }
    __name(hydrate, "hydrate");
    function render(element, root) {
      (0, _dom.createSheet)(root);
      var reactRoot = (0, _client.createRoot)(root);
      reactRoot.render(element);
      return reactRoot;
    }
    __name(render, "render");
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/unmountComponentAtNode/index.js
var require_unmountComponentAtNode = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/unmountComponentAtNode/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = unmountComponentAtNode;
    function unmountComponentAtNode(rootTag) {
      rootTag.unmount();
      return true;
    }
    __name(unmountComponentAtNode, "unmountComponentAtNode");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/getBoundingClientRect/index.js
var require_getBoundingClientRect = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/getBoundingClientRect/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var getBoundingClientRect = /* @__PURE__ */ __name((node) => {
      if (node != null) {
        var isElement = node.nodeType === 1;
        if (isElement && typeof node.getBoundingClientRect === "function") {
          return node.getBoundingClientRect();
        }
      }
    }, "getBoundingClientRect");
    var _default = exports2.default = getBoundingClientRect;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/unitlessNumbers/index.js
var require_unitlessNumbers2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/unitlessNumbers/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var unitlessNumbers = {
      animationIterationCount: true,
      aspectRatio: true,
      borderImageOutset: true,
      borderImageSlice: true,
      borderImageWidth: true,
      boxFlex: true,
      boxFlexGroup: true,
      boxOrdinalGroup: true,
      columnCount: true,
      flex: true,
      flexGrow: true,
      flexOrder: true,
      flexPositive: true,
      flexShrink: true,
      flexNegative: true,
      fontWeight: true,
      gridRow: true,
      gridRowEnd: true,
      gridRowGap: true,
      gridRowStart: true,
      gridColumn: true,
      gridColumnEnd: true,
      gridColumnGap: true,
      gridColumnStart: true,
      lineClamp: true,
      opacity: true,
      order: true,
      orphans: true,
      tabSize: true,
      widows: true,
      zIndex: true,
      zoom: true,
      // SVG-related
      fillOpacity: true,
      floodOpacity: true,
      stopOpacity: true,
      strokeDasharray: true,
      strokeDashoffset: true,
      strokeMiterlimit: true,
      strokeOpacity: true,
      strokeWidth: true,
      // transform types
      scale: true,
      scaleX: true,
      scaleY: true,
      scaleZ: true,
      // RN properties
      shadowOpacity: true
    };
    var prefixes = ["ms", "Moz", "O", "Webkit"];
    var prefixKey = /* @__PURE__ */ __name((prefix, key) => {
      return prefix + key.charAt(0).toUpperCase() + key.substring(1);
    }, "prefixKey");
    Object.keys(unitlessNumbers).forEach((prop) => {
      prefixes.forEach((prefix) => {
        unitlessNumbers[prefixKey(prefix, prop)] = unitlessNumbers[prop];
      });
    });
    var _default = exports2.default = unitlessNumbers;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/setValueForStyles/dangerousStyleValue.js
var require_dangerousStyleValue = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/setValueForStyles/dangerousStyleValue.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _unitlessNumbers = _interopRequireDefault(require_unitlessNumbers2());
    function dangerousStyleValue(name, value, isCustomProperty) {
      var isEmpty = value == null || typeof value === "boolean" || value === "";
      if (isEmpty) {
        return "";
      }
      if (!isCustomProperty && typeof value === "number" && value !== 0 && !(_unitlessNumbers.default.hasOwnProperty(name) && _unitlessNumbers.default[name])) {
        return value + "px";
      }
      return ("" + value).trim();
    }
    __name(dangerousStyleValue, "dangerousStyleValue");
    var _default = exports2.default = dangerousStyleValue;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/setValueForStyles/index.js
var require_setValueForStyles = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/setValueForStyles/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _dangerousStyleValue = _interopRequireDefault(require_dangerousStyleValue());
    function setValueForStyles(node, styles) {
      var style = node.style;
      for (var styleName in styles) {
        if (!styles.hasOwnProperty(styleName)) {
          continue;
        }
        var isCustomProperty = styleName.indexOf("--") === 0;
        var styleValue = (0, _dangerousStyleValue.default)(styleName, styles[styleName], isCustomProperty);
        if (styleName === "float") {
          styleName = "cssFloat";
        }
        if (isCustomProperty) {
          style.setProperty(styleName, styleValue);
        } else {
          style[styleName] = styleValue;
        }
      }
    }
    __name(setValueForStyles, "setValueForStyles");
    var _default = exports2.default = setValueForStyles;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/UIManager/index.js
var require_UIManager = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/UIManager/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _getBoundingClientRect = _interopRequireDefault(require_getBoundingClientRect());
    var _setValueForStyles = _interopRequireDefault(require_setValueForStyles());
    var getRect = /* @__PURE__ */ __name((node) => {
      var height = node.offsetHeight;
      var width = node.offsetWidth;
      var left = node.offsetLeft;
      var top = node.offsetTop;
      node = node.offsetParent;
      while (node && node.nodeType === 1) {
        left += node.offsetLeft + node.clientLeft - node.scrollLeft;
        top += node.offsetTop + node.clientTop - node.scrollTop;
        node = node.offsetParent;
      }
      top -= window.scrollY;
      left -= window.scrollX;
      return {
        width,
        height,
        top,
        left
      };
    }, "getRect");
    var measureLayout = /* @__PURE__ */ __name((node, relativeToNativeNode, callback) => {
      var relativeNode = relativeToNativeNode || node && node.parentNode;
      if (node && relativeNode) {
        setTimeout(() => {
          if (node.isConnected && relativeNode.isConnected) {
            var relativeRect = getRect(relativeNode);
            var _getRect = getRect(node), height = _getRect.height, left = _getRect.left, top = _getRect.top, width = _getRect.width;
            var x = left - relativeRect.left;
            var y = top - relativeRect.top;
            callback(x, y, width, height, left, top);
          }
        }, 0);
      }
    }, "measureLayout");
    var elementsToIgnore = {
      A: true,
      BODY: true,
      INPUT: true,
      SELECT: true,
      TEXTAREA: true
    };
    var UIManager = {
      blur(node) {
        try {
          node.blur();
        } catch (err) {
        }
      },
      focus(node) {
        try {
          var name = node.nodeName;
          if (node.getAttribute("tabIndex") == null && node.isContentEditable !== true && elementsToIgnore[name] == null) {
            node.setAttribute("tabIndex", "-1");
          }
          node.focus();
        } catch (err) {
        }
      },
      measure(node, callback) {
        measureLayout(node, null, callback);
      },
      measureInWindow(node, callback) {
        if (node) {
          setTimeout(() => {
            var _getBoundingClientRec = (0, _getBoundingClientRect.default)(node), height = _getBoundingClientRec.height, left = _getBoundingClientRec.left, top = _getBoundingClientRec.top, width = _getBoundingClientRec.width;
            callback(left, top, width, height);
          }, 0);
        }
      },
      measureLayout(node, relativeToNativeNode, onFail, onSuccess) {
        measureLayout(node, relativeToNativeNode, onSuccess);
      },
      updateView(node, props) {
        for (var prop in props) {
          if (!Object.prototype.hasOwnProperty.call(props, prop)) {
            continue;
          }
          var value = props[prop];
          switch (prop) {
            case "style": {
              (0, _setValueForStyles.default)(node, value);
              break;
            }
            case "class":
            case "className": {
              node.setAttribute("class", value);
              break;
            }
            case "text":
            case "value":
              node.value = value;
              break;
            default:
              node.setAttribute(prop, value);
          }
        }
      },
      configureNextLayoutAnimation(config, onAnimationDidEnd) {
        onAnimationDidEnd();
      },
      // mocks
      setLayoutAnimationEnabledExperimental() {
      }
    };
    var _default = exports2.default = UIManager;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/NativeModules/index.js
var require_NativeModules = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/NativeModules/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _UIManager = _interopRequireDefault(require_UIManager());
    var NativeModules = {
      UIManager: _UIManager.default
    };
    var _default = exports2.default = NativeModules;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/AccessibilityInfo/index.js
var require_AccessibilityInfo = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/AccessibilityInfo/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    function isScreenReaderEnabled() {
      return new Promise((resolve, reject) => {
        resolve(true);
      });
    }
    __name(isScreenReaderEnabled, "isScreenReaderEnabled");
    var prefersReducedMotionMedia = _canUseDom.default && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    function isReduceMotionEnabled() {
      return new Promise((resolve, reject) => {
        resolve(prefersReducedMotionMedia ? prefersReducedMotionMedia.matches : true);
      });
    }
    __name(isReduceMotionEnabled, "isReduceMotionEnabled");
    function addChangeListener(fn) {
      if (prefersReducedMotionMedia != null) {
        prefersReducedMotionMedia.addEventListener != null ? prefersReducedMotionMedia.addEventListener("change", fn) : prefersReducedMotionMedia.addListener(fn);
      }
    }
    __name(addChangeListener, "addChangeListener");
    function removeChangeListener(fn) {
      if (prefersReducedMotionMedia != null) {
        prefersReducedMotionMedia.removeEventListener != null ? prefersReducedMotionMedia.removeEventListener("change", fn) : prefersReducedMotionMedia.removeListener(fn);
      }
    }
    __name(removeChangeListener, "removeChangeListener");
    var handlers = {};
    var AccessibilityInfo = {
      /**
       * Query whether a screen reader is currently enabled.
       *
       * Returns a promise which resolves to a boolean.
       * The result is `true` when a screen reader is enabled and `false` otherwise.
       */
      isScreenReaderEnabled,
      /**
       * Query whether the user prefers reduced motion.
       *
       * Returns a promise which resolves to a boolean.
       * The result is `true` when a screen reader is enabled and `false` otherwise.
       */
      isReduceMotionEnabled,
      /**
       * Deprecated
       */
      fetch: isScreenReaderEnabled,
      /**
       * Add an event handler. Supported events: reduceMotionChanged
       */
      addEventListener: /* @__PURE__ */ __name(function addEventListener(eventName, handler) {
        if (eventName === "reduceMotionChanged") {
          if (!prefersReducedMotionMedia) {
            return;
          }
          var listener = /* @__PURE__ */ __name((event) => {
            handler(event.matches);
          }, "listener");
          addChangeListener(listener);
          handlers[handler] = listener;
        }
        return {
          remove: /* @__PURE__ */ __name(() => AccessibilityInfo.removeEventListener(eventName, handler), "remove")
        };
      }, "addEventListener"),
      /**
       * Set accessibility focus to a react component.
       */
      setAccessibilityFocus: /* @__PURE__ */ __name(function setAccessibilityFocus(reactTag) {
      }, "setAccessibilityFocus"),
      /**
       * Post a string to be announced by the screen reader.
       */
      announceForAccessibility: /* @__PURE__ */ __name(function announceForAccessibility(announcement) {
      }, "announceForAccessibility"),
      /**
       * Remove an event handler.
       */
      removeEventListener: /* @__PURE__ */ __name(function removeEventListener(eventName, handler) {
        if (eventName === "reduceMotionChanged") {
          var listener = handlers[handler];
          if (!listener || !prefersReducedMotionMedia) {
            return;
          }
          removeChangeListener(listener);
        }
        return;
      }, "removeEventListener")
    };
    var _default = exports2.default = AccessibilityInfo;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Alert/index.js
var require_Alert = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Alert/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var Alert = class {
      static {
        __name(this, "Alert");
      }
      static alert() {
      }
    };
    var _default = exports2.default = Alert;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Platform/index.js
var require_Platform = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Platform/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var Platform2 = {
      OS: "web",
      select: /* @__PURE__ */ __name((obj) => "web" in obj ? obj.web : obj.default, "select"),
      get isTesting() {
        if (process.env.NODE_ENV === "test") {
          return true;
        }
        return false;
      },
      get Version() {
        return "0.0.0";
      }
    };
    var _default = exports2.default = Platform2;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/@babel/runtime/helpers/extends.js
var require_extends = __commonJS({
  "../../node_modules/@babel/runtime/helpers/extends.js"(exports2, module2) {
    function _extends() {
      return module2.exports = _extends = Object.assign ? Object.assign.bind() : function(n) {
        for (var e = 1; e < arguments.length; e++) {
          var t = arguments[e];
          for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
        }
        return n;
      }, module2.exports.__esModule = true, module2.exports["default"] = module2.exports, _extends.apply(null, arguments);
    }
    __name(_extends, "_extends");
    module2.exports = _extends, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/forwardedProps/index.js
var require_forwardedProps = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/forwardedProps/index.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.touchProps = exports2.styleProps = exports2.mouseProps = exports2.keyboardProps = exports2.focusProps = exports2.defaultProps = exports2.clickProps = exports2.accessibilityProps = void 0;
    var defaultProps = exports2.defaultProps = {
      children: true,
      dataSet: true,
      dir: true,
      id: true,
      ref: true,
      suppressHydrationWarning: true,
      tabIndex: true,
      testID: true,
      // @deprecated
      focusable: true,
      nativeID: true
    };
    var accessibilityProps = exports2.accessibilityProps = {
      "aria-activedescendant": true,
      "aria-atomic": true,
      "aria-autocomplete": true,
      "aria-busy": true,
      "aria-checked": true,
      "aria-colcount": true,
      "aria-colindex": true,
      "aria-colspan": true,
      "aria-controls": true,
      "aria-current": true,
      "aria-describedby": true,
      "aria-details": true,
      "aria-disabled": true,
      "aria-errormessage": true,
      "aria-expanded": true,
      "aria-flowto": true,
      "aria-haspopup": true,
      "aria-hidden": true,
      "aria-invalid": true,
      "aria-keyshortcuts": true,
      "aria-label": true,
      "aria-labelledby": true,
      "aria-level": true,
      "aria-live": true,
      "aria-modal": true,
      "aria-multiline": true,
      "aria-multiselectable": true,
      "aria-orientation": true,
      "aria-owns": true,
      "aria-placeholder": true,
      "aria-posinset": true,
      "aria-pressed": true,
      "aria-readonly": true,
      "aria-required": true,
      inert: true,
      role: true,
      "aria-roledescription": true,
      "aria-rowcount": true,
      "aria-rowindex": true,
      "aria-rowspan": true,
      "aria-selected": true,
      "aria-setsize": true,
      "aria-sort": true,
      "aria-valuemax": true,
      "aria-valuemin": true,
      "aria-valuenow": true,
      "aria-valuetext": true,
      // @deprecated
      accessibilityActiveDescendant: true,
      accessibilityAtomic: true,
      accessibilityAutoComplete: true,
      accessibilityBusy: true,
      accessibilityChecked: true,
      accessibilityColumnCount: true,
      accessibilityColumnIndex: true,
      accessibilityColumnSpan: true,
      accessibilityControls: true,
      accessibilityCurrent: true,
      accessibilityDescribedBy: true,
      accessibilityDetails: true,
      accessibilityDisabled: true,
      accessibilityErrorMessage: true,
      accessibilityExpanded: true,
      accessibilityFlowTo: true,
      accessibilityHasPopup: true,
      accessibilityHidden: true,
      accessibilityInvalid: true,
      accessibilityKeyShortcuts: true,
      accessibilityLabel: true,
      accessibilityLabelledBy: true,
      accessibilityLevel: true,
      accessibilityLiveRegion: true,
      accessibilityModal: true,
      accessibilityMultiline: true,
      accessibilityMultiSelectable: true,
      accessibilityOrientation: true,
      accessibilityOwns: true,
      accessibilityPlaceholder: true,
      accessibilityPosInSet: true,
      accessibilityPressed: true,
      accessibilityReadOnly: true,
      accessibilityRequired: true,
      accessibilityRole: true,
      accessibilityRoleDescription: true,
      accessibilityRowCount: true,
      accessibilityRowIndex: true,
      accessibilityRowSpan: true,
      accessibilitySelected: true,
      accessibilitySetSize: true,
      accessibilitySort: true,
      accessibilityValueMax: true,
      accessibilityValueMin: true,
      accessibilityValueNow: true,
      accessibilityValueText: true
    };
    var clickProps = exports2.clickProps = {
      onClick: true,
      onAuxClick: true,
      onContextMenu: true,
      onGotPointerCapture: true,
      onLostPointerCapture: true,
      onPointerCancel: true,
      onPointerDown: true,
      onPointerEnter: true,
      onPointerMove: true,
      onPointerLeave: true,
      onPointerOut: true,
      onPointerOver: true,
      onPointerUp: true
    };
    var focusProps = exports2.focusProps = {
      onBlur: true,
      onFocus: true
    };
    var keyboardProps = exports2.keyboardProps = {
      onKeyDown: true,
      onKeyDownCapture: true,
      onKeyUp: true,
      onKeyUpCapture: true
    };
    var mouseProps = exports2.mouseProps = {
      onMouseDown: true,
      onMouseEnter: true,
      onMouseLeave: true,
      onMouseMove: true,
      onMouseOver: true,
      onMouseOut: true,
      onMouseUp: true
    };
    var touchProps = exports2.touchProps = {
      onTouchCancel: true,
      onTouchCancelCapture: true,
      onTouchEnd: true,
      onTouchEndCapture: true,
      onTouchMove: true,
      onTouchMoveCapture: true,
      onTouchStart: true,
      onTouchStartCapture: true
    };
    var styleProps = exports2.styleProps = {
      style: true
    };
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/pick/index.js
var require_pick = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/pick/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = pick;
    function pick(obj, list) {
      var nextObj = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (list[key] === true) {
            nextObj[key] = obj[key];
          }
        }
      }
      return nextObj;
    }
    __name(pick, "pick");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useLayoutEffect/index.js
var require_useLayoutEffect = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useLayoutEffect/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _react = require("react");
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var useLayoutEffectImpl = _canUseDom.default ? _react.useLayoutEffect : _react.useEffect;
    var _default = exports2.default = useLayoutEffectImpl;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useElementLayout/index.js
var require_useElementLayout = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useElementLayout/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = useElementLayout;
    var _useLayoutEffect = _interopRequireDefault(require_useLayoutEffect());
    var _UIManager = _interopRequireDefault(require_UIManager());
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var DOM_LAYOUT_HANDLER_NAME = "__reactLayoutHandler";
    var didWarn = !_canUseDom.default;
    var resizeObserver = null;
    function getResizeObserver() {
      if (_canUseDom.default && typeof window.ResizeObserver !== "undefined") {
        if (resizeObserver == null) {
          resizeObserver = new window.ResizeObserver(function(entries) {
            entries.forEach((entry) => {
              var node = entry.target;
              var onLayout = node[DOM_LAYOUT_HANDLER_NAME];
              if (typeof onLayout === "function") {
                _UIManager.default.measure(node, (x, y, width, height, left, top) => {
                  var event = {
                    // $FlowFixMe
                    nativeEvent: {
                      layout: {
                        x,
                        y,
                        width,
                        height,
                        left,
                        top
                      }
                    },
                    timeStamp: Date.now()
                  };
                  Object.defineProperty(event.nativeEvent, "target", {
                    enumerable: true,
                    get: /* @__PURE__ */ __name(() => entry.target, "get")
                  });
                  onLayout(event);
                });
              }
            });
          });
        }
      } else if (!didWarn) {
        if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
          console.warn("onLayout relies on ResizeObserver which is not supported by your browser. Please include a polyfill, e.g., https://github.com/que-etc/resize-observer-polyfill.");
          didWarn = true;
        }
      }
      return resizeObserver;
    }
    __name(getResizeObserver, "getResizeObserver");
    function useElementLayout(ref, onLayout) {
      var observer = getResizeObserver();
      (0, _useLayoutEffect.default)(() => {
        var node = ref.current;
        if (node != null) {
          node[DOM_LAYOUT_HANDLER_NAME] = onLayout;
        }
      }, [ref, onLayout]);
      (0, _useLayoutEffect.default)(() => {
        var node = ref.current;
        if (node != null && observer != null) {
          if (typeof node[DOM_LAYOUT_HANDLER_NAME] === "function") {
            observer.observe(node);
          } else {
            observer.unobserve(node);
          }
        }
        return () => {
          if (node != null && observer != null) {
            observer.unobserve(node);
          }
        };
      }, [ref, observer]);
    }
    __name(useElementLayout, "useElementLayout");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/mergeRefs/index.js
var require_mergeRefs = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/mergeRefs/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = mergeRefs;
    var React24 = _interopRequireWildcard(require("react"));
    function mergeRefs() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return /* @__PURE__ */ __name(function forwardRef6(node) {
        args.forEach((ref) => {
          if (ref == null) {
            return;
          }
          if (typeof ref === "function") {
            ref(node);
            return;
          }
          if (typeof ref === "object") {
            ref.current = node;
            return;
          }
          console.error("mergeRefs cannot handle Refs of type boolean, number or string, received ref " + String(ref));
        });
      }, "forwardRef");
    }
    __name(mergeRefs, "mergeRefs");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useMergeRefs/index.js
var require_useMergeRefs = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useMergeRefs/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = useMergeRefs;
    var React24 = _interopRequireWildcard(require("react"));
    var _mergeRefs = _interopRequireDefault(require_mergeRefs());
    function useMergeRefs() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      return React24.useMemo(
        () => (0, _mergeRefs.default)(...args),
        // eslint-disable-next-line
        [...args]
      );
    }
    __name(useMergeRefs, "useMergeRefs");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useStable/index.js
var require_useStable = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useStable/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = useStable;
    var React24 = _interopRequireWildcard(require("react"));
    var UNINITIALIZED = typeof Symbol === "function" && typeof Symbol() === "symbol" ? Symbol() : Object.freeze({});
    function useStable(getInitialValue) {
      var ref = React24.useRef(UNINITIALIZED);
      if (ref.current === UNINITIALIZED) {
        ref.current = getInitialValue();
      }
      return ref.current;
    }
    __name(useStable, "useStable");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/usePlatformMethods/index.js
var require_usePlatformMethods = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/usePlatformMethods/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = usePlatformMethods;
    var _UIManager = _interopRequireDefault(require_UIManager());
    var _useStable = _interopRequireDefault(require_useStable());
    function usePlatformMethods(_ref) {
      var pointerEvents = _ref.pointerEvents, style = _ref.style;
      var ref = (0, _useStable.default)(() => (hostNode) => {
        if (hostNode != null) {
          hostNode.measure = (callback) => _UIManager.default.measure(hostNode, callback);
          hostNode.measureLayout = (relativeToNode, success, failure) => _UIManager.default.measureLayout(hostNode, relativeToNode, failure, success);
          hostNode.measureInWindow = (callback) => _UIManager.default.measureInWindow(hostNode, callback);
        }
      });
      return ref;
    }
    __name(usePlatformMethods, "usePlatformMethods");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/createResponderEvent.js
var require_createResponderEvent = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/createResponderEvent.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = createResponderEvent;
    var _getBoundingClientRect = _interopRequireDefault(require_getBoundingClientRect());
    var emptyFunction = /* @__PURE__ */ __name(() => {
    }, "emptyFunction");
    var emptyObject = {};
    var emptyArray = [];
    function normalizeIdentifier(identifier) {
      return identifier > 20 ? identifier % 20 : identifier;
    }
    __name(normalizeIdentifier, "normalizeIdentifier");
    function createResponderEvent(domEvent, responderTouchHistoryStore) {
      var rect;
      var propagationWasStopped = false;
      var changedTouches;
      var touches;
      var domEventChangedTouches = domEvent.changedTouches;
      var domEventType = domEvent.type;
      var metaKey = domEvent.metaKey === true;
      var shiftKey = domEvent.shiftKey === true;
      var force = domEventChangedTouches && domEventChangedTouches[0].force || 0;
      var identifier = normalizeIdentifier(domEventChangedTouches && domEventChangedTouches[0].identifier || 0);
      var clientX = domEventChangedTouches && domEventChangedTouches[0].clientX || domEvent.clientX;
      var clientY = domEventChangedTouches && domEventChangedTouches[0].clientY || domEvent.clientY;
      var pageX = domEventChangedTouches && domEventChangedTouches[0].pageX || domEvent.pageX;
      var pageY = domEventChangedTouches && domEventChangedTouches[0].pageY || domEvent.pageY;
      var preventDefault = typeof domEvent.preventDefault === "function" ? domEvent.preventDefault.bind(domEvent) : emptyFunction;
      var timestamp = domEvent.timeStamp;
      function normalizeTouches(touches2) {
        return Array.prototype.slice.call(touches2).map((touch) => {
          return {
            force: touch.force,
            identifier: normalizeIdentifier(touch.identifier),
            get locationX() {
              return locationX(touch.clientX);
            },
            get locationY() {
              return locationY(touch.clientY);
            },
            pageX: touch.pageX,
            pageY: touch.pageY,
            target: touch.target,
            timestamp
          };
        });
      }
      __name(normalizeTouches, "normalizeTouches");
      if (domEventChangedTouches != null) {
        changedTouches = normalizeTouches(domEventChangedTouches);
        touches = normalizeTouches(domEvent.touches);
      } else {
        var emulatedTouches = [{
          force,
          identifier,
          get locationX() {
            return locationX(clientX);
          },
          get locationY() {
            return locationY(clientY);
          },
          pageX,
          pageY,
          target: domEvent.target,
          timestamp
        }];
        changedTouches = emulatedTouches;
        touches = domEventType === "mouseup" || domEventType === "dragstart" ? emptyArray : emulatedTouches;
      }
      var responderEvent = {
        bubbles: true,
        cancelable: true,
        // `currentTarget` is set before dispatch
        currentTarget: null,
        defaultPrevented: domEvent.defaultPrevented,
        dispatchConfig: emptyObject,
        eventPhase: domEvent.eventPhase,
        isDefaultPrevented() {
          return domEvent.defaultPrevented;
        },
        isPropagationStopped() {
          return propagationWasStopped;
        },
        isTrusted: domEvent.isTrusted,
        nativeEvent: {
          altKey: false,
          ctrlKey: false,
          metaKey,
          shiftKey,
          changedTouches,
          force,
          identifier,
          get locationX() {
            return locationX(clientX);
          },
          get locationY() {
            return locationY(clientY);
          },
          pageX,
          pageY,
          target: domEvent.target,
          timestamp,
          touches,
          type: domEventType
        },
        persist: emptyFunction,
        preventDefault,
        stopPropagation() {
          propagationWasStopped = true;
        },
        target: domEvent.target,
        timeStamp: timestamp,
        touchHistory: responderTouchHistoryStore.touchHistory
      };
      function locationX(x) {
        rect = rect || (0, _getBoundingClientRect.default)(responderEvent.currentTarget);
        if (rect) {
          return x - rect.left;
        }
      }
      __name(locationX, "locationX");
      function locationY(y) {
        rect = rect || (0, _getBoundingClientRect.default)(responderEvent.currentTarget);
        if (rect) {
          return y - rect.top;
        }
      }
      __name(locationY, "locationY");
      return responderEvent;
    }
    __name(createResponderEvent, "createResponderEvent");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/ResponderEventTypes.js
var require_ResponderEventTypes = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/ResponderEventTypes.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.TOUCH_START = exports2.TOUCH_MOVE = exports2.TOUCH_END = exports2.TOUCH_CANCEL = exports2.SELECTION_CHANGE = exports2.SELECT = exports2.SCROLL = exports2.MOUSE_UP = exports2.MOUSE_MOVE = exports2.MOUSE_DOWN = exports2.MOUSE_CANCEL = exports2.FOCUS_OUT = exports2.CONTEXT_MENU = exports2.BLUR = void 0;
    exports2.isCancelish = isCancelish;
    exports2.isEndish = isEndish;
    exports2.isMoveish = isMoveish;
    exports2.isScroll = isScroll;
    exports2.isSelectionChange = isSelectionChange;
    exports2.isStartish = isStartish;
    var BLUR = exports2.BLUR = "blur";
    var CONTEXT_MENU = exports2.CONTEXT_MENU = "contextmenu";
    var FOCUS_OUT = exports2.FOCUS_OUT = "focusout";
    var MOUSE_DOWN = exports2.MOUSE_DOWN = "mousedown";
    var MOUSE_MOVE = exports2.MOUSE_MOVE = "mousemove";
    var MOUSE_UP = exports2.MOUSE_UP = "mouseup";
    var MOUSE_CANCEL = exports2.MOUSE_CANCEL = "dragstart";
    var TOUCH_START = exports2.TOUCH_START = "touchstart";
    var TOUCH_MOVE = exports2.TOUCH_MOVE = "touchmove";
    var TOUCH_END = exports2.TOUCH_END = "touchend";
    var TOUCH_CANCEL = exports2.TOUCH_CANCEL = "touchcancel";
    var SCROLL = exports2.SCROLL = "scroll";
    var SELECT = exports2.SELECT = "select";
    var SELECTION_CHANGE = exports2.SELECTION_CHANGE = "selectionchange";
    function isStartish(eventType) {
      return eventType === TOUCH_START || eventType === MOUSE_DOWN;
    }
    __name(isStartish, "isStartish");
    function isMoveish(eventType) {
      return eventType === TOUCH_MOVE || eventType === MOUSE_MOVE;
    }
    __name(isMoveish, "isMoveish");
    function isEndish(eventType) {
      return eventType === TOUCH_END || eventType === MOUSE_UP || isCancelish(eventType);
    }
    __name(isEndish, "isEndish");
    function isCancelish(eventType) {
      return eventType === TOUCH_CANCEL || eventType === MOUSE_CANCEL;
    }
    __name(isCancelish, "isCancelish");
    function isScroll(eventType) {
      return eventType === SCROLL;
    }
    __name(isScroll, "isScroll");
    function isSelectionChange(eventType) {
      return eventType === SELECT || eventType === SELECTION_CHANGE;
    }
    __name(isSelectionChange, "isSelectionChange");
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/isSelectionValid/index.js
var require_isSelectionValid = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/isSelectionValid/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = isSelectionValid;
    function isSelectionValid() {
      var selection = window.getSelection();
      var string = selection.toString();
      var anchorNode = selection.anchorNode;
      var focusNode = selection.focusNode;
      var isTextNode = anchorNode && anchorNode.nodeType === window.Node.TEXT_NODE || focusNode && focusNode.nodeType === window.Node.TEXT_NODE;
      return string.length >= 1 && string !== "\n" && isTextNode;
    }
    __name(isSelectionValid, "isSelectionValid");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/utils.js
var require_utils = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/utils.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.getLowestCommonAncestor = getLowestCommonAncestor;
    exports2.getResponderPaths = getResponderPaths;
    exports2.hasTargetTouches = hasTargetTouches;
    exports2.hasValidSelection = hasValidSelection;
    exports2.isPrimaryPointerDown = isPrimaryPointerDown;
    exports2.setResponderId = setResponderId;
    var _isSelectionValid = _interopRequireDefault(require_isSelectionValid());
    var keyName = "__reactResponderId";
    function getEventPath(domEvent) {
      if (domEvent.type === "selectionchange") {
        var target = window.getSelection().anchorNode;
        return composedPathFallback(target);
      } else {
        var path = domEvent.composedPath != null ? domEvent.composedPath() : composedPathFallback(domEvent.target);
        return path;
      }
    }
    __name(getEventPath, "getEventPath");
    function composedPathFallback(target) {
      var path = [];
      while (target != null && target !== document.body) {
        path.push(target);
        target = target.parentNode;
      }
      return path;
    }
    __name(composedPathFallback, "composedPathFallback");
    function getResponderId(node) {
      if (node != null) {
        return node[keyName];
      }
      return null;
    }
    __name(getResponderId, "getResponderId");
    function setResponderId(node, id) {
      if (node != null) {
        node[keyName] = id;
      }
    }
    __name(setResponderId, "setResponderId");
    function getResponderPaths(domEvent) {
      var idPath = [];
      var nodePath = [];
      var eventPath = getEventPath(domEvent);
      for (var i = 0; i < eventPath.length; i++) {
        var node = eventPath[i];
        var id = getResponderId(node);
        if (id != null) {
          idPath.push(id);
          nodePath.push(node);
        }
      }
      return {
        idPath,
        nodePath
      };
    }
    __name(getResponderPaths, "getResponderPaths");
    function getLowestCommonAncestor(pathA, pathB) {
      var pathALength = pathA.length;
      var pathBLength = pathB.length;
      if (
        // If either path is empty
        pathALength === 0 || pathBLength === 0 || // If the last elements aren't the same there can't be a common ancestor
        // that is connected to the responder system
        pathA[pathALength - 1] !== pathB[pathBLength - 1]
      ) {
        return null;
      }
      var itemA = pathA[0];
      var indexA = 0;
      var itemB = pathB[0];
      var indexB = 0;
      if (pathALength - pathBLength > 0) {
        indexA = pathALength - pathBLength;
        itemA = pathA[indexA];
        pathALength = pathBLength;
      }
      if (pathBLength - pathALength > 0) {
        indexB = pathBLength - pathALength;
        itemB = pathB[indexB];
        pathBLength = pathALength;
      }
      var depth = pathALength;
      while (depth--) {
        if (itemA === itemB) {
          return itemA;
        }
        itemA = pathA[indexA++];
        itemB = pathB[indexB++];
      }
      return null;
    }
    __name(getLowestCommonAncestor, "getLowestCommonAncestor");
    function hasTargetTouches(target, touches) {
      if (!touches || touches.length === 0) {
        return false;
      }
      for (var i = 0; i < touches.length; i++) {
        var node = touches[i].target;
        if (node != null) {
          if (target.contains(node)) {
            return true;
          }
        }
      }
      return false;
    }
    __name(hasTargetTouches, "hasTargetTouches");
    function hasValidSelection(domEvent) {
      if (domEvent.type === "selectionchange") {
        return (0, _isSelectionValid.default)();
      }
      return domEvent.type === "select";
    }
    __name(hasValidSelection, "hasValidSelection");
    function isPrimaryPointerDown(domEvent) {
      var altKey = domEvent.altKey, button = domEvent.button, buttons = domEvent.buttons, ctrlKey = domEvent.ctrlKey, type = domEvent.type;
      var isTouch = type === "touchstart" || type === "touchmove";
      var isPrimaryMouseDown = type === "mousedown" && (button === 0 || buttons === 1);
      var isPrimaryMouseMove = type === "mousemove" && buttons === 1;
      var noModifiers = altKey === false && ctrlKey === false;
      if (isTouch || isPrimaryMouseDown && noModifiers || isPrimaryMouseMove && noModifiers) {
        return true;
      }
      return false;
    }
    __name(isPrimaryPointerDown, "isPrimaryPointerDown");
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/ResponderTouchHistoryStore.js
var require_ResponderTouchHistoryStore = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/ResponderTouchHistoryStore.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.ResponderTouchHistoryStore = void 0;
    var _ResponderEventTypes = require_ResponderEventTypes();
    var __DEV__ = process.env.NODE_ENV !== "production";
    var MAX_TOUCH_BANK = 20;
    function timestampForTouch(touch) {
      return touch.timeStamp || touch.timestamp;
    }
    __name(timestampForTouch, "timestampForTouch");
    function createTouchRecord(touch) {
      return {
        touchActive: true,
        startPageX: touch.pageX,
        startPageY: touch.pageY,
        startTimeStamp: timestampForTouch(touch),
        currentPageX: touch.pageX,
        currentPageY: touch.pageY,
        currentTimeStamp: timestampForTouch(touch),
        previousPageX: touch.pageX,
        previousPageY: touch.pageY,
        previousTimeStamp: timestampForTouch(touch)
      };
    }
    __name(createTouchRecord, "createTouchRecord");
    function resetTouchRecord(touchRecord, touch) {
      touchRecord.touchActive = true;
      touchRecord.startPageX = touch.pageX;
      touchRecord.startPageY = touch.pageY;
      touchRecord.startTimeStamp = timestampForTouch(touch);
      touchRecord.currentPageX = touch.pageX;
      touchRecord.currentPageY = touch.pageY;
      touchRecord.currentTimeStamp = timestampForTouch(touch);
      touchRecord.previousPageX = touch.pageX;
      touchRecord.previousPageY = touch.pageY;
      touchRecord.previousTimeStamp = timestampForTouch(touch);
    }
    __name(resetTouchRecord, "resetTouchRecord");
    function getTouchIdentifier(_ref) {
      var identifier = _ref.identifier;
      if (identifier == null) {
        console.error("Touch object is missing identifier.");
      }
      if (__DEV__) {
        if (identifier > MAX_TOUCH_BANK) {
          console.error("Touch identifier %s is greater than maximum supported %s which causes performance issues backfilling array locations for all of the indices.", identifier, MAX_TOUCH_BANK);
        }
      }
      return identifier;
    }
    __name(getTouchIdentifier, "getTouchIdentifier");
    function recordTouchStart(touch, touchHistory) {
      var identifier = getTouchIdentifier(touch);
      var touchRecord = touchHistory.touchBank[identifier];
      if (touchRecord) {
        resetTouchRecord(touchRecord, touch);
      } else {
        touchHistory.touchBank[identifier] = createTouchRecord(touch);
      }
      touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
    }
    __name(recordTouchStart, "recordTouchStart");
    function recordTouchMove(touch, touchHistory) {
      var touchRecord = touchHistory.touchBank[getTouchIdentifier(touch)];
      if (touchRecord) {
        touchRecord.touchActive = true;
        touchRecord.previousPageX = touchRecord.currentPageX;
        touchRecord.previousPageY = touchRecord.currentPageY;
        touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
        touchRecord.currentPageX = touch.pageX;
        touchRecord.currentPageY = touch.pageY;
        touchRecord.currentTimeStamp = timestampForTouch(touch);
        touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
      } else {
        console.warn("Cannot record touch move without a touch start.\n", "Touch Move: " + printTouch(touch) + "\n", "Touch Bank: " + printTouchBank(touchHistory));
      }
    }
    __name(recordTouchMove, "recordTouchMove");
    function recordTouchEnd(touch, touchHistory) {
      var touchRecord = touchHistory.touchBank[getTouchIdentifier(touch)];
      if (touchRecord) {
        touchRecord.touchActive = false;
        touchRecord.previousPageX = touchRecord.currentPageX;
        touchRecord.previousPageY = touchRecord.currentPageY;
        touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
        touchRecord.currentPageX = touch.pageX;
        touchRecord.currentPageY = touch.pageY;
        touchRecord.currentTimeStamp = timestampForTouch(touch);
        touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
      } else {
        console.warn("Cannot record touch end without a touch start.\n", "Touch End: " + printTouch(touch) + "\n", "Touch Bank: " + printTouchBank(touchHistory));
      }
    }
    __name(recordTouchEnd, "recordTouchEnd");
    function printTouch(touch) {
      return JSON.stringify({
        identifier: touch.identifier,
        pageX: touch.pageX,
        pageY: touch.pageY,
        timestamp: timestampForTouch(touch)
      });
    }
    __name(printTouch, "printTouch");
    function printTouchBank(touchHistory) {
      var touchBank = touchHistory.touchBank;
      var printed = JSON.stringify(touchBank.slice(0, MAX_TOUCH_BANK));
      if (touchBank.length > MAX_TOUCH_BANK) {
        printed += " (original size: " + touchBank.length + ")";
      }
      return printed;
    }
    __name(printTouchBank, "printTouchBank");
    var ResponderTouchHistoryStore = class {
      static {
        __name(this, "ResponderTouchHistoryStore");
      }
      constructor() {
        this._touchHistory = {
          touchBank: [],
          //Array<TouchRecord>
          numberActiveTouches: 0,
          // If there is only one active touch, we remember its location. This prevents
          // us having to loop through all of the touches all the time in the most
          // common case.
          indexOfSingleActiveTouch: -1,
          mostRecentTimeStamp: 0
        };
      }
      recordTouchTrack(topLevelType, nativeEvent) {
        var touchHistory = this._touchHistory;
        if ((0, _ResponderEventTypes.isMoveish)(topLevelType)) {
          nativeEvent.changedTouches.forEach((touch) => recordTouchMove(touch, touchHistory));
        } else if ((0, _ResponderEventTypes.isStartish)(topLevelType)) {
          nativeEvent.changedTouches.forEach((touch) => recordTouchStart(touch, touchHistory));
          touchHistory.numberActiveTouches = nativeEvent.touches.length;
          if (touchHistory.numberActiveTouches === 1) {
            touchHistory.indexOfSingleActiveTouch = nativeEvent.touches[0].identifier;
          }
        } else if ((0, _ResponderEventTypes.isEndish)(topLevelType)) {
          nativeEvent.changedTouches.forEach((touch) => recordTouchEnd(touch, touchHistory));
          touchHistory.numberActiveTouches = nativeEvent.touches.length;
          if (touchHistory.numberActiveTouches === 1) {
            var touchBank = touchHistory.touchBank;
            for (var i = 0; i < touchBank.length; i++) {
              var touchTrackToCheck = touchBank[i];
              if (touchTrackToCheck != null && touchTrackToCheck.touchActive) {
                touchHistory.indexOfSingleActiveTouch = i;
                break;
              }
            }
            if (__DEV__) {
              var activeRecord = touchBank[touchHistory.indexOfSingleActiveTouch];
              if (!(activeRecord != null && activeRecord.touchActive)) {
                console.error("Cannot find single active touch.");
              }
            }
          }
        }
      }
      get touchHistory() {
        return this._touchHistory;
      }
    };
    exports2.ResponderTouchHistoryStore = ResponderTouchHistoryStore;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/ResponderSystem.js
var require_ResponderSystem = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/ResponderSystem.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.addNode = addNode;
    exports2.attachListeners = attachListeners;
    exports2.getResponderNode = getResponderNode;
    exports2.removeNode = removeNode;
    exports2.terminateResponder = terminateResponder;
    var _createResponderEvent = _interopRequireDefault(require_createResponderEvent());
    var _ResponderEventTypes = require_ResponderEventTypes();
    var _utils = require_utils();
    var _ResponderTouchHistoryStore = require_ResponderTouchHistoryStore();
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var emptyObject = {};
    var startRegistration = ["onStartShouldSetResponderCapture", "onStartShouldSetResponder", {
      bubbles: true
    }];
    var moveRegistration = ["onMoveShouldSetResponderCapture", "onMoveShouldSetResponder", {
      bubbles: true
    }];
    var scrollRegistration = ["onScrollShouldSetResponderCapture", "onScrollShouldSetResponder", {
      bubbles: false
    }];
    var shouldSetResponderEvents = {
      touchstart: startRegistration,
      mousedown: startRegistration,
      touchmove: moveRegistration,
      mousemove: moveRegistration,
      scroll: scrollRegistration
    };
    var emptyResponder = {
      id: null,
      idPath: null,
      node: null
    };
    var responderListenersMap = /* @__PURE__ */ new Map();
    var isEmulatingMouseEvents = false;
    var trackedTouchCount = 0;
    var currentResponder = {
      id: null,
      node: null,
      idPath: null
    };
    var responderTouchHistoryStore = new _ResponderTouchHistoryStore.ResponderTouchHistoryStore();
    function changeCurrentResponder(responder) {
      currentResponder = responder;
    }
    __name(changeCurrentResponder, "changeCurrentResponder");
    function getResponderConfig(id) {
      var config = responderListenersMap.get(id);
      return config != null ? config : emptyObject;
    }
    __name(getResponderConfig, "getResponderConfig");
    function eventListener(domEvent) {
      var eventType = domEvent.type;
      var eventTarget = domEvent.target;
      if (eventType === "touchstart") {
        isEmulatingMouseEvents = true;
      }
      if (eventType === "touchmove" || trackedTouchCount > 1) {
        isEmulatingMouseEvents = false;
      }
      if (
        // Ignore browser emulated mouse events
        eventType === "mousedown" && isEmulatingMouseEvents || eventType === "mousemove" && isEmulatingMouseEvents || // Ignore mousemove if a mousedown didn't occur first
        eventType === "mousemove" && trackedTouchCount < 1
      ) {
        return;
      }
      if (isEmulatingMouseEvents && eventType === "mouseup") {
        if (trackedTouchCount === 0) {
          isEmulatingMouseEvents = false;
        }
        return;
      }
      var isStartEvent = (0, _ResponderEventTypes.isStartish)(eventType) && (0, _utils.isPrimaryPointerDown)(domEvent);
      var isMoveEvent = (0, _ResponderEventTypes.isMoveish)(eventType);
      var isEndEvent = (0, _ResponderEventTypes.isEndish)(eventType);
      var isScrollEvent = (0, _ResponderEventTypes.isScroll)(eventType);
      var isSelectionChangeEvent = (0, _ResponderEventTypes.isSelectionChange)(eventType);
      var responderEvent = (0, _createResponderEvent.default)(domEvent, responderTouchHistoryStore);
      if (isStartEvent || isMoveEvent || isEndEvent) {
        if (domEvent.touches) {
          trackedTouchCount = domEvent.touches.length;
        } else {
          if (isStartEvent) {
            trackedTouchCount = 1;
          } else if (isEndEvent) {
            trackedTouchCount = 0;
          }
        }
        responderTouchHistoryStore.recordTouchTrack(eventType, responderEvent.nativeEvent);
      }
      var eventPaths = (0, _utils.getResponderPaths)(domEvent);
      var wasNegotiated = false;
      var wantsResponder;
      if (isStartEvent || isMoveEvent || isScrollEvent && trackedTouchCount > 0) {
        var currentResponderIdPath = currentResponder.idPath;
        var eventIdPath = eventPaths.idPath;
        if (currentResponderIdPath != null && eventIdPath != null) {
          var lowestCommonAncestor = (0, _utils.getLowestCommonAncestor)(currentResponderIdPath, eventIdPath);
          if (lowestCommonAncestor != null) {
            var indexOfLowestCommonAncestor = eventIdPath.indexOf(lowestCommonAncestor);
            var index = indexOfLowestCommonAncestor + (lowestCommonAncestor === currentResponder.id ? 1 : 0);
            eventPaths = {
              idPath: eventIdPath.slice(index),
              nodePath: eventPaths.nodePath.slice(index)
            };
          } else {
            eventPaths = null;
          }
        }
        if (eventPaths != null) {
          wantsResponder = findWantsResponder(eventPaths, domEvent, responderEvent);
          if (wantsResponder != null) {
            attemptTransfer(responderEvent, wantsResponder);
            wasNegotiated = true;
          }
        }
      }
      if (currentResponder.id != null && currentResponder.node != null) {
        var _currentResponder = currentResponder, id = _currentResponder.id, node = _currentResponder.node;
        var _getResponderConfig = getResponderConfig(id), onResponderStart = _getResponderConfig.onResponderStart, onResponderMove = _getResponderConfig.onResponderMove, onResponderEnd = _getResponderConfig.onResponderEnd, onResponderRelease = _getResponderConfig.onResponderRelease, onResponderTerminate = _getResponderConfig.onResponderTerminate, onResponderTerminationRequest = _getResponderConfig.onResponderTerminationRequest;
        responderEvent.bubbles = false;
        responderEvent.cancelable = false;
        responderEvent.currentTarget = node;
        if (isStartEvent) {
          if (onResponderStart != null) {
            responderEvent.dispatchConfig.registrationName = "onResponderStart";
            onResponderStart(responderEvent);
          }
        } else if (isMoveEvent) {
          if (onResponderMove != null) {
            responderEvent.dispatchConfig.registrationName = "onResponderMove";
            onResponderMove(responderEvent);
          }
        } else {
          var isTerminateEvent = (0, _ResponderEventTypes.isCancelish)(eventType) || // native context menu
          eventType === "contextmenu" || // window blur
          eventType === "blur" && eventTarget === window || // responder (or ancestors) blur
          eventType === "blur" && eventTarget.contains(node) && domEvent.relatedTarget !== node || // native scroll without using a pointer
          isScrollEvent && trackedTouchCount === 0 || // native scroll on node that is parent of the responder (allow siblings to scroll)
          isScrollEvent && eventTarget.contains(node) && eventTarget !== node || // native select/selectionchange on node
          isSelectionChangeEvent && (0, _utils.hasValidSelection)(domEvent);
          var isReleaseEvent = isEndEvent && !isTerminateEvent && !(0, _utils.hasTargetTouches)(node, domEvent.touches);
          if (isEndEvent) {
            if (onResponderEnd != null) {
              responderEvent.dispatchConfig.registrationName = "onResponderEnd";
              onResponderEnd(responderEvent);
            }
          }
          if (isReleaseEvent) {
            if (onResponderRelease != null) {
              responderEvent.dispatchConfig.registrationName = "onResponderRelease";
              onResponderRelease(responderEvent);
            }
            changeCurrentResponder(emptyResponder);
          }
          if (isTerminateEvent) {
            var shouldTerminate = true;
            if (eventType === "contextmenu" || eventType === "scroll" || eventType === "selectionchange") {
              if (wasNegotiated) {
                shouldTerminate = false;
              } else if (onResponderTerminationRequest != null) {
                responderEvent.dispatchConfig.registrationName = "onResponderTerminationRequest";
                if (onResponderTerminationRequest(responderEvent) === false) {
                  shouldTerminate = false;
                }
              }
            }
            if (shouldTerminate) {
              if (onResponderTerminate != null) {
                responderEvent.dispatchConfig.registrationName = "onResponderTerminate";
                onResponderTerminate(responderEvent);
              }
              changeCurrentResponder(emptyResponder);
              isEmulatingMouseEvents = false;
              trackedTouchCount = 0;
            }
          }
        }
      }
    }
    __name(eventListener, "eventListener");
    function findWantsResponder(eventPaths, domEvent, responderEvent) {
      var shouldSetCallbacks = shouldSetResponderEvents[domEvent.type];
      if (shouldSetCallbacks != null) {
        var idPath = eventPaths.idPath, nodePath = eventPaths.nodePath;
        var shouldSetCallbackCaptureName = shouldSetCallbacks[0];
        var shouldSetCallbackBubbleName = shouldSetCallbacks[1];
        var bubbles = shouldSetCallbacks[2].bubbles;
        var check = /* @__PURE__ */ __name(function check2(id2, node2, callbackName) {
          var config = getResponderConfig(id2);
          var shouldSetCallback = config[callbackName];
          if (shouldSetCallback != null) {
            responderEvent.currentTarget = node2;
            if (shouldSetCallback(responderEvent) === true) {
              var prunedIdPath = idPath.slice(idPath.indexOf(id2));
              return {
                id: id2,
                node: node2,
                idPath: prunedIdPath
              };
            }
          }
        }, "check");
        for (var i = idPath.length - 1; i >= 0; i--) {
          var id = idPath[i];
          var node = nodePath[i];
          var result = check(id, node, shouldSetCallbackCaptureName);
          if (result != null) {
            return result;
          }
          if (responderEvent.isPropagationStopped() === true) {
            return;
          }
        }
        if (bubbles) {
          for (var _i = 0; _i < idPath.length; _i++) {
            var _id = idPath[_i];
            var _node = nodePath[_i];
            var _result = check(_id, _node, shouldSetCallbackBubbleName);
            if (_result != null) {
              return _result;
            }
            if (responderEvent.isPropagationStopped() === true) {
              return;
            }
          }
        } else {
          var _id2 = idPath[0];
          var _node2 = nodePath[0];
          var target = domEvent.target;
          if (target === _node2) {
            return check(_id2, _node2, shouldSetCallbackBubbleName);
          }
        }
      }
    }
    __name(findWantsResponder, "findWantsResponder");
    function attemptTransfer(responderEvent, wantsResponder) {
      var _currentResponder2 = currentResponder, currentId = _currentResponder2.id, currentNode = _currentResponder2.node;
      var id = wantsResponder.id, node = wantsResponder.node;
      var _getResponderConfig2 = getResponderConfig(id), onResponderGrant = _getResponderConfig2.onResponderGrant, onResponderReject = _getResponderConfig2.onResponderReject;
      responderEvent.bubbles = false;
      responderEvent.cancelable = false;
      responderEvent.currentTarget = node;
      if (currentId == null) {
        if (onResponderGrant != null) {
          responderEvent.currentTarget = node;
          responderEvent.dispatchConfig.registrationName = "onResponderGrant";
          onResponderGrant(responderEvent);
        }
        changeCurrentResponder(wantsResponder);
      } else {
        var _getResponderConfig3 = getResponderConfig(currentId), onResponderTerminate = _getResponderConfig3.onResponderTerminate, onResponderTerminationRequest = _getResponderConfig3.onResponderTerminationRequest;
        var allowTransfer = true;
        if (onResponderTerminationRequest != null) {
          responderEvent.currentTarget = currentNode;
          responderEvent.dispatchConfig.registrationName = "onResponderTerminationRequest";
          if (onResponderTerminationRequest(responderEvent) === false) {
            allowTransfer = false;
          }
        }
        if (allowTransfer) {
          if (onResponderTerminate != null) {
            responderEvent.currentTarget = currentNode;
            responderEvent.dispatchConfig.registrationName = "onResponderTerminate";
            onResponderTerminate(responderEvent);
          }
          if (onResponderGrant != null) {
            responderEvent.currentTarget = node;
            responderEvent.dispatchConfig.registrationName = "onResponderGrant";
            onResponderGrant(responderEvent);
          }
          changeCurrentResponder(wantsResponder);
        } else {
          if (onResponderReject != null) {
            responderEvent.currentTarget = node;
            responderEvent.dispatchConfig.registrationName = "onResponderReject";
            onResponderReject(responderEvent);
          }
        }
      }
    }
    __name(attemptTransfer, "attemptTransfer");
    var documentEventsCapturePhase = ["blur", "scroll"];
    var documentEventsBubblePhase = [
      // mouse
      "mousedown",
      "mousemove",
      "mouseup",
      "dragstart",
      // touch
      "touchstart",
      "touchmove",
      "touchend",
      "touchcancel",
      // other
      "contextmenu",
      "select",
      "selectionchange"
    ];
    function attachListeners() {
      if (_canUseDom.default && window.__reactResponderSystemActive == null) {
        window.addEventListener("blur", eventListener);
        documentEventsBubblePhase.forEach((eventType) => {
          document.addEventListener(eventType, eventListener);
        });
        documentEventsCapturePhase.forEach((eventType) => {
          document.addEventListener(eventType, eventListener, true);
        });
        window.__reactResponderSystemActive = true;
      }
    }
    __name(attachListeners, "attachListeners");
    function addNode(id, node, config) {
      (0, _utils.setResponderId)(node, id);
      responderListenersMap.set(id, config);
    }
    __name(addNode, "addNode");
    function removeNode(id) {
      if (currentResponder.id === id) {
        terminateResponder();
      }
      if (responderListenersMap.has(id)) {
        responderListenersMap.delete(id);
      }
    }
    __name(removeNode, "removeNode");
    function terminateResponder() {
      var _currentResponder3 = currentResponder, id = _currentResponder3.id, node = _currentResponder3.node;
      if (id != null && node != null) {
        var _getResponderConfig4 = getResponderConfig(id), onResponderTerminate = _getResponderConfig4.onResponderTerminate;
        if (onResponderTerminate != null) {
          var event = (0, _createResponderEvent.default)({}, responderTouchHistoryStore);
          event.currentTarget = node;
          onResponderTerminate(event);
        }
        changeCurrentResponder(emptyResponder);
      }
      isEmulatingMouseEvents = false;
      trackedTouchCount = 0;
    }
    __name(terminateResponder, "terminateResponder");
    function getResponderNode() {
      return currentResponder.node;
    }
    __name(getResponderNode, "getResponderNode");
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/index.js
var require_useResponderEvents = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useResponderEvents/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = useResponderEvents;
    var React24 = _interopRequireWildcard(require("react"));
    var ResponderSystem = _interopRequireWildcard(require_ResponderSystem());
    var emptyObject = {};
    var idCounter = 0;
    function useStable(getInitialValue) {
      var ref = React24.useRef(null);
      if (ref.current == null) {
        ref.current = getInitialValue();
      }
      return ref.current;
    }
    __name(useStable, "useStable");
    function useResponderEvents(hostRef, config) {
      if (config === void 0) {
        config = emptyObject;
      }
      var id = useStable(() => idCounter++);
      var isAttachedRef = React24.useRef(false);
      React24.useEffect(() => {
        ResponderSystem.attachListeners();
        return () => {
          ResponderSystem.removeNode(id);
        };
      }, [id]);
      React24.useEffect(() => {
        var _config = config, onMoveShouldSetResponder = _config.onMoveShouldSetResponder, onMoveShouldSetResponderCapture = _config.onMoveShouldSetResponderCapture, onScrollShouldSetResponder = _config.onScrollShouldSetResponder, onScrollShouldSetResponderCapture = _config.onScrollShouldSetResponderCapture, onSelectionChangeShouldSetResponder = _config.onSelectionChangeShouldSetResponder, onSelectionChangeShouldSetResponderCapture = _config.onSelectionChangeShouldSetResponderCapture, onStartShouldSetResponder = _config.onStartShouldSetResponder, onStartShouldSetResponderCapture = _config.onStartShouldSetResponderCapture;
        var requiresResponderSystem = onMoveShouldSetResponder != null || onMoveShouldSetResponderCapture != null || onScrollShouldSetResponder != null || onScrollShouldSetResponderCapture != null || onSelectionChangeShouldSetResponder != null || onSelectionChangeShouldSetResponderCapture != null || onStartShouldSetResponder != null || onStartShouldSetResponderCapture != null;
        var node = hostRef.current;
        if (requiresResponderSystem) {
          ResponderSystem.addNode(id, node, config);
          isAttachedRef.current = true;
        } else if (isAttachedRef.current) {
          ResponderSystem.removeNode(id);
          isAttachedRef.current = false;
        }
      }, [config, hostRef, id]);
      React24.useDebugValue({
        isResponder: hostRef.current === ResponderSystem.getResponderNode()
      });
      React24.useDebugValue(config);
    }
    __name(useResponderEvents, "useResponderEvents");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Text/TextAncestorContext.js
var require_TextAncestorContext = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Text/TextAncestorContext.js"(exports2, module2) {
    "use strict";
    "use client";
    exports2.__esModule = true;
    exports2.default = void 0;
    var _react = require("react");
    var TextAncestorContext = /* @__PURE__ */ (0, _react.createContext)(false);
    var _default = exports2.default = TextAncestorContext;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/View/index.js
var require_View = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/View/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _createElement = _interopRequireDefault(require_createElement());
    var forwardedProps = _interopRequireWildcard(require_forwardedProps());
    var _pick = _interopRequireDefault(require_pick());
    var _useElementLayout = _interopRequireDefault(require_useElementLayout());
    var _useMergeRefs = _interopRequireDefault(require_useMergeRefs());
    var _usePlatformMethods = _interopRequireDefault(require_usePlatformMethods());
    var _useResponderEvents = _interopRequireDefault(require_useResponderEvents());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _TextAncestorContext = _interopRequireDefault(require_TextAncestorContext());
    var _useLocale = require_useLocale();
    var _excluded = ["hrefAttrs", "onLayout", "onMoveShouldSetResponder", "onMoveShouldSetResponderCapture", "onResponderEnd", "onResponderGrant", "onResponderMove", "onResponderReject", "onResponderRelease", "onResponderStart", "onResponderTerminate", "onResponderTerminationRequest", "onScrollShouldSetResponder", "onScrollShouldSetResponderCapture", "onSelectionChangeShouldSetResponder", "onSelectionChangeShouldSetResponderCapture", "onStartShouldSetResponder", "onStartShouldSetResponderCapture"];
    var forwardPropsList = Object.assign({}, forwardedProps.defaultProps, forwardedProps.accessibilityProps, forwardedProps.clickProps, forwardedProps.focusProps, forwardedProps.keyboardProps, forwardedProps.mouseProps, forwardedProps.touchProps, forwardedProps.styleProps, {
      href: true,
      lang: true,
      onScroll: true,
      onWheel: true,
      pointerEvents: true
    });
    var pickProps = /* @__PURE__ */ __name((props) => (0, _pick.default)(props, forwardPropsList), "pickProps");
    var View2 = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var hrefAttrs = props.hrefAttrs, onLayout = props.onLayout, onMoveShouldSetResponder = props.onMoveShouldSetResponder, onMoveShouldSetResponderCapture = props.onMoveShouldSetResponderCapture, onResponderEnd = props.onResponderEnd, onResponderGrant = props.onResponderGrant, onResponderMove = props.onResponderMove, onResponderReject = props.onResponderReject, onResponderRelease = props.onResponderRelease, onResponderStart = props.onResponderStart, onResponderTerminate = props.onResponderTerminate, onResponderTerminationRequest = props.onResponderTerminationRequest, onScrollShouldSetResponder = props.onScrollShouldSetResponder, onScrollShouldSetResponderCapture = props.onScrollShouldSetResponderCapture, onSelectionChangeShouldSetResponder = props.onSelectionChangeShouldSetResponder, onSelectionChangeShouldSetResponderCapture = props.onSelectionChangeShouldSetResponderCapture, onStartShouldSetResponder = props.onStartShouldSetResponder, onStartShouldSetResponderCapture = props.onStartShouldSetResponderCapture, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      if (process.env.NODE_ENV !== "production") {
        React24.Children.toArray(props.children).forEach((item) => {
          if (typeof item === "string") {
            console.error("Unexpected text node: " + item + ". A text node cannot be a child of a <View>.");
          }
        });
      }
      var hasTextAncestor = React24.useContext(_TextAncestorContext.default);
      var hostRef = React24.useRef(null);
      var _useLocaleContext = (0, _useLocale.useLocaleContext)(), contextDirection = _useLocaleContext.direction;
      (0, _useElementLayout.default)(hostRef, onLayout);
      (0, _useResponderEvents.default)(hostRef, {
        onMoveShouldSetResponder,
        onMoveShouldSetResponderCapture,
        onResponderEnd,
        onResponderGrant,
        onResponderMove,
        onResponderReject,
        onResponderRelease,
        onResponderStart,
        onResponderTerminate,
        onResponderTerminationRequest,
        onScrollShouldSetResponder,
        onScrollShouldSetResponderCapture,
        onSelectionChangeShouldSetResponder,
        onSelectionChangeShouldSetResponderCapture,
        onStartShouldSetResponder,
        onStartShouldSetResponderCapture
      });
      var component = "div";
      var langDirection = props.lang != null ? (0, _useLocale.getLocaleDirection)(props.lang) : null;
      var componentDirection = props.dir || langDirection;
      var writingDirection = componentDirection || contextDirection;
      var supportedProps = pickProps(rest);
      supportedProps.dir = componentDirection;
      supportedProps.style = [styles.view$raw, hasTextAncestor && styles.inline, props.style];
      if (props.href != null) {
        component = "a";
        if (hrefAttrs != null) {
          var download = hrefAttrs.download, rel = hrefAttrs.rel, target = hrefAttrs.target;
          if (download != null) {
            supportedProps.download = download;
          }
          if (rel != null) {
            supportedProps.rel = rel;
          }
          if (typeof target === "string") {
            supportedProps.target = target.charAt(0) !== "_" ? "_" + target : target;
          }
        }
      }
      var platformMethodsRef = (0, _usePlatformMethods.default)(supportedProps);
      var setRef2 = (0, _useMergeRefs.default)(hostRef, platformMethodsRef, forwardedRef);
      supportedProps.ref = setRef2;
      return (0, _createElement.default)(component, supportedProps, {
        writingDirection
      });
    });
    View2.displayName = "View";
    var styles = _StyleSheet.default.create({
      view$raw: {
        alignContent: "flex-start",
        alignItems: "stretch",
        backgroundColor: "transparent",
        border: "0 solid black",
        boxSizing: "border-box",
        display: "flex",
        flexBasis: "auto",
        flexDirection: "column",
        flexShrink: 0,
        listStyle: "none",
        margin: 0,
        minHeight: 0,
        minWidth: 0,
        padding: 0,
        position: "relative",
        textDecoration: "none",
        zIndex: 0
      },
      inline: {
        display: "inline-flex"
      }
    });
    var _default = exports2.default = View2;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/deepDiffer/index.js
var require_deepDiffer = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/deepDiffer/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var deepDiffer = /* @__PURE__ */ __name(function deepDiffer2(one, two, maxDepth) {
      if (maxDepth === void 0) {
        maxDepth = -1;
      }
      if (maxDepth === 0) {
        return true;
      }
      if (one === two) {
        return false;
      }
      if (typeof one === "function" && typeof two === "function") {
        return false;
      }
      if (typeof one !== "object" || one === null) {
        return one !== two;
      }
      if (typeof two !== "object" || two === null) {
        return true;
      }
      if (one.constructor !== two.constructor) {
        return true;
      }
      if (Array.isArray(one)) {
        var len = one.length;
        if (two.length !== len) {
          return true;
        }
        for (var ii = 0; ii < len; ii++) {
          if (deepDiffer2(one[ii], two[ii], maxDepth - 1)) {
            return true;
          }
        }
      } else {
        for (var key in one) {
          if (deepDiffer2(one[key], two[key], maxDepth - 1)) {
            return true;
          }
        }
        for (var twoKey in two) {
          if (one[twoKey] === void 0 && two[twoKey] !== void 0) {
            return true;
          }
        }
      }
      return false;
    }, "deepDiffer");
    var _default = exports2.default = deepDiffer;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/fbjs/lib/invariant.js
var require_invariant = __commonJS({
  "../../node_modules/fbjs/lib/invariant.js"(exports2, module2) {
    "use strict";
    var validateFormat = process.env.NODE_ENV !== "production" ? function(format) {
      if (format === void 0) {
        throw new Error("invariant(...): Second argument must be a string.");
      }
    } : function(format) {
    };
    function invariant(condition, format) {
      for (var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
        args[_key - 2] = arguments[_key];
      }
      validateFormat(format);
      if (!condition) {
        var error;
        if (format === void 0) {
          error = new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");
        } else {
          var argIndex = 0;
          error = new Error(format.replace(/%s/g, function() {
            return String(args[argIndex++]);
          }));
          error.name = "Invariant Violation";
        }
        error.framesToPop = 1;
        throw error;
      }
    }
    __name(invariant, "invariant");
    module2.exports = invariant;
  }
});

// ../../node_modules/@babel/runtime/helpers/arrayLikeToArray.js
var require_arrayLikeToArray = __commonJS({
  "../../node_modules/@babel/runtime/helpers/arrayLikeToArray.js"(exports2, module2) {
    function _arrayLikeToArray(r, a) {
      (null == a || a > r.length) && (a = r.length);
      for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
      return n;
    }
    __name(_arrayLikeToArray, "_arrayLikeToArray");
    module2.exports = _arrayLikeToArray, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js
var require_unsupportedIterableToArray = __commonJS({
  "../../node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js"(exports2, module2) {
    var arrayLikeToArray = require_arrayLikeToArray();
    function _unsupportedIterableToArray(r, a) {
      if (r) {
        if ("string" == typeof r) return arrayLikeToArray(r, a);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? arrayLikeToArray(r, a) : void 0;
      }
    }
    __name(_unsupportedIterableToArray, "_unsupportedIterableToArray");
    module2.exports = _unsupportedIterableToArray, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/@babel/runtime/helpers/createForOfIteratorHelperLoose.js
var require_createForOfIteratorHelperLoose = __commonJS({
  "../../node_modules/@babel/runtime/helpers/createForOfIteratorHelperLoose.js"(exports2, module2) {
    var unsupportedIterableToArray = require_unsupportedIterableToArray();
    function _createForOfIteratorHelperLoose(r, e) {
      var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (t) return (t = t.call(r)).next.bind(t);
      if (Array.isArray(r) || (t = unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
        t && (r = t);
        var o = 0;
        return function() {
          return o >= r.length ? {
            done: true
          } : {
            done: false,
            value: r[o++]
          };
        };
      }
      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    __name(_createForOfIteratorHelperLoose, "_createForOfIteratorHelperLoose");
    module2.exports = _createForOfIteratorHelperLoose, module2.exports.__esModule = true, module2.exports["default"] = module2.exports;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/RefreshControl/index.js
var require_RefreshControl = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/RefreshControl/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _View = _interopRequireDefault(require_View());
    var _react = _interopRequireDefault(require("react"));
    var _excluded = ["colors", "enabled", "onRefresh", "progressBackgroundColor", "progressViewOffset", "refreshing", "size", "tintColor", "title", "titleColor"];
    function RefreshControl(props) {
      var colors = props.colors, enabled = props.enabled, onRefresh = props.onRefresh, progressBackgroundColor = props.progressBackgroundColor, progressViewOffset = props.progressViewOffset, refreshing = props.refreshing, size = props.size, tintColor = props.tintColor, title = props.title, titleColor = props.titleColor, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      return /* @__PURE__ */ _react.default.createElement(_View.default, rest);
    }
    __name(RefreshControl, "RefreshControl");
    var _default = exports2.default = RefreshControl;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Dimensions/index.js
var require_Dimensions = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Dimensions/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _invariant = _interopRequireDefault(require_invariant());
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var dimensions = {
      window: {
        fontScale: 1,
        height: 0,
        scale: 1,
        width: 0
      },
      screen: {
        fontScale: 1,
        height: 0,
        scale: 1,
        width: 0
      }
    };
    var listeners = {};
    var shouldInit = _canUseDom.default;
    function update() {
      if (!_canUseDom.default) {
        return;
      }
      var win = window;
      var height;
      var width;
      if (win.visualViewport) {
        var visualViewport = win.visualViewport;
        height = Math.round(visualViewport.height * visualViewport.scale);
        width = Math.round(visualViewport.width * visualViewport.scale);
      } else {
        var docEl = win.document.documentElement;
        height = docEl.clientHeight;
        width = docEl.clientWidth;
      }
      dimensions.window = {
        fontScale: 1,
        height,
        scale: win.devicePixelRatio || 1,
        width
      };
      dimensions.screen = {
        fontScale: 1,
        height: win.screen.height,
        scale: win.devicePixelRatio || 1,
        width: win.screen.width
      };
    }
    __name(update, "update");
    function handleResize() {
      update();
      if (Array.isArray(listeners["change"])) {
        listeners["change"].forEach((handler) => handler(dimensions));
      }
    }
    __name(handleResize, "handleResize");
    var Dimensions = class {
      static {
        __name(this, "Dimensions");
      }
      static get(dimension) {
        if (shouldInit) {
          shouldInit = false;
          update();
        }
        (0, _invariant.default)(dimensions[dimension], "No dimension set for key " + dimension);
        return dimensions[dimension];
      }
      static set(initialDimensions) {
        if (initialDimensions) {
          if (_canUseDom.default) {
            (0, _invariant.default)(false, "Dimensions cannot be set in the browser");
          } else {
            if (initialDimensions.screen != null) {
              dimensions.screen = initialDimensions.screen;
            }
            if (initialDimensions.window != null) {
              dimensions.window = initialDimensions.window;
            }
          }
        }
      }
      static addEventListener(type, handler) {
        listeners[type] = listeners[type] || [];
        listeners[type].push(handler);
        return {
          remove: /* @__PURE__ */ __name(() => {
            this.removeEventListener(type, handler);
          }, "remove")
        };
      }
      static removeEventListener(type, handler) {
        if (Array.isArray(listeners[type])) {
          listeners[type] = listeners[type].filter((_handler) => _handler !== handler);
        }
      }
    };
    exports2.default = Dimensions;
    if (_canUseDom.default) {
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", handleResize, false);
      } else {
        window.addEventListener("resize", handleResize, false);
      }
    }
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/TextInputState/index.js
var require_TextInputState = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/TextInputState/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _UIManager = _interopRequireDefault(require_UIManager());
    var TextInputState = {
      /**
       * Internal state
       */
      _currentlyFocusedNode: null,
      /**
       * Returns the ID of the currently focused text field, if one exists
       * If no text field is focused it returns null
       */
      currentlyFocusedField() {
        if (document.activeElement !== this._currentlyFocusedNode) {
          this._currentlyFocusedNode = null;
        }
        return this._currentlyFocusedNode;
      },
      /**
       * @param {Object} TextInputID id of the text field to focus
       * Focuses the specified text field
       * noop if the text field was already focused
       */
      focusTextInput(textFieldNode) {
        if (textFieldNode !== null) {
          this._currentlyFocusedNode = textFieldNode;
          if (document.activeElement !== textFieldNode) {
            _UIManager.default.focus(textFieldNode);
          }
        }
      },
      /**
       * @param {Object} textFieldNode id of the text field to focus
       * Unfocuses the specified text field
       * noop if it wasn't focused
       */
      blurTextInput(textFieldNode) {
        if (textFieldNode !== null) {
          this._currentlyFocusedNode = null;
          if (document.activeElement === textFieldNode) {
            _UIManager.default.blur(textFieldNode);
          }
        }
      }
    };
    var _default = exports2.default = TextInputState;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/dismissKeyboard/index.js
var require_dismissKeyboard = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/dismissKeyboard/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _TextInputState = _interopRequireDefault(require_TextInputState());
    var dismissKeyboard = /* @__PURE__ */ __name(() => {
      _TextInputState.default.blurTextInput(_TextInputState.default.currentlyFocusedField());
    }, "dismissKeyboard");
    var _default = exports2.default = dismissKeyboard;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/ScrollView/ScrollViewBase.js
var require_ScrollViewBase = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/ScrollView/ScrollViewBase.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var _useMergeRefs = _interopRequireDefault(require_useMergeRefs());
    var _excluded = ["onScroll", "onTouchMove", "onWheel", "scrollEnabled", "scrollEventThrottle", "showsHorizontalScrollIndicator", "showsVerticalScrollIndicator", "style"];
    function normalizeScrollEvent(e) {
      return {
        nativeEvent: {
          contentOffset: {
            get x() {
              return e.target.scrollLeft;
            },
            get y() {
              return e.target.scrollTop;
            }
          },
          contentSize: {
            get height() {
              return e.target.scrollHeight;
            },
            get width() {
              return e.target.scrollWidth;
            }
          },
          layoutMeasurement: {
            get height() {
              return e.target.offsetHeight;
            },
            get width() {
              return e.target.offsetWidth;
            }
          }
        },
        timeStamp: Date.now()
      };
    }
    __name(normalizeScrollEvent, "normalizeScrollEvent");
    function shouldEmitScrollEvent(lastTick, eventThrottle) {
      var timeSinceLastTick = Date.now() - lastTick;
      return eventThrottle > 0 && timeSinceLastTick >= eventThrottle;
    }
    __name(shouldEmitScrollEvent, "shouldEmitScrollEvent");
    var ScrollViewBase = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var onScroll = props.onScroll, onTouchMove = props.onTouchMove, onWheel = props.onWheel, _props$scrollEnabled = props.scrollEnabled, scrollEnabled = _props$scrollEnabled === void 0 ? true : _props$scrollEnabled, _props$scrollEventThr = props.scrollEventThrottle, scrollEventThrottle = _props$scrollEventThr === void 0 ? 0 : _props$scrollEventThr, showsHorizontalScrollIndicator = props.showsHorizontalScrollIndicator, showsVerticalScrollIndicator = props.showsVerticalScrollIndicator, style = props.style, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var scrollState = React24.useRef({
        isScrolling: false,
        scrollLastTick: 0
      });
      var scrollTimeout = React24.useRef(null);
      var scrollRef = React24.useRef(null);
      function createPreventableScrollHandler(handler) {
        return (e) => {
          if (scrollEnabled) {
            if (handler) {
              handler(e);
            }
          }
        };
      }
      __name(createPreventableScrollHandler, "createPreventableScrollHandler");
      function handleScroll(e) {
        e.stopPropagation();
        if (e.target === scrollRef.current) {
          e.persist();
          if (scrollTimeout.current != null) {
            clearTimeout(scrollTimeout.current);
          }
          scrollTimeout.current = setTimeout(() => {
            handleScrollEnd(e);
          }, 100);
          if (scrollState.current.isScrolling) {
            if (shouldEmitScrollEvent(scrollState.current.scrollLastTick, scrollEventThrottle)) {
              handleScrollTick(e);
            }
          } else {
            handleScrollStart(e);
          }
        }
      }
      __name(handleScroll, "handleScroll");
      function handleScrollStart(e) {
        scrollState.current.isScrolling = true;
        handleScrollTick(e);
      }
      __name(handleScrollStart, "handleScrollStart");
      function handleScrollTick(e) {
        scrollState.current.scrollLastTick = Date.now();
        if (onScroll) {
          onScroll(normalizeScrollEvent(e));
        }
      }
      __name(handleScrollTick, "handleScrollTick");
      function handleScrollEnd(e) {
        scrollState.current.isScrolling = false;
        if (onScroll) {
          onScroll(normalizeScrollEvent(e));
        }
      }
      __name(handleScrollEnd, "handleScrollEnd");
      var hideScrollbar = showsHorizontalScrollIndicator === false || showsVerticalScrollIndicator === false;
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, rest, {
        onScroll: handleScroll,
        onTouchMove: createPreventableScrollHandler(onTouchMove),
        onWheel: createPreventableScrollHandler(onWheel),
        ref: (0, _useMergeRefs.default)(scrollRef, forwardedRef),
        style: [style, !scrollEnabled && styles.scrollDisabled, hideScrollbar && styles.hideScrollbar]
      }));
    });
    var styles = _StyleSheet.default.create({
      scrollDisabled: {
        overflowX: "hidden",
        overflowY: "hidden",
        touchAction: "none"
      },
      hideScrollbar: {
        scrollbarWidth: "none"
      }
    });
    var _default = exports2.default = ScrollViewBase;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/fbjs/lib/emptyFunction.js
var require_emptyFunction = __commonJS({
  "../../node_modules/fbjs/lib/emptyFunction.js"(exports2, module2) {
    "use strict";
    function makeEmptyFunction(arg) {
      return function() {
        return arg;
      };
    }
    __name(makeEmptyFunction, "makeEmptyFunction");
    var emptyFunction = /* @__PURE__ */ __name(function emptyFunction2() {
    }, "emptyFunction");
    emptyFunction.thatReturns = makeEmptyFunction;
    emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
    emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
    emptyFunction.thatReturnsNull = makeEmptyFunction(null);
    emptyFunction.thatReturnsThis = function() {
      return this;
    };
    emptyFunction.thatReturnsArgument = function(arg) {
      return arg;
    };
    module2.exports = emptyFunction;
  }
});

// ../../node_modules/fbjs/lib/warning.js
var require_warning = __commonJS({
  "../../node_modules/fbjs/lib/warning.js"(exports2, module2) {
    "use strict";
    var emptyFunction = require_emptyFunction();
    function printWarning(format) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      var argIndex = 0;
      var message = "Warning: " + format.replace(/%s/g, function() {
        return args[argIndex++];
      });
      if (typeof console !== "undefined") {
        console.error(message);
      }
      try {
        throw new Error(message);
      } catch (x) {
      }
    }
    __name(printWarning, "printWarning");
    var warning = process.env.NODE_ENV !== "production" ? function(condition, format) {
      if (format === void 0) {
        throw new Error("`warning(condition, format, ...args)` requires a warning message argument");
      }
      if (!condition) {
        for (var _len2 = arguments.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
          args[_key2 - 2] = arguments[_key2];
        }
        printWarning.apply(void 0, [format].concat(args));
      }
    } : emptyFunction;
    module2.exports = warning;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/ScrollView/index.js
var require_ScrollView = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/ScrollView/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _Dimensions = _interopRequireDefault(require_Dimensions());
    var _dismissKeyboard = _interopRequireDefault(require_dismissKeyboard());
    var _invariant = _interopRequireDefault(require_invariant());
    var _mergeRefs = _interopRequireDefault(require_mergeRefs());
    var _Platform = _interopRequireDefault(require_Platform());
    var _ScrollViewBase = _interopRequireDefault(require_ScrollViewBase());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _TextInputState = _interopRequireDefault(require_TextInputState());
    var _UIManager = _interopRequireDefault(require_UIManager());
    var _View = _interopRequireDefault(require_View());
    var _react = _interopRequireDefault(require("react"));
    var _warning = _interopRequireDefault(require_warning());
    var _excluded = ["contentContainerStyle", "horizontal", "onContentSizeChange", "refreshControl", "stickyHeaderIndices", "pagingEnabled", "forwardedRef", "keyboardDismissMode", "onScroll", "centerContent"];
    var emptyObject = {};
    var IS_ANIMATING_TOUCH_START_THRESHOLD_MS = 16;
    var ScrollView = class extends _react.default.Component {
      static {
        __name(this, "ScrollView");
      }
      constructor() {
        super(...arguments);
        this._scrollNodeRef = null;
        this._innerViewRef = null;
        this.isTouching = false;
        this.lastMomentumScrollBeginTime = 0;
        this.lastMomentumScrollEndTime = 0;
        this.observedScrollSinceBecomingResponder = false;
        this.becameResponderWhileAnimating = false;
        this.scrollResponderHandleScrollShouldSetResponder = () => {
          return this.isTouching;
        };
        this.scrollResponderHandleStartShouldSetResponderCapture = (e) => {
          return this.scrollResponderIsAnimating();
        };
        this.scrollResponderHandleTerminationRequest = () => {
          return !this.observedScrollSinceBecomingResponder;
        };
        this.scrollResponderHandleTouchEnd = (e) => {
          var nativeEvent = e.nativeEvent;
          this.isTouching = nativeEvent.touches.length !== 0;
          this.props.onTouchEnd && this.props.onTouchEnd(e);
        };
        this.scrollResponderHandleResponderRelease = (e) => {
          this.props.onResponderRelease && this.props.onResponderRelease(e);
          var currentlyFocusedTextInput = _TextInputState.default.currentlyFocusedField();
          if (!this.props.keyboardShouldPersistTaps && currentlyFocusedTextInput != null && e.target !== currentlyFocusedTextInput && !this.observedScrollSinceBecomingResponder && !this.becameResponderWhileAnimating) {
            this.props.onScrollResponderKeyboardDismissed && this.props.onScrollResponderKeyboardDismissed(e);
            _TextInputState.default.blurTextInput(currentlyFocusedTextInput);
          }
        };
        this.scrollResponderHandleScroll = (e) => {
          this.observedScrollSinceBecomingResponder = true;
          this.props.onScroll && this.props.onScroll(e);
        };
        this.scrollResponderHandleResponderGrant = (e) => {
          this.observedScrollSinceBecomingResponder = false;
          this.props.onResponderGrant && this.props.onResponderGrant(e);
          this.becameResponderWhileAnimating = this.scrollResponderIsAnimating();
        };
        this.scrollResponderHandleScrollBeginDrag = (e) => {
          this.props.onScrollBeginDrag && this.props.onScrollBeginDrag(e);
        };
        this.scrollResponderHandleScrollEndDrag = (e) => {
          this.props.onScrollEndDrag && this.props.onScrollEndDrag(e);
        };
        this.scrollResponderHandleMomentumScrollBegin = (e) => {
          this.lastMomentumScrollBeginTime = Date.now();
          this.props.onMomentumScrollBegin && this.props.onMomentumScrollBegin(e);
        };
        this.scrollResponderHandleMomentumScrollEnd = (e) => {
          this.lastMomentumScrollEndTime = Date.now();
          this.props.onMomentumScrollEnd && this.props.onMomentumScrollEnd(e);
        };
        this.scrollResponderHandleTouchStart = (e) => {
          this.isTouching = true;
          this.props.onTouchStart && this.props.onTouchStart(e);
        };
        this.scrollResponderHandleTouchMove = (e) => {
          this.props.onTouchMove && this.props.onTouchMove(e);
        };
        this.scrollResponderIsAnimating = () => {
          var now = Date.now();
          var timeSinceLastMomentumScrollEnd = now - this.lastMomentumScrollEndTime;
          var isAnimating = timeSinceLastMomentumScrollEnd < IS_ANIMATING_TOUCH_START_THRESHOLD_MS || this.lastMomentumScrollEndTime < this.lastMomentumScrollBeginTime;
          return isAnimating;
        };
        this.scrollResponderScrollTo = (x, y, animated) => {
          if (typeof x === "number") {
            console.warn("`scrollResponderScrollTo(x, y, animated)` is deprecated. Use `scrollResponderScrollTo({x: 5, y: 5, animated: true})` instead.");
          } else {
            var _ref = x || emptyObject;
            x = _ref.x;
            y = _ref.y;
            animated = _ref.animated;
          }
          var node = this.getScrollableNode();
          var left = x || 0;
          var top = y || 0;
          if (node != null) {
            if (typeof node.scroll === "function") {
              node.scroll({
                top,
                left,
                behavior: !animated ? "auto" : "smooth"
              });
            } else {
              node.scrollLeft = left;
              node.scrollTop = top;
            }
          }
        };
        this.scrollResponderZoomTo = (rect, animated) => {
          if (_Platform.default.OS !== "ios") {
            (0, _invariant.default)("zoomToRect is not implemented");
          }
        };
        this.scrollResponderScrollNativeHandleToKeyboard = (nodeHandle, additionalOffset, preventNegativeScrollOffset) => {
          this.additionalScrollOffset = additionalOffset || 0;
          this.preventNegativeScrollOffset = !!preventNegativeScrollOffset;
          _UIManager.default.measureLayout(nodeHandle, this.getInnerViewNode(), this.scrollResponderTextInputFocusError, this.scrollResponderInputMeasureAndScrollToKeyboard);
        };
        this.scrollResponderInputMeasureAndScrollToKeyboard = (left, top, width, height) => {
          var keyboardScreenY = _Dimensions.default.get("window").height;
          if (this.keyboardWillOpenTo) {
            keyboardScreenY = this.keyboardWillOpenTo.endCoordinates.screenY;
          }
          var scrollOffsetY = top - keyboardScreenY + height + this.additionalScrollOffset;
          if (this.preventNegativeScrollOffset) {
            scrollOffsetY = Math.max(0, scrollOffsetY);
          }
          this.scrollResponderScrollTo({
            x: 0,
            y: scrollOffsetY,
            animated: true
          });
          this.additionalOffset = 0;
          this.preventNegativeScrollOffset = false;
        };
        this.scrollResponderKeyboardWillShow = (e) => {
          this.keyboardWillOpenTo = e;
          this.props.onKeyboardWillShow && this.props.onKeyboardWillShow(e);
        };
        this.scrollResponderKeyboardWillHide = (e) => {
          this.keyboardWillOpenTo = null;
          this.props.onKeyboardWillHide && this.props.onKeyboardWillHide(e);
        };
        this.scrollResponderKeyboardDidShow = (e) => {
          if (e) {
            this.keyboardWillOpenTo = e;
          }
          this.props.onKeyboardDidShow && this.props.onKeyboardDidShow(e);
        };
        this.scrollResponderKeyboardDidHide = (e) => {
          this.keyboardWillOpenTo = null;
          this.props.onKeyboardDidHide && this.props.onKeyboardDidHide(e);
        };
        this.flashScrollIndicators = () => {
          this.scrollResponderFlashScrollIndicators();
        };
        this.getScrollResponder = () => {
          return this;
        };
        this.getScrollableNode = () => {
          return this._scrollNodeRef;
        };
        this.getInnerViewRef = () => {
          return this._innerViewRef;
        };
        this.getInnerViewNode = () => {
          return this._innerViewRef;
        };
        this.getNativeScrollRef = () => {
          return this._scrollNodeRef;
        };
        this.scrollTo = (y, x, animated) => {
          if (typeof y === "number") {
            console.warn("`scrollTo(y, x, animated)` is deprecated. Use `scrollTo({x: 5, y: 5, animated: true})` instead.");
          } else {
            var _ref2 = y || emptyObject;
            x = _ref2.x;
            y = _ref2.y;
            animated = _ref2.animated;
          }
          this.scrollResponderScrollTo({
            x: x || 0,
            y: y || 0,
            animated: animated !== false
          });
        };
        this.scrollToEnd = (options) => {
          var animated = (options && options.animated) !== false;
          var horizontal = this.props.horizontal;
          var scrollResponderNode = this.getScrollableNode();
          var x = horizontal ? scrollResponderNode.scrollWidth : 0;
          var y = horizontal ? 0 : scrollResponderNode.scrollHeight;
          this.scrollResponderScrollTo({
            x,
            y,
            animated
          });
        };
        this._handleContentOnLayout = (e) => {
          var _e$nativeEvent$layout = e.nativeEvent.layout, width = _e$nativeEvent$layout.width, height = _e$nativeEvent$layout.height;
          this.props.onContentSizeChange(width, height);
        };
        this._handleScroll = (e) => {
          if (process.env.NODE_ENV !== "production") {
            if (this.props.onScroll && this.props.scrollEventThrottle == null) {
              console.log("You specified `onScroll` on a <ScrollView> but not `scrollEventThrottle`. You will only receive one event. Using `16` you get all the events but be aware that it may cause frame drops, use a bigger number if you don't need as much precision.");
            }
          }
          if (this.props.keyboardDismissMode === "on-drag") {
            (0, _dismissKeyboard.default)();
          }
          this.scrollResponderHandleScroll(e);
        };
        this._setInnerViewRef = (node) => {
          this._innerViewRef = node;
        };
        this._setScrollNodeRef = (node) => {
          this._scrollNodeRef = node;
          if (node != null) {
            node.getScrollResponder = this.getScrollResponder;
            node.getInnerViewNode = this.getInnerViewNode;
            node.getInnerViewRef = this.getInnerViewRef;
            node.getNativeScrollRef = this.getNativeScrollRef;
            node.getScrollableNode = this.getScrollableNode;
            node.scrollTo = this.scrollTo;
            node.scrollToEnd = this.scrollToEnd;
            node.flashScrollIndicators = this.flashScrollIndicators;
            node.scrollResponderZoomTo = this.scrollResponderZoomTo;
            node.scrollResponderScrollNativeHandleToKeyboard = this.scrollResponderScrollNativeHandleToKeyboard;
          }
          var ref = (0, _mergeRefs.default)(this.props.forwardedRef);
          ref(node);
        };
      }
      /**
       * ------------------------------------------------------
       * START SCROLLRESPONDER
       * ------------------------------------------------------
       */
      // Reset to false every time becomes responder. This is used to:
      // - Determine if the scroll view has been scrolled and therefore should
      // refuse to give up its responder lock.
      // - Determine if releasing should dismiss the keyboard when we are in
      // tap-to-dismiss mode (!this.props.keyboardShouldPersistTaps).
      /**
       * Invoke this from an `onScroll` event.
       */
      /**
       * Merely touch starting is not sufficient for a scroll view to become the
       * responder. Being the "responder" means that the very next touch move/end
       * event will result in an action/movement.
       *
       * Invoke this from an `onStartShouldSetResponder` event.
       *
       * `onStartShouldSetResponder` is used when the next move/end will trigger
       * some UI movement/action, but when you want to yield priority to views
       * nested inside of the view.
       *
       * There may be some cases where scroll views actually should return `true`
       * from `onStartShouldSetResponder`: Any time we are detecting a standard tap
       * that gives priority to nested views.
       *
       * - If a single tap on the scroll view triggers an action such as
       *   recentering a map style view yet wants to give priority to interaction
       *   views inside (such as dropped pins or labels), then we would return true
       *   from this method when there is a single touch.
       *
       * - Similar to the previous case, if a two finger "tap" should trigger a
       *   zoom, we would check the `touches` count, and if `>= 2`, we would return
       *   true.
       *
       */
      scrollResponderHandleStartShouldSetResponder() {
        return false;
      }
      /**
       * There are times when the scroll view wants to become the responder
       * (meaning respond to the next immediate `touchStart/touchEnd`), in a way
       * that *doesn't* give priority to nested views (hence the capture phase):
       *
       * - Currently animating.
       * - Tapping anywhere that is not the focused input, while the keyboard is
       *   up (which should dismiss the keyboard).
       *
       * Invoke this from an `onStartShouldSetResponderCapture` event.
       */
      /**
       * Invoke this from an `onResponderReject` event.
       *
       * Some other element is not yielding its role as responder. Normally, we'd
       * just disable the `UIScrollView`, but a touch has already began on it, the
       * `UIScrollView` will not accept being disabled after that. The easiest
       * solution for now is to accept the limitation of disallowing this
       * altogether. To improve this, find a way to disable the `UIScrollView` after
       * a touch has already started.
       */
      scrollResponderHandleResponderReject() {
        (0, _warning.default)(false, "ScrollView doesn't take rejection well - scrolls anyway");
      }
      /**
       * We will allow the scroll view to give up its lock iff it acquired the lock
       * during an animation. This is a very useful default that happens to satisfy
       * many common user experiences.
       *
       * - Stop a scroll on the left edge, then turn that into an outer view's
       *   backswipe.
       * - Stop a scroll mid-bounce at the top, continue pulling to have the outer
       *   view dismiss.
       * - However, without catching the scroll view mid-bounce (while it is
       *   motionless), if you drag far enough for the scroll view to become
       *   responder (and therefore drag the scroll view a bit), any backswipe
       *   navigation of a swipe gesture higher in the view hierarchy, should be
       *   rejected.
       */
      /**
       * Invoke this from an `onTouchEnd` event.
       *
       * @param {SyntheticEvent} e Event.
       */
      /**
       * Invoke this from an `onResponderRelease` event.
       */
      /**
       * Invoke this from an `onResponderGrant` event.
       */
      /**
       * Unfortunately, `onScrollBeginDrag` also fires when *stopping* the scroll
       * animation, and there's not an easy way to distinguish a drag vs. stopping
       * momentum.
       *
       * Invoke this from an `onScrollBeginDrag` event.
       */
      /**
       * Invoke this from an `onScrollEndDrag` event.
       */
      /**
       * Invoke this from an `onMomentumScrollBegin` event.
       */
      /**
       * Invoke this from an `onMomentumScrollEnd` event.
       */
      /**
       * Invoke this from an `onTouchStart` event.
       *
       * Since we know that the `SimpleEventPlugin` occurs later in the plugin
       * order, after `ResponderEventPlugin`, we can detect that we were *not*
       * permitted to be the responder (presumably because a contained view became
       * responder). The `onResponderReject` won't fire in that case - it only
       * fires when a *current* responder rejects our request.
       *
       * @param {SyntheticEvent} e Touch Start event.
       */
      /**
       * Invoke this from an `onTouchMove` event.
       *
       * Since we know that the `SimpleEventPlugin` occurs later in the plugin
       * order, after `ResponderEventPlugin`, we can detect that we were *not*
       * permitted to be the responder (presumably because a contained view became
       * responder). The `onResponderReject` won't fire in that case - it only
       * fires when a *current* responder rejects our request.
       *
       * @param {SyntheticEvent} e Touch Start event.
       */
      /**
       * A helper function for this class that lets us quickly determine if the
       * view is currently animating. This is particularly useful to know when
       * a touch has just started or ended.
       */
      /**
       * A helper function to scroll to a specific point in the scrollview.
       * This is currently used to help focus on child textviews, but can also
       * be used to quickly scroll to any element we want to focus. Syntax:
       *
       * scrollResponderScrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
       *
       * Note: The weird argument signature is due to the fact that, for historical reasons,
       * the function also accepts separate arguments as as alternative to the options object.
       * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
       */
      /**
       * A helper function to zoom to a specific rect in the scrollview. The argument has the shape
       * {x: number; y: number; width: number; height: number; animated: boolean = true}
       *
       * @platform ios
       */
      /**
       * Displays the scroll indicators momentarily.
       */
      scrollResponderFlashScrollIndicators() {
      }
      /**
       * This method should be used as the callback to onFocus in a TextInputs'
       * parent view. Note that any module using this mixin needs to return
       * the parent view's ref in getScrollViewRef() in order to use this method.
       * @param {any} nodeHandle The TextInput node handle
       * @param {number} additionalOffset The scroll view's top "contentInset".
       *        Default is 0.
       * @param {bool} preventNegativeScrolling Whether to allow pulling the content
       *        down to make it meet the keyboard's top. Default is false.
       */
      /**
       * The calculations performed here assume the scroll view takes up the entire
       * screen - even if has some content inset. We then measure the offsets of the
       * keyboard, and compensate both for the scroll view's "contentInset".
       *
       * @param {number} left Position of input w.r.t. table view.
       * @param {number} top Position of input w.r.t. table view.
       * @param {number} width Width of the text input.
       * @param {number} height Height of the text input.
       */
      scrollResponderTextInputFocusError(e) {
        console.error("Error measuring text field: ", e);
      }
      /**
       * Warning, this may be called several times for a single keyboard opening.
       * It's best to store the information in this method and then take any action
       * at a later point (either in `keyboardDidShow` or other).
       *
       * Here's the order that events occur in:
       * - focus
       * - willShow {startCoordinates, endCoordinates} several times
       * - didShow several times
       * - blur
       * - willHide {startCoordinates, endCoordinates} several times
       * - didHide several times
       *
       * The `ScrollResponder` providesModule callbacks for each of these events.
       * Even though any user could have easily listened to keyboard events
       * themselves, using these `props` callbacks ensures that ordering of events
       * is consistent - and not dependent on the order that the keyboard events are
       * subscribed to. This matters when telling the scroll view to scroll to where
       * the keyboard is headed - the scroll responder better have been notified of
       * the keyboard destination before being instructed to scroll to where the
       * keyboard will be. Stick to the `ScrollResponder` callbacks, and everything
       * will work.
       *
       * WARNING: These callbacks will fire even if a keyboard is displayed in a
       * different navigation pane. Filter out the events to determine if they are
       * relevant to you. (For example, only if you receive these callbacks after
       * you had explicitly focused a node etc).
       */
      /**
       * ------------------------------------------------------
       * END SCROLLRESPONDER
       * ------------------------------------------------------
       */
      /**
       * Returns a reference to the underlying scroll responder, which supports
       * operations like `scrollTo`. All ScrollView-like components should
       * implement this method so that they can be composed while providing access
       * to the underlying scroll responder's methods.
       */
      /**
       * Scrolls to a given x, y offset, either immediately or with a smooth animation.
       * Syntax:
       *
       * scrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
       *
       * Note: The weird argument signature is due to the fact that, for historical reasons,
       * the function also accepts separate arguments as as alternative to the options object.
       * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
       */
      /**
       * If this is a vertical ScrollView scrolls to the bottom.
       * If this is a horizontal ScrollView scrolls to the right.
       *
       * Use `scrollToEnd({ animated: true })` for smooth animated scrolling,
       * `scrollToEnd({ animated: false })` for immediate scrolling.
       * If no options are passed, `animated` defaults to true.
       */
      render() {
        var _this$props = this.props, contentContainerStyle = _this$props.contentContainerStyle, horizontal = _this$props.horizontal, onContentSizeChange = _this$props.onContentSizeChange, refreshControl = _this$props.refreshControl, stickyHeaderIndices = _this$props.stickyHeaderIndices, pagingEnabled = _this$props.pagingEnabled, forwardedRef = _this$props.forwardedRef, keyboardDismissMode = _this$props.keyboardDismissMode, onScroll = _this$props.onScroll, centerContent = _this$props.centerContent, other = (0, _objectWithoutPropertiesLoose2.default)(_this$props, _excluded);
        if (process.env.NODE_ENV !== "production" && this.props.style) {
          var style = _StyleSheet.default.flatten(this.props.style);
          var childLayoutProps = ["alignItems", "justifyContent"].filter((prop) => style && style[prop] !== void 0);
          (0, _invariant.default)(childLayoutProps.length === 0, "ScrollView child layout (" + JSON.stringify(childLayoutProps) + ") must be applied through the contentContainerStyle prop.");
        }
        var contentSizeChangeProps = {};
        if (onContentSizeChange) {
          contentSizeChangeProps = {
            onLayout: this._handleContentOnLayout
          };
        }
        var hasStickyHeaderIndices = !horizontal && Array.isArray(stickyHeaderIndices);
        var children = hasStickyHeaderIndices || pagingEnabled ? _react.default.Children.map(this.props.children, (child, i) => {
          var isSticky = hasStickyHeaderIndices && stickyHeaderIndices.indexOf(i) > -1;
          if (child != null && (isSticky || pagingEnabled)) {
            return /* @__PURE__ */ _react.default.createElement(_View.default, {
              style: [isSticky && styles.stickyHeader, pagingEnabled && styles.pagingEnabledChild]
            }, child);
          } else {
            return child;
          }
        }) : this.props.children;
        var contentContainer = /* @__PURE__ */ _react.default.createElement(_View.default, (0, _extends2.default)({}, contentSizeChangeProps, {
          children,
          collapsable: false,
          ref: this._setInnerViewRef,
          style: [horizontal && styles.contentContainerHorizontal, centerContent && styles.contentContainerCenterContent, contentContainerStyle]
        }));
        var baseStyle = horizontal ? styles.baseHorizontal : styles.baseVertical;
        var pagingEnabledStyle = horizontal ? styles.pagingEnabledHorizontal : styles.pagingEnabledVertical;
        var props = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, other), {}, {
          style: [baseStyle, pagingEnabled && pagingEnabledStyle, this.props.style],
          onTouchStart: this.scrollResponderHandleTouchStart,
          onTouchMove: this.scrollResponderHandleTouchMove,
          onTouchEnd: this.scrollResponderHandleTouchEnd,
          onScrollBeginDrag: this.scrollResponderHandleScrollBeginDrag,
          onScrollEndDrag: this.scrollResponderHandleScrollEndDrag,
          onMomentumScrollBegin: this.scrollResponderHandleMomentumScrollBegin,
          onMomentumScrollEnd: this.scrollResponderHandleMomentumScrollEnd,
          onStartShouldSetResponder: this.scrollResponderHandleStartShouldSetResponder,
          onStartShouldSetResponderCapture: this.scrollResponderHandleStartShouldSetResponderCapture,
          onScrollShouldSetResponder: this.scrollResponderHandleScrollShouldSetResponder,
          onScroll: this._handleScroll,
          onResponderGrant: this.scrollResponderHandleResponderGrant,
          onResponderTerminationRequest: this.scrollResponderHandleTerminationRequest,
          onResponderTerminate: this.scrollResponderHandleTerminate,
          onResponderRelease: this.scrollResponderHandleResponderRelease,
          onResponderReject: this.scrollResponderHandleResponderReject
        });
        var ScrollViewClass = _ScrollViewBase.default;
        (0, _invariant.default)(ScrollViewClass !== void 0, "ScrollViewClass must not be undefined");
        var scrollView = /* @__PURE__ */ _react.default.createElement(ScrollViewClass, (0, _extends2.default)({}, props, {
          ref: this._setScrollNodeRef
        }), contentContainer);
        if (refreshControl) {
          return /* @__PURE__ */ _react.default.cloneElement(refreshControl, {
            style: props.style
          }, scrollView);
        }
        return scrollView;
      }
    };
    var commonStyle = {
      flexGrow: 1,
      flexShrink: 1,
      // Enable hardware compositing in modern browsers.
      // Creates a new layer with its own backing surface that can significantly
      // improve scroll performance.
      transform: "translateZ(0)",
      // iOS native scrolling
      WebkitOverflowScrolling: "touch"
    };
    var styles = _StyleSheet.default.create({
      baseVertical: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, commonStyle), {}, {
        flexDirection: "column",
        overflowX: "hidden",
        overflowY: "auto"
      }),
      baseHorizontal: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, commonStyle), {}, {
        flexDirection: "row",
        overflowX: "auto",
        overflowY: "hidden"
      }),
      contentContainerHorizontal: {
        flexDirection: "row"
      },
      contentContainerCenterContent: {
        justifyContent: "center",
        flexGrow: 1
      },
      stickyHeader: {
        position: "sticky",
        top: 0,
        zIndex: 10
      },
      pagingEnabledHorizontal: {
        scrollSnapType: "x mandatory"
      },
      pagingEnabledVertical: {
        scrollSnapType: "y mandatory"
      },
      pagingEnabledChild: {
        scrollSnapAlign: "start"
      }
    });
    var ForwardedScrollView = /* @__PURE__ */ _react.default.forwardRef((props, forwardedRef) => {
      return /* @__PURE__ */ _react.default.createElement(ScrollView, (0, _extends2.default)({}, props, {
        forwardedRef
      }));
    });
    ForwardedScrollView.displayName = "ScrollView";
    var _default = exports2.default = ForwardedScrollView;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/InteractionManager/TaskQueue.js
var require_TaskQueue = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/InteractionManager/TaskQueue.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _invariant = _interopRequireDefault(require_invariant());
    var TaskQueue = class {
      static {
        __name(this, "TaskQueue");
      }
      constructor(_ref) {
        var onMoreTasks = _ref.onMoreTasks;
        this._onMoreTasks = onMoreTasks;
        this._queueStack = [{
          tasks: [],
          popable: true
        }];
      }
      enqueue(task) {
        this._getCurrentQueue().push(task);
      }
      enqueueTasks(tasks) {
        tasks.forEach((task) => this.enqueue(task));
      }
      cancelTasks(tasksToCancel) {
        this._queueStack = this._queueStack.map((queue) => (0, _objectSpread2.default)((0, _objectSpread2.default)({}, queue), {}, {
          tasks: queue.tasks.filter((task) => tasksToCancel.indexOf(task) === -1)
        })).filter((queue, idx) => queue.tasks.length > 0 || idx === 0);
      }
      hasTasksToProcess() {
        return this._getCurrentQueue().length > 0;
      }
      /**
       * Executes the next task in the queue.
       */
      processNext() {
        var queue = this._getCurrentQueue();
        if (queue.length) {
          var task = queue.shift();
          try {
            if (typeof task === "object" && task.gen) {
              this._genPromise(task);
            } else if (typeof task === "object" && task.run) {
              task.run();
            } else {
              (0, _invariant.default)(typeof task === "function", "Expected Function, SimpleTask, or PromiseTask, but got:\n" + JSON.stringify(task, null, 2));
              task();
            }
          } catch (e) {
            e.message = "TaskQueue: Error with task " + (task.name || "") + ": " + e.message;
            throw e;
          }
        }
      }
      _getCurrentQueue() {
        var stackIdx = this._queueStack.length - 1;
        var queue = this._queueStack[stackIdx];
        if (queue.popable && queue.tasks.length === 0 && stackIdx > 0) {
          this._queueStack.pop();
          return this._getCurrentQueue();
        } else {
          return queue.tasks;
        }
      }
      _genPromise(task) {
        var length = this._queueStack.push({
          tasks: [],
          popable: false
        });
        var stackIdx = length - 1;
        var stackItem = this._queueStack[stackIdx];
        task.gen().then(() => {
          stackItem.popable = true;
          this.hasTasksToProcess() && this._onMoreTasks();
        }).catch((ex) => {
          setTimeout(() => {
            ex.message = "TaskQueue: Error resolving Promise in task " + task.name + ": " + ex.message;
            throw ex;
          }, 0);
        });
      }
    };
    var _default = exports2.default = TaskQueue;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/vendor/emitter/EventEmitter.js
var require_EventEmitter = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/vendor/emitter/EventEmitter.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var EventEmitter = class {
      static {
        __name(this, "EventEmitter");
      }
      constructor() {
        this._registry = {};
      }
      /**
       * Registers a listener that is called when the supplied event is emitted.
       * Returns a subscription that has a `remove` method to undo registration.
       */
      addListener(eventType, listener, context) {
        var registrations = allocate(this._registry, eventType);
        var registration = {
          context,
          listener,
          remove() {
            registrations.delete(registration);
          }
        };
        registrations.add(registration);
        return registration;
      }
      /**
       * Emits the supplied event. Additional arguments supplied to `emit` will be
       * passed through to each of the registered listeners.
       *
       * If a listener modifies the listeners registered for the same event, those
       * changes will not be reflected in the current invocation of `emit`.
       */
      emit(eventType) {
        var registrations = this._registry[eventType];
        if (registrations != null) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }
          for (var _i = 0, _arr = [...registrations]; _i < _arr.length; _i++) {
            var registration = _arr[_i];
            registration.listener.apply(registration.context, args);
          }
        }
      }
      /**
       * Removes all registered listeners.
       */
      removeAllListeners(eventType) {
        if (eventType == null) {
          this._registry = {};
        } else {
          delete this._registry[eventType];
        }
      }
      /**
       * Returns the number of registered listeners for the supplied event.
       */
      listenerCount(eventType) {
        var registrations = this._registry[eventType];
        return registrations == null ? 0 : registrations.size;
      }
    };
    exports2.default = EventEmitter;
    function allocate(registry, eventType) {
      var registrations = registry[eventType];
      if (registrations == null) {
        registrations = /* @__PURE__ */ new Set();
        registry[eventType] = registrations;
      }
      return registrations;
    }
    __name(allocate, "allocate");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/requestIdleCallback/index.js
var require_requestIdleCallback = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/requestIdleCallback/index.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = exports2.cancelIdleCallback = void 0;
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var _requestIdleCallback = /* @__PURE__ */ __name(function _requestIdleCallback2(cb, options) {
      return setTimeout(() => {
        var start = Date.now();
        cb({
          didTimeout: false,
          timeRemaining() {
            return Math.max(0, 50 - (Date.now() - start));
          }
        });
      }, 1);
    }, "_requestIdleCallback");
    var _cancelIdleCallback = /* @__PURE__ */ __name(function _cancelIdleCallback2(id) {
      clearTimeout(id);
    }, "_cancelIdleCallback");
    var isSupported = _canUseDom.default && typeof window.requestIdleCallback !== "undefined";
    var requestIdleCallback = isSupported ? window.requestIdleCallback : _requestIdleCallback;
    var cancelIdleCallback = exports2.cancelIdleCallback = isSupported ? window.cancelIdleCallback : _cancelIdleCallback;
    var _default = exports2.default = requestIdleCallback;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/InteractionManager/index.js
var require_InteractionManager = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/InteractionManager/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _invariant = _interopRequireDefault(require_invariant());
    var _TaskQueue = _interopRequireDefault(require_TaskQueue());
    var _EventEmitter = _interopRequireDefault(require_EventEmitter());
    var _requestIdleCallback = _interopRequireDefault(require_requestIdleCallback());
    var _emitter = new _EventEmitter.default();
    var InteractionManager = {
      Events: {
        interactionStart: "interactionStart",
        interactionComplete: "interactionComplete"
      },
      /**
       * Schedule a function to run after all interactions have completed.
       */
      runAfterInteractions(task) {
        var tasks = [];
        var promise = new Promise((resolve) => {
          _scheduleUpdate();
          if (task) {
            tasks.push(task);
          }
          tasks.push({
            run: resolve,
            name: "resolve " + (task && task.name || "?")
          });
          _taskQueue.enqueueTasks(tasks);
        });
        return {
          then: promise.then.bind(promise),
          done: promise.then.bind(promise),
          cancel: /* @__PURE__ */ __name(() => {
            _taskQueue.cancelTasks(tasks);
          }, "cancel")
        };
      },
      /**
       * Notify manager that an interaction has started.
       */
      createInteractionHandle() {
        _scheduleUpdate();
        var handle = ++_inc;
        _addInteractionSet.add(handle);
        return handle;
      },
      /**
       * Notify manager that an interaction has completed.
       */
      clearInteractionHandle(handle) {
        (0, _invariant.default)(!!handle, "Must provide a handle to clear.");
        _scheduleUpdate();
        _addInteractionSet.delete(handle);
        _deleteInteractionSet.add(handle);
      },
      addListener: _emitter.addListener.bind(_emitter),
      /**
       *
       * @param deadline
       */
      setDeadline(deadline) {
        _deadline = deadline;
      }
    };
    var _interactionSet = /* @__PURE__ */ new Set();
    var _addInteractionSet = /* @__PURE__ */ new Set();
    var _deleteInteractionSet = /* @__PURE__ */ new Set();
    var _taskQueue = new _TaskQueue.default({
      onMoreTasks: _scheduleUpdate
    });
    var _nextUpdateHandle = 0;
    var _inc = 0;
    var _deadline = -1;
    function _scheduleUpdate() {
      if (!_nextUpdateHandle) {
        if (_deadline > 0) {
          _nextUpdateHandle = setTimeout(_processUpdate);
        } else {
          _nextUpdateHandle = (0, _requestIdleCallback.default)(_processUpdate);
        }
      }
    }
    __name(_scheduleUpdate, "_scheduleUpdate");
    function _processUpdate() {
      _nextUpdateHandle = 0;
      var interactionCount = _interactionSet.size;
      _addInteractionSet.forEach((handle) => _interactionSet.add(handle));
      _deleteInteractionSet.forEach((handle) => _interactionSet.delete(handle));
      var nextInteractionCount = _interactionSet.size;
      if (interactionCount !== 0 && nextInteractionCount === 0) {
        _emitter.emit(InteractionManager.Events.interactionComplete);
      } else if (interactionCount === 0 && nextInteractionCount !== 0) {
        _emitter.emit(InteractionManager.Events.interactionStart);
      }
      if (nextInteractionCount === 0) {
        var begin = Date.now();
        while (_taskQueue.hasTasksToProcess()) {
          _taskQueue.processNext();
          if (_deadline > 0 && Date.now() - begin >= _deadline) {
            _scheduleUpdate();
            break;
          }
        }
      }
      _addInteractionSet.clear();
      _deleteInteractionSet.clear();
    }
    __name(_processUpdate, "_processUpdate");
    var _default = exports2.default = InteractionManager;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Batchinator/index.js
var require_Batchinator = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Batchinator/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _InteractionManager = _interopRequireDefault(require_InteractionManager());
    var Batchinator = class {
      static {
        __name(this, "Batchinator");
      }
      constructor(callback, delayMS) {
        this._delay = delayMS;
        this._callback = callback;
      }
      /*
       * Cleanup any pending tasks.
       *
       * By default, if there is a pending task the callback is run immediately. Set the option abort to
       * true to not call the callback if it was pending.
       */
      dispose(options) {
        if (options === void 0) {
          options = {
            abort: false
          };
        }
        if (this._taskHandle) {
          this._taskHandle.cancel();
          if (!options.abort) {
            this._callback();
          }
          this._taskHandle = null;
        }
      }
      schedule() {
        if (this._taskHandle) {
          return;
        }
        var timeoutHandle = setTimeout(() => {
          this._taskHandle = _InteractionManager.default.runAfterInteractions(() => {
            this._taskHandle = null;
            this._callback();
          });
        }, this._delay);
        this._taskHandle = {
          cancel: /* @__PURE__ */ __name(() => clearTimeout(timeoutHandle), "cancel")
        };
      }
    };
    var _default = exports2.default = Batchinator;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Utilities/clamp.js
var require_clamp = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Utilities/clamp.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    function clamp(min, value, max) {
      if (value < min) {
        return min;
      }
      if (value > max) {
        return max;
      }
      return value;
    }
    __name(clamp, "clamp");
    var _default = exports2.default = clamp;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/infoLog/index.js
var require_infoLog = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/infoLog/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    function infoLog() {
      return console.log(...arguments);
    }
    __name(infoLog, "infoLog");
    var _default = exports2.default = infoLog;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/CellRenderMask.js
var require_CellRenderMask = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/CellRenderMask.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.CellRenderMask = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _invariant = _interopRequireDefault(require_invariant());
    var CellRenderMask = class {
      static {
        __name(this, "CellRenderMask");
      }
      constructor(numCells) {
        (0, _invariant.default)(numCells >= 0, "CellRenderMask must contain a non-negative number os cells");
        this._numCells = numCells;
        if (numCells === 0) {
          this._regions = [];
        } else {
          this._regions = [{
            first: 0,
            last: numCells - 1,
            isSpacer: true
          }];
        }
      }
      enumerateRegions() {
        return this._regions;
      }
      addCells(cells) {
        (0, _invariant.default)(cells.first >= 0 && cells.first < this._numCells && cells.last >= -1 && cells.last < this._numCells && cells.last >= cells.first - 1, "CellRenderMask.addCells called with invalid cell range");
        if (cells.last < cells.first) {
          return;
        }
        var _this$_findRegion = this._findRegion(cells.first), firstIntersect = _this$_findRegion[0], firstIntersectIdx = _this$_findRegion[1];
        var _this$_findRegion2 = this._findRegion(cells.last), lastIntersect = _this$_findRegion2[0], lastIntersectIdx = _this$_findRegion2[1];
        if (firstIntersectIdx === lastIntersectIdx && !firstIntersect.isSpacer) {
          return;
        }
        var newLeadRegion = [];
        var newTailRegion = [];
        var newMainRegion = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, cells), {}, {
          isSpacer: false
        });
        if (firstIntersect.first < newMainRegion.first) {
          if (firstIntersect.isSpacer) {
            newLeadRegion.push({
              first: firstIntersect.first,
              last: newMainRegion.first - 1,
              isSpacer: true
            });
          } else {
            newMainRegion.first = firstIntersect.first;
          }
        }
        if (lastIntersect.last > newMainRegion.last) {
          if (lastIntersect.isSpacer) {
            newTailRegion.push({
              first: newMainRegion.last + 1,
              last: lastIntersect.last,
              isSpacer: true
            });
          } else {
            newMainRegion.last = lastIntersect.last;
          }
        }
        var replacementRegions = [...newLeadRegion, newMainRegion, ...newTailRegion];
        var numRegionsToDelete = lastIntersectIdx - firstIntersectIdx + 1;
        this._regions.splice(firstIntersectIdx, numRegionsToDelete, ...replacementRegions);
      }
      numCells() {
        return this._numCells;
      }
      equals(other) {
        return this._numCells === other._numCells && this._regions.length === other._regions.length && this._regions.every((region, i) => region.first === other._regions[i].first && region.last === other._regions[i].last && region.isSpacer === other._regions[i].isSpacer);
      }
      _findRegion(cellIdx) {
        var firstIdx = 0;
        var lastIdx = this._regions.length - 1;
        while (firstIdx <= lastIdx) {
          var middleIdx = Math.floor((firstIdx + lastIdx) / 2);
          var middleRegion = this._regions[middleIdx];
          if (cellIdx >= middleRegion.first && cellIdx <= middleRegion.last) {
            return [middleRegion, middleIdx];
          } else if (cellIdx < middleRegion.first) {
            lastIdx = middleIdx - 1;
          } else if (cellIdx > middleRegion.last) {
            firstIdx = middleIdx + 1;
          }
        }
        (0, _invariant.default)(false, "A region was not found containing cellIdx " + cellIdx);
      }
    };
    exports2.CellRenderMask = CellRenderMask;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/ChildListCollection.js
var require_ChildListCollection = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/ChildListCollection.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _createForOfIteratorHelperLoose2 = _interopRequireDefault(require_createForOfIteratorHelperLoose());
    var _invariant = _interopRequireDefault(require_invariant());
    var ChildListCollection = class {
      static {
        __name(this, "ChildListCollection");
      }
      constructor() {
        this._cellKeyToChildren = /* @__PURE__ */ new Map();
        this._childrenToCellKey = /* @__PURE__ */ new Map();
      }
      add(list, cellKey) {
        var _this$_cellKeyToChild;
        (0, _invariant.default)(!this._childrenToCellKey.has(list), "Trying to add already present child list");
        var cellLists = (_this$_cellKeyToChild = this._cellKeyToChildren.get(cellKey)) !== null && _this$_cellKeyToChild !== void 0 ? _this$_cellKeyToChild : /* @__PURE__ */ new Set();
        cellLists.add(list);
        this._cellKeyToChildren.set(cellKey, cellLists);
        this._childrenToCellKey.set(list, cellKey);
      }
      remove(list) {
        var cellKey = this._childrenToCellKey.get(list);
        (0, _invariant.default)(cellKey != null, "Trying to remove non-present child list");
        this._childrenToCellKey.delete(list);
        var cellLists = this._cellKeyToChildren.get(cellKey);
        (0, _invariant.default)(cellLists, "_cellKeyToChildren should contain cellKey");
        cellLists.delete(list);
        if (cellLists.size === 0) {
          this._cellKeyToChildren.delete(cellKey);
        }
      }
      forEach(fn) {
        for (var _iterator = (0, _createForOfIteratorHelperLoose2.default)(this._cellKeyToChildren.values()), _step; !(_step = _iterator()).done; ) {
          var listSet = _step.value;
          for (var _iterator2 = (0, _createForOfIteratorHelperLoose2.default)(listSet), _step2; !(_step2 = _iterator2()).done; ) {
            var list = _step2.value;
            fn(list);
          }
        }
      }
      forEachInCell(cellKey, fn) {
        var _this$_cellKeyToChild2;
        var listSet = (_this$_cellKeyToChild2 = this._cellKeyToChildren.get(cellKey)) !== null && _this$_cellKeyToChild2 !== void 0 ? _this$_cellKeyToChild2 : [];
        for (var _iterator3 = (0, _createForOfIteratorHelperLoose2.default)(listSet), _step3; !(_step3 = _iterator3()).done; ) {
          var list = _step3.value;
          fn(list);
        }
      }
      anyInCell(cellKey, fn) {
        var _this$_cellKeyToChild3;
        var listSet = (_this$_cellKeyToChild3 = this._cellKeyToChildren.get(cellKey)) !== null && _this$_cellKeyToChild3 !== void 0 ? _this$_cellKeyToChild3 : [];
        for (var _iterator4 = (0, _createForOfIteratorHelperLoose2.default)(listSet), _step4; !(_step4 = _iterator4()).done; ) {
          var list = _step4.value;
          if (fn(list)) {
            return true;
          }
        }
        return false;
      }
      size() {
        return this._childrenToCellKey.size;
      }
    };
    exports2.default = ChildListCollection;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/FillRateHelper/index.js
var require_FillRateHelper = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/FillRateHelper/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var Info = class {
      static {
        __name(this, "Info");
      }
      constructor() {
        this.any_blank_count = 0;
        this.any_blank_ms = 0;
        this.any_blank_speed_sum = 0;
        this.mostly_blank_count = 0;
        this.mostly_blank_ms = 0;
        this.pixels_blank = 0;
        this.pixels_sampled = 0;
        this.pixels_scrolled = 0;
        this.total_time_spent = 0;
        this.sample_count = 0;
      }
    };
    var DEBUG = false;
    var _listeners = [];
    var _minSampleCount = 10;
    var _sampleRate = DEBUG ? 1 : null;
    var FillRateHelper = class {
      static {
        __name(this, "FillRateHelper");
      }
      static addListener(callback) {
        if (_sampleRate === null) {
          console.warn("Call `FillRateHelper.setSampleRate` before `addListener`.");
        }
        _listeners.push(callback);
        return {
          remove: /* @__PURE__ */ __name(() => {
            _listeners = _listeners.filter((listener) => callback !== listener);
          }, "remove")
        };
      }
      static setSampleRate(sampleRate) {
        _sampleRate = sampleRate;
      }
      static setMinSampleCount(minSampleCount) {
        _minSampleCount = minSampleCount;
      }
      constructor(getFrameMetrics) {
        this._anyBlankStartTime = null;
        this._enabled = false;
        this._info = new Info();
        this._mostlyBlankStartTime = null;
        this._samplesStartTime = null;
        this._getFrameMetrics = getFrameMetrics;
        this._enabled = (_sampleRate || 0) > Math.random();
        this._resetData();
      }
      activate() {
        if (this._enabled && this._samplesStartTime == null) {
          DEBUG && console.debug("FillRateHelper: activate");
          this._samplesStartTime = global.performance.now();
        }
      }
      deactivateAndFlush() {
        if (!this._enabled) {
          return;
        }
        var start = this._samplesStartTime;
        if (start == null) {
          DEBUG && console.debug("FillRateHelper: bail on deactivate with no start time");
          return;
        }
        if (this._info.sample_count < _minSampleCount) {
          this._resetData();
          return;
        }
        var total_time_spent = global.performance.now() - start;
        var info = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, this._info), {}, {
          total_time_spent
        });
        if (DEBUG) {
          var derived = {
            avg_blankness: this._info.pixels_blank / this._info.pixels_sampled,
            avg_speed: this._info.pixels_scrolled / (total_time_spent / 1e3),
            avg_speed_when_any_blank: this._info.any_blank_speed_sum / this._info.any_blank_count,
            any_blank_per_min: this._info.any_blank_count / (total_time_spent / 1e3 / 60),
            any_blank_time_frac: this._info.any_blank_ms / total_time_spent,
            mostly_blank_per_min: this._info.mostly_blank_count / (total_time_spent / 1e3 / 60),
            mostly_blank_time_frac: this._info.mostly_blank_ms / total_time_spent
          };
          for (var key in derived) {
            derived[key] = Math.round(1e3 * derived[key]) / 1e3;
          }
          console.debug("FillRateHelper deactivateAndFlush: ", {
            derived,
            info
          });
        }
        _listeners.forEach((listener) => listener(info));
        this._resetData();
      }
      computeBlankness(props, cellsAroundViewport, scrollMetrics) {
        if (!this._enabled || props.getItemCount(props.data) === 0 || cellsAroundViewport.last < cellsAroundViewport.first || this._samplesStartTime == null) {
          return 0;
        }
        var dOffset = scrollMetrics.dOffset, offset = scrollMetrics.offset, velocity = scrollMetrics.velocity, visibleLength = scrollMetrics.visibleLength;
        this._info.sample_count++;
        this._info.pixels_sampled += Math.round(visibleLength);
        this._info.pixels_scrolled += Math.round(Math.abs(dOffset));
        var scrollSpeed = Math.round(Math.abs(velocity) * 1e3);
        var now = global.performance.now();
        if (this._anyBlankStartTime != null) {
          this._info.any_blank_ms += now - this._anyBlankStartTime;
        }
        this._anyBlankStartTime = null;
        if (this._mostlyBlankStartTime != null) {
          this._info.mostly_blank_ms += now - this._mostlyBlankStartTime;
        }
        this._mostlyBlankStartTime = null;
        var blankTop = 0;
        var first = cellsAroundViewport.first;
        var firstFrame = this._getFrameMetrics(first, props);
        while (first <= cellsAroundViewport.last && (!firstFrame || !firstFrame.inLayout)) {
          firstFrame = this._getFrameMetrics(first, props);
          first++;
        }
        if (firstFrame && first > 0) {
          blankTop = Math.min(visibleLength, Math.max(0, firstFrame.offset - offset));
        }
        var blankBottom = 0;
        var last = cellsAroundViewport.last;
        var lastFrame = this._getFrameMetrics(last, props);
        while (last >= cellsAroundViewport.first && (!lastFrame || !lastFrame.inLayout)) {
          lastFrame = this._getFrameMetrics(last, props);
          last--;
        }
        if (lastFrame && last < props.getItemCount(props.data) - 1) {
          var bottomEdge = lastFrame.offset + lastFrame.length;
          blankBottom = Math.min(visibleLength, Math.max(0, offset + visibleLength - bottomEdge));
        }
        var pixels_blank = Math.round(blankTop + blankBottom);
        var blankness = pixels_blank / visibleLength;
        if (blankness > 0) {
          this._anyBlankStartTime = now;
          this._info.any_blank_speed_sum += scrollSpeed;
          this._info.any_blank_count++;
          this._info.pixels_blank += pixels_blank;
          if (blankness > 0.5) {
            this._mostlyBlankStartTime = now;
            this._info.mostly_blank_count++;
          }
        } else if (scrollSpeed < 0.01 || Math.abs(dOffset) < 1) {
          this.deactivateAndFlush();
        }
        return blankness;
      }
      enabled() {
        return this._enabled;
      }
      _resetData() {
        this._anyBlankStartTime = null;
        this._info = new Info();
        this._mostlyBlankStartTime = null;
        this._samplesStartTime = null;
      }
    };
    var _default = exports2.default = FillRateHelper;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/StateSafePureComponent.js
var require_StateSafePureComponent = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/StateSafePureComponent.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _invariant = _interopRequireDefault(require_invariant());
    var React24 = _interopRequireWildcard(require("react"));
    var StateSafePureComponent = class extends React24.PureComponent {
      static {
        __name(this, "StateSafePureComponent");
      }
      constructor(props) {
        super(props);
        this._inAsyncStateUpdate = false;
        this._installSetStateHooks();
      }
      setState(partialState, callback) {
        if (typeof partialState === "function") {
          super.setState((state, props) => {
            this._inAsyncStateUpdate = true;
            var ret;
            try {
              ret = partialState(state, props);
            } catch (err) {
              throw err;
            } finally {
              this._inAsyncStateUpdate = false;
            }
            return ret;
          }, callback);
        } else {
          super.setState(partialState, callback);
        }
      }
      _installSetStateHooks() {
        var that = this;
        var props = this.props, state = this.state;
        Object.defineProperty(this, "props", {
          get() {
            (0, _invariant.default)(!that._inAsyncStateUpdate, '"this.props" should not be accessed during state updates');
            return props;
          },
          set(newProps) {
            props = newProps;
          }
        });
        Object.defineProperty(this, "state", {
          get() {
            (0, _invariant.default)(!that._inAsyncStateUpdate, '"this.state" should not be acceessed during state updates');
            return state;
          },
          set(newState) {
            state = newState;
          }
        });
      }
    };
    exports2.default = StateSafePureComponent;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/ViewabilityHelper/index.js
var require_ViewabilityHelper = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/ViewabilityHelper/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _createForOfIteratorHelperLoose2 = _interopRequireDefault(require_createForOfIteratorHelperLoose());
    var _invariant = _interopRequireDefault(require_invariant());
    var ViewabilityHelper = class {
      static {
        __name(this, "ViewabilityHelper");
      }
      constructor(config) {
        if (config === void 0) {
          config = {
            viewAreaCoveragePercentThreshold: 0
          };
        }
        this._hasInteracted = false;
        this._timers = /* @__PURE__ */ new Set();
        this._viewableIndices = [];
        this._viewableItems = /* @__PURE__ */ new Map();
        this._config = config;
      }
      /**
       * Cleanup, e.g. on unmount. Clears any pending timers.
       */
      dispose() {
        this._timers.forEach(clearTimeout);
      }
      /**
       * Determines which items are viewable based on the current metrics and config.
       */
      computeViewableItems(props, scrollOffset, viewportHeight, getFrameMetrics, renderRange) {
        var itemCount = props.getItemCount(props.data);
        var _this$_config = this._config, itemVisiblePercentThreshold = _this$_config.itemVisiblePercentThreshold, viewAreaCoveragePercentThreshold = _this$_config.viewAreaCoveragePercentThreshold;
        var viewAreaMode = viewAreaCoveragePercentThreshold != null;
        var viewablePercentThreshold = viewAreaMode ? viewAreaCoveragePercentThreshold : itemVisiblePercentThreshold;
        (0, _invariant.default)(viewablePercentThreshold != null && itemVisiblePercentThreshold != null !== (viewAreaCoveragePercentThreshold != null), "Must set exactly one of itemVisiblePercentThreshold or viewAreaCoveragePercentThreshold");
        var viewableIndices = [];
        if (itemCount === 0) {
          return viewableIndices;
        }
        var firstVisible = -1;
        var _ref = renderRange || {
          first: 0,
          last: itemCount - 1
        }, first = _ref.first, last = _ref.last;
        if (last >= itemCount) {
          console.warn("Invalid render range computing viewability " + JSON.stringify({
            renderRange,
            itemCount
          }));
          return [];
        }
        for (var idx = first; idx <= last; idx++) {
          var metrics = getFrameMetrics(idx, props);
          if (!metrics) {
            continue;
          }
          var top = metrics.offset - scrollOffset;
          var bottom = top + metrics.length;
          if (top < viewportHeight && bottom > 0) {
            firstVisible = idx;
            if (_isViewable(viewAreaMode, viewablePercentThreshold, top, bottom, viewportHeight, metrics.length)) {
              viewableIndices.push(idx);
            }
          } else if (firstVisible >= 0) {
            break;
          }
        }
        return viewableIndices;
      }
      /**
       * Figures out which items are viewable and how that has changed from before and calls
       * `onViewableItemsChanged` as appropriate.
       */
      onUpdate(props, scrollOffset, viewportHeight, getFrameMetrics, createViewToken, onViewableItemsChanged, renderRange) {
        var itemCount = props.getItemCount(props.data);
        if (this._config.waitForInteraction && !this._hasInteracted || itemCount === 0 || !getFrameMetrics(0, props)) {
          return;
        }
        var viewableIndices = [];
        if (itemCount) {
          viewableIndices = this.computeViewableItems(props, scrollOffset, viewportHeight, getFrameMetrics, renderRange);
        }
        if (this._viewableIndices.length === viewableIndices.length && this._viewableIndices.every((v, ii) => v === viewableIndices[ii])) {
          return;
        }
        this._viewableIndices = viewableIndices;
        if (this._config.minimumViewTime) {
          var handle = setTimeout(() => {
            this._timers.delete(handle);
            this._onUpdateSync(props, viewableIndices, onViewableItemsChanged, createViewToken);
          }, this._config.minimumViewTime);
          this._timers.add(handle);
        } else {
          this._onUpdateSync(props, viewableIndices, onViewableItemsChanged, createViewToken);
        }
      }
      /**
       * clean-up cached _viewableIndices to evaluate changed items on next update
       */
      resetViewableIndices() {
        this._viewableIndices = [];
      }
      /**
       * Records that an interaction has happened even if there has been no scroll.
       */
      recordInteraction() {
        this._hasInteracted = true;
      }
      _onUpdateSync(props, viewableIndicesToCheck, onViewableItemsChanged, createViewToken) {
        viewableIndicesToCheck = viewableIndicesToCheck.filter((ii) => this._viewableIndices.includes(ii));
        var prevItems = this._viewableItems;
        var nextItems = new Map(viewableIndicesToCheck.map((ii) => {
          var viewable2 = createViewToken(ii, true, props);
          return [viewable2.key, viewable2];
        }));
        var changed = [];
        for (var _iterator = (0, _createForOfIteratorHelperLoose2.default)(nextItems), _step; !(_step = _iterator()).done; ) {
          var _step$value = _step.value, key = _step$value[0], viewable = _step$value[1];
          if (!prevItems.has(key)) {
            changed.push(viewable);
          }
        }
        for (var _iterator2 = (0, _createForOfIteratorHelperLoose2.default)(prevItems), _step2; !(_step2 = _iterator2()).done; ) {
          var _step2$value = _step2.value, _key = _step2$value[0], _viewable = _step2$value[1];
          if (!nextItems.has(_key)) {
            changed.push((0, _objectSpread2.default)((0, _objectSpread2.default)({}, _viewable), {}, {
              isViewable: false
            }));
          }
        }
        if (changed.length > 0) {
          this._viewableItems = nextItems;
          onViewableItemsChanged({
            viewableItems: Array.from(nextItems.values()),
            changed,
            viewabilityConfig: this._config
          });
        }
      }
    };
    function _isViewable(viewAreaMode, viewablePercentThreshold, top, bottom, viewportHeight, itemLength) {
      if (_isEntirelyVisible(top, bottom, viewportHeight)) {
        return true;
      } else {
        var pixels = _getPixelsVisible(top, bottom, viewportHeight);
        var percent = 100 * (viewAreaMode ? pixels / viewportHeight : pixels / itemLength);
        return percent >= viewablePercentThreshold;
      }
    }
    __name(_isViewable, "_isViewable");
    function _getPixelsVisible(top, bottom, viewportHeight) {
      var visibleHeight = Math.min(bottom, viewportHeight) - Math.max(top, 0);
      return Math.max(0, visibleHeight);
    }
    __name(_getPixelsVisible, "_getPixelsVisible");
    function _isEntirelyVisible(top, bottom, viewportHeight) {
      return top >= 0 && bottom <= viewportHeight && bottom > top;
    }
    __name(_isEntirelyVisible, "_isEntirelyVisible");
    var _default = exports2.default = ViewabilityHelper;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/VirtualizedListContext.js
var require_VirtualizedListContext = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/VirtualizedListContext.js"(exports2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.VirtualizedListCellContextProvider = VirtualizedListCellContextProvider;
    exports2.VirtualizedListContext = void 0;
    exports2.VirtualizedListContextProvider = VirtualizedListContextProvider;
    exports2.VirtualizedListContextResetter = VirtualizedListContextResetter;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _react = _interopRequireWildcard(require("react"));
    var React24 = _react;
    var __DEV__ = process.env.NODE_ENV !== "production";
    var VirtualizedListContext = exports2.VirtualizedListContext = /* @__PURE__ */ React24.createContext(null);
    if (__DEV__) {
      VirtualizedListContext.displayName = "VirtualizedListContext";
    }
    function VirtualizedListContextResetter(_ref) {
      var children = _ref.children;
      return /* @__PURE__ */ React24.createElement(VirtualizedListContext.Provider, {
        value: null
      }, children);
    }
    __name(VirtualizedListContextResetter, "VirtualizedListContextResetter");
    function VirtualizedListContextProvider(_ref2) {
      var children = _ref2.children, value = _ref2.value;
      var context = (0, _react.useMemo)(() => ({
        cellKey: null,
        getScrollMetrics: value.getScrollMetrics,
        horizontal: value.horizontal,
        getOutermostParentListRef: value.getOutermostParentListRef,
        registerAsNestedChild: value.registerAsNestedChild,
        unregisterAsNestedChild: value.unregisterAsNestedChild
      }), [value.getScrollMetrics, value.horizontal, value.getOutermostParentListRef, value.registerAsNestedChild, value.unregisterAsNestedChild]);
      return /* @__PURE__ */ React24.createElement(VirtualizedListContext.Provider, {
        value: context
      }, children);
    }
    __name(VirtualizedListContextProvider, "VirtualizedListContextProvider");
    function VirtualizedListCellContextProvider(_ref3) {
      var cellKey = _ref3.cellKey, children = _ref3.children;
      var currContext = (0, _react.useContext)(VirtualizedListContext);
      var context = (0, _react.useMemo)(() => currContext == null ? null : (0, _objectSpread2.default)((0, _objectSpread2.default)({}, currContext), {}, {
        cellKey
      }), [currContext, cellKey]);
      return /* @__PURE__ */ React24.createElement(VirtualizedListContext.Provider, {
        value: context
      }, children);
    }
    __name(VirtualizedListCellContextProvider, "VirtualizedListCellContextProvider");
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/VirtualizedListCellRenderer.js
var require_VirtualizedListCellRenderer = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/VirtualizedListCellRenderer.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _View = _interopRequireDefault(require_View());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _VirtualizedListContext = require_VirtualizedListContext();
    var _invariant = _interopRequireDefault(require_invariant());
    var React24 = _interopRequireWildcard(require("react"));
    var CellRenderer = class extends React24.Component {
      static {
        __name(this, "CellRenderer");
      }
      constructor() {
        super(...arguments);
        this.state = {
          separatorProps: {
            highlighted: false,
            leadingItem: this.props.item
          }
        };
        this._separators = {
          highlight: /* @__PURE__ */ __name(() => {
            var _this$props = this.props, cellKey = _this$props.cellKey, prevCellKey = _this$props.prevCellKey;
            this.props.onUpdateSeparators([cellKey, prevCellKey], {
              highlighted: true
            });
          }, "highlight"),
          unhighlight: /* @__PURE__ */ __name(() => {
            var _this$props2 = this.props, cellKey = _this$props2.cellKey, prevCellKey = _this$props2.prevCellKey;
            this.props.onUpdateSeparators([cellKey, prevCellKey], {
              highlighted: false
            });
          }, "unhighlight"),
          updateProps: /* @__PURE__ */ __name((select, newProps) => {
            var _this$props3 = this.props, cellKey = _this$props3.cellKey, prevCellKey = _this$props3.prevCellKey;
            this.props.onUpdateSeparators([select === "leading" ? prevCellKey : cellKey], newProps);
          }, "updateProps")
        };
        this._onLayout = (nativeEvent) => {
          this.props.onCellLayout && this.props.onCellLayout(nativeEvent, this.props.cellKey, this.props.index);
        };
      }
      static getDerivedStateFromProps(props, prevState) {
        return {
          separatorProps: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, prevState.separatorProps), {}, {
            leadingItem: props.item
          })
        };
      }
      // TODO: consider factoring separator stuff out of VirtualizedList into FlatList since it's not
      // reused by SectionList and we can keep VirtualizedList simpler.
      // $FlowFixMe[missing-local-annot]
      updateSeparatorProps(newProps) {
        this.setState((state) => ({
          separatorProps: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, state.separatorProps), newProps)
        }));
      }
      componentWillUnmount() {
        this.props.onUnmount(this.props.cellKey);
      }
      _renderElement(renderItem, ListItemComponent, item, index) {
        if (renderItem && ListItemComponent) {
          console.warn("VirtualizedList: Both ListItemComponent and renderItem props are present. ListItemComponent will take precedence over renderItem.");
        }
        if (ListItemComponent) {
          return /* @__PURE__ */ React24.createElement(ListItemComponent, {
            item,
            index,
            separators: this._separators
          });
        }
        if (renderItem) {
          return renderItem({
            item,
            index,
            separators: this._separators
          });
        }
        (0, _invariant.default)(false, "VirtualizedList: Either ListItemComponent or renderItem props are required but none were found.");
      }
      render() {
        var _this$props4 = this.props, CellRendererComponent = _this$props4.CellRendererComponent, ItemSeparatorComponent = _this$props4.ItemSeparatorComponent, ListItemComponent = _this$props4.ListItemComponent, cellKey = _this$props4.cellKey, horizontal = _this$props4.horizontal, item = _this$props4.item, index = _this$props4.index, inversionStyle = _this$props4.inversionStyle, onCellFocusCapture = _this$props4.onCellFocusCapture, onCellLayout = _this$props4.onCellLayout, renderItem = _this$props4.renderItem;
        var element = this._renderElement(renderItem, ListItemComponent, item, index);
        var itemSeparator = /* @__PURE__ */ React24.isValidElement(ItemSeparatorComponent) ? (
          // $FlowFixMe[incompatible-type]
          ItemSeparatorComponent
        ) : (
          // $FlowFixMe[incompatible-type]
          ItemSeparatorComponent && /* @__PURE__ */ React24.createElement(ItemSeparatorComponent, this.state.separatorProps)
        );
        var cellStyle = inversionStyle ? horizontal ? [styles.rowReverse, inversionStyle] : [styles.columnReverse, inversionStyle] : horizontal ? [styles.row, inversionStyle] : inversionStyle;
        var result = !CellRendererComponent ? /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({
          style: cellStyle,
          onFocusCapture: onCellFocusCapture
        }, onCellLayout && {
          onLayout: this._onLayout
        }), element, itemSeparator) : /* @__PURE__ */ React24.createElement(CellRendererComponent, (0, _extends2.default)({
          cellKey,
          index,
          item,
          style: cellStyle,
          onFocusCapture: onCellFocusCapture
        }, onCellLayout && {
          onLayout: this._onLayout
        }), element, itemSeparator);
        return /* @__PURE__ */ React24.createElement(_VirtualizedListContext.VirtualizedListCellContextProvider, {
          cellKey: this.props.cellKey
        }, result);
      }
    };
    exports2.default = CellRenderer;
    var styles = _StyleSheet.default.create({
      row: {
        flexDirection: "row"
      },
      rowReverse: {
        flexDirection: "row-reverse"
      },
      columnReverse: {
        flexDirection: "column-reverse"
      }
    });
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizeUtils/index.js
var require_VirtualizeUtils = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizeUtils/index.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.computeWindowedRenderLimits = computeWindowedRenderLimits;
    exports2.elementsThatOverlapOffsets = elementsThatOverlapOffsets;
    exports2.keyExtractor = keyExtractor;
    exports2.newRangeCount = newRangeCount;
    function elementsThatOverlapOffsets(offsets, props, getFrameMetrics, zoomScale) {
      if (zoomScale === void 0) {
        zoomScale = 1;
      }
      var itemCount = props.getItemCount(props.data);
      var result = [];
      for (var offsetIndex = 0; offsetIndex < offsets.length; offsetIndex++) {
        var currentOffset = offsets[offsetIndex];
        var left = 0;
        var right = itemCount - 1;
        while (left <= right) {
          var mid = left + (right - left >>> 1);
          var frame = getFrameMetrics(mid, props);
          var scaledOffsetStart = frame.offset * zoomScale;
          var scaledOffsetEnd = (frame.offset + frame.length) * zoomScale;
          if (mid === 0 && currentOffset < scaledOffsetStart || mid !== 0 && currentOffset <= scaledOffsetStart) {
            right = mid - 1;
          } else if (currentOffset > scaledOffsetEnd) {
            left = mid + 1;
          } else {
            result[offsetIndex] = mid;
            break;
          }
        }
      }
      return result;
    }
    __name(elementsThatOverlapOffsets, "elementsThatOverlapOffsets");
    function newRangeCount(prev, next) {
      return next.last - next.first + 1 - Math.max(0, 1 + Math.min(next.last, prev.last) - Math.max(next.first, prev.first));
    }
    __name(newRangeCount, "newRangeCount");
    function computeWindowedRenderLimits(props, maxToRenderPerBatch, windowSize, prev, getFrameMetricsApprox, scrollMetrics) {
      var itemCount = props.getItemCount(props.data);
      if (itemCount === 0) {
        return {
          first: 0,
          last: -1
        };
      }
      var offset = scrollMetrics.offset, velocity = scrollMetrics.velocity, visibleLength = scrollMetrics.visibleLength, _scrollMetrics$zoomSc = scrollMetrics.zoomScale, zoomScale = _scrollMetrics$zoomSc === void 0 ? 1 : _scrollMetrics$zoomSc;
      var visibleBegin = Math.max(0, offset);
      var visibleEnd = visibleBegin + visibleLength;
      var overscanLength = (windowSize - 1) * visibleLength;
      var leadFactor = 0.5;
      var fillPreference = velocity > 1 ? "after" : velocity < -1 ? "before" : "none";
      var overscanBegin = Math.max(0, visibleBegin - (1 - leadFactor) * overscanLength);
      var overscanEnd = Math.max(0, visibleEnd + leadFactor * overscanLength);
      var lastItemOffset = getFrameMetricsApprox(itemCount - 1, props).offset * zoomScale;
      if (lastItemOffset < overscanBegin) {
        return {
          first: Math.max(0, itemCount - 1 - maxToRenderPerBatch),
          last: itemCount - 1
        };
      }
      var _elementsThatOverlapO = elementsThatOverlapOffsets([overscanBegin, visibleBegin, visibleEnd, overscanEnd], props, getFrameMetricsApprox, zoomScale), overscanFirst = _elementsThatOverlapO[0], first = _elementsThatOverlapO[1], last = _elementsThatOverlapO[2], overscanLast = _elementsThatOverlapO[3];
      overscanFirst = overscanFirst == null ? 0 : overscanFirst;
      first = first == null ? Math.max(0, overscanFirst) : first;
      overscanLast = overscanLast == null ? itemCount - 1 : overscanLast;
      last = last == null ? Math.min(overscanLast, first + maxToRenderPerBatch - 1) : last;
      var visible = {
        first,
        last
      };
      var newCellCount = newRangeCount(prev, visible);
      while (true) {
        if (first <= overscanFirst && last >= overscanLast) {
          break;
        }
        var maxNewCells = newCellCount >= maxToRenderPerBatch;
        var firstWillAddMore = first <= prev.first || first > prev.last;
        var firstShouldIncrement = first > overscanFirst && (!maxNewCells || !firstWillAddMore);
        var lastWillAddMore = last >= prev.last || last < prev.first;
        var lastShouldIncrement = last < overscanLast && (!maxNewCells || !lastWillAddMore);
        if (maxNewCells && !firstShouldIncrement && !lastShouldIncrement) {
          break;
        }
        if (firstShouldIncrement && !(fillPreference === "after" && lastShouldIncrement && lastWillAddMore)) {
          if (firstWillAddMore) {
            newCellCount++;
          }
          first--;
        }
        if (lastShouldIncrement && !(fillPreference === "before" && firstShouldIncrement && firstWillAddMore)) {
          if (lastWillAddMore) {
            newCellCount++;
          }
          last++;
        }
      }
      if (!(last >= first && first >= 0 && last < itemCount && first >= overscanFirst && last <= overscanLast && first <= visible.first && last >= visible.last)) {
        throw new Error("Bad window calculation " + JSON.stringify({
          first,
          last,
          itemCount,
          overscanFirst,
          overscanLast,
          visible
        }));
      }
      return {
        first,
        last
      };
    }
    __name(computeWindowedRenderLimits, "computeWindowedRenderLimits");
    function keyExtractor(item, index) {
      if (typeof item === "object" && (item == null ? void 0 : item.key) != null) {
        return item.key;
      }
      if (typeof item === "object" && (item == null ? void 0 : item.id) != null) {
        return item.id;
      }
      return String(index);
    }
    __name(keyExtractor, "keyExtractor");
  }
});

// ../../node_modules/nullthrows/nullthrows.js
var require_nullthrows = __commonJS({
  "../../node_modules/nullthrows/nullthrows.js"(exports2, module2) {
    "use strict";
    function nullthrows(x, message) {
      if (x != null) {
        return x;
      }
      var error = new Error(message !== void 0 ? message : "Got unexpected " + x);
      error.framesToPop = 1;
      throw error;
    }
    __name(nullthrows, "nullthrows");
    module2.exports = nullthrows;
    module2.exports.default = nullthrows;
    Object.defineProperty(module2.exports, "__esModule", { value: true });
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/index.js
var require_VirtualizedList = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedList/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _createForOfIteratorHelperLoose2 = _interopRequireDefault(require_createForOfIteratorHelperLoose());
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _RefreshControl = _interopRequireDefault(require_RefreshControl());
    var _ScrollView = _interopRequireDefault(require_ScrollView());
    var _View = _interopRequireDefault(require_View());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _Batchinator = _interopRequireDefault(require_Batchinator());
    var _clamp = _interopRequireDefault(require_clamp());
    var _infoLog = _interopRequireDefault(require_infoLog());
    var _CellRenderMask = require_CellRenderMask();
    var _ChildListCollection = _interopRequireDefault(require_ChildListCollection());
    var _FillRateHelper = _interopRequireDefault(require_FillRateHelper());
    var _StateSafePureComponent = _interopRequireDefault(require_StateSafePureComponent());
    var _ViewabilityHelper = _interopRequireDefault(require_ViewabilityHelper());
    var _VirtualizedListCellRenderer = _interopRequireDefault(require_VirtualizedListCellRenderer());
    var _VirtualizedListContext = require_VirtualizedListContext();
    var _VirtualizeUtils = require_VirtualizeUtils();
    var _invariant = _interopRequireDefault(require_invariant());
    var _nullthrows = _interopRequireDefault(require_nullthrows());
    var React24 = _interopRequireWildcard(require("react"));
    var __DEV__ = process.env.NODE_ENV !== "production";
    var ON_EDGE_REACHED_EPSILON = 1e-3;
    var _usedIndexForKey = false;
    var _keylessItemComponentName = "";
    function horizontalOrDefault(horizontal) {
      return horizontal !== null && horizontal !== void 0 ? horizontal : false;
    }
    __name(horizontalOrDefault, "horizontalOrDefault");
    function initialNumToRenderOrDefault(initialNumToRender) {
      return initialNumToRender !== null && initialNumToRender !== void 0 ? initialNumToRender : 10;
    }
    __name(initialNumToRenderOrDefault, "initialNumToRenderOrDefault");
    function maxToRenderPerBatchOrDefault(maxToRenderPerBatch) {
      return maxToRenderPerBatch !== null && maxToRenderPerBatch !== void 0 ? maxToRenderPerBatch : 10;
    }
    __name(maxToRenderPerBatchOrDefault, "maxToRenderPerBatchOrDefault");
    function onStartReachedThresholdOrDefault(onStartReachedThreshold) {
      return onStartReachedThreshold !== null && onStartReachedThreshold !== void 0 ? onStartReachedThreshold : 2;
    }
    __name(onStartReachedThresholdOrDefault, "onStartReachedThresholdOrDefault");
    function onEndReachedThresholdOrDefault(onEndReachedThreshold) {
      return onEndReachedThreshold !== null && onEndReachedThreshold !== void 0 ? onEndReachedThreshold : 2;
    }
    __name(onEndReachedThresholdOrDefault, "onEndReachedThresholdOrDefault");
    function getScrollingThreshold(threshold, visibleLength) {
      return threshold * visibleLength / 2;
    }
    __name(getScrollingThreshold, "getScrollingThreshold");
    function scrollEventThrottleOrDefault(scrollEventThrottle) {
      return scrollEventThrottle !== null && scrollEventThrottle !== void 0 ? scrollEventThrottle : 50;
    }
    __name(scrollEventThrottleOrDefault, "scrollEventThrottleOrDefault");
    function windowSizeOrDefault(windowSize) {
      return windowSize !== null && windowSize !== void 0 ? windowSize : 21;
    }
    __name(windowSizeOrDefault, "windowSizeOrDefault");
    function findLastWhere(arr, predicate) {
      for (var i = arr.length - 1; i >= 0; i--) {
        if (predicate(arr[i])) {
          return arr[i];
        }
      }
      return null;
    }
    __name(findLastWhere, "findLastWhere");
    var VirtualizedList = class _VirtualizedList extends _StateSafePureComponent.default {
      static {
        __name(this, "VirtualizedList");
      }
      // scrollToEnd may be janky without getItemLayout prop
      scrollToEnd(params) {
        var animated = params ? params.animated : true;
        var veryLast = this.props.getItemCount(this.props.data) - 1;
        if (veryLast < 0) {
          return;
        }
        var frame = this.__getFrameMetricsApprox(veryLast, this.props);
        var offset = Math.max(0, frame.offset + frame.length + this._footerLength - this._scrollMetrics.visibleLength);
        if (this._scrollRef == null) {
          return;
        }
        if (this._scrollRef.scrollTo == null) {
          console.warn("No scrollTo method provided. This may be because you have two nested VirtualizedLists with the same orientation, or because you are using a custom component that does not implement scrollTo.");
          return;
        }
        this._scrollRef.scrollTo(horizontalOrDefault(this.props.horizontal) ? {
          x: offset,
          animated
        } : {
          y: offset,
          animated
        });
      }
      // scrollToIndex may be janky without getItemLayout prop
      scrollToIndex(params) {
        var _this$props = this.props, data = _this$props.data, horizontal = _this$props.horizontal, getItemCount = _this$props.getItemCount, getItemLayout = _this$props.getItemLayout, onScrollToIndexFailed = _this$props.onScrollToIndexFailed;
        var animated = params.animated, index = params.index, viewOffset = params.viewOffset, viewPosition = params.viewPosition;
        (0, _invariant.default)(index >= 0, "scrollToIndex out of range: requested index " + index + " but minimum is 0");
        (0, _invariant.default)(getItemCount(data) >= 1, "scrollToIndex out of range: item length " + getItemCount(data) + " but minimum is 1");
        (0, _invariant.default)(index < getItemCount(data), "scrollToIndex out of range: requested index " + index + " is out of 0 to " + (getItemCount(data) - 1));
        if (!getItemLayout && index > this._highestMeasuredFrameIndex) {
          (0, _invariant.default)(!!onScrollToIndexFailed, "scrollToIndex should be used in conjunction with getItemLayout or onScrollToIndexFailed, otherwise there is no way to know the location of offscreen indices or handle failures.");
          onScrollToIndexFailed({
            averageItemLength: this._averageCellLength,
            highestMeasuredFrameIndex: this._highestMeasuredFrameIndex,
            index
          });
          return;
        }
        var frame = this.__getFrameMetricsApprox(Math.floor(index), this.props);
        var offset = Math.max(0, this._getOffsetApprox(index, this.props) - (viewPosition || 0) * (this._scrollMetrics.visibleLength - frame.length)) - (viewOffset || 0);
        if (this._scrollRef == null) {
          return;
        }
        if (this._scrollRef.scrollTo == null) {
          console.warn("No scrollTo method provided. This may be because you have two nested VirtualizedLists with the same orientation, or because you are using a custom component that does not implement scrollTo.");
          return;
        }
        this._scrollRef.scrollTo(horizontal ? {
          x: offset,
          animated
        } : {
          y: offset,
          animated
        });
      }
      // scrollToItem may be janky without getItemLayout prop. Required linear scan through items -
      // use scrollToIndex instead if possible.
      scrollToItem(params) {
        var item = params.item;
        var _this$props2 = this.props, data = _this$props2.data, getItem = _this$props2.getItem, getItemCount = _this$props2.getItemCount;
        var itemCount = getItemCount(data);
        for (var _index = 0; _index < itemCount; _index++) {
          if (getItem(data, _index) === item) {
            this.scrollToIndex((0, _objectSpread2.default)((0, _objectSpread2.default)({}, params), {}, {
              index: _index
            }));
            break;
          }
        }
      }
      /**
       * Scroll to a specific content pixel offset in the list.
       *
       * Param `offset` expects the offset to scroll to.
       * In case of `horizontal` is true, the offset is the x-value,
       * in any other case the offset is the y-value.
       *
       * Param `animated` (`true` by default) defines whether the list
       * should do an animation while scrolling.
       */
      scrollToOffset(params) {
        var animated = params.animated, offset = params.offset;
        if (this._scrollRef == null) {
          return;
        }
        if (this._scrollRef.scrollTo == null) {
          console.warn("No scrollTo method provided. This may be because you have two nested VirtualizedLists with the same orientation, or because you are using a custom component that does not implement scrollTo.");
          return;
        }
        this._scrollRef.scrollTo(horizontalOrDefault(this.props.horizontal) ? {
          x: offset,
          animated
        } : {
          y: offset,
          animated
        });
      }
      recordInteraction() {
        this._nestedChildLists.forEach((childList) => {
          childList.recordInteraction();
        });
        this._viewabilityTuples.forEach((t) => {
          t.viewabilityHelper.recordInteraction();
        });
        this._updateViewableItems(this.props, this.state.cellsAroundViewport);
      }
      flashScrollIndicators() {
        if (this._scrollRef == null) {
          return;
        }
        this._scrollRef.flashScrollIndicators();
      }
      /**
       * Provides a handle to the underlying scroll responder.
       * Note that `this._scrollRef` might not be a `ScrollView`, so we
       * need to check that it responds to `getScrollResponder` before calling it.
       */
      getScrollResponder() {
        if (this._scrollRef && this._scrollRef.getScrollResponder) {
          return this._scrollRef.getScrollResponder();
        }
      }
      getScrollableNode() {
        if (this._scrollRef && this._scrollRef.getScrollableNode) {
          return this._scrollRef.getScrollableNode();
        } else {
          return this._scrollRef;
        }
      }
      getScrollRef() {
        if (this._scrollRef && this._scrollRef.getScrollRef) {
          return this._scrollRef.getScrollRef();
        } else {
          return this._scrollRef;
        }
      }
      _getCellKey() {
        var _this$context;
        return ((_this$context = this.context) == null ? void 0 : _this$context.cellKey) || "rootList";
      }
      // $FlowFixMe[missing-local-annot]
      hasMore() {
        return this._hasMore;
      }
      // $FlowFixMe[missing-local-annot]
      // REACT-NATIVE-WEB patch to preserve during future RN merges: Support inverted wheel scroller.
      constructor(_props) {
        var _this$props$updateCel;
        super(_props);
        this._getScrollMetrics = () => {
          return this._scrollMetrics;
        };
        this._getOutermostParentListRef = () => {
          if (this._isNestedWithSameOrientation()) {
            return this.context.getOutermostParentListRef();
          } else {
            return this;
          }
        };
        this._registerAsNestedChild = (childList) => {
          this._nestedChildLists.add(childList.ref, childList.cellKey);
          if (this._hasInteracted) {
            childList.ref.recordInteraction();
          }
        };
        this._unregisterAsNestedChild = (childList) => {
          this._nestedChildLists.remove(childList.ref);
        };
        this._onUpdateSeparators = (keys, newProps) => {
          keys.forEach((key) => {
            var ref = key != null && this._cellRefs[key];
            ref && ref.updateSeparatorProps(newProps);
          });
        };
        this._getSpacerKey = (isVertical) => isVertical ? "height" : "width";
        this._averageCellLength = 0;
        this._cellRefs = {};
        this._frames = {};
        this._footerLength = 0;
        this._hasTriggeredInitialScrollToIndex = false;
        this._hasInteracted = false;
        this._hasMore = false;
        this._hasWarned = {};
        this._headerLength = 0;
        this._hiPriInProgress = false;
        this._highestMeasuredFrameIndex = 0;
        this._indicesToKeys = /* @__PURE__ */ new Map();
        this._lastFocusedCellKey = null;
        this._nestedChildLists = new _ChildListCollection.default();
        this._offsetFromParentVirtualizedList = 0;
        this._prevParentOffset = 0;
        this._scrollMetrics = {
          contentLength: 0,
          dOffset: 0,
          dt: 10,
          offset: 0,
          timestamp: 0,
          velocity: 0,
          visibleLength: 0,
          zoomScale: 1
        };
        this._scrollRef = null;
        this._sentStartForContentLength = 0;
        this._sentEndForContentLength = 0;
        this._totalCellLength = 0;
        this._totalCellsMeasured = 0;
        this._viewabilityTuples = [];
        this._captureScrollRef = (ref) => {
          this._scrollRef = ref;
        };
        this._defaultRenderScrollComponent = (props) => {
          var onRefresh = props.onRefresh;
          if (this._isNestedWithSameOrientation()) {
            return /* @__PURE__ */ React24.createElement(_View.default, props);
          } else if (onRefresh) {
            var _props$refreshing;
            (0, _invariant.default)(typeof props.refreshing === "boolean", "`refreshing` prop must be set as a boolean in order to use `onRefresh`, but got `" + JSON.stringify((_props$refreshing = props.refreshing) !== null && _props$refreshing !== void 0 ? _props$refreshing : "undefined") + "`");
            return (
              // $FlowFixMe[prop-missing] Invalid prop usage
              // $FlowFixMe[incompatible-use]
              /* @__PURE__ */ React24.createElement(_ScrollView.default, (0, _extends2.default)({}, props, {
                refreshControl: props.refreshControl == null ? /* @__PURE__ */ React24.createElement(
                  _RefreshControl.default,
                  {
                    refreshing: props.refreshing,
                    onRefresh,
                    progressViewOffset: props.progressViewOffset
                  }
                ) : props.refreshControl
              }))
            );
          } else {
            return /* @__PURE__ */ React24.createElement(_ScrollView.default, props);
          }
        };
        this._onCellLayout = (e, cellKey, index) => {
          var layout = e.nativeEvent.layout;
          var next = {
            offset: this._selectOffset(layout),
            length: this._selectLength(layout),
            index,
            inLayout: true
          };
          var curr = this._frames[cellKey];
          if (!curr || next.offset !== curr.offset || next.length !== curr.length || index !== curr.index) {
            this._totalCellLength += next.length - (curr ? curr.length : 0);
            this._totalCellsMeasured += curr ? 0 : 1;
            this._averageCellLength = this._totalCellLength / this._totalCellsMeasured;
            this._frames[cellKey] = next;
            this._highestMeasuredFrameIndex = Math.max(this._highestMeasuredFrameIndex, index);
            this._scheduleCellsToRenderUpdate();
          } else {
            this._frames[cellKey].inLayout = true;
          }
          this._triggerRemeasureForChildListsInCell(cellKey);
          this._computeBlankness();
          this._updateViewableItems(this.props, this.state.cellsAroundViewport);
        };
        this._onCellUnmount = (cellKey) => {
          delete this._cellRefs[cellKey];
          var curr = this._frames[cellKey];
          if (curr) {
            this._frames[cellKey] = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, curr), {}, {
              inLayout: false
            });
          }
        };
        this._onLayout = (e) => {
          if (this._isNestedWithSameOrientation()) {
            this.measureLayoutRelativeToContainingList();
          } else {
            this._scrollMetrics.visibleLength = this._selectLength(e.nativeEvent.layout);
          }
          this.props.onLayout && this.props.onLayout(e);
          this._scheduleCellsToRenderUpdate();
          this._maybeCallOnEdgeReached();
        };
        this._onLayoutEmpty = (e) => {
          this.props.onLayout && this.props.onLayout(e);
        };
        this._onLayoutFooter = (e) => {
          this._triggerRemeasureForChildListsInCell(this._getFooterCellKey());
          this._footerLength = this._selectLength(e.nativeEvent.layout);
        };
        this._onLayoutHeader = (e) => {
          this._headerLength = this._selectLength(e.nativeEvent.layout);
        };
        this._onContentSizeChange = (width, height) => {
          if (width > 0 && height > 0 && this.props.initialScrollIndex != null && this.props.initialScrollIndex > 0 && !this._hasTriggeredInitialScrollToIndex) {
            if (this.props.contentOffset == null) {
              if (this.props.initialScrollIndex < this.props.getItemCount(this.props.data)) {
                this.scrollToIndex({
                  animated: false,
                  index: (0, _nullthrows.default)(this.props.initialScrollIndex)
                });
              } else {
                this.scrollToEnd({
                  animated: false
                });
              }
            }
            this._hasTriggeredInitialScrollToIndex = true;
          }
          if (this.props.onContentSizeChange) {
            this.props.onContentSizeChange(width, height);
          }
          this._scrollMetrics.contentLength = this._selectLength({
            height,
            width
          });
          this._scheduleCellsToRenderUpdate();
          this._maybeCallOnEdgeReached();
        };
        this._convertParentScrollMetrics = (metrics) => {
          var offset = metrics.offset - this._offsetFromParentVirtualizedList;
          var visibleLength = metrics.visibleLength;
          var dOffset = offset - this._scrollMetrics.offset;
          var contentLength = this._scrollMetrics.contentLength;
          return {
            visibleLength,
            contentLength,
            offset,
            dOffset
          };
        };
        this._onScroll = (e) => {
          this._nestedChildLists.forEach((childList) => {
            childList._onScroll(e);
          });
          if (this.props.onScroll) {
            this.props.onScroll(e);
          }
          var timestamp = e.timeStamp;
          var visibleLength = this._selectLength(e.nativeEvent.layoutMeasurement);
          var contentLength = this._selectLength(e.nativeEvent.contentSize);
          var offset = this._selectOffset(e.nativeEvent.contentOffset);
          var dOffset = offset - this._scrollMetrics.offset;
          if (this._isNestedWithSameOrientation()) {
            if (this._scrollMetrics.contentLength === 0) {
              return;
            }
            var _this$_convertParentS = this._convertParentScrollMetrics({
              visibleLength,
              offset
            });
            visibleLength = _this$_convertParentS.visibleLength;
            contentLength = _this$_convertParentS.contentLength;
            offset = _this$_convertParentS.offset;
            dOffset = _this$_convertParentS.dOffset;
          }
          var dt = this._scrollMetrics.timestamp ? Math.max(1, timestamp - this._scrollMetrics.timestamp) : 1;
          var velocity = dOffset / dt;
          if (dt > 500 && this._scrollMetrics.dt > 500 && contentLength > 5 * visibleLength && !this._hasWarned.perf) {
            (0, _infoLog.default)("VirtualizedList: You have a large list that is slow to update - make sure your renderItem function renders components that follow React performance best practices like PureComponent, shouldComponentUpdate, etc.", {
              dt,
              prevDt: this._scrollMetrics.dt,
              contentLength
            });
            this._hasWarned.perf = true;
          }
          var zoomScale = e.nativeEvent.zoomScale < 0 ? 1 : e.nativeEvent.zoomScale;
          this._scrollMetrics = {
            contentLength,
            dt,
            dOffset,
            offset,
            timestamp,
            velocity,
            visibleLength,
            zoomScale
          };
          this._updateViewableItems(this.props, this.state.cellsAroundViewport);
          if (!this.props) {
            return;
          }
          this._maybeCallOnEdgeReached();
          if (velocity !== 0) {
            this._fillRateHelper.activate();
          }
          this._computeBlankness();
          this._scheduleCellsToRenderUpdate();
        };
        this._onScrollBeginDrag = (e) => {
          this._nestedChildLists.forEach((childList) => {
            childList._onScrollBeginDrag(e);
          });
          this._viewabilityTuples.forEach((tuple) => {
            tuple.viewabilityHelper.recordInteraction();
          });
          this._hasInteracted = true;
          this.props.onScrollBeginDrag && this.props.onScrollBeginDrag(e);
        };
        this._onScrollEndDrag = (e) => {
          this._nestedChildLists.forEach((childList) => {
            childList._onScrollEndDrag(e);
          });
          var velocity = e.nativeEvent.velocity;
          if (velocity) {
            this._scrollMetrics.velocity = this._selectOffset(velocity);
          }
          this._computeBlankness();
          this.props.onScrollEndDrag && this.props.onScrollEndDrag(e);
        };
        this._onMomentumScrollBegin = (e) => {
          this._nestedChildLists.forEach((childList) => {
            childList._onMomentumScrollBegin(e);
          });
          this.props.onMomentumScrollBegin && this.props.onMomentumScrollBegin(e);
        };
        this._onMomentumScrollEnd = (e) => {
          this._nestedChildLists.forEach((childList) => {
            childList._onMomentumScrollEnd(e);
          });
          this._scrollMetrics.velocity = 0;
          this._computeBlankness();
          this.props.onMomentumScrollEnd && this.props.onMomentumScrollEnd(e);
        };
        this._updateCellsToRender = () => {
          this._updateViewableItems(this.props, this.state.cellsAroundViewport);
          this.setState((state, props) => {
            var cellsAroundViewport = this._adjustCellsAroundViewport(props, state.cellsAroundViewport);
            var renderMask = _VirtualizedList._createRenderMask(props, cellsAroundViewport, this._getNonViewportRenderRegions(props));
            if (cellsAroundViewport.first === state.cellsAroundViewport.first && cellsAroundViewport.last === state.cellsAroundViewport.last && renderMask.equals(state.renderMask)) {
              return null;
            }
            return {
              cellsAroundViewport,
              renderMask
            };
          });
        };
        this._createViewToken = (index, isViewable, props) => {
          var data = props.data, getItem = props.getItem;
          var item = getItem(data, index);
          return {
            index,
            item,
            key: this._keyExtractor(item, index, props),
            isViewable
          };
        };
        this._getOffsetApprox = (index, props) => {
          if (Number.isInteger(index)) {
            return this.__getFrameMetricsApprox(index, props).offset;
          } else {
            var frameMetrics = this.__getFrameMetricsApprox(Math.floor(index), props);
            var remainder = index - Math.floor(index);
            return frameMetrics.offset + remainder * frameMetrics.length;
          }
        };
        this.__getFrameMetricsApprox = (index, props) => {
          var frame = this._getFrameMetrics(index, props);
          if (frame && frame.index === index) {
            return frame;
          } else {
            var data = props.data, getItemCount = props.getItemCount, getItemLayout = props.getItemLayout;
            (0, _invariant.default)(index >= 0 && index < getItemCount(data), "Tried to get frame for out of range index " + index);
            (0, _invariant.default)(!getItemLayout, "Should not have to estimate frames when a measurement metrics function is provided");
            return {
              length: this._averageCellLength,
              offset: this._averageCellLength * index
            };
          }
        };
        this._getFrameMetrics = (index, props) => {
          var data = props.data, getItem = props.getItem, getItemCount = props.getItemCount, getItemLayout = props.getItemLayout;
          (0, _invariant.default)(index >= 0 && index < getItemCount(data), "Tried to get frame for out of range index " + index);
          var item = getItem(data, index);
          var frame = this._frames[this._keyExtractor(item, index, props)];
          if (!frame || frame.index !== index) {
            if (getItemLayout) {
              return getItemLayout(data, index);
            }
          }
          return frame;
        };
        this._getNonViewportRenderRegions = (props) => {
          if (!(this._lastFocusedCellKey && this._cellRefs[this._lastFocusedCellKey])) {
            return [];
          }
          var lastFocusedCellRenderer = this._cellRefs[this._lastFocusedCellKey];
          var focusedCellIndex = lastFocusedCellRenderer.props.index;
          var itemCount = props.getItemCount(props.data);
          if (focusedCellIndex >= itemCount || this._keyExtractor(props.getItem(props.data, focusedCellIndex), focusedCellIndex, props) !== this._lastFocusedCellKey) {
            return [];
          }
          var first = focusedCellIndex;
          var heightOfCellsBeforeFocused = 0;
          for (var i = first - 1; i >= 0 && heightOfCellsBeforeFocused < this._scrollMetrics.visibleLength; i--) {
            first--;
            heightOfCellsBeforeFocused += this.__getFrameMetricsApprox(i, props).length;
          }
          var last = focusedCellIndex;
          var heightOfCellsAfterFocused = 0;
          for (var _i = last + 1; _i < itemCount && heightOfCellsAfterFocused < this._scrollMetrics.visibleLength; _i++) {
            last++;
            heightOfCellsAfterFocused += this.__getFrameMetricsApprox(_i, props).length;
          }
          return [{
            first,
            last
          }];
        };
        this._checkProps(_props);
        this._fillRateHelper = new _FillRateHelper.default(this._getFrameMetrics);
        this._updateCellsToRenderBatcher = new _Batchinator.default(this._updateCellsToRender, (_this$props$updateCel = this.props.updateCellsBatchingPeriod) !== null && _this$props$updateCel !== void 0 ? _this$props$updateCel : 50);
        if (this.props.viewabilityConfigCallbackPairs) {
          this._viewabilityTuples = this.props.viewabilityConfigCallbackPairs.map((pair) => ({
            viewabilityHelper: new _ViewabilityHelper.default(pair.viewabilityConfig),
            onViewableItemsChanged: pair.onViewableItemsChanged
          }));
        } else {
          var _this$props3 = this.props, onViewableItemsChanged = _this$props3.onViewableItemsChanged, viewabilityConfig = _this$props3.viewabilityConfig;
          if (onViewableItemsChanged) {
            this._viewabilityTuples.push({
              viewabilityHelper: new _ViewabilityHelper.default(viewabilityConfig),
              onViewableItemsChanged
            });
          }
        }
        var initialRenderRegion = _VirtualizedList._initialRenderRegion(_props);
        this.state = {
          cellsAroundViewport: initialRenderRegion,
          renderMask: _VirtualizedList._createRenderMask(_props, initialRenderRegion)
        };
        this.invertedWheelEventHandler = (ev) => {
          var scrollOffset = this.props.horizontal ? ev.target.scrollLeft : ev.target.scrollTop;
          var scrollLength = this.props.horizontal ? ev.target.scrollWidth : ev.target.scrollHeight;
          var clientLength = this.props.horizontal ? ev.target.clientWidth : ev.target.clientHeight;
          var isEventTargetScrollable = scrollLength > clientLength;
          var delta = this.props.horizontal ? ev.deltaX || ev.wheelDeltaX : ev.deltaY || ev.wheelDeltaY;
          var leftoverDelta = delta;
          if (isEventTargetScrollable) {
            leftoverDelta = delta < 0 ? Math.min(delta + scrollOffset, 0) : Math.max(delta - (scrollLength - clientLength - scrollOffset), 0);
          }
          var targetDelta = delta - leftoverDelta;
          if (this.props.inverted && this._scrollRef && this._scrollRef.getScrollableNode) {
            var node = this._scrollRef.getScrollableNode();
            if (this.props.horizontal) {
              ev.target.scrollLeft += targetDelta;
              var nextScrollLeft = node.scrollLeft - leftoverDelta;
              node.scrollLeft = !this.props.getItemLayout ? Math.min(nextScrollLeft, this._totalCellLength) : nextScrollLeft;
            } else {
              ev.target.scrollTop += targetDelta;
              var nextScrollTop = node.scrollTop - leftoverDelta;
              node.scrollTop = !this.props.getItemLayout ? Math.min(nextScrollTop, this._totalCellLength) : nextScrollTop;
            }
            ev.preventDefault();
          }
        };
      }
      _checkProps(props) {
        var onScroll = props.onScroll, windowSize = props.windowSize, getItemCount = props.getItemCount, data = props.data, initialScrollIndex = props.initialScrollIndex;
        (0, _invariant.default)(
          // $FlowFixMe[prop-missing]
          !onScroll || !onScroll.__isNative,
          "Components based on VirtualizedList must be wrapped with Animated.createAnimatedComponent to support native onScroll events with useNativeDriver"
        );
        (0, _invariant.default)(windowSizeOrDefault(windowSize) > 0, "VirtualizedList: The windowSize prop must be present and set to a value greater than 0.");
        (0, _invariant.default)(getItemCount, 'VirtualizedList: The "getItemCount" prop must be provided');
        var itemCount = getItemCount(data);
        if (initialScrollIndex != null && !this._hasTriggeredInitialScrollToIndex && (initialScrollIndex < 0 || itemCount > 0 && initialScrollIndex >= itemCount) && !this._hasWarned.initialScrollIndex) {
          console.warn('initialScrollIndex "' + initialScrollIndex + '" is not valid (list has ' + itemCount + " items)");
          this._hasWarned.initialScrollIndex = true;
        }
        if (__DEV__ && !this._hasWarned.flexWrap) {
          var flatStyles = _StyleSheet.default.flatten(this.props.contentContainerStyle);
          if (flatStyles != null && flatStyles.flexWrap === "wrap") {
            console.warn("`flexWrap: `wrap`` is not supported with the `VirtualizedList` components.Consider using `numColumns` with `FlatList` instead.");
            this._hasWarned.flexWrap = true;
          }
        }
      }
      static _createRenderMask(props, cellsAroundViewport, additionalRegions) {
        var itemCount = props.getItemCount(props.data);
        (0, _invariant.default)(cellsAroundViewport.first >= 0 && cellsAroundViewport.last >= cellsAroundViewport.first - 1 && cellsAroundViewport.last < itemCount, 'Invalid cells around viewport "[' + cellsAroundViewport.first + ", " + cellsAroundViewport.last + ']" was passed to VirtualizedList._createRenderMask');
        var renderMask = new _CellRenderMask.CellRenderMask(itemCount);
        if (itemCount > 0) {
          var allRegions = [cellsAroundViewport, ...additionalRegions !== null && additionalRegions !== void 0 ? additionalRegions : []];
          for (var _i2 = 0, _allRegions = allRegions; _i2 < _allRegions.length; _i2++) {
            var region = _allRegions[_i2];
            renderMask.addCells(region);
          }
          if (props.initialScrollIndex == null || props.initialScrollIndex <= 0) {
            var initialRegion = _VirtualizedList._initialRenderRegion(props);
            renderMask.addCells(initialRegion);
          }
          var stickyIndicesSet = new Set(props.stickyHeaderIndices);
          _VirtualizedList._ensureClosestStickyHeader(props, stickyIndicesSet, renderMask, cellsAroundViewport.first);
        }
        return renderMask;
      }
      static _initialRenderRegion(props) {
        var _props$initialScrollI;
        var itemCount = props.getItemCount(props.data);
        var firstCellIndex = Math.max(0, Math.min(itemCount - 1, Math.floor((_props$initialScrollI = props.initialScrollIndex) !== null && _props$initialScrollI !== void 0 ? _props$initialScrollI : 0)));
        var lastCellIndex = Math.min(itemCount, firstCellIndex + initialNumToRenderOrDefault(props.initialNumToRender)) - 1;
        return {
          first: firstCellIndex,
          last: lastCellIndex
        };
      }
      static _ensureClosestStickyHeader(props, stickyIndicesSet, renderMask, cellIdx) {
        var stickyOffset = props.ListHeaderComponent ? 1 : 0;
        for (var itemIdx = cellIdx - 1; itemIdx >= 0; itemIdx--) {
          if (stickyIndicesSet.has(itemIdx + stickyOffset)) {
            renderMask.addCells({
              first: itemIdx,
              last: itemIdx
            });
            break;
          }
        }
      }
      _adjustCellsAroundViewport(props, cellsAroundViewport) {
        var data = props.data, getItemCount = props.getItemCount;
        var onEndReachedThreshold = onEndReachedThresholdOrDefault(props.onEndReachedThreshold);
        var _this$_scrollMetrics = this._scrollMetrics, contentLength = _this$_scrollMetrics.contentLength, offset = _this$_scrollMetrics.offset, visibleLength = _this$_scrollMetrics.visibleLength;
        var distanceFromEnd = contentLength - visibleLength - offset;
        if (visibleLength <= 0 || contentLength <= 0) {
          return cellsAroundViewport.last >= getItemCount(data) ? _VirtualizedList._constrainToItemCount(cellsAroundViewport, props) : cellsAroundViewport;
        }
        var newCellsAroundViewport;
        if (props.disableVirtualization) {
          var renderAhead = distanceFromEnd < onEndReachedThreshold * visibleLength ? maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch) : 0;
          newCellsAroundViewport = {
            first: 0,
            last: Math.min(cellsAroundViewport.last + renderAhead, getItemCount(data) - 1)
          };
        } else {
          if (props.initialScrollIndex && !this._scrollMetrics.offset && Math.abs(distanceFromEnd) >= Number.EPSILON) {
            return cellsAroundViewport.last >= getItemCount(data) ? _VirtualizedList._constrainToItemCount(cellsAroundViewport, props) : cellsAroundViewport;
          }
          newCellsAroundViewport = (0, _VirtualizeUtils.computeWindowedRenderLimits)(props, maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch), windowSizeOrDefault(props.windowSize), cellsAroundViewport, this.__getFrameMetricsApprox, this._scrollMetrics);
          (0, _invariant.default)(newCellsAroundViewport.last < getItemCount(data), "computeWindowedRenderLimits() should return range in-bounds");
        }
        if (this._nestedChildLists.size() > 0) {
          var childIdx = this._findFirstChildWithMore(newCellsAroundViewport.first, newCellsAroundViewport.last);
          newCellsAroundViewport.last = childIdx !== null && childIdx !== void 0 ? childIdx : newCellsAroundViewport.last;
        }
        return newCellsAroundViewport;
      }
      _findFirstChildWithMore(first, last) {
        for (var ii = first; ii <= last; ii++) {
          var cellKeyForIndex = this._indicesToKeys.get(ii);
          if (cellKeyForIndex != null && this._nestedChildLists.anyInCell(cellKeyForIndex, (childList) => childList.hasMore())) {
            return ii;
          }
        }
        return null;
      }
      componentDidMount() {
        if (this._isNestedWithSameOrientation()) {
          this.context.registerAsNestedChild({
            ref: this,
            cellKey: this.context.cellKey
          });
        }
        this.setupWebWheelHandler();
      }
      componentWillUnmount() {
        if (this._isNestedWithSameOrientation()) {
          this.context.unregisterAsNestedChild({
            ref: this
          });
        }
        this._updateCellsToRenderBatcher.dispose({
          abort: true
        });
        this._viewabilityTuples.forEach((tuple) => {
          tuple.viewabilityHelper.dispose();
        });
        this._fillRateHelper.deactivateAndFlush();
        this.teardownWebWheelHandler();
      }
      // REACT-NATIVE-WEB patch to preserve during future RN merges: Support inverted wheel scroller.
      setupWebWheelHandler() {
        if (this._scrollRef && this._scrollRef.getScrollableNode) {
          this._scrollRef.getScrollableNode().addEventListener("wheel", this.invertedWheelEventHandler);
        } else {
          setTimeout(() => this.setupWebWheelHandler(), 50);
          return;
        }
      }
      // REACT-NATIVE-WEB patch to preserve during future RN merges: Support inverted wheel scroller.
      teardownWebWheelHandler() {
        if (this._scrollRef && this._scrollRef.getScrollableNode) {
          this._scrollRef.getScrollableNode().removeEventListener("wheel", this.invertedWheelEventHandler);
        }
      }
      static getDerivedStateFromProps(newProps, prevState) {
        var itemCount = newProps.getItemCount(newProps.data);
        if (itemCount === prevState.renderMask.numCells()) {
          return prevState;
        }
        var constrainedCells = _VirtualizedList._constrainToItemCount(prevState.cellsAroundViewport, newProps);
        return {
          cellsAroundViewport: constrainedCells,
          renderMask: _VirtualizedList._createRenderMask(newProps, constrainedCells)
        };
      }
      _pushCells(cells, stickyHeaderIndices, stickyIndicesFromProps, first, last, inversionStyle) {
        var _this = this;
        var _this$props4 = this.props, CellRendererComponent = _this$props4.CellRendererComponent, ItemSeparatorComponent = _this$props4.ItemSeparatorComponent, ListHeaderComponent = _this$props4.ListHeaderComponent, ListItemComponent = _this$props4.ListItemComponent, data = _this$props4.data, debug = _this$props4.debug, getItem = _this$props4.getItem, getItemCount = _this$props4.getItemCount, getItemLayout = _this$props4.getItemLayout, horizontal = _this$props4.horizontal, renderItem = _this$props4.renderItem;
        var stickyOffset = ListHeaderComponent ? 1 : 0;
        var end = getItemCount(data) - 1;
        var prevCellKey;
        last = Math.min(end, last);
        var _loop = /* @__PURE__ */ __name(function _loop2() {
          var item = getItem(data, ii);
          var key = _this._keyExtractor(item, ii, _this.props);
          _this._indicesToKeys.set(ii, key);
          if (stickyIndicesFromProps.has(ii + stickyOffset)) {
            stickyHeaderIndices.push(cells.length);
          }
          var shouldListenForLayout = getItemLayout == null || debug || _this._fillRateHelper.enabled();
          cells.push(/* @__PURE__ */ React24.createElement(_VirtualizedListCellRenderer.default, (0, _extends2.default)({
            CellRendererComponent,
            ItemSeparatorComponent: ii < end ? ItemSeparatorComponent : void 0,
            ListItemComponent,
            cellKey: key,
            horizontal,
            index: ii,
            inversionStyle,
            item,
            key,
            prevCellKey,
            onUpdateSeparators: _this._onUpdateSeparators,
            onCellFocusCapture: /* @__PURE__ */ __name((e) => _this._onCellFocusCapture(key), "onCellFocusCapture"),
            onUnmount: _this._onCellUnmount,
            ref: /* @__PURE__ */ __name((_ref) => {
              _this._cellRefs[key] = _ref;
            }, "ref"),
            renderItem
          }, shouldListenForLayout && {
            onCellLayout: _this._onCellLayout
          })));
          prevCellKey = key;
        }, "_loop");
        for (var ii = first; ii <= last; ii++) {
          _loop();
        }
      }
      static _constrainToItemCount(cells, props) {
        var itemCount = props.getItemCount(props.data);
        var last = Math.min(itemCount - 1, cells.last);
        var maxToRenderPerBatch = maxToRenderPerBatchOrDefault(props.maxToRenderPerBatch);
        return {
          first: (0, _clamp.default)(0, itemCount - 1 - maxToRenderPerBatch, cells.first),
          last
        };
      }
      _isNestedWithSameOrientation() {
        var nestedContext = this.context;
        return !!(nestedContext && !!nestedContext.horizontal === horizontalOrDefault(this.props.horizontal));
      }
      _keyExtractor(item, index, props) {
        if (props.keyExtractor != null) {
          return props.keyExtractor(item, index);
        }
        var key = (0, _VirtualizeUtils.keyExtractor)(item, index);
        if (key === String(index)) {
          _usedIndexForKey = true;
          if (item.type && item.type.displayName) {
            _keylessItemComponentName = item.type.displayName;
          }
        }
        return key;
      }
      render() {
        this._checkProps(this.props);
        var _this$props5 = this.props, ListEmptyComponent = _this$props5.ListEmptyComponent, ListFooterComponent = _this$props5.ListFooterComponent, ListHeaderComponent = _this$props5.ListHeaderComponent;
        var _this$props6 = this.props, data = _this$props6.data, horizontal = _this$props6.horizontal;
        var inversionStyle = this.props.inverted ? horizontalOrDefault(this.props.horizontal) ? styles.horizontallyInverted : styles.verticallyInverted : null;
        var cells = [];
        var stickyIndicesFromProps = new Set(this.props.stickyHeaderIndices);
        var stickyHeaderIndices = [];
        if (ListHeaderComponent) {
          if (stickyIndicesFromProps.has(0)) {
            stickyHeaderIndices.push(0);
          }
          var _element = /* @__PURE__ */ React24.isValidElement(ListHeaderComponent) ? ListHeaderComponent : (
            // $FlowFixMe[not-a-component]
            // $FlowFixMe[incompatible-type-arg]
            /* @__PURE__ */ React24.createElement(ListHeaderComponent, null)
          );
          cells.push(/* @__PURE__ */ React24.createElement(_VirtualizedListContext.VirtualizedListCellContextProvider, {
            cellKey: this._getCellKey() + "-header",
            key: "$header"
          }, /* @__PURE__ */ React24.createElement(
            _View.default,
            {
              onLayout: this._onLayoutHeader,
              style: [inversionStyle, this.props.ListHeaderComponentStyle]
            },
            // $FlowFixMe[incompatible-type] - Typing ReactNativeComponent revealed errors
            _element
          )));
        }
        var itemCount = this.props.getItemCount(data);
        if (itemCount === 0 && ListEmptyComponent) {
          var _element2 = /* @__PURE__ */ React24.isValidElement(ListEmptyComponent) ? ListEmptyComponent : (
            // $FlowFixMe[not-a-component]
            // $FlowFixMe[incompatible-type-arg]
            /* @__PURE__ */ React24.createElement(ListEmptyComponent, null)
          );
          cells.push(/* @__PURE__ */ React24.createElement(_VirtualizedListContext.VirtualizedListCellContextProvider, {
            cellKey: this._getCellKey() + "-empty",
            key: "$empty"
          }, /* @__PURE__ */ React24.cloneElement(_element2, {
            onLayout: /* @__PURE__ */ __name((event) => {
              this._onLayoutEmpty(event);
              if (_element2.props.onLayout) {
                _element2.props.onLayout(event);
              }
            }, "onLayout"),
            style: [inversionStyle, _element2.props.style]
          })));
        }
        if (itemCount > 0) {
          _usedIndexForKey = false;
          _keylessItemComponentName = "";
          var spacerKey = this._getSpacerKey(!horizontal);
          var renderRegions = this.state.renderMask.enumerateRegions();
          var lastSpacer = findLastWhere(renderRegions, (r) => r.isSpacer);
          for (var _iterator = (0, _createForOfIteratorHelperLoose2.default)(renderRegions), _step; !(_step = _iterator()).done; ) {
            var section = _step.value;
            if (section.isSpacer) {
              if (this.props.disableVirtualization) {
                continue;
              }
              var isLastSpacer = section === lastSpacer;
              var constrainToMeasured = isLastSpacer && !this.props.getItemLayout;
              var last = constrainToMeasured ? (0, _clamp.default)(section.first - 1, section.last, this._highestMeasuredFrameIndex) : section.last;
              var firstMetrics = this.__getFrameMetricsApprox(section.first, this.props);
              var lastMetrics = this.__getFrameMetricsApprox(last, this.props);
              var spacerSize = lastMetrics.offset + lastMetrics.length - firstMetrics.offset;
              cells.push(/* @__PURE__ */ React24.createElement(_View.default, {
                key: "$spacer-" + section.first,
                style: {
                  [spacerKey]: spacerSize
                }
              }));
            } else {
              this._pushCells(cells, stickyHeaderIndices, stickyIndicesFromProps, section.first, section.last, inversionStyle);
            }
          }
          if (!this._hasWarned.keys && _usedIndexForKey) {
            console.warn("VirtualizedList: missing keys for items, make sure to specify a key or id property on each item or provide a custom keyExtractor.", _keylessItemComponentName);
            this._hasWarned.keys = true;
          }
        }
        if (ListFooterComponent) {
          var _element3 = /* @__PURE__ */ React24.isValidElement(ListFooterComponent) ? ListFooterComponent : (
            // $FlowFixMe[not-a-component]
            // $FlowFixMe[incompatible-type-arg]
            /* @__PURE__ */ React24.createElement(ListFooterComponent, null)
          );
          cells.push(/* @__PURE__ */ React24.createElement(_VirtualizedListContext.VirtualizedListCellContextProvider, {
            cellKey: this._getFooterCellKey(),
            key: "$footer"
          }, /* @__PURE__ */ React24.createElement(
            _View.default,
            {
              onLayout: this._onLayoutFooter,
              style: [inversionStyle, this.props.ListFooterComponentStyle]
            },
            // $FlowFixMe[incompatible-type] - Typing ReactNativeComponent revealed errors
            _element3
          )));
        }
        var scrollProps = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, this.props), {}, {
          onContentSizeChange: this._onContentSizeChange,
          onLayout: this._onLayout,
          onScroll: this._onScroll,
          onScrollBeginDrag: this._onScrollBeginDrag,
          onScrollEndDrag: this._onScrollEndDrag,
          onMomentumScrollBegin: this._onMomentumScrollBegin,
          onMomentumScrollEnd: this._onMomentumScrollEnd,
          scrollEventThrottle: scrollEventThrottleOrDefault(this.props.scrollEventThrottle),
          // TODO: Android support
          invertStickyHeaders: this.props.invertStickyHeaders !== void 0 ? this.props.invertStickyHeaders : this.props.inverted,
          stickyHeaderIndices,
          style: inversionStyle ? [inversionStyle, this.props.style] : this.props.style
        });
        this._hasMore = this.state.cellsAroundViewport.last < itemCount - 1;
        var innerRet = /* @__PURE__ */ React24.createElement(_VirtualizedListContext.VirtualizedListContextProvider, {
          value: {
            cellKey: null,
            getScrollMetrics: this._getScrollMetrics,
            horizontal: horizontalOrDefault(this.props.horizontal),
            getOutermostParentListRef: this._getOutermostParentListRef,
            registerAsNestedChild: this._registerAsNestedChild,
            unregisterAsNestedChild: this._unregisterAsNestedChild
          }
        }, /* @__PURE__ */ React24.cloneElement((this.props.renderScrollComponent || this._defaultRenderScrollComponent)(scrollProps), {
          ref: this._captureScrollRef
        }, cells));
        var ret = innerRet;
        if (this.props.debug) {
          return /* @__PURE__ */ React24.createElement(_View.default, {
            style: styles.debug
          }, ret, this._renderDebugOverlay());
        } else {
          return ret;
        }
      }
      componentDidUpdate(prevProps) {
        var _this$props7 = this.props, data = _this$props7.data, extraData = _this$props7.extraData;
        if (data !== prevProps.data || extraData !== prevProps.extraData) {
          this._viewabilityTuples.forEach((tuple) => {
            tuple.viewabilityHelper.resetViewableIndices();
          });
        }
        var hiPriInProgress = this._hiPriInProgress;
        this._scheduleCellsToRenderUpdate();
        if (hiPriInProgress) {
          this._hiPriInProgress = false;
        }
      }
      // Used for preventing scrollToIndex from being called multiple times for initialScrollIndex
      // flag to prevent infinite hiPri cell limit update
      // $FlowFixMe[missing-local-annot]
      /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
       * LTI update could not be added via codemod */
      _computeBlankness() {
        this._fillRateHelper.computeBlankness(this.props, this.state.cellsAroundViewport, this._scrollMetrics);
      }
      /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
       * LTI update could not be added via codemod */
      _onCellFocusCapture(cellKey) {
        this._lastFocusedCellKey = cellKey;
        this._updateCellsToRender();
      }
      _triggerRemeasureForChildListsInCell(cellKey) {
        this._nestedChildLists.forEachInCell(cellKey, (childList) => {
          childList.measureLayoutRelativeToContainingList();
        });
      }
      measureLayoutRelativeToContainingList() {
        try {
          if (!this._scrollRef) {
            return;
          }
          this._scrollRef.measureLayout(this.context.getOutermostParentListRef().getScrollRef(), (x, y, width, height) => {
            this._offsetFromParentVirtualizedList = this._selectOffset({
              x,
              y
            });
            this._scrollMetrics.contentLength = this._selectLength({
              width,
              height
            });
            var scrollMetrics = this._convertParentScrollMetrics(this.context.getScrollMetrics());
            var metricsChanged = this._scrollMetrics.visibleLength !== scrollMetrics.visibleLength || this._scrollMetrics.offset !== scrollMetrics.offset;
            if (metricsChanged) {
              this._scrollMetrics.visibleLength = scrollMetrics.visibleLength;
              this._scrollMetrics.offset = scrollMetrics.offset;
              this._nestedChildLists.forEach((childList) => {
                childList.measureLayoutRelativeToContainingList();
              });
            }
          }, (error) => {
            console.warn("VirtualizedList: Encountered an error while measuring a list's offset from its containing VirtualizedList.");
          });
        } catch (error) {
          console.warn("measureLayoutRelativeToContainingList threw an error", error.stack);
        }
      }
      _getFooterCellKey() {
        return this._getCellKey() + "-footer";
      }
      // $FlowFixMe[missing-local-annot]
      _renderDebugOverlay() {
        var normalize = this._scrollMetrics.visibleLength / (this._scrollMetrics.contentLength || 1);
        var framesInLayout = [];
        var itemCount = this.props.getItemCount(this.props.data);
        for (var ii = 0; ii < itemCount; ii++) {
          var frame = this.__getFrameMetricsApprox(ii, this.props);
          if (frame.inLayout) {
            framesInLayout.push(frame);
          }
        }
        var windowTop = this.__getFrameMetricsApprox(this.state.cellsAroundViewport.first, this.props).offset;
        var frameLast = this.__getFrameMetricsApprox(this.state.cellsAroundViewport.last, this.props);
        var windowLen = frameLast.offset + frameLast.length - windowTop;
        var visTop = this._scrollMetrics.offset;
        var visLen = this._scrollMetrics.visibleLength;
        return /* @__PURE__ */ React24.createElement(_View.default, {
          style: [styles.debugOverlayBase, styles.debugOverlay]
        }, framesInLayout.map((f, ii2) => /* @__PURE__ */ React24.createElement(_View.default, {
          key: "f" + ii2,
          style: [styles.debugOverlayBase, styles.debugOverlayFrame, {
            top: f.offset * normalize,
            height: f.length * normalize
          }]
        })), /* @__PURE__ */ React24.createElement(_View.default, {
          style: [styles.debugOverlayBase, styles.debugOverlayFrameLast, {
            top: windowTop * normalize,
            height: windowLen * normalize
          }]
        }), /* @__PURE__ */ React24.createElement(_View.default, {
          style: [styles.debugOverlayBase, styles.debugOverlayFrameVis, {
            top: visTop * normalize,
            height: visLen * normalize
          }]
        }));
      }
      _selectLength(metrics) {
        return !horizontalOrDefault(this.props.horizontal) ? metrics.height : metrics.width;
      }
      _selectOffset(metrics) {
        return !horizontalOrDefault(this.props.horizontal) ? metrics.y : metrics.x;
      }
      _maybeCallOnEdgeReached() {
        var _this$props8 = this.props, data = _this$props8.data, getItemCount = _this$props8.getItemCount, onStartReached = _this$props8.onStartReached, onStartReachedThreshold = _this$props8.onStartReachedThreshold, onEndReached = _this$props8.onEndReached, onEndReachedThreshold = _this$props8.onEndReachedThreshold, initialScrollIndex = _this$props8.initialScrollIndex;
        var _this$_scrollMetrics2 = this._scrollMetrics, contentLength = _this$_scrollMetrics2.contentLength, visibleLength = _this$_scrollMetrics2.visibleLength, offset = _this$_scrollMetrics2.offset;
        var distanceFromStart = offset;
        var distanceFromEnd = contentLength - visibleLength - offset;
        if (distanceFromStart < ON_EDGE_REACHED_EPSILON) {
          distanceFromStart = 0;
        }
        if (distanceFromEnd < ON_EDGE_REACHED_EPSILON) {
          distanceFromEnd = 0;
        }
        var DEFAULT_THRESHOLD_PX = 2;
        var startThreshold = onStartReachedThreshold != null ? onStartReachedThreshold * visibleLength : DEFAULT_THRESHOLD_PX;
        var endThreshold = onEndReachedThreshold != null ? onEndReachedThreshold * visibleLength : DEFAULT_THRESHOLD_PX;
        var isWithinStartThreshold = distanceFromStart <= startThreshold;
        var isWithinEndThreshold = distanceFromEnd <= endThreshold;
        if (onEndReached && this.state.cellsAroundViewport.last === getItemCount(data) - 1 && isWithinEndThreshold && this._scrollMetrics.contentLength !== this._sentEndForContentLength) {
          this._sentEndForContentLength = this._scrollMetrics.contentLength;
          onEndReached({
            distanceFromEnd
          });
        } else if (onStartReached != null && this.state.cellsAroundViewport.first === 0 && isWithinStartThreshold && this._scrollMetrics.contentLength !== this._sentStartForContentLength) {
          if (!initialScrollIndex || this._scrollMetrics.timestamp !== 0) {
            this._sentStartForContentLength = this._scrollMetrics.contentLength;
            onStartReached({
              distanceFromStart
            });
          }
        } else {
          this._sentStartForContentLength = isWithinStartThreshold ? this._sentStartForContentLength : 0;
          this._sentEndForContentLength = isWithinEndThreshold ? this._sentEndForContentLength : 0;
        }
      }
      /* Translates metrics from a scroll event in a parent VirtualizedList into
       * coordinates relative to the child list.
       */
      _scheduleCellsToRenderUpdate() {
        var _this$state$cellsArou = this.state.cellsAroundViewport, first = _this$state$cellsArou.first, last = _this$state$cellsArou.last;
        var _this$_scrollMetrics3 = this._scrollMetrics, offset = _this$_scrollMetrics3.offset, visibleLength = _this$_scrollMetrics3.visibleLength, velocity = _this$_scrollMetrics3.velocity;
        var itemCount = this.props.getItemCount(this.props.data);
        var hiPri = false;
        var onStartReachedThreshold = onStartReachedThresholdOrDefault(this.props.onStartReachedThreshold);
        var onEndReachedThreshold = onEndReachedThresholdOrDefault(this.props.onEndReachedThreshold);
        if (first > 0) {
          var distTop = offset - this.__getFrameMetricsApprox(first, this.props).offset;
          hiPri = distTop < 0 || velocity < -2 && distTop < getScrollingThreshold(onStartReachedThreshold, visibleLength);
        }
        if (!hiPri && last >= 0 && last < itemCount - 1) {
          var distBottom = this.__getFrameMetricsApprox(last, this.props).offset - (offset + visibleLength);
          hiPri = distBottom < 0 || velocity > 2 && distBottom < getScrollingThreshold(onEndReachedThreshold, visibleLength);
        }
        if (hiPri && (this._averageCellLength || this.props.getItemLayout) && !this._hiPriInProgress) {
          this._hiPriInProgress = true;
          this._updateCellsToRenderBatcher.dispose({
            abort: true
          });
          this._updateCellsToRender();
          return;
        } else {
          this._updateCellsToRenderBatcher.schedule();
        }
      }
      /**
       * Gets an approximate offset to an item at a given index. Supports
       * fractional indices.
       */
      _updateViewableItems(props, cellsAroundViewport) {
        this._viewabilityTuples.forEach((tuple) => {
          tuple.viewabilityHelper.onUpdate(props, this._scrollMetrics.offset, this._scrollMetrics.visibleLength, this._getFrameMetrics, this._createViewToken, tuple.onViewableItemsChanged, cellsAroundViewport);
        });
      }
    };
    VirtualizedList.contextType = _VirtualizedListContext.VirtualizedListContext;
    var styles = _StyleSheet.default.create({
      verticallyInverted: {
        transform: "scaleY(-1)"
      },
      horizontallyInverted: {
        transform: "scaleX(-1)"
      },
      debug: {
        flex: 1
      },
      debugOverlayBase: {
        position: "absolute",
        top: 0,
        right: 0
      },
      debugOverlay: {
        bottom: 0,
        width: 20,
        borderColor: "blue",
        borderWidth: 1
      },
      debugOverlayFrame: {
        left: 0,
        backgroundColor: "orange"
      },
      debugOverlayFrameLast: {
        left: 0,
        borderColor: "green",
        borderWidth: 2
      },
      debugOverlayFrameVis: {
        left: 0,
        borderColor: "red",
        borderWidth: 2
      }
    });
    var _default = exports2.default = VirtualizedList;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/memoize-one/dist/memoize-one.cjs.js
var require_memoize_one_cjs = __commonJS({
  "../../node_modules/memoize-one/dist/memoize-one.cjs.js"(exports2, module2) {
    "use strict";
    var safeIsNaN = Number.isNaN || /* @__PURE__ */ __name(function ponyfill(value) {
      return typeof value === "number" && value !== value;
    }, "ponyfill");
    function isEqual(first, second) {
      if (first === second) {
        return true;
      }
      if (safeIsNaN(first) && safeIsNaN(second)) {
        return true;
      }
      return false;
    }
    __name(isEqual, "isEqual");
    function areInputsEqual(newInputs, lastInputs) {
      if (newInputs.length !== lastInputs.length) {
        return false;
      }
      for (var i = 0; i < newInputs.length; i++) {
        if (!isEqual(newInputs[i], lastInputs[i])) {
          return false;
        }
      }
      return true;
    }
    __name(areInputsEqual, "areInputsEqual");
    function memoizeOne(resultFn, isEqual2) {
      if (isEqual2 === void 0) {
        isEqual2 = areInputsEqual;
      }
      var cache2 = null;
      function memoized() {
        var newArgs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          newArgs[_i] = arguments[_i];
        }
        if (cache2 && cache2.lastThis === this && isEqual2(newArgs, cache2.lastArgs)) {
          return cache2.lastResult;
        }
        var lastResult = resultFn.apply(this, newArgs);
        cache2 = {
          lastResult,
          lastArgs: newArgs,
          lastThis: this
        };
        return lastResult;
      }
      __name(memoized, "memoized");
      memoized.clear = /* @__PURE__ */ __name(function clear() {
        cache2 = null;
      }, "clear");
      return memoized;
    }
    __name(memoizeOne, "memoizeOne");
    module2.exports = memoizeOne;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/FlatList/index.js
var require_FlatList = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/FlatList/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _View = _interopRequireDefault(require_View());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _deepDiffer = _interopRequireDefault(require_deepDiffer());
    var _Platform = _interopRequireDefault(require_Platform());
    var _invariant = _interopRequireDefault(require_invariant());
    var React24 = _interopRequireWildcard(require("react"));
    var _VirtualizedList = _interopRequireDefault(require_VirtualizedList());
    var _VirtualizeUtils = require_VirtualizeUtils();
    var _memoizeOne = _interopRequireDefault(require_memoize_one_cjs());
    var _excluded = ["numColumns", "columnWrapperStyle", "removeClippedSubviews", "strictMode"];
    function removeClippedSubviewsOrDefault(removeClippedSubviews) {
      return removeClippedSubviews !== null && removeClippedSubviews !== void 0 ? removeClippedSubviews : _Platform.default.OS === "android";
    }
    __name(removeClippedSubviewsOrDefault, "removeClippedSubviewsOrDefault");
    function numColumnsOrDefault(numColumns) {
      return numColumns !== null && numColumns !== void 0 ? numColumns : 1;
    }
    __name(numColumnsOrDefault, "numColumnsOrDefault");
    function isArrayLike(data) {
      return typeof Object(data).length === "number";
    }
    __name(isArrayLike, "isArrayLike");
    var FlatList = class extends React24.PureComponent {
      static {
        __name(this, "FlatList");
      }
      /**
       * Scrolls to the end of the content. May be janky without `getItemLayout` prop.
       */
      scrollToEnd(params) {
        if (this._listRef) {
          this._listRef.scrollToEnd(params);
        }
      }
      /**
       * Scrolls to the item at the specified index such that it is positioned in the viewable area
       * such that `viewPosition` 0 places it at the top, 1 at the bottom, and 0.5 centered in the
       * middle. `viewOffset` is a fixed number of pixels to offset the final target position.
       *
       * Note: cannot scroll to locations outside the render window without specifying the
       * `getItemLayout` prop.
       */
      scrollToIndex(params) {
        if (this._listRef) {
          this._listRef.scrollToIndex(params);
        }
      }
      /**
       * Requires linear scan through data - use `scrollToIndex` instead if possible.
       *
       * Note: cannot scroll to locations outside the render window without specifying the
       * `getItemLayout` prop.
       */
      scrollToItem(params) {
        if (this._listRef) {
          this._listRef.scrollToItem(params);
        }
      }
      /**
       * Scroll to a specific content pixel offset in the list.
       *
       * Check out [scrollToOffset](docs/virtualizedlist.html#scrolltooffset) of VirtualizedList
       */
      scrollToOffset(params) {
        if (this._listRef) {
          this._listRef.scrollToOffset(params);
        }
      }
      /**
       * Tells the list an interaction has occurred, which should trigger viewability calculations, e.g.
       * if `waitForInteractions` is true and the user has not scrolled. This is typically called by
       * taps on items or by navigation actions.
       */
      recordInteraction() {
        if (this._listRef) {
          this._listRef.recordInteraction();
        }
      }
      /**
       * Displays the scroll indicators momentarily.
       *
       * @platform ios
       */
      flashScrollIndicators() {
        if (this._listRef) {
          this._listRef.flashScrollIndicators();
        }
      }
      /**
       * Provides a handle to the underlying scroll responder.
       */
      getScrollResponder() {
        if (this._listRef) {
          return this._listRef.getScrollResponder();
        }
      }
      /**
       * Provides a reference to the underlying host component
       */
      getNativeScrollRef() {
        if (this._listRef) {
          return this._listRef.getScrollRef();
        }
      }
      getScrollableNode() {
        if (this._listRef) {
          return this._listRef.getScrollableNode();
        }
      }
      constructor(_props) {
        super(_props);
        this._virtualizedListPairs = [];
        this._captureRef = (ref) => {
          this._listRef = ref;
        };
        this._getItem = (data, index) => {
          var numColumns = numColumnsOrDefault(this.props.numColumns);
          if (numColumns > 1) {
            var ret = [];
            for (var kk = 0; kk < numColumns; kk++) {
              var itemIndex = index * numColumns + kk;
              if (itemIndex < data.length) {
                var _item = data[itemIndex];
                ret.push(_item);
              }
            }
            return ret;
          } else {
            return data[index];
          }
        };
        this._getItemCount = (data) => {
          if (data != null && isArrayLike(data)) {
            var numColumns = numColumnsOrDefault(this.props.numColumns);
            return numColumns > 1 ? Math.ceil(data.length / numColumns) : data.length;
          } else {
            return 0;
          }
        };
        this._keyExtractor = (items, index) => {
          var _this$props$keyExtrac;
          var numColumns = numColumnsOrDefault(this.props.numColumns);
          var keyExtractor = (_this$props$keyExtrac = this.props.keyExtractor) !== null && _this$props$keyExtrac !== void 0 ? _this$props$keyExtrac : _VirtualizeUtils.keyExtractor;
          if (numColumns > 1) {
            (0, _invariant.default)(Array.isArray(items), "FlatList: Encountered internal consistency error, expected each item to consist of an array with 1-%s columns; instead, received a single item.", numColumns);
            return items.map((item, kk) => keyExtractor(item, index * numColumns + kk)).join(":");
          }
          return keyExtractor(items, index);
        };
        this._renderer = (ListItemComponent, renderItem, columnWrapperStyle, numColumns, extraData) => {
          var cols = numColumnsOrDefault(numColumns);
          var render = /* @__PURE__ */ __name((props) => {
            if (ListItemComponent) {
              return /* @__PURE__ */ React24.createElement(ListItemComponent, props);
            } else if (renderItem) {
              return renderItem(props);
            } else {
              return null;
            }
          }, "render");
          var renderProp = /* @__PURE__ */ __name((info) => {
            if (cols > 1) {
              var _item2 = info.item, _index = info.index;
              (0, _invariant.default)(Array.isArray(_item2), "Expected array of items with numColumns > 1");
              return /* @__PURE__ */ React24.createElement(_View.default, {
                style: [styles.row, columnWrapperStyle]
              }, _item2.map((it, kk) => {
                var element = render({
                  // $FlowFixMe[incompatible-call]
                  item: it,
                  index: _index * cols + kk,
                  separators: info.separators
                });
                return element != null ? /* @__PURE__ */ React24.createElement(React24.Fragment, {
                  key: kk
                }, element) : null;
              }));
            } else {
              return render(info);
            }
          }, "renderProp");
          return ListItemComponent ? {
            ListItemComponent: renderProp
          } : {
            renderItem: renderProp
          };
        };
        this._memoizedRenderer = (0, _memoizeOne.default)(this._renderer);
        this._checkProps(this.props);
        if (this.props.viewabilityConfigCallbackPairs) {
          this._virtualizedListPairs = this.props.viewabilityConfigCallbackPairs.map((pair) => ({
            viewabilityConfig: pair.viewabilityConfig,
            onViewableItemsChanged: this._createOnViewableItemsChanged(pair.onViewableItemsChanged)
          }));
        } else if (this.props.onViewableItemsChanged) {
          this._virtualizedListPairs.push({
            /* $FlowFixMe[incompatible-call] (>=0.63.0 site=react_native_fb) This
             * comment suppresses an error found when Flow v0.63 was deployed. To
             * see the error delete this comment and run Flow. */
            viewabilityConfig: this.props.viewabilityConfig,
            onViewableItemsChanged: this._createOnViewableItemsChanged(this.props.onViewableItemsChanged)
          });
        }
      }
      // $FlowFixMe[missing-local-annot]
      componentDidUpdate(prevProps) {
        (0, _invariant.default)(prevProps.numColumns === this.props.numColumns, "Changing numColumns on the fly is not supported. Change the key prop on FlatList when changing the number of columns to force a fresh render of the component.");
        (0, _invariant.default)(prevProps.onViewableItemsChanged === this.props.onViewableItemsChanged, "Changing onViewableItemsChanged on the fly is not supported");
        (0, _invariant.default)(!(0, _deepDiffer.default)(prevProps.viewabilityConfig, this.props.viewabilityConfig), "Changing viewabilityConfig on the fly is not supported");
        (0, _invariant.default)(prevProps.viewabilityConfigCallbackPairs === this.props.viewabilityConfigCallbackPairs, "Changing viewabilityConfigCallbackPairs on the fly is not supported");
        this._checkProps(this.props);
      }
      // $FlowFixMe[missing-local-annot]
      _checkProps(props) {
        var getItem = props.getItem, getItemCount = props.getItemCount, horizontal = props.horizontal, columnWrapperStyle = props.columnWrapperStyle, onViewableItemsChanged = props.onViewableItemsChanged, viewabilityConfigCallbackPairs = props.viewabilityConfigCallbackPairs;
        var numColumns = numColumnsOrDefault(this.props.numColumns);
        (0, _invariant.default)(!getItem && !getItemCount, "FlatList does not support custom data formats.");
        if (numColumns > 1) {
          (0, _invariant.default)(!horizontal, "numColumns does not support horizontal.");
        } else {
          (0, _invariant.default)(!columnWrapperStyle, "columnWrapperStyle not supported for single column lists");
        }
        (0, _invariant.default)(!(onViewableItemsChanged && viewabilityConfigCallbackPairs), "FlatList does not support setting both onViewableItemsChanged and viewabilityConfigCallbackPairs.");
      }
      _pushMultiColumnViewable(arr, v) {
        var _this$props$keyExtrac2;
        var numColumns = numColumnsOrDefault(this.props.numColumns);
        var keyExtractor = (_this$props$keyExtrac2 = this.props.keyExtractor) !== null && _this$props$keyExtrac2 !== void 0 ? _this$props$keyExtrac2 : _VirtualizeUtils.keyExtractor;
        v.item.forEach((item, ii) => {
          (0, _invariant.default)(v.index != null, "Missing index!");
          var index = v.index * numColumns + ii;
          arr.push((0, _objectSpread2.default)((0, _objectSpread2.default)({}, v), {}, {
            item,
            key: keyExtractor(item, index),
            index
          }));
        });
      }
      _createOnViewableItemsChanged(onViewableItemsChanged) {
        return (info) => {
          var numColumns = numColumnsOrDefault(this.props.numColumns);
          if (onViewableItemsChanged) {
            if (numColumns > 1) {
              var changed = [];
              var viewableItems = [];
              info.viewableItems.forEach((v) => this._pushMultiColumnViewable(viewableItems, v));
              info.changed.forEach((v) => this._pushMultiColumnViewable(changed, v));
              onViewableItemsChanged({
                viewableItems,
                changed
              });
            } else {
              onViewableItemsChanged(info);
            }
          }
        };
      }
      // $FlowFixMe[missing-local-annot]
      render() {
        var _this$props = this.props, numColumns = _this$props.numColumns, columnWrapperStyle = _this$props.columnWrapperStyle, _removeClippedSubviews = _this$props.removeClippedSubviews, _this$props$strictMod = _this$props.strictMode, strictMode = _this$props$strictMod === void 0 ? false : _this$props$strictMod, restProps = (0, _objectWithoutPropertiesLoose2.default)(_this$props, _excluded);
        var renderer = strictMode ? this._memoizedRenderer : this._renderer;
        return (
          // $FlowFixMe[incompatible-exact] - `restProps` (`Props`) is inexact.
          /* @__PURE__ */ React24.createElement(_VirtualizedList.default, (0, _extends2.default)({}, restProps, {
            getItem: this._getItem,
            getItemCount: this._getItemCount,
            keyExtractor: this._keyExtractor,
            ref: this._captureRef,
            viewabilityConfigCallbackPairs: this._virtualizedListPairs,
            removeClippedSubviews: removeClippedSubviewsOrDefault(_removeClippedSubviews)
          }, renderer(this.props.ListItemComponent, this.props.renderItem, columnWrapperStyle, numColumns, this.props.extraData)))
        );
      }
    };
    var styles = _StyleSheet.default.create({
      row: {
        flexDirection: "row"
      }
    });
    var _default = exports2.default = FlatList;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/FlatList/index.js
var require_FlatList2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/FlatList/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _FlatList = _interopRequireDefault(require_FlatList());
    var _default = exports2.default = _FlatList.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/TurboModule/TurboModuleRegistry.js
var require_TurboModuleRegistry = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/TurboModule/TurboModuleRegistry.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.get = get;
    exports2.getEnforcing = getEnforcing;
    var _invariant = _interopRequireDefault(require_invariant());
    function get(name) {
      return null;
    }
    __name(get, "get");
    function getEnforcing(name) {
      var module3 = get(name);
      (0, _invariant.default)(module3 != null, "TurboModuleRegistry.getEnforcing(...): '" + name + "' could not be found. Verify that a module by this name is registered in the native binary.");
      return module3;
    }
    __name(getEnforcing, "getEnforcing");
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/NativeAnimatedModule.js
var require_NativeAnimatedModule = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/NativeAnimatedModule.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var TurboModuleRegistry = _interopRequireWildcard(require_TurboModuleRegistry());
    var _default = exports2.default = TurboModuleRegistry.get("NativeAnimatedModule");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/NativeAnimatedTurboModule.js
var require_NativeAnimatedTurboModule = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/NativeAnimatedTurboModule.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var TurboModuleRegistry = _interopRequireWildcard(require_TurboModuleRegistry());
    var _default = exports2.default = TurboModuleRegistry.get("NativeAnimatedTurboModule");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/EventEmitter/RCTDeviceEventEmitter.js
var require_RCTDeviceEventEmitter = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/EventEmitter/RCTDeviceEventEmitter.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _EventEmitter = _interopRequireDefault(require_EventEmitter());
    var _default = exports2.default = new _EventEmitter.default();
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/EventEmitter/NativeEventEmitter.js
var require_NativeEventEmitter = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/EventEmitter/NativeEventEmitter.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _Platform = _interopRequireDefault(require_Platform());
    var _RCTDeviceEventEmitter = _interopRequireDefault(require_RCTDeviceEventEmitter());
    var _invariant = _interopRequireDefault(require_invariant());
    var NativeEventEmitter = class {
      static {
        __name(this, "NativeEventEmitter");
      }
      constructor(nativeModule) {
        if (_Platform.default.OS === "ios") {
          (0, _invariant.default)(nativeModule != null, "`new NativeEventEmitter()` requires a non-null argument.");
          this._nativeModule = nativeModule;
        }
      }
      addListener(eventType, listener, context) {
        var _this$_nativeModule;
        (_this$_nativeModule = this._nativeModule) == null ? void 0 : _this$_nativeModule.addListener(eventType);
        var subscription = _RCTDeviceEventEmitter.default.addListener(eventType, listener, context);
        return {
          remove: /* @__PURE__ */ __name(() => {
            if (subscription != null) {
              var _this$_nativeModule2;
              (_this$_nativeModule2 = this._nativeModule) == null ? void 0 : _this$_nativeModule2.removeListeners(1);
              subscription.remove();
              subscription = null;
            }
          }, "remove")
        };
      }
      /**
       * @deprecated Use `remove` on the EventSubscription from `addListener`.
       */
      removeListener(eventType, listener) {
        var _this$_nativeModule3;
        (_this$_nativeModule3 = this._nativeModule) == null ? void 0 : _this$_nativeModule3.removeListeners(1);
        _RCTDeviceEventEmitter.default.removeListener(eventType, listener);
      }
      emit(eventType) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        _RCTDeviceEventEmitter.default.emit(eventType, ...args);
      }
      removeAllListeners(eventType) {
        var _this$_nativeModule4;
        (0, _invariant.default)(eventType != null, "`NativeEventEmitter.removeAllListener()` requires a non-null argument.");
        (_this$_nativeModule4 = this._nativeModule) == null ? void 0 : _this$_nativeModule4.removeListeners(this.listenerCount(eventType));
        _RCTDeviceEventEmitter.default.removeAllListeners(eventType);
      }
      listenerCount(eventType) {
        return _RCTDeviceEventEmitter.default.listenerCount(eventType);
      }
    };
    exports2.default = NativeEventEmitter;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Utilities/Platform.js
var require_Platform2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Utilities/Platform.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _Platform = _interopRequireDefault(require_Platform());
    var _default = exports2.default = _Platform.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/ReactNative/ReactNativeFeatureFlags.js
var require_ReactNativeFeatureFlags = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/ReactNative/ReactNativeFeatureFlags.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var ReactNativeFeatureFlags = {
      isLayoutAnimationEnabled: /* @__PURE__ */ __name(() => true, "isLayoutAnimationEnabled"),
      shouldEmitW3CPointerEvents: /* @__PURE__ */ __name(() => false, "shouldEmitW3CPointerEvents"),
      shouldPressibilityUseW3CPointerEventsForHover: /* @__PURE__ */ __name(() => false, "shouldPressibilityUseW3CPointerEventsForHover"),
      animatedShouldDebounceQueueFlush: /* @__PURE__ */ __name(() => false, "animatedShouldDebounceQueueFlush"),
      animatedShouldUseSingleOp: /* @__PURE__ */ __name(() => false, "animatedShouldUseSingleOp")
    };
    var _default = exports2.default = ReactNativeFeatureFlags;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/NativeAnimatedHelper.js
var require_NativeAnimatedHelper = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/NativeAnimatedHelper.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.API = void 0;
    exports2.addWhitelistedInterpolationParam = addWhitelistedInterpolationParam;
    exports2.addWhitelistedStyleProp = addWhitelistedStyleProp;
    exports2.addWhitelistedTransformProp = addWhitelistedTransformProp;
    exports2.assertNativeAnimatedModule = assertNativeAnimatedModule;
    exports2.default = void 0;
    exports2.generateNewAnimationId = generateNewAnimationId;
    exports2.generateNewNodeTag = generateNewNodeTag;
    exports2.isSupportedColorStyleProp = isSupportedColorStyleProp;
    exports2.isSupportedInterpolationParam = isSupportedInterpolationParam;
    exports2.isSupportedStyleProp = isSupportedStyleProp;
    exports2.isSupportedTransformProp = isSupportedTransformProp;
    exports2.shouldUseNativeDriver = shouldUseNativeDriver;
    exports2.transformDataType = transformDataType;
    exports2.validateInterpolation = validateInterpolation;
    exports2.validateStyles = validateStyles;
    exports2.validateTransform = validateTransform;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _NativeAnimatedModule = _interopRequireDefault(require_NativeAnimatedModule());
    var _NativeAnimatedTurboModule = _interopRequireDefault(require_NativeAnimatedTurboModule());
    var _NativeEventEmitter = _interopRequireDefault(require_NativeEventEmitter());
    var _Platform = _interopRequireDefault(require_Platform2());
    var _ReactNativeFeatureFlags = _interopRequireDefault(require_ReactNativeFeatureFlags());
    var _invariant = _interopRequireDefault(require_invariant());
    var _RCTDeviceEventEmitter = _interopRequireDefault(require_RCTDeviceEventEmitter());
    var NativeAnimatedModule = _Platform.default.OS === "ios" && global.RN$Bridgeless === true ? _NativeAnimatedTurboModule.default : _NativeAnimatedModule.default;
    var __nativeAnimatedNodeTagCount = 1;
    var __nativeAnimationIdCount = 1;
    var nativeEventEmitter;
    var waitingForQueuedOperations = /* @__PURE__ */ new Set();
    var queueOperations = false;
    var queue = [];
    var singleOpQueue = [];
    var useSingleOpBatching = false;
    _Platform.default.OS === "android" && !!(NativeAnimatedModule != null && NativeAnimatedModule.queueAndExecuteBatchedOperations) && _ReactNativeFeatureFlags.default.animatedShouldUseSingleOp();
    var flushQueueTimeout = null;
    var eventListenerGetValueCallbacks = {};
    var eventListenerAnimationFinishedCallbacks = {};
    var nativeOps = useSingleOpBatching ? (function() {
      var apis = [
        "createAnimatedNode",
        // 1
        "updateAnimatedNodeConfig",
        // 2
        "getValue",
        // 3
        "startListeningToAnimatedNodeValue",
        // 4
        "stopListeningToAnimatedNodeValue",
        // 5
        "connectAnimatedNodes",
        // 6
        "disconnectAnimatedNodes",
        // 7
        "startAnimatingNode",
        // 8
        "stopAnimation",
        // 9
        "setAnimatedNodeValue",
        // 10
        "setAnimatedNodeOffset",
        // 11
        "flattenAnimatedNodeOffset",
        // 12
        "extractAnimatedNodeOffset",
        // 13
        "connectAnimatedNodeToView",
        // 14
        "disconnectAnimatedNodeFromView",
        // 15
        "restoreDefaultValues",
        // 16
        "dropAnimatedNode",
        // 17
        "addAnimatedEventToView",
        // 18
        "removeAnimatedEventFromView",
        // 19
        "addListener",
        // 20
        "removeListener"
        // 21
      ];
      return apis.reduce((acc, functionName, i) => {
        acc[functionName] = i + 1;
        return acc;
      }, {});
    })() : NativeAnimatedModule;
    var API = exports2.API = {
      getValue: /* @__PURE__ */ __name(function getValue(tag, saveValueCallback) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        if (useSingleOpBatching) {
          if (saveValueCallback) {
            eventListenerGetValueCallbacks[tag] = saveValueCallback;
          }
          API.queueOperation(nativeOps.getValue, tag);
        } else {
          API.queueOperation(nativeOps.getValue, tag, saveValueCallback);
        }
      }, "getValue"),
      setWaitingForIdentifier: /* @__PURE__ */ __name(function setWaitingForIdentifier(id) {
        waitingForQueuedOperations.add(id);
        queueOperations = true;
        if (_ReactNativeFeatureFlags.default.animatedShouldDebounceQueueFlush() && flushQueueTimeout) {
          clearTimeout(flushQueueTimeout);
        }
      }, "setWaitingForIdentifier"),
      unsetWaitingForIdentifier: /* @__PURE__ */ __name(function unsetWaitingForIdentifier(id) {
        waitingForQueuedOperations.delete(id);
        if (waitingForQueuedOperations.size === 0) {
          queueOperations = false;
          API.disableQueue();
        }
      }, "unsetWaitingForIdentifier"),
      disableQueue: /* @__PURE__ */ __name(function disableQueue() {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        if (_ReactNativeFeatureFlags.default.animatedShouldDebounceQueueFlush()) {
          var prevTimeout = flushQueueTimeout;
          clearImmediate(prevTimeout);
          flushQueueTimeout = setImmediate(API.flushQueue);
        } else {
          API.flushQueue();
        }
      }, "disableQueue"),
      flushQueue: /* @__PURE__ */ __name(function flushQueue() {
      }, "flushQueue"),
      queueOperation: /* @__PURE__ */ __name(function queueOperation(fn) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        if (useSingleOpBatching) {
          singleOpQueue.push(fn, ...args);
          return;
        }
        if (queueOperations || queue.length !== 0) {
          queue.push(() => fn(...args));
        } else {
          fn(...args);
        }
      }, "queueOperation"),
      createAnimatedNode: /* @__PURE__ */ __name(function createAnimatedNode(tag, config) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.createAnimatedNode, tag, config);
      }, "createAnimatedNode"),
      updateAnimatedNodeConfig: /* @__PURE__ */ __name(function updateAnimatedNodeConfig(tag, config) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
      }, "updateAnimatedNodeConfig"),
      startListeningToAnimatedNodeValue: /* @__PURE__ */ __name(function startListeningToAnimatedNodeValue(tag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.startListeningToAnimatedNodeValue, tag);
      }, "startListeningToAnimatedNodeValue"),
      stopListeningToAnimatedNodeValue: /* @__PURE__ */ __name(function stopListeningToAnimatedNodeValue(tag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.stopListeningToAnimatedNodeValue, tag);
      }, "stopListeningToAnimatedNodeValue"),
      connectAnimatedNodes: /* @__PURE__ */ __name(function connectAnimatedNodes(parentTag, childTag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.connectAnimatedNodes, parentTag, childTag);
      }, "connectAnimatedNodes"),
      disconnectAnimatedNodes: /* @__PURE__ */ __name(function disconnectAnimatedNodes(parentTag, childTag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.disconnectAnimatedNodes, parentTag, childTag);
      }, "disconnectAnimatedNodes"),
      startAnimatingNode: /* @__PURE__ */ __name(function startAnimatingNode(animationId, nodeTag, config, endCallback) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        if (useSingleOpBatching) {
          if (endCallback) {
            eventListenerAnimationFinishedCallbacks[animationId] = endCallback;
          }
          API.queueOperation(nativeOps.startAnimatingNode, animationId, nodeTag, config);
        } else {
          API.queueOperation(nativeOps.startAnimatingNode, animationId, nodeTag, config, endCallback);
        }
      }, "startAnimatingNode"),
      stopAnimation: /* @__PURE__ */ __name(function stopAnimation(animationId) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.stopAnimation, animationId);
      }, "stopAnimation"),
      setAnimatedNodeValue: /* @__PURE__ */ __name(function setAnimatedNodeValue(nodeTag, value) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.setAnimatedNodeValue, nodeTag, value);
      }, "setAnimatedNodeValue"),
      setAnimatedNodeOffset: /* @__PURE__ */ __name(function setAnimatedNodeOffset(nodeTag, offset) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.setAnimatedNodeOffset, nodeTag, offset);
      }, "setAnimatedNodeOffset"),
      flattenAnimatedNodeOffset: /* @__PURE__ */ __name(function flattenAnimatedNodeOffset(nodeTag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.flattenAnimatedNodeOffset, nodeTag);
      }, "flattenAnimatedNodeOffset"),
      extractAnimatedNodeOffset: /* @__PURE__ */ __name(function extractAnimatedNodeOffset(nodeTag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.extractAnimatedNodeOffset, nodeTag);
      }, "extractAnimatedNodeOffset"),
      connectAnimatedNodeToView: /* @__PURE__ */ __name(function connectAnimatedNodeToView(nodeTag, viewTag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.connectAnimatedNodeToView, nodeTag, viewTag);
      }, "connectAnimatedNodeToView"),
      disconnectAnimatedNodeFromView: /* @__PURE__ */ __name(function disconnectAnimatedNodeFromView(nodeTag, viewTag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.disconnectAnimatedNodeFromView, nodeTag, viewTag);
      }, "disconnectAnimatedNodeFromView"),
      restoreDefaultValues: /* @__PURE__ */ __name(function restoreDefaultValues(nodeTag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        if (nativeOps.restoreDefaultValues != null) {
          API.queueOperation(nativeOps.restoreDefaultValues, nodeTag);
        }
      }, "restoreDefaultValues"),
      dropAnimatedNode: /* @__PURE__ */ __name(function dropAnimatedNode(tag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.dropAnimatedNode, tag);
      }, "dropAnimatedNode"),
      addAnimatedEventToView: /* @__PURE__ */ __name(function addAnimatedEventToView(viewTag, eventName, eventMapping) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.addAnimatedEventToView, viewTag, eventName, eventMapping);
      }, "addAnimatedEventToView"),
      removeAnimatedEventFromView(viewTag, eventName, animatedNodeTag) {
        (0, _invariant.default)(nativeOps, "Native animated module is not available");
        API.queueOperation(nativeOps.removeAnimatedEventFromView, viewTag, eventName, animatedNodeTag);
      }
    };
    var SUPPORTED_COLOR_STYLES = {
      backgroundColor: true,
      borderBottomColor: true,
      borderColor: true,
      borderEndColor: true,
      borderLeftColor: true,
      borderRightColor: true,
      borderStartColor: true,
      borderTopColor: true,
      color: true,
      tintColor: true
    };
    var SUPPORTED_STYLES = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, SUPPORTED_COLOR_STYLES), {}, {
      borderBottomEndRadius: true,
      borderBottomLeftRadius: true,
      borderBottomRightRadius: true,
      borderBottomStartRadius: true,
      borderRadius: true,
      borderTopEndRadius: true,
      borderTopLeftRadius: true,
      borderTopRightRadius: true,
      borderTopStartRadius: true,
      elevation: true,
      opacity: true,
      transform: true,
      zIndex: true,
      /* ios styles */
      shadowOpacity: true,
      shadowRadius: true,
      /* legacy android transform properties */
      scaleX: true,
      scaleY: true,
      translateX: true,
      translateY: true
    });
    var SUPPORTED_TRANSFORMS = {
      translateX: true,
      translateY: true,
      scale: true,
      scaleX: true,
      scaleY: true,
      rotate: true,
      rotateX: true,
      rotateY: true,
      rotateZ: true,
      perspective: true
    };
    var SUPPORTED_INTERPOLATION_PARAMS = {
      inputRange: true,
      outputRange: true,
      extrapolate: true,
      extrapolateRight: true,
      extrapolateLeft: true
    };
    function addWhitelistedStyleProp(prop) {
      SUPPORTED_STYLES[prop] = true;
    }
    __name(addWhitelistedStyleProp, "addWhitelistedStyleProp");
    function addWhitelistedTransformProp(prop) {
      SUPPORTED_TRANSFORMS[prop] = true;
    }
    __name(addWhitelistedTransformProp, "addWhitelistedTransformProp");
    function addWhitelistedInterpolationParam(param) {
      SUPPORTED_INTERPOLATION_PARAMS[param] = true;
    }
    __name(addWhitelistedInterpolationParam, "addWhitelistedInterpolationParam");
    function isSupportedColorStyleProp(prop) {
      return SUPPORTED_COLOR_STYLES.hasOwnProperty(prop);
    }
    __name(isSupportedColorStyleProp, "isSupportedColorStyleProp");
    function isSupportedStyleProp(prop) {
      return SUPPORTED_STYLES.hasOwnProperty(prop);
    }
    __name(isSupportedStyleProp, "isSupportedStyleProp");
    function isSupportedTransformProp(prop) {
      return SUPPORTED_TRANSFORMS.hasOwnProperty(prop);
    }
    __name(isSupportedTransformProp, "isSupportedTransformProp");
    function isSupportedInterpolationParam(param) {
      return SUPPORTED_INTERPOLATION_PARAMS.hasOwnProperty(param);
    }
    __name(isSupportedInterpolationParam, "isSupportedInterpolationParam");
    function validateTransform(configs) {
      configs.forEach((config) => {
        if (!isSupportedTransformProp(config.property)) {
          throw new Error("Property '" + config.property + "' is not supported by native animated module");
        }
      });
    }
    __name(validateTransform, "validateTransform");
    function validateStyles(styles) {
      for (var _key2 in styles) {
        if (!isSupportedStyleProp(_key2)) {
          throw new Error("Style property '" + _key2 + "' is not supported by native animated module");
        }
      }
    }
    __name(validateStyles, "validateStyles");
    function validateInterpolation(config) {
      for (var _key3 in config) {
        if (!isSupportedInterpolationParam(_key3)) {
          throw new Error("Interpolation property '" + _key3 + "' is not supported by native animated module");
        }
      }
    }
    __name(validateInterpolation, "validateInterpolation");
    function generateNewNodeTag() {
      return __nativeAnimatedNodeTagCount++;
    }
    __name(generateNewNodeTag, "generateNewNodeTag");
    function generateNewAnimationId() {
      return __nativeAnimationIdCount++;
    }
    __name(generateNewAnimationId, "generateNewAnimationId");
    function assertNativeAnimatedModule() {
      (0, _invariant.default)(NativeAnimatedModule, "Native animated module is not available");
    }
    __name(assertNativeAnimatedModule, "assertNativeAnimatedModule");
    var _warnedMissingNativeAnimated = false;
    function shouldUseNativeDriver(config) {
      if (config.useNativeDriver == null) {
        console.warn("Animated: `useNativeDriver` was not specified. This is a required option and must be explicitly set to `true` or `false`");
      }
      if (config.useNativeDriver === true && !NativeAnimatedModule) {
        if (!_warnedMissingNativeAnimated) {
          console.warn("Animated: `useNativeDriver` is not supported because the native animated module is missing. Falling back to JS-based animation. To resolve this, add `RCTAnimation` module to this app, or remove `useNativeDriver`. Make sure to run `bundle exec pod install` first. Read more about autolinking: https://github.com/react-native-community/cli/blob/master/docs/autolinking.md");
          _warnedMissingNativeAnimated = true;
        }
        return false;
      }
      return config.useNativeDriver || false;
    }
    __name(shouldUseNativeDriver, "shouldUseNativeDriver");
    function transformDataType(value) {
      if (typeof value !== "string") {
        return value;
      }
      if (/deg$/.test(value)) {
        var degrees = parseFloat(value) || 0;
        var radians = degrees * Math.PI / 180;
        return radians;
      } else {
        return value;
      }
    }
    __name(transformDataType, "transformDataType");
    var _default = exports2.default = {
      API,
      isSupportedColorStyleProp,
      isSupportedStyleProp,
      isSupportedTransformProp,
      isSupportedInterpolationParam,
      addWhitelistedStyleProp,
      addWhitelistedTransformProp,
      addWhitelistedInterpolationParam,
      validateStyles,
      validateTransform,
      validateInterpolation,
      generateNewNodeTag,
      generateNewAnimationId,
      assertNativeAnimatedModule,
      shouldUseNativeDriver,
      transformDataType,
      // $FlowExpectedError[unsafe-getters-setters] - unsafe getter lint suppresion
      // $FlowExpectedError[missing-type-arg] - unsafe getter lint suppresion
      get nativeEventEmitter() {
        if (!nativeEventEmitter) {
          nativeEventEmitter = new _NativeEventEmitter.default(
            // T88715063: NativeEventEmitter only used this parameter on iOS. Now it uses it on all platforms, so this code was modified automatically to preserve its behavior
            // If you want to use the native module on other platforms, please remove this condition and test its behavior
            _Platform.default.OS !== "ios" ? null : NativeAnimatedModule
          );
        }
        return nativeEventEmitter;
      }
    };
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedNode.js
var require_AnimatedNode = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedNode.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _NativeAnimatedHelper = _interopRequireDefault(require_NativeAnimatedHelper());
    var _invariant = _interopRequireDefault(require_invariant());
    var NativeAnimatedAPI = _NativeAnimatedHelper.default.API;
    var _uniqueId = 1;
    var AnimatedNode = class {
      static {
        __name(this, "AnimatedNode");
      }
      __attach() {
      }
      __detach() {
        if (this.__isNative && this.__nativeTag != null) {
          _NativeAnimatedHelper.default.API.dropAnimatedNode(this.__nativeTag);
          this.__nativeTag = void 0;
        }
      }
      __getValue() {
      }
      __getAnimatedValue() {
        return this.__getValue();
      }
      __addChild(child) {
      }
      __removeChild(child) {
      }
      __getChildren() {
        return [];
      }
      /* Methods and props used by native Animated impl */
      constructor() {
        this._listeners = {};
      }
      __makeNative(platformConfig) {
        if (!this.__isNative) {
          throw new Error('This node cannot be made a "native" animated node');
        }
        this._platformConfig = platformConfig;
        if (this.hasListeners()) {
          this._startListeningToNativeValueUpdates();
        }
      }
      /**
       * Adds an asynchronous listener to the value so you can observe updates from
       * animations.  This is useful because there is no way to
       * synchronously read the value because it might be driven natively.
       *
       * See https://reactnative.dev/docs/animatedvalue#addlistener
       */
      addListener(callback) {
        var id = String(_uniqueId++);
        this._listeners[id] = callback;
        if (this.__isNative) {
          this._startListeningToNativeValueUpdates();
        }
        return id;
      }
      /**
       * Unregister a listener. The `id` param shall match the identifier
       * previously returned by `addListener()`.
       *
       * See https://reactnative.dev/docs/animatedvalue#removelistener
       */
      removeListener(id) {
        delete this._listeners[id];
        if (this.__isNative && !this.hasListeners()) {
          this._stopListeningForNativeValueUpdates();
        }
      }
      /**
       * Remove all registered listeners.
       *
       * See https://reactnative.dev/docs/animatedvalue#removealllisteners
       */
      removeAllListeners() {
        this._listeners = {};
        if (this.__isNative) {
          this._stopListeningForNativeValueUpdates();
        }
      }
      hasListeners() {
        return !!Object.keys(this._listeners).length;
      }
      _startListeningToNativeValueUpdates() {
        if (this.__nativeAnimatedValueListener && !this.__shouldUpdateListenersForNewNativeTag) {
          return;
        }
        if (this.__shouldUpdateListenersForNewNativeTag) {
          this.__shouldUpdateListenersForNewNativeTag = false;
          this._stopListeningForNativeValueUpdates();
        }
        NativeAnimatedAPI.startListeningToAnimatedNodeValue(this.__getNativeTag());
        this.__nativeAnimatedValueListener = _NativeAnimatedHelper.default.nativeEventEmitter.addListener("onAnimatedValueUpdate", (data) => {
          if (data.tag !== this.__getNativeTag()) {
            return;
          }
          this.__onAnimatedValueUpdateReceived(data.value);
        });
      }
      __onAnimatedValueUpdateReceived(value) {
        this.__callListeners(value);
      }
      __callListeners(value) {
        for (var _key in this._listeners) {
          this._listeners[_key]({
            value
          });
        }
      }
      _stopListeningForNativeValueUpdates() {
        if (!this.__nativeAnimatedValueListener) {
          return;
        }
        this.__nativeAnimatedValueListener.remove();
        this.__nativeAnimatedValueListener = null;
        NativeAnimatedAPI.stopListeningToAnimatedNodeValue(this.__getNativeTag());
      }
      __getNativeTag() {
        var _this$__nativeTag;
        _NativeAnimatedHelper.default.assertNativeAnimatedModule();
        (0, _invariant.default)(this.__isNative, 'Attempt to get native tag from node not marked as "native"');
        var nativeTag = (_this$__nativeTag = this.__nativeTag) !== null && _this$__nativeTag !== void 0 ? _this$__nativeTag : _NativeAnimatedHelper.default.generateNewNodeTag();
        if (this.__nativeTag == null) {
          this.__nativeTag = nativeTag;
          var config = this.__getNativeConfig();
          if (this._platformConfig) {
            config.platformConfig = this._platformConfig;
          }
          _NativeAnimatedHelper.default.API.createAnimatedNode(nativeTag, config);
          this.__shouldUpdateListenersForNewNativeTag = true;
        }
        return nativeTag;
      }
      __getNativeConfig() {
        throw new Error("This JS animated node type cannot be used as native animated node");
      }
      toJSON() {
        return this.__getValue();
      }
      __getPlatformConfig() {
        return this._platformConfig;
      }
      __setPlatformConfig(platformConfig) {
        this._platformConfig = platformConfig;
      }
    };
    var _default = exports2.default = AnimatedNode;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedWithChildren.js
var require_AnimatedWithChildren = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedWithChildren.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _createForOfIteratorHelperLoose2 = _interopRequireDefault(require_createForOfIteratorHelperLoose());
    var _AnimatedNode = _interopRequireDefault(require_AnimatedNode());
    var _NativeAnimatedHelper = _interopRequireDefault(require_NativeAnimatedHelper());
    var AnimatedWithChildren = class extends _AnimatedNode.default {
      static {
        __name(this, "AnimatedWithChildren");
      }
      constructor() {
        super();
        this._children = [];
      }
      __makeNative(platformConfig) {
        if (!this.__isNative) {
          this.__isNative = true;
          for (var _iterator = (0, _createForOfIteratorHelperLoose2.default)(this._children), _step; !(_step = _iterator()).done; ) {
            var child = _step.value;
            child.__makeNative(platformConfig);
            _NativeAnimatedHelper.default.API.connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
          }
        }
        super.__makeNative(platformConfig);
      }
      __addChild(child) {
        if (this._children.length === 0) {
          this.__attach();
        }
        this._children.push(child);
        if (this.__isNative) {
          child.__makeNative(this.__getPlatformConfig());
          _NativeAnimatedHelper.default.API.connectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
        }
      }
      __removeChild(child) {
        var index = this._children.indexOf(child);
        if (index === -1) {
          console.warn("Trying to remove a child that doesn't exist");
          return;
        }
        if (this.__isNative && child.__isNative) {
          _NativeAnimatedHelper.default.API.disconnectAnimatedNodes(this.__getNativeTag(), child.__getNativeTag());
        }
        this._children.splice(index, 1);
        if (this._children.length === 0) {
          this.__detach();
        }
      }
      __getChildren() {
        return this._children;
      }
      __callListeners(value) {
        super.__callListeners(value);
        if (!this.__isNative) {
          for (var _iterator2 = (0, _createForOfIteratorHelperLoose2.default)(this._children), _step2; !(_step2 = _iterator2()).done; ) {
            var child = _step2.value;
            if (child.__getValue) {
              child.__callListeners(child.__getValue());
            }
          }
        }
      }
    };
    var _default = exports2.default = AnimatedWithChildren;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedInterpolation.js
var require_AnimatedInterpolation = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedInterpolation.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var _NativeAnimatedHelper = _interopRequireDefault(require_NativeAnimatedHelper());
    var _invariant = _interopRequireDefault(require_invariant());
    var _normalizeColors = _interopRequireDefault(require_normalize_colors());
    var __DEV__ = process.env.NODE_ENV !== "production";
    var linear = /* @__PURE__ */ __name((t) => t, "linear");
    function createInterpolation(config) {
      if (config.outputRange && typeof config.outputRange[0] === "string") {
        return createInterpolationFromStringOutputRange(config);
      }
      var outputRange = config.outputRange;
      var inputRange = config.inputRange;
      if (__DEV__) {
        checkInfiniteRange("outputRange", outputRange);
        checkInfiniteRange("inputRange", inputRange);
        checkValidInputRange(inputRange);
        (0, _invariant.default)(inputRange.length === outputRange.length, "inputRange (" + inputRange.length + ") and outputRange (" + outputRange.length + ") must have the same length");
      }
      var easing = config.easing || linear;
      var extrapolateLeft = "extend";
      if (config.extrapolateLeft !== void 0) {
        extrapolateLeft = config.extrapolateLeft;
      } else if (config.extrapolate !== void 0) {
        extrapolateLeft = config.extrapolate;
      }
      var extrapolateRight = "extend";
      if (config.extrapolateRight !== void 0) {
        extrapolateRight = config.extrapolateRight;
      } else if (config.extrapolate !== void 0) {
        extrapolateRight = config.extrapolate;
      }
      return (input) => {
        (0, _invariant.default)(typeof input === "number", "Cannot interpolation an input which is not a number");
        var range = findRange(input, inputRange);
        return interpolate(input, inputRange[range], inputRange[range + 1], outputRange[range], outputRange[range + 1], easing, extrapolateLeft, extrapolateRight);
      };
    }
    __name(createInterpolation, "createInterpolation");
    function interpolate(input, inputMin, inputMax, outputMin, outputMax, easing, extrapolateLeft, extrapolateRight) {
      var result = input;
      if (result < inputMin) {
        if (extrapolateLeft === "identity") {
          return result;
        } else if (extrapolateLeft === "clamp") {
          result = inputMin;
        } else if (extrapolateLeft === "extend") {
        }
      }
      if (result > inputMax) {
        if (extrapolateRight === "identity") {
          return result;
        } else if (extrapolateRight === "clamp") {
          result = inputMax;
        } else if (extrapolateRight === "extend") {
        }
      }
      if (outputMin === outputMax) {
        return outputMin;
      }
      if (inputMin === inputMax) {
        if (input <= inputMin) {
          return outputMin;
        }
        return outputMax;
      }
      if (inputMin === -Infinity) {
        result = -result;
      } else if (inputMax === Infinity) {
        result = result - inputMin;
      } else {
        result = (result - inputMin) / (inputMax - inputMin);
      }
      result = easing(result);
      if (outputMin === -Infinity) {
        result = -result;
      } else if (outputMax === Infinity) {
        result = result + outputMin;
      } else {
        result = result * (outputMax - outputMin) + outputMin;
      }
      return result;
    }
    __name(interpolate, "interpolate");
    function colorToRgba(input) {
      var normalizedColor = (0, _normalizeColors.default)(input);
      if (normalizedColor === null || typeof normalizedColor !== "number") {
        return input;
      }
      normalizedColor = normalizedColor || 0;
      var r = (normalizedColor & 4278190080) >>> 24;
      var g = (normalizedColor & 16711680) >>> 16;
      var b = (normalizedColor & 65280) >>> 8;
      var a = (normalizedColor & 255) / 255;
      return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
    }
    __name(colorToRgba, "colorToRgba");
    var stringShapeRegex = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
    function createInterpolationFromStringOutputRange(config) {
      var outputRange = config.outputRange;
      (0, _invariant.default)(outputRange.length >= 2, "Bad output range");
      outputRange = outputRange.map(colorToRgba);
      checkPattern(outputRange);
      var outputRanges = outputRange[0].match(stringShapeRegex).map(() => []);
      outputRange.forEach((value) => {
        value.match(stringShapeRegex).forEach((number, i) => {
          outputRanges[i].push(+number);
        });
      });
      var interpolations = outputRange[0].match(stringShapeRegex).map((value, i) => {
        return createInterpolation((0, _objectSpread2.default)((0, _objectSpread2.default)({}, config), {}, {
          outputRange: outputRanges[i]
        }));
      });
      var shouldRound = isRgbOrRgba(outputRange[0]);
      return (input) => {
        var i = 0;
        return outputRange[0].replace(stringShapeRegex, () => {
          var val = +interpolations[i++](input);
          if (shouldRound) {
            val = i < 4 ? Math.round(val) : Math.round(val * 1e3) / 1e3;
          }
          return String(val);
        });
      };
    }
    __name(createInterpolationFromStringOutputRange, "createInterpolationFromStringOutputRange");
    function isRgbOrRgba(range) {
      return typeof range === "string" && range.startsWith("rgb");
    }
    __name(isRgbOrRgba, "isRgbOrRgba");
    function checkPattern(arr) {
      var pattern = arr[0].replace(stringShapeRegex, "");
      for (var i = 1; i < arr.length; ++i) {
        (0, _invariant.default)(pattern === arr[i].replace(stringShapeRegex, ""), "invalid pattern " + arr[0] + " and " + arr[i]);
      }
    }
    __name(checkPattern, "checkPattern");
    function findRange(input, inputRange) {
      var i;
      for (i = 1; i < inputRange.length - 1; ++i) {
        if (inputRange[i] >= input) {
          break;
        }
      }
      return i - 1;
    }
    __name(findRange, "findRange");
    function checkValidInputRange(arr) {
      (0, _invariant.default)(arr.length >= 2, "inputRange must have at least 2 elements");
      var message = "inputRange must be monotonically non-decreasing " + String(arr);
      for (var i = 1; i < arr.length; ++i) {
        (0, _invariant.default)(arr[i] >= arr[i - 1], message);
      }
    }
    __name(checkValidInputRange, "checkValidInputRange");
    function checkInfiniteRange(name, arr) {
      (0, _invariant.default)(arr.length >= 2, name + " must have at least 2 elements");
      (0, _invariant.default)(
        arr.length !== 2 || arr[0] !== -Infinity || arr[1] !== Infinity,
        /* $FlowFixMe[incompatible-type] (>=0.13.0) - In the addition expression
         * below this comment, one or both of the operands may be something that
         * doesn't cleanly convert to a string, like undefined, null, and object,
         * etc. If you really mean this implicit string conversion, you can do
         * something like String(myThing) */
        name + "cannot be ]-infinity;+infinity[ " + arr
      );
    }
    __name(checkInfiniteRange, "checkInfiniteRange");
    var AnimatedInterpolation = class _AnimatedInterpolation extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedInterpolation");
      }
      // Export for testing.
      constructor(parent, config) {
        super();
        this._parent = parent;
        this._config = config;
        this._interpolation = createInterpolation(config);
      }
      __makeNative(platformConfig) {
        this._parent.__makeNative(platformConfig);
        super.__makeNative(platformConfig);
      }
      __getValue() {
        var parentValue = this._parent.__getValue();
        (0, _invariant.default)(typeof parentValue === "number", "Cannot interpolate an input which is not a number.");
        return this._interpolation(parentValue);
      }
      interpolate(config) {
        return new _AnimatedInterpolation(this, config);
      }
      __attach() {
        this._parent.__addChild(this);
      }
      __detach() {
        this._parent.__removeChild(this);
        super.__detach();
      }
      __transformDataType(range) {
        return range.map(_NativeAnimatedHelper.default.transformDataType);
      }
      __getNativeConfig() {
        if (__DEV__) {
          _NativeAnimatedHelper.default.validateInterpolation(this._config);
        }
        return {
          inputRange: this._config.inputRange,
          // Only the `outputRange` can contain strings so we don't need to transform `inputRange` here
          outputRange: this.__transformDataType(this._config.outputRange),
          extrapolateLeft: this._config.extrapolateLeft || this._config.extrapolate || "extend",
          extrapolateRight: this._config.extrapolateRight || this._config.extrapolate || "extend",
          type: "interpolation"
        };
      }
    };
    AnimatedInterpolation.__createInterpolation = createInterpolation;
    var _default = exports2.default = AnimatedInterpolation;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedValue.js
var require_AnimatedValue = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedValue.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedInterpolation = _interopRequireDefault(require_AnimatedInterpolation());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var _InteractionManager = _interopRequireDefault(require_InteractionManager());
    var _NativeAnimatedHelper = _interopRequireDefault(require_NativeAnimatedHelper());
    var NativeAnimatedAPI = _NativeAnimatedHelper.default.API;
    function _flush(rootNode) {
      var animatedStyles = /* @__PURE__ */ new Set();
      function findAnimatedStyles(node) {
        if (typeof node.update === "function") {
          animatedStyles.add(node);
        } else {
          node.__getChildren().forEach(findAnimatedStyles);
        }
      }
      __name(findAnimatedStyles, "findAnimatedStyles");
      findAnimatedStyles(rootNode);
      animatedStyles.forEach((animatedStyle) => animatedStyle.update());
    }
    __name(_flush, "_flush");
    function _executeAsAnimatedBatch(id, operation) {
      NativeAnimatedAPI.setWaitingForIdentifier(id);
      operation();
      NativeAnimatedAPI.unsetWaitingForIdentifier(id);
    }
    __name(_executeAsAnimatedBatch, "_executeAsAnimatedBatch");
    var AnimatedValue = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedValue");
      }
      constructor(value, config) {
        super();
        if (typeof value !== "number") {
          throw new Error("AnimatedValue: Attempting to set value to undefined");
        }
        this._startingValue = this._value = value;
        this._offset = 0;
        this._animation = null;
        if (config && config.useNativeDriver) {
          this.__makeNative();
        }
      }
      __detach() {
        if (this.__isNative) {
          NativeAnimatedAPI.getValue(this.__getNativeTag(), (value) => {
            this._value = value - this._offset;
          });
        }
        this.stopAnimation();
        super.__detach();
      }
      __getValue() {
        return this._value + this._offset;
      }
      /**
       * Directly set the value.  This will stop any animations running on the value
       * and update all the bound properties.
       *
       * See https://reactnative.dev/docs/animatedvalue#setvalue
       */
      setValue(value) {
        if (this._animation) {
          this._animation.stop();
          this._animation = null;
        }
        this._updateValue(
          value,
          !this.__isNative
          /* don't perform a flush for natively driven values */
        );
        if (this.__isNative) {
          _executeAsAnimatedBatch(this.__getNativeTag().toString(), () => NativeAnimatedAPI.setAnimatedNodeValue(this.__getNativeTag(), value));
        }
      }
      /**
       * Sets an offset that is applied on top of whatever value is set, whether via
       * `setValue`, an animation, or `Animated.event`.  Useful for compensating
       * things like the start of a pan gesture.
       *
       * See https://reactnative.dev/docs/animatedvalue#setoffset
       */
      setOffset(offset) {
        this._offset = offset;
        if (this.__isNative) {
          NativeAnimatedAPI.setAnimatedNodeOffset(this.__getNativeTag(), offset);
        }
      }
      /**
       * Merges the offset value into the base value and resets the offset to zero.
       * The final output of the value is unchanged.
       *
       * See https://reactnative.dev/docs/animatedvalue#flattenoffset
       */
      flattenOffset() {
        this._value += this._offset;
        this._offset = 0;
        if (this.__isNative) {
          NativeAnimatedAPI.flattenAnimatedNodeOffset(this.__getNativeTag());
        }
      }
      /**
       * Sets the offset value to the base value, and resets the base value to zero.
       * The final output of the value is unchanged.
       *
       * See https://reactnative.dev/docs/animatedvalue#extractoffset
       */
      extractOffset() {
        this._offset += this._value;
        this._value = 0;
        if (this.__isNative) {
          NativeAnimatedAPI.extractAnimatedNodeOffset(this.__getNativeTag());
        }
      }
      /**
       * Stops any running animation or tracking. `callback` is invoked with the
       * final value after stopping the animation, which is useful for updating
       * state to match the animation position with layout.
       *
       * See https://reactnative.dev/docs/animatedvalue#stopanimation
       */
      stopAnimation(callback) {
        this.stopTracking();
        this._animation && this._animation.stop();
        this._animation = null;
        if (callback) {
          if (this.__isNative) {
            NativeAnimatedAPI.getValue(this.__getNativeTag(), callback);
          } else {
            callback(this.__getValue());
          }
        }
      }
      /**
       * Stops any animation and resets the value to its original.
       *
       * See https://reactnative.dev/docs/animatedvalue#resetanimation
       */
      resetAnimation(callback) {
        this.stopAnimation(callback);
        this._value = this._startingValue;
        if (this.__isNative) {
          NativeAnimatedAPI.setAnimatedNodeValue(this.__getNativeTag(), this._startingValue);
        }
      }
      __onAnimatedValueUpdateReceived(value) {
        this._updateValue(
          value,
          false
          /*flush*/
        );
      }
      /**
       * Interpolates the value before updating the property, e.g. mapping 0-1 to
       * 0-10.
       */
      interpolate(config) {
        return new _AnimatedInterpolation.default(this, config);
      }
      /**
       * Typically only used internally, but could be used by a custom Animation
       * class.
       *
       * See https://reactnative.dev/docs/animatedvalue#animate
       */
      animate(animation, callback) {
        var handle = null;
        if (animation.__isInteraction) {
          handle = _InteractionManager.default.createInteractionHandle();
        }
        var previousAnimation = this._animation;
        this._animation && this._animation.stop();
        this._animation = animation;
        animation.start(this._value, (value) => {
          this._updateValue(
            value,
            true
            /* flush */
          );
        }, (result) => {
          this._animation = null;
          if (handle !== null) {
            _InteractionManager.default.clearInteractionHandle(handle);
          }
          callback && callback(result);
        }, previousAnimation, this);
      }
      /**
       * Typically only used internally.
       */
      stopTracking() {
        this._tracking && this._tracking.__detach();
        this._tracking = null;
      }
      /**
       * Typically only used internally.
       */
      track(tracking) {
        this.stopTracking();
        this._tracking = tracking;
        this._tracking && this._tracking.update();
      }
      _updateValue(value, flush) {
        if (value === void 0) {
          throw new Error("AnimatedValue: Attempting to set value to undefined");
        }
        this._value = value;
        if (flush) {
          _flush(this);
        }
        super.__callListeners(this.__getValue());
      }
      __getNativeConfig() {
        return {
          type: "value",
          value: this._value,
          offset: this._offset
        };
      }
    };
    var _default = exports2.default = AnimatedValue;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/AnimatedEvent.js
var require_AnimatedEvent = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/AnimatedEvent.js"(exports2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.AnimatedEvent = void 0;
    exports2.attachNativeEvent = attachNativeEvent;
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _NativeAnimatedHelper = _interopRequireWildcard(require_NativeAnimatedHelper());
    var _invariant = _interopRequireDefault(require_invariant());
    var __DEV__ = process.env.NODE_ENV !== "production";
    function attachNativeEvent(viewRef, eventName, argMapping) {
      var eventMappings = [];
      var traverse = /* @__PURE__ */ __name((value, path) => {
        if (value instanceof _AnimatedValue.default) {
          value.__makeNative();
          eventMappings.push({
            nativeEventPath: path,
            animatedValueTag: value.__getNativeTag()
          });
        } else if (typeof value === "object") {
          for (var _key in value) {
            traverse(value[_key], path.concat(_key));
          }
        }
      }, "traverse");
      (0, _invariant.default)(argMapping[0] && argMapping[0].nativeEvent, "Native driven events only support animated values contained inside `nativeEvent`.");
      traverse(argMapping[0].nativeEvent, []);
      if (viewRef != null) {
        eventMappings.forEach((mapping) => {
          _NativeAnimatedHelper.default.API.addAnimatedEventToView(viewRef, eventName, mapping);
        });
      }
      return {
        detach() {
          if (viewRef != null) {
            eventMappings.forEach((mapping) => {
              _NativeAnimatedHelper.default.API.removeAnimatedEventFromView(
                viewRef,
                eventName,
                // $FlowFixMe[incompatible-call]
                mapping.animatedValueTag
              );
            });
          }
        }
      };
    }
    __name(attachNativeEvent, "attachNativeEvent");
    function validateMapping(argMapping, args) {
      var validate = /* @__PURE__ */ __name((recMapping, recEvt, key) => {
        if (recMapping instanceof _AnimatedValue.default) {
          (0, _invariant.default)(typeof recEvt === "number", "Bad mapping of event key " + key + ", should be number but got " + typeof recEvt);
          return;
        }
        if (typeof recEvt === "number") {
          (0, _invariant.default)(recMapping instanceof _AnimatedValue.default, "Bad mapping of type " + typeof recMapping + " for key " + key + ", event value must map to AnimatedValue");
          return;
        }
        (0, _invariant.default)(typeof recMapping === "object", "Bad mapping of type " + typeof recMapping + " for key " + key);
        (0, _invariant.default)(typeof recEvt === "object", "Bad event of type " + typeof recEvt + " for key " + key);
        for (var mappingKey in recMapping) {
          validate(recMapping[mappingKey], recEvt[mappingKey], mappingKey);
        }
      }, "validate");
      (0, _invariant.default)(args.length >= argMapping.length, "Event has less arguments than mapping");
      argMapping.forEach((mapping, idx) => {
        validate(mapping, args[idx], "arg" + idx);
      });
    }
    __name(validateMapping, "validateMapping");
    var AnimatedEvent = class {
      static {
        __name(this, "AnimatedEvent");
      }
      constructor(argMapping, config) {
        this._listeners = [];
        this._argMapping = argMapping;
        if (config == null) {
          console.warn("Animated.event now requires a second argument for options");
          config = {
            useNativeDriver: false
          };
        }
        if (config.listener) {
          this.__addListener(config.listener);
        }
        this._callListeners = this._callListeners.bind(this);
        this._attachedEvent = null;
        this.__isNative = (0, _NativeAnimatedHelper.shouldUseNativeDriver)(config);
      }
      __addListener(callback) {
        this._listeners.push(callback);
      }
      __removeListener(callback) {
        this._listeners = this._listeners.filter((listener) => listener !== callback);
      }
      __attach(viewRef, eventName) {
        (0, _invariant.default)(this.__isNative, "Only native driven events need to be attached.");
        this._attachedEvent = attachNativeEvent(viewRef, eventName, this._argMapping);
      }
      __detach(viewTag, eventName) {
        (0, _invariant.default)(this.__isNative, "Only native driven events need to be detached.");
        this._attachedEvent && this._attachedEvent.detach();
      }
      __getHandler() {
        var _this = this;
        if (this.__isNative) {
          if (__DEV__) {
            var _validatedMapping = false;
            return function() {
              for (var _len = arguments.length, args = new Array(_len), _key2 = 0; _key2 < _len; _key2++) {
                args[_key2] = arguments[_key2];
              }
              if (!_validatedMapping) {
                validateMapping(_this._argMapping, args);
                _validatedMapping = true;
              }
              _this._callListeners(...args);
            };
          } else {
            return this._callListeners;
          }
        }
        var validatedMapping = false;
        return function() {
          for (var _len2 = arguments.length, args = new Array(_len2), _key3 = 0; _key3 < _len2; _key3++) {
            args[_key3] = arguments[_key3];
          }
          if (__DEV__ && !validatedMapping) {
            validateMapping(_this._argMapping, args);
            validatedMapping = true;
          }
          var traverse = /* @__PURE__ */ __name((recMapping, recEvt, key) => {
            if (recMapping instanceof _AnimatedValue.default) {
              if (typeof recEvt === "number") {
                recMapping.setValue(recEvt);
              }
            } else if (typeof recMapping === "object") {
              for (var mappingKey in recMapping) {
                traverse(recMapping[mappingKey], recEvt[mappingKey], mappingKey);
              }
            }
          }, "traverse");
          _this._argMapping.forEach((mapping, idx) => {
            traverse(mapping, args[idx], "arg" + idx);
          });
          _this._callListeners(...args);
        };
      }
      _callListeners() {
        for (var _len3 = arguments.length, args = new Array(_len3), _key4 = 0; _key4 < _len3; _key4++) {
          args[_key4] = arguments[_key4];
        }
        this._listeners.forEach((listener) => listener(...args));
      }
    };
    exports2.AnimatedEvent = AnimatedEvent;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedTransform.js
var require_AnimatedTransform = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedTransform.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedNode = _interopRequireDefault(require_AnimatedNode());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var _NativeAnimatedHelper = _interopRequireDefault(require_NativeAnimatedHelper());
    var AnimatedTransform = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedTransform");
      }
      constructor(transforms) {
        super();
        this._transforms = transforms;
      }
      __makeNative() {
        this._transforms.forEach((transform) => {
          for (var key in transform) {
            var value = transform[key];
            if (value instanceof _AnimatedNode.default) {
              value.__makeNative();
            }
          }
        });
        super.__makeNative();
      }
      __getValue() {
        return this._transforms.map((transform) => {
          var result = {};
          for (var key in transform) {
            var value = transform[key];
            if (value instanceof _AnimatedNode.default) {
              result[key] = value.__getValue();
            } else {
              result[key] = value;
            }
          }
          return result;
        });
      }
      __getAnimatedValue() {
        return this._transforms.map((transform) => {
          var result = {};
          for (var key in transform) {
            var value = transform[key];
            if (value instanceof _AnimatedNode.default) {
              result[key] = value.__getAnimatedValue();
            } else {
              result[key] = value;
            }
          }
          return result;
        });
      }
      __attach() {
        this._transforms.forEach((transform) => {
          for (var key in transform) {
            var value = transform[key];
            if (value instanceof _AnimatedNode.default) {
              value.__addChild(this);
            }
          }
        });
      }
      __detach() {
        this._transforms.forEach((transform) => {
          for (var key in transform) {
            var value = transform[key];
            if (value instanceof _AnimatedNode.default) {
              value.__removeChild(this);
            }
          }
        });
        super.__detach();
      }
      __getNativeConfig() {
        var transConfigs = [];
        this._transforms.forEach((transform) => {
          for (var key in transform) {
            var value = transform[key];
            if (value instanceof _AnimatedNode.default) {
              transConfigs.push({
                type: "animated",
                property: key,
                nodeTag: value.__getNativeTag()
              });
            } else {
              transConfigs.push({
                type: "static",
                property: key,
                value: _NativeAnimatedHelper.default.transformDataType(value)
              });
            }
          }
        });
        _NativeAnimatedHelper.default.validateTransform(transConfigs);
        return {
          type: "transform",
          transforms: transConfigs
        };
      }
    };
    var _default = exports2.default = AnimatedTransform;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedStyle.js
var require_AnimatedStyle = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedStyle.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedNode = _interopRequireDefault(require_AnimatedNode());
    var _AnimatedTransform = _interopRequireDefault(require_AnimatedTransform());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var _NativeAnimatedHelper = _interopRequireDefault(require_NativeAnimatedHelper());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var flattenStyle = _StyleSheet.default.flatten;
    function createAnimatedStyle(inputStyle) {
      var style = flattenStyle(inputStyle);
      var animatedStyles = {};
      for (var key in style) {
        var value = style[key];
        if (key === "transform" && Array.isArray(value)) {
          animatedStyles[key] = new _AnimatedTransform.default(value);
        } else if (value instanceof _AnimatedNode.default) {
          animatedStyles[key] = value;
        } else if (value && !Array.isArray(value) && typeof value === "object") {
          animatedStyles[key] = createAnimatedStyle(value);
        }
      }
      return animatedStyles;
    }
    __name(createAnimatedStyle, "createAnimatedStyle");
    var AnimatedStyle = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedStyle");
      }
      constructor(style) {
        super();
        this._inputStyle = style;
        this._style = createAnimatedStyle(style);
      }
      // Recursively get values for nested styles (like iOS's shadowOffset)
      _walkStyleAndGetValues(style) {
        var updatedStyle = {};
        for (var key in style) {
          var value = style[key];
          if (value instanceof _AnimatedNode.default) {
            if (!value.__isNative) {
              updatedStyle[key] = value.__getValue();
            }
          } else if (value && !Array.isArray(value) && typeof value === "object") {
            updatedStyle[key] = this._walkStyleAndGetValues(value);
          } else {
            updatedStyle[key] = value;
          }
        }
        return updatedStyle;
      }
      __getValue() {
        return [this._inputStyle, this._walkStyleAndGetValues(this._style)];
      }
      // Recursively get animated values for nested styles (like iOS's shadowOffset)
      _walkStyleAndGetAnimatedValues(style) {
        var updatedStyle = {};
        for (var key in style) {
          var value = style[key];
          if (value instanceof _AnimatedNode.default) {
            updatedStyle[key] = value.__getAnimatedValue();
          } else if (value && !Array.isArray(value) && typeof value === "object") {
            updatedStyle[key] = this._walkStyleAndGetAnimatedValues(value);
          }
        }
        return updatedStyle;
      }
      __getAnimatedValue() {
        return this._walkStyleAndGetAnimatedValues(this._style);
      }
      __attach() {
        for (var key in this._style) {
          var value = this._style[key];
          if (value instanceof _AnimatedNode.default) {
            value.__addChild(this);
          }
        }
      }
      __detach() {
        for (var key in this._style) {
          var value = this._style[key];
          if (value instanceof _AnimatedNode.default) {
            value.__removeChild(this);
          }
        }
        super.__detach();
      }
      __makeNative() {
        for (var key in this._style) {
          var value = this._style[key];
          if (value instanceof _AnimatedNode.default) {
            value.__makeNative();
          }
        }
        super.__makeNative();
      }
      __getNativeConfig() {
        var styleConfig = {};
        for (var styleKey in this._style) {
          if (this._style[styleKey] instanceof _AnimatedNode.default) {
            var style = this._style[styleKey];
            style.__makeNative();
            styleConfig[styleKey] = style.__getNativeTag();
          }
        }
        _NativeAnimatedHelper.default.validateStyles(styleConfig);
        return {
          type: "style",
          style: styleConfig
        };
      }
    };
    var _default = exports2.default = AnimatedStyle;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedProps.js
var require_AnimatedProps = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedProps.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _AnimatedEvent = require_AnimatedEvent();
    var _AnimatedNode = _interopRequireDefault(require_AnimatedNode());
    var _AnimatedStyle = _interopRequireDefault(require_AnimatedStyle());
    var _NativeAnimatedHelper = _interopRequireDefault(require_NativeAnimatedHelper());
    var _invariant = _interopRequireDefault(require_invariant());
    var AnimatedProps = class extends _AnimatedNode.default {
      static {
        __name(this, "AnimatedProps");
      }
      constructor(props, callback) {
        super();
        if (props.style) {
          props = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, props), {}, {
            style: new _AnimatedStyle.default(props.style)
          });
        }
        this._props = props;
        this._callback = callback;
      }
      __getValue() {
        var props = {};
        for (var key in this._props) {
          var value = this._props[key];
          if (value instanceof _AnimatedNode.default) {
            if (!value.__isNative || value instanceof _AnimatedStyle.default) {
              props[key] = value.__getValue();
            }
          } else if (value instanceof _AnimatedEvent.AnimatedEvent) {
            props[key] = value.__getHandler();
          } else {
            props[key] = value;
          }
        }
        return props;
      }
      __getAnimatedValue() {
        var props = {};
        for (var key in this._props) {
          var value = this._props[key];
          if (value instanceof _AnimatedNode.default) {
            props[key] = value.__getAnimatedValue();
          }
        }
        return props;
      }
      __attach() {
        for (var key in this._props) {
          var value = this._props[key];
          if (value instanceof _AnimatedNode.default) {
            value.__addChild(this);
          }
        }
      }
      __detach() {
        if (this.__isNative && this._animatedView) {
          this.__disconnectAnimatedView();
        }
        this._animatedView = null;
        for (var key in this._props) {
          var value = this._props[key];
          if (value instanceof _AnimatedNode.default) {
            value.__removeChild(this);
          }
        }
        super.__detach();
      }
      update() {
        this._callback();
      }
      __makeNative() {
        if (!this.__isNative) {
          this.__isNative = true;
          for (var key in this._props) {
            var value = this._props[key];
            if (value instanceof _AnimatedNode.default) {
              value.__makeNative();
            }
          }
          if (this._animatedView) {
            this.__connectAnimatedView();
          }
        }
      }
      setNativeView(animatedView) {
        if (this._animatedView === animatedView) {
          return;
        }
        this._animatedView = animatedView;
        if (this.__isNative) {
          this.__connectAnimatedView();
        }
      }
      __connectAnimatedView() {
        (0, _invariant.default)(this.__isNative, 'Expected node to be marked as "native"');
        var nativeViewTag = this._animatedView;
        (0, _invariant.default)(nativeViewTag != null, "Unable to locate attached view in the native tree");
        _NativeAnimatedHelper.default.API.connectAnimatedNodeToView(this.__getNativeTag(), nativeViewTag);
      }
      __disconnectAnimatedView() {
        (0, _invariant.default)(this.__isNative, 'Expected node to be marked as "native"');
        var nativeViewTag = this._animatedView;
        (0, _invariant.default)(nativeViewTag != null, "Unable to locate attached view in the native tree");
        _NativeAnimatedHelper.default.API.disconnectAnimatedNodeFromView(this.__getNativeTag(), nativeViewTag);
      }
      __restoreDefaultValues() {
        if (this.__isNative) {
          _NativeAnimatedHelper.default.API.restoreDefaultValues(this.__getNativeTag());
        }
      }
      __getNativeConfig() {
        var propsConfig = {};
        for (var propKey in this._props) {
          var value = this._props[propKey];
          if (value instanceof _AnimatedNode.default) {
            value.__makeNative();
            propsConfig[propKey] = value.__getNativeTag();
          }
        }
        return {
          type: "props",
          props: propsConfig
        };
      }
    };
    var _default = exports2.default = AnimatedProps;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Utilities/useRefEffect.js
var require_useRefEffect = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Utilities/useRefEffect.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = useRefEffect;
    var _react = require("react");
    function useRefEffect(effect) {
      var cleanupRef = (0, _react.useRef)(void 0);
      return (0, _react.useCallback)((instance) => {
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = void 0;
        }
        if (instance != null) {
          cleanupRef.current = effect(instance);
        }
      }, [effect]);
    }
    __name(useRefEffect, "useRefEffect");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/useAnimatedProps.js
var require_useAnimatedProps = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/useAnimatedProps.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = useAnimatedProps;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _AnimatedProps = _interopRequireDefault(require_AnimatedProps());
    var _AnimatedEvent = require_AnimatedEvent();
    var _useRefEffect = _interopRequireDefault(require_useRefEffect());
    var _NativeAnimatedHelper = _interopRequireDefault(require_NativeAnimatedHelper());
    var _react = require("react");
    var _useLayoutEffect = _interopRequireDefault(require_useLayoutEffect());
    function useAnimatedProps(props) {
      var _useReducer = (0, _react.useReducer)((count) => count + 1, 0), scheduleUpdate = _useReducer[1];
      var onUpdateRef = (0, _react.useRef)(null);
      var node = (0, _react.useMemo)(() => new _AnimatedProps.default(props, () => onUpdateRef.current == null ? void 0 : onUpdateRef.current()), [props]);
      useAnimatedPropsLifecycle(node);
      var refEffect = (0, _react.useCallback)((instance) => {
        node.setNativeView(instance);
        onUpdateRef.current = () => {
          scheduleUpdate();
        };
        var target = getEventTarget(instance);
        var events = [];
        for (var propName in props) {
          var propValue = props[propName];
          if (propValue instanceof _AnimatedEvent.AnimatedEvent && propValue.__isNative) {
            propValue.__attach(target, propName);
            events.push([propName, propValue]);
          }
        }
        return () => {
          onUpdateRef.current = null;
          for (var _i = 0, _events = events; _i < _events.length; _i++) {
            var _events$_i = _events[_i], _propName = _events$_i[0], _propValue = _events$_i[1];
            _propValue.__detach(target, _propName);
          }
        };
      }, [props, node]);
      var callbackRef = (0, _useRefEffect.default)(refEffect);
      return [reduceAnimatedProps(node), callbackRef];
    }
    __name(useAnimatedProps, "useAnimatedProps");
    function reduceAnimatedProps(node) {
      return (0, _objectSpread2.default)((0, _objectSpread2.default)({}, node.__getValue()), {}, {
        collapsable: false
      });
    }
    __name(reduceAnimatedProps, "reduceAnimatedProps");
    function useAnimatedPropsLifecycle(node) {
      var prevNodeRef = (0, _react.useRef)(null);
      var isUnmountingRef = (0, _react.useRef)(false);
      (0, _react.useEffect)(() => {
        _NativeAnimatedHelper.default.API.flushQueue();
      });
      (0, _useLayoutEffect.default)(() => {
        isUnmountingRef.current = false;
        return () => {
          isUnmountingRef.current = true;
        };
      }, []);
      (0, _useLayoutEffect.default)(() => {
        node.__attach();
        if (prevNodeRef.current != null) {
          var prevNode = prevNodeRef.current;
          prevNode.__restoreDefaultValues();
          prevNode.__detach();
          prevNodeRef.current = null;
        }
        return () => {
          if (isUnmountingRef.current) {
            node.__detach();
          } else {
            prevNodeRef.current = node;
          }
        };
      }, [node]);
    }
    __name(useAnimatedPropsLifecycle, "useAnimatedPropsLifecycle");
    function getEventTarget(instance) {
      return typeof instance === "object" && typeof (instance == null ? void 0 : instance.getScrollableNode) === "function" ? (
        // $FlowFixMe[incompatible-use] - Legacy instance assumptions.
        instance.getScrollableNode()
      ) : instance;
    }
    __name(getEventTarget, "getEventTarget");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Utilities/useMergeRefs.js
var require_useMergeRefs2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Utilities/useMergeRefs.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = useMergeRefs;
    var _react = require("react");
    function useMergeRefs() {
      for (var _len = arguments.length, refs = new Array(_len), _key = 0; _key < _len; _key++) {
        refs[_key] = arguments[_key];
      }
      return (0, _react.useCallback)(
        (current) => {
          for (var _i = 0, _refs = refs; _i < _refs.length; _i++) {
            var ref = _refs[_i];
            if (ref != null) {
              if (typeof ref === "function") {
                ref(current);
              } else {
                ref.current = current;
              }
            }
          }
        },
        [...refs]
        // eslint-disable-line react-hooks/exhaustive-deps
      );
    }
    __name(useMergeRefs, "useMergeRefs");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/createAnimatedComponent.js
var require_createAnimatedComponent = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/createAnimatedComponent.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = createAnimatedComponent;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _useAnimatedProps2 = _interopRequireDefault(require_useAnimatedProps());
    var _useMergeRefs = _interopRequireDefault(require_useMergeRefs2());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var React24 = _interopRequireWildcard(require("react"));
    var _excluded = ["style"];
    function createAnimatedComponent(Component) {
      return /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
        var _useAnimatedProps = (0, _useAnimatedProps2.default)(props), reducedProps = _useAnimatedProps[0], callbackRef = _useAnimatedProps[1];
        var ref = (0, _useMergeRefs.default)(callbackRef, forwardedRef);
        var passthroughAnimatedPropExplicitValues = reducedProps.passthroughAnimatedPropExplicitValues, style = reducedProps.style;
        var _ref = passthroughAnimatedPropExplicitValues !== null && passthroughAnimatedPropExplicitValues !== void 0 ? passthroughAnimatedPropExplicitValues : {}, passthroughStyle = _ref.style, passthroughProps = (0, _objectWithoutPropertiesLoose2.default)(_ref, _excluded);
        var mergedStyle = [style, passthroughStyle];
        return /* @__PURE__ */ React24.createElement(Component, (0, _extends2.default)({}, reducedProps, passthroughProps, {
          style: mergedStyle,
          ref
        }));
      });
    }
    __name(createAnimatedComponent, "createAnimatedComponent");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedFlatList.js
var require_AnimatedFlatList = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedFlatList.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var React24 = _interopRequireWildcard(require("react"));
    var _FlatList = _interopRequireDefault(require_FlatList2());
    var _createAnimatedComponent = _interopRequireDefault(require_createAnimatedComponent());
    var FlatListWithEventThrottle = /* @__PURE__ */ React24.forwardRef((props, ref) => /* @__PURE__ */ React24.createElement(_FlatList.default, (0, _extends2.default)({
      scrollEventThrottle: 1e-4
    }, props, {
      ref
    })));
    var _default = exports2.default = (0, _createAnimatedComponent.default)(FlatListWithEventThrottle);
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/AssetRegistry/index.js
var require_AssetRegistry = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/AssetRegistry/index.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.getAssetByID = getAssetByID;
    exports2.registerAsset = registerAsset;
    var assets = [];
    function registerAsset(asset) {
      return assets.push(asset);
    }
    __name(registerAsset, "registerAsset");
    function getAssetByID(assetId) {
      return assets[assetId - 1];
    }
    __name(getAssetByID, "getAssetByID");
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/ImageLoader/index.js
var require_ImageLoader = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/ImageLoader/index.js"(exports2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = exports2.ImageUriCache = void 0;
    var dataUriPattern = /^data:/;
    var ImageUriCache = class _ImageUriCache {
      static {
        __name(this, "ImageUriCache");
      }
      static has(uri) {
        var entries = _ImageUriCache._entries;
        var isDataUri = dataUriPattern.test(uri);
        return isDataUri || Boolean(entries[uri]);
      }
      static add(uri) {
        var entries = _ImageUriCache._entries;
        var lastUsedTimestamp = Date.now();
        if (entries[uri]) {
          entries[uri].lastUsedTimestamp = lastUsedTimestamp;
          entries[uri].refCount += 1;
        } else {
          entries[uri] = {
            lastUsedTimestamp,
            refCount: 1
          };
        }
      }
      static remove(uri) {
        var entries = _ImageUriCache._entries;
        if (entries[uri]) {
          entries[uri].refCount -= 1;
        }
        _ImageUriCache._cleanUpIfNeeded();
      }
      static _cleanUpIfNeeded() {
        var entries = _ImageUriCache._entries;
        var imageUris = Object.keys(entries);
        if (imageUris.length + 1 > _ImageUriCache._maximumEntries) {
          var leastRecentlyUsedKey;
          var leastRecentlyUsedEntry;
          imageUris.forEach((uri) => {
            var entry = entries[uri];
            if ((!leastRecentlyUsedEntry || entry.lastUsedTimestamp < leastRecentlyUsedEntry.lastUsedTimestamp) && entry.refCount === 0) {
              leastRecentlyUsedKey = uri;
              leastRecentlyUsedEntry = entry;
            }
          });
          if (leastRecentlyUsedKey) {
            delete entries[leastRecentlyUsedKey];
          }
        }
      }
    };
    exports2.ImageUriCache = ImageUriCache;
    ImageUriCache._maximumEntries = 256;
    ImageUriCache._entries = {};
    var id = 0;
    var requests = {};
    var ImageLoader = {
      abort(requestId) {
        var image = requests["" + requestId];
        if (image) {
          image.onerror = null;
          image.onload = null;
          image = null;
          delete requests["" + requestId];
        }
      },
      getSize(uri, success, failure) {
        var complete = false;
        var interval = setInterval(callback, 16);
        var requestId = ImageLoader.load(uri, callback, errorCallback);
        function callback() {
          var image = requests["" + requestId];
          if (image) {
            var naturalHeight = image.naturalHeight, naturalWidth = image.naturalWidth;
            if (naturalHeight && naturalWidth) {
              success(naturalWidth, naturalHeight);
              complete = true;
            }
          }
          if (complete) {
            ImageLoader.abort(requestId);
            clearInterval(interval);
          }
        }
        __name(callback, "callback");
        function errorCallback() {
          if (typeof failure === "function") {
            failure();
          }
          ImageLoader.abort(requestId);
          clearInterval(interval);
        }
        __name(errorCallback, "errorCallback");
      },
      has(uri) {
        return ImageUriCache.has(uri);
      },
      load(uri, onLoad, onError) {
        id += 1;
        var image = new window.Image();
        image.onerror = onError;
        image.onload = (e) => {
          var onDecode = /* @__PURE__ */ __name(() => onLoad({
            nativeEvent: e
          }), "onDecode");
          if (typeof image.decode === "function") {
            image.decode().then(onDecode, onDecode);
          } else {
            setTimeout(onDecode, 0);
          }
        };
        image.src = uri;
        requests["" + id] = image;
        return id;
      },
      prefetch(uri) {
        return new Promise((resolve, reject) => {
          ImageLoader.load(uri, () => {
            ImageUriCache.add(uri);
            ImageUriCache.remove(uri);
            resolve();
          }, reject);
        });
      },
      queryCache(uris) {
        var result = {};
        uris.forEach((u) => {
          if (ImageUriCache.has(u)) {
            result[u] = "disk/memory";
          }
        });
        return Promise.resolve(result);
      }
    };
    var _default = exports2.default = ImageLoader;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/PixelRatio/index.js
var require_PixelRatio = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/PixelRatio/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _Dimensions = _interopRequireDefault(require_Dimensions());
    var PixelRatio = class _PixelRatio {
      static {
        __name(this, "PixelRatio");
      }
      /**
       * Returns the device pixel density.
       */
      static get() {
        return _Dimensions.default.get("window").scale;
      }
      /**
       * No equivalent for Web
       */
      static getFontScale() {
        return _Dimensions.default.get("window").fontScale || _PixelRatio.get();
      }
      /**
       * Converts a layout size (dp) to pixel size (px).
       * Guaranteed to return an integer number.
       */
      static getPixelSizeForLayoutSize(layoutSize) {
        return Math.round(layoutSize * _PixelRatio.get());
      }
      /**
       * Rounds a layout size (dp) to the nearest layout size that corresponds to
       * an integer number of pixels. For example, on a device with a PixelRatio
       * of 3, `PixelRatio.roundToNearestPixel(8.4) = 8.33`, which corresponds to
       * exactly (8.33 * 3) = 25 pixels.
       */
      static roundToNearestPixel(layoutSize) {
        var ratio = _PixelRatio.get();
        return Math.round(layoutSize * ratio) / ratio;
      }
    };
    exports2.default = PixelRatio;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Image/index.js
var require_Image = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Image/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _createElement = _interopRequireDefault(require_createElement());
    var _AssetRegistry = require_AssetRegistry();
    var _preprocess = require_preprocess();
    var _ImageLoader = _interopRequireDefault(require_ImageLoader());
    var _PixelRatio = _interopRequireDefault(require_PixelRatio());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _TextAncestorContext = _interopRequireDefault(require_TextAncestorContext());
    var _View = _interopRequireDefault(require_View());
    var _warnOnce = require_warnOnce();
    var _excluded = ["aria-label", "accessibilityLabel", "blurRadius", "defaultSource", "draggable", "onError", "onLayout", "onLoad", "onLoadEnd", "onLoadStart", "pointerEvents", "source", "style"];
    var ERRORED = "ERRORED";
    var LOADED = "LOADED";
    var LOADING = "LOADING";
    var IDLE = "IDLE";
    var _filterId = 0;
    var svgDataUriPattern = /^(data:image\/svg\+xml;utf8,)(.*)/;
    function createTintColorSVG(tintColor, id) {
      return tintColor && id != null ? /* @__PURE__ */ React24.createElement("svg", {
        style: {
          position: "absolute",
          height: 0,
          visibility: "hidden",
          width: 0
        }
      }, /* @__PURE__ */ React24.createElement("defs", null, /* @__PURE__ */ React24.createElement("filter", {
        id: "tint-" + id,
        suppressHydrationWarning: true
      }, /* @__PURE__ */ React24.createElement("feFlood", {
        floodColor: "" + tintColor,
        key: tintColor
      }), /* @__PURE__ */ React24.createElement("feComposite", {
        in2: "SourceAlpha",
        operator: "in"
      })))) : null;
    }
    __name(createTintColorSVG, "createTintColorSVG");
    function extractNonStandardStyleProps(style, blurRadius, filterId, tintColorProp) {
      var flatStyle = _StyleSheet.default.flatten(style);
      var filter = flatStyle.filter, resizeMode = flatStyle.resizeMode, shadowOffset = flatStyle.shadowOffset, tintColor = flatStyle.tintColor;
      if (flatStyle.resizeMode) {
        (0, _warnOnce.warnOnce)("Image.style.resizeMode", "Image: style.resizeMode is deprecated. Please use props.resizeMode.");
      }
      if (flatStyle.tintColor) {
        (0, _warnOnce.warnOnce)("Image.style.tintColor", "Image: style.tintColor is deprecated. Please use props.tintColor.");
      }
      var filters = [];
      var _filter = null;
      if (filter) {
        filters.push(filter);
      }
      if (blurRadius) {
        filters.push("blur(" + blurRadius + "px)");
      }
      if (shadowOffset) {
        var shadowString = (0, _preprocess.createBoxShadowValue)(flatStyle);
        if (shadowString) {
          filters.push("drop-shadow(" + shadowString + ")");
        }
      }
      if ((tintColorProp || tintColor) && filterId != null) {
        filters.push("url(#tint-" + filterId + ")");
      }
      if (filters.length > 0) {
        _filter = filters.join(" ");
      }
      return [resizeMode, _filter, tintColor];
    }
    __name(extractNonStandardStyleProps, "extractNonStandardStyleProps");
    function resolveAssetDimensions(source) {
      if (typeof source === "number") {
        var _getAssetByID = (0, _AssetRegistry.getAssetByID)(source), _height = _getAssetByID.height, _width = _getAssetByID.width;
        return {
          height: _height,
          width: _width
        };
      } else if (source != null && !Array.isArray(source) && typeof source === "object") {
        var _height2 = source.height, _width2 = source.width;
        return {
          height: _height2,
          width: _width2
        };
      }
    }
    __name(resolveAssetDimensions, "resolveAssetDimensions");
    function resolveAssetUri(source) {
      var uri = null;
      if (typeof source === "number") {
        var asset = (0, _AssetRegistry.getAssetByID)(source);
        if (asset == null) {
          throw new Error('Image: asset with ID "' + source + '" could not be found. Please check the image source or packager.');
        }
        var scale = asset.scales[0];
        if (asset.scales.length > 1) {
          var preferredScale = _PixelRatio.default.get();
          scale = asset.scales.reduce((prev, curr) => Math.abs(curr - preferredScale) < Math.abs(prev - preferredScale) ? curr : prev);
        }
        var scaleSuffix = scale !== 1 ? "@" + scale + "x" : "";
        uri = asset ? asset.httpServerLocation + "/" + asset.name + scaleSuffix + "." + asset.type : "";
      } else if (typeof source === "string") {
        uri = source;
      } else if (source && typeof source.uri === "string") {
        uri = source.uri;
      }
      if (uri) {
        var match = uri.match(svgDataUriPattern);
        if (match) {
          var prefix = match[1], svg = match[2];
          var encodedSvg = encodeURIComponent(svg);
          return "" + prefix + encodedSvg;
        }
      }
      return uri;
    }
    __name(resolveAssetUri, "resolveAssetUri");
    var Image = /* @__PURE__ */ React24.forwardRef((props, ref) => {
      var _ariaLabel = props["aria-label"], accessibilityLabel = props.accessibilityLabel, blurRadius = props.blurRadius, defaultSource = props.defaultSource, draggable = props.draggable, onError = props.onError, onLayout = props.onLayout, onLoad = props.onLoad, onLoadEnd = props.onLoadEnd, onLoadStart = props.onLoadStart, pointerEvents = props.pointerEvents, source = props.source, style = props.style, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var ariaLabel = _ariaLabel || accessibilityLabel;
      if (process.env.NODE_ENV !== "production") {
        if (props.children) {
          throw new Error("The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.");
        }
      }
      var _React$useState = React24.useState(() => {
        var uri2 = resolveAssetUri(source);
        if (uri2 != null) {
          var isLoaded = _ImageLoader.default.has(uri2);
          if (isLoaded) {
            return LOADED;
          }
        }
        return IDLE;
      }), state = _React$useState[0], updateState = _React$useState[1];
      var _React$useState2 = React24.useState({}), layout = _React$useState2[0], updateLayout = _React$useState2[1];
      var hasTextAncestor = React24.useContext(_TextAncestorContext.default);
      var hiddenImageRef = React24.useRef(null);
      var filterRef = React24.useRef(_filterId++);
      var requestRef = React24.useRef(null);
      var shouldDisplaySource = state === LOADED || state === LOADING && defaultSource == null;
      var _extractNonStandardSt = extractNonStandardStyleProps(style, blurRadius, filterRef.current, props.tintColor), _resizeMode = _extractNonStandardSt[0], filter = _extractNonStandardSt[1], _tintColor = _extractNonStandardSt[2];
      var resizeMode = props.resizeMode || _resizeMode || "cover";
      var tintColor = props.tintColor || _tintColor;
      var selectedSource = shouldDisplaySource ? source : defaultSource;
      var displayImageUri = resolveAssetUri(selectedSource);
      var imageSizeStyle = resolveAssetDimensions(selectedSource);
      var backgroundImage = displayImageUri ? 'url("' + displayImageUri + '")' : null;
      var backgroundSize = getBackgroundSize();
      var hiddenImage = displayImageUri ? (0, _createElement.default)("img", {
        alt: ariaLabel || "",
        style: styles.accessibilityImage$raw,
        draggable: draggable || false,
        ref: hiddenImageRef,
        src: displayImageUri
      }) : null;
      function getBackgroundSize() {
        if (hiddenImageRef.current != null && (resizeMode === "center" || resizeMode === "repeat")) {
          var _hiddenImageRef$curre = hiddenImageRef.current, naturalHeight = _hiddenImageRef$curre.naturalHeight, naturalWidth = _hiddenImageRef$curre.naturalWidth;
          var _height3 = layout.height, _width3 = layout.width;
          if (naturalHeight && naturalWidth && _height3 && _width3) {
            var scaleFactor = Math.min(1, _width3 / naturalWidth, _height3 / naturalHeight);
            var x = Math.ceil(scaleFactor * naturalWidth);
            var y = Math.ceil(scaleFactor * naturalHeight);
            return x + "px " + y + "px";
          }
        }
      }
      __name(getBackgroundSize, "getBackgroundSize");
      function handleLayout(e) {
        if (resizeMode === "center" || resizeMode === "repeat" || onLayout) {
          var _layout = e.nativeEvent.layout;
          onLayout && onLayout(e);
          updateLayout(_layout);
        }
      }
      __name(handleLayout, "handleLayout");
      var uri = resolveAssetUri(source);
      React24.useEffect(() => {
        abortPendingRequest();
        if (uri != null) {
          updateState(LOADING);
          if (onLoadStart) {
            onLoadStart();
          }
          requestRef.current = _ImageLoader.default.load(uri, /* @__PURE__ */ __name(function load(e) {
            updateState(LOADED);
            if (onLoad) {
              onLoad(e);
            }
            if (onLoadEnd) {
              onLoadEnd();
            }
          }, "load"), /* @__PURE__ */ __name(function error() {
            updateState(ERRORED);
            if (onError) {
              onError({
                nativeEvent: {
                  error: "Failed to load resource " + uri
                }
              });
            }
            if (onLoadEnd) {
              onLoadEnd();
            }
          }, "error"));
        }
        function abortPendingRequest() {
          if (requestRef.current != null) {
            _ImageLoader.default.abort(requestRef.current);
            requestRef.current = null;
          }
        }
        __name(abortPendingRequest, "abortPendingRequest");
        return abortPendingRequest;
      }, [uri, requestRef, updateState, onError, onLoad, onLoadEnd, onLoadStart]);
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, rest, {
        "aria-label": ariaLabel,
        onLayout: handleLayout,
        pointerEvents,
        ref,
        style: [
          styles.root,
          hasTextAncestor && styles.inline,
          imageSizeStyle,
          style,
          styles.undo,
          // TEMP: avoid deprecated shadow props regression
          // until Image refactored to use createElement.
          {
            boxShadow: null
          }
        ]
      }), /* @__PURE__ */ React24.createElement(_View.default, {
        style: [styles.image, resizeModeStyles[resizeMode], {
          backgroundImage,
          filter
        }, backgroundSize != null && {
          backgroundSize
        }],
        suppressHydrationWarning: true
      }), hiddenImage, createTintColorSVG(tintColor, filterRef.current));
    });
    Image.displayName = "Image";
    var ImageWithStatics = Image;
    ImageWithStatics.getSize = function(uri, success, failure) {
      _ImageLoader.default.getSize(uri, success, failure);
    };
    ImageWithStatics.prefetch = function(uri) {
      return _ImageLoader.default.prefetch(uri);
    };
    ImageWithStatics.queryCache = function(uris) {
      return _ImageLoader.default.queryCache(uris);
    };
    var styles = _StyleSheet.default.create({
      root: {
        flexBasis: "auto",
        overflow: "hidden",
        zIndex: 0
      },
      inline: {
        display: "inline-flex"
      },
      undo: {
        // These styles are converted to CSS filters applied to the
        // element displaying the background image.
        blurRadius: null,
        shadowColor: null,
        shadowOpacity: null,
        shadowOffset: null,
        shadowRadius: null,
        tintColor: null,
        // These styles are not supported
        overlayColor: null,
        resizeMode: null
      },
      image: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, _StyleSheet.default.absoluteFillObject), {}, {
        backgroundColor: "transparent",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        height: "100%",
        width: "100%",
        zIndex: -1
      }),
      accessibilityImage$raw: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, _StyleSheet.default.absoluteFillObject), {}, {
        height: "100%",
        opacity: 0,
        width: "100%",
        zIndex: -1
      })
    });
    var resizeModeStyles = _StyleSheet.default.create({
      center: {
        backgroundSize: "auto"
      },
      contain: {
        backgroundSize: "contain"
      },
      cover: {
        backgroundSize: "cover"
      },
      none: {
        backgroundPosition: "0",
        backgroundSize: "auto"
      },
      repeat: {
        backgroundPosition: "0",
        backgroundRepeat: "repeat",
        backgroundSize: "auto"
      },
      stretch: {
        backgroundSize: "100% 100%"
      }
    });
    var _default = exports2.default = ImageWithStatics;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedImage.js
var require_AnimatedImage = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedImage.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var React24 = _interopRequireWildcard(require("react"));
    var _Image = _interopRequireDefault(require_Image());
    var _createAnimatedComponent = _interopRequireDefault(require_createAnimatedComponent());
    var _default = exports2.default = (0, _createAnimatedComponent.default)(_Image.default);
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedScrollView.js
var require_AnimatedScrollView = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedScrollView.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var React24 = _interopRequireWildcard(require("react"));
    var _ScrollView = _interopRequireDefault(require_ScrollView());
    var _createAnimatedComponent = _interopRequireDefault(require_createAnimatedComponent());
    var ScrollViewWithEventThrottle = /* @__PURE__ */ React24.forwardRef((props, ref) => /* @__PURE__ */ React24.createElement(_ScrollView.default, (0, _extends2.default)({
      scrollEventThrottle: 1e-4
    }, props, {
      ref
    })));
    var _default = exports2.default = (0, _createAnimatedComponent.default)(ScrollViewWithEventThrottle);
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedSectionList/index.js
var require_VirtualizedSectionList = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/VirtualizedSectionList/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _createForOfIteratorHelperLoose2 = _interopRequireDefault(require_createForOfIteratorHelperLoose());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _View = _interopRequireDefault(require_View());
    var _VirtualizedList = _interopRequireDefault(require_VirtualizedList());
    var _VirtualizeUtils = require_VirtualizeUtils();
    var _invariant = _interopRequireDefault(require_invariant());
    var React24 = _interopRequireWildcard(require("react"));
    var _excluded = ["ItemSeparatorComponent", "SectionSeparatorComponent", "renderItem", "renderSectionFooter", "renderSectionHeader", "sections", "stickySectionHeadersEnabled"];
    var VirtualizedSectionList = class extends React24.PureComponent {
      static {
        __name(this, "VirtualizedSectionList");
      }
      constructor() {
        super(...arguments);
        this._keyExtractor = (item, index) => {
          var info = this._subExtractor(index);
          return info && info.key || String(index);
        };
        this._convertViewable = (viewable) => {
          var _info$index;
          (0, _invariant.default)(viewable.index != null, "Received a broken ViewToken");
          var info = this._subExtractor(viewable.index);
          if (!info) {
            return null;
          }
          var keyExtractorWithNullableIndex = info.section.keyExtractor;
          var keyExtractorWithNonNullableIndex = this.props.keyExtractor || _VirtualizeUtils.keyExtractor;
          var key = keyExtractorWithNullableIndex != null ? keyExtractorWithNullableIndex(viewable.item, info.index) : keyExtractorWithNonNullableIndex(viewable.item, (_info$index = info.index) !== null && _info$index !== void 0 ? _info$index : 0);
          return (0, _objectSpread2.default)((0, _objectSpread2.default)({}, viewable), {}, {
            index: info.index,
            key,
            section: info.section
          });
        };
        this._onViewableItemsChanged = (_ref) => {
          var viewableItems = _ref.viewableItems, changed = _ref.changed;
          var onViewableItemsChanged = this.props.onViewableItemsChanged;
          if (onViewableItemsChanged != null) {
            onViewableItemsChanged({
              viewableItems: viewableItems.map(this._convertViewable, this).filter(Boolean),
              changed: changed.map(this._convertViewable, this).filter(Boolean)
            });
          }
        };
        this._renderItem = (listItemCount) => (
          // eslint-disable-next-line react/no-unstable-nested-components
          (_ref2) => {
            var item = _ref2.item, index = _ref2.index;
            var info = this._subExtractor(index);
            if (!info) {
              return null;
            }
            var infoIndex = info.index;
            if (infoIndex == null) {
              var section = info.section;
              if (info.header === true) {
                var renderSectionHeader = this.props.renderSectionHeader;
                return renderSectionHeader ? renderSectionHeader({
                  section
                }) : null;
              } else {
                var renderSectionFooter = this.props.renderSectionFooter;
                return renderSectionFooter ? renderSectionFooter({
                  section
                }) : null;
              }
            } else {
              var renderItem = info.section.renderItem || this.props.renderItem;
              var SeparatorComponent = this._getSeparatorComponent(index, info, listItemCount);
              (0, _invariant.default)(renderItem, "no renderItem!");
              return /* @__PURE__ */ React24.createElement(ItemWithSeparator, {
                SeparatorComponent,
                LeadingSeparatorComponent: infoIndex === 0 ? this.props.SectionSeparatorComponent : void 0,
                cellKey: info.key,
                index: infoIndex,
                item,
                leadingItem: info.leadingItem,
                leadingSection: info.leadingSection,
                prevCellKey: (this._subExtractor(index - 1) || {}).key,
                setSelfHighlightCallback: this._setUpdateHighlightFor,
                setSelfUpdatePropsCallback: this._setUpdatePropsFor,
                updateHighlightFor: this._updateHighlightFor,
                updatePropsFor: this._updatePropsFor,
                renderItem,
                section: info.section,
                trailingItem: info.trailingItem,
                trailingSection: info.trailingSection,
                inverted: !!this.props.inverted
              });
            }
          }
        );
        this._updatePropsFor = (cellKey, value) => {
          var updateProps = this._updatePropsMap[cellKey];
          if (updateProps != null) {
            updateProps(value);
          }
        };
        this._updateHighlightFor = (cellKey, value) => {
          var updateHighlight = this._updateHighlightMap[cellKey];
          if (updateHighlight != null) {
            updateHighlight(value);
          }
        };
        this._setUpdateHighlightFor = (cellKey, updateHighlightFn) => {
          if (updateHighlightFn != null) {
            this._updateHighlightMap[cellKey] = updateHighlightFn;
          } else {
            delete this._updateHighlightFor[cellKey];
          }
        };
        this._setUpdatePropsFor = (cellKey, updatePropsFn) => {
          if (updatePropsFn != null) {
            this._updatePropsMap[cellKey] = updatePropsFn;
          } else {
            delete this._updatePropsMap[cellKey];
          }
        };
        this._updateHighlightMap = {};
        this._updatePropsMap = {};
        this._captureRef = (ref) => {
          this._listRef = ref;
        };
      }
      scrollToLocation(params) {
        var index = params.itemIndex;
        for (var i = 0; i < params.sectionIndex; i++) {
          index += this.props.getItemCount(this.props.sections[i].data) + 2;
        }
        var viewOffset = params.viewOffset || 0;
        if (this._listRef == null) {
          return;
        }
        if (params.itemIndex > 0 && this.props.stickySectionHeadersEnabled) {
          var frame = this._listRef.__getFrameMetricsApprox(index - params.itemIndex, this._listRef.props);
          viewOffset += frame.length;
        }
        var toIndexParams = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, params), {}, {
          viewOffset,
          index
        });
        this._listRef.scrollToIndex(toIndexParams);
      }
      getListRef() {
        return this._listRef;
      }
      render() {
        var _this$props = this.props, ItemSeparatorComponent = _this$props.ItemSeparatorComponent, SectionSeparatorComponent = _this$props.SectionSeparatorComponent, _renderItem = _this$props.renderItem, renderSectionFooter = _this$props.renderSectionFooter, renderSectionHeader = _this$props.renderSectionHeader, _sections = _this$props.sections, stickySectionHeadersEnabled = _this$props.stickySectionHeadersEnabled, passThroughProps = (0, _objectWithoutPropertiesLoose2.default)(_this$props, _excluded);
        var listHeaderOffset = this.props.ListHeaderComponent ? 1 : 0;
        var stickyHeaderIndices = this.props.stickySectionHeadersEnabled ? [] : void 0;
        var itemCount = 0;
        for (var _iterator = (0, _createForOfIteratorHelperLoose2.default)(this.props.sections), _step; !(_step = _iterator()).done; ) {
          var section = _step.value;
          if (stickyHeaderIndices != null) {
            stickyHeaderIndices.push(itemCount + listHeaderOffset);
          }
          itemCount += 2;
          itemCount += this.props.getItemCount(section.data);
        }
        var renderItem = this._renderItem(itemCount);
        return /* @__PURE__ */ React24.createElement(_VirtualizedList.default, (0, _extends2.default)({}, passThroughProps, {
          keyExtractor: this._keyExtractor,
          stickyHeaderIndices,
          renderItem,
          data: this.props.sections,
          getItem: /* @__PURE__ */ __name((sections, index) => this._getItem(this.props, sections, index), "getItem"),
          getItemCount: /* @__PURE__ */ __name(() => itemCount, "getItemCount"),
          onViewableItemsChanged: this.props.onViewableItemsChanged ? this._onViewableItemsChanged : void 0,
          ref: this._captureRef
        }));
      }
      _getItem(props, sections, index) {
        if (!sections) {
          return null;
        }
        var itemIdx = index - 1;
        for (var i = 0; i < sections.length; i++) {
          var section = sections[i];
          var sectionData = section.data;
          var itemCount = props.getItemCount(sectionData);
          if (itemIdx === -1 || itemIdx === itemCount) {
            return section;
          } else if (itemIdx < itemCount) {
            return props.getItem(sectionData, itemIdx);
          } else {
            itemIdx -= itemCount + 2;
          }
        }
        return null;
      }
      // $FlowFixMe[missing-local-annot]
      _subExtractor(index) {
        var itemIndex = index;
        var _this$props2 = this.props, getItem = _this$props2.getItem, getItemCount = _this$props2.getItemCount, keyExtractor = _this$props2.keyExtractor, sections = _this$props2.sections;
        for (var i = 0; i < sections.length; i++) {
          var section = sections[i];
          var sectionData = section.data;
          var key = section.key || String(i);
          itemIndex -= 1;
          if (itemIndex >= getItemCount(sectionData) + 1) {
            itemIndex -= getItemCount(sectionData) + 1;
          } else if (itemIndex === -1) {
            return {
              section,
              key: key + ":header",
              index: null,
              header: true,
              trailingSection: sections[i + 1]
            };
          } else if (itemIndex === getItemCount(sectionData)) {
            return {
              section,
              key: key + ":footer",
              index: null,
              header: false,
              trailingSection: sections[i + 1]
            };
          } else {
            var extractor = section.keyExtractor || keyExtractor || _VirtualizeUtils.keyExtractor;
            return {
              section,
              key: key + ":" + extractor(getItem(sectionData, itemIndex), itemIndex),
              index: itemIndex,
              leadingItem: getItem(sectionData, itemIndex - 1),
              leadingSection: sections[i - 1],
              trailingItem: getItem(sectionData, itemIndex + 1),
              trailingSection: sections[i + 1]
            };
          }
        }
      }
      _getSeparatorComponent(index, info, listItemCount) {
        info = info || this._subExtractor(index);
        if (!info) {
          return null;
        }
        var ItemSeparatorComponent = info.section.ItemSeparatorComponent || this.props.ItemSeparatorComponent;
        var SectionSeparatorComponent = this.props.SectionSeparatorComponent;
        var isLastItemInList = index === listItemCount - 1;
        var isLastItemInSection = info.index === this.props.getItemCount(info.section.data) - 1;
        if (SectionSeparatorComponent && isLastItemInSection) {
          return SectionSeparatorComponent;
        }
        if (ItemSeparatorComponent && !isLastItemInSection && !isLastItemInList) {
          return ItemSeparatorComponent;
        }
        return null;
      }
    };
    function ItemWithSeparator(props) {
      var LeadingSeparatorComponent = props.LeadingSeparatorComponent, SeparatorComponent = props.SeparatorComponent, cellKey = props.cellKey, prevCellKey = props.prevCellKey, setSelfHighlightCallback = props.setSelfHighlightCallback, updateHighlightFor = props.updateHighlightFor, setSelfUpdatePropsCallback = props.setSelfUpdatePropsCallback, updatePropsFor = props.updatePropsFor, item = props.item, index = props.index, section = props.section, inverted = props.inverted;
      var _React$useState = React24.useState(false), leadingSeparatorHiglighted = _React$useState[0], setLeadingSeparatorHighlighted = _React$useState[1];
      var _React$useState2 = React24.useState(false), separatorHighlighted = _React$useState2[0], setSeparatorHighlighted = _React$useState2[1];
      var _React$useState3 = React24.useState({
        leadingItem: props.leadingItem,
        leadingSection: props.leadingSection,
        section: props.section,
        trailingItem: props.item,
        trailingSection: props.trailingSection
      }), leadingSeparatorProps = _React$useState3[0], setLeadingSeparatorProps = _React$useState3[1];
      var _React$useState4 = React24.useState({
        leadingItem: props.item,
        leadingSection: props.leadingSection,
        section: props.section,
        trailingItem: props.trailingItem,
        trailingSection: props.trailingSection
      }), separatorProps = _React$useState4[0], setSeparatorProps = _React$useState4[1];
      React24.useEffect(() => {
        setSelfHighlightCallback(cellKey, setSeparatorHighlighted);
        setSelfUpdatePropsCallback(cellKey, setSeparatorProps);
        return () => {
          setSelfUpdatePropsCallback(cellKey, null);
          setSelfHighlightCallback(cellKey, null);
        };
      }, [cellKey, setSelfHighlightCallback, setSeparatorProps, setSelfUpdatePropsCallback]);
      var separators = {
        highlight: /* @__PURE__ */ __name(() => {
          setLeadingSeparatorHighlighted(true);
          setSeparatorHighlighted(true);
          if (prevCellKey != null) {
            updateHighlightFor(prevCellKey, true);
          }
        }, "highlight"),
        unhighlight: /* @__PURE__ */ __name(() => {
          setLeadingSeparatorHighlighted(false);
          setSeparatorHighlighted(false);
          if (prevCellKey != null) {
            updateHighlightFor(prevCellKey, false);
          }
        }, "unhighlight"),
        updateProps: /* @__PURE__ */ __name((select, newProps) => {
          if (select === "leading") {
            if (LeadingSeparatorComponent != null) {
              setLeadingSeparatorProps((0, _objectSpread2.default)((0, _objectSpread2.default)({}, leadingSeparatorProps), newProps));
            } else if (prevCellKey != null) {
              updatePropsFor(prevCellKey, (0, _objectSpread2.default)((0, _objectSpread2.default)({}, leadingSeparatorProps), newProps));
            }
          } else if (select === "trailing" && SeparatorComponent != null) {
            setSeparatorProps((0, _objectSpread2.default)((0, _objectSpread2.default)({}, separatorProps), newProps));
          }
        }, "updateProps")
      };
      var element = props.renderItem({
        item,
        index,
        section,
        separators
      });
      var leadingSeparator = LeadingSeparatorComponent != null && /* @__PURE__ */ React24.createElement(LeadingSeparatorComponent, (0, _extends2.default)({
        highlighted: leadingSeparatorHiglighted
      }, leadingSeparatorProps));
      var separator = SeparatorComponent != null && /* @__PURE__ */ React24.createElement(SeparatorComponent, (0, _extends2.default)({
        highlighted: separatorHighlighted
      }, separatorProps));
      return leadingSeparator || separator ? /* @__PURE__ */ React24.createElement(_View.default, null, inverted === false ? leadingSeparator : separator, element, inverted === false ? separator : leadingSeparator) : element;
    }
    __name(ItemWithSeparator, "ItemWithSeparator");
    var _default = exports2.default = VirtualizedSectionList;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/SectionList/index.js
var require_SectionList = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/SectionList/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _Platform = _interopRequireDefault(require_Platform());
    var React24 = _interopRequireWildcard(require("react"));
    var _VirtualizedSectionList = _interopRequireDefault(require_VirtualizedSectionList());
    var _excluded = ["stickySectionHeadersEnabled"];
    var SectionList = class extends React24.PureComponent {
      static {
        __name(this, "SectionList");
      }
      constructor() {
        super(...arguments);
        this._captureRef = (ref) => {
          this._wrapperListRef = ref;
        };
      }
      /**
       * Scrolls to the item at the specified `sectionIndex` and `itemIndex` (within the section)
       * positioned in the viewable area such that `viewPosition` 0 places it at the top (and may be
       * covered by a sticky header), 1 at the bottom, and 0.5 centered in the middle. `viewOffset` is a
       * fixed number of pixels to offset the final target position, e.g. to compensate for sticky
       * headers.
       *
       * Note: cannot scroll to locations outside the render window without specifying the
       * `getItemLayout` prop.
       */
      scrollToLocation(params) {
        if (this._wrapperListRef != null) {
          this._wrapperListRef.scrollToLocation(params);
        }
      }
      /**
       * Tells the list an interaction has occurred, which should trigger viewability calculations, e.g.
       * if `waitForInteractions` is true and the user has not scrolled. This is typically called by
       * taps on items or by navigation actions.
       */
      recordInteraction() {
        var listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
        listRef && listRef.recordInteraction();
      }
      /**
       * Displays the scroll indicators momentarily.
       *
       * @platform ios
       */
      flashScrollIndicators() {
        var listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
        listRef && listRef.flashScrollIndicators();
      }
      /**
       * Provides a handle to the underlying scroll responder.
       */
      getScrollResponder() {
        var listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
        if (listRef) {
          return listRef.getScrollResponder();
        }
      }
      getScrollableNode() {
        var listRef = this._wrapperListRef && this._wrapperListRef.getListRef();
        if (listRef) {
          return listRef.getScrollableNode();
        }
      }
      render() {
        var _this$props = this.props, _stickySectionHeadersEnabled = _this$props.stickySectionHeadersEnabled, restProps = (0, _objectWithoutPropertiesLoose2.default)(_this$props, _excluded);
        var stickySectionHeadersEnabled = _stickySectionHeadersEnabled !== null && _stickySectionHeadersEnabled !== void 0 ? _stickySectionHeadersEnabled : _Platform.default.OS === "ios";
        return /* @__PURE__ */ React24.createElement(_VirtualizedSectionList.default, (0, _extends2.default)({}, restProps, {
          stickySectionHeadersEnabled,
          ref: this._captureRef,
          getItemCount: /* @__PURE__ */ __name((items) => items.length, "getItemCount"),
          getItem: /* @__PURE__ */ __name((items, index) => items[index], "getItem")
        }));
      }
    };
    exports2.default = SectionList;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/SectionList/index.js
var require_SectionList2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/SectionList/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _SectionList = _interopRequireDefault(require_SectionList());
    var _default = exports2.default = _SectionList.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedSectionList.js
var require_AnimatedSectionList = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedSectionList.js"(exports2, module2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var React24 = _interopRequireWildcard(require("react"));
    var _SectionList = _interopRequireDefault(require_SectionList2());
    var _createAnimatedComponent = _interopRequireDefault(require_createAnimatedComponent());
    var SectionListWithEventThrottle = /* @__PURE__ */ React24.forwardRef((props, ref) => /* @__PURE__ */ React24.createElement(_SectionList.default, (0, _extends2.default)({
      scrollEventThrottle: 1e-4
    }, props, {
      ref
    })));
    var _default = exports2.default = (0, _createAnimatedComponent.default)(SectionListWithEventThrottle);
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Text/index.js
var require_Text = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Text/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _createElement = _interopRequireDefault(require_createElement());
    var forwardedProps = _interopRequireWildcard(require_forwardedProps());
    var _pick = _interopRequireDefault(require_pick());
    var _useElementLayout = _interopRequireDefault(require_useElementLayout());
    var _useMergeRefs = _interopRequireDefault(require_useMergeRefs());
    var _usePlatformMethods = _interopRequireDefault(require_usePlatformMethods());
    var _useResponderEvents = _interopRequireDefault(require_useResponderEvents());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _TextAncestorContext = _interopRequireDefault(require_TextAncestorContext());
    var _useLocale = require_useLocale();
    var _excluded = ["hrefAttrs", "numberOfLines", "onClick", "onLayout", "onPress", "onMoveShouldSetResponder", "onMoveShouldSetResponderCapture", "onResponderEnd", "onResponderGrant", "onResponderMove", "onResponderReject", "onResponderRelease", "onResponderStart", "onResponderTerminate", "onResponderTerminationRequest", "onScrollShouldSetResponder", "onScrollShouldSetResponderCapture", "onSelectionChangeShouldSetResponder", "onSelectionChangeShouldSetResponderCapture", "onStartShouldSetResponder", "onStartShouldSetResponderCapture", "selectable"];
    var forwardPropsList = Object.assign({}, forwardedProps.defaultProps, forwardedProps.accessibilityProps, forwardedProps.clickProps, forwardedProps.focusProps, forwardedProps.keyboardProps, forwardedProps.mouseProps, forwardedProps.touchProps, forwardedProps.styleProps, {
      href: true,
      lang: true,
      pointerEvents: true
    });
    var pickProps = /* @__PURE__ */ __name((props) => (0, _pick.default)(props, forwardPropsList), "pickProps");
    var Text5 = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var hrefAttrs = props.hrefAttrs, numberOfLines = props.numberOfLines, onClick = props.onClick, onLayout = props.onLayout, onPress = props.onPress, onMoveShouldSetResponder = props.onMoveShouldSetResponder, onMoveShouldSetResponderCapture = props.onMoveShouldSetResponderCapture, onResponderEnd = props.onResponderEnd, onResponderGrant = props.onResponderGrant, onResponderMove = props.onResponderMove, onResponderReject = props.onResponderReject, onResponderRelease = props.onResponderRelease, onResponderStart = props.onResponderStart, onResponderTerminate = props.onResponderTerminate, onResponderTerminationRequest = props.onResponderTerminationRequest, onScrollShouldSetResponder = props.onScrollShouldSetResponder, onScrollShouldSetResponderCapture = props.onScrollShouldSetResponderCapture, onSelectionChangeShouldSetResponder = props.onSelectionChangeShouldSetResponder, onSelectionChangeShouldSetResponderCapture = props.onSelectionChangeShouldSetResponderCapture, onStartShouldSetResponder = props.onStartShouldSetResponder, onStartShouldSetResponderCapture = props.onStartShouldSetResponderCapture, selectable = props.selectable, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var hasTextAncestor = React24.useContext(_TextAncestorContext.default);
      var hostRef = React24.useRef(null);
      var _useLocaleContext = (0, _useLocale.useLocaleContext)(), contextDirection = _useLocaleContext.direction;
      (0, _useElementLayout.default)(hostRef, onLayout);
      (0, _useResponderEvents.default)(hostRef, {
        onMoveShouldSetResponder,
        onMoveShouldSetResponderCapture,
        onResponderEnd,
        onResponderGrant,
        onResponderMove,
        onResponderReject,
        onResponderRelease,
        onResponderStart,
        onResponderTerminate,
        onResponderTerminationRequest,
        onScrollShouldSetResponder,
        onScrollShouldSetResponderCapture,
        onSelectionChangeShouldSetResponder,
        onSelectionChangeShouldSetResponderCapture,
        onStartShouldSetResponder,
        onStartShouldSetResponderCapture
      });
      var handleClick = React24.useCallback((e) => {
        if (onClick != null) {
          onClick(e);
        } else if (onPress != null) {
          e.stopPropagation();
          onPress(e);
        }
      }, [onClick, onPress]);
      var component = hasTextAncestor ? "span" : "div";
      var langDirection = props.lang != null ? (0, _useLocale.getLocaleDirection)(props.lang) : null;
      var componentDirection = props.dir || langDirection;
      var writingDirection = componentDirection || contextDirection;
      var supportedProps = pickProps(rest);
      supportedProps.dir = componentDirection;
      if (!hasTextAncestor) {
        supportedProps.dir = componentDirection != null ? componentDirection : "auto";
      }
      if (onClick || onPress) {
        supportedProps.onClick = handleClick;
      }
      supportedProps.style = [numberOfLines != null && numberOfLines > 1 && {
        WebkitLineClamp: numberOfLines
      }, hasTextAncestor === true ? styles.textHasAncestor$raw : styles.text$raw, numberOfLines === 1 && styles.textOneLine, numberOfLines != null && numberOfLines > 1 && styles.textMultiLine, props.style, selectable === true && styles.selectable, selectable === false && styles.notSelectable, onPress && styles.pressable];
      if (props.href != null) {
        component = "a";
        if (hrefAttrs != null) {
          var download = hrefAttrs.download, rel = hrefAttrs.rel, target = hrefAttrs.target;
          if (download != null) {
            supportedProps.download = download;
          }
          if (rel != null) {
            supportedProps.rel = rel;
          }
          if (typeof target === "string") {
            supportedProps.target = target.charAt(0) !== "_" ? "_" + target : target;
          }
        }
      }
      var platformMethodsRef = (0, _usePlatformMethods.default)(supportedProps);
      var setRef2 = (0, _useMergeRefs.default)(hostRef, platformMethodsRef, forwardedRef);
      supportedProps.ref = setRef2;
      var element = (0, _createElement.default)(component, supportedProps, {
        writingDirection
      });
      return hasTextAncestor ? element : /* @__PURE__ */ React24.createElement(_TextAncestorContext.default.Provider, {
        value: true
      }, element);
    });
    Text5.displayName = "Text";
    var textStyle = {
      backgroundColor: "transparent",
      border: "0 solid black",
      boxSizing: "border-box",
      color: "black",
      display: "inline",
      font: "14px System",
      listStyle: "none",
      margin: 0,
      padding: 0,
      position: "relative",
      textAlign: "start",
      textDecoration: "none",
      whiteSpace: "pre-wrap",
      wordWrap: "break-word"
    };
    var styles = _StyleSheet.default.create({
      text$raw: textStyle,
      textHasAncestor$raw: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, textStyle), {}, {
        color: "inherit",
        font: "inherit",
        textAlign: "inherit",
        whiteSpace: "inherit"
      }),
      textOneLine: {
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        wordWrap: "normal"
      },
      // See #13
      textMultiLine: {
        display: "-webkit-box",
        maxWidth: "100%",
        overflow: "clip",
        textOverflow: "ellipsis",
        WebkitBoxOrient: "vertical"
      },
      notSelectable: {
        userSelect: "none"
      },
      selectable: {
        userSelect: "text"
      },
      pressable: {
        cursor: "pointer"
      }
    });
    var _default = exports2.default = Text5;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedText.js
var require_AnimatedText = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedText.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var React24 = _interopRequireWildcard(require("react"));
    var _Text = _interopRequireDefault(require_Text());
    var _createAnimatedComponent = _interopRequireDefault(require_createAnimatedComponent());
    var _default = exports2.default = (0, _createAnimatedComponent.default)(_Text.default);
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedView.js
var require_AnimatedView = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/components/AnimatedView.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var React24 = _interopRequireWildcard(require("react"));
    var _View = _interopRequireDefault(require_View());
    var _createAnimatedComponent = _interopRequireDefault(require_createAnimatedComponent());
    var _default = exports2.default = (0, _createAnimatedComponent.default)(_View.default);
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedAddition.js
var require_AnimatedAddition = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedAddition.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedInterpolation = _interopRequireDefault(require_AnimatedInterpolation());
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var AnimatedAddition = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedAddition");
      }
      constructor(a, b) {
        super();
        this._a = typeof a === "number" ? new _AnimatedValue.default(a) : a;
        this._b = typeof b === "number" ? new _AnimatedValue.default(b) : b;
      }
      __makeNative(platformConfig) {
        this._a.__makeNative(platformConfig);
        this._b.__makeNative(platformConfig);
        super.__makeNative(platformConfig);
      }
      __getValue() {
        return this._a.__getValue() + this._b.__getValue();
      }
      interpolate(config) {
        return new _AnimatedInterpolation.default(this, config);
      }
      __attach() {
        this._a.__addChild(this);
        this._b.__addChild(this);
      }
      __detach() {
        this._a.__removeChild(this);
        this._b.__removeChild(this);
        super.__detach();
      }
      __getNativeConfig() {
        return {
          type: "addition",
          input: [this._a.__getNativeTag(), this._b.__getNativeTag()]
        };
      }
    };
    var _default = exports2.default = AnimatedAddition;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedDiffClamp.js
var require_AnimatedDiffClamp = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedDiffClamp.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedInterpolation = _interopRequireDefault(require_AnimatedInterpolation());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var AnimatedDiffClamp = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedDiffClamp");
      }
      constructor(a, min, max) {
        super();
        this._a = a;
        this._min = min;
        this._max = max;
        this._value = this._lastValue = this._a.__getValue();
      }
      __makeNative(platformConfig) {
        this._a.__makeNative(platformConfig);
        super.__makeNative(platformConfig);
      }
      interpolate(config) {
        return new _AnimatedInterpolation.default(this, config);
      }
      __getValue() {
        var value = this._a.__getValue();
        var diff = value - this._lastValue;
        this._lastValue = value;
        this._value = Math.min(Math.max(this._value + diff, this._min), this._max);
        return this._value;
      }
      __attach() {
        this._a.__addChild(this);
      }
      __detach() {
        this._a.__removeChild(this);
        super.__detach();
      }
      __getNativeConfig() {
        return {
          type: "diffclamp",
          input: this._a.__getNativeTag(),
          min: this._min,
          max: this._max
        };
      }
    };
    var _default = exports2.default = AnimatedDiffClamp;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedDivision.js
var require_AnimatedDivision = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedDivision.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedInterpolation = _interopRequireDefault(require_AnimatedInterpolation());
    var _AnimatedNode = _interopRequireDefault(require_AnimatedNode());
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var AnimatedDivision = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedDivision");
      }
      constructor(a, b) {
        super();
        this._warnedAboutDivideByZero = false;
        if (b === 0 || b instanceof _AnimatedNode.default && b.__getValue() === 0) {
          console.error("Detected potential division by zero in AnimatedDivision");
        }
        this._a = typeof a === "number" ? new _AnimatedValue.default(a) : a;
        this._b = typeof b === "number" ? new _AnimatedValue.default(b) : b;
      }
      __makeNative(platformConfig) {
        this._a.__makeNative(platformConfig);
        this._b.__makeNative(platformConfig);
        super.__makeNative(platformConfig);
      }
      __getValue() {
        var a = this._a.__getValue();
        var b = this._b.__getValue();
        if (b === 0) {
          if (!this._warnedAboutDivideByZero) {
            console.error("Detected division by zero in AnimatedDivision");
            this._warnedAboutDivideByZero = true;
          }
          return 0;
        }
        this._warnedAboutDivideByZero = false;
        return a / b;
      }
      interpolate(config) {
        return new _AnimatedInterpolation.default(this, config);
      }
      __attach() {
        this._a.__addChild(this);
        this._b.__addChild(this);
      }
      __detach() {
        this._a.__removeChild(this);
        this._b.__removeChild(this);
        super.__detach();
      }
      __getNativeConfig() {
        return {
          type: "division",
          input: [this._a.__getNativeTag(), this._b.__getNativeTag()]
        };
      }
    };
    var _default = exports2.default = AnimatedDivision;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedModulo.js
var require_AnimatedModulo = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedModulo.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedInterpolation = _interopRequireDefault(require_AnimatedInterpolation());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var AnimatedModulo = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedModulo");
      }
      constructor(a, modulus) {
        super();
        this._a = a;
        this._modulus = modulus;
      }
      __makeNative(platformConfig) {
        this._a.__makeNative(platformConfig);
        super.__makeNative(platformConfig);
      }
      __getValue() {
        return (this._a.__getValue() % this._modulus + this._modulus) % this._modulus;
      }
      interpolate(config) {
        return new _AnimatedInterpolation.default(this, config);
      }
      __attach() {
        this._a.__addChild(this);
      }
      __detach() {
        this._a.__removeChild(this);
        super.__detach();
      }
      __getNativeConfig() {
        return {
          type: "modulus",
          input: this._a.__getNativeTag(),
          modulus: this._modulus
        };
      }
    };
    var _default = exports2.default = AnimatedModulo;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedMultiplication.js
var require_AnimatedMultiplication = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedMultiplication.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedInterpolation = _interopRequireDefault(require_AnimatedInterpolation());
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var AnimatedMultiplication = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedMultiplication");
      }
      constructor(a, b) {
        super();
        this._a = typeof a === "number" ? new _AnimatedValue.default(a) : a;
        this._b = typeof b === "number" ? new _AnimatedValue.default(b) : b;
      }
      __makeNative(platformConfig) {
        this._a.__makeNative(platformConfig);
        this._b.__makeNative(platformConfig);
        super.__makeNative(platformConfig);
      }
      __getValue() {
        return this._a.__getValue() * this._b.__getValue();
      }
      interpolate(config) {
        return new _AnimatedInterpolation.default(this, config);
      }
      __attach() {
        this._a.__addChild(this);
        this._b.__addChild(this);
      }
      __detach() {
        this._a.__removeChild(this);
        this._b.__removeChild(this);
        super.__detach();
      }
      __getNativeConfig() {
        return {
          type: "multiplication",
          input: [this._a.__getNativeTag(), this._b.__getNativeTag()]
        };
      }
    };
    var _default = exports2.default = AnimatedMultiplication;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedSubtraction.js
var require_AnimatedSubtraction = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedSubtraction.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedInterpolation = _interopRequireDefault(require_AnimatedInterpolation());
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var AnimatedSubtraction = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedSubtraction");
      }
      constructor(a, b) {
        super();
        this._a = typeof a === "number" ? new _AnimatedValue.default(a) : a;
        this._b = typeof b === "number" ? new _AnimatedValue.default(b) : b;
      }
      __makeNative(platformConfig) {
        this._a.__makeNative(platformConfig);
        this._b.__makeNative(platformConfig);
        super.__makeNative(platformConfig);
      }
      __getValue() {
        return this._a.__getValue() - this._b.__getValue();
      }
      interpolate(config) {
        return new _AnimatedInterpolation.default(this, config);
      }
      __attach() {
        this._a.__addChild(this);
        this._b.__addChild(this);
      }
      __detach() {
        this._a.__removeChild(this);
        this._b.__removeChild(this);
        super.__detach();
      }
      __getNativeConfig() {
        return {
          type: "subtraction",
          input: [this._a.__getNativeTag(), this._b.__getNativeTag()]
        };
      }
    };
    var _default = exports2.default = AnimatedSubtraction;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedTracking.js
var require_AnimatedTracking = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedTracking.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _AnimatedNode = _interopRequireDefault(require_AnimatedNode());
    var _NativeAnimatedHelper = require_NativeAnimatedHelper();
    var AnimatedTracking = class extends _AnimatedNode.default {
      static {
        __name(this, "AnimatedTracking");
      }
      constructor(value, parent, animationClass, animationConfig, callback) {
        super();
        this._value = value;
        this._parent = parent;
        this._animationClass = animationClass;
        this._animationConfig = animationConfig;
        this._useNativeDriver = (0, _NativeAnimatedHelper.shouldUseNativeDriver)(animationConfig);
        this._callback = callback;
        this.__attach();
      }
      __makeNative() {
        this.__isNative = true;
        this._parent.__makeNative();
        super.__makeNative();
        this._value.__makeNative();
      }
      __getValue() {
        return this._parent.__getValue();
      }
      __attach() {
        this._parent.__addChild(this);
        if (this._useNativeDriver) {
          this.__makeNative();
        }
      }
      __detach() {
        this._parent.__removeChild(this);
        super.__detach();
      }
      update() {
        this._value.animate(new this._animationClass((0, _objectSpread2.default)((0, _objectSpread2.default)({}, this._animationConfig), {}, {
          toValue: this._animationConfig.toValue.__getValue()
        })), this._callback);
      }
      __getNativeConfig() {
        var animation = new this._animationClass((0, _objectSpread2.default)((0, _objectSpread2.default)({}, this._animationConfig), {}, {
          // remove toValue from the config as it's a ref to Animated.Value
          toValue: void 0
        }));
        var animationConfig = animation.__getNativeAnimationConfig();
        return {
          type: "tracking",
          animationId: (0, _NativeAnimatedHelper.generateNewAnimationId)(),
          animationConfig,
          toValue: this._parent.__getNativeTag(),
          value: this._value.__getNativeTag()
        };
      }
    };
    var _default = exports2.default = AnimatedTracking;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedValueXY.js
var require_AnimatedValueXY = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedValueXY.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var _invariant = _interopRequireDefault(require_invariant());
    var _uniqueId = 1;
    var AnimatedValueXY = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedValueXY");
      }
      constructor(valueIn) {
        super();
        var value = valueIn || {
          x: 0,
          y: 0
        };
        if (typeof value.x === "number" && typeof value.y === "number") {
          this.x = new _AnimatedValue.default(value.x);
          this.y = new _AnimatedValue.default(value.y);
        } else {
          (0, _invariant.default)(value.x instanceof _AnimatedValue.default && value.y instanceof _AnimatedValue.default, "AnimatedValueXY must be initialized with an object of numbers or AnimatedValues.");
          this.x = value.x;
          this.y = value.y;
        }
        this._listeners = {};
      }
      /**
       * Directly set the value. This will stop any animations running on the value
       * and update all the bound properties.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#setvalue
       */
      setValue(value) {
        this.x.setValue(value.x);
        this.y.setValue(value.y);
      }
      /**
       * Sets an offset that is applied on top of whatever value is set, whether
       * via `setValue`, an animation, or `Animated.event`. Useful for compensating
       * things like the start of a pan gesture.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#setoffset
       */
      setOffset(offset) {
        this.x.setOffset(offset.x);
        this.y.setOffset(offset.y);
      }
      /**
       * Merges the offset value into the base value and resets the offset to zero.
       * The final output of the value is unchanged.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#flattenoffset
       */
      flattenOffset() {
        this.x.flattenOffset();
        this.y.flattenOffset();
      }
      /**
       * Sets the offset value to the base value, and resets the base value to
       * zero. The final output of the value is unchanged.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#extractoffset
       */
      extractOffset() {
        this.x.extractOffset();
        this.y.extractOffset();
      }
      __getValue() {
        return {
          x: this.x.__getValue(),
          y: this.y.__getValue()
        };
      }
      /**
       * Stops any animation and resets the value to its original.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#resetanimation
       */
      resetAnimation(callback) {
        this.x.resetAnimation();
        this.y.resetAnimation();
        callback && callback(this.__getValue());
      }
      /**
       * Stops any running animation or tracking. `callback` is invoked with the
       * final value after stopping the animation, which is useful for updating
       * state to match the animation position with layout.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#stopanimation
       */
      stopAnimation(callback) {
        this.x.stopAnimation();
        this.y.stopAnimation();
        callback && callback(this.__getValue());
      }
      /**
       * Adds an asynchronous listener to the value so you can observe updates from
       * animations.  This is useful because there is no way to synchronously read
       * the value because it might be driven natively.
       *
       * Returns a string that serves as an identifier for the listener.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#addlistener
       */
      addListener(callback) {
        var id = String(_uniqueId++);
        var jointCallback = /* @__PURE__ */ __name((_ref) => {
          var number = _ref.value;
          callback(this.__getValue());
        }, "jointCallback");
        this._listeners[id] = {
          x: this.x.addListener(jointCallback),
          y: this.y.addListener(jointCallback)
        };
        return id;
      }
      /**
       * Unregister a listener. The `id` param shall match the identifier
       * previously returned by `addListener()`.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#removelistener
       */
      removeListener(id) {
        this.x.removeListener(this._listeners[id].x);
        this.y.removeListener(this._listeners[id].y);
        delete this._listeners[id];
      }
      /**
       * Remove all registered listeners.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#removealllisteners
       */
      removeAllListeners() {
        this.x.removeAllListeners();
        this.y.removeAllListeners();
        this._listeners = {};
      }
      /**
       * Converts `{x, y}` into `{left, top}` for use in style.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#getlayout
       */
      getLayout() {
        return {
          left: this.x,
          top: this.y
        };
      }
      /**
       * Converts `{x, y}` into a useable translation transform.
       *
       * See https://reactnative.dev/docs/animatedvaluexy.html#gettranslatetransform
       */
      getTranslateTransform() {
        return [{
          translateX: this.x
        }, {
          translateY: this.y
        }];
      }
    };
    var _default = exports2.default = AnimatedValueXY;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/animations/Animation.js
var require_Animation = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/animations/Animation.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _NativeAnimatedHelper = _interopRequireDefault(require_NativeAnimatedHelper());
    var startNativeAnimationNextId = 1;
    var Animation = class {
      static {
        __name(this, "Animation");
      }
      start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
      }
      stop() {
        if (this.__nativeId) {
          _NativeAnimatedHelper.default.API.stopAnimation(this.__nativeId);
        }
      }
      __getNativeAnimationConfig() {
        throw new Error("This animation type cannot be offloaded to native");
      }
      // Helper function for subclasses to make sure onEnd is only called once.
      __debouncedOnEnd(result) {
        var onEnd = this.__onEnd;
        this.__onEnd = null;
        onEnd && onEnd(result);
      }
      __startNativeAnimation(animatedValue) {
        var startNativeAnimationWaitId = startNativeAnimationNextId + ":startAnimation";
        startNativeAnimationNextId += 1;
        _NativeAnimatedHelper.default.API.setWaitingForIdentifier(startNativeAnimationWaitId);
        try {
          var config = this.__getNativeAnimationConfig();
          animatedValue.__makeNative(config.platformConfig);
          this.__nativeId = _NativeAnimatedHelper.default.generateNewAnimationId();
          _NativeAnimatedHelper.default.API.startAnimatingNode(
            this.__nativeId,
            animatedValue.__getNativeTag(),
            config,
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            this.__debouncedOnEnd.bind(this)
          );
        } catch (e) {
          throw e;
        } finally {
          _NativeAnimatedHelper.default.API.unsetWaitingForIdentifier(startNativeAnimationWaitId);
        }
      }
    };
    var _default = exports2.default = Animation;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/animations/DecayAnimation.js
var require_DecayAnimation = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/animations/DecayAnimation.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _Animation = _interopRequireDefault(require_Animation());
    var _NativeAnimatedHelper = require_NativeAnimatedHelper();
    var DecayAnimation = class extends _Animation.default {
      static {
        __name(this, "DecayAnimation");
      }
      constructor(config) {
        var _config$deceleration, _config$isInteraction, _config$iterations;
        super();
        this._deceleration = (_config$deceleration = config.deceleration) !== null && _config$deceleration !== void 0 ? _config$deceleration : 0.998;
        this._velocity = config.velocity;
        this._useNativeDriver = (0, _NativeAnimatedHelper.shouldUseNativeDriver)(config);
        this.__isInteraction = (_config$isInteraction = config.isInteraction) !== null && _config$isInteraction !== void 0 ? _config$isInteraction : !this._useNativeDriver;
        this.__iterations = (_config$iterations = config.iterations) !== null && _config$iterations !== void 0 ? _config$iterations : 1;
      }
      __getNativeAnimationConfig() {
        return {
          type: "decay",
          deceleration: this._deceleration,
          velocity: this._velocity,
          iterations: this.__iterations
        };
      }
      start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
        this.__active = true;
        this._lastValue = fromValue;
        this._fromValue = fromValue;
        this._onUpdate = onUpdate;
        this.__onEnd = onEnd;
        this._startTime = Date.now();
        if (this._useNativeDriver) {
          this.__startNativeAnimation(animatedValue);
        } else {
          this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
        }
      }
      onUpdate() {
        var now = Date.now();
        var value = this._fromValue + this._velocity / (1 - this._deceleration) * (1 - Math.exp(-(1 - this._deceleration) * (now - this._startTime)));
        this._onUpdate(value);
        if (Math.abs(this._lastValue - value) < 0.1) {
          this.__debouncedOnEnd({
            finished: true
          });
          return;
        }
        this._lastValue = value;
        if (this.__active) {
          this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
        }
      }
      stop() {
        super.stop();
        this.__active = false;
        global.cancelAnimationFrame(this._animationFrame);
        this.__debouncedOnEnd({
          finished: false
        });
      }
    };
    var _default = exports2.default = DecayAnimation;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/SpringConfig.js
var require_SpringConfig = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/SpringConfig.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    function stiffnessFromOrigamiValue(oValue) {
      return (oValue - 30) * 3.62 + 194;
    }
    __name(stiffnessFromOrigamiValue, "stiffnessFromOrigamiValue");
    function dampingFromOrigamiValue(oValue) {
      return (oValue - 8) * 3 + 25;
    }
    __name(dampingFromOrigamiValue, "dampingFromOrigamiValue");
    function fromOrigamiTensionAndFriction(tension, friction) {
      return {
        stiffness: stiffnessFromOrigamiValue(tension),
        damping: dampingFromOrigamiValue(friction)
      };
    }
    __name(fromOrigamiTensionAndFriction, "fromOrigamiTensionAndFriction");
    function fromBouncinessAndSpeed(bounciness, speed) {
      function normalize(value, startValue, endValue) {
        return (value - startValue) / (endValue - startValue);
      }
      __name(normalize, "normalize");
      function projectNormal(n, start, end) {
        return start + n * (end - start);
      }
      __name(projectNormal, "projectNormal");
      function linearInterpolation(t, start, end) {
        return t * end + (1 - t) * start;
      }
      __name(linearInterpolation, "linearInterpolation");
      function quadraticOutInterpolation(t, start, end) {
        return linearInterpolation(2 * t - t * t, start, end);
      }
      __name(quadraticOutInterpolation, "quadraticOutInterpolation");
      function b3Friction1(x) {
        return 7e-4 * Math.pow(x, 3) - 0.031 * Math.pow(x, 2) + 0.64 * x + 1.28;
      }
      __name(b3Friction1, "b3Friction1");
      function b3Friction2(x) {
        return 44e-6 * Math.pow(x, 3) - 6e-3 * Math.pow(x, 2) + 0.36 * x + 2;
      }
      __name(b3Friction2, "b3Friction2");
      function b3Friction3(x) {
        return 45e-8 * Math.pow(x, 3) - 332e-6 * Math.pow(x, 2) + 0.1078 * x + 5.84;
      }
      __name(b3Friction3, "b3Friction3");
      function b3Nobounce(tension) {
        if (tension <= 18) {
          return b3Friction1(tension);
        } else if (tension > 18 && tension <= 44) {
          return b3Friction2(tension);
        } else {
          return b3Friction3(tension);
        }
      }
      __name(b3Nobounce, "b3Nobounce");
      var b = normalize(bounciness / 1.7, 0, 20);
      b = projectNormal(b, 0, 0.8);
      var s = normalize(speed / 1.7, 0, 20);
      var bouncyTension = projectNormal(s, 0.5, 200);
      var bouncyFriction = quadraticOutInterpolation(b, b3Nobounce(bouncyTension), 0.01);
      return {
        stiffness: stiffnessFromOrigamiValue(bouncyTension),
        damping: dampingFromOrigamiValue(bouncyFriction)
      };
    }
    __name(fromBouncinessAndSpeed, "fromBouncinessAndSpeed");
    var _default = exports2.default = {
      fromOrigamiTensionAndFriction,
      fromBouncinessAndSpeed
    };
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedColor.js
var require_AnimatedColor = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/nodes/AnimatedColor.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _AnimatedWithChildren = _interopRequireDefault(require_AnimatedWithChildren());
    var _normalizeColors = _interopRequireDefault(require_normalize_colors());
    var _NativeAnimatedHelper = _interopRequireDefault(require_NativeAnimatedHelper());
    var NativeAnimatedAPI = _NativeAnimatedHelper.default.API;
    var defaultColor = {
      r: 0,
      g: 0,
      b: 0,
      a: 1
    };
    var _uniqueId = 1;
    var processColorObject = /* @__PURE__ */ __name((color) => {
      return color;
    }, "processColorObject");
    function processColor(color) {
      if (color === void 0 || color === null) {
        return null;
      }
      if (isRgbaValue(color)) {
        return color;
      }
      var normalizedColor = (0, _normalizeColors.default)(
        // $FlowIgnore[incompatible-cast] - Type is verified above
        color
      );
      if (normalizedColor === void 0 || normalizedColor === null) {
        return null;
      }
      if (typeof normalizedColor === "object") {
        var processedColorObj = processColorObject(normalizedColor);
        if (processedColorObj != null) {
          return processedColorObj;
        }
      } else if (typeof normalizedColor === "number") {
        var r = (normalizedColor & 4278190080) >>> 24;
        var g = (normalizedColor & 16711680) >>> 16;
        var b = (normalizedColor & 65280) >>> 8;
        var a = (normalizedColor & 255) / 255;
        return {
          r,
          g,
          b,
          a
        };
      }
      return null;
    }
    __name(processColor, "processColor");
    function isRgbaValue(value) {
      return value && typeof value.r === "number" && typeof value.g === "number" && typeof value.b === "number" && typeof value.a === "number";
    }
    __name(isRgbaValue, "isRgbaValue");
    function isRgbaAnimatedValue(value) {
      return value && value.r instanceof _AnimatedValue.default && value.g instanceof _AnimatedValue.default && value.b instanceof _AnimatedValue.default && value.a instanceof _AnimatedValue.default;
    }
    __name(isRgbaAnimatedValue, "isRgbaAnimatedValue");
    var AnimatedColor = class extends _AnimatedWithChildren.default {
      static {
        __name(this, "AnimatedColor");
      }
      constructor(valueIn, config) {
        super();
        this._listeners = {};
        var value = valueIn !== null && valueIn !== void 0 ? valueIn : defaultColor;
        if (isRgbaAnimatedValue(value)) {
          var rgbaAnimatedValue = value;
          this.r = rgbaAnimatedValue.r;
          this.g = rgbaAnimatedValue.g;
          this.b = rgbaAnimatedValue.b;
          this.a = rgbaAnimatedValue.a;
        } else {
          var _processColor;
          var processedColor = (
            // $FlowIgnore[incompatible-cast] - Type is verified above
            (_processColor = processColor(value)) !== null && _processColor !== void 0 ? _processColor : defaultColor
          );
          var initColor = defaultColor;
          if (isRgbaValue(processedColor)) {
            initColor = processedColor;
          } else {
            this.nativeColor = processedColor;
          }
          this.r = new _AnimatedValue.default(initColor.r);
          this.g = new _AnimatedValue.default(initColor.g);
          this.b = new _AnimatedValue.default(initColor.b);
          this.a = new _AnimatedValue.default(initColor.a);
        }
        if (this.nativeColor || config && config.useNativeDriver) {
          this.__makeNative();
        }
      }
      /**
       * Directly set the value. This will stop any animations running on the value
       * and update all the bound properties.
       */
      setValue(value) {
        var _processColor2;
        var shouldUpdateNodeConfig = false;
        if (this.__isNative) {
          var nativeTag = this.__getNativeTag();
          NativeAnimatedAPI.setWaitingForIdentifier(nativeTag.toString());
        }
        var processedColor = (_processColor2 = processColor(value)) !== null && _processColor2 !== void 0 ? _processColor2 : defaultColor;
        if (isRgbaValue(processedColor)) {
          var rgbaValue = processedColor;
          this.r.setValue(rgbaValue.r);
          this.g.setValue(rgbaValue.g);
          this.b.setValue(rgbaValue.b);
          this.a.setValue(rgbaValue.a);
          if (this.nativeColor != null) {
            this.nativeColor = null;
            shouldUpdateNodeConfig = true;
          }
        } else {
          var nativeColor = processedColor;
          if (this.nativeColor !== nativeColor) {
            this.nativeColor = nativeColor;
            shouldUpdateNodeConfig = true;
          }
        }
        if (this.__isNative) {
          var _nativeTag = this.__getNativeTag();
          if (shouldUpdateNodeConfig) {
            NativeAnimatedAPI.updateAnimatedNodeConfig(_nativeTag, this.__getNativeConfig());
          }
          NativeAnimatedAPI.unsetWaitingForIdentifier(_nativeTag.toString());
        }
      }
      /**
       * Sets an offset that is applied on top of whatever value is set, whether
       * via `setValue`, an animation, or `Animated.event`. Useful for compensating
       * things like the start of a pan gesture.
       */
      setOffset(offset) {
        this.r.setOffset(offset.r);
        this.g.setOffset(offset.g);
        this.b.setOffset(offset.b);
        this.a.setOffset(offset.a);
      }
      /**
       * Merges the offset value into the base value and resets the offset to zero.
       * The final output of the value is unchanged.
       */
      flattenOffset() {
        this.r.flattenOffset();
        this.g.flattenOffset();
        this.b.flattenOffset();
        this.a.flattenOffset();
      }
      /**
       * Sets the offset value to the base value, and resets the base value to
       * zero. The final output of the value is unchanged.
       */
      extractOffset() {
        this.r.extractOffset();
        this.g.extractOffset();
        this.b.extractOffset();
        this.a.extractOffset();
      }
      /**
       * Adds an asynchronous listener to the value so you can observe updates from
       * animations.  This is useful because there is no way to synchronously read
       * the value because it might be driven natively.
       *
       * Returns a string that serves as an identifier for the listener.
       */
      addListener(callback) {
        var id = String(_uniqueId++);
        var jointCallback = /* @__PURE__ */ __name((_ref) => {
          var number = _ref.value;
          callback(this.__getValue());
        }, "jointCallback");
        this._listeners[id] = {
          r: this.r.addListener(jointCallback),
          g: this.g.addListener(jointCallback),
          b: this.b.addListener(jointCallback),
          a: this.a.addListener(jointCallback)
        };
        return id;
      }
      /**
       * Unregister a listener. The `id` param shall match the identifier
       * previously returned by `addListener()`.
       */
      removeListener(id) {
        this.r.removeListener(this._listeners[id].r);
        this.g.removeListener(this._listeners[id].g);
        this.b.removeListener(this._listeners[id].b);
        this.a.removeListener(this._listeners[id].a);
        delete this._listeners[id];
      }
      /**
       * Remove all registered listeners.
       */
      removeAllListeners() {
        this.r.removeAllListeners();
        this.g.removeAllListeners();
        this.b.removeAllListeners();
        this.a.removeAllListeners();
        this._listeners = {};
      }
      /**
       * Stops any running animation or tracking. `callback` is invoked with the
       * final value after stopping the animation, which is useful for updating
       * state to match the animation position with layout.
       */
      stopAnimation(callback) {
        this.r.stopAnimation();
        this.g.stopAnimation();
        this.b.stopAnimation();
        this.a.stopAnimation();
        callback && callback(this.__getValue());
      }
      /**
       * Stops any animation and resets the value to its original.
       */
      resetAnimation(callback) {
        this.r.resetAnimation();
        this.g.resetAnimation();
        this.b.resetAnimation();
        this.a.resetAnimation();
        callback && callback(this.__getValue());
      }
      __getValue() {
        if (this.nativeColor != null) {
          return this.nativeColor;
        } else {
          return "rgba(" + this.r.__getValue() + ", " + this.g.__getValue() + ", " + this.b.__getValue() + ", " + this.a.__getValue() + ")";
        }
      }
      __attach() {
        this.r.__addChild(this);
        this.g.__addChild(this);
        this.b.__addChild(this);
        this.a.__addChild(this);
        super.__attach();
      }
      __detach() {
        this.r.__removeChild(this);
        this.g.__removeChild(this);
        this.b.__removeChild(this);
        this.a.__removeChild(this);
        super.__detach();
      }
      __makeNative(platformConfig) {
        this.r.__makeNative(platformConfig);
        this.g.__makeNative(platformConfig);
        this.b.__makeNative(platformConfig);
        this.a.__makeNative(platformConfig);
        super.__makeNative(platformConfig);
      }
      __getNativeConfig() {
        return {
          type: "color",
          r: this.r.__getNativeTag(),
          g: this.g.__getNativeTag(),
          b: this.b.__getNativeTag(),
          a: this.a.__getNativeTag(),
          nativeColor: this.nativeColor
        };
      }
    };
    exports2.default = AnimatedColor;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/animations/SpringAnimation.js
var require_SpringAnimation = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/animations/SpringAnimation.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _Animation = _interopRequireDefault(require_Animation());
    var _SpringConfig = _interopRequireDefault(require_SpringConfig());
    var _invariant = _interopRequireDefault(require_invariant());
    var _NativeAnimatedHelper = require_NativeAnimatedHelper();
    var _AnimatedColor = _interopRequireDefault(require_AnimatedColor());
    var SpringAnimation = class _SpringAnimation extends _Animation.default {
      static {
        __name(this, "SpringAnimation");
      }
      constructor(config) {
        var _config$overshootClam, _config$restDisplacem, _config$restSpeedThre, _config$velocity, _config$velocity2, _config$delay, _config$isInteraction, _config$iterations;
        super();
        this._overshootClamping = (_config$overshootClam = config.overshootClamping) !== null && _config$overshootClam !== void 0 ? _config$overshootClam : false;
        this._restDisplacementThreshold = (_config$restDisplacem = config.restDisplacementThreshold) !== null && _config$restDisplacem !== void 0 ? _config$restDisplacem : 1e-3;
        this._restSpeedThreshold = (_config$restSpeedThre = config.restSpeedThreshold) !== null && _config$restSpeedThre !== void 0 ? _config$restSpeedThre : 1e-3;
        this._initialVelocity = (_config$velocity = config.velocity) !== null && _config$velocity !== void 0 ? _config$velocity : 0;
        this._lastVelocity = (_config$velocity2 = config.velocity) !== null && _config$velocity2 !== void 0 ? _config$velocity2 : 0;
        this._toValue = config.toValue;
        this._delay = (_config$delay = config.delay) !== null && _config$delay !== void 0 ? _config$delay : 0;
        this._useNativeDriver = (0, _NativeAnimatedHelper.shouldUseNativeDriver)(config);
        this._platformConfig = config.platformConfig;
        this.__isInteraction = (_config$isInteraction = config.isInteraction) !== null && _config$isInteraction !== void 0 ? _config$isInteraction : !this._useNativeDriver;
        this.__iterations = (_config$iterations = config.iterations) !== null && _config$iterations !== void 0 ? _config$iterations : 1;
        if (config.stiffness !== void 0 || config.damping !== void 0 || config.mass !== void 0) {
          var _config$stiffness, _config$damping, _config$mass;
          (0, _invariant.default)(config.bounciness === void 0 && config.speed === void 0 && config.tension === void 0 && config.friction === void 0, "You can define one of bounciness/speed, tension/friction, or stiffness/damping/mass, but not more than one");
          this._stiffness = (_config$stiffness = config.stiffness) !== null && _config$stiffness !== void 0 ? _config$stiffness : 100;
          this._damping = (_config$damping = config.damping) !== null && _config$damping !== void 0 ? _config$damping : 10;
          this._mass = (_config$mass = config.mass) !== null && _config$mass !== void 0 ? _config$mass : 1;
        } else if (config.bounciness !== void 0 || config.speed !== void 0) {
          var _config$bounciness, _config$speed;
          (0, _invariant.default)(config.tension === void 0 && config.friction === void 0 && config.stiffness === void 0 && config.damping === void 0 && config.mass === void 0, "You can define one of bounciness/speed, tension/friction, or stiffness/damping/mass, but not more than one");
          var springConfig = _SpringConfig.default.fromBouncinessAndSpeed((_config$bounciness = config.bounciness) !== null && _config$bounciness !== void 0 ? _config$bounciness : 8, (_config$speed = config.speed) !== null && _config$speed !== void 0 ? _config$speed : 12);
          this._stiffness = springConfig.stiffness;
          this._damping = springConfig.damping;
          this._mass = 1;
        } else {
          var _config$tension, _config$friction;
          var _springConfig = _SpringConfig.default.fromOrigamiTensionAndFriction((_config$tension = config.tension) !== null && _config$tension !== void 0 ? _config$tension : 40, (_config$friction = config.friction) !== null && _config$friction !== void 0 ? _config$friction : 7);
          this._stiffness = _springConfig.stiffness;
          this._damping = _springConfig.damping;
          this._mass = 1;
        }
        (0, _invariant.default)(this._stiffness > 0, "Stiffness value must be greater than 0");
        (0, _invariant.default)(this._damping > 0, "Damping value must be greater than 0");
        (0, _invariant.default)(this._mass > 0, "Mass value must be greater than 0");
      }
      __getNativeAnimationConfig() {
        var _this$_initialVelocit;
        return {
          type: "spring",
          overshootClamping: this._overshootClamping,
          restDisplacementThreshold: this._restDisplacementThreshold,
          restSpeedThreshold: this._restSpeedThreshold,
          stiffness: this._stiffness,
          damping: this._damping,
          mass: this._mass,
          initialVelocity: (_this$_initialVelocit = this._initialVelocity) !== null && _this$_initialVelocit !== void 0 ? _this$_initialVelocit : this._lastVelocity,
          toValue: this._toValue,
          iterations: this.__iterations,
          platformConfig: this._platformConfig
        };
      }
      start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
        this.__active = true;
        this._startPosition = fromValue;
        this._lastPosition = this._startPosition;
        this._onUpdate = onUpdate;
        this.__onEnd = onEnd;
        this._lastTime = Date.now();
        this._frameTime = 0;
        if (previousAnimation instanceof _SpringAnimation) {
          var internalState = previousAnimation.getInternalState();
          this._lastPosition = internalState.lastPosition;
          this._lastVelocity = internalState.lastVelocity;
          this._initialVelocity = this._lastVelocity;
          this._lastTime = internalState.lastTime;
        }
        var start = /* @__PURE__ */ __name(() => {
          if (this._useNativeDriver) {
            this.__startNativeAnimation(animatedValue);
          } else {
            this.onUpdate();
          }
        }, "start");
        if (this._delay) {
          this._timeout = setTimeout(start, this._delay);
        } else {
          start();
        }
      }
      getInternalState() {
        return {
          lastPosition: this._lastPosition,
          lastVelocity: this._lastVelocity,
          lastTime: this._lastTime
        };
      }
      /**
       * This spring model is based off of a damped harmonic oscillator
       * (https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator).
       *
       * We use the closed form of the second order differential equation:
       *
       * x'' + (2ζ⍵_0)x' + ⍵^2x = 0
       *
       * where
       *    ⍵_0 = √(k / m) (undamped angular frequency of the oscillator),
       *    ζ = c / 2√mk (damping ratio),
       *    c = damping constant
       *    k = stiffness
       *    m = mass
       *
       * The derivation of the closed form is described in detail here:
       * http://planetmath.org/sites/default/files/texpdf/39745.pdf
       *
       * This algorithm happens to match the algorithm used by CASpringAnimation,
       * a QuartzCore (iOS) API that creates spring animations.
       */
      onUpdate() {
        var MAX_STEPS = 64;
        var now = Date.now();
        if (now > this._lastTime + MAX_STEPS) {
          now = this._lastTime + MAX_STEPS;
        }
        var deltaTime = (now - this._lastTime) / 1e3;
        this._frameTime += deltaTime;
        var c = this._damping;
        var m = this._mass;
        var k = this._stiffness;
        var v0 = -this._initialVelocity;
        var zeta = c / (2 * Math.sqrt(k * m));
        var omega0 = Math.sqrt(k / m);
        var omega1 = omega0 * Math.sqrt(1 - zeta * zeta);
        var x0 = this._toValue - this._startPosition;
        var position = 0;
        var velocity = 0;
        var t = this._frameTime;
        if (zeta < 1) {
          var envelope = Math.exp(-zeta * omega0 * t);
          position = this._toValue - envelope * ((v0 + zeta * omega0 * x0) / omega1 * Math.sin(omega1 * t) + x0 * Math.cos(omega1 * t));
          velocity = zeta * omega0 * envelope * (Math.sin(omega1 * t) * (v0 + zeta * omega0 * x0) / omega1 + x0 * Math.cos(omega1 * t)) - envelope * (Math.cos(omega1 * t) * (v0 + zeta * omega0 * x0) - omega1 * x0 * Math.sin(omega1 * t));
        } else {
          var _envelope = Math.exp(-omega0 * t);
          position = this._toValue - _envelope * (x0 + (v0 + omega0 * x0) * t);
          velocity = _envelope * (v0 * (t * omega0 - 1) + t * x0 * (omega0 * omega0));
        }
        this._lastTime = now;
        this._lastPosition = position;
        this._lastVelocity = velocity;
        this._onUpdate(position);
        if (!this.__active) {
          return;
        }
        var isOvershooting = false;
        if (this._overshootClamping && this._stiffness !== 0) {
          if (this._startPosition < this._toValue) {
            isOvershooting = position > this._toValue;
          } else {
            isOvershooting = position < this._toValue;
          }
        }
        var isVelocity = Math.abs(velocity) <= this._restSpeedThreshold;
        var isDisplacement = true;
        if (this._stiffness !== 0) {
          isDisplacement = Math.abs(this._toValue - position) <= this._restDisplacementThreshold;
        }
        if (isOvershooting || isVelocity && isDisplacement) {
          if (this._stiffness !== 0) {
            this._lastPosition = this._toValue;
            this._lastVelocity = 0;
            this._onUpdate(this._toValue);
          }
          this.__debouncedOnEnd({
            finished: true
          });
          return;
        }
        this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
      }
      stop() {
        super.stop();
        this.__active = false;
        clearTimeout(this._timeout);
        global.cancelAnimationFrame(this._animationFrame);
        this.__debouncedOnEnd({
          finished: false
        });
      }
    };
    var _default = exports2.default = SpringAnimation;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/bezier.js
var require_bezier = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/bezier.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = bezier;
    var NEWTON_ITERATIONS = 4;
    var NEWTON_MIN_SLOPE = 1e-3;
    var SUBDIVISION_PRECISION = 1e-7;
    var SUBDIVISION_MAX_ITERATIONS = 10;
    var kSplineTableSize = 11;
    var kSampleStepSize = 1 / (kSplineTableSize - 1);
    var float32ArraySupported = typeof Float32Array === "function";
    function A(aA1, aA2) {
      return 1 - 3 * aA2 + 3 * aA1;
    }
    __name(A, "A");
    function B(aA1, aA2) {
      return 3 * aA2 - 6 * aA1;
    }
    __name(B, "B");
    function C(aA1) {
      return 3 * aA1;
    }
    __name(C, "C");
    function calcBezier(aT, aA1, aA2) {
      return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
    }
    __name(calcBezier, "calcBezier");
    function getSlope(aT, aA1, aA2) {
      return 3 * A(aA1, aA2) * aT * aT + 2 * B(aA1, aA2) * aT + C(aA1);
    }
    __name(getSlope, "getSlope");
    function binarySubdivide(aX, _aA, _aB, mX1, mX2) {
      var currentX, currentT, i = 0, aA = _aA, aB = _aB;
      do {
        currentT = aA + (aB - aA) / 2;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0) {
          aB = currentT;
        } else {
          aA = currentT;
        }
      } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
      return currentT;
    }
    __name(binarySubdivide, "binarySubdivide");
    function newtonRaphsonIterate(aX, _aGuessT, mX1, mX2) {
      var aGuessT = _aGuessT;
      for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
        var currentSlope = getSlope(aGuessT, mX1, mX2);
        if (currentSlope === 0) {
          return aGuessT;
        }
        var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
        aGuessT -= currentX / currentSlope;
      }
      return aGuessT;
    }
    __name(newtonRaphsonIterate, "newtonRaphsonIterate");
    function bezier(mX1, mY1, mX2, mY2) {
      if (!(mX1 >= 0 && mX1 <= 1 && mX2 >= 0 && mX2 <= 1)) {
        throw new Error("bezier x values must be in [0, 1] range");
      }
      var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
      if (mX1 !== mY1 || mX2 !== mY2) {
        for (var i = 0; i < kSplineTableSize; ++i) {
          sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
        }
      }
      function getTForX(aX) {
        var intervalStart = 0;
        var currentSample = 1;
        var lastSample = kSplineTableSize - 1;
        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
          intervalStart += kSampleStepSize;
        }
        --currentSample;
        var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        var guessForT = intervalStart + dist * kSampleStepSize;
        var initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
          return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        } else if (initialSlope === 0) {
          return guessForT;
        } else {
          return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
        }
      }
      __name(getTForX, "getTForX");
      return /* @__PURE__ */ __name(function BezierEasing(x) {
        if (mX1 === mY1 && mX2 === mY2) {
          return x;
        }
        if (x === 0) {
          return 0;
        }
        if (x === 1) {
          return 1;
        }
        return calcBezier(getTForX(x), mY1, mY2);
      }, "BezierEasing");
    }
    __name(bezier, "bezier");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/Easing.js
var require_Easing = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/Easing.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _bezier2 = _interopRequireDefault(require_bezier());
    var ease;
    var Easing = class _Easing {
      static {
        __name(this, "Easing");
      }
      /**
       * A stepping function, returns 1 for any positive value of `n`.
       */
      static step0(n) {
        return n > 0 ? 1 : 0;
      }
      /**
       * A stepping function, returns 1 if `n` is greater than or equal to 1.
       */
      static step1(n) {
        return n >= 1 ? 1 : 0;
      }
      /**
       * A linear function, `f(t) = t`. Position correlates to elapsed time one to
       * one.
       *
       * http://cubic-bezier.com/#0,0,1,1
       */
      static linear(t) {
        return t;
      }
      /**
       * A simple inertial interaction, similar to an object slowly accelerating to
       * speed.
       *
       * http://cubic-bezier.com/#.42,0,1,1
       */
      static ease(t) {
        if (!ease) {
          ease = _Easing.bezier(0.42, 0, 1, 1);
        }
        return ease(t);
      }
      /**
       * A quadratic function, `f(t) = t * t`. Position equals the square of elapsed
       * time.
       *
       * http://easings.net/#easeInQuad
       */
      static quad(t) {
        return t * t;
      }
      /**
       * A cubic function, `f(t) = t * t * t`. Position equals the cube of elapsed
       * time.
       *
       * http://easings.net/#easeInCubic
       */
      static cubic(t) {
        return t * t * t;
      }
      /**
       * A power function. Position is equal to the Nth power of elapsed time.
       *
       * n = 4: http://easings.net/#easeInQuart
       * n = 5: http://easings.net/#easeInQuint
       */
      static poly(n) {
        return (t) => Math.pow(t, n);
      }
      /**
       * A sinusoidal function.
       *
       * http://easings.net/#easeInSine
       */
      static sin(t) {
        return 1 - Math.cos(t * Math.PI / 2);
      }
      /**
       * A circular function.
       *
       * http://easings.net/#easeInCirc
       */
      static circle(t) {
        return 1 - Math.sqrt(1 - t * t);
      }
      /**
       * An exponential function.
       *
       * http://easings.net/#easeInExpo
       */
      static exp(t) {
        return Math.pow(2, 10 * (t - 1));
      }
      /**
       * A simple elastic interaction, similar to a spring oscillating back and
       * forth.
       *
       * Default bounciness is 1, which overshoots a little bit once. 0 bounciness
       * doesn't overshoot at all, and bounciness of N > 1 will overshoot about N
       * times.
       *
       * http://easings.net/#easeInElastic
       */
      static elastic(bounciness) {
        if (bounciness === void 0) {
          bounciness = 1;
        }
        var p = bounciness * Math.PI;
        return (t) => 1 - Math.pow(Math.cos(t * Math.PI / 2), 3) * Math.cos(t * p);
      }
      /**
       * Use with `Animated.parallel()` to create a simple effect where the object
       * animates back slightly as the animation starts.
       *
       * Wolfram Plot:
       *
       * - http://tiny.cc/back_default (s = 1.70158, default)
       */
      static back(s) {
        if (s === void 0) {
          s = 1.70158;
        }
        return (t) => t * t * ((s + 1) * t - s);
      }
      /**
       * Provides a simple bouncing effect.
       *
       * http://easings.net/#easeInBounce
       */
      static bounce(t) {
        if (t < 1 / 2.75) {
          return 7.5625 * t * t;
        }
        if (t < 2 / 2.75) {
          var _t = t - 1.5 / 2.75;
          return 7.5625 * _t * _t + 0.75;
        }
        if (t < 2.5 / 2.75) {
          var _t2 = t - 2.25 / 2.75;
          return 7.5625 * _t2 * _t2 + 0.9375;
        }
        var t2 = t - 2.625 / 2.75;
        return 7.5625 * t2 * t2 + 0.984375;
      }
      /**
       * Provides a cubic bezier curve, equivalent to CSS Transitions'
       * `transition-timing-function`.
       *
       * A useful tool to visualize cubic bezier curves can be found at
       * http://cubic-bezier.com/
       */
      static bezier(x1, y1, x2, y2) {
        return (0, _bezier2.default)(x1, y1, x2, y2);
      }
      /**
       * Runs an easing function forwards.
       */
      static in(easing) {
        return easing;
      }
      /**
       * Runs an easing function backwards.
       */
      static out(easing) {
        return (t) => 1 - easing(1 - t);
      }
      /**
       * Makes any easing function symmetrical. The easing function will run
       * forwards for half of the duration, then backwards for the rest of the
       * duration.
       */
      static inOut(easing) {
        return (t) => {
          if (t < 0.5) {
            return easing(t * 2) / 2;
          }
          return 1 - easing((1 - t) * 2) / 2;
        };
      }
    };
    var _default = exports2.default = Easing;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Easing/index.js
var require_Easing2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Easing/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _Easing = _interopRequireDefault(require_Easing());
    var _default = exports2.default = _Easing.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/animations/TimingAnimation.js
var require_TimingAnimation = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/animations/TimingAnimation.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _AnimatedValueXY = _interopRequireDefault(require_AnimatedValueXY());
    var _AnimatedInterpolation = _interopRequireDefault(require_AnimatedInterpolation());
    var _Easing = _interopRequireDefault(require_Easing2());
    var _Animation = _interopRequireDefault(require_Animation());
    var _NativeAnimatedHelper = require_NativeAnimatedHelper();
    var _AnimatedColor = _interopRequireDefault(require_AnimatedColor());
    var _easeInOut;
    function easeInOut() {
      if (!_easeInOut) {
        _easeInOut = _Easing.default.inOut(_Easing.default.ease);
      }
      return _easeInOut;
    }
    __name(easeInOut, "easeInOut");
    var TimingAnimation = class extends _Animation.default {
      static {
        __name(this, "TimingAnimation");
      }
      constructor(config) {
        var _config$easing, _config$duration, _config$delay, _config$iterations, _config$isInteraction;
        super();
        this._toValue = config.toValue;
        this._easing = (_config$easing = config.easing) !== null && _config$easing !== void 0 ? _config$easing : easeInOut();
        this._duration = (_config$duration = config.duration) !== null && _config$duration !== void 0 ? _config$duration : 500;
        this._delay = (_config$delay = config.delay) !== null && _config$delay !== void 0 ? _config$delay : 0;
        this.__iterations = (_config$iterations = config.iterations) !== null && _config$iterations !== void 0 ? _config$iterations : 1;
        this._useNativeDriver = (0, _NativeAnimatedHelper.shouldUseNativeDriver)(config);
        this._platformConfig = config.platformConfig;
        this.__isInteraction = (_config$isInteraction = config.isInteraction) !== null && _config$isInteraction !== void 0 ? _config$isInteraction : !this._useNativeDriver;
      }
      __getNativeAnimationConfig() {
        var frameDuration = 1e3 / 60;
        var frames = [];
        var numFrames = Math.round(this._duration / frameDuration);
        for (var frame = 0; frame < numFrames; frame++) {
          frames.push(this._easing(frame / numFrames));
        }
        frames.push(this._easing(1));
        return {
          type: "frames",
          frames,
          toValue: this._toValue,
          iterations: this.__iterations,
          platformConfig: this._platformConfig
        };
      }
      start(fromValue, onUpdate, onEnd, previousAnimation, animatedValue) {
        this.__active = true;
        this._fromValue = fromValue;
        this._onUpdate = onUpdate;
        this.__onEnd = onEnd;
        var start = /* @__PURE__ */ __name(() => {
          if (this._duration === 0 && !this._useNativeDriver) {
            this._onUpdate(this._toValue);
            this.__debouncedOnEnd({
              finished: true
            });
          } else {
            this._startTime = Date.now();
            if (this._useNativeDriver) {
              this.__startNativeAnimation(animatedValue);
            } else {
              this._animationFrame = requestAnimationFrame(
                // $FlowFixMe[method-unbinding] added when improving typing for this parameters
                this.onUpdate.bind(this)
              );
            }
          }
        }, "start");
        if (this._delay) {
          this._timeout = setTimeout(start, this._delay);
        } else {
          start();
        }
      }
      onUpdate() {
        var now = Date.now();
        if (now >= this._startTime + this._duration) {
          if (this._duration === 0) {
            this._onUpdate(this._toValue);
          } else {
            this._onUpdate(this._fromValue + this._easing(1) * (this._toValue - this._fromValue));
          }
          this.__debouncedOnEnd({
            finished: true
          });
          return;
        }
        this._onUpdate(this._fromValue + this._easing((now - this._startTime) / this._duration) * (this._toValue - this._fromValue));
        if (this.__active) {
          this._animationFrame = requestAnimationFrame(this.onUpdate.bind(this));
        }
      }
      stop() {
        super.stop();
        this.__active = false;
        clearTimeout(this._timeout);
        global.cancelAnimationFrame(this._animationFrame);
        this.__debouncedOnEnd({
          finished: false
        });
      }
    };
    var _default = exports2.default = TimingAnimation;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/AnimatedImplementation.js
var require_AnimatedImplementation = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/AnimatedImplementation.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _AnimatedEvent = require_AnimatedEvent();
    var _AnimatedAddition = _interopRequireDefault(require_AnimatedAddition());
    var _AnimatedDiffClamp = _interopRequireDefault(require_AnimatedDiffClamp());
    var _AnimatedDivision = _interopRequireDefault(require_AnimatedDivision());
    var _AnimatedInterpolation = _interopRequireDefault(require_AnimatedInterpolation());
    var _AnimatedModulo = _interopRequireDefault(require_AnimatedModulo());
    var _AnimatedMultiplication = _interopRequireDefault(require_AnimatedMultiplication());
    var _AnimatedNode = _interopRequireDefault(require_AnimatedNode());
    var _AnimatedProps = _interopRequireDefault(require_AnimatedProps());
    var _AnimatedSubtraction = _interopRequireDefault(require_AnimatedSubtraction());
    var _AnimatedTracking = _interopRequireDefault(require_AnimatedTracking());
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _AnimatedValueXY = _interopRequireDefault(require_AnimatedValueXY());
    var _DecayAnimation = _interopRequireDefault(require_DecayAnimation());
    var _SpringAnimation = _interopRequireDefault(require_SpringAnimation());
    var _TimingAnimation = _interopRequireDefault(require_TimingAnimation());
    var _createAnimatedComponent = _interopRequireDefault(require_createAnimatedComponent());
    var _AnimatedColor = _interopRequireDefault(require_AnimatedColor());
    var add = /* @__PURE__ */ __name(function add2(a, b) {
      return new _AnimatedAddition.default(a, b);
    }, "add");
    var subtract = /* @__PURE__ */ __name(function subtract2(a, b) {
      return new _AnimatedSubtraction.default(a, b);
    }, "subtract");
    var divide = /* @__PURE__ */ __name(function divide2(a, b) {
      return new _AnimatedDivision.default(a, b);
    }, "divide");
    var multiply = /* @__PURE__ */ __name(function multiply2(a, b) {
      return new _AnimatedMultiplication.default(a, b);
    }, "multiply");
    var modulo = /* @__PURE__ */ __name(function modulo2(a, modulus) {
      return new _AnimatedModulo.default(a, modulus);
    }, "modulo");
    var diffClamp = /* @__PURE__ */ __name(function diffClamp2(a, min, max) {
      return new _AnimatedDiffClamp.default(a, min, max);
    }, "diffClamp");
    var _combineCallbacks = /* @__PURE__ */ __name(function _combineCallbacks2(callback, config) {
      if (callback && config.onComplete) {
        return function() {
          config.onComplete && config.onComplete(...arguments);
          callback && callback(...arguments);
        };
      } else {
        return callback || config.onComplete;
      }
    }, "_combineCallbacks");
    var maybeVectorAnim = /* @__PURE__ */ __name(function maybeVectorAnim2(value, config, anim) {
      if (value instanceof _AnimatedValueXY.default) {
        var configX = (0, _objectSpread2.default)({}, config);
        var configY = (0, _objectSpread2.default)({}, config);
        for (var key in config) {
          var _config$key = config[key], x = _config$key.x, y = _config$key.y;
          if (x !== void 0 && y !== void 0) {
            configX[key] = x;
            configY[key] = y;
          }
        }
        var aX = anim(value.x, configX);
        var aY = anim(value.y, configY);
        return parallel([aX, aY], {
          stopTogether: false
        });
      } else if (value instanceof _AnimatedColor.default) {
        var configR = (0, _objectSpread2.default)({}, config);
        var configG = (0, _objectSpread2.default)({}, config);
        var configB = (0, _objectSpread2.default)({}, config);
        var configA = (0, _objectSpread2.default)({}, config);
        for (var _key in config) {
          var _config$_key = config[_key], r = _config$_key.r, g = _config$_key.g, b = _config$_key.b, a = _config$_key.a;
          if (r !== void 0 && g !== void 0 && b !== void 0 && a !== void 0) {
            configR[_key] = r;
            configG[_key] = g;
            configB[_key] = b;
            configA[_key] = a;
          }
        }
        var aR = anim(value.r, configR);
        var aG = anim(value.g, configG);
        var aB = anim(value.b, configB);
        var aA = anim(value.a, configA);
        return parallel([aR, aG, aB, aA], {
          stopTogether: false
        });
      }
      return null;
    }, "maybeVectorAnim");
    var spring = /* @__PURE__ */ __name(function spring2(value, config) {
      var _start = /* @__PURE__ */ __name(function start(animatedValue, configuration, callback) {
        callback = _combineCallbacks(callback, configuration);
        var singleValue = animatedValue;
        var singleConfig = configuration;
        singleValue.stopTracking();
        if (configuration.toValue instanceof _AnimatedNode.default) {
          singleValue.track(new _AnimatedTracking.default(singleValue, configuration.toValue, _SpringAnimation.default, singleConfig, callback));
        } else {
          singleValue.animate(new _SpringAnimation.default(singleConfig), callback);
        }
      }, "start");
      return maybeVectorAnim(value, config, spring2) || {
        start: /* @__PURE__ */ __name(function start(callback) {
          _start(value, config, callback);
        }, "start"),
        stop: /* @__PURE__ */ __name(function stop() {
          value.stopAnimation();
        }, "stop"),
        reset: /* @__PURE__ */ __name(function reset() {
          value.resetAnimation();
        }, "reset"),
        _startNativeLoop: /* @__PURE__ */ __name(function _startNativeLoop(iterations) {
          var singleConfig = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, config), {}, {
            iterations
          });
          _start(value, singleConfig);
        }, "_startNativeLoop"),
        _isUsingNativeDriver: /* @__PURE__ */ __name(function _isUsingNativeDriver() {
          return config.useNativeDriver || false;
        }, "_isUsingNativeDriver")
      };
    }, "spring");
    var timing = /* @__PURE__ */ __name(function timing2(value, config) {
      var _start2 = /* @__PURE__ */ __name(function start(animatedValue, configuration, callback) {
        callback = _combineCallbacks(callback, configuration);
        var singleValue = animatedValue;
        var singleConfig = configuration;
        singleValue.stopTracking();
        if (configuration.toValue instanceof _AnimatedNode.default) {
          singleValue.track(new _AnimatedTracking.default(singleValue, configuration.toValue, _TimingAnimation.default, singleConfig, callback));
        } else {
          singleValue.animate(new _TimingAnimation.default(singleConfig), callback);
        }
      }, "start");
      return maybeVectorAnim(value, config, timing2) || {
        start: /* @__PURE__ */ __name(function start(callback) {
          _start2(value, config, callback);
        }, "start"),
        stop: /* @__PURE__ */ __name(function stop() {
          value.stopAnimation();
        }, "stop"),
        reset: /* @__PURE__ */ __name(function reset() {
          value.resetAnimation();
        }, "reset"),
        _startNativeLoop: /* @__PURE__ */ __name(function _startNativeLoop(iterations) {
          var singleConfig = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, config), {}, {
            iterations
          });
          _start2(value, singleConfig);
        }, "_startNativeLoop"),
        _isUsingNativeDriver: /* @__PURE__ */ __name(function _isUsingNativeDriver() {
          return config.useNativeDriver || false;
        }, "_isUsingNativeDriver")
      };
    }, "timing");
    var decay = /* @__PURE__ */ __name(function decay2(value, config) {
      var _start3 = /* @__PURE__ */ __name(function start(animatedValue, configuration, callback) {
        callback = _combineCallbacks(callback, configuration);
        var singleValue = animatedValue;
        var singleConfig = configuration;
        singleValue.stopTracking();
        singleValue.animate(new _DecayAnimation.default(singleConfig), callback);
      }, "start");
      return maybeVectorAnim(value, config, decay2) || {
        start: /* @__PURE__ */ __name(function start(callback) {
          _start3(value, config, callback);
        }, "start"),
        stop: /* @__PURE__ */ __name(function stop() {
          value.stopAnimation();
        }, "stop"),
        reset: /* @__PURE__ */ __name(function reset() {
          value.resetAnimation();
        }, "reset"),
        _startNativeLoop: /* @__PURE__ */ __name(function _startNativeLoop(iterations) {
          var singleConfig = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, config), {}, {
            iterations
          });
          _start3(value, singleConfig);
        }, "_startNativeLoop"),
        _isUsingNativeDriver: /* @__PURE__ */ __name(function _isUsingNativeDriver() {
          return config.useNativeDriver || false;
        }, "_isUsingNativeDriver")
      };
    }, "decay");
    var sequence = /* @__PURE__ */ __name(function sequence2(animations) {
      var current = 0;
      return {
        start: /* @__PURE__ */ __name(function start(callback) {
          var onComplete = /* @__PURE__ */ __name(function onComplete2(result) {
            if (!result.finished) {
              callback && callback(result);
              return;
            }
            current++;
            if (current === animations.length) {
              current = 0;
              callback && callback(result);
              return;
            }
            animations[current].start(onComplete2);
          }, "onComplete");
          if (animations.length === 0) {
            callback && callback({
              finished: true
            });
          } else {
            animations[current].start(onComplete);
          }
        }, "start"),
        stop: /* @__PURE__ */ __name(function stop() {
          if (current < animations.length) {
            animations[current].stop();
          }
        }, "stop"),
        reset: /* @__PURE__ */ __name(function reset() {
          animations.forEach((animation, idx) => {
            if (idx <= current) {
              animation.reset();
            }
          });
          current = 0;
        }, "reset"),
        _startNativeLoop: /* @__PURE__ */ __name(function _startNativeLoop() {
          throw new Error("Loops run using the native driver cannot contain Animated.sequence animations");
        }, "_startNativeLoop"),
        _isUsingNativeDriver: /* @__PURE__ */ __name(function _isUsingNativeDriver() {
          return false;
        }, "_isUsingNativeDriver")
      };
    }, "sequence");
    var parallel = /* @__PURE__ */ __name(function parallel2(animations, config) {
      var doneCount = 0;
      var hasEnded = {};
      var stopTogether = !(config && config.stopTogether === false);
      var result = {
        start: /* @__PURE__ */ __name(function start(callback) {
          if (doneCount === animations.length) {
            callback && callback({
              finished: true
            });
            return;
          }
          animations.forEach((animation, idx) => {
            var cb = /* @__PURE__ */ __name(function cb2(endResult) {
              hasEnded[idx] = true;
              doneCount++;
              if (doneCount === animations.length) {
                doneCount = 0;
                callback && callback(endResult);
                return;
              }
              if (!endResult.finished && stopTogether) {
                result.stop();
              }
            }, "cb");
            if (!animation) {
              cb({
                finished: true
              });
            } else {
              animation.start(cb);
            }
          });
        }, "start"),
        stop: /* @__PURE__ */ __name(function stop() {
          animations.forEach((animation, idx) => {
            !hasEnded[idx] && animation.stop();
            hasEnded[idx] = true;
          });
        }, "stop"),
        reset: /* @__PURE__ */ __name(function reset() {
          animations.forEach((animation, idx) => {
            animation.reset();
            hasEnded[idx] = false;
            doneCount = 0;
          });
        }, "reset"),
        _startNativeLoop: /* @__PURE__ */ __name(function _startNativeLoop() {
          throw new Error("Loops run using the native driver cannot contain Animated.parallel animations");
        }, "_startNativeLoop"),
        _isUsingNativeDriver: /* @__PURE__ */ __name(function _isUsingNativeDriver() {
          return false;
        }, "_isUsingNativeDriver")
      };
      return result;
    }, "parallel");
    var delay = /* @__PURE__ */ __name(function delay2(time) {
      return timing(new _AnimatedValue.default(0), {
        toValue: 0,
        delay: time,
        duration: 0,
        useNativeDriver: false
      });
    }, "delay");
    var stagger = /* @__PURE__ */ __name(function stagger2(time, animations) {
      return parallel(animations.map((animation, i) => {
        return sequence([delay(time * i), animation]);
      }));
    }, "stagger");
    var loop = /* @__PURE__ */ __name(function loop2(animation, _temp) {
      var _ref = _temp === void 0 ? {} : _temp, _ref$iterations = _ref.iterations, iterations = _ref$iterations === void 0 ? -1 : _ref$iterations, _ref$resetBeforeItera = _ref.resetBeforeIteration, resetBeforeIteration = _ref$resetBeforeItera === void 0 ? true : _ref$resetBeforeItera;
      var isFinished = false;
      var iterationsSoFar = 0;
      return {
        start: /* @__PURE__ */ __name(function start(callback) {
          var restart = /* @__PURE__ */ __name(function restart2(result) {
            if (result === void 0) {
              result = {
                finished: true
              };
            }
            if (isFinished || iterationsSoFar === iterations || result.finished === false) {
              callback && callback(result);
            } else {
              iterationsSoFar++;
              resetBeforeIteration && animation.reset();
              animation.start(restart2);
            }
          }, "restart");
          if (!animation || iterations === 0) {
            callback && callback({
              finished: true
            });
          } else {
            if (animation._isUsingNativeDriver()) {
              animation._startNativeLoop(iterations);
            } else {
              restart();
            }
          }
        }, "start"),
        stop: /* @__PURE__ */ __name(function stop() {
          isFinished = true;
          animation.stop();
        }, "stop"),
        reset: /* @__PURE__ */ __name(function reset() {
          iterationsSoFar = 0;
          isFinished = false;
          animation.reset();
        }, "reset"),
        _startNativeLoop: /* @__PURE__ */ __name(function _startNativeLoop() {
          throw new Error("Loops run using the native driver cannot contain Animated.loop animations");
        }, "_startNativeLoop"),
        _isUsingNativeDriver: /* @__PURE__ */ __name(function _isUsingNativeDriver() {
          return animation._isUsingNativeDriver();
        }, "_isUsingNativeDriver")
      };
    }, "loop");
    function forkEvent(event2, listener) {
      if (!event2) {
        return listener;
      } else if (event2 instanceof _AnimatedEvent.AnimatedEvent) {
        event2.__addListener(listener);
        return event2;
      } else {
        return function() {
          typeof event2 === "function" && event2(...arguments);
          listener(...arguments);
        };
      }
    }
    __name(forkEvent, "forkEvent");
    function unforkEvent(event2, listener) {
      if (event2 && event2 instanceof _AnimatedEvent.AnimatedEvent) {
        event2.__removeListener(listener);
      }
    }
    __name(unforkEvent, "unforkEvent");
    var event = /* @__PURE__ */ __name(function event2(argMapping, config) {
      var animatedEvent = new _AnimatedEvent.AnimatedEvent(argMapping, config);
      if (animatedEvent.__isNative) {
        return animatedEvent;
      } else {
        return animatedEvent.__getHandler();
      }
    }, "event");
    var _default = exports2.default = {
      /**
       * Standard value class for driving animations.  Typically initialized with
       * `new Animated.Value(0);`
       *
       * See https://reactnative.dev/docs/animated#value
       */
      Value: _AnimatedValue.default,
      /**
       * 2D value class for driving 2D animations, such as pan gestures.
       *
       * See https://reactnative.dev/docs/animatedvaluexy
       */
      ValueXY: _AnimatedValueXY.default,
      /**
       * Value class for driving color animations.
       */
      Color: _AnimatedColor.default,
      /**
       * Exported to use the Interpolation type in flow.
       *
       * See https://reactnative.dev/docs/animated#interpolation
       */
      Interpolation: _AnimatedInterpolation.default,
      /**
       * Exported for ease of type checking. All animated values derive from this
       * class.
       *
       * See https://reactnative.dev/docs/animated#node
       */
      Node: _AnimatedNode.default,
      /**
       * Animates a value from an initial velocity to zero based on a decay
       * coefficient.
       *
       * See https://reactnative.dev/docs/animated#decay
       */
      decay,
      /**
       * Animates a value along a timed easing curve. The Easing module has tons of
       * predefined curves, or you can use your own function.
       *
       * See https://reactnative.dev/docs/animated#timing
       */
      timing,
      /**
       * Animates a value according to an analytical spring model based on
       * damped harmonic oscillation.
       *
       * See https://reactnative.dev/docs/animated#spring
       */
      spring,
      /**
       * Creates a new Animated value composed from two Animated values added
       * together.
       *
       * See https://reactnative.dev/docs/animated#add
       */
      add,
      /**
       * Creates a new Animated value composed by subtracting the second Animated
       * value from the first Animated value.
       *
       * See https://reactnative.dev/docs/animated#subtract
       */
      subtract,
      /**
       * Creates a new Animated value composed by dividing the first Animated value
       * by the second Animated value.
       *
       * See https://reactnative.dev/docs/animated#divide
       */
      divide,
      /**
       * Creates a new Animated value composed from two Animated values multiplied
       * together.
       *
       * See https://reactnative.dev/docs/animated#multiply
       */
      multiply,
      /**
       * Creates a new Animated value that is the (non-negative) modulo of the
       * provided Animated value.
       *
       * See https://reactnative.dev/docs/animated#modulo
       */
      modulo,
      /**
       * Create a new Animated value that is limited between 2 values. It uses the
       * difference between the last value so even if the value is far from the
       * bounds it will start changing when the value starts getting closer again.
       *
       * See https://reactnative.dev/docs/animated#diffclamp
       */
      diffClamp,
      /**
       * Starts an animation after the given delay.
       *
       * See https://reactnative.dev/docs/animated#delay
       */
      delay,
      /**
       * Starts an array of animations in order, waiting for each to complete
       * before starting the next. If the current running animation is stopped, no
       * following animations will be started.
       *
       * See https://reactnative.dev/docs/animated#sequence
       */
      sequence,
      /**
       * Starts an array of animations all at the same time. By default, if one
       * of the animations is stopped, they will all be stopped. You can override
       * this with the `stopTogether` flag.
       *
       * See https://reactnative.dev/docs/animated#parallel
       */
      parallel,
      /**
       * Array of animations may run in parallel (overlap), but are started in
       * sequence with successive delays.  Nice for doing trailing effects.
       *
       * See https://reactnative.dev/docs/animated#stagger
       */
      stagger,
      /**
       * Loops a given animation continuously, so that each time it reaches the
       * end, it resets and begins again from the start.
       *
       * See https://reactnative.dev/docs/animated#loop
       */
      loop,
      /**
       * Takes an array of mappings and extracts values from each arg accordingly,
       * then calls `setValue` on the mapped outputs.
       *
       * See https://reactnative.dev/docs/animated#event
       */
      event,
      /**
       * Make any React component Animatable.  Used to create `Animated.View`, etc.
       *
       * See https://reactnative.dev/docs/animated#createanimatedcomponent
       */
      createAnimatedComponent: _createAnimatedComponent.default,
      /**
       * Imperative API to attach an animated value to an event on a view. Prefer
       * using `Animated.event` with `useNativeDrive: true` if possible.
       *
       * See https://reactnative.dev/docs/animated#attachnativeevent
       */
      attachNativeEvent: _AnimatedEvent.attachNativeEvent,
      /**
       * Advanced imperative API for snooping on animated events that are passed in
       * through props. Use values directly where possible.
       *
       * See https://reactnative.dev/docs/animated#forkevent
       */
      forkEvent,
      unforkEvent,
      /**
       * Expose Event class, so it can be used as a type for type checkers.
       */
      Event: _AnimatedEvent.AnimatedEvent
    };
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/AnimatedMock.js
var require_AnimatedMock = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/AnimatedMock.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _AnimatedEvent = require_AnimatedEvent();
    var _AnimatedImplementation = _interopRequireDefault(require_AnimatedImplementation());
    var _AnimatedInterpolation = _interopRequireDefault(require_AnimatedInterpolation());
    var _AnimatedNode = _interopRequireDefault(require_AnimatedNode());
    var _AnimatedValue = _interopRequireDefault(require_AnimatedValue());
    var _AnimatedValueXY = _interopRequireDefault(require_AnimatedValueXY());
    var _createAnimatedComponent = _interopRequireDefault(require_createAnimatedComponent());
    var _AnimatedColor = _interopRequireDefault(require_AnimatedColor());
    var inAnimationCallback = false;
    function mockAnimationStart(start) {
      return (callback) => {
        var guardedCallback = callback == null ? callback : function() {
          if (inAnimationCallback) {
            console.warn("Ignoring recursive animation callback when running mock animations");
            return;
          }
          inAnimationCallback = true;
          try {
            callback(...arguments);
          } finally {
            inAnimationCallback = false;
          }
        };
        start(guardedCallback);
      };
    }
    __name(mockAnimationStart, "mockAnimationStart");
    var emptyAnimation = {
      start: /* @__PURE__ */ __name(() => {
      }, "start"),
      stop: /* @__PURE__ */ __name(() => {
      }, "stop"),
      reset: /* @__PURE__ */ __name(() => {
      }, "reset"),
      _startNativeLoop: /* @__PURE__ */ __name(() => {
      }, "_startNativeLoop"),
      _isUsingNativeDriver: /* @__PURE__ */ __name(() => {
        return false;
      }, "_isUsingNativeDriver")
    };
    var mockCompositeAnimation = /* @__PURE__ */ __name((animations) => (0, _objectSpread2.default)((0, _objectSpread2.default)({}, emptyAnimation), {}, {
      start: mockAnimationStart((callback) => {
        animations.forEach((animation) => animation.start());
        callback == null ? void 0 : callback({
          finished: true
        });
      })
    }), "mockCompositeAnimation");
    var spring = /* @__PURE__ */ __name(function spring2(value, config) {
      var anyValue = value;
      return (0, _objectSpread2.default)((0, _objectSpread2.default)({}, emptyAnimation), {}, {
        start: mockAnimationStart((callback) => {
          anyValue.setValue(config.toValue);
          callback == null ? void 0 : callback({
            finished: true
          });
        })
      });
    }, "spring");
    var timing = /* @__PURE__ */ __name(function timing2(value, config) {
      var anyValue = value;
      return (0, _objectSpread2.default)((0, _objectSpread2.default)({}, emptyAnimation), {}, {
        start: mockAnimationStart((callback) => {
          anyValue.setValue(config.toValue);
          callback == null ? void 0 : callback({
            finished: true
          });
        })
      });
    }, "timing");
    var decay = /* @__PURE__ */ __name(function decay2(value, config) {
      return emptyAnimation;
    }, "decay");
    var sequence = /* @__PURE__ */ __name(function sequence2(animations) {
      return mockCompositeAnimation(animations);
    }, "sequence");
    var parallel = /* @__PURE__ */ __name(function parallel2(animations, config) {
      return mockCompositeAnimation(animations);
    }, "parallel");
    var delay = /* @__PURE__ */ __name(function delay2(time) {
      return emptyAnimation;
    }, "delay");
    var stagger = /* @__PURE__ */ __name(function stagger2(time, animations) {
      return mockCompositeAnimation(animations);
    }, "stagger");
    var loop = /* @__PURE__ */ __name(function loop2(animation, _temp) {
      var _ref = _temp === void 0 ? {} : _temp, _ref$iterations = _ref.iterations, iterations = _ref$iterations === void 0 ? -1 : _ref$iterations;
      return emptyAnimation;
    }, "loop");
    var _default = exports2.default = {
      Value: _AnimatedValue.default,
      ValueXY: _AnimatedValueXY.default,
      Color: _AnimatedColor.default,
      Interpolation: _AnimatedInterpolation.default,
      Node: _AnimatedNode.default,
      decay,
      timing,
      spring,
      add: _AnimatedImplementation.default.add,
      subtract: _AnimatedImplementation.default.subtract,
      divide: _AnimatedImplementation.default.divide,
      multiply: _AnimatedImplementation.default.multiply,
      modulo: _AnimatedImplementation.default.modulo,
      diffClamp: _AnimatedImplementation.default.diffClamp,
      delay,
      sequence,
      parallel,
      stagger,
      loop,
      event: _AnimatedImplementation.default.event,
      createAnimatedComponent: _createAnimatedComponent.default,
      attachNativeEvent: _AnimatedEvent.attachNativeEvent,
      forkEvent: _AnimatedImplementation.default.forkEvent,
      unforkEvent: _AnimatedImplementation.default.unforkEvent,
      Event: _AnimatedEvent.AnimatedEvent
    };
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/Animated.js
var require_Animated = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/Animated/Animated.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _Platform = _interopRequireDefault(require_Platform());
    var _AnimatedFlatList = _interopRequireDefault(require_AnimatedFlatList());
    var _AnimatedImage = _interopRequireDefault(require_AnimatedImage());
    var _AnimatedScrollView = _interopRequireDefault(require_AnimatedScrollView());
    var _AnimatedSectionList = _interopRequireDefault(require_AnimatedSectionList());
    var _AnimatedText = _interopRequireDefault(require_AnimatedText());
    var _AnimatedView = _interopRequireDefault(require_AnimatedView());
    var _AnimatedMock = _interopRequireDefault(require_AnimatedMock());
    var _AnimatedImplementation = _interopRequireDefault(require_AnimatedImplementation());
    var Animated = _Platform.default.isTesting ? _AnimatedMock.default : _AnimatedImplementation.default;
    var _default = exports2.default = (0, _objectSpread2.default)({
      FlatList: _AnimatedFlatList.default,
      Image: _AnimatedImage.default,
      ScrollView: _AnimatedScrollView.default,
      SectionList: _AnimatedSectionList.default,
      Text: _AnimatedText.default,
      View: _AnimatedView.default
    }, Animated);
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Animated/index.js
var require_Animated2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Animated/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _Animated = _interopRequireDefault(require_Animated());
    var _default = exports2.default = _Animated.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Appearance/index.js
var require_Appearance = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Appearance/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    function getQuery() {
      return _canUseDom.default && window.matchMedia != null ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    }
    __name(getQuery, "getQuery");
    var query = getQuery();
    var listenerMapping = /* @__PURE__ */ new WeakMap();
    var Appearance = {
      getColorScheme() {
        return query && query.matches ? "dark" : "light";
      },
      addChangeListener(listener) {
        var mappedListener = listenerMapping.get(listener);
        if (!mappedListener) {
          mappedListener = /* @__PURE__ */ __name((_ref) => {
            var matches = _ref.matches;
            listener({
              colorScheme: matches ? "dark" : "light"
            });
          }, "mappedListener");
          listenerMapping.set(listener, mappedListener);
        }
        if (query) {
          query.addListener(mappedListener);
        }
        function remove() {
          var mappedListener2 = listenerMapping.get(listener);
          if (query && mappedListener2) {
            query.removeListener(mappedListener2);
          }
          listenerMapping.delete(listener);
        }
        __name(remove, "remove");
        return {
          remove
        };
      }
    };
    var _default = exports2.default = Appearance;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/AppRegistry/AppContainer.js
var require_AppContainer = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/AppRegistry/AppContainer.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var React24 = _interopRequireWildcard(require("react"));
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var RootTagContext = /* @__PURE__ */ React24.createContext(null);
    var AppContainer = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var children = props.children, WrapperComponent = props.WrapperComponent;
      var innerView = /* @__PURE__ */ React24.createElement(_View.default, {
        children,
        key: 1,
        style: styles.appContainer
      });
      if (WrapperComponent) {
        innerView = /* @__PURE__ */ React24.createElement(WrapperComponent, null, innerView);
      }
      return /* @__PURE__ */ React24.createElement(RootTagContext.Provider, {
        value: props.rootTag
      }, /* @__PURE__ */ React24.createElement(_View.default, {
        ref: forwardedRef,
        style: styles.appContainer
      }, innerView));
    });
    AppContainer.displayName = "AppContainer";
    var _default = exports2.default = AppContainer;
    var styles = _StyleSheet.default.create({
      appContainer: {
        flex: 1,
        pointerEvents: "box-none"
      }
    });
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/AppRegistry/renderApplication.js
var require_renderApplication = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/AppRegistry/renderApplication.js"(exports2) {
    "use strict";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = renderApplication;
    exports2.getApplication = getApplication;
    var _extends2 = _interopRequireDefault(require_extends());
    var _AppContainer = _interopRequireDefault(require_AppContainer());
    var _invariant = _interopRequireDefault(require_invariant());
    var _render = _interopRequireWildcard(require_render());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _react = _interopRequireDefault(require("react"));
    function renderApplication(RootComponent, WrapperComponent, callback, options) {
      var shouldHydrate = options.hydrate, initialProps = options.initialProps, rootTag = options.rootTag;
      var renderFn = shouldHydrate ? _render.hydrate : _render.default;
      (0, _invariant.default)(rootTag, "Expect to have a valid rootTag, instead got ", rootTag);
      return renderFn(/* @__PURE__ */ _react.default.createElement(_AppContainer.default, {
        WrapperComponent,
        ref: callback,
        rootTag
      }, /* @__PURE__ */ _react.default.createElement(RootComponent, initialProps)), rootTag);
    }
    __name(renderApplication, "renderApplication");
    function getApplication(RootComponent, initialProps, WrapperComponent) {
      var element = /* @__PURE__ */ _react.default.createElement(_AppContainer.default, {
        WrapperComponent,
        rootTag: {}
      }, /* @__PURE__ */ _react.default.createElement(RootComponent, initialProps));
      var getStyleElement = /* @__PURE__ */ __name((props) => {
        var sheet = _StyleSheet.default.getSheet();
        return /* @__PURE__ */ _react.default.createElement("style", (0, _extends2.default)({}, props, {
          dangerouslySetInnerHTML: {
            __html: sheet.textContent
          },
          id: sheet.id
        }));
      }, "getStyleElement");
      return {
        element,
        getStyleElement
      };
    }
    __name(getApplication, "getApplication");
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/AppRegistry/index.js
var require_AppRegistry = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/AppRegistry/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _invariant = _interopRequireDefault(require_invariant());
    var _unmountComponentAtNode = _interopRequireDefault(require_unmountComponentAtNode());
    var _renderApplication = _interopRequireWildcard(require_renderApplication());
    var emptyObject = {};
    var runnables = {};
    var componentProviderInstrumentationHook = /* @__PURE__ */ __name((component) => component(), "componentProviderInstrumentationHook");
    var wrapperComponentProvider;
    var AppRegistry = class _AppRegistry {
      static {
        __name(this, "AppRegistry");
      }
      static getAppKeys() {
        return Object.keys(runnables);
      }
      static getApplication(appKey, appParameters) {
        (0, _invariant.default)(runnables[appKey] && runnables[appKey].getApplication, "Application " + appKey + " has not been registered. This is either due to an import error during initialization or failure to call AppRegistry.registerComponent.");
        return runnables[appKey].getApplication(appParameters);
      }
      static registerComponent(appKey, componentProvider) {
        runnables[appKey] = {
          getApplication: /* @__PURE__ */ __name((appParameters) => (0, _renderApplication.getApplication)(componentProviderInstrumentationHook(componentProvider), appParameters ? appParameters.initialProps : emptyObject, wrapperComponentProvider && wrapperComponentProvider(appParameters)), "getApplication"),
          run: /* @__PURE__ */ __name((appParameters) => (0, _renderApplication.default)(componentProviderInstrumentationHook(componentProvider), wrapperComponentProvider && wrapperComponentProvider(appParameters), appParameters.callback, {
            hydrate: appParameters.hydrate || false,
            initialProps: appParameters.initialProps || emptyObject,
            mode: appParameters.mode || "concurrent",
            rootTag: appParameters.rootTag
          }), "run")
        };
        return appKey;
      }
      static registerConfig(config) {
        config.forEach((_ref) => {
          var appKey = _ref.appKey, component = _ref.component, run = _ref.run;
          if (run) {
            _AppRegistry.registerRunnable(appKey, run);
          } else {
            (0, _invariant.default)(component, "No component provider passed in");
            _AppRegistry.registerComponent(appKey, component);
          }
        });
      }
      // TODO: fix style sheet creation when using this method
      static registerRunnable(appKey, run) {
        runnables[appKey] = {
          run
        };
        return appKey;
      }
      static runApplication(appKey, appParameters) {
        var isDevelopment = process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test";
        if (isDevelopment) {
          var params = (0, _objectSpread2.default)({}, appParameters);
          params.rootTag = "#" + params.rootTag.id;
          console.log('Running application "' + appKey + '" with appParams:\n', params, "\nDevelopment-level warnings: " + (isDevelopment ? "ON" : "OFF") + "." + ("\nPerformance optimizations: " + (isDevelopment ? "OFF" : "ON") + "."));
        }
        (0, _invariant.default)(runnables[appKey] && runnables[appKey].run, 'Application "' + appKey + '" has not been registered. This is either due to an import error during initialization or failure to call AppRegistry.registerComponent.');
        return runnables[appKey].run(appParameters);
      }
      static setComponentProviderInstrumentationHook(hook) {
        componentProviderInstrumentationHook = hook;
      }
      static setWrapperComponentProvider(provider) {
        wrapperComponentProvider = provider;
      }
      static unmountApplicationComponentAtRootTag(rootTag) {
        (0, _unmountComponentAtNode.default)(rootTag);
      }
    };
    exports2.default = AppRegistry;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/AppState/index.js
var require_AppState = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/AppState/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _invariant = _interopRequireDefault(require_invariant());
    var _EventEmitter = _interopRequireDefault(require_EventEmitter());
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var isPrefixed = _canUseDom.default && !document.hasOwnProperty("hidden") && document.hasOwnProperty("webkitHidden");
    var EVENT_TYPES = ["change", "memoryWarning"];
    var VISIBILITY_CHANGE_EVENT = isPrefixed ? "webkitvisibilitychange" : "visibilitychange";
    var VISIBILITY_STATE_PROPERTY = isPrefixed ? "webkitVisibilityState" : "visibilityState";
    var AppStates = {
      BACKGROUND: "background",
      ACTIVE: "active"
    };
    var changeEmitter = null;
    var AppState = class _AppState {
      static {
        __name(this, "AppState");
      }
      static get currentState() {
        if (!_AppState.isAvailable) {
          return AppStates.ACTIVE;
        }
        switch (document[VISIBILITY_STATE_PROPERTY]) {
          case "hidden":
          case "prerender":
          case "unloaded":
            return AppStates.BACKGROUND;
          default:
            return AppStates.ACTIVE;
        }
      }
      static addEventListener(type, handler) {
        if (_AppState.isAvailable) {
          (0, _invariant.default)(EVENT_TYPES.indexOf(type) !== -1, 'Trying to subscribe to unknown event: "%s"', type);
          if (type === "change") {
            if (!changeEmitter) {
              changeEmitter = new _EventEmitter.default();
              document.addEventListener(VISIBILITY_CHANGE_EVENT, () => {
                if (changeEmitter) {
                  changeEmitter.emit("change", _AppState.currentState);
                }
              }, false);
            }
            return changeEmitter.addListener(type, handler);
          }
        }
      }
    };
    exports2.default = AppState;
    AppState.isAvailable = _canUseDom.default && !!document[VISIBILITY_STATE_PROPERTY];
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/BackHandler/index.js
var require_BackHandler = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/BackHandler/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    function emptyFunction() {
    }
    __name(emptyFunction, "emptyFunction");
    var BackHandler = {
      exitApp: emptyFunction,
      addEventListener() {
        console.error("BackHandler is not supported on web and should not be used.");
        return {
          remove: emptyFunction
        };
      },
      removeEventListener: emptyFunction
    };
    var _default = exports2.default = BackHandler;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Clipboard/index.js
var require_Clipboard = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Clipboard/index.js"(exports2, module2) {
    "use strict";
    "use client";
    exports2.__esModule = true;
    exports2.default = void 0;
    var clipboardAvailable;
    var Clipboard = class {
      static {
        __name(this, "Clipboard");
      }
      static isAvailable() {
        if (clipboardAvailable === void 0) {
          clipboardAvailable = typeof document.queryCommandSupported === "function" && document.queryCommandSupported("copy");
        }
        return clipboardAvailable;
      }
      static getString() {
        return Promise.resolve("");
      }
      static setString(text) {
        var success = false;
        var body = document.body;
        if (body) {
          var node = document.createElement("span");
          node.textContent = text;
          node.style.opacity = "0";
          node.style.position = "absolute";
          node.style.whiteSpace = "pre-wrap";
          node.style.userSelect = "auto";
          body.appendChild(node);
          var selection = window.getSelection();
          selection.removeAllRanges();
          var range = document.createRange();
          range.selectNodeContents(node);
          selection.addRange(range);
          try {
            document.execCommand("copy");
            success = true;
          } catch (e) {
          }
          selection.removeAllRanges();
          body.removeChild(node);
        }
        return success;
      }
    };
    exports2.default = Clipboard;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/I18nManager/index.js
var require_I18nManager = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/I18nManager/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var I18nManager = {
      allowRTL() {
        return;
      },
      forceRTL() {
        return;
      },
      getConstants() {
        return {
          isRTL: false
        };
      }
    };
    var _default = exports2.default = I18nManager;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Keyboard/index.js
var require_Keyboard = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Keyboard/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _dismissKeyboard = _interopRequireDefault(require_dismissKeyboard());
    var Keyboard = {
      isVisible() {
        return false;
      },
      addListener() {
        return {
          remove: /* @__PURE__ */ __name(() => {
          }, "remove")
        };
      },
      dismiss() {
        (0, _dismissKeyboard.default)();
      },
      removeAllListeners() {
      },
      removeListener() {
      }
    };
    var _default = exports2.default = Keyboard;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/LayoutAnimation/index.js
var require_LayoutAnimation = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/LayoutAnimation/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _Platform = _interopRequireDefault(require_Platform());
    var _UIManager = _interopRequireDefault(require_UIManager());
    var __DEV__ = process.env.NODE_ENV !== "production";
    function configureNext(config, onAnimationDidEnd) {
      if (!_Platform.default.isTesting) {
        _UIManager.default.configureNextLayoutAnimation(
          config,
          onAnimationDidEnd !== null && onAnimationDidEnd !== void 0 ? onAnimationDidEnd : function() {
          },
          function() {
          }
          /* unused onError */
        );
      }
    }
    __name(configureNext, "configureNext");
    function create(duration, type, property) {
      return {
        duration,
        create: {
          type,
          property
        },
        update: {
          type
        },
        delete: {
          type,
          property
        }
      };
    }
    __name(create, "create");
    var Presets = {
      easeInEaseOut: create(300, "easeInEaseOut", "opacity"),
      linear: create(500, "linear", "opacity"),
      spring: {
        duration: 700,
        create: {
          type: "linear",
          property: "opacity"
        },
        update: {
          type: "spring",
          springDamping: 0.4
        },
        delete: {
          type: "linear",
          property: "opacity"
        }
      }
    };
    var LayoutAnimation = {
      /**
       * Schedules an animation to happen on the next layout.
       *
       * @param config Specifies animation properties:
       *
       *   - `duration` in milliseconds
       *   - `create`, `AnimationConfig` for animating in new views
       *   - `update`, `AnimationConfig` for animating views that have been updated
       *
       * @param onAnimationDidEnd Called when the animation finished.
       * Only supported on iOS.
       * @param onError Called on error. Only supported on iOS.
       */
      configureNext,
      /**
       * Helper for creating a config for `configureNext`.
       */
      create,
      Types: Object.freeze({
        spring: "spring",
        linear: "linear",
        easeInEaseOut: "easeInEaseOut",
        easeIn: "easeIn",
        easeOut: "easeOut",
        keyboard: "keyboard"
      }),
      Properties: Object.freeze({
        opacity: "opacity",
        scaleX: "scaleX",
        scaleY: "scaleY",
        scaleXY: "scaleXY"
      }),
      checkConfig() {
        console.error("LayoutAnimation.checkConfig(...) has been disabled.");
      },
      Presets,
      easeInEaseOut: configureNext.bind(null, Presets.easeInEaseOut),
      linear: configureNext.bind(null, Presets.linear),
      spring: configureNext.bind(null, Presets.spring)
    };
    var _default = exports2.default = LayoutAnimation;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/LayoutAnimation/index.js
var require_LayoutAnimation2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/LayoutAnimation/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _LayoutAnimation = _interopRequireDefault(require_LayoutAnimation());
    var _default = exports2.default = _LayoutAnimation.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Linking/index.js
var require_Linking = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Linking/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _invariant = _interopRequireDefault(require_invariant());
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var initialURL = _canUseDom.default ? window.location.href : "";
    var Linking = class {
      static {
        __name(this, "Linking");
      }
      constructor() {
        this._eventCallbacks = {};
      }
      /**
       * An object mapping of event name
       * and all the callbacks subscribing to it
       */
      _dispatchEvent(event) {
        for (var _len = arguments.length, data = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          data[_key - 1] = arguments[_key];
        }
        var listeners = this._eventCallbacks[event];
        if (listeners != null && Array.isArray(listeners)) {
          listeners.map((listener) => {
            listener(...data);
          });
        }
      }
      /**
       * Adds a event listener for the specified event. The callback will be called when the
       * said event is dispatched.
       */
      addEventListener(eventType, callback) {
        var _this = this;
        if (!_this._eventCallbacks[eventType]) {
          _this._eventCallbacks[eventType] = [callback];
        }
        _this._eventCallbacks[eventType].push(callback);
        return {
          remove() {
            var callbacks = _this._eventCallbacks[eventType];
            var filteredCallbacks = callbacks.filter((c) => c.toString() !== callback.toString());
            _this._eventCallbacks[eventType] = filteredCallbacks;
          }
        };
      }
      /**
       * Removes a previously added event listener for the specified event. The callback must
       * be the same object as the one passed to `addEventListener`.
       */
      removeEventListener(eventType, callback) {
        console.error("Linking.removeEventListener('" + eventType + "', ...): Method has been deprecated. Please instead use `remove()` on the subscription returned by `Linking.addEventListener`.");
        var callbacks = this._eventCallbacks[eventType];
        var filteredCallbacks = callbacks.filter((c) => c.toString() !== callback.toString());
        this._eventCallbacks[eventType] = filteredCallbacks;
      }
      canOpenURL() {
        return Promise.resolve(true);
      }
      getInitialURL() {
        return Promise.resolve(initialURL);
      }
      /**
       * Try to open the given url in a secure fashion. The method returns a Promise object.
       * If a target is passed (including undefined) that target will be used, otherwise '_blank'.
       * If the url opens, the promise is resolved. If not, the promise is rejected.
       * Dispatches the `onOpen` event if `url` is opened successfully.
       */
      openURL(url, target) {
        if (arguments.length === 1) {
          target = "_blank";
        }
        try {
          open(url, target);
          this._dispatchEvent("onOpen", url);
          return Promise.resolve();
        } catch (e) {
          return Promise.reject(e);
        }
      }
      _validateURL(url) {
        (0, _invariant.default)(typeof url === "string", "Invalid URL: should be a string. Was: " + url);
        (0, _invariant.default)(url, "Invalid URL: cannot be empty");
      }
    };
    var open = /* @__PURE__ */ __name((url, target) => {
      if (_canUseDom.default) {
        var urlToOpen = new URL(url, window.location).toString();
        if (urlToOpen.indexOf("tel:") === 0) {
          window.location = urlToOpen;
        } else {
          window.open(urlToOpen, target, "noopener");
        }
      }
    }, "open");
    var _default = exports2.default = new Linking();
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/NativeEventEmitter/index.js
var require_NativeEventEmitter2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/NativeEventEmitter/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _NativeEventEmitter = _interopRequireDefault(require_NativeEventEmitter());
    var _default = exports2.default = _NativeEventEmitter.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/TouchHistoryMath/index.js
var require_TouchHistoryMath = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/TouchHistoryMath/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var TouchHistoryMath = {
      /**
       * This code is optimized and not intended to look beautiful. This allows
       * computing of touch centroids that have moved after `touchesChangedAfter`
       * timeStamp. You can compute the current centroid involving all touches
       * moves after `touchesChangedAfter`, or you can compute the previous
       * centroid of all touches that were moved after `touchesChangedAfter`.
       *
       * @param {TouchHistoryMath} touchHistory Standard Responder touch track
       * data.
       * @param {number} touchesChangedAfter timeStamp after which moved touches
       * are considered "actively moving" - not just "active".
       * @param {boolean} isXAxis Consider `x` dimension vs. `y` dimension.
       * @param {boolean} ofCurrent Compute current centroid for actively moving
       * touches vs. previous centroid of now actively moving touches.
       * @return {number} value of centroid in specified dimension.
       */
      centroidDimension: /* @__PURE__ */ __name(function centroidDimension(touchHistory, touchesChangedAfter, isXAxis, ofCurrent) {
        var touchBank = touchHistory.touchBank;
        var total = 0;
        var count = 0;
        var oneTouchData = touchHistory.numberActiveTouches === 1 ? touchHistory.touchBank[touchHistory.indexOfSingleActiveTouch] : null;
        if (oneTouchData !== null) {
          if (oneTouchData.touchActive && oneTouchData.currentTimeStamp > touchesChangedAfter) {
            total += ofCurrent && isXAxis ? oneTouchData.currentPageX : ofCurrent && !isXAxis ? oneTouchData.currentPageY : !ofCurrent && isXAxis ? oneTouchData.previousPageX : oneTouchData.previousPageY;
            count = 1;
          }
        } else {
          for (var i = 0; i < touchBank.length; i++) {
            var touchTrack = touchBank[i];
            if (touchTrack !== null && touchTrack !== void 0 && touchTrack.touchActive && touchTrack.currentTimeStamp >= touchesChangedAfter) {
              var toAdd = void 0;
              if (ofCurrent && isXAxis) {
                toAdd = touchTrack.currentPageX;
              } else if (ofCurrent && !isXAxis) {
                toAdd = touchTrack.currentPageY;
              } else if (!ofCurrent && isXAxis) {
                toAdd = touchTrack.previousPageX;
              } else {
                toAdd = touchTrack.previousPageY;
              }
              total += toAdd;
              count++;
            }
          }
        }
        return count > 0 ? total / count : TouchHistoryMath.noCentroid;
      }, "centroidDimension"),
      currentCentroidXOfTouchesChangedAfter: /* @__PURE__ */ __name(function currentCentroidXOfTouchesChangedAfter(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(
          touchHistory,
          touchesChangedAfter,
          true,
          // isXAxis
          true
          // ofCurrent
        );
      }, "currentCentroidXOfTouchesChangedAfter"),
      currentCentroidYOfTouchesChangedAfter: /* @__PURE__ */ __name(function currentCentroidYOfTouchesChangedAfter(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(
          touchHistory,
          touchesChangedAfter,
          false,
          // isXAxis
          true
          // ofCurrent
        );
      }, "currentCentroidYOfTouchesChangedAfter"),
      previousCentroidXOfTouchesChangedAfter: /* @__PURE__ */ __name(function previousCentroidXOfTouchesChangedAfter(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(
          touchHistory,
          touchesChangedAfter,
          true,
          // isXAxis
          false
          // ofCurrent
        );
      }, "previousCentroidXOfTouchesChangedAfter"),
      previousCentroidYOfTouchesChangedAfter: /* @__PURE__ */ __name(function previousCentroidYOfTouchesChangedAfter(touchHistory, touchesChangedAfter) {
        return TouchHistoryMath.centroidDimension(
          touchHistory,
          touchesChangedAfter,
          false,
          // isXAxis
          false
          // ofCurrent
        );
      }, "previousCentroidYOfTouchesChangedAfter"),
      currentCentroidX: /* @__PURE__ */ __name(function currentCentroidX(touchHistory) {
        return TouchHistoryMath.centroidDimension(
          touchHistory,
          0,
          // touchesChangedAfter
          true,
          // isXAxis
          true
          // ofCurrent
        );
      }, "currentCentroidX"),
      currentCentroidY: /* @__PURE__ */ __name(function currentCentroidY(touchHistory) {
        return TouchHistoryMath.centroidDimension(
          touchHistory,
          0,
          // touchesChangedAfter
          false,
          // isXAxis
          true
          // ofCurrent
        );
      }, "currentCentroidY"),
      noCentroid: -1
    };
    var _default = exports2.default = TouchHistoryMath;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/PanResponder/index.js
var require_PanResponder = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/PanResponder/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _InteractionManager = _interopRequireDefault(require_InteractionManager());
    var _TouchHistoryMath = _interopRequireDefault(require_TouchHistoryMath());
    var currentCentroidXOfTouchesChangedAfter = _TouchHistoryMath.default.currentCentroidXOfTouchesChangedAfter;
    var currentCentroidYOfTouchesChangedAfter = _TouchHistoryMath.default.currentCentroidYOfTouchesChangedAfter;
    var previousCentroidXOfTouchesChangedAfter = _TouchHistoryMath.default.previousCentroidXOfTouchesChangedAfter;
    var previousCentroidYOfTouchesChangedAfter = _TouchHistoryMath.default.previousCentroidYOfTouchesChangedAfter;
    var currentCentroidX = _TouchHistoryMath.default.currentCentroidX;
    var currentCentroidY = _TouchHistoryMath.default.currentCentroidY;
    var PanResponder2 = {
      /**
       *
       * A graphical explanation of the touch data flow:
       *
       * +----------------------------+             +--------------------------------+
       * | ResponderTouchHistoryStore |             |TouchHistoryMath                |
       * +----------------------------+             +----------+---------------------+
       * |Global store of touchHistory|             |Allocation-less math util       |
       * |including activeness, start |             |on touch history (centroids     |
       * |position, prev/cur position.|             |and multitouch movement etc)    |
       * |                            |             |                                |
       * +----^-----------------------+             +----^---------------------------+
       *      |                                          |
       *      | (records relevant history                |
       *      |  of touches relevant for                 |
       *      |  implementing higher level               |
       *      |  gestures)                               |
       *      |                                          |
       * +----+-----------------------+             +----|---------------------------+
       * | ResponderEventPlugin       |             |    |   Your App/Component      |
       * +----------------------------+             +----|---------------------------+
       * |Negotiates which view gets  | Low level   |    |             High level    |
       * |onResponderMove events.     | events w/   |  +-+-------+     events w/     |
       * |Also records history into   | touchHistory|  |   Pan   |     multitouch +  |
       * |ResponderTouchHistoryStore. +---------------->Responder+-----> accumulative|
       * +----------------------------+ attached to |  |         |     distance and  |
       *                                 each event |  +---------+     velocity.     |
       *                                            |                                |
       *                                            |                                |
       *                                            +--------------------------------+
       *
       *
       *
       * Gesture that calculates cumulative movement over time in a way that just
       * "does the right thing" for multiple touches. The "right thing" is very
       * nuanced. When moving two touches in opposite directions, the cumulative
       * distance is zero in each dimension. When two touches move in parallel five
       * pixels in the same direction, the cumulative distance is five, not ten. If
       * two touches start, one moves five in a direction, then stops and the other
       * touch moves fives in the same direction, the cumulative distance is ten.
       *
       * This logic requires a kind of processing of time "clusters" of touch events
       * so that two touch moves that essentially occur in parallel but move every
       * other frame respectively, are considered part of the same movement.
       *
       * Explanation of some of the non-obvious fields:
       *
       * - moveX/moveY: If no move event has been observed, then `(moveX, moveY)` is
       *   invalid. If a move event has been observed, `(moveX, moveY)` is the
       *   centroid of the most recently moved "cluster" of active touches.
       *   (Currently all move have the same timeStamp, but later we should add some
       *   threshold for what is considered to be "moving"). If a palm is
       *   accidentally counted as a touch, but a finger is moving greatly, the palm
       *   will move slightly, but we only want to count the single moving touch.
       * - x0/y0: Centroid location (non-cumulative) at the time of becoming
       *   responder.
       * - dx/dy: Cumulative touch distance - not the same thing as sum of each touch
       *   distance. Accounts for touch moves that are clustered together in time,
       *   moving the same direction. Only valid when currently responder (otherwise,
       *   it only represents the drag distance below the threshold).
       * - vx/vy: Velocity.
       */
      _initializeGestureState(gestureState) {
        gestureState.moveX = 0;
        gestureState.moveY = 0;
        gestureState.x0 = 0;
        gestureState.y0 = 0;
        gestureState.dx = 0;
        gestureState.dy = 0;
        gestureState.vx = 0;
        gestureState.vy = 0;
        gestureState.numberActiveTouches = 0;
        gestureState._accountsForMovesUpTo = 0;
      },
      /**
       * This is nuanced and is necessary. It is incorrect to continuously take all
       * active *and* recently moved touches, find the centroid, and track how that
       * result changes over time. Instead, we must take all recently moved
       * touches, and calculate how the centroid has changed just for those
       * recently moved touches, and append that change to an accumulator. This is
       * to (at least) handle the case where the user is moving three fingers, and
       * then one of the fingers stops but the other two continue.
       *
       * This is very different than taking all of the recently moved touches and
       * storing their centroid as `dx/dy`. For correctness, we must *accumulate
       * changes* in the centroid of recently moved touches.
       *
       * There is also some nuance with how we handle multiple moved touches in a
       * single event. With the way `ReactNativeEventEmitter` dispatches touches as
       * individual events, multiple touches generate two 'move' events, each of
       * them triggering `onResponderMove`. But with the way `PanResponder` works,
       * all of the gesture inference is performed on the first dispatch, since it
       * looks at all of the touches (even the ones for which there hasn't been a
       * native dispatch yet). Therefore, `PanResponder` does not call
       * `onResponderMove` passed the first dispatch. This diverges from the
       * typical responder callback pattern (without using `PanResponder`), but
       * avoids more dispatches than necessary.
       */
      _updateGestureStateOnMove(gestureState, touchHistory) {
        gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
        gestureState.moveX = currentCentroidXOfTouchesChangedAfter(touchHistory, gestureState._accountsForMovesUpTo);
        gestureState.moveY = currentCentroidYOfTouchesChangedAfter(touchHistory, gestureState._accountsForMovesUpTo);
        var movedAfter = gestureState._accountsForMovesUpTo;
        var prevX = previousCentroidXOfTouchesChangedAfter(touchHistory, movedAfter);
        var x = currentCentroidXOfTouchesChangedAfter(touchHistory, movedAfter);
        var prevY = previousCentroidYOfTouchesChangedAfter(touchHistory, movedAfter);
        var y = currentCentroidYOfTouchesChangedAfter(touchHistory, movedAfter);
        var nextDX = gestureState.dx + (x - prevX);
        var nextDY = gestureState.dy + (y - prevY);
        var dt = touchHistory.mostRecentTimeStamp - gestureState._accountsForMovesUpTo;
        gestureState.vx = (nextDX - gestureState.dx) / dt;
        gestureState.vy = (nextDY - gestureState.dy) / dt;
        gestureState.dx = nextDX;
        gestureState.dy = nextDY;
        gestureState._accountsForMovesUpTo = touchHistory.mostRecentTimeStamp;
      },
      /**
       * @param {object} config Enhanced versions of all of the responder callbacks
       * that provide not only the typical `ResponderSyntheticEvent`, but also the
       * `PanResponder` gesture state.  Simply replace the word `Responder` with
       * `PanResponder` in each of the typical `onResponder*` callbacks. For
       * example, the `config` object would look like:
       *
       *  - `onMoveShouldSetPanResponder: (e, gestureState) => {...}`
       *  - `onMoveShouldSetPanResponderCapture: (e, gestureState) => {...}`
       *  - `onStartShouldSetPanResponder: (e, gestureState) => {...}`
       *  - `onStartShouldSetPanResponderCapture: (e, gestureState) => {...}`
       *  - `onPanResponderReject: (e, gestureState) => {...}`
       *  - `onPanResponderGrant: (e, gestureState) => {...}`
       *  - `onPanResponderStart: (e, gestureState) => {...}`
       *  - `onPanResponderEnd: (e, gestureState) => {...}`
       *  - `onPanResponderRelease: (e, gestureState) => {...}`
       *  - `onPanResponderMove: (e, gestureState) => {...}`
       *  - `onPanResponderTerminate: (e, gestureState) => {...}`
       *  - `onPanResponderTerminationRequest: (e, gestureState) => {...}`
       *  - `onShouldBlockNativeResponder: (e, gestureState) => {...}`
       *
       *  In general, for events that have capture equivalents, we update the
       *  gestureState once in the capture phase and can use it in the bubble phase
       *  as well.
       *
       *  Be careful with onStartShould* callbacks. They only reflect updated
       *  `gestureState` for start/end events that bubble/capture to the Node.
       *  Once the node is the responder, you can rely on every start/end event
       *  being processed by the gesture and `gestureState` being updated
       *  accordingly. (numberActiveTouches) may not be totally accurate unless you
       *  are the responder.
       */
      create(config) {
        var interactionState = {
          handle: null,
          shouldCancelClick: false,
          timeout: null
        };
        var gestureState = {
          // Useful for debugging
          stateID: Math.random(),
          moveX: 0,
          moveY: 0,
          x0: 0,
          y0: 0,
          dx: 0,
          dy: 0,
          vx: 0,
          vy: 0,
          numberActiveTouches: 0,
          _accountsForMovesUpTo: 0
        };
        var panHandlers = {
          onStartShouldSetResponder(event) {
            return config.onStartShouldSetPanResponder == null ? false : config.onStartShouldSetPanResponder(event, gestureState);
          },
          onMoveShouldSetResponder(event) {
            return config.onMoveShouldSetPanResponder == null ? false : config.onMoveShouldSetPanResponder(event, gestureState);
          },
          onStartShouldSetResponderCapture(event) {
            if (event.nativeEvent.touches.length === 1) {
              PanResponder2._initializeGestureState(gestureState);
            }
            gestureState.numberActiveTouches = event.touchHistory.numberActiveTouches;
            return config.onStartShouldSetPanResponderCapture != null ? config.onStartShouldSetPanResponderCapture(event, gestureState) : false;
          },
          onMoveShouldSetResponderCapture(event) {
            var touchHistory = event.touchHistory;
            if (gestureState._accountsForMovesUpTo === touchHistory.mostRecentTimeStamp) {
              return false;
            }
            PanResponder2._updateGestureStateOnMove(gestureState, touchHistory);
            return config.onMoveShouldSetPanResponderCapture ? config.onMoveShouldSetPanResponderCapture(event, gestureState) : false;
          },
          onResponderGrant(event) {
            if (!interactionState.handle) {
              interactionState.handle = _InteractionManager.default.createInteractionHandle();
            }
            if (interactionState.timeout) {
              clearInteractionTimeout(interactionState);
            }
            interactionState.shouldCancelClick = true;
            gestureState.x0 = currentCentroidX(event.touchHistory);
            gestureState.y0 = currentCentroidY(event.touchHistory);
            gestureState.dx = 0;
            gestureState.dy = 0;
            if (config.onPanResponderGrant) {
              config.onPanResponderGrant(event, gestureState);
            }
            return config.onShouldBlockNativeResponder == null ? true : config.onShouldBlockNativeResponder(event, gestureState);
          },
          onResponderReject(event) {
            clearInteractionHandle(interactionState, config.onPanResponderReject, event, gestureState);
          },
          onResponderRelease(event) {
            clearInteractionHandle(interactionState, config.onPanResponderRelease, event, gestureState);
            setInteractionTimeout(interactionState);
            PanResponder2._initializeGestureState(gestureState);
          },
          onResponderStart(event) {
            var touchHistory = event.touchHistory;
            gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
            if (config.onPanResponderStart) {
              config.onPanResponderStart(event, gestureState);
            }
          },
          onResponderMove(event) {
            var touchHistory = event.touchHistory;
            if (gestureState._accountsForMovesUpTo === touchHistory.mostRecentTimeStamp) {
              return;
            }
            PanResponder2._updateGestureStateOnMove(gestureState, touchHistory);
            if (config.onPanResponderMove) {
              config.onPanResponderMove(event, gestureState);
            }
          },
          onResponderEnd(event) {
            var touchHistory = event.touchHistory;
            gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
            clearInteractionHandle(interactionState, config.onPanResponderEnd, event, gestureState);
          },
          onResponderTerminate(event) {
            clearInteractionHandle(interactionState, config.onPanResponderTerminate, event, gestureState);
            setInteractionTimeout(interactionState);
            PanResponder2._initializeGestureState(gestureState);
          },
          onResponderTerminationRequest(event) {
            return config.onPanResponderTerminationRequest == null ? true : config.onPanResponderTerminationRequest(event, gestureState);
          },
          // We do not want to trigger 'click' activated gestures or native behaviors
          // on any pan target that is under a mouse cursor when it is released.
          // Browsers will natively cancel 'click' events on a target if a non-mouse
          // active pointer moves.
          onClickCapture: /* @__PURE__ */ __name((event) => {
            if (interactionState.shouldCancelClick === true) {
              event.stopPropagation();
              event.preventDefault();
            }
          }, "onClickCapture")
        };
        return {
          panHandlers,
          getInteractionHandle() {
            return interactionState.handle;
          }
        };
      }
    };
    function clearInteractionHandle(interactionState, callback, event, gestureState) {
      if (interactionState.handle) {
        _InteractionManager.default.clearInteractionHandle(interactionState.handle);
        interactionState.handle = null;
      }
      if (callback) {
        callback(event, gestureState);
      }
    }
    __name(clearInteractionHandle, "clearInteractionHandle");
    function clearInteractionTimeout(interactionState) {
      clearTimeout(interactionState.timeout);
    }
    __name(clearInteractionTimeout, "clearInteractionTimeout");
    function setInteractionTimeout(interactionState) {
      interactionState.timeout = setTimeout(() => {
        interactionState.shouldCancelClick = false;
      }, 250);
    }
    __name(setInteractionTimeout, "setInteractionTimeout");
    var _default = exports2.default = PanResponder2;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/PanResponder/index.js
var require_PanResponder2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/PanResponder/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _PanResponder = _interopRequireDefault(require_PanResponder());
    var _default = exports2.default = _PanResponder.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Share/index.js
var require_Share = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Share/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _invariant = _interopRequireDefault(require_invariant());
    var Share = class {
      static {
        __name(this, "Share");
      }
      static share(content, options) {
        if (options === void 0) {
          options = {};
        }
        (0, _invariant.default)(typeof content === "object" && content !== null, "Content to share must be a valid object");
        (0, _invariant.default)(typeof content.url === "string" || typeof content.message === "string", "At least one of URL and message is required");
        (0, _invariant.default)(typeof options === "object" && options !== null, "Options must be a valid object");
        (0, _invariant.default)(!content.title || typeof content.title === "string", "Invalid title: title should be a string.");
        if (window.navigator.share !== void 0) {
          return window.navigator.share({
            title: content.title,
            text: content.message,
            url: content.url
          });
        } else {
          return Promise.reject(new Error("Share is not supported in this browser"));
        }
      }
      /**
       * The content was successfully shared.
       */
      static get sharedAction() {
        return "sharedAction";
      }
      /**
       * The dialog has been dismissed.
       * @platform ios
       */
      static get dismissedAction() {
        return "dismissedAction";
      }
    };
    var _default = exports2.default = Share;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Vibration/index.js
var require_Vibration = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Vibration/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var vibrate = /* @__PURE__ */ __name((pattern) => {
      if ("vibrate" in window.navigator) {
        window.navigator.vibrate(pattern);
      }
    }, "vibrate");
    var Vibration = {
      cancel() {
        vibrate(0);
      },
      vibrate(pattern) {
        if (pattern === void 0) {
          pattern = 400;
        }
        vibrate(pattern);
      }
    };
    var _default = exports2.default = Vibration;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/ActivityIndicator/index.js
var require_ActivityIndicator = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/ActivityIndicator/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var _excluded = ["animating", "color", "hidesWhenStopped", "size", "style"];
    var createSvgCircle = /* @__PURE__ */ __name((style) => /* @__PURE__ */ React24.createElement("circle", {
      cx: "16",
      cy: "16",
      fill: "none",
      r: "14",
      strokeWidth: "4",
      style
    }), "createSvgCircle");
    var ActivityIndicator = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var _props$animating = props.animating, animating = _props$animating === void 0 ? true : _props$animating, _props$color = props.color, color = _props$color === void 0 ? "#1976D2" : _props$color, _props$hidesWhenStopp = props.hidesWhenStopped, hidesWhenStopped = _props$hidesWhenStopp === void 0 ? true : _props$hidesWhenStopp, _props$size = props.size, size = _props$size === void 0 ? "small" : _props$size, style = props.style, other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var svg = /* @__PURE__ */ React24.createElement("svg", {
        height: "100%",
        viewBox: "0 0 32 32",
        width: "100%"
      }, createSvgCircle({
        stroke: color,
        opacity: 0.2
      }), createSvgCircle({
        stroke: color,
        strokeDasharray: 80,
        strokeDashoffset: 60
      }));
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, other, {
        "aria-valuemax": 1,
        "aria-valuemin": 0,
        ref: forwardedRef,
        role: "progressbar",
        style: [styles.container, style]
      }), /* @__PURE__ */ React24.createElement(_View.default, {
        children: svg,
        style: [typeof size === "number" ? {
          height: size,
          width: size
        } : indicatorSizes[size], styles.animation, !animating && styles.animationPause, !animating && hidesWhenStopped && styles.hidesWhenStopped]
      }));
    });
    ActivityIndicator.displayName = "ActivityIndicator";
    var styles = _StyleSheet.default.create({
      container: {
        alignItems: "center",
        justifyContent: "center"
      },
      hidesWhenStopped: {
        visibility: "hidden"
      },
      animation: {
        animationDuration: "0.75s",
        animationKeyframes: [{
          "0%": {
            transform: "rotate(0deg)"
          },
          "100%": {
            transform: "rotate(360deg)"
          }
        }],
        animationTimingFunction: "linear",
        animationIterationCount: "infinite"
      },
      animationPause: {
        animationPlayState: "paused"
      }
    });
    var indicatorSizes = _StyleSheet.default.create({
      small: {
        width: 20,
        height: 20
      },
      large: {
        width: 36,
        height: 36
      }
    });
    var _default = exports2.default = ActivityIndicator;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/usePressEvents/PressResponder.js
var require_PressResponder = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/usePressEvents/PressResponder.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var DELAY = "DELAY";
    var ERROR = "ERROR";
    var LONG_PRESS_DETECTED = "LONG_PRESS_DETECTED";
    var NOT_RESPONDER = "NOT_RESPONDER";
    var RESPONDER_ACTIVE_LONG_PRESS_START = "RESPONDER_ACTIVE_LONG_PRESS_START";
    var RESPONDER_ACTIVE_PRESS_START = "RESPONDER_ACTIVE_PRESS_START";
    var RESPONDER_INACTIVE_PRESS_START = "RESPONDER_INACTIVE_PRESS_START";
    var RESPONDER_GRANT = "RESPONDER_GRANT";
    var RESPONDER_RELEASE = "RESPONDER_RELEASE";
    var RESPONDER_TERMINATED = "RESPONDER_TERMINATED";
    var Transitions = Object.freeze({
      NOT_RESPONDER: {
        DELAY: ERROR,
        RESPONDER_GRANT: RESPONDER_INACTIVE_PRESS_START,
        RESPONDER_RELEASE: ERROR,
        RESPONDER_TERMINATED: ERROR,
        LONG_PRESS_DETECTED: ERROR
      },
      RESPONDER_INACTIVE_PRESS_START: {
        DELAY: RESPONDER_ACTIVE_PRESS_START,
        RESPONDER_GRANT: ERROR,
        RESPONDER_RELEASE: NOT_RESPONDER,
        RESPONDER_TERMINATED: NOT_RESPONDER,
        LONG_PRESS_DETECTED: ERROR
      },
      RESPONDER_ACTIVE_PRESS_START: {
        DELAY: ERROR,
        RESPONDER_GRANT: ERROR,
        RESPONDER_RELEASE: NOT_RESPONDER,
        RESPONDER_TERMINATED: NOT_RESPONDER,
        LONG_PRESS_DETECTED: RESPONDER_ACTIVE_LONG_PRESS_START
      },
      RESPONDER_ACTIVE_LONG_PRESS_START: {
        DELAY: ERROR,
        RESPONDER_GRANT: ERROR,
        RESPONDER_RELEASE: NOT_RESPONDER,
        RESPONDER_TERMINATED: NOT_RESPONDER,
        LONG_PRESS_DETECTED: RESPONDER_ACTIVE_LONG_PRESS_START
      },
      ERROR: {
        DELAY: NOT_RESPONDER,
        RESPONDER_GRANT: RESPONDER_INACTIVE_PRESS_START,
        RESPONDER_RELEASE: NOT_RESPONDER,
        RESPONDER_TERMINATED: NOT_RESPONDER,
        LONG_PRESS_DETECTED: NOT_RESPONDER
      }
    });
    var getElementRole = /* @__PURE__ */ __name((element) => element.getAttribute("role"), "getElementRole");
    var getElementType = /* @__PURE__ */ __name((element) => element.tagName.toLowerCase(), "getElementType");
    var isActiveSignal = /* @__PURE__ */ __name((signal) => signal === RESPONDER_ACTIVE_PRESS_START || signal === RESPONDER_ACTIVE_LONG_PRESS_START, "isActiveSignal");
    var isButtonRole = /* @__PURE__ */ __name((element) => getElementRole(element) === "button", "isButtonRole");
    var isPressStartSignal = /* @__PURE__ */ __name((signal) => signal === RESPONDER_INACTIVE_PRESS_START || signal === RESPONDER_ACTIVE_PRESS_START || signal === RESPONDER_ACTIVE_LONG_PRESS_START, "isPressStartSignal");
    var isTerminalSignal = /* @__PURE__ */ __name((signal) => signal === RESPONDER_TERMINATED || signal === RESPONDER_RELEASE, "isTerminalSignal");
    var isValidKeyPress = /* @__PURE__ */ __name((event) => {
      var key = event.key, target = event.target;
      var isSpacebar = key === " " || key === "Spacebar";
      var isButtonish = getElementType(target) === "button" || isButtonRole(target);
      return key === "Enter" || isSpacebar && isButtonish;
    }, "isValidKeyPress");
    var DEFAULT_LONG_PRESS_DELAY_MS = 450;
    var DEFAULT_PRESS_DELAY_MS = 50;
    var PressResponder = class {
      static {
        __name(this, "PressResponder");
      }
      constructor(config) {
        this._eventHandlers = null;
        this._isPointerTouch = false;
        this._longPressDelayTimeout = null;
        this._longPressDispatched = false;
        this._pressDelayTimeout = null;
        this._pressOutDelayTimeout = null;
        this._touchState = NOT_RESPONDER;
        this._responderElement = null;
        this.configure(config);
      }
      configure(config) {
        this._config = config;
      }
      /**
       * Resets any pending timers. This should be called on unmount.
       */
      reset() {
        this._cancelLongPressDelayTimeout();
        this._cancelPressDelayTimeout();
        this._cancelPressOutDelayTimeout();
      }
      /**
       * Returns a set of props to spread into the interactive element.
       */
      getEventHandlers() {
        if (this._eventHandlers == null) {
          this._eventHandlers = this._createEventHandlers();
        }
        return this._eventHandlers;
      }
      _createEventHandlers() {
        var start = /* @__PURE__ */ __name((event, shouldDelay) => {
          event.persist();
          this._cancelPressOutDelayTimeout();
          this._longPressDispatched = false;
          this._selectionTerminated = false;
          this._touchState = NOT_RESPONDER;
          this._isPointerTouch = event.nativeEvent.type === "touchstart";
          this._receiveSignal(RESPONDER_GRANT, event);
          var delayPressStart = normalizeDelay(this._config.delayPressStart, 0, DEFAULT_PRESS_DELAY_MS);
          if (shouldDelay !== false && delayPressStart > 0) {
            this._pressDelayTimeout = setTimeout(() => {
              this._receiveSignal(DELAY, event);
            }, delayPressStart);
          } else {
            this._receiveSignal(DELAY, event);
          }
          var delayLongPress = normalizeDelay(this._config.delayLongPress, 10, DEFAULT_LONG_PRESS_DELAY_MS);
          this._longPressDelayTimeout = setTimeout(() => {
            this._handleLongPress(event);
          }, delayLongPress + delayPressStart);
        }, "start");
        var end = /* @__PURE__ */ __name((event) => {
          this._receiveSignal(RESPONDER_RELEASE, event);
        }, "end");
        var keyupHandler = /* @__PURE__ */ __name((event) => {
          var onPress = this._config.onPress;
          var target = event.target;
          if (this._touchState !== NOT_RESPONDER && isValidKeyPress(event)) {
            end(event);
            document.removeEventListener("keyup", keyupHandler);
            var role = target.getAttribute("role");
            var elementType = getElementType(target);
            var isNativeInteractiveElement = role === "link" || elementType === "a" || elementType === "button" || elementType === "input" || elementType === "select" || elementType === "textarea";
            var isActiveElement = this._responderElement === target;
            if (onPress != null && !isNativeInteractiveElement && isActiveElement) {
              onPress(event);
            }
            this._responderElement = null;
          }
        }, "keyupHandler");
        return {
          onStartShouldSetResponder: /* @__PURE__ */ __name((event) => {
            var disabled = this._config.disabled;
            if (disabled && isButtonRole(event.currentTarget)) {
              event.stopPropagation();
            }
            if (disabled == null) {
              return true;
            }
            return !disabled;
          }, "onStartShouldSetResponder"),
          onKeyDown: /* @__PURE__ */ __name((event) => {
            var disabled = this._config.disabled;
            var key = event.key, target = event.target;
            if (!disabled && isValidKeyPress(event)) {
              if (this._touchState === NOT_RESPONDER) {
                start(event, false);
                this._responderElement = target;
                document.addEventListener("keyup", keyupHandler);
              }
              var isSpacebarKey = key === " " || key === "Spacebar";
              var role = getElementRole(target);
              var isButtonLikeRole = role === "button" || role === "menuitem";
              if (isSpacebarKey && isButtonLikeRole && getElementType(target) !== "button") {
                event.preventDefault();
              }
              event.stopPropagation();
            }
          }, "onKeyDown"),
          onResponderGrant: /* @__PURE__ */ __name((event) => start(event), "onResponderGrant"),
          onResponderMove: /* @__PURE__ */ __name((event) => {
            if (this._config.onPressMove != null) {
              this._config.onPressMove(event);
            }
            var touch = getTouchFromResponderEvent(event);
            if (this._touchActivatePosition != null) {
              var deltaX = this._touchActivatePosition.pageX - touch.pageX;
              var deltaY = this._touchActivatePosition.pageY - touch.pageY;
              if (Math.hypot(deltaX, deltaY) > 10) {
                this._cancelLongPressDelayTimeout();
              }
            }
          }, "onResponderMove"),
          onResponderRelease: /* @__PURE__ */ __name((event) => end(event), "onResponderRelease"),
          onResponderTerminate: /* @__PURE__ */ __name((event) => {
            if (event.nativeEvent.type === "selectionchange") {
              this._selectionTerminated = true;
            }
            this._receiveSignal(RESPONDER_TERMINATED, event);
          }, "onResponderTerminate"),
          onResponderTerminationRequest: /* @__PURE__ */ __name((event) => {
            var _this$_config = this._config, cancelable = _this$_config.cancelable, disabled = _this$_config.disabled, onLongPress = _this$_config.onLongPress;
            if (!disabled && onLongPress != null && this._isPointerTouch && event.nativeEvent.type === "contextmenu") {
              return false;
            }
            if (cancelable == null) {
              return true;
            }
            return cancelable;
          }, "onResponderTerminationRequest"),
          // NOTE: this diverges from react-native in 3 significant ways:
          // * The `onPress` callback is not connected to the responder system (the native
          //  `click` event must be used but is dispatched in many scenarios where no pointers
          //   are on the screen.) Therefore, it's possible for `onPress` to be called without
          //   `onPress{Start,End}` being called first.
          // * The `onPress` callback is only be called on the first ancestor of the native
          //   `click` target that is using the PressResponder.
          // * The event's `nativeEvent` is a `MouseEvent` not a `TouchEvent`.
          onClick: /* @__PURE__ */ __name((event) => {
            var _this$_config2 = this._config, disabled = _this$_config2.disabled, onPress = _this$_config2.onPress;
            if (!disabled) {
              event.stopPropagation();
              if (this._longPressDispatched || this._selectionTerminated) {
                event.preventDefault();
              } else if (onPress != null && event.altKey === false) {
                onPress(event);
              }
            } else {
              if (isButtonRole(event.currentTarget)) {
                event.stopPropagation();
              }
            }
          }, "onClick"),
          // If `onLongPress` is provided and a touch pointer is being used, prevent the
          // default context menu from opening.
          onContextMenu: /* @__PURE__ */ __name((event) => {
            var _this$_config3 = this._config, disabled = _this$_config3.disabled, onLongPress = _this$_config3.onLongPress;
            if (!disabled) {
              if (onLongPress != null && this._isPointerTouch && !event.defaultPrevented) {
                event.preventDefault();
                event.stopPropagation();
              }
            } else {
              if (isButtonRole(event.currentTarget)) {
                event.stopPropagation();
              }
            }
          }, "onContextMenu")
        };
      }
      /**
       * Receives a state machine signal, performs side effects of the transition
       * and stores the new state. Validates the transition as well.
       */
      _receiveSignal(signal, event) {
        var prevState = this._touchState;
        var nextState = null;
        if (Transitions[prevState] != null) {
          nextState = Transitions[prevState][signal];
        }
        if (this._touchState === NOT_RESPONDER && signal === RESPONDER_RELEASE) {
          return;
        }
        if (nextState == null || nextState === ERROR) {
          console.error("PressResponder: Invalid signal " + signal + " for state " + prevState + " on responder");
        } else if (prevState !== nextState) {
          this._performTransitionSideEffects(prevState, nextState, signal, event);
          this._touchState = nextState;
        }
      }
      /**
       * Performs a transition between touchable states and identify any activations
       * or deactivations (and callback invocations).
       */
      _performTransitionSideEffects(prevState, nextState, signal, event) {
        if (isTerminalSignal(signal)) {
          setTimeout(() => {
            this._isPointerTouch = false;
          }, 0);
          this._touchActivatePosition = null;
          this._cancelLongPressDelayTimeout();
        }
        if (isPressStartSignal(prevState) && signal === LONG_PRESS_DETECTED) {
          var onLongPress = this._config.onLongPress;
          if (onLongPress != null && event.nativeEvent.key == null) {
            onLongPress(event);
            this._longPressDispatched = true;
          }
        }
        var isPrevActive = isActiveSignal(prevState);
        var isNextActive = isActiveSignal(nextState);
        if (!isPrevActive && isNextActive) {
          this._activate(event);
        } else if (isPrevActive && !isNextActive) {
          this._deactivate(event);
        }
        if (isPressStartSignal(prevState) && signal === RESPONDER_RELEASE) {
          var _this$_config4 = this._config, _onLongPress = _this$_config4.onLongPress, onPress = _this$_config4.onPress;
          if (onPress != null) {
            var isPressCanceledByLongPress = _onLongPress != null && prevState === RESPONDER_ACTIVE_LONG_PRESS_START;
            if (!isPressCanceledByLongPress) {
              if (!isNextActive && !isPrevActive) {
                this._activate(event);
                this._deactivate(event);
              }
            }
          }
        }
        this._cancelPressDelayTimeout();
      }
      _activate(event) {
        var _this$_config5 = this._config, onPressChange = _this$_config5.onPressChange, onPressStart = _this$_config5.onPressStart;
        var touch = getTouchFromResponderEvent(event);
        this._touchActivatePosition = {
          pageX: touch.pageX,
          pageY: touch.pageY
        };
        if (onPressStart != null) {
          onPressStart(event);
        }
        if (onPressChange != null) {
          onPressChange(true);
        }
      }
      _deactivate(event) {
        var _this$_config6 = this._config, onPressChange = _this$_config6.onPressChange, onPressEnd = _this$_config6.onPressEnd;
        function end() {
          if (onPressEnd != null) {
            onPressEnd(event);
          }
          if (onPressChange != null) {
            onPressChange(false);
          }
        }
        __name(end, "end");
        var delayPressEnd = normalizeDelay(this._config.delayPressEnd);
        if (delayPressEnd > 0) {
          this._pressOutDelayTimeout = setTimeout(() => {
            end();
          }, delayPressEnd);
        } else {
          end();
        }
      }
      _handleLongPress(event) {
        if (this._touchState === RESPONDER_ACTIVE_PRESS_START || this._touchState === RESPONDER_ACTIVE_LONG_PRESS_START) {
          this._receiveSignal(LONG_PRESS_DETECTED, event);
        }
      }
      _cancelLongPressDelayTimeout() {
        if (this._longPressDelayTimeout != null) {
          clearTimeout(this._longPressDelayTimeout);
          this._longPressDelayTimeout = null;
        }
      }
      _cancelPressDelayTimeout() {
        if (this._pressDelayTimeout != null) {
          clearTimeout(this._pressDelayTimeout);
          this._pressDelayTimeout = null;
        }
      }
      _cancelPressOutDelayTimeout() {
        if (this._pressOutDelayTimeout != null) {
          clearTimeout(this._pressOutDelayTimeout);
          this._pressOutDelayTimeout = null;
        }
      }
    };
    exports2.default = PressResponder;
    function normalizeDelay(delay, min, fallback) {
      if (min === void 0) {
        min = 0;
      }
      if (fallback === void 0) {
        fallback = 0;
      }
      return Math.max(min, delay !== null && delay !== void 0 ? delay : fallback);
    }
    __name(normalizeDelay, "normalizeDelay");
    function getTouchFromResponderEvent(event) {
      var _event$nativeEvent = event.nativeEvent, changedTouches = _event$nativeEvent.changedTouches, touches = _event$nativeEvent.touches;
      if (touches != null && touches.length > 0) {
        return touches[0];
      }
      if (changedTouches != null && changedTouches.length > 0) {
        return changedTouches[0];
      }
      return event.nativeEvent;
    }
    __name(getTouchFromResponderEvent, "getTouchFromResponderEvent");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/usePressEvents/index.js
var require_usePressEvents = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/usePressEvents/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = usePressEvents;
    var _PressResponder = _interopRequireDefault(require_PressResponder());
    var _react = require("react");
    function usePressEvents(hostRef, config) {
      var pressResponderRef = (0, _react.useRef)(null);
      if (pressResponderRef.current == null) {
        pressResponderRef.current = new _PressResponder.default(config);
      }
      var pressResponder = pressResponderRef.current;
      (0, _react.useEffect)(() => {
        pressResponder.configure(config);
      }, [config, pressResponder]);
      (0, _react.useEffect)(() => {
        return () => {
          pressResponder.reset();
        };
      }, [pressResponder]);
      (0, _react.useDebugValue)(config);
      return pressResponder.getEventHandlers();
    }
    __name(usePressEvents, "usePressEvents");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/TouchableOpacity/index.js
var require_TouchableOpacity = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/TouchableOpacity/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _react = _interopRequireWildcard(require("react"));
    var React24 = _react;
    var _useMergeRefs = _interopRequireDefault(require_useMergeRefs());
    var _usePressEvents = _interopRequireDefault(require_usePressEvents());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var _excluded = ["activeOpacity", "delayPressIn", "delayPressOut", "delayLongPress", "disabled", "focusable", "onLongPress", "onPress", "onPressIn", "onPressOut", "rejectResponderTermination", "style"];
    function TouchableOpacity(props, forwardedRef) {
      var activeOpacity = props.activeOpacity, delayPressIn = props.delayPressIn, delayPressOut = props.delayPressOut, delayLongPress = props.delayLongPress, disabled = props.disabled, focusable = props.focusable, onLongPress = props.onLongPress, onPress = props.onPress, onPressIn = props.onPressIn, onPressOut = props.onPressOut, rejectResponderTermination = props.rejectResponderTermination, style = props.style, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var hostRef = (0, _react.useRef)(null);
      var setRef2 = (0, _useMergeRefs.default)(forwardedRef, hostRef);
      var _useState = (0, _react.useState)("0s"), duration = _useState[0], setDuration = _useState[1];
      var _useState2 = (0, _react.useState)(null), opacityOverride = _useState2[0], setOpacityOverride = _useState2[1];
      var setOpacityTo = (0, _react.useCallback)((value, duration2) => {
        setOpacityOverride(value);
        setDuration(duration2 ? duration2 / 1e3 + "s" : "0s");
      }, [setOpacityOverride, setDuration]);
      var setOpacityActive = (0, _react.useCallback)((duration2) => {
        setOpacityTo(activeOpacity !== null && activeOpacity !== void 0 ? activeOpacity : 0.2, duration2);
      }, [activeOpacity, setOpacityTo]);
      var setOpacityInactive = (0, _react.useCallback)((duration2) => {
        setOpacityTo(null, duration2);
      }, [setOpacityTo]);
      var pressConfig = (0, _react.useMemo)(() => ({
        cancelable: !rejectResponderTermination,
        disabled,
        delayLongPress,
        delayPressStart: delayPressIn,
        delayPressEnd: delayPressOut,
        onLongPress,
        onPress,
        onPressStart(event) {
          var isGrant = event.dispatchConfig != null ? event.dispatchConfig.registrationName === "onResponderGrant" : event.type === "keydown";
          setOpacityActive(isGrant ? 0 : 150);
          if (onPressIn != null) {
            onPressIn(event);
          }
        },
        onPressEnd(event) {
          setOpacityInactive(250);
          if (onPressOut != null) {
            onPressOut(event);
          }
        }
      }), [delayLongPress, delayPressIn, delayPressOut, disabled, onLongPress, onPress, onPressIn, onPressOut, rejectResponderTermination, setOpacityActive, setOpacityInactive]);
      var pressEventHandlers = (0, _usePressEvents.default)(hostRef, pressConfig);
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, rest, pressEventHandlers, {
        accessibilityDisabled: disabled,
        focusable: !disabled && focusable !== false,
        pointerEvents: disabled ? "box-none" : void 0,
        ref: setRef2,
        style: [styles.root, !disabled && styles.actionable, style, opacityOverride != null && {
          opacity: opacityOverride
        }, {
          transitionDuration: duration
        }]
      }));
    }
    __name(TouchableOpacity, "TouchableOpacity");
    var styles = _StyleSheet.default.create({
      root: {
        transitionProperty: "opacity",
        transitionDuration: "0.15s",
        userSelect: "none"
      },
      actionable: {
        cursor: "pointer",
        touchAction: "manipulation"
      }
    });
    var MemoedTouchableOpacity = /* @__PURE__ */ React24.memo(/* @__PURE__ */ React24.forwardRef(TouchableOpacity));
    MemoedTouchableOpacity.displayName = "TouchableOpacity";
    var _default = exports2.default = MemoedTouchableOpacity;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Button/index.js
var require_Button = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Button/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var React24 = _interopRequireWildcard(require("react"));
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _TouchableOpacity = _interopRequireDefault(require_TouchableOpacity());
    var _Text = _interopRequireDefault(require_Text());
    var Button = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var accessibilityLabel = props.accessibilityLabel, color = props.color, disabled = props.disabled, onPress = props.onPress, testID = props.testID, title = props.title;
      return /* @__PURE__ */ React24.createElement(_TouchableOpacity.default, {
        accessibilityLabel,
        accessibilityRole: "button",
        disabled,
        focusable: !disabled,
        onPress,
        ref: forwardedRef,
        style: [styles.button, color && {
          backgroundColor: color
        }, disabled && styles.buttonDisabled],
        testID
      }, /* @__PURE__ */ React24.createElement(_Text.default, {
        style: [styles.text, disabled && styles.textDisabled]
      }, title));
    });
    Button.displayName = "Button";
    var styles = _StyleSheet.default.create({
      button: {
        backgroundColor: "#2196F3",
        borderRadius: 2
      },
      text: {
        color: "#fff",
        fontWeight: "500",
        padding: 8,
        textAlign: "center",
        textTransform: "uppercase"
      },
      buttonDisabled: {
        backgroundColor: "#dfdfdf"
      },
      textDisabled: {
        color: "#a1a1a1"
      }
    });
    var _default = exports2.default = Button;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/CheckBox/index.js
var require_CheckBox = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/CheckBox/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _createElement = _interopRequireDefault(require_createElement());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var _excluded = ["aria-readonly", "color", "disabled", "onChange", "onValueChange", "readOnly", "style", "value"];
    var CheckBox = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var ariaReadOnly = props["aria-readonly"], color = props.color, disabled = props.disabled, onChange = props.onChange, onValueChange = props.onValueChange, readOnly = props.readOnly, style = props.style, value = props.value, other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      function handleChange(event) {
        var value2 = event.nativeEvent.target.checked;
        event.nativeEvent.value = value2;
        onChange && onChange(event);
        onValueChange && onValueChange(value2);
      }
      __name(handleChange, "handleChange");
      var fakeControl = /* @__PURE__ */ React24.createElement(_View.default, {
        style: [
          styles.fakeControl,
          value && styles.fakeControlChecked,
          // custom color
          value && color && {
            backgroundColor: color,
            borderColor: color
          },
          disabled && styles.fakeControlDisabled,
          value && disabled && styles.fakeControlCheckedAndDisabled
        ]
      });
      var nativeControl = (0, _createElement.default)("input", {
        checked: value,
        disabled,
        onChange: handleChange,
        readOnly: readOnly === true || ariaReadOnly === true || other.accessibilityReadOnly === true,
        ref: forwardedRef,
        style: [styles.nativeControl, styles.cursorInherit],
        type: "checkbox"
      });
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, other, {
        "aria-disabled": disabled,
        "aria-readonly": ariaReadOnly,
        style: [styles.root, style, disabled && styles.cursorDefault]
      }), fakeControl, nativeControl);
    });
    CheckBox.displayName = "CheckBox";
    var styles = _StyleSheet.default.create({
      root: {
        cursor: "pointer",
        height: 16,
        userSelect: "none",
        width: 16
      },
      cursorDefault: {
        cursor: "default"
      },
      cursorInherit: {
        cursor: "inherit"
      },
      fakeControl: {
        alignItems: "center",
        backgroundColor: "#fff",
        borderColor: "#657786",
        borderRadius: 2,
        borderStyle: "solid",
        borderWidth: 2,
        height: "100%",
        justifyContent: "center",
        width: "100%"
      },
      fakeControlChecked: {
        backgroundColor: "#009688",
        backgroundImage: 'url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgdmVyc2lvbj0iMS4xIgogICB2aWV3Qm94PSIwIDAgMSAxIgogICBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWluWU1pbiBtZWV0Ij4KICA8cGF0aAogICAgIGQ9Ik0gMC4wNDAzODA1OSwwLjYyNjc3NjcgMC4xNDY0NDY2MSwwLjUyMDcxMDY4IDAuNDI5Mjg5MzIsMC44MDM1NTMzOSAwLjMyMzIyMzMsMC45MDk2MTk0MSB6IE0gMC4yMTcxNTcyOSwwLjgwMzU1MzM5IDAuODUzNTUzMzksMC4xNjcxNTcyOSAwLjk1OTYxOTQxLDAuMjczMjIzMyAwLjMyMzIyMzMsMC45MDk2MTk0MSB6IgogICAgIGlkPSJyZWN0Mzc4MCIKICAgICBzdHlsZT0iZmlsbDojZmZmZmZmO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lIiAvPgo8L3N2Zz4K")',
        backgroundRepeat: "no-repeat",
        borderColor: "#009688"
      },
      fakeControlDisabled: {
        borderColor: "#CCD6DD"
      },
      fakeControlCheckedAndDisabled: {
        backgroundColor: "#AAB8C2",
        borderColor: "#AAB8C2"
      },
      nativeControl: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, _StyleSheet.default.absoluteFillObject), {}, {
        height: "100%",
        margin: 0,
        appearance: "none",
        padding: 0,
        width: "100%"
      })
    });
    var _default = exports2.default = CheckBox;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/ImageBackground/index.js
var require_ImageBackground = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/ImageBackground/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _react = _interopRequireWildcard(require("react"));
    var React24 = _react;
    var _Image = _interopRequireDefault(require_Image());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var _excluded = ["children", "style", "imageStyle", "imageRef"];
    var emptyObject = {};
    var ImageBackground = /* @__PURE__ */ (0, _react.forwardRef)((props, forwardedRef) => {
      var children = props.children, _props$style = props.style, style = _props$style === void 0 ? emptyObject : _props$style, imageStyle = props.imageStyle, imageRef = props.imageRef, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var _StyleSheet$flatten = _StyleSheet.default.flatten(style), height = _StyleSheet$flatten.height, width = _StyleSheet$flatten.width;
      return /* @__PURE__ */ React24.createElement(_View.default, {
        ref: forwardedRef,
        style
      }, /* @__PURE__ */ React24.createElement(_Image.default, (0, _extends2.default)({}, rest, {
        ref: imageRef,
        style: [{
          // Temporary Workaround:
          // Current (imperfect yet) implementation of <Image> overwrites width and height styles
          // (which is not quite correct), and these styles conflict with explicitly set styles
          // of <ImageBackground> and with our internal layout model here.
          // So, we have to proxy/reapply these styles explicitly for actual <Image> component.
          // This workaround should be removed after implementing proper support of
          // intrinsic content size of the <Image>.
          width,
          height,
          zIndex: -1
        }, _StyleSheet.default.absoluteFill, imageStyle]
      })), children);
    });
    ImageBackground.displayName = "ImageBackground";
    var _default = exports2.default = ImageBackground;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/KeyboardAvoidingView/index.js
var require_KeyboardAvoidingView = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/KeyboardAvoidingView/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _View = _interopRequireDefault(require_View());
    var _excluded = ["behavior", "contentContainerStyle", "keyboardVerticalOffset"];
    var KeyboardAvoidingView = class extends React24.Component {
      static {
        __name(this, "KeyboardAvoidingView");
      }
      constructor() {
        super(...arguments);
        this.frame = null;
        this.onLayout = (event) => {
          this.frame = event.nativeEvent.layout;
        };
      }
      relativeKeyboardHeight(keyboardFrame) {
        var frame = this.frame;
        if (!frame || !keyboardFrame) {
          return 0;
        }
        var keyboardY = keyboardFrame.screenY - (this.props.keyboardVerticalOffset || 0);
        return Math.max(frame.y + frame.height - keyboardY, 0);
      }
      onKeyboardChange(event) {
      }
      render() {
        var _this$props = this.props, behavior = _this$props.behavior, contentContainerStyle = _this$props.contentContainerStyle, keyboardVerticalOffset = _this$props.keyboardVerticalOffset, rest = (0, _objectWithoutPropertiesLoose2.default)(_this$props, _excluded);
        return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({
          onLayout: this.onLayout
        }, rest));
      }
    };
    var _default = exports2.default = KeyboardAvoidingView;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Modal/ModalPortal.js
var require_ModalPortal = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Modal/ModalPortal.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var React24 = _interopRequireWildcard(require("react"));
    var _reactDom = require("react-dom");
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    function ModalPortal(props) {
      var children = props.children;
      var elementRef = React24.useRef(null);
      if (_canUseDom.default && !elementRef.current) {
        var element = document.createElement("div");
        if (element && document.body) {
          document.body.appendChild(element);
          elementRef.current = element;
        }
      }
      React24.useEffect(() => {
        if (_canUseDom.default) {
          return () => {
            if (document.body && elementRef.current) {
              document.body.removeChild(elementRef.current);
              elementRef.current = null;
            }
          };
        }
      }, []);
      return elementRef.current && _canUseDom.default ? /* @__PURE__ */ (0, _reactDom.createPortal)(children, elementRef.current) : null;
    }
    __name(ModalPortal, "ModalPortal");
    var _default = exports2.default = ModalPortal;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Modal/ModalAnimation.js
var require_ModalAnimation = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Modal/ModalAnimation.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var React24 = _interopRequireWildcard(require("react"));
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _createElement = _interopRequireDefault(require_createElement());
    var ANIMATION_DURATION = 250;
    function getAnimationStyle(animationType, visible) {
      if (animationType === "slide") {
        return visible ? animatedSlideInStyles : animatedSlideOutStyles;
      }
      if (animationType === "fade") {
        return visible ? animatedFadeInStyles : animatedFadeOutStyles;
      }
      return visible ? styles.container : styles.hidden;
    }
    __name(getAnimationStyle, "getAnimationStyle");
    function ModalAnimation(props) {
      var animationType = props.animationType, children = props.children, onDismiss = props.onDismiss, onShow = props.onShow, visible = props.visible;
      var _React$useState = React24.useState(false), isRendering = _React$useState[0], setIsRendering = _React$useState[1];
      var wasVisible = React24.useRef(false);
      var wasRendering = React24.useRef(false);
      var isAnimated = animationType && animationType !== "none";
      var animationEndCallback = React24.useCallback((e) => {
        if (e && e.currentTarget !== e.target) {
          return;
        }
        if (visible) {
          if (onShow) {
            onShow();
          }
        } else {
          setIsRendering(false);
        }
      }, [onShow, visible]);
      React24.useEffect(() => {
        if (wasRendering.current && !isRendering && onDismiss) {
          onDismiss();
        }
        wasRendering.current = isRendering;
      }, [isRendering, onDismiss]);
      React24.useEffect(() => {
        if (visible) {
          setIsRendering(true);
        }
        if (visible !== wasVisible.current && !isAnimated) {
          animationEndCallback();
        }
        wasVisible.current = visible;
      }, [isAnimated, visible, animationEndCallback]);
      return isRendering || visible ? (0, _createElement.default)("div", {
        style: isRendering ? getAnimationStyle(animationType, visible) : styles.hidden,
        onAnimationEnd: animationEndCallback,
        children
      }) : null;
    }
    __name(ModalAnimation, "ModalAnimation");
    var styles = _StyleSheet.default.create({
      container: {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 9999
      },
      animatedIn: {
        animationDuration: ANIMATION_DURATION + "ms",
        animationTimingFunction: "cubic-bezier(0.215, 0.61, 0.355, 1)"
      },
      animatedOut: {
        pointerEvents: "none",
        animationDuration: ANIMATION_DURATION + "ms",
        animationTimingFunction: "cubic-bezier(0.47, 0, 0.745, 0.715)"
      },
      fadeIn: {
        opacity: 1,
        animationKeyframes: {
          "0%": {
            opacity: 0
          },
          "100%": {
            opacity: 1
          }
        }
      },
      fadeOut: {
        opacity: 0,
        animationKeyframes: {
          "0%": {
            opacity: 1
          },
          "100%": {
            opacity: 0
          }
        }
      },
      slideIn: {
        transform: "translateY(0%)",
        animationKeyframes: {
          "0%": {
            transform: "translateY(100%)"
          },
          "100%": {
            transform: "translateY(0%)"
          }
        }
      },
      slideOut: {
        transform: "translateY(100%)",
        animationKeyframes: {
          "0%": {
            transform: "translateY(0%)"
          },
          "100%": {
            transform: "translateY(100%)"
          }
        }
      },
      hidden: {
        opacity: 0
      }
    });
    var animatedSlideInStyles = [styles.container, styles.animatedIn, styles.slideIn];
    var animatedSlideOutStyles = [styles.container, styles.animatedOut, styles.slideOut];
    var animatedFadeInStyles = [styles.container, styles.animatedIn, styles.fadeIn];
    var animatedFadeOutStyles = [styles.container, styles.animatedOut, styles.fadeOut];
    var _default = exports2.default = ModalAnimation;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Modal/ModalContent.js
var require_ModalContent = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Modal/ModalContent.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _View = _interopRequireDefault(require_View());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var _excluded = ["active", "children", "onRequestClose", "transparent"];
    var ModalContent = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var active = props.active, children = props.children, onRequestClose = props.onRequestClose, transparent = props.transparent, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      React24.useEffect(() => {
        if (_canUseDom.default) {
          var closeOnEscape = /* @__PURE__ */ __name((e) => {
            if (active && e.key === "Escape") {
              e.stopPropagation();
              if (onRequestClose) {
                onRequestClose();
              }
            }
          }, "closeOnEscape");
          document.addEventListener("keyup", closeOnEscape, false);
          return () => document.removeEventListener("keyup", closeOnEscape, false);
        }
      }, [active, onRequestClose]);
      var style = React24.useMemo(() => {
        return [styles.modal, transparent ? styles.modalTransparent : styles.modalOpaque];
      }, [transparent]);
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, rest, {
        "aria-modal": true,
        ref: forwardedRef,
        role: active ? "dialog" : null,
        style
      }), /* @__PURE__ */ React24.createElement(_View.default, {
        style: styles.container
      }, children));
    });
    var styles = _StyleSheet.default.create({
      modal: {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      modalTransparent: {
        backgroundColor: "transparent"
      },
      modalOpaque: {
        backgroundColor: "white"
      },
      container: {
        top: 0,
        flex: 1
      }
    });
    var _default = exports2.default = ModalContent;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Modal/ModalFocusTrap.js
var require_ModalFocusTrap = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Modal/ModalFocusTrap.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var React24 = _interopRequireWildcard(require("react"));
    var _View = _interopRequireDefault(require_View());
    var _createElement = _interopRequireDefault(require_createElement());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _UIManager = _interopRequireDefault(require_UIManager());
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var FocusBracket = /* @__PURE__ */ __name(() => {
      return (0, _createElement.default)("div", {
        role: "none",
        tabIndex: 0,
        style: styles.focusBracket
      });
    }, "FocusBracket");
    function attemptFocus(element) {
      if (!_canUseDom.default) {
        return false;
      }
      try {
        element.focus();
      } catch (e) {
      }
      return document.activeElement === element;
    }
    __name(attemptFocus, "attemptFocus");
    function focusFirstDescendant(element) {
      for (var i = 0; i < element.childNodes.length; i++) {
        var child = element.childNodes[i];
        if (attemptFocus(child) || focusFirstDescendant(child)) {
          return true;
        }
      }
      return false;
    }
    __name(focusFirstDescendant, "focusFirstDescendant");
    function focusLastDescendant(element) {
      for (var i = element.childNodes.length - 1; i >= 0; i--) {
        var child = element.childNodes[i];
        if (attemptFocus(child) || focusLastDescendant(child)) {
          return true;
        }
      }
      return false;
    }
    __name(focusLastDescendant, "focusLastDescendant");
    var ModalFocusTrap = /* @__PURE__ */ __name((_ref) => {
      var active = _ref.active, children = _ref.children;
      var trapElementRef = React24.useRef();
      var focusRef = React24.useRef({
        trapFocusInProgress: false,
        lastFocusedElement: null
      });
      React24.useEffect(() => {
        if (_canUseDom.default) {
          var trapFocus = /* @__PURE__ */ __name(() => {
            if (trapElementRef.current == null || focusRef.current.trapFocusInProgress || !active) {
              return;
            }
            try {
              focusRef.current.trapFocusInProgress = true;
              if (document.activeElement instanceof Node && !trapElementRef.current.contains(document.activeElement)) {
                var hasFocused = focusFirstDescendant(trapElementRef.current);
                if (focusRef.current.lastFocusedElement === document.activeElement) {
                  hasFocused = focusLastDescendant(trapElementRef.current);
                }
                if (!hasFocused && trapElementRef.current != null && document.activeElement) {
                  _UIManager.default.focus(trapElementRef.current);
                }
              }
            } finally {
              focusRef.current.trapFocusInProgress = false;
            }
            focusRef.current.lastFocusedElement = document.activeElement;
          }, "trapFocus");
          trapFocus();
          document.addEventListener("focus", trapFocus, true);
          return () => document.removeEventListener("focus", trapFocus, true);
        }
      }, [active]);
      React24.useEffect(function() {
        if (_canUseDom.default) {
          var lastFocusedElementOutsideTrap = document.activeElement;
          return function() {
            if (lastFocusedElementOutsideTrap && document.contains(lastFocusedElementOutsideTrap)) {
              _UIManager.default.focus(lastFocusedElementOutsideTrap);
            }
          };
        }
      }, []);
      return /* @__PURE__ */ React24.createElement(React24.Fragment, null, /* @__PURE__ */ React24.createElement(FocusBracket, null), /* @__PURE__ */ React24.createElement(_View.default, {
        ref: trapElementRef
      }, children), /* @__PURE__ */ React24.createElement(FocusBracket, null));
    }, "ModalFocusTrap");
    var _default = exports2.default = ModalFocusTrap;
    var styles = _StyleSheet.default.create({
      focusBracket: {
        outlineStyle: "none"
      }
    });
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Modal/index.js
var require_Modal = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Modal/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _ModalPortal = _interopRequireDefault(require_ModalPortal());
    var _ModalAnimation = _interopRequireDefault(require_ModalAnimation());
    var _ModalContent = _interopRequireDefault(require_ModalContent());
    var _ModalFocusTrap = _interopRequireDefault(require_ModalFocusTrap());
    var _excluded = ["animationType", "children", "onDismiss", "onRequestClose", "onShow", "transparent", "visible"];
    var uniqueModalIdentifier = 0;
    var activeModalStack = [];
    var activeModalListeners = {};
    function notifyActiveModalListeners() {
      if (activeModalStack.length === 0) {
        return;
      }
      var activeModalId = activeModalStack[activeModalStack.length - 1];
      activeModalStack.forEach((modalId) => {
        if (modalId in activeModalListeners) {
          activeModalListeners[modalId](modalId === activeModalId);
        }
      });
    }
    __name(notifyActiveModalListeners, "notifyActiveModalListeners");
    function removeActiveModal(modalId) {
      if (modalId in activeModalListeners) {
        activeModalListeners[modalId](false);
        delete activeModalListeners[modalId];
      }
      var index = activeModalStack.indexOf(modalId);
      if (index !== -1) {
        activeModalStack.splice(index, 1);
        notifyActiveModalListeners();
      }
    }
    __name(removeActiveModal, "removeActiveModal");
    function addActiveModal(modalId, listener) {
      removeActiveModal(modalId);
      activeModalStack.push(modalId);
      activeModalListeners[modalId] = listener;
      notifyActiveModalListeners();
    }
    __name(addActiveModal, "addActiveModal");
    var Modal = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var animationType = props.animationType, children = props.children, onDismiss = props.onDismiss, onRequestClose = props.onRequestClose, onShow = props.onShow, transparent = props.transparent, _props$visible = props.visible, visible = _props$visible === void 0 ? true : _props$visible, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var modalId = React24.useMemo(() => uniqueModalIdentifier++, []);
      var _React$useState = React24.useState(false), isActive = _React$useState[0], setIsActive = _React$useState[1];
      var onDismissCallback = React24.useCallback(() => {
        removeActiveModal(modalId);
        if (onDismiss) {
          onDismiss();
        }
      }, [modalId, onDismiss]);
      var onShowCallback = React24.useCallback(() => {
        addActiveModal(modalId, setIsActive);
        if (onShow) {
          onShow();
        }
      }, [modalId, onShow]);
      React24.useEffect(() => {
        return () => removeActiveModal(modalId);
      }, [modalId]);
      return /* @__PURE__ */ React24.createElement(_ModalPortal.default, null, /* @__PURE__ */ React24.createElement(_ModalAnimation.default, {
        animationType,
        onDismiss: onDismissCallback,
        onShow: onShowCallback,
        visible
      }, /* @__PURE__ */ React24.createElement(_ModalFocusTrap.default, {
        active: isActive
      }, /* @__PURE__ */ React24.createElement(_ModalContent.default, (0, _extends2.default)({}, rest, {
        active: isActive,
        onRequestClose,
        ref: forwardedRef,
        transparent
      }), children))));
    });
    var _default = exports2.default = Modal;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Picker/PickerItem.js
var require_PickerItem = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Picker/PickerItem.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = PickerItem;
    var _createElement = _interopRequireDefault(require_createElement());
    function PickerItem(props) {
      var color = props.color, label = props.label, testID = props.testID, value = props.value;
      var style = {
        color
      };
      return (0, _createElement.default)("option", {
        children: label,
        style,
        testID,
        value
      });
    }
    __name(PickerItem, "PickerItem");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Picker/index.js
var require_Picker = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Picker/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _createElement = _interopRequireDefault(require_createElement());
    var _useMergeRefs = _interopRequireDefault(require_useMergeRefs());
    var _usePlatformMethods = _interopRequireDefault(require_usePlatformMethods());
    var _PickerItem = _interopRequireDefault(require_PickerItem());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _excluded = ["children", "enabled", "onValueChange", "selectedValue", "style", "testID", "itemStyle", "mode", "prompt"];
    var Picker = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var children = props.children, enabled = props.enabled, onValueChange = props.onValueChange, selectedValue = props.selectedValue, style = props.style, testID = props.testID, itemStyle = props.itemStyle, mode = props.mode, prompt = props.prompt, other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var hostRef = React24.useRef(null);
      function handleChange(e) {
        var _e$target = e.target, selectedIndex = _e$target.selectedIndex, value = _e$target.value;
        if (onValueChange) {
          onValueChange(value, selectedIndex);
        }
      }
      __name(handleChange, "handleChange");
      var supportedProps = (0, _objectSpread2.default)({
        children,
        disabled: enabled === false ? true : void 0,
        onChange: handleChange,
        style: [styles.initial, style],
        testID,
        value: selectedValue
      }, other);
      var platformMethodsRef = (0, _usePlatformMethods.default)(supportedProps);
      var setRef2 = (0, _useMergeRefs.default)(hostRef, platformMethodsRef, forwardedRef);
      supportedProps.ref = setRef2;
      return (0, _createElement.default)("select", supportedProps);
    });
    Picker.Item = _PickerItem.default;
    var styles = _StyleSheet.default.create({
      initial: {
        fontFamily: "System",
        fontSize: "inherit",
        margin: 0
      }
    });
    var _default = exports2.default = Picker;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/addEventListener/index.js
var require_addEventListener = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/addEventListener/index.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.addEventListener = addEventListener;
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var emptyFunction = /* @__PURE__ */ __name(() => {
    }, "emptyFunction");
    function supportsPassiveEvents() {
      var supported = false;
      if (_canUseDom.default) {
        try {
          var options = {};
          Object.defineProperty(options, "passive", {
            get() {
              supported = true;
              return false;
            }
          });
          window.addEventListener("test", null, options);
          window.removeEventListener("test", null, options);
        } catch (e) {
        }
      }
      return supported;
    }
    __name(supportsPassiveEvents, "supportsPassiveEvents");
    var canUsePassiveEvents = supportsPassiveEvents();
    function getOptions(options) {
      if (options == null) {
        return false;
      }
      return canUsePassiveEvents ? options : Boolean(options.capture);
    }
    __name(getOptions, "getOptions");
    function isPropagationStopped() {
      return this.cancelBubble;
    }
    __name(isPropagationStopped, "isPropagationStopped");
    function isDefaultPrevented() {
      return this.defaultPrevented;
    }
    __name(isDefaultPrevented, "isDefaultPrevented");
    function normalizeEvent(event) {
      event.nativeEvent = event;
      event.persist = emptyFunction;
      event.isDefaultPrevented = isDefaultPrevented;
      event.isPropagationStopped = isPropagationStopped;
      return event;
    }
    __name(normalizeEvent, "normalizeEvent");
    function addEventListener(target, type, listener, options) {
      var opts = getOptions(options);
      var compatListener = /* @__PURE__ */ __name((e) => listener(normalizeEvent(e)), "compatListener");
      target.addEventListener(type, compatListener, opts);
      return /* @__PURE__ */ __name(function removeEventListener() {
        if (target != null) {
          target.removeEventListener(type, compatListener, opts);
        }
      }, "removeEventListener");
    }
    __name(addEventListener, "addEventListener");
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/modality/index.js
var require_modality = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/modality/index.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.addModalityListener = addModalityListener;
    exports2.getActiveModality = getActiveModality;
    exports2.getModality = getModality;
    exports2.testOnly_resetActiveModality = testOnly_resetActiveModality;
    var _addEventListener = require_addEventListener();
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var supportsPointerEvent = /* @__PURE__ */ __name(() => !!(typeof window !== "undefined" && window.PointerEvent != null), "supportsPointerEvent");
    var activeModality = "keyboard";
    var modality = "keyboard";
    var previousModality;
    var previousActiveModality;
    var isEmulatingMouseEvents = false;
    var listeners = /* @__PURE__ */ new Set();
    var KEYBOARD = "keyboard";
    var MOUSE = "mouse";
    var TOUCH = "touch";
    var BLUR = "blur";
    var CONTEXTMENU = "contextmenu";
    var FOCUS = "focus";
    var KEYDOWN = "keydown";
    var MOUSEDOWN = "mousedown";
    var MOUSEMOVE = "mousemove";
    var MOUSEUP = "mouseup";
    var POINTERDOWN = "pointerdown";
    var POINTERMOVE = "pointermove";
    var SCROLL = "scroll";
    var SELECTIONCHANGE = "selectionchange";
    var TOUCHCANCEL = "touchcancel";
    var TOUCHMOVE = "touchmove";
    var TOUCHSTART = "touchstart";
    var VISIBILITYCHANGE = "visibilitychange";
    var bubbleOptions = {
      passive: true
    };
    var captureOptions = {
      capture: true,
      passive: true
    };
    function restoreModality() {
      if (previousModality != null || previousActiveModality != null) {
        if (previousModality != null) {
          modality = previousModality;
          previousModality = null;
        }
        if (previousActiveModality != null) {
          activeModality = previousActiveModality;
          previousActiveModality = null;
        }
        callListeners();
      }
    }
    __name(restoreModality, "restoreModality");
    function onBlurWindow() {
      previousModality = modality;
      previousActiveModality = activeModality;
      activeModality = KEYBOARD;
      modality = KEYBOARD;
      callListeners();
      isEmulatingMouseEvents = false;
    }
    __name(onBlurWindow, "onBlurWindow");
    function onFocusWindow() {
      restoreModality();
    }
    __name(onFocusWindow, "onFocusWindow");
    function onKeyDown(event) {
      if (event.metaKey || event.altKey || event.ctrlKey) {
        return;
      }
      if (modality !== KEYBOARD) {
        modality = KEYBOARD;
        activeModality = KEYBOARD;
        callListeners();
      }
    }
    __name(onKeyDown, "onKeyDown");
    function onVisibilityChange() {
      if (document.visibilityState !== "hidden") {
        restoreModality();
      }
    }
    __name(onVisibilityChange, "onVisibilityChange");
    function onPointerish(event) {
      var eventType = event.type;
      if (supportsPointerEvent()) {
        if (eventType === POINTERDOWN) {
          if (activeModality !== event.pointerType) {
            modality = event.pointerType;
            activeModality = event.pointerType;
            callListeners();
          }
          return;
        }
        if (eventType === POINTERMOVE) {
          if (modality !== event.pointerType) {
            modality = event.pointerType;
            callListeners();
          }
          return;
        }
      } else {
        if (!isEmulatingMouseEvents) {
          if (eventType === MOUSEDOWN) {
            if (activeModality !== MOUSE) {
              modality = MOUSE;
              activeModality = MOUSE;
              callListeners();
            }
          }
          if (eventType === MOUSEMOVE) {
            if (modality !== MOUSE) {
              modality = MOUSE;
              callListeners();
            }
          }
        }
        if (eventType === TOUCHSTART) {
          isEmulatingMouseEvents = true;
          if (event.touches && event.touches.length > 1) {
            isEmulatingMouseEvents = false;
          }
          if (activeModality !== TOUCH) {
            modality = TOUCH;
            activeModality = TOUCH;
            callListeners();
          }
          return;
        }
        if (eventType === CONTEXTMENU || eventType === MOUSEUP || eventType === SELECTIONCHANGE || eventType === SCROLL || eventType === TOUCHCANCEL || eventType === TOUCHMOVE) {
          isEmulatingMouseEvents = false;
        }
      }
    }
    __name(onPointerish, "onPointerish");
    if (_canUseDom.default) {
      (0, _addEventListener.addEventListener)(window, BLUR, onBlurWindow, bubbleOptions);
      (0, _addEventListener.addEventListener)(window, FOCUS, onFocusWindow, bubbleOptions);
      (0, _addEventListener.addEventListener)(document, KEYDOWN, onKeyDown, captureOptions);
      (0, _addEventListener.addEventListener)(document, VISIBILITYCHANGE, onVisibilityChange, captureOptions);
      (0, _addEventListener.addEventListener)(document, POINTERDOWN, onPointerish, captureOptions);
      (0, _addEventListener.addEventListener)(document, POINTERMOVE, onPointerish, captureOptions);
      (0, _addEventListener.addEventListener)(document, CONTEXTMENU, onPointerish, captureOptions);
      (0, _addEventListener.addEventListener)(document, MOUSEDOWN, onPointerish, captureOptions);
      (0, _addEventListener.addEventListener)(document, MOUSEMOVE, onPointerish, captureOptions);
      (0, _addEventListener.addEventListener)(document, MOUSEUP, onPointerish, captureOptions);
      (0, _addEventListener.addEventListener)(document, TOUCHCANCEL, onPointerish, captureOptions);
      (0, _addEventListener.addEventListener)(document, TOUCHMOVE, onPointerish, captureOptions);
      (0, _addEventListener.addEventListener)(document, TOUCHSTART, onPointerish, captureOptions);
      (0, _addEventListener.addEventListener)(document, SELECTIONCHANGE, onPointerish, captureOptions);
      (0, _addEventListener.addEventListener)(document, SCROLL, onPointerish, captureOptions);
    }
    function callListeners() {
      var value = {
        activeModality,
        modality
      };
      listeners.forEach((listener) => {
        listener(value);
      });
    }
    __name(callListeners, "callListeners");
    function getActiveModality() {
      return activeModality;
    }
    __name(getActiveModality, "getActiveModality");
    function getModality() {
      return modality;
    }
    __name(getModality, "getModality");
    function addModalityListener(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
    __name(addModalityListener, "addModalityListener");
    function testOnly_resetActiveModality() {
      isEmulatingMouseEvents = false;
      activeModality = KEYBOARD;
      modality = KEYBOARD;
    }
    __name(testOnly_resetActiveModality, "testOnly_resetActiveModality");
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useEvent/index.js
var require_useEvent = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useEvent/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = useEvent5;
    var _addEventListener = require_addEventListener();
    var _useLayoutEffect = _interopRequireDefault(require_useLayoutEffect());
    var _useStable = _interopRequireDefault(require_useStable());
    function useEvent5(eventType, options) {
      var targetListeners = (0, _useStable.default)(() => /* @__PURE__ */ new Map());
      var addListener = (0, _useStable.default)(() => {
        return (target, callback) => {
          var removeTargetListener = targetListeners.get(target);
          if (removeTargetListener != null) {
            removeTargetListener();
          }
          if (callback == null) {
            targetListeners.delete(target);
            callback = /* @__PURE__ */ __name(() => {
            }, "callback");
          }
          var removeEventListener = (0, _addEventListener.addEventListener)(target, eventType, callback, options);
          targetListeners.set(target, removeEventListener);
          return removeEventListener;
        };
      });
      (0, _useLayoutEffect.default)(() => {
        return () => {
          targetListeners.forEach((removeListener) => {
            removeListener();
          });
          targetListeners.clear();
        };
      }, [targetListeners]);
      return addListener;
    }
    __name(useEvent5, "useEvent");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/useHover/index.js
var require_useHover = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/useHover/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = useHover;
    var _modality = require_modality();
    var _useEvent = _interopRequireDefault(require_useEvent());
    var _useLayoutEffect = _interopRequireDefault(require_useLayoutEffect());
    var emptyObject = {};
    var opts = {
      passive: true
    };
    var lockEventType = "react-gui:hover:lock";
    var unlockEventType = "react-gui:hover:unlock";
    var supportsPointerEvent = /* @__PURE__ */ __name(() => !!(typeof window !== "undefined" && window.PointerEvent != null), "supportsPointerEvent");
    function dispatchCustomEvent(target, type, payload) {
      var event = document.createEvent("CustomEvent");
      var _ref = payload || emptyObject, _ref$bubbles = _ref.bubbles, bubbles = _ref$bubbles === void 0 ? true : _ref$bubbles, _ref$cancelable = _ref.cancelable, cancelable = _ref$cancelable === void 0 ? true : _ref$cancelable, detail = _ref.detail;
      event.initCustomEvent(type, bubbles, cancelable, detail);
      target.dispatchEvent(event);
    }
    __name(dispatchCustomEvent, "dispatchCustomEvent");
    function getPointerType(event) {
      var pointerType = event.pointerType;
      return pointerType != null ? pointerType : (0, _modality.getModality)();
    }
    __name(getPointerType, "getPointerType");
    function useHover(targetRef, config) {
      var contain = config.contain, disabled = config.disabled, onHoverStart = config.onHoverStart, onHoverChange = config.onHoverChange, onHoverUpdate = config.onHoverUpdate, onHoverEnd = config.onHoverEnd;
      var canUsePE = supportsPointerEvent();
      var addMoveListener = (0, _useEvent.default)(canUsePE ? "pointermove" : "mousemove", opts);
      var addEnterListener = (0, _useEvent.default)(canUsePE ? "pointerenter" : "mouseenter", opts);
      var addLeaveListener = (0, _useEvent.default)(canUsePE ? "pointerleave" : "mouseleave", opts);
      var addLockListener = (0, _useEvent.default)(lockEventType, opts);
      var addUnlockListener = (0, _useEvent.default)(unlockEventType, opts);
      (0, _useLayoutEffect.default)(() => {
        var target = targetRef.current;
        if (target !== null) {
          var hoverEnd = /* @__PURE__ */ __name(function hoverEnd2(e) {
            if (onHoverEnd != null) {
              onHoverEnd(e);
            }
            if (onHoverChange != null) {
              onHoverChange(false);
            }
            addMoveListener(target, null);
            addLeaveListener(target, null);
          }, "hoverEnd");
          var leaveListener = /* @__PURE__ */ __name(function leaveListener2(e) {
            var target2 = targetRef.current;
            if (target2 != null && getPointerType(e) !== "touch") {
              if (contain) {
                dispatchCustomEvent(target2, unlockEventType);
              }
              hoverEnd(e);
            }
          }, "leaveListener");
          var moveListener = /* @__PURE__ */ __name(function moveListener2(e) {
            if (getPointerType(e) !== "touch") {
              if (onHoverUpdate != null) {
                if (e.x == null) {
                  e.x = e.clientX;
                }
                if (e.y == null) {
                  e.y = e.clientY;
                }
                onHoverUpdate(e);
              }
            }
          }, "moveListener");
          var hoverStart = /* @__PURE__ */ __name(function hoverStart2(e) {
            if (onHoverStart != null) {
              onHoverStart(e);
            }
            if (onHoverChange != null) {
              onHoverChange(true);
            }
            if (onHoverUpdate != null) {
              addMoveListener(target, !disabled ? moveListener : null);
            }
            addLeaveListener(target, !disabled ? leaveListener : null);
          }, "hoverStart");
          var enterListener = /* @__PURE__ */ __name(function enterListener2(e) {
            var target2 = targetRef.current;
            if (target2 != null && getPointerType(e) !== "touch") {
              if (contain) {
                dispatchCustomEvent(target2, lockEventType);
              }
              hoverStart(e);
              var lockListener = /* @__PURE__ */ __name(function lockListener2(lockEvent) {
                if (lockEvent.target !== target2) {
                  hoverEnd(e);
                }
              }, "lockListener");
              var unlockListener = /* @__PURE__ */ __name(function unlockListener2(lockEvent) {
                if (lockEvent.target !== target2) {
                  hoverStart(e);
                }
              }, "unlockListener");
              addLockListener(target2, !disabled ? lockListener : null);
              addUnlockListener(target2, !disabled ? unlockListener : null);
            }
          }, "enterListener");
          addEnterListener(target, !disabled ? enterListener : null);
        }
      }, [addEnterListener, addMoveListener, addLeaveListener, addLockListener, addUnlockListener, contain, disabled, onHoverStart, onHoverChange, onHoverUpdate, onHoverEnd, targetRef]);
    }
    __name(useHover, "useHover");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Pressable/index.js
var require_Pressable = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Pressable/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _react = _interopRequireWildcard(require("react"));
    var React24 = _react;
    var _useMergeRefs = _interopRequireDefault(require_useMergeRefs());
    var _useHover = _interopRequireDefault(require_useHover());
    var _usePressEvents = _interopRequireDefault(require_usePressEvents());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var _excluded = ["children", "delayLongPress", "delayPressIn", "delayPressOut", "disabled", "onBlur", "onContextMenu", "onFocus", "onHoverIn", "onHoverOut", "onKeyDown", "onLongPress", "onPress", "onPressMove", "onPressIn", "onPressOut", "style", "tabIndex", "testOnly_hovered", "testOnly_pressed"];
    function Pressable(props, forwardedRef) {
      var children = props.children, delayLongPress = props.delayLongPress, delayPressIn = props.delayPressIn, delayPressOut = props.delayPressOut, disabled = props.disabled, onBlur = props.onBlur, onContextMenu = props.onContextMenu, onFocus = props.onFocus, onHoverIn = props.onHoverIn, onHoverOut = props.onHoverOut, onKeyDown = props.onKeyDown, onLongPress = props.onLongPress, onPress = props.onPress, onPressMove = props.onPressMove, onPressIn = props.onPressIn, onPressOut = props.onPressOut, style = props.style, tabIndex = props.tabIndex, testOnly_hovered = props.testOnly_hovered, testOnly_pressed = props.testOnly_pressed, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var _useForceableState = useForceableState(testOnly_hovered === true), hovered = _useForceableState[0], setHovered = _useForceableState[1];
      var _useForceableState2 = useForceableState(false), focused = _useForceableState2[0], setFocused = _useForceableState2[1];
      var _useForceableState3 = useForceableState(testOnly_pressed === true), pressed = _useForceableState3[0], setPressed = _useForceableState3[1];
      var hostRef = (0, _react.useRef)(null);
      var setRef2 = (0, _useMergeRefs.default)(forwardedRef, hostRef);
      var pressConfig = (0, _react.useMemo)(() => ({
        delayLongPress,
        delayPressStart: delayPressIn,
        delayPressEnd: delayPressOut,
        disabled,
        onLongPress,
        onPress,
        onPressChange: setPressed,
        onPressStart: onPressIn,
        onPressMove,
        onPressEnd: onPressOut
      }), [delayLongPress, delayPressIn, delayPressOut, disabled, onLongPress, onPress, onPressIn, onPressMove, onPressOut, setPressed]);
      var pressEventHandlers = (0, _usePressEvents.default)(hostRef, pressConfig);
      var onContextMenuPress = pressEventHandlers.onContextMenu, onKeyDownPress = pressEventHandlers.onKeyDown;
      (0, _useHover.default)(hostRef, {
        contain: true,
        disabled,
        onHoverChange: setHovered,
        onHoverStart: onHoverIn,
        onHoverEnd: onHoverOut
      });
      var interactionState = {
        hovered,
        focused,
        pressed
      };
      var blurHandler = React24.useCallback((e) => {
        if (e.nativeEvent.target === hostRef.current) {
          setFocused(false);
          if (onBlur != null) {
            onBlur(e);
          }
        }
      }, [hostRef, setFocused, onBlur]);
      var focusHandler = React24.useCallback((e) => {
        if (e.nativeEvent.target === hostRef.current) {
          setFocused(true);
          if (onFocus != null) {
            onFocus(e);
          }
        }
      }, [hostRef, setFocused, onFocus]);
      var contextMenuHandler = React24.useCallback((e) => {
        if (onContextMenuPress != null) {
          onContextMenuPress(e);
        }
        if (onContextMenu != null) {
          onContextMenu(e);
        }
      }, [onContextMenu, onContextMenuPress]);
      var keyDownHandler = React24.useCallback((e) => {
        if (onKeyDownPress != null) {
          onKeyDownPress(e);
        }
        if (onKeyDown != null) {
          onKeyDown(e);
        }
      }, [onKeyDown, onKeyDownPress]);
      var _tabIndex;
      if (tabIndex !== void 0) {
        _tabIndex = tabIndex;
      } else {
        _tabIndex = disabled ? -1 : 0;
      }
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, rest, pressEventHandlers, {
        "aria-disabled": disabled,
        onBlur: blurHandler,
        onContextMenu: contextMenuHandler,
        onFocus: focusHandler,
        onKeyDown: keyDownHandler,
        ref: setRef2,
        style: [disabled ? styles.disabled : styles.active, typeof style === "function" ? style(interactionState) : style],
        tabIndex: _tabIndex
      }), typeof children === "function" ? children(interactionState) : children);
    }
    __name(Pressable, "Pressable");
    function useForceableState(forced) {
      var _useState = (0, _react.useState)(false), bool = _useState[0], setBool = _useState[1];
      return [bool || forced, setBool];
    }
    __name(useForceableState, "useForceableState");
    var styles = _StyleSheet.default.create({
      active: {
        cursor: "pointer",
        touchAction: "manipulation"
      },
      disabled: {
        pointerEvents: "box-none"
      }
    });
    var MemoedPressable = /* @__PURE__ */ (0, _react.memo)(/* @__PURE__ */ (0, _react.forwardRef)(Pressable));
    MemoedPressable.displayName = "Pressable";
    var _default = exports2.default = MemoedPressable;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/ProgressBar/index.js
var require_ProgressBar = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/ProgressBar/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var _excluded = ["color", "indeterminate", "progress", "trackColor", "style"];
    var ProgressBar = /* @__PURE__ */ React24.forwardRef((props, ref) => {
      var _props$color = props.color, color = _props$color === void 0 ? "#1976D2" : _props$color, _props$indeterminate = props.indeterminate, indeterminate = _props$indeterminate === void 0 ? false : _props$indeterminate, _props$progress = props.progress, progress = _props$progress === void 0 ? 0 : _props$progress, _props$trackColor = props.trackColor, trackColor = _props$trackColor === void 0 ? "transparent" : _props$trackColor, style = props.style, other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var percentageProgress = progress * 100;
      var width = indeterminate ? "25%" : percentageProgress + "%";
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, other, {
        "aria-valuemax": 100,
        "aria-valuemin": 0,
        "aria-valuenow": indeterminate ? null : percentageProgress,
        ref,
        role: "progressbar",
        style: [styles.track, style, {
          backgroundColor: trackColor
        }]
      }), /* @__PURE__ */ React24.createElement(_View.default, {
        style: [{
          backgroundColor: color,
          width
        }, styles.progress, indeterminate && styles.animation]
      }));
    });
    ProgressBar.displayName = "ProgressBar";
    var styles = _StyleSheet.default.create({
      track: {
        forcedColorAdjust: "none",
        height: 5,
        overflow: "hidden",
        userSelect: "none",
        zIndex: 0
      },
      progress: {
        forcedColorAdjust: "none",
        height: "100%",
        zIndex: -1
      },
      animation: {
        animationDuration: "1s",
        animationKeyframes: [{
          "0%": {
            transform: "translateX(-100%)"
          },
          "100%": {
            transform: "translateX(400%)"
          }
        }],
        animationTimingFunction: "linear",
        animationIterationCount: "infinite"
      }
    });
    var _default = exports2.default = ProgressBar;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/SafeAreaView/index.js
var require_SafeAreaView = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/SafeAreaView/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var _canUseDom = _interopRequireDefault(require_canUseDom());
    var _excluded = ["style"];
    var cssFunction = (function() {
      if (_canUseDom.default && window.CSS && window.CSS.supports && window.CSS.supports("top: constant(safe-area-inset-top)")) {
        return "constant";
      }
      return "env";
    })();
    var SafeAreaView = /* @__PURE__ */ React24.forwardRef((props, ref) => {
      var style = props.style, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, rest, {
        ref,
        style: [styles.root, style]
      }));
    });
    SafeAreaView.displayName = "SafeAreaView";
    var styles = _StyleSheet.default.create({
      root: {
        paddingTop: cssFunction + "(safe-area-inset-top)",
        paddingRight: cssFunction + "(safe-area-inset-right)",
        paddingBottom: cssFunction + "(safe-area-inset-bottom)",
        paddingLeft: cssFunction + "(safe-area-inset-left)"
      }
    });
    var _default = exports2.default = SafeAreaView;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/StatusBar/index.js
var require_StatusBar = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/StatusBar/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var emptyFunction = /* @__PURE__ */ __name(() => {
    }, "emptyFunction");
    function StatusBar() {
      return null;
    }
    __name(StatusBar, "StatusBar");
    StatusBar.setBackgroundColor = emptyFunction;
    StatusBar.setBarStyle = emptyFunction;
    StatusBar.setHidden = emptyFunction;
    StatusBar.setNetworkActivityIndicatorVisible = emptyFunction;
    StatusBar.setTranslucent = emptyFunction;
    var _default = exports2.default = StatusBar;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/multiplyStyleLengthValue/index.js
var require_multiplyStyleLengthValue = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/multiplyStyleLengthValue/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var CSS_UNIT_RE = /^[+-]?\d*(?:\.\d+)?(?:[Ee][+-]?\d+)?(%|\w*)/;
    var getUnit = /* @__PURE__ */ __name((str) => str.match(CSS_UNIT_RE)[1], "getUnit");
    var isNumeric = /* @__PURE__ */ __name((n) => {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }, "isNumeric");
    var multiplyStyleLengthValue = /* @__PURE__ */ __name((value, multiple) => {
      if (typeof value === "string") {
        var number = parseFloat(value) * multiple;
        var unit = getUnit(value);
        return "" + number + unit;
      } else if (isNumeric(value)) {
        return value * multiple;
      }
    }, "multiplyStyleLengthValue");
    var _default = exports2.default = multiplyStyleLengthValue;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Switch/index.js
var require_Switch = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Switch/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var React24 = _interopRequireWildcard(require("react"));
    var _createElement = _interopRequireDefault(require_createElement());
    var _multiplyStyleLengthValue = _interopRequireDefault(require_multiplyStyleLengthValue());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var _excluded = ["aria-label", "accessibilityLabel", "activeThumbColor", "activeTrackColor", "disabled", "onValueChange", "style", "thumbColor", "trackColor", "value"];
    var emptyObject = {};
    var thumbDefaultBoxShadow = "0px 1px 3px rgba(0,0,0,0.5)";
    var thumbFocusedBoxShadow = thumbDefaultBoxShadow + ", 0 0 0 10px rgba(0,0,0,0.1)";
    var defaultActiveTrackColor = "#A3D3CF";
    var defaultTrackColor = "#939393";
    var defaultDisabledTrackColor = "#D5D5D5";
    var defaultActiveThumbColor = "#009688";
    var defaultThumbColor = "#FAFAFA";
    var defaultDisabledThumbColor = "#BDBDBD";
    var Switch = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var ariaLabel = props["aria-label"], accessibilityLabel = props.accessibilityLabel, activeThumbColor = props.activeThumbColor, activeTrackColor = props.activeTrackColor, _props$disabled = props.disabled, disabled = _props$disabled === void 0 ? false : _props$disabled, onValueChange = props.onValueChange, _props$style = props.style, style = _props$style === void 0 ? emptyObject : _props$style, thumbColor = props.thumbColor, trackColor = props.trackColor, _props$value = props.value, value = _props$value === void 0 ? false : _props$value, other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var thumbRef = React24.useRef(null);
      function handleChange(event) {
        if (onValueChange != null) {
          onValueChange(event.nativeEvent.target.checked);
        }
      }
      __name(handleChange, "handleChange");
      function handleFocusState(event) {
        var isFocused = event.nativeEvent.type === "focus";
        var boxShadow = isFocused ? thumbFocusedBoxShadow : thumbDefaultBoxShadow;
        if (thumbRef.current != null) {
          thumbRef.current.style.boxShadow = boxShadow;
        }
      }
      __name(handleFocusState, "handleFocusState");
      var _StyleSheet$flatten = _StyleSheet.default.flatten(style), styleHeight = _StyleSheet$flatten.height, styleWidth = _StyleSheet$flatten.width;
      var height = styleHeight || "20px";
      var minWidth = (0, _multiplyStyleLengthValue.default)(height, 2);
      var width = styleWidth > minWidth ? styleWidth : minWidth;
      var trackBorderRadius = (0, _multiplyStyleLengthValue.default)(height, 0.5);
      var trackCurrentColor = (function() {
        if (value === true) {
          if (trackColor != null && typeof trackColor === "object") {
            return trackColor.true;
          } else {
            return activeTrackColor !== null && activeTrackColor !== void 0 ? activeTrackColor : defaultActiveTrackColor;
          }
        } else {
          if (trackColor != null && typeof trackColor === "object") {
            return trackColor.false;
          } else {
            return trackColor !== null && trackColor !== void 0 ? trackColor : defaultTrackColor;
          }
        }
      })();
      var thumbCurrentColor = value ? activeThumbColor !== null && activeThumbColor !== void 0 ? activeThumbColor : defaultActiveThumbColor : thumbColor !== null && thumbColor !== void 0 ? thumbColor : defaultThumbColor;
      var thumbHeight = height;
      var thumbWidth = thumbHeight;
      var rootStyle = [styles.root, style, disabled && styles.cursorDefault, {
        height,
        width
      }];
      var disabledTrackColor = (function() {
        if (value === true) {
          if (typeof activeTrackColor === "string" && activeTrackColor != null || typeof trackColor === "object" && trackColor != null && trackColor.true) {
            return trackCurrentColor;
          } else {
            return defaultDisabledTrackColor;
          }
        } else {
          if (typeof trackColor === "string" && trackColor != null || typeof trackColor === "object" && trackColor != null && trackColor.false) {
            return trackCurrentColor;
          } else {
            return defaultDisabledTrackColor;
          }
        }
      })();
      var disabledThumbColor = (function() {
        if (value === true) {
          if (activeThumbColor == null) {
            return defaultDisabledThumbColor;
          } else {
            return thumbCurrentColor;
          }
        } else {
          if (thumbColor == null) {
            return defaultDisabledThumbColor;
          } else {
            return thumbCurrentColor;
          }
        }
      })();
      var trackStyle = [styles.track, {
        backgroundColor: disabled ? disabledTrackColor : trackCurrentColor,
        borderRadius: trackBorderRadius
      }];
      var thumbStyle = [styles.thumb, value && styles.thumbActive, {
        backgroundColor: disabled ? disabledThumbColor : thumbCurrentColor,
        height: thumbHeight,
        marginStart: value ? (0, _multiplyStyleLengthValue.default)(thumbWidth, -1) : 0,
        width: thumbWidth
      }];
      var nativeControl = (0, _createElement.default)("input", {
        "aria-label": ariaLabel || accessibilityLabel,
        checked: value,
        disabled,
        onBlur: handleFocusState,
        onChange: handleChange,
        onFocus: handleFocusState,
        ref: forwardedRef,
        style: [styles.nativeControl, styles.cursorInherit],
        type: "checkbox",
        role: "switch"
      });
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, other, {
        style: rootStyle
      }), /* @__PURE__ */ React24.createElement(_View.default, {
        style: trackStyle
      }), /* @__PURE__ */ React24.createElement(_View.default, {
        ref: thumbRef,
        style: thumbStyle
      }), nativeControl);
    });
    Switch.displayName = "Switch";
    var styles = _StyleSheet.default.create({
      root: {
        cursor: "pointer",
        userSelect: "none"
      },
      cursorDefault: {
        cursor: "default"
      },
      cursorInherit: {
        cursor: "inherit"
      },
      track: (0, _objectSpread2.default)((0, _objectSpread2.default)({
        forcedColorAdjust: "none"
      }, _StyleSheet.default.absoluteFillObject), {}, {
        height: "70%",
        margin: "auto",
        transitionDuration: "0.1s",
        width: "100%"
      }),
      thumb: {
        forcedColorAdjust: "none",
        alignSelf: "flex-start",
        borderRadius: "100%",
        boxShadow: thumbDefaultBoxShadow,
        start: "0%",
        transform: "translateZ(0)",
        transitionDuration: "0.1s"
      },
      thumbActive: {
        insetInlineStart: "100%"
      },
      nativeControl: (0, _objectSpread2.default)((0, _objectSpread2.default)({}, _StyleSheet.default.absoluteFillObject), {}, {
        height: "100%",
        margin: 0,
        appearance: "none",
        padding: 0,
        width: "100%"
      })
    });
    var _default = exports2.default = Switch;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/TextInput/index.js
var require_TextInput = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/TextInput/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var React24 = _interopRequireWildcard(require("react"));
    var _createElement = _interopRequireDefault(require_createElement());
    var forwardedProps = _interopRequireWildcard(require_forwardedProps());
    var _pick = _interopRequireDefault(require_pick());
    var _useElementLayout = _interopRequireDefault(require_useElementLayout());
    var _useLayoutEffect = _interopRequireDefault(require_useLayoutEffect());
    var _useMergeRefs = _interopRequireDefault(require_useMergeRefs());
    var _usePlatformMethods = _interopRequireDefault(require_usePlatformMethods());
    var _useResponderEvents = _interopRequireDefault(require_useResponderEvents());
    var _useLocale = require_useLocale();
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _TextInputState = _interopRequireDefault(require_TextInputState());
    var isSelectionStale = /* @__PURE__ */ __name((node, selection) => {
      var selectionEnd = node.selectionEnd, selectionStart = node.selectionStart;
      var start = selection.start, end = selection.end;
      return start !== selectionStart || end !== selectionEnd;
    }, "isSelectionStale");
    var setSelection = /* @__PURE__ */ __name((node, selection) => {
      if (isSelectionStale(node, selection)) {
        var start = selection.start, end = selection.end;
        try {
          node.setSelectionRange(start, end || start);
        } catch (e) {
        }
      }
    }, "setSelection");
    var forwardPropsList = Object.assign({}, forwardedProps.defaultProps, forwardedProps.accessibilityProps, forwardedProps.clickProps, forwardedProps.focusProps, forwardedProps.keyboardProps, forwardedProps.mouseProps, forwardedProps.touchProps, forwardedProps.styleProps, {
      autoCapitalize: true,
      autoComplete: true,
      autoCorrect: true,
      autoFocus: true,
      defaultValue: true,
      disabled: true,
      lang: true,
      maxLength: true,
      onChange: true,
      onScroll: true,
      placeholder: true,
      pointerEvents: true,
      readOnly: true,
      rows: true,
      spellCheck: true,
      value: true,
      type: true
    });
    var pickProps = /* @__PURE__ */ __name((props) => (0, _pick.default)(props, forwardPropsList), "pickProps");
    function isEventComposing(nativeEvent) {
      return nativeEvent.isComposing || nativeEvent.keyCode === 229;
    }
    __name(isEventComposing, "isEventComposing");
    var focusTimeout = null;
    var TextInput = /* @__PURE__ */ React24.forwardRef((props, forwardedRef) => {
      var _props$autoCapitalize = props.autoCapitalize, autoCapitalize = _props$autoCapitalize === void 0 ? "sentences" : _props$autoCapitalize, autoComplete = props.autoComplete, autoCompleteType = props.autoCompleteType, _props$autoCorrect = props.autoCorrect, autoCorrect = _props$autoCorrect === void 0 ? true : _props$autoCorrect, blurOnSubmit = props.blurOnSubmit, caretHidden = props.caretHidden, clearTextOnFocus = props.clearTextOnFocus, dir = props.dir, editable = props.editable, enterKeyHint = props.enterKeyHint, inputMode = props.inputMode, keyboardType = props.keyboardType, _props$multiline = props.multiline, multiline = _props$multiline === void 0 ? false : _props$multiline, numberOfLines = props.numberOfLines, onBlur = props.onBlur, onChange = props.onChange, onChangeText = props.onChangeText, onContentSizeChange = props.onContentSizeChange, onFocus = props.onFocus, onKeyPress = props.onKeyPress, onLayout = props.onLayout, onMoveShouldSetResponder = props.onMoveShouldSetResponder, onMoveShouldSetResponderCapture = props.onMoveShouldSetResponderCapture, onResponderEnd = props.onResponderEnd, onResponderGrant = props.onResponderGrant, onResponderMove = props.onResponderMove, onResponderReject = props.onResponderReject, onResponderRelease = props.onResponderRelease, onResponderStart = props.onResponderStart, onResponderTerminate = props.onResponderTerminate, onResponderTerminationRequest = props.onResponderTerminationRequest, onScrollShouldSetResponder = props.onScrollShouldSetResponder, onScrollShouldSetResponderCapture = props.onScrollShouldSetResponderCapture, onSelectionChange = props.onSelectionChange, onSelectionChangeShouldSetResponder = props.onSelectionChangeShouldSetResponder, onSelectionChangeShouldSetResponderCapture = props.onSelectionChangeShouldSetResponderCapture, onStartShouldSetResponder = props.onStartShouldSetResponder, onStartShouldSetResponderCapture = props.onStartShouldSetResponderCapture, onSubmitEditing = props.onSubmitEditing, placeholderTextColor = props.placeholderTextColor, _props$readOnly = props.readOnly, readOnly = _props$readOnly === void 0 ? false : _props$readOnly, returnKeyType = props.returnKeyType, rows = props.rows, _props$secureTextEntr = props.secureTextEntry, secureTextEntry = _props$secureTextEntr === void 0 ? false : _props$secureTextEntr, selection = props.selection, selectTextOnFocus = props.selectTextOnFocus, showSoftInputOnFocus = props.showSoftInputOnFocus, spellCheck = props.spellCheck;
      var type;
      var _inputMode;
      if (inputMode != null) {
        _inputMode = inputMode;
        if (inputMode === "email") {
          type = "email";
        } else if (inputMode === "tel") {
          type = "tel";
        } else if (inputMode === "search") {
          type = "search";
        } else if (inputMode === "url") {
          type = "url";
        } else {
          type = "text";
        }
      } else if (keyboardType != null) {
        switch (keyboardType) {
          case "email-address":
            type = "email";
            break;
          case "number-pad":
          case "numeric":
            _inputMode = "numeric";
            break;
          case "decimal-pad":
            _inputMode = "decimal";
            break;
          case "phone-pad":
            type = "tel";
            break;
          case "search":
          case "web-search":
            type = "search";
            break;
          case "url":
            type = "url";
            break;
          default:
            type = "text";
        }
      }
      if (secureTextEntry) {
        type = "password";
      }
      var dimensions = React24.useRef({
        height: null,
        width: null
      });
      var hostRef = React24.useRef(null);
      var prevSelection = React24.useRef(null);
      var prevSecureTextEntry = React24.useRef(false);
      React24.useEffect(() => {
        if (hostRef.current && prevSelection.current) {
          setSelection(hostRef.current, prevSelection.current);
        }
        prevSecureTextEntry.current = secureTextEntry;
      }, [secureTextEntry]);
      var handleContentSizeChange = React24.useCallback((hostNode) => {
        if (multiline && onContentSizeChange && hostNode != null) {
          var newHeight = hostNode.scrollHeight;
          var newWidth = hostNode.scrollWidth;
          if (newHeight !== dimensions.current.height || newWidth !== dimensions.current.width) {
            dimensions.current.height = newHeight;
            dimensions.current.width = newWidth;
            onContentSizeChange({
              nativeEvent: {
                contentSize: {
                  height: dimensions.current.height,
                  width: dimensions.current.width
                }
              }
            });
          }
        }
      }, [multiline, onContentSizeChange]);
      var imperativeRef = React24.useMemo(() => (hostNode) => {
        if (hostNode != null) {
          hostNode.clear = function() {
            if (hostNode != null) {
              hostNode.value = "";
            }
          };
          hostNode.isFocused = function() {
            return hostNode != null && _TextInputState.default.currentlyFocusedField() === hostNode;
          };
          handleContentSizeChange(hostNode);
        }
      }, [handleContentSizeChange]);
      function handleBlur(e) {
        _TextInputState.default._currentlyFocusedNode = null;
        if (onBlur) {
          e.nativeEvent.text = e.target.value;
          onBlur(e);
        }
      }
      __name(handleBlur, "handleBlur");
      function handleChange(e) {
        var hostNode = e.target;
        var text = hostNode.value;
        e.nativeEvent.text = text;
        handleContentSizeChange(hostNode);
        if (onChange) {
          onChange(e);
        }
        if (onChangeText) {
          onChangeText(text);
        }
      }
      __name(handleChange, "handleChange");
      function handleFocus(e) {
        var hostNode = e.target;
        if (onFocus) {
          e.nativeEvent.text = hostNode.value;
          onFocus(e);
        }
        if (hostNode != null) {
          _TextInputState.default._currentlyFocusedNode = hostNode;
          if (clearTextOnFocus) {
            hostNode.value = "";
          }
          if (selectTextOnFocus) {
            if (focusTimeout != null) {
              clearTimeout(focusTimeout);
            }
            focusTimeout = setTimeout(() => {
              if (hostNode != null && document.activeElement === hostNode) {
                hostNode.select();
              }
            }, 0);
          }
        }
      }
      __name(handleFocus, "handleFocus");
      function handleKeyDown(e) {
        var hostNode = e.target;
        e.stopPropagation();
        var blurOnSubmitDefault = !multiline;
        var shouldBlurOnSubmit = blurOnSubmit == null ? blurOnSubmitDefault : blurOnSubmit;
        var nativeEvent = e.nativeEvent;
        var isComposing = isEventComposing(nativeEvent);
        if (onKeyPress) {
          onKeyPress(e);
        }
        if (e.key === "Enter" && !e.shiftKey && // Do not call submit if composition is occuring.
        !isComposing && !e.isDefaultPrevented()) {
          if ((blurOnSubmit || !multiline) && onSubmitEditing) {
            e.preventDefault();
            nativeEvent.text = e.target.value;
            onSubmitEditing(e);
          }
          if (shouldBlurOnSubmit && hostNode != null) {
            setTimeout(() => hostNode.blur(), 0);
          }
        }
      }
      __name(handleKeyDown, "handleKeyDown");
      function handleSelectionChange(e) {
        try {
          var _e$target = e.target, selectionStart = _e$target.selectionStart, selectionEnd = _e$target.selectionEnd;
          var _selection = {
            start: selectionStart,
            end: selectionEnd
          };
          if (onSelectionChange) {
            e.nativeEvent.selection = _selection;
            e.nativeEvent.text = e.target.value;
            onSelectionChange(e);
          }
          if (prevSecureTextEntry.current === secureTextEntry) {
            prevSelection.current = _selection;
          }
        } catch (e2) {
        }
      }
      __name(handleSelectionChange, "handleSelectionChange");
      (0, _useLayoutEffect.default)(() => {
        var node = hostRef.current;
        if (node != null && selection != null) {
          setSelection(node, selection);
        }
        if (document.activeElement === node) {
          _TextInputState.default._currentlyFocusedNode = node;
        }
      }, [hostRef, selection]);
      var component = multiline ? "textarea" : "input";
      (0, _useElementLayout.default)(hostRef, onLayout);
      (0, _useResponderEvents.default)(hostRef, {
        onMoveShouldSetResponder,
        onMoveShouldSetResponderCapture,
        onResponderEnd,
        onResponderGrant,
        onResponderMove,
        onResponderReject,
        onResponderRelease,
        onResponderStart,
        onResponderTerminate,
        onResponderTerminationRequest,
        onScrollShouldSetResponder,
        onScrollShouldSetResponderCapture,
        onSelectionChangeShouldSetResponder,
        onSelectionChangeShouldSetResponderCapture,
        onStartShouldSetResponder,
        onStartShouldSetResponderCapture
      });
      var _useLocaleContext = (0, _useLocale.useLocaleContext)(), contextDirection = _useLocaleContext.direction;
      var supportedProps = pickProps(props);
      supportedProps.autoCapitalize = autoCapitalize;
      supportedProps.autoComplete = autoComplete || autoCompleteType || "on";
      supportedProps.autoCorrect = autoCorrect ? "on" : "off";
      supportedProps.dir = dir !== void 0 ? dir : "auto";
      supportedProps.enterKeyHint = enterKeyHint || returnKeyType;
      supportedProps.inputMode = _inputMode;
      supportedProps.onBlur = handleBlur;
      supportedProps.onChange = handleChange;
      supportedProps.onFocus = handleFocus;
      supportedProps.onKeyDown = handleKeyDown;
      supportedProps.onSelect = handleSelectionChange;
      supportedProps.readOnly = readOnly === true || editable === false;
      supportedProps.rows = multiline ? rows != null ? rows : numberOfLines : 1;
      supportedProps.spellCheck = spellCheck != null ? spellCheck : autoCorrect;
      supportedProps.style = [{
        "--placeholderTextColor": placeholderTextColor
      }, styles.textinput$raw, styles.placeholder, props.style, caretHidden && styles.caretHidden];
      supportedProps.type = multiline ? void 0 : type;
      supportedProps.virtualkeyboardpolicy = showSoftInputOnFocus === false ? "manual" : "auto";
      var platformMethodsRef = (0, _usePlatformMethods.default)(supportedProps);
      var setRef2 = (0, _useMergeRefs.default)(hostRef, platformMethodsRef, imperativeRef, forwardedRef);
      supportedProps.ref = setRef2;
      var langDirection = props.lang != null ? (0, _useLocale.getLocaleDirection)(props.lang) : null;
      var componentDirection = props.dir || langDirection;
      var writingDirection = componentDirection || contextDirection;
      var element = (0, _createElement.default)(component, supportedProps, {
        writingDirection
      });
      return element;
    });
    TextInput.displayName = "TextInput";
    TextInput.State = _TextInputState.default;
    var styles = _StyleSheet.default.create({
      textinput$raw: {
        MozAppearance: "textfield",
        WebkitAppearance: "none",
        backgroundColor: "transparent",
        border: "0 solid black",
        borderRadius: 0,
        boxSizing: "border-box",
        font: "14px System",
        margin: 0,
        padding: 0,
        resize: "none"
      },
      placeholder: {
        placeholderTextColor: "var(--placeholderTextColor)"
      },
      caretHidden: {
        caretColor: "transparent"
      }
    });
    var _default = exports2.default = TextInput;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/vendor/react-native/PooledClass/index.js
var require_PooledClass = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/vendor/react-native/PooledClass/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _invariant = _interopRequireDefault(require_invariant());
    var twoArgumentPooler = /* @__PURE__ */ __name(function twoArgumentPooler2(a1, a2) {
      var Klass = this;
      if (Klass.instancePool.length) {
        var instance = Klass.instancePool.pop();
        Klass.call(instance, a1, a2);
        return instance;
      } else {
        return new Klass(a1, a2);
      }
    }, "twoArgumentPooler");
    var standardReleaser = /* @__PURE__ */ __name(function standardReleaser2(instance) {
      var Klass = this;
      instance.destructor();
      if (Klass.instancePool.length < Klass.poolSize) {
        Klass.instancePool.push(instance);
      }
    }, "standardReleaser");
    var DEFAULT_POOL_SIZE = 10;
    var DEFAULT_POOLER = twoArgumentPooler;
    var addPoolingTo = /* @__PURE__ */ __name(function addPoolingTo2(CopyConstructor, pooler) {
      var NewKlass = CopyConstructor;
      NewKlass.instancePool = [];
      NewKlass.getPooled = pooler || DEFAULT_POOLER;
      if (!NewKlass.poolSize) {
        NewKlass.poolSize = DEFAULT_POOL_SIZE;
      }
      NewKlass.release = standardReleaser;
      return NewKlass;
    }, "addPoolingTo");
    var PooledClass = {
      addPoolingTo,
      twoArgumentPooler
    };
    var _default = exports2.default = PooledClass;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Touchable/BoundingDimensions.js
var require_BoundingDimensions = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Touchable/BoundingDimensions.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _PooledClass = _interopRequireDefault(require_PooledClass());
    var twoArgumentPooler = _PooledClass.default.twoArgumentPooler;
    function BoundingDimensions(width, height) {
      this.width = width;
      this.height = height;
    }
    __name(BoundingDimensions, "BoundingDimensions");
    BoundingDimensions.prototype.destructor = function() {
      this.width = null;
      this.height = null;
    };
    BoundingDimensions.getPooledFromElement = function(element) {
      return BoundingDimensions.getPooled(element.offsetWidth, element.offsetHeight);
    };
    _PooledClass.default.addPoolingTo(BoundingDimensions, twoArgumentPooler);
    var _default = exports2.default = BoundingDimensions;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Touchable/Position.js
var require_Position = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Touchable/Position.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _PooledClass = _interopRequireDefault(require_PooledClass());
    var twoArgumentPooler = _PooledClass.default.twoArgumentPooler;
    function Position(left, top) {
      this.left = left;
      this.top = top;
    }
    __name(Position, "Position");
    Position.prototype.destructor = function() {
      this.left = null;
      this.top = null;
    };
    _PooledClass.default.addPoolingTo(Position, twoArgumentPooler);
    var _default = exports2.default = Position;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/Touchable/index.js
var require_Touchable = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/Touchable/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _objectSpread2 = _interopRequireDefault(require_objectSpread2());
    var _AccessibilityUtil = _interopRequireDefault(require_AccessibilityUtil());
    var _BoundingDimensions = _interopRequireDefault(require_BoundingDimensions());
    var _normalizeColors = _interopRequireDefault(require_normalize_colors());
    var _Position = _interopRequireDefault(require_Position());
    var _react = _interopRequireDefault(require("react"));
    var _UIManager = _interopRequireDefault(require_UIManager());
    var _View = _interopRequireDefault(require_View());
    var _warnOnce = require_warnOnce();
    var extractSingleTouch = /* @__PURE__ */ __name((nativeEvent) => {
      var touches = nativeEvent.touches;
      var changedTouches = nativeEvent.changedTouches;
      var hasTouches = touches && touches.length > 0;
      var hasChangedTouches = changedTouches && changedTouches.length > 0;
      return !hasTouches && hasChangedTouches ? changedTouches[0] : hasTouches ? touches[0] : nativeEvent;
    }, "extractSingleTouch");
    var States = {
      NOT_RESPONDER: "NOT_RESPONDER",
      // Not the responder
      RESPONDER_INACTIVE_PRESS_IN: "RESPONDER_INACTIVE_PRESS_IN",
      // Responder, inactive, in the `PressRect`
      RESPONDER_INACTIVE_PRESS_OUT: "RESPONDER_INACTIVE_PRESS_OUT",
      // Responder, inactive, out of `PressRect`
      RESPONDER_ACTIVE_PRESS_IN: "RESPONDER_ACTIVE_PRESS_IN",
      // Responder, active, in the `PressRect`
      RESPONDER_ACTIVE_PRESS_OUT: "RESPONDER_ACTIVE_PRESS_OUT",
      // Responder, active, out of `PressRect`
      RESPONDER_ACTIVE_LONG_PRESS_IN: "RESPONDER_ACTIVE_LONG_PRESS_IN",
      // Responder, active, in the `PressRect`, after long press threshold
      RESPONDER_ACTIVE_LONG_PRESS_OUT: "RESPONDER_ACTIVE_LONG_PRESS_OUT",
      // Responder, active, out of `PressRect`, after long press threshold
      ERROR: "ERROR"
    };
    var baseStatesConditions = {
      NOT_RESPONDER: false,
      RESPONDER_INACTIVE_PRESS_IN: false,
      RESPONDER_INACTIVE_PRESS_OUT: false,
      RESPONDER_ACTIVE_PRESS_IN: false,
      RESPONDER_ACTIVE_PRESS_OUT: false,
      RESPONDER_ACTIVE_LONG_PRESS_IN: false,
      RESPONDER_ACTIVE_LONG_PRESS_OUT: false,
      ERROR: false
    };
    var IsActive = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, baseStatesConditions), {}, {
      RESPONDER_ACTIVE_PRESS_OUT: true,
      RESPONDER_ACTIVE_PRESS_IN: true
    });
    var IsPressingIn = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, baseStatesConditions), {}, {
      RESPONDER_INACTIVE_PRESS_IN: true,
      RESPONDER_ACTIVE_PRESS_IN: true,
      RESPONDER_ACTIVE_LONG_PRESS_IN: true
    });
    var IsLongPressingIn = (0, _objectSpread2.default)((0, _objectSpread2.default)({}, baseStatesConditions), {}, {
      RESPONDER_ACTIVE_LONG_PRESS_IN: true
    });
    var Signals = {
      DELAY: "DELAY",
      RESPONDER_GRANT: "RESPONDER_GRANT",
      RESPONDER_RELEASE: "RESPONDER_RELEASE",
      RESPONDER_TERMINATED: "RESPONDER_TERMINATED",
      ENTER_PRESS_RECT: "ENTER_PRESS_RECT",
      LEAVE_PRESS_RECT: "LEAVE_PRESS_RECT",
      LONG_PRESS_DETECTED: "LONG_PRESS_DETECTED"
    };
    var Transitions = {
      NOT_RESPONDER: {
        DELAY: States.ERROR,
        RESPONDER_GRANT: States.RESPONDER_INACTIVE_PRESS_IN,
        RESPONDER_RELEASE: States.ERROR,
        RESPONDER_TERMINATED: States.ERROR,
        ENTER_PRESS_RECT: States.ERROR,
        LEAVE_PRESS_RECT: States.ERROR,
        LONG_PRESS_DETECTED: States.ERROR
      },
      RESPONDER_INACTIVE_PRESS_IN: {
        DELAY: States.RESPONDER_ACTIVE_PRESS_IN,
        RESPONDER_GRANT: States.ERROR,
        RESPONDER_RELEASE: States.NOT_RESPONDER,
        RESPONDER_TERMINATED: States.NOT_RESPONDER,
        ENTER_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_IN,
        LEAVE_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_OUT,
        LONG_PRESS_DETECTED: States.ERROR
      },
      RESPONDER_INACTIVE_PRESS_OUT: {
        DELAY: States.RESPONDER_ACTIVE_PRESS_OUT,
        RESPONDER_GRANT: States.ERROR,
        RESPONDER_RELEASE: States.NOT_RESPONDER,
        RESPONDER_TERMINATED: States.NOT_RESPONDER,
        ENTER_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_IN,
        LEAVE_PRESS_RECT: States.RESPONDER_INACTIVE_PRESS_OUT,
        LONG_PRESS_DETECTED: States.ERROR
      },
      RESPONDER_ACTIVE_PRESS_IN: {
        DELAY: States.ERROR,
        RESPONDER_GRANT: States.ERROR,
        RESPONDER_RELEASE: States.NOT_RESPONDER,
        RESPONDER_TERMINATED: States.NOT_RESPONDER,
        ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_IN,
        LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_OUT,
        LONG_PRESS_DETECTED: States.RESPONDER_ACTIVE_LONG_PRESS_IN
      },
      RESPONDER_ACTIVE_PRESS_OUT: {
        DELAY: States.ERROR,
        RESPONDER_GRANT: States.ERROR,
        RESPONDER_RELEASE: States.NOT_RESPONDER,
        RESPONDER_TERMINATED: States.NOT_RESPONDER,
        ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_IN,
        LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_PRESS_OUT,
        LONG_PRESS_DETECTED: States.ERROR
      },
      RESPONDER_ACTIVE_LONG_PRESS_IN: {
        DELAY: States.ERROR,
        RESPONDER_GRANT: States.ERROR,
        RESPONDER_RELEASE: States.NOT_RESPONDER,
        RESPONDER_TERMINATED: States.NOT_RESPONDER,
        ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_IN,
        LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_OUT,
        LONG_PRESS_DETECTED: States.RESPONDER_ACTIVE_LONG_PRESS_IN
      },
      RESPONDER_ACTIVE_LONG_PRESS_OUT: {
        DELAY: States.ERROR,
        RESPONDER_GRANT: States.ERROR,
        RESPONDER_RELEASE: States.NOT_RESPONDER,
        RESPONDER_TERMINATED: States.NOT_RESPONDER,
        ENTER_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_IN,
        LEAVE_PRESS_RECT: States.RESPONDER_ACTIVE_LONG_PRESS_OUT,
        LONG_PRESS_DETECTED: States.ERROR
      },
      error: {
        DELAY: States.NOT_RESPONDER,
        RESPONDER_GRANT: States.RESPONDER_INACTIVE_PRESS_IN,
        RESPONDER_RELEASE: States.NOT_RESPONDER,
        RESPONDER_TERMINATED: States.NOT_RESPONDER,
        ENTER_PRESS_RECT: States.NOT_RESPONDER,
        LEAVE_PRESS_RECT: States.NOT_RESPONDER,
        LONG_PRESS_DETECTED: States.NOT_RESPONDER
      }
    };
    var HIGHLIGHT_DELAY_MS = 130;
    var PRESS_EXPAND_PX = 20;
    var LONG_PRESS_THRESHOLD = 500;
    var LONG_PRESS_DELAY_MS = LONG_PRESS_THRESHOLD - HIGHLIGHT_DELAY_MS;
    var LONG_PRESS_ALLOWED_MOVEMENT = 10;
    var TouchableMixin = {
      // HACK (part 1): basic support for touchable interactions using a keyboard
      componentDidMount: /* @__PURE__ */ __name(function componentDidMount() {
        (0, _warnOnce.warnOnce)("TouchableMixin", "TouchableMixin is deprecated. Please use Pressable.");
        var touchableNode = this.getTouchableNode && this.getTouchableNode();
        if (touchableNode && touchableNode.addEventListener) {
          this._touchableBlurListener = (e) => {
            if (this._isTouchableKeyboardActive) {
              if (this.state.touchable.touchState && this.state.touchable.touchState !== States.NOT_RESPONDER) {
                this.touchableHandleResponderTerminate({
                  nativeEvent: e
                });
              }
              this._isTouchableKeyboardActive = false;
            }
          };
          touchableNode.addEventListener("blur", this._touchableBlurListener);
        }
      }, "componentDidMount"),
      /**
       * Clear all timeouts on unmount
       */
      componentWillUnmount: /* @__PURE__ */ __name(function componentWillUnmount() {
        var touchableNode = this.getTouchableNode && this.getTouchableNode();
        if (touchableNode && touchableNode.addEventListener) {
          touchableNode.removeEventListener("blur", this._touchableBlurListener);
        }
        this.touchableDelayTimeout && clearTimeout(this.touchableDelayTimeout);
        this.longPressDelayTimeout && clearTimeout(this.longPressDelayTimeout);
        this.pressOutDelayTimeout && clearTimeout(this.pressOutDelayTimeout);
        this.pressInLocation = null;
        this.state.touchable.responderID = null;
      }, "componentWillUnmount"),
      /**
       * It's prefer that mixins determine state in this way, having the class
       * explicitly mix the state in the one and only `getInitialState` method.
       *
       * @return {object} State object to be placed inside of
       * `this.state.touchable`.
       */
      touchableGetInitialState: /* @__PURE__ */ __name(function touchableGetInitialState() {
        return {
          touchable: {
            touchState: void 0,
            responderID: null
          }
        };
      }, "touchableGetInitialState"),
      // ==== Hooks to Gesture Responder system ====
      /**
       * Must return true if embedded in a native platform scroll view.
       */
      touchableHandleResponderTerminationRequest: /* @__PURE__ */ __name(function touchableHandleResponderTerminationRequest() {
        return !this.props.rejectResponderTermination;
      }, "touchableHandleResponderTerminationRequest"),
      /**
       * Must return true to start the process of `Touchable`.
       */
      touchableHandleStartShouldSetResponder: /* @__PURE__ */ __name(function touchableHandleStartShouldSetResponder() {
        return !this.props.disabled;
      }, "touchableHandleStartShouldSetResponder"),
      /**
       * Return true to cancel press on long press.
       */
      touchableLongPressCancelsPress: /* @__PURE__ */ __name(function touchableLongPressCancelsPress() {
        return true;
      }, "touchableLongPressCancelsPress"),
      /**
       * Place as callback for a DOM element's `onResponderGrant` event.
       * @param {SyntheticEvent} e Synthetic event from event system.
       *
       */
      touchableHandleResponderGrant: /* @__PURE__ */ __name(function touchableHandleResponderGrant(e) {
        var dispatchID = e.currentTarget;
        e.persist();
        this.pressOutDelayTimeout && clearTimeout(this.pressOutDelayTimeout);
        this.pressOutDelayTimeout = null;
        this.state.touchable.touchState = States.NOT_RESPONDER;
        this.state.touchable.responderID = dispatchID;
        this._receiveSignal(Signals.RESPONDER_GRANT, e);
        var delayMS = this.touchableGetHighlightDelayMS !== void 0 ? Math.max(this.touchableGetHighlightDelayMS(), 0) : HIGHLIGHT_DELAY_MS;
        delayMS = isNaN(delayMS) ? HIGHLIGHT_DELAY_MS : delayMS;
        if (delayMS !== 0) {
          this.touchableDelayTimeout = setTimeout(this._handleDelay.bind(this, e), delayMS);
        } else {
          this._handleDelay(e);
        }
        var longDelayMS = this.touchableGetLongPressDelayMS !== void 0 ? Math.max(this.touchableGetLongPressDelayMS(), 10) : LONG_PRESS_DELAY_MS;
        longDelayMS = isNaN(longDelayMS) ? LONG_PRESS_DELAY_MS : longDelayMS;
        this.longPressDelayTimeout = setTimeout(this._handleLongDelay.bind(this, e), longDelayMS + delayMS);
      }, "touchableHandleResponderGrant"),
      /**
       * Place as callback for a DOM element's `onResponderRelease` event.
       */
      touchableHandleResponderRelease: /* @__PURE__ */ __name(function touchableHandleResponderRelease(e) {
        this.pressInLocation = null;
        this._receiveSignal(Signals.RESPONDER_RELEASE, e);
      }, "touchableHandleResponderRelease"),
      /**
       * Place as callback for a DOM element's `onResponderTerminate` event.
       */
      touchableHandleResponderTerminate: /* @__PURE__ */ __name(function touchableHandleResponderTerminate(e) {
        this.pressInLocation = null;
        this._receiveSignal(Signals.RESPONDER_TERMINATED, e);
      }, "touchableHandleResponderTerminate"),
      /**
       * Place as callback for a DOM element's `onResponderMove` event.
       */
      touchableHandleResponderMove: /* @__PURE__ */ __name(function touchableHandleResponderMove(e) {
        if (!this.state.touchable.positionOnActivate) {
          return;
        }
        var positionOnActivate = this.state.touchable.positionOnActivate;
        var dimensionsOnActivate = this.state.touchable.dimensionsOnActivate;
        var pressRectOffset = this.touchableGetPressRectOffset ? this.touchableGetPressRectOffset() : {
          left: PRESS_EXPAND_PX,
          right: PRESS_EXPAND_PX,
          top: PRESS_EXPAND_PX,
          bottom: PRESS_EXPAND_PX
        };
        var pressExpandLeft = pressRectOffset.left;
        var pressExpandTop = pressRectOffset.top;
        var pressExpandRight = pressRectOffset.right;
        var pressExpandBottom = pressRectOffset.bottom;
        var hitSlop = this.touchableGetHitSlop ? this.touchableGetHitSlop() : null;
        if (hitSlop) {
          pressExpandLeft += hitSlop.left || 0;
          pressExpandTop += hitSlop.top || 0;
          pressExpandRight += hitSlop.right || 0;
          pressExpandBottom += hitSlop.bottom || 0;
        }
        var touch = extractSingleTouch(e.nativeEvent);
        var pageX = touch && touch.pageX;
        var pageY = touch && touch.pageY;
        if (this.pressInLocation) {
          var movedDistance = this._getDistanceBetweenPoints(pageX, pageY, this.pressInLocation.pageX, this.pressInLocation.pageY);
          if (movedDistance > LONG_PRESS_ALLOWED_MOVEMENT) {
            this._cancelLongPressDelayTimeout();
          }
        }
        var isTouchWithinActive = pageX > positionOnActivate.left - pressExpandLeft && pageY > positionOnActivate.top - pressExpandTop && pageX < positionOnActivate.left + dimensionsOnActivate.width + pressExpandRight && pageY < positionOnActivate.top + dimensionsOnActivate.height + pressExpandBottom;
        if (isTouchWithinActive) {
          var prevState = this.state.touchable.touchState;
          this._receiveSignal(Signals.ENTER_PRESS_RECT, e);
          var curState = this.state.touchable.touchState;
          if (curState === States.RESPONDER_INACTIVE_PRESS_IN && prevState !== States.RESPONDER_INACTIVE_PRESS_IN) {
            this._cancelLongPressDelayTimeout();
          }
        } else {
          this._cancelLongPressDelayTimeout();
          this._receiveSignal(Signals.LEAVE_PRESS_RECT, e);
        }
      }, "touchableHandleResponderMove"),
      /**
       * Invoked when the item receives focus. Mixers might override this to
       * visually distinguish the `VisualRect` so that the user knows that it
       * currently has the focus. Most platforms only support a single element being
       * focused at a time, in which case there may have been a previously focused
       * element that was blurred just prior to this. This can be overridden when
       * using `Touchable.Mixin.withoutDefaultFocusAndBlur`.
       */
      touchableHandleFocus: /* @__PURE__ */ __name(function touchableHandleFocus2(e) {
        this.props.onFocus && this.props.onFocus(e);
      }, "touchableHandleFocus"),
      /**
       * Invoked when the item loses focus. Mixers might override this to
       * visually distinguish the `VisualRect` so that the user knows that it
       * no longer has focus. Most platforms only support a single element being
       * focused at a time, in which case the focus may have moved to another.
       * This can be overridden when using
       * `Touchable.Mixin.withoutDefaultFocusAndBlur`.
       */
      touchableHandleBlur: /* @__PURE__ */ __name(function touchableHandleBlur2(e) {
        this.props.onBlur && this.props.onBlur(e);
      }, "touchableHandleBlur"),
      // ==== Abstract Application Callbacks ====
      /**
       * Invoked when the item should be highlighted. Mixers should implement this
       * to visually distinguish the `VisualRect` so that the user knows that
       * releasing a touch will result in a "selection" (analog to click).
       *
       * @abstract
       * touchableHandleActivePressIn: function,
       */
      /**
       * Invoked when the item is "active" (in that it is still eligible to become
       * a "select") but the touch has left the `PressRect`. Usually the mixer will
       * want to unhighlight the `VisualRect`. If the user (while pressing) moves
       * back into the `PressRect` `touchableHandleActivePressIn` will be invoked
       * again and the mixer should probably highlight the `VisualRect` again. This
       * event will not fire on an `touchEnd/mouseUp` event, only move events while
       * the user is depressing the mouse/touch.
       *
       * @abstract
       * touchableHandleActivePressOut: function
       */
      /**
       * Invoked when the item is "selected" - meaning the interaction ended by
       * letting up while the item was either in the state
       * `RESPONDER_ACTIVE_PRESS_IN` or `RESPONDER_INACTIVE_PRESS_IN`.
       *
       * @abstract
       * touchableHandlePress: function
       */
      /**
       * Invoked when the item is long pressed - meaning the interaction ended by
       * letting up while the item was in `RESPONDER_ACTIVE_LONG_PRESS_IN`. If
       * `touchableHandleLongPress` is *not* provided, `touchableHandlePress` will
       * be called as it normally is. If `touchableHandleLongPress` is provided, by
       * default any `touchableHandlePress` callback will not be invoked. To
       * override this default behavior, override `touchableLongPressCancelsPress`
       * to return false. As a result, `touchableHandlePress` will be called when
       * lifting up, even if `touchableHandleLongPress` has also been called.
       *
       * @abstract
       * touchableHandleLongPress: function
       */
      /**
       * Returns the number of millis to wait before triggering a highlight.
       *
       * @abstract
       * touchableGetHighlightDelayMS: function
       */
      /**
       * Returns the amount to extend the `HitRect` into the `PressRect`. Positive
       * numbers mean the size expands outwards.
       *
       * @abstract
       * touchableGetPressRectOffset: function
       */
      // ==== Internal Logic ====
      /**
       * Measures the `HitRect` node on activation. The Bounding rectangle is with
       * respect to viewport - not page, so adding the `pageXOffset/pageYOffset`
       * should result in points that are in the same coordinate system as an
       * event's `globalX/globalY` data values.
       *
       * - Consider caching this for the lifetime of the component, or possibly
       *   being able to share this cache between any `ScrollMap` view.
       *
       * @sideeffects
       * @private
       */
      _remeasureMetricsOnActivation: /* @__PURE__ */ __name(function _remeasureMetricsOnActivation() {
        var tag = this.state.touchable.responderID;
        if (tag == null) {
          return;
        }
        _UIManager.default.measure(tag, this._handleQueryLayout);
      }, "_remeasureMetricsOnActivation"),
      _handleQueryLayout: /* @__PURE__ */ __name(function _handleQueryLayout(l, t, w, h, globalX, globalY) {
        if (!l && !t && !w && !h && !globalX && !globalY) {
          return;
        }
        this.state.touchable.positionOnActivate && _Position.default.release(this.state.touchable.positionOnActivate);
        this.state.touchable.dimensionsOnActivate && // $FlowFixMe
        _BoundingDimensions.default.release(this.state.touchable.dimensionsOnActivate);
        this.state.touchable.positionOnActivate = _Position.default.getPooled(globalX, globalY);
        this.state.touchable.dimensionsOnActivate = _BoundingDimensions.default.getPooled(w, h);
      }, "_handleQueryLayout"),
      _handleDelay: /* @__PURE__ */ __name(function _handleDelay(e) {
        this.touchableDelayTimeout = null;
        this._receiveSignal(Signals.DELAY, e);
      }, "_handleDelay"),
      _handleLongDelay: /* @__PURE__ */ __name(function _handleLongDelay(e) {
        this.longPressDelayTimeout = null;
        var curState = this.state.touchable.touchState;
        if (curState !== States.RESPONDER_ACTIVE_PRESS_IN && curState !== States.RESPONDER_ACTIVE_LONG_PRESS_IN) {
          console.error("Attempted to transition from state `" + curState + "` to `" + States.RESPONDER_ACTIVE_LONG_PRESS_IN + "`, which is not supported. This is most likely due to `Touchable.longPressDelayTimeout` not being cancelled.");
        } else {
          this._receiveSignal(Signals.LONG_PRESS_DETECTED, e);
        }
      }, "_handleLongDelay"),
      /**
       * Receives a state machine signal, performs side effects of the transition
       * and stores the new state. Validates the transition as well.
       *
       * @param {Signals} signal State machine signal.
       * @throws Error if invalid state transition or unrecognized signal.
       * @sideeffects
       */
      _receiveSignal: /* @__PURE__ */ __name(function _receiveSignal(signal, e) {
        var responderID = this.state.touchable.responderID;
        var curState = this.state.touchable.touchState;
        var nextState = Transitions[curState] && Transitions[curState][signal];
        if (!responderID && signal === Signals.RESPONDER_RELEASE) {
          return;
        }
        if (!nextState) {
          throw new Error("Unrecognized signal `" + signal + "` or state `" + curState + "` for Touchable responder `" + responderID + "`");
        }
        if (nextState === States.ERROR) {
          throw new Error("Touchable cannot transition from `" + curState + "` to `" + signal + "` for responder `" + responderID + "`");
        }
        if (curState !== nextState) {
          this._performSideEffectsForTransition(curState, nextState, signal, e);
          this.state.touchable.touchState = nextState;
        }
      }, "_receiveSignal"),
      _cancelLongPressDelayTimeout: /* @__PURE__ */ __name(function _cancelLongPressDelayTimeout() {
        this.longPressDelayTimeout && clearTimeout(this.longPressDelayTimeout);
        this.longPressDelayTimeout = null;
      }, "_cancelLongPressDelayTimeout"),
      _isHighlight: /* @__PURE__ */ __name(function _isHighlight(state) {
        return state === States.RESPONDER_ACTIVE_PRESS_IN || state === States.RESPONDER_ACTIVE_LONG_PRESS_IN;
      }, "_isHighlight"),
      _savePressInLocation: /* @__PURE__ */ __name(function _savePressInLocation(e) {
        var touch = extractSingleTouch(e.nativeEvent);
        var pageX = touch && touch.pageX;
        var pageY = touch && touch.pageY;
        var locationX = touch && touch.locationX;
        var locationY = touch && touch.locationY;
        this.pressInLocation = {
          pageX,
          pageY,
          locationX,
          locationY
        };
      }, "_savePressInLocation"),
      _getDistanceBetweenPoints: /* @__PURE__ */ __name(function _getDistanceBetweenPoints(aX, aY, bX, bY) {
        var deltaX = aX - bX;
        var deltaY = aY - bY;
        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      }, "_getDistanceBetweenPoints"),
      /**
       * Will perform a transition between touchable states, and identify any
       * highlighting or unhighlighting that must be performed for this particular
       * transition.
       *
       * @param {States} curState Current Touchable state.
       * @param {States} nextState Next Touchable state.
       * @param {Signal} signal Signal that triggered the transition.
       * @param {Event} e Native event.
       * @sideeffects
       */
      _performSideEffectsForTransition: /* @__PURE__ */ __name(function _performSideEffectsForTransition(curState, nextState, signal, e) {
        var curIsHighlight = this._isHighlight(curState);
        var newIsHighlight = this._isHighlight(nextState);
        var isFinalSignal = signal === Signals.RESPONDER_TERMINATED || signal === Signals.RESPONDER_RELEASE;
        if (isFinalSignal) {
          this._cancelLongPressDelayTimeout();
        }
        var isInitialTransition = curState === States.NOT_RESPONDER && nextState === States.RESPONDER_INACTIVE_PRESS_IN;
        var isActiveTransition = !IsActive[curState] && IsActive[nextState];
        if (isInitialTransition || isActiveTransition) {
          this._remeasureMetricsOnActivation();
        }
        if (IsPressingIn[curState] && signal === Signals.LONG_PRESS_DETECTED) {
          this.touchableHandleLongPress && this.touchableHandleLongPress(e);
        }
        if (newIsHighlight && !curIsHighlight) {
          this._startHighlight(e);
        } else if (!newIsHighlight && curIsHighlight) {
          this._endHighlight(e);
        }
        if (IsPressingIn[curState] && signal === Signals.RESPONDER_RELEASE) {
          var hasLongPressHandler = !!this.props.onLongPress;
          var pressIsLongButStillCallOnPress = IsLongPressingIn[curState] && // We *are* long pressing.. // But either has no long handler
          (!hasLongPressHandler || !this.touchableLongPressCancelsPress());
          var shouldInvokePress = !IsLongPressingIn[curState] || pressIsLongButStillCallOnPress;
          if (shouldInvokePress && this.touchableHandlePress) {
            if (!newIsHighlight && !curIsHighlight) {
              this._startHighlight(e);
              this._endHighlight(e);
            }
            this.touchableHandlePress(e);
          }
        }
        this.touchableDelayTimeout && clearTimeout(this.touchableDelayTimeout);
        this.touchableDelayTimeout = null;
      }, "_performSideEffectsForTransition"),
      _playTouchSound: /* @__PURE__ */ __name(function _playTouchSound() {
        _UIManager.default.playTouchSound();
      }, "_playTouchSound"),
      _startHighlight: /* @__PURE__ */ __name(function _startHighlight(e) {
        this._savePressInLocation(e);
        this.touchableHandleActivePressIn && this.touchableHandleActivePressIn(e);
      }, "_startHighlight"),
      _endHighlight: /* @__PURE__ */ __name(function _endHighlight(e) {
        if (this.touchableHandleActivePressOut) {
          if (this.touchableGetPressOutDelayMS && this.touchableGetPressOutDelayMS()) {
            this.pressOutDelayTimeout = setTimeout(() => {
              this.touchableHandleActivePressOut(e);
            }, this.touchableGetPressOutDelayMS());
          } else {
            this.touchableHandleActivePressOut(e);
          }
        }
      }, "_endHighlight"),
      // HACK (part 2): basic support for touchable interactions using a keyboard (including
      // delays and longPress)
      touchableHandleKeyEvent: /* @__PURE__ */ __name(function touchableHandleKeyEvent(e) {
        var type = e.type, key = e.key;
        if (key === "Enter" || key === " ") {
          if (type === "keydown") {
            if (!this._isTouchableKeyboardActive) {
              if (!this.state.touchable.touchState || this.state.touchable.touchState === States.NOT_RESPONDER) {
                this.touchableHandleResponderGrant(e);
                this._isTouchableKeyboardActive = true;
              }
            }
          } else if (type === "keyup") {
            if (this._isTouchableKeyboardActive) {
              if (this.state.touchable.touchState && this.state.touchable.touchState !== States.NOT_RESPONDER) {
                this.touchableHandleResponderRelease(e);
                this._isTouchableKeyboardActive = false;
              }
            }
          }
          e.stopPropagation();
          if (!(key === "Enter" && _AccessibilityUtil.default.propsToAriaRole(this.props) === "link")) {
            e.preventDefault();
          }
        }
      }, "touchableHandleKeyEvent"),
      withoutDefaultFocusAndBlur: {}
    };
    var touchableHandleFocus = TouchableMixin.touchableHandleFocus;
    var touchableHandleBlur = TouchableMixin.touchableHandleBlur;
    var TouchableMixinWithoutDefaultFocusAndBlur = (0, _objectWithoutPropertiesLoose2.default)(TouchableMixin, ["touchableHandleFocus", "touchableHandleBlur"]);
    TouchableMixin.withoutDefaultFocusAndBlur = TouchableMixinWithoutDefaultFocusAndBlur;
    var Touchable = {
      Mixin: TouchableMixin,
      TOUCH_TARGET_DEBUG: false,
      // Highlights all touchable targets. Toggle with Inspector.
      /**
       * Renders a debugging overlay to visualize touch target with hitSlop (might not work on Android).
       */
      renderDebugView: /* @__PURE__ */ __name((_ref) => {
        var color = _ref.color, hitSlop = _ref.hitSlop;
        if (!Touchable.TOUCH_TARGET_DEBUG) {
          return null;
        }
        if (process.env.NODE_ENV !== "production") {
          throw Error("Touchable.TOUCH_TARGET_DEBUG should not be enabled in prod!");
        }
        var debugHitSlopStyle = {};
        hitSlop = hitSlop || {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        };
        for (var key in hitSlop) {
          debugHitSlopStyle[key] = -hitSlop[key];
        }
        var normalizedColor = (0, _normalizeColors.default)(color);
        if (typeof normalizedColor !== "number") {
          return null;
        }
        var hexColor = "#" + ("00000000" + normalizedColor.toString(16)).substr(-8);
        return /* @__PURE__ */ _react.default.createElement(_View.default, {
          pointerEvents: "none",
          style: (0, _objectSpread2.default)({
            position: "absolute",
            borderColor: hexColor.slice(0, -2) + "55",
            // More opaque
            borderWidth: 1,
            borderStyle: "dashed",
            backgroundColor: hexColor.slice(0, -2) + "0F"
          }, debugHitSlopStyle)
        });
      }, "renderDebugView")
    };
    var _default = exports2.default = Touchable;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/TouchableHighlight/index.js
var require_TouchableHighlight = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/TouchableHighlight/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _react = _interopRequireWildcard(require("react"));
    var React24 = _react;
    var _useMergeRefs = _interopRequireDefault(require_useMergeRefs());
    var _usePressEvents = _interopRequireDefault(require_usePressEvents());
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    var _View = _interopRequireDefault(require_View());
    var _excluded = ["activeOpacity", "children", "delayPressIn", "delayPressOut", "delayLongPress", "disabled", "focusable", "onHideUnderlay", "onLongPress", "onPress", "onPressIn", "onPressOut", "onShowUnderlay", "rejectResponderTermination", "style", "testOnly_pressed", "underlayColor"];
    function createExtraStyles(activeOpacity, underlayColor) {
      return {
        child: {
          opacity: activeOpacity !== null && activeOpacity !== void 0 ? activeOpacity : 0.85
        },
        underlay: {
          backgroundColor: underlayColor === void 0 ? "black" : underlayColor
        }
      };
    }
    __name(createExtraStyles, "createExtraStyles");
    function hasPressHandler(props) {
      return props.onPress != null || props.onPressIn != null || props.onPressOut != null || props.onLongPress != null;
    }
    __name(hasPressHandler, "hasPressHandler");
    function TouchableHighlight(props, forwardedRef) {
      var activeOpacity = props.activeOpacity, children = props.children, delayPressIn = props.delayPressIn, delayPressOut = props.delayPressOut, delayLongPress = props.delayLongPress, disabled = props.disabled, focusable = props.focusable, onHideUnderlay = props.onHideUnderlay, onLongPress = props.onLongPress, onPress = props.onPress, onPressIn = props.onPressIn, onPressOut = props.onPressOut, onShowUnderlay = props.onShowUnderlay, rejectResponderTermination = props.rejectResponderTermination, style = props.style, testOnly_pressed = props.testOnly_pressed, underlayColor = props.underlayColor, rest = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
      var hostRef = (0, _react.useRef)(null);
      var setRef2 = (0, _useMergeRefs.default)(forwardedRef, hostRef);
      var _useState = (0, _react.useState)(testOnly_pressed === true ? createExtraStyles(activeOpacity, underlayColor) : null), extraStyles = _useState[0], setExtraStyles = _useState[1];
      var showUnderlay = (0, _react.useCallback)(() => {
        if (!hasPressHandler(props)) {
          return;
        }
        setExtraStyles(createExtraStyles(activeOpacity, underlayColor));
        if (onShowUnderlay != null) {
          onShowUnderlay();
        }
      }, [activeOpacity, onShowUnderlay, props, underlayColor]);
      var hideUnderlay = (0, _react.useCallback)(() => {
        if (testOnly_pressed === true) {
          return;
        }
        if (hasPressHandler(props)) {
          setExtraStyles(null);
          if (onHideUnderlay != null) {
            onHideUnderlay();
          }
        }
      }, [onHideUnderlay, props, testOnly_pressed]);
      var pressConfig = (0, _react.useMemo)(() => ({
        cancelable: !rejectResponderTermination,
        disabled,
        delayLongPress,
        delayPressStart: delayPressIn,
        delayPressEnd: delayPressOut,
        onLongPress,
        onPress,
        onPressStart(event) {
          showUnderlay();
          if (onPressIn != null) {
            onPressIn(event);
          }
        },
        onPressEnd(event) {
          hideUnderlay();
          if (onPressOut != null) {
            onPressOut(event);
          }
        }
      }), [delayLongPress, delayPressIn, delayPressOut, disabled, onLongPress, onPress, onPressIn, onPressOut, rejectResponderTermination, showUnderlay, hideUnderlay]);
      var pressEventHandlers = (0, _usePressEvents.default)(hostRef, pressConfig);
      var child = React24.Children.only(children);
      return /* @__PURE__ */ React24.createElement(_View.default, (0, _extends2.default)({}, rest, pressEventHandlers, {
        accessibilityDisabled: disabled,
        focusable: !disabled && focusable !== false,
        pointerEvents: disabled ? "box-none" : void 0,
        ref: setRef2,
        style: [styles.root, style, !disabled && styles.actionable, extraStyles && extraStyles.underlay]
      }), /* @__PURE__ */ React24.cloneElement(child, {
        style: [child.props.style, extraStyles && extraStyles.child]
      }));
    }
    __name(TouchableHighlight, "TouchableHighlight");
    var styles = _StyleSheet.default.create({
      root: {
        userSelect: "none"
      },
      actionable: {
        cursor: "pointer",
        touchAction: "manipulation"
      }
    });
    var MemoedTouchableHighlight = /* @__PURE__ */ React24.memo(/* @__PURE__ */ React24.forwardRef(TouchableHighlight));
    MemoedTouchableHighlight.displayName = "TouchableHighlight";
    var _default = exports2.default = MemoedTouchableHighlight;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/modules/UnimplementedView/index.js
var require_UnimplementedView = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/modules/UnimplementedView/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _extends2 = _interopRequireDefault(require_extends());
    var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require_objectWithoutPropertiesLoose());
    var _View = _interopRequireDefault(require_View());
    var _react = _interopRequireDefault(require("react"));
    var _excluded = ["style"];
    function UnimplementedView(_ref) {
      var style = _ref.style, props = (0, _objectWithoutPropertiesLoose2.default)(_ref, _excluded);
      return /* @__PURE__ */ _react.default.createElement(_View.default, (0, _extends2.default)({}, props, {
        style: [unimplementedViewStyles, style]
      }));
    }
    __name(UnimplementedView, "UnimplementedView");
    var unimplementedViewStyles = process.env.NODE_ENV !== "production" ? {
      alignSelf: "flex-start",
      borderColor: "red",
      borderWidth: 1
    } : {};
    var _default = exports2.default = UnimplementedView;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/TouchableNativeFeedback/index.js
var require_TouchableNativeFeedback = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/TouchableNativeFeedback/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _UnimplementedView = _interopRequireDefault(require_UnimplementedView());
    var _default = exports2.default = _UnimplementedView.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/TouchableWithoutFeedback/index.js
var require_TouchableWithoutFeedback = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/TouchableWithoutFeedback/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _react = _interopRequireWildcard(require("react"));
    var React24 = _react;
    var _pick = _interopRequireDefault(require_pick());
    var _useMergeRefs = _interopRequireDefault(require_useMergeRefs());
    var _usePressEvents = _interopRequireDefault(require_usePressEvents());
    var _warnOnce = require_warnOnce();
    var forwardPropsList = {
      accessibilityDisabled: true,
      accessibilityLabel: true,
      accessibilityLiveRegion: true,
      accessibilityRole: true,
      accessibilityState: true,
      accessibilityValue: true,
      children: true,
      disabled: true,
      focusable: true,
      nativeID: true,
      onBlur: true,
      onFocus: true,
      onLayout: true,
      testID: true
    };
    var pickProps = /* @__PURE__ */ __name((props) => (0, _pick.default)(props, forwardPropsList), "pickProps");
    function TouchableWithoutFeedback(props, forwardedRef) {
      (0, _warnOnce.warnOnce)("TouchableWithoutFeedback", "TouchableWithoutFeedback is deprecated. Please use Pressable.");
      var delayPressIn = props.delayPressIn, delayPressOut = props.delayPressOut, delayLongPress = props.delayLongPress, disabled = props.disabled, focusable = props.focusable, onLongPress = props.onLongPress, onPress = props.onPress, onPressIn = props.onPressIn, onPressOut = props.onPressOut, rejectResponderTermination = props.rejectResponderTermination;
      var hostRef = (0, _react.useRef)(null);
      var pressConfig = (0, _react.useMemo)(() => ({
        cancelable: !rejectResponderTermination,
        disabled,
        delayLongPress,
        delayPressStart: delayPressIn,
        delayPressEnd: delayPressOut,
        onLongPress,
        onPress,
        onPressStart: onPressIn,
        onPressEnd: onPressOut
      }), [disabled, delayPressIn, delayPressOut, delayLongPress, onLongPress, onPress, onPressIn, onPressOut, rejectResponderTermination]);
      var pressEventHandlers = (0, _usePressEvents.default)(hostRef, pressConfig);
      var element = React24.Children.only(props.children);
      var children = [element.props.children];
      var supportedProps = pickProps(props);
      supportedProps.accessibilityDisabled = disabled;
      supportedProps.focusable = !disabled && focusable !== false;
      supportedProps.ref = (0, _useMergeRefs.default)(forwardedRef, hostRef, element.ref);
      var elementProps = Object.assign(supportedProps, pressEventHandlers);
      return /* @__PURE__ */ React24.cloneElement(element, elementProps, ...children);
    }
    __name(TouchableWithoutFeedback, "TouchableWithoutFeedback");
    var MemoedTouchableWithoutFeedback = /* @__PURE__ */ React24.memo(/* @__PURE__ */ React24.forwardRef(TouchableWithoutFeedback));
    MemoedTouchableWithoutFeedback.displayName = "TouchableWithoutFeedback";
    var _default = exports2.default = MemoedTouchableWithoutFeedback;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/VirtualizedList/index.js
var require_VirtualizedList2 = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/VirtualizedList/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _VirtualizedList = _interopRequireDefault(require_VirtualizedList());
    var _default = exports2.default = _VirtualizedList.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/YellowBox/index.js
var require_YellowBox = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/YellowBox/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _react = _interopRequireDefault(require("react"));
    var _UnimplementedView = _interopRequireDefault(require_UnimplementedView());
    function YellowBox(props) {
      return /* @__PURE__ */ _react.default.createElement(_UnimplementedView.default, props);
    }
    __name(YellowBox, "YellowBox");
    YellowBox.ignoreWarnings = () => {
    };
    var _default = exports2.default = YellowBox;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/LogBox/index.js
var require_LogBox = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/LogBox/index.js"(exports2, module2) {
    "use strict";
    exports2.__esModule = true;
    exports2.default = void 0;
    var LogBox = {
      ignoreLogs() {
      },
      ignoreAllLogs() {
      },
      uninstall() {
      },
      install() {
      }
    };
    var _default = exports2.default = LogBox;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/DeviceEventEmitter/index.js
var require_DeviceEventEmitter = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/DeviceEventEmitter/index.js"(exports2, module2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = void 0;
    var _RCTDeviceEventEmitter = _interopRequireDefault(require_RCTDeviceEventEmitter());
    var _default = exports2.default = _RCTDeviceEventEmitter.default;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/useColorScheme/index.js
var require_useColorScheme = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/useColorScheme/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    var _interopRequireWildcard = require_interopRequireWildcard().default;
    exports2.__esModule = true;
    exports2.default = useColorScheme;
    var React24 = _interopRequireWildcard(require("react"));
    var _Appearance = _interopRequireDefault(require_Appearance());
    function useColorScheme() {
      var _React$useState = React24.useState(_Appearance.default.getColorScheme()), colorScheme = _React$useState[0], setColorScheme = _React$useState[1];
      React24.useEffect(() => {
        function listener(appearance) {
          setColorScheme(appearance.colorScheme);
        }
        __name(listener, "listener");
        var _Appearance$addChange = _Appearance.default.addChangeListener(listener), remove = _Appearance$addChange.remove;
        return remove;
      });
      return colorScheme;
    }
    __name(useColorScheme, "useColorScheme");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/useLocaleContext/index.js
var require_useLocaleContext = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/useLocaleContext/index.js"(exports2, module2) {
    "use strict";
    "use client";
    exports2.__esModule = true;
    exports2.default = void 0;
    var _useLocale = require_useLocale();
    var _default = exports2.default = _useLocale.useLocaleContext;
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/exports/useWindowDimensions/index.js
var require_useWindowDimensions = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/exports/useWindowDimensions/index.js"(exports2, module2) {
    "use strict";
    "use client";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.default = useWindowDimensions;
    var _Dimensions = _interopRequireDefault(require_Dimensions());
    var _react = require("react");
    function useWindowDimensions() {
      var _useState = (0, _react.useState)(() => _Dimensions.default.get("window")), dims = _useState[0], setDims = _useState[1];
      (0, _react.useEffect)(() => {
        function handleChange(_ref) {
          var window2 = _ref.window;
          if (window2 != null) {
            setDims(window2);
          }
        }
        __name(handleChange, "handleChange");
        _Dimensions.default.addEventListener("change", handleChange);
        setDims(_Dimensions.default.get("window"));
        return () => {
          _Dimensions.default.removeEventListener("change", handleChange);
        };
      }, []);
      return dims;
    }
    __name(useWindowDimensions, "useWindowDimensions");
    module2.exports = exports2.default;
  }
});

// ../../node_modules/react-native-web/dist/cjs/index.js
var require_cjs = __commonJS({
  "../../node_modules/react-native-web/dist/cjs/index.js"(exports2) {
    "use strict";
    var _interopRequireDefault = require_interopRequireDefault().default;
    exports2.__esModule = true;
    exports2.useWindowDimensions = exports2.useLocaleContext = exports2.useColorScheme = exports2.unstable_createElement = exports2.unmountComponentAtNode = exports2.render = exports2.processColor = exports2.findNodeHandle = exports2.YellowBox = exports2.VirtualizedList = exports2.View = exports2.Vibration = exports2.UIManager = exports2.TouchableWithoutFeedback = exports2.TouchableOpacity = exports2.TouchableNativeFeedback = exports2.TouchableHighlight = exports2.Touchable = exports2.TextInput = exports2.Text = exports2.Switch = exports2.StyleSheet = exports2.StatusBar = exports2.Share = exports2.SectionList = exports2.ScrollView = exports2.SafeAreaView = exports2.RefreshControl = exports2.ProgressBar = exports2.Pressable = exports2.Platform = exports2.PixelRatio = exports2.Picker = exports2.PanResponder = exports2.NativeModules = exports2.NativeEventEmitter = exports2.Modal = exports2.LogBox = exports2.Linking = exports2.LayoutAnimation = exports2.KeyboardAvoidingView = exports2.Keyboard = exports2.InteractionManager = exports2.ImageBackground = exports2.Image = exports2.I18nManager = exports2.FlatList = exports2.Easing = exports2.Dimensions = exports2.DeviceEventEmitter = exports2.Clipboard = exports2.CheckBox = exports2.Button = exports2.BackHandler = exports2.Appearance = exports2.AppState = exports2.AppRegistry = exports2.Animated = exports2.Alert = exports2.ActivityIndicator = exports2.AccessibilityInfo = void 0;
    var _createElement = _interopRequireDefault(require_createElement());
    exports2.unstable_createElement = _createElement.default;
    var _findNodeHandle = _interopRequireDefault(require_findNodeHandle());
    exports2.findNodeHandle = _findNodeHandle.default;
    var _processColor = _interopRequireDefault(require_processColor());
    exports2.processColor = _processColor.default;
    var _render = _interopRequireDefault(require_render());
    exports2.render = _render.default;
    var _unmountComponentAtNode = _interopRequireDefault(require_unmountComponentAtNode());
    exports2.unmountComponentAtNode = _unmountComponentAtNode.default;
    var _NativeModules = _interopRequireDefault(require_NativeModules());
    exports2.NativeModules = _NativeModules.default;
    var _AccessibilityInfo = _interopRequireDefault(require_AccessibilityInfo());
    exports2.AccessibilityInfo = _AccessibilityInfo.default;
    var _Alert = _interopRequireDefault(require_Alert());
    exports2.Alert = _Alert.default;
    var _Animated = _interopRequireDefault(require_Animated2());
    exports2.Animated = _Animated.default;
    var _Appearance = _interopRequireDefault(require_Appearance());
    exports2.Appearance = _Appearance.default;
    var _AppRegistry = _interopRequireDefault(require_AppRegistry());
    exports2.AppRegistry = _AppRegistry.default;
    var _AppState = _interopRequireDefault(require_AppState());
    exports2.AppState = _AppState.default;
    var _BackHandler = _interopRequireDefault(require_BackHandler());
    exports2.BackHandler = _BackHandler.default;
    var _Clipboard = _interopRequireDefault(require_Clipboard());
    exports2.Clipboard = _Clipboard.default;
    var _Dimensions = _interopRequireDefault(require_Dimensions());
    exports2.Dimensions = _Dimensions.default;
    var _Easing = _interopRequireDefault(require_Easing2());
    exports2.Easing = _Easing.default;
    var _I18nManager = _interopRequireDefault(require_I18nManager());
    exports2.I18nManager = _I18nManager.default;
    var _Keyboard = _interopRequireDefault(require_Keyboard());
    exports2.Keyboard = _Keyboard.default;
    var _InteractionManager = _interopRequireDefault(require_InteractionManager());
    exports2.InteractionManager = _InteractionManager.default;
    var _LayoutAnimation = _interopRequireDefault(require_LayoutAnimation2());
    exports2.LayoutAnimation = _LayoutAnimation.default;
    var _Linking = _interopRequireDefault(require_Linking());
    exports2.Linking = _Linking.default;
    var _NativeEventEmitter = _interopRequireDefault(require_NativeEventEmitter2());
    exports2.NativeEventEmitter = _NativeEventEmitter.default;
    var _PanResponder = _interopRequireDefault(require_PanResponder2());
    exports2.PanResponder = _PanResponder.default;
    var _PixelRatio = _interopRequireDefault(require_PixelRatio());
    exports2.PixelRatio = _PixelRatio.default;
    var _Platform = _interopRequireDefault(require_Platform());
    exports2.Platform = _Platform.default;
    var _Share = _interopRequireDefault(require_Share());
    exports2.Share = _Share.default;
    var _StyleSheet = _interopRequireDefault(require_StyleSheet());
    exports2.StyleSheet = _StyleSheet.default;
    var _UIManager = _interopRequireDefault(require_UIManager());
    exports2.UIManager = _UIManager.default;
    var _Vibration = _interopRequireDefault(require_Vibration());
    exports2.Vibration = _Vibration.default;
    var _ActivityIndicator = _interopRequireDefault(require_ActivityIndicator());
    exports2.ActivityIndicator = _ActivityIndicator.default;
    var _Button = _interopRequireDefault(require_Button());
    exports2.Button = _Button.default;
    var _CheckBox = _interopRequireDefault(require_CheckBox());
    exports2.CheckBox = _CheckBox.default;
    var _FlatList = _interopRequireDefault(require_FlatList2());
    exports2.FlatList = _FlatList.default;
    var _Image = _interopRequireDefault(require_Image());
    exports2.Image = _Image.default;
    var _ImageBackground = _interopRequireDefault(require_ImageBackground());
    exports2.ImageBackground = _ImageBackground.default;
    var _KeyboardAvoidingView = _interopRequireDefault(require_KeyboardAvoidingView());
    exports2.KeyboardAvoidingView = _KeyboardAvoidingView.default;
    var _Modal = _interopRequireDefault(require_Modal());
    exports2.Modal = _Modal.default;
    var _Picker = _interopRequireDefault(require_Picker());
    exports2.Picker = _Picker.default;
    var _Pressable = _interopRequireDefault(require_Pressable());
    exports2.Pressable = _Pressable.default;
    var _ProgressBar = _interopRequireDefault(require_ProgressBar());
    exports2.ProgressBar = _ProgressBar.default;
    var _RefreshControl = _interopRequireDefault(require_RefreshControl());
    exports2.RefreshControl = _RefreshControl.default;
    var _SafeAreaView = _interopRequireDefault(require_SafeAreaView());
    exports2.SafeAreaView = _SafeAreaView.default;
    var _ScrollView = _interopRequireDefault(require_ScrollView());
    exports2.ScrollView = _ScrollView.default;
    var _SectionList = _interopRequireDefault(require_SectionList2());
    exports2.SectionList = _SectionList.default;
    var _StatusBar = _interopRequireDefault(require_StatusBar());
    exports2.StatusBar = _StatusBar.default;
    var _Switch = _interopRequireDefault(require_Switch());
    exports2.Switch = _Switch.default;
    var _Text = _interopRequireDefault(require_Text());
    exports2.Text = _Text.default;
    var _TextInput = _interopRequireDefault(require_TextInput());
    exports2.TextInput = _TextInput.default;
    var _Touchable = _interopRequireDefault(require_Touchable());
    exports2.Touchable = _Touchable.default;
    var _TouchableHighlight = _interopRequireDefault(require_TouchableHighlight());
    exports2.TouchableHighlight = _TouchableHighlight.default;
    var _TouchableNativeFeedback = _interopRequireDefault(require_TouchableNativeFeedback());
    exports2.TouchableNativeFeedback = _TouchableNativeFeedback.default;
    var _TouchableOpacity = _interopRequireDefault(require_TouchableOpacity());
    exports2.TouchableOpacity = _TouchableOpacity.default;
    var _TouchableWithoutFeedback = _interopRequireDefault(require_TouchableWithoutFeedback());
    exports2.TouchableWithoutFeedback = _TouchableWithoutFeedback.default;
    var _View = _interopRequireDefault(require_View());
    exports2.View = _View.default;
    var _VirtualizedList = _interopRequireDefault(require_VirtualizedList2());
    exports2.VirtualizedList = _VirtualizedList.default;
    var _YellowBox = _interopRequireDefault(require_YellowBox());
    exports2.YellowBox = _YellowBox.default;
    var _LogBox = _interopRequireDefault(require_LogBox());
    exports2.LogBox = _LogBox.default;
    var _DeviceEventEmitter = _interopRequireDefault(require_DeviceEventEmitter());
    exports2.DeviceEventEmitter = _DeviceEventEmitter.default;
    var _useColorScheme = _interopRequireDefault(require_useColorScheme());
    exports2.useColorScheme = _useColorScheme.default;
    var _useLocaleContext = _interopRequireDefault(require_useLocaleContext());
    exports2.useLocaleContext = _useLocaleContext.default;
    var _useWindowDimensions = _interopRequireDefault(require_useWindowDimensions());
    exports2.useWindowDimensions = _useWindowDimensions.default;
  }
});

// ../../node_modules/@tamagui/toast/dist/esm/index.mjs
var esm_exports = {};
__export(esm_exports, {
  Toast: () => Toast2,
  ToastProvider: () => ToastProvider,
  ToastViewport: () => ToastViewport,
  useToast: () => useToast,
  useToastController: () => useToastController,
  useToastState: () => useToastState
});
module.exports = __toCommonJS(esm_exports);

// ../../node_modules/@tamagui/constants/dist/esm/constants.mjs
var import_react = __toESM(require("react"), 1);
var IS_REACT_19 = typeof import_react.default.use < "u";
var isWeb = true;
var isWindowDefined = typeof window < "u";
var isServer = isWeb && !isWindowDefined;
var isClient = isWeb && isWindowDefined;
var useIsomorphicLayoutEffect = isServer ? import_react.useEffect : import_react.useLayoutEffect;
var isChrome = typeof navigator < "u" && /Chrome/.test(navigator.userAgent || "");
var isWebTouchable = isClient && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
var isAndroid = false;
var isIos = process.env.TEST_NATIVE_PLATFORM === "ios";

// ../../node_modules/@tamagui/use-force-update/dist/esm/index.mjs
var import_react2 = __toESM(require("react"), 1);
var isServerSide = typeof window > "u";
var idFn = /* @__PURE__ */ __name(() => {
}, "idFn");
function useForceUpdate() {
  return isServerSide ? idFn : import_react2.default.useReducer((x) => Math.random(), 0)[1];
}
__name(useForceUpdate, "useForceUpdate");

// ../../node_modules/@tamagui/animate-presence/dist/esm/AnimatePresence.mjs
var import_react5 = require("react");

// ../../node_modules/@tamagui/animate-presence/dist/esm/LayoutGroupContext.mjs
var import_react3 = __toESM(require("react"), 1);
var LayoutGroupContext = import_react3.default.createContext({});

// ../../node_modules/@tamagui/use-constant/dist/esm/index.mjs
var React4 = __toESM(require("react"), 1);
function useConstant(fn) {
  if (typeof document > "u") return React4.useMemo(() => fn(), []);
  const ref = React4.useRef(void 0);
  return ref.current || (ref.current = {
    v: fn()
  }), ref.current.v;
}
__name(useConstant, "useConstant");

// ../../node_modules/@tamagui/use-presence/dist/esm/PresenceContext.mjs
var React5 = __toESM(require("react"), 1);
var import_jsx_runtime = require("react/jsx-runtime");
var PresenceContext = React5.createContext(null);

// ../../node_modules/@tamagui/use-presence/dist/esm/usePresence.mjs
var React6 = __toESM(require("react"), 1);
function useIsPresent() {
  return isPresent(React6.useContext(PresenceContext));
}
__name(useIsPresent, "useIsPresent");
function isPresent(context) {
  return context === null ? true : context.isPresent;
}
__name(isPresent, "isPresent");

// ../../node_modules/@tamagui/animate-presence/dist/esm/PresenceChild.mjs
var React7 = __toESM(require("react"), 1);
var import_react4 = require("react");
var import_jsx_runtime2 = require("react/jsx-runtime");
var PresenceChild = React7.memo(({
  children,
  initial,
  isPresent: isPresent2,
  onExitComplete,
  exitVariant,
  enterVariant,
  enterExitVariant,
  presenceAffectsLayout,
  custom
}) => {
  const presenceChildren = useConstant(newChildrenMap), id = (0, import_react4.useId)() || "", context = React7.useMemo(
    () => ({
      id,
      initial,
      isPresent: isPresent2,
      custom,
      exitVariant,
      enterVariant,
      enterExitVariant,
      onExitComplete: /* @__PURE__ */ __name(() => {
        presenceChildren.set(id, true);
        for (const isComplete of presenceChildren.values()) if (!isComplete) return;
        onExitComplete?.();
      }, "onExitComplete"),
      register: /* @__PURE__ */ __name(() => (presenceChildren.set(id, false), () => presenceChildren.delete(id)), "register")
    }),
    /**
     * If the presence of a child affects the layout of the components around it,
     * we want to make a new context value to ensure they get re-rendered
     * so they can detect that layout change.
     */
    // @ts-expect-error its ok
    presenceAffectsLayout ? void 0 : [isPresent2, exitVariant, enterVariant]
  );
  return React7.useMemo(() => {
    presenceChildren.forEach((_, key) => presenceChildren.set(key, false));
  }, [isPresent2]), React7.useEffect(() => {
    !isPresent2 && !presenceChildren.size && onExitComplete?.();
  }, [isPresent2]), /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PresenceContext.Provider, {
    value: context,
    children
  });
});
function newChildrenMap() {
  return /* @__PURE__ */ new Map();
}
__name(newChildrenMap, "newChildrenMap");

// ../../node_modules/@tamagui/animate-presence/dist/esm/AnimatePresence.mjs
var import_jsx_runtime3 = require("react/jsx-runtime");
var getChildKey = /* @__PURE__ */ __name((child) => child.key || "", "getChildKey");
function updateChildLookup(children, allChildren) {
  children.forEach((child) => {
    const key = getChildKey(child);
    allChildren.set(key, child);
  });
}
__name(updateChildLookup, "updateChildLookup");
function onlyElements(children) {
  const filtered = [];
  return import_react5.Children.forEach(children, (child) => {
    (0, import_react5.isValidElement)(child) && filtered.push(child);
  }), filtered;
}
__name(onlyElements, "onlyElements");
var AnimatePresence = /* @__PURE__ */ __name(({
  children,
  enterVariant,
  exitVariant,
  enterExitVariant,
  initial = true,
  onExitComplete,
  exitBeforeEnter,
  presenceAffectsLayout = true,
  custom,
  passThrough
}) => {
  let forceRender = (0, import_react5.useContext)(LayoutGroupContext).forceRender ?? useForceUpdate();
  const filteredChildren = onlyElements(children), presentChildren = (0, import_react5.useRef)(filteredChildren), allChildren = (0, import_react5.useRef)(/* @__PURE__ */ new Map()).current, exiting = (0, import_react5.useRef)(/* @__PURE__ */ new Set()).current;
  updateChildLookup(filteredChildren, allChildren);
  const isInitialRender = (0, import_react5.useRef)(true);
  if (passThrough) return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, {
    children
  });
  if (useIsomorphicLayoutEffect(() => {
    isInitialRender.current = false;
  }, []), isInitialRender.current) return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, {
    children: filteredChildren.map((child) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PresenceChild, {
      isPresent: true,
      enterExitVariant,
      exitVariant,
      enterVariant,
      initial: initial ? void 0 : false,
      presenceAffectsLayout,
      custom,
      children: child
    }, getChildKey(child)))
  });
  let childrenToRender = [...filteredChildren];
  const presentKeys = presentChildren.current.map(getChildKey), targetKeys = filteredChildren.map(getChildKey), numPresent = presentKeys.length;
  for (let i = 0; i < numPresent; i++) {
    const key = presentKeys[i];
    targetKeys.indexOf(key) === -1 ? exiting.add(key) : exiting.delete(key);
  }
  return exitBeforeEnter && exiting.size && (childrenToRender = []), exiting.forEach((key) => {
    if (targetKeys.indexOf(key) !== -1) return;
    const child = allChildren.get(key);
    if (!child) return;
    const insertionIndex = presentKeys.indexOf(key), exitingComponent = /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PresenceChild, {
      isPresent: false,
      onExitComplete: /* @__PURE__ */ __name(() => {
        allChildren.delete(key), exiting.delete(key);
        const removeIndex = presentChildren.current.findIndex((presentChild) => presentChild.key === key);
        presentChildren.current.splice(removeIndex, 1), exiting.size || (presentChildren.current = filteredChildren, forceRender(), onExitComplete?.());
      }, "onExitComplete"),
      presenceAffectsLayout,
      enterExitVariant,
      enterVariant,
      exitVariant,
      custom,
      children: child
    }, getChildKey(child));
    childrenToRender.splice(insertionIndex, 0, exitingComponent);
  }), childrenToRender = childrenToRender.map((child) => {
    const key = child.key;
    return exiting.has(key) ? child : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(PresenceChild, {
      isPresent: true,
      exitVariant,
      enterVariant,
      enterExitVariant,
      presenceAffectsLayout,
      custom,
      children: child
    }, getChildKey(child));
  }), presentChildren.current = childrenToRender, /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(import_jsx_runtime3.Fragment, {
    children: exiting.size ? childrenToRender : (
      // biome-ignore lint/correctness/useJsxKeyInIterable: <explanation>
      childrenToRender.map((child) => (0, import_react5.cloneElement)(child))
    )
  });
}, "AnimatePresence");
AnimatePresence.displayName = "AnimatePresence";

// ../../node_modules/@tamagui/toast/dist/esm/Toast.mjs
var import_core10 = require("@tamagui/core");

// ../../node_modules/@tamagui/helpers/dist/esm/composeEventHandlers.mjs
function composeEventHandlers(og, next, {
  checkDefaultPrevented = true
} = {}) {
  return !og || !next ? next || og || void 0 : (event) => {
    if (og?.(event), !event || !(checkDefaultPrevented && typeof event == "object" && "defaultPrevented" in event) || // @ts-ignore
    "defaultPrevented" in event && !event.defaultPrevented) return next?.(event);
  };
}
__name(composeEventHandlers, "composeEventHandlers");

// ../../node_modules/@tamagui/helpers/dist/esm/withStaticProperties.mjs
var import_react6 = __toESM(require("react"), 1);
var Decorated = Symbol();
var withStaticProperties = /* @__PURE__ */ __name((component, staticProps) => {
  const next = (() => {
    if (component[Decorated]) {
      const _ = import_react6.default.forwardRef((props, ref) => import_react6.default.createElement(component, {
        ...props,
        ref
      }));
      for (const key in component) {
        const v = component[key];
        _[key] = v && typeof v == "object" ? {
          ...v
        } : v;
      }
    }
    return component;
  })();
  return Object.assign(next, staticProps), next[Decorated] = true, next;
}, "withStaticProperties");

// ../../node_modules/@tamagui/stacks/dist/esm/Stacks.mjs
var import_core2 = require("@tamagui/core");

// ../../node_modules/@tamagui/stacks/dist/esm/getElevation.mjs
var import_core = require("@tamagui/core");
var getElevation = /* @__PURE__ */ __name((size, extras) => {
  if (!size) return;
  const {
    tokens
  } = extras, token = tokens.size[size], sizeNum = (0, import_core.isVariable)(token) ? +token.val : size;
  return getSizedElevation(sizeNum, extras);
}, "getElevation");
var getSizedElevation = /* @__PURE__ */ __name((val, {
  theme,
  tokens
}) => {
  let num = 0;
  if (val === true) {
    const val2 = (0, import_core.getVariableValue)(tokens.size.true);
    typeof val2 == "number" ? num = val2 : num = 10;
  } else num = +val;
  if (num === 0) return;
  const [height, shadowRadius] = [Math.round(num / 4 + 1), Math.round(num / 2 + 2)];
  return {
    shadowColor: theme.shadowColor,
    shadowRadius,
    shadowOffset: {
      height,
      width: 0
    },
    ...import_core.isAndroid ? {
      elevationAndroid: 2 * height
    } : {}
  };
}, "getSizedElevation");

// ../../node_modules/@tamagui/stacks/dist/esm/Stacks.mjs
var fullscreenStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
};
var getInset = /* @__PURE__ */ __name((val) => val && typeof val == "object" ? val : {
  top: val,
  left: val,
  bottom: val,
  right: val
}, "getInset");
var variants = {
  fullscreen: {
    true: fullscreenStyle
  },
  elevation: {
    "...size": getElevation,
    ":number": getElevation
  },
  inset: getInset
};
var YStack = (0, import_core2.styled)(import_core2.View, {
  flexDirection: "column",
  variants
});
YStack.displayName = "YStack";
var XStack = (0, import_core2.styled)(import_core2.View, {
  flexDirection: "row",
  variants
});
XStack.displayName = "XStack";
var ZStack = (0, import_core2.styled)(YStack, {
  position: "relative"
}, {
  neverFlatten: true,
  isZStack: true
});
ZStack.displayName = "ZStack";

// ../../node_modules/@tamagui/stacks/dist/esm/variants.mjs
var elevate = {
  true: /* @__PURE__ */ __name((_, extras) => getElevation(extras.props.size, extras), "true")
};
var bordered = /* @__PURE__ */ __name((val, {
  props
}) => ({
  // TODO size it with size in '...size'
  borderWidth: typeof val == "number" ? val : 1,
  borderColor: "$borderColor",
  ...props.hoverTheme && {
    hoverStyle: {
      borderColor: "$borderColorHover"
    }
  },
  ...props.pressTheme && {
    pressStyle: {
      borderColor: "$borderColorPress"
    }
  },
  ...props.focusTheme && {
    focusStyle: {
      borderColor: "$borderColorFocus"
    }
  }
}), "bordered");
var padded = {
  true: /* @__PURE__ */ __name((_, extras) => {
    const {
      tokens,
      props
    } = extras;
    return {
      padding: tokens.space[props.size] || tokens.space.$true
    };
  }, "true")
};
var radiused = {
  true: /* @__PURE__ */ __name((_, extras) => {
    const {
      tokens,
      props
    } = extras;
    return {
      borderRadius: tokens.radius[props.size] || tokens.radius.$true
    };
  }, "true")
};
var circularStyle = {
  borderRadius: 1e5,
  padding: 0
};
var circular = {
  true: /* @__PURE__ */ __name((_, {
    props,
    tokens
  }) => {
    if (!("size" in props)) return circularStyle;
    const size = typeof props.size == "number" ? props.size : tokens.size[props.size];
    return {
      ...circularStyle,
      width: size,
      height: size,
      maxWidth: size,
      maxHeight: size,
      minWidth: size,
      minHeight: size
    };
  }, "true")
};
var hoverTheme = {
  true: {
    hoverStyle: {
      backgroundColor: "$backgroundHover",
      borderColor: "$borderColorHover"
    }
  },
  false: {}
};
var pressTheme = {
  true: {
    cursor: "pointer",
    pressStyle: {
      backgroundColor: "$backgroundPress",
      borderColor: "$borderColorPress"
    }
  },
  false: {}
};
var focusTheme = {
  true: {
    focusStyle: {
      backgroundColor: "$backgroundFocus",
      borderColor: "$borderColorFocus"
    }
  },
  false: {}
};

// ../../node_modules/@tamagui/stacks/dist/esm/ThemeableStack.mjs
var import_core3 = require("@tamagui/core");
var chromelessStyle = {
  backgroundColor: "transparent",
  borderColor: "transparent",
  shadowColor: "transparent",
  hoverStyle: {
    borderColor: "transparent"
  }
};
var themeableVariants = {
  backgrounded: {
    true: {
      backgroundColor: "$background"
    }
  },
  radiused,
  hoverTheme,
  pressTheme,
  focusTheme,
  circular,
  padded,
  elevate,
  bordered,
  transparent: {
    true: {
      backgroundColor: "transparent"
    }
  },
  chromeless: {
    true: chromelessStyle,
    all: {
      ...chromelessStyle,
      hoverStyle: chromelessStyle,
      pressStyle: chromelessStyle,
      focusStyle: chromelessStyle
    }
  }
};
var ThemeableStack = (0, import_core3.styled)(YStack, {
  variants: themeableVariants
});

// ../../node_modules/@tamagui/get-font-sized/dist/esm/index.mjs
var import_web = require("@tamagui/core");
var getFontSized = /* @__PURE__ */ __name((sizeTokenIn = "$true", {
  font,
  fontFamily,
  props
}) => {
  if (!font) return {
    fontSize: sizeTokenIn
  };
  const sizeToken = sizeTokenIn === "$true" ? getDefaultSizeToken(font) : sizeTokenIn, style = {}, fontSize = font.size[sizeToken], lineHeight = font.lineHeight?.[sizeToken], fontWeight = font.weight?.[sizeToken], letterSpacing = font.letterSpacing?.[sizeToken], textTransform = font.transform?.[sizeToken], fontStyle = props.fontStyle ?? font.style?.[sizeToken], color = props.color ?? font.color?.[sizeToken];
  return fontStyle && (style.fontStyle = fontStyle), textTransform && (style.textTransform = textTransform), fontFamily && (style.fontFamily = fontFamily), fontWeight && (style.fontWeight = fontWeight), letterSpacing && (style.letterSpacing = letterSpacing), fontSize && (style.fontSize = fontSize), lineHeight && (style.lineHeight = lineHeight), color && (style.color = color), process.env.NODE_ENV === "development" && props.debug && props.debug === "verbose" && (console.groupCollapsed("  \u{1F539} getFontSized", sizeTokenIn, sizeToken), isClient && console.info({
    style,
    props,
    font
  }), console.groupEnd()), style;
}, "getFontSized");
var SizableText = (0, import_web.styled)(import_web.Text, {
  name: "SizableText",
  fontFamily: "$body",
  variants: {
    size: {
      "...fontSize": getFontSized
    }
  },
  defaultVariants: {
    size: "$true"
  }
});
var cache = /* @__PURE__ */ new WeakMap();
function getDefaultSizeToken(font) {
  if (typeof font == "object" && cache.has(font)) return cache.get(font);
  const sizeTokens = "$true" in font.size ? font.size : (0, import_web.getTokens)().size, sizeDefault = sizeTokens.$true, sizeDefaultSpecific = sizeDefault ? Object.keys(sizeTokens).find((x) => x !== "$true" && sizeTokens[x].val === sizeDefault.val) : null;
  return !sizeDefault || !sizeDefaultSpecific ? (process.env.NODE_ENV === "development" && console.warn(`No default size is set in your tokens for the "true" key, fonts will be inconsistent.

      Fix this by having consistent tokens across fonts and sizes and setting a true key for your size tokens, or
      set true keys for all your font tokens: "size", "lineHeight", "fontStyle", etc.`), Object.keys(font.size)[3]) : (cache.set(font, sizeDefaultSpecific), sizeDefaultSpecific);
}
__name(getDefaultSizeToken, "getDefaultSizeToken");

// ../../node_modules/@tamagui/text/dist/esm/SizableText.mjs
var import_web2 = require("@tamagui/core");
var SizableText2 = (0, import_web2.styled)(import_web2.Text, {
  name: "SizableText",
  fontFamily: "$body",
  variants: {
    unstyled: {
      false: {
        size: "$true",
        color: "$color"
      }
    },
    size: getFontSized
  },
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1"
  }
});
SizableText2.staticConfig.variants.fontFamily = {
  "...": /* @__PURE__ */ __name((val, extras) => {
    if (val === "inherit") return {
      fontFamily: "inherit"
    };
    const sizeProp = extras.props.size, fontSizeProp = extras.props.fontSize, size = sizeProp === "$true" && fontSizeProp ? fontSizeProp : extras.props.size || "$true";
    return getFontSized(size, extras);
  }, "...")
};

// ../../node_modules/@tamagui/use-event/dist/esm/useGet.mjs
var React9 = __toESM(require("react"), 1);
function useGet(currentValue, initialValue, forwardToFunction) {
  const curRef = React9.useRef(initialValue ?? currentValue);
  return useIsomorphicLayoutEffect(() => {
    curRef.current = currentValue;
  }), React9.useCallback(forwardToFunction ? (...args) => curRef.current?.apply(null, args) : () => curRef.current, []);
}
__name(useGet, "useGet");

// ../../node_modules/@tamagui/use-event/dist/esm/useEvent.mjs
function useEvent(callback) {
  return useGet(callback, defaultValue, true);
}
__name(useEvent, "useEvent");
var defaultValue = /* @__PURE__ */ __name(() => {
  throw new Error("Cannot call an event handler while rendering.");
}, "defaultValue");

// ../../node_modules/@tamagui/use-controllable-state/dist/esm/useControllableState.mjs
var React10 = __toESM(require("react"), 1);

// ../../node_modules/@tamagui/start-transition/dist/esm/index.mjs
var import_react7 = require("react");
var startTransition = /* @__PURE__ */ __name((callback) => {
  (0, import_react7.startTransition)(callback);
}, "startTransition");

// ../../node_modules/@tamagui/use-controllable-state/dist/esm/useControllableState.mjs
var emptyCallbackFn = /* @__PURE__ */ __name((_) => _(), "emptyCallbackFn");
function useControllableState({
  prop,
  defaultProp,
  onChange,
  strategy = "prop-wins",
  preventUpdate,
  transition
}) {
  const [state, setState] = React10.useState(prop ?? defaultProp), previous = React10.useRef(state), propWins = strategy === "prop-wins" && prop !== void 0, value = propWins ? prop : state, onChangeCb = useEvent(onChange || idFn2), transitionFn = transition ? startTransition : emptyCallbackFn;
  React10.useEffect(() => {
    prop !== void 0 && (previous.current = prop, transitionFn(() => {
      setState(prop);
    }));
  }, [prop]), React10.useEffect(() => {
    propWins || state !== previous.current && (previous.current = state, onChangeCb(state));
  }, [onChangeCb, state, propWins]);
  const setter = useEvent((next) => {
    if (!preventUpdate) if (propWins) {
      const nextValue = typeof next == "function" ? next(previous.current) : next;
      onChangeCb(nextValue);
    } else transitionFn(() => {
      setState(next);
    });
  });
  return [value, setter];
}
__name(useControllableState, "useControllableState");
var idFn2 = /* @__PURE__ */ __name(() => {
}, "idFn");

// ../../node_modules/@tamagui/toast/dist/esm/Toast.mjs
var React23 = __toESM(require("react"), 1);

// ../../node_modules/@tamagui/toast/dist/esm/ToastAnnounce.mjs
var import_core7 = require("@tamagui/core");

// ../../node_modules/@tamagui/polyfill-dev/index.js
if (typeof globalThis["__DEV__"] === "undefined") {
  globalThis["__DEV__"] = process.env.NODE_ENV === "development";
}

// ../../node_modules/@tamagui/z-index-stack/dist/esm/useStackedZIndex.mjs
var import_react9 = require("react");

// ../../node_modules/@tamagui/z-index-stack/dist/esm/context.mjs
var import_react8 = require("react");
var ZIndexStackContext = (0, import_react8.createContext)(1);
var ZIndexHardcodedContext = (0, import_react8.createContext)(void 0);

// ../../node_modules/@tamagui/z-index-stack/dist/esm/useStackedZIndex.mjs
var ZIndicesByContext = {};
var CurrentPortalZIndices = {};
var useStackedZIndex = /* @__PURE__ */ __name((props) => {
  if (process.env.TAMAGUI_STACK_Z_INDEX_GLOBAL) {
    const {
      stackZIndex,
      zIndex: zIndexProp
    } = props, id = (0, import_react9.useId)(), zIndex = (0, import_react9.useMemo)(() => {
      if (stackZIndex && stackZIndex !== "global" && zIndexProp === void 0) {
        const highest = Object.values(CurrentPortalZIndices).reduce((acc, cur) => Math.max(acc, cur), 0);
        return Math.max(stackZIndex === true ? 1 : stackZIndex, highest + 1);
      }
      return zIndexProp ?? 1e3;
    }, [stackZIndex]);
    return (0, import_react9.useEffect)(() => {
      if (typeof stackZIndex == "number") return CurrentPortalZIndices[id] = stackZIndex, () => {
        delete CurrentPortalZIndices[id];
      };
    }, [stackZIndex]), zIndex;
  } else {
    const {
      stackZIndex,
      zIndex: zIndexProp
    } = props, id = (0, import_react9.useId)(), stackingContextLevel = (0, import_react9.useContext)(ZIndexStackContext), stackLayer = stackZIndex === "global" ? 0 : stackingContextLevel, hardcoded = (0, import_react9.useContext)(ZIndexHardcodedContext);
    ZIndicesByContext[stackLayer] ||= {};
    const stackContext = ZIndicesByContext[stackLayer], zIndex = (0, import_react9.useMemo)(() => {
      if (typeof zIndexProp == "number") return zIndexProp;
      if (stackZIndex) {
        if (hardcoded) return hardcoded + 1;
        const entries = Object.values(stackContext), baseForLayer = stackLayer * 5e3, nextLayerBase = (stackLayer + 1) * 5e3, validEntries = entries.filter((z) => z < nextLayerBase), highest = validEntries.length > 0 ? Math.max(...validEntries) : baseForLayer, nextZIndex = highest === baseForLayer ? baseForLayer + 1 : highest + 1;
        return typeof stackZIndex == "number" ? stackZIndex + nextZIndex : nextZIndex;
      }
      return 1;
    }, [stackLayer, zIndexProp, stackZIndex]);
    return (0, import_react9.useEffect)(() => {
      if (stackZIndex) return stackContext[id] = zIndex, () => {
        delete stackContext[id];
      };
    }, [zIndex]), zIndex;
  }
}, "useStackedZIndex");

// ../../node_modules/@tamagui/portal/dist/esm/Portal.mjs
var React11 = __toESM(require("react"), 1);
var import_react_dom = require("react-dom");

// ../../node_modules/@tamagui/portal/dist/esm/helpers.mjs
var import_web3 = require("@tamagui/core");
var getStackedZIndexProps = /* @__PURE__ */ __name((propsIn) => ({
  stackZIndex: propsIn.stackZIndex,
  zIndex: resolveViewZIndex(propsIn.zIndex)
}), "getStackedZIndexProps");
var resolveViewZIndex = /* @__PURE__ */ __name((zIndex) => typeof zIndex > "u" || zIndex === "unset" ? void 0 : typeof zIndex == "number" ? zIndex : (0, import_web3.getTokenValue)(zIndex, "zIndex"), "resolveViewZIndex");

// ../../node_modules/@tamagui/portal/dist/esm/Portal.mjs
var import_jsx_runtime4 = require("react/jsx-runtime");
var Portal = React11.memo((propsIn) => {
  if (isServer) return null;
  const body = globalThis.document?.body;
  if (!body) return propsIn.children;
  const {
    children,
    passThrough
  } = propsIn, zIndex = useStackedZIndex(getStackedZIndexProps(propsIn));
  return passThrough ? children : (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", {
    style: {
      zIndex,
      position: "fixed",
      inset: 0,
      contain: "strict",
      pointerEvents: "none"
    },
    children
  }), body);
});

// ../../node_modules/@tamagui/portal/dist/esm/GorhomPortal.mjs
var import_react10 = __toESM(require("react"), 1);

// ../../node_modules/@tamagui/portal/dist/esm/constants.mjs
var IS_FABRIC = typeof global < "u" && !!(global._IS_FABRIC ?? global.nativeFabricUIManager);
var USE_NATIVE_PORTAL = process.env.TAMAGUI_USE_NATIVE_PORTAL && process.env.TAMAGUI_USE_NATIVE_PORTAL !== "false" ? true : !isAndroid && !IS_FABRIC;
var allPortalHosts = /* @__PURE__ */ new Map();
var portalListeners = {};

// ../../node_modules/@tamagui/portal/dist/esm/GorhomPortal.mjs
var import_jsx_runtime5 = require("react/jsx-runtime");
var INITIAL_STATE = {};
var registerHost = /* @__PURE__ */ __name((state, hostName) => (hostName in state || (state[hostName] = []), state), "registerHost");
var deregisterHost = /* @__PURE__ */ __name((state, hostName) => (delete state[hostName], state), "deregisterHost");
var addUpdatePortal = /* @__PURE__ */ __name((state, hostName, portalName, node) => {
  hostName in state || (state = registerHost(state, hostName));
  const index = state[hostName].findIndex((item) => item.name === portalName);
  return index !== -1 ? state[hostName][index].node = node : state[hostName].push({
    name: portalName,
    node
  }), state;
}, "addUpdatePortal");
var removePortal = /* @__PURE__ */ __name((state, hostName, portalName) => {
  if (!(hostName in state)) return console.info(`Failed to remove portal '${portalName}', '${hostName}' was not registered!`), state;
  const index = state[hostName].findIndex((item) => item.name === portalName);
  return index !== -1 && state[hostName].splice(index, 1), state;
}, "removePortal");
var reducer = /* @__PURE__ */ __name((state, action) => {
  const {
    type
  } = action;
  switch (type) {
    case 0:
      return registerHost({
        ...state
      }, action.hostName);
    case 1:
      return deregisterHost({
        ...state
      }, action.hostName);
    case 2:
      return addUpdatePortal({
        ...state
      }, action.hostName, action.portalName, action.node);
    case 3:
      return removePortal({
        ...state
      }, action.hostName, action.portalName);
    default:
      return state;
  }
}, "reducer");
var PortalStateContext = (0, import_react10.createContext)(null);
var PortalDispatchContext = (0, import_react10.createContext)(null);
var usePortalState = /* @__PURE__ */ __name((hostName) => {
  const state = (0, import_react10.useContext)(PortalStateContext);
  if (state === null) throw new Error("'PortalStateContext' cannot be null, please add 'PortalProvider' to the root component.");
  return state[hostName] || [];
}, "usePortalState");
var usePortal = /* @__PURE__ */ __name((hostName = "root") => {
  const dispatch = (0, import_react10.useContext)(PortalDispatchContext);
  if (dispatch === null) throw new Error("'PortalDispatchContext' cannot be null, please add 'PortalProvider' to the root component.");
  const registerHost2 = (0, import_react10.useCallback)(() => {
    dispatch({
      type: 0,
      hostName
    });
  }, []), deregisterHost2 = (0, import_react10.useCallback)(() => {
    dispatch({
      type: 1,
      hostName
    });
  }, []), addUpdatePortal2 = (0, import_react10.useCallback)((name, node) => {
    dispatch({
      type: 2,
      hostName,
      portalName: name,
      node
    });
  }, []), removePortal2 = (0, import_react10.useCallback)((name) => {
    dispatch({
      type: 3,
      hostName,
      portalName: name
    });
  }, []);
  return {
    registerHost: registerHost2,
    deregisterHost: deregisterHost2,
    addPortal: addUpdatePortal2,
    updatePortal: addUpdatePortal2,
    removePortal: removePortal2
  };
}, "usePortal");
var PortalProviderComponent = /* @__PURE__ */ __name(({
  rootHostName = "root",
  shouldAddRootHost = true,
  children
}) => {
  const [state, dispatch] = (0, import_react10.useReducer)(reducer, INITIAL_STATE), transitionDispatch = (0, import_react10.useMemo)(() => (value) => {
    startTransition(() => {
      dispatch(value);
    });
  }, [dispatch]);
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PortalDispatchContext.Provider, {
    value: transitionDispatch,
    children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(PortalStateContext.Provider, {
      value: state,
      children: [children, shouldAddRootHost && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PortalHost, {
        name: rootHostName
      })]
    })
  });
}, "PortalProviderComponent");
var PortalProvider = (0, import_react10.memo)(PortalProviderComponent);
PortalProvider.displayName = "PortalProvider";
var defaultRenderer = /* @__PURE__ */ __name((children) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_jsx_runtime5.Fragment, {
  children
}), "defaultRenderer");
var PortalHost = (0, import_react10.memo)(function(props) {
  return isWeb ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PortalHostWeb, {
    ...props
  }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(PortalHostNonNative, {
    ...props
  });
});
function PortalHostWeb(props) {
  return useIsomorphicLayoutEffect(() => () => {
    allPortalHosts.delete(props.name);
  }, [props.name]), /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", {
    style: {
      display: "contents"
    },
    ref: /* @__PURE__ */ __name((node) => {
      node && (allPortalHosts.set(props.name, node), portalListeners[props.name]?.forEach((x) => x(node)));
    }, "ref")
  });
}
__name(PortalHostWeb, "PortalHostWeb");
function PortalHostNonNative(props) {
  const {
    name,
    forwardProps,
    render = defaultRenderer
  } = props, state = usePortalState(name), {
    registerHost: registerHost2,
    deregisterHost: deregisterHost2
  } = usePortal(props.name);
  return useIsomorphicLayoutEffect(() => {
    if (!(typeof window > "u")) return registerHost2(), () => {
      deregisterHost2();
    };
  }, []), render(forwardProps ? state.map((item) => {
    let next = item.node;
    const {
      children,
      ...restForwardProps
    } = forwardProps;
    return forwardProps ? import_react10.default.Children.map(next, (child) => import_react10.default.isValidElement(child) ? import_react10.default.cloneElement(child, {
      key: child.key,
      ...restForwardProps
    }) : child) : next;
  }) : state.map((item) => item.node));
}
__name(PortalHostNonNative, "PortalHostNonNative");

// ../../node_modules/@tamagui/portal/dist/esm/GorhomPortalItem.mjs
var import_react11 = require("react");
var import_react_dom2 = require("react-dom");
var GorhomPortalItem = /* @__PURE__ */ __name((props) => {
  !props.hostName && !props.passThrough && console.warn("No hostName");
  const cur = allPortalHosts.get(props.hostName || ""), [node, setNode] = (0, import_react11.useState)(cur);
  if (useIsomorphicLayoutEffect(() => {
    if (!props.hostName) return;
    const listener = /* @__PURE__ */ __name((newNode) => {
      setNode(newNode);
    }, "listener");
    return portalListeners[props.hostName] ||= /* @__PURE__ */ new Set(), portalListeners[props.hostName].add(listener), () => {
      portalListeners[props.hostName]?.delete(listener);
    };
  }, [props.hostName]), useIsomorphicLayoutEffect(() => {
    cur && cur !== node && setNode(cur);
  }, [cur, node]), props.passThrough) return props.children;
  const actualNode = node?.isConnected ? node : null;
  return actualNode ? (0, import_react_dom2.createPortal)(props.children, actualNode) : null;
}, "GorhomPortalItem");

// ../../node_modules/@tamagui/visually-hidden/dist/esm/VisuallyHidden.mjs
var import_web4 = require("@tamagui/core");
var VisuallyHidden = (0, import_web4.styled)(import_web4.Text, {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  zIndex: -1e4,
  overflow: "hidden",
  opacity: 1e-8,
  pointerEvents: "none",
  variants: {
    preserveDimensions: {
      true: {
        position: "relative",
        width: "auto",
        height: "auto"
      }
    },
    visible: {
      true: {
        position: "relative",
        width: "auto",
        height: "auto",
        margin: 0,
        zIndex: 1,
        overflow: "visible",
        opacity: 1,
        pointerEvents: "auto"
      }
    }
  }
});
VisuallyHidden.isVisuallyHidden = true;

// ../../node_modules/@tamagui/toast/dist/esm/ToastAnnounce.mjs
var React17 = __toESM(require("react"), 1);

// ../../node_modules/@tamagui/compose-refs/dist/esm/compose-refs.mjs
var React13 = __toESM(require("react"), 1);
function setRef(ref, value) {
  typeof ref == "function" ? ref(value) : ref && (ref.current = value);
}
__name(setRef, "setRef");
function composeRefs(...refs) {
  return (node) => refs.forEach((ref) => setRef(ref, node));
}
__name(composeRefs, "composeRefs");
function useComposedRefs(...refs) {
  return React13.useCallback(composeRefs(...refs), refs);
}
__name(useComposedRefs, "useComposedRefs");

// ../../node_modules/@tamagui/collection/dist/esm/Collection.mjs
var import_core4 = require("@tamagui/core");
var import_react12 = __toESM(require("react"), 1);
var import_jsx_runtime6 = require("react/jsx-runtime");
function createCollection(name) {
  const {
    Provider: CollectionProviderImpl,
    useStyledContext: useCollectionContext
  } = (0, import_core4.createStyledContext)({
    collectionRef: {
      current: void 0
    },
    itemMap: /* @__PURE__ */ new Map()
  }, "Toast"), CollectionProvider = /* @__PURE__ */ __name((props) => {
    const {
      scope,
      children
    } = props, ref = import_react12.default.useRef(void 0), itemMap = import_react12.default.useRef(/* @__PURE__ */ new Map()).current;
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(CollectionProviderImpl, {
      scope,
      itemMap,
      collectionRef: ref,
      children
    });
  }, "CollectionProvider");
  CollectionProvider.displayName = "CollectionProvider";
  const COLLECTION_SLOT_NAME = name + "CollectionSlot", CollectionSlot = import_react12.default.forwardRef((props, forwardedRef) => {
    const {
      scope,
      children
    } = props, context = useCollectionContext(scope), composedRefs = useComposedRefs(forwardedRef, context.collectionRef);
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core4.Slot, {
      ref: composedRefs,
      children
    });
  });
  CollectionSlot.displayName = COLLECTION_SLOT_NAME;
  const ITEM_SLOT_NAME = name + "CollectionItemSlot", ITEM_DATA_ATTR = "data-collection-item", CollectionItemSlot = import_react12.default.forwardRef((props, forwardedRef) => {
    const {
      scope,
      children,
      ...itemData
    } = props, ref = import_react12.default.useRef(void 0), composedRefs = useComposedRefs(forwardedRef, ref), context = useCollectionContext(scope);
    return import_react12.default.useEffect(() => (context.itemMap.set(ref, {
      ref,
      ...itemData
    }), () => void context.itemMap.delete(ref))), /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_core4.Slot, {
      [ITEM_DATA_ATTR]: "",
      ref: composedRefs,
      children
    });
  });
  CollectionItemSlot.displayName = ITEM_SLOT_NAME;
  function useCollection2(scope) {
    const context = useCollectionContext(scope);
    return import_react12.default.useCallback(() => {
      if (!isWeb) return [];
      const collectionNode = context.collectionRef.current;
      if (!collectionNode) return [];
      const orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`));
      return Array.from(context.itemMap.values()).sort((a, b) => orderedNodes.indexOf(a.ref.current) - orderedNodes.indexOf(b.ref.current));
    }, [context.collectionRef, context.itemMap]);
  }
  __name(useCollection2, "useCollection");
  return [{
    Provider: CollectionProvider,
    Slot: CollectionSlot,
    ItemSlot: CollectionItemSlot
  }, useCollection2];
}
__name(createCollection, "createCollection");

// ../../node_modules/@tamagui/toast/dist/esm/ToastProvider.mjs
var import_core6 = require("@tamagui/core");
var React16 = __toESM(require("react"), 1);

// ../../node_modules/@tamagui/toast/dist/esm/constants.mjs
var TOAST_NAME = "Toast";
var TOAST_CONTEXT = "Toast";

// ../../node_modules/@tamagui/toast/dist/esm/ToastImperative.mjs
var import_core5 = require("@tamagui/core");
var import_react13 = __toESM(require("react"), 1);

// ../../node_modules/@tamagui/toast/dist/esm/createNativeToast.mjs
var createNativeToast = /* @__PURE__ */ __name((title, {
  message,
  notificationOptions
}) => {
  if (!("Notification" in window)) return console.error("This browser does not support notifications"), false;
  Notification.permission;
  const showNotification = /* @__PURE__ */ __name(() => new Notification(title, {
    body: message,
    ...notificationOptions
  }), "showNotification");
  return Notification.permission === "granted" ? {
    nativeToastRef: showNotification()
  } : (Notification.requestPermission().then((permission) => {
    if (permission === "granted") return {
      nativeToastRef: showNotification()
    };
  }), true);
}, "createNativeToast");

// ../../node_modules/@tamagui/toast/dist/esm/ToastImperative.mjs
var import_jsx_runtime7 = require("react/jsx-runtime");
var ToastContext = import_react13.default.createContext({});
var ToastCurrentContext = import_react13.default.createContext(null);
var useToastController = /* @__PURE__ */ __name(() => import_react13.default.useContext(ToastContext), "useToastController");
var useToastState = /* @__PURE__ */ __name(() => import_react13.default.useContext(ToastCurrentContext), "useToastState");
var useToast = /* @__PURE__ */ __name(() => ({
  ...useToastController(),
  currentToast: useToastState()
}), "useToast");
var ToastImperativeProvider = /* @__PURE__ */ __name(({
  children,
  options
}) => {
  const counterRef = import_react13.default.useRef(0), [toast, setToast] = import_react13.default.useState(null), [lastNativeToastRef, setLastNativeToastRef] = import_react13.default.useState(null), show = import_react13.default.useCallback((title, showOptions) => {
    const native = showOptions?.native ?? options.native, isWebNative = Array.isArray(native) ? native.includes("web") : native === "web", isMobileNative = Array.isArray(native) ? native.includes("mobile") : native === "mobile", isAndroidNative = isMobileNative || (Array.isArray(native) ? native.includes("android") : native === "android"), isIosNative = isMobileNative || (Array.isArray(native) ? native.includes("ios") : native === "ios"), isHandledNatively = native === true || import_core5.isWeb && isWebNative || !import_core5.isWeb && isMobileNative || import_core5.isAndroid && isAndroidNative || import_core5.isIos && isIosNative;
    if (isHandledNatively) {
      const nativeToastResult = createNativeToast(title, showOptions ?? {});
      typeof nativeToastResult == "object" && nativeToastResult.nativeToastRef && setLastNativeToastRef(nativeToastResult.nativeToastRef);
    }
    return counterRef.current++, setToast({
      ...showOptions?.customData,
      ...showOptions,
      viewportName: showOptions?.viewportName ?? "default",
      title,
      id: counterRef.current.toString(),
      isHandledNatively
    }), true;
  }, [setToast, JSON.stringify(options.native || null)]), hide = import_react13.default.useCallback(() => {
    lastNativeToastRef?.close(), setToast((prev) => prev ? {
      ...prev,
      hide: true
    } : null), setTimeout(() => {
      setToast(null);
    }, 100);
  }, [setToast, lastNativeToastRef]), contextValue = import_react13.default.useMemo(() => ({
    show,
    hide,
    nativeToast: lastNativeToastRef,
    options
  }), [show, hide, lastNativeToastRef, JSON.stringify(options || null)]);
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ToastContext.Provider, {
    value: contextValue,
    children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ToastCurrentContext.Provider, {
      value: toast,
      children
    })
  });
}, "ToastImperativeProvider");

// ../../node_modules/@tamagui/toast/dist/esm/ToastProvider.mjs
var import_jsx_runtime8 = require("react/jsx-runtime");
var PROVIDER_NAME = "ToastProvider";
var [Collection, useCollection] = createCollection("Toast");
var {
  Provider: ToastProviderProvider,
  useStyledContext: useToastProviderContext
} = (0, import_core6.createStyledContext)(
  // since we always provide this we can avoid setting here
  {},
  "Toast__"
);
var ToastProvider = /* @__PURE__ */ __name((props) => {
  const {
    scope = TOAST_CONTEXT,
    id: providedId,
    burntOptions,
    native,
    notificationOptions,
    label = "Notification",
    duration = 5e3,
    swipeDirection = "right",
    swipeThreshold = 50,
    children
  } = props, backupId = React16.useId(), id = providedId ?? backupId, [viewports, setViewports] = React16.useState({}), [toastCount, setToastCount] = React16.useState(0), isFocusedToastEscapeKeyDownRef = React16.useRef(false), isClosePausedRef = React16.useRef(false), handleViewportChange = React16.useCallback((name, viewport) => {
    startTransition(() => {
      setViewports((prev) => ({
        ...prev,
        [name]: viewport
      }));
    });
  }, []), options = React16.useMemo(() => ({
    duration,
    burntOptions,
    native,
    notificationOptions
  }), [JSON.stringify([duration, burntOptions, native, notificationOptions])]);
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Collection.Provider, {
    scope,
    children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ToastProviderProvider, {
      scope,
      id,
      label,
      duration,
      swipeDirection,
      swipeThreshold,
      toastCount,
      viewports,
      onViewportChange: handleViewportChange,
      onToastAdd: React16.useCallback(() => {
        startTransition(() => {
          setToastCount((prevCount) => prevCount + 1);
        });
      }, []),
      onToastRemove: React16.useCallback(() => {
        startTransition(() => {
          setToastCount((prevCount) => prevCount - 1);
        });
      }, []),
      isFocusedToastEscapeKeyDownRef,
      isClosePausedRef,
      options,
      children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ToastImperativeProvider, {
        options,
        children
      })
    })
  });
}, "ToastProvider");
function ReprogapateToastProvider(props) {
  const {
    children,
    context
  } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Collection.Provider, {
    scope: context.toastScope,
    children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ToastProviderProvider, {
      ...context,
      children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(ToastImperativeProvider, {
        options: context.options,
        children
      })
    })
  });
}
__name(ReprogapateToastProvider, "ReprogapateToastProvider");
ToastProvider.propTypes = {
  label(props) {
    if (props.label && typeof props.label == "string" && !props.label.trim()) {
      const error = `Invalid prop \`label\` supplied to \`${PROVIDER_NAME}\`. Expected non-empty \`string\`.`;
      return new Error(error);
    }
    return null;
  }
};
ToastProvider.displayName = PROVIDER_NAME;

// ../../node_modules/@tamagui/toast/dist/esm/ToastAnnounce.mjs
var import_jsx_runtime9 = require("react/jsx-runtime");
var ToastAnnounceExcludeFrame = (0, import_core7.styled)(import_core7.Stack, {
  name: "ToastAnnounceExclude"
});
var ToastAnnounceExclude = React17.forwardRef((props, forwardedRef) => {
  const {
    altText,
    ...announceExcludeProps
  } = props;
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(ToastAnnounceExcludeFrame, {
    "data-toast-announce-exclude": "",
    "data-toast-announce-alt": altText || void 0,
    ...announceExcludeProps,
    ref: forwardedRef
  });
});
var ToastAnnounce = /* @__PURE__ */ __name((props) => {
  const {
    scope,
    children,
    ...announceProps
  } = props, context = useToastProviderContext(scope), [renderAnnounceText, setRenderAnnounceText] = React17.useState(false), [isAnnounced, setIsAnnounced] = React17.useState(false);
  return useNextFrame(() => {
    startTransition(() => {
      setRenderAnnounceText(true);
    });
  }), React17.useEffect(() => {
    const timer = setTimeout(() => setIsAnnounced(true), 1e3);
    return () => clearTimeout(timer);
  }, []), isAnnounced ? null : /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Portal, {
    children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(VisuallyHidden, {
      ...announceProps,
      children: renderAnnounceText && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_core7.Text, {
        children: [context.label, " ", children]
      })
    })
  });
}, "ToastAnnounce");
function useNextFrame(callback = () => {
}) {
  const fn = (0, import_core7.useEvent)(callback);
  useIsomorphicLayoutEffect(() => {
    let raf1 = 0, raf2 = 0;
    return raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(fn);
    }), () => {
      cancelAnimationFrame(raf1), cancelAnimationFrame(raf2);
    };
  }, [fn]);
}
__name(useNextFrame, "useNextFrame");

// ../../node_modules/@tamagui/toast/dist/esm/ToastImpl.mjs
var import_core9 = require("@tamagui/core");

// ../../node_modules/@tamagui/use-callback-ref/dist/esm/index.mjs
var React18 = __toESM(require("react"), 1);
function useCallbackRef(callback) {
  const callbackRef = React18.useRef(callback);
  return React18.useEffect(() => {
    callbackRef.current = callback;
  }), React18.useMemo(() => (...args) => callbackRef.current?.(...args), []);
}
__name(useCallbackRef, "useCallbackRef");

// ../../node_modules/@tamagui/use-escape-keydown/dist/esm/index.mjs
var import_react14 = __toESM(require("react"), 1);
function useEscapeKeydown(onEscapeKeyDownProp, ownerDocument = globalThis?.document) {
  const onEscapeKeyDown = useCallbackRef(onEscapeKeyDownProp);
  import_react14.default.useEffect(() => {
    const handleKeyDown = /* @__PURE__ */ __name((event) => {
      event.key === "Escape" && onEscapeKeyDown(event);
    }, "handleKeyDown");
    return ownerDocument.addEventListener("keydown", handleKeyDown), () => {
      ownerDocument.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEscapeKeyDown, ownerDocument]);
}
__name(useEscapeKeydown, "useEscapeKeydown");

// ../../node_modules/@tamagui/dismissable/dist/esm/Dismissable.mjs
var React20 = __toESM(require("react"), 1);
var ReactDOM = __toESM(require("react-dom"), 1);
var import_jsx_runtime10 = require("react/jsx-runtime");
function dispatchDiscreteCustomEvent(target, event) {
  target && ReactDOM.flushSync(() => target.dispatchEvent(event));
}
__name(dispatchDiscreteCustomEvent, "dispatchDiscreteCustomEvent");
var DISMISSABLE_LAYER_NAME = "Dismissable";
var CONTEXT_UPDATE = "dismissable.update";
var POINTER_DOWN_OUTSIDE = "dismissable.pointerDownOutside";
var FOCUS_OUTSIDE = "dismissable.focusOutside";
var originalBodyPointerEvents;
var DismissableContext = React20.createContext({
  layers: /* @__PURE__ */ new Set(),
  layersWithOutsidePointerEventsDisabled: /* @__PURE__ */ new Set(),
  branches: /* @__PURE__ */ new Set()
});
var Dismissable = React20.forwardRef((props, forwardedRef) => {
  const {
    disableOutsidePointerEvents = false,
    forceUnmount,
    onEscapeKeyDown,
    onPointerDownOutside,
    onFocusOutside,
    onInteractOutside,
    onDismiss,
    ...layerProps
  } = props, context = React20.useContext(DismissableContext), [node, setNode] = React20.useState(null), [, force] = React20.useState({}), composedRefs = useComposedRefs(forwardedRef, (node2) => setNode(node2)), layers = Array.from(context.layers), [highestLayerWithOutsidePointerEventsDisabled] = [...context.layersWithOutsidePointerEventsDisabled].slice(-1), highestLayerWithOutsidePointerEventsDisabledIndex = layers.indexOf(highestLayerWithOutsidePointerEventsDisabled), index = node ? layers.indexOf(node) : -1, isBodyPointerEventsDisabled = context.layersWithOutsidePointerEventsDisabled.size > 0, isPointerEventsEnabled = index >= highestLayerWithOutsidePointerEventsDisabledIndex, pointerDownOutside = usePointerDownOutside((event) => {
    const target = event.target, isPointerDownOnBranch = [...context.branches].some((branch) => branch.contains(target));
    !isPointerEventsEnabled || isPointerDownOnBranch || (onPointerDownOutside?.(event), onInteractOutside?.(event), event.defaultPrevented || onDismiss?.());
  }), focusOutside = useFocusOutside((event) => {
    const target = event.target;
    [...context.branches].some((branch) => branch.contains(target)) || (onFocusOutside?.(event), onInteractOutside?.(event), event.defaultPrevented || onDismiss?.());
  });
  return useEscapeKeydown((event) => {
    index === context.layers.size - 1 && (onEscapeKeyDown?.(event), !event.defaultPrevented && onDismiss && (event.preventDefault(), onDismiss()));
  }), React20.useEffect(() => {
    if (node) return disableOutsidePointerEvents && (context.layersWithOutsidePointerEventsDisabled.size === 0 && (originalBodyPointerEvents = document.body.style.pointerEvents, document.body.style.pointerEvents = "none"), context.layersWithOutsidePointerEventsDisabled.add(node)), context.layers.add(node), dispatchUpdate(), () => {
      disableOutsidePointerEvents && context.layersWithOutsidePointerEventsDisabled.size === 1 && (document.body.style.pointerEvents = originalBodyPointerEvents);
    };
  }, [node, disableOutsidePointerEvents, context]), React20.useEffect(() => {
    if (!forceUnmount) return () => {
      node && (context.layers.delete(node), context.layersWithOutsidePointerEventsDisabled.delete(node), dispatchUpdate());
    };
  }, [node, context, forceUnmount]), React20.useEffect(() => {
    const handleUpdate = /* @__PURE__ */ __name(() => {
      force({});
    }, "handleUpdate");
    return document.addEventListener(CONTEXT_UPDATE, handleUpdate), () => document.removeEventListener(CONTEXT_UPDATE, handleUpdate);
  }, []), /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", {
    ...layerProps,
    ref: composedRefs,
    style: {
      display: "contents",
      pointerEvents: isBodyPointerEventsDisabled ? isPointerEventsEnabled ? "auto" : "none" : void 0,
      // @ts-ignore
      ...props.style
    },
    onFocusCapture: composeEventHandlers(props.onFocusCapture, focusOutside.onFocusCapture),
    onBlurCapture: composeEventHandlers(props.onBlurCapture, focusOutside.onBlurCapture),
    onPointerDownCapture: composeEventHandlers(props.onPointerDownCapture, pointerDownOutside.onPointerDownCapture)
  });
});
Dismissable.displayName = DISMISSABLE_LAYER_NAME;
var BRANCH_NAME = "DismissableBranch";
var DismissableBranch = React20.forwardRef((props, forwardedRef) => {
  const context = React20.useContext(DismissableContext), ref = React20.useRef(null), composedRefs = useComposedRefs(forwardedRef, ref);
  return React20.useEffect(() => {
    const node = ref.current;
    if (node) return context.branches.add(node), () => {
      context.branches.delete(node);
    };
  }, [context.branches]), /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", {
    style: {
      display: "contents"
    },
    ...props,
    ref: composedRefs
  });
});
DismissableBranch.displayName = BRANCH_NAME;
function usePointerDownOutside(onPointerDownOutside) {
  const handlePointerDownOutside = useEvent(onPointerDownOutside), isPointerInsideReactTreeRef = React20.useRef(false), handleClickRef = React20.useRef(() => {
  });
  return React20.useEffect(() => {
    const handlePointerDown = /* @__PURE__ */ __name((event) => {
      if (event.target && !isPointerInsideReactTreeRef.current) {
        let handleAndDispatchPointerDownOutsideEvent = /* @__PURE__ */ __name(function() {
          handleAndDispatchCustomEvent(POINTER_DOWN_OUTSIDE, handlePointerDownOutside, eventDetail, {
            discrete: true
          });
        }, "handleAndDispatchPointerDownOutsideEvent");
        const eventDetail = {
          originalEvent: event
        };
        event.pointerType === "touch" ? (document.removeEventListener("click", handleClickRef.current), handleClickRef.current = handleAndDispatchPointerDownOutsideEvent, document.addEventListener("click", handleClickRef.current, {
          once: true
        })) : handleAndDispatchPointerDownOutsideEvent();
      }
      isPointerInsideReactTreeRef.current = false;
    }, "handlePointerDown"), timerId = setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 0);
    return () => {
      window.clearTimeout(timerId), document.removeEventListener("pointerdown", handlePointerDown), document.removeEventListener("click", handleClickRef.current);
    };
  }, [handlePointerDownOutside]), {
    // ensures we check React component tree (not just DOM tree)
    onPointerDownCapture: /* @__PURE__ */ __name(() => {
      isPointerInsideReactTreeRef.current = true;
    }, "onPointerDownCapture")
  };
}
__name(usePointerDownOutside, "usePointerDownOutside");
function useFocusOutside(onFocusOutside) {
  const handleFocusOutside = useEvent(onFocusOutside), isFocusInsideReactTreeRef = React20.useRef(false);
  return React20.useEffect(() => {
    const handleFocus = /* @__PURE__ */ __name((event) => {
      event.target && !isFocusInsideReactTreeRef.current && handleAndDispatchCustomEvent(FOCUS_OUTSIDE, handleFocusOutside, {
        originalEvent: event
      }, {
        discrete: false
      });
    }, "handleFocus");
    return document.addEventListener("focusin", handleFocus), () => document.removeEventListener("focusin", handleFocus);
  }, [handleFocusOutside]), {
    onFocusCapture: /* @__PURE__ */ __name(() => {
      isFocusInsideReactTreeRef.current = true;
    }, "onFocusCapture"),
    onBlurCapture: /* @__PURE__ */ __name(() => {
      isFocusInsideReactTreeRef.current = false;
    }, "onBlurCapture")
  };
}
__name(useFocusOutside, "useFocusOutside");
function dispatchUpdate() {
  const event = new CustomEvent(CONTEXT_UPDATE);
  document.dispatchEvent(event);
}
__name(dispatchUpdate, "dispatchUpdate");
function handleAndDispatchCustomEvent(name, handler, detail, {
  discrete
}) {
  const target = detail.originalEvent.target, event = new CustomEvent(name, {
    bubbles: false,
    cancelable: true,
    detail
  });
  handler && target.addEventListener(name, handler, {
    once: true
  }), discrete ? dispatchDiscreteCustomEvent(target, event) : target.dispatchEvent(event);
}
__name(handleAndDispatchCustomEvent, "handleAndDispatchCustomEvent");

// ../../node_modules/@tamagui/toast/dist/esm/ToastImpl.mjs
var React22 = __toESM(require("react"), 1);
var import_react_native_web2 = __toESM(require_cjs(), 1);

// ../../node_modules/@tamagui/toast/dist/esm/ToastViewport.mjs
var import_core8 = require("@tamagui/core");
var React21 = __toESM(require("react"), 1);

// ../../node_modules/@tamagui/toast/dist/esm/ToastPortal.mjs
var import_react_native_web = __toESM(require_cjs(), 1);
var import_jsx_runtime11 = require("react/jsx-runtime");
function ToastPortal(props) {
  const {
    context,
    children,
    zIndex
  } = props;
  let content = children;
  return (import_react_native_web.Platform.OS === "android" || import_react_native_web.Platform.OS === "ios") && (content = /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ReprogapateToastProvider, {
    context,
    children
  })), /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Portal, {
    zIndex: zIndex || Number.MAX_SAFE_INTEGER,
    children: content
  });
}
__name(ToastPortal, "ToastPortal");

// ../../node_modules/@tamagui/toast/dist/esm/ToastViewport.mjs
var import_jsx_runtime12 = require("react/jsx-runtime");
var VIEWPORT_NAME = "ToastViewport";
var VIEWPORT_DEFAULT_HOTKEY = ["F8"];
var VIEWPORT_PAUSE = "toast.viewportPause";
var VIEWPORT_RESUME = "toast.viewportResume";
var ToastViewportWrapperFrame = (0, import_core8.styled)(YStack, {
  name: "ViewportWrapper",
  variants: {
    unstyled: {
      false: {
        pointerEvents: "box-none",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        position: isWeb ? "fixed" : "absolute",
        maxWidth: "100%",
        tabIndex: 0,
        zIndex: 1e5
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1"
  }
});
var ToastViewportFrame = (0, import_core8.styled)(YStack, {
  name: VIEWPORT_NAME,
  variants: {
    unstyled: {
      false: {
        pointerEvents: "box-none",
        position: isWeb ? "fixed" : "absolute",
        maxWidth: "100%"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1"
  }
});
var ToastViewport = React21.memo(React21.forwardRef((props, forwardedRef) => {
  const {
    scope,
    hotkey = VIEWPORT_DEFAULT_HOTKEY,
    label = "Notifications ({hotkey})",
    name = "default",
    multipleToasts,
    zIndex,
    portalToRoot,
    ...viewportProps
  } = props, context = useToastProviderContext(scope), getItems = useCollection(scope || TOAST_CONTEXT), headFocusProxyRef = React21.useRef(null), tailFocusProxyRef = React21.useRef(null), wrapperRef = React21.useRef(null), ref = React21.useRef(null), onViewportChange = React21.useCallback((el) => {
    context.viewports[name] !== el && context.onViewportChange(name, el);
  }, [name, context.viewports]), composedRefs = useComposedRefs(forwardedRef, ref, onViewportChange), hotkeyLabel = hotkey.join("+").replace(/Key/g, "").replace(/Digit/g, ""), hasToasts = context.toastCount > 0;
  React21.useEffect(() => {
    if (!isWeb || context.toastCount === 0) return;
    const handleKeyDown = /* @__PURE__ */ __name((event) => {
      hotkey.every((key) => event[key] || event.code === key) && ref.current?.focus();
    }, "handleKeyDown");
    return document.addEventListener("keydown", handleKeyDown), () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hotkey, context.toastCount]), React21.useEffect(() => {
    if (!isWeb || context.toastCount === 0) return;
    const wrapper = wrapperRef.current, viewport = ref.current;
    if (hasToasts && wrapper && viewport) {
      const handlePause = /* @__PURE__ */ __name(() => {
        if (!context.isClosePausedRef.current) {
          const pauseEvent = new CustomEvent(VIEWPORT_PAUSE);
          viewport.dispatchEvent(pauseEvent), context.isClosePausedRef.current = true;
        }
      }, "handlePause"), handleResume = /* @__PURE__ */ __name(() => {
        if (context.isClosePausedRef.current) {
          const resumeEvent = new CustomEvent(VIEWPORT_RESUME);
          viewport.dispatchEvent(resumeEvent), context.isClosePausedRef.current = false;
        }
      }, "handleResume"), handleFocusOutResume = /* @__PURE__ */ __name((event) => {
        !wrapper.contains(event.relatedTarget) && handleResume();
      }, "handleFocusOutResume"), handlePointerLeaveResume = /* @__PURE__ */ __name(() => {
        wrapper.contains(document.activeElement) || handleResume();
      }, "handlePointerLeaveResume");
      return wrapper.addEventListener("focusin", handlePause), wrapper.addEventListener("focusout", handleFocusOutResume), wrapper.addEventListener("pointermove", handlePause), wrapper.addEventListener("pointerleave", handlePointerLeaveResume), window.addEventListener("blur", handlePause), window.addEventListener("focus", handleResume), () => {
        wrapper.removeEventListener("focusin", handlePause), wrapper.removeEventListener("focusout", handleFocusOutResume), wrapper.removeEventListener("pointermove", handlePause), wrapper.removeEventListener("pointerleave", handlePointerLeaveResume), window.removeEventListener("blur", handlePause), window.removeEventListener("focus", handleResume);
      };
    }
  }, [hasToasts, context.isClosePausedRef, context.toastCount]);
  const getSortedTabbableCandidates = React21.useCallback(({
    tabbingDirection
  }) => {
    const tabbableCandidates = getItems().map((toastItem) => {
      const toastNode = toastItem.ref.current, toastTabbableCandidates = [toastNode, ...getTabbableCandidates(toastNode)];
      return tabbingDirection === "forwards" ? toastTabbableCandidates : toastTabbableCandidates.reverse();
    });
    return (tabbingDirection === "forwards" ? tabbableCandidates.reverse() : tabbableCandidates).flat();
  }, [getItems]);
  React21.useEffect(() => {
    if (!isWeb || context.toastCount === 0) return;
    const viewport = ref.current;
    if (viewport) {
      const handleKeyDown = /* @__PURE__ */ __name((event) => {
        const isMetaKey = event.altKey || event.ctrlKey || event.metaKey;
        if (event.key === "Tab" && !isMetaKey) {
          const focusedElement = document.activeElement, isTabbingBackwards = event.shiftKey;
          if (event.target === viewport && isTabbingBackwards) {
            headFocusProxyRef.current?.focus();
            return;
          }
          const sortedCandidates = getSortedTabbableCandidates({
            tabbingDirection: isTabbingBackwards ? "backwards" : "forwards"
          }), index = sortedCandidates.findIndex((candidate) => candidate === focusedElement);
          focusFirst(sortedCandidates.slice(index + 1)) ? event.preventDefault() : isTabbingBackwards ? (
            // @ts-ignore ali TODO type
            headFocusProxyRef.current?.focus()
          ) : (
            // @ts-ignore ali TODO type
            tailFocusProxyRef.current?.focus()
          );
        }
      }, "handleKeyDown");
      return viewport.addEventListener("keydown", handleKeyDown), () => viewport.removeEventListener("keydown", handleKeyDown);
    }
  }, [getItems, getSortedTabbableCandidates, context.toastCount]);
  const contents = /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(ToastViewportWrapperFrame, {
    ref: wrapperRef,
    role: "region",
    "aria-label": label.replace("{hotkey}", hotkeyLabel),
    tabIndex: -1,
    children: [hasToasts && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(FocusProxy, {
      context,
      viewportName: name,
      ref: headFocusProxyRef,
      onFocusFromOutsideViewport: /* @__PURE__ */ __name(() => {
        const tabbableCandidates = getSortedTabbableCandidates({
          tabbingDirection: "forwards"
        });
        focusFirst(tabbableCandidates);
      }, "onFocusFromOutsideViewport")
    }), /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(Collection.Slot, {
      scope: context.toastScope,
      children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ToastViewportFrame, {
        focusable: context.toastCount > 0,
        ref: composedRefs,
        ...viewportProps,
        children: /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(PortalHost, {
          render: /* @__PURE__ */ __name((children) => /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(AnimatePresence, {
            exitBeforeEnter: !multipleToasts,
            children
          }), "render"),
          name: name ?? "default"
        })
      })
    }), hasToasts && /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(FocusProxy, {
      context,
      viewportName: name,
      ref: tailFocusProxyRef,
      onFocusFromOutsideViewport: /* @__PURE__ */ __name(() => {
        const tabbableCandidates = getSortedTabbableCandidates({
          tabbingDirection: "backwards"
        });
        focusFirst(tabbableCandidates);
      }, "onFocusFromOutsideViewport")
    })]
  });
  return portalToRoot ? /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(ToastPortal, {
    context,
    ...typeof zIndex == "number" ? {
      zIndex
    } : {},
    children: contents
  }) : contents;
}));
ToastViewport.displayName = VIEWPORT_NAME;
var FOCUS_PROXY_NAME = "ToastFocusProxy";
var FocusProxy = React21.forwardRef((props, forwardedRef) => {
  const {
    onFocusFromOutsideViewport,
    viewportName,
    context,
    ...proxyProps
  } = props, viewport = context.viewports[viewportName];
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(VisuallyHidden, {
    "aria-hidden": true,
    tabIndex: 0,
    ...proxyProps,
    ref: forwardedRef,
    position: isWeb ? "fixed" : "absolute",
    onFocus: /* @__PURE__ */ __name((event) => {
      if (!isWeb) return;
      const prevFocusedElement = event.relatedTarget;
      !viewport?.contains(prevFocusedElement) && onFocusFromOutsideViewport();
    }, "onFocus")
  });
});
FocusProxy.displayName = FOCUS_PROXY_NAME;
function focusFirst(candidates) {
  if (!isWeb) return;
  const previouslyFocusedElement = document.activeElement;
  return candidates.some((candidate) => candidate === previouslyFocusedElement ? true : (candidate.focus(), document.activeElement !== previouslyFocusedElement));
}
__name(focusFirst, "focusFirst");
function getTabbableCandidates(container) {
  if (!isWeb) return [];
  const containerHtml = container, nodes = [], walker = document.createTreeWalker(containerHtml, NodeFilter.SHOW_ELEMENT, {
    acceptNode: /* @__PURE__ */ __name((node) => {
      const isHiddenInput = node.tagName === "INPUT" && node.type === "hidden";
      return node.disabled || node.hidden || isHiddenInput ? NodeFilter.FILTER_SKIP : node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }, "acceptNode")
  });
  for (; walker.nextNode(); ) nodes.push(walker.currentNode);
  return nodes;
}
__name(getTabbableCandidates, "getTabbableCandidates");

// ../../node_modules/@tamagui/toast/dist/esm/ToastImpl.mjs
var import_jsx_runtime13 = require("react/jsx-runtime");
var ToastImplFrame = (0, import_core9.styled)(ThemeableStack, {
  name: "ToastImpl",
  focusable: true,
  variants: {
    unstyled: {
      false: {
        focusStyle: {
          outlineStyle: "solid",
          outlineWidth: 2,
          outlineColor: "$outlineColor"
        },
        backgroundColor: "$color6",
        borderRadius: "$10",
        paddingHorizontal: "$5",
        paddingVertical: "$2",
        marginHorizontal: "auto",
        marginVertical: "$1"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1"
  }
});
var {
  Provider: ToastInteractiveProvider,
  useStyledContext: useToastInteractiveContext
} = (0, import_core9.createStyledContext)({
  onClose() {
  }
});
var ToastImpl = React22.forwardRef((props, forwardedRef) => {
  const {
    scope,
    type = "foreground",
    duration: durationProp,
    open,
    onClose,
    onEscapeKeyDown,
    onPause,
    onResume,
    onSwipeStart,
    onSwipeMove,
    onSwipeCancel,
    onSwipeEnd,
    viewportName = "default",
    ...toastProps
  } = props, isPresent2 = useIsPresent(), context = useToastProviderContext(scope), [node, setNode] = React22.useState(null), composedRefs = useComposedRefs(forwardedRef, setNode), duration = durationProp || context.duration, closeTimerStartTimeRef = React22.useRef(0), closeTimerRemainingTimeRef = React22.useRef(duration), closeTimerRef = React22.useRef(0), {
    onToastAdd,
    onToastRemove
  } = context, viewport = React22.useMemo(() => context.viewports[viewportName], [context.viewports, viewportName]), handleClose = (0, import_core9.useEvent)(() => {
    isPresent2 && (isWeb && node?.contains(document.activeElement) && viewport?.focus(), onClose());
  }), startTimer = React22.useCallback((duration2) => {
    !duration2 || duration2 === Number.POSITIVE_INFINITY || (clearTimeout(closeTimerRef.current), closeTimerStartTimeRef.current = (/* @__PURE__ */ new Date()).getTime(), closeTimerRef.current = setTimeout(handleClose, duration2));
  }, [handleClose]), handleResume = React22.useCallback(() => {
    startTimer(closeTimerRemainingTimeRef.current), onResume?.();
  }, [onResume, startTimer]), handlePause = React22.useCallback(() => {
    const elapsedTime = (/* @__PURE__ */ new Date()).getTime() - closeTimerStartTimeRef.current;
    closeTimerRemainingTimeRef.current = closeTimerRemainingTimeRef.current - elapsedTime, window.clearTimeout(closeTimerRef.current), onPause?.();
  }, [onPause]);
  React22.useEffect(() => {
    if (isWeb && viewport) return viewport.addEventListener(VIEWPORT_PAUSE, handlePause), viewport.addEventListener(VIEWPORT_RESUME, handleResume), () => {
      viewport.removeEventListener(VIEWPORT_PAUSE, handlePause), viewport.removeEventListener(VIEWPORT_RESUME, handleResume);
    };
  }, [viewport, duration, onPause, onResume, startTimer]), React22.useEffect(() => {
    open && !context.isClosePausedRef.current && startTimer(duration);
  }, [open, duration, context.isClosePausedRef, startTimer]), React22.useEffect(() => (onToastAdd(), () => onToastRemove()), [onToastAdd, onToastRemove]);
  const announceTextContent = React22.useMemo(() => isWeb && node ? getAnnounceTextContent(node) : null, [node]), isHorizontalSwipe = ["left", "right", "horizontal"].includes(context.swipeDirection), {
    animationDriver
  } = (0, import_core9.useConfiguration)();
  if (!animationDriver) throw new Error("Must set animations in tamagui.config.ts");
  const {
    useAnimatedNumber,
    useAnimatedNumberStyle
  } = animationDriver, animatedNumber = useAnimatedNumber(0), AnimatedView = animationDriver.NumberView ?? animationDriver.View ?? import_core9.Stack, animatedStyles = useAnimatedNumberStyle(animatedNumber, (val) => {
    "worklet";
    return {
      transform: [isHorizontalSwipe ? {
        translateX: val
      } : {
        translateY: val
      }]
    };
  }), panResponder = React22.useMemo(() => import_react_native_web2.PanResponder.create({
    onMoveShouldSetPanResponder: /* @__PURE__ */ __name((e, gesture) => shouldGrantGestureMove(context.swipeDirection, gesture) ? (onSwipeStart?.(e), true) : false, "onMoveShouldSetPanResponder"),
    onPanResponderGrant: /* @__PURE__ */ __name((e) => {
      isWeb || handlePause?.();
    }, "onPanResponderGrant"),
    onPanResponderMove: /* @__PURE__ */ __name((e, gesture) => {
      const {
        x,
        y
      } = getGestureDistance(context.swipeDirection, gesture), delta = {
        x,
        y
      };
      animatedNumber.setValue(isHorizontalSwipe ? x : y, {
        type: "direct"
      }), isDeltaInDirection(delta, context.swipeDirection, context.swipeThreshold) && onSwipeEnd?.(e), onSwipeMove?.(e);
    }, "onPanResponderMove"),
    onPanResponderEnd: /* @__PURE__ */ __name((e, {
      dx,
      dy
    }) => {
      isDeltaInDirection({
        x: dx,
        y: dy
      }, context.swipeDirection, context.swipeThreshold) || (isWeb || handleResume?.(), onSwipeCancel?.(e), animatedNumber.setValue(0, {
        type: "spring"
      }));
    }, "onPanResponderEnd")
  }), [handlePause, handleResume]), themeName = (0, import_core9.useThemeName)();
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(import_jsx_runtime13.Fragment, {
    children: [announceTextContent && /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ToastAnnounce, {
      scope,
      role: "status",
      "aria-live": type === "foreground" ? "assertive" : "polite",
      "aria-atomic": true,
      children: announceTextContent
    }), /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(GorhomPortalItem, {
      hostName: viewportName ?? "default",
      children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ToastInteractiveProvider, {
        scope,
        onClose: /* @__PURE__ */ __name(() => {
          handleClose();
        }, "onClose"),
        children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Dismissable, {
          onEscapeKeyDown: composeEventHandlers(onEscapeKeyDown, () => {
            context.isFocusedToastEscapeKeyDownRef.current || handleClose(), context.isFocusedToastEscapeKeyDownRef.current = false;
          }),
          children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(import_core9.Theme, {
            contain: true,
            forceClassName: true,
            name: themeName,
            children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(AnimatedView, {
              ...panResponder?.panHandlers,
              style: [{
                margin: "auto"
              }, animatedStyles],
              children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(Collection.ItemSlot, {
                scope: context.toastScope,
                children: /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(ToastImplFrame, {
                  role: "status",
                  "aria-live": "off",
                  "aria-atomic": true,
                  "data-state": open ? "open" : "closed",
                  "data-swipe-direction": context.swipeDirection,
                  pointerEvents: "auto",
                  touchAction: "none",
                  userSelect: "none",
                  ...toastProps,
                  ref: composedRefs,
                  ...isWeb && {
                    onKeyDown: composeEventHandlers(props.onKeyDown, (event) => {
                      event.key === "Escape" && (onEscapeKeyDown?.(event), onEscapeKeyDown?.(event), event.defaultPrevented || (context.isFocusedToastEscapeKeyDownRef.current = true, handleClose()));
                    })
                  }
                })
              })
            })
          })
        })
      }, props.id)
    })]
  });
});
ToastImpl.propTypes = {
  type(props) {
    if (props.type && !["foreground", "background"].includes(props.type)) {
      const error = `Invalid prop \`type\` supplied to \`${TOAST_NAME}\`. Expected \`foreground | background\`.`;
      return new Error(error);
    }
    return null;
  }
};
var isDeltaInDirection = /* @__PURE__ */ __name((delta, direction, threshold = 0) => {
  const deltaX = Math.abs(delta.x), deltaY = Math.abs(delta.y), isDeltaX = deltaX > deltaY;
  return direction === "left" || direction === "right" || direction === "horizontal" ? isDeltaX && deltaX > threshold : !isDeltaX && deltaY > threshold;
}, "isDeltaInDirection");
function getAnnounceTextContent(container) {
  if (!isWeb) return "";
  const textContent = [];
  return Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === node.TEXT_NODE && node.textContent && textContent.push(node.textContent), isHTMLElement(node)) {
      const isHidden = node.ariaHidden || node.hidden || node.style.display === "none", isExcluded = node.dataset.toastAnnounceExclude === "";
      if (!isHidden) if (isExcluded) {
        const altText = node.dataset.toastAnnounceAlt;
        altText && textContent.push(altText);
      } else textContent.push(...getAnnounceTextContent(node));
    }
  }), textContent;
}
__name(getAnnounceTextContent, "getAnnounceTextContent");
function isHTMLElement(node) {
  return node.nodeType === node.ELEMENT_NODE;
}
__name(isHTMLElement, "isHTMLElement");
var GESTURE_GRANT_THRESHOLD = 10;
var shouldGrantGestureMove = /* @__PURE__ */ __name((dir, {
  dx,
  dy
}) => (dir === "horizontal" || dir === "left") && dx < -GESTURE_GRANT_THRESHOLD || (dir === "horizontal" || dir === "right") && dx > GESTURE_GRANT_THRESHOLD || (dir === "vertical" || dir === "up") && dy > -GESTURE_GRANT_THRESHOLD || (dir === "vertical" || dir === "down") && dy < GESTURE_GRANT_THRESHOLD, "shouldGrantGestureMove");
var getGestureDistance = /* @__PURE__ */ __name((dir, {
  dx,
  dy
}) => {
  let y = 0, x = 0;
  return dir === "horizontal" ? x = dx : dir === "left" ? x = Math.min(0, dx) : dir === "right" ? x = Math.max(0, dx) : dir === "vertical" ? y = dy : dir === "up" ? y = Math.min(0, dy) : dir === "down" && (y = Math.max(0, dy)), {
    x,
    y
  };
}, "getGestureDistance");

// ../../node_modules/@tamagui/toast/dist/esm/Toast.mjs
var import_jsx_runtime14 = require("react/jsx-runtime");
var TITLE_NAME = "ToastTitle";
var ToastTitle = (0, import_core10.styled)(SizableText2, {
  name: TITLE_NAME,
  variants: {
    unstyled: {
      false: {
        color: "$color",
        size: "$4"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1"
  }
});
var DESCRIPTION_NAME = "ToastDescription";
var ToastDescription = (0, import_core10.styled)(SizableText2, {
  name: DESCRIPTION_NAME,
  variants: {
    unstyled: {
      false: {
        color: "$color11",
        size: "$1"
      }
    }
  },
  defaultVariants: {
    unstyled: process.env.TAMAGUI_HEADLESS === "1"
  }
});
var ACTION_NAME = "ToastAction";
var ToastAction = React23.forwardRef(function(props, forwardedRef) {
  const {
    altText,
    ...actionProps
  } = props;
  return altText ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ToastAnnounceExclude, {
    altText,
    asChild: true,
    children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ToastClose, {
      ...actionProps,
      ref: forwardedRef
    })
  }) : null;
});
ToastAction.propTypes = {
  altText(props) {
    return props.altText ? null : new Error(`Missing prop \`altText\` expected on \`${ACTION_NAME}\``);
  }
};
var CLOSE_NAME = "ToastClose";
var ToastCloseFrame = (0, import_core10.styled)(ThemeableStack, {
  name: CLOSE_NAME,
  tag: "button"
});
var ToastClose = React23.forwardRef(function(props, forwardedRef) {
  const {
    scope,
    ...closeProps
  } = props, interactiveContext = useToastInteractiveContext(scope);
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ToastAnnounceExclude, {
    asChild: true,
    children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ToastCloseFrame, {
      accessibilityLabel: "Dialog Close",
      ...closeProps,
      ref: forwardedRef,
      onPress: composeEventHandlers(props.onPress, interactiveContext.onClose)
    })
  });
});
var ToastComponent = ToastImplFrame.styleable(function(props, forwardedRef) {
  const {
    forceMount,
    open: openProp,
    defaultOpen,
    onOpenChange,
    ...toastProps
  } = props, [open, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen ?? true,
    onChange: onOpenChange,
    strategy: "most-recent-wins"
  }), currentToast = useToastState(), {
    hide
  } = useToastController(), id = React23.useId(), onPause = (0, import_core10.useEvent)(props.onPause), onResume = (0, import_core10.useEvent)(props.onResume), isHide = currentToast?.hide === true;
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(AnimatePresence, {
    children: (forceMount || open) && !isHide ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(ToastImpl, {
      id,
      open,
      ...toastProps,
      ref: forwardedRef,
      onClose: /* @__PURE__ */ __name(() => {
        setOpen(false), hide();
      }, "onClose"),
      onPause,
      onResume,
      onSwipeEnd: composeEventHandlers(props.onSwipeEnd, (event) => {
        setOpen(false);
      })
    }) : null
  }, id);
});
var Toast2 = withStaticProperties(ToastComponent, {
  Title: ToastTitle,
  Description: ToastDescription,
  Action: ToastAction,
  Close: ToastClose
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Toast,
  ToastProvider,
  ToastViewport,
  useToast,
  useToastController,
  useToastState
});
