import Database from "./indexedDB.js";
let _circles = {};
let _circlesText = {};
let _ruinNames = undefined;
let _distances = [];
let _direction = [];
let _data = undefined;
let _myPosition = undefined;
let _theta = undefined;
let cnt = 0;
let _degrees;
let _newDegrees;
let _minDistance = Infinity;
let _minDegrees = Infinity;
let _targetRuin = undefined;
let _range = 3000;
let _test = false;
let _album;
let _zoomWeight = 0;

const evCache = [];
let prevDiff = -1;

function registerPinch() {
  const el = document.querySelector("#radar");
  el.onpointerdown = pointerdownHandler;
  el.onpointermove = pointermoveHandler;

  el.onpointerup = pointerupHandler;
  el.onpointercancel = pointerupHandler;
  el.onpointerout = pointerupHandler;
  el.onpointerleave = pointerupHandler;
}

function pointerdownHandler(ev) {
  evCache.push(ev);
}

function pointermoveHandler(ev) {
  const index = evCache.findIndex(
    (cachedEv) => cachedEv.pointerId === ev.pointerId
  );
  evCache[index] = ev;

  if (evCache.length === 2) {
    const curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);
    let weight;

    weight = 10;

    if (prevDiff > 0) {
      if (curDiff > prevDiff) {
        if (_range + _zoomWeight > 41 && _minDistance !== 30)
          _zoomWeight -= weight;
      }
      if (curDiff < prevDiff) {
        _zoomWeight += weight;
      }
    }

    if (isNaN(_range + _zoomWeight)) _zoomWeight = 40;

    prevDiff = curDiff;
  }
}

function pointerupHandler(ev) {
  removeEvent(ev);

  if (evCache.length < 2) {
    prevDiff = -1;
  }
}

function removeEvent(ev) {
  const index = evCache.findIndex(
    (cachedEv) => cachedEv.pointerId === ev.pointerId
  );
  evCache.splice(index, 1);
}

function createDOM(names) {
  let circles = {};

  document.addEventListener("touchmove", disableScroll, {
    passive: false,
  });
  document.addEventListener("mousewheel", disableScroll, {
    passive: false,
  });

  const ul = document.createElement("ul");
  ul.style.display = "flex";
  ul.style.flexWrap = "wrap";
  ul.style.paddingTop = "13vh";
  ul.style.paddingBottom = "5vh";
  ul.style.paddingLeft = "5vw";
  ul.style.paddingRight = "3vw";
  ul.style.gap = "10px";

  names.forEach((name, i) => {
    circles[name] = document.createElement("div");
    circles[name].className = "circle";
    _circlesText[name] = document.createElement("div");
    _circlesText[name].className = "circle__text";
    _circlesText[name].textContent = name;
    _circlesText[name].style.backgroundColor = "transparent";

    circles[name].appendChild(_circlesText[name]);
    document.querySelector(".map__circle").appendChild(circles[name]);

    const img = document.createElement("img");

    if (_album[name]) {
      img.src = _album[name];
      img.alt = name;
    } else {
      img.src = "./question.png";
      img.alt = "???";
    }

    img.style.width = "40vw";
    img.style.height = "auto";
    img.style.display = "block";

    const ruinName = document.createElement("div");
    if (_album[name]) {
      ruinName.textContent = name;
    } else {
      ruinName.textContent = "???";
    }

    ruinName.style.textAlign = "center";
    const li = document.createElement("li");
    li.style.listStyleType = "none";
    li.style.display = "flex";
    li.style.flexDirection = "column";
    li.style.justifyContent = "center";

    li.setAttribute("id", `${name.replace(/\s+/g, "")}Li`);
    li.appendChild(img);
    li.appendChild(ruinName);

    ul.appendChild(li);
    document.querySelector(".album__page").appendChild(ul);
  });

  for (const ruinName in _album) {
    if (!circles[ruinName]) continue;
    circles[ruinName].style.backgroundColor = "gray";
    cnt++;
  }

  return circles;
}

async function getData() {
  const response = await fetch("./data.json");
  const data = await response.json();
  let ruinNames = [];

  for (const d in data) {
    ruinNames = [...ruinNames, d];
  }
  return { data, ruinNames };
}

const options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

function success(pos) {
  const crd = pos.coords;

  console.log("Your current position is:");
  console.log(`Latitude : ${crd.latitude}`);
  console.log(`Longitude: ${crd.longitude}`);
  console.log(`More or less ${crd.accuracy} meters.`);

  let geod = geodesic.Geodesic.WGS84,
    r;

  r = geod.Inverse(
    crd.latitude,
    crd.longitude,
    34.524217250295585,
    135.49084048674342
  );

  _myPosition = {
    latitude: crd.latitude,
    longitude: crd.longitude,
    distance: r.s12,
    azimuth: r.azi1,
    accuracy: crd.accuracy,
    heading: crd.heading,
  };

  if (!_data) return;

  _distances = [];
  _direction = [];

  const preTargetRuin = _targetRuin;
  const rng = _range + _zoomWeight;

  _ruinNames.forEach((name) => {
    r = geod.Inverse(
      _myPosition.latitude,
      _myPosition.longitude,
      _data[name].latitude,
      _data[name].longitude
    );

    const distance = parseFloat(r.s12.toFixed(3));

    const r2 = (distance * (42.5 - 1.5)) / rng;

    _distances = [..._distances, distance];
    _direction = [..._direction, r.azi1];

    if (distance <= 300) {
      if (_circles[name].style.backgroundColor === "gray") {
        _circlesText[name].style.visibility = "visible";
      } else {
        _circlesText[name].style.visibility = "hidden";
      }
    }

    if (_minDistance > distance) {
      if (_circles[name].style.backgroundColor !== "gray") {
        _minDistance = distance;
        _minDegrees = r.azi1;
        _targetRuin = name;
      }
    }

    if (_degrees === undefined) return;
  });

  document.querySelector(".distance").textContent =
    Math.floor(_minDistance) + "m";

  for (const ruinName in _circles) {
    if (_targetRuin === ruinName) {
      _circles[_targetRuin].style.backgroundColor = "blue";
    } else {
      if (_circles[ruinName].style.backgroundColor !== "gray")
        _circles[ruinName].style.backgroundColor = "yellow";
    }
  }

  if (_minDistance <= 3000) {
    _range = 3000;
  }

  if (_minDistance <= 3000 && _minDistance > 300) {
    for (const n in _album) {
      _circlesText[n].style.visibility = "hidden";
    }
  }
  if (_minDistance <= 500) {
    _range = 500;
  }
  if (_minDistance <= 300) {
    _range = 300;
  }
  if (_minDistance <= 100) {
    _range = 100;
  }
  if (_minDistance <= 50) {
    _range = 50;
  }

  if (_minDistance <= 30) {
    if (document.querySelector(".stop").style.visibility !== "visible")
      document.querySelector(".camera").style.visibility = "visible";
  } else {
    document.querySelector(".camera").style.visibility = "hidden";
  }

  // document.querySelector(".camera").style.visibility = "visible";
  // document.querySelector(".stop").style.visibility = "visible";
  // document.querySelector(".exit").style.visibility = "visible";
  // document.querySelector(".exit").style.zIndex = "100000";

  _minDistance = Infinity;

  return;

  // const $compass = document.querySelector("#compass");
  // $compass.textContent = "更新 : " + cnt + " " + _degrees;
  // cnt++;
}

function setupCamera() {
  document.querySelector(".preview").style.zIndex = -100000;
  document.querySelector(".exit").style.zIndex = -100000;
  document.querySelector(".recamera").style.zIndex = -100000;
  document.querySelector(".save").style.zIndex = -100000;

  const medias = {
    audio: false,
    video: {
      width: screen.height,
      height: screen.width,
      facingMode: { exact: "environment" },
    },
  };
  const video = document.getElementById("video");

  // document.querySelector(
  //     ".stop"
  // ).textContent = `${screen.width} x ${screen.height}`;

  video.style.zIndex = 10000;

  const promise = navigator.mediaDevices.getUserMedia(medias);

  promise.then(successCallback).catch(errorCallback);

  let _stream;

  const stopFunction = () => {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    let w = video.offsetWidth;
    let h = video.offsetHeight;
    canvas.setAttribute("width", w);
    canvas.setAttribute("height", h);
    ctx.drawImage(video, 0, 0, w, h);

    const data = canvas.toDataURL("image/jpeg");
    const preview = document.querySelector(".preview");
    preview.style.zIndex = 100000;
    document.querySelector(".save").style.zIndex = 10000000;
    document.querySelector(".exit").style.zIndex = 10000000;
    const reCamera = document.querySelector(".recamera");

    reCamera.style.visibility = "visible";
    reCamera.style.zIndex = "10000000";

    preview.src = data;
    preview.alt = `${_targetRuin}`;

    _stream.getVideoTracks().forEach((track) => {
      track.stop();
    });
    video.style.zIndex = -10000;
    document.querySelector(".stop").style.visibility = "hidden";
    document.querySelector(".stop").removeEventListener("click", stopFunction);
  };

  document.querySelector(".stop").addEventListener("click", stopFunction);

  function successCallback(stream) {
    _stream = stream;
    video.srcObject = stream;
    console.log(video.srcObject);
    document.querySelector(".stop").style.visibility = "visible";
    document.querySelector(".camera").style.visibility = "hidden";
  }

  function errorCallback(err) {
    alert(err);
  }
}

function error(err) {
  console.log("位置情報を正しく取得できませんでした");
}

function disableScroll(event) {
  event.preventDefault();
}

// document.addEventListener("touchmove", disableScroll, { passive: false });

let os;
let db;
// DOM構築完了イベントハンドラ登録
window.addEventListener("DOMContentLoaded", init);

async function init() {
  // indexedDBからデータを取得

  const DB_VERSION = 1;
  const db = new Database({ dbName: "ruinDB", dbVersion: DB_VERSION });
  const data = await db.getData();

  const newData = data.reduce((acc, cur) => {
    acc = { ...acc, [cur.ruinName]: cur.photoSrc };
    return acc;
  }, {});

  _album = newData;

  (async () => {
    navigator.geolocation.watchPosition(success, error, options);

    const { data, ruinNames } = await getData();
    _data = data;
    _ruinNames = ruinNames;
    _circles = createDOM(ruinNames);
  })();

  document.addEventListener(
    "dblclick",
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );

  registerPinch();

  if (!_album) _album = {};

  document.querySelector(".camera").addEventListener("click", setupCamera);

  document.querySelector(".recamera").addEventListener("click", setupCamera);

  document.querySelector(".camera").style.visibility = "hidden";
  document.querySelector(".stop").style.visibility = "hidden";

  // 簡易的なOS判定
  os = detectOSSimply();
  if (os == "iphone") {
    // safari用。DeviceOrientation APIの使用をユーザに許可して貰う
    document
      .querySelector("#permit")
      .addEventListener("click", permitDeviceOrientationForSafari);
    // permitDeviceOrientationForSafari();

    document.querySelector(".exit").addEventListener("click", () => {
      document.querySelector(".save").style.zIndex = -10000000;
      document.querySelector(".exit").style.zIndex = -10000000;
      document.querySelector(".camera").style.visibility = "hidden";
      document.querySelector(".recamera").style.visibility = "hidden";
      document.querySelector(".recamera").style.zIndex = -10000000;

      // document.querySelector(".camera").style.visibility = "visible";

      _circles[_targetRuin].style.backgroundColor = "gray";
      cnt++;

      const preview = document.querySelector(".preview");
      preview.style.zIndex = -100000;

      _album[_targetRuin] = preview.src;
      const item = {
        id: _data[_targetRuin].id,
        ruinName: _targetRuin,
        photoSrc: preview.src,
      };
      db.register(item);
    });

    document.querySelector(".album").addEventListener("click", () => {
      if (document.querySelector(".album").textContent !== "閉じる") {
        document.querySelector(".album__page").style.zIndex = 10000;
        document.querySelector(".album__page").style.transform =
          "translate(0,0)";
        document.querySelector(".album").style.zIndex = 100000;
        document.querySelector(".album__page").style.visibility = "visible";
        document.removeEventListener("touchmove", disableScroll, {
          passive: false,
        });
        document.removeEventListener("mousewheel", disableScroll, {
          passive: false,
        });

        document.querySelector(".album").textContent = "閉じる";

        for (const ruinName in _album) {
          const id = ruinName.replace(/\s+/g, "");
          const img = document.querySelector(`#${id}Li img`);
          const text = document.querySelector(`#${id}Li div`);
          if (img.alt === "???") {
            // console.log(img);
            img.src = _album[ruinName];
            img.alt = ruinName;
            text.textContent = ruinName;
          }
        }
      } else {
        document.querySelector(".album__page").style.zIndex = -10000;
        document.querySelector(".album__page").style.transform =
          "translate(-100%,0)";
        // document.querySelector(".album__page").style.visibility =
        //     "hidden";
        document.querySelector(".album").style.zIndex = 0;

        document.querySelector(".album").textContent = "アルバム";
        // document.querySelector(".album__page").style.visibility =
        // "hidden";
        document.addEventListener("touchmove", disableScroll, {
          passive: false,
        });
        document.addEventListener("mousewheel", disableScroll, {
          passive: false,
        });
      }
    });

    document.querySelector(".reset").addEventListener("click", () => {
      // indexedDBの情報をクリア
    });

    // window.addEventListener("deviceorientation", myOrientation, true);
  } else if (os == "android") {
    // window.addEventListener(
    //     "deviceorientationabsolute",
    //     myOrientation,
    //     true
    // );
  } else {
    window.alert("PC未対応サンプル");
    // document.addEventListener("click", permitDeviceOrientationForSafari);
  }
  if (_test) {
    document.querySelector(".camera").style.visibility = "visible";

    const rng = _range + _zoomWeight;

    setInterval(() => {
      _degrees = 270;
      _distances.forEach((distance, i) => {
        if (rng >= distance) {
          const r2 = (distance * (42.5 - 1.5)) / rng;

          _theta = ((90 + _degrees - _direction[i]) * Math.PI) / 180;
          _circles[_ruinNames[i]].style.transform = `translate(calc(-50% + ${
            r2 * Math.cos(_theta)
          }vw), calc(-50% - ${r2 * Math.sin(_theta)}vw))`;
          _circles[_ruinNames[i]].style.visibility = "visible";
        } else {
          _circles[_ruinNames[i]].style.visibility = "hidden";
        }
      });
    }, 1000);
  }
}

// ジャイロスコープと地磁気をセンサーから取得
function myOrientation(event) {
  let absolute = event.absolute;
  let alpha = event.alpha;
  let beta = event.beta;
  let gamma = event.gamma;

  const rng = _range + _zoomWeight;

  let degrees;
  if (os == "iphone") {
    // webkitCompasssHeading値を採用
    degrees = event.webkitCompassHeading;
    _degrees = degrees;

    if (_distances.length === 0) return;

    if (rng < 30 && !_minDistance !== 30) _zoomWeight = 30;

    const $compass = document.querySelector("#compass");
    $compass.textContent = `発見数: ${cnt} 範囲: ${rng}`;
    // $compass.textContent = `${navigator.userAgent}`;

    _distances.forEach((distance, i) => {
      if (rng >= distance) {
        const r2 = (distance * (42.5 - 1.5)) / rng;

        _theta = ((90 + _degrees - _direction[i]) * Math.PI) / 180;
        _circles[_ruinNames[i]].style.transform = `translate(calc(-50% + ${
          r2 * Math.cos(_theta)
        }vw), calc(-50% - ${r2 * Math.sin(_theta)}vw))`;
        _circles[_ruinNames[i]].style.visibility = "visible";
      } else {
        _circles[_ruinNames[i]].style.visibility = "hidden";
        _circlesText[_ruinNames[i]].style.visibility = "hidden";
      }
    });
  } else {
    // deviceorientationabsoluteイベントのalphaを補正
    degrees = compassHeading(alpha, beta, gamma);
  }

  let direction;
  if ((degrees > 337.5 && degrees < 360) || (degrees > 0 && degrees < 22.5)) {
    direction = "北";
  } else if (degrees > 22.5 && degrees < 67.5) {
    direction = "北東";
  } else if (degrees > 67.5 && degrees < 112.5) {
    direction = "東";
  } else if (degrees > 112.5 && degrees < 157.5) {
    direction = "東南";
  } else if (degrees > 157.5 && degrees < 202.5) {
    direction = "南";
  } else if (degrees > 202.5 && degrees < 247.5) {
    direction = "南西";
  } else if (degrees > 247.5 && degrees < 292.5) {
    direction = "西";
  } else if (degrees > 292.5 && degrees < 337.5) {
    direction = "北西";
  }
}

// 端末の傾き補正（Android用）
// https://www.w3.org/TR/orientation-event/
function compassHeading(alpha, beta, gamma) {
  var degtorad = Math.PI / 180; // Degree-to-Radian conversion

  var _x = beta ? beta * degtorad : 0; // beta value
  var _y = gamma ? gamma * degtorad : 0; // gamma value
  var _z = alpha ? alpha * degtorad : 0; // alpha value

  var cX = Math.cos(_x);
  var cY = Math.cos(_y);
  var cZ = Math.cos(_z);
  var sX = Math.sin(_x);
  var sY = Math.sin(_y);
  var sZ = Math.sin(_z);

  // Calculate Vx and Vy components
  var Vx = -cZ * sY - sZ * sX * cY;
  var Vy = -sZ * sY + cZ * sX * cY;

  // Calculate compass heading
  var compassHeading = Math.atan(Vx / Vy);

  // Convert compass heading to use whole unit circle
  if (Vy < 0) {
    compassHeading += Math.PI;
  } else if (Vx < 0) {
    compassHeading += 2 * Math.PI;
  }

  return compassHeading * (180 / Math.PI); // Compass Heading (in degrees)
}

// 簡易OS判定
function detectOSSimply() {
  let ret;
  if (
    navigator.userAgent.indexOf("iPhone") > 0 ||
    navigator.userAgent.indexOf("iPad") > 0 ||
    navigator.userAgent.indexOf("iPod") > 0
  ) {
    // iPad OS13のsafariはデフォルト「Macintosh」なので別途要対応
    ret = "iphone";
  } else if (navigator.userAgent.indexOf("Android") > 0) {
    ret = "android";
  } else {
    ret = "pc";
  }

  return ret;
}

function permitDeviceOrientationForSafari() {
  document.getElementById("permit").style.visibility = "hidden";
  DeviceOrientationEvent.requestPermission()
    .then((response) => {
      if (response === "granted") {
        window.addEventListener("deviceorientation", myOrientation, true);
      }
    })
    .catch(console.error);
}
