import {pathsToModuleNameMapper} from "ts-jest";

import {compilerOptions} from "../tsconfig.json";

export default {
    globals: {
        NODE_ENV: "test",
    },
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: ".",
    coverageDirectory: "./coverage",
    testEnvironment: "node",
    testRegex: ".e2e-spec.ts$",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    collectCoverageFrom: [],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: "<rootDir>/../",
    }),
    // Configuración para manejar operaciones asíncronas que no se cierran correctamente
    forceExit: true,
    detectOpenHandles: true,
    // Tiempo de espera extendido para permitir que las operaciones asíncronas se completen
    testTimeout: 30000,
    // Configuración para mejorar el manejo de recursos
    maxWorkers: 1,
    // Variables de entorno para las pruebas
    // setupFilesAfterEnv: ["<rootDir>/setup-tests.ts"],
};
