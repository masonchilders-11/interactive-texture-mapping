// Scene setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
// Adding OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.addEventListener('change', render); // use if there is no animation loop
controls.minDistance = 20; // Limit zoom in
controls.maxDistance = 500; // Limit zoom out
controls.enablePan = true;

camera.position.set(0, 50, 100); // Position the camera above and looking down at the terrain
camera.lookAt(0, 0, 0); // Make the camera look at the center of the scene

function render() {
    renderer.render(scene, camera);
    }


function generateTerrain(fractalLayers, material) {        // Create a plane for the terrain
   const planeGeometry = new THREE.PlaneGeometry(100, 100, 64, 64); // Width, height, width segments, height segments
    
   const vertices = planeGeometry.attributes.position.array;
    const size = 100; // Assuming a plane size of 100x100 for reference
   // Parameters for the terrain function to simulate more natural variations and lower corners
    const baseHeightScale = 6; // Base scale of the height variations
    const frequencyBase = 0.09; // Base frequency of the sine/cosine waves
    const cornerLoweringFactor = 0.05; // Factor to lower the corners
    const irregularityFactor = 0.6; // Factor to introduce irregularity
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        // Calculate distance from the corner
        const distanceFromCorner = Math.sqrt(x * x + y * y);
        const heightDecrease = distanceFromCorner * cornerLoweringFactor;

        let terrainHeight = 10;
        let amplitude = baseHeightScale;
         let frequency = frequencyBase;
    
         for (let j = 0; j < fractalLayers; j++) {
             const randomOffset = (Math.random() - 0.5) * irregularityFactor;
             terrainHeight += (Math.sin(x * frequency + randomOffset) + Math.cos(y * frequency + randomOffset)) * amplitude;
            amplitude *= 0.5; // Decrease amplitude
             frequency *= 2; // Increase frequency
         }
    
            vertices[i + 2] = terrainHeight + (0.01 * x * x + 0.01 * y * y) - heightDecrease;
    }
    
   planeGeometry.computeVertexNormals(); // To ensure lighting is calculated correctly
    
   const terrain = new THREE.Mesh(planeGeometry, material);
   terrain.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal

   scene.add(terrain);
   return terrain;
}





// Texture loader
const textureLoader = new THREE.TextureLoader();

// Load the diffuse texture (color map)
const grassColorTexture = textureLoader.load('textures/everytexture.com-stock-nature-grass-texture-00007-diffuse-2048.jpg', function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(7, 7); // This value determines the repetition of the texture
});

// Load the normal map
const grassNormalTexture = textureLoader.load('textures/everytexture.com-stock-nature-grass-texture-00007-normal-2048.jpg', function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(7, 7); // Use the same value as the color texture for consistency
});

// Load the bump map
const grassBumpTexture = textureLoader.load('textures/everytexture.com-stock-nature-grass-texture-00007-bump-2048.jpg', function (texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(7, 7); // Use the same value as the color texture for consistency
});

// Create a material with these textures
const grassMaterial = new THREE.MeshStandardMaterial({
    map: grassColorTexture,
    normalMap: grassNormalTexture,
    bumpMap: grassBumpTexture
});

// Creating grass terrain
let terrain = generateTerrain(4, grassMaterial);





// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 100, 100); // Adjusted to better illuminate the terrain
scene.add(directionalLight);





directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048; // Higher resolution for the shadow map
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5; // Closer near plane can help improve shadow accuracy
directionalLight.shadow.camera.far = 500; 

directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;

directionalLight.shadow.camera.updateProjectionMatrix();





// Assuming Perlin noise is available through a library or custom function
const noise = new SimplexNoise();

// Cloud particles setup with Perlin noise
const cloudMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.5, // Increased size for a fluffier appearance
  transparent: true,
  opacity: 0.35, // Increased opacity for denser clouds
  blending: THREE.AdditiveBlending, // Use additive blending for a softer look
});

const cloudGeometry = new THREE.BufferGeometry();
const particles = 50000;
const positions = new Float32Array(particles * 3);

for (let i = 0; i < particles; i++) {
  // Use Perlin noise to create a more natural cloud distribution
  let x = Math.random() * 100 - 50; // Cloud spread area
  let y = 55 + Math.random() * 1; // Base height + randomness
  let z = Math.random() * 100 - 50; // Cloud spread area

  // Apply noise based on position to create cloud clusters
  let density = (1 + noise.noise3D(x * 0.05, y * 0.05, z * 0.05)) * 0.5;
  if (density > 0.5) { // Adjust threshold for cloud density
    positions[i * 3] = x;
    positions[i * 3 + 1] = y + noise.noise3D(x * 0.1, y * 0.1, z * 0.1) * 3 ; // Use noise for vertical variation
    positions[i * 3 + 2] = z;
  }
}

cloudGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const clouds = new THREE.Points(cloudGeometry, cloudMaterial);
scene.add(clouds);

// Subtle cloud animation
function animateClouds() {
    let positions = cloudGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += cloudProgressionOffset; // Slowly move the cloud along the x-axis
      positions[i + 2] += cloudProgressionOffset; // Slowly move the cloud along the z-axis
  
      // Regenerate cloud particles at the opposite side if they go off the plane boundaries
      if (positions[i] > 50) positions[i] = -50; // Regenerate on the opposite side along the x-axis
      if (positions[i + 2] > 50) positions[i + 2] = -50; // Regenerate on the opposite side along the z-axis
  
      // Alternatively, reset to a random position within the plane boundaries for a more dispersed regeneration
      // if (positions[i] > 50 || positions[i] < -50) positions[i] = Math.random() * 100 - 50;
      // if (positions[i + 2] > 50 || positions[i + 2] < -50) positions[i + 2] = Math.random() * 100 - 50;
  
      // Randomly adjust y position to simulate cloud fluffiness and dynamics
      positions[i + 1] += Math.sin(Date.now() * 0.001 + positions[i] * positions[i + 2] * 0.0001) * 0.001;
    }
    cloudGeometry.attributes.position.needsUpdate = true;
  }





// Snow particles setup
const snowParticleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.2,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });
  
  const snowParticleGeometry = new THREE.BufferGeometry();
  const snowParticles = 10000; // More particles for a denser snow effect
  const snowPositions = new Float32Array(snowParticles * 3);
  
  const snowHeightStart = 55; // Starting height, close to the cloud base
  const snowHeightEnd = 56; // End height, to ensure snow starts within the cloud
  const planeWidth = 100;
  const planeLength = 100; // Assuming a square plane for simplicity
  
  for (let i = 0; i < snowParticles;) {
    let x = Math.random() * planeWidth - planeWidth / 2; // Centered over the plane
    let y = Math.random() * (snowHeightStart - snowHeightEnd) + snowHeightEnd; // Start from cloud level to just above it
    let z = Math.random() * planeLength - planeLength / 2;
    let density = (1 + noise.noise3D(x * 0.05, y * 0.05, z * 0.05)) * 0.5; // Use same density check as clouds
  
    // Only place snow particles where cloud density is high
    if (density > 0.5) {
      snowPositions[i * 3] = x;
      snowPositions[i * 3 + 1] = y;
      snowPositions[i * 3 + 2] = z;
      i += 3; // Only increment i here to ensure we fill the array with valid positions
    }
  }
  
  snowParticleGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
  const snow = new THREE.Points(snowParticleGeometry, snowParticleMaterial);
 // scene.add(snow);
  

  
  
// Global variable to simulate the progression of cloud coverage
let cloudProgressionOffset = 0.01;

let snowFallRate = 0.1; // Control the rate at which snowflakes fall
let tricklingEffectInterval = 100; // Determines how frequently new snowflakes start falling
let lastTricklingUpdateTime = 0; // Tracks the last update time for the trickling effect

function animateSnow() {
    const positions = snowParticleGeometry.attributes.position.array;
    const cloudBaseHeight = 55; // Base height of the clouds
    const cloudHeightVariation = 1; // Additional variation in cloud height


    let currentTime = Date.now();
    if (currentTime - lastTricklingUpdateTime > tricklingEffectInterval) {
        lastTricklingUpdateTime = currentTime;

        // Randomly select a subset of snow particles to start falling
        let particlesToStartFalling = Math.floor(Math.random() * snowParticles * 0.01); // 1% of particles

        for (let i = 0; i < particlesToStartFalling; i++) {
            let index = Math.floor(Math.random() * snowParticles) * 3;

            if (positions[index + 1] > cloudBaseHeight) { // Check if the particle is above cloud base
                // Adjust position to start falling
                positions[index + 1] -= snowFallRate;
            }
        }
    }

    for (let i = 0; i < positions.length; i += 3) {
        // Update position for particles already falling
        if (positions[i + 1] <= cloudBaseHeight + cloudHeightVariation && positions[i + 1] > 0) {
            positions[i + 1] -= snowFallRate; // Snowflakes fall vertically
        }

        // Reset particles that have hit the ground
        if (positions[i + 1] <= calculateTerrainHeight(positions[i], positions[i + 2])) {
            let newX, newZ, density;
            do {
                newX = Math.random() * planeWidth - planeWidth / 2;
                newZ = Math.random() * planeLength - planeLength / 2;
                // Apply an offset to simulate cloud movement when checking for density
                density = (1 + noise.noise3D((newX + cloudProgressionOffset) * 0.05, cloudBaseHeight * 0.05, 
                (newZ + cloudProgressionOffset) * 0.05)) * 0.5;
            } while (density <= 0.5); // Ensure particles reset in dense cloud areas

            // Reset the snowflake to a new position under the "moving" clouds
            positions[i] = newX;
            positions[i + 1] = cloudBaseHeight + Math.random() * cloudHeightVariation;
            positions[i + 2] = newZ;
        }
    }
    snowParticleGeometry.attributes.position.needsUpdate = true;
}





// Utility function to calculate terrain height at a given x, z position
function calculateTerrainHeight(x, z) {
    // Parameters matching those used in terrain generation
    const baseHeightScale = 6;
    const frequencyBase = 0.09;
    const cornerLoweringFactor = 0.05;
    const irregularityFactor = 0.6;
    let fractalLayers = 4;

    // Calculate distance from the origin (or chosen corner) for corner lowering effect
    const distanceFromCorner = Math.sqrt(x * x + z * z);
    const heightDecrease = distanceFromCorner * cornerLoweringFactor;

    // Initialize variables for combined fractal terrain height
    let terrainHeight = 10; // Base terrain height, adjust as needed
    let amplitude = baseHeightScale;
    let frequency = frequencyBase;

    // Accumulate fractal terrain layers
    for (let j = 0; j < fractalLayers; j++) {
        const randomOffset = (Math.random() - 0.5) * irregularityFactor;
        terrainHeight += (Math.sin(x * frequency + randomOffset) + Math.cos(z * frequency + randomOffset)) * amplitude;
        // Prepare for next layer
        amplitude *= 0.5; // Decrease amplitude
        frequency *= 2; // Increase frequency
    }

    // Apply combined fractal terrain height
    terrainHeight += (0.01 * x * x + 0.01 * z * z) // Adding a mild quadratic curve
                     - heightDecrease; // Apply the decrease based on distance from the corner

    return terrainHeight;
}



  



// Rain particles setup
const rainParticleMaterial = new THREE.PointsMaterial({
    color: 0x7777ff, // Light blue color to differentiate rain from snow
    size: 0.2, // Smaller size for raindrops
    transparent: true,
    opacity: 0.9 // Higher opacity for raindrops
});

const rainParticleGeometry = new THREE.BufferGeometry();
const rainParticles = 15000; // More particles for a denser rain effect
const rainPositions = new Float32Array(rainParticles * 3);

for (let i = 0; i < rainParticles;) {
    let x = Math.random() * planeWidth - planeWidth / 2;
    let y = Math.random() * (snowHeightStart - snowHeightEnd) + snowHeightEnd; // Use higher starting point for rain
    let z = Math.random() * planeLength - planeLength / 2;
    let density = 0.8; // Assuming rain is more uniformly distributed than snow

    // Place rain particles more uniformly
    if (density > 0.5) {
        rainPositions[i * 3] = x;
        rainPositions[i * 3 + 1] = y;
        rainPositions[i * 3 + 2] = z;
        i += 3; // Increment i to fill the array with valid positions
    }
}

rainParticleGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
const rain = new THREE.Points(rainParticleGeometry, rainParticleMaterial);
//scene.add(rain);



let rainFallRate = 0.3; // Rain falls faster than snow

function animateRain() {
    const positions = rainParticleGeometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
        // Make raindrops fall
        positions[i + 1] -= rainFallRate;

        // Reset raindrops that have hit the ground or a lower y-value than terrain height
        if (positions[i + 1] <= calculateTerrainHeight(positions[i], positions[i + 2])) {
            positions[i] = Math.random() * planeWidth - planeWidth / 2;
            positions[i + 1] = snowHeightStart; // Reset to start falling again
            positions[i + 2] = Math.random() * planeLength - planeLength / 2;
        }
    }
    rainParticleGeometry.attributes.position.needsUpdate = true;
}



// Create a more visually appealing sun with a MeshPhongMaterial
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshPhongMaterial({
    color: 0xFFFF00, // Bright yellow
    emissive: 0xFFFF00, // Make it glow like the sun
    emissiveIntensity: 0.9
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 100, 100); // Position it along with the directional light
scene.add(sun);

// Add enhanced sunlight with a PointLight
const sunlight = new THREE.PointLight(0xffffff, 1.8, 200, 2);
sunlight.position.set(0, 100, 100);
scene.add(sunlight);

// Optionally, create a simple glow effect around the sun
function createSunGlow() {
    const spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(generateSprite()),
        blending: THREE.AdditiveBlending
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(30, 30, 1.0);
    sun.add(sprite); // Attach the glow to the sun
}

function generateSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;

    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
    );
    gradient.addColorStop(0.1, 'rgba(255,255,0,1)');
    gradient.addColorStop(0.5, 'rgba(64,0,0,0.5)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    return canvas;
}

createSunGlow();


// Enable shadows in the renderer
renderer.shadowMap.enabled = true;

// Configure directional light to cast shadows
directionalLight.castShadow = true;
// Optional: Adjust shadow map size for better quality (increase for higher quality shadows)
directionalLight.shadow.mapSize.width = 512; // Default is 512
directionalLight.shadow.mapSize.height = 512; // Default is 512

// Terrain to receive shadows
terrain.receiveShadow = true;

// Global array to keep track of all trees
let snowyTrees = []; // Tracks snowy trees
let forestTrees = []; // Tracks forest trees


function generateTree(x, z) {
    const y = calculateTerrainHeight(x, z); // Calculate terrain height at (x, z)

    // Randomize tree dimensions
    const heightFactor = Math.random() * 0.5 + 0.75;
    const radiusFactor = Math.random() * 0.5 + 0.5;

    // Tree trunk
    const trunkHeight = 1.0 * heightFactor;
    const trunkRadius = 0.2 * radiusFactor;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 32);
    const trunkMaterial = new THREE.MeshLambertMaterial({color: 0x8B4513});
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + trunkHeight / 2, z);
    trunk.castShadow = true; // Enable trunk to cast shadows
    scene.add(trunk);

    // Tree canopy with increased noise
    const canopyRadius = 0.4 * radiusFactor;
    const canopyHeight = 1.5 * heightFactor;
    const canopyGeometry = new THREE.SphereGeometry(canopyRadius, 32, 32);
    canopyGeometry.scale(1, 1.5, 1); // Ellipsoid shape
    const positions = canopyGeometry.attributes.position;
    const noiseLevel = 1.9; // Increased noise level
    for (let i = 0; i < positions.count; i++) {
        positions.setXYZ(
            i,
            positions.getX(i) + (Math.random() - 0.5) * noiseLevel,
            positions.getY(i) + (Math.random() - 0.5) * noiseLevel,
            positions.getZ(i) + (Math.random() - 0.5) * noiseLevel
        );
    }
    positions.needsUpdate = true;
    const canopyMaterial = new THREE.MeshLambertMaterial({color: 0x228B22});
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(x, y + trunkHeight + canopyHeight / 2, z);
    canopy.castShadow = true; // Enable canopy to cast shadows
    scene.add(canopy);
    
    forestTrees.push(trunk, canopy);
}

// Increase the number of trees generated
for (let i = 0; i < 100; i++) { // Generating 200 trees as an example
    const x = Math.random() * 100 - 50; // Assuming the terrain is 100x100
    const z = Math.random() * 100 - 50;
    generateTree(x, z);
}


function generateSnowyTree(x, z) {
    const y = calculateTerrainHeight(x, z); // Calculate terrain height at (x, z)

    // Randomize tree dimensions
    const heightFactor = Math.random() * 0.5 + 0.75;
    const radiusFactor = Math.random() * 0.5 + 0.5;

    // Tree trunk
    const trunkHeight = 1.0 * heightFactor;
    const trunkRadius = 0.2 * radiusFactor;
    const trunkGeometry = new THREE.CylinderGeometry(trunkRadius, trunkRadius, trunkHeight, 32);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + trunkHeight / 2, z);
    trunk.castShadow = true;
    scene.add(trunk);

    // Snowy tree canopy
    const canopyRadius = 0.4 * radiusFactor;
    const canopyHeight = 1.5 * heightFactor;
    const canopyGeometry = new THREE.SphereGeometry(canopyRadius, 32, 32);
    canopyGeometry.scale(1, 1.5, 1); // Ellipsoid shape
    const positions = canopyGeometry.attributes.position;
    const noiseLevel = 1.9;
    for (let i = 0; i < positions.count; i++) {
        positions.setXYZ(
            i,
            positions.getX(i) + (Math.random() - 0.5) * noiseLevel,
            positions.getY(i) + (Math.random() - 0.5) * noiseLevel,
            positions.getZ(i) + (Math.random() - 0.5) * noiseLevel
        );
    }
    positions.needsUpdate = true;

    // Adjust the canopy material to a snowy appearance
    const canopyMaterial = new THREE.MeshLambertMaterial({ color: 0xF0F8FF }); // Light snow color
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.set(x, y + trunkHeight + canopyHeight / 2, z);
    canopy.castShadow = true;
    scene.add(canopy);

    
    snowyTrees.push(trunk, canopy);
}

// Increase the number of snowy trees generated
for (let i = 0; i < 100; i++) {
    const x = Math.random() * 100 - 50;
    const z = Math.random() * 100 - 50;
    generateSnowyTree(x, z);
}





// Assuming all your existing code is here

// GUI Controls
const gui = new dat.GUI();

const settings = {
    biome: "forest", // Default biome
    trees: 100, // Default number of trees
    rainSpeed: 0.3, // Default rain fall speed
    cloudSpeed: 0.01, // Default cloud movement speed
};

function clearTrees() {
     // Clear snowy trees
     snowyTrees.forEach(tree => scene.remove(tree));
     snowyTrees.length = 0; // Reset the array
 
     // Clear forest trees
     forestTrees.forEach(tree => scene.remove(tree));
     forestTrees.length = 0; // Reset the array
}


// GUI control for biome switching
gui.add(settings, 'biome', ['snow', 'forest', 'desert']).name('Biome').onChange(generateBiomeTrees);




// Load the color map with repeat wrapping
const snowColor = textureLoader.load('textures/rock_0008_color_2k.jpg', function(texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Adjust this value based on your needs
});

// Load the roughness map with repeat wrapping
const snowRoughness = textureLoader.load('textures/rock_0008_roughness_2k.jpg', function(texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Match the repeat value with the color map
});

// Load the normal map with repeat wrapping
const snowNormal = textureLoader.load('textures/rock_0008_normal_opengl_2k.png', function(texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Match the repeat value with the color map
});

// Load the height map with repeat wrapping
const snowHeight = textureLoader.load('textures/rock_0008_height_2k.png', function(texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Match the repeat value with the color map
});

// Load the ambient occlusion map with repeat wrapping
const snowAo = textureLoader.load('textures/rock_0008_ao_2k.jpg', function(texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); // Match the repeat value with the color map
});

// Creating the snowy mountain material
const materialSnow = new THREE.MeshStandardMaterial({
    map: snowColor,
    roughnessMap: snowRoughness,
    normalMap: snowNormal,
    displacementMap: snowHeight,
    aoMap: snowAo,
    displacementScale: 1,
    normalScale: new THREE.Vector2(1, 1)
});

let snowTerrain = generateTerrain(4, materialSnow);

// Load the sandy beach color texture with repeat wrapping
const sandColorTexture = textureLoader.load('textures/4429.jpg', function(texture) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    // Set the repetition for the texture. Adjust the values as needed.
    texture.repeat.set(5, 5); 
});

// Create the material with the sandy texture
const sandMaterial = new THREE.MeshStandardMaterial({
    map: sandColorTexture,
    // Other material properties like roughness and bump maps can be added if you have them
});

let desert = generateTerrain(1, sandMaterial);





// This function now clears and regenerates trees based on the current biome setting
function generateBiomeTrees() {
    clearTrees(); // Clear existing trees of both types

    if (settings.biome === "snow") {
        scene.add(snowTerrain);
        scene.remove(terrain);
        scene.remove(desert);
        showSnow = true; // Enable snow
        // Generate snowy trees
        fractalLayers = 4;
        for (let i = 0; i < settings.trees; i++) {
            const x = Math.random() * 100 - 50;
            const z = Math.random() * 100 - 50;
            generateSnowyTree(x, z);
        }
    } else if (settings.biome === "forest") { // "forest"
        scene.remove(desert);
        scene.remove(snowTerrain);
        scene.add(terrain);
        
        showSnow = false; // Disable snow
        // Generate forest trees
        fractalLayers = 4;
        for (let i = 0; i < settings.trees; i++) {
            const x = Math.random() * 100 - 50;
            const z = Math.random() * 100 - 50;
            generateTree(x, z);
        }
       
    }else if (settings.biome === "desert") {
        showSnow = false; // Ensure snow is disabled
        showRain = false; // Ensure rain is disabled
        scene.remove(terrain);
        scene.remove(snowTerrain);
        scene.add(desert);

        planeGeometry.attributes.position.needsUpdate = true; // Important to update the geometry
    }
}



// Tree count slider
gui.add(settings, 'trees', 0, 1000).name('Number of Trees').onChange(generateBiomeTrees);

// Rain speed slider
gui.add(settings, 'rainSpeed', 0.1, 1.0).name('Rain Speed').onChange(value => {
    rainFallRate = value;
});

// Cloud speed slider
gui.add(settings, 'cloudSpeed', 0.01, 0.05).name('Cloud Speed').onChange(value => {
    cloudProgressionOffset = value;
});

// Initial tree generation
generateBiomeTrees();




let rainAdded = false; // This flag will track whether the rain is added to the scene
let snowAdded = false; // This flag will track whether the rain is added to the scene


// Modify the animate function to include animateRain
function animate() {
    requestAnimationFrame(animate);
  
    animateClouds();
    // Check if we should show snow
    if (showSnow) {
      if (!snowAdded) {
        scene.add(snow); // Add the snow if it's not already added
        snowAdded = true;
      }
      animateSnow();
    } else {
      if (snowAdded) {
        scene.remove(snow); // Remove the snow if `showSnow` is false
        snowAdded = false;
      }
    }
    // Keep the rain logic as previously implemented
    if (showRain) {
      if (!rainAdded) {
        scene.add(rain); // Ensure the rain is added
        rainAdded = true;
      }
      animateRain();
    } else {
      if (rainAdded) {
        scene.remove(rain); // Remove the rain if necessary
        rainAdded = false;
      }
    }
    renderer.render(scene, camera);
  }
  

animate();
