
var socket = io.connect('http://192.168.1.10:5000');
socket.on('connect', function () {
    console.log("Connected to server");
});

socket.on('update_temperature', function (data) {
    console.log("Received updated data:", data);

    // Create an object to store averages per device
    let averages = {};

    data.forEach(device => {
        let deviceId = device.device_id;
        console.log('deviceid:', deviceId);

        // Find min and max values for R, Y, and B phases
        let minR = Math.min(device.R1).toFixed(2);
        console.log('minR:', minR);
        let maxR = Math.max(device.R1).toFixed(2);
        console.log('maxR:', maxR);

        let minY = Math.min(device.Y1).toFixed(2);
        let maxY = Math.max(device.Y1).toFixed(2);

        let minB = Math.min(device.B1, device.B2, device.B3).toFixed(2);
        let maxB = Math.max(device.B1, device.B2, device.B3).toFixed(2);

        let rMinElement = document.getElementById(`R1-min-${deviceId}`);
        let rMaxElement = document.getElementById(`R1-max-${deviceId}`);

        let yMinElement = document.getElementById(`Y1-min-${deviceId}`);
        let yMaxElement = document.getElementById(`Y1-max-${deviceId}`);

        let bMinElement = document.getElementById(`B-min-${deviceId}`);
        let bMaxElement = document.getElementById(`B-max-${deviceId}`);


        if (rMinElement) rMinElement.innerHTML = `${minR} <span>°C</span>`;
        if (rMaxElement) rMaxElement.innerHTML = `${maxR} <span>°C</span>`;

        if (yMinElement) yMinElement.innerHTML = `${minY} <span>°C</span>`;
        if (yMaxElement) yMaxElement.innerHTML = `${maxY} <span>°C</span>`;

        if (bMinElement) bMinElement.innerHTML = `${minB} <span>°C</span>`;
        if (bMaxElement) bMaxElement.innerHTML = `${maxB} <span>°C</span>`;
    });

    console.log("Averges per device:", averages);

    data.forEach(device => {
        document.getElementById(`R1-${device.device_id}`).innerText = device.R1 + "°C";
        document.getElementById(`Y1-${device.device_id}`).innerText = device.Y1 + "°C";
        document.getElementById(`B1-${device.device_id}`).innerText = device.B1 + "°C";
        document.getElementById(`R2-${device.device_id}`).innerText = device.R2 + "°C";
        document.getElementById(`Y2-${device.device_id}`).innerText = device.Y2 + "°C";
        document.getElementById(`B2-${device.device_id}`).innerText = device.B2 + "°C";
        document.getElementById(`R3-${device.device_id}`).innerText = device.R3 + "°C";
        document.getElementById(`Y3-${device.device_id}`).innerText = device.Y3 + "°C";
        document.getElementById(`B3-${device.device_id}`).innerText = device.B3 + "°C";
    });
});

