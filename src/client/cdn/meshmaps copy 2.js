import * as THREE from '/cdn/three/three.js';
import { OrbitControls } from '/cdn/three/OrbitControls.js';
// import { STLExporter } from '/cdn/three/STLExporter.js';
// import * as proj4 from '/cdn/geo/proj4.js';
import proj4 from 'https://cdn.jsdelivr.net/npm/proj4@2.11.0/+esm'
import { STLExporter } from '/cdn/three/STLExporter.js';
import { BufferGeometryUtils } from '/cdn/three/BufferGeometryUtils.js';
import * as TCSG from '/cdn/three/CSG_Three.js';

async function displayOnMap(geojson) {
  if (window.map && window.map.eachLayer) {
    window.map.eachLayer(function (layer) {
      window.map.removeLayer(layer); // Remove existing layers
    });
  }
  else {
    window.map = L.map('display_map') // .setView([38.8951100, -77.0363700], 12);
  }
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(window.map);

  let layer = L.geoJSON(geojson, {
    onEachFeature: function (feature, layer) {
      feature?.properties?.id && layer.bindTooltip(`LineString number: ${feature.properties.id}`);
    }
  }).addTo(window.map);

  window.map.fitBounds(layer.getBounds());
}



function scale(geojson) {
  window.difX = window.maxX - window.minX; // used for camera
  window.difY = window.maxY - window.minY;

  const scaleFactor = window.scaleToThisSize / Math.max(difX, difY);
  // console.log('scaleFactor', { scaleFactor, difX, difY })

  // Normalize and scale while preserving aspect ratio
  function normalizeAndScale(coordinate) {
    // const X = Math.round((Math.abs(coordinate[0]) - minX) * scaleFactor * 10) / 10;
    // const Y = Math.round((Math.abs(coordinate[1]) - minY) * scaleFactor * 10) / 10;
    const X = Math.round((Math.abs(coordinate[0]) - window.minX) * scaleFactor);
    const Y = Math.round((Math.abs(coordinate[1]) - window.minY) * scaleFactor);
    return [X, Y];
  }

  // Simplify and adjust coordinates
  geojson.features.forEach(feature => {
    if (!feature.geometry.coordinates) { return; }

    const recurse = (coords) => {
      return coords.map(item => {
        if (Array.isArray(item[0])) {
          return recurse(item); // Handle nested arrays for complex geometries
        } else {
          return normalizeAndScale(item);
        }
      });
    };

    feature.geometry.coordinates = recurse(feature.geometry.coordinates);
  });
  return geojson
}

export async function initialize() {
  // Set Defaults
  window.innerHeight = 600;
  window.innerWidth = 800;
  window.precision = 100;
  window.scaleToThisSize = 180;

  // Set Scene
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  scene.add(new THREE.DirectionalLight(0xffffff, 0.5));
  scene.background = new THREE.Color(0x333333);
  scene.add(new THREE.AxesHelper(100));
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const fov = 45;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 1, far = 1000;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.updateMatrixWorld();
  const controls = new OrbitControls(camera, renderer.domElement);
  renderer.setSize(window.innerWidth, window.innerHeight);
  const rendererContainer = document.getElementById('renderer');
  rendererContainer.innerHTML = '';
  rendererContainer.appendChild(renderer.domElement);
  function animate() { requestAnimationFrame(animate); renderer.render(scene, camera); }
  animate();

  // Load and clean data
  // By default, GeoJSON uses the World Geodetic System 1984 (WGS 84) crs, with the EPSG code 4326. 
  let geojsonUrl = 'https://raw.githubusercontent.com/benbalter/dc-maps/master/maps/ward-2012.geojson';
  let geojson = await (await fetch(geojsonUrl)).json();

  // Calculate bounding box and differences
  let [minX, minY, maxX, maxY] = turf.bbox(geojson);
  window.minX = minX = Math.abs(minX); maxX = Math.abs(maxX);
  if (minX > maxX) { let temp = minX; minX = maxX; maxX = temp; }
  window.minY = minY = Math.abs(minY); maxY = Math.abs(maxY)
  if (minY > maxY) { let temp = minY; minY = maxY; maxY = temp; }
  window.minX = minX; window.minY = minY; window.maxX = maxX; window.maxY = maxY;


  proj4.defs('EPSG:32618', '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs');

  //   geojson.features.forEach(f => { if (['Polygon', 'MultiPolygon'].includes(f.geometry.type)) { f.geometry.coordinates = f.geometry.type === 'Polygon' ? convertCoordinates(f.geometry.coordinates) : f.geometry.coordinates.map(convertCoordinates); } });

  function convertCoordinates(coordinates) {
    return coordinates.map(ring => {
      return ring.map(coord => {
        if (typeof coord[0] === 'number' && typeof coord[1] === 'number' && isFinite(coord[0]) && isFinite(coord[1])) {
          return proj4('EPSG:4326', 'EPSG:32618', [coord[0], coord[1]]);
        } else {
          console.error('Invalid coordinates: ', coord);
          return coord; // Or handle appropriately
        }
      });
    });
  }



  // Get the Turfjs Union 
  let union = false
  geojson.features.forEach((feature) => {
    if (feature.geometry.type === 'Polygon') {
      union = !union ? feature.geometry : turf.union(union, feature.geometry);
    }
    else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygon) => {
        let geometryToUnion = { type: 'Polygon', coordinates: polygon };
        union = !union ? polygon : turf.union(union, geometryToUnion);
      });
    } else {
      console.log('err', feature)
    }
  });
  let unionGeoJson = { features: [union], type: "FeatureCollection" };

  // Get overlapping lines
  let handled = [];
  let lines = { features: [], type: "FeatureCollection" }
  geojson.features.forEach((feature, index) => {
    geojson.features.forEach((feature2, index2) => {
      if (
        !['Polygon', 'MultiPolygon'].includes(feature.geometry.type) ||
        !['Polygon', 'MultiPolygon'].includes(feature2.geometry.type) ||
        index === index2 ||
        handled.includes(feature2)
      ) return;
      // Get the overlapping parts
      let overlap = turf.lineOverlap(feature, feature2);
      if (overlap.features.length) {
        overlap.features.forEach((line) => { lines.features.push(line); });
      }

    });
    handled.push(feature);
  });

  displayOnMap(JSON.parse(JSON.stringify(lines)))

  let removeInDistance = (coords, line, distance) => {
    let flag = false; let removed = false; let valid = false;
    let check = (n) => Number.isInteger(n)
    let newCoords = coords.filter((coord, index) => {
      if (flag) { return true; }
      let distToLine = turf.pointToLineDistance(turf.point(coord), line, { units: 'meters' });
      // console.log('Distance:', distToLine);
      if (distToLine <= distance) {
        if (!check(removed)) { removed = index; } return false;
      } else {
        if (!check(valid)) { valid = index; } flag = true; return true;
      }
    });
    let getClosestPoint = (validPoint, removedPoint) => {
      let checkPoint = turf.midpoint(validPoint, removedPoint);
      let distToLine = turf.pointToLineDistance(checkPoint, line, { units: 'meters' });
      // console.log('Distance:', distToLine)
      if (distToLine <= distance) { return getClosestPoint(validPoint, checkPoint) }
      else if (distToLine > distance + 20) { return getClosestPoint(checkPoint, removedPoint) }
      else { // return getClosestPoint(checkPoint, removedPoint, wall, distance)
        return checkPoint;
      }
    }
    if (check(removed) && check(valid)) {
      // console.log('removed idx', removed, 'valid idx', valid)
      let closestPoint = getClosestPoint(
        turf.point(coords[valid]),
        turf.point(coords[removed])
      )
      newCoords.unshift(turf.getCoord(closestPoint));
    }

    return newCoords;
  };


  let updatedLines = { features: [], type: "FeatureCollection" }
  lines.features.forEach(innerLine => {
    let innerCoords = turf.getCoords(innerLine);
    let outterLine = turf.lineString(unionGeoJson.features[0].geometry.coordinates[0]);
    let filteredCoords = removeInDistance(innerCoords, outterLine, 300);
    filteredCoords = removeInDistance(filteredCoords.reverse(), outterLine, 300);
    if (filteredCoords.length >= 2) { updatedLines.features.push(turf.lineString(filteredCoords)); }
    else {
      let valid = filteredCoords[0]
      console.log('Error: Only 1 point left.', valid)
      // check if first or last point in line is valid
      let firstPoint = turf.point(innerCoords[0]);
      if (turf.booleanEqual(firstPoint, valid)) {

      }

      let lastPoint = turf.point(innerCoords[innerCoords.length - 1]);
      if (turf.booleanEqual(lastPoint, valid)) {

      }
      //if (innerCoords.length == 2) { updatedLines.features.push(turf.lineString(innerCoords)); }
      // else { console.log('Error: No points left.', innerCoords) }
    }
  });

  unionGeoJson = scale(unionGeoJson);
  unionGeoJson.features.forEach(feature => { feature.geometry = turf.cleanCoords(feature.geometry); }); // Dedupes
  console.log('unionGeoJson', unionGeoJson);

  updatedLines = scale(updatedLines);
  updatedLines.features.forEach(feature => { feature.geometry = turf.cleanCoords(feature.geometry); }); // Dedupes
  console.log('updatedLines', updatedLines);

  //
  //
  //

  // creates lines   
  let extrudedLines = []
  updatedLines.features.forEach((line, index) => {
    const points = line.geometry.coordinates.map(coord => [coord[0], coord[1]]);
    const path = new CSG.Path2D(points, false);
    const csgSolid = path.rectangularExtrude(3, 4, 16, true);
    console.log(csgSolid)
    const newCSG = {
      polygons: [],
      transforms: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    };
    csgSolid.polygons.forEach(polygon => {
      const newPolygon = {
        plane: [polygon.plane.normal._x, polygon.plane.normal._y, polygon.plane.normal._z, polygon.plane.w],
        vertices: polygon.vertices.map(vertex => [vertex.pos._x, vertex.pos._y, vertex.pos._z])
      };
      newCSG.polygons.push(newPolygon);
    });
    extrudedLines.push(newCSG);
  });
  console.log('extrudedLines', extrudedLines);

  //
  //
  //
  function createPolygon(coordinates) {
    const { geometries } = window.jscadModeling;
    return coordinates.map(ring => {
      const firstPoint = ring[0];
      const lastPoint = ring[ring.length - 1];
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        ring.push([...firstPoint]);
      }
      if (ring.length < 4) {
        console.error('Invalid polygon with fewer than 3 unique points:', ring);
        return null;
      }
      const points2D = ring.map(coord => [coord[0], coord[1]]);
      let polygonShape = geometries.geom2.fromPoints(points2D);
      return polygonShape;
    }).filter(shape => shape !== null);
  }

  // Create OpenJSCAD Extrusion from Union
  let extrudedShape = unionGeoJson.features.flatMap((feature) => {
    const type = feature.geometry.type;
    let shapes;
    if (type === 'Polygon') { shapes = [createPolygon(feature.geometry.coordinates)]; }
    else if (type === 'MultiPolygon') { shapes = feature.geometry.coordinates.map(coords => createPolygon(coords)).flat(); }
    else { return []; }
    return shapes.map(shape => window.jscadModeling.extrusions.extrudeLinear({ height: 3 }, shape));
  }).filter(shape => shape);
  extrudedShape = extrudedShape[0]
  console.log("extrudedShape", extrudedShape)

  // Subtract the lines from the union using jscadmodeling boolean 
  let resultShape = extrudedShape;
  extrudedLines.forEach(line => {
    resultShape = window.jscadModeling.booleans.subtract(resultShape, line);
  });

  // Create ThreeJS Extrusion from OpenJSCAD Extrusion  
  let convertToThree = shape => {
    let meshies = [];
    shape.polygons.forEach(polygon => {
      const vertices = [];
      const indices = [];
      let zoffset = 8
      // Create Verticies, Offset z-axis -8 units
      polygon.vertices.forEach((vertex, index) => {
        vertices.push(vertex[0], vertex[1], vertex[2] - zoffset);
      });
      // Create Faces (triangles) using verticies
      for (let i = 2; i < polygon.vertices.length; i++) { indices.push(0, i - 1, i); }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.applyMatrix4(new THREE.Matrix4().fromArray(shape.transforms));
      geometry.computeVertexNormals(); // This replaces computeFaceNormals
      const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);
      meshies.push(mesh.clone());
    });
    const geometries = meshies.map(mesh => mesh.geometry);
    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries, false);
    const mergedMesh = new THREE.Mesh(mergedGeometry, new THREE.MeshNormalMaterial({ side: THREE.DoubleSide }));
    return mergedMesh
  }
  let threeUnion = convertToThree(resultShape);
  scene.add(threeUnion);
  /*
  extrudedLines.forEach((line, index) => {
    let threeLine = convertToThree(line);
    scene.add(threeLine);
  });
  */
  // 
  //
  //

  let x = window.maxX * 1.2
  let y = window.maxY * 2.2
  camera.position.set(x, y, 200);
  camera.lookAt(x, y, 0);
  controls.target.set(x, y, 0);
  controls.update();

  // exportScene([threeUnion], 'extrudedShapes');

}

function exportScene(meshes, name) {
  const scene = new THREE.Scene();
  meshes.forEach(mesh => scene.add(mesh));
  // scene.add(meshes);
  const exporter = new STLExporter();
  let stlString = exporter.parse(scene);
  let filename = name + '.stl';
  let blob = new Blob([stlString], { type: 'text/plain' });
  let link = document.createElement('a');
  link.style.display = 'none';
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
}



/*
geojson.features.forEach(feature => {
  if (feature.geometry.type === 'LineString' && feature.geometry.coordinates.length > 1) {
  } else {
    feature.geometry.coordinates = feature.geometry.coordinates.map(setOfCoords => {
      if (feature.geometry.type === 'Polygon') { setOfCoords = simplify(setOfCoords) }
      else if (feature.geometry.type === 'MultiPolygon') {
        setOfCoords = setOfCoords.forEach(coords => { return simplify(coords) });
      } return setOfCoords;
    });
  }
});
*/