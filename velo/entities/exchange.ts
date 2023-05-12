import { createEntity } from "../deps.ts";
import { Exchange as ExchangeName, ExchangeType, Network } from "../types.ts";

interface IExchange {
	id: string
	dex: ExchangeName
	network: Network,
	type: ExchangeType,
	router: string,
}

export const Exchange = createEntity<IExchange>("Exchange", {
	id: String,
	dex: String,
	network: String,
	type: String,
	router: String,
});
