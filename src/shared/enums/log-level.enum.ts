// ? https://github.com/winstonjs/winston?tab=readme-ov-file#logging-levels

export enum WinstonLevel {
    Emergency = 0,
    Alert = 1,
    Critical = 2,
    Error = 3,
    Warning = 4,
    Notice = 5,
    Info = 6,
    Debug = 7,
}

export enum NodeLevel {
    Error = "error", // 0
    Warn = "warn", // 1
    Info = "info", // 2
    Http = "http", // 3
    Verbose = "verbose", // 4
    Debug = "debug", // 5
    Silly = "silly", // 6
}
