export class FileNotFoundException extends Error {
    message = "File not found in the server.";
    file: string;

    constructor(data: string | {message: string; path: string}) {
        super();
        if (typeof data === "string") this.file = data;
        else {
            this.message = data.message;
            this.file = data.path;
        }
    }
}
