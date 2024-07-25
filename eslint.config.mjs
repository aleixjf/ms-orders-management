import path from "node:path";
import {fileURLToPath} from "node:url";

import {fixupConfigRules, fixupPluginRules} from "@eslint/compat";
import {FlatCompat} from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import _import from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

// const eslintPluginTypescript = typescriptEslint;
// const eslintPluginPrettier = prettier;
// const eslintPluginUnusedImports = unusedImports;
// const eslintPluginImport = _import;

export default [
    ...fixupConfigRules(
        compat.extends(
            "eslint:recommended",
            "plugin:@typescript-eslint/recommended",
            "prettier",
            "plugin:prettier/recommended",
            "plugin:import/recommended",
            "plugin:import/typescript"
        )
    ),
    {
        plugins: {
            "@typescript-eslint": fixupPluginRules(typescriptEslint),
            prettier: fixupPluginRules(prettier),
            "unused-imports": fixupPluginRules(unusedImports),
            import: fixupPluginRules(_import),
        },

        languageOptions: {
            globals: {
                ...globals.node,
            },

            parser: tsParser,
            ecmaVersion: "latest",
            sourceType: "module",
        },

        rules: {
            // "no-console": "warn",
            "@typescript-eslint/interface-name-prefix": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-require-imports": "warn",
            "@typescript-eslint/no-var-requires": "warn",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-empty-function": [
                "warn",
                {
                    allow: ["arrowFunctions"],
                },
            ],
            "prettier/prettier": "warn",
            "no-restricted-imports": [
                "warn",
                {
                    patterns: [
                        {
                            group: ["./*", "../*"],
                            message:
                                "Relative imports are discouraged. Please use absolute paths.",
                        },
                    ],
                },
            ],
            "unused-imports/no-unused-imports": ["warn"],
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
            "sort-imports": [
                "error",
                {
                    // ? https://eslint.org/docs/latest/rules/sort-imports#options
                    ignoreCase: true,
                    ignoreDeclarationSort: true, // ? We're using import/order to sort declarations. If set to false, it will clash with import/order rules.
                    ignoreMemberSort: false,
                    memberSyntaxSortOrder: [
                        "all",
                        "single",
                        "multiple",
                        "none",
                    ], // ? This will sort the imports by the number of members in the import statement. If ignoreDeclarationSort is true, this will be ignored.
                    allowSeparatedGroups: true, // ? This will allow separated groups to be sorted independently.
                },
            ],
            "import/no-unresolved": "error",
            "import/order": [
                "error",
                {
                    // ? https://github.com/import-js/eslint-plugin-import/blob/HEAD/docs/rules/order.md#options
                    "newlines-between": "always",
                    alphabetize: {
                        order: "asc",
                        caseInsensitive: true,
                    },
                    groups: [
                        "builtin", // ? Node.js built-in modules (fs, path, etc.)
                        "external", // ? External modules (node_modules)
                        "internal", // ? Internal modules (our aliases)
                        ["sibling", "parent"], // ? Relative modules (same folder, parent folder)
                        "index", // ? Index files
                        "unknown", // ? Everything else
                    ],
                    pathGroups: [
                        // ? A patternOptions object can be passed to the pathGroup to be used tby minimatch library
                        // ? https://github.com/isaacs/minimatch?tab=readme-ov-file#options

                        // ? Put all the @nestjs and @nestjs/** imports first
                        {
                            pattern: "@nestjs{,/**}",
                            position: "before",
                            group: "external",
                        },

                        // ? Put all the rxjs and rxjs/** imports first
                        {
                            pattern: "rxjs{,/**}",
                            position: "before",
                            group: "external",
                        },

                        // ? Put all our aliases in custom groups
                        // Configuration & Logger
                        {
                            pattern: "@{config,logger}{,/**}",
                            position: "before",
                            group: "internal",
                        },
                        // Database
                        {
                            pattern: "@database{,/**}",
                            position: "before",
                            group: "internal",
                        },
                        // Helpers & Utilities
                        {
                            pattern:
                                "{{.,..,@*}/**/*.{helper,utils,transformer}{,/**},@{helpers,utils,transformers}{,/**}}",
                            position: "before",
                            group: "internal",
                        },
                        // Decorators
                        {
                            pattern:
                                "{{.,..,@*}/**/*.decorator{,/**},@decorators{,/**}}",
                            position: "before",
                            group: "internal",
                        },
                        // Modules
                        {
                            pattern: "{.,..,@*}/**/*.module{,/**}",
                            position: "before",
                            group: "internal",
                        },
                        // Enums
                        {
                            pattern: "{{.,..,@*}/**/*.enum{,/**},@enums{,/**}}",
                            position: "before",
                            group: "internal",
                        },
                        // DTOs, Entities, Interfaces, Classes, Models & Mappers
                        {
                            pattern:
                                "{.,..,@*}/**/*.{dto,entity,interface,class,model,mapper}{,/**}",
                            position: "before",
                            group: "internal",
                        },
                        // Services & APIs
                        {
                            // "pattern": "{{.,..,@*}/**/*.{service,api}{,/**},@{services,api}{,/**}}",
                            pattern: "{.,..,@*}/**/*.{service,api}{,/**}",
                            position: "before",
                            group: "internal",
                        },
                        // Controllers
                        {
                            pattern: "{.,..,@*}/**/*.controller{,/**}",
                            position: "before",
                            group: "internal",
                        },
                        // Guards
                        {
                            pattern:
                                "{{.,..,@*}/**/*.guard{,/**},@guards{,/**}}",
                            position: "before",
                            group: "internal",
                        },
                        // Strategies
                        // {
                        //   "pattern": "{.,..,@*}/**/*.strategy{,/**}",
                        //   "position": "after",
                        //   "group": "internal"
                        // },
                        // Validators & Pipes
                        {
                            pattern:
                                "{{.,..,@*}/**/*.{validator,validation}{,/**},@validators{,/**}}",
                            position: "before",
                            group: "internal",
                        },
                        {
                            pattern:
                                "{{.,..,@*}/**/*.{pipe,transform}{,/**},@pipes{,/**}}",
                            position: "before",
                            group: "internal",
                        },
                        // Interceptors, Middlewares, Filters & Exceptions
                        {
                            pattern:
                                "{{.,..,@*}/**/*.{interceptor,middleware}{,/**},@{interceptors,middlewares}{,/**}}",
                            position: "before",
                            group: "internal",
                        },
                        {
                            pattern:
                                "{{{.,..,@*}/**/*.{filter,exception}{,/**},@filters{,/**}}}",
                            position: "before",
                            group: "internal",
                        },
                    ],
                    pathGroupsExcludedImportTypes: ["builtin"],
                    distinctGroup: true,
                },
            ],
        },

        settings: {
            "import/parsers": {
                "@typescript-eslint/parser": [".ts", ".tsx"],
            },
            "import/resolver": {
                typescript: {
                    alwaysTryTypes: true,
                },
            },
        },
    },
];
