# IBM Rally Context - Agents registrats

Aquesta secció descriu totes les tools MCP disponibles al servidor IBM Rally Context. Cada agent és una acció que el client MCP pot sol·licitar i que encapsula una operació concreta sobre Broadcom Rally.

## Consultes

### getProjects
- **Fitxer**: `src/tools/getProjects.js`
- **Objectiu**: Llistar projectes actius. Pot filtrar per `ObjectID` o per `Name` (cerca parcial).
- **Sortida destacada**: `structuredContent.projects` amb els projectes retornats i indicació de si provenen de cache o API.

### getIterations
- **Fitxer**: `src/tools/getIterations.js`
- **Objectiu**: Recuperar iteracions (sprints) actives. Accepta filtres per `ObjectID`, `Name`, `State`, `Project`, `StartDate`, `EndDate`. Els resultats s'afegeixen a `rallyData.iterations` per reutilitzar-los.

### getUserStories
- **Fitxer**: `src/tools/getUserStories.js`
- **Objectiu**: Obtenir user stories segons els filtres indicats (qualsevol camp suportat per l'API). Recomanat filtrar per `Iteration.ObjectID`, `Project`, `State`.
- **Camps retornats**: Inclou tots els camps estàndard de user story, incloent `Notes` que conté informació crítica com codis d'iniciativa (format: I#####) i feature (format: FE######).

### getTasks
- **Fitxer**: `src/tools/getTasks.js`
- **Objectiu**: Consultar tasques. Filtra habitualment per `WorkProduct.ObjectID` per obtenir les tasques d'una user story concreta.

### getUsers
- **Fitxer**: `src/tools/getUsers.js`
- **Objectiu**: Llistar usuaris de Rally. Filtrat principal per `DisplayName`, `UserName` o `ObjectID`.

### getDefects
- **Fitxer**: `src/tools/getDefects.js`
- **Objectiu**: Recuperar defectes filtrats per diversos camps (`State`, `Severity`, `Priority`, `ObjectID`, etc.). Important: el camp `ObjectID` es converteix automàticament a número per garantir que la cerca exacta funcioni correctament amb l'API de Rally.
- **Filtres suportats**: `ObjectID` (número, es converteix automàticament), `State`, `Severity`, `Priority`, i qualsevol altre camp estàndard de Defect.

### getTestCases
- **Fitxer**: `src/tools/getTestCases.js`
- **Objectiu**: Recuperar test cases. Accepta filtres per `Iteration`, `Project`, `Owner`, `State` i `TestFolder`. Si la variable d'entorn `STRIP_HTML_TESTCASE_DESCRIPTION` està activada, neteja el camp `Description` d'HTML. Els passos s'han de consultar amb la tool `getTestCaseSteps`.

### getTestCaseSteps
- **Fitxer**: `src/tools/getTestCaseSteps.js`
- **Objectiu**: Obtenir els passos d'un test case concret a partir del seu `testCaseId` (ObjectID).

### getTestFolders
- **Fitxer**: `src/tools/getTestFolders.js`
- **Objectiu**: Llistar carpetes de test amb informació bàsica (`Project`, `Parent`, `TestCases`).

### getTypeDefinition
- **Fitxer**: `src/tools/getTypeDefinition.js`
- **Objectiu**: Recuperar metadades de model (definicions d'objectes i atributs) per entendre l'esquema de Rally.

### getCurrentDate
- **Fitxer**: `src/tools/getCurrentDate.js`
- **Objectiu**: Retornar la data i hora actuals del servidor (útil per generar timestamps en prompts o respostes).

## Creació i actualització

### createUserStory
- **Fitxer**: `src/tools/createUserStory.js`
- **Objectiu**: Crear una user story nova. Requereix confirmació prèvia via `sendElicitRequest`. Camps mínims: `Project`, `Name`, `Description`. Opcionalment `Iteration` i `Owner`.

### createUserStoryTasks
- **Fitxer**: `src/tools/createUserStoryTasks.js`
- **Objectiu**: Afegir una llista de tasques a una user story. Cada tasca inclou `Name`, `State`, `Estimate`, `ToDo`, `Owner` i es valida amb Zod abans de crear-la.

### updateTask
- **Fitxer**: `src/tools/updateTask.js`
- **Objectiu**: Actualitzar una tasca existent. Accepta un `taskId` (ObjectID) i un objecte de camps a modificar (`State`, `Estimate`, `ToDo`, `Owner`, etc.).

### createDefect
- **Fitxer**: `src/tools/createDefect.js`
- **Objectiu**: Crear un defecte utilitzant l'exemple exacte documentat per l'equip. Requereix camps com `Name`, `Description`, `Project`, `Iteration`, `Owner` i `ScheduleState`.

### createTestCase
- **Fitxer**: `src/tools/createTestCase.js`
- **Objectiu**: Crear un test case (i opcionalment els seus passos). Necessita `Name`, `UserStory`, `Project`, `Owner`, `Steps[]`. Valida i envia la creació en dues fases: test case i batch de passos.

### createTestFolder
- **Fitxer**: `src/tools/createTestFolder.js`
- **Objectiu**: Crear una carpeta de test (test folder) per organitzar test cases de manera jeràrquica. Camps mínims: `Name`, `Project`. Opcionalment `Description`, `Parent` (per crear jerarquies) i `Owner`.
- **Ús**: Permet crear estructures jeràrquiques de carpetes especificant el `Parent` (referència a `/testfolder/###`). Si no s'especifica `Parent`, es crea al nivell arrel.

## Notes operatives

- Totes les tools utilitzen el client oficial de Rally amb autenticació via `RALLY_APIKEY` i respecten el projecte configurat per defecte.
- El servidor manté una cache senzilla a `rallyData` per evitar peticions redundants i exposa recursos MCP (`mcp://...`) amb l'estat intern.
- Quan sigui possible, cada tool retorna tant una resposta en text (per inspecció ràpida) com dades estructurades (`structuredContent`) per facilitar-ne l'ús per part del client MCP.
- És recomanable aplicar filtres sempre que sigui viable per evitar respostes massa voluminoses i sobrepassar límits de tokens.
