// DOM elements
const timeElement = document.getElementById('time');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const powerValue = document.getElementById('power-value');
const totalPowerValue = document.getElementById('total-power-value');
const chartCtx = document.getElementById('powerChart').getContext('2d');

// Power data array for the chart
const powerData = {
    labels: [],
    values: []
};

// Total power calculation
let totalPowerKWh = 0;
let lastUpdateTime = Date.now();

// Initialize chart
const powerChart = new Chart(chartCtx, {
    type: 'line',
    data: {
        labels: powerData.labels,
        datasets: [{
            label: 'Power Usage (W)',
            data: powerData.values,
            borderColor: '#00ff88',
            backgroundColor: 'rgba(0, 255, 136, 0.1)',
            tension: 0.4,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#ffffff',
                    callback: function(value) {
                        if (value >= 1000) {
                            return (value / 1000).toFixed(1) + ' kW';
                        }
                        return value + ' W';
                    }
                }
            },
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#ffffff'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: '#ffffff'
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let value = context.raw;
                        if (value >= 1000) {
                            return `Power: ${(value / 1000).toFixed(2)} kW`;
                        }
                        return `Power: ${value.toFixed(2)} W`;
                    }
                }
            }
        }
    }
});

// Update clock function
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    timeElement.textContent = `${hours}:${minutes}:${seconds}`;
}

// Format power value function
function formatPower(power) {
    if (power >= 1000) {
        return `${(power / 1000).toFixed(2)} kW`;
    }
    return `${power.toFixed(2)} W`;
}

// Format total power value function
function formatTotalPower(totalPower) {
    if (totalPower >= 1) {
        return `${totalPower.toFixed(2)} kWh`;
    }
    return `${(totalPower * 1000).toFixed(2)} Wh`;
}

// Calculate energy between updates
function calculateEnergy(power) {
    const now = Date.now();
    const timeDiff = (now - lastUpdateTime) / 1000 / 3600; // Convert to hours
    lastUpdateTime = now;
    return (power / 1000) * timeDiff; // Convert W to kW and multiply by hours
}

// Check Arduino status and update readings
async function updateArduinoData() {
    try {
        // Fetch Arduino data
        const response = await fetch('/arduino-data');
        const result = await response.json();
        
        if (result.data) {
            // Update status indicator
            statusIndicator.classList.remove('inactive');
            statusIndicator.classList.add('active');
            statusText.textContent = 'Arduino Status: Connected';
            
            // Update power reading
            const power = result.data.power;
            powerValue.textContent = formatPower(power);
            
            // Update total power
            totalPowerKWh += calculateEnergy(power);
            totalPowerValue.textContent = formatTotalPower(totalPowerKWh);
            
            // Update chart
            const now = new Date();
            const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            
            powerData.labels.push(timeLabel);
            powerData.values.push(power);
            
            // Keep only last 30 readings
            if (powerData.labels.length > 30) {
                powerData.labels.shift();
                powerData.values.shift();
            }
            
            // Update chart
            powerChart.update();
        }
    } catch (error) {
        console.error('Error fetching Arduino data:', error);
        statusIndicator.classList.remove('active');
        statusIndicator.classList.add('inactive');
        statusText.textContent = 'Arduino Status: Disconnected';
    }
}

// Initial calls
updateClock();
updateArduinoData();

// Set up intervals
setInterval(updateClock, 1000);  // Update clock every second
setInterval(updateArduinoData, 1000);  // Update Arduino data every second 