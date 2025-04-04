document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const meansInput = document.getElementById('means');
    const sdLowerInput = document.getElementById('sd-lower');
    const sdUpperInput = document.getElementById('sd-upper');
    const replicatesInput = document.getElementById('replicates');
    const generateBtn = document.getElementById('generate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const downloadBtn = document.getElementById('download-btn');
    const statsSummary = document.getElementById('stats-summary');
    const resultsDiv = document.getElementById('results');
    const countDisplay = document.getElementById('count');
    
    // Password modal elements
    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordCancel = document.getElementById('password-cancel');
    
    // Store generated data for download
    let generatedData = [];
    
    // Initialize click counter
    initClickCounter();
    
    // Event listeners
    generateBtn.addEventListener('click', showPasswordModal);
    clearBtn.addEventListener('click', clearResults);
    downloadBtn.addEventListener('click', downloadCSV);
    
    passwordSubmit.addEventListener('click', checkPassword);
    passwordCancel.addEventListener('click', hidePasswordModal);
    
    // Add event listener for Enter key on password input
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });
    
    // Show password modal
    function showPasswordModal() {
        passwordModal.style.display = 'flex';
        passwordInput.value = '';
        passwordInput.focus();
    }
    
    // Hide password modal
    function hidePasswordModal() {
        passwordModal.style.display = 'none';
    }
    
    // Check password
    function checkPassword() {
        const password = passwordInput.value;
        
        // Check if password meets requirements (8 alphanumeric characters)
        if (password.length === 8 && /^[a-zA-Z0-9]{8}$/.test(password)) {
            hidePasswordModal();
            generateData();
        } else {
            // Shake the input field to indicate error
            passwordInput.classList.add('shake');
            setTimeout(() => {
                passwordInput.classList.remove('shake');
            }, 500);
            
            // Clear the input for retry
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
    
    // Generate data function
    function generateData() {
        // Parse input values
        const meanValues = parseMeanValues(meansInput.value);
        const sdLower = parseFloat(sdLowerInput.value);
        const sdUpper = parseFloat(sdUpperInput.value);
        const replicates = parseInt(replicatesInput.value);
        
        // Validate inputs
        if (meanValues.length === 0) {
            alert('Please enter at least one mean value');
            return;
        }
        
        // Check for zero or negative mean values
        if (meanValues.some(mean => mean <= 0)) {
            alert('All mean values must be greater than zero.');
            return;
        }
        
        if (isNaN(sdLower) || isNaN(sdUpper) || sdLower >= sdUpper) {
            alert('Invalid standard deviation limits. Lower limit must be less than upper limit.');
            return;
        }
        
        // Ensure SD limits are positive
        if (sdLower <= 0) {
            alert('Standard deviation lower limit must be greater than zero.');
            return;
        }
        
        if (isNaN(replicates) || replicates < 1) {
            alert('Number of replicates must be at least 1');
            return;
        }
        
        // Count the number of mean values (X)
        const X = meanValues.length;
        
        // Generate X random standard deviation values between sdLower and sdUpper
        const standardDeviations = generateRandomSDs(X, sdLower, sdUpper);
        
        // Generate the data sets
        const data = generateDataSets(meanValues, standardDeviations, replicates);
        
        // Store the generated data for download
        generatedData = data;
        
        // Display the results
        displayResults(meanValues, standardDeviations, data);
        
        // Enable the download button
        downloadBtn.disabled = false;
        
        // Update the click counter
        updateClickCounter();
    }
    
    // Parse mean values from input (handles comma, space, or tab separation)
    function parseMeanValues(input) {
        // Replace tabs with spaces
        input = input.replace(/\t/g, ' ');
        // Replace multiple spaces with a single space
        input = input.replace(/\s+/g, ' ');
        // Replace comma + space with just comma
        input = input.replace(/, /g, ',');
        // Replace space with comma
        input = input.replace(/ /g, ',');
        // Split by comma
        const values = input.split(',').filter(val => val.trim() !== '');
        
        // Parse values as numbers
        return values.map(val => {
            const num = parseFloat(val);
            return isNaN(num) ? null : num;
        }).filter(val => val !== null);
    }
    
    // Generate random standard deviations with 2 decimal precision
    function generateRandomSDs(count, min, max) {
        const sds = [];
        for (let i = 0; i < count; i++) {
            // Generate random value between min and max with 2 decimal places
            const sd = Math.round((Math.random() * (max - min) + min) * 100) / 100;
            sds.push(sd);
        }
        return sds;
    }
    
    // Generate data sets with specified means, SDs, and replicates
    function generateDataSets(means, standardDeviations, replicateCount) {
        const datasets = [];
        
        means.forEach((mean, index) => {
            const sd = standardDeviations[index];
            const replicates = generateReplicates(mean, sd, replicateCount);
            
            datasets.push({
                mean: mean,
                targetSD: sd,
                replicates: replicates,
                actualMean: calculateMean(replicates),
                actualSD: calculateSD(replicates)
            });
        });
        
        return datasets;
    }
    
    // Generate replicates with specified mean and standard deviation
    function generateReplicates(mean, sd, count) {
        // Generate random values with normal distribution
        const values = [];
        for (let i = 0; i < count; i++) {
            // Using Box-Muller transform to generate normally distributed values
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            
            const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
            
            // Apply the desired mean and standard deviation
            let val = mean + z * sd;
            
            // Ensure no zero or negative values (minimum 0.01)
            val = Math.max(0.01, val);
            
            // Round to 2 decimal places
            val = Math.round(val * 100) / 100;
            
            // If rounding made it zero, set to 0.01
            val = val === 0 ? 0.01 : val;
            
            values.push(val);
        }
        
        // Adjust values to ensure the mean exactly matches the target
        const currentMean = calculateMean(values);
        const adjustment = mean - currentMean;
        
        // Apply adjustment to all values, ensuring no zero or negative values
        return values.map(val => {
            let adjustedVal = Math.round((val + adjustment) * 100) / 100;
            // Ensure no zero or negative values after adjustment (minimum 0.01)
            return Math.max(0.01, adjustedVal);
        });
    }
    
    // Calculate mean of an array of numbers
    function calculateMean(values) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        return values.length > 0 ? sum / values.length : 0;
    }
    
    // Calculate standard deviation of an array of numbers
    function calculateSD(values) {
        const mean = calculateMean(values);
        const squareDiffs = values.map(value => {
            const diff = value - mean;
            return diff * diff;
        });
        
        const variance = calculateMean(squareDiffs);
        return Math.sqrt(variance);
    }
    
    // Display results in the UI
function displayResults(means, standardDeviations, datasets) {
    // Display summary
    statsSummary.innerHTML = `
        <p><strong>Number of means (X):</strong> ${means.length}</p>
        <p><strong>Number of replicates per mean (Y):</strong> ${replicatesInput.value}</p>
        <p><strong>SD Range:</strong> ${sdLowerInput.value} to ${sdUpperInput.value}</p>
        <p><strong>Total data points generated:</strong> ${means.length * parseInt(replicatesInput.value)}</p>
    `;
    
    // Create table for mean and SD values
    let meanSDTable = `
        <h3>Mean Values and Standard Deviations:</h3>
        <div class="scroll-container">
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Target Mean</th>
                        <th>Target SD</th>
                        <th>Actual Mean</th>
                        <th>Actual SD</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    datasets.forEach((dataset, index) => {
        meanSDTable += `
            <tr>
                <td>${index + 1}</td>
                <td>${dataset.mean}</td>
                <td>${dataset.targetSD}</td>
                <td>${dataset.actualMean.toFixed(2)}</td>
                <td>${dataset.actualSD.toFixed(2)}</td>
            </tr>
        `;
    });
    
    meanSDTable += `
                </tbody>
            </table>
        </div>
    `;
    
    // Get number of replicates
    const replicateCount = datasets.length > 0 ? datasets[0].replicates.length : 0;
    
    // Create new format table with Original mean, R1, R2, R3, ..., Actual mean
    let newFormatTable = `
        <h3>Generated Values:</h3>
        <div class="scroll-container">
            <table>
                <thead>
                    <tr>
                        <th>Original Mean</th>
    `;
    
    // Add replicate headers
    for (let i = 0; i < replicateCount; i++) {
        newFormatTable += `<th>R${i + 1}</th>`;
    }
    
    newFormatTable += `
                        <th>Actual Mean</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add a row for each dataset (mean)
    datasets.forEach((dataset) => {
        newFormatTable += `
            <tr>
                <td>${dataset.mean}</td>
        `;
        
        // Add each replicate value in the row
        dataset.replicates.forEach((value) => {
            newFormatTable += `<td>${value}</td>`;
        });
        
        // Add the actual mean at the end of the row
        newFormatTable += `
                <td>${dataset.actualMean.toFixed(2)}</td>
            </tr>
        `;
    });
    
    newFormatTable += `
                </tbody>
            </table>
        </div>
    `;
    
    // Display both tables
    resultsDiv.innerHTML = meanSDTable + newFormatTable;
}
    // Clear results function
    function clearResults() {
        statsSummary.innerHTML = '';
        resultsDiv.innerHTML = '';
        generatedData = [];
        downloadBtn.disabled = true;
    }
    
    // Download CSV function
function downloadCSV() {
    if (generatedData.length === 0) {
        alert('No data to download');
        return;
    }
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Get number of replicates
    const replicateCount = generatedData.length > 0 ? generatedData[0].replicates.length : 0;
    
    // Add header row
    csvContent += 'Original Mean,';
    
    // Add replicate headers
    for (let i = 0; i < replicateCount; i++) {
        csvContent += `R${i + 1},`;
    }
    
    // Add actual mean header
    csvContent += 'Actual Mean\n';
    
    // Add data rows
    generatedData.forEach((dataset) => {
        // Start with original mean
        csvContent += `${dataset.mean},`;
        
        // Add all replicate values
        dataset.replicates.forEach((value) => {
            csvContent += `${value},`;
        });
        
        // Add actual mean and end the row
        csvContent += `${dataset.actualMean.toFixed(2)}\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'generated_data.csv');
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
}
    
    // Click counter functions
    function initClickCounter() {
        // Replace with your actual GitHub Pages domain
        const NAMESPACE = 'S-rat-lab.github.io/Replicator'; 
        const KEY = 'data-generator-clicks';
        
        // CountAPI endpoint - using amount=0 to just get current value without incrementing
        const COUNTER_API_URL = 'https://api.countapi.xyz/hit/';
        
        // Load initial count
        fetch(`${COUNTER_API_URL}${NAMESPACE}/${KEY}?amount=0`)
            .then(response => response.json())
            .then(data => {
                countDisplay.textContent = data.value || 0;
            })
            .catch(error => {
                console.error('Error fetching count:', error);
                countDisplay.textContent = 'Error loading';
            });
    }
    
    // Update click counter
    function updateClickCounter() {
        // Replace with your actual GitHub Pages domain
        const NAMESPACE = 'S-rat-lab.github.io/Replicator'; 
        const KEY = 'data-generator-clicks';
        const COUNTER_API_URL = 'https://api.countapi.xyz/hit/';
        
        fetch(`${COUNTER_API_URL}${NAMESPACE}/${KEY}`)
            .then(response => response.json())
            .then(data => {
                countDisplay.textContent = data.value;
            })
            .catch(error => {
                console.error('Error updating count:', error);
            });
    }
});
