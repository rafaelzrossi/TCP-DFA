// Enum dos comandos do sistema.
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

// Enum dos estados do sistema.
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





// Função de sleep.
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}



/* 

	Objeto de transição de estados.
 	
	Toda transição de estado retorna o novo estado, e a linha que deve ser colorida para sair
	do estado atual para o novo estado.

*/ 
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



// Colore/Descolore uma linha de transição de estado de vermelho.
function red(num){
	//Forma a string que representa a classe da linha.
	parsedNum = String(num);
	str = "line"+parsedNum+"-color";


	//Extrai a lista de linhas com essa classe e sua quantidade.
	elements = document.getElementsByClassName(str);
	len = elements.length


	//Itera todas as linhas colorindo elas ou removendo sua cor.
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



//Remove o primeiro elemento da lista de logs.
function removeFirstLogElement(){
	elements = document.getElementsByClassName("log-line");

	if(elements !== undefined){
		elements[0].remove()
	}
}



//Remove elemento da lista de log e da lista de instruções.
async function removeLogById(id){
	//Extrai todos os logs existentes e sua quantidade.
	elements = document.getElementsByClassName("log-line");
	len = elements.length;


	index = 0; //Index representa o indice do log no vetor de instruções.


	//Itera o vetor elements, buscando o elemento a ser removido.
	for(i = 0; i < len; i++){
		if(elements[i].id === id) index = i; //Ao encontrar, define o seu indice.
	}


	//Remove o log da lista de log e da lista de instruções a serem executadas.
	instructions.splice(index, 1);
	document.getElementById(id).remove();
}



//Adiciona a instrução no log de instruções pendentes para execução.
function addLog(text){

	//Referência para a div onde os logs são adicionados.
	parent = document.getElementsByClassName("pending-commands")[0]


	//Define o id do log como o tamanho do vetor mais 1. (os ids variam de 1-n).
	len = document.getElementsByClassName("log-line").length
	id = len + 1


	//Cria um span para armazenar o log e define seu texto como o comando a ser executado.
	var child = document.createElement('span')
	child.className="log-line"
	child.id = id;
	child.innerText = text


	//Adiciona um evento de click para que o evento seja deletado caso seja clicado.
	child.addEventListener("click", async () => await removeLogById(event.target.id))


	//Adiciona log na div.
	parent.appendChild(child)
}



// Destaca qual o estado ativo no momento.
// Caso o argumento seja um estado que já está ativo, o estado é desativo.
function highlightCurrentState(currentState){
	/* 
		currentState é um numero. Seu valor é convertido para string para pode formar a
		string utilizada na className da UI.
	*/
	parsedState = String(currentState);
	str = "state"+parsedState


	// Habilita/Desabilita o highlight do estado.
	if(document.getElementsByClassName(str)[0].style.backgroundColor === ""){
		document.getElementsByClassName(str)[0].style.backgroundColor = "Yellow"
	}
	else {
		document.getElementsByClassName(str)[0].style.backgroundColor = ""
	}
}



// Executa as instruções pendentes.
async function runInstructions(instructions, currentState){
	//Informe se durante a execução do sistema, o estado foi alterado alguma vez.
	hasUpdated = false;
	ran = false; // Verifica se alguma instrução foi executada.

	[instructions, currentState] = dfaReset(instructions, currentState);


	len = instructions.length;

	if(instructions === []) return;

	while(instructions.length !== 0){
		ran = true;
		sleepTime = 400 // Variável para controlar o atraso na animação.

		//Extrai a primeira instrução do vetor e remove a instrução da UI.
		inst = instructions.shift();
		removeFirstLogElement();


		if(transition[currentState][inst] !== undefined){
			// Realiza a transição de estado.
			[newState, lineRef] = transition[currentState][inst];

			// Animação de troca de estado.
			await sleep(sleepTime + 200);
			highlightCurrentState(currentState);
			await sleep(sleepTime);
			red(lineRef)
			await sleep(sleepTime);
			red(lineRef)
			await sleep(sleepTime);
			highlightCurrentState(newState);
			

			// Atualiza Estado atual.
			currentState = newState;
			hasUpdated = true;
		}

		
	}

	dfaResponse(currentState, hasUpdated, ran);
	return currentState;
}



// Adiciona as funcionalidades dos botões da página.
// Adiciona o atalho "barra de espaço" para executar as instruções pendentes.
function setListeners() {
	// Define a Funcionalidade de cada botão da interface
	document.getElementsByClassName("btn-LISTEN")[0].addEventListener(       'click', () => {instructions.push(c_LISTEN); addLog("LISTEN", instructions); } );
	document.getElementsByClassName("btn-CLOSE")[0].addEventListener(        'click', () => {instructions.push(c_CLOSE);  addLog("CLOSE", instructions); } );
	document.getElementsByClassName("btn-CONNECT")[0].addEventListener(      'click', () => {instructions.push(c_CONNECT); addLog("CONNECT", instructions); } );
	document.getElementsByClassName("btn-SEND")[0].addEventListener(         'click', () => {instructions.push(c_SEND); addLog("SEND", instructions); } );
	document.getElementsByClassName("btn-RCV-SYN")[0].addEventListener(      'click', () => {instructions.push(c_RECEIVE_SYN); addLog("RECEIVE SYN", instructions); } );
	document.getElementsByClassName("btn-RCV-ACK")[0].addEventListener(      'click', () => {instructions.push(c_RECEIVE_ACK); addLog("RECEIVE ACK", instructions); } );
	document.getElementsByClassName("btn-RST")[0].addEventListener(          'click', () => {instructions.push(c_RST); addLog("RST", instructions); } );
	document.getElementsByClassName("btn-FIN")[0].addEventListener(          'click', () => {instructions.push(c_FIN); addLog("FIN", instructions); } );
	document.getElementsByClassName("btn-TIMEOUT")[0].addEventListener(      'click', () => {instructions.push(c_TIMEOUT); addLog("TIMEOUT", instructions); } );
	document.getElementsByClassName("btn-combo-syn-ack")[0].addEventListener('click', () => {instructions.push(combo_syn_ack); addLog("SYN + ACK", instructions)});
	document.getElementsByClassName("btn-combo-fin-ack")[0].addEventListener('click', () => {instructions.push(combo_fin_ack); addLog("FIN + ACK", instructions)});
	document.getElementsByClassName("run-instructions")[0].addEventListener( 'click', async () => {currentState = await runInstructions(instructions, currentState)} );
	
	
	//Adiciona um Atalho (Barra de Espaço) para o botão "Run Instructions".
	document.addEventListener("keydown", (e) => { if(e.keyCode === 32){ runInstructions(instructions, currentState)} } )
}



// Inicializa o sistema:
//   Adicionando as funcionalidades dos botões, definindo o estado inicial e limpando as
//   instruções pendentes.
function initializeSystem(){
	setListeners();
	
	currentState = e_CLOSED;
	highlightCurrentState(currentState)
	instructions = []
}



// Reinicia o Sistema:
//   Desativao estado atual, defina o estado FECHADO como estado atual e limpa as instruções
//   pendentes.
function resetSystem(){
	highlightCurrentState(currentState);
	currentState = e_CLOSED;
	highlightCurrentState(currentState);
	instructions = [];
}



// Reinicia o automato.
// Utilizado sempre que uma nova sequencia de instruções é executada.
function dfaReset(instructions, currentState){
	if(currentState === e_CLOSED){
		return [instructions, currentState];
	}
	else{
		resetSystem();
		return [instructions, e_CLOSED];
	}
}



// Emite um alerta informando se o aumato executou com sucesso, ou se ele falhou.
function dfaResponse(currentState, hasUpdated, ran){
	// if(currentState === e_CLOSED){
	// 	alert("Instruções Aceitas com Sucesso!");
	// }
	// else {
	// 	alert("Instruções Rejeitadas!!!");
	// }

	// Se executou alguma instrução e não mudou de estado: Falhou.
	if(ran === true && hasUpdated === false) {
		alert("Instruções Rejeitadas!!!");
	}

	// Se alguma instrução foi executada, o estado foi atualizado e o estado final foi e_CLOSED: Sucesso.
	else if(ran === true && hasUpdated === true && currentState === e_CLOSED) {
		alert("Instruções Aceitas com Sucesso!");
	}

	// Se alguma instrução foi executada, o estado foi atualizado eo estado final foi diferente e_CLOSED: Falhou.
	else {
		alert("Instruções Rejeitadas!!!");
	}
}