(function(e, t) {
        return e.pivotUtilities.d3_renderers = {
            Treemap: function(n, i) {
                var r, u, l, d, o, a, c, h, f, s, p, y, g;
                for (l = {
                        localeStrings: {},
                        d3: {
                            width: function() {
                                return window.innerWidth / 1.4
                            },
                            height: function() {
                                return window.innerHeight / 1.4
                            }
                        }
                    }, i = Object.assign({}, l, i), h = document.createElement('div'), h.style.width = '100%', h.style.height = '100%', s = {
                        name: "All",
                        children: []
                    }, r = function(e, t, n) {
                        var i, u, l, d, o, a;
                        if (0 === t.length) return void(e.value = n);
                        for (null == e.children && (e.children = []), a = t.shift(), o = e.children, u = 0, l = o.length; u < l; u++)
                            if (i = o[u], i.name === a) return void r(i, t, n);
                        return d = {
                            name: a
                        }, r(d, t, n), e.children.push(d)
                    }, c = n.getRowKeys(), o = 0, a = c.length; o < a; o++) f = c[o], y = n.getAggregator(f, []).value(), null != y && r(s, f, y);
                return u = t.scale.category10(), g = i.d3.width(), d = i.d3.height(), p = t.layout.treemap().size([g, d]).sticky(!0).value(function(e) {
                    return e.size
                }), t.select(h).append("div").style("position", "relative").style("width", g + "px").style("height", d + "px").datum(s).selectAll(".node").data(p.padding([15, 0, 0, 0]).value(function(e) {
                    return e.value
                }).nodes).enter().append("div").attr("class", "node").style("background", function(e) {
                    return null != e.children ? "lightgrey" : u(e.name)
                }).text(function(e) {
                    return e.name
                }).call(function() {
                    this.style("left", function(e) {
                        return e.x + "px"
                    }).style("top", function(e) {
                        return e.y + "px"
                    }).style("width", function(e) {
                        return Math.max(0, e.dx - 1) + "px"
                    }).style("height", function(e) {
                        return Math.max(0, e.dy - 1) + "px"
                    })
                }), h
            }
        }
    }).call(this);