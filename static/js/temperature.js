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
        console.log("Socket connected");
        let today = new Date();
        let formattedTodayDate = formatDateToYYYYMMDD(today);
        let graphSelect = document.getElementById('graphSelect_running_light_graph').value;
        console.log('GRAPHSELEct', graphSelect)
        emitTemperatureData({
            startDate: formattedTodayDate,
            endDate: formattedTodayDate,
            timeSelect: 'daily',

        });
        emitLightData({
            startDate: formattedTodayDate,
            endDate: formattedTodayDate,
            graphSelect: graphSelect,
            timeSelect: 'daily',
        });

    });
    function generateTimeLabels() {
        const labels = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 10) {
                const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                labels.push(timeLabel);
            }
        }
        return labels;
    }

    function getTimeIndex(time) {
        if (!time) return -1;
        const timeParts = time.split(':');
        if (timeParts.length < 2) return -1;

        const [hour, minute] = timeParts.map(Number);
        if (isNaN(hour) || isNaN(minute)) return -1;

        const index = hour * 6 + minute / 10;
        return index >= 0 && index < 144 ? index : -1;
    }

    socket.on('temperature_graph_data', function (data) {
        console.log('Received temperature:-------------', data);
        const selectElement = document.getElementById('timeframeSelect_temp_r_y_b');
        let currentTimeSelect = '';
        let labels = generateTimeLabels();
        if (selectElement) {
            currentTimeSelect = selectElement.value;
            // console.log('currentTimeSelect:', currentTimeSelect);
        } else {
            console.error("Element 'timeframeSelect_temp_r_y_b' not found");
        }

        let temp1 = Array(144).fill(null);
        console.log('temp1####', data)
        if (currentTimeSelect === 'set-date') {
            const dateRangePicker = document.getElementById('dateRange_temp_r_y_b')._flatpickr;
            console.log('datarange---', dateRangePicker)
            const startDate = dateRangePicker.selectedDates[0];
            const endDate = dateRangePicker.selectedDates[0];

            if (startDate && endDate) {

                data.forEach((row) => {
                    // Extract time from the row's 'hour' field
                    let timeString;
                    if (row.hour.includes(' ')) {
                        timeString = row.hour.split(' ')[1];  // Extract HH:mm from "YYYY-MM-DD HH:mm"
                    } else if (row.hour.includes('T')) {
                        timeString = row.hour.split('T')[1].slice(0, 5); // Extract HH:mm from "YYYY-MM-DDTHH:mm:ss"
                    } else {
                        console.error("Unexpected time format:", row.hour);
                        return;  // Skip this row if the format is unrecognized
                    }

                    // Get the index for this time
                    const timeIndex = getTimeIndex(timeString);
                    // console.log("Time index:", timeIndex);

                    if (timeIndex !== -1) {
                        // Update temp1 with the cumulative temperature for this time index
                        temp1[timeIndex] = row.cumulative_temperature;
                    }
                });

                temp1 = temp1.map(value => value === null ? 0 : value);

                // After the data is processed, update the graph
                console.log('Updated temp1:', temp1);
                updateGraph_temp_r_y_b(staticDailyLabels, temp1);

            } else {
                console.error('Start or end date is not selected.');
            }
        } else if (currentTimeSelect === 'daily') {
            // Process the data to update temp1
            data.forEach((row) => {
                // Extract time from the row's 'hour' field
                let timeString;
                if (row.hour.includes(' ')) {
                    timeString = row.hour.split(' ')[1];  // Extract HH:mm from "YYYY-MM-DD HH:mm"
                } else if (row.hour.includes('T')) {
                    timeString = row.hour.split('T')[1].slice(0, 5); // Extract HH:mm from "YYYY-MM-DDTHH:mm:ss"
                } else {
                    console.error("Unexpected time format:", row.hour);
                    return;  // Skip this row if the format is unrecognized
                }

                // Get the index for this time
                const timeIndex = getTimeIndex(timeString);
                // console.log("Time index:", timeIndex);

                if (timeIndex !== -1) {
                    // Update temp1 with the cumulative temperature for this time index
                    temp1[timeIndex] = row.cumulative_temperature;
                }
            });

            temp1 = temp1.map(value => value === null ? 0 : value);

            // After the data is processed, update the graph
            console.log('Updated temp1:', temp1);
            updateGraph_temp_r_y_b(staticDailyLabels, temp1);
        }
        else {
            console.error('Invalid time selection type.');
        }

    });




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
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Function to initialize Flatpickr for a given input field
    function initFlatpickr(selector, startDateDisplayId, endDateDisplayId, isSingleDate) {
        flatpickr(selector, {
            mode: isSingleDate ? "single" : "range",
            dateFormat: "d/m/Y",
            onChange: function (selectedDates) {
                if (selectedDates.length === 2) {
                    const startDate = selectedDates[0];
                    const endDate = selectedDates[1];

                    console.log(`Selected Dates for ${selector}:`, selectedDates);

                    // Update UI with selected dates
                    document.getElementById(startDateDisplayId).innerText = `Start Date: ${formatDate(startDate)}`;
                    document.getElementById(endDateDisplayId).innerText = `End Date: ${formatDate(endDate)}`;
                }
            }
        });
    }

    // Attach event listeners to trigger Flatpickr only when clicked
    document.getElementById("dateRange_temp_r_y_b")?.addEventListener("focus", function () {
        initFlatpickr("#dateRange_temp_r_y_b", "startDateDisplay_temp_r_y_b", "endDateDisplay_temp_r_y_b", true);
    });

    document.getElementById("dateRange_running_light_graph")?.addEventListener("focus", function () {
        initFlatpickr("#dateRange_running_light_graph", "startDateDisplay_running_light_graph", "endDateDisplay_running_light_graph", false);
    });
});


var ctx_temp_r_y_b = document.getElementById('myChart_temp_r_y_b').getContext('2d');
var chart_temp_r_y_b;

const redGradient = ctx_temp_r_y_b.createLinearGradient(0, 0, 0, 400);
redGradient.addColorStop(0, '#FF5B5B');
redGradient.addColorStop(1, '#FFB2B2');

var staticDailyLabels = Array.from({ length: 24 * 6 }, (_, i) => {
    const hour = Math.floor(i / 6);  // Get the hour by dividing by 6
    const minute = (i % 6) * 10;      // Get the minutes by multiplying the remainder by 10
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
});


function generateDateRangeData_temp_r_y_b(startDate, endDate) {
    var labels = [];
    var temp1 = [];
    console.log('4444444', startDate, endDate)
    if (startDate.toDateString() === endDate.toDateString()) {
        labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        temp1 = Array.from({ length: 24 }, () => 1000);
        // console.log('temp1', temp1)
    } else {
        var currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            labels.push(currentDate.toLocaleDateString('en-GB'));
            temp1.push(1000);
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }
    return { labels, temp1 };
}

function updateGraph_temp_r_y_b(timeSelect, temp1, startDate, endDate) {
    var labels = [];
    var xAxisTitle = '';

    // Handle 'set-date' selection where custom date range is provided
    if (timeSelect === 'set-date' && startDate && endDate) {
        const dateRangeData = generateDateRangeData_temp_r_y_b(startDate, endDate);
        labels = dateRangeData.labels;
        temp1 = dateRangeData.temp1;

        xAxisTitle = startDate.toDateString() === endDate.toDateString() ? '(Hours)' : '(Dates)';
    } else {

        labels = staticDailyLabels;

        xAxisTitle = '(Hours)';
    }

    // Destroy any existing chart before creating a new one
    // if (chart_temp_r_y_b) chart_temp_r_y_b.destroy();
    if (chart_temp_r_y_b) {
        chart_temp_r_y_b.destroy();
        chart_temp_r_y_b = null;
    }



    // Create a new chart with the updated data
    chart_temp_r_y_b = new Chart(ctx_temp_r_y_b, {
        type: 'line',
        data: {
            labels: labels,  // Labels for the x-axis (time or date range)
            datasets: [
                {
                    label: 'Temperature',
                    data: temp1,  // Temperature data for the y-axis
                    backgroundColor: redGradient, // Background color for the chart
                    borderColor: redGradient,     // Border color for the chart
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true, // Make the chart responsive to screen size changes
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xAxisTitle // Label for the x-axis (either "Hours" or "Dates")
                    },
                    ticks: {
                        maxTicksLimit: 9  // Limit the number of ticks on the x-axis to 9 entries
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)' // Label for the y-axis
                    },
                    beginAtZero: true,
                    // ticks: {
                    //     callback: function(value) {
                    //         return Number.isInteger(value) && value >= 0 ? value : null;
                    //     }

                    // }
                }
            },
            plugins: {
                legend: {
                    display: true
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: "xy"  // Zoom on both axes
                    },
                    limits: {
                        y: { min: 0 }  // For bound it to zero not show negative values
                    },
                    pan: {
                        enabled: true, // Enable panning
                        mode: 'xy'  // Panning in both X and Y axes
                    }
                }
            }
        }
    });


}


document.getElementById('timeframeSelect_temp_r_y_b').addEventListener('change', function () {
    var selectedValue = this.value;
    var dateRangeContainer = document.getElementById('dateRangeContainer_temp_r_y_b');
    var daterange_start = document.getElementById('startDateDisplay_temp_r_y_b');
    var daterange_end = document.getElementById('endDateDisplay_temp_r_y_b');
    var dateRangeInput = document.getElementById('dateRange_temp_r_y_b');
    if (selectedValue === 'set-date') {
        isSetDateActive_temp_r_y_b = true;
        dateRangeContainer.style.display = 'block';
        daterange_start.style.display = 'block';
        daterange_end.style.display = 'none';

        dateRangeInput._flatpickr.clear();  // Clear previous selection
        document.getElementById('startDateDisplay_temp_r_y_b').innerText = "";
        document.getElementById('endDateDisplay_temp_r_y_b').innerText = "";

        // dateRangeInput._flatpickr.set('mode', 'single');  // Only allow one date selection
    } else if (selectedValue === 'daily') {
        isSetDateActive_temp_r_y_b = false;
        dateRangeContainer.style.display = 'none';
        daterange_start.style.display = 'none';
        daterange_end.style.display = 'none';
        // console.log('Daily selected: Updating graph for today\'s data.');
        let today = new Date();
        // console.log('today', today)
        let formattedTodayDate = formatDateToYYYYMMDD(today);
        emitTemperatureData({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily' });
        updateGraph_temp_r_y_b('daily', formattedTodayDate, formattedTodayDate);

        // updateGraph_temp_r_y_b(selectedValue);
    } else {
        isSetDateActive_temp_r_y_b = false;
        dateRangeContainer.style.display = 'none';
        console.log('Other selection made. No action taken.');
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

            // selectedStartDate_temp_r_y_b = startDate;
            // selectedEndDate_temp_r_y_b = endDate;
            emitTemperatureData({ startDate: formattedStartDate, endDate: formattedEndDate, timeSelect: 'set-date' });
            updateGraph_temp_r_y_b('set-date', formattedStartDate, formattedEndDate);


        }
        updateGraph_temp_r_y_b('set-date', startDate, endDate);
    }
});

updateGraph_temp_r_y_b('daily');

function emitTemperatureData(data) {
    const finalData = {
        startDate: data.startDate,
        endDate: data.endDate,
        timeSelect: data.timeSelect,
    };

    if (socket) {
        socket.emit('temperature_graph_data', finalData);
    }








    // GRAPH CODE START


    let isSetDateActive_running_light_graph = false;
    let selectedStartDate_running_light_graph, selectedEndDate_running_light_graph;

    // let globalData ;
    let globalData = [];

    // Initialize Flatpickr for date range selection
    function formatDate_running_light_graph(date) {
        if (!date) return '';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    var ctx_running_light_graph = document.getElementById('myChart_running_light_graph').getContext('2d');
    var chart_running_light_graph;


    const blueRedGradient_running_light_graph = ctx_running_light_graph.createLinearGradient(0, 0, 0, 400);
    blueRedGradient_running_light_graph.addColorStop(0, '#2959FF');
    blueRedGradient_running_light_graph.addColorStop(1, '#9EB3FC');


    var greenGradient_running_light_graph = ctx_running_light_graph.createLinearGradient(0, 0, 0, 200);
    greenGradient_running_light_graph.addColorStop(0, '#23D900');
    greenGradient_running_light_graph.addColorStop(1, '#23D400');

    var staticDailyLabels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);




    function generateDateRangeData_running_light_graph(startDate, endDate, graphType) {
        var labels = [];
        var data = [];

        // Check if the start and end date are the same
        if (startDate.toDateString() === endDate.toDateString()) {
            // If the same, generate 24-hour labels for that day
            labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);


        } else {
            var currentDate = new Date(startDate);
            while (currentDate <= endDate) { // Fixed comparison to endDate
                labels.push(currentDate.toLocaleDateString('en-GB'));
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        return { labels: labels, data: data };
    }



    // Updated function to calculate active and inactive time for set-date option
    function updateGraph_running_light_graph(labels, timeSelect, graphData, yAxisLabel, graphSelect, startDate, endDate) {
        var labels = [];
        var data = [];
        var yAxisLabel = '';
        var backgroundColor = '';

        // Default to 24-hour format for the x-axis
        if (!Array.isArray(labels) || labels.length === 0) {
            labels = timeSelect === 'set-date' && startDate !== endDate
                ? [] // Will be filled with dates later
                : Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        }

        // Ensure graphData is always an array
        if (!Array.isArray(graphData)) {
            graphData = [];
        }

        // Set background color based on graph type
        if (graphSelect === 'power-consumption') {
            backgroundColor = blueRedGradient_running_light_graph;
            yAxisLabel = 'Power Consumption (Wh)';
        } else if (graphSelect === 'power-saving') {
            backgroundColor = greenGradient_running_light_graph;
            yAxisLabel = 'Power Saving (Wh)';
        } else if (graphSelect === 'active-run-time') {
            backgroundColor = blueRedGradient_running_light_graph;
            yAxisLabel = 'Active Run Time (Minutes)';
        }

        // Handle date range selection
        if (timeSelect === 'set-date' && startDate && endDate) {
            if (startDate instanceof Date && endDate instanceof Date && startDate.getTime() === endDate.getTime()) {
                labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            } else {
                labels = data.map(entry => entry.date);
            }

        }

        // Ensure X-axis labels always appear even if no data is available
        let isDataEmpty = graphData.length === 0 || graphData.every(value => value === 0);

        if (isDataEmpty) {
            data = Array(labels.length).fill(0);
        } else {
            data = graphData;
        }


        if (graphSelect === 'power-consumption') {
            if (timeSelect === 'set-date' && startDate && endDate) {

                if (startDate !== endDate) {
                    labels = globalData.map(entry => entry.date);
                    graphData = Array.isArray(globalData) ? globalData.map(entry => entry.power_consumption || 0) : []; // Safe check
                    data = graphData;
                }
                else {
                    labels = Array.from({ length: 24 }, (_, hour) => `${hour}:00`);

                    const hourMap = globalData.reduce((map, entry) => {
                        map[entry.hour] = entry.power_consumption;
                        return map;
                    }, {});
                    // Create an array for graphData with all 24 hours (0-23)
                    const graphData = Array.from({ length: 24 }, (_, hour) => {
                        return Math.max(0, hourMap[hour] || 0); // Set to 0 if the hour doesn't exist in the map
                    });
                    data = graphData;
                }

            } else {
                labels = staticDailyLabels;
                data = graphData;

            }
            yAxisLabel = 'Power Consumption (Wh)';
            backgroundColor = blueRedGradient_running_light_graph;
        } else if (graphSelect === 'power-saving') {
            if (timeSelect === 'set-date' && startDate && endDate) {

                if (startDate !== endDate) {
                    labels = globalData.map(entry => entry.date);
                    graphData = Array.isArray(globalData) ? globalData.map(entry => entry.power_saving || 0) : []; // Safe check
                    data = graphData;
                }
                else {
                    labels = Array.from({ length: 24 }, (_, hour) => `${hour}:00`);

                    const hourMap = globalData.reduce((map, entry) => {
                        map[entry.hour] = entry.power_saving;
                        return map;
                    }, {});

                    // Create an array for graphData with all 24 hours (0-23)
                    const graphData = Array.from({ length: 24 }, (_, hour) => {
                        return Math.max(0, hourMap[hour] || 0); // Set to 0 if the hour doesn't exist in the map
                    });
                    data = graphData;
                }

            } else {
                labels = staticDailyLabels;
                data = graphData;

            }
            yAxisLabel = 'Power Saving (Wh)';
            backgroundColor = greenGradient_running_light_graph;
        } else if (graphSelect === 'active-run-time') {
            var activeTime = [];

            labels = staticDailyLabels;
            yAxisLabel = 'Active Run Time (Minutes)';
            backgroundColor = blueRedGradient_running_light_graph;
            if (timeSelect === 'set-date' && startDate && endDate) {
                const dateRangeData = generateDateRangeData_running_light_graph(startDate, endDate, graphSelect);
                labels = dateRangeData.labels;
                activeTime = dateRangeData.data;

            } else {
                labels = staticDailyLabels;
                data = graphData;

            }
        }

        
        // To show kWh from Wh
        let isLargeData = graphData.some(value => value >= 1000);

        if (isLargeData) {
            data = graphData.map(value => value / 1000);
            yAxisLabel = yAxisLabel.replace('(Wh)', '(kWh)');
            console.log("Scaled Data:", graphData);
        } else {
            yAxisLabel = yAxisLabel.replace('(kWh)', '(Wh)');
        }

        const yAxisTickCallback = function (value) {
            if (isLargeData) {
                return value.toFixed(1) + 'k';
            }
            return value;
        };


        // Clear the previous chart if it exists
        if (chart_running_light_graph) {
            chart_running_light_graph.destroy();
            chart_running_light_graph = null;
        }
        
        // Create the new chart with updated data and options
        chart_running_light_graph = new Chart(ctx_running_light_graph, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: yAxisLabel,
                    data: data,  // Use the scaled data
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor,
                    borderWidth: 1,
                    borderRadius: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: (timeSelect === 'set-date' && startDate && endDate && startDate instanceof Date && endDate instanceof Date)
                                ? (startDate.getTime() === endDate.getTime() ? '(Hours)' : '(Dates)')
                                : '(Hours)'
                        },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisLabel
                        },
                        beginAtZero: true,
                        ticks: {
                            callback: yAxisTickCallback // Custom tick formatting
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: graphSelect === 'active-run-time'
                    }
                }
            }
        });
    }






    document.getElementById('timeSelect_running_light_graph').addEventListener('change', function () {
        var selectedValue = this.value;
        let graphSelect = document.getElementById('graphSelect_running_light_graph').value;
        var dateRangeContainer = document.getElementById('dateRangeContainer_running_light_graph');
        var dateDisplayDiv = document.getElementById('DateDisplay_css_running_light_graph_div');
        let dateRangePicker = document.getElementById('dateRange_running_light_graph')._flatpickr;

        var graphData = [];
        var yAxisLabel = '';
        var backgroundColor = '';
        let labels = [];

        if (selectedValue === 'set-date') {
            isSetDateActive_running_light_graph = true;
            dateRangeContainer.style.display = 'block';  // Show date range selection
            dateDisplayDiv.style.display = 'flex';       // Show date display div

            dateRangePicker.clear();
            document.getElementById('startDateDisplay_running_light_graph').innerText = "";
            document.getElementById('endDateDisplay_running_light_graph').innerText = "";

                // Clear global variables
            selectedStartDate_running_light_graph = null;
            selectedEndDate_running_light_graph = null;

        } else {
            isSetDateActive_running_light_graph = false;
            dateRangeContainer.style.display = 'none';   // Hide date range selection
            dateDisplayDiv.style.display = 'none';       // Hide date display div

            let today = new Date();
            // console.log('today', today)
            let formattedTodayDate = formatDateToYYYYMMDD(today);
            emitLightData({ startDate: formattedTodayDate, endDate: formattedTodayDate, timeSelect: 'daily', graphSelect: graphSelect });

            // emitLightData({ startDate: formattedStartDate, endDate: formattedEndDate, timeSelect: 'set-date', graphSelect: graphSelect });


            if (globalData.length > 0 && globalData[0].hour !== undefined) {
                // Initialize labels for all 24 hours
                labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

                // Create an object to store the data with hour as the key
                let dataByHour = {};

                // Fill dataByHour with incoming data
                globalData.forEach(entry => {
                    if (entry.hour >= 0 && entry.hour <= 23) {
                        dataByHour[entry.hour] = {
                            power_consumption: entry.power_consumption || 0,
                            active_run_time: entry.active_run_time || 0,
                            power_saving: entry.power_saving || 0
                        };
                    }
                });

                globalData = labels.map((label, index) => {
                    const hour = index;
                    return dataByHour[hour] || { power_consumption: 0, active_run_time: 0, power_saving: 0 };
                });
            } else if (globalData.length > 0 && globalData[0].date !== undefined) {
                labels = globalData.map(entry => entry.date);
            }

            if (graphSelect === 'power-consumption') {
                graphData = globalData.map(entry => Math.max(0, entry.power_consumption));
                console.log('graphData', graphData);
                yAxisLabel = 'Power Consumption (Wh)';
                backgroundColor = '#FF6384';
            } else if (graphSelect === 'power-saving') {
                graphData = globalData.map(entry => Math.max(0, entry.power_saving));
                console.log('graphData2', graphData);
                yAxisLabel = 'Power Saving (Wh)';
                backgroundColor = '#23D900';
            } else if (graphSelect === 'active-run-time') {
                graphData = globalData.map(entry => Math.max(0, entry.active_run_time));
            }


            updateGraph_running_light_graph(labels, selectedValue, graphData, yAxisLabel, graphSelect);

        }
    });


    document.getElementById('graphSelect_running_light_graph').addEventListener('change', function () {
        var graphData = [];
        var yAxisLabel = '';
        var backgroundColor = '';
        let labels = [];
        let graphSelect = document.getElementById('graphSelect_running_light_graph').value;
        let timeSelect = document.getElementById('timeSelect_running_light_graph').value

        if (isSetDateActive_running_light_graph) {


            if (graphSelect === 'power-consumption') {
                graphData = globalData.map(entry => Math.max(0, entry.power_consumption));

                yAxisLabel = 'Power Consumption (Wh)';
                backgroundColor = '#FF6384';
            } else if (graphSelect === 'power-saving') {
                graphData = globalData.map(entry => Math.max(0, entry.power_saving));

                yAxisLabel = 'Power Saving (Wh)';
                backgroundColor = '#23D900';
            } else if (graphSelect === 'active-run-time') {
                graphData = globalData.map(entry => Math.max(0, entry.active_run_time));
            }

            console.log("chaning ------------ ", graphData);


            updateGraph_running_light_graph(labels, 'set-date', graphData, yAxisLabel, graphSelect, selectedStartDate_running_light_graph, selectedEndDate_running_light_graph);
        } else {
            if (globalData.length > 0 && globalData[0].hour !== undefined) {
                // Initialize labels for all 24 hours
                labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

                // Create an object to store the data with hour as the key
                let dataByHour = {};

                // Fill dataByHour with incoming data
                globalData.forEach(entry => {
                    if (entry.hour >= 0 && entry.hour <= 23) {
                        dataByHour[entry.hour] = {
                            power_consumption: entry.power_consumption || 0,
                            active_run_time: entry.active_run_time || 0,
                            power_saving: entry.power_saving || 0
                        };
                    }
                });

                globalData = labels.map((label, index) => {
                    const hour = index;
                    return dataByHour[hour] || { power_consumption: 0, active_run_time: 0, power_saving: 0 };
                });
            } else if (globalData.length > 0 && globalData[0].date !== undefined) {
                labels = globalData.map(entry => entry.date);
            }

            if (graphSelect === 'power-consumption') {
                graphData = globalData.map(entry => Math.max(0, entry.power_consumption));
                yAxisLabel = 'Power Consumption (Wh)';
                backgroundColor = '#FF6384';
            } else if (graphSelect === 'power-saving') {
                graphData = globalData.map(entry => Math.max(0, entry.power_saving));
                yAxisLabel = 'Power Saving (Wh)';
                backgroundColor = '#23D900';
            } else if (graphSelect === 'active-run-time') {
                graphData = globalData.map(entry => Math.max(0, entry.active_run_time));
            }


            updateGraph_running_light_graph(labels, timeSelect, graphData, yAxisLabel, graphSelect);

        }
    });

    document.getElementById('applyDateRange_running_light_graph').addEventListener('click', function () {
        var dateRangePicker = document.getElementById('dateRange_running_light_graph')._flatpickr;

        selectedStartDate_running_light_graph = dateRangePicker.selectedDates[0];
        selectedEndDate_running_light_graph = dateRangePicker.selectedDates[1];


        if (!selectedEndDate_running_light_graph) {
            selectedEndDate_running_light_graph = selectedStartDate_running_light_graph;
        }

        var formattedStartDate = formatDateToYYYYMMDD(selectedStartDate_running_light_graph);
        var formattedEndDate = formatDateToYYYYMMDD(selectedEndDate_running_light_graph);




        // Update the display of start and end dates
        document.getElementById('startDateDisplay_running_light_graph').innerText = `Start Date: ${formatDate_running_light_graph(selectedStartDate_running_light_graph)}`;
        document.getElementById('endDateDisplay_running_light_graph').innerText = `End Date: ${formatDate_running_light_graph(selectedEndDate_running_light_graph)}`;


        emitLightData({ startDate: formattedStartDate, endDate: formattedEndDate, timeSelect: 'set-date', graphSelect: 'power-consumption' });




        updateGraph_running_light_graph('set-date', formattedStartDate, formattedEndDate);
    });

    // Initial graph load
    updateGraph_running_light_graph('daily', 'power-consumption');



    // GRAPH CODE ENDS   

    socket.on('running_light_graph_data_response', function (data) {
        var labels = [];
        globalData = data;
        var graphData = [];
        var yAxisLabel = '';
        var backgroundColor = '';

        console.log("globalData", globalData);

        let timeSelect = document.getElementById('timeSelect_running_light_graph').value;
        let graphSelect = document.getElementById('graphSelect_running_light_graph').value;

        // Power saving calculation
        const powerSavingData = globalData.map(item => item.power_saving || 0);
        const totalPowerSaving = powerSavingData.reduce((acc, saving) => acc + saving, 0);

        function formatPower(value) {
            return value < 1000
                ? `${value.toFixed(2)} Wh`
                : `${(value / 1000).toFixed(2)} kWh`;
        }
        const powerSavingElement = document.getElementById('power_savingvalue');
        if (powerSavingElement) {
            powerSavingElement.textContent = formatPower(totalPowerSaving);
        } else {
            console.log("Element not found.");
        }


        if (!data || data.length === 0) {
            console.log("No data received.");
            updateGraph_running_light_graph(labels, timeSelect, graphData, yAxisLabel, graphSelect)
        }

        if (data.length > 0 && data[0].hour !== undefined) {
            // Initialize labels for all 24 hours
            labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

            // Create an object to store the data with hour as the key
            let dataByHour = {};

            // Fill dataByHour with incoming data
            data.forEach(entry => {
                if (entry.hour >= 0 && entry.hour <= 23) {
                    dataByHour[entry.hour] = {
                        power_consumption: entry.power_consumption || 0,
                        active_run_time: entry.active_run_time || 0,
                        power_saving: entry.power_saving || 0
                    };
                }
            });

            data = labels.map((label, index) => {
                const hour = index;
                return dataByHour[hour] || { power_consumption: 0, active_run_time: 0, power_saving: 0 };
            });
        } else if (data.length > 0 && data[0].date !== undefined) {
            labels = data.map(entry => entry.date);
        }


        // let graphSelect = document.getElementById('graphSelect_running_light_graph').value;
        // console.log("socket on",data)

        if (graphSelect === 'power-consumption') {
            // graphData = data.map(entry => entry.power_consumption);
            graphData = Array.isArray(data) ? data.map(entry => entry.power_consumption || 0) : []; // Safe check
            yAxisLabel = 'Power Consumption (Wh)';
            backgroundColor = '#2959FF';
            // console.log("socket on inside if loop --------------",graphData)
            // console.log("socket on labels inside if loop --------------",labels)
        } else if (graphSelect === 'power-saving') {
            // graphData = data.map(entry => entry.power_saving);
            graphData = Array.isArray(data) ? data.map(entry => entry.power_saving || 0) : []; // Safe check
            console.log('graphData2', graphData)
            yAxisLabel = 'Power Saving (Wh)';
            backgroundColor = '#23D900';
        } else if (graphSelect === 'active-run-time') {
            graphData = data.map(entry => entry.active_run_time);
            yAxisLabel = 'Active Run Time (Minutes)';
        }

        labels = (data.length > 0 && data[0].date !== undefined)
            ? data.map(entry => entry.date)
            : Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

        // updateGraph_running_light_graph(labels, graphData, yAxisLabel, backgroundColor, graphSelect);
        updateGraph_running_light_graph(labels, timeSelect, graphData, yAxisLabel, graphSelect)

        // Check if any data value exceeds 1000
        let isLargeData = graphData.some(value => value >= 1000);

        // If data is large (>= 1000), convert it to "kWh" and update the label
        if (isLargeData) {
            graphData = graphData.map(value => value / 1000); // Scale values by 1000
            yAxisLabel = yAxisLabel.replace('(Wh)', '(kWh)'); // Update Y-axis label to kWh
            console.log("Updated Y-axis label: ", yAxisLabel);
        } else {
            // If data isn't large, ensure the label remains in Wh (no scaling)
            yAxisLabel = yAxisLabel.replace('(kWh)', '(Wh)');
        }

        // Format the y-axis ticks to display values in 'k' format
        const yAxisTickCallback = function (value) {
            if (isLargeData) {
                // Only add 'k' if the data is scaled (i.e., large data)
                return value.toFixed(1) + 'k'; // Show as 1.2k, 0.5k, etc.
            }
            return value; // Display raw value if it's smaller than 1 (e.g., 0.5)
        };

        // Destroy existing chart before rendering a new one
        if (chart_running_light_graph) chart_running_light_graph.destroy();

        // Create the new chart with updated data and options
        chart_running_light_graph = new Chart(ctx_running_light_graph, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: yAxisLabel,
                    data: graphData, // Use the scaled data
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor,
                    borderWidth: 1,
                    borderRadius: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: (data.length > 0 && data[0].date !== undefined) ? '(Dates)' : '(Hours)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisLabel
                        },
                        ticks: {
                            callback: yAxisTickCallback // Custom tick formatting
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: graphSelect === 'active-run-time'
                    }
                }
            }
        });
    });






}

function emitLightData(data) {
    const finalData = {
        startDate: data.startDate,
        endDate: data.endDate,
        timeSelect: data.timeSelect,
        graphSelect: data.graphSelect,

    };

    console.log('finaldata', finalData)
    if (socket) {
        socket.emit('running_light_graph_data', finalData);
    }
}



fetchIP()
    .then(ip => setupSocketConnection(ip))
    .catch(error => console.error('Error setting up socket connection:', error));
