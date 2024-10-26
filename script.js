document.getElementById('ledForm').addEventListener('submit', function(event) {
    event.preventDefault();
    var mainEffect = document.getElementById('main-effect').value;
    var tailCode = document.getElementById('tail-code').value;
    
    if (tailCode !== "") {
        sendEffect(mainEffect, tailCode);
    } else {
        sendEffect(mainEffect);
    }
    //console.log('Data sent to board:', mainEffect, tailCode);
});

function bits_to_run_lengths_pulses(bit_list) {

    let run_lengths = [];
    let currentCount = 0;
    let currentBit = null;

    for (let i = 0; i < bit_list.length; i++) {
        if (bit_list[i] !== currentBit) {
            if (currentBit !== null) {
                run_lengths.push(currentCount);
            }
            currentCount = 1;
            currentBit = bit_list[i];
        } else {
            currentCount++;
        }
    }
    
    if (currentBit !== null) {
        run_lengths.push(currentCount);
    }

    return run_lengths;
}

function bits_to_arduino_string(bit_list) {

    let run_lengths = bits_to_run_lengths_pulses(bit_list);
    if (Math.max.apply(null, run_lengths) > 9) {
        throw new Error(`board can't accept over 9 of the same bit in a row.\n${bit_list}`);
    }
    
    let out = "[" + run_lengths.length + "]";
    out += run_lengths.map(i => parseInt(i)).join("");
    //console.log("Out", out);
    return out + ",";
}

async function sendEffect(MAIN_EFFECT, TAIL_CODE) {
    let effect_bits;
    if (base_color_effects.hasOwnProperty(MAIN_EFFECT)) {
        effect_bits = base_color_effects[MAIN_EFFECT];
        //console.log("Effect MAIN", effect_bits);
        if (TAIL_CODE) {
            if (tail_codes.hasOwnProperty(TAIL_CODE)) {
                //console.log("Tail effect", tail_codes[TAIL_CODE]);
                effect_bits = effect_bits.concat(tail_codes[TAIL_CODE]);
                //console.log("Effect with TAIL", JSON.stringify(effect_bits));
            } else {
                throw new Error("Invalid tail code name. See tail_codes in effect_definitions.py for options.");
            }
        }
    } else if (special_effects.hasOwnProperty(MAIN_EFFECT)) {
        effect_bits = special_effects[MAIN_EFFECT];
        if (TAIL_CODE) {
            throw new Error("Tail code effects only supported on simple color effects found in base_color_effects of effect_definitions.py. Set TAIL_CODE to None or choose a MAIN_EFFECT from base_color_effects (instead of special_effects).");
        }
    } else {
        throw new Error("Invalid MAIN_EFFECT. See base_color_effects and special_effects in effect_definitions.py for options.");
    }
    //console.log("Effect bits", effect_bits);
    const arduino_string_ver = bits_to_arduino_string(effect_bits);
    //console.log("board string", arduino_string_ver);
    await writer.write(new TextEncoder().encode(arduino_string_ver));
    await new Promise(resolve => setTimeout(resolve, 100));
    // write to the serial port as bytes(arduino_string_ver, 'utf-8')
    //console.log("Command sent!");
}

document.addEventListener("DOMContentLoaded", function() {
    let selectElement = document.getElementById("main-effect");
    // Function to add options to select element
    function addOptions(effectObject) {
        for (var key in effectObject) {
            if (effectObject.hasOwnProperty(key)) {
                var option = document.createElement("option");
                option.text = key;
                option.value = key;
                selectElement.appendChild(option);
            }
        }
    }

    // Add options from base_color_effects
    addOptions(base_color_effects);
    // Add options from special_effects
    addOptions(special_effects);
});

async function blinkColors() {
    for (let i = 0; i < Object.keys(base_color_effects).length; i++) {
        sendEffect(Object.keys(base_color_effects)[i]);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

fadecolors = [
    'RED', 'GREEN', 'GREEN_DIM', 'LIGHT_GREEN', 'YELLOWGREEN', 'BLUE', 'LIGHT_BLUE', 'DIM_BLUE', 'MAGENTA', 'YELLOW', 'PINK', 'ORANGE', 'REDORANGE', 'WHITISH', 'TURQUOISE' 
]
async function fadeColors() {
    for (let i = 0; i < fadecolors.length; i++) {
        sendEffect(fadecolors[i], 'FADE_2');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
