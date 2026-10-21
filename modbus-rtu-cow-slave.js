const modbus = require('modbus-serial');

module.exports = function(RED) {
    function ModbusRTUSlave(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Konfiguration des Modbus RTU Slaves
        const serialPort = config.serialPort;
        const baudRate = config.baudRate || 9600;
        const dataBits = config.dataBits || 8;
        const stopBits = config.stopBits || 1;
        const parity = config.parity || 'none';
        const slaveId = config.slaveId || 1;

        // Erstellen des Modbus Clients
        const client = new modbus.SerialPort();
        client.connect(serialPort, { baudRate, dataBits, stopBits, parity });

        // Initialisieren der Holding Registers
        const holdingRegisters = new Array(100).fill(0); // Beispielgröße 100

        // Modbus Server starten
        const server = new modbus.ModbusRTUServer(client, { slaveId });

        // Eingehende Schreibbefehle verarbeiten
        server.on('write', (address, value) => {
            node.send({ payload: { address, value } });
        });

        // Eingang für aktualisierte Registerwerte
        node.on('input', function(msg) {
            if (msg.payload && typeof msg.payload === 'object') {
                for (const [key, value] of Object.entries(msg.payload)) {
                    holdingRegisters[key] = value;
                }
                node.log('Holding Registers updated: ' + JSON.stringify(holdingRegisters));
            }
        });

        node.on('close', function() {
            client.close();
            server.close();
        });
    }

    RED.nodes.registerType('modbus-rtu-cow-slave', ModbusRTUSlave);
};
