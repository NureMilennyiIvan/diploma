import { PublicKey } from "@solana/web3.js";

export class AmmsConfigsManager {
    constructor(
        public authority: PublicKey,
        public headAuthority: PublicKey
    ) {}

    static fromJSON(obj: { authority: string; headAuthority: string }): AmmsConfigsManager {
        return new AmmsConfigsManager(
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
    static mock(): AmmsConfigsManager {
        return new AmmsConfigsManager(
/*            PublicKey.unique(),
            PublicKey.unique(),*/
            new PublicKey("FBKiKFe3x71qtZ9TMZvA7Qt9Vc7WBAaQS7LsePpbxGbG"),
            new PublicKey("FBKiKFe3x71qtZ9TMZvA7Qt9Vc7WBAaQS7LsePpbxGbG"),
        );
    }
}
