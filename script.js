document.addEventListener('DOMContentLoaded', function() {
    // Waveform Generator
    const waveTypeSelect = document.getElementById('waveType');
    const frequencySlider = document.getElementById('frequency');
    const freqValueSpan = document.getElementById('freqValue');
    const amplitudeSlider = document.getElementById('amplitude');
    const ampValueSpan = document.getElementById('ampValue');
    const waveformCtx = document.getElementById('waveformChart').getContext('2d');
    
    let waveformChart = new Chart(waveformCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Waveform',
                borderColor: 'rgb(75, 192, 192)',
                data: [],
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (samples)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amplitude'
                    },
                    min: -1,
                    max: 1
                }
            }
        }
    });

    function generateWaveform() {
        const type = waveTypeSelect.value;
        const frequency = parseFloat(frequencySlider.value);
        const amplitude = parseFloat(amplitudeSlider.value);
        const sampleRate = 100;
        const duration = 1; // seconds
        const samples = duration * sampleRate;
        
        let data = [];
        let labels = [];
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            labels.push(i);
            
            let value;
            switch(type) {
                case 'sine':
                    value = amplitude * Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    value = amplitude * (Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1);
                    break;
                case 'sawtooth':
                    value = amplitude * (2 * (t * frequency - Math.floor(0.5 + t * frequency)));
                    break;
                case 'triangle':
                    value = amplitude * (2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1);
                    break;
                default:
                    value = 0;
            }
            
            data.push(value);
        }
        
        waveformChart.data.labels = labels;
        waveformChart.data.datasets[0].data = data;
        waveformChart.data.datasets[0].label = `${type} wave (${frequency} Hz)`;
        waveformChart.update();
    }

    // Update displayed values
    frequencySlider.addEventListener('input', function() {
        freqValueSpan.textContent = this.value;
        generateWaveform();
    });

    amplitudeSlider.addEventListener('input', function() {
        ampValueSpan.textContent = this.value;
        generateWaveform();
    });

    waveTypeSelect.addEventListener('change', generateWaveform);

    // Initialize
    generateWaveform();

    // Fourier Transform Section
    const signalInput = document.getElementById('signalInput');
    const updateFourierBtn = document.getElementById('updateFourier');
    const timeDomainCtx = document.getElementById('timeDomainChart').getContext('2d');
    const freqDomainCtx = document.getElementById('freqDomainChart').getContext('2d');
    
    let timeDomainChart = new Chart(timeDomainCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Signal',
                borderColor: 'rgb(54, 162, 235)',
                data: [],
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (samples)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amplitude'
                    }
                }
            }
        }
    });

    let freqDomainChart = new Chart(freqDomainCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Frequency Components',
                backgroundColor: 'rgb(255, 99, 132)',
                data: []
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Frequency (Hz)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Magnitude'
                    }
                }
            }
        }
    });

    function updateFourier() {
        const expr = signalInput.value;
        const sampleRate = 100;
        const duration = 2; // seconds
        const samples = duration * sampleRate;
        
        // Generate time domain signal
        let timeData = [];
        let labels = [];
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            labels.push(i);
            try {
                const scope = { x: t };
                timeData.push(math.evaluate(expr, scope));
            } catch (e) {
                console.error("Error evaluating expression:", e);
                timeData.push(0);
            }
        }
        
        timeDomainChart.data.labels = labels;
        timeDomainChart.data.datasets[0].data = timeData;
        timeDomainChart.data.datasets[0].label = `Signal: ${expr}`;
        timeDomainChart.update();
        
        // Simple FFT visualization (simplified for demo)
        const freqComponents = analyzeFrequencyComponents(expr);
        
        freqDomainChart.data.labels = freqComponents.frequencies;
        freqDomainChart.data.datasets[0].data = freqComponents.magnitudes;
        freqDomainChart.update();
    }

    // Simple frequency component analyzer (for demo purposes)
    function analyzeFrequencyComponents(expr) {
        // This is a simplified version that looks for sin(k*x) patterns
        const frequencies = [];
        const magnitudes = [];
        
        // Check for common frequency components
        const terms = expr.split('+').map(term => term.trim());
        
        terms.forEach(term => {
            const sinMatch = term.match(/sin\((\d+)\*x\)/);
            if (sinMatch) {
                const freq = parseInt(sinMatch[1]);
                const coeffMatch = term.match(/([\d\.]+)\*/);
                const coeff = coeffMatch ? parseFloat(coeffMatch[1]) : 1;
                
                frequencies.push(freq + " Hz");
                magnitudes.push(coeff);
            }
        });
        
        // If no specific frequencies found, show some defaults
        if (frequencies.length === 0) {
            frequencies.push("1 Hz", "3 Hz", "5 Hz");
            magnitudes.push(1, 0.3, 0.1);
        }
        
        return { frequencies, magnitudes };
    }

    updateFourierBtn.addEventListener('click', updateFourier);
    updateFourier(); // Initial update

    // Filter Section
    const filterTypeSelect = document.getElementById('filterType');
    const cutoffFreqSlider = document.getElementById('cutoffFreq');
    const cutoffValueSpan = document.getElementById('cutoffValue');
    const filterCtx = document.getElementById('filterChart').getContext('2d');
    
    let filterChart = new Chart(filterCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Input Signal',
                    borderColor: 'rgb(54, 162, 235)',
                    data: [],
                    fill: false
                },
                {
                    label: 'Filtered Signal',
                    borderColor: 'rgb(255, 99, 132)',
                    data: [],
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (samples)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amplitude'
                    },
                    min: -1,
                    max: 1
                }
            }
        }
    });

    function updateFilter() {
        const type = filterTypeSelect.value;
        const cutoff = parseFloat(cutoffFreqSlider.value);
        const sampleRate = 100;
        const duration = 1; // seconds
        const samples = duration * sampleRate;
        
        // Generate input signal (mix of frequencies)
        let inputSignal = [];
        let filteredSignal = [];
        let labels = [];
        
        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            labels.push(i);
            
            // Input signal with multiple frequencies
            const input = 0.5 * Math.sin(2 * Math.PI * 2 * t) + 
                          0.3 * Math.sin(2 * Math.PI * 5 * t) + 
                          0.2 * Math.sin(2 * Math.PI * 10 * t);
            
            inputSignal.push(input);
            
            // Simple filter simulation (not a real filter implementation)
            let filtered;
            switch(type) {
                case 'lowpass':
                    filtered = input * (1 / (1 + (t * 10 * cutoff)));
                    break;
                case 'highpass':
                    filtered = input * (1 - 1 / (1 + (t * 10 * cutoff)));
                    break;
                case 'bandpass':
                    filtered = input * (1 / (1 + Math.abs(t * 10 * (cutoff - 5))));
                    break;
                default:
                    filtered = input;
            }
            
            filteredSignal.push(filtered);
        }
        
        filterChart.data.labels = labels;
        filterChart.data.datasets[0].data = inputSignal;
        filterChart.data.datasets[1].data = filteredSignal;
        filterChart.data.datasets[1].label = `${type} filtered (cutoff: ${cutoff} Hz)`;
        filterChart.update();
    }

    cutoffFreqSlider.addEventListener('input', function() {
        cutoffValueSpan.textContent = this.value;
        updateFilter();
    });

    filterTypeSelect.addEventListener('change', updateFilter);
    updateFilter(); // Initial update
});
