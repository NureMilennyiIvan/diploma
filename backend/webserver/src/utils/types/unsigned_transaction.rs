use solana_sdk::{
    hash::Hash,
    instruction::Instruction,
    message::Message,
    pubkey::Pubkey,
    signature::Keypair,
    transaction::Transaction,
};
use anyhow::{Result as AnyResult};
use base64::Engine;
use solana_sdk::packet::Encode;

pub struct UnsignedTransactionBuilder<'a> {
    instructions: Vec<Instruction>,
    recent_blockhash: Option<Hash>,
    partial_signers: Vec<&'a Keypair>,
    payer: Option<&'a Pubkey>,
}

impl<'a> UnsignedTransactionBuilder<'a> {
    pub fn new() -> Self {
        Self {
            instructions: Vec::new(),
            recent_blockhash: None,
            partial_signers: Vec::new(),
            payer: None,
        }
    }

    pub fn instruction(mut self, ix: Instruction) -> Self {
        self.instructions.push(ix);
        self
    }

    pub fn instructions(mut self, ixs: impl IntoIterator<Item = Instruction>) -> Self {
        self.instructions.extend(ixs);
        self
    }

    pub fn recent_blockhash(mut self, hash: Hash) -> Self {
        self.recent_blockhash = Some(hash);
        self
    }

    pub fn payer(mut self, payer: &'a Pubkey) -> Self {
        self.payer = Some(payer);
        self
    }

    pub fn sign_with(mut self, signer: &'a Keypair) -> Self {
        self.partial_signers.push(signer);
        self
    }

    pub fn signers(mut self, signers: impl IntoIterator<Item = &'a Keypair>) -> Self {
        self.partial_signers.extend(signers);
        self
    }

    pub fn build(self) -> UnsignedTransaction {
        let blockhash = self
            .recent_blockhash
            .expect("recent_blockhash is required");

        let mut tx = Transaction::new_unsigned(Message::new_with_blockhash(
            self.instructions.as_slice(),
            self.payer,
            &blockhash
        ));

        if !self.partial_signers.is_empty() {
            tx.partial_sign(&self.partial_signers, blockhash);
        }
        UnsignedTransaction{
            tx
        }
    }
}
pub struct UnsignedTransaction{
    tx: Transaction,
}
impl UnsignedTransaction {
    pub fn take_transaction(self) -> Transaction {
        self.tx
    }
    pub fn to_base64(self) -> AnyResult<String> {
        let mut bytes: Vec<u8> = Vec::new();
        self.tx.encode(&mut bytes)?;
        Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
    }
}
pub fn build_unsigned_transaction<'a>(payer: &Pubkey, ix: impl IntoIterator<Item = Instruction>, recent_blockhash: Hash, partial_signers: impl IntoIterator<Item = &'a Keypair>) -> UnsignedTransaction {
    UnsignedTransactionBuilder::new()
        .recent_blockhash(recent_blockhash)
        .instructions(ix)
        .signers(partial_signers)
        .payer(payer)
        .build()
}