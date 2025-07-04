import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    Inject,
    Logger,
} from "@nestjs/common";
import {ClientKafka, KafkaContext} from "@nestjs/microservices";

import {EMPTY, Observable} from "rxjs";

import {KafkaMessage} from "kafkajs";

import {Context} from "@enums/context.enum";

import {DLQPayload} from "@infrastructure/messaging/providers/kafka/interfaces/dlq.interface";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Exception = any;

/**
 * Exception filter specifically for Kafka contexts that handles any type of error.
 * When a validation error occurs in a Kafka consumer, this filter:
 * 1. Logs the error with full context
 * 2. Sends the invalid message to a Dead Letter Queue (DLQ)
 * 3. Does NOT re-throw the error to prevent infinite retry loops
 * 4. Allows Kafka to commit the offset, marking the message as processed
 */
@Catch()
export class KafkaExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(KafkaExceptionFilter.name);

    constructor(
        @Inject("KAFKA_CLIENT") private readonly kafkaClient: ClientKafka
    ) {}

    catch(exception: Exception, host: ArgumentsHost): Observable<void> {
        // ! This should only be used in Kafka contexts
        if (host.getType() !== Context.RPC) throw exception;
        const context = host.switchToRpc().getContext();
        if (!(context instanceof KafkaContext)) throw exception;

        const message = context.getMessage();
        const topic = context.getTopic();
        const partition = context.getPartition();

        this.logger.error(`Error processing event "${topic}"`, {
            topic,
            partition,
            key: message.key ? message.key.toString() : "N/A",
            offset: message.offset,
            headers: message.headers,
            payload: message.value,
            error: exception,
        });

        // ? Send the invalid message to the Dead Letter Queue
        this.dlq(topic, partition, message, exception);

        // ? Commit the offset to mark the message as processed
        /*
        try {
            this.kafkaClient.commitOffsets([
                {
                    topic,
                    partition,
                    offset: (parseInt(message.offset, 10) + 1).toString(),
                },
            ]);
        } catch (e) {
            this.logger.error(
                `Failed to commit offset for topic ${topic}, partition ${partition}`,
                e
            );
        }
        */

        // ! CRITICAL: Return an empty Observable to signal successful handling
        // This prevents NestJS from propagating the error to the default RpcExceptionsHandler and allows the Kafka consumer to commit the offset and continue processing.
        return EMPTY;
    }

    private dlq(
        topic: string,
        partition: number,
        message: KafkaMessage,
        error: Exception
    ): void {
        const payload: DLQPayload = {
            message,
            error,
        };

        this.kafkaClient.emit(`${topic}.dlq`, payload).subscribe({
            next: () => this.logger.warn(`Message sent to DLQ: ${topic}.dlq`),
            error: (err) =>
                this.logger.error(
                    `Failed to send message to DLQ for topic ${topic}.dlq`,
                    err
                ),
        });
    }
}
