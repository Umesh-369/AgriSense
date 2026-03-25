/**
 * ============================================
 * Three.js 3D Scene for Hero Section
 * ============================================
 * 
 * Creates an immersive 3D animated background with:
 * - Floating particles (water droplets)
 * - Animated soil/plant visualization
 * - Interactive camera movement
 * - Responsive sizing
 */

(function () {
    'use strict';

    // Get canvas element
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    // ============================================
    // Scene Setup
    // ============================================

    // Create scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x064e3b, 0.02);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
        75,                                     // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1,                                    // Near plane
        1000                                    // Far plane
    );
    camera.position.z = 30;
    camera.position.y = 5;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    // ============================================
    // Lighting
    // ============================================

    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x10b981, 0.5);
    scene.add(ambientLight);

    // Point light for dramatic effect
    const pointLight1 = new THREE.PointLight(0x10b981, 1, 100);
    pointLight1.position.set(20, 20, 20);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 0.8, 100);
    pointLight2.position.set(-20, -20, 20);
    scene.add(pointLight2);

    // ============================================
    // Particle System - Water Droplets
    // ============================================

    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        // Random positions
        positions[i * 3] = (Math.random() - 0.5) * 100;      // x
        positions[i * 3 + 1] = (Math.random() - 0.5) * 100;  // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100;  // z

        // Random velocities for animation
        velocities[i] = 0.05 + Math.random() * 0.1;

        // Random sizes
        sizes[i] = 0.5 + Math.random() * 1.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Custom shader material for particles
    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0x10b981) },
            time: { value: 0 }
        },
        vertexShader: `
            attribute float size;
            varying float vAlpha;
            uniform float time;
            
            void main() {
                vAlpha = 0.3 + 0.7 * sin(time + position.x * 0.1);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying float vAlpha;
            
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                
                float alpha = vAlpha * (1.0 - dist * 2.0);
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // ============================================
    // Central Object - Glowing Sphere (Plant/Soil)
    // ============================================

    // Inner glowing core
    const coreGeometry = new THREE.IcosahedronGeometry(3, 3);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    // Outer wireframe shell
    const shellGeometry = new THREE.IcosahedronGeometry(5, 1);
    const shellMaterial = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    scene.add(shell);

    // Outer glow ring
    const ringGeometry = new THREE.TorusGeometry(7, 0.2, 16, 100);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.5
    });
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
    ring1.rotation.x = Math.PI / 2;
    scene.add(ring1);

    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial.clone());
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    scene.add(ring2);

    // ============================================
    // Floating Cubes (Data Points)
    // ============================================

    const cubes = [];
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

    for (let i = 0; i < 15; i++) {
        const cubeMaterial = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0x10b981 : 0x06b6d4,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });

        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

        // Position in a spherical pattern
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 15 + Math.random() * 10;

        cube.position.x = radius * Math.sin(phi) * Math.cos(theta);
        cube.position.y = radius * Math.sin(phi) * Math.sin(theta);
        cube.position.z = radius * Math.cos(phi);

        cube.userData = {
            rotationSpeed: 0.01 + Math.random() * 0.02,
            orbitSpeed: 0.001 + Math.random() * 0.002,
            initialPosition: cube.position.clone()
        };

        cubes.push(cube);
        scene.add(cube);
    }

    // ============================================
    // Mouse Interaction
    // ============================================

    let mouseX = 0;
    let mouseY = 0;
    const targetX = 0;
    const targetY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - window.innerWidth / 2) * 0.0005;
        mouseY = (event.clientY - window.innerHeight / 2) * 0.0005;
    });

    // ============================================
    // Animation Loop
    // ============================================

    let time = 0;
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        time += delta;

        // Update particle shader time
        particleMaterial.uniforms.time.value = time;

        // Animate particles (falling effect)
        const posArray = particleGeometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            posArray[i * 3 + 1] -= velocities[i];

            // Reset particle if it falls below
            if (posArray[i * 3 + 1] < -50) {
                posArray[i * 3 + 1] = 50;
            }
        }
        particleGeometry.attributes.position.needsUpdate = true;

        // Rotate core objects
        core.rotation.x += 0.002;
        core.rotation.y += 0.003;

        shell.rotation.x -= 0.001;
        shell.rotation.y += 0.002;

        ring1.rotation.z += 0.005;
        ring2.rotation.z -= 0.003;

        // Animate cubes
        cubes.forEach((cube, index) => {
            cube.rotation.x += cube.userData.rotationSpeed;
            cube.rotation.y += cube.userData.rotationSpeed;

            // Orbit animation
            const orbitRadius = cube.userData.initialPosition.length();
            const orbitAngle = time * cube.userData.orbitSpeed + index;

            cube.position.x = cube.userData.initialPosition.x * Math.cos(orbitAngle) -
                cube.userData.initialPosition.z * Math.sin(orbitAngle);
            cube.position.z = cube.userData.initialPosition.x * Math.sin(orbitAngle) +
                cube.userData.initialPosition.z * Math.cos(orbitAngle);
        });

        // Camera movement based on mouse
        camera.position.x += (mouseX * 10 - camera.position.x) * 0.02;
        camera.position.y += (mouseY * 10 + 5 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);

        // Animate lights
        pointLight1.position.x = Math.sin(time * 0.5) * 20;
        pointLight1.position.z = Math.cos(time * 0.5) * 20;

        pointLight2.position.x = Math.sin(time * 0.3 + Math.PI) * 20;
        pointLight2.position.z = Math.cos(time * 0.3 + Math.PI) * 20;

        renderer.render(scene, camera);
    }

    // Start animation
    animate();

    // ============================================
    // Window Resize Handler
    // ============================================

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize);

    // ============================================
    // Visibility Change Handler
    // ============================================

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clock.stop();
        } else {
            clock.start();
        }
    });

})();
