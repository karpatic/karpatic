window.rir = (min, max) => Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);

// Footer Background Animation
function generatePath(bars) { 
    const h = 200; const addPath=(x,y)=>`L${Math.round(x*window.w/bars)},${y}`; 
    const path=Array.from({length:bars},(y,x)=>{y=h-(rir(2,5)*40); return addPath(x,y)+addPath(x+1,y)});
    return ("M0,"+h+path.join('')+addPath(bars, h)+"L0," + h + "Z").replace('undefined', '');
}
function updatePath() {
    const newPath = "path('"+generatePath(6)+"')"
    const footer = document.getElementById("footer_bg").style 
    // set css var --path2 to --path1's computed value and update --path1 with new path(d)
    const pastPath = getComputedStyle(document.documentElement).getPropertyValue('--path1');
    footer.clipPath = pastPath;
    // Using css vars helps ensure auto-prefixing is done correctly 
    document.documentElement.style.setProperty('--path1', newPath);
    document.documentElement.style.setProperty('--path2', pastPath || newPath);
    //Fix for Glitchy animation Otherwise flashes end of animation before starting again.
    footer.animation = "none"; 
    setTimeout(()=>{ footer.animation = "clip-path-polygon 1000ms forwards"; }, 100)
}
window.w=Math.min(window.innerWidth, 800); 
updatePath(); setInterval(updatePath,1500);





 // Animated Background Cubes
// create random # SVG's cubes w random# of sizes,colors,speeds, & positions
// Steps: 0. loop steps 1,2 // 1. reset our svg with rir new cubes. // 2. Animate Cubes top-bottom
createCube = () => {
  const x = rir(0,200)+'vh'; const y = rir(0,100)+'vh'; const size = rir(40,80)
  const cube = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
  cube.setAttribute('x', x); cube.setAttribute('y', y);
  cube.setAttribute('height', size); cube.setAttribute('width', size);
  cube.setAttribute('fill', ['red','green','orange', 'blue'][rir(0,3)]);
  cube.classList.add('cube'); return cube;
};
createCubes = () => { return Array(rir(8,15)).fill().map( () =>{c=window.createCube(); window.svg_bg.appendChild(c); return c});  };
animateCubes = () => { [...document.querySelectorAll('.cube')].forEach(cube => { c = cube.style;
    c.setProperty('--startx', `-${rir(0, 10)}vh`); c.setProperty('--endx', `${rir(0, 10)}vh`);
    c.setProperty('--starty', `-${rir(100, 125)}vh`); c.setProperty('--endy', `${rir(100, 125)}vh`);
    cube.style.animation = `cube-animation ${duration}ms forwards`;
  }); 
}; 
window.duration = 20000
createAndAnimate = () => { window.svg_bg.innerHTML = ''; window.cubes = createCubes(rir(15, 25)); animateCubes(); };
createAndAnimate(); setInterval(() => { createAndAnimate(duration); }, duration);
