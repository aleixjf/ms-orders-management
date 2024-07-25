import {Module} from "@nestjs/common";

import {CustomLogger} from "./custom";
import {ExtendedLogger} from "./extended";

@Module({
    providers: [ExtendedLogger, CustomLogger],
    exports: [ExtendedLogger, CustomLogger],
})
export class LoggerModule {}
