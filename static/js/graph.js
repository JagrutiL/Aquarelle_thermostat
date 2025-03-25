
    var socket = io.connect('http://192.168.1.10:5000/');
    socket.on('connect', function() {
        console.log("Connected to server");
    });

    socket.on('update_temperature', function(data) {
        console.log("Received updated data:", data);

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
