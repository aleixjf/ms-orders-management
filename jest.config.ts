import {pathsToModuleNameMapper} from "ts-jest";

import {compilerOptions} from "./tsconfig.json";

export default {
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: ".",
    coverageDirectory: "../coverage",
    testEnvironment: "node",
    testRegex: "^(?!.*\\.e2e\\.spec\\.ts$).*\\.spec\\.ts$",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    collectCoverageFrom: ["**/*.(t|j)s", "!**/*.e2e.spec.ts"],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: "<rootDir>/",
    }),
};
