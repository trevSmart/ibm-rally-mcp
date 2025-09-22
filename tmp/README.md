# Script per crear Test Case a Rally

Aquest script de Node.js crea un test case a Rally amb els mateixos paràmetres que faria la tool `createTestCase`.

## Requisits

- Node.js instal·lat
- Variables d'entorn configurades al fitxer `.env`:
  - `RALLY_APIKEY`: La clau API de Rally
  - `RALLY_INSTANCE`: La instància de Rally (ex: `https://rally1.rallydev.com`)
  - `RALLY_PROJECT_NAME`: El nom del projecte per defecte

## Execució

```bash
cd tmp
node createTestCaseScript.js
```

## Dades del Test Case

El script crea un test case amb les següents dades:

- **Nom**: "Test MAC autenticacion con pasos - US1027350"
- **Descripció**: "Test case con 2 pasos para US1027350"
- **User Story**: `/hierarchicalrequirement/77261079385`
- **Projecte**: `/project/67423792989`
- **Propietari**: `/user/66488625925`
- **Carpeta de Test**: `/testfolder/80555580393`

### Passos del Test Case

1. **Input**: "Execute digital authentication for MAC opportunity"
   **Expected Result**: "Authentication process starts successfully"

2. **Input**: "Complete level II authentication with OTP SMS"
   **Expected Result**: "OTP SMS is validated and opportunity can be processed"

## Funcionament

1. Primer crea el test case amb les dades bàsiques
2. Després crea els passos del test case en lot (batch)
3. Mostra el resultat final amb el test case creat i els passos associats

## Sortida

El script mostrarà:
- Les dades utilitzades per crear el test case
- El resultat de la creació del test case
- Les dades utilitzades per crear els passos
- El resultat de la creació dels passos
- El resultat final amb tota la informació
