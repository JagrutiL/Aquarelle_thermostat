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

function setupSocketConnection(ip) {
    console.log("Connected to SocketIO server");
    socket = io.connect(ip);

    socket.on('connect', function () {
        let today = new Date();
        // var selectedDay = document.getElementById('daySelect_running_light_graph').value;
        let formattedTodayDate = formatDateToYYYYMMDD(today);
        emitTemperatureData({
            startDate: formattedTodayDate,
            endDate: formattedTodayDate,
            timeSelect: 'daily',
            // selectedDay: selectedDay
        });
        // socket.emit('temperature_graph_data');
    });
    socket.on('temperature_graph_data', function (data) {
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

    const device_id = '3pTempF0BF17';

    socket.emit('request_latest_temperature', device_id);
    socket.on('latest_temperature_data', function (data) {
        if (data.error || !data.device_id) {
            console.log("Error:", data.error || "No data available.");
            let statusElement = document.getElementById("status");
            if (statusElement) statusElement.innerText = "Failed to fetch data or no data available.";
        } else {
            let deviceIdElement = document.getElementById("device-id");
            if (deviceIdElement) deviceIdElement.innerText = data.device_id || "-";

            let temp1Element = document.getElementById("temp1");
            if (temp1Element) temp1Element.innerText = data.temp1 ? `${data.temp1} °C` : "-";

            let temp2Element = document.getElementById("temp2");
            if (temp2Element) temp2Element.innerText = data.temp2 ? `${data.temp2} °C` : "-";

            let temp3Element = document.getElementById("temp3");
            if (temp3Element) temp3Element.innerText = data.temp3 ? `${data.temp3} °C` : "-";
        }
    });
    setInterval(function () {
        socket.emit('request_latest_temperature', device_id);
        console.log("Requested latest temperature data.");
    }, 60000);
}
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
    const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    let temp1 = Array(24).fill();
    let temp2 = Array(24).fill();
    let temp3 = Array(24).fill();


    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 10) {
            const labels = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        }
    }

    data.forEach(entry => {
        const hour = parseInt(entry.hour, 10);
        if (hour >= 0 && hour < 24) {

            temp1[hour] = entry.temperature1;
            temp2[hour] = entry.temperature2;
            temp3[hour] = entry.temperature3;
        }
    });

    return { labels, temp1, temp2, temp3 };
}
let annotationLine = null;
function updateGraph_temp_r_y_b(labels, temp1, temp2, temp3) {
    if (chart_temp_r_y_b) chart_temp_r_y_b.destroy();
    chart_temp_r_y_b = new Chart(ctx_temp_r_y_b, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature 1(R)',
                    data: temp1,
                    backgroundColor: redGradient,
                    borderColor: redGradient,
                    borderWidth: 1
                },
                {
                    label: 'Temperature 2(Y)',
                    data: temp2,
                    backgroundColor: yellowGradient,
                    borderColor: yellowGradient,
                    borderWidth: 1
                },
                {
                    label: 'Temperature 3(B)',
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
                    annotations: annotationLine ? [annotationLine] : []
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
        annotationLine = {
            type: 'line',
            yMin: annotationValue,
            yMax: annotationValue,
            borderColor: '#A9A9A9',
            borderWidth: 4,
            label: {
                content: `Y = ${annotationValue}`,
                enabled: true,
                position: 'center'
            }
        };
        // Update the chart to include the new annotation
        updateGraph_temp_r_y_b('set-date', selectedStartDate_temp_r_y_b, selectedEndDate_temp_r_y_b);
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

        if (currentTimeSelect === 'daily') {
            let today = new Date();
            console.log('today', today)
            let formattedTodayDate = formatDateToYYYYMMDD(today);

            emitTemperatureData({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily' });
            updateGraph_temp_r_y_b('daily', formattedTodayDate, formattedTodayDate);
        } else {
            var dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
            var selectedStartDate = dateRangePicker.selectedDates[0];
            var selectedEndDate = dateRangePicker.selectedDates[0];

            var formattedStartDate = formatDateToYYYYMMDD(selectedStartDate);
            var formattedEndDate = formatDateToYYYYMMDD(selectedEndDate);
            console.log('selectedStartDate_temp_r_y_b', formattedStartDate, formattedEndDate)



            emitTemperatureData({ startDate: formattedStartDate, endDate: formattedEndDate, timeSelect: 'set-date' });
            updateGraph_temp_r_y_b('set-date', formattedStartDate, formattedEndDate);
        }
        // Update the graph
        updateGraph_temp_r_y_b('set-date', startDate, endDate);
    }
});
function emitTemperatureData(data) {
    const finalData = {
        startDate: data.startDate,
        endDate: data.endDate,
        timeSelect: data.timeSelect,
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
