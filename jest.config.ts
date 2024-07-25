import {pathsToModuleNameMapper} from "ts-jest";

import {compilerOptions} from "./tsconfig.json";

export default {
    moduleFileExtensions: ["js", "json", "ts"],
    rootDir: "src",
    coverageDirectory: "../coverage",
    testEnvironment: "node",
    testRegex: ".*\\.spec\\.ts$",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    collectCoverageFrom: ["**/*.(t|j)s"],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
        prefix: "<rootDir>/../",
    }),
};
