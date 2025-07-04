import {TypeORMExceptionFilter} from "@filters/typeORM.filter";

describe("TypeORMExceptionFilter", () => {
    it("should be defined", () => {
        expect(new TypeORMExceptionFilter()).toBeDefined();
    });
});
