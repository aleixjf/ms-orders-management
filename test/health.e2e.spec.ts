import {INestApplication} from "@nestjs/common";
import {Test, TestingModule} from "@nestjs/testing";

import request from "supertest";

import {AppModule} from "@src/app.module";

describe("Health Check", () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    it("Health Check (GET /)", () => {
        return request(app.getHttpServer())
            .get("/")
            .expect(200)
            .expect('{"success":true,"data":true}');
    });

    afterAll(async () => {
        await app.close();
    });
});
