// alert close start

document.addEventListener("DOMContentLoaded", function () {
    // Select all close buttons
    const closeButtons = document.querySelectorAll('.temp_alert_box_close');

    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Traverse up to the alert box container and remove it
            const alertBox = this.closest('.temp_r_y_b_alert_box_div');
            if (alertBox) {
                alertBox.remove();
            }
        });
    });
});

// alert close end

// alertclose logic--------start

function deleteAlert(elem) {
    const alertBox = elem.closest('.alert-box');
    const alertMessage = alertBox.getAttribute('data-alert-message');

    fetch('/delete_alert', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // MUST be exactly this
        },
        body: JSON.stringify({ message: alertMessage }) // Convert object to JSON string
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alertBox.remove();
            } else {
                alert("Error deleting alert.");
            }
        })
        .catch(err => {
            console.error("Delete error:", err);
        });
    console.log("Deleting alert with message:", alertMessage);
}












// alertclose logic--------end


const annotationValue = document.getElementById('annotationInput');
const errorMessage_threshold = document.getElementById('errorMessage_threshold');

annotationValue.addEventListener('change', () => {
    let value = parseInt(annotationValue.value, 10);

    if (value > 100) {
        annotationValue.value = 100;
        value = 100;
        errorMessage_threshold.textContent = "Error: The number cannot exceed 100";
    }
    else if (value < 0) {
        annotationValue.value = 0;
        value = 0;
        errorMessage_threshold.textContent = "Error: The number cannot be below 0";
    } else {
        errorMessage_threshold.textContent = "";
    }

    // Send value to Flask backend
    fetch('/publish-threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: value })
    })
        .then(response => response.json())
        .then(data => console.log("Published:", data))
        .catch(error => console.error("Error publishing:", error));
});

let update_temp1;
let update_temp2;
let update_temp3;
let update_temp4;
let index_number = 0;
let change_flag = index_number;

let temp1 = Array(17280).fill(null);
let temp2 = Array(17280).fill(null);
let temp3 = Array(17280).fill(null);
let temp4 = Array(17280).fill(null);


function updateGraph() {
    let today = new Date();
    let formattedTodayDate = formatDateToYYYYMMDD(today);

    emitTemperatureData({
        startDate: formattedTodayDate,
        endDate: formattedTodayDate,
        timeSelect: 'daily'
    });
    updateGraph_temp_r_y_b('daily', formattedTodayDate, formattedTodayDate);
}

let socket;
function fetchIP() {
    return fetch("../static/js/ip.json")
        .then((res) => {
            if (!res.ok) {
                throw new Error('Failed to fetch IP address');
            }
            return res.json();
        })
        .then((data) => data.ip)
        .catch((error) => {
            console.error('Error fetching IP address:', error);
            throw error;
        });
}

let thresholdValue;

function setupSocketConnection(ip) {
    console.log("Connected to SocketIO server");
    socket = io.connect(ip);
    console.log("Socket connection established with IP:", ip);

    socket.on('connect', function () {
        let today = new Date();
        let formattedTodayDate = formatDateToYYYYMMDD(today);
        emitTemperatureData({
            startDate: formattedTodayDate,
            endDate: formattedTodayDate,
            timeSelect: 'daily',
        });
    });
    socket.on('temperature_graph_data', function (data) {
        const currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;
        let labels = generateTimeLabels();

        console.log("received data", data);

        thresholdValue = data.length > 0 ? parseFloat(data[0].threshold) : null;

        // Process data and map it to the correct time intervals
        if (currentTimeSelect === 'set-date') {
            const dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
            const startDate = dateRangePicker.selectedDates[0];
            const endDate = dateRangePicker.selectedDates[0];

            if (startDate && endDate) {

                data.forEach((row) => {
                    // Parse the hour, minute, and second from the row.hour
                    const [hours, minutes, seconds] = row.hour.split(':').map(Number);

                    // Convert time to total seconds
                    const timeInSeconds = hours * 3600 + minutes * 60 + seconds;

                    // Convert seconds to index for 5-second intervals
                    const timeIndex = Math.floor(timeInSeconds / 5); // Index in 5-second intervals

                    if (timeIndex >= 0 && timeIndex < 17280) { // Ensure valid index within 0 to 17,279
                        temp1[timeIndex] = row.temperature1 || null;
                        temp2[timeIndex] = row.temperature2 || null;
                        temp3[timeIndex] = row.temperature3 || null;
                        temp4[timeIndex] = row.temperature4 || null;
                    }
                });

                if (temp1.every(val => val === null) && temp2.every(val => val === null) && temp3.every(val => val === null) && temp4.every(val => val === null)) {

                }
                updateGraph_temp_r_y_b(labels, temp1, temp2, temp3, temp4);
            } else {
                console.error('Start or end date is not selected.');
            }
        } else if (currentTimeSelect === 'daily') {

            data.forEach((row) => {
                // Parse the hour, minute, and second from the row.hour
                const [hours, minutes, seconds] = row.hour.split(':').map(Number);

                // Convert time to total seconds
                const timeInSeconds = hours * 3600 + minutes * 60 + seconds;

                // Convert seconds to index for 5-second intervals
                const timeIndex = Math.floor(timeInSeconds / 5); // Index in 5-second intervals

                if (timeIndex >= 0 && timeIndex < 17280) { // Ensure valid index within 0 to 17,279
                    temp1[timeIndex] = row.temperature1 || null;
                    temp2[timeIndex] = row.temperature2 || null;
                    temp3[timeIndex] = row.temperature3 || null;
                    temp4[timeIndex] = row.temperature4 || null;
                }
            });


            updateGraph_temp_r_y_b(labels, temp1, temp2, temp3, temp4);
        } else {
            console.error('Invalid time selection type.');
        }
    });

    // Generate 24-hour labels with 10-minute intervals
    function generateTimeLabels() {
        const labels = [];

        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute++) {
                for (let second = 0; second < 60; second += 5) { // increments of 5 seconds
                    const hourStr = String(hour).padStart(2, '0');
                    const minuteStr = String(minute).padStart(2, '0');
                    const secondStr = String(second).padStart(2, '0');
                    labels.push(`${hourStr}:${minuteStr}:${secondStr}`);
                }
            }
        }

        return labels;
    }

    function getTimeIndex(time) {
        const [hour, minute] = time.split(':').map(Number);
        const index = hour * 6 + minute / 10;
        return index >= 0 && index < 144 ? index : -1;
    }


    const device_id = 'WTS4ChannelF0BF2B';

    socket.emit('request_latest_temperature', device_id);
    socket.on('latest_temperature_data', function (data) {
        console.log("Latest temperature data:", data);
        if (data.error || !data.device_id) {
            console.log("Error:", data.error || "No data available.");
            let statusElement = document.getElementById("status");
            if (statusElement) statusElement.innerText = "Failed to fetch data or no data available.";
        } else {
            let deviceIdElement = document.getElementById("device-id");
            if (deviceIdElement) deviceIdElement.innerText = data.device_id || "-";

            let temp1Element = document.getElementById("temp1");
            if (temp1Element) temp1Element.innerHTML = data.temp1 ? `${data.temp1} &deg;C` : "-";

            let temp2Element = document.getElementById("temp2");
            if (temp2Element) temp2Element.innerHTML = data.temp2 ? `${data.temp2} &deg;C` : "-";

            let temp3Element = document.getElementById("temp3");
            if (temp3Element) temp3Element.innerHTML = data.temp3 ? `${data.temp3} &deg;C` : "-";

            let temp4Element = document.getElementById("temp4");
            if (temp4Element) temp4Element.innerHTML = data.temp4 ? `${data.temp4} &deg;C` : "-";

            index_number = getIndexFromTimestamp(data.date);
            update_temp1 = data.temp1;
            update_temp2 = data.temp2;
            update_temp3 = data.temp3;
            update_temp4 = data.temp4;

            // If change_flag is equal to index_number, update the temperature arrays at index_number
            if (change_flag !== index_number) {
                // Update the temperature arrays at the specified index_number
                temp1[index_number] = update_temp1;  // Update temp1 at the correct index
                temp2[index_number] = update_temp2;  // Update temp2 at the correct index
                temp3[index_number] = update_temp3;  // Update temp3 at the correct index
                temp4[index_number] = update_temp4;  // Update temp4 at the correct index

                // If the chart already exists, update its data and call update()
                if (chart_temp_r_y_b) {
                    // chart_temp_r_y_b.data.datasets[0].data = temp1;
                    // chart_temp_r_y_b.data.datasets[1].data = temp2;
                    // chart_temp_r_y_b.data.datasets[2].data = temp3;
                    // chart_temp_r_y_b.data.datasets[3].data = temp4;


                    // Call update() to render the chart with the new data
                    if (timeFrameValue !== 'set-date') {
                        chart_temp_r_y_b.update();
                    }
                }
            }

        }
    });
    setInterval(function () {
        socket.emit('request_latest_temperature', device_id);
        console.log("Requested latest temperature data.");
    }, 5000);
}

const getIndexFromTimestamp = (date) => {

    const [hour, minute, second] = date.split(':').map(Number);
    const secondsSinceMidnight = (hour * 3600) + (minute * 60) + second;
    const index = Math.floor(secondsSinceMidnight / 5);

    return (index) // Cap the index at 17279
};

let isSetDateActive_temp_r_y_b = false;
let selectedStartDate_temp_r_y_b, selectedEndDate_temp_r_y_b;

function formatDate(date) {
    const d = new Date(date);
    let month = (d.getMonth() + 1).toString().padStart(2, '0');
    let day = d.getDate().toString().padStart(2, '0');
    let year = d.getFullYear();
    return `${year}-${month}-${day}`;
}

// Function to format date to YYYY-MM-DD 
function formatDateToYYYYMMDD(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
}

document.addEventListener('DOMContentLoaded', function () {
    flatpickr("#dateRange_temp_r_y_b", {
        mode: "single", // single mode
        dateFormat: "d/m/Y",
        onChange: function (selectedDates) {
            if (selectedDates.length === 1) {
                const startDate_temp_r_y_b = selectedDates[0];
                const endDate_temp_r_y_b = selectedDates[0];
                // Displaying selected date as both start and end
                document.getElementById('startDateDisplay_temp_r_y_b').innerText = `Start Date: ${formatDate(startDate_temp_r_y_b)}`;
                document.getElementById('endDateDisplay_temp_r_y_b').innerText = `End Date: ${formatDate(endDate_temp_r_y_b)}`;
            }
        }
    });
});
var ctx_temp_r_y_b = document.getElementById('myChart_temp_r_y_b').getContext('2d');
var chart_temp_r_y_b;

const blueGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
blueGradient.addColorStop(0, '#2959FF');
blueGradient.addColorStop(1, '#9EB3FC');

const redGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
redGradient.addColorStop(0, '#FF5B5B');
redGradient.addColorStop(1, '#FFB2B2');

const yellowGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
yellowGradient.addColorStop(0, '#FFC107');
yellowGradient.addColorStop(1, '#FFE082');

const blackGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
blackGradient.addColorStop(0, '#000000');
blackGradient.addColorStop(1, '#000000');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function extractTemperatureData(data) {
    const labels = [];
    const temp1 = [];
    const temp2 = [];
    const temp3 = [];
    const temp4 = [];
    const allIntervals = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute++) {
            const hourStr = String(hour).padStart(2, '0');
            const minuteStr = String(minute).padStart(2, '0');
            allIntervals.push(`${hourStr}:${minuteStr}`);
        }
    }
    const dataMap = {};
    data.forEach(entry => {
        const { hour, temperature1, temperature2, temperature3, temperature4 } = entry;
        const timeStr = `${hour}`;
        dataMap[timeStr] = { temperature1, temperature2, temperature3, temperature4 };
    });

    allIntervals.forEach(interval => {
        labels.push(interval);

        if (dataMap[interval]) {
            const { temperature1, temperature2, temperature3, temperature4 } = dataMap[interval];
            temp1.push(temperature1 || 0);
            temp2.push(temperature2 || 0);
            temp3.push(temperature3 || 0);
            temp4.push(temperature4 || 0);
        } else {
            temp1.push(0);
            temp2.push(0);
            temp3.push(0);
            temp4.push(0);
        }
    });

    return { labels, temp1, temp2, temp3, temp4 };
}

let annotationLine = null;
function updateGraph_temp_r_y_b(labels, temp1, temp2, temp3, temp4) {
    temp1 = Array.isArray(temp1) ? temp1 : [];
    temp2 = Array.isArray(temp2) ? temp2 : [];
    temp3 = Array.isArray(temp3) ? temp3 : [];
    temp4 = Array.isArray(temp4) ? temp4 : [];

    labels = Array.isArray(labels) ? labels : [];

    if (chart_temp_r_y_b) chart_temp_r_y_b.destroy();

    const isTemperatureDataEmpty = temp1.length === 0 && temp2.length === 0 && temp3.length === 0 && temp4.length === 0;

    if (temp1.length !== labels.length) temp1 = new Array(labels.length).fill(0);
    if (temp2.length !== labels.length) temp2 = new Array(labels.length).fill(0);
    if (temp3.length !== labels.length) temp3 = new Array(labels.length).fill(0);
    if (temp4.length !== labels.length) temp4 = new Array(labels.length).fill(0);

    // If want to make the null values or undefined values with 0
    // temp1 = temp1.map(v => v == null ? 0 : v);
    // temp2 = temp2.map(v => v == null ? 0 : v);
    // temp3 = temp3.map(v => v == null ? 0 : v);
    // temp4 = temp4.map(v => v == null ? 0 : v);

    // Current time
    const currentTime = new Date();
    const hours = currentTime.getHours();

    // var min = `${hours}:00`;
    // var max = `${(hours + 1)}:00`;

    var min = `${String(hours).padStart(2, '0')}:00:00`;
    var max = `${String((hours + 1) % 24).padStart(2, '0')}:00:00`;

    // const minutes = currentTime.getMinutes();

    // // Format the current time in HH:mm:00 format for min
    // const min = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

    // // Calculate the next minute, considering rollover at the end of the hour
    // const nextMinute = (minutes + 1) % 60;
    // const max = `${String(hours).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}:00`;


    chart_temp_r_y_b = new Chart(ctx_temp_r_y_b, {
        type: 'line',
        data: {
            labels: labels,
            datasets: isTemperatureDataEmpty
                ? [

                ]
                : [
                    {
                        label: 'Temperature 1 (R)',
                        data: temp1,
                        backgroundColor: redGradient,
                        borderColor: redGradient,
                        borderWidth: 1
                    },
                    {
                        label: 'Temperature 2 (Y)',
                        data: temp2,
                        backgroundColor: yellowGradient,
                        borderColor: yellowGradient,
                        borderWidth: 1
                    },
                    {
                        label: 'Temperature 3 (B)',
                        data: temp3,
                        backgroundColor: blueGradient,
                        borderColor: blueGradient,
                        borderWidth: 1
                    },
                    {
                        label: 'Temperature 4 (N)',
                        data: temp4,
                        backgroundColor: blackGradient,
                        borderColor: blackGradient,
                        borderWidth: 1
                    }
                ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    },
                    min: min,
                    max: max
                },
                y: {
                    title: {
                        display: true,
                        text: `Temperature (°C)`
                    },
                    beginAtZero: true,
                    min: 0,
                }
            },
            plugins: {
                legend: {
                    display: true,
                },
                annotation: {
                    annotations: thresholdValue ? [{
                        id: 'threshold',
                        type: 'line',
                        yMin: thresholdValue,
                        yMax: thresholdValue,
                        borderColor: '#D3D0C9', 
                        borderWidth: 5,
                        // borderDash: [2, 6], 
                        borderDashOffset: 0, 
                        label: {
                            display: false 
                        }
                    }] : []
                }
                ,
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: "xy"
                    }
                }
            }
        }
    });
}

// Handle the annotation input
document.getElementById('applyAnnotation').addEventListener('click', function () {
    var annotationValue = parseFloat(document.getElementById('annotationInput').value);

    if (!isNaN(annotationValue)) {
        // Create or update the annotation line
        const newAnnotation = {
            type: 'line',
            yMin: annotationValue,
            yMax: annotationValue,
            borderColor: '#D3D0C9',
            borderWidth: 4,
            label: {
                content: `Y = ${annotationValue}`,
                enabled: true,
                position: 'center'
            }
        };
        chart_temp_r_y_b.options.plugins.annotation.annotations = [newAnnotation];

        chart_temp_r_y_b.update();
    }
});


var timeFrameValue;

document.getElementById('timeframeSelect_temp_r_y_b').addEventListener('change', function () {
    var selectedValue = this.value;
    timeFrameValue = selectedValue;
    var dateRangeContainer = document.getElementById('dateRangeContainer_temp_r_y_b');
    var daterange_start = document.getElementById('startDateDisplay_temp_r_y_b');
    var daterange_end = document.getElementById('endDateDisplay_temp_r_y_b');

    temp1 = Array(17280).fill(null);
    temp2 = Array(17280).fill(null);
    temp3 = Array(17280).fill(null);
    temp4 = Array(17280).fill(null);

    if (selectedValue === 'set-date') {
        isSetDateActive_temp_r_y_b = true;
        dateRangeContainer.style.display = 'block';
        daterange_start.style.display = 'block';
        daterange_end.style.display = 'block';
    } else if (selectedValue === 'daily') {
        isSetDateActive_temp_r_y_b = false;
        dateRangeContainer.style.display = 'none';
        daterange_start.style.display = 'none';
        daterange_end.style.display = 'none';

        let today = new Date();
        let formattedTodayDate = formatDateToYYYYMMDD(today);
        emitTemperatureData({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily' });
        updateGraph_temp_r_y_b('daily', formattedTodayDate, formattedTodayDate);

    } else {
        isSetDateActive_temp_r_y_b = false;
        dateRangeContainer.style.display = 'none';
    }
});
document.getElementById('applyDateRange_temp_r_y_b').addEventListener('click', function () {
    if (isSetDateActive_temp_r_y_b) {
        var dateRangeInput = document.getElementById('dateRange_temp_r_y_b').value;
        var [startDate, endDate] = dateRangeInput.split(' to ').map(dateStr => {
            var [day, month, year] = dateStr.split('/');
            return new Date(year, month - 1, day);
        });
        var currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;

        if (currentTimeSelect === 'daily') {
            let today = new Date();
            let formattedTodayDate = formatDateToYYYYMMDD(today);

            emitTemperatureData({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily' });
            updateGraph_temp_r_y_b('daily', formattedTodayDate, formattedTodayDate);
        } else {
            var dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
            var selectedStartDate = dateRangePicker.selectedDates[0];
            var selectedEndDate = dateRangePicker.selectedDates[0];

            var formattedStartDate = formatDateToYYYYMMDD(selectedStartDate);
            var formattedEndDate = formatDateToYYYYMMDD(selectedEndDate);

            emitTemperatureData({ startDate: formattedStartDate, endDate: formattedEndDate, timeSelect: 'set-date' });
            updateGraph_temp_r_y_b('set-date', formattedStartDate, formattedEndDate);
        }
        updateGraph_temp_r_y_b('set-date', startDate, endDate);
    }
});
function emitTemperatureData(data) {
    const finalData = {
        startDate: data.startDate,
        endDate: data.endDate,
        timeSelect: data.timeSelect,
    };

    if (socket) {
        socket.emit('temperature_graph_data', finalData);
    }
}


const timeframeSelect = document.getElementById('timeframeSelect_temp_r_y_b');
const annotationDiv = document.querySelector('.temp_annotation_div');

// Function to toggle visibility based on selection
function toggleAnnotationDiv() {
    if (timeframeSelect.value === 'daily') {
        annotationDiv.style.display = 'block'; // Show for "Today"
    } else {
        annotationDiv.style.display = 'none'; // Hide for "Set Date"
    }
}

// Attach change event to dropdown
timeframeSelect.addEventListener('change', toggleAnnotationDiv);

// Initialize the visibility on page load
toggleAnnotationDiv();

// Initialize the default graph
updateGraph_temp_r_y_b('daily');

fetchIP()
    .then(ip => setupSocketConnection(ip))
    .catch(error => console.error('Error setting up socket connection:', error));
