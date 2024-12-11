import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styled from 'styled-components';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

const Wrapper = styled.div`
  width: 650px;  
  height: 650px; 
  background: transparent;  
  position: relative; 
`;

const Slot = styled.div`
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const PanTarget = styled.div`
  display: block;
  position: absolute;
  width: 0;
  height: 0;
  left: 50%;
  top: 50%;
  transform: translate3d(-50%, -50%, 0);
  background-color: transparent;
  opacity: 0;
  transition: opacity 0.3s;
`;

const createSRibbon = () => {
  const curve = new THREE.CurvePath();

  curve.add(new THREE.CubicBezierCurve3(
    new THREE.Vector3(-2, 2, 0),
    new THREE.Vector3(-2, 4, 0),
    new THREE.Vector3(2, 4, 0),
    new THREE.Vector3(2, 2, 0)
  ));

  curve.add(new THREE.CubicBezierCurve3(
    new THREE.Vector3(2, 2, 0),
    new THREE.Vector3(2, 0, 0),
    new THREE.Vector3(-2, 0, 0),
    new THREE.Vector3(-2, -2, 0)
  ));

  curve.add(new THREE.CubicBezierCurve3(
    new THREE.Vector3(-2, -2, 0),
    new THREE.Vector3(-2, -4, 0),
    new THREE.Vector3(2, -4, 0),
    new THREE.Vector3(2, -2, 0)
  ));

  const geometry = new THREE.TubeGeometry(curve, 100, 0.4, 20, false);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const context = canvas.getContext('2d')!;
  const gradient = context.createLinearGradient(0, 0, 256, 0);
  gradient.addColorStop(0, '#00FFA3');
  gradient.addColorStop(0.5, '#03E1FF');
  gradient.addColorStop(1, '#DC1FFF');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 1);
  const texture = new THREE.CanvasTexture(canvas);

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });

  return new THREE.Mesh(geometry, material);
};

const createParticles = () => {
  const particleCount = 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const x = (Math.random() * 2 - 1) * 0.5;
    const y = (Math.random() * 2 - 1) * 0.5;
    const z = (Math.random() * 2 - 1) * 0.5;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    velocities[i * 3] = (Math.random() * 2 - 1) * 0.02;
    velocities[i * 3 + 1] = (Math.random() * 2 - 1) * 0.02;
    velocities[i * 3 + 2] = (Math.random() * 2 - 1) * 0.02;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.05,
    transparent: true,
    opacity: 1.0,
  });

  return new THREE.Points(geometry, material);
};

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const width = 650;
    const height = 650;
  
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }
  
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
  
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
  
    const ribbons = [];
    const ribbonCount = 10;
    for (let i = 0; i < ribbonCount; i++) {
      const ribbon = createSRibbon();
      ribbon.position.z = -i * 0.1;
      ribbons.push(ribbon);
      scene.add(ribbon);
    }
  
    const particles = createParticles();
    scene.add(particles);
  
    camera.position.set(0, 0, 14);
  
    let time = 0;
    const rotationSpeed = 0.01;
    const radius = 0.5;
    const layerDelay = 0.1;
  
    let zoomingIn = true;
  
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
  
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.0, 0.4, 0.85);
    composer.addPass(bloomPass);
  
    const animate = function () {
      requestAnimationFrame(animate);
      time += 0.01;
  
      ribbons.forEach((ribbon) => {
        ribbon.rotation.x += 0.01;
        ribbon.rotation.y += 0.01;
        ribbon.rotation.z += 0.01;
      });
  
      const positions = particles.geometry.attributes.position.array;
      const velocities = particles.geometry.attributes.velocity.array;
  
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
  
        if (Math.abs(positions[i]) > 5 || Math.abs(positions[i + 1]) > 5 || Math.abs(positions[i + 2]) > 5) {
          positions[i] = (Math.random() * 2 - 1) * 0.5;
          positions[i + 1] = (Math.random() * 2 - 1) * 0.5;
          positions[i + 2] = (Math.random() * 2 - 1) * 0.5;
          velocities[i] = (Math.random() * 2 - 1) * 0.02;
          velocities[i + 1] = (Math.random() * 2 - 1) * 0.02;
          velocities[i + 2] = (Math.random() * 2 - 1) * 0.02;
        }
      }
  
      particles.geometry.attributes.position.needsUpdate = true;
  
      if (zoomingIn) {
        camera.position.z -= 0.05;
        bloomPass.strength = Math.min(bloomPass.strength + 0.05, 2.0);
        if (camera.position.z <= 10) {
          zoomingIn = false;
        }
      } else {
        camera.position.z += 0.05;
        bloomPass.strength = Math.max(bloomPass.strength - 0.05, 0.0);
        if (camera.position.z >= 14) {
          zoomingIn = true;
        }
      }
  
      camera.lookAt(scene.position);
      composer.render();
    };
  
    animate();
  
    const handleResize = () => {
      const width = mountRef.current!.clientWidth;
      const height = mountRef.current!.clientHeight;
      renderer.setSize(width, height);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
  
    window.addEventListener('resize', handleResize);
  
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);  

  return (
    <Wrapper>
      <Slot>
        <PanTarget />
        <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      </Slot>
    </Wrapper>
  );
}

export default ThreeScene; 