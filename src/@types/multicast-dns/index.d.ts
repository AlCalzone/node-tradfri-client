// tslint:disable:no-namespace

declare module "multicast-dns" {

	import * as dgram from "dgram";
	import { EventEmitter } from "events";

	function MulticastDNS(opts?: Partial<MulticastDNS.Options>): MulticastDNS.Instance;

	namespace MulticastDNS {

		export interface Options {
			/** use udp multicasting */
			multicast: boolean;
			/** explicitly specify a network interface. defaults to all */
			interface: string;
			/** set the udp listening port. defaults to 5353 */
			port: number;
			/** set the udp multicast ip */
			ip: string;
			/** set the multicast ttl */
			ttl: number;
			/** receive your own packets */
			loopback: boolean;
			/** set the reuseAddr option when creating the socket (requires node >= 0.11.13) */
			reuseAddr: boolean;
			/** The type of the underlying UDP socket */
			type: dgram.SocketOptions["type"];
		}

		export type PacketType = "A" | "AAAA" | "PTR" | "TXT" | "SRV" | "HINFO";

		export interface Question {
			name: string;
			type: PacketType;
		}
		export interface Answer {
			name: string;
			type: PacketType;
			ttl: number;
			data: any;
		}

		export interface Packet {
			questions: Question[];
			answers: Answer[];
			additionals: Answer[];
			authorities: Answer[];
		}
		export interface ResponsePacket extends Packet {
			type: "response";
		}
		export interface QueryPacket extends Packet {
			type: "query";
		}

		interface Instance extends EventEmitter {
			on(event: "query", handler: (packet: QueryPacket, rinfo: dgram.RemoteInfo) => void): this;
			on(event: "response", handler: (packet: ResponsePacket, rinfo: dgram.RemoteInfo) => void): this;
			on(event: "ready", handler: () => void): this;
			on(event: "error", handler: (e: Error) => void): this;
			// tslint:disable:unified-signatures
			query(packet: QueryPacket, callback?: () => void): void;
			query(packet: Pick<QueryPacket, "questions">, callback?: () => void);
			query(name: string, type: PacketType, callback?: () => void);
			query(questions: Question[], callback?: () => void);
			// TODO: type .respond()
			// tslint:enable:unified-signatures
			destroy(): void;
			initServer(): void;
		}
	}

	export = MulticastDNS;
}
