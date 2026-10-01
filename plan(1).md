Step 1 — Get the Sketchfab model's annotation data
Temporarily create a tiny HTML page containing the Sketchfab viewer.
For example:
<iframe
  id="api-frame"
  src="https://sketchfab.com/models/YOUR_MODEL_UID/embed"
  allow="autoplay; fullscreen"
  frameborder="0"
></iframe>

<script src="https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js"></script>

Then:
const iframe = document.getElementById('api-frame');

const client = new Sketchfab(
  iframe,
  {
    success: function(api) {

      api.start(function() {

        api.addEventListener('viewerready', function() {

          api.getAnnotationList(function(err, annotations) {

            if (err) {
              console.error(err);
              return;
            }

            console.log('ANNOTATIONS:', annotations);

          });

        });

      });

    }
  }
);

Sketchfab officially provides getAnnotationList() specifically for retrieving the current annotation list. Sketchfab
Step 2 — Inspect the result
You'll get annotation objects.
Conceptually you are looking for something like:
[
  {
    index: 0,
    title: "...",
    content: "...",
    position: [...]
  },
  ...
]

The exact returned structure should be inspected in your console rather than assumed.
You can also request an individual annotation:
api.getAnnotation(0, function(err, annotation) {
  console.log(annotation);
});

The API supports getAnnotation(index) for this purpose. Sketchfab
Step 3 — Identify the coronary annotations
This is where your screenshot becomes useful.
You don't need all 17.
You want something like:
Annotation X → LAD region
Annotation Y → LCX region
Annotation Z → RCA region

Potentially a fourth annotation could represent:
Coronary artery origin / left coronary trunk

But don't assign the anatomical meaning based purely on the number.
Look at the annotation's:
title
content
position

and compare its location with the model.
Step 4 — There is an even easier technique
If you don't know which annotation corresponds to which artery, use Sketchfab itself as a coordinate extraction tool.
The Viewer API provides:
api.gotoAnnotation(...)

So you can programmatically jump to every annotation.
For example:
api.gotoAnnotation(
  12,
  {
    preventCameraAnimation: false,
    preventCameraMove: false
  },
  function(err, index) {
    console.log("Selected annotation:", index);
  }
);

The API documents annotation navigation using zero-based indices. Sketchfab
Then you can visually inspect:
Annotation 12
        ↓
Which anatomical structure?
        ↓
LAD / LCX / RCA / something else

But here's the important part for YOUR application
You don't actually need to reproduce the Sketchfab annotation system.
You need:
3D heart
   +
3 coronary artery markers
   +
probability colors

So I'd build a small custom annotation system in R3F.
For example:
             LAD ●
                /
               /
      ┌─────── HEART ───────┐
      │                     │
      │                     │
      └─────────────────────┘
           ● LCX

                ● RCA

These can be rendered with Drei <Html> or 3D sprites/meshes.
Step 5 — Don't manually type arbitrary coordinates
This part of your current code:
const ARTERY_PATHS = {
  LAD: [
    [0.01, 0.04, 0.05],
    [0.005, 0.02, 0.07],
    ...
  ]
}

is currently just an approximate coordinate system.
That's why you don't know where to put the annotations.
Instead, use an interactive coordinate-picking tool.
This is the approach I'd strongly recommend.
Build a temporary "3D coordinate picker"
Add a development mode to your R3F viewer.
When you click the heart:
user clicks heart
       ↓
R3F raycaster
       ↓
intersection.point
       ↓
THREE.Vector3
       ↓
console.log()

You can get the exact position with:
onClick={(event) => {
  event.stopPropagation();

  console.log(
    'Clicked position:',
    event.point.toArray()
  );
}}

For example, you might get:
Clicked position:
[0.0421, -0.0834, 0.0612]

That is vastly better than guessing.
Step 6 — Add a coordinate picker to your model
Temporarily modify your GLTF:
<primitive
  object={scene}
  scale={3}
  onClick={(event) => {

    event.stopPropagation();

    console.log(
      'WORLD POSITION:',
      event.point.x,
      event.point.y,
      event.point.z
    );

  }}
/>

Then:
1. Run your application.
2. Rotate the heart to the desired anatomical view.
3. Click directly on the LAD.
4. Copy the coordinate.
5. Click another point along LAD.
6. Repeat.
For example:
LAD: [
  [x1, y1, z1],
  [x2, y2, z2],
  [x3, y3, z3],
  [x4, y4, z4]
]

Now you're not guessing.
You're sampling the actual GLTF surface.
Step 7 — Do this for all three arteries
For LAD:
●──●──●──●──●

For LCX:
       ●
      /
     ●
      \
       ●──●

For RCA:
●
 \
  ●
   \
    ●──●──●

The number of points doesn't have to be enormous.
Start with:
LAD: 6–10 points
LCX: 5–8 points
RCA: 6–10 points

Then use your Catmull-Rom spline to smooth them.
Your existing implementation already does exactly this:
const vectors = points.map(
  (p) => new THREE.Vector3(p[0], p[1], p[2])
);

return new THREE.CatmullRomCurve3(vectors);

  HeartModel
So the curve-generation part is already good.
The thing that needs improvement is where the points come from.
Step 8 — Very important: account for your scale
You currently have:
<primitive object={scene} scale={3} />

and then:
points.map(([x, y, z]) => [
  x * 3,
  y * 3,
  z * 3
])

  HeartModel
This works because you're manually compensating for the model scale.
But this is unnecessarily fragile.
I recommend instead:
<group scale={3}>
  <primitive object={scene} />

  <CoronaryVessels />
</group>

Then the artery coordinates can remain in the same local coordinate system as the GLTF.
For example:
<group scale={3}>

  <primitive object={scene} />

  <ArteryTube
    points={ARTERY_PATHS.LAD}
  />

  <ArteryTube
    points={ARTERY_PATHS.LCX}
  />

  <ArteryTube
    points={ARTERY_PATHS.RCA}
  />

</group>

Now you don't need:
x * 3
y * 3
z * 3

This will make coordinate calibration much easier.
Step 9 — Make coordinate picking persistent
Once you have the correct points, store them in a file:
src/config/heartCoordinates.js

Example:
export const CORONARY_PATHS = {
  LAD: [
    [0.012, 0.041, 0.053],
    [0.008, 0.018, 0.071],
    [0.002, -0.010, 0.080],
    [-0.005, -0.040, 0.071],
    [-0.010, -0.070, 0.058],
  ],

  LCX: [
    [0.012, 0.041, 0.053],
    [0.030, 0.020, 0.040],
    [0.050, 0.000, 0.020],
    [0.060, -0.020, -0.010],
  ],

  RCA: [
    [-0.030, 0.040, 0.030],
    [-0.050, 0.020, 0.040],
    [-0.070, 0.000, 0.030],
    [-0.080, -0.030, 0.010],
  ],
};

Those numbers are illustrative only — don't use them as anatomical coordinates. Your coordinate picker should generate the real values.
Step 10 — For annotations, use the same coordinate system
Once you have an artery path, you can put an annotation marker at one of its points.
For example:
const ANNOTATIONS = {
  LAD: {
    position: CORONARY_PATHS.LAD[2],
    label: 'LAD'
  },

  LCX: {
    position: CORONARY_PATHS.LCX[2],
    label: 'LCX'
  },

  RCA: {
    position: CORONARY_PATHS.RCA[2],
    label: 'RCA'
  }
};

Then:
<Html position={position}>
  <div className="annotation-marker">
    LAD
  </div>
</Html>

That gives you your own mini Sketchfab-style annotation system.
Even better: make the annotation number itself clickable
You can reproduce the visual idea from Sketchfab:
          ┌───┐
          │ 1 │
          └───┘
             \
              \
               LAD

For example:
<Html position={position} center>
  <button
    onClick={(e) => {
      e.stopPropagation();
      onVesselClick('LAD');
    }}
    className="w-7 h-7 rounded-full border-2 border-white bg-black/70 text-white text-xs"
  >
    1
  </button>
</Html>

Then:
1 → LAD
2 → LCX
3 → RCA

You could even use:
1 = LAD
2 = LCX
3 = RCA
4 = Coronary origin

if you want four annotations.
The really useful trick: click-to-create coordinates
I would actually make a temporary developer tool:
function CoordinatePicker() {

  return (
    <primitive
      object={scene}
      onClick={(e) => {
        e.stopPropagation();

        console.log({
          x: e.point.x,
          y: e.point.y,
          z: e.point.z
        });
      }}
    />
  );
}

Then you can literally click:
             click
               ↓
          ┌─────────┐
          │   LAD   │
          └─────────┘
               ↓
        [x, y, z]

Copy those coordinates into your path.
This turns the task from:
"Where do I find the mysterious 3D coordinates?"

into:
"Click the anatomy and let Three.js tell me the coordinates."

One more important improvement
Your current tube is centered directly on the sampled points.
That means:
heart surface
      ●
      │
      │ tube
      │

But if the tube is exactly on the surface, you'll potentially get z-fighting.
After picking the points, offset them slightly along the surface normal.
Your R3F click event gives you access to the intersection information, including the intersection point and normal.
Conceptually:
const surfacePoint = event.point;
const normal = event.face?.normal;

Then:
const offsetPoint = surfacePoint
  .clone()
  .add(normal.clone().multiplyScalar(0.002));

The exact offset needs to be tuned to your model scale.
This produces:
              coronary overlay
                   ●
                  /
                 /
        ────────●────── heart surface

rather than having the tube buried inside the heart.
So your complete workflow should be
Phase 1 — Use Sketchfab only as the anatomical reference
Sketchfab
   ↓
Identify the correct coronary structures
   ↓
LAD
LCX
RCA

You can use its annotation API to inspect the existing annotations if their locations help. Sketchfab explicitly supports retrieving annotations and their information through its Viewer API. Sketchfab
Phase 2 — Calibrate YOUR GLTF
Your R3F model
      ↓
Coordinate picker
      ↓
click actual LAD
      ↓
[x,y,z]
      ↓
repeat 6–10 times

Phase 3 — Create paths
LAD coordinates → CatmullRomCurve3 → TubeGeometry
LCX coordinates → CatmullRomCurve3 → TubeGeometry
RCA coordinates → CatmullRomCurve3 → TubeGeometry

Phase 4 — Add annotation markers
LAD → marker 1
LCX → marker 2
RCA → marker 3

Phase 5 — Connect prediction
API
 │
 ├── LAD probability ──→ LAD tube color
 ├── LCX probability ──→ LCX tube color
 └── RCA probability ──→ RCA tube color

Your existing probability mechanism already has this final part: vesselProbs[name] is passed into each ArteryTube, and the color is derived from it.