/*
Utilities
*/
var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; }
var slice = [].slice
var bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }
var hasProp = {}.hasOwnProperty
function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

var PivotData, addSeparators, aggregatorTemplates, aggregators, dayNamesEn, derivers, getSort, locales, mthNamesEn, naturalSort, numberFormat, pivotTableRenderer, rd, renderers, rx, rz, sortAs, usFmt, usFmtInt, usFmtPct, zeroPad;
addSeparators = function(nStr, thousandsSep, decimalSep) {
  var rgx, x, x1, x2;
  nStr += '';
  x = nStr.split('.');
  x1 = x[0];
  x2 = x.length > 1 ? decimalSep + x[1] : '';
  rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + thousandsSep + '$2');
  }
  return x1 + x2;
};
numberFormat = function(opts) {
  var defaults;
  defaults = {
    digitsAfterDecimal: 2,
    scaler: 1,
    thousandsSep: ",",
    decimalSep: ".",
    prefix: "",
    suffix: ""
  };
  opts = deepMerge({}, defaults, opts);
  return function(x) {
    var result;
    if (isNaN(x) || !isFinite(x)) {
      return "";
    }
    result = addSeparators((opts.scaler * x).toFixed(opts.digitsAfterDecimal), opts.thousandsSep, opts.decimalSep);
    return "" + opts.prefix + result + opts.suffix;
  };
};
usFmt = numberFormat();
usFmtInt = numberFormat({
  digitsAfterDecimal: 0
});
usFmtPct = numberFormat({
  digitsAfterDecimal: 1,
  scaler: 100,
  suffix: "%"
});
aggregatorTemplates = {
  count: function(formatter) {
    if (formatter == null) {
      formatter = usFmtInt;
    }
    return function() {
      return function(data, rowKey, colKey) {
        return {
          count: 0,
          push: function() {
            return this.count++;
          },
          value: function() {
            return this.count;
          },
          format: formatter
        };
      };
    };
  },
  uniques: function(fn, formatter) {
    if (formatter == null) {
      formatter = usFmtInt;
    }
    return function(arg) {
      var attr;
      attr = arg[0];
      return function(data, rowKey, colKey) {
        return {
          uniq: [],
          push: function(record) {
            var ref;
            if (ref = record[attr], indexOf.call(this.uniq, ref) < 0) {
              return this.uniq.push(record[attr]);
            }
          },
          value: function() {
            return fn(this.uniq);
          },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },
  sum: function(formatter) {
    if (formatter == null) {
      formatter = usFmt;
    }
    return function(arg) {
      var attr;
      attr = arg[0];
      return function(data, rowKey, colKey) {
        return {
          sum: 0,
          push: function(record) {
            if (!isNaN(parseFloat(record[attr]))) {
              return this.sum += parseFloat(record[attr]);
            }
          },
          value: function() {
            return this.sum;
          },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },
  extremes: function(mode, formatter) {
    if (formatter == null) {
      formatter = usFmt;
    }
    return function(arg) {
      var attr;
      attr = arg[0];
      return function(data, rowKey, colKey) {
        return {
          val: null,
          sorter: getSort(data != null ? data.sorters : void 0, attr),
          push: function(record) {
            var ref, ref1, ref2, x;
            x = record[attr];
            if (mode === "min" || mode === "max") {
              x = parseFloat(x);
              if (!isNaN(x)) {
                this.val = Math[mode](x, (ref = this.val) != null ? ref : x);
              }
            }
            if (mode === "first") {
              if (this.sorter(x, (ref1 = this.val) != null ? ref1 : x) <= 0) {
                this.val = x;
              }
            }
            if (mode === "last") {
              if (this.sorter(x, (ref2 = this.val) != null ? ref2 : x) >= 0) {
                return this.val = x;
              }
            }
          },
          value: function() {
            return this.val;
          },
          format: function(x) {
            if (isNaN(x)) {
              return x;
            } else {
              return formatter(x);
            }
          },
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },
  quantile: function(q, formatter) {
    if (formatter == null) {
      formatter = usFmt;
    }
    return function(arg) {
      var attr;
      attr = arg[0];
      return function(data, rowKey, colKey) {
        return {
          vals: [],
          push: function(record) {
            var x;
            x = parseFloat(record[attr]);
            if (!isNaN(x)) {
              return this.vals.push(x);
            }
          },
          value: function() {
            var i;
            if (this.vals.length === 0) {
              return null;
            }
            this.vals.sort(function(a, b) {
              return a - b;
            });
            i = (this.vals.length - 1) * q;
            return (this.vals[Math.floor(i)] + this.vals[Math.ceil(i)]) / 2.0;
          },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },
  runningStat: function(mode, ddof, formatter) {
    if (mode == null) {
      mode = "mean";
    }
    if (ddof == null) {
      ddof = 1;
    }
    if (formatter == null) {
      formatter = usFmt;
    }
    return function(arg) {
      var attr;
      attr = arg[0];
      return function(data, rowKey, colKey) {
        return {
          n: 0.0,
          m: 0.0,
          s: 0.0,
          push: function(record) {
            var m_new, x;
            x = parseFloat(record[attr]);
            if (isNaN(x)) {
              return;
            }
            this.n += 1.0;
            if (this.n === 1.0) {
              return this.m = x;
            } else {
              m_new = this.m + (x - this.m) / this.n;
              this.s = this.s + (x - this.m) * (x - m_new);
              return this.m = m_new;
            }
          },
          value: function() {
            if (mode === "mean") {
              if (this.n === 0) {
                return 0 / 0;
              } else {
                return this.m;
              }
            }
            if (this.n <= ddof) {
              return 0;
            }
            switch (mode) {
              case "var":
                return this.s / (this.n - ddof);
              case "stdev":
                return Math.sqrt(this.s / (this.n - ddof));
            }
          },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },
  sumOverSum: function(formatter) {
    if (formatter == null) {
      formatter = usFmt;
    }
    return function(arg) {
      var denom, num;
      num = arg[0], denom = arg[1];
      return function(data, rowKey, colKey) {
        return {
          sumNum: 0,
          sumDenom: 0,
          push: function(record) {
            if (!isNaN(parseFloat(record[num]))) {
              this.sumNum += parseFloat(record[num]);
            }
            if (!isNaN(parseFloat(record[denom]))) {
              return this.sumDenom += parseFloat(record[denom]);
            }
          },
          value: function() {
            return this.sumNum / this.sumDenom;
          },
          format: formatter,
          numInputs: (num != null) && (denom != null) ? 0 : 2
        };
      };
    };
  },
  sumOverSumBound80: function(upper, formatter) {
    if (upper == null) {
      upper = true;
    }
    if (formatter == null) {
      formatter = usFmt;
    }
    return function(arg) {
      var denom, num;
      num = arg[0], denom = arg[1];
      return function(data, rowKey, colKey) {
        return {
          sumNum: 0,
          sumDenom: 0,
          push: function(record) {
            if (!isNaN(parseFloat(record[num]))) {
              this.sumNum += parseFloat(record[num]);
            }
            if (!isNaN(parseFloat(record[denom]))) {
              return this.sumDenom += parseFloat(record[denom]);
            }
          },
          value: function() {
            var sign;
            sign = upper ? 1 : -1;
            return (0.821187207574908 / this.sumDenom + this.sumNum / this.sumDenom + 1.2815515655446004 * sign * Math.sqrt(0.410593603787454 / (this.sumDenom * this.sumDenom) + (this.sumNum * (1 - this.sumNum / this.sumDenom)) / (this.sumDenom * this.sumDenom))) / (1 + 1.642374415149816 / this.sumDenom);
          },
          format: formatter,
          numInputs: (num != null) && (denom != null) ? 0 : 2
        };
      };
    };
  },
  fractionOf: function(wrapped, type, formatter) {
    if (type == null) {
      type = "total";
    }
    if (formatter == null) {
      formatter = usFmtPct;
    }
    return function() {
      var x;
      x = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return function(data, rowKey, colKey) {
        return {
          selector: {
            total: [[], []],
            row: [rowKey, []],
            col: [[], colKey]
          }[type],
          inner: wrapped.apply(null, x)(data, rowKey, colKey),
          push: function(record) {
            return this.inner.push(record);
          },
          format: formatter,
          value: function() {
            return this.inner.value() / data.getAggregator.apply(data, this.selector).inner.value();
          },
          numInputs: wrapped.apply(null, x)().numInputs
        };
      };
    };
  }
};
aggregatorTemplates.countUnique = function(f) {
  return aggregatorTemplates.uniques((function(x) {
    return x.length;
  }), f);
};
aggregatorTemplates.listUnique = function(s) {
  return aggregatorTemplates.uniques((function(x) {
    return x.sort(naturalSort).join(s);
  }), (function(x) {
    return x;
  }));
};
aggregatorTemplates.max = function(f) {
  return aggregatorTemplates.extremes('max', f);
};
aggregatorTemplates.min = function(f) {
  return aggregatorTemplates.extremes('min', f);
};
aggregatorTemplates.first = function(f) {
  return aggregatorTemplates.extremes('first', f);
};
aggregatorTemplates.last = function(f) {
  return aggregatorTemplates.extremes('last', f);
};
aggregatorTemplates.median = function(f) {
  return aggregatorTemplates.quantile(0.5, f);
};
aggregatorTemplates.average = function(f) {
  return aggregatorTemplates.runningStat("mean", 1, f);
};
aggregatorTemplates["var"] = function(ddof, f) {
  return aggregatorTemplates.runningStat("var", ddof, f);
};
aggregatorTemplates.stdev = function(ddof, f) {
  return aggregatorTemplates.runningStat("stdev", ddof, f);
};
aggregators = (function(tpl) {
  return {
    "Count": tpl.count(usFmtInt),
    "Count Unique Values": tpl.countUnique(usFmtInt),
    "List Unique Values": tpl.listUnique(", "),
    "Sum": tpl.sum(usFmt),
    "Integer Sum": tpl.sum(usFmtInt),
    "Average": tpl.average(usFmt),
    "Median": tpl.median(usFmt),
    "Sample Variance": tpl["var"](1, usFmt),
    "Sample Standard Deviation": tpl.stdev(1, usFmt),
    "Minimum": tpl.min(usFmt),
    "Maximum": tpl.max(usFmt),
    "First": tpl.first(usFmt),
    "Last": tpl.last(usFmt),
    "Sum over Sum": tpl.sumOverSum(usFmt),
    "80% Upper Bound": tpl.sumOverSumBound80(true, usFmt),
    "80% Lower Bound": tpl.sumOverSumBound80(false, usFmt),
    "Sum as Fraction of Total": tpl.fractionOf(tpl.sum(), "total", usFmtPct),
    "Sum as Fraction of Rows": tpl.fractionOf(tpl.sum(), "row", usFmtPct),
    "Sum as Fraction of Columns": tpl.fractionOf(tpl.sum(), "col", usFmtPct),
    "Count as Fraction of Total": tpl.fractionOf(tpl.count(), "total", usFmtPct),
    "Count as Fraction of Rows": tpl.fractionOf(tpl.count(), "row", usFmtPct),
    "Count as Fraction of Columns": tpl.fractionOf(tpl.count(), "col", usFmtPct)
  };
})(aggregatorTemplates);

renderers = {
  "Table": function(data, opts) {
    return pivotTableRenderer(data, opts);
  },
  "Table Barchart": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).barchart();
  },
  "Heatmap": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).heatmap("heatmap", opts);
  },
  "Row Heatmap": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).heatmap("rowheatmap", opts);
  },
  "Col Heatmap": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).heatmap("colheatmap", opts);
  }
};

/*
renderers = {
  "Table": function(data, opts) {
    return pivotTableRenderer(data, opts);
  },
  "Table Barchart": function(data, opts) {
    let table = pivotTableRenderer(data, opts);
    // Replace with your own barchart implementation
    window.barchart(table);
    return table;
  },
  "Heatmap": function(data, opts) {
    let table = pivotTableRenderer(data, opts);
    // Replace with your own heatmap implementation
    window.heatmap(table, "heatmap", opts);
    return table;
  },
  "Row Heatmap": function(data, opts) {
    let table = pivotTableRenderer(data, opts);
    // Replace with your own row heatmap implementation
    window.heatmap(table, "rowheatmap", opts);
    return table;
  },
  "Col Heatmap": function(data, opts) {
    let table = pivotTableRenderer(data, opts);
    // Replace with your own column heatmap implementation
    window.heatmap(table, "colheatmap", opts);
    return table;
  }
}; 
*/

locales = {
  en: {
    aggregators: aggregators,
    renderers: renderers,
    localeStrings: {
      renderError: "An error occurred rendering the PivotTable results.",
      computeError: "An error occurred computing the PivotTable results.",
      uiRenderError: "An error occurred rendering the PivotTable UI.",
      selectAll: "Select All",
      selectNone: "Select None",
      tooMany: "(too many to list)",
      filterResults: "Filter values",
      apply: "Apply",
      cancel: "Cancel",
      totals: "Totals",
      vs: "vs",
      by: "by"
    }
  }
};
mthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
zeroPad = function(number) {
  return ("0" + number).substr(-2, 2);
};
derivers = {
  bin: function(col, binWidth) {
    return function(record) {
      return record[col] - record[col] % binWidth;
    };
  },
  dateFormat: function(col, formatString, utcOutput, mthNames, dayNames) {
    var utc;
    if (utcOutput == null) {
      utcOutput = false;
    }
    if (mthNames == null) {
      mthNames = mthNamesEn;
    }
    if (dayNames == null) {
      dayNames = dayNamesEn;
    }
    utc = utcOutput ? "UTC" : "";
    return function(record) {
      var date;
      date = new Date(Date.parse(record[col]));
      if (isNaN(date)) {
        return "";
      }
      return formatString.replace(/%(.)/g, function(m, p) {
        switch (p) {
          case "y":
            return date["get" + utc + "FullYear"]();
          case "m":
            return zeroPad(date["get" + utc + "Month"]() + 1);
          case "n":
            return mthNames[date["get" + utc + "Month"]()];
          case "d":
            return zeroPad(date["get" + utc + "Date"]());
          case "w":
            return dayNames[date["get" + utc + "Day"]()];
          case "x":
            return date["get" + utc + "Day"]();
          case "H":
            return zeroPad(date["get" + utc + "Hours"]());
          case "M":
            return zeroPad(date["get" + utc + "Minutes"]());
          case "S":
            return zeroPad(date["get" + utc + "Seconds"]());
          default:
            return "%" + p;
        }
      });
    };
  }
};
rx = /(\d+)|(\D+)/g;
rd = /\d/;
rz = /^0/;
naturalSort = (function(_this) {
  return function(as, bs) {
    var a, a1, b, b1, nas, nbs;
    if ((bs != null) && (as == null)) {
      return -1;
    }
    if ((as != null) && (bs == null)) {
      return 1;
    }
    if (typeof as === "number" && isNaN(as)) {
      return -1;
    }
    if (typeof bs === "number" && isNaN(bs)) {
      return 1;
    }
    nas = +as;
    nbs = +bs;
    if (nas < nbs) {
      return -1;
    }
    if (nas > nbs) {
      return 1;
    }
    if (typeof as === "number" && typeof bs !== "number") {
      return -1;
    }
    if (typeof bs === "number" && typeof as !== "number") {
      return 1;
    }
    if (typeof as === "number" && typeof bs === "number") {
      return 0;
    }
    if (isNaN(nbs) && !isNaN(nas)) {
      return -1;
    }
    if (isNaN(nas) && !isNaN(nbs)) {
      return 1;
    }
    a = String(as);
    b = String(bs);
    if (a === b) {
      return 0;
    }
    if (!(rd.test(a) && rd.test(b))) {
      return (a > b ? 1 : -1);
    }
    a = a.match(rx);
    b = b.match(rx);
    while (a.length && b.length) {
      a1 = a.shift();
      b1 = b.shift();
      if (a1 !== b1) {
        if (rd.test(a1) && rd.test(b1)) {
          return a1.replace(rz, ".0") - b1.replace(rz, ".0");
        } else {
          return (a1 > b1 ? 1 : -1);
        }
      }
    }
    return a.length - b.length;
  };
})(this);
sortAs = function(order) {
  var i, l_mapping, mapping, x;
  mapping = {};
  l_mapping = {};
  for (i in order) {
    x = order[i];
    mapping[x] = i;
    if (typeof x === "string") {
      l_mapping[x.toLowerCase()] = i;
    }
  }
  return function(a, b) {
    if ((mapping[a] != null) && (mapping[b] != null)) {
      return mapping[a] - mapping[b];
    } else if (mapping[a] != null) {
      return -1;
    } else if (mapping[b] != null) {
      return 1;
    } else if ((l_mapping[a] != null) && (l_mapping[b] != null)) {
      return l_mapping[a] - l_mapping[b];
    } else if (l_mapping[a] != null) {
      return -1;
    } else if (l_mapping[b] != null) {
      return 1;
    } else {
      return naturalSort(a, b);
    }
  };
};
getSort = function(sorters, attr) {
  var sort;
  if (sorters != null) {
    if (typeof sorters === 'function') {
      sort = sorters(attr);
      if (typeof sort === 'function') {
        return sort;
      }
    } else if (sorters[attr] != null) {
      return sorters[attr];
    }    
  }
  return naturalSort;
};

/*
Data Model class
  */
PivotData = (function() {
  function PivotData(input, opts) {
    // console.log('PivotData opts.aggregatorName', opts.aggregatorName)
    var ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
    if (opts == null) { opts = {}; }
    this.getAggregator = bind(this.getAggregator, this);
    this.getRowKeys = bind(this.getRowKeys, this);
    this.getColKeys = bind(this.getColKeys, this);
    this.sortKeys = bind(this.sortKeys, this);
    this.arrSort = bind(this.arrSort, this);
    this.input = input;
    this.aggregator = (ref = opts.aggregator) != null ? ref : aggregatorTemplates.count()();
    this.aggregatorName = (ref1 = opts.aggregatorName) != null ? ref1 : "Count";
    this.colAttrs = (ref2 = opts.cols) != null ? ref2 : [];
    this.rowAttrs = (ref3 = opts.rows) != null ? ref3 : [];
    this.valAttrs = (ref4 = opts.vals) != null ? ref4 : [];
    this.sorters = (ref5 = opts.sorters) != null ? ref5 : {};
    this.rowOrder = (ref6 = opts.rowOrder) != null ? ref6 : "key_a_to_z";
    this.colOrder = (ref7 = opts.colOrder) != null ? ref7 : "key_a_to_z";
    this.derivedAttributes = (ref8 = opts.derivedAttributes) != null ? ref8 : {};
    this.filter = (ref9 = opts.filter) != null ? ref9 : (function() {
      return true;
    });
    this.tree = {};
    this.rowKeys = [];
    this.colKeys = [];
    this.rowTotals = {};
    this.colTotals = {};
    this.allTotal = this.aggregator(this, [], []);
    this.sorted = false;
    PivotData.forEachRecord(this.input, this.derivedAttributes, (function(_this) {
      return function(record) {
        if (_this.filter(record)) {
          return _this.processRecord(record);
        }
      };
    })(this));
  }

  PivotData.forEachRecord = function(input, derivedAttributes, f) {
    var addRecord, compactRecord, i, j, k, l, len1, record, ref, results, results1, tblCols;
    if (Object.keys(derivedAttributes).length === 0) {
      addRecord = f;
    } else {
      addRecord = function(record) {
        var k, ref, v;
        for (k in derivedAttributes) {
          v = derivedAttributes[k];
          record[k] = (ref = v(record)) != null ? ref : record[k];
        }
        return f(record);
      };
    }
    if (typeof input === 'function') {
      return input(addRecord);
    } else if (Array.isArray(input)) {    
      if (Array.isArray(input[0])) {
        results = [];
        for (i in input) {
          if (!hasProp.call(input, i)) continue;
          compactRecord = input[i];
          if (!(i > 0)) {
            continue;
          }
          record = {};
          ref = input[0];
          for (j in ref) {
            if (!hasProp.call(ref, j)) continue;
            k = ref[j];
            record[k] = compactRecord[j];
          }
          results.push(addRecord(record));
        }
        return results;
      } else {
        results1 = [];
        for (l = 0, len1 = input.length; l < len1; l++) {
          record = input[l];
          results1.push(addRecord(record));
        }
        return results1;
      }
    } else if (input instanceof HTMLElement) {
      tblCols = [];
      input.querySelectorAll("thead > tr > th").forEach(function(th, i) {
        tblCols.push(th.textContent);
      });
      input.querySelectorAll("tbody > tr").forEach(function(tr, i) {
        let record = {};
        tr.querySelectorAll("td").forEach(function(td, j) {
          record[tblCols[j]] = td.textContent;
        });
        addRecord(record);
      });
    } else {
      throw new Error("unknown input format");
    }
  };

  PivotData.prototype.forEachMatchingRecord = function(criteria, callback) {
    return PivotData.forEachRecord(this.input, this.derivedAttributes, (function(_this) {
      return function(record) {
        var k, ref, v;
        if (!_this.filter(record)) {
          return;
        }
        for (k in criteria) {
          v = criteria[k];
          if (v !== ((ref = record[k]) != null ? ref : "null")) {
            return;
          }
        }
        return callback(record);
      };
    })(this));
  };

  PivotData.prototype.arrSort = function(attrs) {
    var a, sortersArr;
    sortersArr = (function() {
      var l, len1, results;
      results = [];
      for (l = 0, len1 = attrs.length; l < len1; l++) {
        a = attrs[l];
        results.push(getSort(this.sorters, a));
      }
      return results;
    }).call(this);
    return function(a, b) {
      var comparison, i, sorter;
      for (i in sortersArr) {
        if (!hasProp.call(sortersArr, i)) continue;
        sorter = sortersArr[i];
        comparison = sorter(a[i], b[i]);
        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    };
  };

  PivotData.prototype.sortKeys = function() {
    var v;
    if (!this.sorted) {
      this.sorted = true;
      v = (function(_this) {
        return function(r, c) {
          return _this.getAggregator(r, c).value();
        };
      })(this);
      switch (this.rowOrder) {
        case "value_a_to_z":
          this.rowKeys.sort((function(_this) {
            return function(a, b) {
              return naturalSort(v(a, []), v(b, []));
            };
          })(this));
          break;
        case "value_z_to_a":
          this.rowKeys.sort((function(_this) {
            return function(a, b) {
              return -naturalSort(v(a, []), v(b, []));
            };
          })(this));
          break;
        default:
          this.rowKeys.sort(this.arrSort(this.rowAttrs));
      }
      switch (this.colOrder) {
        case "value_a_to_z":
          return this.colKeys.sort((function(_this) {
            return function(a, b) {
              return naturalSort(v([], a), v([], b));
            };
          })(this));
        case "value_z_to_a":
          return this.colKeys.sort((function(_this) {
            return function(a, b) {
              return -naturalSort(v([], a), v([], b));
            };
          })(this));
        default:
          return this.colKeys.sort(this.arrSort(this.colAttrs));
      }
    }
  };

  PivotData.prototype.getColKeys = function() {
    this.sortKeys();
    return this.colKeys;
  };

  PivotData.prototype.getRowKeys = function() {
    this.sortKeys();
    return this.rowKeys;
  };

  PivotData.prototype.processRecord = function(record) {
    var colKey, flatColKey, flatRowKey, l, len1, len2, n, ref, ref1, ref2, ref3, rowKey, x;
    colKey = [];
    rowKey = [];
    ref = this.colAttrs;
    for (l = 0, len1 = ref.length; l < len1; l++) {
      x = ref[l];
      colKey.push((ref1 = record[x]) != null ? ref1 : "null");
    }
    ref2 = this.rowAttrs;
    for (n = 0, len2 = ref2.length; n < len2; n++) {
      x = ref2[n];
      rowKey.push((ref3 = record[x]) != null ? ref3 : "null");
    }
    flatRowKey = rowKey.join(String.fromCharCode(0));
    flatColKey = colKey.join(String.fromCharCode(0));
    this.allTotal.push(record);
    if (rowKey.length !== 0) {
      if (!this.rowTotals[flatRowKey]) {
        this.rowKeys.push(rowKey);
        this.rowTotals[flatRowKey] = this.aggregator(this, rowKey, []);
      }
      this.rowTotals[flatRowKey].push(record);
    }
    if (colKey.length !== 0) {
      if (!this.colTotals[flatColKey]) {
        this.colKeys.push(colKey);
        this.colTotals[flatColKey] = this.aggregator(this, [], colKey);
      }
      this.colTotals[flatColKey].push(record);
    }
    if (colKey.length !== 0 && rowKey.length !== 0) {
      if (!this.tree[flatRowKey]) {
        this.tree[flatRowKey] = {};
      }
      if (!this.tree[flatRowKey][flatColKey]) {
        this.tree[flatRowKey][flatColKey] = this.aggregator(this, rowKey, colKey);
      }
      return this.tree[flatRowKey][flatColKey].push(record);
    }
  };

  PivotData.prototype.getAggregator = function(rowKey, colKey) {
    var agg, flatColKey, flatRowKey;
    flatRowKey = rowKey.join(String.fromCharCode(0));
    flatColKey = colKey.join(String.fromCharCode(0));
    if (rowKey.length === 0 && colKey.length === 0) {
      agg = this.allTotal;
    } else if (rowKey.length === 0) {
      agg = this.colTotals[flatColKey];
    } else if (colKey.length === 0) {
      agg = this.rowTotals[flatRowKey];
    } else {
      agg = this.tree[flatRowKey][flatColKey];
    }
    return agg != null ? agg : {
      value: (function() {
        return null;
      }),
      format: function() {
        return "";
      }
    };
  };

  return PivotData;

})();
window.pivotUtilities = {
  aggregatorTemplates: aggregatorTemplates,
  aggregators: aggregators,
  renderers: renderers,
  derivers: derivers,
  locales: locales,
  naturalSort: naturalSort,
  numberFormat: numberFormat,
  sortAs: sortAs,
  PivotData: PivotData
};

/*
Default Renderer for hierarchical table layout
  */
pivotTableRenderer = function(pivotData, opts) {
  console.log('pivotTableRender', {pivotData, opts})
  var aggregator, c, colAttrs, colKey, colKeys, defaults, getClickHandler, i, j, r, result, rowAttrs, rowKey, rowKeys, spanSize, tbody, td, th, thead, totalAggregator, tr, txt, val, x;
  defaults = {
    table: {
      clickCallback: null,
      rowTotals: true,
      colTotals: true
    },
    localeStrings: {
      totals: "Totals"
    }
  };
  opts = deepMerge({}, defaults, opts);
  colAttrs = pivotData.colAttrs;
  rowAttrs = pivotData.rowAttrs;
  rowKeys = pivotData.getRowKeys();
  colKeys = pivotData.getColKeys();
  if (opts.table.clickCallback) {
    getClickHandler = function(value, rowValues, colValues) {
      var attr, filters, i;
      filters = {};
      for (i in colAttrs) {
        if (!hasProp.call(colAttrs, i)) continue;
        attr = colAttrs[i];
        if (colValues[i] != null) {
          filters[attr] = colValues[i];
        }
      }
      for (i in rowAttrs) {
        if (!hasProp.call(rowAttrs, i)) continue;
        attr = rowAttrs[i];
        if (rowValues[i] != null) {
          filters[attr] = rowValues[i];
        }
      }
      return function(e) {
        // ('CLICK CALLBACK')
        return opts.table.clickCallback(e, value, filters, pivotData);
      };
    };
  }
  result = document.createElement("table");
  result.className = "pvtTable";
  spanSize = function(arr, i, j) {
    var l, len, n, noDraw, ref, ref1, stop, x;
    if (i !== 0) {
      noDraw = true;
      for (x = l = 0, ref = j; 0 <= ref ? l <= ref : l >= ref; x = 0 <= ref ? ++l : --l) {
        if (arr[i - 1][x] !== arr[i][x]) {
          noDraw = false;
        }
      }
      if (noDraw) {
        return -1;
      }
    }
    len = 0;
    while (i + len < arr.length) {
      stop = false;
      for (x = n = 0, ref1 = j; 0 <= ref1 ? n <= ref1 : n >= ref1; x = 0 <= ref1 ? ++n : --n) {
        if (arr[i][x] !== arr[i + len][x]) {
          stop = true;
        }
      }
      if (stop) {
        break;
      }
      len++;
    }
    return len;
  };
  thead = document.createElement("thead");
  for (j in colAttrs) {
    if (!hasProp.call(colAttrs, j)) continue;
    c = colAttrs[j];
    tr = document.createElement("tr");
    if (parseInt(j) === 0 && rowAttrs.length !== 0) {
      th = document.createElement("th");
      th.setAttribute("colspan", rowAttrs.length);
      th.setAttribute("rowspan", colAttrs.length);
      tr.appendChild(th);
    }
    th = document.createElement("th");
    th.className = "pvtAxisLabel";
    th.textContent = c;
    tr.appendChild(th);
    for (i in colKeys) {
      if (!hasProp.call(colKeys, i)) continue;
      colKey = colKeys[i];
      x = spanSize(colKeys, parseInt(i), parseInt(j));
      if (x !== -1) {
        th = document.createElement("th");
        th.className = "pvtColLabel";
        th.textContent = colKey[j];
        th.setAttribute("colspan", x);
        if (parseInt(j) === colAttrs.length - 1 && rowAttrs.length !== 0) {
          th.setAttribute("rowspan", 2);
        }
        tr.appendChild(th);
      }
    }
    if (parseInt(j) === 0 && opts.table.rowTotals) {
      th = document.createElement("th");
      th.className = "pvtTotalLabel pvtRowTotalLabel";
      th.innerHTML = opts.localeStrings.totals;
      th.setAttribute("rowspan", colAttrs.length + (rowAttrs.length === 0 ? 0 : 1));
      tr.appendChild(th);
    }
    thead.appendChild(tr);
  }
  if (rowAttrs.length !== 0) {
    tr = document.createElement("tr");
    for (i in rowAttrs) {
      if (!hasProp.call(rowAttrs, i)) continue;
      r = rowAttrs[i];
      th = document.createElement("th");
      th.className = "pvtAxisLabel";
      th.textContent = r;
      tr.appendChild(th);
    }
    th = document.createElement("th");
    if (colAttrs.length === 0) {
      th.className = "pvtTotalLabel pvtRowTotalLabel";
      th.innerHTML = opts.localeStrings.totals;
    }
    tr.appendChild(th);
    thead.appendChild(tr);
  }
  result.appendChild(thead);
  tbody = document.createElement("tbody");
  for (i in rowKeys) {
    if (!hasProp.call(rowKeys, i)) continue;
    rowKey = rowKeys[i];
    tr = document.createElement("tr");
    for (j in rowKey) {
      if (!hasProp.call(rowKey, j)) continue;
      txt = rowKey[j];
      x = spanSize(rowKeys, parseInt(i), parseInt(j));
      if (x !== -1) {
        th = document.createElement("th");
        th.className = "pvtRowLabel";
        th.textContent = txt;
        th.setAttribute("rowspan", x);
        if (parseInt(j) === rowAttrs.length - 1 && colAttrs.length !== 0) {
          th.setAttribute("colspan", 2);
        }
        tr.appendChild(th);
      }
    }
    for (j in colKeys) {
      if (!hasProp.call(colKeys, j)) continue;
      colKey = colKeys[j];
      aggregator = pivotData.getAggregator(rowKey, colKey);
      val = aggregator.value();
      td = document.createElement("td");
      td.className = "pvtVal row" + i + " col" + j;
      td.textContent = aggregator.format(val);
      td.setAttribute("data-value", val);
      if (getClickHandler != null) {
        td.onclick = getClickHandler(val, rowKey, colKey);
      }
      tr.appendChild(td);
    }
    if (opts.table.rowTotals || colAttrs.length === 0) {
      totalAggregator = pivotData.getAggregator(rowKey, []);
      val = totalAggregator.value();
      td = document.createElement("td");
      td.className = "pvtTotal rowTotal";
      td.textContent = totalAggregator.format(val);
      td.setAttribute("data-value", val);
      if (getClickHandler != null) {
        td.onclick = getClickHandler(val, rowKey, []);
      }
      td.setAttribute("data-for", "row" + i);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  if (opts.table.colTotals || rowAttrs.length === 0) {
    tr = document.createElement("tr");
    if (opts.table.colTotals || rowAttrs.length === 0) {
      th = document.createElement("th");
      th.className = "pvtTotalLabel pvtColTotalLabel";
      th.innerHTML = opts.localeStrings.totals;
      th.setAttribute("colspan", rowAttrs.length + (colAttrs.length === 0 ? 0 : 1));
      tr.appendChild(th);
    }
    for (j in colKeys) {
      if (!hasProp.call(colKeys, j)) continue;
      colKey = colKeys[j];
      totalAggregator = pivotData.getAggregator([], colKey);
      val = totalAggregator.value();
      td = document.createElement("td");
      td.className = "pvtTotal colTotal";
      td.textContent = totalAggregator.format(val);
      td.setAttribute("data-value", val);
      if (getClickHandler != null) {
        td.onclick = getClickHandler(val, [], colKey);
      }
      td.setAttribute("data-for", "col" + j);
      tr.appendChild(td);
    }
    if (opts.table.rowTotals || colAttrs.length === 0) {
      totalAggregator = pivotData.getAggregator([], []);
      val = totalAggregator.value();
      td = document.createElement("td");
      td.className = "pvtGrandTotal";
      td.textContent = totalAggregator.format(val);
      td.setAttribute("data-value", val);
      if (getClickHandler != null) {
        td.onclick = getClickHandler(val, [], []);
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  result.appendChild(tbody);
  result.setAttribute("data-numrows", rowKeys.length);
  result.setAttribute("data-numcols", colKeys.length);
  return result;
};

/*
Pivot Table core: create PivotData object and call Renderer on it
  */
window.pivot = (element, input, options, locale) => {
  // ('Pivot', {element, input, options, locale})
  let defaults, e, localeDefaults, localeStrings, opts, pivotData, result;
  if (!locale) {
      locale = "en";
  }
  if (!locales[locale]) {
      locale = "en";
  }
  defaults = {
      cols: [], rows: [], vals: [],
      rowOrder: "key_a_to_z",
      colOrder: "key_a_to_z",
      dataClass: PivotData,
      filter: function() { return true; },
      aggregator: aggregatorTemplates.count()(),
      aggregatorName: "Count",
      sorters: {},
      derivedAttributes: {},
      renderer: pivotTableRenderer
  };
  localeStrings = deepMerge({}, locales.en.localeStrings, locales[locale].localeStrings);
  localeDefaults = { rendererOptions: { localeStrings: localeStrings }, localeStrings: localeStrings };
  opts = deepMerge({}, localeDefaults, deepMerge({}, defaults, options));
  // console.log({opts})

  try {
      pivotData = new opts.dataClass(input, opts);
      try { result = opts.renderer(pivotData, opts.rendererOptions); } 
      catch (error) {
          e = error;
          if (typeof console !== "undefined" && console !== null) { console.error(e.stack); }
          result = document.createElement("span");
          result.innerHTML = opts.localeStrings.renderError;
      }
  } catch (error) {
      e = error;
      if (typeof console !== "undefined" && console !== null) { console.error(e.stack); }
      result = document.createElement("span");
      result.innerHTML = opts.localeStrings.computeError;
  }

  element.innerHTML = result.outerHTML;
}


/*
Pivot Table UI: calls Pivot Table core above with options set by user
  */
window.pivotUI = (element, input, inputOpts, overwrite, locale) => {
  console.log('pivotui', {element, input, inputOpts, overwrite, locale})
  var a, aggregator, attr, attrLength, attrValues, c, colOrderArrow, defaults, e, existingOpts, fn1, i, initialRender, l, len1, len2, len3, localeDefaults, localeStrings, materializedInput, n, o, opts, ordering, pivotTable, recordsProcessed, ref, ref1, ref2, ref3, refresh, refreshDelayed, renderer, rendererControl, rowOrderArrow, shownAttributes, shownInAggregators, shownInDragDrop, tr1, tr2, uiTable, unused, unusedAttrsVerticalAutoCutoff, unusedAttrsVerticalAutoOverride, x;
  if (overwrite == null) {    overwrite = false;  }
  if (locale == null) {    locale = "en";  }
  if (locales[locale] == null) {    locale = "en";  }
  defaults = {
    derivedAttributes: {},
    aggregators: locales[locale].aggregators,
    renderers: locales[locale].renderers,
    hiddenAttributes: [],
    hiddenFromAggregators: [],
    hiddenFromDragDrop: [],
    menuLimit: 500,
    cols: [],
    rows: [],
    vals: [],
    rowOrder: "key_a_to_z",
    colOrder: "key_a_to_z",
    dataClass: PivotData,
    exclusions: {},
    inclusions: {},
    unusedAttrsVertical: 85,
    autoSortUnusedAttrs: false,
    onRefresh: null,
    showUI: true,
    filter: function() {
      return true;
    },
    sorters: {}
  };
  localeStrings = deepMerge({}, locales.en.localeStrings, locales[locale].localeStrings);
  localeDefaults = {
    rendererOptions: {
      localeStrings: localeStrings
    },
    localeStrings: localeStrings
  }; 

  // Merge passed in optionswith or the existing options if stored in the element data attribute to defaults
  existingOpts = element.dataset?.pivotUIOptions || null;
  if ((existingOpts == null) || overwrite) { 
    opts = deepMerge({}, localeDefaults, deepMerge({}, defaults, inputOpts));
  } 
  else {    opts = existingOpts;  }

  try {
    attrValues = {};
    materializedInput = [];
    recordsProcessed = 0;
    PivotData.forEachRecord(input, opts.derivedAttributes, function(record) {
      var attr, base, ref, value;
      if (!opts.filter(record)) {
        return;
      }
      materializedInput.push(record);
      for (attr in record) {
        if (!hasProp.call(record, attr)) continue;
        if (attrValues[attr] == null) {
          attrValues[attr] = {};
          if (recordsProcessed > 0) {
            attrValues[attr]["null"] = recordsProcessed;
          }
        }
      }
      for (attr in attrValues) {
        value = (ref = record[attr]) != null ? ref : "null";
        if ((base = attrValues[attr])[value] == null) {
          base[value] = 0;
        }
        attrValues[attr][value]++;
      }
      return recordsProcessed++;
    }); 

    uiTable = document.createElement("table");
    uiTable.className = "pvtUi";
    uiTable.setAttribute("cellpadding", 5);
    
    rendererControl = document.createElement('td');
    rendererControl.classList.add('pvtUiCell');
    renderer = document.createElement('select');
    renderer.classList.add('pvtRenderer');
    let rendererID = 'id_' + Math.random().toString(36).substr(2, 9); // Generate a unique ID
    renderer.id = rendererID; // Assign the unique ID to the select element
    rendererControl.appendChild(renderer); 
    setTimeout(function(){
      renderer = document.getElementById(rendererID); // Use the unique ID to get the select element
      renderer.addEventListener('change', (e) => {
          console.log(renderer.value);
          return refresh();
      });
    }, 250);
    
    ref = opts.renderers;
    for (x in ref) {
      if (!Object.prototype.hasOwnProperty.call(ref, x)) continue;
      var option = document.createElement("option");
      option.value = x;
      option.innerHTML = x;
      renderer.appendChild(option);
    }

    unused = document.createElement('td');
    unused.classList.add('pvtAxisContainer', 'pvtUnused', 'pvtUiCell');

    shownAttributes = (function() {
      var results;
      results = [];
      for (a in attrValues) {
        if (indexOf.call(opts.hiddenAttributes, a) < 0) {
          results.push(a);
        }
      }
      return results;
    })();
    shownInAggregators = (function() {
      var l, len1, results;
      results = [];
      for (l = 0, len1 = shownAttributes.length; l < len1; l++) {
        c = shownAttributes[l];
        if (indexOf.call(opts.hiddenFromAggregators, c) < 0) {
          results.push(c);
        }
      }
      return results;
    })();
    shownInDragDrop = (function() {
      var l, len1, results;
      results = [];
      for (l = 0, len1 = shownAttributes.length; l < len1; l++) {
        c = shownAttributes[l];
        if (indexOf.call(opts.hiddenFromDragDrop, c) < 0) {
          results.push(c);
        }
      }
      return results;
    })();
    unusedAttrsVerticalAutoOverride = false;
    if (opts.unusedAttrsVertical === "auto") {
      unusedAttrsVerticalAutoCutoff = 120;
    } else {
      unusedAttrsVerticalAutoCutoff = parseInt(opts.unusedAttrsVertical);
    }
    if (!isNaN(unusedAttrsVerticalAutoCutoff)) {
      attrLength = 0;
      for (l = 0, len1 = shownInDragDrop.length; l < len1; l++) {
        a = shownInDragDrop[l];
        attrLength += a.length;
      }
      unusedAttrsVerticalAutoOverride = attrLength > unusedAttrsVerticalAutoCutoff;
    }
    if (opts.unusedAttrsVertical === true || unusedAttrsVerticalAutoOverride) {
      unused.classList.add('pvtVertList');
    } else {
      unused.classList.add('pvtHorizList');
    }
  
    fn1 = function(attr) {
      var attrElem, checkContainer, closeFilterBox, controls, filterItem, filterItemExcluded, finalButtons, hasExcludedItem, len2, n, placeholder, ref1, sorter, triangleLink, v, value, valueCount, valueList, values;
      values = (function() {
        var results;
        results = [];
        for (v in attrValues[attr]) {
          results.push(v);
        }
        return results;
      })();
      hasExcludedItem = false;
      valueList = document.createElement("div");
      valueList.classList.add('pvtFilterBox');
      valueList.style.display = 'none';
      
      let h4 = document.createElement("h4");
      let span1 = document.createElement("span");
      span1.textContent = attr;
      let span2 = document.createElement("span");
      span2.classList.add("count");
      span2.textContent = `(${values.length})`;
      
      h4.appendChild(span1);
      h4.appendChild(span2);
      valueList.appendChild(h4);
      
      if (values.length > opts.menuLimit) { 
        let paragraph = document.createElement('p');
        paragraph.innerHTML = opts.localeStrings.tooMany;
        valueList.appendChild(paragraph);
      } else { 
        if (values.length > 5) {
          let keyUpFunction = function() {
            var accept, accept_gen, filter;
            filter = this.value.toLowerCase().trim();
            accept_gen = function(prefix, accepted) {
              return function(v) {
                var real_filter, ref1;
                real_filter = filter.substring(prefix.length).trim();
                if (real_filter.length === 0) {
                  return true;
                }
                return ref1 = Math.sign(sorter(v.toLowerCase(), real_filter)), indexOf.call(accepted, ref1) >= 0;
              };
            };
            accept = filter.indexOf(">=") === 0 ? accept_gen(">=", [1, 0]) : filter.indexOf("<=") === 0 ? accept_gen("<=", [-1, 0]) : filter.indexOf(">") === 0 ? accept_gen(">", [1]) : filter.indexOf("<") === 0 ? accept_gen("<", [-1]) : filter.indexOf("~") === 0 ? function(v) {
              if (filter.substring(1).trim().length === 0) {
                return true;
              }
              return v.toLowerCase().match(filter.substring(1));
            } : function(v) {
              return v.toLowerCase().indexOf(filter) !== -1;
            };
            return valueList.find('.pvtCheckContainer p label span.value').each(function() {
              if (accept(this.textContent)) {
                return this.parentElement.parentElement.style.display = 'block';
              } else {
                return this.parentElement.parentElement.style.display = 'none';
              }
            });
          };
          let controls = valueList.appendChild(document.createElement('p'));
          sorter = getSort(opts.sorters, attr);
          placeholder = opts.localeStrings.filterResults;
          let input = document.createElement('input');
          input.type = 'text';
          input.placeholder = placeholder;
          input.className = 'pvtSearch';
          input.addEventListener('keyup', keyUpFunction);
          controls.appendChild(input);          
          controls.appendChild(document.createElement('br'));
          let selectAllButton = document.createElement('button');
          selectAllButton.type = 'button';
          selectAllButton.innerHTML = opts.localeStrings.selectAll;
          selectAllButton.addEventListener('click', function() {
              valueList.querySelectorAll('input:visible:not(:checked)').forEach(input => {
                  input.checked = true;
                  input.classList.toggle('changed');
              });
              return false;
          });
          controls.appendChild(selectAllButton);
          
          let selectNoneButton = document.createElement('button');
          selectNoneButton.type = 'button';
          selectNoneButton.innerHTML = opts.localeStrings.selectNone;
          selectNoneButton.addEventListener('click', function() {
              valueList.querySelectorAll('input:visible:checked').forEach(input => {
                  input.checked = false;
                  input.classList.toggle('changed');
              });
              return false;
          });
          controls.appendChild(selectNoneButton);
          
        }
        let checkContainer = document.createElement("div");
        checkContainer.classList.add("pvtCheckContainer");
        valueList.appendChild(checkContainer);

        ref1 = values.sort(getSort(opts.sorters, attr));
        for (let n = 0, len2 = ref1.length; n < len2; n++) {
          let value = ref1[n];
          let valueCount = attrValues[attr][value];
          let filterItem = document.createElement("label");
          let filterItemExcluded = false;
        
          if (opts.inclusions[attr]) {
            filterItemExcluded = !opts.inclusions[attr].includes(value);
          } else if (opts.exclusions[attr]) {
            filterItemExcluded = opts.exclusions[attr].includes(value);
          }
        
          hasExcludedItem = hasExcludedItem || filterItemExcluded;
        
          let input = document.createElement("input");
          input.setAttribute("type", "checkbox");
          input.classList.add('pvtFilter');
          input.checked = !filterItemExcluded;
          input.dataset.filter = JSON.stringify([attr, value]);
          input.addEventListener("change", function() {
            this.classList.toggle("changed");
          });
        
          filterItem.appendChild(input);
        
          let valueSpan = document.createElement("span");
          valueSpan.classList.add("value");
          valueSpan.textContent = value;
          filterItem.appendChild(valueSpan);
        
          let countSpan = document.createElement("span");
          countSpan.classList.add("count");
          countSpan.textContent = `(${valueCount})`;
          filterItem.appendChild(countSpan);
        
          let p = document.createElement("p");
          p.appendChild(filterItem);
          checkContainer.appendChild(p);
        }
      }        
      closeFilterBox = function() {
        if (valueList.find("[type='checkbox']").length > valueList.find("[type='checkbox']:checked").length) {
          attrElem.addClass("pvtFilteredAttribute");
        } else {
          attrElem.removeClass("pvtFilteredAttribute");
        }
        valueList.find('.pvtSearch').val('');
        valueList.find('.pvtCheckContainer p').show();
        return valueList.hide();
      };
      finalButtons = document.createElement('p');
      valueList.appendChild(finalButtons);
      // Check if the number of values is within the specified limit
      if (values.length <= opts.menuLimit) {
        // Create a new button element
        let applyButton = document.createElement('button');
        applyButton.type = 'button';
        applyButton.textContent = opts.localeStrings.apply;

        // appendChild the button to the finalButtons container
        finalButtons.appendChild(applyButton);

        // Add a click event listener to the button
        applyButton.addEventListener('click', function() {
          // Find all elements with the class 'changed', remove the class, and check if any elements were processed
          let changedElements = valueList.querySelectorAll('.changed');
          if (changedElements.length) {
            changedElements.forEach(el => el.classList.remove('changed'));
            refresh(); // Call the refresh function if there were any changed elements
          }
          return closeFilterBox(); // Close the filter box
        });
      }

      let cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.textContent = opts.localeStrings.cancel;
      cancelButton.addEventListener('click', function() {
          valueList.querySelectorAll('.changed:checked').forEach(el => {
              el.classList.remove('changed');
              el.checked = false;
          });
          valueList.querySelectorAll('.changed:not(:checked)').forEach(el => {
              el.classList.remove('changed');
              el.checked = true;
          });
          return closeFilterBox();
      });
      finalButtons.appendChild(cancelButton);
      
      
      // Create a new span element
      var triangleLink = document.createElement('span');
      // Add 'pvtTriangle' class
      triangleLink.classList.add('pvtTriangle');
      // Set HTML content
      triangleLink.innerHTML = " &#x25BE;";

      // Bind click event
      triangleLink.addEventListener('click', function(e) {
          // Get the position of the clicked element
          var rect = e.currentTarget.getBoundingClientRect();
          var left = rect.left + window.scrollX;
          var top = rect.top + window.scrollY;

          // Apply the CSS to the valueList
          // Assuming valueList is a DOM element
          valueList.style.left = (left + 10) + 'px';
          valueList.style.top = (top + 10) + 'px';
          valueList.style.display = 'block'; // Use 'block' to show the element
      });

      attrElem = document.createElement('li');
      attrElem.classList.add('axis_' + i);
      const span = document.createElement('span');
      span.classList.add('pvtAttr');
      span.textContent = attr;
      span.dataset.attrName = attr;

      // Assuming triangleLink is already a DOM element
      span.appendChild(triangleLink);
      attrElem.appendChild(span);

      if (hasExcludedItem) {
        attrElem.addClass('pvtFilteredAttribute');
      }
      unused.appendChild(attrElem);
      unused.appendChild(valueList);
      return unused
    };
    for (i in shownInDragDrop) {
      if (!hasProp.call(shownInDragDrop, i)) continue;
      attr = shownInDragDrop[i];
      fn1(attr);
    } 
    tr1 = document.createElement("tr");
    uiTable.appendChild(tr1);

    aggregator = document.createElement("select");
    aggregator.classList.add('pvtAggregator');
    let aggregatorID = 'id_' + Math.random().toString(36).substr(2, 9); // Generate a unique ID
    aggregator.id = aggregatorID; // Assign the unique ID to the select element
    setTimeout(function(){
      aggregator = document.getElementById(aggregatorID); // Use the unique ID to get the select element
      aggregator.addEventListener('change', (e) => {
          console.log(aggregator.value);
          return refresh();
      });
    }, 250);


    ref1 = opts.aggregators; 
    for (x in ref1) {
      if (!hasProp.call(ref1, x)) continue; 
      var option = document.createElement('option'); 
      option.value = x; 
      // option.dataset.option = x;
      option.innerHTML = x; 
      aggregator.append(option);
    }
    ordering = {
      key_a_to_z: {
        rowSymbol: "&varr;",
        colSymbol: "&harr;",
        next: "value_a_to_z"
      },
      value_a_to_z: {
        rowSymbol: "&darr;",
        colSymbol: "&rarr;",
        next: "value_z_to_a"
      },
      value_z_to_a: {
        rowSymbol: "&uarr;",
        colSymbol: "&larr;",
        next: "key_a_to_z"
      }
    };
    rowOrderArrow = document.createElement('a');
    rowOrderArrow.setAttribute('role', 'button');
    rowOrderArrow.classList.add('pvtRowOrder');
    rowOrderArrow.dataset.order = opts.rowOrder;
    rowOrderArrow.innerHTML = ordering[opts.rowOrder].rowSymbol;
    
    rowOrderArrow.addEventListener('click', function() {
        this.dataset.order = ordering[this.dataset.order].next;
        this.innerHTML = ordering[this.dataset.order].rowSymbol;
        return refresh();
    });

    colOrderArrow = document.createElement('a');
    colOrderArrow.setAttribute('role', 'button');
    colOrderArrow.classList.add('pvtColOrder');
    colOrderArrow.dataset.order = opts.colOrder;
    colOrderArrow.innerHTML = ordering[opts.colOrder].colSymbol;
    
    colOrderArrow.addEventListener('click', function() {
        this.dataset.order = ordering[this.dataset.order].next;
        this.innerHTML = ordering[this.dataset.order].colSymbol;
        return refresh();
    });

    td = document.createElement('td');
    td.classList.add('pvtVals', 'pvtUiCell');
    td.appendChild(aggregator);
    td.appendChild(rowOrderArrow);
    td.appendChild(colOrderArrow);
    td.appendChild(document.createElement('br'));
    tr1.appendChild(td);
    
    td = document.createElement('td');
    td.classList.add('pvtAxisContainer','pvtHorizList','pvtCols','pvtUiCell')
    tr1.appendChild(td);
    
    tr2 = document.createElement("tr");
    uiTable.appendChild(tr2);
    
    var td = document.createElement("td");
    td.classList.add('pvtAxisContainer', 'pvtRows', 'pvtUiCell');
    td.setAttribute("valign", "top");
    
    tr2.appendChild(td);

    var pivotTable = document.createElement("td");
    pivotTable.setAttribute("valign", "top");
    pivotTable.classList.add('pvtRendererArea');
    tr2.appendChild(pivotTable);

    if (opts.unusedAttrsVertical === true || unusedAttrsVerticalAutoOverride) {
      uiTable.querySelector('tr:nth-child(1)').insertAdjacentElement('afterbegin', rendererControl);
      uiTable.querySelector('tr:nth-child(2)').insertAdjacentElement('afterbegin', unused);
    } else {
        var tr = document.createElement("tr");
        tr.appendChild(rendererControl);
        tr.appendChild(unused);
        uiTable.insertAdjacentElement('afterbegin', tr);
    }
  
    
    element.innerHTML = uiTable.outerHTML;
    ref2 = opts.cols;
    for (n = 0, len2 = ref2.length; n < len2; n++) {
      x = ref2[n]; 
      let axisElement = element.querySelector(".axis_" + shownInDragDrop.indexOf(x));
      element.querySelector(".pvtCols").appendChild(axisElement);
    }
    ref3 = opts.rows;
    for (o = 0, len3 = ref3.length; o < len3; o++) {
      x = ref3[o];
      let axisElement = element.querySelector(".axis_" + shownInDragDrop.indexOf(x));
      element.querySelector(".pvtRows").appendChild(axisElement);
    }
    if (opts.aggregatorName != null) {
      element.querySelector(".pvtAggregator").value = opts.aggregatorName;
    }
    
    if (opts.rendererName != null) {
        element.querySelector(".pvtRenderer").value = opts.rendererName;
    }
    
    if (!opts.showUI) {
        element.querySelector(".pvtUiCell").style.display = 'none';
    }
    initialRender = true;
    refreshDelayed = (function(element) {
      return function() {
        console.log("REFRESH DELAYED", aggregator.value)
        var exclusions, inclusions, len4, newDropdown, numInputsToProcess, pivotUIOptions, pvtVals, ref4, ref5, subopts, t, u, unusedAttrsContainer, vals;
        subopts = {
          derivedAttributes: opts.derivedAttributes,
          localeStrings: opts.localeStrings,
          rendererOptions: opts.rendererOptions,
          sorters: opts.sorters,
          cols: [],
          rows: [],
          dataClass: opts.dataClass
        };
        numInputsToProcess = (ref4 = opts.aggregators[aggregator.value]([])().numInputs) != null ? ref4 : 0;
        vals = [];

        // Grab all the values from the values dropdown
        const rowElems = element.querySelectorAll(".pvtRows li span.pvtAttr");
        rowElems.forEach(elem => { subopts.rows.push(elem.dataset.attrName ); });
        
        const colElems = element.querySelectorAll(".pvtCols li span.pvtAttr");
        colElems.forEach(elem => { subopts.cols.push(elem.dataset.attrName); }); 
        
        const valElems = element.querySelectorAll(".pvtVals select.pvtAttrDropdown");
        valElems.forEach(elem => { 
          if (numInputsToProcess === 0) { elem.remove(); } 
          else { numInputsToProcess--; if (elem.value !== "") { vals.push(elem.value); }  }
        }); 
        
        if (numInputsToProcess !== 0) {
          let pvtVals = element.querySelector(".pvtVals");
        
          for (let x = 0; x < numInputsToProcess; x++) {
            let newDropdown = document.createElement("select");
            newDropdown.classList.add('pvtAttrDropdown');
            newDropdown.appendChild(document.createElement("option"));
            newDropdown.addEventListener("change", function() {
              refresh();
            });
        
            for (let u = 0, len4 = shownInAggregators.length; u < len4; u++) {
              let attr = shownInAggregators[u];
              let option = document.createElement("option");
              option.value = attr;
              option.textContent = attr;
              newDropdown.appendChild(option);
            }
            pvtVals.appendChild(newDropdown);
          }
        }
        
        if (initialRender) { 
          vals = opts.vals;
          let selects = element.querySelectorAll(".pvtVals select.pvtAttrDropdown");
          selects.forEach((select, i) => {
            select.value = vals[i];
          });
          initialRender = false;
        }
        
        subopts.aggregatorName = aggregator.value;
        subopts.vals = vals;
        subopts.aggregator = opts.aggregators[aggregator.value](vals);
        subopts.renderer = opts.renderers[renderer.value];
        subopts.rowOrder = rowOrderArrow.dataset.order;
        subopts.colOrder = colOrderArrow.dataset.order;        
        exclusions = {};
        
        element.querySelectorAll('input.pvtFilter:not(:checked)').forEach(function(elem) {
          var filter = elem.getAttribute("data-filter").split(',');
          if (exclusions[filter[0]] != null) {
            exclusions[filter[0]].push(filter[1]);
          } else {
            exclusions[filter[0]] = [filter[1]];
          }
        });
        
        inclusions = {}; 
        element.querySelectorAll('input.pvtFilter:checked').forEach(function(elem) { 
          var filter = elem.getAttribute("data-filter").split(',');
          if (exclusions[filter[0]] != null) {
            if (inclusions[filter[0]] != null) {
              inclusions[filter[0]].push(filter[1]);
            } else {
              inclusions[filter[0]] = [filter[1]];
            }
          }
        });        
        subopts.filter = function(record) {
          var excludedItems, k, ref6, ref7;
          if (!opts.filter(record)) {
            return false;
          }
          for (k in exclusions) {
            excludedItems = exclusions[k];
            if (ref6 = "" + ((ref7 = record[k]) != null ? ref7 : 'null'), indexOf.call(excludedItems, ref6) >= 0) {
              return false;
            }
          }
          return true;
        };

        // window.pivotUI = (element, input, inputOpts, overwrite, locale)  
        let renderArea = element.getElementsByClassName('pvtRendererArea')[0]
        // ('calling pivot')
        window.pivot(renderArea, materializedInput, subopts )
        // { rows: ['Name'], cols: ['PetalWidth'], rendererName: 'Table', showUI: true }
        // pivotTable.pivot(materializedInput, subopts);
        pivotUIOptions = deepMerge({}, opts, {
          cols: subopts.cols,
          rows: subopts.rows,
          colOrder: subopts.colOrder,
          rowOrder: subopts.rowOrder,
          vals: vals,
          exclusions: exclusions,
          inclusions: inclusions,
          inclusionsInfo: inclusions,
          aggregatorName: aggregator.value,
          rendererName: renderer.value
        });
        pivotUIOptions = {}
        element.dataset.pivotUIOptions = JSON.stringify(pivotUIOptions);
        if (opts.autoSortUnusedAttrs) {
          unusedAttrsContainer = element.find("td.pvtUnused.pvtAxisContainer");
          let unusedAttrsContainer = element.querySelector('td.pvtUnused.pvtAxisContainer');
          let listItems = Array.from(unusedAttrsContainer.querySelectorAll('li'));
          listItems.sort(function(a, b) { return naturalSort(a.textContent, b.textContent); });
          listItems.forEach(li => unusedAttrsContainer.appendChild(li));          
        }
        
        pivotTable.style.opacity = 1;
        if (opts.onRefresh != null) {
          return opts.onRefresh(pivotUIOptions);
        }
      };
    })(element);

    refresh = (function(element) { 
      return function() {
        pivotTable.style.opacity = 0.5;
        return setTimeout(refreshDelayed, 10);
      };
    })(element); 
    refresh(); 
    
    // Initialize HTML5Sortable on .pvtAxisContainer elements
    sortable(element.querySelectorAll(".pvtAxisContainer"), {
      items: 'li',
      placeholder: 'pvtPlaceholder',
      acceptFrom: '.pvtAxisContainer', // Allows items to be moved between any .pvtAxisContainer elements
    }).forEach(sortableContainer => {
      sortableContainer.addEventListener('sortupdate', function(e) { 
        // Refresh or other logic when the order changes
        refresh(); 
        if (e.detail.origin.container === e.detail.destination.container) {
          refresh();
        }
      });
    });
    
  }
  catch (error) { 
    e = error;
    if (typeof console !== "undefined" && console !== null) {
      console.error(e.stack);
    }
    // element.innerHTML = opts.localeStrings.uiRenderError;
    // document.querySelector(input).innerHTML = opts.localeStrings.uiRenderError;
    // this.html(opts.localeStrings.uiRenderError);
  }
  return this;
};