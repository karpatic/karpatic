import{BufferAttribute,BufferGeometry,InterleavedBuffer,InterleavedBufferAttribute,TriangleFanDrawMode,TriangleStripDrawMode,TrianglesDrawMode,Vector2,Vector3}from"./three.js";var BufferGeometryUtils={computeTangents:function(e){var r=e.index,t=e.attributes;if(null!==r&&void 0!==t.position&&void 0!==t.normal&&void 0!==t.uv){var o=r.array,i=t.position.array,a=t.normal.array,n=t.uv.array,u=i.length/3;void 0===t.tangent&&e.setAttribute("tangent",new BufferAttribute(new Float32Array(4*u),4));for(var s=t.tangent.array,f=[],l=[],m=0;m<u;m++)f[m]=new Vector3,l[m]=new Vector3;var g=new Vector3,d=new Vector3,c=new Vector3,h=new Vector2,b=new Vector2,v=new Vector2,y=new Vector3,p=new Vector3,B=e.groups;0===B.length&&(B=[{start:0,count:o.length}]);m=0;for(var A=B.length;m<A;++m)for(var w=D=(z=B[m]).start,E=D+z.count;w<E;w+=3)handleTriangle(o[w+0],o[w+1],o[w+2]);var T,x,G,U=new Vector3,S=new Vector3,V=new Vector3,R=new Vector3;for(m=0,A=B.length;m<A;++m){var z,D;for(w=D=(z=B[m]).start,E=D+z.count;w<E;w+=3)handleVertex(o[w+0]),handleVertex(o[w+1]),handleVertex(o[w+2])}}else console.error("THREE.BufferGeometryUtils: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");function handleTriangle(e,r,t){g.fromArray(i,3*e),d.fromArray(i,3*r),c.fromArray(i,3*t),h.fromArray(n,2*e),b.fromArray(n,2*r),v.fromArray(n,2*t),d.sub(g),c.sub(g),b.sub(h),v.sub(h);var o=1/(b.x*v.y-v.x*b.y);isFinite(o)&&(y.copy(d).multiplyScalar(v.y).addScaledVector(c,-b.y).multiplyScalar(o),p.copy(c).multiplyScalar(b.x).addScaledVector(d,-v.x).multiplyScalar(o),f[e].add(y),f[r].add(y),f[t].add(y),l[e].add(p),l[r].add(p),l[t].add(p))}function handleVertex(e){V.fromArray(a,3*e),R.copy(V),x=f[e],U.copy(x),U.sub(V.multiplyScalar(V.dot(x))).normalize(),S.crossVectors(R,x),G=S.dot(l[e]),T=G<0?-1:1,s[4*e]=U.x,s[4*e+1]=U.y,s[4*e+2]=U.z,s[4*e+3]=T}},mergeBufferGeometries:function(e,r){for(var t=null!==e[0].index,o=new Set(Object.keys(e[0].attributes)),i=new Set(Object.keys(e[0].morphAttributes)),a={},n={},u=e[0].morphTargetsRelative,s=new BufferGeometry,f=0,l=0;l<e.length;++l){var m=e[l],g=0;if(t!==(null!==m.index))return console.error("THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index "+l+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(var d in m.attributes){if(!o.has(d))return console.error("THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index "+l+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;void 0===a[d]&&(a[d]=[]),a[d].push(m.attributes[d]),g++}if(g!==o.size)return console.error("THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index "+l+". Make sure all geometries have the same number of attributes."),null;if(u!==m.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index "+l+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(var d in m.morphAttributes){if(!i.has(d))return console.error("THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index "+l+".  .morphAttributes must be consistent throughout all geometries."),null;void 0===n[d]&&(n[d]=[]),n[d].push(m.morphAttributes[d])}if(s.userData.mergedUserData=s.userData.mergedUserData||[],s.userData.mergedUserData.push(m.userData),r){var c;if(t)c=m.index.count;else{if(void 0===m.attributes.position)return console.error("THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index "+l+". The geometry must have either an index or a position attribute"),null;c=m.attributes.position.count}s.addGroup(f,c,l),f+=c}}if(t){var h=0,b=[];for(l=0;l<e.length;++l){for(var v=e[l].index,y=0;y<v.count;++y)b.push(v.getX(y)+h);h+=e[l].attributes.position.count}s.setIndex(b)}for(var d in a){var p=this.mergeBufferAttributes(a[d]);if(!p)return console.error("THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the "+d+" attribute."),null;s.setAttribute(d,p)}for(var d in n){var B=n[d][0].length;if(0===B)break;s.morphAttributes=s.morphAttributes||{},s.morphAttributes[d]=[];for(l=0;l<B;++l){var A=[];for(y=0;y<n[d].length;++y)A.push(n[d][y][l]);var w=this.mergeBufferAttributes(A);if(!w)return console.error("THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the "+d+" morphAttribute."),null;s.morphAttributes[d].push(w)}}return s},mergeBufferAttributes:function(e){for(var r,t,o,i=0,a=0;a<e.length;++a){var n=e[a];if(n.isInterleavedBufferAttribute)return console.error("THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. InterleavedBufferAttributes are not supported."),null;if(void 0===r&&(r=n.array.constructor),r!==n.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(void 0===t&&(t=n.itemSize),t!==n.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(void 0===o&&(o=n.normalized),o!==n.normalized)return console.error("THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;i+=n.array.length}var u=new r(i),s=0;for(a=0;a<e.length;++a)u.set(e[a].array,s),s+=e[a].array.length;return new BufferAttribute(u,t,o)},interleaveAttributes:function(e){for(var r,t=0,o=0,i=0,a=e.length;i<a;++i){var n=e[i];if(void 0===r&&(r=n.array.constructor),r!==n.array.constructor)return console.error("AttributeBuffers of different types cannot be interleaved"),null;t+=n.array.length,o+=n.itemSize}var u=new InterleavedBuffer(new r(t),o),s=0,f=[],l=["getX","getY","getZ","getW"],m=["setX","setY","setZ","setW"],g=0;for(a=e.length;g<a;g++){var d=(n=e[g]).itemSize,c=n.count,h=new InterleavedBufferAttribute(u,d,s,n.normalized);f.push(h),s+=d;for(var b=0;b<c;b++)for(var v=0;v<d;v++)h[m[v]](b,n[l[v]](b))}return f},estimateBytesUsed:function(e){var r=0;for(var t in e.attributes){var o=e.getAttribute(t);r+=o.count*o.itemSize*o.array.BYTES_PER_ELEMENT}var i=e.getIndex();return r+=i?i.count*i.itemSize*i.array.BYTES_PER_ELEMENT:0},mergeVertices:function(e,r=1e-4){r=Math.max(r,Number.EPSILON);for(var t={},o=e.getIndex(),i=e.getAttribute("position"),a=o?o.count:i.count,n=0,u=Object.keys(e.attributes),s={},f={},l=[],m=["getX","getY","getZ","getW"],g=0,d=u.length;g<d;g++){s[p=u[g]]=[],(E=e.morphAttributes[p])&&(f[p]=new Array(E.length).fill().map((()=>[])))}var c=Math.log10(1/r),h=Math.pow(10,c);for(g=0;g<a;g++){var b=o?o.getX(g):g,v="",y=0;for(d=u.length;y<d;y++)for(var p=u[y],B=(w=e.getAttribute(p)).itemSize,A=0;A<B;A++)v+=~~(w[m[A]](b)*h)+",";if(v in t)l.push(t[v]);else{for(y=0,d=u.length;y<d;y++){p=u[y];var w=e.getAttribute(p),E=e.morphAttributes[p],T=(B=w.itemSize,s[p]),x=f[p];for(A=0;A<B;A++){var G=m[A];if(T.push(w[G](b)),E)for(var U=0,S=E.length;U<S;U++)x[U].push(E[U][G](b))}}t[v]=n,l.push(n),n++}}const V=e.clone();for(g=0,d=u.length;g<d;g++){p=u[g];var R=e.getAttribute(p),z=new R.array.constructor(s[p]);w=new BufferAttribute(z,R.itemSize,R.normalized);if(V.setAttribute(p,w),p in f)for(y=0;y<f[p].length;y++){var D=e.morphAttributes[p][y],M=(z=new D.array.constructor(f[p][y]),new BufferAttribute(z,D.itemSize,D.normalized));V.morphAttributes[p][y]=M}}return V.setIndex(l),V},toTrianglesDrawMode:function(e,r){if(r===TrianglesDrawMode)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),e;if(r===TriangleFanDrawMode||r===TriangleStripDrawMode){var t=e.getIndex();if(null===t){var o=[],i=e.getAttribute("position");if(void 0===i)return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),e;for(var a=0;a<i.count;a++)o.push(a);e.setIndex(o),t=e.getIndex()}var n=t.count-2,u=[];if(r===TriangleFanDrawMode)for(a=1;a<=n;a++)u.push(t.getX(0)),u.push(t.getX(a)),u.push(t.getX(a+1));else for(a=0;a<n;a++)a%2==0?(u.push(t.getX(a)),u.push(t.getX(a+1)),u.push(t.getX(a+2))):(u.push(t.getX(a+2)),u.push(t.getX(a+1)),u.push(t.getX(a)));u.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");var s=e.clone();return s.setIndex(u),s.clearGroups(),s}return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",r),e}};export{BufferGeometryUtils};