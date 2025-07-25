# MCP Rally Server - Versió Moderna

Un servidor lleuger que implementa el Model Context Protocol per accedir a les dades de Broadcom Rally, utilitzant el SDK modern `rally-tools`.

## 🚀 Novetats de la Versió Moderna

Aquesta versió migra del SDK abandonat `rally` (2018) al SDK modern i actiu `rally-tools` (actualitzat fa 10 mesos), oferint:

- **SDK Modern**: Utilitza `rally-tools` en lloc del SDK abandonat
- **Millor Manteniment**: SDK actiu amb suport continu
- **API Més Rica**: Accés a més funcionalitats de Rally
- **Millor Gestió d'Errors**: Errors més descriptius i útils
- **Configuració Simplificada**: Configuració automàtica basada en variables d'entorn

## Requisits

- Node.js 20 o superior
- Una API key vàlida de Broadcom Rally

## Instal·lació

```bash
npm install
```

## Ús

### Versió Moderna (Recomanada)

```bash
npm run start:modern
```

### Versió Legacy

```bash
npm start
```

El servidor s'iniciarà utilitzant l'entrada/sortida estàndard per comunicar-se segons el protocol MCP.

## Paràmetres de configuració

El servidor requereix els següents paràmetres:

- `RALLY_INSTANCE`: URL de la instància de Rally (per defecte: "https://eu1.rallydev.com")
- `RALLY_APIKEY`: La teva API key de Rally (obligatori)
- `RALLY_PROJECT_NAME`: Nom del projecte per defecte (opcional)
- `RALLY_ENV`: Entorn de Rally (per defecte: "EU1")

## Tools disponibles

### getProjects

Obté una llista de tots els projectes actius disponibles a Rally.

**Paràmetres:**
- Cap paràmetre requerit

**Retorna:**
- Llista de projectes actius amb informació detallada (ID, nom, descripció, estat, dates, propietari, etc.)

### getIterations

Obté informació detallada de les iteracions (sprints) de Rally.

**Paràmetres:**
- `projectId` (opcional): ID del projecte
- `iterationName` (opcional): Nom de la iteració

**Retorna:**
- Informació formatada de les iteracions incloent ID, nom, projecte, dates, estat

### getUserStories

Obté informació detallada de les user stories d'una iteració específica.

**Paràmetres:**
- `iterationId` (opcional): ID de la iteració
- `iterationName` (opcional): Nom de la iteració
- `projectId` (opcional): ID del projecte

**Retorna:**
- Llista de user stories amb informació detallada (ID, nom, descripció, estat, tasques, etc.)

### getTasks

Obté informació detallada de les tasques d'una user story.

**Paràmetres:**
- `userStoryId` (opcional): ID de la user story
- `userStoryFormattedId` (opcional): FormattedID de la user story (ex: US123456)

**Retorna:**
- Llista de tasques amb informació detallada (ID, nom, descripció, estat, estimacions, etc.)

### getTestCases

Obté informació detallada dels test cases d'una iteració.

**Paràmetres:**
- `iterationId` (opcional): ID de la iteració
- `iterationName` (opcional): Nom de la iteració
- `projectId` (opcional): ID del projecte

**Retorna:**
- Llista de test cases amb informació detallada

### createUserStoryTasks

Crea tasques per a una user story.

**Paràmetres:**
- `tasks` (obligatori): Array d'objectes de tasques
- `userStoryId` (opcional): ID de la user story
- `userStoryFormattedId` (opcional): FormattedID de la user story

**Retorna:**
- Informació de les tasques creades

### getTypeDefinition

Obté metadades del model d'objectes de Rally.

**Paràmetres:**
- `query` (opcional): Objecte de consulta per filtrar tipus

**Retorna:**
- Informació sobre els tipus disponibles o definició específica d'un tipus

## Exemple d'ús amb curl

```bash
# Obtenir projectes
echo '{"type":"toolCall","id":"call1","name":"getProjects","parameters":{}}' | npm run start:modern

# Obtenir iteracions
echo '{"type":"toolCall","id":"call2","name":"getIterations","parameters":{"iterationName":"Sprint 40"}}' | npm run start:modern

# Obtenir user stories
echo '{"type":"toolCall","id":"call3","name":"getUserStories","parameters":{"iterationName":"Sprint 40"}}' | npm run start:modern

# Obtenir tasques
echo '{"type":"toolCall","id":"call4","name":"getTasks","parameters":{"userStoryFormattedId":"US1132610"}}' | npm run start:modern
```

## Arquitectura Moderna

### Capa d'Abstracció (`rallynode.js`)

La nova arquitectura utilitza una capa d'abstracció que encapsula la complexitat del SDK `rally-tools`:

- **RallyProjects**: Gestió de projectes
- **RallyIterations**: Gestió d'iteracions
- **RallyUserStories**: Gestió de user stories
- **RallyTasks**: Gestió de tasques
- **RallyTestCases**: Gestió de test cases

### Beneficis de la Migració

1. **SDK Actiu**: `rally-tools` està actiu i es manté regularment
2. **Millor API**: API més rica i moderna
3. **Gestió d'Errors**: Errors més descriptius i útils
4. **Configuració Automàtica**: Configuració basada en variables d'entorn
5. **Compatibilitat**: Manté la mateixa interfície MCP

## Migració des de la Versió Legacy

Per migrar des de la versió legacy:

1. **Instal·la les dependències:**
   ```bash
   npm install
   ```

2. **Configura les variables d'entorn:**
   ```bash
   export RALLY_INSTANCE="https://eu1.rallydev.com"
   export RALLY_APIKEY="your-api-key"
   export RALLY_PROJECT_NAME="Your Project Name"
   ```

3. **Executa la versió moderna:**
   ```bash
   npm run start:modern
   ```

## Integració amb altres clients MCP

Aquest servidor és compatible amb qualsevol client que implementi el Model Context Protocol. Pots connectar-lo als clients MCP existents per proporcionar context sobre les User Stories de Rally als teus models de llenguatge.

## Troubleshooting

### Errors Comuns

1. **"No s'ha trobat cap projecte"**: Verifica que `RALLY_PROJECT_NAME` estigui configurat correctament
2. **"Unauthorized"**: Verifica que `RALLY_APIKEY` sigui vàlida
3. **"Connection error"**: Verifica que `RALLY_INSTANCE` sigui accessible

### Logs

El servidor genera logs detallats per ajudar amb el debugging. Busca missatges que comencin amb `Error en` per identificar problemes específics.

## Contribució

Per contribuir al projecte:

1. Fork el repositori
2. Crea una branca per a la teva feature
3. Fes els canvis necessaris
4. Prova amb `npm run start:modern`
5. Submet un pull request

## Llicència

Aquest projecte està sota la mateixa llicència que el projecte original.