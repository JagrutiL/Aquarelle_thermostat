
    var socket = io.connect('http://192.168.1.10:5000');
    socket.on('connect', function() {
        console.log("Connected to server");
    });

    socket.on('update_temperature', function(data) {
        console.log("Received updated data:", data);

           // Create an object to store averages per device
    let averages = {};

    data.forEach(device => {
        let deviceId = device.device_id;
        console.log('deviceid:', deviceId);
        // Calculate averages for R, Y, and B phases
        let avgR = ((device.R1 + device.R2 + device.R3) / 3).toFixed(2);
        let avgY = ((device.Y1 + device.Y2 + device.Y3) / 3).toFixed(2);
        let avgB = ((device.B1 + device.B2 + device.B3) / 3).toFixed(2);
       // Store the averages
    averages[deviceId] = { avgR, avgY, avgB };

    // Update the HTML elements with the calculated averages
    let rElement = document.getElementById(`R-${deviceId}`);
    let yElement = document.getElementById(`Y-${deviceId}`);
    let bElement = document.getElementById(`B-${deviceId}`);

    if (rElement) rElement.innerHTML = `${avgR} <span>°C</span>`;
    if (yElement) yElement.innerHTML = `${avgY} <span>°C</span>`;
    if (bElement) bElement.innerHTML = `${avgB} <span>°C</span>`;
    });

    console.log("Averges per device:", averages);

    //     data.forEach(device => {
    //         document.getElementById(`R1-${device.device_id}`).innerText = device.R1 + "°C";
    //         document.getElementById(`Y1-${device.device_id}`).innerText = device.Y1 + "°C";
    //         document.getElementById(`B1-${device.device_id}`).innerText = device.B1 + "°C";
    //         document.getElementById(`R2-${device.device_id}`).innerText = device.R2 + "°C";
    //         document.getElementById(`Y2-${device.device_id}`).innerText = device.Y2 + "°C";
    //         document.getElementById(`B2-${device.device_id}`).innerText = device.B2 + "°C";
    //         document.getElementById(`R3-${device.device_id}`).innerText = device.R3 + "°C";
    //         document.getElementById(`Y3-${device.device_id}`).innerText = device.Y3 + "°C";
    //         document.getElementById(`B3-${device.device_id}`).innerText = device.B3 + "°C";
    //     });

    // });    
        data.forEach(device => {
            let ids = [`R1`, `Y1`, `B1`, `R2`, `Y2`, `B2`, `R3`, `Y3`, `B3`];
    
            ids.forEach(phase => {
                let element = document.getElementById(`${phase}-${device.device_id}`);
                if (element) {
                    element.innerText = device[phase] + "°C";
                } else {
                    // console.warn(`Element not found: ${phase}-${device.device_id}`);
                }
            });
        });
    });    
    
