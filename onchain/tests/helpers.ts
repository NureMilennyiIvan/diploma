import {
    airdropFactory,
    appendTransactionMessageInstructions,
    Commitment,
    CompilableTransactionMessage,
    createTransactionMessage,
    generateKeyPairSigner,
    getBase64EncodedWireTransaction,
    getSignatureFromTransaction,
    getTransactionDecoder,
    IInstruction,
    KeyPairSigner,
    lamports,
    pipe,
    Rpc,
    RpcSubscriptions,
    sendAndConfirmTransactionFactory,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    Signature,
    signTransaction,
    signTransactionMessageWithSigners,
    SolanaRpcApi,
    SolanaRpcSubscriptionsApi,
    TransactionMessageWithBlockhashLifetime,
} from "@solana/kit";
import {getSetComputeUnitLimitInstruction} from "@solana-program/compute-budget";
import {U192} from "@liquidity-pool/js";


const LAMPORTS_PER_SOL = 1_000_000_000;
/**
 * Defines the RPC client interface with standard Solana API and subscriptions.
 */
export type RpcClient = {
    rpc: Rpc<SolanaRpcApi>;
    rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
};

/**
 * Creates a test user by generating a key pair and airdropping SOL.
 * @param {RpcClient} rpcClient - The Solana RPC client.
 * @param {number} airdrop_amount - The amount of SOL to airdrop.
 * @returns {Promise<KeyPairSigner>} - The generated test user's key pair.
 */
export const createTestUser = async (rpcClient: RpcClient, airdrop_amount: number): Promise<KeyPairSigner> => {
    const user = await generateKeyPairSigner();
    console.log("Generated user address:", user.address);

    const airdrop = airdropFactory(rpcClient);
    await airdrop({
        commitment: 'processed',
        lamports: lamports(BigInt(LAMPORTS_PER_SOL * airdrop_amount)),
        recipientAddress: user.address
    });

    console.log(`Airdrop of ${airdrop_amount} SOL completed for user:`, user.address);

    return user;
};

/**
 * Creates a basic transaction with given instructions.
 * @param {RpcClient} rpcClient - The Solana RPC client.
 * @param {KeyPairSigner} payer - The transaction fee payer.
 * @param {IInstruction[]} instructions - The instructions to include.
 */
export const createTransaction = async (rpcClient: RpcClient, payer: KeyPairSigner, instructions: IInstruction[]) => {
    const { value: latestBlockhash } = await rpcClient.rpc.getLatestBlockhash().send();
    const transaction = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(payer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstructions(instructions, tx)
    );
    return transaction;
};

/**
 * Creates a transaction with a specified compute unit limit.
 * @param {RpcClient} rpcClient - The Solana RPC client.
 * @param {KeyPairSigner} payer - The transaction fee payer.
 * @param {IInstruction[]} instructions - The instructions to include.
 * @param {number} computeUnits - The compute units limit.
 */
export const createTransactionWithComputeUnits = async (rpcClient: RpcClient, payer: KeyPairSigner, instructions: IInstruction[], computeUnits: number) => {
    const { value: latestBlockhash } = await rpcClient.rpc.getLatestBlockhash().send();
    instructions.unshift(getSetComputeUnitLimitInstruction({ units: computeUnits }));
    const transaction = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(payer, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstructions(instructions, tx)
    );
    return transaction;
};

/**
 * Signs and sends a transaction, then returns the transaction signature.
 * @param {RpcClient} rpcClient - The Solana RPC client.
 * @param {Commitment} [commitment='confirmed'] - The transaction commitment level.
 * @param {transactionMessage: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime} - Transaction.
 * @returns {Promise<Signature>} - The transaction signature.
 */
export const signAndSendTransaction = async (
    rpcClient: RpcClient,
    transactionMessage: CompilableTransactionMessage & TransactionMessageWithBlockhashLifetime,
    commitment: Commitment = 'confirmed'
): Promise<Signature> => {
    const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
    await sendAndConfirmTransactionFactory(rpcClient)(signedTransaction, { commitment });
    return getSignatureFromTransaction(signedTransaction);
};

/**
 * Retrieves logs from a transaction.
 * @param {RpcClient} rpcClient - The Solana RPC client.
 * @param {Signature} signature - The transaction signature.
 * @returns {Promise<readonly string[]>} - The transaction logs.
 */
export const getTransactionLogs = async (rpcClient: RpcClient, signature: Signature): Promise<readonly string[]> => {
    return (await rpcClient.rpc.getTransaction(signature, {encoding: "base64", maxSupportedTransactionVersion: 0, commitment: "confirmed"}).send()).meta?.logMessages;
};

export const delay = (seconds: number) => new Promise((res) => setTimeout(res, seconds * 1000));

export const compareU192 = (a: U192, b: U192): number => {
    const aParts = a[0];
    const bParts = b[0];
    for (let i = 2; i >= 0; i--) {
        if (aParts[i] > bParts[i]) return 1;
        if (aParts[i] < bParts[i]) return -1;
    }
    return 0;
}

export const post = async (
    baseUrl: string,
    scope: string,
    route: string,
    payload: any
): Promise<unknown> => {
    const fullUrl = `${baseUrl}${scope}${route}`;
    const response = await fetch(fullUrl, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Request failed: ${response.status} - ${text}`);
    }

    return await response.json();
};
export const postBase64Tx = async (
    baseUrl: string,
    scope: string,
    route: string,
    payload: any
): Promise<string> => {
    const result = await post(baseUrl, scope, route, payload);

    if (typeof result !== "string") {
        throw new Error("Expected base64 transaction string response");
    }

    return result;
};
export const postBase64TxAndPubkey = async (
    baseUrl: string,
    scope: string,
    route: string,
    payload: any
): Promise<[string, string]> => {
    const result = await post(baseUrl, scope, route, payload);

    if (!Array.isArray(result) || result.length !== 2 || typeof result[0] !== "string" || typeof result[1] !== "string") {
        throw new Error("Expected [base64_tx, pubkey] string tuple response");
    }

    return result as [string, string];
};

export const requireEnv = (key: string) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const decodeSignAndSimulate = async (
    base64Tx: string,
    signers: KeyPairSigner[],
    rpcClient: RpcClient
): Promise<string[]> => {
    const transaction = getTransactionDecoder().decode(Buffer.from(base64Tx, "base64"));
    const signedTx = await signTransaction(signers.map(s => s.keyPair), transaction);
    const wireTx = getBase64EncodedWireTransaction(signedTx);
    let res = await rpcClient.rpc.simulateTransaction(wireTx, { encoding: "base64" }).send();
    return res.value.logs
};

export const decodeSignAndSend = async (
    base64Tx: string,
    signers: KeyPairSigner[],
    rpcClient: RpcClient
): Promise<Signature> => {
    const transaction = getTransactionDecoder().decode(Buffer.from(base64Tx, "base64"));
    const signedTx = await signTransaction(signers.map(s => s.keyPair), transaction);
    const wireTx = getBase64EncodedWireTransaction(signedTx);
    return await rpcClient.rpc.sendTransaction(wireTx, { encoding: "base64" }).send();
};