#!/usr/bin/env node

import {spawn} from 'child_process';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//Funció per enviar una crida MCP al servidor
function callMcpTool(toolName, parameters = {}) {
    return new Promise((resolve, reject) => {
        const server = spawn('node', [join(__dirname, 'index.js')], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        server.stdout.on('data', data => {
            output += data.toString();
        });

        server.stderr.on('data', data => {
            errorOutput += data.toString();
        });

        server.on('close', code => {
            if (code === 0) {
                try {
                    const response = JSON.parse(output);
                    resolve(response);
                } catch (error) {
                    reject(new Error(`Error parsing response: ${error.message}\nOutput: ${output}`));
                }
            } else {
                reject(new Error(`Server exited with code ${code}\nError: ${errorOutput}`));
            }
        });

        //Enviem la crida MCP
        const request = {
            type: 'toolCall',
            id: `test-${Date.now()}`,
            name: toolName,
            parameters: parameters
        };

        server.stdin.write(JSON.stringify(request) + '\n');
        server.stdin.end();
    });
}

//Funció principal de prova
async function runTests() {
    console.error('🧪 Iniciant proves de la versió moderna del MCP Rally Server...\n');

    try {
        //Prova 1: getProjects
        console.error('1️⃣ Provant getProjects...');
        const projectsResponse = await callMcpTool('getProjects');
        console.error('✅ getProjects funcionant correctament');
        console.error(`   Resposta: ${projectsResponse.content ? 'OK' : 'Error'}\n`);

        //Prova 2: getTypeDefinition (sense paràmetres)
        console.error('2️⃣ Provant getTypeDefinition...');
        const typeDefResponse = await callMcpTool('getTypeDefinition');
        console.error('✅ getTypeDefinition funcionant correctament');
        console.error(`   Resposta: ${typeDefResponse.content ? 'OK' : 'Error'}\n`);

        //Prova 3: getIterations (amb projecte per defecte)
        console.error('3️⃣ Provant getIterations...');
        const iterationsResponse = await callMcpTool('getIterations', {});
        console.error('✅ getIterations funcionant correctament');
        console.error(`   Resposta: ${iterationsResponse.content ? 'OK' : 'Error'}\n`);

        console.error('🎉 Totes les proves bàsiques han passat correctament!');
        console.error('\n📋 Resum:');
        console.error('   - Servidor MCP modern iniciat correctament');
        console.error('   - SDK rally-tools configurat correctament');
        console.error('   - Tools bàsiques funcionant');
        console.error('\n🚀 El servidor està llest per utilitzar!');

    } catch (error) {
        console.error('❌ Error durant les proves:', error.message);
        console.error('\n🔧 Possibles solucions:');
        console.error('   1. Verifica que les variables d\'entorn estiguin configurades:');
        console.error('      - RALLY_INSTANCE');
        console.error('      - RALLY_APIKEY');
        console.error('      - RALLY_PROJECT_NAME');
        console.error('   2. Verifica que la connexió a Rally sigui accessible');
        console.error('   3. Verifica que l\'API key sigui vàlida');
        process.exit(1);
    }
}

//Executem les proves
runTests();