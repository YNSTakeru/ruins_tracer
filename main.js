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

function createDOM(names) {
    let circles = {};
    names.forEach((name, i) => {
        circles[name] = document.createElement("div");
        circles[name].className = "circle";
        _circlesText[name] = document.createElement("div");
        _circlesText[name].className = "circle__text";
        _circlesText[name].textContent = name;

        circles[name].appendChild(_circlesText[name]);
        document.querySelector(".map__circle").appendChild(circles[name]);
    });

    return circles;
}

async function getData() {
    const response = await fetch("./data.json");
    const data = await response.json();
    let ruinNames = [];

    for (d in data) {
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

    // console.log("The distance is " + r.s12.toFixed(3) / 1000 + " km.");
    // console.log("方位角" + r.azi1);

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

    _ruinNames.forEach((name) => {
        r = geod.Inverse(
            _myPosition.latitude,
            _myPosition.longitude,
            _data[name].latitude,
            _data[name].longitude
        );

        const distance = parseFloat(r.s12.toFixed(3));

        const r2 = (distance * (42.5 - 1.5)) / _range;

        _distances = [..._distances, distance];
        _direction = [..._direction, r.azi1];

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

    for (ruinName in _circles) {
        if (_targetRuin === ruinName) {
            _circles[_targetRuin].style.backgroundColor = "blue";
        } else {
            if (_circles[ruinName].style.backgroundColor !== "gray")
                _circles[ruinName].style.backgroundColor = "yellow";
        }
    }

    if (_minDistance <= 3000) {
        for (ruinName in _circlesText) {
            _circlesText[ruinName].style.visibility = "hidden";
        }
        _range = 3000;
    }
    if (_minDistance <= 500) {
        _range = 500;
    }
    if (_minDistance <= 300) {
        for (ruinName in _circlesText) {
            if (_circles[ruinName].style.backgroundColor === "gray")
                _circlesText[ruinName].style.visibility = "visible";
        }
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

    _minDistance = Infinity;

    return;

    // const $compass = document.querySelector("#compass");
    // $compass.textContent = "更新 : " + cnt + " " + _degrees;
    // cnt++;
}

function setupCamera() {
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

    function successCallback(stream) {
        video.srcObject = stream;
        console.log(video.srcObject);
        document.querySelector(".stop").style.visibility = "visible";
        document.querySelector(".camera").style.visibility = "hidden";

        document.querySelector(".stop").addEventListener("click", () => {
            _circles[_targetRuin].style.backgroundColor = "gray";
            cnt++;
            stream.getVideoTracks().forEach((track) => {
                track.stop();
            });
            video.style.zIndex = -10000;
            document.querySelector(".stop").style.visibility = "hidden";
        });
    }

    function errorCallback(err) {
        alert(err);
    }
}

function error(err) {
    console.log("位置情報を正しく取得できませんでした");
}

(async () => {
    navigator.geolocation.watchPosition(success, error, options);

    const { data, ruinNames } = await getData();
    _data = data;
    _ruinNames = ruinNames;
    _circles = createDOM(ruinNames);
})();

function disableScroll(event) {
    event.preventDefault();
}

document.addEventListener("touchmove", disableScroll, { passive: false });

let os;

// DOM構築完了イベントハンドラ登録
window.addEventListener("DOMContentLoaded", init);

function init() {
    document.querySelector(".camera").addEventListener("click", setupCamera);
    document.querySelector(".camera").style.visibility = "hidden";
    document.querySelector(".stop").style.visibility = "hidden";

    // 簡易的なOS判定
    os = detectOSSimply();
    if (os == "iphone") {
        // safari用。DeviceOrientation APIの使用をユーザに許可して貰う
        document
            .querySelector("#permit")
            .addEventListener("click", permitDeviceOrientationForSafari);
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

        setInterval(() => {
            _degrees = 270;
            _distances.forEach((distance, i) => {
                if (_range >= distance) {
                    const r2 = (distance * (42.5 - 1.5)) / _range;

                    _theta = ((90 + _degrees - _direction[i]) * Math.PI) / 180;
                    _circles[
                        _ruinNames[i]
                    ].style.transform = `translate(calc(-50% + ${
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

    let degrees;
    if (os == "iphone") {
        // webkitCompasssHeading値を採用
        degrees = event.webkitCompassHeading;
        _degrees = degrees;

        if (_distances.length === 0) return;

        const $compass = document.querySelector("#compass");
        $compass.textContent = `発見数: ${cnt} 範囲: ${_range}`;
        // $compass.textContent = `${navigator.userAgent}`;

        _distances.forEach((distance, i) => {
            if (_range >= distance) {
                const r2 = (distance * (42.5 - 1.5)) / _range;

                _theta = ((90 + _degrees - _direction[i]) * Math.PI) / 180;
                _circles[
                    _ruinNames[i]
                ].style.transform = `translate(calc(-50% + ${
                    r2 * Math.cos(_theta)
                }vw), calc(-50% - ${r2 * Math.sin(_theta)}vw))`;
                _circles[_ruinNames[i]].style.visibility = "visible";
            } else {
                _circles[_ruinNames[i]].style.visibility = "hidden";
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
    DeviceOrientationEvent.requestPermission()
        .then((response) => {
            if (response === "granted") {
                window.addEventListener(
                    "deviceorientation",
                    myOrientation,
                    true
                );
            }
        })
        .catch(console.error);
}
