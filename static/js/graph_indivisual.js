var socket = io.connect('http://192.168.1.19:5000');

socket.on('connect', function () {
    console.log("Connected to server");

    let today = new Date();
    let formattedTodayDate = formatDateToYYYYMMDD(today);
});

// Ensure the script runs after the DOM is ready
document.addEventListener("DOMContentLoaded", function () {
    // Get the device_id from the <h5> tag
    const targetDeviceElement = document.querySelector("h5");

    if (!targetDeviceElement) {
        console.error("Device ID element <h5> not found on page.");
        return;
    }

    const targetDeviceId = targetDeviceElement.textContent.trim();
    console.log("Detected device ID:", targetDeviceId);

    socket.on("update_temperature", function (data) {
        console.log("Received updated data:", data);

        // Find data for this device
        const deviceData = data.find(item => item.device_id === targetDeviceId);
        console.log("Filtered device data:", deviceData);

        if (deviceData) {
            const updateValue = (id, value) => {
                const element = document.getElementById(id);
                if (element) {
                    element.innerHTML = `${value}°C`;
                } else {
                    console.warn(`Element with ID ${id} not found.`);
                }
            };

            // Update the values dynamically
            updateValue(`R1-${targetDeviceId}`, deviceData.R1);
            updateValue(`R2-${targetDeviceId}`, deviceData.R2);
            updateValue(`R3-${targetDeviceId}`, deviceData.R3 || 'N/A');
            updateValue(`Y1-${targetDeviceId}`, deviceData.Y1);
            updateValue(`Y2-${targetDeviceId}`, deviceData.Y2 || 'N/A');
            updateValue(`Y3-${targetDeviceId}`, deviceData.Y3 || 'N/A');
            updateValue(`B1-${targetDeviceId}`, deviceData.B1);
            updateValue(`B2-${targetDeviceId}`, deviceData.B2 || 'N/A');
            updateValue(`B3-${targetDeviceId}`, deviceData.B3 || 'N/A');
        } else {
            console.warn(`Device ID ${targetDeviceId} not found in received data.`);
        }
    });














});

