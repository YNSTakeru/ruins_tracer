let _circles = {};
let _ruinNames = [];
let _data = undefined;
let _myPosition = undefined;
let _theta = undefined;

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

    const $compass = document.getElementById("compass");
    $compass.textContent = _myPosition.heading;

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

        if (distance <= 5000) {
            if (_myPosition.heading)
                _theta = ((90 - _myPosition.heading - r.azi1) * Math.PI) / 180;
            if (!_theta) return;

            _circles[name].style.transform = `translate(calc(-50% + ${
                r2 * Math.cos(_theta)
            }vw), calc(-50% - ${r2 * Math.sin(_theta)}vw))`;
            _circles[name].style.visibility = "visible";
        }
    });
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

    if (_myPosition) {
        let geod = geodesic.Geodesic.WGS84,
            r;

        let theta;

        _ruinNames.forEach((name) => {
            r = geod.Inverse(
                _myPosition.latitude,
                _myPosition.longitude,
                _data[name].latitude,
                _data[name].longitude
            );
            const distance = r.s12.toFixed(3);
            const r2 = (distance * (42.5 - 1.5)) / 5000;

            if (distance <= 5000) {
                if (_myPosition.heading)
                    theta =
                        ((90 - _myPosition.heading - r.azi1) * Math.PI) / 180;
                _circles[name].style.transform = `translate(calc(-50% + ${
                    r2 * Math.cos(theta)
                }vw), calc(-50% - ${r2 * Math.sin(theta)}vw))`;
                _circles[name].style.visibility = "visible";
            }
        });
    }
})();

function disableScroll(event) {
    event.preventDefault();
}

document.addEventListener("touchmove", disableScroll, { passive: false });
