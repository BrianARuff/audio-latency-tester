class BeepDetectorProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.threshold = 0.1; // Adjust threshold as needed
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const samples = input[0];

            for (let i = 0; i < samples.length; i++) {
                if (Math.abs(samples[i]) > this.threshold) {
                    this.port.postMessage('beep');
                    break;
                }
            }
        }
        return true;
    }
}

registerProcessor('beep-detector-processor', BeepDetectorProcessor);
