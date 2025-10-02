# MCP Rally Server

Servidor MCP que exposa dades de Broadcom Rally a través del Model Context Protocol. Proporciona un conjunt de tools per consultar o modificar artefactes de Rally (projectes, iteracions, user stories, test cases, etc.) des d'agents compatibles amb MCP.

## Requisits

- Node.js >= 22.7.5 (recomanat utilitzar la versió indicada a `package.json`)
- Un compte de Broadcom Rally amb permisos sobre el workspace/projecte a consultar
- Una clau API de Rally (personal access token)

## Instal·lació

### Des de npm (recomanat)

```bash
npm install -g ibm-rally-mcp
```

### Des del codi font

1. Clona el repositori:
   ```bash
   git clone https://github.com/trevSmart/ibm-rally-mcp.git
   cd ibm-rally-mcp
   ```

2. Instal·la les dependències:
   ```bash
   npm install
   ```

## Configuració

1. Crea un fitxer `.env` a l'arrel amb les variables necessàries:
   ```dotenv
   RALLY_INSTANCE=https://eu1.rallydev.com
   RALLY_APIKEY=pat-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
   RALLY_PROJECT_NAME=Nom del projecte per defecte
   LOG_LEVEL=info              # Opcional: info | debug | warn | error
   STRIP_HTML_TESTCASE_DESCRIPTION=true # Opcional: activa la neteja d'HTML a les descripcions
   ```
   > No comparteixis ni versionis mai valors reals de les credencials.

2. Inicia el servidor MCP:
   ```bash
   # Si l'has instal·lat globalment des de npm:
   ibm-rally-mcp

   # Si l'has instal·lat des del codi font:
   npm start
   ```
3. Connecta el teu client MCP (per exemple Cursor, Claude Desktop o scripts propis) utilitzant el transport STDIO.

## Estructura principal

- `index.js`: punt d'entrada del servidor MCP, registra totes les tools, prompts i recursos.
- `src/utils.js`: integració amb el SDK de Rally i utilitats compartides (logging, helpers i instància de l'API).
- `src/rallyServices.js`: capa de servei que encapsula les crides a l'API de Rally amb memòria cau bàsica.
- `src/tools/`: col·lecció de tools MCP que mapejen funcionalitats concretes de Rally (consultes, creació i actualitzacions).
- `tmp/`: scripts experimentals o auxiliars (p. ex. `createTestCaseScript.js` per provar creació de test cases).

## Tools disponibles

Les principals tools registrades al servidor són:

- `getProjects`, `getIterations`, `getUsers`, `getUserStories`, `getTasks`: consultes bàsiques d'artefactes.
- `createUserStory`, `createDefect`, `createTestCase`, `createUserStoryTasks`, `updateTask`: operacions de creació/actualització.
- `getTestCases`, `getTestCaseSteps`, `getTestFolders`: recursos relacionats amb QA.
- `getTypeDefinition`, `getCurrentDate`: utilitats complementàries.

La definició exacta de paràmetres i la sortida estructurada es troba a cada fitxer dins `src/tools/`.

## Funcionalitats destacades

- Registre automàtic de recursos MCP (`rallyData`, `defaultProject`) per consultar l'estat intern de la sessió.
- Mecanisme de logging dinàmic segons el nivell demanat pel client.
- Obtenció prèvia del projecte per defecte i de l'usuari actual per optimitzar peticions posteriors.
- Neteja opcional d'HTML en les descripcions dels test cases a través de la variable `STRIP_HTML_TESTCASE_DESCRIPTION`.

## Scripts auxiliars

Al directori `tmp/` hi ha un script demostratiu (`createTestCaseScript.js`) que reprodueix lògiques de la tool `createTestCase`. Es pot utilitzar per proves locals executant:

```bash
cd tmp
node createTestCaseScript.js
```

## Desenvolupament

- Utilitza `npm start` durant el desenvolupament; el servidor quedarà escoltant per STDIO.
- Es recomana seguir l'estil de codi existent (ES Modules, async/await, validació amb Zod).
- L'script `npm run lint` està pendent de migrar a la nova configuració d'ESLint v9; cal afegir `eslint.config.js` abans de poder executar-lo.

## Issues coneguts

- Les respostes de certes tools poden contenir molta informació; utilitza filtres (`query`) per limitar el volum retornat.
- El filtratge de test cases només accepta camps específics (`Iteration`, `Project`, `Owner`, `State`, `TestFolder`).

## Llicència

Projecte d'ús intern. Afegeix-hi la llicència corresponent segons les necessitats de la teva organització.
