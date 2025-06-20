//! This code was AUTOGENERATED using the codama library.
//! Please DO NOT EDIT THIS FILE, instead use visitors
//! to add features, then rerun codama to update it.
//!
//! <https://github.com/codama-idl/codama>
//!

use borsh::BorshSerialize;
use borsh::BorshDeserialize;

/// Accounts.
#[derive(Debug)]
pub struct CollectProtocolReward {
      
              
          pub signer: solana_program::pubkey::Pubkey,
          
              
          pub reward_authority: solana_program::pubkey::Pubkey,
          
              
          pub launchpools_config: solana_program::pubkey::Pubkey,
          
              
          pub reward_mint: solana_program::pubkey::Pubkey,
          
              
          pub launchpool: solana_program::pubkey::Pubkey,
          
              
          pub reward_vault: solana_program::pubkey::Pubkey,
          
              
          pub reward_authority_account: solana_program::pubkey::Pubkey,
          
              
          pub rent: solana_program::pubkey::Pubkey,
          
              
          pub system_program: solana_program::pubkey::Pubkey,
          
              
          pub reward_token_program: solana_program::pubkey::Pubkey,
          
              
          pub associated_token_program: solana_program::pubkey::Pubkey,
      }

impl CollectProtocolReward {
  pub fn instruction(&self) -> solana_program::instruction::Instruction {
    self.instruction_with_remaining_accounts(&[])
  }
  #[allow(clippy::arithmetic_side_effects)]
  #[allow(clippy::vec_init_then_push)]
  pub fn instruction_with_remaining_accounts(&self, remaining_accounts: &[solana_program::instruction::AccountMeta]) -> solana_program::instruction::Instruction {
    let mut accounts = Vec::with_capacity(11+ remaining_accounts.len());
                            accounts.push(solana_program::instruction::AccountMeta::new(
            self.signer,
            true
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.reward_authority,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.launchpools_config,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.reward_mint,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.launchpool,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.reward_vault,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.reward_authority_account,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.rent,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.system_program,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.reward_token_program,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.associated_token_program,
            false
          ));
                      accounts.extend_from_slice(remaining_accounts);
    let data = borsh::to_vec(&CollectProtocolRewardInstructionData::new()).unwrap();
    
    solana_program::instruction::Instruction {
      program_id: crate::LAUNCHPOOL_ID,
      accounts,
      data,
    }
  }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
 pub struct CollectProtocolRewardInstructionData {
            discriminator: [u8; 8],
      }

impl CollectProtocolRewardInstructionData {
  pub fn new() -> Self {
    Self {
                        discriminator: [231, 6, 221, 223, 151, 55, 220, 220],
                  }
  }
}

impl Default for CollectProtocolRewardInstructionData {
  fn default() -> Self {
    Self::new()
  }
}



/// Instruction builder for `CollectProtocolReward`.
///
/// ### Accounts:
///
                      ///   0. `[writable, signer]` signer
          ///   1. `[]` reward_authority
          ///   2. `[]` launchpools_config
          ///   3. `[]` reward_mint
                ///   4. `[writable]` launchpool
                ///   5. `[writable]` reward_vault
                ///   6. `[writable]` reward_authority_account
                ///   7. `[optional]` rent (default to `SysvarRent111111111111111111111111111111111`)
                ///   8. `[optional]` system_program (default to `11111111111111111111111111111111`)
          ///   9. `[]` reward_token_program
                ///   10. `[optional]` associated_token_program (default to `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`)
#[derive(Clone, Debug, Default)]
pub struct CollectProtocolRewardBuilder {
            signer: Option<solana_program::pubkey::Pubkey>,
                reward_authority: Option<solana_program::pubkey::Pubkey>,
                launchpools_config: Option<solana_program::pubkey::Pubkey>,
                reward_mint: Option<solana_program::pubkey::Pubkey>,
                launchpool: Option<solana_program::pubkey::Pubkey>,
                reward_vault: Option<solana_program::pubkey::Pubkey>,
                reward_authority_account: Option<solana_program::pubkey::Pubkey>,
                rent: Option<solana_program::pubkey::Pubkey>,
                system_program: Option<solana_program::pubkey::Pubkey>,
                reward_token_program: Option<solana_program::pubkey::Pubkey>,
                associated_token_program: Option<solana_program::pubkey::Pubkey>,
                __remaining_accounts: Vec<solana_program::instruction::AccountMeta>,
}

impl CollectProtocolRewardBuilder {
  pub fn new() -> Self {
    Self::default()
  }
            #[inline(always)]
    pub fn signer(&mut self, signer: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.signer = Some(signer);
                    self
    }
            #[inline(always)]
    pub fn reward_authority(&mut self, reward_authority: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.reward_authority = Some(reward_authority);
                    self
    }
            #[inline(always)]
    pub fn launchpools_config(&mut self, launchpools_config: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.launchpools_config = Some(launchpools_config);
                    self
    }
            #[inline(always)]
    pub fn reward_mint(&mut self, reward_mint: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.reward_mint = Some(reward_mint);
                    self
    }
            #[inline(always)]
    pub fn launchpool(&mut self, launchpool: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.launchpool = Some(launchpool);
                    self
    }
            #[inline(always)]
    pub fn reward_vault(&mut self, reward_vault: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.reward_vault = Some(reward_vault);
                    self
    }
            #[inline(always)]
    pub fn reward_authority_account(&mut self, reward_authority_account: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.reward_authority_account = Some(reward_authority_account);
                    self
    }
            /// `[optional account, default to 'SysvarRent111111111111111111111111111111111']`
#[inline(always)]
    pub fn rent(&mut self, rent: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.rent = Some(rent);
                    self
    }
            /// `[optional account, default to '11111111111111111111111111111111']`
#[inline(always)]
    pub fn system_program(&mut self, system_program: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.system_program = Some(system_program);
                    self
    }
            #[inline(always)]
    pub fn reward_token_program(&mut self, reward_token_program: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.reward_token_program = Some(reward_token_program);
                    self
    }
            /// `[optional account, default to 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL']`
#[inline(always)]
    pub fn associated_token_program(&mut self, associated_token_program: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.associated_token_program = Some(associated_token_program);
                    self
    }
            /// Add an additional account to the instruction.
  #[inline(always)]
  pub fn add_remaining_account(&mut self, account: solana_program::instruction::AccountMeta) -> &mut Self {
    self.__remaining_accounts.push(account);
    self
  }
  /// Add additional accounts to the instruction.
  #[inline(always)]
  pub fn add_remaining_accounts(&mut self, accounts: &[solana_program::instruction::AccountMeta]) -> &mut Self {
    self.__remaining_accounts.extend_from_slice(accounts);
    self
  }
  #[allow(clippy::clone_on_copy)]
  pub fn instruction(&self) -> solana_program::instruction::Instruction {
    let accounts = CollectProtocolReward {
                              signer: self.signer.expect("signer is not set"),
                                        reward_authority: self.reward_authority.expect("reward_authority is not set"),
                                        launchpools_config: self.launchpools_config.expect("launchpools_config is not set"),
                                        reward_mint: self.reward_mint.expect("reward_mint is not set"),
                                        launchpool: self.launchpool.expect("launchpool is not set"),
                                        reward_vault: self.reward_vault.expect("reward_vault is not set"),
                                        reward_authority_account: self.reward_authority_account.expect("reward_authority_account is not set"),
                                        rent: self.rent.unwrap_or(solana_program::pubkey!("SysvarRent111111111111111111111111111111111")),
                                        system_program: self.system_program.unwrap_or(solana_program::pubkey!("11111111111111111111111111111111")),
                                        reward_token_program: self.reward_token_program.expect("reward_token_program is not set"),
                                        associated_token_program: self.associated_token_program.unwrap_or(solana_program::pubkey!("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")),
                      };
    
    accounts.instruction_with_remaining_accounts(&self.__remaining_accounts)
  }
}

  /// `collect_protocol_reward` CPI accounts.
  pub struct CollectProtocolRewardCpiAccounts<'a, 'b> {
          
                    
              pub signer: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub reward_authority: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub launchpools_config: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub reward_mint: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub launchpool: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub reward_vault: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub reward_authority_account: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub rent: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub system_program: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub reward_token_program: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub associated_token_program: &'b solana_program::account_info::AccountInfo<'a>,
            }

/// `collect_protocol_reward` CPI instruction.
pub struct CollectProtocolRewardCpi<'a, 'b> {
  /// The program to invoke.
  pub __program: &'b solana_program::account_info::AccountInfo<'a>,
      
              
          pub signer: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub reward_authority: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub launchpools_config: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub reward_mint: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub launchpool: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub reward_vault: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub reward_authority_account: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub rent: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub system_program: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub reward_token_program: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub associated_token_program: &'b solana_program::account_info::AccountInfo<'a>,
        }

impl<'a, 'b> CollectProtocolRewardCpi<'a, 'b> {
  pub fn new(
    program: &'b solana_program::account_info::AccountInfo<'a>,
          accounts: CollectProtocolRewardCpiAccounts<'a, 'b>,
          ) -> Self {
    Self {
      __program: program,
              signer: accounts.signer,
              reward_authority: accounts.reward_authority,
              launchpools_config: accounts.launchpools_config,
              reward_mint: accounts.reward_mint,
              launchpool: accounts.launchpool,
              reward_vault: accounts.reward_vault,
              reward_authority_account: accounts.reward_authority_account,
              rent: accounts.rent,
              system_program: accounts.system_program,
              reward_token_program: accounts.reward_token_program,
              associated_token_program: accounts.associated_token_program,
                }
  }
  #[inline(always)]
  pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed_with_remaining_accounts(&[], &[])
  }
  #[inline(always)]
  pub fn invoke_with_remaining_accounts(&self, remaining_accounts: &[(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)]) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed_with_remaining_accounts(&[], remaining_accounts)
  }
  #[inline(always)]
  pub fn invoke_signed(&self, signers_seeds: &[&[&[u8]]]) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed_with_remaining_accounts(signers_seeds, &[])
  }
  #[allow(clippy::arithmetic_side_effects)]
  #[allow(clippy::clone_on_copy)]
  #[allow(clippy::vec_init_then_push)]
  pub fn invoke_signed_with_remaining_accounts(
    &self,
    signers_seeds: &[&[&[u8]]],
    remaining_accounts: &[(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)]
  ) -> solana_program::entrypoint::ProgramResult {
    let mut accounts = Vec::with_capacity(11+ remaining_accounts.len());
                            accounts.push(solana_program::instruction::AccountMeta::new(
            *self.signer.key,
            true
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.reward_authority.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.launchpools_config.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.reward_mint.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.launchpool.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.reward_vault.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.reward_authority_account.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.rent.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.system_program.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.reward_token_program.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.associated_token_program.key,
            false
          ));
                      remaining_accounts.iter().for_each(|remaining_account| {
      accounts.push(solana_program::instruction::AccountMeta {
          pubkey: *remaining_account.0.key,
          is_signer: remaining_account.1,
          is_writable: remaining_account.2,
      })
    });
    let data = borsh::to_vec(&CollectProtocolRewardInstructionData::new()).unwrap();
    
    let instruction = solana_program::instruction::Instruction {
      program_id: crate::LAUNCHPOOL_ID,
      accounts,
      data,
    };
    let mut account_infos = Vec::with_capacity(12 + remaining_accounts.len());
    account_infos.push(self.__program.clone());
                  account_infos.push(self.signer.clone());
                        account_infos.push(self.reward_authority.clone());
                        account_infos.push(self.launchpools_config.clone());
                        account_infos.push(self.reward_mint.clone());
                        account_infos.push(self.launchpool.clone());
                        account_infos.push(self.reward_vault.clone());
                        account_infos.push(self.reward_authority_account.clone());
                        account_infos.push(self.rent.clone());
                        account_infos.push(self.system_program.clone());
                        account_infos.push(self.reward_token_program.clone());
                        account_infos.push(self.associated_token_program.clone());
              remaining_accounts.iter().for_each(|remaining_account| account_infos.push(remaining_account.0.clone()));

    if signers_seeds.is_empty() {
      solana_program::program::invoke(&instruction, &account_infos)
    } else {
      solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
    }
  }
}

/// Instruction builder for `CollectProtocolReward` via CPI.
///
/// ### Accounts:
///
                      ///   0. `[writable, signer]` signer
          ///   1. `[]` reward_authority
          ///   2. `[]` launchpools_config
          ///   3. `[]` reward_mint
                ///   4. `[writable]` launchpool
                ///   5. `[writable]` reward_vault
                ///   6. `[writable]` reward_authority_account
          ///   7. `[]` rent
          ///   8. `[]` system_program
          ///   9. `[]` reward_token_program
          ///   10. `[]` associated_token_program
#[derive(Clone, Debug)]
pub struct CollectProtocolRewardCpiBuilder<'a, 'b> {
  instruction: Box<CollectProtocolRewardCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> CollectProtocolRewardCpiBuilder<'a, 'b> {
  pub fn new(program: &'b solana_program::account_info::AccountInfo<'a>) -> Self {
    let instruction = Box::new(CollectProtocolRewardCpiBuilderInstruction {
      __program: program,
              signer: None,
              reward_authority: None,
              launchpools_config: None,
              reward_mint: None,
              launchpool: None,
              reward_vault: None,
              reward_authority_account: None,
              rent: None,
              system_program: None,
              reward_token_program: None,
              associated_token_program: None,
                                __remaining_accounts: Vec::new(),
    });
    Self { instruction }
  }
      #[inline(always)]
    pub fn signer(&mut self, signer: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.signer = Some(signer);
                    self
    }
      #[inline(always)]
    pub fn reward_authority(&mut self, reward_authority: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.reward_authority = Some(reward_authority);
                    self
    }
      #[inline(always)]
    pub fn launchpools_config(&mut self, launchpools_config: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.launchpools_config = Some(launchpools_config);
                    self
    }
      #[inline(always)]
    pub fn reward_mint(&mut self, reward_mint: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.reward_mint = Some(reward_mint);
                    self
    }
      #[inline(always)]
    pub fn launchpool(&mut self, launchpool: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.launchpool = Some(launchpool);
                    self
    }
      #[inline(always)]
    pub fn reward_vault(&mut self, reward_vault: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.reward_vault = Some(reward_vault);
                    self
    }
      #[inline(always)]
    pub fn reward_authority_account(&mut self, reward_authority_account: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.reward_authority_account = Some(reward_authority_account);
                    self
    }
      #[inline(always)]
    pub fn rent(&mut self, rent: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.rent = Some(rent);
                    self
    }
      #[inline(always)]
    pub fn system_program(&mut self, system_program: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.system_program = Some(system_program);
                    self
    }
      #[inline(always)]
    pub fn reward_token_program(&mut self, reward_token_program: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.reward_token_program = Some(reward_token_program);
                    self
    }
      #[inline(always)]
    pub fn associated_token_program(&mut self, associated_token_program: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.associated_token_program = Some(associated_token_program);
                    self
    }
            /// Add an additional account to the instruction.
  #[inline(always)]
  pub fn add_remaining_account(&mut self, account: &'b solana_program::account_info::AccountInfo<'a>, is_writable: bool, is_signer: bool) -> &mut Self {
    self.instruction.__remaining_accounts.push((account, is_writable, is_signer));
    self
  }
  /// Add additional accounts to the instruction.
  ///
  /// Each account is represented by a tuple of the `AccountInfo`, a `bool` indicating whether the account is writable or not,
  /// and a `bool` indicating whether the account is a signer or not.
  #[inline(always)]
  pub fn add_remaining_accounts(&mut self, accounts: &[(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)]) -> &mut Self {
    self.instruction.__remaining_accounts.extend_from_slice(accounts);
    self
  }
  #[inline(always)]
  pub fn invoke(&self) -> solana_program::entrypoint::ProgramResult {
    self.invoke_signed(&[])
  }
  #[allow(clippy::clone_on_copy)]
  #[allow(clippy::vec_init_then_push)]
  pub fn invoke_signed(&self, signers_seeds: &[&[&[u8]]]) -> solana_program::entrypoint::ProgramResult {
        let instruction = CollectProtocolRewardCpi {
        __program: self.instruction.__program,
                  
          signer: self.instruction.signer.expect("signer is not set"),
                  
          reward_authority: self.instruction.reward_authority.expect("reward_authority is not set"),
                  
          launchpools_config: self.instruction.launchpools_config.expect("launchpools_config is not set"),
                  
          reward_mint: self.instruction.reward_mint.expect("reward_mint is not set"),
                  
          launchpool: self.instruction.launchpool.expect("launchpool is not set"),
                  
          reward_vault: self.instruction.reward_vault.expect("reward_vault is not set"),
                  
          reward_authority_account: self.instruction.reward_authority_account.expect("reward_authority_account is not set"),
                  
          rent: self.instruction.rent.expect("rent is not set"),
                  
          system_program: self.instruction.system_program.expect("system_program is not set"),
                  
          reward_token_program: self.instruction.reward_token_program.expect("reward_token_program is not set"),
                  
          associated_token_program: self.instruction.associated_token_program.expect("associated_token_program is not set"),
                    };
    instruction.invoke_signed_with_remaining_accounts(signers_seeds, &self.instruction.__remaining_accounts)
  }
}

#[derive(Clone, Debug)]
struct CollectProtocolRewardCpiBuilderInstruction<'a, 'b> {
  __program: &'b solana_program::account_info::AccountInfo<'a>,
            signer: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                reward_authority: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                launchpools_config: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                reward_mint: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                launchpool: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                reward_vault: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                reward_authority_account: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                rent: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                system_program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                reward_token_program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                associated_token_program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
  __remaining_accounts: Vec<(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)>,
}

