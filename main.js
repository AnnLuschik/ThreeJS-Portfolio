import gsap from 'gsap';
import * as THREE from 'three';
import * as dat from 'dat.gui';

import { initialColor, defaultHoverColor, minValues, maxValues } from './constants';
import './style.css';

// GUI Controls
const gui = new dat.GUI();
const world = {
  plane: {
    width: 400,
    height: 400,
    widthSegments: 50,
    heightSegments: 50,
    r: defaultHoverColor.r,
    g: defaultHoverColor.g,
    b: defaultHoverColor.b,
  }
};
Object.keys(world.plane).forEach((key) => {
  gui.add(world.plane, `${key}`, minValues[key], maxValues[key]).onChange(generatePlane);
})

let renderer, scene, camera, raycaster, orbit;
let frame = 0;
const tl = gsap.timeline();

const mouse = new THREE.Vector2();

let plane;

init();

function init() {
  raycaster = new THREE.Raycaster();
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 100;
  scene.add(camera);

  // Renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  document.body.appendChild(renderer.domElement);

  // Plane object
  const geometry = new THREE.PlaneGeometry(world.plane.width, world.plane.height, world.plane.widthSegments, world.plane.heightSegments);
  const material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, flatShading: THREE.FlatShading, vertexColors: true });
  plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
  generatePlane();

  // Lights
  const light = new THREE.DirectionalLight(0xFFFFFF, 1);
  light.position.set(0, 1, 1);
  scene.add(light);

  const backLight = new THREE.DirectionalLight(0xFFFFFF, 1);
  backLight.position.set(0, 0, -1);
  scene.add(backLight);

  document.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('resize', onWindowResize);

  const button = document.querySelector('button');
  button.addEventListener('click', flyCamera);

  animate();
}

function generatePlane() {
  const { width, height, widthSegments, heightSegments } = world.plane;

  plane.geometry.dispose();
  plane.geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);

  // vertice position randomization
  const { array } = plane.geometry.attributes.position;
  const randomValues = [];
  for (let i = 0; i < array.length; i++) {
    if (i % 3 === 0) {
      const x = array[i];
      const y = array[i + 1];
      const z = array[i + 2];

      array[i] = x + (Math.random() - 0.5) * 3;
      array[i + 1] = y + (Math.random() - 0.5) * 5;
      array[i + 2] = z + (Math.random() - 0.5) * 5;
    }

    randomValues.push(Math.random() * Math.PI * 2);
  }

  plane.geometry.attributes.position.randomValues = randomValues;
  plane.geometry.attributes.position.originalPosition = plane.geometry.attributes.position.array;

  // color attribute position
  const colors = [];
  for (let i = 0; i < plane.geometry.attributes.position.count; i++) {
    colors.push(initialColor.r, initialColor.g, initialColor.b);
  }

  plane.geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
}

function animate() {
  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);
  frame += 0.01;

  const { array, originalPosition, randomValues } = plane.geometry.attributes.position;
  for (let i = 0; i < array.length; i += 3) {
    array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.01;
    array[i + 1] = originalPosition[i + 1] + Math.cos(frame + randomValues[i + 1]) * 0.01;
  }

  plane.geometry.attributes.position.needsUpdate = true;

  const intersects = raycaster.intersectObject(plane);
  if (intersects.length > 0) {
    const { color } = intersects[0].object.geometry.attributes;

    const hoverColor = {
      r: world.plane.r,
      g: world.plane.g,
      b: world.plane.b,
    };

    gsap.to(hoverColor, {
      r: initialColor.r,
      g: initialColor.g,
      b: initialColor.b,
      onUpdate: () => {
        // vertice 1
        color.setX(intersects[0].face.a, hoverColor.r);
        color.setY(intersects[0].face.a, hoverColor.g);
        color.setZ(intersects[0].face.a, hoverColor.b);

        // vertice 2
        color.setX(intersects[0].face.b, hoverColor.r);
        color.setY(intersects[0].face.b, hoverColor.g);
        color.setZ(intersects[0].face.b, hoverColor.b);

        // vertice 3
        color.setX(intersects[0].face.c, hoverColor.r);
        color.setY(intersects[0].face.c, hoverColor.g);
        color.setZ(intersects[0].face.c, hoverColor.b);

        color.needsUpdate = true;
      }
    })
  }

  requestAnimationFrame(animate);
}

function flyCamera() {
  const text = document.querySelector('#app');
  text.className = 'invisible';

  tl
    .to(camera.position, {
      duration: 1,
      z: 10,
      y: -world.plane.height / 2,
      onUpdate: function () {
        camera.lookAt(scene.position);
      }
    })
    .to(camera.position, {
      duration: 0.5,
      y: world.plane.height,
      ease: "expo.in",
      onUpdate: function () {
        window.location.href = "https://github.com/AnnLuschik";
      }
    })
}

function onWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
