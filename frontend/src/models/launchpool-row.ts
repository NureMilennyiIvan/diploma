import { PublicKey } from "@solana/web3.js";

export class LaunchpoolRow {
    private key: PublicKey;
    private rewardMint: PublicKey;
    private stakableMint: PublicKey;
    private startTimestamp: number;
    private endTimestamp: number;

    constructor(
        key: PublicKey,
        rewardMint: PublicKey,
        stakableMint: PublicKey,
        startTimestamp: number,
        endTimestamp: number
    ) {
        this.key = key;
        this.rewardMint = rewardMint;
        this.stakableMint = stakableMint;
        this.startTimestamp = startTimestamp;
        this.endTimestamp = endTimestamp;
    }

    getKey(): PublicKey {
        return this.key;
    }

    getRewardMint(): PublicKey {
        return this.rewardMint;
    }

    getStakableMint(): PublicKey {
        return this.stakableMint;
    }

    getStartTimestamp(): number {
        return this.startTimestamp;
    }

    getEndTimestamp(): number {
        return this.endTimestamp;
    }

    static fromJSON(json: any): LaunchpoolRow {
        return new LaunchpoolRow(
            new PublicKey(json.key),
            new PublicKey(json.baseMint),
            new PublicKey(json.quoteMint),
            json.startTimestamp * 1000,
            json.endTimestamp * 1000
        );
    }
    static mock(): LaunchpoolRow {
        return new LaunchpoolRow(
            PublicKey.unique(),
            PublicKey.unique(),
            PublicKey.unique(),
            1748780145000,
            1748780146000
        );
    }
}