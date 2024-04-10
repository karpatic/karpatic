/*
Heatmap post-processing
*/
window.heatmap = function(scope, opts) {
  var colorScaleGenerator, heatmapper, i, j, l, n, numCols, numRows, ref, ref1, ref2;
  if (scope == null) {
      scope = "heatmap";
  }
  numRows = this.dataset.numrows;
  numCols = this.dataset.numcols;
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
          var colorScale, forEachCell, values;
          forEachCell = function(f) {
              return Array.from(_this.querySelectorAll(scope)).forEach(function() {
                  var x;
                  x = this.dataset.value;
                  if ((x != null) && isFinite(x)) {
                      return f(x, this);
                  }
              });
          };
          values = [];
          forEachCell(function(x) {
              return values.push(x);
          });
          colorScale = colorScaleGenerator(values);
          return forEachCell(function(x, elem) {
              return elem.style.backgroundColor = colorScale(x);
          });
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
  heatmapper(".pvtTotal.rowTotal");
  heatmapper(".pvtTotal.colTotal");
  return this;
};

/*
Barchart post-processing
*/
window.barchart = function(opts) {
  var barcharter, i, l, numCols, numRows, ref;
  numRows = this.dataset.numrows;
  numCols = this.dataset.numcols;
  barcharter = (function(_this) {
      return function(scope) {
          var forEachCell, max, min, range, scaler, values;
          forEachCell = function(f) {
              return Array.from(_this.querySelectorAll(scope)).forEach(function() {
                  var x;
                  x = this.dataset.value;
                  if ((x != null) && isFinite(x)) {
                      return f(x, this);
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
              text = elem.textContent;
              wrapper = document.createElement('div');
              wrapper.style.position = "relative";
              wrapper.style.height = "55px";
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
              var innerDiv = document.createElement('div');
              innerDiv.style.position = "absolute";
              innerDiv.style.bottom = bBase + "%";
              innerDiv.style.left = 0;
              innerDiv.style.right = 0;
              innerDiv.style.height = scaler(x) + "%";
              innerDiv.style.backgroundColor = bgColor;
              wrapper.appendChild(innerDiv);
              
              var innerDiv2 = document.createElement('div');
              innerDiv2.textContent = text;
              innerDiv2.style.position = "relative";
              innerDiv2.style.paddingLeft = "5px";
              innerDiv2.style.paddingRight = "5px";
              wrapper.appendChild(innerDiv2);
              
              elem.style.padding = 0;
              elem.style.paddingTop = "5px";
              elem.style.textAlign = "center";
              elem.innerHTML = wrapper.outerHTML;
          });
      };
  })(this);
  for (i = l = 0, ref = numRows; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
      barcharter(".pvtVal.row" + i);
  }
  barcharter(".pvtTotal.colTotal");
  return this;
};
