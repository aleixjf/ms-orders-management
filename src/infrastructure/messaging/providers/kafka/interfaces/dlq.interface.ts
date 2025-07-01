import {KafkaMessage} from "kafkajs";

export interface DLQPayload {
    message: KafkaMessage;
    error: any;
}
