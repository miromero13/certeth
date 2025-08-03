# CertETH Frontend

Frontend React para el sistema de certificados descentralizado CertETH que utiliza Zero Knowledge Proofs y Ethereum Attestation Service.

## 🚀 Características

- ✅ **Interfaz moderna** con React + TypeScript + Tailwind CSS
- ✅ **Integración Web3** con MetaMask y Web3.js
- ✅ **Tres roles principales:**
  - 🏛️ **Institución Emisora**: Emitir certificados en blockchain
  - 👤 **Titular**: Gestionar certificados y generar pruebas ZK
  - 🔍 **Verificador**: Verificar certificados sin revelar datos privados
- ✅ **Privacidad total** mediante Zero Knowledge Proofs
- ✅ **Diseño responsive** y experiencia de usuario optimizada

## 🛠️ Instalación

```bash
# Navegar a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 📱 Uso

### Paso 1: Conectar Wallet
Conecta tu MetaMask a la red de desarrollo (localhost:7545 con Ganache).

### Paso 2: Configurar Contratos
Actualiza las direcciones de los contratos en `src/lib/contracts.ts` después del deployment.

### Paso 3: Seleccionar Rol
1. **Institución Emisora**: Emite nuevos certificados
2. **Titular**: Ve tus certificados y genera pruebas ZK
3. **Verificador**: Verifica certificados de terceros

## 🏗️ Arquitectura

```
frontend/
├── src/
│   ├── components/        # Componentes React
│   │   ├── ui/           # Componentes UI base
│   │   ├── Hero.tsx      # Página principal
│   │   ├── IssuerDashboard.tsx
│   │   ├── HolderDashboard.tsx
│   │   └── VerifierDashboard.tsx
│   ├── lib/              # Servicios y utilidades
│   │   ├── web3Service.ts # Integración con blockchain
│   │   ├── contracts.ts   # ABIs y direcciones
│   │   └── utils.ts      # Utilidades generales
│   ├── hooks/            # Custom hooks
│   └── App.tsx          # Componente principal
├── package.json
└── vite.config.ts
```

## 🔧 Configuración

### Contratos
Actualiza `src/lib/contracts.ts` con las direcciones reales:

```typescript
export const CONTRACT_ADDRESSES = {
  CERTIFICATES_CONTRACT: "0xTU_DIRECCION_AQUI",
  MOCK_EAS: "0xTU_DIRECCION_EAS",
  SCHEMA_REGISTRY: "0xTU_DIRECCION_SCHEMA"
};
```

### Red de Desarrollo
Asegúrate de que Ganache esté ejecutándose en puerto 7545 y que MetaMask esté configurado para esa red.

## 🎯 Funcionalidades Principales

### Institución Emisora
- Emitir nuevos certificados
- Ver certificados emitidos
- Analíticas y estadísticas

### Titular
- Ver mis certificados
- Generar pruebas de conocimiento cero
- Compartir pruebas con verificadores
- Exportar certificados

### Verificador
- Verificar pruebas ZK sin revelar datos privados
- Historial de verificaciones
- Validación contra EAS y blockchain

## 🛡️ Seguridad

- Conexión segura con MetaMask
- Validación de datos en frontend y backend
- Pruebas ZK generadas localmente (datos privados nunca salen del dispositivo)
- Verificación criptográfica mediante smart contracts

## 📦 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build para producción
npm run preview  # Preview del build
npm run lint     # Linting con ESLint
```

## 🔗 Integración con Backend

Este frontend se conecta automáticamente a los smart contracts desplegados en tu red local. Asegúrate de:

1. Tener Ganache ejecutándose
2. Contratos desplegados con `truffle migrate`
3. MetaMask configurado en la red local
4. Direcciones de contratos actualizadas en `contracts.ts`

## 🎨 Personalización

El frontend utiliza Tailwind CSS con variables CSS personalizadas. Puedes modificar:

- Colores: `src/globals.css`
- Componentes: `src/components/ui/`
- Estilos: Variables CSS en `globals.css`

---

**¡Tu frontend está listo para interactuar con el sistema CertETH!** 🎉
