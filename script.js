const commands = {
	"SEND-SYN":  1,
	"RCVD-SYN":  2,
	"SEND-FIN":  3,
	"RCVD-FIN":  4,
	"SEND-ACK":  5,
	"RCVD-ACK":  6,
	"SEND-MSG":  7,
	"RCVD-MSG":  8,
	"OPEN"    :  9,
	"CLOSE"   : 10,
	"TIMEOUT" : 11,
}
Object.freeze(commands);

