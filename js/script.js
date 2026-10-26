AFRAME.registerComponent("log", {
  schema: { type: "string" },

  init: function () {
    var stringToLog = this.data;
    console.log(stringToLog);
  },
});

AFRAME.registerComponent("thumbstick-logging", {
  init: function () {
    this.el.addEventListener("thumbstickmoved", this.logThumbstick);
  },
  logThumbstick: function (evt) {
    if (evt.detail.y > 0.95) {
      console.log("DOWN");
    }
    if (evt.detail.y < -0.95) {
      console.log("UP");
    }
    if (evt.detail.x < -0.95) {
      console.log("LEFT");
    }
    if (evt.detail.x > 0.95) {
      console.log("RIGHT");
    }
  },
});

AFRAME.registerComponent("champion-induction-controller", {
  init: function () {
    this.onTriggerDown = function () {
      var raycaster = this.components.raycaster;
      var target = raycaster && raycaster.intersectedEls[0];
      if (target) {
        target.emit("click");
      }
    };

    this.el.addEventListener("triggerdown", this.onTriggerDown);
  },
  remove: function () {
    this.el.removeEventListener("triggerdown", this.onTriggerDown);
  },
});

AFRAME.registerComponent("champion-reveal", {
  init: function () {
    this.revealed = false;
    this.onClick = this.reveal.bind(this);
    this.onStopAudio = this.stopAudio.bind(this);
    this.el.addEventListener("click", this.onClick);
    document
      .querySelector("#champion-audio-stop")
      .addEventListener("click", this.onStopAudio);
  },
  reveal: function () {
    if (this.revealed) return;
    this.revealed = true;

    var curtain = document.querySelector("#induction-curtain");
    var spotlight = document.querySelector("#champion-spotlight");
    var button = this.el.querySelector(".induction-target");
    var player = document.querySelector("#champion-audio-player");
    var audioFrame = document.querySelector("#champion-audio-iframe");

    curtain.setAttribute("animation__roll", {
      property: "scale",
      from: "1 1 1",
      to: "1 0.001 1",
      dur: 1800,
      easing: "easeInOutCubic",
    });
    curtain.setAttribute("animation__lift", {
      property: "position",
      from: "6 1.475 -14.62",
      to: "6 2.182 -14.62",
      dur: 1800,
      easing: "easeInOutCubic",
    });
    spotlight.setAttribute("light", "intensity", 2.5);

    button.classList.remove("induction-target");
    this.el.setAttribute("animation__vanish", {
      property: "scale",
      from: "1 1 1",
      to: "0.001 0.001 0.001",
      dur: 700,
      easing: "easeInBack",
    });
    this.el.setAttribute("animation__spin", {
      property: "rotation",
      from: "0 0 0",
      to: "0 360 0",
      dur: 700,
      easing: "easeInCubic",
    });
    this.el.setAttribute("animation__drop", {
      property: "position",
      from: "6 0.6 -14.62",
      to: "6 0.25 -14.62",
      dur: 700,
      easing: "easeInCubic",
    });
    this.hideTimeout = window.setTimeout(function () {
      this.el.setAttribute("visible", false);
    }.bind(this), 750);
    audioFrame.src =
      "https://www.youtube-nocookie.com/embed/B_HSa1dEL9s?autoplay=1&controls=1&playsinline=1";
    player.style.display = "block";
    this.launchConfetti();
  },
  stopAudio: function () {
    var audioFrame = document.querySelector("#champion-audio-iframe");
    var player = document.querySelector("#champion-audio-player");

    audioFrame.src = "about:blank";
    player.style.display = "none";
  },
  launchConfetti: function () {
    var scene = this.el.sceneEl;
    var colors = ["#f5d66f", "#d9253f", "#ffffff", "#2b8f72", "#4b73c2"];

    for (var i = 0; i < 60; i++) {
      var piece = document.createElement("a-box");
      var startX = 6 + (Math.random() - 0.5) * 1.2;
      var startY = 2.6 + Math.random() * 0.7;
      var startZ = -13.9 + (Math.random() - 0.5) * 0.4;
      var endX = startX + (Math.random() - 0.5) * 6;
      var endY = 0.25 + Math.random() * 3.2;
      var endZ = startZ + (Math.random() - 0.5) * 4;
      var duration = 1700 + Math.random() * 1300;

      piece.setAttribute("width", 0.06 + Math.random() * 0.08);
      piece.setAttribute("height", 0.06 + Math.random() * 0.08);
      piece.setAttribute("depth", 0.025);
      piece.setAttribute("color", colors[Math.floor(Math.random() * colors.length)]);
      piece.setAttribute("material", "roughness: 0.6");
      piece.setAttribute("position", startX + " " + startY + " " + startZ);
      piece.setAttribute("rotation", "0 0 0");
      piece.setAttribute("animation__burst", {
        property: "position",
        to: endX + " " + endY + " " + endZ,
        dur: duration,
        easing: "easeOutCubic",
      });
      piece.setAttribute("animation__spin", {
        property: "rotation",
        to:
          Math.random() * 720 +
          " " +
          Math.random() * 720 +
          " " +
          Math.random() * 720,
        dur: duration,
      });
      scene.appendChild(piece);
      window.setTimeout(function (confetti) {
        confetti.remove();
      }, duration + 100, piece);
    }
  },
  remove: function () {
    this.el.removeEventListener("click", this.onClick);
    document
      .querySelector("#champion-audio-stop")
      .removeEventListener("click", this.onStopAudio);
    window.clearTimeout(this.hideTimeout);
  },
});

AFRAME.registerComponent("oculus-thumbstick-controls", {
  schema: {
    acceleration: { default: 45 },
    rigSelector: { default: "#rig" },
    fly: { default: false },
    controllerOriented: { default: false },
    adAxis: { default: "x", oneOf: ["x", "y", "z"] },
    wsAxis: { default: "z", oneOf: ["x", "y", "z"] },
    enabled: { default: true },
    adEnabled: { default: true },
    adInverted: { default: false },
    wsEnabled: { default: true },
    wsInverted: { default: false },
  },
  init: function () {
    this.easing = 1.1;
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.tsData = new THREE.Vector2(0, 0);

    this.thumbstickMoved = this.thumbstickMoved.bind(this);
    this.el.addEventListener("thumbstickmoved", this.thumbstickMoved);
  },
  update: function () {
    this.rigElement = document.querySelector(this.data.rigSelector);
  },
  tick: function (time, delta) {
    if (!this.el.sceneEl.is("vr-mode")) return;
    var data = this.data;
    var el = this.rigElement;
    var velocity = this.velocity;
    //console.log("here", this.tsData, this.tsData.length())
    if (
      !velocity[data.adAxis] &&
      !velocity[data.wsAxis] &&
      !this.tsData.length()
    ) {
      return;
    }

    // Update velocity.
    delta = delta / 1000;
    this.updateVelocity(delta);

    if (!velocity[data.adAxis] && !velocity[data.wsAxis]) {
      return;
    }

    // Get movement vector and translate position.
    el.object3D.position.add(this.getMovementVector(delta));
  },
  updateVelocity: function (delta) {
    var acceleration;
    var adAxis;
    var adSign;
    var data = this.data;
    var velocity = this.velocity;
    var wsAxis;
    var wsSign;
    const CLAMP_VELOCITY = 0.00001;

    adAxis = data.adAxis;
    wsAxis = data.wsAxis;

    // If FPS too low, reset velocity.
    if (delta > 0.2) {
      velocity[adAxis] = 0;
      velocity[wsAxis] = 0;
      return;
    }

    // https://gamedev.stackexchange.com/questions/151383/frame-rate-independant-movement-with-acceleration
    var scaledEasing = Math.pow(1 / this.easing, delta * 60);
    // Velocity Easing.
    if (velocity[adAxis] !== 0) {
      velocity[adAxis] = velocity[adAxis] * scaledEasing;
    }
    if (velocity[wsAxis] !== 0) {
      velocity[wsAxis] = velocity[wsAxis] * scaledEasing;
    }

    // Clamp velocity easing.
    if (Math.abs(velocity[adAxis]) < CLAMP_VELOCITY) {
      velocity[adAxis] = 0;
    }
    if (Math.abs(velocity[wsAxis]) < CLAMP_VELOCITY) {
      velocity[wsAxis] = 0;
    }

    if (!data.enabled) {
      return;
    }

    // Update velocity using keys pressed.
    acceleration = data.acceleration;
    if (data.adEnabled && this.tsData.x) {
      adSign = data.adInverted ? -1 : 1;
      velocity[adAxis] += adSign * acceleration * this.tsData.x * delta;
    }
    if (data.wsEnabled) {
      wsSign = data.wsInverted ? -1 : 1;
      velocity[wsAxis] += wsSign * acceleration * this.tsData.y * delta;
    }
  },
  getMovementVector: (function () {
    var directionVector = new THREE.Vector3(0, 0, 0);
    var rotationEuler = new THREE.Euler(0, 0, 0, "YXZ");

    return function (delta) {
      var rotation = this.el.sceneEl.camera.el.object3D.rotation;
      var velocity = this.velocity;
      var xRotation;

      directionVector.copy(velocity);
      directionVector.multiplyScalar(delta);
      // Absolute.
      if (!rotation) {
        return directionVector;
      }
      xRotation = this.data.fly ? rotation.x : 0;

      // Transform direction relative to heading.
      rotationEuler.set(xRotation, rotation.y, 0);
      directionVector.applyEuler(rotationEuler);
      return directionVector;
    };
  })(),
  thumbstickMoved: function (evt) {
    this.tsData.set(evt.detail.x, evt.detail.y);
  },
  remove: function () {
    this.el.removeEventListener("thumbstickmoved", this.thumbstickMoved);
  },
});
