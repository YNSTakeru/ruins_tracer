let _circles = {};
let _ruinNames = [];
let _data = {};
let _myPosition = undefined;
let _updateCount = 0;

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
    };

    _updateCount = (_updateCount + 1) % 10;

    // _ruinNames.forEach((name) => {
    //     r = geod.Inverse(
    //         crd.latitude,
    //         crd.longitude,
    //         _data[name].latitude,
    //         _data[name].longitude
    //     );
    //     console.log(
    //         name + "The distance is " + r.s12.toFixed(3) / 1000 + " km."
    //     );

    //     console.log("方位角" + r.azi1);
    // });
}

function error(err) {
    console.log("位置情報を正しく取得できませんでした");
}

(async () => {
    navigator.geolocation.getCurrentPosition(success, error, options);

    const { data, ruinNames } = await getData();
    _data = data;
    _ruinNames = ruinNames;
    _circles = createDOM(ruinNames);
    let preUpdateCount = 1;

    setInterval(() => {
        if (_myPosition && preUpdateCount === _updateCount) {
            preUpdateCount = (preUpdateCount + 1) % 10;

            let geod = geodesic.Geodesic.WGS84,
                r;

            _ruinNames.forEach((name) => {
                r = geod.Inverse(
                    _myPosition.latitude,
                    _myPosition.longitude,
                    _data[name].latitude,
                    _data[name].longitude
                );
                const distance = r.s12.toFixed(3);
                const r2 = (distance * (42.5 - 1.5)) / 5000;
                const theta = ((90 - r.azi1) * Math.PI) / 180;

                if (distance <= 5000) {
                    _circles[name].style.transform = `translate(calc(-50% + ${
                        r2 * Math.cos(theta)
                    }vw), calc(-50% - ${r2 * Math.sin(theta)}vw))`;
                }
            });

            navigator.geolocation.getCurrentPosition(success, error, options);
        }
    }, 1000);
})();

if (DeviceOrientationEvent in window) {
    window.addEventListener("deviceorientation", function (event) {
        let flg = true;

        if (!flg) {
            return;
        }
        console.log("方角       : " + event.alpha);
        console.log("上下の傾き : " + event.beta);
        console.log("左右の傾き : " + event.gamma);

        console.log("コンパスの向き : " + event.webkitCompassHeading);
        console.log("コンパスの精度 : " + event.webkitCompassAccuracy);
        flg = false;
    });
}
