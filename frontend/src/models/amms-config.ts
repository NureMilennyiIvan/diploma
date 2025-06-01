import { PublicKey } from "@solana/web3.js";

export class AmmsConfig {
    constructor(
        public key: PublicKey,
        public feeAuthority: PublicKey,
        public providersFeeRate: string,
        public protocolFeeRate: string
    ) {}

    static fromJSON(obj: { key: string; feeAuthority: string; providersFeeRate: string; protocolFeeRate: string }): AmmsConfig {
        return new AmmsConfig(
            new PublicKey(obj.key),
            new PublicKey(obj.feeAuthority),
            obj.providersFeeRate,
            obj.protocolFeeRate
        );
    }

    static mock(): AmmsConfig {
        return new AmmsConfig(
            PublicKey.unique(),
            PublicKey.unique(),
            "12.1",
            "1.2"
        );
    }
}
