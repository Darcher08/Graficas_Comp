/**
 * Configuracion Inicial
 */
const scene = new THREE.Scene(); //Escena
// Camara
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

/**
 * El renderer permite que se puedan crear objetos
 * y poder renderizarlos en ejecucion.
 */
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

// Creacion de un cubo para desplegar en la escena
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);

scene.add(cube);
camera.position.z = 5;

/*
 * Animacion que va realizar el objeto creado (El cubo)
 * Se llama por medio de setAnimationLoop()
 */

function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
