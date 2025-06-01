import { PublicKey } from "@solana/web3.js";

export class CpAmmRow {
    private key: PublicKey;
    private baseMint: PublicKey;
    private quoteMint: PublicKey;
    private creator: string;
    private fee: string;
    private baseLiquidity: string;
    private quoteLiquidity: string;

    constructor(
        key: PublicKey,
        baseMint: PublicKey,
        quoteMint: PublicKey,
        creator: string,
        fee: string,
        baseLiquidity: string,
        quoteLiquidity: string
    ) {
        this.key = key;
        this.baseMint = baseMint;
        this.quoteMint = quoteMint;
        this.creator = creator;
        this.fee = fee;
        this.baseLiquidity = baseLiquidity;
        this.quoteLiquidity = quoteLiquidity;
    }

    getKey(): PublicKey {
        return this.key;
    }

    getBaseMint(): PublicKey {
        return this.baseMint;
    }

    getQuoteMint(): PublicKey {
        return this.quoteMint;
    }

    getCreator(): string {
        return this.creator;
    }

    getFee(): string {
        return this.fee;
    }

    getBaseLiquidity(): string {
        return this.baseLiquidity;
    }

    getQuoteLiquidity(): string {
        return this.quoteLiquidity;
    }

    static fromJSON(json: any): CpAmmRow {
        return new CpAmmRow(
            new PublicKey(json.key),
            new PublicKey(json.baseMint),
            new PublicKey(json.quoteMint),
            json.creator,
            json.fee,
            json.baseLiquidity,
            json.quoteLiquidity
        );
    }
    static mock(): CpAmmRow {
        return new CpAmmRow(
            PublicKey.unique(),
            PublicKey.unique(),
            PublicKey.unique(),
            "MockCreator",
            "0.3",
            "100000",
            "50000"
        );
    }
}