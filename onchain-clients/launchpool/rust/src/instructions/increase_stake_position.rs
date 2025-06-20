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
pub struct IncreaseStakePosition {
      
              
          pub signer: solana_program::pubkey::Pubkey,
          
              
          pub signer_stakable_account: solana_program::pubkey::Pubkey,
          
              
          pub launchpools_config: solana_program::pubkey::Pubkey,
          
              
          pub stakable_mint: solana_program::pubkey::Pubkey,
          
              
          pub launchpool: solana_program::pubkey::Pubkey,
          
              
          pub stake_position: solana_program::pubkey::Pubkey,
          
              
          pub stake_vault: solana_program::pubkey::Pubkey,
          
              
          pub stakable_token_program: solana_program::pubkey::Pubkey,
      }

impl IncreaseStakePosition {
  pub fn instruction(&self, args: IncreaseStakePositionInstructionArgs) -> solana_program::instruction::Instruction {
    self.instruction_with_remaining_accounts(args, &[])
  }
  #[allow(clippy::arithmetic_side_effects)]
  #[allow(clippy::vec_init_then_push)]
  pub fn instruction_with_remaining_accounts(&self, args: IncreaseStakePositionInstructionArgs, remaining_accounts: &[solana_program::instruction::AccountMeta]) -> solana_program::instruction::Instruction {
    let mut accounts = Vec::with_capacity(8+ remaining_accounts.len());
                            accounts.push(solana_program::instruction::AccountMeta::new(
            self.signer,
            true
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.signer_stakable_account,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.launchpools_config,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.stakable_mint,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.launchpool,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.stake_position,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            self.stake_vault,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            self.stakable_token_program,
            false
          ));
                      accounts.extend_from_slice(remaining_accounts);
    let mut data = borsh::to_vec(&IncreaseStakePositionInstructionData::new()).unwrap();
          let mut args = borsh::to_vec(&args).unwrap();
      data.append(&mut args);
    
    solana_program::instruction::Instruction {
      program_id: crate::LAUNCHPOOL_ID,
      accounts,
      data,
    }
  }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
 pub struct IncreaseStakePositionInstructionData {
            discriminator: [u8; 8],
            }

impl IncreaseStakePositionInstructionData {
  pub fn new() -> Self {
    Self {
                        discriminator: [180, 156, 141, 191, 172, 190, 10, 26],
                                }
  }
}

impl Default for IncreaseStakePositionInstructionData {
  fn default() -> Self {
    Self::new()
  }
}

#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Eq, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
 pub struct IncreaseStakePositionInstructionArgs {
                  pub stake_increase_amount: u64,
      }


/// Instruction builder for `IncreaseStakePosition`.
///
/// ### Accounts:
///
                      ///   0. `[writable, signer]` signer
                ///   1. `[writable]` signer_stakable_account
          ///   2. `[]` launchpools_config
          ///   3. `[]` stakable_mint
                ///   4. `[writable]` launchpool
                ///   5. `[writable]` stake_position
                ///   6. `[writable]` stake_vault
          ///   7. `[]` stakable_token_program
#[derive(Clone, Debug, Default)]
pub struct IncreaseStakePositionBuilder {
            signer: Option<solana_program::pubkey::Pubkey>,
                signer_stakable_account: Option<solana_program::pubkey::Pubkey>,
                launchpools_config: Option<solana_program::pubkey::Pubkey>,
                stakable_mint: Option<solana_program::pubkey::Pubkey>,
                launchpool: Option<solana_program::pubkey::Pubkey>,
                stake_position: Option<solana_program::pubkey::Pubkey>,
                stake_vault: Option<solana_program::pubkey::Pubkey>,
                stakable_token_program: Option<solana_program::pubkey::Pubkey>,
                        stake_increase_amount: Option<u64>,
        __remaining_accounts: Vec<solana_program::instruction::AccountMeta>,
}

impl IncreaseStakePositionBuilder {
  pub fn new() -> Self {
    Self::default()
  }
            #[inline(always)]
    pub fn signer(&mut self, signer: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.signer = Some(signer);
                    self
    }
            #[inline(always)]
    pub fn signer_stakable_account(&mut self, signer_stakable_account: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.signer_stakable_account = Some(signer_stakable_account);
                    self
    }
            #[inline(always)]
    pub fn launchpools_config(&mut self, launchpools_config: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.launchpools_config = Some(launchpools_config);
                    self
    }
            #[inline(always)]
    pub fn stakable_mint(&mut self, stakable_mint: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.stakable_mint = Some(stakable_mint);
                    self
    }
            #[inline(always)]
    pub fn launchpool(&mut self, launchpool: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.launchpool = Some(launchpool);
                    self
    }
            #[inline(always)]
    pub fn stake_position(&mut self, stake_position: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.stake_position = Some(stake_position);
                    self
    }
            #[inline(always)]
    pub fn stake_vault(&mut self, stake_vault: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.stake_vault = Some(stake_vault);
                    self
    }
            #[inline(always)]
    pub fn stakable_token_program(&mut self, stakable_token_program: solana_program::pubkey::Pubkey) -> &mut Self {
                        self.stakable_token_program = Some(stakable_token_program);
                    self
    }
                    #[inline(always)]
      pub fn stake_increase_amount(&mut self, stake_increase_amount: u64) -> &mut Self {
        self.stake_increase_amount = Some(stake_increase_amount);
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
    let accounts = IncreaseStakePosition {
                              signer: self.signer.expect("signer is not set"),
                                        signer_stakable_account: self.signer_stakable_account.expect("signer_stakable_account is not set"),
                                        launchpools_config: self.launchpools_config.expect("launchpools_config is not set"),
                                        stakable_mint: self.stakable_mint.expect("stakable_mint is not set"),
                                        launchpool: self.launchpool.expect("launchpool is not set"),
                                        stake_position: self.stake_position.expect("stake_position is not set"),
                                        stake_vault: self.stake_vault.expect("stake_vault is not set"),
                                        stakable_token_program: self.stakable_token_program.expect("stakable_token_program is not set"),
                      };
          let args = IncreaseStakePositionInstructionArgs {
                                                              stake_increase_amount: self.stake_increase_amount.clone().expect("stake_increase_amount is not set"),
                                    };
    
    accounts.instruction_with_remaining_accounts(args, &self.__remaining_accounts)
  }
}

  /// `increase_stake_position` CPI accounts.
  pub struct IncreaseStakePositionCpiAccounts<'a, 'b> {
          
                    
              pub signer: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub signer_stakable_account: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub launchpools_config: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub stakable_mint: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub launchpool: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub stake_position: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub stake_vault: &'b solana_program::account_info::AccountInfo<'a>,
                
                    
              pub stakable_token_program: &'b solana_program::account_info::AccountInfo<'a>,
            }

/// `increase_stake_position` CPI instruction.
pub struct IncreaseStakePositionCpi<'a, 'b> {
  /// The program to invoke.
  pub __program: &'b solana_program::account_info::AccountInfo<'a>,
      
              
          pub signer: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub signer_stakable_account: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub launchpools_config: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub stakable_mint: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub launchpool: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub stake_position: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub stake_vault: &'b solana_program::account_info::AccountInfo<'a>,
          
              
          pub stakable_token_program: &'b solana_program::account_info::AccountInfo<'a>,
            /// The arguments for the instruction.
    pub __args: IncreaseStakePositionInstructionArgs,
  }

impl<'a, 'b> IncreaseStakePositionCpi<'a, 'b> {
  pub fn new(
    program: &'b solana_program::account_info::AccountInfo<'a>,
          accounts: IncreaseStakePositionCpiAccounts<'a, 'b>,
              args: IncreaseStakePositionInstructionArgs,
      ) -> Self {
    Self {
      __program: program,
              signer: accounts.signer,
              signer_stakable_account: accounts.signer_stakable_account,
              launchpools_config: accounts.launchpools_config,
              stakable_mint: accounts.stakable_mint,
              launchpool: accounts.launchpool,
              stake_position: accounts.stake_position,
              stake_vault: accounts.stake_vault,
              stakable_token_program: accounts.stakable_token_program,
                    __args: args,
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
    let mut accounts = Vec::with_capacity(8+ remaining_accounts.len());
                            accounts.push(solana_program::instruction::AccountMeta::new(
            *self.signer.key,
            true
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.signer_stakable_account.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.launchpools_config.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.stakable_mint.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.launchpool.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.stake_position.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new(
            *self.stake_vault.key,
            false
          ));
                                          accounts.push(solana_program::instruction::AccountMeta::new_readonly(
            *self.stakable_token_program.key,
            false
          ));
                      remaining_accounts.iter().for_each(|remaining_account| {
      accounts.push(solana_program::instruction::AccountMeta {
          pubkey: *remaining_account.0.key,
          is_signer: remaining_account.1,
          is_writable: remaining_account.2,
      })
    });
    let mut data = borsh::to_vec(&IncreaseStakePositionInstructionData::new()).unwrap();
          let mut args = borsh::to_vec(&self.__args).unwrap();
      data.append(&mut args);
    
    let instruction = solana_program::instruction::Instruction {
      program_id: crate::LAUNCHPOOL_ID,
      accounts,
      data,
    };
    let mut account_infos = Vec::with_capacity(9 + remaining_accounts.len());
    account_infos.push(self.__program.clone());
                  account_infos.push(self.signer.clone());
                        account_infos.push(self.signer_stakable_account.clone());
                        account_infos.push(self.launchpools_config.clone());
                        account_infos.push(self.stakable_mint.clone());
                        account_infos.push(self.launchpool.clone());
                        account_infos.push(self.stake_position.clone());
                        account_infos.push(self.stake_vault.clone());
                        account_infos.push(self.stakable_token_program.clone());
              remaining_accounts.iter().for_each(|remaining_account| account_infos.push(remaining_account.0.clone()));

    if signers_seeds.is_empty() {
      solana_program::program::invoke(&instruction, &account_infos)
    } else {
      solana_program::program::invoke_signed(&instruction, &account_infos, signers_seeds)
    }
  }
}

/// Instruction builder for `IncreaseStakePosition` via CPI.
///
/// ### Accounts:
///
                      ///   0. `[writable, signer]` signer
                ///   1. `[writable]` signer_stakable_account
          ///   2. `[]` launchpools_config
          ///   3. `[]` stakable_mint
                ///   4. `[writable]` launchpool
                ///   5. `[writable]` stake_position
                ///   6. `[writable]` stake_vault
          ///   7. `[]` stakable_token_program
#[derive(Clone, Debug)]
pub struct IncreaseStakePositionCpiBuilder<'a, 'b> {
  instruction: Box<IncreaseStakePositionCpiBuilderInstruction<'a, 'b>>,
}

impl<'a, 'b> IncreaseStakePositionCpiBuilder<'a, 'b> {
  pub fn new(program: &'b solana_program::account_info::AccountInfo<'a>) -> Self {
    let instruction = Box::new(IncreaseStakePositionCpiBuilderInstruction {
      __program: program,
              signer: None,
              signer_stakable_account: None,
              launchpools_config: None,
              stakable_mint: None,
              launchpool: None,
              stake_position: None,
              stake_vault: None,
              stakable_token_program: None,
                                            stake_increase_amount: None,
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
    pub fn signer_stakable_account(&mut self, signer_stakable_account: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.signer_stakable_account = Some(signer_stakable_account);
                    self
    }
      #[inline(always)]
    pub fn launchpools_config(&mut self, launchpools_config: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.launchpools_config = Some(launchpools_config);
                    self
    }
      #[inline(always)]
    pub fn stakable_mint(&mut self, stakable_mint: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.stakable_mint = Some(stakable_mint);
                    self
    }
      #[inline(always)]
    pub fn launchpool(&mut self, launchpool: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.launchpool = Some(launchpool);
                    self
    }
      #[inline(always)]
    pub fn stake_position(&mut self, stake_position: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.stake_position = Some(stake_position);
                    self
    }
      #[inline(always)]
    pub fn stake_vault(&mut self, stake_vault: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.stake_vault = Some(stake_vault);
                    self
    }
      #[inline(always)]
    pub fn stakable_token_program(&mut self, stakable_token_program: &'b solana_program::account_info::AccountInfo<'a>) -> &mut Self {
                        self.instruction.stakable_token_program = Some(stakable_token_program);
                    self
    }
                    #[inline(always)]
      pub fn stake_increase_amount(&mut self, stake_increase_amount: u64) -> &mut Self {
        self.instruction.stake_increase_amount = Some(stake_increase_amount);
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
          let args = IncreaseStakePositionInstructionArgs {
                                                              stake_increase_amount: self.instruction.stake_increase_amount.clone().expect("stake_increase_amount is not set"),
                                    };
        let instruction = IncreaseStakePositionCpi {
        __program: self.instruction.__program,
                  
          signer: self.instruction.signer.expect("signer is not set"),
                  
          signer_stakable_account: self.instruction.signer_stakable_account.expect("signer_stakable_account is not set"),
                  
          launchpools_config: self.instruction.launchpools_config.expect("launchpools_config is not set"),
                  
          stakable_mint: self.instruction.stakable_mint.expect("stakable_mint is not set"),
                  
          launchpool: self.instruction.launchpool.expect("launchpool is not set"),
                  
          stake_position: self.instruction.stake_position.expect("stake_position is not set"),
                  
          stake_vault: self.instruction.stake_vault.expect("stake_vault is not set"),
                  
          stakable_token_program: self.instruction.stakable_token_program.expect("stakable_token_program is not set"),
                          __args: args,
            };
    instruction.invoke_signed_with_remaining_accounts(signers_seeds, &self.instruction.__remaining_accounts)
  }
}

#[derive(Clone, Debug)]
struct IncreaseStakePositionCpiBuilderInstruction<'a, 'b> {
  __program: &'b solana_program::account_info::AccountInfo<'a>,
            signer: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                signer_stakable_account: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                launchpools_config: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                stakable_mint: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                launchpool: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                stake_position: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                stake_vault: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                stakable_token_program: Option<&'b solana_program::account_info::AccountInfo<'a>>,
                        stake_increase_amount: Option<u64>,
        /// Additional instruction accounts `(AccountInfo, is_writable, is_signer)`.
  __remaining_accounts: Vec<(&'b solana_program::account_info::AccountInfo<'a>, bool, bool)>,
}

