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

async function createShapes(geojson, type) {
  let shapesList = [];

  const createGeomShape = (setOfCoords) => {
    const shape = new THREE.Shape();
    setOfCoords.forEach(([x, y], index) => {
      if (index === 0) { shape.moveTo(x, y); }
      else { shape.lineTo(x, y); }
    });
    return shape;
  }

  const createLineShape = (setOfCoords) => {
    let threeVectorArray = setOfCoords.map(([x, y]) => new THREE.Vector3(x, y, 0));
    const extrusionPath = new THREE.CurvePath();
    threeVectorArray.forEach((vector, i) => {
      if (i < threeVectorArray.length - 1) {
        extrusionPath.add(new THREE.LineCurve3(vector, threeVectorArray[i + 1]));
      }
    });
    return extrusionPath;
  };

  geojson.features.forEach(feature => {
    let featureType = feature.geometry.type;
    let coords = feature.geometry.coordinates;
    if (featureType === 'LineString' && coords.length > 1) {
      shapesList.push(type === 'geom' ? createGeomShape(coords) : createLineShape(coords));
    }
    else if (featureType === 'Polygon') {
      shapesList.push(type === 'geom' ? createGeomShape(coords[0]) : createLineShape(coords[0]));
    }
    else if (featureType === 'MultiPolygon') {
      coords.forEach(polygonCoords => {
        polygonCoords.forEach(innerCoords => {
          shapesList.push(type === 'geom' ? createGeomShape(innerCoords) : createLineShape(innerCoords));
        });
      });
    }
  });

  return shapesList;
}

async function createBuffers(shapesOrPaths, type) {
  if (type === 'geom') { // Handling for geometry shapes
    return shapesOrPaths.map(shape => {
      let extrudeSettings = { depth: window.depth, bevelEnabled: false };
      let bufferGeometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
      return bufferGeometry;
    });
  }
  else if (type === 'line') {
    // Map over shapesOrPaths asynchronously
    return Promise.all(shapesOrPaths.map(path => {
      // Immediately create squareShape for each path
      const squareShape = new THREE.Shape().moveTo(0, 0).lineTo(0, width).lineTo(height, width).lineTo(height, 0).closePath();
      if (!squareShape) {
        console.error('Failed to create squareShape');
        return null; // Skip this iteration in case of failure
      }
      let steps = path.curves.length;
      const extrudeSettings = { depth: 1, bevelEnabled: false, extrudePath: path, steps: steps * window.stepMultiply };
      // Log to verify squareShape is defined
      console.log('Extruding with squareShape and settings:', squareShape, extrudeSettings);
      return new THREE.ExtrudeBufferGeometry(squareShape, extrudeSettings);
    })).filter(item => item !== null); // Filter out any failed creations
  }
}

function scale(geojson) {
  let mx = 1
  window.difX = window.maxX - window.minX; // used for camera
  window.difY = window.maxY - window.minY;

  const scaleFactor = window.scaleToThisSize / Math.max(difX, difY);
  // console.log('scaleFactor', { scaleFactor, difX, difY })

  // Normalize and scale while preserving aspect ratio
  function normalizeAndScale(coordinate) {
    const X = Math.round((Math.abs(coordinate[0]) - minX) * scaleFactor * mx) / mx;
    const Y = Math.round((Math.abs(coordinate[1]) - minY) * scaleFactor * mx) / mx;
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


  //
  // Set Defaults
  //


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
  const material = new THREE.MeshNormalMaterial();
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
  // geojsonUrl = 'https://services1.arcgis.com/mVFRs7NF4iFitgbY/ArcGIS/rest/services/Biz4_/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token='
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


  //
  // Union Geojson
  //


  // Get the Turfjs Union 
  let union = false
  geojson.features.forEach((feature) => {
    if (feature.geometry.type === 'Polygon') {
      union = !union ? feature.geometry : turf.union(union, feature.geometry);
    }
    else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygon) => {
        let geometryToUnion = { type: 'Polygon', coordinates: polygon };
        union = !union ? geometryToUnion : turf.union(union, geometryToUnion);
      });
    }
  });

  // Filter out artifact from union
  const minArea = 150000;
  console.log('Union:', union)
  const filteredCoordinates = union.geometry.type == 'Polygon' ? [union.geometry.coordinates] : union.geometry.coordinates.map((polygons, i) => {
    return polygons.filter(polygon => {
      const area = turf.area({ type: 'Polygon', coordinates: [polygon] });
      // area >= minArea && console.log(`Polygon idx:${i} area: ${area}`);
      return area >= minArea;
    });
  }).filter(polygons => polygons && polygons.length > 0);
  console.log('Filtered Coordinates:', filteredCoordinates);
  // create a feature for each 
  let filteredUnion = { type: 'Feature', geometry: { type: 'MultiPolygon', coordinates: filteredCoordinates } };

  // Display it 
  console.log('Filtered Union:', filteredUnion.geometry.coordinates);
  let scaleThis = { features: [filteredUnion], type: "FeatureCollection" };
  // displayOnMap(JSON.parse(JSON.stringify(scaleThis)))


  //
  // Overlapping Lines Geojson
  //

  // Get Overlapping Lines
  let handled = [];
  let lines = turf.featureCollection([])
  geojson.features.forEach((feature, index) => {
    geojson.features.forEach((feature2, index2) => {
      if (
        !['Polygon', 'MultiPolygon'].includes(feature.geometry.type) ||
        !['Polygon', 'MultiPolygon'].includes(feature2.geometry.type) ||
        index === index2 || handled.includes(feature2)
      ) return;
      // Get the overlapping parts
      let overlap = turf.lineOverlap(feature, feature2);
      if (overlap.features.length) {
        overlap.features.forEach((line) => { lines.features.push(line); });
      }
      // TODO: Get the not overlapping parts AND subtract by union as a line and then add to handled.

    });
    handled.push(feature);
  });

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

  // Remove points that are too close to the union (scaleThis)
  let updatedLines = { features: [], type: "FeatureCollection" }
  let distance = 120
  lines.features.forEach(innerLine => {
    let innerCoords = turf.getCoords(innerLine);
    // todo: map through coords. 
    let outtercoords = scaleThis.features[0].geometry.coordinates[0][0]
    let outterLine = turf.lineString(outtercoords);
    let filteredCoords = removeInDistance(innerCoords, outterLine, distance);
    filteredCoords = removeInDistance(filteredCoords.reverse(), outterLine, distance);
    if (filteredCoords.length >= 2) {
      let line = turf.lineString(filteredCoords)
      updatedLines.features.push(line);
      // console.log('filteredCoords length', filteredCoords.length, line.geometry.coordinates.length, line);
    }
    else if (!filteredCoords.length) { }
    else {
      let valid = filteredCoords[0]
      console.log('Handling Error: Only 1 point left.', valid)
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
  displayOnMap(JSON.parse(JSON.stringify(updatedLines)));


  //
  // Scale and Clean Union
  //


  // Scale it
  let scaled = scale(scaleThis);

  // feature.geometry = turf.cleanCoords(feature.geometry);
  function dedupe(coords, verbose = false) {
    const unique = new Set();
    let newCoords = coords.filter(coord => { // Filter out duplicate vertices
      const key = JSON.stringify(coord);
      if (!unique.has(key)) { unique.add(key); return true; }
      else { return false; }
    });
    verbose && console.log('dedupe: oldCoords', coords.length, 'newCords', newCoords.length);
    return newCoords
  }
  function dedupePoly(coords) {
    let newCoords = dedupe(coords);
    newCoords.push(newCoords[0]); // close the polygon 
    return newCoords
  }
  function unkink(feature) {
    const kinks = turf.kinks(feature);
    if (kinks.features.length > 0) {
      console.warn('Found kinks:', kinks);
      const unkinked = turf.unkinkPolygon(feature);
      return unkinked.features;
    }
    return feature;
  }
  function dedupeAndUnkink(feature, coords, len = 4) {
    let newCoords = dedupePoly(coords);
    if (newCoords.length < len) { return; }
    let newFeature = turf.polygon([newCoords], feature.properties);
    return unkink(newFeature, newCoords);
  }

  // Dedupe and Unkink
  let newFeats = scaled.features[0].geometry.coordinates.flatMap((coords, i) => {
    return coords.flatMap(coords => dedupeAndUnkink(scaled.features[0], coords));
  });

  let unionGeoJson = turf.featureCollection(newFeats);


  //
  // Scale and Clean Overlapping Lines
  //  
  console.log('updatedLines afater', updatedLines.features[0].geometry.coordinates.length);
  let scaledLines = scale(JSON.parse(JSON.stringify(updatedLines)));
  scaledLines.features.forEach(feature => {
    let coords = feature.geometry.coordinates
    let newCoords = dedupe(coords, true);
    if (coords.len == 1) {
      // rm feature from scaledLines
    }
    feature.geometry.coordinates = newCoords;
  });
  console.log('scaledLines', scaledLines);


  //
  // Extrude Lines
  //


  // Create CSGs from Lines   - We need this depricated library as it does a good job rounding corners
  let extrudedLines = []
  scaledLines.features.forEach((line, index) => {
    // console.log('Create CSGs from Line:', line);
    const points = line.geometry.coordinates.map(coord => [coord[0], coord[1]]);
    const path = new CSG.Path2D(points, false);
    const csgSolid = path.rectangularExtrude(1, 6, 10);
    extrudedLines.push(csgSolid);
  });

  // Convert a CSG object to a Three.js mesh
  // Assuming `extrudedLines`, `THREE`, and `material` are already defined
  let threeMeshes = [];
  let geometries = [];
  extrudedLines.forEach(csg => {
    const vertices = []; const indices = []; const uvs = [];
    let indexOffset = 0;

    csg.polygons.forEach(polygon => {
      const vertIndices = polygon.vertices.map(vertex => {
        vertices.push(vertex.pos.x, vertex.pos.y, vertex.pos.z);
        // Simple UV mapping: scale or adjust as needed
        uvs.push(vertex.pos.x, vertex.pos.y);
        return indexOffset++;
      });
      // Generate faces from vertices
      for (let i = 2; i < vertIndices.length; i++) {
        indices.push(vertIndices[0], vertIndices[i - 1], vertIndices[i]);
        // No direct way to add UVs per face in BufferGeometry; UVs are added per vertex
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); // Apply UVs
    geometry.computeVertexNormals(); // For correct lighting, based on normals
    geometries.push(geometry);

    let mesh = new THREE.Mesh(geometry, material);
    threeMeshes.push(mesh);
    // scene.add(TCSG.CSG.toMesh(TCSG.CSG.fromMesh(mesh), threeMeshes[0].matrix))
  });
  console.log('Three.js Meshes:', threeMeshes);
  const threeLine = new THREE.Mesh(BufferGeometryUtils.mergeBufferGeometries(geometries, true), material);


  //
  // Extrude Union
  //

  // todo
  // subtract from each block, and then union the blocks. 
  // It's more compute but that way the geometries are more simple.


  // Create Three from Union
  window.depth = 3;
  let unionShape = await createShapes(unionGeoJson, 'geom');
  let unionBuffers = await createBuffers([unionShape], 'geom');
  const iconGeometry = BufferGeometryUtils.mergeBufferGeometries(unionBuffers, true);
  let threeUnion = new THREE.Mesh(iconGeometry, material);

  // Subtract lines from Union  
  let csgUnion = TCSG.CSG.fromMesh(threeUnion);
  //threeMeshes
  // [threeLine]
  threeMeshes.map(mesh => {
    let line = TCSG.CSG.fromMesh(mesh);
    try { csgUnion = csgUnion.subtract(line); }
    catch { console.log('Error subtracting:', mesh, threeUnion); }
  });

  let threeUnionFin = TCSG.CSG.toMesh(csgUnion, threeUnion.matrix);
  threeUnionFin.geometry.computeVertexNormals();
  threeUnionFin = new THREE.Mesh(new THREE.BufferGeometry().fromGeometry(threeUnionFin.geometry), material);
  scene.add(threeUnionFin)
  console.log("extrudedShape", threeUnionFin);

  //
  //
  //

  let x = window.maxX * 1.2
  let y = window.maxY * 2.2
  camera.position.set(x, y, 200);
  camera.lookAt(x, y, 0);
  controls.target.set(x, y, 0);
  controls.update();

  exportScene([threeUnionFin.clone()], 'extrudedShapes');
  // exportScene(threeMeshes, 'extrudedLines');
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