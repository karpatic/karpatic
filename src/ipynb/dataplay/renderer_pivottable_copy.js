
/*
Heatmap post-processing
  */
$.fn.heatmap = function(scope, opts) {
  console.log('called heatmap', {scope, opts})
  var colorScaleGenerator, heatmapper, i, j, l, n, numCols, numRows, ref, ref1, ref2;
  if (scope == null) {
    scope = "heatmap";
  }
  numRows = this.data("numrows");
  numCols = this.data("numcols");
  console.log('heatmap: ', {numRows, numCols})
  colorScaleGenerator = opts != null ? (ref = opts.heatmap) != null ? ref.colorScaleGenerator : void 0 : void 0;
  if (colorScaleGenerator == null) {
    colorScaleGenerator = function(values) {
      var max, min;
      min = Math.min.apply(Math, values);
      max = Math.max.apply(Math, values);
      return function(x) {
        var nonRed;
        nonRed = 255 - Math.round(255 * (x - min) / (max - min));
        return "rgb(255," + nonRed + "," + nonRed + ")";
      };
    };
  }
  heatmapper = (function(_this) { 
    return function(scope) {
      console.log('HEATMAPPER', {scope}, _this.find(scope))
      var colorScale, forEachCell, values;
  
      forEachCell = function(number) {
          _this.find(scope).each(function() {
              var x = $(this).data("value"); 
              if ((x != null) && isFinite(x)) {
                  if (number === 1) {
                      values.push(x);
                      console.log({pushThis: x});
                  } else if (number === 2) {
                      let color = colorScale(x);
                      let el = $(this).css("background-color", color);
                      console.log('forEachCell', {x, color, el});
                      return el;
                  }
              }
          });
      };
  
      values = [];
      forEachCell(1); // for pushing values
      colorScale = colorScaleGenerator(values);
      console.log('colorScale', {colorScale});
      return forEachCell(2); // for applying colors
    };
  })(this);
  switch (scope) {
    case "heatmap": 
      heatmapper(".pvtVal");
      break;
    case "rowheatmap":
      for (i = l = 0, ref1 = numRows; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
        heatmapper(".pvtVal.row" + i);
      }
      break;
    case "colheatmap":
      for (j = n = 0, ref2 = numCols; 0 <= ref2 ? n < ref2 : n > ref2; j = 0 <= ref2 ? ++n : --n) {
        heatmapper(".pvtVal.col" + j);
      }
  }
  // heatmapper(".pvtTotal.rowTotal");
  // heatmapper(".pvtTotal.colTotal");
  console.log({ret:this[0]})
  return this[0];
};

/*
Barchart post-processing
  */
$.fn.barchart = function(opts) {
  var barcharter, i, l, numCols, numRows, ref;
  numRows = this.data("numrows");
  numCols = this.data("numcols");
  barcharter = (function(_this) {
    return function(scope) {
      var forEachCell, max, min, range, scaler, values;
      forEachCell = function(f) {
        return _this.find(scope).each(function() {
          var x;
          x = $(this).data("value");
          if ((x != null) && isFinite(x)) {
            return f(x, $(this));
          }
        });
      };
      values = [];
      forEachCell(function(x) {
        return values.push(x);
      });
      max = Math.max.apply(Math, values);
      if (max < 0) {
        max = 0;
      }
      range = max;
      min = Math.min.apply(Math, values);
      if (min < 0) {
        range = max - min;
      }
      scaler = function(x) {
        return 100 * x / (1.4 * range);
      };
      return forEachCell(function(x, elem) {
        var bBase, bgColor, text, wrapper;
        text = elem.text();
        wrapper = $("<div>").css({
          "position": "relative",
          "height": "55px"
        });
        bgColor = "gray";
        bBase = 0;
        if (min < 0) {
          bBase = scaler(-min);
        }
        if (x < 0) {
          bBase += scaler(x);
          bgColor = "darkred";
          x = -x;
        }
        wrapper.append($("<div>").css({
          "position": "absolute",
          "bottom": bBase + "%",
          "left": 0,
          "right": 0,
          "height": scaler(x) + "%",
          "background-color": bgColor
        }));
        wrapper.append($("<div>").text(text).css({
          "position": "relative",
          "padding-left": "5px",
          "padding-right": "5px"
        }));
        return elem.css({
          "padding": 0,
          "padding-top": "5px",
          "text-align": "center"
        }).html(wrapper);
      });
    };
  })(this);
  for (i = l = 0, ref = numRows; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
    barcharter(".pvtVal.row" + i);
  }
  barcharter(".pvtTotal.colTotal");
  return this;
};