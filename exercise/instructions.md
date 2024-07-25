# Prueba Técnica: Sistema de Gestión de Pedidos


## Objetivo

Diseñar e implementar parcialmente un sistema de gestión de pedidos para una empresa de e-commerce que está migrando de un monolito a una arquitectura de microservicios, aplicando arquitectura hexagonal.
No es necesario completar todo en una sola sesión. Recomendamos tomarte el tiempo necesario para entregar un trabajo de calidad.

## Contexto del Negocio

Una empresa de e-commerce con las siguientes características:
- Vende productos físicos con inventario limitado
- Los clientes pueden realizar pedidos con múltiples productos
- Los pedidos pasan por varios estados: pendiente, confirmado, enviado, entregado, cancelado
- Es crítico mantener la consistencia del inventario
- Los pagos se procesan a través de un proveedor externo
- Se requiere notificar a los clientes sobre cambios en sus pedidos

## Estructura de la Prueba

### Parte 1: Diseño

#### 1.1 Identificación de Bounded Contexts
- Analiza el dominio del negocio descrito
- Identifica y documenta al menos 3 bounded contexts
- Justifica por qué has separado el dominio de esta manera

#### 1.2 Diseño de Agregados
Para el bounded context de "Gestión de Pedidos":
- Define los agregados principales
- Especifica las entidades y value objects de cada agregado
- Lista los domain events que se generarían
- Documenta las invariantes de negocio que protege cada agregado

#### 1.3 Arquitectura de Microservicios
- Decide qué bounded contexts deberían ser microservicios independientes
- Define los contratos de API (REST o gRPC) entre servicios
- Diseña el flujo completo de creación y procesamiento de un pedido
- Especifica cómo se comunicarán los servicios (síncrona/asíncrona)

### Parte 2: Implementación (Entregable Obligatorio)

Implementa el microservicio de "Gestión de Pedidos" con:

#### 2.1 Requisitos Funcionales

**Agregado Order:**
- Estados: Pending, Confirmed, Shipped, Delivered, Cancelled
- Debe contener items con producto, cantidad y precio
- Debe calcular el total del pedido
- Debe validar transiciones de estado

**Casos de Uso a Implementar:**
1. **Crear Pedido**
   - Validar datos de entrada
   - Crear pedido en estado Pending
   - Publicar evento OrderCreated

2. **Confirmar Pedido**
   - Solo posible si está en estado Pending
   - Debe verificar disponibilidad de stock (via evento)
   - Publicar evento OrderConfirmed

3. **Cancelar Pedido**
   - Implementar reglas de negocio (ej: no cancelable si está Shipped)
   - Publicar evento OrderCancelled
   - Considerar compensación de stock

#### 2.2 Comunicación entre Servicios
- Implementar publicación de eventos de dominio
- Consumir al menos un evento externo (ej: StockReserved, PaymentProcessed)
- Implementar manejo de errores y timeouts
- Considerar escenarios de compensación

#### 2.3 Testing
Incluir:
- Tests unitarios para el dominio (sin dependencias externas)
- Al menos un test end-to-end de un flujo completo

## Restricciones Técnicas

### Stack Tecnológico
- **Lenguajes permitidos**: Node 22, Typescript
- **Frameworks sugeridos**: NestJS, Express
- **Base de datos sugeridas**: PostgreSQL, Mongo, Redis
- **Testing**: Jest, Vitest, Newman o equivalentes

### Consideraciones de Implementación
- La mensajería puede ser simulada mediante interfaces (no requiere RabbitMQ/Kafka real)
- Implementa validación en las capas apropiadas
- El código debe ser ejecutable con un simple `pnpm run` o similar

## Entregables

### 1. Código Fuente
- Repositorio Git con commits atómicos y mensajes descriptivos
- Código limpio siguiendo las convenciones del lenguaje elegido
- Sin código comentado o archivos innecesarios

### 2. Documentación

#### README.md del proyecto
Debe incluir:
- Instrucciones claras de instalación y ejecución
- Explicación de la estructura del proyecto
- Decisiones de diseño importantes
- Trade-offs considerados
- Limitaciones conocidas
- Posibles mejoras futuras

#### Diagramas sugeridos (opcional)
- Context Map (Bounded Contexts)
- Diagrama de secuencia para el flujo principal
- Modelo de dominio del agregado Order

### 3. ADRs (Architecture Decision Records)
Documenta al menos 3 decisiones arquitectónicas importantes usando el formato:
- Contexto
- Decisión
- Consecuencias


## Preguntas Frecuentes

**¿Puedo usar librerías adicionales?**
Sí, pero justifica su uso en la documentación.

**¿Qué nivel de detalle se espera en los diagramas?**
Los diagramas deben ser suficientemente detallados para entender la arquitectura, pero no necesitan incluir cada clase o método.

**¿Debo implementar autenticación/autorización?**
No es necesario, puedes asumir que viene en headers HTTP ya validados.

**¿Qué pasa si no completo toda la implementación?**
Prioriza la calidad sobre la cantidad. Es mejor tener menos funcionalidades bien implementadas y documentadas.

## Entrega

1. Sube tu código a un repositorio Git (GitHub, GitLab, Bitbucket)
2. Asegúrate de que el repositorio incluya toda la documentación
3. Envía el enlace del repositorio a: [email_reclutamiento]
4. Incluye en el email el tiempo aproximado que dedicaste a cada parte

## Soporte

Si tienes dudas sobre los requisitos, puedes:
- Documentar tus asunciones en el README
- Enviar preguntas a: [email_soporte_tecnico]

---

¡Buena suerte! Esperamos ver tu solución y discutirla contigo en la siguiente fase del proceso.
