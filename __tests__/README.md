# Tests del Servidor MCP Rally

Este directorio contiene todos los tests para el servidor MCP Rally.

## Estructura de Tests

- `__tests__/src/utils.test.js` - Tests para las funciones utilitarias
- `__tests__/src/rallyServices.test.js` - Tests para los servicios de Rally
- `__tests__/src/tools.test.js` - Tests para las herramientas principales
- `__tests__/integration.test.js` - Tests de integración

## Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar tests para CI/CD
npm run test:ci
```

## Configuración

Los tests están configurados con Jest y utilizan mocks para:
- El SDK de MCP
- La librería ibm-rally-node
- Las variables de entorno
- Las funciones de logging

## Cobertura de Tests

Los tests cubren:
- ✅ Funciones utilitarias (utils.js)
- ✅ Servicios de Rally (rallyServices.js)
- ✅ Herramientas principales (getCurrentDate, getProjects)
- ✅ Tests de integración básicos
- ✅ Manejo de errores
- ✅ Configuración del servidor

## Notas

- Los tests no requieren conexión real a Rally
- Se utilizan mocks para simular las respuestas de la API
- Los tests verifican tanto casos exitosos como de error
- Se incluyen tests de integración para verificar el flujo completo
