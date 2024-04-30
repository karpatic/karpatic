import * as THREE from '/cdn/three/three.js';
import { OrbitControls } from '/cdn/three/OrbitControls.js';
import { STLExporter } from '/cdn/three/STLExporter.js';

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

function scale(geojson) {
  // Calculate bounding box and differences
  let [minX, minY, maxX, maxY] = turf.bbox(geojson);
  minX = Math.abs(minX); maxX = Math.abs(maxX);
  if (minX > maxX) { let temp = minX; minX = maxX; maxX = temp; }
  minY = Math.abs(minY); maxY = Math.abs(maxY)
  if (minY > maxY) { let temp = minY; minY = maxY; maxY = temp; }
  window.minX = minX; window.minY = minY; window.maxX = maxX; window.maxY = maxY;

  window.difX = maxX - minX; // used for camera
  window.difY = maxY - minY;

  const scaleFactor = window.scaleToThisSize / Math.max(difX, difY);
  // console.log('scaleFactor', { scaleFactor, difX, difY })

  // Normalize and scale while preserving aspect ratio
  function normalizeAndScale(coordinate) {
    const X = Math.round((Math.abs(coordinate[0]) - minX) * scaleFactor);
    const Y = Math.round((Math.abs(coordinate[1]) - minY) * scaleFactor);
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
  let geojsonUrl = 'https://raw.githubusercontent.com/benbalter/dc-maps/master/maps/ward-2012.geojson';
  let geojson = await (await fetch(geojsonUrl)).json();


  let simplified = scale(geojson);
  simplified.features.forEach(feature => { feature.geometry = turf.cleanCoords(feature.geometry); }); // Dedupes
  console.log('simplified', simplified);
  displayOnMap(JSON.parse(JSON.stringify(simplified)))


  // Get the union of all polygons
  let union = false
  simplified.features.forEach((feature) => {
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

  let returnThis = { features: [union], type: "FeatureCollection" };

  // Create OpenJSCAD Extrusion
  let extrudedShapes = returnThis.features.flatMap((feature) => {
    const type = feature.geometry.type;
    let shapes;
    if (type === 'Polygon') { shapes = [createPolygon(feature.geometry.coordinates)]; }
    else if (type === 'MultiPolygon') { shapes = feature.geometry.coordinates.map(coords => createPolygon(coords)).flat(); }
    else { return []; }
    return shapes.map(shape => window.jscadModeling.extrusions.extrudeLinear({ height: 10 }, shape));
  }).filter(shape => shape);


  // Union all extruded shapes
  const geom = window.jscadModeling.booleans.union(...extrudedShapes);
  const meshies = [];

  // Create meshes from the polygons
  geom.polygons.forEach(polygon => {
    const geometry = new THREE.Geometry();
    polygon.vertices.forEach(vertex => {
      const recessedVertex = new THREE.Vector3(vertex[0], vertex[1], vertex[2] - 8);
      geometry.vertices.push(recessedVertex);
    });
    for (let i = 2; i < geometry.vertices.length; i++) {
      geometry.faces.push(new THREE.Face3(0, i - 1, i));
    }
    geometry.applyMatrix((new THREE.Matrix4()).fromArray(geom.transforms));
    geometry.computeFaceNormals();
    const bufferGeometry = new THREE.BufferGeometry().fromGeometry(geometry);
    const material = new THREE.MeshNormalMaterial();
    const mesh = new THREE.Mesh(bufferGeometry, material);
    //
    //scene.add(mesh);
    //
    meshies.push(mesh.clone());
  });

  //
  //
  //

  // Get a single copy of all overlapping lines and also a copy of the removed parts
  let handled = [];
  let lines = { features: [], type: "FeatureCollection" }
  let removed = { features: [], type: "FeatureCollection" }
  simplified.features.forEach((feature, index) => {
    simplified.features.forEach((feature2, index2) => {
      // console.log('feature', feature, 'feature2', feature2)
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
        let difference1 = turf.difference(feature, feature2);
        if (difference1) {
          if (difference1.geometry.type === 'Polygon') {
            difference1.geometry.coordinates.forEach(coords => {
              removed.features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });
            });
          }
          else if (difference1.geometry.type === 'MultiPolygon') {
            difference1.geometry.coordinates.forEach(coords => {
              coords.forEach(coord => {
                removed.features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coord } });
              });
            });
          }
        }
        let difference2 = turf.difference(feature2, feature);
        if (difference2) {
          // convert polygon and multi to linestring
          if (difference2.geometry.type === 'Polygon') {
            difference2.geometry.coordinates.forEach(coords => {
              removed.features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });
            });
          }
          else if (difference2.geometry.type === 'MultiPolygon') {
            difference2.geometry.coordinates.forEach(coords => {
              coords.forEach(coord => {
                removed.features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coord } });
              });
            });
          }
        }
      }
      console.log('features overlap', overlap.features)
    });
    handled.push(feature);
  });


  lines = removed

  // line 2 path then extrude
  let extrudedLines = []
  lines.features.forEach((line, index) => {
    const points = line.geometry.coordinates.map(coord => [coord[0], coord[1]]);
    const path = new CSG.Path2D(points, false);
    const csgSolid = path.rectangularExtrude(3, 4, 16, true);
    extrudedLines.push(csgSolid);
  });

  console.log('lines', lines);

  extrudedLines.forEach(csg => {
    // Convert CSG polygons to Three.js geometry
    const geometry = new THREE.Geometry();

    csg.polygons.forEach(polygon => {
      const vertIndices = polygon.vertices.map(vertex => {
        const vert = new THREE.Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z);
        geometry.vertices.push(vert);
        return geometry.vertices.length - 1;
      });

      // Generate faces from vertices
      for (let i = 2; i < vertIndices.length; i++) {
        geometry.faces.push(new THREE.Face3(vertIndices[0], vertIndices[i - 1], vertIndices[i]));
      }
    });

    geometry.computeBoundingSphere();
    geometry.computeFaceNormals(); // Necessary for correct lighting

    // Define material for the mesh
    const material = new THREE.MeshNormalMaterial();

    // Create mesh and add it to the scene
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
  });


  let x = window.maxX * 1.2
  let y = window.maxY * 2.2
  camera.position.set(x, y, 200);
  camera.lookAt(x, y, 0);
  controls.target.set(x, y, 0);
  controls.update();

  exportScene(meshies, 'extrudedShapes');

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