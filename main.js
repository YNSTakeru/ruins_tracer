let _circles = {};
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

function createDOM(names) {
    let circles = {};
    names.forEach((name, i) => {
        circles[name] = document.createElement("div");
        circles[name].className = "circle";

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

    _ruinNames.forEach((name) => {
        r = geod.Inverse(
            _myPosition.latitude,
            _myPosition.longitude,
            _data[name].latitude,
            _data[name].longitude
        );
        const distance = r.s12.toFixed(3);

        const r2 = (distance * (42.5 - 1.5)) / 5000;

        _distances = [..._distances, r2];
        _direction = [..._direction, r.azi1];

        if (_minDistance > distance) {
            _minDistance = distance;
            _minDegrees = r.azi1;
        }

        document.querySelector(".distance").textContent =
            Math.floor(_minDistance) + "m";

        _minDistance = Infinity;

        if (_degrees === undefined) return;

        // if (_minDistance === distance) {
        //     document.querySelector(
        //         ".dli-arrow-right"
        //     ).style.transform = `translate(-50%, -50%) rotate(${
        //         +_degrees + r.azi1 - 90
        //     }deg)`;
        // }

        if (5000 >= distance) {
            let _theta = ((90 + _degrees - r.azi1) * Math.PI) / 180;
            _circles[name].style.transform = `translate(calc(-50% + ${
                r2 * Math.cos(_theta)
            }vw), calc(-50% - ${r2 * Math.sin(_theta)}vw))`;
            _circles[name].style.visibility = "visible";
        }
    });

    cnt++;

    if (_minDegrees === undefined || _degrees === undefined) {
    }
    return;

    // const $compass = document.querySelector("#compass");
    // $compass.textContent = "更新 : " + cnt + " " + _degrees;
    // cnt++;
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
    // 簡易的なOS判定
    os = detectOSSimply();

    if (os == "iphone") {
        // safari用。DeviceOrientation APIの使用をユーザに許可して貰う
        document
            .querySelector("#permit")
            .addEventListener("click", permitDeviceOrientationForSafari);
        // window.addEventListener("deviceorientation", myOrientation, true);
    } else if (os == "android") {
        window.addEventListener(
            "deviceorientationabsolute",
            myOrientation,
            true
        );
    } else {
        window.alert("PC未対応サンプル");
        document.addEventListener("click", permitDeviceOrientationForSafari);
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

        // if (_distances.length === 0) return;
        // _myPosition.heading = degrees;

        // _distances.forEach((distance, i) => {
        //     if (42.5 - 1.5 >= distance) {
        //         _theta = ((90 + _degrees - _direction[i]) * Math.PI) / 180;
        //         _circles[
        //             _ruinNames[i]
        //         ].style.transform = `translate(calc(-50% + ${
        //             distance * Math.cos(_theta)
        //         }vw), calc(-50% - ${distance * Math.sin(_theta)}vw))`;
        //         _circles[_ruinNames[i]].style.visibility = "visible";
        //     }
        // });

        const $compass = document.querySelector("#compass");
        $compass.textContent = _degrees;
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
