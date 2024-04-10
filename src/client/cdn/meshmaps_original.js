import * as THREE from '/cdn/three/three.js';
import { OrbitControls } from '/cdn/three/OrbitControls.js';
import { BufferGeometryUtils } from '/cdn/three/BufferGeometryUtils.js';
import { CSG } from '/cdn/three/CSG_Three.js';
import { STLExporter } from '/cdn/three/STLExporter.js';

// https://codepen.io/prisoner849/pen/RwYrZKg?editors=1010
// https://threejs.hofk.de/WallTHREEg/WallTHREEg.html

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

// ~~~~~~~~~~

let fmt = (num) => Math.floor(num * window.precision);

async function getGeoJson(geojsonUrl) {
  // Get the json
  const response = await fetch(geojsonUrl);
  let geojson = await response.json();
  return geojson;
}

async function simplifyGeoJSON(geojson) {

  let topoData = topojson.topology({ collection: geojson });
  topoData = topojson.presimplify(topoData);
  let min_weight = topojson.quantile(topoData, window.simplifyBy);
  topoData = topojson.simplify(topoData, min_weight);
  geojson = topojson.feature(topoData, topoData.objects.collection);

  // Get the union of all polygons
  let returnThis = { features: [], type: "FeatureCollection" };
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

  // union.properties.id = 0.0 + 1 * 0.001;
  returnThis.features.push(union);

  // Get a single copy of all overlapping lines
  let handled = [];
  geojson.features.forEach((feature, index) => {
    geojson.features.forEach((feature2, index2) => {
      if (
        !['Polygon', 'MultiPolygon'].includes(feature.geometry.type) ||
        !['Polygon', 'MultiPolygon'].includes(feature2.geometry.type) ||
        index === index2 ||
        handled.includes(feature2)
      ) return;
      let overlap = turf.lineOverlap(feature, feature2);
      if (overlap.features.length) {
        overlap.features[0].properties.id = index + index2 * 1.001;
        returnThis.features.push(overlap.features[0]);
      }
    });

    handled.push(feature);
  });

  return returnThis;
}
// ~~~~~~~~~~

// Create a list of THREE.CurvePath objects for extrusion.
async function createLineShapes(geojson) {

  const getPaths = setOfCoords => {
    let threeVectorArray = setOfCoords.map(coordinate => {
      let [x, y] = coordinate;
      x = Math.abs(x - window.minX);
      y = Math.abs(y - window.minY);
      x = fmt(x / window.difX) - fmt(window.difX * 2);
      y = fmt(y / window.difY) - fmt(window.difY * 2);
      return new THREE.Vector3(x, y, 0);
    });

    const extrusionPath = new THREE.CurvePath();
    threeVectorArray.forEach((vector, i) => {
      if (i < threeVectorArray.length - 1) {
        extrusionPath.add(new THREE.LineCurve3(vector, threeVectorArray[i + 1]));
      }
    });

    return extrusionPath;
  };

  let shapesList = [];
  // Gets the paths for each feature in the geojson and adds them to the shapesList
  geojson.features.forEach(feature => {
    if (feature.geometry.type === 'LineString' && feature.geometry.coordinates.length > 1) {
      shapesList.push(getPaths(feature.geometry.coordinates));
    }
    else {
      feature.geometry.coordinates.forEach(setOfCoords => {
        if (feature.geometry.type === 'Polygon') {
          shapesList.push(getPaths(setOfCoords));
        } else if (feature.geometry.type === 'MultiPolygon') {
          setOfCoords.forEach(coords => shapesList.push(getPaths(coords)));
        }
      });
    }
  });

  return shapesList;
};

// Extrudes a square shape along paths created by createLineShapes().
const createLineBuffers = (lineShapes, width = 5, height = 100) => {
  const squareShape = new THREE.Shape();
  squareShape.moveTo(0, 0).lineTo(0, width).lineTo(height, width).lineTo(height, 0);
  return lineShapes.map(path => {
    let steps = path.curves.length;
    const extrudeSettings = {
      depth: 1,
      bevelEnabled: false,
      extrudePath: path,
      steps: steps * window.stepMultiply// Use the calculated steps for each path
    };
    return new THREE.ExtrudeBufferGeometry(squareShape, extrudeSettings);
  });
};


// Similar to geom_mesh_groups, for createLineBuffers().
const line_mesh_groups = (line_buffers) => {
  const group = new THREE.Group();
  const material = new THREE.MeshNormalMaterial();
  material.color = new THREE.Color().setHex(Math.random() * 0xffffff);
  /*
  line_buffers.forEach(geom => {
    let mesh = new THREE.Mesh(geom, material);
    mesh.position.z = 0;
    group.add(mesh);
  });
  */
  const iconGeometry = BufferGeometryUtils.mergeBufferGeometries(line_buffers, true);
  const mesh = new THREE.Mesh(iconGeometry, material);
  group.add(mesh);
  position(group);
  return group;
};

// ~~~~~~~~~~

// Transforms coordinates into a two-dimensional THREE.Shape objects for extruding.
async function createGeomShapes(geojson) {
  let shapesList = [];

  const createShape = (setOfCoords) => {
    const shape = new THREE.Shape();
    setOfCoords.forEach((coordinate, index) => {
      let [x, y] = coordinate;
      x = Math.abs(x - window.minX);
      y = Math.abs(y - window.minY);
      x = fmt(x / window.difX) - fmt(window.difX * 2);
      y = fmt(y / window.difY) - fmt(window.difY * 2);
      if (index === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    });
    return shape;
  };

  geojson.features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      shapesList.push(createShape(feature.geometry.coordinates[0]));
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(polygon => {
        polygon.forEach(setOfCoords => {
          shapesList.push(createShape(setOfCoords));
        });
      });
    }
  });

  return shapesList;
}

// Extrude THREE.Shape objects to create 3D Geometry Buffers 
async function createGeomBuffers(geomShapes) {
  return geomShapes.map(shape => {
    let extrudeSettings = { depth: window.depth, bevelEnabled: false };
    let bufferGeometry = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings); // 2d shapes to 3D extruded geometries
    return bufferGeometry
  });
}

// Creates a (positioned) THREE.Group object and adds a mesh for each geometry in geom_buffers.  
const geom_mesh_groups2 = (geom_buffers) => {
  const group = new THREE.Group();
  geom_buffers.forEach(geom => {
    const material = new THREE.MeshNormalMaterial();
    let mesh = new THREE.Mesh(geom, material);
    mesh.position.z = 0;
    group.add(mesh);
  });
  position(group);
  return group;
};

const geom_mesh_groups = (geom_buffers) => {
  const group = new THREE.Group();
  const material = new THREE.MeshNormalMaterial();
  material.color = new THREE.Color().setHex(Math.random() * 0xffffff);
  /*
  geom_buffers.forEach(geom => {
    let mesh = new THREE.Mesh(geom, material);
    mesh.position.z = 0;
    group.add(mesh);
  });
  */
  const iconGeometry = BufferGeometryUtils.mergeBufferGeometries(geom_buffers, true);
  const mesh = new THREE.Mesh(iconGeometry, material);
  group.add(mesh);
  position(group);
  return group;
};

// ~~~~~~~~~~

// Translates a mesh object to position based on where the center() is.
function position(mesh) {
  // Gets center coordinates based on width and height.
  // const center = () => ({ 'x': fmt(window.difX) / 2, 'y': fmt(window.difY) / 2 });
  mesh.position.x = 0 // -center().x;
  mesh.position.y = 0 // mesh.translateX(-center().x);
}

function exportScene(meshThis, name) {

  const exporter = new STLExporter();

  // Export the mesh to an STL string
  let stlString = exporter.parse(meshThis);
  let filename = name + '.stl';

  // Convert the STL string to a blob
  let blob = new Blob([stlString], { type: 'text/plain' });

  // Create a link and trigger the download
  let link = document.createElement('a');
  link.style.display = 'none';
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link); // Append to the document
  link.click(); // Trigger the download

  // Clean up by revoking the Object URL and removing the link
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
}

// ~~~~~~~~~~

// Creates and sets a THREE.Scene, its background, adding helpers, and including the mesh groups.
const scene = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333333);
  scene.add(new THREE.AxesHelper(100));
  return scene;
};


// Sets the THREE.PerspectiveCamera for the scene.
const camera = () => {
  const fov = 45;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 1, far = 3 * window.precision;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

  let xMost = fmt(window.difX);
  let yMost = fmt(window.difY);

  const centerX = xMost;
  const centerY = yMost;
  const cameraZ = window.precision;

  // camera.up.set(0, 0, 0);
  camera.position.set(centerX, centerY, cameraZ);

  // camera.lookAt(centerX, centerY, 0);
  camera.updateMatrixWorld();
  return camera;
};

function subtractMeshes(baseObj, subtractThis) {
  let meshA = baseObj.children[0];
  meshA.updateMatrix();
  let bspResult = CSG.fromMesh(meshA);

  //subtractThis.children.forEach((mesh) => {
  let meshC = subtractThis.children[0];
  console.log('subtracthis', subtractThis.children)
  let bspC = CSG.fromMesh(meshC);
  bspResult = bspResult.subtract(bspC);
  //});

  var mesh = CSG.toMesh(bspResult, meshA.matrix, meshA.material);
  mesh.geometry.computeVertexNormals();

  const material = new THREE.MeshNormalMaterial();
  var bufferGeometry = new THREE.BufferGeometry().fromGeometry(mesh.geometry);
  mesh = new THREE.Mesh(bufferGeometry, material);

  position(mesh);
  // mesh.position.copy(meshA.position);
  return mesh;
}


export async function displayMap() {
  let geojsonUrl = window.formValues['geom'];
  // Retrieve and display
  let geojson = await getGeoJson(geojsonUrl);
  let simple = await simplifyGeoJSON(geojson);
  displayOnMap(JSON.parse(JSON.stringify(simple)))//.features.slice(1));
}

export async function initialize() {
  const geojsonUrl = window.formValues['geom'];

  // Lines extrude in -z direction. 
  // Shapes extrude in +z direction.
  window.depth = 5;
  let wallHeight = window.wallHeight || 100;
  let exteriorWallHeight = window.exteriorWallHeight || wallHeight + window.depth * 8
  let wallsZpos = 0;        // window.depth / 2; // Previously: Walls start at half way into the panel
  let exteriorLineWidth = window.exteriorLineWidth || 10;
  let interiorLineWidth = window.interiorLineWidth || 5;
  let engraveWidth = window.engraveWidth || 7;
  let engraveZpos = window.engraveZpos || depth * 1.5;            // Engraving goes half way into the panel
  let stretchFactor = window.stretchFactor || 1.25;               // Stretch the panel vertically to counterset the map's aspect ratio

  window.simplifyBy = window.simplifyBy || .0168 * 1;
  window.stepMultiply = window.stepMultiply || 1 * 5;
  window.precision = window.precision || 1e3;
  let scaleToThisSize = window.scaleToThisSize || 180


  // Retrieve and display
  let geojson = await getGeoJson(geojsonUrl);
  let simple = await simplifyGeoJSON(geojson);
  // displayOnMap(JSON.parse(JSON.stringify(simple)))//.features.slice(1));

  const [minX, minY, maxX, maxY] = turf.bbox(simple);
  window.minX = minX;
  window.minY = minY;
  window.difX = Math.abs(maxX - minX);
  window.difY = Math.abs(maxY - minY);

  // Create Shape from bounds
  let shapes = JSON.parse(JSON.stringify(simple));
  shapes.features = shapes.features.slice(0, 1);
  const geomShapes = await createGeomShapes(shapes);
  let geom_buffers = await createGeomBuffers(geomShapes)
  let geomGroup = geom_mesh_groups(geom_buffers);

  // Create Interior Lines
  let lines = JSON.parse(JSON.stringify(simple));
  lines.features = lines.features.slice(1);
  const lineShapes = await createLineShapes(lines);                         // Create 2D shapes from geojson
  const line_buffers = await createLineBuffers(lineShapes, interiorLineWidth, wallHeight)   // 2D shapes to 3D extruded geometries
  let lineGroup = line_mesh_groups(line_buffers)
  lineGroup.children.forEach((mesh) => {
    mesh.position.z = wallsZpos;
    mesh.updateMatrix();
  });

  // Create Exterior (bound) Lines
  window.stepMultiply = 1 * 15;
  let bounds = JSON.parse(JSON.stringify(simple));
  bounds.features = bounds.features.slice(0, 1);
  const boundsShapes = await createLineShapes(bounds);
  const bounds_buffers = await createLineBuffers(boundsShapes, exteriorLineWidth, exteriorWallHeight)
  const boundsGroup = line_mesh_groups(bounds_buffers)
  boundsGroup.children.forEach((mesh) => {
    mesh.position.z = wallsZpos;
    mesh.updateMatrix();
  });

  // Create Base 
  let basePiece = geomGroup.clone();
  basePiece.children.forEach((mesh) => {
    mesh.position.z = -(depth + exteriorWallHeight);
    mesh.updateMatrix();
  });
  // basePiece = new THREE.Group().add(subtractMeshes(basePiece, boundsGroup));
  // basePiece = subtractMeshes(basePiece, lineGroup);
  // basePiece.position.z = -(depth + wallHeight);
  // basePiece.updateMatrix();

  // Create Grid
  /*
  let grid = createGridAsGeoJSON(5)
  const gridShapes = await createLineShapes(grid);
  const grid_buffers = await createLineBuffers(gridShapes, window.depth * 4, window.depth * 3) // width, height
  const gridGroup = line_mesh_groups(grid_buffers)
  gridGroup.children.forEach((mesh) => {
    mesh.position.z = -wallHeight + (window.depth * 3);
    mesh.updateMatrix();
  });
  lineGroup = subtractMeshes(lineGroup, gridGroup);
  */


  // Create Lines to subtract from shapes
  const line_buffers_thin = await createLineBuffers(lineShapes, engraveWidth, depth)       // 2D shapes to 3D extruded geometries
  const lineGroupSubtract = line_mesh_groups(line_buffers_thin)       // 3D geometries to 3D mesh objects
  lineGroupSubtract.children.forEach((mesh) => {
    mesh.position.z = engraveZpos;
    mesh.updateMatrix();
  });
  console.log('lineGroupSubtract', lineGroupSubtract.children.length)
  geomGroup = subtractMeshes(geomGroup, lineGroupSubtract);


  let allTogether = new THREE.Group();
  allTogether.add(geomGroup);
  allTogether.add(lineGroup);
  allTogether.add(boundsGroup);

  allTogether.scale.y *= stretchFactor;
  basePiece.scale.y *= stretchFactor;
  const bbox = new THREE.Box3().setFromObject(allTogether);
  const scaleX = scaleToThisSize / (bbox.max.x - bbox.min.x);
  const scaleY = scaleToThisSize / (bbox.max.y - bbox.min.y);
  const scaleFactor = Math.min(scaleX, scaleY);

  allTogether.scale.set(scaleFactor, scaleFactor * stretchFactor, scaleFactor);
  basePiece.scale.set(scaleFactor, scaleFactor * stretchFactor, scaleFactor);
  basePiece.position.x = 180


  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x333333);
  scene.add(new THREE.AxesHelper(100));
  const sceneInstance = scene;

  // sceneInstance.add(gridGroup)
  sceneInstance.add(allTogether);
  sceneInstance.add(basePiece);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const cameraInstance = camera();
  new OrbitControls(cameraInstance, renderer.domElement);
  renderer.setSize(window.width, window.height);

  const rendererContainer = document.getElementById('renderer');
  rendererContainer.innerHTML = '';
  rendererContainer.appendChild(renderer.domElement);

  const exportTopBtn = document.createElement('button');
  exportTopBtn.textContent = 'Export Box Top';
  exportTopBtn.addEventListener('click', () => { exportScene(allTogether, 'geom_box'); });
  rendererContainer.appendChild(exportTopBtn);

  const exportBtmBtn = document.createElement('button');
  exportBtmBtn.textContent = 'Export Box Base';
  exportBtmBtn.addEventListener('click', () => { exportScene(basePiece, 'geom_base'); });
  rendererContainer.appendChild(exportBtmBtn);

  function animate() {
    requestAnimationFrame(animate); // Animation loop
    renderer.render(sceneInstance, cameraInstance);
  }
  animate();
}