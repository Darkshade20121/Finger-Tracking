import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";
const mpHands = window;
const drawingUtils = window;
const controls = window;
const controls3d = window;

var ctx_ring = document.getElementById('ring')
var test_dot = document.getElementById('test_dot')
ctx_ring.width = "300"

var rect1 = ctx_ring.getBoundingClientRect();
var cx = rect1.left + rect1.width * 0.5;    // find center of first image
var cy = rect1.top + rect1.height * 0.5;

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');

// Usage: testSupport({client?: string, os?: string}[])
// Client and os are regular expressions.
// See: https://cdn.jsdelivr.net/npm/device-detector-js@2.2.10/README.md for
// legal values for client and os
testSupport([
    { client: 'Chrome' },
]);

// Works properly
function update_location(x, y)
{
  // Not sure why the placement needs to add 35 under here
  var tempX = (canvasElement.width * x) - (ctx_ring.width / 2) + 35;
  var tempY = (canvasElement.height * y) - (ctx_ring.height / 2) + 35;

  var s_tempX = parseInt(tempX) + 'px'
  var s_tempY = parseInt(tempY) + 'px'
  ctx_ring.style.left = s_tempX
  ctx_ring.style.top = s_tempY
}

// Doesen't work properly Probably because it rotates ring on different axis then center
function update_rotation(ax, ay, bx, by)
{
  var angleRad = Math.atan((ay-by)/(ax-bx));
  var angleDeg = angleRad * 180 / Math.PI;
  angleDeg = angleDeg+ 90;
  ctx_ring.style.transform = ("rotate(" + angleDeg + "deg )")
}

// Doesen't work properly
function update_size(z)
{
  // var tempZ = -(z)*1500

  var s_tempZ = parseInt(tempZ) + 'px'
  ctx_ring.style.width = s_tempZ
}

// Works properly
function finger(x1, y1, x2, y2)
{
  var k = 1/2;
  var ret_x = x1 + (x2 - x1) * k
  var ret_y = y1 + (y2 - y1) * k
  return [ret_x, ret_y]
}

// Works properly
function distance(x1, y1, x2, y2)
{
  var x_m = x2 - x1
  var y_m = y2 - y1

  var d = Math.sqrt(Math.pow(x_m, 2) + Math.pow(y_m, 2))
  // console.log("d", d)
}

function testSupport(supportedDevices) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);
    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }
    // if (!isSupported) {
        // alert(`This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
            // `is not well supported at this time, continue at your own risk.`);
    // }
}
// Our input frames will come from here.
const config = { locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${mpHands.VERSION}/${file}`;
    } };

// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new controls.FPS();
// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
// const grid = new controls3d.LandmarkGrid(landmarkContainer, {
//     connectionColor: 0xCCCCCC,
//     definedColors: [{ name: 'Left', value: 0xffa500 }, { name: 'Right', value: 0x00ffff }],
//     range: 0.2,
//     fitToGrid: false,
//     labelSuffix: 'm',
//     landmarkSize: 2,
//     numCellsPerAxis: 4,
//     showHidden: false,
//     centered: false,
// });
function onResults(results) {
    // Hide the spinner.
    document.body.classList.add('loaded');
    // Update the frame rate.
    fpsControl.tick();

    // Draw the overlays.
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    if (results.multiHandLandmarks && results.multiHandedness) {
        // ctx_ring.style.visibility = 'visibile'
        // console.log("here")
        if(results.multiHandLandmarks.length == 0){
          ctx_ring.style.visibility = 'hidden'
        }else{
          ctx_ring.style.visibility = 'visible'
          for (let index = 0; index < results.multiHandLandmarks.length; index++) {
              const classification = results.multiHandedness[index];
              const isRightHand = classification.label === 'Right';
              const landmarks = results.multiHandLandmarks[index];

              var cords = finger(landmarks[13].x, landmarks[13].y, landmarks[14].x, landmarks[14].y)
              var cordsMCP = [landmarks[13].x, landmarks[13].y]
              var cordsPIP = [landmarks[14].x, landmarks[14].y]

              //Movement of ring here
              update_location(cords[0], cords[1])
              // update_location(landmarks[13].x, landmarks[13].y)
              update_rotation(cordsMCP[0], cordsMCP[1], cordsPIP[0], cordsPIP[1])
          }
        }
    }
    canvasCtx.restore();
    if (results.multiHandWorldLandmarks) {
        // We only get to call updateLandmarks once, so we need to cook the data to
        // fit. The landmarks just merge, but the connections need to be offset.
        const landmarks = results.multiHandWorldLandmarks.reduce((prev, current) => [...prev, ...current], []);
        const colors = [];
        let connections = [];
        for (let loop = 0; loop < results.multiHandWorldLandmarks.length; ++loop) {
            const offset = loop * mpHands.HAND_CONNECTIONS.length;
            const offsetConnections = mpHands.HAND_CONNECTIONS.map((connection) => [connection[0] + offset, connection[1] + offset]);
            connections = connections.concat(offsetConnections);
            const classification = results.multiHandedness[loop];
            colors.push({
                list: offsetConnections.map((unused, i) => i + offset),
                color: classification.label,
            });
        }
        // grid.updateLandmarks(landmarks, connections, colors);
    }
    else {
        // grid.updateLandmarks([]);
      console.log("Hello")
    }
}
const hands = new mpHands.Hands(config);
hands.onResults(onResults);
// Present a control panel through which the user can manipulate the solution
// options.
new controls
    .ControlPanel(controlsElement, {
    selfieMode: true,
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
})
    .add([
    new controls.StaticText({ title: 'Finger Tracker' }),
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onFrame: async (input, size) => {
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            canvasElement.width = width;
            canvasElement.height = height;
            await hands.send({ image: input });
        },
    }),
    new controls.Slider({
        title: 'Max Number of Hands',
        field: 'maxNumHands',
        range: [1, 4],
        step: 1
    }),
    new controls.Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
    }),
    new controls.Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
    }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);
    hands.setOptions(options);
});
