


var svgDoc1;
var svgDoc2;

var delay;
var playing = false;

newStyles = "";

var AEC = 0;
var nAEC = 0;
var CAEC = 0;

var nCAS = 0;
var nRAS = 0;
var nCASRAM = 1;
var last_nRAS = 0;
var last_nCASRAM = 1;

// D0..D11
var D = [0,0,0,0,0,0,0,0,0,0,0,0]
var DBUS_colour = 0;	// 0..99
//var DBUS = 0;
var DATA = 0;

var RW = 1;
var nIRQ = 1;
var RESET = 0;
var nRESET = 1;

var COLORCLOCK = 0;
var DOTCLOCK = 0;
var Ph0 = 0;
var Ph2 = 0;

var nDMA = 1;
var BA = 1;
var RDY = 0;

var nHIRAM = 1;
var nLORAM = 1;
var nCHAREN = 1;


var CPU_ADDRESS = 0xD000;
var VIC_ADDRESS = 0x0400;
var BUS_ADDRESS = 0;

var A = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
var ABUS_colour = 0;	// 0..99

var MA = [0,0,0,0,0,0,0,0]
var row_address = 0;
var col_address = 0;

var U26latch = [0,0,0,0,0,0,0,0];

var nEXROM = 1;
var nGAME = 1;

var nROMH = 1;
var nROML = 1;
var nIO = 1;
var nCOLOR = 1;
var nCOLORRAM = 0;
var nSID = 1;
var nVIC = 1;
var nBASIC = 1;
var nKERNAL = 1;
var nCHAROM = 1;
var GRW = 1;

var U14_Y3 = 0;
var U14_Y2 = 0;
var VA6 = 0;
var VA7 = 0;
var nVA14 = 1;
var nVA15 = 1;

var CIAS = 1;
var CIA1 = 1;
var CIA2 = 1;
var IO1 = 1;
var IO2 = 1;
var nIO = 0;


var CSS_shapes = [
	"U19", "U12", "U26", "U6", "U3", "U4", "U5", 
	"U17", "U18", "U14", "U15a", "U15b", "U13", "U25", "U16",
	"C105", "C24",
 ];

// the chips
var U3 = 0;
var U4 = 0;
var U5 = 0;
var U6 = 0;
var U15a = 0;
var U15b = 0;
var U12 = 0;

var U14 = 0;
var U19 = 0;
var U13 = 0;
var U25 = 0;
var U26 = 0;
var U16 = 0;
var U17 = 1;

var C105 = 0;
var C24 = 0;

// list of signals to CSS update
var CSS_digital_signals = [ 
	"AEC", "nVA14", "nCAS", "nRAS", "RW", "nAEC", "RESET", "nRESET", "Ph2",
	"COLORCLOCK", "DOTCLOCK", "nDMA", "nIRQ", "BA", "RDY", "nHIRAM", "nLORAM", "nCHAREN", "CAEC",
	"nEXROM", "nGAME", "nROMH", "nROML", "nIO", "nCOLOR", "nSID",
	"nVIC", "nVA15", "nCASRAM", "nBASIC", "nKERNAL", "nCHAROM", "GRW", "U14_Y3", "U14_Y2", 
	"Ph0", "IO2", "CIA1", "CIA2", "IO1", "CIAS", "VA7", "VA6", "nCOLORRAM"
];




var last_master_clock = 15;
var master_clock = 0;

var pla_rom = [];
var kernal_rom = [];
var basic_rom = [];
var chargen_rom = [];
var dram = [];
var colour_ram = [];
var vic_regs = [];
var sid_regs = [];
var cia1_regs = [];
var cia2_regs = [];

function init_c64() {
	svgDoc1 = svgObject1.contentDocument;
	svgDoc2 = svgObject2.contentDocument;

// setup roms and allocate memory like devices
	pla_rom = load_binary_resource("roms/PLA.BIN");
	kernal_rom = load_binary_resource("roms/kernal");
	basic_rom = load_binary_resource("roms/basic");
	chargen_rom = load_binary_resource("roms/chargen");
	dram = Array(65536).fill(0x42);
	colour_ram = Array(1024).fill(14);
	vic_regs = Array(64).fill(0);
	sid_regs = Array(32).fill(0);		// 29 really
	cia1_regs = Array(16).fill(0);
	cia2_regs = Array(16).fill(0);

}

var playTimer;
function play() {
	clearInterval(playTimer);
	var speed = check_speed(0);
	
	delay = 2048/(1<<speed);
//	if (speed == 9) delay = 0;
	playTimer = setInterval(step_simulation, delay);
	playing = true;
}

function stop() {
	clearInterval(playTimer);
	playing = false;
}

function speed_change(delta) {
	var speed = check_speed(delta);

	if (playing) play();
}

function check_speed(delta) {
	var speed = parseInt(document.getElementById("speed").value) + delta;
	if (speed < 0) { speed = 0; }
	if (speed > 9) { speed = 9; }
	document.getElementById("speed").value = speed;
	return speed;
}

function step_simulation(skip) {
        if ( typeof skip === 'undefined' || skip === null) {
		skip = 1;
	}
	master_clock += skip;
	master_clock &= 0xf;
	document.getElementById("master_clock").value = master_clock;
	update_all();
}

function update_all() {
	if (master_clock == 0 && last_master_clock == 15) {
		CPU_ADDRESS += 0x100;
		VIC_ADDRESS += 1;
	}
	last_master_clock = master_clock;

	newStyles = "";
	clear_lines();
	update_clock_lines();
	update_lines();
	paint_page();
}

// Pre clear most of the lines so they "float" if not explicitly set
function clear_lines() {
	U14_Y3 = -1;
	U14_Y2 = -1;

	if (RW == 1) {
		DATA = -1;
		for (var i=0; i<=11; i++) {
			D[i] = -1;
		}
	} else {
		set_data_lines(DATA);
	}
	for (var i=0; i<=15; i++) {
		A[i] = -1;
	}
	for (var i=0; i<=7; i++) {
		MA[i] = -1;
	}
	nRESET = -1;
}



// This does all the CSS stylesheet updates
function paint_page() {

// mostly chip outlines
	for (var i in CSS_shapes) {
		change_CSS_chip('.'+CSS_shapes[i], window[CSS_shapes[i]]) ;
	}

// mostly lots of individual signals
	for (var i in CSS_digital_signals) {
		change_CSS_digital_signal('.'+CSS_digital_signals[i], window[CSS_digital_signals[i]]) ;
	}

// address lines and address bus
	for (var i=0; i<=15; i++) {
		change_CSS_digital_signal('.A'+i, A[i]);
	}
	change_CSS_analog_signal('.ABUS', ABUS_colour);

// multiplexed address lines 
	for (var i=0; i<=7; i++) {
		change_CSS_digital_signal('.MA'+i, MA[i]);
	}

// data lines and data bus
	var any_floating = false;
	for (var i=0; i<=11; i++) {
		change_CSS_digital_signal('.D'+i, D[i]);
		if (i<=7 && D[i] == -1) { any_floating = true; }
	}

	var red = ("00" + (+DATA).toString(16)).substr(-2);
	var green = ("00" + (+(255-DATA)).toString(16)).substr(-2);
	var blue = ("00");
	if (any_floating) {
		change_CSS_bus('.DBUS', 'none');
	} else {
		change_CSS_bus('.DBUS', '#' + red + green + blue);
	}


// update text fields
	document.getElementById("CPU_ADDRESS").value = toHex(CPU_ADDRESS, 4);
	document.getElementById("VIC_ADDRESS").value = toHex(VIC_ADDRESS, 4);
	document.getElementById("BUS_ADDRESS").value = toHex(BUS_ADDRESS, 4);
	if (DATA >= 0) {
		document.getElementById("DATA").value = toHex(DATA, 2);
//	} else {
//		document.getElementById("DATA").value = 'Hi-Z';
	}
	if (AEC == 1) {
		document.getElementById("CPU_ADDRESS").style.backgroundColor = C64Yellow;
		document.getElementById("VIC_ADDRESS").style.backgroundColor = "white";
	} else {
		document.getElementById("CPU_ADDRESS").style.backgroundColor = "white";
		document.getElementById("VIC_ADDRESS").style.backgroundColor = C64Yellow;
	}

// update input selectors
	var input_selectors = [
		"_nHIRAM", "_nLORAM", "_nCHAREN", "_nEXROM",
		"_nGAME", "_RW", "_BA", "_nVA14", "_nVA15",
	];

	for (var i in input_selectors) {
		var id=input_selectors[i];
		if (id.substring(0, 1) == '_') { 
			name = id.substring(1);

			if (window[name] == 0) {
				document.getElementById(id).style.backgroundColor = C64Green;	//"#0c0";
				document.getElementById(id).style.color = "#eee";
			} else {
				document.getElementById(id).style.backgroundColor = C64LightRed;	//"#c00";
				document.getElementById(id).style.color = "#eee";
			}
		}
	}

// update all the other styles in one hit
	id = "painted";

	var newStyleElement1 = svgDoc1.createElementNS("http://www.w3.org/2000/svg", "style");
	newStyleElement1.id = id;
	newStyleElement1.textContent = newStyles;

	var newStyleElement2 = svgDoc2.createElementNS("http://www.w3.org/2000/svg", "style");
	newStyleElement2.id = id;
	newStyleElement2.textContent = newStyles;

	var styleElement = svgDoc1.getElementById(id);
	if ( typeof styleElement === 'undefined' || styleElement === null) {
		svgDoc1.getElementById("myStyle").appendChild(newStyleElement1);
	} else {
		svgDoc1.getElementById("myStyle").replaceChild(newStyleElement1, styleElement);
	}

	var styleElement = svgDoc2.getElementById(id);
	if ( typeof styleElement === 'undefined' || styleElement === null) {
		svgDoc2.getElementById("myStyle").appendChild(newStyleElement2);
	} else {
		svgDoc2.getElementById("myStyle").replaceChild(newStyleElement2, styleElement);
	}

}


function update_clock_lines() {
	DOTCLOCK = (master_clock & 0x1 );

	if (master_clock <= 7) {
		Ph0 = 0;
		Ph2 = 0;
		AEC = 0;
		U19 = 1;
	} else {
		Ph0 = 1;
		Ph2 = 1;
		AEC = 1;
		U19 = 0;
	}

	if (master_clock%8 <= 0) {
		nRAS = 1;
	} else {
		nRAS = 0;
	}

	if (master_clock%8 <= 3) {
		nCAS = 1;
	} else {
		nCAS = 0;
	}

}

function set_data_lines(data) {
	DATA	= data;
	for (var i=0; i<=7; i++) {
		D[i]	= (data>>i) & 0x01;
	}
}

function set_A_lines(addr, start, end) {
	for (var i=start; i<=end; i++) {
		A[i]	= (addr>>i) & 0x01;
	}

	var any_floating = false;
	ABUS_colour = 0;
	for (var i=0; i<=15; i++) {
		if (A[i] == 1) {
			ABUS_colour++;
		}
		if (A[i] == -1) {
			any_floating = true;
		}
	}
	if (any_floating) {
		ABUS_colour = -1;
	} else {
		ABUS_colour *= 99/16;	// 0..99
	}
}

function update_lines() {

// U8 7406
	if (AEC == 0) {		// VIC bus cycle
		nAEC = 1;
	} else {		// CPU bus cycle
		nAEC = 0;
	}

// U8 7406 pin 12 near 556 power on reset
// Trigger, The negative input to comparator No 1. A negative pulse on this pin “sets” the internal 
// Flip-flop when the voltage drops below 1/3Vcc causing the output to switch from a “LOW” to a “HIGH” state.

// Threshold, The positive input to comparator No 2. This pin is used to reset the Flip-flop when 
// the voltage applied to it exceeds 2/3Vcc causing the output to switch from “HIGH” to “LOW” state. 
// This pin connects directly to the RC timing circuit.

// Discharge, The discharge pin is connected directly to the Collector of an internal NPN transistor which is 
// used to “discharge” the timing capacitor to ground when the output at pin 3 switches “LOW”.

/*
	C105	1M	104pF	= 100K * 1uF = 0.1S	trigger pulse
	C24	47k	106pF	= 470K * 1uF = 0.47S	reset pulse
*/

	if (RESET == 0) {
		nRESET = 1;
	} else {
		nRESET = 0;
	}

// Address bus lines
	if (AEC == 1) {		
		// CPU bus cycle
		BUS_ADDRESS = CPU_ADDRESS;
		set_A_lines(BUS_ADDRESS, 0, 15);
	} else {
		// VIC bus cycle
		BUS_ADDRESS = VIC_ADDRESS;
		BUS_ADDRESS |= 0xf000		// pullup resistors
		set_A_lines(BUS_ADDRESS, 0, 15);

		if (master_clock >= 2) {		// high byte for /CAS
			for (var i=0; i<=5; i++) {
				MA[i]	= (VIC_ADDRESS>>(i+8)) & 0x01;
			}
			VA6	= (VIC_ADDRESS>>14) & 0x01;
			VA7	= (VIC_ADDRESS>>15) & 0x01;	 // are VA6,7 valid when /CAS is low??
		}

		if (master_clock <= 1) {			// low byte for /RAS
			for (var i=0; i<=5; i++) {
				MA[i]	= (VIC_ADDRESS>>i) & 0x01;
			}
			VA6	= (VIC_ADDRESS>>6) & 0x01;
			VA7	= (VIC_ADDRESS>>7) & 0x01;
		}
	}

// U16 4066 near color ram
	if (AEC == 1) {
		U16 = 1;
	} else {
		U16 = 0;
	}

// U13/U25 74LS257
	if (nAEC == 0) {
		U25 = true;
		U13 = true;
		if (nCAS == 0) {
			for (var i=0; i<=7; i++) {
				MA[i] = A[i+8];
			}
		} else {
			for (var i=0; i<=7; i++) {
				MA[i] = A[i];
			}
		}
	} else {
		U25 = false;
		U13 = false;
	}

// U14 74ls258
	if (AEC == 0) {
		U14 = true;
		U14_Y3 = (1-VA7);
		U14_Y2 = (1-VA6);
		if (nCAS == 1) {
			MA[7] = (1-U14_Y3);
			MA[6] = (1-U14_Y2);
		} else {
			MA[7] = (1-nVA15);
			MA[6] = (1-nVA14);
		}
	} else {
		U14 = false;
	}


// U26 74ls373
// we model 2 parts - the internal latch and then the output enable
	if (nRAS == 1) {
		for (var i=0; i<=7; i++) {
			U26latch[i] = MA[i];
		}
	}
	if (AEC == 0) {
		for (var i=0; i<=7; i++) {
			A[i] = U26latch[i];
		}
		U26 = true;
	} else {
		U26 = false;
	}

// lookup the PLA rom table array
	set_pla_output( pla_rom[build_pla_addr()] ) ;

// U15 74ls139 IO decoder
	U15a = U15b = false;
	nVIC = nSID = nCOLOR = CIAS = 1;
	CIA1 = CIA2 = IO1 = IO2 = 1;

	if (nIO == 0) {		// $Dxxx
		U15a = true;
		var tmp = A[11]*2 + A[10];
		if (tmp==0) { nVIC = 0; }	// $D0..D3
		if (tmp==1) { nSID = 0; }	// $D4..D7
		if (tmp==2) { nCOLOR = 0; }	// $D8..DB
		if (tmp==3) { CIAS = 0; }	// $DC..DF
	}
	if (CIAS == 0) {
		U15b = true;
		var tmp = A[9]*2 + A[8];
		if (tmp==0) { CIA1 = 0; }	// $DC
		if (tmp==1) { CIA2 = 0; }	// $DD
		if (tmp==2) { IO1 = 0; }	// $DE
		if (tmp==3) { IO2 = 0; }	// $DF
	}


// random AND gates... U27
	CAEC = AEC & nDMA;
	RDY = BA & nDMA;
	nCOLORRAM = AEC & nCOLOR;

// light up the chips...
	U19 = U18 = U12 = U3 = U4 = U5 = U6 = 0;
	if (nVIC == 0) { U19 = 1 };
	if (nSID == 0) { U18 = 1 };
	if (nBASIC == 0) U3 = 1;
	if (nKERNAL == 0) U4 = 1;
	if (nCHAROM == 0) U5 = 1;

// respond to reads from chips 
// but delay setting the data bus until master_clock 6,7,14,15
// this simulates an access time of ~180nS

	if (RW == 1 && master_clock%8 >= 6) {
		if (nBASIC == 0) set_data_lines( basic_rom[BUS_ADDRESS & 0x1fff] ) ;
		if (nKERNAL == 0) set_data_lines( kernal_rom[BUS_ADDRESS & 0x1fff] ) ;
		if (nCHAROM == 0) set_data_lines( chargen_rom[BUS_ADDRESS & 0x0fff] ) ;
	}

// DRAM emulation
	if (nRAS == 1 && nCASRAM == 1) {
		document.getElementById("ROW_ADDRESS").value = '';
		document.getElementById("COL_ADDRESS").value = '';
	}
	if (last_nRAS == 1 && nRAS == 0 && nCASRAM == 1) {
		row_address = 0;
		for (var i=0; i<=7; i++) {
			if (MA[i] >= 0) row_address |= MA[i]<<i;
		}
		document.getElementById("ROW_ADDRESS").value = toHex( row_address, 2);
	}

	if (last_nCASRAM == 1 && nCASRAM == 0) {
		col_address = 0;
		for (var i=0; i<=7; i++) {
			if (MA[i] >= 0) col_address |= MA[i]<<i;
		}
		document.getElementById("COL_ADDRESS").value = toHex( col_address, 2);
	}

	if ( nCASRAM == 0) {
		U12 = 1;

		if ( RW == 1 && master_clock%8 >= 6) {
			set_data_lines ( dram[ (col_address*256 + row_address) & 0xffff] );
		}
		if ( RW == 0 && master_clock%8 == 7) {
			dram[ (col_address*256 + row_address) & 0xffff] =  DATA;
		}
	}
	last_nRAS = nRAS;
	last_nCASRAM = nCASRAM;

// D8..D11 
// U16 4066 near color ram
// CPU write cycle
	if (AEC == 1 && ( RW == 0 || nCOLORRAM == 1) ) {		
		if (D[0] >= 0) D[8] = D[0];
		if (D[1] >= 0) D[9] = D[1];
		if (D[2] >= 0) D[10] = D[2];
		if (D[3] >= 0) D[11] = D[3];
	}

	if (nCOLORRAM == 0) {
		U6 = 1
		if (GRW == 1 && master_clock%8 >= 6) {
			var val = colour_ram[BUS_ADDRESS & 0x03ff];
			D[8] = (val>>0) & 0x01;
			D[9] = (val>>1) & 0x01;
			D[10] = (val>>2) & 0x01;
			D[11] = (val>>3) & 0x01;
		}
		if (GRW == 0 && master_clock%8 >= 6) {
			var val = 0;
			val |= D[8] << 0;
			val |= D[9] << 1;
			val |= D[10] << 2;
			val |= D[11] << 3;
			colour_ram[BUS_ADDRESS & 0x03ff] = val ;
		}
	};

// D8..D11 
// U16 4066 near color ram
// CPU read cycle
		if (AEC == 1 && RW == 1 ) {		
//			DATA = 0;
			if (D[8] >= 0) { 
				D[0] = D[8];
				DATA |= D[0]<<0
			}
			if (D[9] >= 0) {
				D[1] = D[9];
				DATA |= D[1]<<1
			}
			if (D[10] >= 0) {
				D[2] = D[10];
				DATA |= D[2]<<2
			}
			if (D[11] >= 0) {
				D[3] = D[11];
				DATA |= D[3]<<3
			}

		}
}

function load_binary_resource(url) {
	var byteArray = [];
	var req = new XMLHttpRequest();
	req.open('GET', url, false);
	if (req.overrideMimeType) {
		req.overrideMimeType('text\/plain; charset=x-user-defined');
	}
	req.send(null);
	if (req.status != 200) return byteArray;
		for (var i = 0; i < req.responseText.length; ++i) {
		byteArray.push(req.responseText.charCodeAt(i) & 0xff)
	}
	return byteArray;
}

/* http://personalpages.tds.net/~rcarlsen/cbm/c64/eprompla/readpla.jpg

EPROM	PLA	FUNCTION
A15	I13	/GAME
A14	I8	A12
A13	I9	BA
A12	I7	A13
A11	I12	/EXROM
A10	I14	VA13	// == MA5
A9	I11	RW
A8	I10	/AEC
A7	I6	A14
A6	I5	A15
A5	I4	/VA14
A4	I3	/CHAREN
A3	I2	/HIRAM
A2	I1	/LORAM
A1	I0	/CAS
A0	I15	VA12	// == MA4


D7	F7	/ROMH
D6	F0	/CASRAM
D5	F1	/BASIC
D4	F2	/KERNAL
D3	F3	/CHAROM
D2	F4	GR/W
D1	F5	/IO
D0	F6	/ROML


*/

function set_pla_output(data) {
	nROML	= (data>>0) & 0x01;
	nIO	= (data>>1) & 0x01;
	GRW	= (data>>2) & 0x01;
	nCHAROM	= (data>>3) & 0x01;
	nKERNAL	= (data>>4) & 0x01;
	nBASIC	= (data>>5) & 0x01;
	nCASRAM	= (data>>6) & 0x01;
	nROMH	= (data>>7) & 0x01;
}

function build_pla_addr() {
	var result =  (
		MA[4]	<< 0 
	|	nCAS	<< 1
	|	nLORAM	<< 2
	|	nHIRAM	<< 3
	| 	nCHAREN	<< 4
	|	nVA14	<< 5
	|	A[15]	<< 6
	|	A[14]	<< 7
	|	nAEC	<< 8
	|	RW	<< 9
	|	MA[5]	<< 10
	|	nEXROM	<< 11
	|	A[13]	<< 12
	|	BA	<< 13
	|	A[12]	<< 14
	|	nGAME	<< 15
	);
//	alert('build_pla_addr: ' + result);
	return(result);
}

////////////////////////////////////////////////////////////////////////////////////////////
//		page element change handlers

function set_addr(id) {
	var val = document.getElementById(id).value;
        var res = val.match( /^\$?([0-9A-Fa-f]{1,4})$/ ) ;

	if ( res ) {
		//alert ("set_var got id: " + id + " result: " + res[1] );
		window[id] = parseInt('0x' + res[1]);
		if (id == 'DATA') set_data_lines(DATA);
		update_all();
	} else {
		alert ("invalid address : " + val );
		document.getElementById(id).value = '$' + window[id].toString(16);
	}
}

function addr_change(id, delta) {
	if (id == 'CPU_ADDRESS' || id == 'VIC_ADDRESS') {
		window[id] = (window[id] + delta) & 0xffff ;
		update_all();
	}
}


function set_signal_checkbox(id, checked) {

	var name = document.getElementById(id).name;
	var val = document.getElementById(id).value;

        if ( typeof window[name] === 'undefined' || window[name] === null) {
		alert ('set_sig got id: ' + id + ' is invalid');
	} else {
		if (checked) {
			window[name] = 1;
		} else {
			window[name] = 0;
		}
	}
	update_all();
}

function set_signal(id) {
	var name;
	if (id.substring(0, 1) == '_') { 
		name = id.substring(1);
		if ( typeof window[name] === 'undefined' || window[name] === null) {
			alert ('set_sig2 id: ' + id + ' name: ' + name + ' is invalid');
		} else {
			if (window[name] == 1) {
				window[name] = 0;
//				document.getElementById(id).style.backgroundColor = C64Green;	//"#0c0";
			} else {
				window[name] = 1;
//				document.getElementById(id).style.backgroundColor = C64LightRed;	//"#c00";
			}
			update_all();
		}
	}

}


////////////////////////////////////////////////////////////////////////////////////////////
//		CSS fiddling functions to light stuff up

function change_CSS_digital_signal(id, state){

	var colour = "stroke: none;";
	var width = "stroke-width:5;";

	if (state == 0) {
		colour = "stroke: "+C64Green+";";	//#0C0;";	// 282
		width = "stroke-width:6;";
	}
	if (state == 1) {
		colour = "stroke: "+C64LightRed+";";	//#C00;";	// D55
		width = "stroke-width:6;";
	}
	newStyles += id + " { " + colour + width + "}\n";
}

function change_CSS_analog_signal(id, value){

	var red = parseInt(value * 191/99);	// colours 00-c0
	var green = 191-red;

	red = ("00" + (+red).toString(16)).substr(-2);
	green = ("00" + (+green).toString(16)).substr(-2);
	var blue = ("00");

	var colour = "stroke: #" + red + green + blue + ";";
	var width = "stroke-width:10;";
	if (value == -1) {
		colour = "stroke: none;";
		width = "stroke-width:10;";
	}

	newStyles += id + " { " + colour + width + "}\n";
}

function change_CSS_chip(id, state){

	var fill = "fill: "+C64Blue+";";	//#F2F;";
	var opacity = "fill-opacity:0.00;";

	if (state == true) {
		opacity = "fill-opacity:0.45;";
	}
	newStyles += id + " { " + fill + opacity + "}\n";
}

function change_CSS_bus(id, colour_str){

	var colour = "stroke: " + colour_str + ";";
	var width = "stroke-width:10;";

	newStyles += id + " { " + colour + width + "}\n";
}



////////////////////////////////////////////////////////////////////////////////////////////
//		Boring stuff below here....

// C64 palette colours

var	C64Black	= '#000';
var	C64White	= '#fff';
var	C64Red		= '#813338';
var	C64Cyan		= '#75CEC8';
var	C64Purple	= '#8e3c97';
var	C64Green	= '#56ac4d';
var	C64Blue		= '#2e2c9b';
var	C64Yellow	= '#edf171';
var	C64Orange	= '#8e5029';
var	C64Brown	= '#553800';
var	C64LightRed	= '#c46c71';
var	C64DarkkGrey	= '#4a4a4a';
var	C64MediumGrey	= '#7b7b7b';
var	C64LightGreen	= '#a9ff9f';
var	C64LightBlue	= '#706deb';
var	C64LightGrey	= '#b2b2b2';

function toHex(number, digits) {
	return '$' + ("0000" + (+number).toString(16)).substr(-digits);
}

