let socket;
const heading = document.getElementById('temperatureHeading');
const select = document.getElementById('controlPanelSelect_temp_r_y_b');

const headingMap = {
    'panel-1': 'Temperature (R1 Y1 B1)',
    'panel-2': 'Temperature (R2 Y2 B2)',
    'panel-3': 'Temperature (R3 Y3 B3)'
};

select.addEventListener('change', function () {
    const selectedValue = select.value;
    heading.textContent = headingMap[selectedValue] || 'Temperature (R Y B)';
});

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

function setupSocketConnection(ip) {
    console.log("Connected to SocketIO server");
    socket = io.connect(ip);

    socket.on('update_temperature', function (data) {
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

            // Find min and max values for R, Y, and B phases
            let minR = Math.min(device.R1, device.R2, device.R3).toFixed(2);
            let maxR = Math.max(device.R1, device.R2, device.R3).toFixed(2);

            let minY = Math.min(device.Y1, device.Y2, device.Y3).toFixed(2);
            let maxY = Math.max(device.Y1, device.Y2, device.Y3).toFixed(2);

            let minB = Math.min(device.B1, device.B2, device.B3).toFixed(2);
            let maxB = Math.max(device.B1, device.B2, device.B3).toFixed(2);
            // Store the averages
            averages[deviceId] = { avgR, avgY, avgB, minR, maxR, minY, maxY, minB, maxB };

            // Update the HTML elements with the calculated averages
            let rElement = document.getElementById(`R-${deviceId}`);
            let yElement = document.getElementById(`Y-${deviceId}`);
            let bElement = document.getElementById(`B-${deviceId}`);

            let rMinElement = document.getElementById(`R-min-${deviceId}`);
            let rMaxElement = document.getElementById(`R-max-${deviceId}`);

            let yMinElement = document.getElementById(`Y-min-${deviceId}`);
            let yMaxElement = document.getElementById(`Y-max-${deviceId}`);

            let bMinElement = document.getElementById(`B-min-${deviceId}`);
            let bMaxElement = document.getElementById(`B-max-${deviceId}`);

            if (rElement) rElement.innerHTML = `${avgR} <span>°C</span>`;
            if (yElement) yElement.innerHTML = `${avgY} <span>°C</span>`;
            if (bElement) bElement.innerHTML = `${avgB} <span>°C</span>`;

            if (rMinElement) rMinElement.innerHTML = `${minR} <span>°C</span>`;
            if (rMaxElement) rMaxElement.innerHTML = `${maxR} <span>°C</span>`;

            if (yMinElement) yMinElement.innerHTML = `${minY} <span>°C</span>`;
            if (yMaxElement) yMaxElement.innerHTML = `${maxY} <span>°C</span>`;

            if (bMinElement) bMinElement.innerHTML = `${minB} <span>°C</span>`;
            if (bMaxElement) bMaxElement.innerHTML = `${maxB} <span>°C</span>`;
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

    socket.on('connect', function () {
        let today = new Date();
        // var selectedDay = document.getElementById('daySelect_running_light_graph').value;
        let formattedTodayDate = formatDateToYYYYMMDD(today);
        emitTemperatureData({
            startDate: formattedTodayDate,
            endDate: formattedTodayDate,
            timeSelect: 'daily',
            controlGraph: 'panel-1'

        });

    });
    socket.on('temperature_graph_data', function (data) {
        if (!data || !Array.isArray(data)) {
            console.error("Received invalid or empty data:", data);
            return; // Stop execution to prevent errors
        }
        console.log('Received temperature data:', data);
        const currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;
        if (currentTimeSelect === 'set-date') {
            const dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
            const startDate = dateRangePicker.selectedDates[0];
            const endDate = dateRangePicker.selectedDates[0];
            if (startDate && endDate) {
                const { labels, temp1, temp2, temp3 } = extractTemperatureData(data);
                updateGraph_temp_r_y_b(labels, temp1, temp2, temp3);
            } else {
                console.error('Start or end date is not selected.');
            }
        } else if (currentTimeSelect === 'daily') {
            const { labels, temp1, temp2, temp3 } = extractTemperatureData(data);
            updateGraph_temp_r_y_b(labels, temp1, temp2, temp3);
        } else {
            console.error('Invalid time selection type.');
        }
    });

}
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
                const endDate_temp_r_y_b = selectedDates[0]; // Same date for both start and end

                // Displaying selected date as both start and end
                document.getElementById('startDateDisplay_temp_r_y_b').innerText = `Start Date: ${formatDate(startDate_temp_r_y_b)}`;
                document.getElementById('endDateDisplay_temp_r_y_b').innerText = `End Date: ${formatDate(endDate_temp_r_y_b)}`;

                // const data = [ /* your data array here */ ];
                // const { labels, temp1, temp2, temp3, xAxisTitle } = generateDateRangeData_temp_r_y_b('set-date', startDate_temp_r_y_b, endDate_temp_r_y_b, data);
            }
        }
    });
});
var ctx_temp_r_y_b = document.getElementById('myChart_temp_r_y_b').getContext('2d');
var chart_temp_r_y_b;

let thresholdValue;

const blueGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
blueGradient.addColorStop(0, '#2959FF');
blueGradient.addColorStop(1, '#9EB3FC');

const redGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
redGradient.addColorStop(0, '#FF5B5B');
redGradient.addColorStop(1, '#FFB2B2');

const yellowGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
yellowGradient.addColorStop(0, '#FFC107');
yellowGradient.addColorStop(1, '#FFE082');

var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function extractTemperatureData(data) {
    const labels = [];
    const temp1 = [];
    const temp2 = [];
    const temp3 = [];
    const allIntervals = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 10) {
            const hourStr = String(hour).padStart(2, '0');
            const minuteStr = String(minute).padStart(2, '0');
            allIntervals.push(`${hourStr}:${minuteStr}`);
        }
    }
    const dataMap = {};
    data.forEach(entry => {
        const { hour, temperature1, temperature2, temperature3 } = entry;
        const timeStr = `${hour}`;
        dataMap[timeStr] = { temperature1, temperature2, temperature3 };
    });

    allIntervals.forEach(interval => {
        labels.push(interval);

        if (dataMap[interval]) {
            const { temperature1, temperature2, temperature3 } = dataMap[interval];
            temp1.push(temperature1 || 0);
            temp2.push(temperature2 || 0);
            temp3.push(temperature3 || 0);
        } else {
            temp1.push(0);
            temp2.push(0);
            temp3.push(0);
        }
    });

    return { labels, temp1, temp2, temp3 };
}

let annotationLine = null;
function updateGraph_temp_r_y_b(labels, temp1, temp2, temp3) {
    const select = document.getElementById('controlPanelSelect_temp_r_y_b').value;

    const panelLabels = {
        'panel-1': ['Temperature 1(R1)', 'Temperature 2(Y1)', 'Temperature 3(B1)'],
        'panel-2': ['Temperature 1(R2)', 'Temperature 2(Y2)', 'Temperature 3(B2)'],
        'panel-3': ['Temperature 1(R3)', 'Temperature 2(Y3)', 'Temperature 3(B3)']
    };
    const defaultLabels = ['Temperature 1(R)', 'Temperature 2(Y)', 'Temperature 3(B)'];

    const [temperatureLabelR, temperatureLabelY, temperatureLabelB] = panelLabels[select] || defaultLabels;
    if (chart_temp_r_y_b) chart_temp_r_y_b.destroy();
    chart_temp_r_y_b = new Chart(ctx_temp_r_y_b, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: temperatureLabelR,
                    data: temp1,
                    backgroundColor: redGradient,
                    borderColor: redGradient,
                    borderWidth: 1
                },
                {
                    label: temperatureLabelY,
                    data: temp2,
                    backgroundColor: yellowGradient,
                    borderColor: yellowGradient,
                    borderWidth: 1
                },
                {
                    label: temperatureLabelB,
                    data: temp3,
                    backgroundColor: blueGradient,
                    borderColor: blueGradient,
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
                        text: 'Hours'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: true
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

document.getElementById('timeframeSelect_temp_r_y_b').addEventListener('change', function () {
    var selectedValue = this.value;
    console.log('Selected timeframe:', selectedValue);
    var dateRangeContainer = document.getElementById('dateRangeContainer_temp_r_y_b');
    var daterange_start = document.getElementById('startDateDisplay_temp_r_y_b');
    var daterange_end = document.getElementById('endDateDisplay_temp_r_y_b');
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

        console.log('Daily selected: Updating graph for today\'s data.');
        let today = new Date();
        // var selectedDay = document.getElementById('daySelect_running_light_graph').value;
        console.log('today', today)
        let formattedTodayDate = formatDateToYYYYMMDD(today);
        emitTemperatureData({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily' });
        updateGraph_temp_r_y_b('daily', formattedTodayDate, formattedTodayDate);

    } else {
        isSetDateActive_temp_r_y_b = false;
        dateRangeContainer.style.display = 'none';
        console.log('Other selection made. No action taken.');
    }
});
document.getElementById('applyDateRange_temp_r_y_b').addEventListener('click', function () {
    if (isSetDateActive_temp_r_y_b) {
        var dateRangeInput = document.getElementById('dateRange_temp_r_y_b').value;
        // console.log('Date Range Input:', dateRangeInput);
        var [startDate, endDate] = dateRangeInput.split(' to ').map(dateStr => {
            var [day, month, year] = dateStr.split('/');
            return new Date(year, month - 1, day);
        });


        // Get the selected day from the dropdown
        // var selectedDay = document.getElementById('daySelect_running_light_graph').value;
        var currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;
        var graphControl = document.getElementById('controlPanelSelect_temp_r_y_b').value;

        if (currentTimeSelect === 'daily') {
            let today = new Date();
            console.log('today', today)
            let formattedTodayDate = formatDateToYYYYMMDD(today);

            emitTemperatureData({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily', controlGraph: graphControl });
            updateGraph_temp_r_y_b('daily', formattedTodayDate, formattedTodayDate);
        } else {
            var dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
            var selectedStartDate = dateRangePicker.selectedDates[0];
            var selectedEndDate = dateRangePicker.selectedDates[0];

            var formattedStartDate = formatDateToYYYYMMDD(selectedStartDate);
            var formattedEndDate = formatDateToYYYYMMDD(selectedEndDate);
            console.log('selectedStartDate_temp_r_y_b', formattedStartDate, formattedEndDate)



            emitTemperatureData({ startDate: formattedStartDate, endDate: formattedEndDate, timeSelect: 'set-date', controlGraph: graphControl });
            updateGraph_temp_r_y_b('set-date', formattedStartDate, formattedEndDate);
        }
        // Update the graph
        updateGraph_temp_r_y_b('set-date', startDate, endDate);
    }
});


document.getElementById('controlPanelSelect_temp_r_y_b').addEventListener('change', function () {
    // let selectedValue = this.value; 
    // console.log("Selected Control Panel:", selectedValue);

    // Get the selected day from the dropdown
    // var selectedDay = document.getElementById('daySelect_running_light_graph').value;
    var currentTimeSelect = document.getElementById('timeframeSelect_temp_r_y_b').value;

    var graphControl = document.getElementById('controlPanelSelect_temp_r_y_b').value;

    if (currentTimeSelect === 'daily') {
        let today = new Date();
        console.log('today', today)
        let formattedTodayDate = formatDateToYYYYMMDD(today);

        emitTemperatureData({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily', controlGraph: graphControl });
        updateGraph_temp_r_y_b('daily', formattedTodayDate, formattedTodayDate);
    } else {
        var dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
        var selectedStartDate = dateRangePicker.selectedDates[0];
        var selectedEndDate = dateRangePicker.selectedDates[0];

        var formattedStartDate = formatDateToYYYYMMDD(selectedStartDate);
        var formattedEndDate = formatDateToYYYYMMDD(selectedEndDate);
        console.log('selectedStartDate_temp_r_y_b', formattedStartDate, formattedEndDate)



        emitTemperatureData({ startDate: formattedStartDate, endDate: formattedEndDate, timeSelect: 'set-date', controlGraph: graphControl });
        updateGraph_temp_r_y_b('set-date', formattedStartDate, formattedEndDate);
    }
});



function emitTemperatureData(data) {
    const finalData = {
        startDate: data.startDate,
        endDate: data.endDate,
        timeSelect: data.timeSelect,
        controlGraph: data.controlGraph
        // selectedDay: data.selectedDay || 'all',
    };

    if (socket) {
        socket.emit('temperature_graph_data', finalData);
    }
}


// Initialize the default graph
updateGraph_temp_r_y_b('daily');

fetchIP()
    .then(ip => setupSocketConnection(ip))
    .catch(error => console.error('Error setting up socket connection:', error));


