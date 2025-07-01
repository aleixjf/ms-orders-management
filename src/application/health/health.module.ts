import {Module} from "@nestjs/common";

import {HealthService} from "@application/health/services/health.service";

import {HealthgRPCController} from "@application/health/controllers/health.grpc.controller";
import {HealthHttpController} from "@application/health/controllers/health.http.controller";

@Module({
    controllers: [HealthHttpController, HealthgRPCController],
    providers: [HealthService],
    exports: [HealthService],
})
export class HealthModule {}
