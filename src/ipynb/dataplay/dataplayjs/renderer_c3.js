(function(t, e) {
        var n;
        return n = function(n) {
            return null == n && (n = {}), function(r, a) {
                var o, l, i, u, s, c, h, g, p, d, f, y, v, x, b, j, m, z, w, k, A, C, S, q, B, H, _, F, K, T, L, N, Q, R, U, W, D, E, G, I, J, M, O, P, V, X, Y, Z, $, tt, et, nt, rt, at, ot, lt, it, ut;
                if (m = {
                        localeStrings: {
                            vs: "vs",
                            by: "by"
                        },
                        c3: {}
                    }, a = Object.assign({}, m, a), null == (i = a.c3).size && (i.size = {}), null == (u = a.c3.size).width && (u.width = window.innerWidth / 1.4), null == (s = a.c3.size).height && (s.height = window.innerHeight / 1.4 - 50), null == n.type && (n.type = "line"), null == n.horizontal && (n.horizontal = !1), null == n.stacked && (n.stacked = !1), Y = r.getRowKeys(), 0 === Y.length && Y.push([]), x = r.getColKeys(), 0 === x.length && x.push([]), S = function() {
                        var t, e, n;
                        for (n = [], t = 0, e = x.length; t < e; t++) A = x[t], n.push(A.join("-"));
                        return n
                    }(), O = 0, w = r.aggregatorName, r.valAttrs.length && (w += "(" + r.valAttrs.join(", ") + ")"), "scatter" === n.type)
                    for ($ = {
                            x: {},
                            y: {},
                            t: {}
                        }, l = r.rowAttrs.concat(r.colAttrs), rt = null != (D = l[0]) ? D : "", C = null != (E = l[1]) ? E : "", k = l.slice(2).join("-"), nt = rt, "" !== C && (nt += " " + a.localeStrings.vs + " " + C), "" !== k && (nt += " " + a.localeStrings.by + " " + k), q = 0, F = Y.length; q < F; q++)
                        for (X = Y[q], B = 0, K = x.length; B < K; B++) v = x[B], o = r.getAggregator(X, v), null != o.value() && (ot = X.concat(v), tt = ot.slice(2).join("-"), "" === tt && (tt = "series"), null == (c = $.x)[tt] && (c[tt] = []), null == (h = $.y)[tt] && (h[tt] = []), ut = null != (G = ot[0]) ? G : 0, lt = null != (I = ot[1]) ? I : 0, $.y[tt].push(ut), $.x[tt].push(lt), null == (g = $.t)[tt] && (g[tt] = {}), null == (p = $.t[tt])[lt] && (p[lt] = {}), $.t[tt][lt][ut] = o.value());
                else {
                    for (R = 0, H = 0, T = S.length; H < T; H++) lt = S[H], R += lt.length;
                    for (R > 50 && (O = 45), b = [], _ = 0, L = Y.length; _ < L; _++) {
                        for (X = Y[_], V = X.join("-"), P = ["" === V ? w : V], Q = 0, N = x.length; Q < N; Q++) v = x[Q], at = parseFloat(r.getAggregator(X, v).value()), isFinite(at) ? P.push(at) : P.push(null);
                        b.push(P)
                    }
                    rt = w, n.horizontal ? (C = r.rowAttrs.join("-"), k = r.colAttrs.join("-")) : (C = r.colAttrs.join("-"), k = r.rowAttrs.join("-")), nt = w, "" !== C && (nt += " " + a.localeStrings.vs + " " + C), "" !== k && (nt += " " + a.localeStrings.by + " " + k)
                }
                if (et = document.createElement('p'), et.style.textAlign = 'center', et.style.fontWeight = 'bold', et.textContent = nt, z = r.getAggregator([], []).format, W = {
                        axis: {
                            rotated: n.horizontal,
                            y: {
                                label: rt,
                                tick: {}
                            },
                            x: {
                                label: C,
                                tick: {
                                    rotate: O,
                                    multiline: !1
                                }
                            }
                        },
                        data: {
                            type: n.type,
                            order: null
                        },
                        tooltip: {
                            grouped: !1
                        },
                        color: {
                            pattern: ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"]
                        }
                    }, W = Object.assign({}, W, a.c3), "scatter" === n.type) {
                    it = {}, U = 0, j = [];
                    for (Z in $.x) U += 1, it[Z] = Z + "_x", j.push([Z + "_x"].concat($.x[Z])), j.push([Z].concat($.y[Z]));
                    W.data.xs = it, W.data.columns = j, W.axis.x.tick = {
                        fit: !1
                    }, 1 === U && (W.legend = {
                        show: !1
                    }), W.tooltip.format = {
                        title: function() {
                            return w
                        },
                        name: function() {
                            return ""
                        },
                        value: function(t, e, n, r, a) {
                            var o;
                            return o = a[0], tt = o.name, ut = o.value, lt = o.x, z($.t[tt][lt][ut])
                        }
                    }
                } else W.axis.x.type = "category", null == (d = W.axis.y.tick).format && (d.format = function(t) {
                    return z(t)
                }), W.tooltip.format = {
                    value: function(t) {
                        return z(t)
                    }
                }, n.horizontal ? (y = function() {
                    var t, e, n;
                    for (n = [], e = 0, t = b.length; e < t; e++) f = b[e], n.push(f.shift());
                    return n
                }(), 1 === y.length && y[0] === w && (y = [""]), W.axis.x.categories = y, 1 === S.length && "" === S[0] && (S = [w]), b.unshift(S), W.data.rows = b) : (W.axis.x.categories = S, W.data.columns = b);
                return n.stacked && (n.horizontal ? W.data.groups = [
                    function() {
                        var t, e, n;
                        for (n = [], e = 0, t = x.length; e < t; e++) lt = x[e], n.push(lt.join("-"));
                        return n
                    }()
                ] : W.data.groups = [
                    function() {
                        var t, e, n;
                        for (n = [], e = 0, t = Y.length; e < t; e++) lt = Y[e], n.push(lt.join("-"));
                        return n
                    }()
                ]), J = document.createElement('div'), J.style.display = 'none', document.body.appendChild(J), M = document.createElement('div'), J.appendChild(M), W.bindto = M, e.generate(W), M.parentNode.removeChild(M), J.parentNode.removeChild(J), document.createElement('div').appendChild(et, M)
            }
        }, t.pivotUtilities.c3_renderers = {
            "Horizontal Bar Chart": n({
                type: "bar",
                horizontal: !0
            }),
            "Horizontal Stacked Bar Chart": n({
                type: "bar",
                stacked: !0,
                horizontal: !0
            }),
            "Bar Chart": n({
                type: "bar"
            }),
            "Stacked Bar Chart": n({
                type: "bar",
                stacked: !0
            }),
            "Line Chart": n(),
            "Area Chart": n({
                type: "area",
                stacked: !0
            }),
            "Scatter Chart": n({
                type: "scatter"
            })
        }
    }).call(this);
