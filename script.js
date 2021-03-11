const c_LISTEN      = 1;
const c_CLOSE       = 2;
const c_CONNECT     = 3;
const c_SEND        = 4;
const c_RECEIVE_SYN = 5;
const c_RECEIVE_ACK = 6;
const c_RST         = 7;
const c_FIN         = 8;
const c_TIMEOUT     = 9;
const combo_syn_ack = 10;
const combo_fin_ack = 11;

const e_CLOSED       = 1;
const e_LISTEN       = 2;
const e_SYN_RECEIVED = 3;
const e_SYN_SENT     = 4;
const e_ESTABILISHED = 5;
const e_FIN_WAIT_1   = 6;
const e_FIN_WAIT_2   = 7;
const e_CLOSING      = 8;
const e_CLOSE_WAIT   = 9;
const e_LAST_ACK     = 10;
const e_TIME_WAIT    = 11;



currentState = e_CLOSED;
highlightCurrentState(currentState)
instructions = []




function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


const transition = {
	[e_CLOSED]: {
		[c_LISTEN]: [e_LISTEN, 1],	
		[c_CONNECT]: [e_SYN_SENT, 3],
	},

	[e_LISTEN]: {
		[c_SEND]: [e_SYN_SENT, 7],
		[c_RECEIVE_SYN]: [e_SYN_RECEIVED, 5],
		[c_CLOSE]: [e_CLOSED, 2]
	},

	[e_SYN_RECEIVED]: {
		[c_RST]: [e_LISTEN, 6],
		[c_RECEIVE_ACK]: [e_ESTABILISHED, 9],
		[c_CLOSE]: [e_FIN_WAIT_1, 10],
	},

	[e_SYN_SENT]: {
		[c_RECEIVE_SYN]: [e_SYN_RECEIVED, 8],
		[c_CLOSE]: [e_CLOSED, 4],
		[combo_syn_ack]: [e_ESTABILISHED, 11], // SYN + ACK: ESTABLISHED (Como Combar dois comandos)
	},

	[e_ESTABILISHED]: {
		[c_CLOSE]: [e_FIN_WAIT_1, 12],
		[c_FIN]: [e_CLOSE_WAIT, 13],	
	},

	[e_FIN_WAIT_1]: {
		[c_FIN]: [e_CLOSING, 14],
		[combo_fin_ack]: [e_TIME_WAIT, 15], //COMBO FIN + ACK
		[c_RECEIVE_ACK]: [e_FIN_WAIT_2, 16],
	},

	[e_FIN_WAIT_2]: {
		[c_FIN]: [e_TIME_WAIT, 17],
	},

	[e_CLOSING]: {
		[c_RECEIVE_ACK]: [e_TIME_WAIT, 18],
	},

	[e_CLOSE_WAIT]: {
		[c_CLOSE]: [e_LAST_ACK, 20],
	},

	[e_LAST_ACK]: {
		[c_RECEIVE_ACK]: [e_CLOSED, 21],
	},

	[e_TIME_WAIT]: {
		[c_TIMEOUT]: [e_CLOSED, 19],
	}
}


function red(num){
	parsedNum = String(num);
	str = "line"+parsedNum+"-color";

	elements = document.getElementsByClassName(str);
	len = elements.length

	if(elements[0].style.backgroundColor === ""){
		for(i = 0; i < len; i++){
			elements[i].style.backgroundColor = "red"
		}
	}

	else if(elements[0].style.backgroundColor === "red"){
		for(i = 0; i < len; i++){
			elements[i].style.backgroundColor = ""
		}
	}
	
}


function removeFirstLogElement(){
	document.getElementsByClassName("log-line")[0].remove()
}

async function removeLogById(id){
	elements = document.getElementsByClassName("log-line");
	len = elements.length;
	index = 0;

	for(i = 0; i < len; i++){
		if(elements[i].id === id) index = i;
	}

	instructions.splice(index, 1);
	document.getElementById(id).remove();
}

function addLog(text){
	parent = document.getElementsByClassName("pending-commands")[0]

	len = document.getElementsByClassName("log-line").length
	id = len + 1

	var child = document.createElement('span')
	child.className="log-line"
	child.id = id;
	child.innerText = text

	child.addEventListener("click", async () => await removeLogById(event.target.id))

	parent.appendChild(child)
}


function tryCombo(inst, instructions){
	if((inst === c_RECEIVE_ACK && instructions[0] === c_RECEIVE_SYN) || (inst === c_RECEIVE_SYN && instructions[0] === c_RECEIVE_ACK)){

		inst = combo_syn_ack
		instructions.shift(); //remove the first element
		removeFirstLogElement();
	}

	else if((inst === c_FIN && instructions[0] === c_RECEIVE_ACK) || (inst === c_RECEIVE_ACK && instructions[0] === c_FIN)){

		inst = combo_fin_ack;
		instructions.shift(); //remove the first element
		removeFirstLogElement();
	}



	return inst
}



function highlightCurrentState(currentState){
	parsedState = String(currentState);

	str = "state"+parsedState

	// Enable/Disable the state
	if(document.getElementsByClassName(str)[0].style.backgroundColor === ""){
		document.getElementsByClassName(str)[0].style.backgroundColor = "Yellow"
	}
	else {
		document.getElementsByClassName(str)[0].style.backgroundColor = ""
	}
}


async function runInstructions(instructions, currentState){
	len = instructions.length;

	if(instructions === []) return;

	while(instructions !== []){
		sleepTime = 400

		inst = instructions.shift();
		removeFirstLogElement();

		inst = tryCombo(inst, instructions);

		[newState, lineRef] = transition[currentState][inst];

		await sleep(sleepTime + 200);
		highlightCurrentState(currentState);
		await sleep(sleepTime);
		red(lineRef)
		await sleep(sleepTime);
		red(lineRef)
		await sleep(sleepTime);
		highlightCurrentState(newState);
		


		currentState = newState;
	}
}





document.getElementsByClassName("btn-LISTEN")[0].addEventListener(       'click', () => {instructions.push(c_LISTEN); addLog("LISTEN", instructions); } );
document.getElementsByClassName("btn-CLOSE")[0].addEventListener(        'click', () => {instructions.push(c_CLOSE);  addLog("CLOSE", instructions); } );
document.getElementsByClassName("btn-CONNECT")[0].addEventListener(      'click', () => {instructions.push(c_CONNECT); addLog("CONNECT", instructions); } );
document.getElementsByClassName("btn-SEND")[0].addEventListener(         'click', () => {instructions.push(c_SEND); addLog("SEND", instructions); } );
document.getElementsByClassName("btn-RCV-SYN")[0].addEventListener(      'click', () => {instructions.push(c_RECEIVE_SYN); addLog("RECEIVE SYN", instructions); } );
document.getElementsByClassName("btn-RCV-ACK")[0].addEventListener(      'click', () => {instructions.push(c_RECEIVE_ACK); addLog("RECEIVE ACK", instructions); } );
document.getElementsByClassName("btn-RST")[0].addEventListener(          'click', () => {instructions.push(c_RST); addLog("RST", instructions); } );
document.getElementsByClassName("btn-FIN")[0].addEventListener(          'click', () => {instructions.push(c_FIN); addLog("FIN", instructions); } );
document.getElementsByClassName("btn-TIMEOUT")[0].addEventListener(      'click', () => {instructions.push(c_TIMEOUT); addLog("TIMEOUT", instructions); } );
document.getElementsByClassName("run-instructions")[0].addEventListener( 'click', () => runInstructions(instructions, currentState) );


function asd(){
	console.log(instructions)
}