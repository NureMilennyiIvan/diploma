import { PublicKey } from "@solana/web3.js";

export class LaunchpoolsConfigsManager {
    constructor(
        public authority: PublicKey,
        public headAuthority: PublicKey
    ) {}

    static fromJSON(obj: { authority: string; headAuthority: string }): LaunchpoolsConfigsManager {
        return new LaunchpoolsConfigsManager(
            new PublicKey(obj.authority),
            new PublicKey(obj.headAuthority)
        );
    }

    toJSON(): { authority: string; headAuthority: string } {
        return {
            authority: this.authority.toBase58(),
            headAuthority: this.headAuthority.toBase58()
        };
    }
    static mock(): LaunchpoolsConfigsManager {
        return new LaunchpoolsConfigsManager(
            PublicKey.unique(),
            PublicKey.unique(),
        );
    }
}
