
var socket = io.connect('http://192.168.0.224:5000');
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

        // Directly access min and max values from received data
        let minR1 =device.minR1.toFixed(2);
        let maxR1 =device.maxR1.toFixed(2);

        let minR2 =device.minR2.toFixed(2);
        let maxR2 =device.maxR2.toFixed(2);

        let minR3 =device.minR3.toFixed(2);
        let maxR3 =device.maxR3.toFixed(2);

        let minY1 =device.minY1.toFixed(2);
        let maxY1 =device.maxY1.toFixed(2);
        let minY2 =device.minY2.toFixed(2);
        let maxY2 =device.maxY2.toFixed(2);
        let minY3 =device.minY3.toFixed(2);
        let maxY3 =device.maxY3.toFixed(2);
        let minB1 =device.minB1.toFixed(2);
        let maxB1 =device.maxB1.toFixed(2);
        let minB2 =device.minB2.toFixed(2);
        let maxB2 =device.maxB2.toFixed(2);
        let minB3 =device.minB3.toFixed(2);
        let maxB3 =device.maxB3.toFixed(2);
        

        
        // Selecting HTML elements
        let r1MinElement = document.getElementById(`R1-min-${deviceId}`);
        let r1MaxElement = document.getElementById(`R1-max-${deviceId}`);

        let y1MinElement = document.getElementById(`Y1-min-${deviceId}`);
        let y1MaxElement = document.getElementById(`Y1-max-${deviceId}`);

        let b1MinElement = document.getElementById(`B1-min-${deviceId}`);
        let b1MaxElement = document.getElementById(`B1-max-${deviceId}`);

        let r2MinElement = document.getElementById(`R2-min-${deviceId}`);
        let r2MaxElement = document.getElementById(`R2-max-${deviceId}`);

        let y2MinElement = document.getElementById(`Y2-min-${deviceId}`);
        let y2MaxElement = document.getElementById(`Y2-max-${deviceId}`);

        let b2MinElement = document.getElementById(`B2-min-${deviceId}`);
        let b2MaxElement = document.getElementById(`B2-max-${deviceId}`);

        let r3MinElement = document.getElementById(`R3-min-${deviceId}`);
        let r3MaxElement = document.getElementById(`R3-max-${deviceId}`);

        let y3MinElement = document.getElementById(`Y3-min-${deviceId}`);
        let y3MaxElement = document.getElementById(`Y3-max-${deviceId}`);

        let b3MinElement = document.getElementById(`B3-min-${deviceId}`);
        let b3MaxElement = document.getElementById(`B3-max-${deviceId}`);

        // Updating HTML content
        if (r1MinElement) r1MinElement.innerHTML = `${minR1} <span>°C</span>`;
        if (r1MaxElement) r1MaxElement.innerHTML = `${maxR1} <span>°C</span>`;

        if (r2MinElement) r2MinElement.innerHTML = `${minR2} <span>°C</span>`;
        if (r2MaxElement) r2MaxElement.innerHTML = `${maxR2} <span>°C</span>`;

        if (r3MinElement) r3MinElement.innerHTML = `${minR3} <span>°C</span>`;
        if (r3MaxElement) r3MaxElement.innerHTML = `${maxR3} <span>°C</span>`;

        if (y1MinElement) y1MinElement.innerHTML = `${minY1} <span>°C</span>`;
        if (y1MaxElement) y1MaxElement.innerHTML = `${maxY1} <span>°C</span>`;

        if (y2MinElement) y2MinElement.innerHTML = `${minY2} <span>°C</span>`;
        if (y2MaxElement) y2MaxElement.innerHTML = `${maxY2} <span>°C</span>`;

        if (y3MinElement) y3MinElement.innerHTML = `${minY3} <span>°C</span>`;
        if (y3MaxElement) y3MaxElement.innerHTML = `${maxY3} <span>°C</span>`;

        if (b1MinElement) b1MinElement.innerHTML = `${minB1} <span>°C</span>`;
        if (b1MaxElement) b1MaxElement.innerHTML = `${maxB1} <span>°C</span>`;

        if (b2MinElement) b2MinElement.innerHTML = `${minB2} <span>°C</span>`;
        if (b2MaxElement) b2MaxElement.innerHTML = `${maxB2} <span>°C</span>`;

        if (b3MinElement) b3MinElement.innerHTML = `${minB3} <span>°C</span>`;
        if (b3MaxElement) b3MaxElement.innerHTML = `${maxB3} <span>°C</span>`;
    
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

